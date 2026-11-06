"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AvailabilityBadge } from "@/components/ui";

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
  items: FilmStripItem[];
}

/**
 * Deterministic procedural SVG poster art generator.
 * Produces distinctive, copyright-safe, atmospheric geometric compositions
 * in obsidian (#080A0D), graphite (#181F28), and warm gold (#D8B36A).
 */
function ProceduralFilmArt({ index, title }: { index: number; title: string }) {
  const seed = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = (hash << 5) - hash + title.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) + index;
  }, [index, title]);

  const variant = seed % 7;

  return (
    <div className="from-surface-2 to-canvas relative h-full w-full overflow-hidden bg-gradient-to-b">
      <svg
        aria-hidden="true"
        viewBox="0 0 200 320"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
      >
        <defs>
          <linearGradient id={`gold-glow-${index}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D8B36A" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#818D9B" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#080A0D" stopOpacity="0.95" />
          </linearGradient>
          <radialGradient id={`spot-${index}`} cx="50%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#D8B36A" stopOpacity="0.42" />
            <stop offset="48%" stopColor="#222B36" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#080A0D" stopOpacity="0.96" />
          </radialGradient>
          <linearGradient id={`canvas-fade-${index}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#080A0D" stopOpacity="0.1" />
            <stop offset="65%" stopColor="#080A0D" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#080A0D" stopOpacity="0.82" />
          </linearGradient>
        </defs>

        <rect width="200" height="320" fill={`url(#spot-${index})`} />

        {variant === 0 && (
          // Concentric aperture rings & horizon line
          <g stroke="#D8B36A" strokeWidth="1" fill="none" opacity="0.6">
            <circle cx="100" cy="130" r="75" strokeDasharray="4 4" />
            <circle cx="100" cy="130" r="50" />
            <circle cx="100" cy="130" r="25" strokeWidth="1.5" />
            <line x1="20" y1="230" x2="180" y2="230" strokeWidth="1.5" />
            <line x1="40" y1="240" x2="160" y2="240" strokeOpacity="0.4" />
          </g>
        )}

        {variant === 1 && (
          // Monolithic delta angles & vertical slit
          <g fill="none">
            <polygon
              points="100,30 180,240 20,240"
              stroke="#D8B36A"
              strokeWidth="1.2"
              opacity="0.5"
            />
            <line
              x1="100"
              y1="20"
              x2="100"
              y2="270"
              stroke="#D8B36A"
              strokeWidth="2"
              strokeOpacity="0.8"
            />
            <circle
              cx="100"
              cy="90"
              r="14"
              fill="#D8B36A"
              fillOpacity="0.25"
              stroke="#D8B36A"
              strokeWidth="1"
            />
          </g>
        )}

        {variant === 2 && (
          // Archival anamorphic prism & rays
          <g stroke="#D8B36A" opacity="0.65">
            <path d="M30 220 L100 50 L170 220 Z" fill="none" strokeWidth="1" />
            <line x1="100" y1="50" x2="30" y2="270" strokeWidth="0.75" strokeOpacity="0.4" />
            <line x1="100" y1="50" x2="170" y2="270" strokeWidth="0.75" strokeOpacity="0.4" />
            <line x1="100" y1="50" x2="100" y2="280" strokeWidth="1.5" />
            <ellipse cx="100" cy="220" rx="45" ry="12" fill="none" strokeWidth="1" />
          </g>
        )}

        {variant === 3 && (
          // Starburst lattice & geometric aperture
          <g stroke="#D8B36A" strokeWidth="1" fill="none" opacity="0.6">
            <rect x="40" y="70" width="120" height="150" rx="4" strokeDasharray="3 3" />
            <circle cx="100" cy="145" r="40" strokeWidth="1.5" />
            <line x1="100" y1="80" x2="100" y2="210" />
            <line x1="45" y1="145" x2="155" y2="145" />
            <polygon points="100,115 125,145 100,175 75,145" fill="#D8B36A" fillOpacity="0.2" />
          </g>
        )}

        {variant === 4 && (
          // Waveform monsoon curves
          <g stroke="#D8B36A" fill="none" opacity="0.6">
            <path d="M10 100 Q 100 30 190 100 T 10 180" strokeWidth="1" />
            <path d="M10 130 Q 100 60 190 130 T 10 210" strokeWidth="1.2" />
            <path d="M10 160 Q 100 90 190 160 T 10 240" strokeWidth="1.5" strokeOpacity="0.8" />
            <circle cx="100" cy="100" r="16" fill="#D8B36A" fillOpacity="0.3" strokeWidth="1" />
          </g>
        )}

        {variant === 5 && (
          // Stepped architectural perspective
          <g stroke="#D8B36A" strokeWidth="1" fill="none" opacity="0.65">
            <polygon points="20,260 180,260 150,60 50,60" />
            <polygon points="40,240 160,240 135,90 65,90" strokeOpacity="0.4" />
            <polygon points="60,220 140,220 120,120 80,120" strokeWidth="1.5" />
            <line x1="100" y1="40" x2="100" y2="270" strokeWidth="1" strokeDasharray="2 2" />
          </g>
        )}

        {variant === 6 && (
          // Eclipse crescent & dual horizon
          <g fill="none" stroke="#D8B36A" opacity="0.7">
            <circle cx="100" cy="120" r="55" strokeWidth="1" />
            <path d="M100 65 A 55 55 0 0 1 155 120" strokeWidth="2.5" />
            <line x1="20" y1="210" x2="180" y2="210" strokeWidth="1.5" />
            <line x1="30" y1="225" x2="170" y2="225" strokeOpacity="0.4" />
            <line x1="40" y1="240" x2="160" y2="240" strokeOpacity="0.2" />
          </g>
        )}

        {/* Ambient grain vignette */}
        <rect width="200" height="320" fill={`url(#canvas-fade-${index})`} opacity="0.65" />
      </svg>

      {/* Atmospheric bottom scrim */}
      <div className="from-canvas via-canvas/80 pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t to-transparent" />
    </div>
  );
}

export function FilmStripShowcase({
  breadcrumbTitle,
  breadcrumbCategory = "Films",
  watermarkText,
  heading,
  subheading,
  items,
}: FilmStripShowcaseProps) {
  // Enforce max 7 panels side-by-side for the signature 7-panel layout
  const displayItems = items.slice(0, 7);

  return (
    <section
      aria-label={`${breadcrumbTitle} showcase stage`}
      className="relative w-full max-w-full overflow-hidden overflow-x-clip py-10 sm:py-16"
    >
      {/* Centered Top Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center justify-center">
        <ol className="text-text-muted flex items-center gap-2 font-mono text-xs">
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
              {breadcrumbCategory}
            </Link>
          </li>
          <li aria-hidden="true" className="text-text-muted/60">
            &gt;
          </li>
          <li className="text-accent font-medium">{breadcrumbTitle}</li>
        </ol>
      </nav>

      {/* Editorial Heading (Optional) */}
      {heading ? (
        <div className="mb-8 px-4 text-center">
          <h2 className="font-display text-text text-2xl font-bold tracking-tight sm:text-4xl">
            {heading}
          </h2>
          {subheading ? (
            <p className="text-text-secondary mx-auto mt-2 max-w-xl text-sm sm:text-base">
              {subheading}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* 7 Vertical Film-Strip Panels Stage */}
      <div className="relative z-10 w-full px-2 sm:px-4">
        <div className="flex snap-x snap-mandatory scrollbar-none gap-3 overflow-x-auto pb-6 sm:gap-4 lg:grid lg:grid-cols-7 lg:overflow-visible lg:pb-0">
          {displayItems.map((item, index) => (
            <article
              key={item.id}
              className="group border-border/80 bg-surface-1 ease-standard hover:border-accent focus-within:border-accent relative w-[220px] flex-none snap-center rounded-sm border transition-all duration-300 focus-within:z-20 focus-within:scale-[1.03] focus-within:shadow-[0_0_24px_rgba(216,179,106,0.25)] hover:z-20 hover:scale-[1.03] hover:shadow-[0_0_24px_rgba(216,179,106,0.25)] motion-reduce:transform-none motion-reduce:transition-none sm:w-[260px] lg:w-auto"
            >
              <Link
                href={`/movies/${item.slug}`}
                className="flex h-[460px] w-full flex-col overflow-hidden rounded-sm focus:outline-none sm:h-[500px] lg:h-[520px]"
                aria-label={`View film ${item.titleEn} (${item.releaseYear})`}
              >
                {/* Poster Artwork Container */}
                <div className="relative w-full flex-1 overflow-hidden">
                  <ProceduralFilmArt index={index} title={item.titleEn} />

                  {/* Top Badges */}
                  <div className="absolute inset-x-2.5 top-2.5 z-10 flex items-center justify-between gap-1">
                    <span className="border-border/80 bg-canvas/80 text-text-secondary rounded-xs border px-1.5 py-0.5 font-mono text-[10px] backdrop-blur-xs">
                      {item.maturityRating ?? "U"}
                    </span>
                    {item.isDevelopmentFixture ? (
                      <span className="border-info/50 bg-canvas/80 text-info rounded-xs border px-1.5 py-0.5 font-mono text-[10px]">
                        Fixture
                      </span>
                    ) : null}
                  </div>

                  {/* Resting Title Header (Bottom of art, above expansion) */}
                  <div className="from-surface-1 via-surface-1/90 absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t to-transparent p-3 transition-opacity duration-300 group-focus-within:opacity-0 group-hover:opacity-0 motion-reduce:transition-none">
                    <p className="text-text-muted font-mono text-[11px]">
                      {item.releaseYear}
                      {item.runtimeMinutes ? ` · ${item.runtimeMinutes}m` : ""}
                    </p>
                    <h3 className="font-display text-text mt-0.5 truncate text-sm font-semibold">
                      {item.titleEn}
                    </h3>
                    {item.titleBn ? (
                      <p className="text-text-secondary mt-0.5 truncate text-xs" lang="bn">
                        {item.titleBn}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Hover / Focus Slide-up Synopsis Reveal */}
                <div className="bg-surface-1/95 border-border ease-standard absolute inset-x-0 bottom-0 z-20 translate-y-full transform border-t p-3 opacity-0 backdrop-blur-sm transition-all duration-300 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transform-none motion-reduce:transition-none sm:p-4">
                  <div className="mb-1.5 flex items-center justify-between gap-1">
                    <span className="text-accent font-mono text-[11px] font-medium">
                      {item.releaseYear}
                      {item.runtimeMinutes ? ` · ${item.runtimeMinutes}m` : ""}
                    </span>
                    {item.badgeKind ? <AvailabilityBadge kind={item.badgeKind} /> : null}
                  </div>
                  <h3 className="font-display text-text text-sm leading-snug font-bold sm:text-base">
                    {item.titleEn}
                  </h3>
                  {item.titleBn ? (
                    <p className="text-text-secondary font-display mt-0.5 text-xs" lang="bn">
                      {item.titleBn}
                    </p>
                  ) : null}
                  {item.synopsisEn ? (
                    <p className="text-text-secondary mt-2 line-clamp-3 text-xs leading-relaxed">
                      {item.synopsisEn}
                    </p>
                  ) : null}
                  <div className="border-border/60 text-accent mt-3 flex items-center justify-between border-t pt-2 text-xs font-medium">
                    <span>Explore Title</span>
                    <span aria-hidden="true">&rarr;</span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>

      {/* Oversized Subtle Lower Backdrop Watermark Display Typography */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-1 z-0 w-full max-w-full overflow-hidden text-center select-none"
      >
        <span className="font-display text-text inline-block max-w-full text-[12vw] leading-none font-black tracking-widest whitespace-nowrap uppercase opacity-[0.05] select-none">
          {watermarkText}
        </span>
      </div>
    </section>
  );
}

export default FilmStripShowcase;
