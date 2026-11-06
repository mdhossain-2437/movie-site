import { getDatabase, getPublicPersonBySlug } from "@movie/db";
import type { Metadata } from "next";
import Link from "next/link";

import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FilmStripShowcase, type FilmStripItem } from "@/components/catalogue/film-strip-showcase";
import { ConsumerShell } from "@/components/layout/site-shell";
import { AvailabilityBadge, Badge, ButtonLink, ContentRowSkeleton } from "@/components/ui";
import { resolveViewerTerritory } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "Filmmaker Profile · Cinematic Graphite",
};

async function PersonDetailBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const territoryCode = await resolveViewerTerritory();
  const db = await getDatabase();
  const data = await getPublicPersonBySlug(db, slug, { territoryCode });

  if (!data) {
    notFound();
  }

  const { person, titles } = data;

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

  const watermark = (person.nameEn.split(" ").pop() ?? "DIRECTOR").toUpperCase();

  return (
    <div className="space-y-12">
      {/* Filmmaker Bio Header */}
      <section aria-labelledby="person-heading" className="cg-surface p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">Filmmaker &amp; Director</Badge>
          <Badge tone="neutral">{titles.length} Works Cleared</Badge>
        </div>

        <h1
          id="person-heading"
          className="font-display text-text mt-4 text-3xl font-bold sm:text-5xl"
        >
          {person.nameEn}
        </h1>

        {person.nameBn ? (
          <p
            className="font-display text-text-secondary mt-2 text-2xl font-semibold sm:text-3xl"
            lang="bn"
          >
            {person.nameBn}
          </p>
        ) : null}

        {person.bio ? (
          <p className="cg-prose text-text-secondary mt-5 text-base leading-relaxed sm:text-lg">
            {person.bio}
          </p>
        ) : null}
      </section>

      {/* Concept #1: Vertical Film-Strip Showcase */}
      {showcaseItems.length > 0 ? (
        <FilmStripShowcase
          breadcrumbTitle={person.nameEn}
          breadcrumbCategory="Directors"
          watermarkText={watermark}
          heading={`Filmography of ${person.nameEn}`}
          subheading="Curated vertical gallery of verified works published under valid distribution rights."
          items={showcaseItems}
        />
      ) : (
        <div className="cg-surface text-text-muted p-8 text-center">
          No published titles currently cleared for this territory ({territoryCode}).
        </div>
      )}

      {/* Catalog Grid View */}
      {titles.length > 0 ? (
        <section aria-labelledby="catalog-heading" className="space-y-4">
          <h2 id="catalog-heading" className="font-display text-text text-2xl font-bold">
            All Verified Works
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

export default function PersonPage(props: { params: Promise<{ slug: string }> }) {
  return (
    <ConsumerShell>
      <Suspense fallback={<ContentRowSkeleton count={3} />}>
        <PersonDetailBody params={props.params} />
      </Suspense>
    </ConsumerShell>
  );
}
