import type { Metadata } from "next";
import { ConsumerShell } from "@/components/layout/site-shell";
import { AvailabilityBadge, Badge, ButtonLink, EmptyState } from "@/components/ui";

export const metadata: Metadata = {
  title: "Movies · Cinematic Graphite",
  description:
    "Browse rights-verified films by availability, language, and genre once editorial and rights review complete.",
};

export default function MoviesPage() {
  return (
    <ConsumerShell>
      <header className="mb-8 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">Catalogue Browse</Badge>
          <AvailabilityBadge kind="rights_pending" />
        </div>
        <h1 className="font-display text-text text-3xl font-bold sm:text-4xl">Movies</h1>
        <p className="cg-prose text-text-secondary text-base leading-7">
          Public listings display honest availability per title: streaming, authorized download, or
          catalogue-only reference when territorial distribution rights are inactive.
        </p>
      </header>

      <EmptyState
        eyebrow="No published titles yet"
        title="Awaiting rights-approved catalogue entries"
        description="Titles appear in this directory only after editorial metadata, storage checksums, and an active rights grant are approved through the Operations Console in Milestone M2."
        actions={
          <>
            <ButtonLink href="/search" variant="secondary">
              Go to Search
            </ButtonLink>
            <ButtonLink href="/legal/copyright" variant="outline">
              Review Licensing Policy
            </ButtonLink>
          </>
        }
      />
    </ConsumerShell>
  );
}
