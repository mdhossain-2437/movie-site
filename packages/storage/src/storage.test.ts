import { describe, expect, it } from "vitest";
import {
  buildOpaqueObjectKey,
  computeSha256Hex,
  HttpRangeError,
  InMemoryStorageAdapter,
  parseHttpByteRange,
  readObjectByteRange,
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

  describe("RFC 9110 HTTP Range byte-serving", () => {
    it("parses valid byte ranges (standard, prefix, suffix, single-byte, clamped)", () => {
      // Missing or non-bytes headers return null (serve full 200 OK)
      expect(parseHttpByteRange(null, 1000)).toBeNull();
      expect(parseHttpByteRange("", 1000)).toBeNull();
      expect(parseHttpByteRange("none", 1000)).toBeNull();

      // Standard range 0-499
      const r1 = parseHttpByteRange("bytes=0-499", 1000);
      expect(r1).toEqual({ start: 0, end: 499, contentLength: 500, isRange: true });

      // Clamped range where end exceeds total
      const r2 = parseHttpByteRange("bytes=500-2000", 1000);
      expect(r2).toEqual({ start: 500, end: 999, contentLength: 500, isRange: true });

      // Prefix range start-
      const r3 = parseHttpByteRange("bytes=800-", 1000);
      expect(r3).toEqual({ start: 800, end: 999, contentLength: 200, isRange: true });

      // Suffix range -suffix
      const r4 = parseHttpByteRange("bytes=-150", 1000);
      expect(r4).toEqual({ start: 850, end: 999, contentLength: 150, isRange: true });

      // Suffix range larger than file clamps start to 0
      const r5 = parseHttpByteRange("bytes=-2500", 1000);
      expect(r5).toEqual({ start: 0, end: 999, contentLength: 1000, isRange: true });

      // Single byte range 0-0
      const r6 = parseHttpByteRange("bytes=0-0", 1000);
      expect(r6).toEqual({ start: 0, end: 0, contentLength: 1, isRange: true });
    });

    it("rejects unsatisfiable or malformed byte ranges with HttpRangeError (416)", () => {
      // Inverted range
      expect(() => parseHttpByteRange("bytes=500-100", 1000)).toThrow(HttpRangeError);
      try {
        parseHttpByteRange("bytes=500-100", 1000);
      } catch (e) {
        expect((e as HttpRangeError).status).toBe(416);
        expect((e as HttpRangeError).totalLength).toBe(1000);
      }

      // Start byte exceeds total length
      expect(() => parseHttpByteRange("bytes=1000-", 1000)).toThrow(HttpRangeError);
      expect(() => parseHttpByteRange("bytes=1500-2000", 1000)).toThrow(HttpRangeError);

      // Suffix length zero or malformed
      expect(() => parseHttpByteRange("bytes=-0", 1000)).toThrow(HttpRangeError);
      expect(() => parseHttpByteRange("bytes=-abc", 1000)).toThrow(HttpRangeError);

      // Range on empty file (0 bytes)
      expect(() => parseHttpByteRange("bytes=0-0", 0)).toThrow(HttpRangeError);

      // Multi-range request rejected with 416 (defense against range amplification)
      expect(() => parseHttpByteRange("bytes=0-10, 20-30", 1000)).toThrow(HttpRangeError);
    });

    it("reads object byte ranges returning 206 Partial Content or 416 Range Not Satisfiable", async () => {
      const storage = new InMemoryStorageAdapter();
      const rawText = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // 36 bytes
      const testBytes = new TextEncoder().encode(rawText);

      await storage.putDirectObject(
        STORAGE_BUCKETS.packagedPrivate,
        "assets/ast_range/v1/master.m3u8",
        testBytes,
        "application/vnd.apple.mpegurl",
      );

      // 1. Full read without Range header
      const full = await readObjectByteRange(
        storage,
        STORAGE_BUCKETS.packagedPrivate,
        "assets/ast_range/v1/master.m3u8",
      );
      expect(full.statusCode).toBe(200);
      expect(full.headers["Accept-Ranges"]).toBe("bytes");
      expect(full.headers["Content-Length"]).toBe("36");
      expect(full.headers["Content-Type"]).toBe("application/vnd.apple.mpegurl");
      expect(new TextDecoder().decode(full.body)).toBe(rawText);

      // 2. Partial content: bytes=10-19 (10 bytes: 'ABCDEFGHIJ')
      const part = await readObjectByteRange(
        storage,
        STORAGE_BUCKETS.packagedPrivate,
        "assets/ast_range/v1/master.m3u8",
        "bytes=10-19",
      );
      expect(part.statusCode).toBe(206);
      expect(part.headers["Accept-Ranges"]).toBe("bytes");
      expect(part.headers["Content-Range"]).toBe("bytes 10-19/36");
      expect(part.headers["Content-Length"]).toBe("10");
      expect(new TextDecoder().decode(part.body)).toBe("ABCDEFGHIJ");

      // 3. Suffix range: bytes=-6 (last 6 bytes: 'UVWXYZ')
      const suffix = await readObjectByteRange(
        storage,
        STORAGE_BUCKETS.packagedPrivate,
        "assets/ast_range/v1/master.m3u8",
        "bytes=-6",
      );
      expect(suffix.statusCode).toBe(206);
      expect(suffix.headers["Content-Range"]).toBe("bytes 30-35/36");
      expect(suffix.headers["Content-Length"]).toBe("6");
      expect(new TextDecoder().decode(suffix.body)).toBe("UVWXYZ");

      // 4. Unsatisfiable range with throwOnUnsatisfiable: false returns 416
      const unsatisfiable = await readObjectByteRange(
        storage,
        STORAGE_BUCKETS.packagedPrivate,
        "assets/ast_range/v1/master.m3u8",
        "bytes=100-200",
        { throwOnUnsatisfiable: false },
      );
      expect(unsatisfiable.statusCode).toBe(416);
      expect(unsatisfiable.headers["Content-Range"]).toBe("bytes */36");

      // 5. Unsatisfiable range by default throws HttpRangeError
      await expect(
        readObjectByteRange(
          storage,
          STORAGE_BUCKETS.packagedPrivate,
          "assets/ast_range/v1/master.m3u8",
          "bytes=100-200",
        ),
      ).rejects.toThrow(HttpRangeError);
    });
  });
});
