import { getDatabase, getPublicPersonBySlug } from "@movie/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type CSSProperties } from "react";
import { KeyArt } from "@/components/art/key-art";
import { Breadcrumbs, FixtureNotice, SectionHeading } from "@/components/catalogue/common";
import { FilmStripShowcase, type FilmStripItem } from "@/components/catalogue/film-strip-showcase";
import { PosterGrid } from "@/components/catalogue/poster-card";
import { ShareButton } from "@/components/experience/actions";
import { PosterLink } from "@/components/experience/poster-link";
import { ConsumerShell } from "@/components/layout/site-shell";
import { AvailabilityBadge, Badge, ButtonLink, ContentRowSkeleton } from "@/components/ui";
import { Icon } from "@/components/ui/icon";
import { formatLifespan, pad2, pluralize } from "@/lib/catalogue/format";
import { getDevShowcasePersonBySlug } from "@/lib/catalogue/dev-showcase";
import { getPerson, roleLabel } from "@/lib/catalogue/repository";
import { resolveViewerTerritory } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "Filmmaker Profile · Cinematic Graphite",
};

async function PersonDetailBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const territoryCode = await resolveViewerTerritory();
  const db = await getDatabase();
  const data =
    (await getPublicPersonBySlug(db, slug, { territoryCode })) ?? getDevShowcasePersonBySlug(slug);

  if (data) {
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
      <div className="cg-container space-y-12 py-10 sm:py-14">
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

  const person = getPerson(slug);
  if (!person) {
    notFound();
  }

  return (
    <>
      <section className="person-hero">
        <Breadcrumbs
          items={[
            { label: "Discover", href: "/" },
            { label: "People", href: "/people" },
            { label: person.name },
          ]}
        />
        <div className="person-heading-row">
          <p className="eyebrow">{person.roles.map(roleLabel).join(" / ")}</p>
          <h1>{person.name}</h1>
          <span className="eyebrow">{formatLifespan(person.born, person.died)}</span>
        </div>
        <div
          className="filmography-gallery"
          role="region"
          aria-label={`${person.name} filmography`}
          tabIndex={0}
          style={{ "--film-count": person.films.length } as CSSProperties}
        >
          {person.films.map((card, i) => (
            <PosterLink
              href={`/movies/${card.slug}`}
              title={card.title}
              color={card.art.palette.bg2}
              className={`filmography-link filmography-link-${i % 3}`}
              key={card.slug}
              label={`${card.title}, ${card.year}`}
            >
              <div className="filmography-art" data-poster-art>
                <KeyArt spec={card.art} />
                <div className="art-grain" />
                <div className="poster-scrim" />
                <span className="filmography-poster-title">{card.title}</span>
              </div>
              <div className="filmography-caption">
                <span>{pad2(i + 1)}</span>
                <span>{card.year}</span>
              </div>
            </PosterLink>
          ))}
        </div>
        <div
          className={`person-watermark ${person.displayName.length > 9 ? "person-watermark-long" : ""}`}
          aria-hidden="true"
        >
          {person.displayName}
        </div>
        <div className="person-hero-footer">
          <span>{pluralize(person.films.length, "film")} in this development archive</span>
          <a href="#biography">
            The person behind the films
            <Icon name="arrow" />
          </a>
        </div>
      </section>
      <div className="person-body">
        <section className="person-bio-section" id="biography">
          <div>
            <p className="eyebrow">A singular perspective</p>
            <h2>
              {person.name}
              <span>.</span>
            </h2>
            {person.nameBn ? (
              <p lang="bn" className="person-bangla">
                {person.nameBn}
              </p>
            ) : null}
            <ShareButton title={`${person.name} — Filmography`} path={`/people/${person.slug}`} />
          </div>
          <div>
            <p className="person-bio">
              {person.bio ?? "Biography is awaiting source verification."}
            </p>
            <dl className="person-facts">
              <div>
                <dt>Years</dt>
                <dd>{formatLifespan(person.born, person.died) ?? "Not recorded"}</dd>
              </div>
              <div>
                <dt>Origin</dt>
                <dd>{person.origin ?? "Source verification pending"}</dd>
              </div>
              <div>
                <dt>Craft</dt>
                <dd>{person.roles.map(roleLabel).join(" · ")}</dd>
              </div>
            </dl>
          </div>
        </section>
        <FixtureNotice />
        <section className="complete-filmography">
          <SectionHeading
            eyebrow="Follow the work"
            title="In this archive."
            count={person.films.length}
          />
          <PosterGrid cards={person.films} />
        </section>
      </div>
    </>
  );
}

export default function PersonPage(props: { params: Promise<{ slug: string }> }) {
  return (
    <ConsumerShell fullBleed>
      <Suspense
        fallback={
          <div className="cg-container py-12">
            <ContentRowSkeleton count={3} />
          </div>
        }
      >
        <PersonDetailBody params={props.params} />
      </Suspense>
    </ConsumerShell>
  );
}
