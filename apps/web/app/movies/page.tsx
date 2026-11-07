import { getDatabase, listPublishedTitles, type PublicTitleSummary } from "@movie/db";
import type { Metadata } from "next";
import { Suspense } from "react";
import { MovieDatabaseExplorer } from "@/components/catalogue/movie-database-explorer";
import { PosterGrid } from "@/components/catalogue/poster-card";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, ButtonLink, ContentRowSkeleton, EmptyState } from "@/components/ui";
import { listDevShowcaseSummaries } from "@/lib/catalogue/dev-showcase";
import { listTitles } from "@/lib/catalogue/repository";
import { resolveViewerTerritory } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "Movies & Film Database · CINEVA",
  description:
    "Explore the CINEVA film database: stream 1080p anamorphic features, inspect technical camera sheets, filter by genre or language, and browse restored cinema.",
};

function mergeTitleSummaries(
  dbItems: PublicTitleSummary[],
  showcaseItems: PublicTitleSummary[],
): PublicTitleSummary[] {
  const seen = new Set<string>();
  const merged: PublicTitleSummary[] = [];
  for (const item of [...dbItems, ...showcaseItems]) {
    if (!seen.has(item.slug)) {
      seen.add(item.slug);
      merged.push(item);
    }
  }
  return merged;
}

async function MoviesDirectoryResults({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const rawLang = Array.isArray(resolved.lang) ? resolved.lang[0] : resolved.lang;
  const activeLang = rawLang === "bn" || rawLang === "en" ? rawLang : undefined;
  const rawGenre = Array.isArray(resolved.genre) ? resolved.genre[0] : resolved.genre;

  const territoryCode = await resolveViewerTerritory();
  const db = await getDatabase();
  const dbItems = await listPublishedTitles(db, {
    territoryCode,
    language: activeLang,
    limit: 48,
  });
  const showcaseItems = listDevShowcaseSummaries({ language: activeLang });
  const items = mergeTitleSummaries(dbItems, showcaseItems);

  const archiveCards = listTitles();

  return (
    <div className="space-y-14">
      {items.length === 0 ? (
        <EmptyState
          eyebrow="0 published titles"
          title="No rights-cleared titles are published yet"
          description="Titles appear in this directory only after editorial metadata, attribution, and an active rights grant are approved by a separate Rights Reviewer with MFA."
          actions={
            <>
              <ButtonLink href="/search" variant="secondary">
                Search Catalogue
              </ButtonLink>
              <ButtonLink href="/legal/copyright" variant="outline">
                Review Licensing Policy
              </ButtonLink>
            </>
          }
        />
      ) : (
        <MovieDatabaseExplorer
          items={items}
          territoryCode={territoryCode}
          activeLang={activeLang}
          initialGenre={rawGenre}
        />
      )}

      {archiveCards.length > 0 ? (
        <section
          aria-labelledby="archive-ref-heading"
          className="border-border space-y-6 border-t pt-12"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <Badge tone="neutral">World Cinema Historical Vault</Badge>
              <h2
                id="archive-ref-heading"
                className="font-display text-text text-2xl font-bold sm:text-3xl"
              >
                Silent &amp; Early Cinema Milestones ({archiveCards.length})
              </h2>
              <p className="text-text-secondary max-w-2xl text-sm leading-relaxed">
                Foundational pre-1930 works of world cinema preserved in the CINEVA encyclopedic
                reference index with full director credits, restorations, and archival notes.
              </p>
            </div>
            <ButtonLink href="/collections" variant="outline" size="sm">
              Browse Curated Retrospectives
            </ButtonLink>
          </div>
          <PosterGrid cards={archiveCards} />
        </section>
      ) : null}
    </div>
  );
}

export default function MoviesPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ConsumerShell>
      <header className="mb-8 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">CINEVA Film Database</Badge>
          <Badge tone="neutral">2.39:1 Anamorphic · Dual Subtitles</Badge>
        </div>
        <h1 className="font-display text-text text-3xl font-bold sm:text-5xl">Movies</h1>
        <p className="cg-prose text-text-secondary text-base leading-7">
          Stream authorized feature cinema in high definition or switch to the technical ledger to
          inspect aspect ratios, negative stock, sound mixes, directors, and territorial rights.
        </p>
      </header>

      <Suspense fallback={<ContentRowSkeleton count={4} />}>
        <MoviesDirectoryResults searchParams={props.searchParams} />
      </Suspense>
    </ConsumerShell>
  );
}
