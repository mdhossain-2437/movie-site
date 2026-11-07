import "server-only";

import { assertTmdbCommercialUseAllowed, getEnv } from "@movie/config";
import { computeBayesianTopScore } from "@movie/domain";
import { createLogger, redactString } from "@movie/observability";
import {
  ALLOWED_TMDB_IMAGE_SIZES,
  buildDeterministicArtSpecForTmdbId,
  TMDB_GENRE_PRESETS,
  TMDB_OFFICIAL_ATTRIBUTION,
  TMDB_STUDIO_PRESETS,
  toSameOriginTmdbImagePath,
  type TmdbCatalogItem,
  type TmdbCreditSummary,
  type TmdbEpisodeItem,
  type TmdbImageSize,
  type TmdbMediaKind,
  type TmdbPersonDetail,
  type TmdbPersonHit,
  type TmdbRecommendationItem,
  type TmdbSeasonSummary,
  type TmdbWorkDetail,
} from "./tmdb-types";

const tmdbLogger = createLogger({ service: "tmdb-metadata-adapter" });

const TMDB_API_ORIGIN = "https://api.themoviedb.org";
const TMDB_IMAGE_ORIGIN = "https://image.tmdb.org";
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 250;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const SAFE_TMDB_FILENAME_RE = /^[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i;

const TMDB_GENRE_ID_NAME_MAP: Readonly<Record<number, string>> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

const jsonCache = new Map<string, CacheEntry<unknown>>();

function readCache<T>(key: string): T | null {
  const hit = jsonCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    jsonCache.delete(key);
    return null;
  }
  return hit.value as T;
}

function writeCache<T>(key: string, value: T): void {
  if (jsonCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = jsonCache.keys().next().value;
    if (oldestKey) {
      jsonCache.delete(oldestKey);
    }
  }
  jsonCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value,
  });
}

export class TmdbAdapterError extends Error {
  readonly code: "TMDB_UNCONFIGURED" | "TMDB_LICENSE_BLOCKED" | "TMDB_UPSTREAM_ERROR" | "NOT_FOUND";
  readonly status: number;

  constructor(
    code: "TMDB_UNCONFIGURED" | "TMDB_LICENSE_BLOCKED" | "TMDB_UPSTREAM_ERROR" | "NOT_FOUND",
    message: string,
    status: number,
  ) {
    super(redactString(message));
    this.name = "TmdbAdapterError";
    this.code = code;
    this.status = status;
  }
}

export interface TmdbRuntimeStatus {
  configured: boolean;
  commercialApproved: boolean;
  attributionText: string;
}

export function getTmdbRuntimeStatus(): TmdbRuntimeStatus {
  const env = getEnv();
  const effectiveStage = env.APP_ENV ?? env.NODE_ENV;
  const hasCredentials = Boolean(env.TMDB_READ_ACCESS_TOKEN || env.TMDB_API_KEY);
  const blockedByCommercialGate =
    effectiveStage === "production" && !env.TMDB_COMMERCIAL_LICENSE_CONFIRMED;

  return {
    configured: hasCredentials && !blockedByCommercialGate,
    commercialApproved: env.TMDB_COMMERCIAL_LICENSE_CONFIRMED,
    attributionText: TMDB_OFFICIAL_ATTRIBUTION,
  };
}

function resolveTmdbAuthHeadersAndParams(): {
  headers: Record<string, string>;
  apiKeyParam?: string;
} {
  const env = getEnv();
  const effectiveStage = env.APP_ENV ?? env.NODE_ENV;
  if (!env.TMDB_READ_ACCESS_TOKEN && !env.TMDB_API_KEY) {
    throw new TmdbAdapterError(
      "TMDB_UNCONFIGURED",
      "TMDB credentials are not configured on the server",
      503,
    );
  }

  try {
    assertTmdbCommercialUseAllowed(env, {
      isCommercialDeployment: effectiveStage === "production",
    });
  } catch (err) {
    throw new TmdbAdapterError(
      "TMDB_LICENSE_BLOCKED",
      err instanceof Error ? err.message : "TMDB commercial license gate blocked request",
      403,
    );
  }

  if (env.TMDB_READ_ACCESS_TOKEN) {
    return {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${env.TMDB_READ_ACCESS_TOKEN}`,
      },
    };
  }

  return {
    headers: { Accept: "application/json" },
    apiKeyParam: env.TMDB_API_KEY,
  };
}

async function tmdbGetJson<T>(
  endpointPath: string,
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<T> {
  if (!endpointPath.startsWith("/3/") || endpointPath.includes("..")) {
    throw new TmdbAdapterError("TMDB_UPSTREAM_ERROR", "Invalid TMDB endpoint path", 400);
  }

  const auth = resolveTmdbAuthHeadersAndParams();
  const url = new URL(endpointPath, TMDB_API_ORIGIN);
  url.searchParams.set("include_adult", "false");
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") {
      url.searchParams.set(k, String(v));
    }
  }

  const cacheKey = url.pathname + "?" + url.searchParams.toString();
  const cached = readCache<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  if (auth.apiKeyParam) {
    url.searchParams.set("api_key", auth.apiKeyParam);
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      headers: auth.headers,
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
  } catch (err) {
    tmdbLogger.warn("TMDB upstream network failure", {
      action: "tmdb_fetch",
      endpoint: endpointPath,
      error: err instanceof Error ? err.message : "network_error",
    });
    throw new TmdbAdapterError("TMDB_UPSTREAM_ERROR", "Unable to reach TMDB metadata service", 502);
  }

  if (response.status === 404) {
    throw new TmdbAdapterError("NOT_FOUND", "Requested TMDB entry was not found", 404);
  }

  if (!response.ok) {
    tmdbLogger.warn("TMDB upstream non-200 status", {
      action: "tmdb_fetch",
      endpoint: endpointPath,
      statusCode: response.status,
    });
    throw new TmdbAdapterError(
      "TMDB_UPSTREAM_ERROR",
      `TMDB metadata service returned HTTP ${response.status}`,
      502,
    );
  }

  const payload = (await response.json()) as T;
  writeCache(cacheKey, payload);
  return payload;
}

interface RawTmdbListEntry {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  original_language?: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
  genres?: Array<{ id: number; name: string }>;
  poster_path?: string | null;
  backdrop_path?: string | null;
}

function parseReleaseYear(dateStr: string | undefined | null): number | null {
  if (!dateStr || dateStr.length < 4) return null;
  const yr = Number.parseInt(dateStr.slice(0, 4), 10);
  return Number.isFinite(yr) && yr >= 1880 && yr <= 2100 ? yr : null;
}

function normalizeCatalogItem(
  raw: RawTmdbListEntry,
  fallbackKind: TmdbMediaKind = "movie",
): TmdbCatalogItem | null {
  if (!raw || typeof raw.id !== "number") return null;
  if (raw.media_type === "person") return null;

  const mediaKind: TmdbMediaKind =
    raw.media_type === "tv" ? "tv" : raw.media_type === "movie" ? "movie" : fallbackKind;
  const title = (raw.title ?? raw.name ?? "").trim();
  if (!title) return null;

  const originalTitle = (raw.original_title ?? raw.original_name ?? title).trim();
  const releaseDate = (raw.release_date ?? raw.first_air_date ?? null) || null;
  const releaseYear = parseReleaseYear(releaseDate);
  const voteAverage = Number((raw.vote_average ?? 0).toFixed(1));
  const voteCount = Math.max(0, Math.trunc(raw.vote_count ?? 0));
  const bayesianScore = computeBayesianTopScore(voteAverage, voteCount, 7.2, 600);

  const genreLabels = raw.genres
    ? raw.genres.map((g) => g.name)
    : (raw.genre_ids ?? [])
        .map((gid) => TMDB_GENRE_ID_NAME_MAP[gid])
        .filter((g): g is string => Boolean(g));

  return {
    tmdbId: raw.id,
    mediaKind,
    kind: mediaKind === "tv" ? "SERIES" : "MOVIE",
    title,
    originalTitle,
    originalLanguage: (raw.original_language ?? "en").toLowerCase(),
    releaseYear,
    releaseDate,
    synopsis: (raw.overview ?? "").trim() || "Official synopsis pending metadata update.",
    voteAverage,
    voteCount,
    bayesianScore,
    popularity: Number((raw.popularity ?? 0).toFixed(1)),
    genreLabels: genreLabels.slice(0, 4),
    posterUrl: toSameOriginTmdbImagePath(raw.poster_path, "w500"),
    backdropUrl: toSameOriginTmdbImagePath(raw.backdrop_path, "w1280"),
    fallbackArt: buildDeterministicArtSpecForTmdbId(raw.id),
    detailHref: `/tmdb/${mediaKind}/${raw.id}`,
  };
}

export interface DiscoverTmdbOptions {
  mode?: "trending" | "top_rated" | "discover" | "search";
  kind?: "ALL" | "MOVIE" | "SERIES";
  studio?: string;
  genre?: string;
  personId?: number;
  language?: string;
  sort?: "popularity.desc" | "vote_average.desc" | "release_date.desc" | "revenue.desc";
  query?: string;
  page?: number;
  limit?: number;
}

export async function discoverTmdbWorks(options: DiscoverTmdbOptions = {}): Promise<{
  items: TmdbCatalogItem[];
  page: number;
  totalPages: number;
  totalResults: number;
}> {
  const page = Math.min(20, Math.max(1, Math.trunc(options.page ?? 1)));
  const limit = Math.min(40, Math.max(1, Math.trunc(options.limit ?? 20)));
  const query = options.query?.trim() ?? "";
  const kind = options.kind ?? "ALL";

  // 1. Live Search Mode
  if (query.length > 0 || options.mode === "search") {
    if (!query) {
      return { items: [], page: 1, totalPages: 1, totalResults: 0 };
    }
    const endpoint =
      kind === "MOVIE" ? "/3/search/movie" : kind === "SERIES" ? "/3/search/tv" : "/3/search/multi";
    const fallbackKind: TmdbMediaKind = kind === "SERIES" ? "tv" : "movie";
    const data = await tmdbGetJson<{
      page: number;
      total_pages: number;
      total_results: number;
      results: RawTmdbListEntry[];
    }>(endpoint, {
      query,
      language: "en-US",
      page,
    });

    const items = (data.results ?? [])
      .map((entry) => normalizeCatalogItem(entry, fallbackKind))
      .filter((entry): entry is TmdbCatalogItem => entry !== null)
      .slice(0, limit);

    return {
      items,
      page: data.page ?? page,
      totalPages: Math.min(500, data.total_pages ?? 1),
      totalResults: data.total_results ?? items.length,
    };
  }

  const hasFacets = Boolean(
    (options.studio && options.studio !== "all") ||
    (options.genre && options.genre !== "all") ||
    options.personId ||
    (options.language && options.language !== "all"),
  );

  // 2. Pure Trending Mode (when no studio/genre/person filter is active)
  if (options.mode === "trending" && !hasFacets) {
    const mediaSeg = kind === "MOVIE" ? "movie" : kind === "SERIES" ? "tv" : "all";
    const fallbackKind: TmdbMediaKind = kind === "SERIES" ? "tv" : "movie";
    const data = await tmdbGetJson<{
      page: number;
      total_pages: number;
      total_results: number;
      results: RawTmdbListEntry[];
    }>(`/3/trending/${mediaSeg}/week`, {
      language: "en-US",
      page,
    });

    const items = (data.results ?? [])
      .map((entry) => normalizeCatalogItem(entry, fallbackKind))
      .filter((entry): entry is TmdbCatalogItem => entry !== null)
      .slice(0, limit);

    return {
      items,
      page: data.page ?? page,
      totalPages: Math.min(500, data.total_pages ?? 1),
      totalResults: data.total_results ?? items.length,
    };
  }

  // 3. Faceted Discover Mode (/3/discover/movie & /3/discover/tv)
  const studioObj =
    options.studio && options.studio !== "all"
      ? TMDB_STUDIO_PRESETS.find((s) => s.slug === options.studio)
      : undefined;
  const genreObj =
    options.genre && options.genre !== "all"
      ? TMDB_GENRE_PRESETS.find((g) => g.slug === options.genre)
      : undefined;

  const requestedSort =
    options.mode === "top_rated" ? "vote_average.desc" : (options.sort ?? "popularity.desc");

  const runSingleKindDiscover = async (mediaKind: TmdbMediaKind) => {
    const sortParam =
      requestedSort === "release_date.desc"
        ? mediaKind === "tv"
          ? "first_air_date.desc"
          : "primary_release_date.desc"
        : requestedSort === "revenue.desc" && mediaKind === "tv"
          ? "popularity.desc"
          : requestedSort;

    const minVotes =
      requestedSort === "vote_average.desc" ? (options.language === "bn" ? 15 : 350) : undefined;

    // Note: TMDB /discover/tv supports `with_companies` and `with_genres`, while `with_people` is movie-specific
    const params: Record<string, string | number | undefined> = {
      language: "en-US",
      page,
      sort_by: sortParam,
      "vote_count.gte": minVotes,
      with_companies: studioObj?.companyIds,
      with_genres: genreObj
        ? mediaKind === "tv"
          ? genreObj.tvGenreId
          : genreObj.movieGenreId
        : undefined,
      with_original_language:
        options.language && options.language !== "all" ? options.language : undefined,
      with_people: mediaKind === "movie" && options.personId ? options.personId : undefined,
    };

    const res = await tmdbGetJson<{
      page: number;
      total_pages: number;
      total_results: number;
      results: RawTmdbListEntry[];
    }>(`/3/discover/${mediaKind}`, params);

    const normalized = (res.results ?? [])
      .map((entry) => normalizeCatalogItem(entry, mediaKind))
      .filter((entry): entry is TmdbCatalogItem => entry !== null);

    return {
      items: normalized,
      page: res.page ?? page,
      totalPages: Math.min(500, res.total_pages ?? 1),
      totalResults: res.total_results ?? normalized.length,
    };
  };

  // Person filmography filter when kind === SERIES or ALL uses person combined_credits if personId is set
  if (options.personId && kind !== "MOVIE") {
    const person = await fetchTmdbPersonDetail(options.personId);
    const mergedMap = new Map<string, TmdbCatalogItem>();
    for (const item of [...person.directedWorks, ...person.actedWorks]) {
      if (kind === "SERIES" && item.kind !== "SERIES") continue;
      mergedMap.set(`${item.mediaKind}:${item.tmdbId}`, item);
    }
    const items = [...mergedMap.values()]
      .sort((a, b) =>
        requestedSort === "vote_average.desc"
          ? b.bayesianScore - a.bayesianScore
          : b.popularity - a.popularity,
      )
      .slice(0, limit);
    return {
      items,
      page: 1,
      totalPages: 1,
      totalResults: items.length,
    };
  }

  if (kind === "MOVIE") {
    const movieRes = await runSingleKindDiscover("movie");
    return { ...movieRes, items: movieRes.items.slice(0, limit) };
  }

  if (kind === "SERIES") {
    const tvRes = await runSingleKindDiscover("tv");
    return { ...tvRes, items: tvRes.items.slice(0, limit) };
  }

  // kind === "ALL": run movie & tv discover in parallel and interleave by sort score
  const [movieRes, tvRes] = await Promise.all([
    runSingleKindDiscover("movie"),
    runSingleKindDiscover("tv"),
  ]);

  const combined = [...movieRes.items, ...tvRes.items].sort((a, b) => {
    if (requestedSort === "vote_average.desc") {
      return b.bayesianScore - a.bayesianScore;
    }
    if (requestedSort === "release_date.desc") {
      return (b.releaseDate ?? "").localeCompare(a.releaseDate ?? "");
    }
    return b.popularity - a.popularity;
  });

  return {
    items: combined.slice(0, limit),
    page,
    totalPages: Math.max(movieRes.totalPages, tvRes.totalPages),
    totalResults: movieRes.totalResults + tvRes.totalResults,
  };
}

export async function searchTmdbPeople(query: string): Promise<TmdbPersonHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const data = await tmdbGetJson<{
    results: Array<{
      id: number;
      name: string;
      known_for_department?: string;
      profile_path?: string | null;
      known_for?: Array<{ title?: string; name?: string }>;
    }>;
  }>("/3/search/person", {
    query: trimmed,
    language: "en-US",
    page: 1,
  });

  return (data.results ?? []).slice(0, 8).map((p) => ({
    personId: p.id,
    name: p.name,
    knownForDepartment: p.known_for_department ?? "Acting",
    profileUrl: toSameOriginTmdbImagePath(p.profile_path, "w185"),
    knownForTitles: (p.known_for ?? [])
      .map((w) => (w.title ?? w.name ?? "").trim())
      .filter(Boolean)
      .slice(0, 3),
  }));
}

interface RawTmdbDetailResponse extends RawTmdbListEntry {
  tagline?: string | null;
  status?: string;
  runtime?: number | null;
  episode_run_time?: number[];
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
  production_companies?: Array<{ id: number; name: string; origin_country?: string }>;
  production_countries?: Array<{ iso_3166_1: string; name: string }>;
  created_by?: Array<{ id: number; name: string; profile_path?: string | null }>;
  seasons?: Array<{
    season_number: number;
    name: string;
    episode_count?: number;
    air_date?: string | null;
    overview?: string;
    poster_path?: string | null;
  }>;
  credits?: {
    cast?: Array<{
      id: number;
      name: string;
      character?: string;
      profile_path?: string | null;
    }>;
    crew?: Array<{
      id: number;
      name: string;
      job?: string;
      department?: string;
      profile_path?: string | null;
    }>;
  };
  recommendations?: { results?: RawTmdbListEntry[] };
  similar?: { results?: RawTmdbListEntry[] };
}

export async function fetchTmdbSeasonEpisodes(
  tvId: number,
  seasonNumber: number,
): Promise<TmdbEpisodeItem[]> {
  const safeId = Math.trunc(tvId);
  const safeSeason = Math.max(0, Math.trunc(seasonNumber));

  const data = await tmdbGetJson<{
    episodes?: Array<{
      episode_number: number;
      season_number: number;
      name: string;
      overview?: string;
      runtime?: number | null;
      air_date?: string | null;
      vote_average?: number;
      still_path?: string | null;
    }>;
  }>(`/3/tv/${safeId}/season/${safeSeason}`, {
    language: "en-US",
  });

  return (data.episodes ?? []).map((ep) => ({
    episodeNumber: ep.episode_number,
    seasonNumber: ep.season_number ?? safeSeason,
    name: ep.name || `Episode ${ep.episode_number}`,
    overview: (ep.overview ?? "").trim() || "Episode synopsis pending official broadcast update.",
    runtimeMinutes: ep.runtime ?? null,
    airDate: ep.air_date ?? null,
    voteAverage: Number((ep.vote_average ?? 0).toFixed(1)),
    stillUrl: toSameOriginTmdbImagePath(ep.still_path, "w500"),
  }));
}

export async function fetchTmdbWorkDetail(
  mediaKind: TmdbMediaKind,
  tmdbId: number,
): Promise<TmdbWorkDetail> {
  const safeId = Math.trunc(tmdbId);
  if (!Number.isFinite(safeId) || safeId <= 0) {
    throw new TmdbAdapterError("NOT_FOUND", "Invalid TMDB numeric ID", 404);
  }

  const raw = await tmdbGetJson<RawTmdbDetailResponse>(`/3/${mediaKind}/${safeId}`, {
    language: "en-US",
    append_to_response: "credits,recommendations,similar",
  });

  const base = normalizeCatalogItem(raw, mediaKind);
  if (!base) {
    throw new TmdbAdapterError("NOT_FOUND", "TMDB record could not be normalized", 404);
  }

  const directorsMap = new Map<number, TmdbCreditSummary>();
  if (mediaKind === "tv") {
    for (const creator of raw.created_by ?? []) {
      directorsMap.set(creator.id, {
        personId: creator.id,
        name: creator.name,
        department: "CREATOR",
        roleLabel: "Series Creator",
        profileUrl: toSameOriginTmdbImagePath(creator.profile_path, "w185"),
      });
    }
  }
  for (const member of raw.credits?.crew ?? []) {
    if (member.job === "Director" || member.job === "Series Director") {
      if (!directorsMap.has(member.id)) {
        directorsMap.set(member.id, {
          personId: member.id,
          name: member.name,
          department: "DIRECTOR",
          roleLabel: member.job,
          profileUrl: toSameOriginTmdbImagePath(member.profile_path, "w185"),
        });
      }
    }
  }

  const cast: TmdbCreditSummary[] = (raw.credits?.cast ?? []).slice(0, 12).map((actor) => ({
    personId: actor.id,
    name: actor.name,
    department: "ACTOR",
    roleLabel: actor.character || "Principal Cast",
    profileUrl: toSameOriginTmdbImagePath(actor.profile_path, "w185"),
  }));

  const seasons: TmdbSeasonSummary[] =
    mediaKind === "tv"
      ? (raw.seasons ?? [])
          .filter((s) => s.season_number >= 1)
          .map((s) => ({
            seasonNumber: s.season_number,
            name: s.name || `Season ${s.season_number}`,
            episodeCount: s.episode_count ?? 0,
            airDate: s.air_date ?? null,
            overview: (s.overview ?? "").trim(),
            posterUrl: toSameOriginTmdbImagePath(s.poster_path, "w342"),
          }))
      : [];

  let initialSeasonEpisodes: TmdbEpisodeItem[] = [];
  if (mediaKind === "tv" && seasons.length > 0) {
    try {
      initialSeasonEpisodes = await fetchTmdbSeasonEpisodes(safeId, seasons[0]!.seasonNumber);
    } catch {
      initialSeasonEpisodes = [];
    }
  }

  const seedGenreSet = new Set(base.genreLabels.map((g) => g.toLowerCase()));
  const recPool = [...(raw.recommendations?.results ?? []), ...(raw.similar?.results ?? [])];
  const seenRecIds = new Set<number>([safeId]);
  const recommendations: TmdbRecommendationItem[] = [];

  for (const entry of recPool) {
    if (seenRecIds.has(entry.id)) continue;
    seenRecIds.add(entry.id);
    const norm = normalizeCatalogItem(entry, mediaKind);
    if (!norm) continue;

    const sharedGenres = norm.genreLabels.filter((g) => seedGenreSet.has(g.toLowerCase()));
    const genreOverlapRatio =
      base.genreLabels.length > 0 ? sharedGenres.length / base.genreLabels.length : 0.5;
    const qualityRatio = Math.min(1, norm.bayesianScore / 9.2);
    const matchPercentage = Math.min(
      98,
      Math.max(66, Math.round(64 + genreOverlapRatio * 22 + qualityRatio * 12)),
    );

    const reason =
      sharedGenres.length > 0
        ? `Shared ${sharedGenres.slice(0, 2).join(" & ")} DNA`
        : norm.releaseYear && base.releaseYear && Math.abs(norm.releaseYear - base.releaseYear) <= 3
          ? `Contemporary ${norm.releaseYear} Release`
          : "Viewer Graph Affinity";

    recommendations.push({
      ...norm,
      matchPercentage,
      reason,
    });
    if (recommendations.length >= 8) break;
  }

  recommendations.sort((a, b) => b.matchPercentage - a.matchPercentage);

  const runtimeMinutes =
    mediaKind === "movie"
      ? (raw.runtime ?? null)
      : (raw.episode_run_time?.find((m) => m > 0) ?? null);

  return {
    ...base,
    tagline: raw.tagline?.trim() || null,
    statusLabel: raw.status ?? "Released",
    runtimeMinutes,
    seasonCount: mediaKind === "tv" ? (raw.number_of_seasons ?? seasons.length) : null,
    episodeCount: mediaKind === "tv" ? (raw.number_of_episodes ?? null) : null,
    studios: (raw.production_companies ?? []).slice(0, 5).map((c) => ({
      id: c.id,
      name: c.name,
      originCountry: c.origin_country ?? "",
    })),
    countries: (raw.production_countries ?? []).map((c) => c.name).slice(0, 3),
    directors: [...directorsMap.values()].slice(0, 4),
    cast,
    seasons,
    initialSeasonEpisodes,
    recommendations,
  };
}

export async function fetchTmdbPersonDetail(personId: number): Promise<TmdbPersonDetail> {
  const safeId = Math.trunc(personId);
  if (!Number.isFinite(safeId) || safeId <= 0) {
    throw new TmdbAdapterError("NOT_FOUND", "Invalid TMDB person ID", 404);
  }

  const raw = await tmdbGetJson<{
    id: number;
    name: string;
    biography?: string;
    known_for_department?: string;
    birthday?: string | null;
    place_of_birth?: string | null;
    profile_path?: string | null;
    combined_credits?: {
      cast?: RawTmdbListEntry[];
      crew?: Array<RawTmdbListEntry & { job?: string }>;
    };
  }>(`/3/person/${safeId}`, {
    language: "en-US",
    append_to_response: "combined_credits",
  });

  const directedMap = new Map<string, TmdbCatalogItem>();
  for (const credit of raw.combined_credits?.crew ?? []) {
    if (
      credit.job === "Director" ||
      credit.job === "Creator" ||
      credit.job === "Executive Producer"
    ) {
      const norm = normalizeCatalogItem(credit, credit.media_type === "tv" ? "tv" : "movie");
      if (norm) {
        directedMap.set(`${norm.mediaKind}:${norm.tmdbId}`, norm);
      }
    }
  }

  const actedMap = new Map<string, TmdbCatalogItem>();
  for (const credit of raw.combined_credits?.cast ?? []) {
    const norm = normalizeCatalogItem(credit, credit.media_type === "tv" ? "tv" : "movie");
    if (norm) {
      actedMap.set(`${norm.mediaKind}:${norm.tmdbId}`, norm);
    }
  }

  const directedWorks = [...directedMap.values()]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 20);
  const actedWorks = [...actedMap.values()]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 24);

  return {
    personId: raw.id,
    name: raw.name,
    biography:
      (raw.biography ?? "").trim() ||
      `Global film and television filmography indexed via TMDB for ${raw.name}.`,
    knownForDepartment: raw.known_for_department ?? "Film & Television",
    birthday: raw.birthday ?? null,
    placeOfBirth: raw.place_of_birth ?? null,
    profileUrl: toSameOriginTmdbImagePath(raw.profile_path, "w500"),
    fallbackArt: buildDeterministicArtSpecForTmdbId(raw.id),
    directedWorks,
    actedWorks,
  };
}

const imageCache = new Map<string, CacheEntry<{ bytes: Uint8Array; contentType: string }>>();
const inflightImages = new Map<string, Promise<{ bytes: Uint8Array; contentType: string }>>();
const MAX_IMAGE_CACHE_ENTRIES = 80;

/**
 * Strictly allowlisted SSRF-safe server image proxy fetcher.
 * Only fetches fixed `https://image.tmdb.org/t/p/{size}/{filename}` paths.
 */
export async function fetchTmdbImageBytes(
  size: string,
  filename: string,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  if (!ALLOWED_TMDB_IMAGE_SIZES.includes(size as TmdbImageSize)) {
    throw new TmdbAdapterError("NOT_FOUND", "Unsupported TMDB image size", 400);
  }
  if (!SAFE_TMDB_FILENAME_RE.test(filename)) {
    throw new TmdbAdapterError("NOT_FOUND", "Invalid TMDB image filename", 400);
  }

  // Enforce commercial deployment gate before serving TMDB artwork
  resolveTmdbAuthHeadersAndParams();

  const cacheKey = `${size}/${filename}`;
  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() <= cached.expiresAt) {
    return cached.value;
  }

  const existingInflight = inflightImages.get(cacheKey);
  if (existingInflight) {
    return existingInflight;
  }

  const fetchPromise = (async () => {
    const targetUrl = `${TMDB_IMAGE_ORIGIN}/t/p/${size}/${filename}`;
    let response: Response;
    try {
      response = await fetch(targetUrl, {
        method: "GET",
        redirect: "error",
        signal: AbortSignal.timeout(7_000),
      });
    } catch {
      throw new TmdbAdapterError("TMDB_UPSTREAM_ERROR", "Unable to fetch TMDB image", 502);
    }

    if (response.status === 404) {
      throw new TmdbAdapterError("NOT_FOUND", "TMDB image not found", 404);
    }
    if (!response.ok) {
      throw new TmdbAdapterError("TMDB_UPSTREAM_ERROR", "Upstream TMDB image error", 502);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      throw new TmdbAdapterError("TMDB_UPSTREAM_ERROR", "Invalid upstream image MIME type", 502);
    }

    const contentLength = Number.parseInt(response.headers.get("content-length") ?? "0", 10);
    if (contentLength > MAX_IMAGE_BYTES) {
      throw new TmdbAdapterError("TMDB_UPSTREAM_ERROR", "Upstream image exceeds byte limit", 502);
    }

    const arrayBuf = await response.arrayBuffer();
    if (arrayBuf.byteLength > MAX_IMAGE_BYTES) {
      throw new TmdbAdapterError("TMDB_UPSTREAM_ERROR", "Upstream image exceeds byte limit", 502);
    }

    const result = { bytes: new Uint8Array(arrayBuf), contentType };
    if (imageCache.size >= MAX_IMAGE_CACHE_ENTRIES) {
      const oldest = imageCache.keys().next().value;
      if (oldest) imageCache.delete(oldest);
    }
    imageCache.set(cacheKey, {
      expiresAt: Date.now() + 10 * 60 * 1000,
      value: result,
    });
    return result;
  })();

  inflightImages.set(cacheKey, fetchPromise);
  try {
    return await fetchPromise;
  } finally {
    inflightImages.delete(cacheKey);
  }
}
