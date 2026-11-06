import type { Metadata } from "next";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, ButtonLink, EmptyState } from "@/components/ui";

export const metadata: Metadata = {
  title: "My List · Cinematic Graphite",
  description: "Save authorized films to your personal watchlist.",
};

export default function WatchlistPage() {
  return (
    <ConsumerShell>
      <header className="mb-8 space-y-3">
        <Badge tone="neutral">Personal Library</Badge>
        <h1 className="font-display text-text text-3xl font-bold sm:text-4xl">My List</h1>
        <p className="cg-prose text-text-secondary text-base leading-7">
          Bookmark rights-cleared titles to watch across sessions once viewer accounts and database
          persistence activate in Milestone M2.
        </p>
      </header>

      <EmptyState
        eyebrow="Account session required"
        title="Your watchlist is currently empty"
        description="Sign-in and profile-scoped watchlists are enabled alongside PostgreSQL session management in Milestone M2."
        actions={
          <>
            <ButtonLink href="/account" variant="primary">
              Account &amp; Session Status
            </ButtonLink>
            <ButtonLink href="/movies" variant="secondary">
              Browse Catalogue
            </ButtonLink>
          </>
        }
      />
    </ConsumerShell>
  );
}
