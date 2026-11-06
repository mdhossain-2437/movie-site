import type { Metadata } from "next";
import { Suspense } from "react";
import { ConsumerShell } from "@/components/layout/site-shell";
import { BrowseResults } from "@/components/catalogue/browse";
import { FixtureNotice } from "@/components/catalogue/common";
import { ContentRowSkeleton } from "@/components/ui";
import { listTitles } from "@/lib/catalogue/repository";

export const metadata: Metadata = {
  title: "Films",
  description:
    "Find a new perspective. Explore the film archive by genre, era and country, with honest availability.",
};

export default function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const count = listTitles().length;
  return (
    <ConsumerShell className="browse-page">
      <header className="page-header page-header-split">
        <div>
          <p className="eyebrow">The archive / a considered collection</p>
          <h1>
            Films<sup>{String(count).padStart(2, "0")}</sup>
          </h1>
        </div>
        <p>
          A century of imagination.
          <br />
          Find something you didn’t know you were looking for.
        </p>
      </header>
      <FixtureNotice compact />
      <Suspense
        fallback={
          <div className="py-10">
            <ContentRowSkeleton />
          </div>
        }
      >
        <BrowseResults searchParams={searchParams} />
      </Suspense>
    </ConsumerShell>
  );
}
