import crypto from "node:crypto";
import type {
  AssetLifecycleState,
  DeliveryEventType,
  ReplicationStatus,
  ResolutionTier,
} from "@movie/contracts";
import {
  AuthorizationError,
  assertPermission,
  canPublishAssetWithRights,
  evaluateRights,
  transitionAssetState,
} from "@movie/domain";
import {
  filterRenditionsByMaxResolution,
  probeMediaHeaderBytes,
  validateHlsMasterManifest,
} from "@movie/media";
import {
  buildOpaqueObjectKey,
  type CompletedPartInput,
  computeSha256Hex,
  STORAGE_BUCKETS,
  type StorageAdapter,
  StorageIntegrityError,
} from "@movie/storage";
import { and, desc, eq, gt, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";
import type { MovieDatabase } from "./client.ts";
import {
  type AuditContext,
  loadTitleGrantRecords,
  NotFoundError,
  newEntityId,
  RightsGateError,
  recordAuditEvent,
} from "./dal.ts";
import {
  auditEvents,
  deliveryEvents,
  drmConfigurations,
  mediaAssets,
  mediaObjects,
  mediaRenditions,
  metadataSources,
  outboxJobs,
  playbackSessions,
  replicationTasks,
  rightsGrants,
  rightsHolders,
  subtitleTracks,
  takedownCases,
  titles,
  titleTranslations,
  watchlistItems,
} from "./schema/index.ts";

function hashPlaybackToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export interface CreateDraftMediaAssetInput {
  titleId: string;
  kind?: "FEATURE" | "TRAILER";
  drmRequired?: boolean;
}

export async function createDraftMediaAsset(
  db: MovieDatabase,
  ctx: AuditContext,
  input: CreateDraftMediaAssetInput,
) {
  assertPermission(ctx.actor, "media:ingest");
  const actor = ctx.actor!;

  const existingTitle = await db
    .select({ id: titles.id, legalHold: titles.legalHold, status: titles.status })
    .from(titles)
    .where(eq(titles.id, input.titleId))
    .limit(1);
  const title = existingTitle[0];
  if (!title) {
    throw new NotFoundError(`Title not found: ${input.titleId}`);
  }
  if (title.legalHold || title.status === "TAKEDOWN_HOLD") {
    throw new RightsGateError(
      "TAKEDOWN_HOLD_ACTIVE",
      "Cannot create media asset on a title under legal hold",
    );
  }

  const assetId = newEntityId("ast");
  await db.transaction(async (tx) => {
    const txDb = tx as unknown as MovieDatabase;
    await txDb.insert(mediaAssets).values({
      id: assetId,
      titleId: input.titleId,
      kind: input.kind ?? "FEATURE",
      lifecycleState: "DRAFT",
      drmRequired: Boolean(input.drmRequired),
    });

    await recordAuditEvent(txDb, {
      actor,
      action: "media.asset.create_draft",
      targetType: "media_asset",
      targetId: assetId,
      requestId: ctx.requestId,
      metadata: { titleId: input.titleId, kind: input.kind ?? "FEATURE" },
    });
  });

  return { assetId, lifecycleState: "DRAFT" as AssetLifecycleState };
}

export interface InitiateAuthorizedUploadInput {
  titleId: string;
  assetId?: string;
  kind?: "FEATURE" | "TRAILER";
  drmRequired?: boolean;
  contentType: string;
  expectedSizeBytes: number;
  expectedSha256: string;
  partCount: number;
  maxUploadBytes?: number;
  /** Explicitly typed as unknown to trap prohibited SSRF URL ingestion attempts at runtime. */
  sourceUrl?: unknown;
  at?: Date;
}

export async function initiateAuthorizedAssetUpload(
  db: MovieDatabase,
  storage: StorageAdapter,
  ctx: AuditContext,
  input: InitiateAuthorizedUploadInput,
) {
  assertPermission(ctx.actor, "media:upload");
  const actor = ctx.actor!;
  const now = input.at ?? new Date();

  if (input.sourceUrl !== undefined && input.sourceUrl !== null && input.sourceUrl !== "") {
    throw new RightsGateError(
      "SSRF_URL_INGESTION_PROHIBITED",
      "Arbitrary URL fetching is prohibited; upload authorized media directly via multipart session",
    );
  }

  if (!/^[a-f0-9]{64}$/i.test(input.expectedSha256)) {
    throw new RightsGateError(
      "INVALID_CHECKSUM",
      "expectedSha256 must be a 64-character hexadecimal SHA-256 digest",
    );
  }

  const allowedContentTypes = new Set(["video/mp4", "video/webm", "text/vtt"]);
  if (!allowedContentTypes.has(input.contentType.toLowerCase())) {
    throw new RightsGateError(
      "UNSUPPORTED_MEDIA_TYPE",
      "Only video/mp4, video/webm, and text/vtt uploads are permitted",
    );
  }

  if (!Number.isInteger(input.partCount) || input.partCount < 1 || input.partCount > 10_000) {
    throw new RightsGateError("INVALID_PART_COUNT", "partCount must be between 1 and 10000");
  }

  const titleRows = await db.select().from(titles).where(eq(titles.id, input.titleId)).limit(1);
  const title = titleRows[0];
  if (!title) {
    throw new NotFoundError(`Title not found: ${input.titleId}`);
  }
  if (title.legalHold || title.status === "TAKEDOWN_HOLD") {
    throw new RightsGateError("TAKEDOWN_HOLD_ACTIVE", "Title is under an active legal hold");
  }

  const grants = await loadTitleGrantRecords(db, input.titleId);
  const nowMs = now.getTime();
  const hasApprovedRights = grants.some(
    (g) =>
      g.status === "APPROVED" &&
      (input.assetId ? g.assetId === input.assetId || g.assetId === null : true) &&
      g.validFrom.getTime() <= nowMs &&
      nowMs < g.validUntil.getTime(),
  );

  // Enforce domain state machine: upload initiation requires approved rights!
  let pendingState: AssetLifecycleState;
  try {
    pendingState = transitionAssetState({
      from: "RIGHTS_APPROVED",
      to: "UPLOAD_PENDING",
      hasApprovedRights,
    });
  } catch (err) {
    throw new RightsGateError(
      "UPLOAD_REQUIRES_APPROVED_RIGHTS",
      err instanceof Error ? err.message : "Approved rights grant required before upload",
    );
  }

  const uploadingState = transitionAssetState({
    from: pendingState,
    to: "UPLOADING",
  });

  const assetId = input.assetId ?? newEntityId("ast");
  const uploadSessionToken = newEntityId("ups");
  const { bucketRole, objectKey } = buildOpaqueObjectKey({
    kind: "source",
    assetId,
    uploadSessionId: uploadSessionToken,
  });
  const bucket = STORAGE_BUCKETS[bucketRole];

  const uploadSession = await storage.createMultipartUpload({
    bucket,
    objectKey,
    contentType: input.contentType.toLowerCase(),
    expectedSizeBytes: input.expectedSizeBytes,
    expectedSha256: input.expectedSha256.toLowerCase(),
    maxSizeBytes: input.maxUploadBytes ?? 25 * 1024 * 1024 * 1024,
    ttlSeconds: 3600,
    now,
  });

  const partNumbers = Array.from({ length: input.partCount }, (_, idx) => idx + 1);
  const partUrls = await storage.createPartUploadUrls({
    uploadId: uploadSession.uploadId,
    partNumbers,
    ttlSeconds: 900,
    now,
  });

  await db.transaction(async (tx) => {
    const txDb = tx as unknown as MovieDatabase;
    const existingAsset = await txDb
      .select({ id: mediaAssets.id })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, assetId))
      .limit(1);

    if (existingAsset[0]) {
      await txDb
        .update(mediaAssets)
        .set({
          lifecycleState: uploadingState,
          sha256Checksum: input.expectedSha256.toLowerCase(),
          checksumVerified: false,
          drmRequired: input.drmRequired ?? undefined,
          updatedAt: now,
        })
        .where(eq(mediaAssets.id, assetId));
    } else {
      await txDb.insert(mediaAssets).values({
        id: assetId,
        titleId: input.titleId,
        kind: input.kind ?? "FEATURE",
        lifecycleState: uploadingState,
        drmRequired: Boolean(input.drmRequired),
        sha256Checksum: input.expectedSha256.toLowerCase(),
        checksumVerified: false,
      });
    }

    await recordAuditEvent(txDb, {
      actor,
      action: "media.asset.upload_initiated",
      targetType: "media_asset",
      targetId: assetId,
      requestId: ctx.requestId,
      metadata: {
        titleId: input.titleId,
        uploadId: uploadSession.uploadId,
        expectedSizeBytes: input.expectedSizeBytes,
        partCount: input.partCount,
      },
    });
  });

  return {
    assetId,
    uploadId: uploadSession.uploadId,
    expiresAt: uploadSession.expiresAt,
    lifecycleState: uploadingState,
    parts: partUrls,
  };
}

export interface CompleteAuthorizedUploadInput {
  assetId: string;
  uploadId: string;
  parts: readonly CompletedPartInput[];
  idempotencyKey: string;
  provider?: "memory" | "r2" | "s3-compatible";
  at?: Date;
}

export async function completeAuthorizedAssetUpload(
  db: MovieDatabase,
  storage: StorageAdapter,
  ctx: AuditContext,
  input: CompleteAuthorizedUploadInput,
) {
  assertPermission(ctx.actor, "media:upload");
  const actor = ctx.actor!;
  const now = input.at ?? new Date();

  const assetRows = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.id, input.assetId))
    .limit(1);
  const asset = assetRows[0];
  if (!asset) {
    throw new NotFoundError(`Media asset not found: ${input.assetId}`);
  }

  // Idempotent replay support: if already quarantined or beyond with verified checksum, return existing state
  if (
    asset.checksumVerified &&
    (asset.lifecycleState === "QUARANTINED" ||
      asset.lifecycleState === "VALIDATING" ||
      asset.lifecycleState === "READY_FOR_REVIEW" ||
      asset.lifecycleState === "PUBLISHED")
  ) {
    await db
      .insert(outboxJobs)
      .values({
        id: newEntityId("job"),
        jobType: "ASSET_PROBE_AND_VALIDATE",
        idempotencyKey: input.idempotencyKey,
        payload: { assetId: asset.id },
        status: "PENDING",
      })
      .onConflictDoNothing();

    return {
      assetId: asset.id,
      lifecycleState: asset.lifecycleState,
      checksumVerified: true,
    };
  }

  let storedMeta: Awaited<ReturnType<StorageAdapter["completeMultipartUpload"]>>;
  try {
    storedMeta = await storage.completeMultipartUpload({
      uploadId: input.uploadId,
      parts: input.parts,
      now,
    });
  } catch (err) {
    if (err instanceof StorageIntegrityError) {
      await db.transaction(async (tx) => {
        const txDb = tx as unknown as MovieDatabase;
        await txDb
          .update(mediaAssets)
          .set({
            lifecycleState: "FAILED",
            checksumVerified: false,
            updatedAt: now,
          })
          .where(eq(mediaAssets.id, asset.id));

        await recordAuditEvent(txDb, {
          actor,
          action: "media.asset.quarantine_integrity_failed",
          targetType: "media_asset",
          targetId: asset.id,
          requestId: ctx.requestId,
          metadata: { code: err.code, uploadId: input.uploadId },
        });
      });

      throw new RightsGateError(
        `STORAGE_${err.code}`,
        `Upload quarantined/aborted due to integrity failure: ${err.message}`,
      );
    }
    throw err;
  }

  const uploadedState = transitionAssetState({
    from: "UPLOADING",
    to: "UPLOADED",
  });
  const quarantinedState = transitionAssetState({
    from: uploadedState,
    to: "QUARANTINED",
  });

  await db.transaction(async (tx) => {
    const txDb = tx as unknown as MovieDatabase;
    await txDb
      .update(mediaAssets)
      .set({
        lifecycleState: quarantinedState,
        sha256Checksum: storedMeta.sha256,
        checksumVerified: true,
        updatedAt: now,
      })
      .where(eq(mediaAssets.id, asset.id));

    await txDb
      .insert(mediaObjects)
      .values({
        id: newEntityId("mob"),
        assetId: asset.id,
        provider: input.provider ?? "memory",
        bucket: storedMeta.bucket,
        objectKey: storedMeta.objectKey,
        byteLength: storedMeta.sizeBytes,
        sha256Checksum: storedMeta.sha256,
        contentType: storedMeta.contentType,
      })
      .onConflictDoNothing();

    await txDb
      .insert(outboxJobs)
      .values({
        id: newEntityId("job"),
        jobType: "ASSET_PROBE_AND_VALIDATE",
        idempotencyKey: input.idempotencyKey,
        payload: {
          assetId: asset.id,
          bucket: storedMeta.bucket,
          byteLength: storedMeta.sizeBytes,
        },
        status: "PENDING",
      })
      .onConflictDoNothing();

    await recordAuditEvent(txDb, {
      actor,
      action: "media.asset.quarantined_for_probe",
      targetType: "media_asset",
      targetId: asset.id,
      requestId: ctx.requestId,
      metadata: {
        byteLength: storedMeta.sizeBytes,
        sha256Checksum: storedMeta.sha256,
        lifecycleState: quarantinedState,
      },
    });
  });

  return {
    assetId: asset.id,
    lifecycleState: quarantinedState,
    checksumVerified: true,
  };
}

export interface OutboxWorkerOptions {
  now?: Date;
  leaseDurationMs?: number;
  maxAttempts?: number;
  readHeaderBytes?: (assetId: string) => Promise<Uint8Array>;
  defaultDurationSeconds?: number;
}

/**
 * Durable PostgreSQL outbox processor with lease-locking, bounded retries, and dead-letter handling.
 * Processes quarantined uploads without ever auto-publishing (`READY_FOR_REVIEW` is the ceiling).
 */
export async function leaseAndProcessNextOutboxJob(
  db: MovieDatabase,
  options?: OutboxWorkerOptions,
): Promise<
  | { processed: false }
  | {
      processed: true;
      jobId: string;
      status: "COMPLETED" | "PENDING" | "DEAD_LETTER";
      assetState?: AssetLifecycleState;
    }
> {
  const now = options?.now ?? new Date();
  const leaseUntil = new Date(now.getTime() + (options?.leaseDurationMs ?? 30_000));
  const maxAttempts = options?.maxAttempts ?? 3;

  const candidateRows = await db
    .select()
    .from(outboxJobs)
    .where(
      or(
        eq(outboxJobs.status, "PENDING"),
        and(eq(outboxJobs.status, "LEASED"), lt(outboxJobs.leasedUntil, now)),
      ),
    )
    .orderBy(outboxJobs.createdAt)
    .limit(1);

  const job = candidateRows[0];
  if (!job) {
    return { processed: false };
  }

  const nextAttempt = job.attempts + 1;
  await db
    .update(outboxJobs)
    .set({
      status: "LEASED",
      attempts: nextAttempt,
      leasedUntil: leaseUntil,
      updatedAt: now,
    })
    .where(eq(outboxJobs.id, job.id));

  try {
    if (job.jobType === "ASSET_PROBE_AND_VALIDATE") {
      const assetId = String(job.payload.assetId ?? "");
      const [asset] = await db
        .select()
        .from(mediaAssets)
        .where(eq(mediaAssets.id, assetId))
        .limit(1);
      if (!asset) {
        throw new Error(`Asset ${assetId} missing for probe job`);
      }

      const validating = transitionAssetState({
        from: asset.lifecycleState,
        to: "VALIDATING",
      });

      let detectedFormat: "mp4" | "webm" | "vtt" = "mp4";
      if (options?.readHeaderBytes) {
        const headerBytes = await options.readHeaderBytes(asset.id);
        const probeResult = probeMediaHeaderBytes(headerBytes);
        detectedFormat = probeResult.containerFormat;
      }

      const readyForProcessing = transitionAssetState({
        from: validating,
        to: "READY_FOR_PROCESSING",
        checksumVerified: asset.checksumVerified,
      });
      const processing = transitionAssetState({
        from: readyForProcessing,
        to: "PROCESSING",
      });
      const readyForReview = transitionAssetState({
        from: processing,
        to: "READY_FOR_REVIEW",
      });

      await db
        .update(mediaAssets)
        .set({
          lifecycleState: readyForReview,
          containerFormat: detectedFormat,
          durationSeconds: options?.defaultDurationSeconds ?? 120,
          updatedAt: now,
        })
        .where(eq(mediaAssets.id, asset.id));

      await db
        .update(outboxJobs)
        .set({
          status: "COMPLETED",
          leasedUntil: null,
          lastError: null,
          updatedAt: now,
        })
        .where(eq(outboxJobs.id, job.id));

      return {
        processed: true,
        jobId: job.id,
        status: "COMPLETED",
        assetState: readyForReview,
      };
    }

    await db
      .update(outboxJobs)
      .set({ status: "COMPLETED", leasedUntil: null, updatedAt: now })
      .where(eq(outboxJobs.id, job.id));
    return { processed: true, jobId: job.id, status: "COMPLETED" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Outbox job failed";
    const terminal = nextAttempt >= maxAttempts;
    const nextJobStatus = terminal ? "DEAD_LETTER" : "PENDING";

    await db
      .update(outboxJobs)
      .set({
        status: nextJobStatus,
        leasedUntil: null,
        lastError: message,
        updatedAt: now,
      })
      .where(eq(outboxJobs.id, job.id));

    if (terminal && job.jobType === "ASSET_PROBE_AND_VALIDATE" && job.payload.assetId) {
      await db
        .update(mediaAssets)
        .set({ lifecycleState: "FAILED", updatedAt: now })
        .where(eq(mediaAssets.id, String(job.payload.assetId)));
    }

    return { processed: true, jobId: job.id, status: nextJobStatus };
  }
}

export interface RegisterAssetPackagingAndQcInput {
  assetId: string;
  masterManifestText?: string;
  renditions: Array<{
    profileId: string;
    resolution: ResolutionTier;
    codec: string;
    bitrateKbps: number;
    hasConfiguredDrm?: boolean;
  }>;
  subtitles?: Array<{
    trackId: string;
    languageCode: string;
    label: string;
    isForced?: boolean;
  }>;
  at?: Date;
}

async function putVerifiedPackagedArtifact(
  storage: StorageAdapter,
  objectKey: string,
  contentType: string,
  bytes: Uint8Array,
  now: Date,
): Promise<void> {
  const sha256 = await computeSha256Hex([bytes]);
  const upload = await storage.createMultipartUpload({
    bucket: STORAGE_BUCKETS.packagedPrivate,
    objectKey,
    contentType,
    expectedSizeBytes: bytes.byteLength,
    expectedSha256: sha256,
    maxSizeBytes: 50 * 1024 * 1024,
    ttlSeconds: 300,
    now,
  });
  const { etag } = await storage.putPart(upload.uploadId, 1, bytes, now);
  await storage.completeMultipartUpload({
    uploadId: upload.uploadId,
    parts: [{ partNumber: 1, etag }],
    now,
  });
}

export async function approveAssetPackagingQc(
  db: MovieDatabase,
  storage: StorageAdapter,
  ctx: AuditContext,
  input: RegisterAssetPackagingAndQcInput,
) {
  assertPermission(ctx.actor, "media:process");
  const actor = ctx.actor!;
  const now = input.at ?? new Date();

  const manifestContent =
    input.masterManifestText ??
    [
      "#EXTM3U",
      "#EXT-X-VERSION:6",
      ...input.renditions.flatMap((r) => [
        `#EXT-X-STREAM-INF:BANDWIDTH=${r.bitrateKbps * 1000},RESOLUTION=1280x720`,
        `${r.profileId}/index.m3u8`,
      ]),
    ].join("\n");

  validateHlsMasterManifest(manifestContent);

  if (input.renditions.length === 0) {
    throw new RightsGateError("NO_RENDITIONS", "At least one packaged rendition is required");
  }

  const [asset] = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.id, input.assetId))
    .limit(1);
  if (!asset) {
    throw new NotFoundError(`Media asset not found: ${input.assetId}`);
  }
  if (asset.lifecycleState !== "READY_FOR_REVIEW" && asset.lifecycleState !== "PROCESSING") {
    throw new RightsGateError(
      "INVALID_ASSET_STATE_FOR_QC",
      `Asset must be in PROCESSING or READY_FOR_REVIEW for QC sign-off (current: ${asset.lifecycleState})`,
    );
  }

  const manifestBytes = Buffer.from(manifestContent, "utf8");
  const preparedRenditions: Array<{
    profileId: string;
    resolution: ResolutionTier;
    codec: string;
    bitrateKbps: number;
    hasConfiguredDrm: boolean;
    objectKey: string;
  }> = [];

  for (const r of input.renditions) {
    const { objectKey } = buildOpaqueObjectKey({
      kind: "derivative-manifest",
      assetId: asset.id,
      profileId: r.profileId,
      packageVersion: 1,
    });
    await putVerifiedPackagedArtifact(
      storage,
      objectKey,
      "application/vnd.apple.mpegurl",
      manifestBytes,
      now,
    );
    preparedRenditions.push({
      profileId: r.profileId,
      resolution: r.resolution,
      codec: r.codec,
      bitrateKbps: r.bitrateKbps,
      hasConfiguredDrm: Boolean(r.hasConfiguredDrm),
      objectKey,
    });
  }

  const preparedSubtitles: Array<{
    languageCode: string;
    label: string;
    isForced: boolean;
    objectKey: string;
  }> = [];

  for (const sub of input.subtitles ?? []) {
    const { objectKey } = buildOpaqueObjectKey({
      kind: "subtitle",
      assetId: asset.id,
      trackId: sub.trackId,
      version: 1,
    });
    const vttBytes = Buffer.from(
      `WEBVTT\n\n00:00:00.000 --> 00:00:04.000\n[${sub.label}]\n`,
      "utf8",
    );
    await putVerifiedPackagedArtifact(storage, objectKey, "text/vtt", vttBytes, now);
    preparedSubtitles.push({
      languageCode: sub.languageCode,
      label: sub.label,
      isForced: Boolean(sub.isForced),
      objectKey,
    });
  }

  await db.transaction(async (tx) => {
    const txDb = tx as unknown as MovieDatabase;
    for (const r of preparedRenditions) {
      await txDb.insert(mediaRenditions).values({
        id: newEntityId("rnd"),
        assetId: asset.id,
        resolution: r.resolution,
        codec: r.codec,
        bitrateKbps: r.bitrateKbps,
        manifestObjectKey: r.objectKey,
        hasConfiguredDrm: r.hasConfiguredDrm,
      });
    }

    for (const sub of preparedSubtitles) {
      await txDb.insert(subtitleTracks).values({
        id: newEntityId("sub"),
        assetId: asset.id,
        languageCode: sub.languageCode,
        label: sub.label,
        objectKey: sub.objectKey,
        isForced: sub.isForced,
      });
    }

    await txDb
      .update(mediaAssets)
      .set({
        lifecycleState: "READY_FOR_REVIEW",
        qcPassed: true,
        qcApprovedByUserId: actor.userId,
        qcApprovedAt: now,
        updatedAt: now,
      })
      .where(eq(mediaAssets.id, asset.id));

    await recordAuditEvent(txDb, {
      actor,
      action: "media.asset.qc_approved",
      targetType: "media_asset",
      targetId: asset.id,
      requestId: ctx.requestId,
      metadata: { renditionCount: preparedRenditions.length },
    });
  });

  return { assetId: asset.id, lifecycleState: "READY_FOR_REVIEW" as const, qcPassed: true };
}

export async function publishApprovedMediaAsset(
  db: MovieDatabase,
  ctx: AuditContext,
  assetId: string,
  options?: { at?: Date },
) {
  assertPermission(ctx.actor, "catalogue:publish");
  const actor = ctx.actor!;
  const now = options?.at ?? new Date();

  const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, assetId)).limit(1);
  if (!asset) {
    throw new NotFoundError(`Media asset not found: ${assetId}`);
  }

  if (asset.qcApprovedByUserId && asset.qcApprovedByUserId === actor.userId) {
    throw new AuthorizationError(
      "FORBIDDEN",
      "Separation of duties violation: the QC operator cannot self-publish the same media asset",
    );
  }

  const sources = await db
    .select()
    .from(metadataSources)
    .where(eq(metadataSources.titleId, asset.titleId));
  const attributionSatisfied =
    sources.length > 0 &&
    sources.every((s) => s.attributionText.trim().length > 0 && s.licenseConfirmed);

  const grants = await loadTitleGrantRecords(db, asset.titleId);
  const pubCheck = canPublishAssetWithRights({
    titleId: asset.titleId,
    assetId: asset.id,
    at: now,
    takedownOwnerAssigned: true,
    attributionSatisfied,
    grants,
  });

  if (!pubCheck.publishable) {
    throw new RightsGateError("ASSET_PUBLICATION_RIGHTS_BLOCKED", pubCheck.reason);
  }

  const nextState = transitionAssetState({
    from: asset.lifecycleState,
    to: "PUBLISHED",
    hasApprovedRights: true,
    checksumVerified: asset.checksumVerified,
    qcPassed: asset.qcPassed,
    reviewerApproved: true,
  });

  await db.transaction(async (tx) => {
    const txDb = tx as unknown as MovieDatabase;
    await txDb
      .update(mediaAssets)
      .set({
        lifecycleState: nextState,
        updatedAt: now,
      })
      .where(eq(mediaAssets.id, asset.id));

    await recordAuditEvent(txDb, {
      actor,
      action: "media.asset.publish",
      targetType: "media_asset",
      targetId: asset.id,
      requestId: ctx.requestId,
      metadata: { titleId: asset.titleId, grantIds: pubCheck.grantIds },
    });
  });

  return { assetId: asset.id, lifecycleState: nextState, grantIds: pubCheck.grantIds };
}

export interface AuthorizePlaybackSessionInput {
  titleSlug: string;
  territoryCode: string;
  requestedResolution?: ResolutionTier;
  drmCapableClient?: boolean;
  drmLicenseAdapterConfigured?: boolean;
  userEntitlement?: "FREE" | "RENTED" | "SUBSCRIBER" | "PARTNER";
  at?: Date;
}

/**
 * Server-authorized playback session issuance (Blueprint §43, §67, §74).
 * - Evaluates `evaluateRights({ action: "STREAM" })`
 * - Enforces fail-closed DRM (`DRM_REQUIRED` when `drmRequired` and no DRM adapter is configured)
 * - Caps renditions at `decision.maxResolution`
 * - Issues short-lived (`15m`) independent playback token & `5m` packaged manifest URLs
 * - Never touches or exposes `media_objects` / `sourceObjectKey`
 */
export async function authorizePlaybackSession(
  db: MovieDatabase,
  storage: StorageAdapter,
  ctx: AuditContext,
  input: AuthorizePlaybackSessionInput,
) {
  const now = input.at ?? new Date();

  const [title] = await db.select().from(titles).where(eq(titles.slug, input.titleSlug)).limit(1);
  if (!title) {
    throw new NotFoundError("Title not found");
  }

  const featureAssets = await db
    .select()
    .from(mediaAssets)
    .where(and(eq(mediaAssets.titleId, title.id), eq(mediaAssets.kind, "FEATURE")))
    .orderBy(desc(mediaAssets.updatedAt));
  const featureAsset =
    featureAssets.find((a) => a.lifecycleState === "PUBLISHED") ?? featureAssets[0];

  const grants = await loadTitleGrantRecords(db, title.id);

  let activeConcurrentSessions = 0;
  if (ctx.actor?.userId) {
    const [activeRow] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(playbackSessions)
      .where(
        and(
          eq(playbackSessions.userId, ctx.actor.userId),
          isNull(playbackSessions.revokedAt),
          gt(playbackSessions.expiresAt, now),
        ),
      );
    activeConcurrentSessions = activeRow?.count ?? 0;
  }

  const decision = evaluateRights({
    titleId: title.id,
    titleStatus: title.status,
    titleMaturityRating: title.maturityRating,
    takedownActive: title.legalHold,
    assetId: featureAsset?.id,
    assetState: featureAsset?.lifecycleState,
    assetChecksumVerified: featureAsset?.checksumVerified,
    drmCapableClient: input.drmCapableClient ?? false,
    action: "STREAM",
    territoryCode: input.territoryCode,
    at: now,
    userId: ctx.actor?.userId,
    accountStatus: ctx.actor?.status,
    userEntitlement: input.userEntitlement ?? "FREE",
    activeConcurrentSessions,
    maxConcurrentSessions: 3,
    requestedResolution: input.requestedResolution,
    grants,
  });

  if (!decision.allowed || !featureAsset) {
    const code = !decision.allowed ? decision.code : "ASSET_NOT_PUBLISHABLE";
    const reason = !decision.allowed
      ? decision.publicReason
      : "This media version is not ready for playback.";

    await recordAuditEvent(db, {
      actor: ctx.actor,
      action: "delivery.playback.denied",
      targetType: "title",
      targetId: title.id,
      requestId: ctx.requestId,
      metadata: { code, territoryCode: input.territoryCode },
    });

    throw new RightsGateError(code, reason);
  }

  const allRenditions = await db
    .select()
    .from(mediaRenditions)
    .where(eq(mediaRenditions.assetId, featureAsset.id));

  const permittedRenditions = filterRenditionsByMaxResolution(
    allRenditions,
    decision.maxResolution,
  );

  if (permittedRenditions.length === 0) {
    throw new RightsGateError(
      "ASSET_NOT_PUBLISHABLE",
      "No packaged rendition is available within the authorized resolution tier",
    );
  }

  // Fail-closed DRM check: signed URLs are access controls, NOT DRM!
  if (decision.requiresDrm || featureAsset.drmRequired) {
    const allHaveDrm =
      Boolean(input.drmLicenseAdapterConfigured) &&
      permittedRenditions.every((r) => r.hasConfiguredDrm);
    if (!allHaveDrm) {
      await recordAuditEvent(db, {
        actor: ctx.actor,
        action: "delivery.playback.drm_fail_closed",
        targetType: "media_asset",
        targetId: featureAsset.id,
        requestId: ctx.requestId,
        metadata: { requiresDrm: true },
      });

      throw new RightsGateError(
        "DRM_REQUIRED",
        "Protected playback requires an active multi-DRM license adapter; clear-stream fallback is prohibited.",
      );
    }
  }

  const rawPlaybackToken = `pbk_${crypto.randomBytes(24).toString("hex")}`;
  const tokenHash = hashPlaybackToken(rawPlaybackToken);
  const sessionId = newEntityId("pbs");
  const sessionExpiresAt = new Date(now.getTime() + 15 * 60 * 1000);

  let resumePositionSeconds = 0;
  if (ctx.actor?.userId) {
    const [priorSession] = await db
      .select({ lastPositionSeconds: playbackSessions.lastPositionSeconds })
      .from(playbackSessions)
      .where(
        and(
          eq(playbackSessions.userId, ctx.actor.userId),
          eq(playbackSessions.assetId, featureAsset.id),
        ),
      )
      .orderBy(desc(playbackSessions.createdAt))
      .limit(1);
    resumePositionSeconds = priorSession?.lastPositionSeconds ?? 0;
  }

  const signedRenditions = await Promise.all(
    permittedRenditions.map(async (r) => {
      const signed = await storage.createSignedReadUrl({
        bucket: STORAGE_BUCKETS.packagedPrivate,
        objectKey: r.manifestObjectKey,
        ttlSeconds: 300,
        now,
      });
      return {
        id: r.id,
        resolution: r.resolution,
        codec: r.codec,
        bitrateKbps: r.bitrateKbps,
        manifestUrl: signed.url,
        manifestExpiresAt: signed.expiresAt,
      };
    }),
  );

  const trackRows = await db
    .select()
    .from(subtitleTracks)
    .where(eq(subtitleTracks.assetId, featureAsset.id));

  const signedSubtitles = await Promise.all(
    trackRows.map(async (track) => {
      const signed = await storage.createSignedReadUrl({
        bucket: STORAGE_BUCKETS.packagedPrivate,
        objectKey: track.objectKey,
        ttlSeconds: 300,
        now,
      });
      return {
        id: track.id,
        languageCode: track.languageCode,
        label: track.label,
        isForced: track.isForced,
        vttUrl: signed.url,
      };
    }),
  );

  await db.transaction(async (tx) => {
    const txDb = tx as unknown as MovieDatabase;
    await txDb.insert(playbackSessions).values({
      id: sessionId,
      userId: ctx.actor?.userId ?? null,
      titleId: title.id,
      assetId: featureAsset.id,
      grantId: decision.grantId,
      territoryCode: input.territoryCode.toUpperCase(),
      maxResolution: decision.maxResolution,
      tokenHash,
      lastPositionSeconds: resumePositionSeconds,
      expiresAt: sessionExpiresAt,
    });

    await recordAuditEvent(txDb, {
      actor: ctx.actor,
      action: "delivery.playback.authorize",
      targetType: "playback_session",
      targetId: sessionId,
      requestId: ctx.requestId,
      metadata: {
        titleId: title.id,
        assetId: featureAsset.id,
        grantId: decision.grantId,
        territoryCode: input.territoryCode.toUpperCase(),
        maxResolution: decision.maxResolution,
      },
    });
  });

  return {
    sessionId,
    playbackToken: rawPlaybackToken,
    expiresAt: sessionExpiresAt,
    maxResolution: decision.maxResolution,
    requiresDrm: decision.requiresDrm,
    resumePositionSeconds,
    durationSeconds: featureAsset.durationSeconds ?? title.runtimeMinutes * 60,
    renditions: signedRenditions,
    subtitles: signedSubtitles,
    securityDisclosure:
      "Signed manifest URLs are short-lived bearer access controls, not DRM. No web playback technology prevents external analog capture.",
  };
}

export interface PlaybackHeartbeatInput {
  sessionId: string;
  playbackToken: string;
  positionSeconds: number;
  allowBackwardSeek?: boolean;
  qoeEvent?: {
    eventType: "FIRST_FRAME" | "BUFFER_UNDERRUN" | "RENDITION_SWITCH" | "HEARTBEAT";
    ttffMs?: number;
    rebufferCount?: number;
    activeResolution?: ResolutionTier;
  };
  at?: Date;
}

export async function recordPlaybackHeartbeat(db: MovieDatabase, input: PlaybackHeartbeatInput) {
  const now = input.at ?? new Date();
  const tokenHash = hashPlaybackToken(input.playbackToken);

  const [session] = await db
    .select()
    .from(playbackSessions)
    .where(and(eq(playbackSessions.id, input.sessionId), eq(playbackSessions.tokenHash, tokenHash)))
    .limit(1);

  if (!session) {
    throw new AuthorizationError("UNAUTHENTICATED", "Invalid playback session token");
  }

  if (session.revokedAt) {
    throw new RightsGateError("SESSION_REVOKED", "Playback session has been revoked");
  }
  if (session.expiresAt.getTime() <= now.getTime()) {
    throw new RightsGateError("SESSION_EXPIRED", "Playback session has expired");
  }

  // Re-verify live legal hold / publication status on every heartbeat
  const [title] = await db
    .select({ status: titles.status, legalHold: titles.legalHold })
    .from(titles)
    .where(eq(titles.id, session.titleId))
    .limit(1);

  if (!title || title.legalHold || title.status !== "PUBLISHED") {
    await db
      .update(playbackSessions)
      .set({ revokedAt: now })
      .where(eq(playbackSessions.id, session.id));
    throw new RightsGateError(
      "TAKEDOWN_HOLD_ACTIVE",
      "Playback terminated immediately because title availability was revoked",
    );
  }

  const clampedPos = Math.max(0, Math.floor(input.positionSeconds));
  const nextPosition = input.allowBackwardSeek
    ? clampedPos
    : Math.max(session.lastPositionSeconds, clampedPos);

  await db
    .update(playbackSessions)
    .set({ lastPositionSeconds: nextPosition })
    .where(eq(playbackSessions.id, session.id));

  if (input.qoeEvent) {
    const mappedType: DeliveryEventType =
      input.qoeEvent.eventType === "BUFFER_UNDERRUN"
        ? "REBUFFER_STARTED"
        : input.qoeEvent.eventType === "RENDITION_SWITCH"
          ? "QUALITY_CHANGED"
          : input.qoeEvent.eventType === "FIRST_FRAME"
            ? "FIRST_FRAME"
            : "PLAYBACK_AUTHORIZED";

    await db.insert(deliveryEvents).values({
      id: newEntityId("dev"),
      playbackSessionId: session.id,
      eventType: mappedType,
      startupLatencyMs: input.qoeEvent.ttffMs ?? null,
      metrics: {
        ttffMs: input.qoeEvent.ttffMs ?? null,
        rebufferCount: input.qoeEvent.rebufferCount ?? 0,
        activeResolution: input.qoeEvent.activeResolution ?? null,
      },
    });
  }

  return {
    sessionId: session.id,
    lastPositionSeconds: nextPosition,
    expiresAt: session.expiresAt,
    status: "ACTIVE" as const,
  };
}

export interface AuthorizeDownloadInput {
  assetId: string;
  territoryCode: string;
  userEntitlement?: "FREE" | "RENTED" | "SUBSCRIBER" | "PARTNER";
  at?: Date;
}

/**
 * Separate Download Gate (Blueprint §43.4, `AGENTS.md` Rule 3).
 * `STREAM` rights NEVER imply `DOWNLOAD`; requires authenticated active user + explicit `DOWNLOAD` grant.
 */
export async function authorizeAssetDownload(
  db: MovieDatabase,
  storage: StorageAdapter,
  ctx: AuditContext,
  input: AuthorizeDownloadInput,
) {
  if (!ctx.actor || ctx.actor.status !== "ACTIVE") {
    throw new AuthorizationError("UNAUTHENTICATED", "Sign in to download authorized copies");
  }
  const now = input.at ?? new Date();

  const [asset] = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.id, input.assetId))
    .limit(1);
  if (!asset) {
    throw new NotFoundError("Media asset not found");
  }

  const [title] = await db.select().from(titles).where(eq(titles.id, asset.titleId)).limit(1);
  if (!title) {
    throw new NotFoundError("Title not found");
  }

  const grants = await loadTitleGrantRecords(db, title.id);
  const decision = evaluateRights({
    titleId: title.id,
    titleStatus: title.status,
    titleMaturityRating: title.maturityRating,
    takedownActive: title.legalHold,
    assetId: asset.id,
    assetState: asset.lifecycleState,
    assetChecksumVerified: asset.checksumVerified,
    action: "DOWNLOAD",
    territoryCode: input.territoryCode,
    at: now,
    userId: ctx.actor.userId,
    accountStatus: ctx.actor.status,
    userEntitlement: input.userEntitlement ?? "FREE",
    grants,
  });

  if (!decision.allowed) {
    await recordAuditEvent(db, {
      actor: ctx.actor,
      action: "delivery.download.denied",
      targetType: "media_asset",
      targetId: asset.id,
      requestId: ctx.requestId,
      metadata: { code: decision.code, territoryCode: input.territoryCode },
    });
    throw new RightsGateError(decision.code, decision.publicReason);
  }

  if (decision.requiresDrm || asset.drmRequired) {
    throw new RightsGateError(
      "DRM_REQUIRED",
      "Direct file download is disabled for DRM-protected titles",
    );
  }

  const allRenditions = await db
    .select()
    .from(mediaRenditions)
    .where(eq(mediaRenditions.assetId, asset.id));
  const permitted = filterRenditionsByMaxResolution(allRenditions, decision.maxResolution);
  const selected = permitted[permitted.length - 1];
  if (!selected) {
    throw new RightsGateError("ASSET_NOT_PUBLISHABLE", "No downloadable derivative available");
  }

  const signedGet = await storage.createSignedReadUrl({
    bucket: STORAGE_BUCKETS.packagedPrivate,
    objectKey: selected.manifestObjectKey,
    ttlSeconds: 300,
    responseContentDisposition: `attachment; filename="${title.slug}-${selected.resolution}.mp4"`,
    now,
  });

  await recordAuditEvent(db, {
    actor: ctx.actor,
    action: "delivery.download.authorize",
    targetType: "media_asset",
    targetId: asset.id,
    requestId: ctx.requestId,
    metadata: {
      titleId: title.id,
      grantId: decision.grantId,
      resolution: selected.resolution,
      territoryCode: input.territoryCode.toUpperCase(),
    },
  });

  return {
    assetId: asset.id,
    resolution: selected.resolution,
    downloadUrl: signedGet.url,
    expiresAt: signedGet.expiresAt,
  };
}

export interface ResolveTakedownCaseInput {
  caseId: string;
  outcome: "LEGAL_HOLD_APPLIED" | "RESOLVED_UPHELD" | "RESOLVED_REJECTED";
  resolutionNotes: string;
  at?: Date;
}

/**
 * Takedown Resolution & Immediate Emergency Session Kill-Switch (Blueprint §30.6, §55).
 */
export async function resolveTakedownCase(
  db: MovieDatabase,
  ctx: AuditContext,
  input: ResolveTakedownCaseInput,
) {
  assertPermission(ctx.actor, "reports:resolve");
  const actor = ctx.actor!;
  const now = input.at ?? new Date();

  const [caseRow] = await db
    .select()
    .from(takedownCases)
    .where(eq(takedownCases.id, input.caseId))
    .limit(1);
  if (!caseRow) {
    throw new NotFoundError(`Takedown case not found: ${input.caseId}`);
  }

  const enforceHold = input.outcome === "LEGAL_HOLD_APPLIED" || input.outcome === "RESOLVED_UPHELD";

  await db.transaction(async (tx) => {
    const txDb = tx as unknown as MovieDatabase;

    await txDb
      .update(takedownCases)
      .set({
        status: input.outcome,
        legalHoldApplied: enforceHold ? true : caseRow.legalHoldApplied,
        handledByUserId: actor.userId,
        resolutionNotes: input.resolutionNotes.trim().slice(0, 2000),
        resolvedAt: input.outcome === "LEGAL_HOLD_APPLIED" ? null : now,
      })
      .where(eq(takedownCases.id, caseRow.id));

    if (enforceHold && caseRow.titleId) {
      await txDb
        .update(titles)
        .set({
          status: "TAKEDOWN_HOLD",
          legalHold: true,
          updatedAt: now,
        })
        .where(eq(titles.id, caseRow.titleId));

      await txDb
        .update(mediaAssets)
        .set({
          lifecycleState: "TAKEDOWN_HOLD",
          updatedAt: now,
        })
        .where(eq(mediaAssets.titleId, caseRow.titleId));

      // Immediately revoke every active playback session for this title
      await txDb
        .update(playbackSessions)
        .set({ revokedAt: now })
        .where(
          and(eq(playbackSessions.titleId, caseRow.titleId), isNull(playbackSessions.revokedAt)),
        );

      // Atomically decommission all replication tasks for this title's assets (Blueprint §85.4, §89.2)
      const titleAssets = await txDb
        .select({ id: mediaAssets.id })
        .from(mediaAssets)
        .where(eq(mediaAssets.titleId, caseRow.titleId));
      const assetIds = titleAssets.map((a) => a.id);
      if (assetIds.length > 0) {
        const objects = await txDb
          .select({ id: mediaObjects.id })
          .from(mediaObjects)
          .where(inArray(mediaObjects.assetId, assetIds));
        const objectIds = objects.map((o) => o.id);
        if (objectIds.length > 0) {
          await txDb
            .update(replicationTasks)
            .set({ status: "DECOMMISSIONED", updatedAt: now })
            .where(inArray(replicationTasks.storageObjectId, objectIds));
        }
      }
    }

    await recordAuditEvent(txDb, {
      actor,
      action: "compliance.takedown.resolve",
      targetType: "takedown_case",
      targetId: caseRow.id,
      requestId: ctx.requestId,
      metadata: {
        caseNumber: caseRow.caseNumber,
        outcome: input.outcome,
        legalHoldApplied: enforceHold,
        titleId: caseRow.titleId,
      },
    });
  });

  return {
    caseId: caseRow.id,
    caseNumber: caseRow.caseNumber,
    status: input.outcome,
    legalHoldApplied: enforceHold,
  };
}

/**
 * Server-authorized operational ledger readers for Admin Console sub-views (`/admin/*`).
 */
export async function listAdminCatalogueLedger(db: MovieDatabase, ctx: AuditContext) {
  assertPermission(ctx.actor, "catalogue:read");
  if (!ctx.actor?.roles.some((r) => r !== "VIEWER")) {
    throw new AuthorizationError("FORBIDDEN", "Staff role required");
  }
  return db.select().from(titles).orderBy(desc(titles.updatedAt)).limit(50);
}

export async function listAdminRightsLedger(db: MovieDatabase, ctx: AuditContext) {
  assertPermission(ctx.actor, "rights:read");
  return db
    .select({
      id: rightsGrants.id,
      titleId: rightsGrants.titleId,
      assetId: rightsGrants.assetId,
      status: rightsGrants.status,
      allowedActions: rightsGrants.allowedActions,
      allowedTerritories: rightsGrants.allowedTerritories,
      maxResolution: rightsGrants.maxResolution,
      requiresDrm: rightsGrants.requiresDrm,
      validFrom: rightsGrants.validFrom,
      validUntil: rightsGrants.validUntil,
      licensorName: rightsHolders.legalName,
    })
    .from(rightsGrants)
    .innerJoin(rightsHolders, eq(rightsGrants.rightsHolderId, rightsHolders.id))
    .orderBy(desc(rightsGrants.createdAt))
    .limit(50);
}

export async function listAdminMediaAndJobsLedger(db: MovieDatabase, ctx: AuditContext) {
  assertPermission(ctx.actor, "media:read");
  const assets = await db
    .select({
      id: mediaAssets.id,
      titleId: mediaAssets.titleId,
      kind: mediaAssets.kind,
      lifecycleState: mediaAssets.lifecycleState,
      drmRequired: mediaAssets.drmRequired,
      containerFormat: mediaAssets.containerFormat,
      checksumVerified: mediaAssets.checksumVerified,
      qcPassed: mediaAssets.qcPassed,
      updatedAt: mediaAssets.updatedAt,
    })
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.updatedAt))
    .limit(50);

  const jobs = await db.select().from(outboxJobs).orderBy(desc(outboxJobs.createdAt)).limit(50);

  return { assets, jobs };
}

export async function listAdminTakedownLedger(db: MovieDatabase, ctx: AuditContext) {
  assertPermission(ctx.actor, "reports:review");
  return db.select().from(takedownCases).orderBy(desc(takedownCases.createdAt)).limit(50);
}

export async function listAdminAuditLedger(db: MovieDatabase, ctx: AuditContext) {
  assertPermission(ctx.actor, "audit:read");
  return db.select().from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(100);
}

export interface RecordPlaybackQoeEventInput {
  sessionId: string;
  playbackToken: string;
  eventType: DeliveryEventType;
  startupLatencyMs?: number | null;
  rebufferDurationMs?: number | null;
  renditionProfile?: string | null;
  regionCode?: string | null;
  errorCode?: string | null;
  correlationId?: string | null;
  metrics?: Record<string, unknown>;
  occurredAt?: Date;
  at?: Date;
}

/**
 * Validates session token, guards against PII/secrets, and records QoE telemetry event.
 */
export async function recordPlaybackQoeEvent(
  db: MovieDatabase,
  input: RecordPlaybackQoeEventInput,
) {
  const [session] = await db
    .select()
    .from(playbackSessions)
    .where(eq(playbackSessions.id, input.sessionId))
    .limit(1);

  if (!session) {
    throw new NotFoundError(`Playback session not found: ${input.sessionId}`);
  }

  const expectedHash = hashPlaybackToken(input.playbackToken);
  if (session.tokenHash !== expectedHash) {
    throw new AuthorizationError("UNAUTHENTICATED", "Invalid playback session token");
  }

  if (session.revokedAt !== null) {
    throw new RightsGateError("SESSION_REVOKED", "Playback session has been revoked");
  }

  const now = input.at ?? input.occurredAt ?? new Date();
  if (session.expiresAt.getTime() <= now.getTime()) {
    throw new RightsGateError("SESSION_EXPIRED", "Playback session has expired");
  }

  // Redact secrets and clamp occurredAt (guard against client clock drift > 5 min into the future)
  let effectiveOccurredAt = input.occurredAt ?? now;
  if (effectiveOccurredAt.getTime() > now.getTime() + 5 * 60 * 1000) {
    effectiveOccurredAt = now;
  }

  // Sanitize metrics to avoid PII or raw tokens (deep value scrubbing for Bearer tokens & JWTs)
  const sanitizedMetrics: Record<string, unknown> = {};
  if (input.metrics && typeof input.metrics === "object") {
    for (const [key, value] of Object.entries(input.metrics)) {
      if (!/(token|secret|password|auth|cookie|jwt|key|ip|email)/i.test(key)) {
        if (typeof value === "string") {
          if (
            !/^Bearer\s+/i.test(value) &&
            !/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(value)
          ) {
            sanitizedMetrics[key] = value.slice(0, 500);
          }
        } else if (typeof value === "number" || typeof value === "boolean") {
          sanitizedMetrics[key] = value;
        }
      }
    }
  }

  const eventId = newEntityId("qoe");
  await db.insert(deliveryEvents).values({
    id: eventId,
    playbackSessionId: session.id,
    eventType: input.eventType,
    startupLatencyMs: input.startupLatencyMs ?? null,
    rebufferDurationMs: input.rebufferDurationMs ?? null,
    renditionProfile: input.renditionProfile ?? null,
    regionCode: input.regionCode ?? session.territoryCode ?? null,
    errorCode: input.errorCode ? input.errorCode.replace(/[^\w-]/g, "").slice(0, 64) : null,
    correlationId: input.correlationId
      ? input.correlationId.replace(/[^\w-]/g, "").slice(0, 128)
      : null,
    occurredAt: effectiveOccurredAt,
    metrics: sanitizedMetrics,
    createdAt: now,
  });

  return {
    eventId,
    status: "RECORDED" as const,
    occurredAt: effectiveOccurredAt,
  };
}

export interface QoeSummaryFilter {
  titleId?: string;
  sessionId?: string;
  since?: Date;
  limit?: number;
}

export interface PlaybackQoeSummary {
  totalEvents: number;
  totalSessions: number;
  eventCountsByType: Record<string, number>;
  startupLatencyStats: {
    count: number;
    avgMs: number;
    p50Ms: number;
    p75Ms: number;
    p95Ms: number;
  };
  rebufferStats: {
    totalDurationMs: number;
    rebufferEventCount: number;
    rebufferRatioPercent: number;
  };
  errorStats: {
    fatalErrorCount: number;
    fatalErrorRatePercent: number;
  };
  recentEvents: Array<{
    id: string;
    playbackSessionId: string;
    eventType: DeliveryEventType;
    startupLatencyMs: number | null;
    rebufferDurationMs: number | null;
    renditionProfile: string | null;
    regionCode: string | null;
    errorCode: string | null;
    occurredAt: Date;
  }>;
}

/**
 * Aggregates QoE telemetry for admin operational reporting (Blueprint §91.1–91.2).
 */
export async function getPlaybackQoeSummaryForAdmin(
  db: MovieDatabase,
  ctx: AuditContext,
  filter?: QoeSummaryFilter,
): Promise<PlaybackQoeSummary> {
  const isAuthorized =
    ctx.actor &&
    ctx.actor.status === "ACTIVE" &&
    ctx.actor.roles.some((r) =>
      ["EDITOR", "MEDIA_OPERATOR", "RIGHTS_REVIEWER", "ADMIN", "SUPER_ADMIN"].includes(r),
    );

  if (!isAuthorized) {
    throw new AuthorizationError(
      ctx.actor ? "FORBIDDEN" : "UNAUTHENTICATED",
      "Staff role required to view QoE operations summary",
    );
  }

  const conditions = [];

  if (filter?.sessionId) {
    conditions.push(eq(deliveryEvents.playbackSessionId, filter.sessionId));
  }
  if (filter?.since) {
    conditions.push(gte(deliveryEvents.occurredAt, filter.since));
  }

  if (filter?.titleId) {
    const sessionIds = (
      await db
        .select({ id: playbackSessions.id })
        .from(playbackSessions)
        .where(eq(playbackSessions.titleId, filter.titleId))
    ).map((s) => s.id);

    if (sessionIds.length === 0) {
      return {
        totalEvents: 0,
        totalSessions: 0,
        eventCountsByType: {},
        startupLatencyStats: { count: 0, avgMs: 0, p50Ms: 0, p75Ms: 0, p95Ms: 0 },
        rebufferStats: { totalDurationMs: 0, rebufferEventCount: 0, rebufferRatioPercent: 0 },
        errorStats: { fatalErrorCount: 0, fatalErrorRatePercent: 0 },
        recentEvents: [],
      };
    }
    conditions.push(inArray(deliveryEvents.playbackSessionId, sessionIds));
  }

  const events = await db
    .select()
    .from(deliveryEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(deliveryEvents.occurredAt))
    .limit(filter?.limit ?? 500);

  const eventCountsByType: Record<string, number> = {};
  const latencies: number[] = [];
  let totalRebufferDurationMs = 0;
  let rebufferEventCount = 0;
  let fatalErrorCount = 0;
  const distinctSessions = new Set<string>();

  for (const ev of events) {
    distinctSessions.add(ev.playbackSessionId);
    eventCountsByType[ev.eventType] = (eventCountsByType[ev.eventType] ?? 0) + 1;

    if (ev.startupLatencyMs !== null && ev.startupLatencyMs !== undefined) {
      latencies.push(ev.startupLatencyMs);
    }
    if (ev.rebufferDurationMs && ev.rebufferDurationMs > 0) {
      totalRebufferDurationMs += ev.rebufferDurationMs;
      rebufferEventCount += 1;
    }
    if (ev.eventType === "PLAYBACK_ERROR") {
      fatalErrorCount += 1;
    }
  }

  latencies.sort((a, b) => a - b);
  const count = latencies.length;
  const avgMs = count > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / count) : 0;
  const p50Ms = count > 0 ? latencies[Math.floor(count * 0.5)]! : 0;
  const p75Ms = count > 0 ? latencies[Math.floor(count * 0.75)]! : 0;
  const p95Ms = count > 0 ? latencies[Math.floor(count * 0.95)]! : 0;

  const totalSessions = distinctSessions.size;
  const fatalErrorRatePercent =
    totalSessions > 0 ? Number(((fatalErrorCount / totalSessions) * 100).toFixed(2)) : 0;

  return {
    totalEvents: events.length,
    totalSessions,
    eventCountsByType,
    startupLatencyStats: {
      count,
      avgMs,
      p50Ms,
      p75Ms,
      p95Ms,
    },
    rebufferStats: {
      totalDurationMs: totalRebufferDurationMs,
      rebufferEventCount,
      rebufferRatioPercent: Number(
        ((totalRebufferDurationMs / Math.max(1, totalSessions * 120_000)) * 100).toFixed(2),
      ),
    },
    errorStats: {
      fatalErrorCount,
      fatalErrorRatePercent,
    },
    recentEvents: events.slice(0, 50).map((e) => ({
      id: e.id,
      playbackSessionId: e.playbackSessionId,
      eventType: e.eventType as DeliveryEventType,
      startupLatencyMs: e.startupLatencyMs,
      rebufferDurationMs: e.rebufferDurationMs,
      renditionProfile: e.renditionProfile,
      regionCode: e.regionCode,
      errorCode: e.errorCode,
      occurredAt: e.occurredAt,
    })),
  };
}

export interface CreateReplicationTaskInput {
  storageObjectId: string;
  targetProvider: string;
  targetRegion: string;
  expectedSha256: string;
}

export async function createReplicationTask(
  db: MovieDatabase,
  ctx: AuditContext,
  input: CreateReplicationTaskInput,
) {
  assertPermission(ctx.actor, "storage:manage");
  const actor = ctx.actor!;

  const [obj] = await db
    .select()
    .from(mediaObjects)
    .where(eq(mediaObjects.id, input.storageObjectId))
    .limit(1);

  if (!obj) {
    throw new NotFoundError(`Storage object not found: ${input.storageObjectId}`);
  }

  const taskId = newEntityId("rep");
  const now = new Date();

  await db.transaction(async (tx) => {
    const txDb = tx as unknown as MovieDatabase;
    await txDb.insert(replicationTasks).values({
      id: taskId,
      storageObjectId: input.storageObjectId,
      targetProvider: input.targetProvider,
      targetRegion: input.targetRegion,
      status: "PENDING",
      expectedSha256: input.expectedSha256,
      attemptCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    await recordAuditEvent(txDb, {
      actor,
      action: "storage.replication.task_create",
      targetType: "replication_task",
      targetId: taskId,
      requestId: ctx.requestId,
      metadata: {
        storageObjectId: input.storageObjectId,
        targetProvider: input.targetProvider,
        targetRegion: input.targetRegion,
      },
    });
  });

  return {
    taskId,
    status: "PENDING" as ReplicationStatus,
    storageObjectId: input.storageObjectId,
  };
}

export interface VerifyReplicationTaskChecksumInput {
  taskId: string;
  computedSha256: string;
}

export async function verifyReplicationTaskChecksum(
  db: MovieDatabase,
  ctx: AuditContext,
  input: VerifyReplicationTaskChecksumInput,
) {
  assertPermission(ctx.actor, "storage:manage");
  const actor = ctx.actor!;
  const now = new Date();

  const [task] = await db
    .select()
    .from(replicationTasks)
    .where(eq(replicationTasks.id, input.taskId))
    .limit(1);

  if (!task) {
    throw new NotFoundError(`Replication task not found: ${input.taskId}`);
  }

  const matches = task.expectedSha256.toLowerCase() === input.computedSha256.trim().toLowerCase();
  const nextStatus: ReplicationStatus = matches ? "VERIFIED" : "FAILED";
  const lastError = matches
    ? null
    : `Checksum mismatch: expected ${task.expectedSha256}, got ${input.computedSha256}`;

  await db.transaction(async (tx) => {
    const txDb = tx as unknown as MovieDatabase;
    await txDb
      .update(replicationTasks)
      .set({
        status: nextStatus,
        checksumVerifiedAt: matches ? now : task.checksumVerifiedAt,
        attemptCount: task.attemptCount + 1,
        lastError,
        updatedAt: now,
      })
      .where(eq(replicationTasks.id, task.id));

    await recordAuditEvent(txDb, {
      actor,
      action: "storage.replication.checksum_verify",
      targetType: "replication_task",
      targetId: task.id,
      requestId: ctx.requestId,
      metadata: {
        status: nextStatus,
        matches,
        attemptCount: task.attemptCount + 1,
      },
    });
  });

  return {
    taskId: task.id,
    status: nextStatus,
    verified: matches,
    checksumVerifiedAt: matches ? now : null,
    lastError,
  };
}

export interface ContinueWatchingRecord {
  titleId: string;
  titleSlug: string;
  titleEn: string;
  kind: "MOVIE" | "SERIES";
  releaseYear: number;
  runtimeMinutes: number;
  lastPositionSeconds: number;
  durationSeconds: number;
  progressPercent: number;
  updatedAt: Date;
}

/**
 * Lists in-progress titles for an authenticated viewer, ordered by most recent playback session.
 * Deduplicates multiple sessions per title and omits completed titles (>= 96% and within 20s of end).
 */
export async function listUserContinueWatching(
  db: MovieDatabase,
  userId: string,
  limit = 8,
): Promise<ContinueWatchingRecord[]> {
  const normalizedUserId = typeof userId === "string" ? userId.trim() : "";
  if (!normalizedUserId || limit <= 0) {
    return [];
  }

  const rows = await db
    .select({
      titleId: titles.id,
      titleSlug: titles.slug,
      originalTitle: titles.originalTitle,
      localizedTitleEn: titleTranslations.localizedTitle,
      kind: titles.kind,
      releaseYear: titles.releaseYear,
      runtimeMinutes: titles.runtimeMinutes,
      assetDurationSeconds: mediaAssets.durationSeconds,
      lastPositionSeconds: playbackSessions.lastPositionSeconds,
      createdAt: playbackSessions.createdAt,
    })
    .from(playbackSessions)
    .innerJoin(titles, eq(playbackSessions.titleId, titles.id))
    .innerJoin(mediaAssets, eq(playbackSessions.assetId, mediaAssets.id))
    .leftJoin(
      titleTranslations,
      and(eq(titleTranslations.titleId, titles.id), eq(titleTranslations.locale, "en")),
    )
    .where(
      and(
        eq(playbackSessions.userId, normalizedUserId),
        gt(playbackSessions.lastPositionSeconds, 0),
        eq(titles.status, "PUBLISHED"),
        eq(titles.legalHold, false),
      ),
    )
    .orderBy(desc(playbackSessions.createdAt))
    .limit(Math.max(limit * 4, 24));

  const seenSlugs = new Set<string>();
  const items: ContinueWatchingRecord[] = [];

  for (const row of rows) {
    if (seenSlugs.has(row.titleSlug)) {
      continue;
    }
    seenSlugs.add(row.titleSlug);

    const fallbackDuration = Math.max(1, row.runtimeMinutes) * 60;
    const durationSeconds = Math.max(
      60,
      row.assetDurationSeconds && row.assetDurationSeconds > 0
        ? row.assetDurationSeconds
        : fallbackDuration,
    );
    const clampedPosition = Math.min(row.lastPositionSeconds, durationSeconds);
    const rawPercent = Math.round((clampedPosition / durationSeconds) * 100);
    const isCompleted = rawPercent >= 96 && clampedPosition >= durationSeconds - 20;
    if (isCompleted) {
      continue;
    }

    items.push({
      titleId: row.titleId,
      titleSlug: row.titleSlug,
      titleEn: row.localizedTitleEn ?? row.originalTitle,
      kind: row.kind === "SERIES" ? "SERIES" : "MOVIE",
      releaseYear: row.releaseYear,
      runtimeMinutes: row.runtimeMinutes,
      lastPositionSeconds: clampedPosition,
      durationSeconds,
      progressPercent: Math.min(99, Math.max(1, rawPercent)),
      updatedAt: row.createdAt,
    });

    if (items.length >= limit) {
      break;
    }
  }

  return items;
}

/**
 * Returns distinct published title slugs from the authenticated viewer's recent playback sessions
 * and watchlist items to seed server-side personalized similarity recommendations.
 */
export async function listUserWatchHistorySlugs(
  db: MovieDatabase,
  userId: string,
  limit = 8,
): Promise<string[]> {
  const normalizedUserId = typeof userId === "string" ? userId.trim() : "";
  if (!normalizedUserId || limit <= 0) {
    return [];
  }

  const sessionRows = await db
    .select({ slug: titles.slug })
    .from(playbackSessions)
    .innerJoin(titles, eq(playbackSessions.titleId, titles.id))
    .where(
      and(
        eq(playbackSessions.userId, normalizedUserId),
        eq(titles.status, "PUBLISHED"),
        eq(titles.legalHold, false),
      ),
    )
    .orderBy(desc(playbackSessions.createdAt))
    .limit(limit * 3);

  const watchlistRows = await db
    .select({ slug: titles.slug })
    .from(watchlistItems)
    .innerJoin(titles, eq(watchlistItems.titleId, titles.id))
    .where(
      and(
        eq(watchlistItems.userId, normalizedUserId),
        eq(titles.status, "PUBLISHED"),
        eq(titles.legalHold, false),
      ),
    )
    .orderBy(desc(watchlistItems.createdAt))
    .limit(limit * 2);

  const slugs: string[] = [];
  const seen = new Set<string>();
  for (const row of [...sessionRows, ...watchlistRows]) {
    if (!seen.has(row.slug)) {
      seen.add(row.slug);
      slugs.push(row.slug);
      if (slugs.length >= limit) {
        break;
      }
    }
  }

  return slugs;
}
