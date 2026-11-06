import { getDatabase, getPublicGenreBySlug } from "@movie/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs, FixtureNotice } from "@/components/catalogue/common";
import { FilmStripShowcase, type FilmStripItem } from "@/components/catalogue/film-strip-showcase";
import { PosterGrid } from "@/components/catalogue/poster-card";
import { ConsumerShell } from "@/components/layout/site-shell";
import { AvailabilityBadge, Badge, ButtonLink, ContentRowSkeleton } from "@/components/ui";
import { Icon } from "@/components/ui/icon";
import { pad2 } from "@/lib/catalogue/format";
import { getDevShowcaseGenreBySlug } from "@/lib/catalogue/dev-showcase";
import { getGenre } from "@/lib/catalogue/repository";
import { resolveViewerTerritory } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "Genre · CINEVA",
};

async function GenreDetailBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const territoryCode = await resolveViewerTerritory();
  const db = await getDatabase();
  const data =
    (await getPublicGenreBySlug(db, slug, { territoryCode })) ?? getDevShowcaseGenreBySlug(slug);

  if (data) {
    const { genre, titles } = data;

    const showcaseItems: FilmStripItem[] = titles.map((t) => ({
      id: t.id,
      slug: t.slug,
      titleEn: t.localizedTitleEn,
      titleBn: t.localizedTitleBn,
      releaseYear: t.releaseYear,
      runtimeMinutes: t.runtimeMinutes,
      maturityRating: t.maturityRating,
      synopsisEn: t.synopsisEn,
      badgeKind: t.availability.badgeKind,
      isDevelopmentFixture: t.isDevelopmentFixture,
    }));

    const watermark = genre.nameEn.toUpperCase();

    return (
      <div className="space-y-12">
        <section aria-labelledby="genre-heading" className="cg-surface p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">Taxonomy · Genre Archive</Badge>
            <Badge tone="neutral">{titles.length} Works Cleared</Badge>
            <Badge tone="neutral">Territory: {territoryCode}</Badge>
          </div>

          <h1
            id="genre-heading"
            className="font-display text-text mt-4 text-3xl font-bold sm:text-5xl"
          >
            {genre.nameEn}
          </h1>

          {genre.nameBn ? (
            <p
              className="font-display text-text-secondary mt-2 text-2xl font-semibold sm:text-3xl"
              lang="bn"
            >
              {genre.nameBn}
            </p>
          ) : null}

          <p className="cg-prose text-text-secondary mt-4 text-base leading-relaxed sm:text-lg">
            Verified lawful cinematic works classified under the {genre.nameEn} category. All titles
            comply strictly with platform licensing and legal rights mandates.
          </p>
        </section>

        {showcaseItems.length > 0 ? (
          <FilmStripShowcase
            breadcrumbTitle={genre.nameEn}
            breadcrumbCategory="Genres"
            watermarkText={watermark}
            heading={`${genre.nameEn} Showcase`}
            subheading={`Explore editorial highlights from our verified ${genre.nameEn} catalog.`}
            items={showcaseItems}
          />
        ) : (
          <div className="cg-surface text-text-muted p-8 text-center">
            No published titles currently cleared for this territory ({territoryCode}).
          </div>
        )}

        {titles.length > 0 ? (
          <section aria-labelledby="catalog-heading" className="space-y-4">
            <h2 id="catalog-heading" className="font-display text-text text-2xl font-bold">
              All Cleared {genre.nameEn} Titles
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {titles.map((t) => (
                <article
                  key={t.id}
                  className="cg-surface hover:border-accent/60 flex flex-col justify-between p-5 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-text-muted font-mono text-xs">
                        {t.releaseYear} · {t.runtimeMinutes}m
                      </span>
                      <AvailabilityBadge kind={t.availability.badgeKind} />
                    </div>
                    <h3 className="font-display text-text mt-2 text-lg font-semibold">
                      <Link
                        href={`/movies/${t.slug}`}
                        className="hover:text-accent transition-colors"
                      >
                        {t.localizedTitleEn}
                      </Link>
                    </h3>
                    {t.localizedTitleBn ? (
                      <p className="text-text-secondary mt-0.5 text-xs" lang="bn">
                        {t.localizedTitleBn}
                      </p>
                    ) : null}
                    <p className="text-text-secondary mt-2 line-clamp-2 text-xs leading-relaxed">
                      {t.synopsisEn}
                    </p>
                  </div>
                  <div className="border-border mt-4 flex items-center justify-between border-t pt-3">
                    <ButtonLink href={`/movies/${t.slug}`} variant="outline" size="sm">
                      View Details
                    </ButtonLink>
                    {t.availability.streamAllowed ? (
                      <ButtonLink href={`/watch/${t.slug}`} variant="primary" size="sm">
                        Stream
                      </ButtonLink>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  const result = getGenre(slug);
  if (!result) {
    notFound();
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: "Films", href: "/movies" }, { label: result.genre.label }]} />
      <header className="page-header">
        <p className="eyebrow">A way into the archive</p>
        <h1>
          {result.genre.label}
          <sup>{pad2(result.titles.length)}</sup>
        </h1>
        <p>Different stories. A shared cinematic language.</p>
      </header>
      <FixtureNotice />
      <PosterGrid cards={result.titles} />
      <Link href="/movies" className="text-link mt-12">
        <Icon name="arrow-left" />
        Explore every genre
      </Link>
    </div>
  );
}

export default function GenrePage(props: { params: Promise<{ slug: string }> }) {
  return (
    <ConsumerShell>
      <Suspense fallback={<ContentRowSkeleton count={3} />}>
        <GenreDetailBody params={props.params} />
      </Suspense>
    </ConsumerShell>
  );
}
