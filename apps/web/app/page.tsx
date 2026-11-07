import type { Metadata } from "next";
import Link from "next/link";
import { KeyArt } from "@/components/art/key-art";
import { TitleRail } from "@/components/catalogue/editorial";
import { FilmStripShowcase, type FilmStripItem } from "@/components/catalogue/film-strip-showcase";
import { ConsumerShell } from "@/components/layout/site-shell";
import { AvailabilityBadge, Badge, ButtonLink } from "@/components/ui";
import {
  CINEVA_COLLECTIONS,
  CINEVA_DATABASE_FILMS,
  CINEVA_GENRES,
} from "@/lib/catalogue/cineva-database";
import { listTitles } from "@/lib/catalogue/repository";

export const metadata: Metadata = {
  title: "CINEVA · Cinema, Streaming & Film Database",
  description:
    "Stream acclaimed world cinema in 2.39:1 anamorphic HD, explore the CINEVA film database, and discover restored classics.",
};

const FEATURED_CINEMA_SELECTION: FilmStripItem[] = CINEVA_DATABASE_FILMS.slice(0, 7).map((f) => ({
  id: f.id,
  slug: f.slug,
  titleEn: f.localizedTitleEn,
  titleBn: f.localizedTitleBn,
  releaseYear: f.releaseYear,
  runtimeMinutes: f.runtimeMinutes,
  maturityRating: f.maturityRating,
  synopsisEn: f.synopsisEn,
  badgeKind: f.availability.badgeKind,
}));

export default function Home() {
  const archiveReferences = listTitles().slice(0, 10);
  const topTenFilms = [...CINEVA_DATABASE_FILMS]
    .filter((f) => typeof f.rank === "number")
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    .slice(0, 10);
  const anamorphicPremieres = CINEVA_DATABASE_FILMS.filter(
    (f) => f.availability.streamAllowed,
  ).slice(0, 4);

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

      {/* Below-the-Fold Streaming Swimlanes & Film Database Explorer */}
      <div className="cg-container max-w-full space-y-20 overflow-x-clip py-14 sm:py-20">
        {/* 1. Top 10 Films on CINEVA Today */}
        <section aria-labelledby="top-ten-heading" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-accent font-mono text-xs font-semibold tracking-widest uppercase">
                Live Theater Ranking · Updated Daily
              </p>
              <h2
                id="top-ten-heading"
                className="font-display text-text text-2xl font-bold tracking-tight sm:text-4xl"
              >
                Top 10 Films on CINEVA
              </h2>
            </div>
            <ButtonLink href="/movies" variant="outline" size="sm">
              Open Full Film Database
            </ButtonLink>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {topTenFilms.map((film) => {
              const rankNum = film.rank ?? 1;
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
                        <span className="border-accent/55 bg-canvas/90 text-accent inline-flex min-w-8 items-center justify-center rounded-xs border px-2 py-0.5 font-mono text-xs font-bold">
                          #{rankNum}
                        </span>
                        <span className="border-border-strong bg-canvas/90 text-text inline-flex items-center gap-1 rounded-xs border px-2 py-0.5 font-mono text-[11px] font-semibold">
                          <span aria-hidden="true" className="text-accent">
                            ★
                          </span>
                          <span>{film.cinevaScore.toFixed(1)}</span>
                        </span>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 z-10 p-3">
                        <p className="text-text-secondary font-mono text-[10px] tracking-wider uppercase">
                          {film.releaseYear} · {film.runtimeMinutes}m · {film.aspectRatio}
                        </p>
                        <h3 className="font-display text-text group-hover:text-accent mt-0.5 line-clamp-1 text-base font-bold transition-colors motion-reduce:transition-none">
                          {film.localizedTitleEn}
                        </h3>
                        <p className="text-text-secondary line-clamp-1 text-xs" lang="bn">
                          {film.localizedTitleBn}
                        </p>
                      </div>
                    </div>
                  </Link>

                  <div className="border-border flex items-center justify-between gap-2 border-t px-3 py-2">
                    <span className="text-text-muted font-mono text-[11px]">
                      {film.genres[0]?.nameEn ?? "Cinema"}
                    </span>
                    <Link
                      href={`/watch/${film.slug}`}
                      aria-label={`Stream ${film.localizedTitleEn}`}
                      className="border-accent/50 bg-accent/15 text-text hover:bg-accent hover:text-on-accent rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center gap-1 border px-3 py-1 font-mono text-[11px] font-semibold transition-colors motion-reduce:transition-none md:min-h-7 md:min-w-7"
                    >
                      <svg aria-hidden="true" className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span>Watch</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* 2. Streaming Now in 2.39:1 Anamorphic HD */}
        <section aria-labelledby="streaming-now-heading" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-accent font-mono text-xs font-semibold tracking-widest uppercase">
                Instant Theater Playback · Bilingual EN &amp; বাংলা Subtitles
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
                          Dir. {director} · {film.releaseYear} · {film.runtimeMinutes}m
                        </p>
                        <h3 className="font-display text-text text-2xl font-bold sm:text-3xl">
                          {film.localizedTitleEn}
                        </h3>
                        <p className="text-text-secondary text-sm" lang="bn">
                          {film.localizedTitleBn}
                        </p>
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

        {/* 3. Browse Movie Database by Genre & Curated Vaults */}
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
                <span className="text-text-muted text-xs" lang="bn">
                  {genre.nameBn}
                </span>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                  <p className="text-text-secondary text-xs" lang="bn">
                    {col.titleBn}
                  </p>
                  <p className="text-text-muted line-clamp-2 text-xs leading-relaxed">
                    {col.description}
                  </p>
                </div>
                <p className="text-text-secondary mt-4 font-mono text-xs font-semibold">
                  {col.filmSlugs.length} Films →
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. Historical Archive Rail */}
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

        {/* 5. Editorial Seasons & Directory Callout */}
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
