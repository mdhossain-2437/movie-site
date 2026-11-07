import { getDatabase, getPublishedTitleBySlug } from "@movie/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { KeyArt } from "@/components/art/key-art";
import { VideoPlayerShell } from "@/components/player/video-player-shell";
import { AvailabilityBadge, Badge, ButtonLink, EmptyState, Skeleton } from "@/components/ui";
import { CINEVA_DATABASE_FILMS, getCinevaFilmBySlug } from "@/lib/catalogue/cineva-database";
import { getDevShowcaseTitleBySlug } from "@/lib/catalogue/dev-showcase";
import { authorizePlayback } from "@/lib/catalogue/repository";
import { resolveViewerTerritory } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "Watch · CINEVA",
  robots: { index: false, follow: false },
};

async function WatchPageBody({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const resolvedSearch = await searchParams;
  const rawT = Array.isArray(resolvedSearch.t) ? resolvedSearch.t[0] : resolvedSearch.t;
  const initialStartSeconds =
    rawT && Number.isFinite(Number(rawT)) && Number(rawT) >= 0 ? Math.floor(Number(rawT)) : 0;

  const territoryCode = await resolveViewerTerritory();
  const db = await getDatabase();
  const title =
    (await getPublishedTitleBySlug(db, slug, { territoryCode })) ?? getDevShowcaseTitleBySlug(slug);
  const filmMeta = getCinevaFilmBySlug(slug);
  const upNextFilms = CINEVA_DATABASE_FILMS.filter(
    (f) => f.slug !== slug && f.availability.streamAllowed,
  ).slice(0, 4);

  if (title) {
    return (
      <div className="space-y-10">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <AvailabilityBadge kind={title.availability.badgeKind} />
                <Badge tone="neutral">Territory: {territoryCode}</Badge>
                <Badge tone="neutral">{title.maturityRating}</Badge>
                {filmMeta ? (
                  <Badge tone="accent">{filmMeta.cinevaScore}% CINEVA Index</Badge>
                ) : null}
              </div>
              <h1 className="font-display text-text pt-1 text-2xl font-bold sm:text-3xl">
                {title.localizedTitleEn}
              </h1>
              {title.localizedTitleBn ? (
                <p className="text-text-secondary text-sm" lang="bn">
                  {title.localizedTitleBn}
                </p>
              ) : null}
            </div>

            <ButtonLink href={`/movies/${title.slug}`} variant="outline" size="sm">
              ← Back to Film Details
            </ButtonLink>
          </div>

          {title.availability.streamAllowed ? (
            <VideoPlayerShell
              titleSlug={title.slug}
              localizedTitle={title.localizedTitleEn}
              runtimeMinutes={title.runtimeMinutes}
              initialStartSeconds={initialStartSeconds}
            />
          ) : (
            <EmptyState
              eyebrow="Stream Not Authorized"
              title="Streaming is not currently permitted for this title in your territory"
              description="Our central RightsDecisionService denied stream delivery for your region or active licence window. Catalogue metadata remains viewable where licensed."
              actions={
                <>
                  <ButtonLink href={`/movies/${title.slug}`} variant="secondary">
                    View Film Details
                  </ButtonLink>
                  <ButtonLink href="/movies" variant="outline">
                    Browse Catalogue
                  </ButtonLink>
                </>
              }
            />
          )}
        </div>

        {/* Up Next on CINEVA */}
        {upNextFilms.length > 0 ? (
          <section aria-labelledby="up-next-heading" className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 id="up-next-heading" className="font-display text-text text-xl font-bold">
                Up Next in Theater Mode
              </h2>
              <Link href="/movies" className="text-accent hover:text-text text-xs font-semibold">
                Full Movie Database →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {upNextFilms.map((film) => (
                <Link
                  key={film.slug}
                  href={`/watch/${film.slug}`}
                  className="group border-border bg-surface-1 hover:border-accent/70 flex flex-col overflow-hidden rounded-lg border transition-colors motion-reduce:transition-none"
                >
                  <div className="relative aspect-video w-full overflow-hidden">
                    <KeyArt
                      spec={film.art}
                      variant="backdrop"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
                    />
                    <div className="art-grain" />
                    <span className="bg-canvas/85 text-text border-border absolute top-2 right-2 rounded-xs border px-2 py-0.5 font-mono text-[10px]">
                      {film.runtimeMinutes}m
                    </span>
                  </div>
                  <div className="space-y-1 p-3.5">
                    <p className="text-accent font-mono text-[10px] uppercase">
                      {film.releaseYear} · {film.cinevaScore}% Match
                    </p>
                    <h3 className="font-display text-text group-hover:text-accent text-sm font-semibold">
                      {film.localizedTitleEn}
                    </h3>
                    <p className="text-text-muted line-clamp-1 text-xs">{film.tagline}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  const archiveAuth = authorizePlayback(slug, new Date());
  if (!archiveAuth) {
    notFound();
  }

  const decisionCode = archiveAuth.stream.allowed ? "GRANT_ALLOWED" : archiveAuth.stream.code;
  const decisionReason = archiveAuth.stream.allowed
    ? "Authorized"
    : archiveAuth.stream.publicReason;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <AvailabilityBadge kind="rights_pending" />
            <Badge tone="neutral">Territory: {archiveAuth.territory}</Badge>
            <Badge tone="info">Archive Reference</Badge>
          </div>
          <h1 className="font-display text-text pt-1 text-2xl font-bold sm:text-3xl">
            {archiveAuth.card.title}
          </h1>
          <p className="text-text-secondary text-sm" lang="bn">
            {archiveAuth.card.titleBn}
          </p>
        </div>

        <ButtonLink href={`/movies/${archiveAuth.card.slug}`} variant="outline" size="sm">
          ← Back to Film Details
        </ButtonLink>
      </div>

      <EmptyState
        eyebrow={`Rights Decision: ${decisionCode}`}
        title="Playback locked pending rights & media verification"
        description={`Central RightsDecisionService denied stream delivery (${decisionReason}). Historical metadata remains viewable while distribution rights and playable media assets await verification.`}
        actions={
          <>
            <ButtonLink href={`/movies/${archiveAuth.card.slug}`} variant="secondary">
              View Reference Details
            </ButtonLink>
            <ButtonLink href="/movies" variant="outline">
              Browse Catalogue
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}

export default function WatchPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="bg-canvas text-text flex min-h-dvh flex-col">
      <a
        href="#main"
        className="cg-skip-link focus:bg-text focus:text-canvas sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-sm focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Skip to video player
      </a>
      <header className="border-border/60 bg-canvas border-b">
        <div className="cg-container flex h-14 items-center justify-between gap-3">
          <Link
            href="/"
            className="font-display text-text inline-flex min-h-11 min-w-11 items-center gap-2 rounded-sm px-1 text-base font-bold tracking-tight"
          >
            <span className="bg-accent text-on-accent rounded-xs px-2 py-0.5 text-xs font-black tracking-tight">
              CINEVA
            </span>
          </Link>
          <Badge tone="accent">Theater Mode · HD</Badge>
        </div>
      </header>

      <main id="main" className="cg-container flex-1 py-6 sm:py-8">
        <Suspense fallback={<Skeleton className="aspect-video w-full" />}>
          <WatchPageBody params={props.params} searchParams={props.searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
