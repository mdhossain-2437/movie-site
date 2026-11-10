import type { TmdbWorkDetail } from "@/lib/metadata/tmdb-types";

export interface OmdbRatings {
  imdbRating: string | null;
  imdbVotes: string | null;
  metascore: string | null;
  rottenTomatoes: string | null;
}

export interface OmdbRawRating {
  Source?: string;
  Value?: string;
}

export interface OmdbRawResponse {
  Response?: "True" | "False" | string;
  Error?: string;
  Title?: string;
  Year?: string;
  Rated?: string;
  Released?: string;
  Runtime?: string;
  Genre?: string;
  Director?: string;
  Writer?: string;
  Actors?: string;
  Plot?: string;
  Language?: string;
  Country?: string;
  Awards?: string;
  Poster?: string;
  Ratings?: OmdbRawRating[];
  Metascore?: string;
  imdbRating?: string;
  imdbVotes?: string;
  imdbID?: string;
  Type?: string;
  DVD?: string;
  BoxOffice?: string;
  Production?: string;
  Website?: string;
  totalSeasons?: string;
}

export interface OmdbNormalizedRating {
  source: string;
  value: string;
}

export interface OmdbTitleDetail {
  title: string | null;
  year: string | null;
  startYear: number | null;
  endYear: number | null;
  rated: string | null;
  released: string | null;
  runtime: string | null;
  runtimeMinutes: number | null;
  genre: string | null;
  genres: string[];
  director: string | null;
  directors: string[];
  writer: string | null;
  writers: string[];
  actors: string | null;
  actorsList: string[];
  plot: string | null;
  language: string | null;
  languages: string[];
  country: string | null;
  countries: string[];
  awards: string | null;
  posterUrl: string | null;
  proxiedPosterUrl: string | null;
  ratings: OmdbNormalizedRating[];
  metascore: string | null;
  metascoreNumber: number | null;
  imdbRating: string | null;
  imdbRatingNumber: number | null;
  imdbVotes: string | null;
  imdbVotesCount: number | null;
  imdbId: string | null;
  type: string | null;
  dvd: string | null;
  boxOffice: string | null;
  boxOfficeAmount: number | null;
  production: string | null;
  website: string | null;
  totalSeasons: number | null;
  rottenTomatoes: string | null;
}

export interface RatingCardItem {
  id: string;
  sourceName: string;
  shortName: string;
  score: string;
  scale: string;
  scorePercent: number;
  votes: string | null;
  subtitle: string;
  glyph: "star" | "gauge" | "meter" | "pulse" | "diamond";
}

export interface MultiSourceRatingsData {
  items: RatingCardItem[];
}

export interface ProductionReleaseDossierData {
  title: string;
  originalTitle?: string | null;
  plot?: string | null;
  rated?: string | null;
  released?: string | null;
  runtime?: string | null;
  type?: string | null;
  genres?: string[] | null;
  directors?: string[] | null;
  writers?: string[] | null;
  actors?: string[] | null;
  languages?: string[] | null;
  countries?: string[] | null;
  awards?: string | null;
  boxOffice?: string | null;
  budget?: string | null;
  revenue?: string | null;
  production?: string | null;
  dvd?: string | null;
  website?: string | null;
  imdbId?: string | null;
  tmdbId?: number | null;
  totalSeasons?: number | null;
  episodeCount?: number | null;
  statusLabel?: string | null;
}

export interface ArtworkGalleryItem {
  id: string;
  url: string;
  kind: "poster" | "backdrop";
  sourceLabel: string;
  dimensionsLabel: string | null;
  languageLabel: string | null;
}

const SAFE_IMDB_ID_RE = /^tt\d{7,10}$/i;

export function isAllowedAmazonPosterUrl(rawUrl: string | null | undefined): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== "https:") return false;
    if (parsed.hostname !== "m.media-amazon.com") return false;
    if (parsed.port !== "" || parsed.search !== "" || parsed.hash !== "") return false;
    if (parsed.pathname.includes("..")) return false;
    return /^\/images\/M\/[A-Za-z0-9_.,@~+%=-]+\.(?:jpg|jpeg|png|webp)$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function cleanOmdbString(val?: unknown): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  if (
    trimmed === "" ||
    trimmed.toUpperCase() === "N/A" ||
    trimmed === "undefined" ||
    trimmed === "null"
  ) {
    return null;
  }
  return trimmed;
}

function parseOmdbInt(val?: unknown, stripPattern?: RegExp): number | null {
  const clean = cleanOmdbString(val);
  if (!clean) return null;
  const target = stripPattern ? clean.replace(stripPattern, "") : clean;
  const parsed = Number.parseInt(target, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function splitOmdbCommaList(val?: unknown): string[] {
  const clean = cleanOmdbString(val);
  if (!clean) return [];
  return clean
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeOmdbTitleDetail(raw: unknown): OmdbTitleDetail | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const record = raw as OmdbRawResponse;
  if (record.Response !== "True") {
    return null;
  }

  const title = cleanOmdbString(record.Title);
  const year = cleanOmdbString(record.Year);
  let startYear: number | null = null;
  let endYear: number | null = null;
  if (year) {
    const parts = year.split(/[–-]/).map((seg) => parseOmdbInt(seg));
    startYear = parts[0] ?? null;
    endYear = parts[1] ?? null;
  }

  const rated = cleanOmdbString(record.Rated);
  const released = cleanOmdbString(record.Released);
  const runtime = cleanOmdbString(record.Runtime);
  const runtimeMinutes = runtime ? parseOmdbInt(runtime, /[^\d]/g) : null;

  const genre = cleanOmdbString(record.Genre);
  const genres = splitOmdbCommaList(record.Genre);

  const director = cleanOmdbString(record.Director);
  const directors = splitOmdbCommaList(record.Director);

  const writer = cleanOmdbString(record.Writer);
  const writers = splitOmdbCommaList(record.Writer);

  const actors = cleanOmdbString(record.Actors);
  const actorsList = splitOmdbCommaList(record.Actors);

  const plot = cleanOmdbString(record.Plot);
  const language = cleanOmdbString(record.Language);
  const languages = splitOmdbCommaList(record.Language);

  const country = cleanOmdbString(record.Country);
  const countries = splitOmdbCommaList(record.Country);

  const awards = cleanOmdbString(record.Awards);
  const posterCandidate = cleanOmdbString(record.Poster);
  const posterUrl =
    posterCandidate && isAllowedAmazonPosterUrl(posterCandidate) ? posterCandidate : null;
  const imdbId = cleanOmdbString(record.imdbID);
  const proxiedPosterUrl =
    posterUrl && imdbId && SAFE_IMDB_ID_RE.test(imdbId)
      ? `/api/v1/omdb/poster?imdbId=${encodeURIComponent(imdbId)}`
      : null;

  const ratings: OmdbNormalizedRating[] = [];
  let rottenTomatoes: string | null = null;
  let metacriticFromRatings: string | null = null;
  let imdbFromRatings: string | null = null;

  if (Array.isArray(record.Ratings)) {
    for (const entry of record.Ratings) {
      if (!entry || typeof entry !== "object") continue;
      const src = cleanOmdbString((entry as OmdbRawRating).Source);
      const val = cleanOmdbString((entry as OmdbRawRating).Value);
      if (!src || !val) continue;

      ratings.push({ source: src, value: val });
      const lowerSrc = src.toLowerCase();
      if (lowerSrc.includes("rotten tomatoes")) {
        rottenTomatoes = val;
      } else if (!metacriticFromRatings && lowerSrc.includes("metacritic")) {
        metacriticFromRatings = val.split("/")[0]?.trim() || val;
      } else if (
        !imdbFromRatings &&
        (lowerSrc.includes("internet movie database") || lowerSrc === "imdb")
      ) {
        imdbFromRatings = val.split("/")[0]?.trim() || val;
      }
    }
  }

  const metascore = cleanOmdbString(record.Metascore) ?? metacriticFromRatings;
  const metascoreNumber = metascore ? parseOmdbInt(metascore, /[^\d]/g) : null;

  const imdbRating = cleanOmdbString(record.imdbRating) ?? imdbFromRatings;
  const parsedImdbFloat = imdbRating ? Number.parseFloat(imdbRating) : Number.NaN;
  const imdbRatingNumber = Number.isFinite(parsedImdbFloat) ? parsedImdbFloat : null;

  const imdbVotes = cleanOmdbString(record.imdbVotes);
  const imdbVotesCount = imdbVotes ? parseOmdbInt(imdbVotes, /,/g) : null;

  const type = cleanOmdbString(record.Type);
  const dvd = cleanOmdbString(record.DVD);
  const boxOffice = cleanOmdbString(record.BoxOffice);
  const boxOfficeAmount = boxOffice ? parseOmdbInt(boxOffice, /[^\d]/g) : null;
  const production = cleanOmdbString(record.Production);
  const website = cleanOmdbString(record.Website);
  const totalSeasons = parseOmdbInt(record.totalSeasons, /[^\d]/g);

  return {
    title,
    year,
    startYear,
    endYear,
    rated,
    released,
    runtime,
    runtimeMinutes,
    genre,
    genres,
    director,
    directors,
    writer,
    writers,
    actors,
    actorsList,
    plot,
    language,
    languages,
    country,
    countries,
    awards,
    posterUrl,
    proxiedPosterUrl,
    ratings,
    metascore,
    metascoreNumber,
    imdbRating,
    imdbRatingNumber,
    imdbVotes,
    imdbVotesCount,
    imdbId,
    type,
    dvd,
    boxOffice,
    boxOfficeAmount,
    production,
    website,
    totalSeasons,
    rottenTomatoes,
  };
}

function parsePercentFromRatingValue(value: string): number {
  const trimmed = value.trim();
  if (trimmed.endsWith("%")) {
    const pct = Number.parseFloat(trimmed.slice(0, -1));
    return Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0;
  }
  if (trimmed.includes("/")) {
    const [numStr, denStr] = trimmed.split("/");
    const num = Number.parseFloat(numStr ?? "");
    const den = Number.parseFloat(denStr ?? "");
    if (Number.isFinite(num) && Number.isFinite(den) && den > 0) {
      return Math.min(100, Math.max(0, Math.round((num / den) * 100)));
    }
  }
  const direct = Number.parseFloat(trimmed);
  if (!Number.isFinite(direct)) return 0;
  return direct <= 10 ? Math.round(direct * 10) : Math.min(100, Math.max(0, Math.round(direct)));
}

export function buildMultiSourceRatings(options: {
  omdb?: OmdbTitleDetail | null;
  omdbLegacy?: OmdbRatings | null;
  tmdbVoteAverage?: number | null;
  tmdbVoteCount?: number | null;
  tmdbPopularity?: number | null;
  bayesianScore?: number | null;
  cinevaScore?: number | null;
  cinevaVoteCount?: number | null;
}): MultiSourceRatingsData | null {
  const items: RatingCardItem[] = [];
  const omdb = options.omdb ?? null;
  const legacy = options.omdbLegacy ?? null;

  const imdbScore = omdb?.imdbRating ?? legacy?.imdbRating ?? null;
  const imdbVotes = omdb?.imdbVotes ?? legacy?.imdbVotes ?? null;
  if (imdbScore) {
    const numeric = Number.parseFloat(imdbScore);
    items.push({
      id: "imdb",
      sourceName: "Internet Movie Database (IMDb)",
      shortName: "IMDb",
      score: imdbScore,
      scale: "/ 10",
      scorePercent: Number.isFinite(numeric) ? Math.round(numeric * 10) : 0,
      votes: imdbVotes ? `${imdbVotes} votes` : null,
      subtitle: "Global Audience & Industry Registry",
      glyph: "star",
    });
  }

  const rtScore = omdb?.rottenTomatoes ?? legacy?.rottenTomatoes ?? null;
  if (rtScore) {
    items.push({
      id: "rotten-tomatoes",
      sourceName: "Rotten Tomatoes",
      shortName: "Rotten Tomatoes",
      score: rtScore,
      scale: "%",
      scorePercent: parsePercentFromRatingValue(rtScore),
      votes: null,
      subtitle: "Verified Tomatometer Critic Consensus",
      glyph: "gauge",
    });
  }

  const metascore = omdb?.metascore ?? legacy?.metascore ?? null;
  if (metascore) {
    const cleanMeta = metascore.split("/")[0]?.trim() || metascore;
    items.push({
      id: "metacritic",
      sourceName: "Metacritic (Metascore)",
      shortName: "Metacritic",
      score: cleanMeta,
      scale: "/ 100",
      scorePercent: parsePercentFromRatingValue(`${cleanMeta}/100`),
      votes: null,
      subtitle: "Weighted Publication Critic Average",
      glyph: "meter",
    });
  }

  if (typeof options.tmdbVoteAverage === "number" && options.tmdbVoteAverage > 0) {
    const voteCount =
      typeof options.tmdbVoteCount === "number" && options.tmdbVoteCount > 0
        ? `${options.tmdbVoteCount.toLocaleString("en-US")} votes`
        : null;
    const popNote =
      typeof options.tmdbPopularity === "number" && options.tmdbPopularity > 0
        ? `Popularity Index ${options.tmdbPopularity.toFixed(1)}`
        : "TMDB Global Member Tally";
    items.push({
      id: "tmdb",
      sourceName: "The Movie Database (TMDB)",
      shortName: "TMDB Score",
      score: options.tmdbVoteAverage.toFixed(1),
      scale: "/ 10",
      scorePercent: Math.round(options.tmdbVoteAverage * 10),
      votes: voteCount,
      subtitle: popNote,
      glyph: "pulse",
    });
  }

  if (typeof options.bayesianScore === "number" && options.bayesianScore > 0) {
    items.push({
      id: "bayesian",
      sourceName: "Bayesian Weighted Rating (WR)",
      shortName: "Bayesian WR",
      score: options.bayesianScore.toFixed(2),
      scale: "/ 10",
      scorePercent: Math.round(options.bayesianScore * 10),
      votes:
        typeof options.cinevaVoteCount === "number" && options.cinevaVoteCount > 0
          ? `${options.cinevaVoteCount.toLocaleString("en-US")} archive votes`
          : null,
      subtitle: "Confidence-Adjusted Ranking Formula",
      glyph: "diamond",
    });
  } else if (typeof options.cinevaScore === "number" && options.cinevaScore > 0) {
    items.push({
      id: "cineva",
      sourceName: "CINEVA Editorial Acclaim",
      shortName: "CINEVA Index",
      score: `${Math.round(options.cinevaScore)}%`,
      scale: "%",
      scorePercent: Math.min(100, Math.max(0, Math.round(options.cinevaScore))),
      votes:
        typeof options.cinevaVoteCount === "number" && options.cinevaVoteCount > 0
          ? `${options.cinevaVoteCount.toLocaleString("en-US")} archive votes`
          : null,
      subtitle: "Curated Archival Acclaim Score",
      glyph: "diamond",
    });
  }

  // Include any extra rating sources returned dynamically in OMDb's Ratings[] array
  if (omdb?.ratings?.length) {
    for (const dyn of omdb.ratings) {
      const lower = dyn.source.toLowerCase();
      const alreadyHandled =
        lower.includes("internet movie database") ||
        lower === "imdb" ||
        lower.includes("rotten tomatoes") ||
        lower.includes("metacritic");
      if (alreadyHandled) continue;

      const slugId =
        lower.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `source-${items.length}`;
      items.push({
        id: `omdb-${slugId}`,
        sourceName: dyn.source,
        shortName: dyn.source,
        score: dyn.value,
        scale: dyn.value.includes("%") ? "%" : dyn.value.includes("/") ? "RATIO" : "SCORE",
        scorePercent: parsePercentFromRatingValue(dyn.value),
        votes: null,
        subtitle: "OMDb External Rating Feed",
        glyph: "star",
      });
    }
  }

  return items.length > 0 ? { items } : null;
}

function uniqueNonEmpty(list: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    if (!raw) continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

export function buildProductionDossierFromTmdbAndOmdb(options: {
  detail: TmdbWorkDetail;
  omdb?: OmdbTitleDetail | null;
}): ProductionReleaseDossierData {
  const { detail, omdb } = options;
  const directors = uniqueNonEmpty([
    ...detail.directors.map((d) => d.name),
    ...(omdb?.directors ?? []),
  ]);
  const writers = uniqueNonEmpty([
    ...(detail.writers?.map((w) => w.name) ?? []),
    ...(omdb?.writers ?? []),
  ]);
  const actors = uniqueNonEmpty([
    ...detail.cast.slice(0, 8).map((c) => c.name),
    ...(omdb?.actorsList ?? []),
  ]);
  const genres = uniqueNonEmpty([...detail.genreLabels, ...(omdb?.genres ?? [])]);
  const languages = uniqueNonEmpty([
    ...(detail.spokenLanguages?.map((l) => l.englishName || l.name) ?? []),
    ...(omdb?.languages ?? []),
    detail.originalLanguage.toUpperCase(),
  ]);
  const countries = uniqueNonEmpty([...detail.countries, ...(omdb?.countries ?? [])]);
  const studioNames = uniqueNonEmpty([
    ...detail.studios.map((s) => s.name),
    omdb?.production ?? null,
  ]);

  return {
    title: detail.title,
    originalTitle: detail.originalTitle !== detail.title ? detail.originalTitle : null,
    plot: omdb?.plot && omdb.plot.length > detail.synopsis.length ? omdb.plot : detail.synopsis,
    rated: omdb?.rated ?? detail.certification ?? null,
    released: omdb?.released ?? detail.releaseDate ?? null,
    runtime: omdb?.runtime ?? (detail.runtimeMinutes ? `${detail.runtimeMinutes} min` : null),
    type: omdb?.type ? omdb.type.toUpperCase() : detail.kind,
    genres,
    directors,
    writers,
    actors,
    languages,
    countries,
    awards: omdb?.awards ?? null,
    boxOffice: omdb?.boxOffice ?? null,
    budget: detail.formattedBudget ?? null,
    revenue: detail.formattedRevenue ?? null,
    production: studioNames.length > 0 ? studioNames.join(", ") : null,
    dvd: omdb?.dvd ?? null,
    website: omdb?.website ?? null,
    imdbId: omdb?.imdbId ?? detail.externalIds?.imdbId ?? null,
    tmdbId: detail.tmdbId,
    totalSeasons: detail.seasonCount ?? omdb?.totalSeasons ?? null,
    episodeCount: detail.episodeCount ?? null,
    statusLabel: detail.statusLabel ?? null,
  };
}

export function buildArtworkGalleryItems(options: {
  detail?: TmdbWorkDetail | null;
  omdb?: OmdbTitleDetail | null;
}): ArtworkGalleryItem[] {
  const gallery: ArtworkGalleryItem[] = [];
  const seenUrls = new Set<string>();

  const pushUnique = (item: ArtworkGalleryItem) => {
    if (!item.url || seenUrls.has(item.url)) return;
    seenUrls.add(item.url);
    gallery.push(item);
  };

  if (options.omdb?.proxiedPosterUrl) {
    pushUnique({
      id: `omdb-poster-${options.omdb.imdbId ?? "primary"}`,
      url: options.omdb.proxiedPosterUrl,
      kind: "poster",
      sourceLabel: "OMDb Theatrical Key Art",
      dimensionsLabel: "Official Poster",
      languageLabel: "EN",
    });
  }

  if (options.detail?.posterUrl) {
    pushUnique({
      id: `tmdb-primary-poster-${options.detail.tmdbId}`,
      url: options.detail.posterUrl,
      kind: "poster",
      sourceLabel: "TMDB Primary Key Art",
      dimensionsLabel: "2:3 Key Art",
      languageLabel: options.detail.originalLanguage.toUpperCase(),
    });
  }

  for (const [idx, poster] of (options.detail?.posters ?? []).entries()) {
    pushUnique({
      id: `tmdb-poster-${idx}`,
      url: poster.url,
      kind: "poster",
      sourceLabel: `TMDB Alternate Poster #${idx + 1}`,
      dimensionsLabel: `${poster.width}x${poster.height}`,
      languageLabel: (poster.language ?? "EN").toUpperCase(),
    });
  }

  for (const [idx, backdrop] of (options.detail?.backdrops ?? []).entries()) {
    pushUnique({
      id: `tmdb-backdrop-${idx}`,
      url: backdrop.url,
      kind: "backdrop",
      sourceLabel: `Theatrical Still #${idx + 1}`,
      dimensionsLabel: `${backdrop.width}x${backdrop.height}`,
      languageLabel: backdrop.language ? backdrop.language.toUpperCase() : null,
    });
  }

  return gallery;
}
