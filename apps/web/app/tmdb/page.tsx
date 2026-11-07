import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { TmdbLiveExplorer } from "@/components/catalogue/tmdb-live-explorer";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, ButtonLink, ContentRowSkeleton, EmptyState } from "@/components/ui";
import { discoverTmdbWorks, getTmdbRuntimeStatus } from "@/lib/metadata/tmdb-client";

export const metadata: Metadata = {
  title: "Live TMDB Global Movies, Series & Studios · CINEVA",
  description:
    "Explore live global movies, TV series, Marvel Studios, DC Studios, Sony Pictures, 20th Century Studios, directors, and cast powered by the TMDB v3 API.",
};

function pickSingleParam(val: string | string[] | undefined): string {
  const raw = Array.isArray(val) ? val[0] : val;
  return raw ? raw.trim() : "";
}

async function TmdbExplorerServerSection({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const status = getTmdbRuntimeStatus();

  if (!status.configured) {
    return (
      <EmptyState
        eyebrow="TMDB Adapter Offline"
        title="TMDB API credentials are not active in this environment"
        description="Configure TMDB_READ_ACCESS_TOKEN or TMDB_API_KEY in .env.local (and TMDB_COMMERCIAL_LICENSE_CONFIRMED=true in production) to enable live global metadata discovery."
        actions={
          <ButtonLink href="/movies" variant="primary">
            Browse CINEVA Streaming Vault
          </ButtonLink>
        }
      />
    );
  }

  const resolved = await searchParams;
  const rawMode = pickSingleParam(resolved.mode);
  const initialMode: "trending" | "top_rated" | "discover" | "search" =
    rawMode === "top_rated" || rawMode === "discover" || rawMode === "search"
      ? rawMode
      : "trending";

  const rawKind = pickSingleParam(resolved.kind).toUpperCase();
  const initialKind: "ALL" | "MOVIE" | "SERIES" =
    rawKind === "MOVIE" || rawKind === "SERIES" ? rawKind : "ALL";

  const initialStudio = pickSingleParam(resolved.studio) || "all";
  const initialGenre = pickSingleParam(resolved.genre) || "all";
  const initialLanguage = pickSingleParam(resolved.lang) || "all";
  const initialQuery = pickSingleParam(resolved.q);

  const discovered = await discoverTmdbWorks({
    mode: initialQuery
      ? "search"
      : initialStudio !== "all" || initialGenre !== "all"
        ? "discover"
        : initialMode,
    kind: initialKind,
    studio: initialStudio,
    genre: initialGenre,
    language: initialLanguage,
    sort: initialMode === "top_rated" ? "vote_average.desc" : "popularity.desc",
    query: initialQuery,
    page: 1,
    limit: 20,
  });

  return (
    <TmdbLiveExplorer
      initialItems={discovered.items}
      initialTotalResults={discovered.totalResults}
      initialTotalPages={discovered.totalPages}
      initialMode={initialMode}
      initialKind={initialKind}
      initialStudio={initialStudio}
      initialGenre={initialGenre}
      initialLanguage={initialLanguage}
      initialQuery={initialQuery}
    />
  );
}

export default function TmdbDiscoveryPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ConsumerShell>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">Live TMDB v3 Metadata Engine</Badge>
            <Badge tone="neutral">Global Movies · TV Series · Major Studios</Badge>
          </div>
          <h1 className="font-display text-text text-3xl font-bold sm:text-5xl">
            TMDB Global Index
          </h1>
          <p className="cg-prose text-text-secondary text-base leading-7">
            Search and filter live global movies, multi-season TV series, Marvel Studios, DC
            Studios, Sony &amp; Columbia, 20th Century Studios, directors, and principal cast—paired
            with CINEVA’s strict distribution rights gate.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <ButtonLink href="/movies" variant="secondary" size="sm">
            CINEVA Streamable Vault (20)
          </ButtonLink>
          <ButtonLink href="/series" variant="outline" size="sm">
            Original Series (6)
          </ButtonLink>
        </div>
      </header>

      <Suspense fallback={<ContentRowSkeleton count={8} />}>
        <TmdbExplorerServerSection searchParams={props.searchParams} />
      </Suspense>
    </ConsumerShell>
  );
}
