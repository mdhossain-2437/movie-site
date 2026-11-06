import { getDatabase, getPublicCollectionBySlug } from "@movie/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { KeyArt } from "@/components/art/key-art";
import { Breadcrumbs, FixtureNotice } from "@/components/catalogue/common";
import { FilmStripShowcase, type FilmStripItem } from "@/components/catalogue/film-strip-showcase";
import { SaveButton, ShareButton } from "@/components/experience/actions";
import { PosterLink } from "@/components/experience/poster-link";
import { ConsumerShell } from "@/components/layout/site-shell";
import { AvailabilityBadge, Badge, ButtonLink, ContentRowSkeleton } from "@/components/ui";
import { Icon } from "@/components/ui/icon";
import { formatRuntime, joinNames, pad2 } from "@/lib/catalogue/format";
import { getDevShowcaseCollectionBySlug } from "@/lib/catalogue/dev-showcase";
import { getCollection } from "@/lib/catalogue/repository";
import { resolveViewerTerritory } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "Curated Collection · CINEVA",
};

async function CollectionDetailBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const territoryCode = await resolveViewerTerritory();
  const db = await getDatabase();
  const data =
    (await getPublicCollectionBySlug(db, slug, { territoryCode })) ??
    getDevShowcaseCollectionBySlug(slug);

  if (data) {
    const { collection, titles } = data;

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
    }));

    const watermark = collection.titleEn.split(" ")[0] ?? "Archive";

    return (
      <div className="w-full">
        {showcaseItems.length > 0 ? (
          <FilmStripShowcase
            breadcrumbTitle={collection.titleEn}
            breadcrumbCategory="Collections"
            watermarkText={watermark}
            renderBreadcrumbAsH1
            items={showcaseItems}
          />
        ) : null}

        <div className="cg-container space-y-12 py-12 sm:py-16">
          <section aria-labelledby="collection-about-heading" className="cg-surface p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">Curated Collection</Badge>
              <Badge tone="neutral">{titles.length} Films</Badge>
            </div>

            {showcaseItems.length === 0 ? (
              <h1
                id="collection-about-heading"
                className="font-display text-text mt-4 text-3xl font-bold sm:text-5xl"
              >
                {collection.titleEn}
              </h1>
            ) : (
              <h2
                id="collection-about-heading"
                className="font-display text-text mt-4 text-3xl font-bold sm:text-5xl"
              >
                {collection.titleEn}
              </h2>
            )}

            {collection.titleBn ? (
              <p
                className="font-display text-text-secondary mt-2 text-2xl font-semibold sm:text-3xl"
                lang="bn"
              >
                {collection.titleBn}
              </p>
            ) : null}

            {collection.description ? (
              <p className="cg-prose text-text-secondary mt-5 text-base leading-relaxed sm:text-lg">
                {collection.description}
              </p>
            ) : null}
          </section>

          {titles.length > 0 ? (
            <section aria-labelledby="catalog-heading" className="space-y-4">
              <h2 id="catalog-heading" className="font-display text-text text-2xl font-bold">
                Films in This Collection
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
                        Details
                      </ButtonLink>
                      {t.availability.streamAllowed ? (
                        <ButtonLink href={`/watch/${t.slug}`} variant="primary" size="sm">
                          Watch
                        </ButtonLink>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    );
  }

  const collection = getCollection(slug);
  if (!collection) {
    notFound();
  }

  const years = collection.titles.map((card) => card.year);

  return (
    <>
      <section className="collection-hero">
        <Breadcrumbs
          items={[
            { label: "Discover", href: "/" },
            { label: "Collections", href: "/collections" },
            { label: collection.title },
          ]}
        />
        <div className="collection-hero-grid">
          <div>
            <p className="eyebrow">Curated collection · {pad2(collection.titles.length)} films</p>
            <h1>{collection.title}</h1>
            <p lang="bn" className="collection-hero-bangla">
              {collection.titleBn}
            </p>
            <p className="collection-essay">{collection.description}</p>
            <div className="collection-hero-meta">
              {years.length > 0 ? (
                <span>
                  {Math.min(...years)} — {Math.max(...years)}
                </span>
              ) : null}
              <a href="#collection-films" className="text-link">
                Explore the films
                <Icon name="arrow" />
              </a>
            </div>
            <ShareButton title={collection.title} path={`/collections/${slug}`} />
          </div>
          <div className="collection-hero-stack" aria-hidden="true">
            {collection.titles.slice(0, 3).map((card, i) => (
              <div
                className={`collection-stack-poster collection-stack-poster-${i}`}
                key={card.slug}
              >
                <KeyArt spec={card.art} />
                <div className="art-grain" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="collection-body" id="collection-films">
        <div className="collection-list-heading">
          <p className="eyebrow">The collection, frame by frame</p>
          <span>{pad2(collection.titles.length)} titles</span>
        </div>
        <FixtureNotice compact />
        {collection.titles.map((card, i) => (
          <article className="collection-film" key={card.slug}>
            <span className="collection-film-number">{pad2(i + 1)}</span>
            <PosterLink
              href={`/movies/${card.slug}`}
              title={card.title}
              color={card.art.palette.bg2}
              className="collection-film-art"
              label={`Explore ${card.title}`}
            >
              <div data-poster-art>
                <KeyArt spec={card.art} />
                <div className="art-grain" />
              </div>
            </PosterLink>
            <div className="collection-film-copy">
              <p className="eyebrow">
                {card.year} / {joinNames(card.directors.map((person) => person.name))}
              </p>
              <Link href={`/movies/${card.slug}`}>
                <h2>{card.title}</h2>
              </Link>
              <p>{card.synopsis}</p>
              <div className="collection-film-meta">
                <span>≈ {formatRuntime(card.runtimeMinutes)}</span>
                <span>{card.genres.join(" · ")}</span>
                <span>
                  <Icon name="lock" />
                  Rights pending
                </span>
              </div>
            </div>
            <div className="collection-film-actions">
              <Link
                href={`/movies/${card.slug}`}
                className="icon-button"
                aria-label={`Explore ${card.title}`}
              >
                <Icon name="arrow-up-right" />
              </Link>
              <SaveButton slug={card.slug} title={card.title} compact />
            </div>
          </article>
        ))}
        <Link href="/collections" className="text-link">
          <Icon name="arrow-left" />
          All collections
        </Link>
      </div>
    </>
  );
}

export default function CollectionPage(props: { params: Promise<{ slug: string }> }) {
  return (
    <ConsumerShell fullBleed>
      <Suspense
        fallback={
          <div className="cg-container py-12">
            <ContentRowSkeleton count={3} />
          </div>
        }
      >
        <CollectionDetailBody params={props.params} />
      </Suspense>
    </ConsumerShell>
  );
}
