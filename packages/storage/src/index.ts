import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const STORAGE_BUCKETS = {
  sourcePrivate: "media-source-private",
  stagingPrivate: "media-staging-private",
  packagedPrivate: "media-packaged-private",
  artworkPublic: "media-artwork-public",
  backupVault: "media-backup-vault",
} as const;

export type StorageBucketRole = keyof typeof STORAGE_BUCKETS;

const OPAQUE_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{3,63}$/i;

function assertOpaqueId(label: string, value: string): void {
  if (
    !OPAQUE_ID_PATTERN.test(value) ||
    value.includes("..") ||
    value.includes("/") ||
    value.includes("\\") ||
    value.includes("@")
  ) {
    throw new Error(
      `Invalid ${label}: object key segments must be opaque identifiers without paths, filenames, or PII`,
    );
  }
}

export type ObjectKeySpec =
  | {
      kind: "source";
      assetId: string;
      uploadSessionId: string;
    }
  | {
      kind: "derivative-manifest";
      assetId: string;
      profileId: string;
      packageVersion: number;
    }
  | {
      kind: "derivative-segment";
      assetId: string;
      profileId: string;
      packageVersion: number;
      segmentIndex: number;
    }
  | {
      kind: "subtitle";
      assetId: string;
      trackId: string;
      version: number;
    }
  | {
      kind: "artwork";
      titleId: string;
      artworkId: string;
      format: "webp" | "avif" | "jpg";
    }
  | {
      kind: "rights-evidence";
      rightsGrantId: string;
      evidenceId: string;
    };

/**
 * Generates immutable, opaque object keys (Blueprint §31.2, §40.1, §85.3).
 * Never embeds user filenames, emails, or contract titles in storage paths.
 */
export function buildOpaqueObjectKey(spec: ObjectKeySpec): {
  bucketRole: StorageBucketRole;
  objectKey: string;
} {
  switch (spec.kind) {
    case "source": {
      assertOpaqueId("assetId", spec.assetId);
      assertOpaqueId("uploadSessionId", spec.uploadSessionId);
      return {
        bucketRole: "stagingPrivate",
        objectKey: `quarantine/${spec.assetId}/${spec.uploadSessionId}/source.bin`,
      };
    }
    case "derivative-manifest": {
      assertOpaqueId("assetId", spec.assetId);
      assertOpaqueId("profileId", spec.profileId);
      if (!Number.isInteger(spec.packageVersion) || spec.packageVersion < 1) {
        throw new Error("packageVersion must be a positive integer");
      }
      return {
        bucketRole: "packagedPrivate",
        objectKey: `assets/${spec.assetId}/v${spec.packageVersion}/${spec.profileId}/master.m3u8`,
      };
    }
    case "derivative-segment": {
      assertOpaqueId("assetId", spec.assetId);
      assertOpaqueId("profileId", spec.profileId);
      if (!Number.isInteger(spec.packageVersion) || spec.packageVersion < 1) {
        throw new Error("packageVersion must be a positive integer");
      }
      if (!Number.isInteger(spec.segmentIndex) || spec.segmentIndex < 0) {
        throw new Error("segmentIndex must be a non-negative integer");
      }
      const padded = String(spec.segmentIndex).padStart(6, "0");
      return {
        bucketRole: "packagedPrivate",
        objectKey: `assets/${spec.assetId}/v${spec.packageVersion}/${spec.profileId}/seg-${padded}.m4s`,
      };
    }
    case "subtitle": {
      assertOpaqueId("assetId", spec.assetId);
      assertOpaqueId("trackId", spec.trackId);
      if (!Number.isInteger(spec.version) || spec.version < 1) {
        throw new Error("version must be a positive integer");
      }
      return {
        bucketRole: "packagedPrivate",
        objectKey: `assets/${spec.assetId}/subtitles/${spec.trackId}/v${spec.version}.vtt`,
      };
    }
    case "artwork": {
      assertOpaqueId("titleId", spec.titleId);
      assertOpaqueId("artworkId", spec.artworkId);
      return {
        bucketRole: "artworkPublic",
        objectKey: `titles/${spec.titleId}/artwork/${spec.artworkId}.${spec.format}`,
      };
    }
    case "rights-evidence": {
      assertOpaqueId("rightsGrantId", spec.rightsGrantId);
      assertOpaqueId("evidenceId", spec.evidenceId);
      return {
        bucketRole: "sourcePrivate",
        objectKey: `rights-evidence/${spec.rightsGrantId}/${spec.evidenceId}/document.bin`,
      };
    }
  }
}

export async function computeSha256Hex(
  chunks: Iterable<Uint8Array> | AsyncIterable<Uint8Array>,
): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of chunks) {
    hash.update(chunk);
  }
  return hash.digest("hex");
}

export interface CreateMultipartUploadInput {
  bucket: string;
  objectKey: string;
  contentType: string;
  expectedSizeBytes: number;
  expectedSha256: string;
  maxSizeBytes: number;
  ttlSeconds?: number;
  now?: Date;
}

export interface UploadSession {
  uploadId: string;
  bucket: string;
  objectKey: string;
  expiresAt: Date;
}

export interface CreatePartUploadUrlsInput {
  uploadId: string;
  partNumbers: readonly number[];
  ttlSeconds?: number;
  now?: Date;
}

export interface SignedPartUrl {
  partNumber: number;
  url: string;
  expiresAt: Date;
}

export interface CompletedPartInput {
  partNumber: number;
  etag: string;
}

export interface CompleteMultipartUploadInput {
  uploadId: string;
  parts: readonly CompletedPartInput[];
  now?: Date;
}

export interface StoredObjectMetadata {
  bucket: string;
  objectKey: string;
  sizeBytes: number;
  sha256: string;
  contentType: string;
  etag: string;
  visibility: "private";
  quarantineState: "QUARANTINED" | "VERIFIED";
  createdAt: Date;
}

export interface SignedReadUrlInput {
  bucket: string;
  objectKey: string;
  ttlSeconds: number;
  responseContentDisposition?: string;
  now?: Date;
}

export interface SignedReadCapability {
  url: string;
  expiresAt: Date;
}

export interface StorageAdapter {
  createMultipartUpload(input: CreateMultipartUploadInput): Promise<UploadSession>;
  createPartUploadUrls(input: CreatePartUploadUrlsInput): Promise<SignedPartUrl[]>;
  putPart(
    uploadId: string,
    partNumber: number,
    bytes: Uint8Array,
    now?: Date,
  ): Promise<{ etag: string }>;
  completeMultipartUpload(input: CompleteMultipartUploadInput): Promise<StoredObjectMetadata>;
  abortMultipartUpload(uploadId: string): Promise<void>;
  headObject(bucket: string, objectKey: string): Promise<StoredObjectMetadata | null>;
  createSignedReadUrl(input: SignedReadUrlInput): Promise<SignedReadCapability>;
  verifySignedReadUrl(
    url: string,
    expectedBucket: string,
    expectedObjectKey: string,
    now?: Date,
  ): boolean;
  deleteObject(bucket: string, objectKey: string): Promise<void>;
  cleanupExpiredUploads(now?: Date): Promise<number>;
}

interface InMemoryUploadRecord {
  uploadId: string;
  bucket: string;
  objectKey: string;
  contentType: string;
  expectedSizeBytes: number;
  expectedSha256: string;
  expiresAt: Date;
  parts: Map<number, { bytes: Uint8Array; etag: string }>;
  completedResult?: StoredObjectMetadata;
}

export class StorageIntegrityError extends Error {
  readonly code:
    | "SIZE_LIMIT_EXCEEDED"
    | "UPLOAD_NOT_FOUND"
    | "UPLOAD_EXPIRED"
    | "PART_MISMATCH"
    | "SIZE_MISMATCH"
    | "CHECKSUM_MISMATCH"
    | "OBJECT_NOT_FOUND"
    | "INVALID_TTL";

  constructor(code: StorageIntegrityError["code"], message: string) {
    super(message);
    this.name = "StorageIntegrityError";
    this.code = code;
  }
}

/**
 * Deterministic private mock storage adapter for local development & contract testing (Blueprint §48 M1).
 * Models multipart upload sessions, part ETags, size & SHA-256 verification, quarantine on mismatch,
 * abandoned-session cleanup, and HMAC-signed short-lived single-object GET URLs.
 */
export class InMemoryStorageAdapter implements StorageAdapter {
  private readonly uploads = new Map<string, InMemoryUploadRecord>();
  private readonly objects = new Map<string, StoredObjectMetadata>();
  private readonly signingSecret: string;

  constructor(options?: { signingSecret?: string }) {
    this.signingSecret = options?.signingSecret ?? "dev-only-in-memory-storage-signing-secret-32b";
  }

  private key(bucket: string, objectKey: string): string {
    return `${bucket}::${objectKey}`;
  }

  private signPayload(payload: string): string {
    return createHmac("sha256", this.signingSecret).update(payload).digest("hex");
  }

  async createMultipartUpload(input: CreateMultipartUploadInput): Promise<UploadSession> {
    if (input.expectedSizeBytes <= 0 || input.expectedSizeBytes > input.maxSizeBytes) {
      throw new StorageIntegrityError(
        "SIZE_LIMIT_EXCEEDED",
        `Upload size ${input.expectedSizeBytes} is outside allowed bounds (1..${input.maxSizeBytes})`,
      );
    }
    if (!/^[a-f0-9]{64}$/i.test(input.expectedSha256)) {
      throw new StorageIntegrityError(
        "CHECKSUM_MISMATCH",
        "expectedSha256 must be a 64-char hex digest",
      );
    }

    const ttlSeconds = input.ttlSeconds ?? 900;
    if (ttlSeconds < 30 || ttlSeconds > 3600) {
      throw new StorageIntegrityError(
        "INVALID_TTL",
        "Upload session TTL must be between 30s and 3600s",
      );
    }

    const now = input.now ?? new Date();
    const uploadId = `upl_${crypto.randomUUID().replace(/-/g, "")}`;
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    this.uploads.set(uploadId, {
      uploadId,
      bucket: input.bucket,
      objectKey: input.objectKey,
      contentType: input.contentType,
      expectedSizeBytes: input.expectedSizeBytes,
      expectedSha256: input.expectedSha256.toLowerCase(),
      expiresAt,
      parts: new Map(),
    });

    return {
      uploadId,
      bucket: input.bucket,
      objectKey: input.objectKey,
      expiresAt,
    };
  }

  async createPartUploadUrls(input: CreatePartUploadUrlsInput): Promise<SignedPartUrl[]> {
    const record = this.uploads.get(input.uploadId);
    if (!record) {
      throw new StorageIntegrityError(
        "UPLOAD_NOT_FOUND",
        "Multipart upload session does not exist",
      );
    }
    const now = input.now ?? new Date();
    if (now.getTime() >= record.expiresAt.getTime()) {
      throw new StorageIntegrityError("UPLOAD_EXPIRED", "Multipart upload session has expired");
    }

    const ttlSeconds = Math.min(input.ttlSeconds ?? 300, 900);
    const expiresAt = new Date(
      Math.min(record.expiresAt.getTime(), now.getTime() + ttlSeconds * 1000),
    );

    return input.partNumbers.map((partNumber) => {
      if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10_000) {
        throw new StorageIntegrityError("PART_MISMATCH", `Invalid partNumber: ${partNumber}`);
      }
      const sig = this.signPayload(
        `PUT|${record.bucket}|${record.objectKey}|${record.uploadId}|${partNumber}|${expiresAt.getTime()}`,
      );
      return {
        partNumber,
        url: `https://storage.local/${encodeURIComponent(record.bucket)}/${record.objectKey}?uploadId=${record.uploadId}&partNumber=${partNumber}&exp=${expiresAt.getTime()}&signature=${sig}`,
        expiresAt,
      };
    });
  }

  async putPart(
    uploadId: string,
    partNumber: number,
    bytes: Uint8Array,
    now = new Date(),
  ): Promise<{ etag: string }> {
    const record = this.uploads.get(uploadId);
    if (!record) {
      throw new StorageIntegrityError(
        "UPLOAD_NOT_FOUND",
        "Multipart upload session does not exist",
      );
    }
    if (now.getTime() >= record.expiresAt.getTime()) {
      throw new StorageIntegrityError("UPLOAD_EXPIRED", "Multipart upload session has expired");
    }
    const etag = createHash("sha256").update(bytes).digest("hex").slice(0, 32);
    record.parts.set(partNumber, { bytes: new Uint8Array(bytes), etag });
    return { etag };
  }

  async completeMultipartUpload(
    input: CompleteMultipartUploadInput,
  ): Promise<StoredObjectMetadata> {
    const record = this.uploads.get(input.uploadId);
    if (!record) {
      throw new StorageIntegrityError(
        "UPLOAD_NOT_FOUND",
        "Multipart upload session does not exist",
      );
    }
    // Idempotent duplicate completion returns identical stored metadata.
    if (record.completedResult) {
      return record.completedResult;
    }

    const now = input.now ?? new Date();
    if (now.getTime() >= record.expiresAt.getTime()) {
      throw new StorageIntegrityError("UPLOAD_EXPIRED", "Multipart upload session has expired");
    }

    const sortedParts = [...input.parts].sort((a, b) => a.partNumber - b.partNumber);
    if (sortedParts.length === 0) {
      throw new StorageIntegrityError(
        "PART_MISMATCH",
        "At least one part is required to complete upload",
      );
    }

    const orderedChunks: Uint8Array[] = [];
    let totalSize = 0;

    for (const part of sortedParts) {
      const uploaded = record.parts.get(part.partNumber);
      if (!uploaded || uploaded.etag !== part.etag) {
        throw new StorageIntegrityError(
          "PART_MISMATCH",
          `Missing or mismatched ETag for part ${part.partNumber}`,
        );
      }
      orderedChunks.push(uploaded.bytes);
      totalSize += uploaded.bytes.byteLength;
    }

    const observedSha256 = await computeSha256Hex(orderedChunks);
    const combinedEtag = `${createHash("sha256")
      .update(sortedParts.map((p) => p.etag).join(":"))
      .digest("hex")
      .slice(0, 32)}-${sortedParts.length}`;

    if (totalSize !== record.expectedSizeBytes) {
      const quarantined: StoredObjectMetadata = {
        bucket: record.bucket,
        objectKey: record.objectKey,
        sizeBytes: totalSize,
        sha256: observedSha256,
        contentType: record.contentType,
        etag: combinedEtag,
        visibility: "private",
        quarantineState: "QUARANTINED",
        createdAt: now,
      };
      this.objects.set(this.key(record.bucket, record.objectKey), quarantined);
      throw new StorageIntegrityError(
        "SIZE_MISMATCH",
        `Expected ${record.expectedSizeBytes} bytes, observed ${totalSize} bytes; object left in quarantine`,
      );
    }

    if (observedSha256 !== record.expectedSha256) {
      const quarantined: StoredObjectMetadata = {
        bucket: record.bucket,
        objectKey: record.objectKey,
        sizeBytes: totalSize,
        sha256: observedSha256,
        contentType: record.contentType,
        etag: combinedEtag,
        visibility: "private",
        quarantineState: "QUARANTINED",
        createdAt: now,
      };
      this.objects.set(this.key(record.bucket, record.objectKey), quarantined);
      throw new StorageIntegrityError(
        "CHECKSUM_MISMATCH",
        "Observed SHA-256 did not match expected digest; object isolated in quarantine",
      );
    }

    const verified: StoredObjectMetadata = {
      bucket: record.bucket,
      objectKey: record.objectKey,
      sizeBytes: totalSize,
      sha256: observedSha256,
      contentType: record.contentType,
      etag: combinedEtag,
      visibility: "private",
      quarantineState: "VERIFIED",
      createdAt: now,
    };

    this.objects.set(this.key(record.bucket, record.objectKey), verified);
    record.completedResult = verified;
    record.parts.clear();
    return verified;
  }

  async abortMultipartUpload(uploadId: string): Promise<void> {
    this.uploads.delete(uploadId);
  }

  async headObject(bucket: string, objectKey: string): Promise<StoredObjectMetadata | null> {
    return this.objects.get(this.key(bucket, objectKey)) ?? null;
  }

  async createSignedReadUrl(input: SignedReadUrlInput): Promise<SignedReadCapability> {
    if (input.ttlSeconds < 10 || input.ttlSeconds > 900) {
      throw new StorageIntegrityError(
        "INVALID_TTL",
        "Signed read URL TTL must be short-lived (between 10s and 900s)",
      );
    }

    const stored = this.objects.get(this.key(input.bucket, input.objectKey));
    if (!stored || stored.quarantineState !== "VERIFIED") {
      throw new StorageIntegrityError(
        "OBJECT_NOT_FOUND",
        "Cannot issue signed read URL for missing or unverified quarantined object",
      );
    }

    const now = input.now ?? new Date();
    const expiresAt = new Date(now.getTime() + input.ttlSeconds * 1000);
    const sig = this.signPayload(`GET|${input.bucket}|${input.objectKey}|${expiresAt.getTime()}`);
    const dispositionQuery = input.responseContentDisposition
      ? `&disposition=${encodeURIComponent(input.responseContentDisposition)}`
      : "";

    return {
      url: `https://storage.local/${encodeURIComponent(input.bucket)}/${input.objectKey}?method=GET&exp=${expiresAt.getTime()}${dispositionQuery}&signature=${sig}`,
      expiresAt,
    };
  }

  verifySignedReadUrl(
    url: string,
    expectedBucket: string,
    expectedObjectKey: string,
    now = new Date(),
  ): boolean {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return false;
    }

    const expectedPath = `/${encodeURIComponent(expectedBucket)}/${expectedObjectKey}`;
    if (parsed.pathname !== expectedPath) {
      return false;
    }
    if (parsed.searchParams.get("method") !== "GET") {
      return false;
    }

    const expRaw = parsed.searchParams.get("exp");
    const sig = parsed.searchParams.get("signature");
    if (!expRaw || !sig) {
      return false;
    }

    const expMs = Number(expRaw);
    if (!Number.isFinite(expMs) || now.getTime() >= expMs) {
      return false;
    }

    const expectedSig = this.signPayload(`GET|${expectedBucket}|${expectedObjectKey}|${expMs}`);
    const sigBuf = Buffer.from(sig, "utf8");
    const expBuf = Buffer.from(expectedSig, "utf8");
    if (sigBuf.length !== expBuf.length) {
      return false;
    }
    return timingSafeEqual(sigBuf, expBuf);
  }

  async deleteObject(bucket: string, objectKey: string): Promise<void> {
    this.objects.delete(this.key(bucket, objectKey));
  }

  async cleanupExpiredUploads(now = new Date()): Promise<number> {
    let cleaned = 0;
    for (const [id, record] of this.uploads.entries()) {
      if (!record.completedResult && now.getTime() >= record.expiresAt.getTime()) {
        this.uploads.delete(id);
        cleaned += 1;
      }
    }
    return cleaned;
  }
}
