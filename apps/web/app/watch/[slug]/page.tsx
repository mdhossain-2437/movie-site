import { getDatabase, getPublishedTitleBySlug } from "@movie/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { KeyArt } from "@/components/art/key-art";
import { VideoPlayerShell } from "@/components/player/video-player-shell";
import { AvailabilityBadge, Badge, ButtonLink, EmptyState, Skeleton } from "@/components/ui";
import {
  type CinevaDatabaseFilm,
  type CinevaEpisode,
  getCinevaEpisode,
  getCinevaFilmBySlug,
  getCinevaSimilarTitles,
} from "@/lib/catalogue/cineva-database";
import { getDevShowcaseTitleBySlug } from "@/lib/catalogue/dev-showcase";
import { authorizePlayback } from "@/lib/catalogue/repository";
import { resolveViewerTerritory } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "Watch · CINEVA",
  robots: { index: false, follow: false },
};

function findNextEpisode(
  film: CinevaDatabaseFilm | null,
  current: CinevaEpisode | null,
): CinevaEpisode | null {
  if (!film?.seasons || !current) return null;
  const flat = film.seasons.flatMap((s) => s.episodes);
  const idx = flat.findIndex(
    (ep) => ep.seasonNumber === current.seasonNumber && ep.episodeNumber === current.episodeNumber,
  );
  if (idx === -1 || idx + 1 >= flat.length) return null;
  return flat[idx + 1] ?? null;
}

async function WatchPageBody({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const resolvedSearch = await searchParams;
  const firstParam = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const rawT = firstParam(resolvedSearch.t);
  const rawS = firstParam(resolvedSearch.s);
  const rawE = firstParam(resolvedSearch.e);

  const initialStartSeconds =
    rawT && Number.isFinite(Number(rawT)) && Number(rawT) >= 0 ? Math.floor(Number(rawT)) : 0;
  const requestedSeason =
    rawS && Number.isFinite(Number(rawS)) && Number(rawS) >= 1 ? Math.floor(Number(rawS)) : null;
  const requestedEpisode =
    rawE && Number.isFinite(Number(rawE)) && Number(rawE) >= 1 ? Math.floor(Number(rawE)) : null;

  const territoryCode = await resolveViewerTerritory();
  const db = await getDatabase();
  const title =
    (await getPublishedTitleBySlug(db, slug, { territoryCode })) ?? getDevShowcaseTitleBySlug(slug);
  const filmMeta = getCinevaFilmBySlug(slug);
  const isSeries = filmMeta?.kind === "SERIES";
  const activeEpisode = isSeries
    ? getCinevaEpisode(filmMeta, requestedSeason, requestedEpisode)
    : null;
  const nextEpisode = findNextEpisode(filmMeta, activeEpisode);

  const upNextRecommendations = getCinevaSimilarTitles(slug, 6)
    .filter((entry) => entry.film.availability.streamAllowed)
    .slice(0, 4);

  if (title) {
    const effectiveRuntime = activeEpisode?.runtimeMinutes ?? title.runtimeMinutes;
    const playerHeading = activeEpisode
      ? `${title.localizedTitleEn} · S${activeEpisode.seasonNumber}:E${activeEpisode.episodeNumber} — ${activeEpisode.titleEn}`
      : title.localizedTitleEn;

    return (
      <div className="space-y-10">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <AvailabilityBadge kind={title.availability.badgeKind} />
                <Badge tone="neutral">Territory: {territoryCode}</Badge>
                <Badge tone="neutral">{title.maturityRating}</Badge>
                {activeEpisode ? (
                  <Badge tone="accent">
                    Season {activeEpisode.seasonNumber} · Episode {activeEpisode.episodeNumber}
                  </Badge>
                ) : filmMeta ? (
                  <Badge tone="accent">{filmMeta.cinevaScore}% CINEVA Index</Badge>
                ) : null}
              </div>
              <h1 className="font-display text-text pt-1 text-2xl font-bold sm:text-3xl">
                {playerHeading}
              </h1>
              {activeEpisode ? (
                <p className="text-text-secondary max-w-2xl text-xs sm:text-sm">
                  {activeEpisode.synopsisEn}
                </p>
              ) : title.localizedTitleBn ? (
                <p className="text-text-secondary text-sm" lang="bn">
                  {title.localizedTitleBn}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {nextEpisode ? (
                <ButtonLink
                  href={`/watch/${title.slug}?s=${nextEpisode.seasonNumber}&e=${nextEpisode.episodeNumber}`}
                  variant="primary"
                  size="sm"
                >
                  Next: S{nextEpisode.seasonNumber}:E{nextEpisode.episodeNumber} →
                </ButtonLink>
              ) : null}
              <ButtonLink href={`/movies/${title.slug}`} variant="outline" size="sm">
                ← Back to Details
              </ButtonLink>
            </div>
          </div>

          {title.availability.streamAllowed ? (
            <VideoPlayerShell
              key={`${title.slug}-s${activeEpisode?.seasonNumber ?? 0}-e${activeEpisode?.episodeNumber ?? 0}`}
              titleSlug={title.slug}
              localizedTitle={playerHeading}
              runtimeMinutes={effectiveRuntime}
              initialStartSeconds={initialStartSeconds}
              seasonNumber={activeEpisode?.seasonNumber}
              episodeNumber={activeEpisode?.episodeNumber}
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

        {/* Series Episode Switcher Strip */}
        {isSeries && filmMeta?.seasons ? (
          <section aria-labelledby="watch-episodes-heading" className="space-y-4">
            <h2 id="watch-episodes-heading" className="font-display text-text text-xl font-bold">
              Episodes — {title.localizedTitleEn}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {filmMeta.seasons
                .flatMap((s) => s.episodes)
                .map((ep) => {
                  const isCurrent =
                    activeEpisode?.seasonNumber === ep.seasonNumber &&
                    activeEpisode?.episodeNumber === ep.episodeNumber;
                  return (
                    <Link
                      key={`watch-ep-${ep.seasonNumber}-${ep.episodeNumber}`}
                      href={`/watch/${title.slug}?s=${ep.seasonNumber}&e=${ep.episodeNumber}`}
                      aria-current={isCurrent ? "page" : undefined}
                      className={`rounded-lg border p-4 transition-colors motion-reduce:transition-none ${
                        isCurrent
                          ? "border-accent bg-accent/10"
                          : "border-border bg-surface-1 hover:border-border-strong"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-accent font-mono text-xs font-bold">
                          S{ep.seasonNumber}:E{ep.episodeNumber}
                        </span>
                        <span className="text-text-muted font-mono text-[11px]">
                          {ep.runtimeMinutes}m
                        </span>
                      </div>
                      <p className="font-display text-text mt-1 text-sm font-bold">{ep.titleEn}</p>
                      <p className="text-text-secondary mt-1 line-clamp-2 text-xs">
                        {ep.synopsisEn}
                      </p>
                    </Link>
                  );
                })}
            </div>
          </section>
        ) : null}

        {/* Up Next — Recommendation Engine Picks */}
        {upNextRecommendations.length > 0 ? (
          <section aria-labelledby="up-next-heading" className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-accent font-mono text-[11px] tracking-wider uppercase">
                  Similarity Graph Recommendations
                </p>
                <h2 id="up-next-heading" className="font-display text-text text-xl font-bold">
                  Up Next in Theater Mode
                </h2>
              </div>
              <Link href="/movies" className="text-accent hover:text-text text-xs font-semibold">
                Full Catalogue Explorer →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {upNextRecommendations.map(({ film, match }) => (
                <Link
                  key={film.slug}
                  href={
                    film.kind === "SERIES" ? `/watch/${film.slug}?s=1&e=1` : `/watch/${film.slug}`
                  }
                  className="group border-border bg-surface-1 hover:border-accent/70 flex flex-col overflow-hidden rounded-lg border transition-colors motion-reduce:transition-none"
                >
                  <div className="relative aspect-video w-full overflow-hidden">
                    <KeyArt
                      spec={film.art}
                      variant="backdrop"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
                    />
                    <div className="art-grain" />
                    <span className="border-success/50 bg-canvas/90 text-success absolute top-2 left-2 rounded-xs border px-2 py-0.5 font-mono text-[10px] font-bold">
                      {match.matchPercentage}% Match
                    </span>
                    <span className="bg-canvas/85 text-text border-border absolute top-2 right-2 rounded-xs border px-2 py-0.5 font-mono text-[10px]">
                      {film.kind === "SERIES"
                        ? `${film.seasons?.length ?? 1}S`
                        : `${film.runtimeMinutes}m`}
                    </span>
                  </div>
                  <div className="space-y-1 p-3.5">
                    <p className="text-accent font-mono text-[10px] uppercase">
                      {match.reasons[0] ?? `${film.releaseYear} · ${film.studio}`}
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
