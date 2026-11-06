"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AuthorizedDownloadButton } from "@/components/catalogue/download-button";
import { WatchlistToggleButton } from "@/components/catalogue/watchlist-toggle";
import { AvailabilityBadge, ButtonLink } from "@/components/ui";

export interface TitleHeroStageProps {
  title: {
    id: string;
    slug: string;
    featureAssetId: string | null;
    originalTitle: string;
    originalLanguage: string;
    releaseYear: number;
    runtimeMinutes: number;
    maturityRating: string;
    isDevelopmentFixture: boolean;
    localizedTitleEn: string;
    localizedTitleBn: string | null;
    synopsisEn: string;
    synopsisBn: string | null;
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
}

function formatRuntime(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatCountryName(languageCode: string, territoryCode: string): string {
  if (languageCode.toLowerCase() === "bn") return "Bangladesh";
  if (territoryCode === "BD") return "Bangladesh";
  return "International";
}

/**
 * Full-bleed Cinema Crimson, Obsidian & Chiaroscuro Ensemble Backdrop.
 * Captures volumetric theatrical cinema-red rays, ruby rim highlights,
 * and dramatic layered chiaroscuro silhouettes while staying 100% original SVG vector art.
 */
function CinemaCrimsonHeroBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="bg-ember-deep pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      <svg
        viewBox="0 0 1440 860"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full object-cover"
      >
        <defs>
          <radialGradient id="crimson-halo-core" cx="50%" cy="54%" r="54%">
            <stop offset="0%" stopColor="#ff2a34" />
            <stop offset="28%" stopColor="#e50914" />
            <stop offset="56%" stopColor="#b8141b" />
            <stop offset="78%" stopColor="#48080d" />
            <stop offset="100%" stopColor="#120203" />
          </radialGradient>
          <radialGradient id="crimson-sun-disc" cx="50%" cy="46%" r="36%">
            <stop offset="0%" stopColor="#ff5c64" stopOpacity="0.92" />
            <stop offset="52%" stopColor="#e50914" stopOpacity="0.70" />
            <stop offset="85%" stopColor="#780d14" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#220406" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="crimson-silhouette" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#220406" />
            <stop offset="45%" stopColor="#120203" />
            <stop offset="100%" stopColor="#050102" />
          </linearGradient>
          <linearGradient id="crimson-mid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#48080d" />
            <stop offset="50%" stopColor="#1a0406" />
            <stop offset="100%" stopColor="#0a0203" />
          </linearGradient>
          <linearGradient id="rim-ruby" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff5c64" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#ff2a34" stopOpacity="0.60" />
            <stop offset="100%" stopColor="#48080d" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="bottom-cinema-fade" x1="0" y1="0.58" x2="0" y2="1">
            <stop offset="0%" stopColor="#120203" stopOpacity="0" />
            <stop offset="68%" stopColor="#090102" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.98" />
          </linearGradient>
        </defs>

        {/* Base Obsidian & Volumetric Cinema Crimson Dome */}
        <rect width="1440" height="860" fill="url(#crimson-halo-core)" />
        <circle cx="720" cy="490" r="560" fill="#b8141b" opacity="0.35" />
        <circle cx="720" cy="470" r="465" fill="url(#crimson-sun-disc)" />

        {/* Volumetric Cinema Crimson & Ruby Diagonal Light Rays */}
        <polygon points="480,0 760,0 1120,860 760,860" fill="#ff2a34" opacity="0.12" />
        <polygon points="780,0 980,0 520,860 280,860" fill="#e50914" opacity="0.09" />

        {/* Distant Horizon Markers on Left */}
        <g stroke="#220406" strokeWidth="2" fill="#120203" opacity="0.75">
          <line x1="150" y1="362" x2="232" y2="362" />
          <line x1="164" y1="357" x2="218" y2="367" strokeWidth="1.2" />
          <circle cx="191" cy="363" r="3" />
          <line x1="205" y1="382" x2="276" y2="382" />
          <circle cx="240" cy="383" r="2.5" />
          <line x1="168" y1="404" x2="248" y2="404" />
          <circle cx="208" cy="405" r="3" />
        </g>

        {/* Upper-Left Lead Heroic Silhouette with Ruby Rim-Light & Vertical Blade */}
        <g>
          <path
            d="M320 860 C342 540, 398 358, 492 332 C474 282, 488 188, 562 176 C634 164, 678 228, 654 316 C724 348, 766 490, 788 860 Z"
            fill="url(#crimson-silhouette)"
          />
          <path
            d="M502 196 C546 158, 636 168, 662 248 C672 280, 660 310, 646 326"
            stroke="url(#rim-ruby)"
            strokeWidth="3.5"
            fill="none"
          />
          {/* Vertical ceremonial blade catching crimson glint */}
          <polygon points="434,270 446,640 416,640" fill="#160305" />
          <line
            x1="434"
            y1="270"
            x2="440"
            y2="580"
            stroke="#ff5c64"
            strokeWidth="1.8"
            opacity="0.80"
          />
        </g>

        {/* Upper-Right Poised Lead Profile Silhouette */}
        <g>
          <path
            d="M726 860 C746 530, 798 382, 862 356 C842 308, 852 214, 922 206 C988 198, 1022 256, 998 332 C988 362, 964 376, 948 386 C1012 426, 1054 560, 1076 860 Z"
            fill="url(#crimson-mid)"
          />
          <path
            d="M936 206 C992 208, 1018 262, 996 330"
            stroke="url(#rim-ruby)"
            strokeWidth="3"
            fill="none"
          />
        </g>

        {/* Atmospheric Theatrical Mist Veil Bridging Midground & Foreground */}
        <ellipse cx="720" cy="560" rx="560" ry="95" fill="#780d14" opacity="0.25" />

        {/* Central Hooded Figure Framing the Play Disc */}
        <g>
          <path
            d="M535 860 C568 575, 636 386, 720 382 C804 386, 872 575, 905 860 Z"
            fill="#120203"
          />
          <path
            d="M608 660 C628 492, 668 394, 720 390 C772 394, 812 492, 832 660"
            stroke="url(#rim-ruby)"
            strokeWidth="2.8"
            fill="none"
          />
        </g>

        {/* Lower Left & Right Supporting Ensemble Silhouettes */}
        <path
          d="M235 820 C252 678, 294 612, 355 596 C338 552, 352 496, 398 496 C444 496, 460 548, 444 594 C495 616, 528 686, 540 820 Z"
          fill="#160305"
          opacity="0.94"
        />
        <path
          d="M440 850 C464 724, 512 668, 576 654 C562 608, 580 556, 628 556 C676 556, 692 608, 676 654 C736 674, 774 736, 792 850 Z"
          fill="#100203"
        />
        <path
          d="M820 850 C842 720, 888 662, 950 648 C936 600, 954 544, 1006 544 C1058 544, 1076 598, 1058 648 C1118 672, 1156 738, 1172 850 Z"
          fill="#120203"
        />
        <path
          d="M1010 790 C1026 664, 1064 606, 1116 592 C1102 544, 1118 486, 1166 486 C1214 486, 1230 542, 1212 592 C1262 614, 1294 678, 1308 790 Z"
          fill="#160305"
          opacity="0.90"
        />

        {/* Deep Obsidian Bottom Scrim for Crystal-Clear Pills & Dock */}
        <rect width="1440" height="860" fill="url(#bottom-cinema-fade)" />
      </svg>

      {/* Subtle 35mm Film Grain */}
      <div className="art-grain" />
    </div>
  );
}

export function TitleHeroStage({
  title,
  territoryCode,
  isAuthenticated,
  initialSaved,
}: TitleHeroStageProps) {
  const director = useMemo(() => {
    return title.credits?.find((c) => c.department === "DIRECTOR") ?? null;
  }, [title.credits]);

  const studioSource = useMemo(() => {
    const raw = title.sources?.[0]?.attributionText ?? "Cineva Originals";
    return (
      raw
        .replace(/^©\s*/i, "")
        .replace(/\.\s*Licensed for.*$/i, "")
        .replace(/Cinematic Graphite/gi, "Cineva")
        .replace(/Development Showcase Fixture/gi, "Originals")
        .replace(/\(Non-Production\)/gi, "")
        .trim() || "Cineva Originals"
    );
  }, [title.sources]);

  const countryLabel = useMemo(
    () => formatCountryName(title.originalLanguage, territoryCode),
    [territoryCode, title.originalLanguage],
  );

  const breadcrumbCategory = director ? director.nameEn : (title.genres?.[0]?.nameEn ?? "Films");

  return (
    <article className="w-full">
      {/* 1. Full-Bleed Theatrical Cinema Crimson & Chiaroscuro Hero Stage (Exact Image 2 Composition) */}
      <section
        aria-label={`Hero showcase for ${title.localizedTitleEn}`}
        className="relative flex min-h-[calc(100dvh-3.5rem)] w-full flex-col justify-between overflow-hidden px-6 pt-5 pb-28 sm:px-10 sm:pt-7 sm:pb-20 lg:px-14 lg:pb-14"
      >
        <CinemaCrimsonHeroBackdrop />

        {/* Top-Center Breadcrumb */}
        <nav aria-label="Breadcrumb" className="relative z-10 mb-6 flex justify-center">
          <ol className="text-text/75 flex flex-wrap items-center justify-center gap-2 text-xs">
            <li>
              <Link
                href="/"
                className="hover:text-text transition-colors motion-reduce:transition-none"
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
                className="hover:text-text transition-colors motion-reduce:transition-none"
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
                  className="hover:text-text transition-colors motion-reduce:transition-none"
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

        {/* Top Row: Monumental Title (Left) + Story Synopsis & Crimson Pill (Right, reserves lg:pr-24) */}
        <div className="relative z-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_360px] lg:pr-24">
          {/* Top-Left: Monumental Multi-Line Pure-White Title */}
          <div>
            <h1 className="font-display text-text max-w-[11ch] text-5xl leading-[0.94] font-medium tracking-[-0.04em] sm:text-7xl lg:text-[5.5rem]">
              {title.localizedTitleEn}
            </h1>

            {title.localizedTitleBn ? (
              <p
                className="font-display text-text/85 mt-3 text-xl font-medium sm:text-2xl"
                lang="bn"
              >
                {title.localizedTitleBn}
              </p>
            ) : null}

            {title.genres && title.genres.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {title.genres.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/genres/${g.slug}`}
                    className="border-text/35 bg-canvas/25 text-text/90 hover:border-text hover:bg-canvas/45 rounded-pill border px-3 py-1 text-xs backdrop-blur-xs transition-colors motion-reduce:transition-none"
                  >
                    {g.nameEn}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {/* Top-Right: Story Synopsis + Vibrant Crimson (#E50914) Pill Badge */}
          <div data-testid="hero-synopsis-column" className="space-y-4">
            <p className="text-text/95 max-w-[350px] text-xs leading-[1.6] sm:text-[13.5px]">
              {title.synopsisEn}
              {studioSource ? ` — ${studioSource}` : ""}
            </p>

            {title.synopsisBn ? (
              <p className="text-text/80 max-w-[350px] text-xs leading-relaxed" lang="bn">
                {title.synopsisBn}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <span className="bg-accent text-on-accent rounded-pill inline-flex items-center gap-2.5 px-4 py-1.5 text-xs font-bold shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
                <span className="font-display text-xs font-black tracking-tight">CINEVA</span>
                <span aria-hidden="true" className="bg-on-accent/25 h-3 w-px" />
                <span>{title.availability.streamAllowed ? "HD Stream" : "Archive"}</span>
              </span>

              {!title.availability.streamAllowed ? (
                <AvailabilityBadge kind={title.availability.badgeKind} />
              ) : null}
            </div>
          </div>
        </div>

        {/* Center Translucent Crimson Glass Circular Play CTA (Exact Image 2 Centerpiece) */}
        <div className="relative z-10 my-8 flex flex-col items-center justify-center text-center sm:my-10 lg:pr-20">
          {title.availability.streamAllowed ? (
            <Link
              href={`/watch/${title.slug}`}
              className="group border-accent/50 bg-crimson-glass hover:border-accent focus-visible:outline-accent relative flex h-22 w-22 items-center justify-center rounded-full border shadow-[0_18px_50px_rgba(0,0,0,0.5)] backdrop-blur-md transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_36px_rgba(229,9,20,0.40)] focus:scale-105 motion-reduce:transform-none motion-reduce:transition-none sm:h-26 sm:w-26"
              aria-label={`Play stream for ${title.localizedTitleEn}`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="fill-text text-text h-8 w-8 translate-x-0.5 transition-transform duration-300 group-hover:scale-110 motion-reduce:transform-none sm:h-9 sm:w-9"
              >
                <polygon points="7,4 20,12 7,20" />
              </svg>
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="border-border bg-crimson-glass text-text/80 flex h-22 w-22 cursor-not-allowed items-center justify-center rounded-full border backdrop-blur-md sm:h-26 sm:w-26"
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

        {/* Floating Quick-Action Rail: Normal-flow horizontal bar on <lg, Right-edge vertical charcoal rail on lg+ */}
        <div
          aria-label="Quick Actions"
          className="border-border bg-canvas-raised/90 divide-border/70 relative z-20 mx-auto mb-28 flex w-fit flex-row items-center justify-center divide-x rounded-2xl border p-1 shadow-[0_18px_42px_rgba(0,0,0,0.75)] backdrop-blur-md sm:mb-8 lg:absolute lg:top-1/2 lg:right-6 lg:mb-0 lg:-translate-y-1/2 lg:flex-col lg:divide-x-0 lg:divide-y"
        >
          {/* Slot 1: Download */}
          {title.availability.downloadAllowed && title.featureAssetId ? (
            <a
              href="#download-section"
              className="text-text-secondary hover:text-text flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 px-2.5 py-2 transition-colors motion-reduce:transition-none lg:min-h-14 lg:min-w-12"
              aria-label="Jump to Download Section"
              title="Download Film"
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
          ) : (
            <a
              href="#download-section"
              className="text-text-secondary hover:text-text flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 px-2.5 py-2 transition-colors motion-reduce:transition-none lg:min-h-14 lg:min-w-12"
              aria-label="Jump to Download Section"
              title="Watch & Save Options"
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
          )}

          {/* Slot 2: Cast & Reviews with Crimson Dot */}
          <a
            href="#credits"
            className="text-text-secondary hover:text-text flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 px-2.5 py-2 transition-colors motion-reduce:transition-none lg:min-h-14 lg:min-w-12"
            aria-label="Cast & Crew"
            title="Cast & Filmmakers"
          >
            <span className="relative inline-flex">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span
                aria-hidden="true"
                className="bg-accent ring-canvas-raised absolute -top-0.5 -right-1 h-2 w-2 rounded-full ring-2"
              />
            </span>
            <span aria-hidden="true" className="text-text-muted text-[9px] leading-none">
              Cast
            </span>
          </a>

          {/* Slot 3: Details / Specifications */}
          <a
            href="#details"
            className="text-text-secondary hover:text-text flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 px-2.5 py-2 transition-colors motion-reduce:transition-none lg:min-h-14 lg:min-w-12"
            aria-label="Scroll to Details"
            title="Film Specifications"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <polygon points="6,4 20,12 6,20" />
            </svg>
            <span aria-hidden="true" className="text-text-muted text-[9px] leading-none">
              Details
            </span>
          </a>
        </div>

        {/* Bottom-Left 5 Stacked Metadata Rows with Crisp White-Outlined Pills (Exact Image 2 Layout) */}
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
              <span className="border-text/75 text-text rounded-pill inline-block max-w-[240px] truncate border px-4 py-1 font-medium">
                {studioSource}
              </span>
            </dd>

            <dt className="text-text/85 font-medium">Time:</dt>
            <dd>
              <span className="border-text/75 text-text rounded-pill inline-block border px-4 py-1 font-medium">
                {formatRuntime(title.runtimeMinutes)}
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

      {/* 2. Below-the-Fold Consumer Sections */}
      <div className="cg-container space-y-12 py-14 sm:py-20">
        {/* Watch, Save & Download Bar */}
        <section
          id="download-section"
          aria-label="Title actions"
          className="cg-surface flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8"
        >
          <div className="space-y-1">
            <h2 className="font-display text-text text-lg font-semibold">Watch &amp; Save</h2>
            <p className="text-text-secondary text-xs sm:text-sm">
              Stream instantly in high definition or save this film to your personal watchlist.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {title.availability.streamAllowed ? (
              <ButtonLink href={`/watch/${title.slug}`} variant="primary" size="md">
                Watch Now
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

        {/* Cast & Crew Section */}
        {title.credits && title.credits.length > 0 ? (
          <section id="credits" aria-labelledby="credits-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="credits-heading" className="font-display text-text text-2xl font-bold">
                Cast &amp; Crew
              </h2>
              <span className="text-text-muted font-mono text-xs">
                {title.credits.length} Credits
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {title.credits.map((c) => (
                <div
                  key={`${c.personSlug}-${c.department}-${c.billingOrder}`}
                  className="cg-surface hover:border-accent/60 flex flex-col justify-between p-4 transition-colors motion-reduce:transition-none"
                >
                  <div>
                    <span className="text-text-muted font-mono text-[11px] tracking-wider uppercase">
                      {c.department}
                    </span>
                    <p className="text-text mt-1 text-base font-semibold">
                      <Link
                        href={`/people/${c.personSlug}`}
                        className="hover:text-accent transition-colors motion-reduce:transition-none"
                      >
                        {c.nameEn}
                      </Link>
                    </p>
                    {c.nameBn ? (
                      <p className="text-text-secondary mt-0.5 text-xs" lang="bn">
                        {c.nameBn}
                      </p>
                    ) : null}
                  </div>
                  {c.characterName ? (
                    <p className="text-text-muted mt-2 font-mono text-xs">as {c.characterName}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Technical & Release Details Section */}
        <section id="details" aria-labelledby="details-heading" className="space-y-4">
          <h2 id="details-heading" className="font-display text-text text-2xl font-bold">
            Technical &amp; Release Details
          </h2>
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
                  {title.originalLanguage.toUpperCase()}
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
                <dt className="text-text-muted uppercase">Maturity Rating</dt>
                <dd className="text-text mt-1 font-sans text-sm font-medium">
                  {title.maturityRating}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted uppercase">Availability</dt>
                <dd className="text-accent mt-1 font-sans text-sm font-medium">
                  {title.availability.streamAllowed ? "Streaming in HD" : "Archive Listing"}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted uppercase">Region</dt>
                <dd className="text-text mt-1 font-sans text-sm font-medium">{territoryCode}</dd>
              </div>
              <div>
                <dt className="text-text-muted uppercase">Studio</dt>
                <dd className="text-text mt-1 font-sans text-sm font-medium">{studioSource}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Source & Legal Rights Attribution Section */}
        <section id="rights" aria-labelledby="attribution-heading" className="space-y-4">
          <h2 id="attribution-heading" className="font-display text-text text-xl font-bold">
            Source &amp; Legal Rights Attribution
          </h2>
          <div className="cg-surface space-y-3 p-6 text-xs">
            <p className="text-text-secondary leading-relaxed">
              Presented on CINEVA under authorized studio distribution or verified archival release.
            </p>
            {title.sources && title.sources.length > 0 ? (
              <ul className="divide-border/60 divide-y pt-2">
                {title.sources.map((src, idx) => (
                  <li
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                  >
                    <span className="text-accent font-mono"> Studio / Distributor</span>
                    <span className="text-text-secondary">{studioSource}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      </div>
    </article>
  );
}

export default TitleHeroStage;
