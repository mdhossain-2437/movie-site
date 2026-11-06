import { getDatabase, getPublishedTitleBySlug } from "@movie/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BrandMark } from "@/components/layout/site-shell";
import { VideoPlayerShell } from "@/components/player/video-player-shell";
import { AvailabilityBadge, Badge, ButtonLink, EmptyState, Skeleton } from "@/components/ui";
import { getDevShowcaseTitleBySlug } from "@/lib/catalogue/dev-showcase";
import { authorizePlayback } from "@/lib/catalogue/repository";
import { resolveViewerTerritory } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "Watch · Cinematic Graphite",
  robots: { index: false, follow: false },
};

async function WatchPageBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const territoryCode = await resolveViewerTerritory();
  const db = await getDatabase();
  const title =
    (await getPublishedTitleBySlug(db, slug, { territoryCode })) ?? getDevShowcaseTitleBySlug(slug);

  if (title) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <AvailabilityBadge kind={title.availability.badgeKind} />
              <Badge tone="neutral">Territory: {territoryCode}</Badge>
              <Badge tone="neutral">{title.maturityRating}</Badge>
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
        description={`Central RightsDecisionService denied stream delivery (${decisionReason}). Development reference metadata remains viewable while distribution rights and playable media assets await verification.`}
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

export default function WatchPage(props: { params: Promise<{ slug: string }> }) {
  return (
    <div className="bg-canvas text-text flex min-h-dvh flex-col">
      <a href="#main" className="cg-skip-link">
        Skip to video player
      </a>
      <header className="border-border bg-canvas-raised border-b">
        <div className="cg-container flex h-14 items-center justify-between gap-3">
          <Link
            href="/"
            className="font-display text-text inline-flex min-h-10 items-center gap-2 rounded-sm px-1 text-base font-bold tracking-tight"
          >
            <BrandMark />
            <span>
              Cinematic <span className="text-accent">Graphite</span>
            </span>
          </Link>
          <Badge tone="neutral">Protected Watch Viewport · No-Referrer</Badge>
        </div>
      </header>

      <main id="main" className="cg-container flex-1 py-6 sm:py-8">
        <Suspense fallback={<Skeleton className="aspect-video w-full" />}>
          <WatchPageBody params={props.params} />
        </Suspense>
      </main>
    </div>
  );
}
