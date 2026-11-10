"use client";

import Link from "next/link";
import { KeyArt } from "@/components/art/key-art";
import { AvailabilityBadge } from "@/components/ui";
import { getCinevaFilmBySlug } from "@/lib/catalogue/cineva-database";
import type { ArtSpec } from "@/lib/catalogue/types";

export interface FilmStripItem {
  id: string;
  slug: string;
  titleEn: string;
  titleBn?: string | null;
  releaseYear: number;
  runtimeMinutes?: number;
  maturityRating?: string;
  synopsisEn?: string;
  badgeKind?:
    | "stream_allowed"
    | "download_allowed"
    | "catalogue_only"
    | "region_restricted"
    | "rights_pending";
  isDevelopmentFixture?: boolean;
}

export interface FilmStripShowcaseProps {
  breadcrumbTitle: string;
  breadcrumbCategory?: string;
  watermarkText: string;
  heading?: string;
  subheading?: string;
  renderBreadcrumbAsH1?: boolean;
  items: FilmStripItem[];
}

const POSTER_BILLING: readonly [string, string][] = [
  ["AMINA RAHMAN", "TARIQ ANAM"],
  ["NUSRAT IMROSE", "A. RAHMAN"],
  ["FAZLE RABBI", "A. RAHMAN"],
  ["RAFIQ AZAD", "A. RAHMAN"],
  ["AUPEE KARIM", "K. HOSSAIN"],
  ["ELENA ROSTOVA", "AUPEE KARIM"],
  ["RAFIQ AZAD", "SHITALAKSHYA"],
];

const FALLBACK_STRIP_SPECS: readonly ArtSpec[] = [
  {
    motif: "shadow",
    option: "beams",
    palette: { bg: "#141416", bg2: "#540912", ink: "#040404", accent: "#E50914", light: "#FEF9EF" },
  },
  {
    motif: "screen",
    option: "beams",
    palette: { bg: "#121316", bg2: "#4A0810", ink: "#030304", accent: "#E50914", light: "#FEF9EF" },
  },
  {
    motif: "tower",
    option: "factory",
    palette: { bg: "#18181A", bg2: "#470A10", ink: "#050505", accent: "#E50914", light: "#F2ECE1" },
  },
  {
    motif: "forest",
    option: "crescent",
    palette: { bg: "#111214", bg2: "#3F090E", ink: "#040404", accent: "#E50914", light: "#FEF9EF" },
  },
  {
    motif: "door",
    option: "domes",
    palette: { bg: "#191516", bg2: "#590A13", ink: "#050404", accent: "#E50914", light: "#FEF9EF" },
  },
  {
    motif: "horizon",
    option: "crescent",
    palette: { bg: "#0E1014", bg2: "#4E0710", ink: "#020203", accent: "#E50914", light: "#FEF9EF" },
  },
  {
    motif: "constructivist",
    option: "rails",
    palette: { bg: "#171515", bg2: "#520911", ink: "#050505", accent: "#E50914", light: "#FEF9EF" },
  },
];

function CinemaPosterArt({
  index,
  slug,
  title,
  releaseYear,
}: {
  index: number;
  slug: string;
  title: string;
  releaseYear: number;
}) {
  const variant = index % 7;
  const filmRecord = getCinevaFilmBySlug(slug);
  const spec = filmRecord?.art ?? FALLBACK_STRIP_SPECS[variant]!;
  const [leadA, leadB] = POSTER_BILLING[variant] ?? ["CINEVA", "ORIGINAL"];
  const shortTitle = title.toUpperCase();

  return (
    <div className="bg-canvas relative h-full w-full overflow-hidden">
      {/* Architectural Silver-Halide Print at Rest -> Full Cinema-Crimson Bloom on Hover */}
      <div className="h-full w-full contrast-125 grayscale transition-all duration-500 ease-out group-focus-within:scale-[1.05] group-focus-within:grayscale-0 group-hover:scale-[1.05] group-hover:grayscale-0 motion-reduce:transform-none motion-reduce:transition-none">
        <KeyArt spec={spec} variant="poster" className="h-full w-full object-cover" />
      </div>

      {/* Authentic 35mm Celluloid Film Grain */}
      <div aria-hidden="true" className="art-grain pointer-events-none" />

      {/* Top & Bottom Noir Scrims for Razor-Sharp Billing Legibility */}
      <div
        aria-hidden="true"
        className="from-canvas/85 pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b to-transparent"
      />
      <div
        aria-hidden="true"
        className="from-canvas via-canvas/75 pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t to-transparent"
      />

      {/* Cinema-Crimson Spotlight Halation on Hover */}
      <div
        aria-hidden="true"
        className="from-ember/40 via-ember-glow/15 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none"
      />

      {/* Unclipped Top Billing Credits */}
      <div
        aria-hidden="true"
        className="text-text/80 pointer-events-none absolute inset-x-2.5 top-2.5 z-10 flex items-center justify-between gap-1 font-mono text-[6.5px] font-semibold tracking-[0.12em] uppercase"
      >
        <span className="truncate">{leadA}</span>
        <span className="truncate text-right">{leadB}</span>
      </div>

      {/* Resting Sculptural Title & Release Stamp */}
      <div className="pointer-events-none absolute inset-x-3 bottom-4 z-10 space-y-1.5 text-center transition-opacity duration-300 group-focus-within:opacity-0 group-hover:opacity-0 motion-reduce:transition-none">
        <p className="font-display text-text line-clamp-2 text-xs leading-tight font-bold tracking-[0.15em] uppercase sm:text-[13px]">
          {shortTitle}
        </p>
        <p className="text-text-muted font-mono text-[9px] tracking-[0.2em] uppercase">
          CINEVA · {releaseYear}
        </p>
      </div>
    </div>
  );
}

export function FilmStripShowcase({
  breadcrumbTitle,
  breadcrumbCategory = "Films",
  watermarkText,
  heading,
  subheading,
  renderBreadcrumbAsH1 = false,
  items,
}: FilmStripShowcaseProps) {
  const displayItems = items.slice(0, 7);

  return (
    <section
      aria-label={`${breadcrumbTitle} showcase stage`}
      className="bg-canvas relative flex min-h-[calc(100dvh-3.5rem)] w-full max-w-full flex-col justify-between overflow-hidden overflow-x-clip pt-4 pb-16 sm:pt-6 sm:pb-20"
    >
      {/* Centered Top Breadcrumb */}
      <nav aria-label="Breadcrumb" className="relative z-10 mb-6 flex items-center justify-center">
        <ol className="text-text-muted flex flex-wrap items-center justify-center gap-2.5 text-xs">
          <li>
            <Link
              href="/"
              className="hover:text-text-secondary inline-flex min-h-11 items-center px-1.5 py-0.5 transition-colors motion-reduce:transition-none sm:min-h-6"
            >
              Main
            </Link>
          </li>
          <li aria-hidden="true" className="text-text-muted/60">
            &gt;
          </li>
          <li>
            <Link
              href="/movies"
              className="hover:text-text-secondary inline-flex min-h-11 items-center px-1.5 py-0.5 transition-colors motion-reduce:transition-none sm:min-h-6"
            >
              {breadcrumbCategory}
            </Link>
          </li>
          <li aria-hidden="true" className="text-text-muted/60">
            &gt;
          </li>
          <li>
            {renderBreadcrumbAsH1 ? (
              <h1 className="text-text text-xs font-medium">{breadcrumbTitle}</h1>
            ) : (
              <span className="text-text font-medium">{breadcrumbTitle}</span>
            )}
          </li>
        </ol>
      </nav>

      {heading ? (
        <div className="sr-only">
          <h2>{heading}</h2>
          {subheading ? <p>{subheading}</p> : null}
        </div>
      ) : null}

      {/* 7 Tall Frameless Vertical Cinema Strips Centered on Pitch Black */}
      <div className="relative z-10 mx-auto my-auto w-full max-w-[1180px] px-4 sm:px-6">
        <div className="flex snap-x snap-mandatory scrollbar-none gap-3 overflow-x-auto pb-4 sm:gap-3.5 lg:justify-center lg:overflow-visible lg:pb-0">
          {displayItems.map((item, index) => {
            const filmMeta = getCinevaFilmBySlug(item.slug);
            return (
              <article
                key={item.id}
                className="group bg-surface-1 ease-standard focus-within:ring-accent hover:ring-accent/85 border-border/60 relative w-[185px] flex-none snap-center overflow-hidden rounded-[2px] border transition-all duration-300 focus-within:z-20 focus-within:-translate-y-1.5 focus-within:ring-1 hover:z-20 hover:-translate-y-1.5 hover:shadow-[0_18px_44px_rgba(229,9,20,0.34)] hover:ring-1 motion-reduce:transform-none motion-reduce:transition-none sm:w-[205px] lg:w-auto lg:max-w-[162px] lg:flex-1"
              >
                <Link
                  href={`/movies/${item.slug}`}
                  className="flex h-[390px] w-full flex-col overflow-hidden focus:outline-none sm:h-[420px] lg:h-[435px] xl:h-[455px]"
                  aria-label={`View film ${item.titleEn} (${item.releaseYear})`}
                >
                  <div className="relative h-full w-full overflow-hidden">
                    <CinemaPosterArt
                      index={index}
                      slug={item.slug}
                      title={item.titleEn}
                      releaseYear={item.releaseYear}
                    />

                    {/* Hover / Focus Slide-up Story & Score Reveal */}
                    <div className="border-border/80 bg-surface-1/95 ease-standard absolute inset-x-0 bottom-0 z-20 translate-y-full transform border-t p-3 opacity-0 backdrop-blur-md transition-all duration-300 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transform-none motion-reduce:transition-none">
                      <div className="mb-1 flex items-center justify-between gap-1">
                        <span className="text-accent font-mono text-[10px] font-semibold">
                          {item.releaseYear}
                          {item.runtimeMinutes ? ` · ${item.runtimeMinutes}m` : ""}
                        </span>
                        {filmMeta ? (
                          <span className="bg-accent text-on-accent rounded-xs px-1.5 py-0.5 font-mono text-[9px] font-bold">
                            {filmMeta.cinevaScore}%
                          </span>
                        ) : null}
                      </div>
                      <h3 className="font-display text-text text-xs leading-snug font-bold sm:text-sm">
                        {item.titleEn}
                      </h3>
                      {item.synopsisEn ? (
                        <p className="text-text-secondary mt-1.5 line-clamp-3 text-[11px] leading-relaxed">
                          {item.synopsisEn}
                        </p>
                      ) : null}
                      {item.badgeKind ? (
                        <div className="mt-2 origin-left scale-90">
                          <AvailabilityBadge kind={item.badgeKind} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>

      {/* Giant Edge-to-Edge Lower Charcoal Watermark Typography */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -bottom-3 z-0 w-full max-w-full overflow-hidden text-center select-none"
      >
        <span className="font-display text-text inline-block max-w-full text-[16vw] leading-[0.82] font-medium tracking-[-0.04em] whitespace-nowrap opacity-[0.13] select-none">
          {watermarkText}
        </span>
      </div>
    </section>
  );
}

export default FilmStripShowcase;
