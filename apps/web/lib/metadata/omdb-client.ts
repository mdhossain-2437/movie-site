import "server-only";

import { getEnv } from "@movie/config";
import { createLogger, redactString } from "@movie/observability";
import {
  isAllowedAmazonPosterUrl,
  normalizeOmdbTitleDetail,
  type OmdbRatings,
  type OmdbRawResponse,
  type OmdbTitleDetail,
} from "@/lib/metadata/omdb-types";

export * from "@/lib/metadata/omdb-types";

const omdbLogger = createLogger({ service: "omdb-metadata-adapter" });
const OMDB_API_ORIGIN = "https://www.omdbapi.com";
const OMDB_TIMEOUT_MS = 5_000;
const OMDB_POSTER_TIMEOUT_MS = 7_000;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_ENTRIES = 500;
const MAX_POSTER_CACHE_ENTRIES = 60;
const MAX_POSTER_BYTES = 5 * 1024 * 1024; // 5 MB

interface DetailCacheEntry {
  expiresAt: number;
  data: OmdbTitleDetail | null;
}

interface PosterCacheEntry {
  expiresAt: number;
  bytes: Uint8Array;
  contentType: string;
}

const detailCache = new Map<string, DetailCacheEntry>();
const posterCache = new Map<string, PosterCacheEntry>();
const posterInflight = new Map<
  string,
  Promise<{ bytes: Uint8Array; contentType: string } | null>
>();

function resolveOmdbApiKey(): string | null {
  let apiKey: string | undefined;
  try {
    const env = getEnv();
    apiKey = env.OMDB_API_KEY || process.env.OMDB_API_KEY;
  } catch {
    apiKey = process.env.OMDB_API_KEY;
  }
  if (!apiKey || typeof apiKey !== "string") {
    return null;
  }
  const trimmed = apiKey.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function fetchOmdbJson(url: URL): Promise<OmdbRawResponse | null> {
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(OMDB_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) {
      omdbLogger.warn("OMDb upstream non-200 response", { statusCode: res.status });
      return null;
    }
    const parsed: unknown = await res.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as OmdbRawResponse;
  } catch (err) {
    omdbLogger.warn("OMDb fetch failed or timed out", {
      error: redactString(err instanceof Error ? err.message : "network_error"),
    });
    return null;
  }
}

export async function getOmdbTitleDetail(
  imdbId?: string | null,
  title?: string | null,
  year?: number | null,
): Promise<OmdbTitleDetail | null> {
  try {
    const apiKey = resolveOmdbApiKey();
    if (!apiKey) {
      return null;
    }

    const cleanImdbId = typeof imdbId === "string" ? imdbId.trim() : "";
    const cleanTitle = typeof title === "string" ? title.trim() : "";
    if (!cleanImdbId && !cleanTitle) {
      return null;
    }

    const validYear =
      typeof year === "number" && Number.isFinite(year) && year >= 1880 && year <= 2100
        ? Math.trunc(year)
        : null;

    const cacheKey = `omdb:${cleanImdbId}:${cleanTitle}:${validYear ?? ""}`;
    const hit = detailCache.get(cacheKey);
    if (hit && Date.now() < hit.expiresAt) {
      return hit.data;
    }

    let raw: OmdbRawResponse | null = null;

    // 1. Primary lookup by IMDb ID
    if (cleanImdbId && /^tt\d{7,10}$/i.test(cleanImdbId)) {
      const url = new URL(OMDB_API_ORIGIN);
      url.searchParams.set("apikey", apiKey);
      url.searchParams.set("i", cleanImdbId);
      url.searchParams.set("plot", "full");
      raw = await fetchOmdbJson(url);
    }

    // 2. Fallback lookup by Title and Year
    if ((!raw || raw.Response !== "True") && cleanTitle) {
      const url = new URL(OMDB_API_ORIGIN);
      url.searchParams.set("apikey", apiKey);
      url.searchParams.set("t", cleanTitle);
      if (validYear !== null) {
        url.searchParams.set("y", String(validYear));
      }
      url.searchParams.set("plot", "full");
      raw = await fetchOmdbJson(url);
    }

    const normalized = raw ? normalizeOmdbTitleDetail(raw) : null;

    if (detailCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = detailCache.keys().next().value;
      if (oldestKey) detailCache.delete(oldestKey);
    }
    detailCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      data: normalized,
    });

    return normalized;
  } catch (err) {
    omdbLogger.warn("OMDb detail client unexpected error", {
      error: redactString(err instanceof Error ? err.message : "unknown_error"),
    });
    return null;
  }
}

export async function getOmdbRatings(
  imdbId?: string | null,
  title?: string | null,
  year?: number | null,
): Promise<OmdbRatings | null> {
  try {
    const detail = await getOmdbTitleDetail(imdbId, title, year);
    if (!detail) return null;

    if (!detail.imdbRating && !detail.imdbVotes && !detail.metascore && !detail.rottenTomatoes) {
      return null;
    }

    return {
      imdbRating: detail.imdbRating,
      imdbVotes: detail.imdbVotes,
      metascore: detail.metascore,
      rottenTomatoes: detail.rottenTomatoes,
    };
  } catch (err) {
    omdbLogger.warn("OMDb ratings client unexpected error", {
      error: redactString(err instanceof Error ? err.message : "unknown_error"),
    });
    return null;
  }
}

export async function fetchOmdbPosterBytesByImdbId(
  imdbId: string,
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  if (typeof imdbId !== "string") return null;
  const cleanId = imdbId.trim();
  if (!/^tt\d{7,10}$/i.test(cleanId)) {
    return null;
  }

  const cached = posterCache.get(cleanId);
  if (cached && Date.now() < cached.expiresAt) {
    return { bytes: cached.bytes, contentType: cached.contentType };
  }

  const inflight = posterInflight.get(cleanId);
  if (inflight) {
    return inflight;
  }

  const task = (async (): Promise<{ bytes: Uint8Array; contentType: string } | null> => {
    try {
      const detail = await getOmdbTitleDetail(cleanId);
      if (!detail?.posterUrl || !isAllowedAmazonPosterUrl(detail.posterUrl)) {
        return null;
      }

      const upstream = await fetch(detail.posterUrl, {
        method: "GET",
        redirect: "error",
        signal: AbortSignal.timeout(OMDB_POSTER_TIMEOUT_MS),
      });
      if (!upstream.ok) {
        return null;
      }

      const contentType = (upstream.headers.get("content-type") ?? "image/jpeg")
        .split(";")[0]!
        .trim();
      if (!contentType.startsWith("image/")) {
        return null;
      }

      const buffer = await upstream.arrayBuffer();
      if (buffer.byteLength === 0 || buffer.byteLength > MAX_POSTER_BYTES) {
        return null;
      }

      const bytes = new Uint8Array(buffer);
      if (posterCache.size >= MAX_POSTER_CACHE_ENTRIES) {
        const oldestKey = posterCache.keys().next().value;
        if (oldestKey) posterCache.delete(oldestKey);
      }
      posterCache.set(cleanId, {
        expiresAt: Date.now() + CACHE_TTL_MS,
        bytes,
        contentType,
      });

      return { bytes, contentType };
    } catch (err) {
      omdbLogger.warn("OMDb poster proxy fetch failed", {
        imdbId: cleanId,
        error: redactString(err instanceof Error ? err.message : "poster_fetch_error"),
      });
      return null;
    } finally {
      posterInflight.delete(cleanId);
    }
  })();

  posterInflight.set(cleanId, task);
  return task;
}

export function clearOmdbCache(): void {
  detailCache.clear();
  posterCache.clear();
  posterInflight.clear();
}
