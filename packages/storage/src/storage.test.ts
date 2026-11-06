import { describe, expect, it } from "vitest";
import {
  buildOpaqueObjectKey,
  computeSha256Hex,
  InMemoryStorageAdapter,
  STORAGE_BUCKETS,
} from "./index";

describe("@movie/storage", () => {
  it("generates opaque object keys and rejects path traversal or PII in identifiers", () => {
    const key = buildOpaqueObjectKey({
      kind: "source",
      assetId: "ast_01jbx9",
      uploadSessionId: "upl_01jbx9",
    });
    expect(key).toEqual({
      bucketRole: "stagingPrivate",
      objectKey: "quarantine/ast_01jbx9/upl_01jbx9/source.bin",
    });

    expect(() =>
      buildOpaqueObjectKey({
        kind: "source",
        assetId: "../etc/passwd",
        uploadSessionId: "upl_01jbx9",
      }),
    ).toThrow(/opaque identifiers/);

    expect(() =>
      buildOpaqueObjectKey({
        kind: "source",
        assetId: "owner@example.com",
        uploadSessionId: "upl_01jbx9",
      }),
    ).toThrow(/opaque identifiers/);
  });

  it("completes verified multipart uploads idempotently and issues scoped expiring GET URLs", async () => {
    const storage = new InMemoryStorageAdapter({
      signingSecret: "test-signing-secret-with-32-plus-bytes!",
    });
    const part1 = new TextEncoder().encode("cinematic-");
    const part2 = new TextEncoder().encode("graphite-fixture");
    const expectedSha256 = await computeSha256Hex([part1, part2]);
    const now = new Date("2026-11-06T12:00:00Z");

    const session = await storage.createMultipartUpload({
      bucket: STORAGE_BUCKETS.stagingPrivate,
      objectKey: "quarantine/ast_01/upl_01/source.bin",
      contentType: "video/mp4",
      expectedSizeBytes: part1.byteLength + part2.byteLength,
      expectedSha256,
      maxSizeBytes: 1024 * 1024,
      ttlSeconds: 600,
      now,
    });

    const urls = await storage.createPartUploadUrls({
      uploadId: session.uploadId,
      partNumbers: [1, 2],
      now,
    });
    expect(urls).toHaveLength(2);

    const p1 = await storage.putPart(session.uploadId, 1, part1, now);
    const p2 = await storage.putPart(session.uploadId, 2, part2, now);

    const completed = await storage.completeMultipartUpload({
      uploadId: session.uploadId,
      parts: [
        { partNumber: 1, etag: p1.etag },
        { partNumber: 2, etag: p2.etag },
      ],
      now,
    });
    expect(completed.quarantineState).toBe("VERIFIED");
    expect(completed.sha256).toBe(expectedSha256);

    // Duplicate completion is idempotent.
    const duplicate = await storage.completeMultipartUpload({
      uploadId: session.uploadId,
      parts: [
        { partNumber: 1, etag: p1.etag },
        { partNumber: 2, etag: p2.etag },
      ],
      now,
    });
    expect(duplicate).toEqual(completed);

    const signed = await storage.createSignedReadUrl({
      bucket: STORAGE_BUCKETS.stagingPrivate,
      objectKey: "quarantine/ast_01/upl_01/source.bin",
      ttlSeconds: 60,
      now,
    });

    expect(
      storage.verifySignedReadUrl(
        signed.url,
        STORAGE_BUCKETS.stagingPrivate,
        "quarantine/ast_01/upl_01/source.bin",
        new Date(now.getTime() + 30_000),
      ),
    ).toBe(true);

    // Rejects cross-object use.
    expect(
      storage.verifySignedReadUrl(
        signed.url,
        STORAGE_BUCKETS.stagingPrivate,
        "quarantine/ast_02/upl_01/source.bin",
        new Date(now.getTime() + 30_000),
      ),
    ).toBe(false);

    // Rejects expired URL.
    expect(
      storage.verifySignedReadUrl(
        signed.url,
        STORAGE_BUCKETS.stagingPrivate,
        "quarantine/ast_01/upl_01/source.bin",
        new Date(now.getTime() + 61_000),
      ),
    ).toBe(false);
  });

  it("quarantines mismatched checksums and refuses to issue signed read URLs for quarantined objects", async () => {
    const storage = new InMemoryStorageAdapter();
    const payload = new TextEncoder().encode("corrupted-bytes");

    const session = await storage.createMultipartUpload({
      bucket: STORAGE_BUCKETS.stagingPrivate,
      objectKey: "quarantine/ast_bad/upl_01/source.bin",
      contentType: "video/mp4",
      expectedSizeBytes: payload.byteLength,
      expectedSha256: "f".repeat(64),
      maxSizeBytes: 1024 * 1024,
    });

    const p1 = await storage.putPart(session.uploadId, 1, payload);

    await expect(
      storage.completeMultipartUpload({
        uploadId: session.uploadId,
        parts: [{ partNumber: 1, etag: p1.etag }],
      }),
    ).rejects.toThrow(/quarantine/);

    const meta = await storage.headObject(
      STORAGE_BUCKETS.stagingPrivate,
      "quarantine/ast_bad/upl_01/source.bin",
    );
    expect(meta?.quarantineState).toBe("QUARANTINED");

    await expect(
      storage.createSignedReadUrl({
        bucket: STORAGE_BUCKETS.stagingPrivate,
        objectKey: "quarantine/ast_bad/upl_01/source.bin",
        ttlSeconds: 60,
      }),
    ).rejects.toThrow(/quarantined/);
  });
});
