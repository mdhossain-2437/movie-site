import { getDatabase, listWatchlistItems } from "@movie/db";
import type { Metadata } from "next";
import { Suspense } from "react";
import { TitleCard } from "@/components/catalogue/title-card";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, ButtonLink, ContentRowSkeleton, EmptyState } from "@/components/ui";
import { getCurrentSession, resolveViewerTerritory } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "My List · Cinematic Graphite",
  description: "Save authorized films to your personal watchlist.",
};

async function WatchlistContent() {
  const { session } = await getCurrentSession();

  if (!session) {
    return (
      <EmptyState
        eyebrow="Account session required"
        title="Sign in to view your saved films"
        description="Watchlist items are scoped privately to your account session."
        actions={
          <>
            <ButtonLink href="/account" variant="primary">
              Sign In or Create Account
            </ButtonLink>
            <ButtonLink href="/movies" variant="secondary">
              Browse Catalogue
            </ButtonLink>
          </>
        }
      />
    );
  }

  const territoryCode = await resolveViewerTerritory();
  const db = await getDatabase();
  const items = await listWatchlistItems(
    db,
    { actor: session.actor, requestId: "rsc_watchlist_page" },
    { territoryCode },
  );

  if (items.length === 0) {
    return (
      <EmptyState
        eyebrow={`Signed in as ${session.displayName}`}
        title="Your watchlist is empty"
        description="Save rights-cleared titles from any film page to keep them here across devices."
        actions={
          <ButtonLink href="/movies" variant="primary">
            Explore Movies
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <TitleCard key={item.id} title={item} />
      ))}
    </div>
  );
}

export default function WatchlistPage() {
  return (
    <ConsumerShell>
      <header className="mb-8 space-y-3">
        <Badge tone="neutral">Personal Library</Badge>
        <h1 className="font-display text-text text-3xl font-bold sm:text-4xl">My List</h1>
        <p className="cg-prose text-text-secondary text-base leading-7">
          Bookmark rights-cleared titles to watch across sessions.
        </p>
      </header>

      <Suspense fallback={<ContentRowSkeleton count={4} />}>
        <WatchlistContent />
      </Suspense>
    </ConsumerShell>
  );
}
