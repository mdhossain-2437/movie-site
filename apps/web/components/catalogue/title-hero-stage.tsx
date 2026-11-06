"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AuthorizedDownloadButton } from "@/components/catalogue/download-button";
import { WatchlistToggleButton } from "@/components/catalogue/watchlist-toggle";
import { AvailabilityBadge, Badge, ButtonLink } from "@/components/ui";

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

export function TitleHeroStage({
  title,
  territoryCode,
  isAuthenticated,
  initialSaved,
}: TitleHeroStageProps) {
  // Find primary director for breadcrumb
  const director = useMemo(() => {
    return title.credits?.find((c) => c.department === "DIRECTOR") ?? null;
  }, [title.credits]);

  // Primary rights attribution or studio
  const studioSource = useMemo(() => {
    return title.sources?.[0]?.attributionText ?? "Cinematic Graphite Archival";
  }, [title.sources]);

  const breadcrumbCategory = director ? director.nameEn : (title.genres?.[0]?.nameEn ?? "Films");

  return (
    <article className="w-full">
      {/* 1. Atmospheric Full-Bleed Hero Stage */}
      <section
        aria-label={`Hero showcase for ${title.localizedTitleEn}`}
        className="border-border/80 from-surface-1/95 via-surface-2/70 to-canvas relative w-full overflow-hidden rounded-lg border bg-gradient-to-b p-6 shadow-2xl sm:p-10 lg:p-14"
      >
        {/* Ambient atmospheric backdrop radial gradient */}
        <div
          aria-hidden="true"
          className="bg-accent/5 pointer-events-none absolute -top-24 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full blur-3xl"
        />

        {/* Top Centered Breadcrumb */}
        <nav aria-label="Breadcrumb" className="relative z-10 mb-8 flex justify-center sm:mb-12">
          <ol className="text-text-muted flex flex-wrap items-center justify-center gap-2 font-mono text-xs">
            <li>
              <Link href="/" className="hover:text-text-secondary transition-colors">
                Main
              </Link>
            </li>
            <li aria-hidden="true" className="text-text-muted/60">
              &gt;
            </li>
            <li>
              <Link href="/movies" className="hover:text-text-secondary transition-colors">
                Films
              </Link>
            </li>
            <li aria-hidden="true" className="text-text-muted/60">
              &gt;
            </li>
            {director ? (
              <li>
                <Link
                  href={`/people/${director.personSlug}`}
                  className="hover:text-text-secondary transition-colors"
                >
                  {breadcrumbCategory}
                </Link>
              </li>
            ) : (
              <li className="text-text-secondary">{breadcrumbCategory}</li>
            )}
            <li aria-hidden="true" className="text-text-muted/60">
              &gt;
            </li>
            <li className="text-accent font-medium">{title.localizedTitleEn}</li>
          </ol>
        </nav>

        {/* Hero Stage Grid: Top-Left Title + Top-Right Synopsis & Badges */}
        <div className="relative z-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_380px]">
          {/* Top-Left: Giant Editorial Title */}
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="border-border bg-surface-2/80 text-text-secondary rounded-xs border px-2 py-0.5 font-mono text-xs">
                {title.maturityRating}
              </span>
              {title.isDevelopmentFixture ? <Badge tone="info">Dev Fixture</Badge> : null}
              <span className="text-text-muted font-mono text-xs">
                {title.originalLanguage.toUpperCase()} · {title.releaseYear}
              </span>
            </div>

            <h1 className="font-display text-text text-4xl leading-tight font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              {title.localizedTitleEn}
            </h1>

            {title.localizedTitleBn ? (
              <p
                className="font-display text-text-secondary mt-3 text-2xl font-semibold sm:text-3xl"
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
                    className="border-border/80 bg-surface-1/80 hover:bg-surface-2 text-text-secondary hover:text-text rounded-pill border px-3 py-1 font-mono text-xs transition-colors"
                  >
                    {g.nameEn}
                    {g.nameBn ? ` · ${g.nameBn}` : ""}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {/* Top-Right: Concise Synopsis + Lawful AvailabilityBadge */}
          <div className="space-y-4 lg:pl-4 lg:text-right">
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <AvailabilityBadge kind={title.availability.badgeKind} />
              <Badge tone="neutral">Territory: {territoryCode}</Badge>
            </div>

            <p className="text-text-secondary text-sm leading-relaxed sm:text-base lg:ml-auto lg:max-w-md">
              {title.synopsisEn}
            </p>

            {title.synopsisBn ? (
              <p
                className="text-text-muted text-xs leading-relaxed sm:text-sm lg:ml-auto lg:max-w-md"
                lang="bn"
              >
                {title.synopsisBn}
              </p>
            ) : null}
          </div>
        </div>

        {/* Center Circular Translucent Play CTA Stage */}
        <div className="relative z-10 my-10 flex flex-col items-center justify-center text-center sm:my-14">
          {title.availability.streamAllowed ? (
            <Link
              href={`/watch/${title.slug}`}
              className="group rounded-pill border-accent/80 bg-surface-1/70 hover:border-accent focus:border-accent relative flex h-20 w-20 items-center justify-center border-2 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-[0_0_36px_rgba(216,179,106,0.35)] focus:scale-105 focus:outline-none sm:h-24 sm:w-24"
              aria-label={`Play stream for ${title.localizedTitleEn}`}
            >
              {/* Pulsing ring aura */}
              <span
                aria-hidden="true"
                className="rounded-pill border-accent absolute inset-0 animate-ping border opacity-40 group-hover:opacity-75 motion-reduce:hidden"
              />
              {/* Play SVG Icon */}
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="fill-accent text-accent h-8 w-8 translate-x-0.5 transition-transform duration-300 group-hover:scale-110 sm:h-10 sm:w-10"
              >
                <polygon points="6,3 20,12 6,21" />
              </svg>
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="rounded-pill border-border-strong bg-surface-1/70 text-text-muted flex h-20 w-20 cursor-not-allowed items-center justify-center border-2 opacity-75 sm:h-24 sm:w-24"
                title={`Streaming rights restricted in ${territoryCode}`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-8 w-8 sm:h-9 sm:w-9"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <p className="text-text-muted mt-1 font-mono text-xs">
                Stream Restricted in {territoryCode}
              </p>
            </div>
          )}
        </div>

        {/* Bottom-Left Structured Metadata Pill Rows */}
        <div className="border-border/60 relative z-10 border-t pt-4">
          <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs sm:gap-3">
            <div className="border-border/80 bg-surface-1/80 rounded-pill text-text-secondary flex items-center gap-1.5 border px-3 py-1 backdrop-blur-xs">
              <span className="text-text-muted uppercase">Country:</span>
              <span className="text-text font-semibold">BD</span>
            </div>

            <div className="border-border/80 bg-surface-1/80 rounded-pill text-text-secondary flex max-w-xs items-center gap-1.5 truncate border px-3 py-1 backdrop-blur-xs">
              <span className="text-text-muted uppercase">Licensor:</span>
              <span className="text-text truncate font-semibold">{studioSource}</span>
            </div>

            <div className="border-border/80 bg-surface-1/80 rounded-pill text-text-secondary flex items-center gap-1.5 border px-3 py-1 backdrop-blur-xs">
              <span className="text-text-muted uppercase">Time:</span>
              <span className="text-text font-semibold">{formatRuntime(title.runtimeMinutes)}</span>
            </div>

            <div className="border-border/80 bg-surface-1/80 rounded-pill text-text-secondary flex items-center gap-1.5 border px-3 py-1 backdrop-blur-xs">
              <span className="text-text-muted uppercase">Date:</span>
              <span className="text-text font-semibold">{title.releaseYear}</span>
            </div>

            <div className="border-border/80 bg-surface-1/80 rounded-pill text-text-secondary flex items-center gap-1.5 border px-3 py-1 backdrop-blur-xs">
              <span className="text-text-muted uppercase">Rate:</span>
              <span className="text-text font-semibold">{title.maturityRating}</span>
            </div>
          </div>
        </div>

        {/* Right-Edge Vertical Floating Quick-Action Rail */}
        <div
          aria-label="Quick Actions"
          className="rounded-pill border-border bg-surface-1/90 absolute top-1/2 right-3 z-20 flex -translate-y-1/2 flex-col gap-2 border p-1.5 shadow-2xl backdrop-blur-md sm:right-6"
        >
          {/* Download Action */}
          {title.availability.downloadAllowed && title.featureAssetId ? (
            <a
              href="#download-section"
              className="rounded-pill text-text-secondary hover:bg-surface-2 hover:text-accent flex h-11 w-11 items-center justify-center transition-colors"
              aria-label="Jump to Download Section"
              title="Download Authorized Copy"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </a>
          ) : (
            <span
              className="rounded-pill text-text-muted flex h-11 w-11 cursor-not-allowed items-center justify-center opacity-40"
              title="Download Restricted by Rights Policy"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <line x1="4" y1="4" x2="20" y2="20" />
              </svg>
            </span>
          )}

          {/* Details Scroll Anchor */}
          <a
            href="#details"
            className="rounded-pill text-text-secondary hover:bg-surface-2 hover:text-accent flex h-11 w-11 items-center justify-center transition-colors"
            aria-label="Scroll to Details"
            title="Film Details & Credits"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </a>

          {/* Trailer Anchor */}
          <a
            href="#credits"
            className="rounded-pill text-text-secondary hover:bg-surface-2 hover:text-accent flex h-11 w-11 items-center justify-center transition-colors"
            aria-label="Cast & Crew"
            title="Cast & Crew"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </a>
        </div>
      </section>

      {/* 2. Below-the-Fold Sections */}
      <div className="mt-12 space-y-12">
        {/* Actions Bar: Watchlist & Downloads */}
        <section
          id="download-section"
          aria-label="Title actions"
          className="cg-surface flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8"
        >
          <div className="space-y-1">
            <h2 className="font-display text-text text-lg font-semibold">
              Authorized Delivery Actions
            </h2>
            <p className="text-text-secondary text-xs sm:text-sm">
              Server-evaluated rights enforce territorial licensing windows and single-device DRM.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {title.availability.streamAllowed ? (
              <ButtonLink href={`/watch/${title.slug}`} variant="primary" size="md">
                Stream Now
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

            <ButtonLink href="/report-content" variant="ghost" size="sm">
              Report Content
            </ButtonLink>
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
                {title.credits.length} Verified Credits
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {title.credits.map((c) => (
                <div
                  key={`${c.personSlug}-${c.department}-${c.billingOrder}`}
                  className="cg-surface hover:border-accent/60 flex flex-col justify-between p-4 transition-colors"
                >
                  <div>
                    <span className="text-text-muted font-mono text-[11px] tracking-wider uppercase">
                      {c.department}
                    </span>
                    <p className="text-text mt-1 text-base font-semibold">
                      <Link
                        href={`/people/${c.personSlug}`}
                        className="hover:text-accent transition-colors"
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

        {/* Technical Details Section */}
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
                <dt className="text-text-muted uppercase">Original Language</dt>
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
                <dt className="text-text-muted uppercase">Delivery Status</dt>
                <dd className="text-accent mt-1 font-sans text-sm font-medium">
                  {title.availability.streamAllowed ? "Active Streaming" : "Rights Gated"}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted uppercase">Viewer Territory</dt>
                <dd className="text-text mt-1 font-sans text-sm font-medium">{territoryCode}</dd>
              </div>
              <div>
                <dt className="text-text-muted uppercase">Verification</dt>
                <dd className="text-success mt-1 font-sans text-sm font-medium">
                  Rights Ledger Verified
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Source & Rights Attribution Section */}
        <section id="rights" aria-labelledby="attribution-heading" className="space-y-4">
          <h2 id="attribution-heading" className="font-display text-text text-xl font-bold">
            Source &amp; Legal Rights Attribution
          </h2>
          <div className="cg-surface space-y-3 p-6 text-xs">
            <p className="text-text-secondary leading-relaxed">
              In strict accordance with platform operating standards, this film is published
              pursuant to verified distribution licensing grants or legal review as public-domain
              material. All requests are authenticated via the Central Rights Decision Service.
            </p>
            {title.sources && title.sources.length > 0 ? (
              <ul className="divide-border/60 divide-y pt-2">
                {title.sources.map((src, idx) => (
                  <li
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                  >
                    <span className="text-accent font-mono">{src.provider}</span>
                    <span className="text-text-muted">{src.attributionText}</span>
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
