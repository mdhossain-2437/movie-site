import { getDatabase, listPublishedTitles } from "@movie/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FilmStripShowcase, type FilmStripItem } from "@/components/catalogue/film-strip-showcase";
import { TitleCard } from "@/components/catalogue/title-card";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, ButtonLink, ContentRowSkeleton } from "@/components/ui";
import { getCinevaStudioBySlug } from "@/lib/catalogue/cineva-database";
import { getDevShowcaseStudioBySlug, listDevShowcaseSummaries } from "@/lib/catalogue/dev-showcase";
import { resolveViewerTerritory } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "Studio Hub · CINEVA",
};

async function StudioDetailBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const territoryCode = await resolveViewerTerritory();
  const db = await getDatabase();
  const dbMatches = await listPublishedTitles(db, {
    territoryCode,
    studioSlug: slug,
    limit: 50,
  });

  const showcaseData = getDevShowcaseStudioBySlug(slug);
  const studioMeta = showcaseData?.studio ?? getCinevaStudioBySlug(slug);

  if (!studioMeta && dbMatches.length === 0) {
    notFound();
  }

  const showcaseSummaries = listDevShowcaseSummaries({ studioSlug: slug, sort: "top_rated" });
  const seen = new Set<string>();
  const allSummaries = [...dbMatches, ...showcaseSummaries].filter((s) => {
    if (seen.has(s.slug)) return false;
    seen.add(s.slug);
    return true;
  });

  const stripItems: FilmStripItem[] = allSummaries.map((t) => ({
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

  const studioTitle = studioMeta?.nameEn ?? dbMatches[0]?.studioName ?? slug;
  const watermark = studioMeta?.shortLabel.split(" ")[0] ?? "STUDIO";

  return (
    <div className="w-full">
      {stripItems.length > 0 ? (
        <FilmStripShowcase
          breadcrumbTitle={studioTitle}
          breadcrumbCategory="Studios"
          watermarkText={watermark}
          renderBreadcrumbAsH1
          items={stripItems}
        />
      ) : null}

      <div className="cg-container space-y-12 py-12 sm:py-16">
        <section aria-labelledby="studio-manifesto-heading" className="cg-surface p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">Studio Production Hub</Badge>
            {studioMeta ? (
              <Badge tone="neutral">
                Est. {studioMeta.foundedYear} · {studioMeta.headquarters}
              </Badge>
            ) : null}
            <Badge tone="neutral">{allSummaries.length} Catalogue Works</Badge>
          </div>

          {stripItems.length === 0 ? (
            <h1
              id="studio-manifesto-heading"
              className="font-display text-text mt-4 text-3xl font-bold sm:text-5xl"
            >
              {studioTitle}
            </h1>
          ) : (
            <h2
              id="studio-manifesto-heading"
              className="font-display text-text mt-4 text-3xl font-bold sm:text-5xl"
            >
              {studioTitle}
            </h2>
          )}

          {studioMeta?.nameBn ? (
            <p className="font-display text-text-secondary mt-2 text-2xl font-semibold" lang="bn">
              {studioMeta.nameBn}
            </p>
          ) : null}

          {studioMeta ? (
            <p className="cg-prose text-text-secondary mt-4 text-base leading-relaxed sm:text-lg">
              {studioMeta.description}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ButtonLink href={`/movies?studio=${slug}`} variant="primary" size="sm">
              Filter in Multi-Facet Explorer
            </ButtonLink>
            <ButtonLink href="/studios" variant="outline" size="sm">
              All Studio Banners
            </ButtonLink>
          </div>
        </section>

        <section aria-labelledby="studio-works-heading" className="space-y-5">
          <h2 id="studio-works-heading" className="font-display text-text text-2xl font-bold">
            Complete Banner Filmography &amp; Series ({allSummaries.length})
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {allSummaries.map((summary) => (
              <TitleCard key={summary.id} title={summary} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function StudioDetailPage(props: { params: Promise<{ slug: string }> }) {
  return (
    <ConsumerShell fullBleed>
      <Suspense
        fallback={
          <div className="cg-container py-12">
            <ContentRowSkeleton count={4} />
          </div>
        }
      >
        <StudioDetailBody params={props.params} />
      </Suspense>
    </ConsumerShell>
  );
}
