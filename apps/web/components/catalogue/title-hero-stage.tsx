"use client";

import type { TitleKind } from "@movie/contracts";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { KeyArt } from "@/components/art/key-art";
import { AuthorizedDownloadButton } from "@/components/catalogue/download-button";
import { WatchlistToggleButton } from "@/components/catalogue/watchlist-toggle";
import { AvailabilityBadge, Badge, ButtonLink } from "@/components/ui";
import type { OmdbRatings } from "@/lib/metadata/omdb-client";
import type {
  ArtworkGalleryItem,
  MultiSourceRatingsData,
  ProductionReleaseDossierData,
} from "@/lib/metadata/omdb-types";
import { CriticRatingsBadges } from "@/components/catalogue/critic-ratings-badges";
import { OfficialArtworkGallery } from "@/components/catalogue/official-artwork-gallery";
import { ProductionReleaseDossier } from "@/components/catalogue/production-release-dossier";
import { VerifiedRatingsBreakdown } from "@/components/catalogue/verified-ratings-breakdown";
import {
  getCinevaFilmBySlug,
  getCinevaSimilarTitles,
  getCinevaTopRatedMap,
} from "@/lib/catalogue/cineva-database";
import { pushRecentSeedSlug } from "@/lib/catalogue/recent-seeds";
import type { ArtSpec } from "@/lib/catalogue/types";

export interface TitleHeroStageProps {
  title: {
    id: string;
    slug: string;
    kind?: TitleKind;
    featureAssetId: string | null;
    originalTitle: string;
    originalLanguage: string;
    releaseYear: number;
    runtimeMinutes: number;
    maturityRating: string;
    isDevelopmentFixture: boolean;
    localizedTitleEn: string;
    localizedTitleBn?: string | null;
    synopsisEn: string;
    synopsisBn?: string | null;
    availability: {
      streamAllowed: boolean;
      downloadAllowed: boolean;
      metadataAllowed: boolean;
      badgeKind:
        | "stream_allowed"
        | "download_allowed"
        | "catalogue_only"
        | "region_restricted"
        | "rights_pending";
    };
    genres?: Array<{ slug: string; nameEn: string; nameBn?: string | null }>;
    credits?: Array<{
      department: string;
      characterName?: string | null;
      billingOrder: number;
      personSlug: string;
      nameEn: string;
      nameBn?: string | null;
    }>;
    sources?: Array<{
      provider: string;
      attributionText: string;
    }>;
  };
  territoryCode: string;
  isAuthenticated: boolean;
  initialSaved: boolean;
  criticRatings?: OmdbRatings | null;
  multiSourceRatings?: MultiSourceRatingsData | null;
  productionDossier?: ProductionReleaseDossierData | null;
  artworkGallery?: ArtworkGalleryItem[];
}

function formatRuntime(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatCountryName(languageCode: string, territoryCode: string): string {
  if (languageCode.toLowerCase() === "bn") return "Bangladesh";
  if (territoryCode === "BD") return "Bangladesh";
  return "International";
}

const DEFAULT_HERO_ART: ArtSpec = {
  motif: "shadow",
  option: "beams",
  palette: {
    bg: "#120204",
    bg2: "#4A070E",
    ink: "#050102",
    accent: "#E50914",
    light: "#FEF9EF",
  },
};

/**
 * Full-bleed Anamorphic Cinema-Crimson & Architectural Chiaroscuro Stage.
 * Combines generative architectural KeyArt with volumetric IMAX crimson projection cones,
 * optical aperture rings, horizon reflections, and authentic 35mm celluloid film grain.
 */
function CinemaCrimsonHeroBackdrop({ art }: { art: ArtSpec }) {
  return (
    <div
      aria-hidden="true"
      className="bg-ember-deep pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      {/* Generative Architectural Scene Layer */}
      <div className="absolute inset-0 opacity-55 mix-blend-screen">
        <KeyArt spec={art} variant="backdrop" className="h-full w-full object-cover" />
      </div>

      {/* Volumetric Cinema-Crimson Optical Projection & Architectural Horizon */}
      <svg
        viewBox="0 0 1440 860"
        preserveAspectRatio="xMidYMid slice"
        className="relative h-full w-full object-cover"
      >
        <defs>
          <radialGradient id="crimson-stage-dome" cx="50%" cy="48%" r="58%">
            <stop offset="0%" stopColor="#ff2e38" stopOpacity="0.62" />
            <stop offset="28%" stopColor="#e50914" stopOpacity="0.54" />
            <stop offset="58%" stopColor="#7a0912" stopOpacity="0.68" />
            <stop offset="84%" stopColor="#240306" stopOpacity="0.90" />
            <stop offset="100%" stopColor="#050102" stopOpacity="0.98" />
          </radialGradient>
          <linearGradient id="projector-beam-a" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor="#fef9ef" stopOpacity="0.16" />
            <stop offset="45%" stopColor="#e50914" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="horizon-flare" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e50914" stopOpacity="0" />
            <stop offset="35%" stopColor="#e50914" stopOpacity="0.65" />
            <stop offset="50%" stopColor="#fef9ef" stopOpacity="0.85" />
            <stop offset="65%" stopColor="#e50914" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#e50914" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="bottom-obsidian-fade" x1="0" y1="0.5" x2="0" y2="1">
            <stop offset="0%" stopColor="#090102" stopOpacity="0" />
            <stop offset="65%" stopColor="#050102" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.98" />
          </linearGradient>
        </defs>

        <rect width="1440" height="860" fill="url(#crimson-stage-dome)" />

        {/* Diagonal 35mm Projector Light Cones */}
        <polygon points="360,0 640,0 1080,860 660,860" fill="url(#projector-beam-a)" />
        <polygon points="840,0 1090,0 640,860 320,860" fill="url(#projector-beam-a)" />

        {/* Precision Optical Aperture & Anamorphic Reticle Framing the Center Play CTA */}
        <g transform="translate(720 438)">
          <circle
            r="268"
            fill="none"
            stroke="#fef9ef"
            strokeOpacity="0.11"
            strokeWidth="1"
            strokeDasharray="6 8"
          />
          <circle r="196" fill="none" stroke="#ff4d56" strokeOpacity="0.24" strokeWidth="1.2" />
          <circle
            r="128"
            fill="#160204"
            fillOpacity="0.42"
            stroke="#e50914"
            strokeOpacity="0.45"
            strokeWidth="1.4"
          />
          {/* Subtle optical crosshairs */}
          <line
            x1="-320"
            y1="0"
            x2="-150"
            y2="0"
            stroke="#fef9ef"
            strokeOpacity="0.18"
            strokeWidth="1"
          />
          <line
            x1="150"
            y1="0"
            x2="320"
            y2="0"
            stroke="#fef9ef"
            strokeOpacity="0.18"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1="-295"
            x2="0"
            y2="-150"
            stroke="#fef9ef"
            strokeOpacity="0.14"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1="150"
            x2="0"
            y2="295"
            stroke="#fef9ef"
            strokeOpacity="0.14"
            strokeWidth="1"
          />
        </g>

        {/* Anamorphic Horizontal Lens Streak at Horizon */}
        <rect x="140" y="568" width="1160" height="2" fill="url(#horizon-flare)" opacity="0.78" />

        {/* Architectural Colonnade & River Truss Perspective in Deep Chiaroscuro */}
        <g fill="#070102" opacity="0.88">
          <polygon points="0,860 0,590 280,572 340,860" />
          <polygon points="1440,860 1440,584 1140,570 1080,860" />
          {/* Bridge / Colonnade Piers */}
          <rect x="330" y="572" width="16" height="140" />
          <rect x="440" y="572" width="14" height="140" />
          <rect x="550" y="572" width="12" height="140" />
          <rect x="878" y="572" width="12" height="140" />
          <rect x="986" y="572" width="14" height="140" />
          <rect x="1094" y="572" width="16" height="140" />
          <rect x="260" y="568" width="920" height="6" />
        </g>

        {/* Diagonal Monsoon Rain Filaments */}
        <g stroke="#fef9ef" strokeOpacity="0.09" strokeWidth="1">
          <line x1="210" y1="90" x2="175" y2="230" />
          <line x1="390" y1="140" x2="355" y2="280" />
          <line x1="610" y1="60" x2="575" y2="200" />
          <line x1="890" y1="110" x2="855" y2="250" />
          <line x1="1140" y1="80" x2="1105" y2="220" />
          <line x1="1270" y1="210" x2="1235" y2="350" />
        </g>

        {/* Bottom Obsidian Transition Vignette */}
        <rect width="1440" height="860" fill="url(#bottom-obsidian-fade)" />
        <rect width="84" height="860" fill="#050102" opacity="0.38" />
        <rect x="1356" width="84" height="860" fill="#050102" opacity="0.48" />
      </svg>

      {/* Authentic 35mm Celluloid Film Grain & Optical Vignette */}
      <div className="art-grain" />
      <div className="cinema-vignette" />
    </div>
  );
}

export function TitleHeroStage({
  title,
  territoryCode,
  isAuthenticated,
  initialSaved,
  criticRatings,
  multiSourceRatings,
  productionDossier,
  artworkGallery,
}: TitleHeroStageProps) {
  const filmRecord = useMemo(() => getCinevaFilmBySlug(title.slug), [title.slug]);
  const topRanking = useMemo(() => getCinevaTopRatedMap().get(title.slug) ?? null, [title.slug]);
  const isSeries = (filmRecord?.kind ?? title.kind) === "SERIES";
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  useEffect(() => {
    pushRecentSeedSlug(title.slug);
  }, [title.slug]);

  const director = useMemo(
    () =>
      title.credits?.find((c) => c.department.toUpperCase() === "DIRECTOR") ??
      filmRecord?.credits.find((c) => c.department === "DIRECTOR") ??
      null,
    [filmRecord, title.credits],
  );

  const effectiveCredits = useMemo(() => {
    if (title.credits && title.credits.length > 0) return title.credits;
    return filmRecord?.credits ?? [];
  }, [filmRecord, title.credits]);

  const studioSource = useMemo(() => {
    if (filmRecord?.studio) return filmRecord.studio;
    const raw = title.sources?.[0]?.attributionText?.trim();
    if (!raw) return "CINEVA Originals";
    const cleaned = raw
      .replace(/^©\s*\d*\s*/i, "")
      .replace(/\.\s*Licensed for.*$/i, "")
      .trim();
    return cleaned || "CINEVA Originals";
  }, [filmRecord, title.sources]);

  const countryLabel = useMemo(
    () => filmRecord?.country ?? formatCountryName(title.originalLanguage, territoryCode),
    [filmRecord, title.originalLanguage, territoryCode],
  );

  const similarMatches = useMemo(() => getCinevaSimilarTitles(title.slug, 4), [title.slug]);
  const activeSeasonObj = useMemo(
    () =>
      filmRecord?.seasons?.find((s) => s.seasonNumber === selectedSeason) ??
      filmRecord?.seasons?.[0] ??
      null,
    [filmRecord, selectedSeason],
  );

  const breadcrumbCategory = director ? director.nameEn : (title.genres?.[0]?.nameEn ?? "Films");
  const primaryWatchHref = isSeries ? `/watch/${title.slug}?s=1&e=1` : `/watch/${title.slug}`;

  return (
    <article className="w-full">
      {/* 1. Full-Bleed Cinema Crimson & Anamorphic Hero Stage */}
      <section
        aria-label={`Hero showcase for ${title.localizedTitleEn}`}
        className="relative flex min-h-[calc(100dvh-3.5rem)] w-full flex-col justify-between overflow-hidden px-6 pt-5 pb-28 sm:px-10 sm:pt-7 sm:pb-20 lg:px-14 lg:pb-14"
      >
        <CinemaCrimsonHeroBackdrop art={filmRecord?.art ?? DEFAULT_HERO_ART} />

        {/* Top-Center Breadcrumb */}
        <nav aria-label="Breadcrumb" className="relative z-10 mb-6 flex justify-center">
          <ol className="text-text/75 flex flex-wrap items-center justify-center gap-2 text-xs">
            <li>
              <Link
                href="/"
                className="hover:text-text inline-flex min-h-11 items-center px-1.5 py-0.5 transition-colors motion-reduce:transition-none sm:min-h-6"
              >
                Main
              </Link>
            </li>
            <li aria-hidden="true" className="text-text/50">
              &gt;
            </li>
            <li>
              <Link
                href="/movies"
                className="hover:text-text inline-flex min-h-11 items-center px-1.5 py-0.5 transition-colors motion-reduce:transition-none sm:min-h-6"
              >
                Films
              </Link>
            </li>
            <li aria-hidden="true" className="text-text/50">
              &gt;
            </li>
            {director ? (
              <li>
                <Link
                  href={`/people/${director.personSlug}`}
                  className="hover:text-text inline-flex min-h-11 items-center px-1.5 py-0.5 transition-colors motion-reduce:transition-none sm:min-h-6"
                >
                  {breadcrumbCategory}
                </Link>
              </li>
            ) : (
              <li className="text-text/85">{breadcrumbCategory}</li>
            )}
            <li aria-hidden="true" className="text-text/50">
              &gt;
            </li>
            <li className="text-text font-semibold">{title.localizedTitleEn}</li>
          </ol>
        </nav>

        {/* Top Row: Monumental Title (Left) + Story Synopsis & Crimson Pill (Right) */}
        <div className="relative z-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_360px] lg:pr-24">
          <div>
            <h1 className="font-display text-text max-w-[11ch] text-5xl leading-[0.94] font-medium tracking-[-0.04em] sm:text-7xl lg:text-[5.5rem]">
              {title.localizedTitleEn}
            </h1>

            {title.genres && title.genres.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {title.genres.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/genres/${g.slug}`}
                    className="border-text/35 bg-canvas/30 text-text/90 hover:border-text hover:bg-canvas/55 rounded-pill inline-flex min-h-11 items-center border px-3.5 py-1 text-xs backdrop-blur-xs transition-colors motion-reduce:transition-none sm:min-h-7"
                  >
                    {g.nameEn}
                  </Link>
                ))}
                {filmRecord ? (
                  <span className="border-accent/60 bg-canvas/45 text-text rounded-pill border px-3 py-1 font-mono text-[11px] font-semibold">
                    {filmRecord.cinevaScore}% CINEVA Index
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Top-Right: Story Synopsis + Signature Crimson Pill Badge */}
          <div data-testid="hero-synopsis-column" className="space-y-4">
            <p className="text-text/95 max-w-[350px] text-xs leading-[1.6] sm:text-[13.5px]">
              {title.synopsisEn}
              {studioSource ? ` — ${studioSource}` : ""}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <span className="bg-accent text-on-accent rounded-pill inline-flex items-center gap-2.5 px-4 py-1.5 text-xs font-bold shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                <span className="font-display text-xs font-black tracking-tight">CINEVA</span>
                <span aria-hidden="true" className="bg-on-accent/35 h-3 w-px" />
                <span>{title.availability.streamAllowed ? "HD Stream" : "Archive"}</span>
              </span>

              {!title.availability.streamAllowed ? (
                <AvailabilityBadge kind={title.availability.badgeKind} />
              ) : null}
            </div>
          </div>
        </div>

        {/* Center Translucent Crimson-Glass Circular Play CTA */}
        <div className="relative z-10 my-8 flex flex-col items-center justify-center text-center sm:my-10 lg:pr-20">
          {title.availability.streamAllowed ? (
            <Link
              href={primaryWatchHref}
              className="group border-text/40 bg-bronze-glass hover:border-text/80 focus-visible:outline-accent relative flex h-22 w-22 items-center justify-center rounded-full border shadow-[0_18px_54px_rgba(229,9,20,0.42)] backdrop-blur-md transition-transform duration-300 hover:scale-105 focus:scale-105 motion-reduce:transform-none motion-reduce:transition-none sm:h-26 sm:w-26"
              aria-label={`Play stream for ${title.localizedTitleEn}`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="fill-text text-text h-8 w-8 translate-x-0.5 transition-transform duration-300 group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none sm:h-9 sm:w-9"
              >
                <polygon points="7,4 20,12 7,20" />
              </svg>
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="border-text/30 bg-bronze-glass text-text/80 flex h-22 w-22 cursor-not-allowed items-center justify-center rounded-full border backdrop-blur-md sm:h-26 sm:w-26"
                title={`Not currently streaming in ${territoryCode}`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-8 w-8"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <p className="text-text/80 mt-1 text-xs font-medium">
                Unavailable in {territoryCode}
              </p>
            </div>
          )}
        </div>

        {/* Floating Quick-Action Rail */}
        <div
          aria-label="Quick Actions"
          className="border-border bg-canvas-raised/90 divide-border/70 relative z-20 mx-auto mb-28 flex w-fit flex-row items-center justify-center divide-x rounded-2xl border p-1 shadow-[0_18px_42px_rgba(0,0,0,0.75)] backdrop-blur-md sm:mb-8 lg:absolute lg:top-1/2 lg:right-6 lg:mb-0 lg:-translate-y-1/2 lg:flex-col lg:divide-x-0 lg:divide-y"
        >
          <a
            href="#download-section"
            className="text-text-secondary hover:text-text flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 px-2.5 py-2 transition-colors motion-reduce:transition-none lg:min-h-14 lg:min-w-12"
            aria-label="Jump to Download Section"
            title={
              title.availability.downloadAllowed && title.featureAssetId
                ? "Download Film"
                : "Watch & Save Options"
            }
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span aria-hidden="true" className="text-text-muted text-[9px] leading-none">
              Download
            </span>
          </a>

          <a
            href="#credits"
            className="text-text-secondary hover:text-text relative flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 px-2.5 py-2 transition-colors motion-reduce:transition-none lg:min-h-14 lg:min-w-12"
            aria-label="Jump to Cast and Crew"
            title="Cast & Crew"
          >
            <div className="relative">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.13 1.05 4.06 2.75 5.48L4 21l4.82-2.26c1.01.26 2.08.4 3.18.4 5.52 0 10-3.58 10-8.14C22 6.58 17.52 3 12 3z" />
              </svg>
              <span
                aria-hidden="true"
                className="bg-accent border-canvas-raised absolute -top-1 -right-1.5 h-2.5 w-2.5 rounded-full border"
              />
            </div>
            <span aria-hidden="true" className="text-text-muted text-[9px] leading-none">
              Cast
            </span>
          </a>

          <a
            href="#details"
            className="text-text-secondary hover:text-text flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 px-2.5 py-2 transition-colors motion-reduce:transition-none lg:min-h-14 lg:min-w-12"
            aria-label="Scroll to Details"
            title="Technical Details"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
              <polygon points="7,4 20,12 7,20" />
            </svg>
            <span aria-hidden="true" className="text-text-muted text-[9px] leading-none">
              Details
            </span>
          </a>
        </div>

        {/* Bottom-Left Stacked Cream-Outlined Metadata Ledger */}
        <div data-testid="hero-metadata-ledger" className="relative z-10 max-w-md lg:pr-24">
          <dl className="grid grid-cols-[68px_1fr] items-center gap-x-3 gap-y-2 text-xs">
            <dt className="text-text/85 font-medium">Country:</dt>
            <dd className="flex flex-wrap gap-2">
              <span className="border-text/75 text-text rounded-pill border px-4 py-1 font-medium">
                {countryLabel}
              </span>
            </dd>

            <dt className="text-text/85 font-medium">Studio:</dt>
            <dd>
              {filmRecord?.studioSlug ? (
                <Link
                  href={`/studios/${filmRecord.studioSlug}`}
                  className="border-text/75 text-text hover:border-accent hover:bg-canvas/45 rounded-pill inline-flex min-h-11 max-w-[240px] items-center truncate border px-4 py-1 font-medium transition-colors motion-reduce:transition-none sm:min-h-7"
                >
                  {studioSource}
                </Link>
              ) : (
                <span className="border-text/75 text-text rounded-pill inline-block max-w-[240px] truncate border px-4 py-1 font-medium">
                  {studioSource}
                </span>
              )}
            </dd>

            <dt className="text-text/85 font-medium">Time:</dt>
            <dd>
              <span className="border-text/75 text-text rounded-pill inline-block border px-4 py-1 font-medium">
                {isSeries
                  ? `${filmRecord?.seasons?.length ?? 1} Seasons · ${title.runtimeMinutes}m/ep`
                  : formatRuntime(title.runtimeMinutes)}
              </span>
            </dd>

            <dt className="text-text/85 font-medium">Date:</dt>
            <dd>
              <span className="border-text/75 text-text rounded-pill inline-block border px-4 py-1 font-medium">
                {title.releaseYear}
              </span>
            </dd>

            <dt className="text-text/85 font-medium">Rate:</dt>
            <dd>
              <span className="border-text/75 text-text rounded-pill inline-block border px-4 py-1 font-medium">
                {title.maturityRating}
              </span>
            </dd>
          </dl>
        </div>
      </section>

      {/* 2. Below-the-Fold Movie Database & Streaming Sections */}
      <div className="cg-container space-y-14 py-14 sm:py-20">
        {/* Watch, Save & Score Bar */}
        <section
          id="download-section"
          aria-label="Title actions"
          className="cg-surface flex flex-col justify-between gap-6 p-6 sm:p-8 lg:flex-row lg:items-center"
        >
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">
                {topRanking
                  ? `#${topRanking.topRank} Top Rated · WR ${topRanking.bayesianScore.toFixed(2)}`
                  : filmRecord
                    ? `${filmRecord.cinevaScore}% CINEVA Index`
                    : "CINEVA Selection"}
              </Badge>
              <CriticRatingsBadges ratings={criticRatings} variant="scorebar" />
              {isSeries ? (
                <Badge tone="info">
                  Original Series · {filmRecord?.seasons?.length ?? 1} Seasons
                </Badge>
              ) : null}
              {filmRecord ? (
                <>
                  <Badge tone="neutral">{filmRecord.aspectRatio}</Badge>
                  <Badge tone="neutral">{filmRecord.soundMix}</Badge>
                </>
              ) : null}
            </div>
            <h2 className="font-display text-text text-xl font-semibold sm:text-2xl">
              {filmRecord?.tagline ?? "Watch & Save"}
            </h2>
            <p className="text-text-secondary text-xs sm:text-sm">
              Stream instantly in adaptive high definition with English subtitles, or save to your
              personal watchlist.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {title.availability.streamAllowed ? (
              <ButtonLink href={primaryWatchHref} variant="primary" size="md">
                {isSeries ? "Play S1:E1" : "Watch Now"}
              </ButtonLink>
            ) : null}

            {title.availability.downloadAllowed && title.featureAssetId ? (
              <AuthorizedDownloadButton
                assetId={title.featureAssetId}
                isAuthenticated={isAuthenticated}
              />
            ) : null}

            <WatchlistToggleButton
              titleId={title.id}
              initialSaved={initialSaved}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </section>

        {multiSourceRatings ? <VerifiedRatingsBreakdown ratings={multiSourceRatings} /> : null}

        {artworkGallery && artworkGallery.length > 1 ? (
          <OfficialArtworkGallery
            title={title.localizedTitleEn || title.originalTitle}
            items={artworkGallery}
            fallbackArt={filmRecord?.art ?? DEFAULT_HERO_ART}
          />
        ) : null}

        {productionDossier ? <ProductionReleaseDossier dossier={productionDossier} /> : null}

        {/* Interactive Seasons & Episodes Guide (for SERIES) */}
        {isSeries && filmRecord?.seasons && filmRecord.seasons.length > 0 ? (
          <section
            id="episodes"
            aria-labelledby="episodes-heading"
            data-testid="series-episodes-guide"
            className="space-y-5"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-accent font-mono text-xs tracking-widest uppercase">
                  Episodic Master Guide
                </p>
                <h2 id="episodes-heading" className="font-display text-text text-2xl font-bold">
                  Seasons &amp; Episodes
                </h2>
              </div>

              <div
                role="group"
                aria-label="Select season"
                className="flex flex-wrap items-center gap-2"
              >
                {filmRecord.seasons.map((season) => {
                  const active = activeSeasonObj?.seasonNumber === season.seasonNumber;
                  return (
                    <button
                      key={season.seasonNumber}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedSeason(season.seasonNumber)}
                      className={`rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center border px-4 py-1.5 font-mono text-xs font-semibold transition-colors motion-reduce:transition-none md:min-h-9 ${
                        active
                          ? "border-accent bg-accent text-on-accent"
                          : "border-border bg-surface-1 text-text-secondary hover:border-border-strong hover:text-text"
                      }`}
                    >
                      {season.titleEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeSeasonObj ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {activeSeasonObj.episodes.map((ep) => (
                  <Link
                    key={`s${ep.seasonNumber}-e${ep.episodeNumber}`}
                    href={`/watch/${title.slug}?s=${ep.seasonNumber}&e=${ep.episodeNumber}`}
                    className="group border-border bg-surface-1 hover:border-accent flex flex-col justify-between rounded-xl border p-5 transition-colors motion-reduce:transition-none"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="border-accent/45 bg-accent/10 text-accent rounded-xs border px-2 py-0.5 font-mono text-[11px] font-bold">
                          S{ep.seasonNumber}:E{ep.episodeNumber}
                        </span>
                        <span className="text-text-muted font-mono text-xs">
                          {ep.runtimeMinutes}m
                        </span>
                      </div>
                      <h3 className="font-display text-text group-hover:text-accent text-lg font-bold transition-colors motion-reduce:transition-none">
                        {ep.titleEn}
                      </h3>
                      <p className="text-text-secondary pt-1 text-xs leading-relaxed">
                        {ep.synopsisEn}
                      </p>
                    </div>
                    <span className="text-accent mt-4 inline-flex items-center gap-1.5 font-mono text-xs font-semibold">
                      <svg
                        aria-hidden="true"
                        className="h-3.5 w-3.5 fill-current"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span>Play Episode {ep.episodeNumber} →</span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* Interactive Scene Chapters (Netflix / Criterion Scene Index) */}
        {filmRecord && title.availability.streamAllowed ? (
          <section aria-labelledby="chapters-heading" className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-accent font-mono text-xs tracking-widest uppercase">
                  Direct Scene Access
                </p>
                <h2 id="chapters-heading" className="font-display text-text text-2xl font-bold">
                  Scene Chapters
                </h2>
              </div>
              <span className="text-text-muted font-mono text-xs">
                {filmRecord.chapters.length} Chapters
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {filmRecord.chapters.map((ch) => (
                <Link
                  key={ch.index}
                  href={`/watch/${title.slug}?t=${ch.startSeconds}`}
                  className="group border-border bg-surface-1 hover:border-accent flex flex-col justify-between rounded-lg border p-4 transition-colors motion-reduce:transition-none"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-accent font-mono text-[11px] font-semibold">
                        CH {String(ch.index).padStart(2, "0")}
                      </span>
                      <span className="border-border bg-surface-2 text-text-muted rounded-xs border px-1.5 py-0.5 font-mono text-[10px]">
                        {formatTimestamp(ch.startSeconds)}
                      </span>
                    </div>
                    <h3 className="font-display text-text group-hover:text-accent text-sm font-semibold">
                      {ch.title}
                    </h3>
                    <p className="text-text-secondary line-clamp-3 text-xs leading-relaxed">
                      {ch.summary}
                    </p>
                  </div>
                  <span className="text-accent mt-3 inline-flex items-center gap-1 font-mono text-[11px] font-semibold">
                    Play Scene →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Cast & Crew Database Grid */}
        {effectiveCredits.length > 0 ? (
          <section id="credits" aria-labelledby="credits-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-accent font-mono text-xs tracking-widest uppercase">
                  Filmography Database
                </p>
                <h2 id="credits-heading" className="font-display text-text text-2xl font-bold">
                  Cast &amp; Crew
                </h2>
              </div>
              <span className="text-text-muted font-mono text-xs">
                {effectiveCredits.length} Credits
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {effectiveCredits.map((c) => (
                <div
                  key={`${c.personSlug}-${c.department}-${c.billingOrder}`}
                  className="cg-surface hover:border-accent/60 flex flex-col justify-between p-4 transition-colors motion-reduce:transition-none"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-accent font-mono text-[11px] font-semibold tracking-wider uppercase">
                        {c.department}
                      </span>
                      <span className="text-text-muted font-mono text-[10px]">
                        #{String(c.billingOrder).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="text-text mt-2 text-base font-semibold">
                      <Link
                        href={`/people/${c.personSlug}`}
                        className="hover:text-accent inline-flex min-h-11 items-center transition-colors motion-reduce:transition-none sm:min-h-6"
                      >
                        {c.nameEn}
                      </Link>
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    {c.characterName ? (
                      <p className="text-text-muted font-mono text-xs">as {c.characterName}</p>
                    ) : (
                      <span />
                    )}
                    {c.department.toUpperCase() === "DIRECTOR" ||
                    c.department.toUpperCase() === "ACTOR" ? (
                      <Link
                        href={
                          c.department.toUpperCase() === "DIRECTOR"
                            ? `/movies?director=${c.personSlug}`
                            : `/movies?cast=${c.personSlug}`
                        }
                        className="text-accent hover:text-text inline-flex min-h-11 items-center px-1 font-mono text-[11px] font-semibold transition-colors motion-reduce:transition-none sm:min-h-6"
                      >
                        Filter Works →
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Full Technical & Archival Specifications Ledger */}
        <section id="details" aria-labelledby="details-heading" className="space-y-4">
          <div>
            <p className="text-accent font-mono text-xs tracking-widest uppercase">
              Master Technical Sheet
            </p>
            <h2 id="details-heading" className="font-display text-text text-2xl font-bold">
              Technical &amp; Release Details
            </h2>
          </div>
          <div className="cg-surface p-6 sm:p-8">
            <dl className="grid grid-cols-1 gap-6 font-mono text-xs sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-text-muted uppercase">Original Title</dt>
                <dd className="text-text mt-1 font-sans text-sm font-medium">
                  {title.originalTitle}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted uppercase">Audio Language</dt>
                <dd className="text-text mt-1 font-sans text-sm font-medium">
                  {title.originalLanguage.toUpperCase()} · Subtitles EN
                </dd>
              </div>
              <div>
                <dt className="text-text-muted uppercase">Release Year</dt>
                <dd className="text-text mt-1 font-sans text-sm font-medium">
                  {title.releaseYear}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted uppercase">Runtime</dt>
                <dd className="text-text mt-1 font-sans text-sm font-medium">
                  {title.runtimeMinutes} minutes ({formatRuntime(title.runtimeMinutes)})
                </dd>
              </div>
              <div>
                <dt className="text-text-muted uppercase">Aspect Ratio</dt>
                <dd className="text-text mt-1 font-sans text-sm font-medium">
                  {filmRecord?.aspectRatio ?? "2.39:1 Anamorphic"}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted uppercase">Sound Mix</dt>
                <dd className="text-text mt-1 font-sans text-sm font-medium">
                  {filmRecord?.soundMix ?? "5.1 Surround"}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted uppercase">Negative &amp; Color</dt>
                <dd className="text-text mt-1 font-sans text-sm font-medium">
                  {filmRecord
                    ? `${filmRecord.negativeFormat} · ${filmRecord.colorProcess}`
                    : "35mm Digital Intermediate"}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted uppercase">Studio &amp; Territory</dt>
                <dd className="text-text mt-1 font-sans text-sm font-medium">
                  {studioSource} ({territoryCode})
                </dd>
              </div>
              {filmRecord?.filmingLocations?.length ? (
                <div className="sm:col-span-2">
                  <dt className="text-text-muted uppercase">Principal Photography Locations</dt>
                  <dd className="text-text mt-1 font-sans text-sm font-medium">
                    {filmRecord.filmingLocations.join(" · ")}
                  </dd>
                </div>
              ) : null}
              {filmRecord?.awardsNote ? (
                <div className="sm:col-span-2">
                  <dt className="text-text-muted uppercase">Critical &amp; Archival Recognition</dt>
                  <dd className="text-text mt-1 font-sans text-sm font-medium">
                    {filmRecord.awardsNote}
                  </dd>
                </div>
              ) : null}
              <CriticRatingsBadges ratings={criticRatings} variant="ledger" />
            </dl>
          </div>
        </section>

        {/* Source & Legal Rights Attribution */}
        {title.sources && title.sources.length > 0 ? (
          <section aria-labelledby="rights-attribution-heading" className="space-y-4">
            <div>
              <p className="text-accent font-mono text-xs tracking-widest uppercase">
                Verified Provenance
              </p>
              <h2
                id="rights-attribution-heading"
                className="font-display text-text text-2xl font-bold"
              >
                Source &amp; Legal Rights Attribution
              </h2>
            </div>
            <div className="cg-surface flex flex-wrap items-center justify-between gap-4 p-6">
              <div className="space-y-1">
                <p className="text-text text-sm font-semibold">
                  {title.sources.map((s) => s.attributionText).join(" · ")}
                </p>
                <p className="text-text-muted font-mono text-xs">
                  {title.sources.map((s) => s.provider).join(", ")} · Territory Gate:{" "}
                  {territoryCode}
                </p>
              </div>
              <AvailabilityBadge kind={title.availability.badgeKind} />
            </div>
          </section>
        ) : null}

        {/* More Like This — Mathematical Similarity Graph Recommendations */}
        {similarMatches.length > 0 ? (
          <section
            aria-labelledby="more-like-this-heading"
            data-testid="more-like-this-section"
            className="space-y-4"
          >
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-accent font-mono text-xs tracking-widest uppercase">
                  IDF Cosine + Director / Cast / Universe Graph
                </p>
                <h2
                  id="more-like-this-heading"
                  className="font-display text-text text-2xl font-bold"
                >
                  More Like This on CINEVA
                </h2>
              </div>
              <Link href="/movies" className="text-accent hover:text-text text-xs font-semibold">
                Explore All Titles →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {similarMatches.map(({ film: rec, match }) => (
                <Link
                  key={rec.slug}
                  href={`/movies/${rec.slug}`}
                  className="group border-border bg-surface-1 hover:border-accent/70 flex flex-col overflow-hidden rounded-lg border transition-colors motion-reduce:transition-none"
                >
                  <div className="relative aspect-video w-full overflow-hidden">
                    <KeyArt
                      spec={rec.art}
                      variant="backdrop"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
                    />
                    <div className="art-grain" />
                    <span className="border-success/50 bg-canvas/90 text-success absolute top-2.5 left-2.5 rounded-xs border px-2 py-0.5 font-mono text-[10px] font-bold">
                      {match.matchPercentage}% Match
                    </span>
                    <span className="border-border-strong bg-canvas/90 text-text absolute top-2.5 right-2.5 rounded-xs border px-2 py-0.5 font-mono text-[10px] font-semibold">
                      {rec.kind === "SERIES"
                        ? `Series · ${rec.seasons?.length ?? 1}S`
                        : `${rec.runtimeMinutes}m`}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <p className="text-text-muted font-mono text-[11px]">
                        {rec.releaseYear} · {rec.studio} · WR {match.bayesianScore.toFixed(2)}
                      </p>
                      <h3 className="font-display text-text group-hover:text-accent mt-1 text-base font-semibold">
                        {rec.localizedTitleEn}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {match.reasons.slice(0, 2).map((reason) => (
                          <span
                            key={reason}
                            className="border-accent/35 bg-accent/10 text-text-secondary rounded-xs border px-1.5 py-0.5 font-mono text-[10px]"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                      <p className="text-text-secondary mt-2 line-clamp-2 text-xs leading-relaxed">
                        {rec.synopsisEn}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}

export default TitleHeroStage;
