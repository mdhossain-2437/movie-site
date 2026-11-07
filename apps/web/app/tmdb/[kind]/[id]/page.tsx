import { hasPermission } from "@movie/domain";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { TmdbArtwork } from "@/components/catalogue/tmdb-artwork";
import {
  TmdbOperatorImportControl,
  TmdbSeriesSeasonGuide,
} from "@/components/catalogue/tmdb-detail-interactive";
import { TmdbTitleCard } from "@/components/catalogue/tmdb-title-card";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, ButtonLink, ContentRowSkeleton } from "@/components/ui";
import {
  fetchTmdbWorkDetail,
  getTmdbRuntimeStatus,
  TmdbAdapterError,
} from "@/lib/metadata/tmdb-client";
import {
  buildDeterministicArtSpecForTmdbId,
  TMDB_OFFICIAL_ATTRIBUTION,
  type TmdbMediaKind,
} from "@/lib/metadata/tmdb-types";
import { getCurrentSession } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "TMDB Title Dossier · CINEVA",
  description:
    "Full film and TV series metadata dossier, cast & director credits, studio provenance, episodic guide, and similarity recommendations via TMDB.",
};

async function TmdbWorkDetailSection({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  await connection();
  const raw = await params;
  if (raw.kind !== "movie" && raw.kind !== "tv") {
    notFound();
  }
  const mediaKind: TmdbMediaKind = raw.kind;
  const numericId = Number.parseInt(raw.id, 10);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    notFound();
  }

  const status = getTmdbRuntimeStatus();
  if (!status.configured) {
    notFound();
  }

  let detail;
  try {
    detail = await fetchTmdbWorkDetail(mediaKind, numericId);
  } catch (err) {
    if (err instanceof TmdbAdapterError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const { session } = await getCurrentSession();
  const canImport = hasPermission(session?.actor, "catalogue:create");

  return (
    <div className="space-y-12">
      {/* Full-Bleed Cinema Hero Banner */}
      <section className="border-border bg-surface-1 relative overflow-hidden rounded-2xl border">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <TmdbArtwork
            src={detail.backdropUrl ?? detail.posterUrl}
            alt={`${detail.title} backdrop`}
            fallbackArt={detail.fallbackArt}
            variant="backdrop"
            className="h-full w-full object-cover opacity-35"
          />
          <div className="art-grain" />
          <div className="from-canvas/65 via-canvas/80 to-canvas absolute inset-0 bg-gradient-to-t" />
          <div className="from-canvas/90 via-canvas/55 absolute inset-0 bg-gradient-to-r to-transparent" />
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-8 p-6 sm:p-10 lg:grid-cols-[260px_1fr]">
          <div className="border-border-strong bg-surface-2 relative mx-auto aspect-[2/3] w-56 overflow-hidden rounded-xl border shadow-2xl lg:mx-0 lg:w-full">
            <TmdbArtwork
              src={detail.posterUrl}
              alt={`${detail.title} poster`}
              fallbackArt={detail.fallbackArt}
              variant="poster"
              className="h-full w-full object-cover"
            />
            <div className="art-grain pointer-events-none" />
          </div>

          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <nav aria-label="Breadcrumb" className="text-text-muted font-mono text-xs">
                <Link href="/" className="hover:text-text">
                  Home
                </Link>
                <span className="mx-2">&gt;</span>
                <Link href="/tmdb" className="hover:text-text">
                  TMDB Global Index
                </Link>
                <span className="mx-2">&gt;</span>
                <span className="text-text">{detail.title}</span>
              </nav>

              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="accent">
                  {detail.kind === "SERIES" ? "TV Series" : "Feature Film"}
                </Badge>
                <Badge tone="neutral">
                  Bayesian WR {detail.bayesianScore.toFixed(2)} · ★ {detail.voteAverage.toFixed(1)}{" "}
                  ({detail.voteCount.toLocaleString()} votes)
                </Badge>
                <Badge tone="warning">Metadata Index · Streaming Requires Rights Clearance</Badge>
              </div>

              <h1 className="font-display text-text text-3xl leading-tight font-bold sm:text-5xl">
                {detail.title}
              </h1>

              {detail.tagline ? (
                <p className="text-accent font-display text-lg italic">
                  &ldquo;{detail.tagline}&rdquo;
                </p>
              ) : null}

              <p className="cg-prose text-text-secondary text-base leading-7">{detail.synopsis}</p>

              {/* Technical & Studio Metadata Pills */}
              <dl className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
                <div className="border-border bg-canvas/70 rounded-lg border p-3">
                  <dt className="text-text-muted font-mono text-[10px] uppercase">Release</dt>
                  <dd className="text-text mt-1 font-mono text-xs font-semibold">
                    {detail.releaseDate ?? "TBA"} ({detail.statusLabel})
                  </dd>
                </div>

                <div className="border-border bg-canvas/70 rounded-lg border p-3">
                  <dt className="text-text-muted font-mono text-[10px] uppercase">
                    {detail.kind === "SERIES" ? "Format & Scale" : "Runtime"}
                  </dt>
                  <dd className="text-text mt-1 font-mono text-xs font-semibold">
                    {detail.kind === "SERIES"
                      ? `${detail.seasonCount ?? 1} Seasons · ${detail.episodeCount ?? 0} Episodes`
                      : detail.runtimeMinutes
                        ? `${detail.runtimeMinutes} min`
                        : "Feature"}
                  </dd>
                </div>

                <div className="border-border bg-canvas/70 rounded-lg border p-3">
                  <dt className="text-text-muted font-mono text-[10px] uppercase">Studios</dt>
                  <dd className="text-text mt-1 line-clamp-1 font-mono text-xs font-semibold">
                    {detail.studios.length > 0
                      ? detail.studios.map((s) => s.name).join(", ")
                      : "Independent"}
                  </dd>
                </div>

                <div className="border-border bg-canvas/70 rounded-lg border p-3">
                  <dt className="text-text-muted font-mono text-[10px] uppercase">
                    Origin &amp; Lang
                  </dt>
                  <dd className="text-text mt-1 line-clamp-1 font-mono text-xs font-semibold">
                    {detail.originalLanguage.toUpperCase()}
                    {detail.countries.length > 0 ? ` · ${detail.countries[0]}` : ""}
                  </dd>
                </div>
              </dl>

              {detail.genreLabels.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {detail.genreLabels.map((g) => (
                    <Link
                      key={g}
                      href={`/tmdb?mode=discover&genre=${encodeURIComponent(g.toLowerCase())}`}
                      className="border-border-strong bg-surface-2 text-text-secondary hover:border-accent hover:text-text rounded-pill inline-flex min-h-11 items-center border px-3.5 py-1 font-mono text-xs transition-colors motion-reduce:transition-none md:min-h-8"
                    >
                      {g}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t pt-5">
              <div className="flex flex-wrap items-center gap-3">
                <ButtonLink href="/movies" variant="primary" size="md">
                  Browse Streamable CINEVA Vault →
                </ButtonLink>
                <ButtonLink href="/tmdb" variant="secondary" size="md">
                  ← Back to TMDB Explorer
                </ButtonLink>
              </div>
              <span className="text-text-muted font-mono text-xs">
                TMDB #{detail.tmdbId} ({mediaKind.toUpperCase()})
              </span>
            </div>
          </div>
        </div>
      </section>

      <TmdbOperatorImportControl
        mediaKind={mediaKind}
        tmdbId={detail.tmdbId}
        canImport={canImport}
      />

      {/* Interactive Seasons & Episodes Guide for TV Series */}
      {detail.kind === "SERIES" && detail.seasons.length > 0 ? (
        <TmdbSeriesSeasonGuide
          tvId={detail.tmdbId}
          seriesTitle={detail.title}
          seasons={detail.seasons}
          initialEpisodes={detail.initialSeasonEpisodes}
        />
      ) : null}

      {/* Directors / Creators & Principal Cast */}
      {detail.directors.length > 0 || detail.cast.length > 0 ? (
        <section aria-labelledby="tmdb-credits-heading" className="space-y-5">
          <div>
            <p className="text-accent font-mono text-xs tracking-widest uppercase">
              Verified Filmography Graph
            </p>
            <h2 id="tmdb-credits-heading" className="font-display text-text text-2xl font-bold">
              Directors, Creators &amp; Principal Cast
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...detail.directors, ...detail.cast].map((person) => (
              <Link
                key={`${person.department}-${person.personId}`}
                href={`/tmdb/person/${person.personId}`}
                className="group border-border bg-surface-1 hover:border-accent flex min-h-11 items-center gap-3.5 rounded-xl border p-3.5 transition-colors motion-reduce:transition-none"
              >
                <div className="border-border-strong bg-surface-2 relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border">
                  <TmdbArtwork
                    src={person.profileUrl}
                    alt={person.name}
                    fallbackArt={buildDeterministicArtSpecForTmdbId(person.personId)}
                    variant="poster"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-accent font-mono text-[10px] font-semibold tracking-wider uppercase">
                    {person.department}
                  </p>
                  <p className="text-text group-hover:text-accent truncate text-sm font-bold transition-colors motion-reduce:transition-none">
                    {person.name}
                  </p>
                  <p className="text-text-secondary truncate text-xs">{person.roleLabel}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Similar & Recommended Titles */}
      {detail.recommendations.length > 0 ? (
        <section aria-labelledby="tmdb-recs-heading" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-accent font-mono text-xs tracking-widest uppercase">
                TMDB + Bayesian Similarity Graph
              </p>
              <h2 id="tmdb-recs-heading" className="font-display text-text text-2xl font-bold">
                Recommended &amp; Similar Titles
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {detail.recommendations.map((rec) => (
              <TmdbTitleCard
                key={`${rec.mediaKind}-${rec.tmdbId}`}
                item={rec}
                matchPercentage={rec.matchPercentage}
                matchReason={rec.reason}
              />
            ))}
          </div>
        </section>
      ) : null}

      <footer className="border-border bg-surface-1 rounded-lg border px-4 py-3">
        <p className="text-text-muted font-mono text-xs">{TMDB_OFFICIAL_ATTRIBUTION}</p>
      </footer>
    </div>
  );
}

export default function TmdbWorkDetailPage(props: {
  params: Promise<{ kind: string; id: string }>;
}) {
  return (
    <ConsumerShell>
      <Suspense fallback={<ContentRowSkeleton count={4} />}>
        <TmdbWorkDetailSection params={props.params} />
      </Suspense>
    </ConsumerShell>
  );
}
