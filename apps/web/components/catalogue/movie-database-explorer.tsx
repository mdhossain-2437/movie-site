"use client";

import type { CatalogueSort, TitleKind } from "@movie/contracts";
import type { PublicTitleSummary } from "@movie/db";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TitleCard } from "@/components/catalogue/title-card";
import { AvailabilityBadge, Badge, Button, EmptyState } from "@/components/ui";
import {
  CINEVA_GENRES,
  CINEVA_PEOPLE,
  CINEVA_SPECIAL_CATEGORIES,
  CINEVA_STUDIOS,
  type CinevaDatabaseFilm,
  getCinevaFilmBySlug,
  getCinevaTopRatedMap,
} from "@/lib/catalogue/cineva-database";

type ViewMode = "grid" | "ledger";
type AccessFilter = "all" | "stream" | "download";
type KindFilter = "ALL" | TitleKind;

interface EnrichedTitle {
  summary: PublicTitleSummary;
  meta: CinevaDatabaseFilm | null;
  kind: TitleKind;
  seasonCount: number;
  director: string;
  directorSlugs: string[];
  castNames: string[];
  castSlugs: string[];
  studioName: string;
  studioSlug: string;
  categorySlugs: string[];
  genres: string[];
  genreSlugs: string[];
  bayesianScore: number;
  topRank: number | null;
  voteCountNumeric: number;
  aspectRatio: string;
  soundMix: string;
  country: string;
}

export interface MovieDatabaseExplorerProps {
  items: PublicTitleSummary[];
  territoryCode: string;
  basePath?: "/movies" | "/series";
  lockedKind?: TitleKind;
  activeLang?: "bn" | "en";
  initialKind?: KindFilter;
  initialGenre?: string;
  initialDirector?: string;
  initialCast?: string;
  initialCategory?: string;
  initialStudio?: string;
  initialSort?: CatalogueSort;
  initialQuery?: string;
}

const LANGUAGE_OPTIONS = [
  { label: "All Languages", value: "all" },
  { label: "Bangla (বাংলা)", value: "bn" },
  { label: "English", value: "en" },
] as const;

export function MovieDatabaseExplorer({
  items,
  territoryCode,
  basePath = "/movies",
  lockedKind,
  activeLang,
  initialKind,
  initialGenre,
  initialDirector,
  initialCast,
  initialCategory,
  initialStudio,
  initialSort,
  initialQuery,
}: MovieDatabaseExplorerProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? "");
  const [selectedKind, setSelectedKind] = useState<KindFilter>(lockedKind ?? initialKind ?? "ALL");
  const [selectedLanguage, setSelectedLanguage] = useState<string>(activeLang ?? "all");
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre ?? "all");
  const [selectedDirector, setSelectedDirector] = useState<string>(initialDirector ?? "all");
  const [selectedCast, setSelectedCast] = useState<string>(initialCast ?? "all");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory ?? "all");
  const [selectedStudio, setSelectedStudio] = useState<string>(initialStudio ?? "all");
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("all");
  const [sortBy, setSortBy] = useState<CatalogueSort>(initialSort ?? "featured");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const syncUrlParams = (next: {
    q?: string;
    kind?: KindFilter;
    lang?: string;
    genre?: string;
    director?: string;
    cast?: string;
    category?: string;
    studio?: string;
    sort?: CatalogueSort;
  }) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    const qVal = (next.q ?? searchQuery).trim();
    const kindVal = lockedKind ?? next.kind ?? selectedKind;
    const langVal = next.lang ?? selectedLanguage;
    const genreVal = next.genre ?? selectedGenre;
    const dirVal = next.director ?? selectedDirector;
    const castVal = next.cast ?? selectedCast;
    const catVal = next.category ?? selectedCategory;
    const studioVal = next.studio ?? selectedStudio;
    const sortVal = next.sort ?? sortBy;

    if (qVal) params.set("q", qVal);
    if (!lockedKind && kindVal !== "ALL") params.set("kind", kindVal);
    if (langVal !== "all") params.set("lang", langVal);
    if (genreVal !== "all") params.set("genre", genreVal);
    if (dirVal !== "all") params.set("director", dirVal);
    if (castVal !== "all") params.set("cast", castVal);
    if (catVal !== "all") params.set("category", catVal);
    if (studioVal !== "all") params.set("studio", studioVal);
    if (sortVal !== "featured") params.set("sort", sortVal);

    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `${basePath}?${qs}` : basePath);
  };

  const enriched = useMemo<EnrichedTitle[]>(() => {
    const topMap = getCinevaTopRatedMap();
    return items.map((summary) => {
      const meta = getCinevaFilmBySlug(summary.slug);
      const ranking = topMap.get(summary.slug);
      const kind: TitleKind = meta?.kind ?? summary.kind ?? "MOVIE";
      const directorCredits = meta?.credits.filter((c) => c.department === "DIRECTOR") ?? [];
      const actorCredits = meta?.credits.filter((c) => c.department === "ACTOR") ?? [];
      const director = directorCredits[0]?.nameEn ?? "Archive Unit";

      return {
        summary,
        meta,
        kind,
        seasonCount: meta?.seasons?.length ?? (kind === "SERIES" ? 1 : 0),
        director,
        directorSlugs:
          directorCredits.length > 0
            ? directorCredits.map((c) => c.personSlug)
            : (summary.directorSlugs ?? []),
        castNames: actorCredits.map((c) => c.nameEn),
        castSlugs:
          actorCredits.length > 0
            ? actorCredits.map((c) => c.personSlug)
            : (summary.castSlugs ?? []),
        studioName: meta?.studio ?? summary.studioName ?? "CINEVA Archive",
        studioSlug: meta?.studioSlug ?? summary.studioSlug ?? "cineva-public-domain-vault",
        categorySlugs: meta?.categorySlugs ?? summary.collectionSlugs ?? [],
        genres: meta?.genres.map((g) => g.nameEn) ?? [],
        genreSlugs: meta?.genres.map((g) => g.slug) ?? summary.genreSlugs ?? [],
        bayesianScore: ranking?.bayesianScore ?? meta?.rawRating ?? 8.5,
        topRank: ranking?.topRank ?? null,
        voteCountNumeric: meta?.voteCountNumeric ?? 5000,
        aspectRatio: meta?.aspectRatio ?? "2.39:1",
        soundMix: meta?.soundMix ?? "5.1 Surround",
        country: meta?.country ?? summary.originalLanguage.toUpperCase(),
      };
    });
  }, [items]);

  const directorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of enriched) {
      for (const slug of item.directorSlugs) {
        counts.set(slug, (counts.get(slug) ?? 0) + 1);
      }
    }
    return CINEVA_PEOPLE.filter((p) => counts.has(p.slug)).map((p) => ({
      slug: p.slug,
      nameEn: p.nameEn,
      count: counts.get(p.slug) ?? 0,
    }));
  }, [enriched]);

  const castOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of enriched) {
      for (const slug of item.castSlugs) {
        counts.set(slug, (counts.get(slug) ?? 0) + 1);
      }
    }
    return CINEVA_PEOPLE.filter((p) => counts.has(p.slug)).map((p) => ({
      slug: p.slug,
      nameEn: p.nameEn,
      count: counts.get(p.slug) ?? 0,
    }));
  }, [enriched]);

  const studioOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of enriched) {
      counts.set(item.studioSlug, (counts.get(item.studioSlug) ?? 0) + 1);
    }
    return CINEVA_STUDIOS.map((s) => ({
      slug: s.slug,
      nameEn: s.nameEn,
      count: counts.get(s.slug) ?? 0,
    }));
  }, [enriched]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const effectiveKind = lockedKind ?? selectedKind;

    const list = enriched.filter((entry) => {
      if (effectiveKind !== "ALL" && entry.kind !== effectiveKind) {
        return false;
      }
      if (selectedLanguage !== "all" && entry.summary.originalLanguage !== selectedLanguage) {
        return false;
      }
      if (selectedGenre !== "all" && !entry.genreSlugs.includes(selectedGenre)) {
        return false;
      }
      if (selectedDirector !== "all" && !entry.directorSlugs.includes(selectedDirector)) {
        return false;
      }
      if (selectedCast !== "all" && !entry.castSlugs.includes(selectedCast)) {
        return false;
      }
      if (selectedCategory !== "all" && !entry.categorySlugs.includes(selectedCategory)) {
        return false;
      }
      if (selectedStudio !== "all" && entry.studioSlug !== selectedStudio) {
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
        entry.studioName,
        entry.country,
        ...entry.genres,
        ...entry.castNames,
        ...(entry.meta?.credits.map((c) => c.nameEn) ?? []),
        ...(entry.meta?.filmingLocations ?? []),
        ...(entry.meta?.moodTags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    const sorted = [...list];
    switch (sortBy) {
      case "top_rated":
        sorted.sort(
          (a, b) => b.bayesianScore - a.bayesianScore || b.voteCountNumeric - a.voteCountNumeric,
        );
        break;
      case "trending":
        sorted.sort((a, b) => {
          const trendA = a.voteCountNumeric * (a.summary.releaseYear >= 2024 ? 1.35 : 1);
          const trendB = b.voteCountNumeric * (b.summary.releaseYear >= 2024 ? 1.35 : 1);
          return trendB - trendA;
        });
        break;
      case "newest":
        sorted.sort(
          (a, b) =>
            b.summary.releaseYear - a.summary.releaseYear || b.bayesianScore - a.bayesianScore,
        );
        break;
      case "classic":
        sorted.sort(
          (a, b) =>
            a.summary.releaseYear - b.summary.releaseYear || b.bayesianScore - a.bayesianScore,
        );
        break;
      case "runtime_desc":
        sorted.sort((a, b) => b.summary.runtimeMinutes - a.summary.runtimeMinutes);
        break;
      case "runtime_asc":
        sorted.sort((a, b) => a.summary.runtimeMinutes - b.summary.runtimeMinutes);
        break;
      case "title_asc":
        sorted.sort((a, b) => a.summary.localizedTitleEn.localeCompare(b.summary.localizedTitleEn));
        break;
      case "featured":
      default:
        break;
    }
    return sorted;
  }, [
    accessFilter,
    enriched,
    lockedKind,
    searchQuery,
    selectedCast,
    selectedCategory,
    selectedDirector,
    selectedGenre,
    selectedKind,
    selectedLanguage,
    selectedStudio,
    sortBy,
  ]);

  const movieCount = useMemo(() => enriched.filter((e) => e.kind === "MOVIE").length, [enriched]);
  const seriesCount = useMemo(() => enriched.filter((e) => e.kind === "SERIES").length, [enriched]);
  const streamableCount = useMemo(
    () => items.filter((item) => item.availability.streamAllowed).length,
    [items],
  );
  const downloadableCount = useMemo(
    () => items.filter((item) => item.availability.downloadAllowed).length,
    [items],
  );

  const hasActiveFilters =
    (!lockedKind && selectedKind !== "ALL") ||
    selectedLanguage !== "all" ||
    selectedGenre !== "all" ||
    selectedDirector !== "all" ||
    selectedCast !== "all" ||
    selectedCategory !== "all" ||
    selectedStudio !== "all" ||
    accessFilter !== "all" ||
    sortBy !== "featured" ||
    Boolean(searchQuery.trim());

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedKind(lockedKind ?? "ALL");
    setSelectedLanguage("all");
    setSelectedGenre("all");
    setSelectedDirector("all");
    setSelectedCast("all");
    setSelectedCategory("all");
    setSelectedStudio("all");
    setAccessFilter("all");
    setSortBy("featured");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", basePath);
    }
  };

  return (
    <div className="space-y-8" data-testid="movie-database-explorer">
      {/* Database Metrics Summary Bar */}
      <div className="border-border bg-surface-1 grid grid-cols-2 gap-3 rounded-xl border p-4 sm:grid-cols-4 sm:p-5">
        <div className="space-y-0.5">
          <p className="text-text-muted font-mono text-[11px] tracking-wider uppercase">
            {lockedKind === "SERIES" ? "Indexed Original Series" : "Movies & Series Indexed"}
          </p>
          <p className="font-display text-text text-2xl font-bold">
            {items.length}
            {!lockedKind ? (
              <span className="text-text-muted ml-2 font-mono text-xs font-normal">
                ({movieCount}F · {seriesCount}S)
              </span>
            ) : null}
          </p>
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

      {/* Special Categories & Universes Bar */}
      <div
        role="group"
        aria-label="Special categories and universes"
        className="flex flex-wrap items-center gap-2"
      >
        <button
          type="button"
          aria-pressed={selectedCategory === "all"}
          onClick={() => {
            setSelectedCategory("all");
            syncUrlParams({ category: "all" });
          }}
          className={`rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center border px-4 py-1.5 font-mono text-xs font-semibold tracking-wide transition-colors motion-reduce:transition-none md:min-h-9 ${
            selectedCategory === "all"
              ? "border-accent bg-accent text-on-accent"
              : "border-border bg-surface-1 text-text-secondary hover:border-border-strong hover:text-text"
          }`}
        >
          All Universes
        </button>
        {CINEVA_SPECIAL_CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              aria-pressed={active}
              onClick={() => {
                const nextSort = cat.slug === "top-rated-hall" ? "top_rated" : sortBy;
                setSelectedCategory(cat.slug);
                if (cat.slug === "top-rated-hall") setSortBy("top_rated");
                syncUrlParams({ category: cat.slug, sort: nextSort });
              }}
              className={`rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 border px-4 py-1.5 font-mono text-xs font-semibold tracking-wide transition-colors motion-reduce:transition-none md:min-h-9 ${
                active
                  ? "border-accent bg-accent text-on-accent"
                  : "border-border bg-surface-1 text-text-secondary hover:border-border-strong hover:text-text"
              }`}
            >
              <span aria-hidden="true" className={active ? "text-on-accent" : "text-accent"}>
                ◆
              </span>
              <span>{cat.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Control Deck: Format + Search + Director + Cast + Studio + Sort + View Toggle + Genre Chips */}
      <div className="border-border bg-surface-1 space-y-5 rounded-xl border p-4 sm:p-6">
        {/* Format Scope + Search + Layout Row */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {!lockedKind ? (
            <div
              role="group"
              aria-label="Catalogue format filter"
              className="border-border bg-surface-2 inline-flex shrink-0 rounded-md border p-0.5"
            >
              {(
                [
                  { id: "ALL", label: `All (${enriched.length})` },
                  { id: "MOVIE", label: `Movies (${movieCount})` },
                  { id: "SERIES", label: `Series (${seriesCount})` },
                ] as const
              ).map((tab) => {
                const active = selectedKind === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setSelectedKind(tab.id);
                      syncUrlParams({ kind: tab.id });
                    }}
                    className={`min-h-11 min-w-11 rounded-sm px-3.5 text-xs font-semibold transition-colors motion-reduce:transition-none md:min-h-9 ${
                      active ? "bg-accent text-on-accent" : "text-text-secondary hover:text-text"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="relative flex-1">
            <label htmlFor="movie-db-filter-input" className="sr-only">
              Filter catalogue by title, director, cast, studio, or mood
            </label>
            <input
              id="movie-db-filter-input"
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                syncUrlParams({ q: e.target.value });
              }}
              placeholder="Filter by title, বাংলা নাম, director, actor, studio, or location…"
              className="border-border-strong bg-surface-2 text-text placeholder:text-text-muted focus:border-accent min-h-11 w-full rounded-md border px-4 py-2.5 text-sm transition-colors motion-reduce:transition-none"
            />
          </div>

          <div
            role="group"
            aria-label="Database view layout"
            className="border-border bg-surface-2 inline-flex shrink-0 self-start rounded-md border p-0.5 lg:self-auto"
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

        {/* Multi-Dimensional Facet Dropdowns: Director + Cast + Studio + Sort */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="movie-db-director"
              className="text-text-muted mb-1 block font-mono text-[10px] tracking-wider uppercase"
            >
              Director / Showrunner
            </label>
            <select
              id="movie-db-director"
              value={selectedDirector}
              onChange={(e) => {
                setSelectedDirector(e.target.value);
                syncUrlParams({ director: e.target.value });
              }}
              className="border-border-strong bg-surface-2 text-text min-h-11 w-full rounded-md border px-3 py-2 text-xs font-medium"
            >
              <option value="all">All Directors ({directorOptions.length})</option>
              {directorOptions.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.nameEn} ({d.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="movie-db-cast"
              className="text-text-muted mb-1 block font-mono text-[10px] tracking-wider uppercase"
            >
              Principal Cast / Actor
            </label>
            <select
              id="movie-db-cast"
              value={selectedCast}
              onChange={(e) => {
                setSelectedCast(e.target.value);
                syncUrlParams({ cast: e.target.value });
              }}
              className="border-border-strong bg-surface-2 text-text min-h-11 w-full rounded-md border px-3 py-2 text-xs font-medium"
            >
              <option value="all">All Principal Cast ({castOptions.length})</option>
              {castOptions.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nameEn} ({c.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="movie-db-studio"
              className="text-text-muted mb-1 block font-mono text-[10px] tracking-wider uppercase"
            >
              Studio &amp; Production Banner
            </label>
            <select
              id="movie-db-studio"
              value={selectedStudio}
              onChange={(e) => {
                setSelectedStudio(e.target.value);
                syncUrlParams({ studio: e.target.value });
              }}
              className="border-border-strong bg-surface-2 text-text min-h-11 w-full rounded-md border px-3 py-2 text-xs font-medium"
            >
              <option value="all">All Studios ({studioOptions.length})</option>
              {studioOptions.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.nameEn} ({s.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="movie-db-sort"
              className="text-text-muted mb-1 block font-mono text-[10px] tracking-wider uppercase"
            >
              Sort Order
            </label>
            <select
              id="movie-db-sort"
              value={sortBy}
              onChange={(e) => {
                const val = e.target.value as CatalogueSort;
                setSortBy(val);
                syncUrlParams({ sort: val });
              }}
              className="border-border-strong bg-surface-2 text-text min-h-11 w-full rounded-md border px-3 py-2 text-xs font-medium"
            >
              <option value="featured">Sort: Curated Order</option>
              <option value="top_rated">Sort: Top Rated (Bayesian WR)</option>
              <option value="trending">Sort: Trending &amp; Popular</option>
              <option value="newest">Sort: Newest Release</option>
              <option value="classic">Sort: Classic Vintage</option>
              <option value="runtime_desc">Sort: Longest Runtime</option>
              <option value="runtime_asc">Sort: Shortest Runtime</option>
              <option value="title_asc">Sort: Title (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Language & Access Row */}
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div
            role="group"
            aria-label="Language filter"
            className="flex flex-wrap items-center gap-2"
          >
            {LANGUAGE_OPTIONS.map((f) => {
              const selected = selectedLanguage === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setSelectedLanguage(f.value);
                    syncUrlParams({ lang: f.value });
                  }}
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
                </button>
              );
            })}
          </div>

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
            onClick={() => {
              setSelectedGenre("all");
              syncUrlParams({ genre: "all" });
            }}
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
                onClick={() => {
                  setSelectedGenre(genre.slug);
                  syncUrlParams({ genre: genre.slug });
                }}
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

      {/* Results Header & Active Facet Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">
            Showing {filtered.length} of {items.length} Titles
          </Badge>
          {!lockedKind && selectedKind !== "ALL" ? (
            <Badge tone="neutral">Format: {selectedKind}</Badge>
          ) : null}
          {selectedCategory !== "all" ? (
            <Badge tone="neutral">Universe: {selectedCategory}</Badge>
          ) : null}
          {selectedDirector !== "all" ? (
            <Badge tone="neutral">Director: {selectedDirector}</Badge>
          ) : null}
          {selectedCast !== "all" ? <Badge tone="neutral">Cast: {selectedCast}</Badge> : null}
          {selectedStudio !== "all" ? <Badge tone="neutral">Studio: {selectedStudio}</Badge> : null}
          {selectedGenre !== "all" ? (
            <Badge tone="neutral">Genre: {selectedGenre.toUpperCase()}</Badge>
          ) : null}
          {searchQuery.trim() ? (
            <Badge tone="info">Filter: &ldquo;{searchQuery.trim()}&rdquo;</Badge>
          ) : null}
        </div>

        {hasActiveFilters ? (
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
            Reset Database Filters
          </Button>
        ) : null}
      </div>

      {/* Filtered Content */}
      {filtered.length === 0 ? (
        <EmptyState
          eyebrow="0 matching database records"
          title="No titles match the active filter combination"
          description="Clear your search text or broaden the director, cast, studio, universe, or genre filters to inspect the complete CINEVA catalogue."
          actions={
            <Button type="button" variant="secondary" onClick={resetFilters}>
              Show All Titles
            </Button>
          }
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((entry, idx) => (
            <TitleCard
              key={entry.summary.id}
              title={entry.summary}
              rankNumber={
                sortBy === "top_rated" || selectedCategory === "top-rated-hall"
                  ? idx + 1
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className="border-border bg-surface-1 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-border bg-surface-2 text-text-muted border-b font-mono text-[11px] tracking-wider uppercase">
                <th className="px-4 py-3.5">#</th>
                <th className="px-4 py-3.5">Work &amp; Format</th>
                <th className="px-4 py-3.5">Year</th>
                <th className="px-4 py-3.5">Director &amp; Cast</th>
                <th className="px-4 py-3.5">Studio Banner</th>
                <th className="px-4 py-3.5">Bayesian WR</th>
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
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/movies/${entry.summary.slug}`}
                        className="font-display text-text hover:text-accent block font-bold transition-colors motion-reduce:transition-none"
                      >
                        {entry.summary.localizedTitleEn}
                      </Link>
                      <span className="border-border-strong bg-surface-2 text-text-muted rounded-xs border px-1.5 py-0.5 font-mono text-[10px] uppercase">
                        {entry.kind === "SERIES" ? `SERIES · ${entry.seasonCount}S` : "MOVIE"}
                      </span>
                    </div>
                    <span className="text-text-secondary text-xs" lang="bn">
                      {entry.summary.localizedTitleBn}
                    </span>
                  </td>
                  <td className="text-text-secondary px-4 py-3.5 font-mono text-xs">
                    {entry.summary.releaseYear}
                  </td>
                  <td className="px-4 py-3.5 text-xs">
                    <p className="text-text font-medium">{entry.director}</p>
                    {entry.castNames.length > 0 ? (
                      <p className="text-text-muted text-[11px]">
                        {entry.castNames.slice(0, 2).join(", ")}
                      </p>
                    ) : null}
                  </td>
                  <td className="text-text-secondary px-4 py-3.5 text-xs">
                    <Link
                      href={`/studios/${entry.studioSlug}`}
                      className="hover:text-accent underline-offset-2 hover:underline"
                    >
                      {entry.studioName}
                    </Link>
                    <p className="text-text-muted font-mono text-[11px]">
                      {entry.aspectRatio} · {entry.summary.runtimeMinutes}
                      {entry.kind === "SERIES" ? "m/ep" : "m"}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-accent font-mono text-xs font-bold">
                      ★ {entry.bayesianScore.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <AvailabilityBadge kind={entry.summary.availability.badgeKind} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {entry.summary.availability.streamAllowed ? (
                      <Link
                        href={
                          entry.kind === "SERIES"
                            ? `/watch/${entry.summary.slug}?s=1&e=1`
                            : `/watch/${entry.summary.slug}`
                        }
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
