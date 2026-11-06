import { getDatabase, getPublishedTitleBySlug, listWatchlistItems } from "@movie/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TitleHeroStage } from "@/components/catalogue/title-hero-stage";
import { ConsumerShell } from "@/components/layout/site-shell";
import { ContentRowSkeleton } from "@/components/ui";
import { getCurrentSession, resolveViewerTerritory } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "Film Detail · Cinematic Graphite",
};

async function TitleDetailBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const territoryCode = await resolveViewerTerritory();
  const db = await getDatabase();
  const title = await getPublishedTitleBySlug(db, slug, { territoryCode });

  if (!title) {
    notFound();
  }

  const { session } = await getCurrentSession();
  let initialSaved = false;
  if (session) {
    const saved = await listWatchlistItems(
      db,
      { actor: session.actor, requestId: "rsc_watchlist_check" },
      { territoryCode },
    );
    initialSaved = saved.some((s) => s.id === title.id);
  }

  return (
    <TitleHeroStage
      title={title}
      territoryCode={territoryCode}
      isAuthenticated={Boolean(session)}
      initialSaved={initialSaved}
    />
  );
}

export default function TitleDetailPage(props: { params: Promise<{ slug: string }> }) {
  return (
    <ConsumerShell>
      <Suspense fallback={<ContentRowSkeleton count={3} />}>
        <TitleDetailBody params={props.params} />
      </Suspense>
    </ConsumerShell>
  );
}
