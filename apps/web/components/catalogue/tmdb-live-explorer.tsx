"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, EmptyState, Spinner } from "@/components/ui";
import {
  TMDB_GENRE_PRESETS,
  TMDB_OFFICIAL_ATTRIBUTION,
  TMDB_STUDIO_PRESETS,
  type TmdbCatalogItem,
  type TmdbPersonHit,
} from "@/lib/metadata/tmdb-types";
import { TmdbTitleCard } from "./tmdb-title-card";

export interface TmdbLiveExplorerProps {
  initialItems: TmdbCatalogItem[];
  initialTotalResults: number;
  initialTotalPages: number;
  initialMode?: "trending" | "top_rated" | "discover" | "search";
  initialKind?: "ALL" | "MOVIE" | "SERIES";
  initialStudio?: string;
  initialGenre?: string;
  initialLanguage?: string;
  initialQuery?: string;
}

const LANGUAGE_OPTIONS = [
  { code: "all", label: "All Languages" },
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ko", label: "Korean" },
  { code: "ja", label: "Japanese" },
] as const;

export function TmdbLiveExplorer({
  initialItems,
  initialTotalResults,
  initialTotalPages,
  initialMode = "trending",
  initialKind = "ALL",
  initialStudio = "all",
  initialGenre = "all",
  initialLanguage = "all",
  initialQuery = "",
}: TmdbLiveExplorerProps) {
  const [mode, setMode] = useState<"trending" | "top_rated" | "discover" | "search">(initialMode);
  const [kind, setKind] = useState<"ALL" | "MOVIE" | "SERIES">(initialKind);
  const [studio, setStudio] = useState<string>(initialStudio);
  const [genre, setGenre] = useState<string>(initialGenre);
  const [language, setLanguage] = useState<string>(initialLanguage);
  const [sort, setSort] = useState<
    "popularity.desc" | "vote_average.desc" | "release_date.desc" | "revenue.desc"
  >(initialMode === "top_rated" ? "vote_average.desc" : "popularity.desc");
  const [queryInput, setQueryInput] = useState<string>(initialQuery);
  const [activeQuery, setActiveQuery] = useState<string>(initialQuery);

  const [personInput, setPersonInput] = useState<string>("");
  const [personHits, setPersonHits] = useState<TmdbPersonHit[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<{ id: number; name: string } | null>(null);
  const [isSearchingPeople, setIsSearchingPeople] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [items, setItems] = useState<TmdbCatalogItem[]>(initialItems);
  const [totalResults, setTotalResults] = useState<number>(initialTotalResults);
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFirstMount = useRef(true);

  const fetchCatalog = useCallback(
    async (next: {
      mode: "trending" | "top_rated" | "discover" | "search";
      kind: "ALL" | "MOVIE" | "SERIES";
      studio: string;
      genre: string;
      language: string;
      sort: "popularity.desc" | "vote_average.desc" | "release_date.desc" | "revenue.desc";
      query: string;
      personId?: number;
      page: number;
    }) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const params = new URLSearchParams();
        params.set("mode", next.mode);
        params.set("kind", next.kind);
        if (next.studio !== "all") params.set("studio", next.studio);
        if (next.genre !== "all") params.set("genre", next.genre);
        if (next.language !== "all") params.set("lang", next.language);
        params.set("sort", next.sort);
        if (next.query.trim()) params.set("q", next.query.trim());
        if (next.personId) params.set("personId", String(next.personId));
        params.set("page", String(next.page));
        params.set("limit", "20");

        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams();
          if (next.mode !== "trending") urlParams.set("mode", next.mode);
          if (next.kind !== "ALL") urlParams.set("kind", next.kind);
          if (next.studio !== "all") urlParams.set("studio", next.studio);
          if (next.genre !== "all") urlParams.set("genre", next.genre);
          if (next.language !== "all") urlParams.set("lang", next.language);
          if (next.query.trim()) urlParams.set("q", next.query.trim());
          const qs = urlParams.toString();
          window.history.replaceState(
            null,
            "",
            qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
          );
        }

        const res = await fetch(`/api/v1/tmdb/discover?${params.toString()}`, {
          headers: { Accept: "application/json" },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail ?? "Unable to query TMDB Global Index");
        }
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotalResults(Number(data.totalResults ?? 0));
        setTotalPages(Number(data.totalPages ?? 1));
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "TMDB query failed");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    void fetchCatalog({
      mode,
      kind,
      studio,
      genre,
      language,
      sort,
      query: activeQuery,
      personId: selectedPerson?.id,
      page,
    });
  }, [activeQuery, fetchCatalog, genre, kind, language, mode, page, selectedPerson, sort, studio]);

  useEffect(() => {
    const trimmed = personInput.trim();
    if (trimmed.length < 2) {
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingPeople(true);
      try {
        const res = await fetch(
          `/api/v1/tmdb/discover?peopleQuery=${encodeURIComponent(trimmed)}`,
          { headers: { Accept: "application/json" } },
        );
        if (res.ok) {
          const json = await res.json();
          setPersonHits(Array.isArray(json.people) ? json.people : []);
        }
      } catch {
        setPersonHits([]);
      } finally {
        setIsSearchingPeople(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [personInput]);

  const handleReset = () => {
    setMode("trending");
    setKind("ALL");
    setStudio("all");
    setGenre("all");
    setLanguage("all");
    setSort("popularity.desc");
    setQueryInput("");
    setActiveQuery("");
    setPersonInput("");
    setPersonHits([]);
    setSelectedPerson(null);
    setPage(1);
  };

  return (
    <section
      aria-label="Live TMDB Global Movie and Series Explorer"
      data-testid="tmdb-live-explorer"
      className="space-y-7"
    >
      {/* Major Studios & Comic Franchises Quick Bar */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-accent font-mono text-xs font-semibold tracking-widest uppercase">
            Major Studios &amp; Franchise Hubs (Live TMDB Company Registry)
          </p>
          {isLoading ? (
            <span className="text-accent inline-flex items-center gap-2 font-mono text-xs">
              <Spinner size="sm" label="Syncing live TMDB index…" />
              <span>Syncing TMDB…</span>
            </span>
          ) : (
            <span className="text-text-muted font-mono text-xs">
              {totalResults.toLocaleString()} Global Records
            </span>
          )}
        </div>

        <div
          role="group"
          aria-label="Filter by studio or franchise"
          className="flex flex-wrap items-center gap-2"
        >
          <button
            type="button"
            aria-pressed={studio === "all"}
            aria-busy={isLoading && studio === "all"}
            disabled={isLoading}
            onClick={() => {
              setStudio("all");
              setPage(1);
            }}
            className={`rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center border px-4 py-1.5 text-xs font-semibold transition-colors motion-reduce:transition-none md:min-h-9 ${
              studio === "all"
                ? "border-accent bg-accent text-on-accent"
                : "border-border bg-surface-1 text-text-secondary hover:border-border-strong hover:text-text"
            }`}
          >
            All Studios
          </button>

          {TMDB_STUDIO_PRESETS.map((preset) => {
            const active = studio === preset.slug;
            return (
              <button
                key={preset.slug}
                type="button"
                aria-pressed={active}
                aria-busy={isLoading && active}
                disabled={isLoading}
                onClick={() => {
                  setStudio(active ? "all" : preset.slug);
                  setActiveQuery("");
                  setQueryInput("");
                  if (!active && mode === "trending") {
                    setMode("discover");
                  }
                  setPage(1);
                }}
                className={`rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 border px-4 py-1.5 text-xs font-semibold transition-colors motion-reduce:transition-none md:min-h-9 ${
                  active
                    ? "border-accent bg-accent text-on-accent"
                    : "border-border bg-surface-1 text-text-secondary hover:border-border-strong hover:text-text"
                }`}
              >
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Faceted Control Deck */}
      <div className="border-border bg-surface-1 space-y-4 rounded-xl border p-4 sm:p-5">
        {/* Row 1: Feed Mode + Format + Search */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div
            role="group"
            aria-label="TMDB feed mode"
            className="border-border-strong bg-surface-2 inline-flex rounded-sm border p-1"
          >
            {(
              [
                { id: "trending", label: "Trending" },
                { id: "top_rated", label: "Top Rated" },
                { id: "discover", label: "Discover" },
              ] as const
            ).map((tab) => {
              const active = mode === tab.id && !activeQuery;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={active}
                  disabled={isLoading}
                  onClick={() => {
                    setMode(tab.id);
                    setActiveQuery("");
                    setQueryInput("");
                    if (tab.id === "top_rated") {
                      setSort("vote_average.desc");
                    } else if (tab.id === "trending") {
                      setSort("popularity.desc");
                    }
                    setPage(1);
                  }}
                  className={`min-h-11 min-w-11 rounded-xs px-3 py-1.5 font-mono text-xs font-semibold transition-colors motion-reduce:transition-none md:min-h-9 ${
                    active
                      ? "bg-accent text-on-accent"
                      : "text-text-secondary hover:bg-surface-3 hover:text-text"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div
            role="group"
            aria-label="Format filter"
            className="border-border-strong bg-surface-2 inline-flex rounded-sm border p-1"
          >
            {(
              [
                { id: "ALL", label: "All" },
                { id: "MOVIE", label: "Movies" },
                { id: "SERIES", label: "TV Series" },
              ] as const
            ).map((tab) => {
              const active = kind === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={active}
                  disabled={isLoading}
                  onClick={() => {
                    setKind(tab.id);
                    setPage(1);
                  }}
                  className={`min-h-11 min-w-11 rounded-xs px-3 py-1.5 font-mono text-xs font-semibold transition-colors motion-reduce:transition-none md:min-h-9 ${
                    active
                      ? "bg-accent text-on-accent"
                      : "text-text-secondary hover:bg-surface-3 hover:text-text"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setActiveQuery(queryInput.trim());
              if (queryInput.trim()) {
                setMode("search");
              }
              setPage(1);
            }}
            className="flex flex-1 gap-2"
          >
            <label htmlFor="tmdb-search-query" className="sr-only">
              Search live TMDB movies and TV series
            </label>
            <input
              id="tmdb-search-query"
              type="search"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Search global movies & series (Dune, Batman, Avengers, Pather Panchali…)"
              className="border-border-strong bg-surface-2 text-text placeholder:text-text-muted focus:border-accent min-h-11 w-full rounded-sm border px-4 py-2 text-sm focus:outline-none"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? <Spinner size="sm" label="Searching TMDB…" /> : "Search"}
            </Button>
          </form>
        </div>

        {/* Row 2: Live Director/Actor Autocomplete + Language + Sort */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <label
              htmlFor="tmdb-person-filter"
              className="text-text-muted mb-1 block font-mono text-[10px] tracking-wider uppercase"
            >
              Director or Cast Member (Live TMDB Person Graph)
            </label>
            <div className="relative">
              <input
                id="tmdb-person-filter"
                type="search"
                value={personInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setPersonInput(val);
                  if (val.trim().length < 2) {
                    setPersonHits([]);
                  }
                }}
                placeholder={
                  selectedPerson
                    ? `Active: ${selectedPerson.name}`
                    : "Type Nolan, Villeneuve, Cillian Murphy…"
                }
                className="border-border-strong bg-surface-2 text-text placeholder:text-text-muted focus:border-accent min-h-11 w-full rounded-sm border px-3 py-2 text-xs focus:outline-none"
              />
              {isSearchingPeople ? (
                <span className="pointer-events-none absolute top-3 right-3">
                  <Spinner size="sm" label="Searching filmmakers and cast…" />
                </span>
              ) : null}
            </div>

            {personHits.length > 0 ? (
              <div
                role="listbox"
                aria-label="Matching directors and actors"
                className="border-border-strong bg-surface-2 absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-md border p-1 shadow-lg"
              >
                {personHits.map((hit) => (
                  <button
                    key={hit.personId}
                    type="button"
                    role="option"
                    aria-selected={selectedPerson?.id === hit.personId}
                    onClick={() => {
                      setSelectedPerson({ id: hit.personId, name: hit.name });
                      setPersonInput("");
                      setPersonHits([]);
                      setActiveQuery("");
                      setQueryInput("");
                      setMode("discover");
                      setPage(1);
                    }}
                    className="hover:bg-surface-3 flex min-h-11 w-full items-center justify-between gap-2 rounded-xs px-3 py-2 text-left text-xs transition-colors motion-reduce:transition-none"
                  >
                    <div>
                      <p className="text-text font-semibold">{hit.name}</p>
                      <p className="text-text-muted font-mono text-[10px]">
                        {hit.knownForDepartment}
                        {hit.knownForTitles.length > 0
                          ? ` · ${hit.knownForTitles.slice(0, 2).join(", ")}`
                          : ""}
                      </p>
                    </div>
                    <span className="text-accent font-mono text-[10px]">Filter →</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="tmdb-lang-select"
              className="text-text-muted mb-1 block font-mono text-[10px] tracking-wider uppercase"
            >
              Original Language
            </label>
            <select
              id="tmdb-lang-select"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                if (mode === "trending") setMode("discover");
                setPage(1);
              }}
              className="border-border-strong bg-surface-2 text-text min-h-11 w-full rounded-sm border px-3 py-2 text-xs font-medium"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="tmdb-sort-select"
              className="text-text-muted mb-1 block font-mono text-[10px] tracking-wider uppercase"
            >
              Discovery Ranking
            </label>
            <select
              id="tmdb-sort-select"
              value={sort}
              onChange={(e) => {
                const val = e.target.value as
                  "popularity.desc" | "vote_average.desc" | "release_date.desc" | "revenue.desc";
                setSort(val);
                setMode(val === "vote_average.desc" ? "top_rated" : "discover");
                setPage(1);
              }}
              className="border-border-strong bg-surface-2 text-text min-h-11 w-full rounded-sm border px-3 py-2 text-xs font-medium"
            >
              <option value="popularity.desc">Sort: Global Popularity</option>
              <option value="vote_average.desc">Sort: Top Rated (Verified Votes)</option>
              <option value="release_date.desc">Sort: Latest Releases</option>
              <option value="revenue.desc">Sort: Box Office Gross</option>
            </select>
          </div>
        </div>

        {/* Row 3: Genre Taxonomy Chips */}
        <div role="group" aria-label="Genre filter" className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={genre === "all"}
            disabled={isLoading}
            onClick={() => {
              setGenre("all");
              setPage(1);
            }}
            className={`rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center border px-3.5 py-1.5 text-xs font-semibold transition-colors motion-reduce:transition-none md:min-h-8 ${
              genre === "all"
                ? "border-accent bg-accent text-on-accent"
                : "border-border-strong bg-surface-2 text-text-secondary hover:text-text"
            }`}
          >
            All Genres
          </button>

          {TMDB_GENRE_PRESETS.map((g) => {
            const active = genre === g.slug;
            return (
              <button
                key={g.slug}
                type="button"
                aria-pressed={active}
                disabled={isLoading}
                onClick={() => {
                  setGenre(active ? "all" : g.slug);
                  if (!active && mode === "trending") setMode("discover");
                  setPage(1);
                }}
                className={`rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 border px-3.5 py-1.5 text-xs font-medium transition-colors motion-reduce:transition-none md:min-h-8 ${
                  active
                    ? "border-accent bg-accent text-on-accent font-semibold"
                    : "border-border bg-surface-2 text-text-secondary hover:border-border-strong hover:text-text"
                }`}
              >
                <span>{g.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Filter Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">
            Page {page} of {Math.max(1, totalPages)} · {items.length} Displayed
          </Badge>
          {studio !== "all" ? <Badge tone="neutral">Studio: {studio.toUpperCase()}</Badge> : null}
          {genre !== "all" ? <Badge tone="neutral">Genre: {genre}</Badge> : null}
          {activeQuery ? <Badge tone="neutral">Query: “{activeQuery}”</Badge> : null}
          {selectedPerson ? (
            <button
              type="button"
              onClick={() => {
                setSelectedPerson(null);
                setPage(1);
              }}
              className="border-accent/50 bg-accent/15 text-accent rounded-pill inline-flex min-h-11 min-w-11 items-center gap-1.5 border px-3 py-1 font-mono text-xs md:min-h-8"
            >
              <span>Person: {selectedPerson.name}</span>
              <span aria-hidden="true">×</span>
            </button>
          ) : null}
          {selectedPerson ? (
            <Link
              href={`/tmdb/person/${selectedPerson.id}`}
              className="text-accent hover:text-text inline-flex min-h-11 items-center px-2 font-mono text-xs underline underline-offset-4 md:min-h-8"
            >
              Open Full Biography →
            </Link>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="text-accent hover:text-text min-h-11 min-w-11 px-2 text-xs font-semibold underline underline-offset-4 md:min-h-8"
        >
          Reset TMDB Filters
        </button>
      </div>

      {errorMessage ? (
        <EmptyState
          eyebrow="Upstream Metadata Notice"
          title="TMDB query could not be completed"
          description={errorMessage}
          actions={
            <Button type="button" variant="secondary" onClick={handleReset}>
              Retry Default Feed
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          eyebrow="Zero TMDB Matches"
          title="No movies or series matched the selected filters"
          description="Try broadening the studio, person, language, or genre combination."
          actions={
            <Button type="button" variant="secondary" onClick={handleReset}>
              Reset All Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, idx) => (
            <TmdbTitleCard
              key={`${item.mediaKind}-${item.tmdbId}`}
              item={item}
              rankNumber={mode === "top_rated" ? (page - 1) * 20 + idx + 1 : undefined}
            />
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 ? (
        <div className="border-border bg-surface-1 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Previous Page
          </Button>
          <span className="text-text-secondary font-mono text-xs">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page >= Math.min(20, totalPages) || isLoading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next Page →
          </Button>
        </div>
      ) : null}

      {/* Official TMDB Terms of Use Attribution */}
      <footer className="border-border bg-surface-1 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
        <p className="text-text-muted font-mono text-xs">{TMDB_OFFICIAL_ATTRIBUTION}</p>
        <Badge tone="warning">Metadata Discovery Only · Streaming Requires Verified Rights</Badge>
      </footer>
    </section>
  );
}
