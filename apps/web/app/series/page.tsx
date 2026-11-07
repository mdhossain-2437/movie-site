import { CatalogueSortSchema } from "@movie/contracts";
import { getDatabase, listPublishedTitles, type PublicTitleSummary } from "@movie/db";
import type { Metadata } from "next";
import { Suspense } from "react";
import { MovieDatabaseExplorer } from "@/components/catalogue/movie-database-explorer";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, ButtonLink, ContentRowSkeleton, EmptyState } from "@/components/ui";
import { listDevShowcaseSummaries } from "@/lib/catalogue/dev-showcase";
import { resolveViewerTerritory } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "Original Series & Shows · CINEVA",
  description:
    "Stream CINEVA multi-season original series, dark vigilante crime sagas, cosmic vanguard shows, and 4K archival docuseries with episode-by-episode playback.",
};

function firstParam(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

async function SeriesDirectoryResults({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const rawLang = firstParam(resolved.lang);
  const activeLang = rawLang === "bn" || rawLang === "en" ? rawLang : undefined;
  const rawSort = firstParam(resolved.sort);
  const parsedSort = CatalogueSortSchema.safeParse(rawSort);

  const territoryCode = await resolveViewerTerritory();
  const db = await getDatabase();
  const dbItems = await listPublishedTitles(db, {
    territoryCode,
    kind: "SERIES",
    limit: 50,
  });
  const showcaseItems = listDevShowcaseSummaries({ kind: "SERIES" });

  const seen = new Set<string>();
  const items: PublicTitleSummary[] = [];
  for (const item of [...dbItems, ...showcaseItems]) {
    if (!seen.has(item.slug)) {
      seen.add(item.slug);
      items.push(item);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        eyebrow="0 published series"
        title="No rights-cleared series are published yet"
        description="Episodic shows appear here once season rights and attribution ledgers are approved."
        actions={
          <ButtonLink href="/movies" variant="secondary">
            Explore Feature Films
          </ButtonLink>
        }
      />
    );
  }

  return (
    <MovieDatabaseExplorer
      items={items}
      territoryCode={territoryCode}
      basePath="/series"
      lockedKind="SERIES"
      activeLang={activeLang}
      initialGenre={firstParam(resolved.genre)}
      initialDirector={firstParam(resolved.director)}
      initialCast={firstParam(resolved.cast)}
      initialCategory={firstParam(resolved.category)}
      initialStudio={firstParam(resolved.studio)}
      initialSort={parsedSort.success ? parsedSort.data : "top_rated"}
      initialQuery={firstParam(resolved.q)}
    />
  );
}

export default function SeriesPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ConsumerShell>
      <header className="mb-8 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">CINEVA Episodic Originals</Badge>
          <Badge tone="neutral">Multi-Season Guides · Direct Episode Stream</Badge>
        </div>
        <h1 className="font-display text-text text-3xl font-bold sm:text-5xl">Series</h1>
        <p className="cg-prose text-text-secondary text-base leading-7">
          Multi-season crime sagas, heroic multiverse spin-offs, cold-case river mysteries, and 4K
          delta docuseries—filterable by showrunner, cast, studio banner, and genre.
        </p>
      </header>

      <Suspense fallback={<ContentRowSkeleton count={4} />}>
        <SeriesDirectoryResults searchParams={props.searchParams} />
      </Suspense>
    </ConsumerShell>
  );
}
