import { describe, expect, it } from "vitest";
import {
  HttpRangeError,
  InMemoryStorageAdapter,
  parseHttpByteRange,
  readObjectByteRange,
  STORAGE_BUCKETS,
} from "./index.ts";

describe("Empirical Challenger: RFC 9110 HTTP Range Serving Stress Suite", () => {
  describe("1. Prefix Ranges (bytes=start-)", () => {
    it("satisfies standard prefix range starting at 0", () => {
      const res = parseHttpByteRange("bytes=0-", 100);
      expect(res).toEqual({ start: 0, end: 99, contentLength: 100, isRange: true });
    });

    it("satisfies prefix range starting mid-resource", () => {
      const res = parseHttpByteRange("bytes=50-", 100);
      expect(res).toEqual({ start: 50, end: 99, contentLength: 50, isRange: true });
    });

    it("satisfies prefix range on the final byte", () => {
      const res = parseHttpByteRange("bytes=99-", 100);
      expect(res).toEqual({ start: 99, end: 99, contentLength: 1, isRange: true });
    });

    it("satisfies prefix range on single-byte resource", () => {
      const res = parseHttpByteRange("bytes=0-", 1);
      expect(res).toEqual({ start: 0, end: 0, contentLength: 1, isRange: true });
    });

    it("rejects prefix range on empty resource (totalByteLength=0) with 416", () => {
      expect(() => parseHttpByteRange("bytes=0-", 0)).toThrow(HttpRangeError);
      try {
        parseHttpByteRange("bytes=0-", 0);
      } catch (err) {
        expect((err as HttpRangeError).status).toBe(416);
        expect((err as HttpRangeError).totalLength).toBe(0);
      }
    });

    it("rejects prefix range where start is out of bounds (start >= total) with 416", () => {
      expect(() => parseHttpByteRange("bytes=100-", 100)).toThrow(HttpRangeError);
      expect(() => parseHttpByteRange("bytes=500-", 100)).toThrow(HttpRangeError);
    });
  });

  describe("2. Suffix Ranges (bytes=-suffix)", () => {
    it("satisfies suffix range for last N bytes", () => {
      const res = parseHttpByteRange("bytes=-100", 1000);
      expect(res).toEqual({ start: 900, end: 999, contentLength: 100, isRange: true });
    });

    it("satisfies suffix range for last 1 byte", () => {
      const res = parseHttpByteRange("bytes=-1", 1000);
      expect(res).toEqual({ start: 999, end: 999, contentLength: 1, isRange: true });
    });

    it("satisfies suffix range exactly matching file size", () => {
      const res = parseHttpByteRange("bytes=-1000", 1000);
      expect(res).toEqual({ start: 0, end: 999, contentLength: 1000, isRange: true });
    });

    it("clamps suffix range larger than file size to start at 0 per RFC 9110", () => {
      const res = parseHttpByteRange("bytes=-5000", 1000);
      expect(res).toEqual({ start: 0, end: 999, contentLength: 1000, isRange: true });
    });

    it("rejects zero-length suffix (bytes=-0) with 416", () => {
      expect(() => parseHttpByteRange("bytes=-0", 1000)).toThrow(HttpRangeError);
      try {
        parseHttpByteRange("bytes=-0", 1000);
      } catch (err) {
        expect((err as HttpRangeError).status).toBe(416);
      }
    });

    it("rejects negative suffix (bytes=--50) with 416", () => {
      expect(() => parseHttpByteRange("bytes=--50", 1000)).toThrow(HttpRangeError);
    });

    it("rejects suffix range on empty file (total=0) with 416", () => {
      expect(() => parseHttpByteRange("bytes=-100", 0)).toThrow(HttpRangeError);
    });
  });

  describe("3. Bounded Ranges (bytes=start-end)", () => {
    it("satisfies bounded range within bounds (e.g. bytes=10-20)", () => {
      const res = parseHttpByteRange("bytes=10-20", 100);
      expect(res).toEqual({ start: 10, end: 20, contentLength: 11, isRange: true });
    });

    it("satisfies single-byte bounded range (e.g. bytes=0-0)", () => {
      const res = parseHttpByteRange("bytes=0-0", 100);
      expect(res).toEqual({ start: 0, end: 0, contentLength: 1, isRange: true });
    });

    it("satisfies full resource via bounded range (e.g. bytes=0-99 on 100)", () => {
      const res = parseHttpByteRange("bytes=0-99", 100);
      expect(res).toEqual({ start: 0, end: 99, contentLength: 100, isRange: true });
    });

    it("clamps end if end exceeds totalByteLength - 1 per RFC 9110", () => {
      const res = parseHttpByteRange("bytes=50-500", 100);
      expect(res).toEqual({ start: 50, end: 99, contentLength: 50, isRange: true });
    });

    it("rejects inverted range (start > end, e.g. bytes=20-10) with 416", () => {
      expect(() => parseHttpByteRange("bytes=20-10", 100)).toThrow(HttpRangeError);
      try {
        parseHttpByteRange("bytes=20-10", 100);
      } catch (err) {
        expect((err as HttpRangeError).status).toBe(416);
        expect((err as HttpRangeError).message).toContain("Inverted range");
      }
    });

    it("rejects out-of-bounds start (start >= total, e.g. bytes=100-120 on 100) with 416", () => {
      expect(() => parseHttpByteRange("bytes=100-120", 100)).toThrow(HttpRangeError);
      expect(() => parseHttpByteRange("bytes=200-300", 100)).toThrow(HttpRangeError);
    });
  });

  describe("4. Empty Files (totalByteLength=0)", () => {
    it("rejects bounded range on empty file with 416", () => {
      expect(() => parseHttpByteRange("bytes=0-0", 0)).toThrow(HttpRangeError);
    });

    it("rejects prefix range on empty file with 416", () => {
      expect(() => parseHttpByteRange("bytes=0-", 0)).toThrow(HttpRangeError);
    });

    it("rejects suffix range on empty file with 416", () => {
      expect(() => parseHttpByteRange("bytes=-1", 0)).toThrow(HttpRangeError);
    });

    it("returns null for non-range requests on empty file (permitting 200 OK empty response)", () => {
      expect(parseHttpByteRange(null, 0)).toBeNull();
      expect(parseHttpByteRange(undefined, 0)).toBeNull();
      expect(parseHttpByteRange("", 0)).toBeNull();
    });
  });

  describe("5. Malformed, Non-Numeric, and Edge Case Headers", () => {
    it("returns null for non-bytes unit or invalid headers (server serves full 200)", () => {
      expect(parseHttpByteRange("items=0-10", 100)).toBeNull();
      expect(parseHttpByteRange("seconds=0-10", 100)).toBeNull();
      expect(parseHttpByteRange("unknown", 100)).toBeNull();
      expect(parseHttpByteRange("   ", 100)).toBeNull();
    });

    it("rejects non-numeric start in range header with 416", () => {
      expect(() => parseHttpByteRange("bytes=abc-20", 100)).toThrow(HttpRangeError);
      expect(() => parseHttpByteRange("bytes=1a-20", 100)).toThrow(HttpRangeError);
      expect(() => parseHttpByteRange("bytes=1.5-20", 100)).toThrow(HttpRangeError);
    });

    it("rejects non-numeric end in range header with 416", () => {
      expect(() => parseHttpByteRange("bytes=10-xyz", 100)).toThrow(HttpRangeError);
      expect(() => parseHttpByteRange("bytes=10-2b", 100)).toThrow(HttpRangeError);
      expect(() => parseHttpByteRange("bytes=10-20.5", 100)).toThrow(HttpRangeError);
    });

    it("rejects non-numeric suffix with 416", () => {
      expect(() => parseHttpByteRange("bytes=-foo", 100)).toThrow(HttpRangeError);
      expect(() => parseHttpByteRange("bytes=-12.3", 100)).toThrow(HttpRangeError);
    });

    it("rejects range without dash with 416", () => {
      expect(() => parseHttpByteRange("bytes=50", 100)).toThrow(HttpRangeError);
    });

    it("returns null on empty byte specifier (bytes=)", () => {
      expect(parseHttpByteRange("bytes=", 100)).toBeNull();
    });

    it("rejects multi-range header with 416 (defense against range amplification)", () => {
      expect(() => parseHttpByteRange("bytes=10-20, 30-40, 50-60", 100)).toThrow(HttpRangeError);
      try {
        parseHttpByteRange("bytes=10-20, 30-40, 50-60", 100);
      } catch (err) {
        expect(err).toBeInstanceOf(HttpRangeError);
        expect((err as HttpRangeError).status).toBe(416);
        expect((err as HttpRangeError).totalLength).toBe(100);
      }
    });
  });

  describe("6. Storage Read Integration (readObjectByteRange)", () => {
    it("serves partial content 206 with correct sliced bytes and headers", async () => {
      const storage = new InMemoryStorageAdapter();
      const content = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
      await storage.putDirectObject(
        STORAGE_BUCKETS.packagedPrivate,
        "media/test-stream.mp4",
        content,
        "video/mp4",
      );

      // Bounded range 4-8 (5 bytes: [4, 5, 6, 7, 8])
      const res = await readObjectByteRange(
        storage,
        STORAGE_BUCKETS.packagedPrivate,
        "media/test-stream.mp4",
        "bytes=4-8",
      );
      expect(res.statusCode).toBe(206);
      expect(res.headers["Content-Range"]).toBe("bytes 4-8/16");
      expect(res.headers["Content-Length"]).toBe("5");
      expect(res.headers["Accept-Ranges"]).toBe("bytes");
      expect(res.headers["Content-Type"]).toBe("video/mp4");
      expect(res.body).toEqual(new Uint8Array([4, 5, 6, 7, 8]));
    });

    it("returns 416 with throwOnUnsatisfiable: false", async () => {
      const storage = new InMemoryStorageAdapter();
      const content = new Uint8Array([1, 2, 3]);
      await storage.putDirectObject(
        STORAGE_BUCKETS.packagedPrivate,
        "media/tiny.bin",
        content,
        "application/octet-stream",
      );

      const res = await readObjectByteRange(
        storage,
        STORAGE_BUCKETS.packagedPrivate,
        "media/tiny.bin",
        "bytes=10-20",
        { throwOnUnsatisfiable: false },
      );
      expect(res.statusCode).toBe(416);
      expect(res.headers["Content-Range"]).toBe("bytes */3");
      expect(res.headers["Content-Length"]).toBe("0");
      expect(res.headers["Accept-Ranges"]).toBe("bytes");
      expect(res.body).toBeUndefined();
    });

    it("serves full 200 OK when rangeHeader is absent", async () => {
      const storage = new InMemoryStorageAdapter();
      const content = new Uint8Array([10, 20, 30]);
      await storage.putDirectObject(
        STORAGE_BUCKETS.packagedPrivate,
        "media/full.bin",
        content,
        "application/octet-stream",
      );

      const res = await readObjectByteRange(
        storage,
        STORAGE_BUCKETS.packagedPrivate,
        "media/full.bin",
      );
      expect(res.statusCode).toBe(200);
      expect(res.headers["Content-Length"]).toBe("3");
      expect(res.headers["Content-Range"]).toBeUndefined();
      expect(res.body).toEqual(content);
    });
  });
});
