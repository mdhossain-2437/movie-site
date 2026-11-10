import "server-only";

import crypto from "node:crypto";
import { getEnv } from "@movie/config";
import type { CatalogueSort, MaturityRating, ResolutionTier, TitleKind } from "@movie/contracts";
import { type PublicTitleSummary, RightsGateError } from "@movie/db";
import { evaluateRights, type RightsGrantRecord } from "@movie/domain";
import type { TitleHeroStageProps } from "@/components/catalogue/title-hero-stage";
import {
  CINEVA_COLLECTIONS,
  CINEVA_DATABASE_FILMS,
  CINEVA_GENRES,
  CINEVA_PEOPLE,
  CINEVA_SPECIAL_CATEGORIES,
  CINEVA_STUDIOS,
  type CinevaDatabaseFilm,
  getCinevaEpisode,
  queryCinevaCatalogue,
} from "./cineva-database";
import { isFixtureCatalogueEnabled } from "./stage";

export type DevShowcaseTitle = TitleHeroStageProps["title"];

const SHOWCASE_ALLOWED_TERRITORIES = [
  "BD",
  "US",
  "GB",
  "CA",
  "IN",
  "DE",
  "FR",
  "SE",
  "AU",
  "SG",
  "JP",
  "NL",
] as const;

const EVIDENCE_HASH_64 = "a94f3c81e2057b6d41c908ef237645ad8b9102ce34768fa190bc23de456789ab";

function buildShowcaseGrants(film: CinevaDatabaseFilm): RightsGrantRecord[] {
  const assetId = `ast_${film.slug}`;
  const actions: Array<"METADATA" | "ARTWORK" | "TRAILER" | "STREAM" | "DOWNLOAD"> = [
    "METADATA",
    "ARTWORK",
    "TRAILER",
  ];
  if (film.availability.streamAllowed) {
    actions.push("STREAM");
  }
  if (film.availability.downloadAllowed) {
    actions.push("DOWNLOAD");
  }
  return [
    {
      id: `grt_${film.slug}`,
      titleId: film.id,
      assetId,
      status: "APPROVED",
      allowedActions: actions,
      allowedTerritories: SHOWCASE_ALLOWED_TERRITORIES,
      validFrom: new Date("2024-01-01T00:00:00.000Z"),
      validUntil: new Date("2035-12-31T23:59:59.000Z"),
      requiredEntitlement: "FREE",
      maxResolution: "1080p",
      requiresDrm: false,
      attributionText: film.studio,
      evidence: [
        {
          id: `evd_${film.slug}`,
          evidenceSha256: EVIDENCE_HASH_64,
          reviewedBy: "usr_rights_reviewer_01",
          reviewedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      ],
    },
  ];
}

export function toDevShowcaseTitle(film: CinevaDatabaseFilm): DevShowcaseTitle {
  return {
    id: film.id,
    slug: film.slug,
    kind: film.kind,
    featureAssetId: film.availability.downloadAllowed ? `ast_${film.slug}` : null,
    originalTitle: film.originalTitle,
    originalLanguage: film.originalLanguage,
    releaseYear: film.releaseYear,
    runtimeMinutes: film.runtimeMinutes,
    maturityRating: film.maturityRating,
    isDevelopmentFixture: true,
    localizedTitleEn: film.localizedTitleEn,
    localizedTitleBn: film.localizedTitleBn ?? null,
    synopsisEn: film.synopsisEn,
    synopsisBn: film.synopsisBn ?? null,
    availability: film.availability,
    genres: film.genres,
    credits: film.credits,
    sources: [
      {
        provider: film.country.includes("Public Domain") ? "PUBLIC_DOMAIN" : "OPERATOR_ORIGINAL",
        attributionText: film.studio,
      },
    ],
  };
}

export function toPublicSummary(film: CinevaDatabaseFilm): PublicTitleSummary {
  const matchingCollections = CINEVA_COLLECTIONS.filter((c) => c.filmSlugs.includes(film.slug)).map(
    (c) => c.slug,
  );

  return {
    id: film.id,
    slug: film.slug,
    kind: film.kind,
    featureAssetId: film.availability.downloadAllowed ? `ast_${film.slug}` : null,
    originalTitle: film.originalTitle,
    originalLanguage: film.originalLanguage,
    releaseYear: film.releaseYear,
    runtimeMinutes: film.runtimeMinutes,
    maturityRating: film.maturityRating,
    isDevelopmentFixture: false,
    localizedTitleEn: film.localizedTitleEn,
    localizedTitleBn: film.localizedTitleBn ?? null,
    synopsisEn: film.synopsisEn,
    synopsisBn: film.synopsisBn ?? null,
    genreSlugs: film.genres.map((g) => g.slug),
    directorSlugs: film.credits.filter((c) => c.department === "DIRECTOR").map((c) => c.personSlug),
    castSlugs: film.credits.filter((c) => c.department === "ACTOR").map((c) => c.personSlug),
    collectionSlugs: matchingCollections,
    studioName: film.studio,
    studioSlug: film.studioSlug,
    availability: film.availability,
  };
}

export interface ShowcaseQueryOptions {
  kind?: TitleKind;
  language?: string;
  genreSlug?: string;
  directorSlug?: string;
  castSlug?: string;
  categorySlug?: string;
  studioSlug?: string;
  maturityRating?: MaturityRating;
  access?: "all" | "stream" | "download";
  sort?: CatalogueSort;
  query?: string;
}

export function listDevShowcaseSummaries(options?: ShowcaseQueryOptions): PublicTitleSummary[] {
  if (!isFixtureCatalogueEnabled()) return [];
  return queryCinevaCatalogue({
    kind: options?.kind ?? "ALL",
    language: options?.language,
    genre: options?.genreSlug,
    director: options?.directorSlug,
    cast: options?.castSlug,
    category: options?.categorySlug,
    studio: options?.studioSlug,
    maturityRating: options?.maturityRating,
    access: options?.access,
    sort: options?.sort,
    query: options?.query,
  }).map(toPublicSummary);
}

export function searchDevShowcaseSummaries(query: string): PublicTitleSummary[] {
  if (!isFixtureCatalogueEnabled()) return [];
  const q = query.trim();
  if (!q) return [];
  return queryCinevaCatalogue({ query: q }).map(toPublicSummary);
}

export function getDevShowcaseTitleBySlug(slug: string): DevShowcaseTitle | null {
  if (!isFixtureCatalogueEnabled()) return null;
  const film = CINEVA_DATABASE_FILMS.find((t) => t.slug === slug);
  return film ? toDevShowcaseTitle(film) : null;
}

export function getDevShowcasePersonBySlug(slug: string) {
  if (!isFixtureCatalogueEnabled()) return null;
  const profile = CINEVA_PEOPLE.find((p) => p.slug === slug);
  if (!profile) return null;
  const associated = CINEVA_DATABASE_FILMS.filter((f) =>
    f.credits.some((c) => c.personSlug === slug),
  );
  const titles = (associated.length > 0 ? associated : CINEVA_DATABASE_FILMS.slice(0, 4)).map(
    toDevShowcaseTitle,
  );
  return {
    person: {
      id: profile.id,
      slug: profile.slug,
      nameEn: profile.nameEn,
      nameBn: profile.nameBn,
      bio: profile.bio,
    },
    titles,
  };
}

export function getDevShowcaseCollectionBySlug(slug: string) {
  if (!isFixtureCatalogueEnabled()) return null;
  const col = CINEVA_COLLECTIONS.find((c) => c.slug === slug);
  if (!col) return null;
  const titles = col.filmSlugs
    .map((s) => CINEVA_DATABASE_FILMS.find((f) => f.slug === s))
    .filter((f): f is CinevaDatabaseFilm => Boolean(f))
    .map(toDevShowcaseTitle);
  return {
    collection: {
      id: col.id,
      slug: col.slug,
      titleEn: col.titleEn,
      titleBn: col.titleBn,
      description: col.description,
    },
    titles,
  };
}

export function getDevShowcaseGenreBySlug(slug: string) {
  if (!isFixtureCatalogueEnabled()) return null;
  const genre = CINEVA_GENRES.find((g) => g.slug === slug);
  if (!genre) return null;
  const titles = CINEVA_DATABASE_FILMS.filter((t) => t.genres.some((g) => g.slug === slug)).map(
    toDevShowcaseTitle,
  );
  return {
    genre: {
      id: `gen-${genre.slug}`,
      slug: genre.slug,
      nameEn: genre.nameEn,
      nameBn: genre.nameBn,
    },
    titles,
  };
}

export function getDevShowcaseStudioBySlug(slug: string) {
  if (!isFixtureCatalogueEnabled()) return null;
  const studio = CINEVA_STUDIOS.find((s) => s.slug === slug);
  if (!studio) return null;
  const titles = queryCinevaCatalogue({ studio: slug, sort: "top_rated" }).map(toDevShowcaseTitle);
  return {
    studio,
    titles,
  };
}

export function getDevShowcaseCategoryBySlug(slug: string) {
  if (!isFixtureCatalogueEnabled()) return null;
  const category = CINEVA_SPECIAL_CATEGORIES.find((c) => c.slug === slug);
  if (!category) return null;
  const titles = queryCinevaCatalogue({
    category: slug,
    sort: slug === "top-rated-hall" ? "top_rated" : "featured",
  }).map(toDevShowcaseTitle);
  return {
    category,
    titles,
  };
}

function signShowcaseSession(sessionId: string, expiresAtUnixMs: number): string {
  const secret = getEnv().SESSION_SECRET ?? "cineva-dev-showcase-hmac-key-v4";
  const mac = crypto
    .createHmac("sha256", secret)
    .update(`${sessionId}:${expiresAtUnixMs}`)
    .digest("hex");
  return `pbk_sc_${expiresAtUnixMs}_${mac}`;
}

export function verifyDevShowcasePlaybackToken(sessionId: string, token: string): boolean {
  if (!isFixtureCatalogueEnabled()) return false;
  if (!sessionId.startsWith("pbs_sc_") || !token.startsWith("pbk_sc_")) return false;
  const parts = token.split("_");
  if (parts.length !== 4) return false;
  const expiresAtUnixMs = Number(parts[2]);
  if (!Number.isFinite(expiresAtUnixMs) || Date.now() > expiresAtUnixMs) {
    return false;
  }
  const expected = signShowcaseSession(sessionId, expiresAtUnixMs);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Evaluates `@movie/domain` `evaluateRights({ action: "STREAM" })` for CINEVA showcase films & series
 * when running in non-production showcase mode and issues a short-lived signed playback session.
 */
export function authorizeDevShowcasePlaybackSession(input: {
  titleSlug: string;
  territoryCode: string;
  requestedResolution?: ResolutionTier;
  drmCapableClient?: boolean;
  seasonNumber?: number;
  episodeNumber?: number;
}) {
  if (!isFixtureCatalogueEnabled()) {
    return null;
  }
  const film = CINEVA_DATABASE_FILMS.find((f) => f.slug === input.titleSlug);
  if (!film) {
    return null;
  }

  const now = new Date();
  const assetId = `ast_${film.slug}`;
  const grants = buildShowcaseGrants(film);
  const effectiveTerritory = SHOWCASE_ALLOWED_TERRITORIES.includes(
    input.territoryCode as (typeof SHOWCASE_ALLOWED_TERRITORIES)[number],
  )
    ? input.territoryCode
    : "BD";

  const decision = evaluateRights({
    titleId: film.id,
    titleStatus: "PUBLISHED",
    titleMaturityRating: film.maturityRating,
    takedownActive: false,
    assetId,
    assetState: "PUBLISHED",
    assetChecksumVerified: true,
    drmCapableClient: input.drmCapableClient ?? false,
    action: "STREAM",
    territoryCode: effectiveTerritory,
    at: now,
    userEntitlement: "FREE",
    requestedResolution: input.requestedResolution,
    grants,
  });

  if (!decision.allowed) {
    throw new RightsGateError(decision.code, decision.publicReason);
  }

  const activeEpisode =
    film.kind === "SERIES" ? getCinevaEpisode(film, input.seasonNumber, input.episodeNumber) : null;
  const effectiveMinutes = activeEpisode?.runtimeMinutes ?? film.runtimeMinutes;
  const episodeQuery = activeEpisode
    ? `&s=${activeEpisode.seasonNumber}&e=${activeEpisode.episodeNumber}`
    : "";

  const sessionId = `pbs_sc_${crypto.randomBytes(12).toString("hex")}`;
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
  const playbackToken = signShowcaseSession(sessionId, expiresAt.getTime());

  return {
    sessionId,
    playbackToken,
    expiresAt: expiresAt.toISOString(),
    maxResolution: decision.maxResolution,
    requiresDrm: decision.requiresDrm,
    resumePositionSeconds: 0,
    durationSeconds: effectiveMinutes * 60,
    renditions: [
      {
        id: `rnd_${film.slug}_1080p`,
        resolution: "1080p" as ResolutionTier,
        codec: "av01.0.08M.08",
        bitrateKbps: 6800,
        manifestUrl: `cineva://reel/${film.slug}?tier=1080p${episodeQuery}`,
      },
      {
        id: `rnd_${film.slug}_720p`,
        resolution: "720p" as ResolutionTier,
        codec: "avc1.64001f",
        bitrateKbps: 3400,
        manifestUrl: `cineva://reel/${film.slug}?tier=720p${episodeQuery}`,
      },
      {
        id: `rnd_${film.slug}_480p`,
        resolution: "480p" as ResolutionTier,
        codec: "avc1.4d401e",
        bitrateKbps: 1500,
        manifestUrl: `cineva://reel/${film.slug}?tier=480p${episodeQuery}`,
      },
    ],
    subtitles: [
      {
        id: `sub_${film.slug}_en`,
        languageCode: "en",
        label: "English (CC)",
        isForced: false,
        vttUrl: `/api/v1/titles/${film.slug}#en`,
      },
    ],
    securityDisclosure:
      "Signed URLs enforce short-lived access control, not DRM. Protected contracts fail closed without a licensed CDM adapter.",
  };
}
