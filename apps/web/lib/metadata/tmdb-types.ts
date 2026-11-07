import type { TitleKind } from "@movie/contracts";
import type { ArtMotif, ArtPalette, ArtSpec } from "@/lib/catalogue/types";

export const TMDB_OFFICIAL_ATTRIBUTION =
  "Metadata & artwork provided via TMDB API. This product uses the TMDB API but is not endorsed or certified by TMDB.";

export type TmdbMediaKind = "movie" | "tv";

export type TmdbImageSize = "w185" | "w342" | "w500" | "w780" | "w1280";

export const ALLOWED_TMDB_IMAGE_SIZES: readonly TmdbImageSize[] = [
  "w185",
  "w342",
  "w500",
  "w780",
  "w1280",
] as const;

const SAFE_TMDB_FILE_RE = /^\/?([A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp))$/i;

/**
 * Converts a TMDB `/abc123.jpg` path into a strictly validated same-origin proxy path
 * (`/api/v1/tmdb/image/w500/abc123.jpg`) so browser CSP (`img-src 'self' data: blob:`)
 * never makes direct third-party image requests.
 */
export function toSameOriginTmdbImagePath(
  rawPath: string | null | undefined,
  size: TmdbImageSize = "w500",
): string | null {
  if (!rawPath) return null;
  const match = SAFE_TMDB_FILE_RE.exec(rawPath.trim());
  if (!match?.[1]) return null;
  return `/api/v1/tmdb/image/${size}/${match[1]}`;
}

export interface TmdbStudioPreset {
  slug: string;
  label: string;
  eyebrow: string;
  /** Pipe-separated (`|`) OR-joined TMDB company IDs for `/discover/movie` & `/discover/tv`. */
  companyIds: string;
  description: string;
}

export const TMDB_STUDIO_PRESETS: readonly TmdbStudioPreset[] = [
  {
    slug: "marvel",
    label: "Marvel Studios",
    eyebrow: "TMDB Company #420",
    companyIds: "420|7505",
    description: "Marvel Studios & Marvel Entertainment theatrical and streaming productions.",
  },
  {
    slug: "dc",
    label: "DC Studios",
    eyebrow: "TMDB Company #128064 · #9993",
    companyIds: "128064|9993|429",
    description: "DC Studios, DC Entertainment & DC Films comic adaptations and animated features.",
  },
  {
    slug: "sony",
    label: "Sony & Columbia",
    eyebrow: "TMDB Company #34 · #5",
    companyIds: "34|5|2251",
    description: "Sony Pictures, Columbia Pictures & Sony Pictures Animation global slate.",
  },
  {
    slug: "fox",
    label: "20th Century (Fox)",
    eyebrow: "TMDB Company #127928 · #25",
    companyIds: "127928|25",
    description: "20th Century Studios & legacy 20th Century Fox theatrical library.",
  },
  {
    slug: "warner",
    label: "Warner Bros.",
    eyebrow: "TMDB Company #174",
    companyIds: "174|1957",
    description: "Warner Bros. Pictures & Warner Bros. Television productions.",
  },
  {
    slug: "universal",
    label: "Universal Pictures",
    eyebrow: "TMDB Company #33",
    companyIds: "33",
    description: "Universal Pictures tentpole features and classic studio catalogue.",
  },
  {
    slug: "paramount",
    label: "Paramount Pictures",
    eyebrow: "TMDB Company #4",
    companyIds: "4",
    description: "Paramount Pictures global theatrical releases and prestige dramas.",
  },
  {
    slug: "a24",
    label: "A24",
    eyebrow: "TMDB Company #41077",
    companyIds: "41077",
    description: "Independent auteur cinema, psychological horror, and contemporary drama.",
  },
] as const;

export interface TmdbGenrePreset {
  slug: string;
  labelEn: string;
  labelBn: string;
  movieGenreId: number;
  tvGenreId: number;
}

export const TMDB_GENRE_PRESETS: readonly TmdbGenrePreset[] = [
  { slug: "action", labelEn: "Action", labelBn: "অ্যাকশন", movieGenreId: 28, tvGenreId: 10759 },
  {
    slug: "sci-fi",
    labelEn: "Sci-Fi",
    labelBn: "কল্পবিজ্ঞান",
    movieGenreId: 878,
    tvGenreId: 10765,
  },
  { slug: "thriller", labelEn: "Thriller", labelBn: "থ্রিলার", movieGenreId: 53, tvGenreId: 9648 },
  { slug: "drama", labelEn: "Drama", labelBn: "নাটক", movieGenreId: 18, tvGenreId: 18 },
  { slug: "crime", labelEn: "Crime", labelBn: "অপরাধ", movieGenreId: 80, tvGenreId: 80 },
  { slug: "mystery", labelEn: "Mystery", labelBn: "রহস্য", movieGenreId: 9648, tvGenreId: 9648 },
  {
    slug: "animation",
    labelEn: "Animation",
    labelBn: "অ্যানিমেশন",
    movieGenreId: 16,
    tvGenreId: 16,
  },
  {
    slug: "documentary",
    labelEn: "Documentary",
    labelBn: "প্রামাণ্যচিত্র",
    movieGenreId: 99,
    tvGenreId: 99,
  },
] as const;

export interface TmdbCatalogItem {
  tmdbId: number;
  mediaKind: TmdbMediaKind;
  kind: TitleKind;
  title: string;
  originalTitle: string;
  originalLanguage: string;
  releaseYear: number | null;
  releaseDate: string | null;
  synopsis: string;
  voteAverage: number;
  voteCount: number;
  bayesianScore: number;
  popularity: number;
  genreLabels: string[];
  posterUrl: string | null;
  backdropUrl: string | null;
  fallbackArt: ArtSpec;
  detailHref: string;
}

export interface TmdbPersonHit {
  personId: number;
  name: string;
  knownForDepartment: string;
  profileUrl: string | null;
  knownForTitles: string[];
}

export interface TmdbCreditSummary {
  personId: number;
  name: string;
  department: "DIRECTOR" | "CREATOR" | "ACTOR";
  roleLabel: string;
  profileUrl: string | null;
}

export interface TmdbSeasonSummary {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airDate: string | null;
  overview: string;
  posterUrl: string | null;
}

export interface TmdbEpisodeItem {
  episodeNumber: number;
  seasonNumber: number;
  name: string;
  overview: string;
  runtimeMinutes: number | null;
  airDate: string | null;
  voteAverage: number;
  stillUrl: string | null;
}

export interface TmdbRecommendationItem extends TmdbCatalogItem {
  matchPercentage: number;
  reason: string;
}

export interface TmdbWorkDetail extends TmdbCatalogItem {
  tagline: string | null;
  statusLabel: string;
  runtimeMinutes: number | null;
  seasonCount: number | null;
  episodeCount: number | null;
  studios: Array<{ id: number; name: string; originCountry: string }>;
  countries: string[];
  directors: TmdbCreditSummary[];
  cast: TmdbCreditSummary[];
  seasons: TmdbSeasonSummary[];
  initialSeasonEpisodes: TmdbEpisodeItem[];
  recommendations: TmdbRecommendationItem[];
}

export interface TmdbPersonDetail {
  personId: number;
  name: string;
  biography: string;
  knownForDepartment: string;
  birthday: string | null;
  placeOfBirth: string | null;
  profileUrl: string | null;
  fallbackArt: ArtSpec;
  directedWorks: TmdbCatalogItem[];
  actedWorks: TmdbCatalogItem[];
}

const FALLBACK_MOTIFS: readonly ArtMotif[] = [
  "lens",
  "tower",
  "steps",
  "horizon",
  "shards",
  "eye",
  "moon",
  "spiral",
] as const;

const FALLBACK_PALETTES: readonly ArtPalette[] = [
  { bg: "#050507", bg2: "#16070A", ink: "#FEF9EF", accent: "#E50914", light: "#FCA5A5" },
  { bg: "#04070D", bg2: "#0F172A", ink: "#F8FAFC", accent: "#DC2626", light: "#CBD5E1" },
  { bg: "#080604", bg2: "#1C140D", ink: "#FEF3C7", accent: "#EA580C", light: "#FDE68A" },
  { bg: "#050807", bg2: "#0F1F1C", ink: "#ECFDF5", accent: "#E11D48", light: "#A7F3D0" },
] as const;

export function buildDeterministicArtSpecForTmdbId(tmdbId: number): ArtSpec {
  const safe = Math.abs(Math.trunc(tmdbId)) || 1;
  const motif = FALLBACK_MOTIFS[safe % FALLBACK_MOTIFS.length] ?? "lens";
  const palette = FALLBACK_PALETTES[safe % FALLBACK_PALETTES.length] ?? FALLBACK_PALETTES[0]!;
  return { motif, palette };
}
