import { getDatabase, searchPublishedTitles } from "@movie/db";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { TitleCard } from "@/components/catalogue/title-card";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, Button, ButtonLink, ContentRowSkeleton, EmptyState } from "@/components/ui";
import { resolveViewerTerritory } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "Search · Cinematic Graphite",
  description: "Search published films, cast, crew, and localized Bangla or English titles.",
};

function normalizeQuery(raw: string | string[] | undefined): string {
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (!first) return "";
  return first
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 120);
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
    return (
      <EmptyState
        eyebrow="Search ready"
        title="Enter a title, filmmaker, or Bangla/English keyword"
        description="Queries search published titles across English and Bangla localized metadata, synopses, and credited filmmakers. Drafts and titles under legal hold are never indexed."
        actions={
          <ButtonLink href="/movies" variant="secondary">
            Browse Movies Directory
          </ButtonLink>
        }
      />
    );
  }

  const territoryCode = await resolveViewerTerritory();
  const db = await getDatabase();
  const matches = await searchPublishedTitles(db, query, { territoryCode, limit: 24 });

  return (
    <div aria-live="polite" className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="info">Query: &ldquo;{query}&rdquo;</Badge>
        <Badge tone="neutral">{matches.length} published matches</Badge>
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
  );
}

export default function SearchPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ConsumerShell>
      <header className="mb-8 space-y-3">
        <Badge tone="neutral">Discovery</Badge>
        <h1 className="font-display text-text text-3xl font-bold sm:text-4xl">Search Catalogue</h1>
        <p className="cg-prose text-text-secondary text-base leading-7">
          Find authorized films by English title, Bangla title, director, or cast member.
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
          placeholder="Search English or বাংলা titles, directors, cast…"
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
