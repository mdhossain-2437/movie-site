import { getDatabase, searchPublishedTitles, type PublicTitleSummary } from "@movie/db";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { TitleCard } from "@/components/catalogue/title-card";
import { TmdbTitleCard } from "@/components/catalogue/tmdb-title-card";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, Button, ButtonLink, ContentRowSkeleton, EmptyState } from "@/components/ui";
import { listDevShowcaseSummaries, searchDevShowcaseSummaries } from "@/lib/catalogue/dev-showcase";
import { discoverTmdbWorks, getTmdbRuntimeStatus } from "@/lib/metadata/tmdb-client";
import { TMDB_OFFICIAL_ATTRIBUTION, type TmdbCatalogItem } from "@/lib/metadata/tmdb-types";
import { resolveViewerTerritory } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "Search Film Database · CINEVA",
  description: "Search films, cast, directors, genres, and titles on CINEVA.",
};

const QUICK_SEARCH_CHIPS = [
  "The Last Monsoon",
  "Amina Rahman",
  "Noir",
  "Sci-Fi",
  "Curzon Hall",
  "1921",
] as const;

function normalizeQuery(raw: string | string[] | undefined): string {
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (!first) return "";
  return first
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 120);
}

function mergeSearchMatches(
  dbMatches: PublicTitleSummary[],
  showcaseMatches: PublicTitleSummary[],
): PublicTitleSummary[] {
  const seen = new Set<string>();
  const merged: PublicTitleSummary[] = [];
  for (const item of [...dbMatches, ...showcaseMatches]) {
    if (!seen.has(item.slug)) {
      seen.add(item.slug);
      merged.push(item);
    }
  }
  return merged;
}

async function SearchResultsSection({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const resolved = await searchParams;
  const query = normalizeQuery(resolved.q);

  if (!query) {
    const featured = listDevShowcaseSummaries().slice(0, 4);
    return (
      <div className="space-y-10">
        <div className="border-border bg-surface-1 space-y-4 rounded-xl border p-5 sm:p-6">
          <p className="text-accent font-mono text-xs font-semibold tracking-widest uppercase">
            Instant Database Queries
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_SEARCH_CHIPS.map((term) => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="border-border bg-surface-2 text-text-secondary hover:border-accent hover:text-text rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center border px-4 py-1.5 text-xs font-medium transition-colors motion-reduce:transition-none md:min-h-9"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>

        {featured.length > 0 ? (
          <section aria-labelledby="trending-search-heading" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="trending-search-heading" className="font-display text-text text-xl font-bold">
                Most Searched on CINEVA
              </h2>
              <ButtonLink href="/movies" variant="outline" size="sm">
                Full Film Database
              </ButtonLink>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((item) => (
                <TitleCard key={item.id} title={item} />
              ))}
            </div>
          </section>
        ) : (
          <EmptyState
            eyebrow="Search ready"
            title="Enter a title, filmmaker, or keyword"
            description="Queries search published titles across localized metadata, synopses, and credited filmmakers."
            actions={
              <ButtonLink href="/movies" variant="secondary">
                Browse Movies Directory
              </ButtonLink>
            }
          />
        )}
      </div>
    );
  }

  const territoryCode = await resolveViewerTerritory();
  const db = await getDatabase();
  const dbMatches = await searchPublishedTitles(db, query, { territoryCode, limit: 24 });
  const showcaseMatches = searchDevShowcaseSummaries(query);
  const matches = mergeSearchMatches(dbMatches, showcaseMatches);

  let tmdbMatches: TmdbCatalogItem[] = [];
  if (getTmdbRuntimeStatus().configured) {
    try {
      const tmdbRes = await discoverTmdbWorks({
        mode: "search",
        query,
        limit: 8,
      });
      tmdbMatches = tmdbRes.items;
    } catch {
      tmdbMatches = [];
    }
  }

  return (
    <div aria-live="polite" className="space-y-10">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">Query: &ldquo;{query}&rdquo;</Badge>
          <Badge tone="neutral">{matches.length} rights-approved vault matches</Badge>
          {tmdbMatches.length > 0 ? (
            <Badge tone="neutral">{tmdbMatches.length} live TMDB global matches</Badge>
          ) : null}
        </div>

        {matches.length === 0 ? (
          <EmptyState
            eyebrow="No matching published films"
            title={`No rights-approved results for “${query}”`}
            description="No published catalogue entry matched your search query. Verify spelling or browse the Movies directory."
            actions={
              <>
                <ButtonLink href="/search" variant="secondary">
                  Clear Search
                </ButtonLink>
                <ButtonLink href="/movies" variant="outline">
                  Browse Movies
                </ButtonLink>
              </>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {matches.map((item) => (
              <TitleCard key={item.id} title={item} />
            ))}
          </div>
        )}
      </div>

      {tmdbMatches.length > 0 ? (
        <section
          aria-labelledby="tmdb-search-matches-heading"
          className="border-border space-y-5 border-t pt-8"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <p className="text-accent font-mono text-xs font-semibold tracking-widest uppercase">
                Live TMDB Global Metadata Index
              </p>
              <h2
                id="tmdb-search-matches-heading"
                className="font-display text-text text-2xl font-bold"
              >
                Global Film &amp; Series Matches for &ldquo;{query}&rdquo;
              </h2>
            </div>
            <ButtonLink
              href={`/tmdb?mode=search&q=${encodeURIComponent(query)}`}
              variant="secondary"
              size="sm"
            >
              Open Full TMDB Search →
            </ButtonLink>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {tmdbMatches.map((item) => (
              <TmdbTitleCard key={`${item.mediaKind}-${item.tmdbId}`} item={item} />
            ))}
          </div>

          <p className="text-text-muted font-mono text-[11px]">{TMDB_OFFICIAL_ATTRIBUTION}</p>
        </section>
      ) : null}
    </div>
  );
}

export default function SearchPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ConsumerShell>
      <header className="mb-8 space-y-3">
        <Badge tone="accent">CINEVA Search Index</Badge>
        <h1 className="font-display text-text text-3xl font-bold sm:text-5xl">Search Catalogue</h1>
        <p className="cg-prose text-text-secondary text-base leading-7">
          Find authorized films by title, director, cast member, genre, or release year.
        </p>
      </header>

      <form
        action="/search"
        method="get"
        role="search"
        aria-label="Catalogue search"
        className="cg-surface mb-8 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5"
      >
        <label htmlFor="catalogue-search-input" className="sr-only">
          Search titles, cast, or directors
        </label>
        <input
          id="catalogue-search-input"
          name="q"
          type="search"
          maxLength={120}
          placeholder="Search titles, directors, cast, genres…"
          className="border-border-strong bg-surface-2 text-text placeholder:text-text-muted min-h-11 flex-1 rounded-sm border px-4 py-2.5 text-base"
        />
        <Button type="submit" variant="primary" size="md">
          Search
        </Button>
      </form>

      <Suspense fallback={<ContentRowSkeleton count={4} />}>
        <SearchResultsSection searchParams={props.searchParams} />
      </Suspense>
    </ConsumerShell>
  );
}
