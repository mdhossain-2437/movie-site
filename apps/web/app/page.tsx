import type { Metadata } from "next";
import Link from "next/link";
import { KeyArt } from "@/components/art/key-art";
import { ContinueWatchingRail } from "@/components/catalogue/continue-watching-rail";
import { TitleRail } from "@/components/catalogue/editorial";
import { FilmStripShowcase, type FilmStripItem } from "@/components/catalogue/film-strip-showcase";
import { PersonalizedRecommendationsRail } from "@/components/catalogue/personalized-recommendations-rail";
import { TmdbHomeTrendingRail } from "@/components/catalogue/tmdb-home-trending-rail";
import { ConsumerShell } from "@/components/layout/site-shell";
import { AvailabilityBadge, Badge, ButtonLink } from "@/components/ui";
import {
  CINEVA_COLLECTIONS,
  CINEVA_DATABASE_FILMS,
  CINEVA_GENRES,
  CINEVA_SPECIAL_CATEGORIES,
  CINEVA_STUDIOS,
  getCinevaTopRatedLeaderboard,
  queryCinevaCatalogue,
} from "@/lib/catalogue/cineva-database";
import { listTitles } from "@/lib/catalogue/repository";

export const metadata: Metadata = {
  title: "CINEVA · Cinema, Series, Studios & Recommendation Engine",
  description:
    "Stream acclaimed world cinema & original series in 2.39:1 anamorphic HD, explore studio universes, and discover tailored picks from CINEVA's similarity engine.",
};

const FEATURED_CINEMA_SELECTION: FilmStripItem[] = [
  "the-last-monsoon",
  "the-obsidian-watchman",
  "iron-eclipse",
  "syndicate-of-ash",
  "voyage-beyond-stars",
  "starfall-vanguard",
  "neon-bhasha",
]
  .map((slug) => CINEVA_DATABASE_FILMS.find((f) => f.slug === slug))
  .filter((f): f is (typeof CINEVA_DATABASE_FILMS)[number] => Boolean(f))
  .map((f) => ({
    id: f.id,
    slug: f.slug,
    titleEn: f.localizedTitleEn,
    releaseYear: f.releaseYear,
    runtimeMinutes: f.runtimeMinutes,
    maturityRating: f.maturityRating,
    synopsisEn: f.synopsisEn,
    badgeKind: f.availability.badgeKind,
  }));

export default function Home() {
  const archiveReferences = listTitles().slice(0, 10);
  const topRatedLeaderboard = getCinevaTopRatedLeaderboard(10);
  const originalSeries = queryCinevaCatalogue({ kind: "SERIES", sort: "top_rated" }).slice(0, 4);
  const anamorphicPremieres = queryCinevaCatalogue({
    kind: "MOVIE",
    category: "large-format-premieres",
    sort: "top_rated",
  }).slice(0, 4);

  return (
    <ConsumerShell fullBleed>
      {/* Signature 7-Strip Monochrome-to-Crimson Cinema Showcase Stage */}
      <FilmStripShowcase
        breadcrumbTitle="Featured Cinema"
        breadcrumbCategory="Films"
        watermarkText="Cineva"
        renderBreadcrumbAsH1
        items={FEATURED_CINEMA_SELECTION}
      />

      {/* Below-the-Fold Streaming Swimlanes, Recommendation Engine & Studio Hubs */}
      <div className="cg-container max-w-full space-y-20 overflow-x-clip py-14 sm:py-20">
        {/* 0. Authenticated Continue Watching Resume Rail */}
        <ContinueWatchingRail />

        {/* 1. Netflix-Class Personalized Similarity Graph Recommendation Engine */}
        <PersonalizedRecommendationsRail />

        {/* 1B. Live TMDB v3 Global Box Office, Franchises & TV Series Index */}
        <TmdbHomeTrendingRail />

        {/* 2. Top Rated Hall of Fame (Bayesian Weighted Rating WR) */}
        <section aria-labelledby="top-ten-heading" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-accent font-mono text-xs font-semibold tracking-widest uppercase">
                Bayesian Weighted Leaderboard · Movies &amp; Series
              </p>
              <h2
                id="top-ten-heading"
                className="font-display text-text text-2xl font-bold tracking-tight sm:text-4xl"
              >
                Top 10 Rated on CINEVA
              </h2>
            </div>
            <ButtonLink
              href="/movies?category=top-rated-hall&sort=top_rated"
              variant="outline"
              size="sm"
            >
              Open Top Rated Hall
            </ButtonLink>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {topRatedLeaderboard.map(({ film, ranking }) => {
              const isSeries = film.kind === "SERIES";
              return (
                <article
                  key={film.id}
                  className="group border-border bg-surface-1 hover:border-accent/60 relative flex flex-col justify-between overflow-hidden rounded-xl border transition-colors duration-200 motion-reduce:transition-none"
                >
                  <Link
                    href={`/movies/${film.slug}`}
                    className="block p-3 focus:outline-offset-[-2px]"
                  >
                    <div className="border-border relative aspect-[2/3] w-full overflow-hidden rounded-lg border">
                      <KeyArt
                        spec={film.art}
                        variant="poster"
                        className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none"
                      />
                      <div
                        aria-hidden="true"
                        className="art-grain pointer-events-none absolute inset-0 opacity-30"
                      />
                      <div
                        aria-hidden="true"
                        className="from-canvas/60 via-canvas/15 to-canvas pointer-events-none absolute inset-0 bg-gradient-to-b"
                      />

                      <div className="relative z-10 flex items-start justify-between p-2.5">
                        <span className="border-accent bg-accent text-on-accent inline-flex min-w-8 items-center justify-center rounded-xs border px-2 py-0.5 font-mono text-xs font-black">
                          #{ranking.topRank}
                        </span>
                        <span className="border-border-strong bg-canvas/90 text-text inline-flex items-center gap-1 rounded-xs border px-2 py-0.5 font-mono text-[11px] font-semibold">
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="text-accent h-3 w-3 shrink-0 fill-current"
                          >
                            <path d="M12 2.5l2.85 5.77 6.37.93-4.61 4.49 1.09 6.34L12 17.04l-5.7 2.99 1.09-6.34L2.78 9.2l6.37-.93L12 2.5z" />
                          </svg>
                          <span>{ranking.bayesianScore.toFixed(2)}</span>
                        </span>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 z-10 p-3">
                        <p className="text-text-secondary font-mono text-[10px] tracking-wider uppercase">
                          {film.releaseYear} ·{" "}
                          {isSeries
                            ? `Series (${film.seasons?.length ?? 1}S)`
                            : `${film.runtimeMinutes}m`}{" "}
                          · {film.votesCount}
                        </p>
                        <h3 className="font-display text-text group-hover:text-accent mt-0.5 line-clamp-1 text-base font-bold transition-colors motion-reduce:transition-none">
                          {film.localizedTitleEn}
                        </h3>
                      </div>
                    </div>
                  </Link>

                  <div className="border-border flex items-center justify-between gap-2 border-t px-3 py-2">
                    <span className="text-text-muted truncate font-mono text-[11px]">
                      {film.studio}
                    </span>
                    <Link
                      href={isSeries ? `/watch/${film.slug}?s=1&e=1` : `/watch/${film.slug}`}
                      aria-label={`Stream ${film.localizedTitleEn}`}
                      className="border-accent/50 bg-accent/15 text-text hover:bg-accent hover:text-on-accent rounded-pill inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 border px-3 py-1 font-mono text-[11px] font-semibold transition-colors motion-reduce:transition-none md:min-h-7 md:min-w-7"
                    >
                      <svg aria-hidden="true" className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span>{isSeries ? "S1:E1" : "Watch"}</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* 3. Acclaimed Original Series & Multi-Season Sagas */}
        <section aria-labelledby="original-series-heading" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-accent font-mono text-xs font-semibold tracking-widest uppercase">
                Episodic Originals · Complete Season &amp; Episode Guides
              </p>
              <h2
                id="original-series-heading"
                className="font-display text-text text-2xl font-bold tracking-tight sm:text-4xl"
              >
                Original Series &amp; Shows
              </h2>
            </div>
            <ButtonLink href="/series" variant="outline" size="sm">
              Explore All Series
            </ButtonLink>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {originalSeries.map((series) => {
              const totalEps = series.seasons?.reduce((acc, s) => acc + s.episodes.length, 0) ?? 0;
              return (
                <article
                  key={series.id}
                  className="group border-border bg-surface-1 hover:border-accent/60 flex flex-col justify-between overflow-hidden rounded-xl border transition-colors motion-reduce:transition-none"
                >
                  <Link href={`/movies/${series.slug}`} className="block">
                    <div className="border-border relative aspect-video w-full overflow-hidden border-b">
                      <KeyArt
                        spec={series.art}
                        variant="backdrop"
                        className="pointer-events-none h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
                      />
                      <div className="art-grain" />
                      <span className="border-accent/60 bg-canvas/90 text-accent absolute top-2.5 left-2.5 rounded-xs border px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                        {series.seasons?.length ?? 1} Seasons · {totalEps} Episodes
                      </span>
                    </div>
                    <div className="space-y-1.5 p-4">
                      <p className="text-text-muted font-mono text-[11px] uppercase">
                        {series.studio} · {series.releaseYear}
                      </p>
                      <h3 className="font-display text-text group-hover:text-accent text-lg font-bold">
                        {series.localizedTitleEn}
                      </h3>
                      <p className="text-text-secondary line-clamp-2 text-xs leading-relaxed">
                        {series.synopsisEn}
                      </p>
                    </div>
                  </Link>
                  <div className="border-border flex items-center justify-between gap-2 border-t px-4 py-2.5">
                    <span className="text-text-muted font-mono text-[11px]">
                      {series.runtimeMinutes}m / ep
                    </span>
                    <Link
                      href={`/watch/${series.slug}?s=1&e=1`}
                      aria-label={`Play Season 1 Episode 1 of ${series.localizedTitleEn}`}
                      className="border-accent/50 bg-accent/15 text-text hover:bg-accent hover:text-on-accent rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center gap-1 border px-3.5 py-1 font-mono text-xs font-semibold transition-colors motion-reduce:transition-none md:min-h-8"
                    >
                      Play S1:E1
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* 4. Special Universes & Major Studio Banners */}
        <section aria-labelledby="studios-universes-heading" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-accent font-mono text-xs font-semibold tracking-widest uppercase">
                Franchises, Mythologies &amp; Production Houses
              </p>
              <h2
                id="studios-universes-heading"
                className="font-display text-text text-2xl font-bold tracking-tight sm:text-4xl"
              >
                Universes &amp; Studio Hubs
              </h2>
            </div>
            <ButtonLink href="/studios" variant="outline" size="sm">
              All Studio Banners
            </ButtonLink>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {CINEVA_SPECIAL_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/movies?category=${cat.slug}`}
                className="border-accent/40 bg-surface-1 text-text hover:border-accent hover:bg-surface-2 rounded-pill inline-flex min-h-11 min-w-11 items-center gap-2 border px-4 py-2 font-mono text-xs font-semibold transition-colors motion-reduce:transition-none"
              >
                <span aria-hidden="true" className="text-accent">
                  ◆
                </span>
                <span>{cat.titleEn}</span>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CINEVA_STUDIOS.map((studio) => {
              const count = queryCinevaCatalogue({ studio: studio.slug }).length;
              return (
                <Link
                  key={studio.slug}
                  href={`/studios/${studio.slug}`}
                  className="group border-border bg-surface-1 hover:border-accent/60 flex flex-col justify-between rounded-xl border p-5 transition-colors motion-reduce:transition-none"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-accent font-mono text-[10px] tracking-wider uppercase">
                        Est. {studio.foundedYear} · {studio.headquarters}
                      </span>
                      <span className="border-border-strong bg-surface-2 text-text-secondary rounded-xs border px-2 py-0.5 font-mono text-[10px]">
                        {count} Works
                      </span>
                    </div>
                    <h3 className="font-display text-text group-hover:text-accent text-lg font-bold transition-colors motion-reduce:transition-none">
                      {studio.nameEn}
                    </h3>
                    <p className="text-text-muted text-xs leading-relaxed">{studio.bannerFocus}</p>
                  </div>
                  <p className="text-accent mt-4 font-mono text-xs font-semibold">
                    Enter Studio Hub →
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 5. Streaming Now in 2.39:1 Anamorphic HD */}
        <section aria-labelledby="streaming-now-heading" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-accent font-mono text-xs font-semibold tracking-widest uppercase">
                Instant Theater Playback · High-Definition Master
              </p>
              <h2
                id="streaming-now-heading"
                className="font-display text-text text-2xl font-bold tracking-tight sm:text-4xl"
              >
                Streaming Now in Widescreen HD
              </h2>
            </div>
            <Badge tone="accent">AV1 · 1080p · 5.1 / Atmos</Badge>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {anamorphicPremieres.map((film) => {
              const director =
                film.credits.find((c) => c.department === "DIRECTOR")?.nameEn ?? "CINEVA Originals";
              return (
                <article
                  key={film.id}
                  className="group border-border bg-surface-1 hover:border-accent/60 flex flex-col justify-between overflow-hidden rounded-xl border transition-colors duration-200 motion-reduce:transition-none"
                >
                  <div className="border-border relative aspect-video w-full overflow-hidden border-b">
                    <KeyArt
                      spec={film.art}
                      variant="backdrop"
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
                    />
                    <div
                      aria-hidden="true"
                      className="art-grain pointer-events-none absolute inset-0 opacity-30"
                    />
                    <div
                      aria-hidden="true"
                      className="from-canvas/30 via-canvas/35 to-canvas pointer-events-none absolute inset-0 bg-gradient-to-b"
                    />

                    <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <AvailabilityBadge kind={film.availability.badgeKind} />
                        <span className="border-border-strong bg-canvas/85 text-text-secondary rounded-xs border px-2.5 py-1 font-mono text-xs">
                          {film.aspectRatio} · {film.soundMix}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-accent font-mono text-xs font-semibold tracking-wider uppercase">
                          Dir. {director} · {film.studio} · {film.releaseYear} ·{" "}
                          {film.runtimeMinutes}m
                        </p>
                        <h3 className="font-display text-text text-2xl font-bold sm:text-3xl">
                          {film.localizedTitleEn}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
                    <p className="text-text-secondary line-clamp-2 max-w-md text-sm leading-relaxed">
                      {film.tagline}
                    </p>
                    <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                      <ButtonLink href={`/watch/${film.slug}`} variant="primary" size="md">
                        Watch Film
                      </ButtonLink>
                      <ButtonLink href={`/movies/${film.slug}`} variant="secondary" size="md">
                        Database Sheet
                      </ButtonLink>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* 6. Browse Movie Database by Genre & Curated Vaults */}
        <section aria-labelledby="database-taxonomy-heading" className="space-y-6">
          <div className="space-y-1.5">
            <p className="text-accent font-mono text-xs font-semibold tracking-widest uppercase">
              Structured Cinema Taxonomy
            </p>
            <h2
              id="database-taxonomy-heading"
              className="font-display text-text text-2xl font-bold tracking-tight sm:text-3xl"
            >
              Browse Database by Genre &amp; Collection
            </h2>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {CINEVA_GENRES.map((genre) => (
              <Link
                key={genre.slug}
                href={`/genres/${genre.slug}`}
                className="border-border bg-surface-1 text-text hover:border-accent hover:bg-surface-2 rounded-pill inline-flex min-h-11 min-w-11 items-center gap-2 border px-4 py-2 text-sm font-medium transition-colors motion-reduce:transition-none"
              >
                <span>{genre.nameEn}</span>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            {CINEVA_COLLECTIONS.map((col) => (
              <Link
                key={col.id}
                href={`/collections/${col.slug}`}
                className="group border-border bg-surface-1 hover:border-accent/60 flex flex-col justify-between rounded-xl border p-5 transition-colors duration-200 motion-reduce:transition-none"
              >
                <div className="space-y-2">
                  <p className="text-accent font-mono text-[11px] tracking-wider uppercase">
                    {col.eyebrow}
                  </p>
                  <h3 className="font-display text-text group-hover:text-accent text-lg font-bold transition-colors motion-reduce:transition-none">
                    {col.titleEn}
                  </h3>
                  <p className="text-text-muted line-clamp-2 text-xs leading-relaxed">
                    {col.description}
                  </p>
                </div>
                <p className="text-text-secondary mt-4 font-mono text-xs font-semibold">
                  {col.filmSlugs.length} Works →
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* 7. Historical Archive Rail */}
        {archiveReferences.length > 0 ? (
          <div className="max-w-full overflow-x-clip">
            <TitleRail
              cards={archiveReferences}
              eyebrow="Restored Classics & Milestones"
              title="From the archive."
              href="/movies"
              linkLabel="Explore all films"
            />
          </div>
        ) : null}

        {/* 8. Editorial Seasons & Directory Callout */}
        <section
          aria-labelledby="curated-seasons-heading"
          className="border-border bg-surface-1 flex flex-col justify-between gap-8 rounded-xl border p-8 sm:flex-row sm:items-center sm:p-12"
        >
          <div className="max-w-xl space-y-2">
            <p className="text-accent font-mono text-xs tracking-widest uppercase">
              CINEVA Curated Seasons
            </p>
            <h2
              id="curated-seasons-heading"
              className="font-display text-text text-2xl font-bold tracking-tight sm:text-3xl"
            >
              Explore Auteur Retrospectives &amp; World Cinema
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed sm:text-base">
              Hand-picked filmographies, restored classics, and contemporary festival selections
              available to stream in crisp high definition.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/movies" variant="primary" size="lg">
              Browse Catalogue
            </ButtonLink>
            <ButtonLink href="/collections" variant="secondary" size="lg">
              Curated Collections
            </ButtonLink>
            <ButtonLink href="/people" variant="outline" size="lg">
              Directors &amp; Cast
            </ButtonLink>
          </div>
        </section>
      </div>
    </ConsumerShell>
  );
}
