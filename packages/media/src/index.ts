import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import type { ResolutionTier } from "@movie/contracts";

const execFileAsync = promisify(execFile);

export const MEDIA_PROFILE_VERSION = "2026-11-06.cmaf-v1";

export const RESOLUTION_HEIGHT_MAP: Readonly<Record<ResolutionTier, number>> = {
  "240p": 240,
  "360p": 360,
  "480p": 480,
  "720p": 720,
  "1080p": 1080,
  "1440p": 1440,
  "2160p": 2160,
};

export interface AbrProfileDefinition {
  id: string;
  resolution: ResolutionTier;
  width: number;
  height: number;
  videoCodec: string;
  audioCodec: string;
  targetBitrateKbps: number;
  segmentDurationSeconds: number;
}

export const ABR_LADDER_PROFILES: readonly AbrProfileDefinition[] = [
  {
    id: "cmaf-360p-avc",
    resolution: "360p",
    width: 640,
    height: 360,
    videoCodec: "avc1.4d401e",
    audioCodec: "mp4a.40.2",
    targetBitrateKbps: 800,
    segmentDurationSeconds: 4,
  },
  {
    id: "cmaf-480p-avc",
    resolution: "480p",
    width: 854,
    height: 480,
    videoCodec: "avc1.4d401f",
    audioCodec: "mp4a.40.2",
    targetBitrateKbps: 1400,
    segmentDurationSeconds: 4,
  },
  {
    id: "cmaf-720p-avc",
    resolution: "720p",
    width: 1280,
    height: 720,
    videoCodec: "avc1.64001f",
    audioCodec: "mp4a.40.2",
    targetBitrateKbps: 2800,
    segmentDurationSeconds: 4,
  },
  {
    id: "cmaf-1080p-avc",
    resolution: "1080p",
    width: 1920,
    height: 1080,
    videoCodec: "avc1.640028",
    audioCodec: "mp4a.40.2",
    targetBitrateKbps: 5200,
    segmentDurationSeconds: 4,
  },
  {
    id: "cmaf-2160p-hevc",
    resolution: "2160p",
    width: 3840,
    height: 2160,
    videoCodec: "hvc1.1.6.L150.90",
    audioCodec: "mp4a.40.2",
    targetBitrateKbps: 14000,
    segmentDurationSeconds: 4,
  },
] as const;

export function filterRenditionsByMaxResolution<T extends { resolution: ResolutionTier }>(
  renditions: readonly T[],
  maxResolution: ResolutionTier,
): T[] {
  const maxHeight = RESOLUTION_HEIGHT_MAP[maxResolution];
  return renditions.filter((item) => RESOLUTION_HEIGHT_MAP[item.resolution] <= maxHeight);
}

export class MediaProbeError extends Error {
  readonly code:
    | "UNSAFE_INPUT_PATH"
    | "UNSUPPORTED_SIGNATURE"
    | "MALICIOUS_PAYLOAD_SIGNATURE"
    | "PROBE_TIMEOUT_OR_EXEC_FAILED"
    | "INVALID_MANIFEST";

  constructor(code: MediaProbeError["code"], message: string) {
    super(message);
    this.name = "MediaProbeError";
    this.code = code;
  }
}

export interface MediaProbeResult {
  containerFormat: "mp4" | "webm" | "vtt";
  brandOrProfile: string;
  durationSeconds: number | null;
  videoCodec: string | null;
  audioCodec: string | null;
  width: number | null;
  height: number | null;
  probeEngine: string;
}

/**
 * Deterministic magic-byte signature inspector for quarantined uploads.
 * Rejects executables, scripts, and HTML/SVG polyglot payloads before any native parser runs.
 */
export function probeMediaHeaderBytes(bytes: Uint8Array): MediaProbeResult {
  if (bytes.byteLength < 6) {
    throw new MediaProbeError(
      "UNSUPPORTED_SIGNATURE",
      "Quarantined file is too small to contain a valid media container header",
    );
  }

  // Block Windows PE ("MZ"), ELF ("\x7FELF"), Shebang ("#!"), and HTML/SVG/script smuggling
  if (
    (bytes[0] === 0x4d && bytes[1] === 0x5a) ||
    (bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46) ||
    (bytes[0] === 0x23 && bytes[1] === 0x21)
  ) {
    throw new MediaProbeError(
      "MALICIOUS_PAYLOAD_SIGNATURE",
      "Executable binary or script signature rejected in quarantine",
    );
  }

  const asciiPrefix = Buffer.from(bytes.subarray(0, Math.min(bytes.byteLength, 64)))
    .toString("utf8")
    .trimStart()
    .toLowerCase();

  if (
    asciiPrefix.startsWith("<!doctype") ||
    asciiPrefix.startsWith("<html") ||
    asciiPrefix.startsWith("<script") ||
    asciiPrefix.startsWith("<svg")
  ) {
    throw new MediaProbeError(
      "MALICIOUS_PAYLOAD_SIGNATURE",
      "Active markup payload rejected in media quarantine",
    );
  }

  // WebVTT subtitle signature ("WEBVTT")
  const rawUtf8Start = Buffer.from(bytes.subarray(0, Math.min(bytes.byteLength, 16)))
    .toString("utf8")
    .replace(/^\uFEFF/, "");
  if (rawUtf8Start.startsWith("WEBVTT")) {
    return {
      containerFormat: "vtt",
      brandOrProfile: "WEBVTT",
      durationSeconds: null,
      videoCodec: null,
      audioCodec: null,
      width: null,
      height: null,
      probeEngine: "header-signature-v1",
    };
  }

  // ISO-BMFF (MP4 / CMAF / MOV): bytes 4..7 === "ftyp"
  if (
    bytes.byteLength >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    const majorBrand = Buffer.from(bytes.subarray(8, 12))
      .toString("ascii")
      .replace(/[^\x20-\x7E]/g, "")
      .trim();
    return {
      containerFormat: "mp4",
      brandOrProfile: majorBrand || "isom",
      durationSeconds: null,
      videoCodec: null,
      audioCodec: null,
      width: null,
      height: null,
      probeEngine: "header-signature-v1",
    };
  }

  // Matroska / WebM EBML header: 0x1A 0x45 0xDF 0xA3
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return {
      containerFormat: "webm",
      brandOrProfile: "ebml-webm",
      durationSeconds: null,
      videoCodec: null,
      audioCodec: null,
      width: null,
      height: null,
      probeEngine: "header-signature-v1",
    };
  }

  throw new MediaProbeError(
    "UNSUPPORTED_SIGNATURE",
    "Unrecognized media container magic bytes; only ISO-BMFF MP4/CMAF, WebM, and WebVTT are accepted",
  );
}

const FORBIDDEN_FFPROBE_PROTOCOLS =
  /^(https?|rtmps?|rtsp|tcp|udp|ftp|sftp|file|concat|subfile|data|pipe|fd):/i;

export function assertSafeLocalProbePath(localFilePath: string): string {
  if (!localFilePath || localFilePath.includes("\0")) {
    throw new MediaProbeError("UNSAFE_INPUT_PATH", "Probe file path must be non-empty without NUL");
  }
  const trimmed = localFilePath.trim();
  if (trimmed.startsWith("-")) {
    throw new MediaProbeError(
      "UNSAFE_INPUT_PATH",
      "Probe file path cannot start with a CLI option dash",
    );
  }
  if (FORBIDDEN_FFPROBE_PROTOCOLS.test(trimmed) || trimmed.includes("://")) {
    throw new MediaProbeError(
      "UNSAFE_INPUT_PATH",
      "Remote URLs and FFmpeg protocol prefixes are strictly prohibited in media probing (SSRF defense)",
    );
  }
  if (/[;&|`$<>]/.test(trimmed)) {
    throw new MediaProbeError(
      "UNSAFE_INPUT_PATH",
      "Shell metacharacters are forbidden in probe file paths",
    );
  }
  return path.resolve(trimmed);
}

export interface FfprobeAdapterOptions {
  ffprobeBinaryPath?: string;
  timeoutMs?: number;
  maxBufferBytes?: number;
}

/**
 * Isolated `execFile` wrapper for `ffprobe` (Blueprint §13, §41).
 * Never invokes a shell, blocks network/concat protocols, bounds execution time and buffer size.
 */
export class FfprobeExecFileAdapter {
  private readonly binaryPath: string;
  private readonly timeoutMs: number;
  private readonly maxBufferBytes: number;

  constructor(options?: FfprobeAdapterOptions) {
    this.binaryPath = options?.ffprobeBinaryPath ?? "ffprobe";
    this.timeoutMs = options?.timeoutMs ?? 15_000;
    this.maxBufferBytes = options?.maxBufferBytes ?? 2 * 1024 * 1024;
  }

  async probeLocalFile(localFilePath: string): Promise<MediaProbeResult> {
    const safePath = assertSafeLocalProbePath(localFilePath);

    let stdout: string;
    try {
      const res = await execFileAsync(
        this.binaryPath,
        [
          "-v",
          "error",
          "-protocol_whitelist",
          "file",
          "-show_format",
          "-show_streams",
          "-of",
          "json",
          "--",
          safePath,
        ],
        {
          timeout: this.timeoutMs,
          maxBuffer: this.maxBufferBytes,
          windowsHide: true,
          shell: false,
        },
      );
      stdout = res.stdout;
    } catch (err) {
      throw new MediaProbeError(
        "PROBE_TIMEOUT_OR_EXEC_FAILED",
        err instanceof Error ? `ffprobe execution failed: ${err.message}` : "ffprobe failed",
      );
    }

    const parsed = JSON.parse(stdout) as {
      format?: { format_name?: string; duration?: string };
      streams?: Array<{
        codec_type?: string;
        codec_name?: string;
        width?: number;
        height?: number;
      }>;
    };

    const formatName = (parsed.format?.format_name ?? "").toLowerCase();
    const containerFormat: MediaProbeResult["containerFormat"] = formatName.includes("webm")
      ? "webm"
      : formatName.includes("webvtt")
        ? "vtt"
        : "mp4";

    const durationNum = parsed.format?.duration ? Number(parsed.format.duration) : Number.NaN;
    const videoStream = parsed.streams?.find((s) => s.codec_type === "video");
    const audioStream = parsed.streams?.find((s) => s.codec_type === "audio");

    return {
      containerFormat,
      brandOrProfile: formatName || "ffprobe-verified",
      durationSeconds:
        Number.isFinite(durationNum) && durationNum > 0 ? Math.round(durationNum) : null,
      videoCodec: videoStream?.codec_name ?? null,
      audioCodec: audioStream?.codec_name ?? null,
      width: videoStream?.width ?? null,
      height: videoStream?.height ?? null,
      probeEngine: "ffprobe-execfile-v1",
    };
  }
}

export interface ValidatedHlsVariant {
  bandwidth: number;
  width: number;
  height: number;
  uri: string;
}

export function validateHlsMasterManifest(manifestText: string): {
  valid: true;
  variants: ValidatedHlsVariant[];
} {
  const lines = manifestText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines[0] !== "#EXTM3U") {
    throw new MediaProbeError("INVALID_MANIFEST", "HLS manifest must start with #EXTM3U");
  }

  const variants: ValidatedHlsVariant[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (line.startsWith("#EXT-X-KEY:")) {
      const uriMatch = /URI="([^"]+)"/.exec(line);
      if (uriMatch?.[1] && /^(https?:)?\/\//i.test(uriMatch[1])) {
        throw new MediaProbeError(
          "INVALID_MANIFEST",
          "External unverified key server URI rejected in manifest validation",
        );
      }
    }

    if (line.startsWith("#EXT-X-STREAM-INF:")) {
      const nextLine = lines[i + 1];
      if (!nextLine || nextLine.startsWith("#")) {
        throw new MediaProbeError(
          "INVALID_MANIFEST",
          "#EXT-X-STREAM-INF must be followed by a relative rendition playlist URI",
        );
      }

      if (
        /^(https?:)?\/\//i.test(nextLine) ||
        nextLine.includes("..") ||
        nextLine.startsWith("/")
      ) {
        throw new MediaProbeError(
          "INVALID_MANIFEST",
          "Manifest variant URIs must be relative packaged paths without external URLs or '..' traversal",
        );
      }

      const bwMatch = /BANDWIDTH=(\d+)/.exec(line);
      const resMatch = /RESOLUTION=(\d+)x(\d+)/.exec(line);
      if (!bwMatch || !resMatch) {
        throw new MediaProbeError(
          "INVALID_MANIFEST",
          "#EXT-X-STREAM-INF requires explicit BANDWIDTH and RESOLUTION attributes",
        );
      }

      variants.push({
        bandwidth: Number(bwMatch[1]),
        width: Number(resMatch[1]),
        height: Number(resMatch[2]),
        uri: nextLine,
      });
      i += 1;
    }
  }

  if (variants.length === 0) {
    throw new MediaProbeError(
      "INVALID_MANIFEST",
      "HLS master manifest must declare at least one #EXT-X-STREAM-INF variant",
    );
  }

  return { valid: true, variants };
}

export * from "./capacity.ts";
