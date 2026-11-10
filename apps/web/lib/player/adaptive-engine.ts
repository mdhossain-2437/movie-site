import type { ResolutionTier } from "@movie/contracts";

export type StreamProtocol = "hls" | "dash" | "mp4" | "canvas";

export const AUTHORIZED_OPEN_STREAMS = {
  hls: {
    label: "HLS ABR · Big Buck Bunny (Blender CC-BY 3.0)",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  },
  dash: {
    label: "DASH 4K ABR · Big Buck Bunny (Blender CC-BY 3.0)",
    url: "https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd",
  },
} as const;

export function detectStreamProtocol(manifestUrl?: string | null): StreamProtocol {
  if (!manifestUrl || typeof manifestUrl !== "string") {
    return "canvas";
  }
  const trimmed = manifestUrl.trim();
  if (
    !trimmed ||
    trimmed.startsWith("cineva://") ||
    trimmed.includes("memory-storage.local") ||
    trimmed.includes(".invalid")
  ) {
    return "canvas";
  }

  const isHttpOrRelativeApi = /^https?:\/\//i.test(trimmed) || trimmed.startsWith("/api/");
  if (!isHttpOrRelativeApi) {
    return "canvas";
  }

  const pathPart = (trimmed.split("?")[0] ?? trimmed).toLowerCase();
  if (pathPart.endsWith(".m3u8") || trimmed.toLowerCase().includes("format=m3u8")) {
    return "hls";
  }
  if (pathPart.endsWith(".mpd") || trimmed.toLowerCase().includes("format=mpd")) {
    return "dash";
  }
  return "mp4";
}

export function resolutionTierToHeight(tier: ResolutionTier): number {
  switch (tier) {
    case "240p":
      return 240;
    case "360p":
      return 360;
    case "480p":
      return 480;
    case "720p":
      return 720;
    case "1080p":
      return 1080;
    case "1440p":
      return 1440;
    case "2160p":
      return 2160;
    default:
      return 1080;
  }
}

export function pickClosestQualityIndex(
  heights: readonly number[],
  targetResolution: ResolutionTier | "AUTO",
): number {
  if (targetResolution === "AUTO" || heights.length === 0) {
    return -1;
  }
  const targetHeight = resolutionTierToHeight(targetResolution);
  let bestIndex = 0;
  let smallestDiff = Number.POSITIVE_INFINITY;

  for (let i = 0; i < heights.length; i++) {
    const h = heights[i] ?? 0;
    if (h <= 0) continue;
    const diff = Math.abs(h - targetHeight);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      bestIndex = i;
    }
  }
  return bestIndex;
}

export function computeBufferedAheadSeconds(
  buffered: TimeRanges | null | undefined,
  currentTime: number,
): number {
  if (!buffered || buffered.length === 0) {
    return 0;
  }
  for (let i = 0; i < buffered.length; i++) {
    const start = buffered.start(i);
    const end = buffered.end(i);
    if (currentTime >= start - 0.5 && currentTime <= end) {
      return Math.max(0, Number((end - currentTime).toFixed(1)));
    }
  }
  return 0;
}
