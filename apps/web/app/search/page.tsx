import type { Metadata } from "next";
import { Suspense } from "react";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, Button, ButtonLink, ContentRowSkeleton, EmptyState } from "@/components/ui";

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
  const resolved = await searchParams;
  const query = normalizeQuery(resolved.q);

  if (!query) {
    return (
      <EmptyState
        eyebrow="Search ready"
        title="Enter a title, filmmaker, or language"
        description="Full-text and trigram search across English and Bangla localized titles connects to the PostgreSQL catalogue in Milestone M2. No unverified or third-party scraped listings are indexed."
        actions={
          <ButtonLink href="/movies" variant="secondary">
            Browse Movies Directory
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div aria-live="polite" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="info">Query: &ldquo;{query}&rdquo;</Badge>
        <Badge tone="neutral">0 published matches</Badge>
      </div>
      <EmptyState
        eyebrow="No matching published films"
        title={`No rights-approved results for “${query}”`}
        description="The public catalogue currently contains zero published titles while database persistence and rights review workflows are completed in Milestone M2."
        actions={
          <>
            <ButtonLink href="/search" variant="secondary">
              Clear Search
            </ButtonLink>
            <ButtonLink href="/movies" variant="outline">
              View Catalogue Status
            </ButtonLink>
          </>
        }
      />
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
          Find authorized films by English title, Bangla title, director, cast member, or release
          year.
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
          placeholder="Search titles, directors, or languages…"
          className="border-border-strong bg-surface-2 text-text placeholder:text-text-muted min-h-11 flex-1 rounded-sm border px-4 py-2.5 text-base"
        />
        <Button type="submit" variant="primary" size="md">
          Search
        </Button>
      </form>

      <Suspense fallback={<ContentRowSkeleton count={5} />}>
        <SearchResultsSection searchParams={props.searchParams} />
      </Suspense>
    </ConsumerShell>
  );
}
