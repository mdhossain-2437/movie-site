"use client";

import { useState } from "react";
import { TmdbArtwork } from "@/components/catalogue/tmdb-artwork";
import type { ArtSpec } from "@/lib/catalogue/types";
import type { ArtworkGalleryItem } from "@/lib/metadata/omdb-types";

export interface OfficialArtworkGalleryProps {
  title: string;
  items: ArtworkGalleryItem[];
  fallbackArt: ArtSpec;
  className?: string;
}

export function OfficialArtworkGallery({
  title,
  items,
  fallbackArt,
  className = "",
}: OfficialArtworkGalleryProps) {
  const [filter, setFilter] = useState<"all" | "poster" | "backdrop">("all");
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);

  if (!items || items.length <= 1) {
    return null;
  }

  const posterCount = items.filter((i) => i.kind === "poster").length;
  const backdropCount = items.filter((i) => i.kind === "backdrop").length;
  const visibleItems = filter === "all" ? items : items.filter((item) => item.kind === filter);
  const activeItem =
    visibleItems.find((item) => item.id === selectedId) ?? visibleItems[0] ?? items[0]!;

  return (
    <section
      id="artwork-gallery"
      aria-labelledby="artwork-gallery-heading"
      data-testid="official-artwork-gallery"
      className={`space-y-5 overflow-hidden ${className}`.trim()}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-accent font-mono text-xs tracking-widest uppercase">
            Multi-Edition Key Art &amp; Theatrical Stills
          </p>
          <h2 id="artwork-gallery-heading" className="font-display text-text text-2xl font-bold">
            Official Posters &amp; Artwork Gallery
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Artwork filter">
          <button
            type="button"
            onClick={() => setFilter("all")}
            aria-pressed={filter === "all"}
            className={`rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center border px-3.5 py-1.5 font-mono text-xs font-semibold transition-colors motion-reduce:transition-none md:min-h-9 ${
              filter === "all"
                ? "border-accent bg-accent text-on-accent"
                : "border-border bg-surface-1 text-text-secondary hover:border-border-strong hover:text-text"
            }`}
          >
            All ({items.length})
          </button>
          {posterCount > 0 ? (
            <button
              type="button"
              onClick={() => setFilter("poster")}
              aria-pressed={filter === "poster"}
              className={`rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center border px-3.5 py-1.5 font-mono text-xs font-semibold transition-colors motion-reduce:transition-none md:min-h-9 ${
                filter === "poster"
                  ? "border-accent bg-accent text-on-accent"
                  : "border-border bg-surface-1 text-text-secondary hover:border-border-strong hover:text-text"
              }`}
            >
              Posters ({posterCount})
            </button>
          ) : null}
          {backdropCount > 0 ? (
            <button
              type="button"
              onClick={() => setFilter("backdrop")}
              aria-pressed={filter === "backdrop"}
              className={`rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center border px-3.5 py-1.5 font-mono text-xs font-semibold transition-colors motion-reduce:transition-none md:min-h-9 ${
                filter === "backdrop"
                  ? "border-accent bg-accent text-on-accent"
                  : "border-border bg-surface-1 text-text-secondary hover:border-border-strong hover:text-text"
              }`}
            >
              Stills ({backdropCount})
            </button>
          ) : null}
        </div>
      </div>

      <div className="cg-surface grid grid-cols-1 gap-6 p-5 sm:p-6 lg:grid-cols-[320px_1fr]">
        {/* Selected Artwork Spotlight */}
        <div className="space-y-3">
          <div
            className={`border-border-strong bg-surface-2 relative mx-auto overflow-hidden rounded-xl border ${
              activeItem.kind === "poster" ? "aspect-[2/3] max-w-[260px]" : "aspect-video w-full"
            }`}
          >
            <TmdbArtwork
              src={activeItem.url}
              alt={`${title} — ${activeItem.sourceLabel}`}
              fallbackArt={fallbackArt}
              variant={activeItem.kind}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="border-border bg-surface-2 rounded-lg border p-3 text-center">
            <p className="text-text font-sans text-xs font-bold">{activeItem.sourceLabel}</p>
            <p className="text-text-muted mt-0.5 font-mono text-[11px]">
              {[activeItem.dimensionsLabel, activeItem.languageLabel].filter(Boolean).join(" · ") ||
                "Same-Origin Verified Proxy"}
            </p>
          </div>
        </div>

        {/* Interactive Multi-Poster / Still Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {visibleItems.map((item) => {
            const isSelected = item.id === activeItem.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                aria-label={`Inspect ${item.sourceLabel}`}
                aria-pressed={isSelected}
                className={`group relative min-h-11 min-w-11 overflow-hidden rounded-lg border text-left transition-colors motion-reduce:transition-none ${
                  isSelected
                    ? "border-accent bg-surface-2"
                    : "border-border bg-surface-2 hover:border-border-strong"
                }`}
              >
                <div
                  className={item.kind === "poster" ? "aspect-[2/3] w-full" : "aspect-video w-full"}
                >
                  <TmdbArtwork
                    src={item.url}
                    alt={`${title} ${item.sourceLabel}`}
                    fallbackArt={fallbackArt}
                    variant={item.kind}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="border-border bg-canvas/90 border-t px-2.5 py-2">
                  <p className="text-text truncate font-sans text-[11px] font-semibold">
                    {item.sourceLabel}
                  </p>
                  {item.dimensionsLabel ? (
                    <p className="text-text-muted font-mono text-[10px]">{item.dimensionsLabel}</p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
