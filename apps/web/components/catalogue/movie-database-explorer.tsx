"use client";

import type { PublicTitleSummary } from "@movie/db";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TitleCard } from "@/components/catalogue/title-card";
import { AvailabilityBadge, Badge, Button, EmptyState } from "@/components/ui";
import {
  CINEVA_GENRES,
  getCinevaFilmBySlug,
  type CinevaDatabaseFilm,
} from "@/lib/catalogue/cineva-database";

type SortKey = "featured" | "score" | "newest" | "classic" | "runtime" | "alpha";
type ViewMode = "grid" | "ledger";
type AccessFilter = "all" | "stream" | "download";

interface EnrichedTitle {
  summary: PublicTitleSummary;
  meta: CinevaDatabaseFilm | null;
  director: string;
  genres: string[];
  genreSlugs: string[];
  score: number;
  aspectRatio: string;
  soundMix: string;
  country: string;
}

export interface MovieDatabaseExplorerProps {
  items: PublicTitleSummary[];
  territoryCode: string;
  activeLang?: "bn" | "en";
  initialGenre?: string;
}

const LANGUAGE_LINKS = [
  { label: "All Languages", value: undefined },
  { label: "Bangla (বাংলা)", value: "bn" },
  { label: "English", value: "en" },
] as const;

export function MovieDatabaseExplorer({
  items,
  territoryCode,
  activeLang,
  initialGenre,
}: MovieDatabaseExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre ?? "all");
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("featured");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const enriched = useMemo<EnrichedTitle[]>(() => {
    return items.map((summary) => {
      const meta = getCinevaFilmBySlug(summary.slug);
      const director =
        meta?.credits.find((c) => c.department === "DIRECTOR")?.nameEn ?? "Archive Unit";
      return {
        summary,
        meta,
        director,
        genres: meta?.genres.map((g) => g.nameEn) ?? [],
        genreSlugs: meta?.genres.map((g) => g.slug) ?? [],
        score: meta?.cinevaScore ?? 8.0,
        aspectRatio: meta?.aspectRatio ?? "2.39:1",
        soundMix: meta?.soundMix ?? "5.1 Surround",
        country: meta?.country ?? summary.originalLanguage.toUpperCase(),
      };
    });
  }, [items]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = enriched.filter((entry) => {
      if (selectedGenre !== "all" && !entry.genreSlugs.includes(selectedGenre)) {
        return false;
      }
      if (accessFilter === "stream" && !entry.summary.availability.streamAllowed) {
        return false;
      }
      if (accessFilter === "download" && !entry.summary.availability.downloadAllowed) {
        return false;
      }
      if (!q) {
        return true;
      }
      const haystack = [
        entry.summary.localizedTitleEn,
        entry.summary.localizedTitleBn ?? "",
        entry.summary.originalTitle,
        entry.summary.synopsisEn,
        entry.director,
        entry.country,
        ...entry.genres,
        ...(entry.meta?.credits.map((c) => c.nameEn) ?? []),
        ...(entry.meta?.filmingLocations ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    const sorted = [...list];
    switch (sortBy) {
      case "score":
        sorted.sort((a, b) => b.score - a.score);
        break;
      case "newest":
        sorted.sort((a, b) => b.summary.releaseYear - a.summary.releaseYear);
        break;
      case "classic":
        sorted.sort((a, b) => a.summary.releaseYear - b.summary.releaseYear);
        break;
      case "runtime":
        sorted.sort((a, b) => b.summary.runtimeMinutes - a.summary.runtimeMinutes);
        break;
      case "alpha":
        sorted.sort((a, b) => a.summary.localizedTitleEn.localeCompare(b.summary.localizedTitleEn));
        break;
      case "featured":
      default:
        break;
    }
    return sorted;
  }, [accessFilter, enriched, searchQuery, selectedGenre, sortBy]);

  const streamableCount = useMemo(
    () => items.filter((item) => item.availability.streamAllowed).length,
    [items],
  );
  const downloadableCount = useMemo(
    () => items.filter((item) => item.availability.downloadAllowed).length,
    [items],
  );

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedGenre("all");
    setAccessFilter("all");
    setSortBy("featured");
  };

  return (
    <div className="space-y-8" data-testid="movie-database-explorer">
      {/* Database Metrics Summary Bar */}
      <div className="border-border bg-surface-1 grid grid-cols-2 gap-3 rounded-xl border p-4 sm:grid-cols-4 sm:p-5">
        <div className="space-y-0.5">
          <p className="text-text-muted font-mono text-[11px] tracking-wider uppercase">
            Indexed Feature Films
          </p>
          <p className="font-display text-text text-2xl font-bold">{items.length}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-text-muted font-mono text-[11px] tracking-wider uppercase">
            Instant 1080p Streams
          </p>
          <p className="font-display text-accent text-2xl font-bold">{streamableCount}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-text-muted font-mono text-[11px] tracking-wider uppercase">
            Offline Download Masters
          </p>
          <p className="font-display text-text text-2xl font-bold">{downloadableCount}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-text-muted font-mono text-[11px] tracking-wider uppercase">
            Active Territory Gate
          </p>
          <p className="text-text-secondary pt-1 font-mono text-sm font-semibold">
            {territoryCode} · EN / বাংলা CC
          </p>
        </div>
      </div>

      {/* Control Deck: Search + Sort + View Toggle + Language + Genre Chips */}
      <div className="border-border bg-surface-1 space-y-5 rounded-xl border p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <label htmlFor="movie-db-filter-input" className="sr-only">
              Filter movie database by title, director, cast, or location
            </label>
            <input
              id="movie-db-filter-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter database by title, বাংলা নাম, director, cast, or filming location…"
              className="border-border-strong bg-surface-2 text-text placeholder:text-text-muted focus:border-accent min-h-11 w-full rounded-md border px-4 py-2.5 text-sm transition-colors motion-reduce:transition-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <label htmlFor="movie-db-sort" className="sr-only">
              Sort movies
            </label>
            <select
              id="movie-db-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="border-border-strong bg-surface-2 text-text min-h-11 rounded-md border px-3.5 py-2 text-sm font-medium"
            >
              <option value="featured">Sort: Curated Order</option>
              <option value="score">Sort: CINEVA Index</option>
              <option value="newest">Sort: Newest Release</option>
              <option value="classic">Sort: Classic Vintage</option>
              <option value="runtime">Sort: Longest Runtime</option>
              <option value="alpha">Sort: Title (A–Z)</option>
            </select>

            <div
              role="group"
              aria-label="Database view layout"
              className="border-border bg-surface-2 inline-flex rounded-md border p-0.5"
            >
              <button
                type="button"
                aria-pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
                className={`min-h-11 min-w-11 rounded-sm px-3.5 text-xs font-semibold transition-colors motion-reduce:transition-none md:min-h-9 ${
                  viewMode === "grid"
                    ? "bg-accent text-on-accent"
                    : "text-text-secondary hover:text-text"
                }`}
              >
                Poster Grid
              </button>
              <button
                type="button"
                aria-pressed={viewMode === "ledger"}
                onClick={() => setViewMode("ledger")}
                className={`min-h-11 min-w-11 rounded-sm px-3.5 text-xs font-semibold transition-colors motion-reduce:transition-none md:min-h-9 ${
                  viewMode === "ledger"
                    ? "bg-accent text-on-accent"
                    : "text-text-secondary hover:text-text"
                }`}
              >
                Tech Ledger
              </button>
            </div>
          </div>
        </div>

        {/* Language & Access Row */}
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <nav aria-label="Language filter" className="flex flex-wrap items-center gap-2">
            {LANGUAGE_LINKS.map((f) => {
              const selected = f.value === activeLang;
              const href = f.value ? `/movies?lang=${f.value}` : "/movies";
              return (
                <Link
                  key={f.label}
                  href={href}
                  aria-current={selected ? "page" : undefined}
                  className={`rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center gap-2 border px-4 py-1.5 text-xs font-medium transition-colors motion-reduce:transition-none md:min-h-9 ${
                    selected
                      ? "border-accent bg-surface-3 text-text"
                      : "border-border bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text"
                  }`}
                >
                  {selected ? (
                    <span aria-hidden="true" className="text-accent">
                      ✓
                    </span>
                  ) : null}
                  <span>{f.label}</span>
                </Link>
              );
            })}
          </nav>

          <div
            role="group"
            aria-label="Availability filter"
            className="flex flex-wrap items-center gap-2"
          >
            {(
              [
                { id: "all", label: "All Access" },
                { id: "stream", label: "Stream HD" },
                { id: "download", label: "Download Master" },
              ] as const
            ).map((opt) => {
              const active = accessFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setAccessFilter(opt.id)}
                  className={`rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 border px-3.5 py-1.5 font-mono text-xs transition-colors motion-reduce:transition-none md:min-h-9 ${
                    active
                      ? "border-accent bg-accent/15 text-text"
                      : "border-border bg-surface-2 text-text-secondary hover:text-text"
                  }`}
                >
                  {active ? (
                    <span aria-hidden="true" className="text-accent">
                      ●
                    </span>
                  ) : null}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Genre Taxonomy Filter Chips */}
        <div role="group" aria-label="Genre filter" className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={selectedGenre === "all"}
            onClick={() => setSelectedGenre("all")}
            className={`rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center border px-3.5 py-1.5 text-xs font-semibold transition-colors motion-reduce:transition-none md:min-h-8 ${
              selectedGenre === "all"
                ? "border-accent bg-accent text-on-accent"
                : "border-border bg-surface-2 text-text-secondary hover:border-border-strong hover:text-text"
            }`}
          >
            All Genres
          </button>
          {CINEVA_GENRES.map((genre) => {
            const active = selectedGenre === genre.slug;
            return (
              <button
                key={genre.slug}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedGenre(genre.slug)}
                className={`rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 border px-3.5 py-1.5 text-xs font-medium transition-colors motion-reduce:transition-none md:min-h-8 ${
                  active
                    ? "border-accent bg-accent text-on-accent font-semibold"
                    : "border-border bg-surface-2 text-text-secondary hover:border-border-strong hover:text-text"
                }`}
              >
                <span>{genre.nameEn}</span>
                <span className="opacity-75" lang="bn">
                  · {genre.nameBn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">
            Showing {filtered.length} of {items.length} Titles
          </Badge>
          {selectedGenre !== "all" ? (
            <Badge tone="neutral">Genre: {selectedGenre.toUpperCase()}</Badge>
          ) : null}
          {searchQuery.trim() ? (
            <Badge tone="info">Filter: &ldquo;{searchQuery.trim()}&rdquo;</Badge>
          ) : null}
        </div>

        {selectedGenre !== "all" || accessFilter !== "all" || searchQuery.trim() ? (
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
            Reset Database Filters
          </Button>
        ) : null}
      </div>

      {/* Filtered Content */}
      {filtered.length === 0 ? (
        <EmptyState
          eyebrow="0 matching database records"
          title="No films match the active filter combination"
          description="Clear your search text or broaden the genre and availability filters to inspect the complete CINEVA catalogue."
          actions={
            <Button type="button" variant="secondary" onClick={resetFilters}>
              Show All Films
            </Button>
          }
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((entry) => (
            <TitleCard key={entry.summary.id} title={entry.summary} />
          ))}
        </div>
      ) : (
        <div className="border-border bg-surface-1 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-border bg-surface-2 text-text-muted border-b font-mono text-[11px] tracking-wider uppercase">
                <th className="px-4 py-3.5">#</th>
                <th className="px-4 py-3.5">Film &amp; Localization</th>
                <th className="px-4 py-3.5">Year</th>
                <th className="px-4 py-3.5">Director</th>
                <th className="px-4 py-3.5">Technical Master</th>
                <th className="px-4 py-3.5">Index</th>
                <th className="px-4 py-3.5">Rights Status</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {filtered.map((entry, idx) => (
                <tr
                  key={entry.summary.id}
                  className="hover:bg-surface-2/70 transition-colors motion-reduce:transition-none"
                >
                  <td className="text-text-muted px-4 py-3.5 font-mono text-xs">
                    {String(idx + 1).padStart(2, "0")}
                  </td>
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/movies/${entry.summary.slug}`}
                      className="font-display text-text hover:text-accent block font-bold transition-colors motion-reduce:transition-none"
                    >
                      {entry.summary.localizedTitleEn}
                    </Link>
                    <span className="text-text-secondary text-xs" lang="bn">
                      {entry.summary.localizedTitleBn}
                    </span>
                  </td>
                  <td className="text-text-secondary px-4 py-3.5 font-mono text-xs">
                    {entry.summary.releaseYear}
                  </td>
                  <td className="text-text-secondary px-4 py-3.5 text-xs">{entry.director}</td>
                  <td className="text-text-muted px-4 py-3.5 font-mono text-xs">
                    {entry.aspectRatio} · {entry.summary.runtimeMinutes}m · {entry.soundMix}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-accent font-mono text-xs font-bold">
                      ★ {entry.score.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <AvailabilityBadge kind={entry.summary.availability.badgeKind} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {entry.summary.availability.streamAllowed ? (
                      <Link
                        href={`/watch/${entry.summary.slug}`}
                        className="border-accent bg-accent text-on-accent hover:bg-accent-hover rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center px-3.5 py-1.5 font-mono text-xs font-bold transition-colors motion-reduce:transition-none md:min-h-8"
                      >
                        Stream
                      </Link>
                    ) : (
                      <Link
                        href={`/movies/${entry.summary.slug}`}
                        className="border-border bg-surface-2 text-text hover:border-border-strong rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center border px-3.5 py-1.5 font-mono text-xs transition-colors motion-reduce:transition-none md:min-h-8"
                      >
                        Sheet
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
