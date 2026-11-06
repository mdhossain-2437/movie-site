import type { StorageAdapter, StoredObjectMetadata } from "./index.ts";

export class HttpRangeError extends Error {
  readonly status = 416;
  readonly code = "RANGE_NOT_SATISFIABLE";
  readonly totalLength: number;

  constructor(message: string, totalLength: number) {
    super(message);
    this.name = "HttpRangeError";
    this.totalLength = totalLength;
  }
}

export interface ParsedHttpRange {
  start: number;
  end: number;
  contentLength: number;
  isRange: boolean;
}

/**
 * Parses RFC 9110 HTTP Range header against total object byte size.
 * Handles:
 * - null/empty/non-bytes header -> returns null (serve full 200 OK)
 * - "bytes=start-end" -> clamped end, checks start < total
 * - "bytes=start-" -> start to total - 1
 * - "bytes=-suffix" -> last suffix bytes (clamped to 0)
 * Throws HttpRangeError (416) for unsatisfiable ranges.
 */
export function parseHttpByteRange(
  rangeHeader: string | null | undefined,
  totalByteLength: number,
): ParsedHttpRange | null {
  if (!rangeHeader || typeof rangeHeader !== "string") {
    return null;
  }
  const trimmed = rangeHeader.trim();
  if (!trimmed.toLowerCase().startsWith("bytes=")) {
    return null;
  }

  const rangeSpec = trimmed.slice("bytes=".length).trim();
  // Reject multi-range requests with 416 to prevent range amplification attacks
  if (rangeSpec.includes(",")) {
    throw new HttpRangeError("Multiple ranges are not supported", totalByteLength);
  }
  const firstSpec = rangeSpec;
  if (!firstSpec) {
    return null;
  }

  // Case 1: Suffix range "-suffixLength" (e.g. "bytes=-500")
  if (firstSpec.startsWith("-")) {
    const suffixStr = firstSpec.slice(1);
    if (!/^\d+$/.test(suffixStr)) {
      throw new HttpRangeError("Invalid suffix range format", totalByteLength);
    }
    const suffixLength = parseInt(suffixStr, 10);
    if (suffixLength <= 0) {
      throw new HttpRangeError("Suffix length must be greater than 0", totalByteLength);
    }
    if (totalByteLength === 0) {
      throw new HttpRangeError("Cannot satisfy range on empty resource", 0);
    }
    const start = Math.max(0, totalByteLength - suffixLength);
    const end = totalByteLength - 1;
    const contentLength = end - start + 1;
    return {
      start,
      end,
      contentLength,
      isRange: true,
    };
  }

  // Case 2 & 3: "start-end" or "start-"
  const dashIndex = firstSpec.indexOf("-");
  if (dashIndex === -1) {
    throw new HttpRangeError("Missing dash in range specifier", totalByteLength);
  }

  const startStr = firstSpec.slice(0, dashIndex).trim();
  const endStr = firstSpec.slice(dashIndex + 1).trim();

  if (!/^\d+$/.test(startStr)) {
    throw new HttpRangeError("Invalid start byte position", totalByteLength);
  }
  const start = parseInt(startStr, 10);

  if (start >= totalByteLength || totalByteLength === 0) {
    throw new HttpRangeError(
      `Start byte (${start}) exceeds total length (${totalByteLength})`,
      totalByteLength,
    );
  }

  if (endStr === "") {
    // Prefix range "start-"
    const end = totalByteLength - 1;
    const contentLength = end - start + 1;
    return {
      start,
      end,
      contentLength,
      isRange: true,
    };
  }

  if (!/^\d+$/.test(endStr)) {
    throw new HttpRangeError("Invalid end byte position", totalByteLength);
  }
  const rawEnd = parseInt(endStr, 10);

  if (start > rawEnd) {
    throw new HttpRangeError(
      `Inverted range: start (${start}) is greater than end (${rawEnd})`,
      totalByteLength,
    );
  }

  const end = Math.min(rawEnd, totalByteLength - 1);
  const contentLength = end - start + 1;

  return {
    start,
    end,
    contentLength,
    isRange: true,
  };
}

export interface ByteRangeResponse {
  statusCode: 200 | 206 | 416;
  headers: {
    "Accept-Ranges": "bytes";
    "Content-Range"?: string;
    "Content-Length": string;
    "Content-Type": string;
    ETag?: string;
  };
  body?: Uint8Array;
}

export interface ByteRangeReadableStorage {
  headObject(bucket: string, objectKey: string): Promise<StoredObjectMetadata | null>;
  readBytes?(bucket: string, objectKey: string): Promise<Uint8Array | null>;
}

/**
 * Reads an object byte range from storage adapter with 206 Partial Content or 200 OK headers.
 * If range is unsatisfiable and throwOnUnsatisfiable is false, returns status 416.
 */
export async function readObjectByteRange(
  storage: StorageAdapter & {
    readBytes?: (bucket: string, objectKey: string) => Promise<Uint8Array | null>;
  },
  bucket: string,
  objectKey: string,
  rangeHeader?: string | null,
  options?: { throwOnUnsatisfiable?: boolean },
): Promise<ByteRangeResponse> {
  const meta = await storage.headObject(bucket, objectKey);
  if (!meta) {
    throw new Error(`Object not found in storage: ${bucket}/${objectKey}`);
  }

  const totalLength = meta.sizeBytes;
  let parsedRange: ParsedHttpRange | null = null;

  try {
    parsedRange = parseHttpByteRange(rangeHeader, totalLength);
  } catch (error) {
    if (error instanceof HttpRangeError && options?.throwOnUnsatisfiable === false) {
      return {
        statusCode: 416,
        headers: {
          "Accept-Ranges": "bytes",
          "Content-Range": `bytes */${totalLength}`,
          "Content-Length": "0",
          "Content-Type": meta.contentType ?? "application/octet-stream",
          ...(meta.etag ? { ETag: meta.etag } : {}),
        },
      };
    }
    throw error;
  }

  const rawBytes = storage.readBytes ? await storage.readBytes(bucket, objectKey) : null;

  if (parsedRange && parsedRange.isRange) {
    const slice = rawBytes ? rawBytes.subarray(parsedRange.start, parsedRange.end + 1) : undefined;
    return {
      statusCode: 206,
      headers: {
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes ${parsedRange.start}-${parsedRange.end}/${totalLength}`,
        "Content-Length": String(parsedRange.contentLength),
        "Content-Type": meta.contentType ?? "application/octet-stream",
        ...(meta.etag ? { ETag: meta.etag } : {}),
      },
      body: slice,
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": String(totalLength),
      "Content-Type": meta.contentType ?? "application/octet-stream",
      ...(meta.etag ? { ETag: meta.etag } : {}),
    },
    body: rawBytes ?? undefined,
  };
}
