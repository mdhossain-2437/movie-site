import { getDatabase, listPublishedTitles } from "@movie/db";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FixtureNotice } from "@/components/catalogue/common";
import { PosterGrid } from "@/components/catalogue/poster-card";
import { TitleCard } from "@/components/catalogue/title-card";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, ButtonLink, ContentRowSkeleton, EmptyState } from "@/components/ui";
import { listTitles } from "@/lib/catalogue/repository";
import { resolveViewerTerritory } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "Movies · Cinematic Graphite",
  description:
    "Browse rights-verified films by availability and language once editorial and rights review complete.",
};

const LANGUAGE_FILTERS = [
  { label: "All Languages", value: undefined },
  { label: "Bangla (বাংলা)", value: "bn" },
  { label: "English", value: "en" },
] as const;

async function MoviesDirectoryResults({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const rawLang = Array.isArray(resolved.lang) ? resolved.lang[0] : resolved.lang;
  const activeLang = rawLang === "bn" || rawLang === "en" ? rawLang : undefined;

  const territoryCode = await resolveViewerTerritory();
  const db = await getDatabase();
  const items = await listPublishedTitles(db, {
    territoryCode,
    language: activeLang,
    limit: 24,
  });

  const archiveCards = listTitles();

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Language filter" className="flex flex-wrap items-center gap-2">
            {LANGUAGE_FILTERS.map((f) => {
              const selected = f.value === activeLang;
              const href = f.value ? `/movies?lang=${f.value}` : "/movies";
              return (
                <Link
                  key={f.label}
                  href={href}
                  aria-current={selected ? "page" : undefined}
                  className={`rounded-pill inline-flex min-h-10 items-center gap-2 border px-4 py-1.5 text-sm font-medium transition-colors ${
                    selected
                      ? "border-accent bg-surface-3 text-text"
                      : "border-border bg-surface-1 text-text-secondary hover:bg-surface-2 hover:text-text"
                  }`}
                >
                  {selected ? (
                    <span aria-hidden="true" className="text-accent">
                      ✓
                    </span>
                  ) : null}
                  <span>{f.label}</span>
                </Link>
              );
            })}
          </nav>

          <Badge tone="neutral">Territory: {territoryCode}</Badge>
        </div>

        {items.length === 0 ? (
          <EmptyState
            eyebrow="0 published titles"
            title="No rights-cleared titles are published yet"
            description="Titles appear in this directory only after editorial metadata, attribution, and an active rights grant are approved by a separate Rights Reviewer with MFA."
            actions={
              <>
                <ButtonLink href="/search" variant="secondary">
                  Search Catalogue
                </ButtonLink>
                <ButtonLink href="/legal/copyright" variant="outline">
                  Review Licensing Policy
                </ButtonLink>
              </>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <TitleCard key={item.id} title={item} />
            ))}
          </div>
        )}
      </div>

      {archiveCards.length > 0 ? (
        <section aria-labelledby="archive-ref-heading" className="space-y-6">
          <div className="space-y-2">
            <Badge tone="info">Development Reference Archive</Badge>
            <h2 id="archive-ref-heading" className="font-display text-text text-2xl font-bold">
              Early Cinema Editorial References ({archiveCards.length})
            </h2>
          </div>
          <FixtureNotice compact />
          <PosterGrid cards={archiveCards} />
        </section>
      ) : null}
    </div>
  );
}

export default function MoviesPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ConsumerShell>
      <header className="mb-8 space-y-3">
        <Badge tone="neutral">Catalogue Browse</Badge>
        <h1 className="font-display text-text text-3xl font-bold sm:text-4xl">Movies</h1>
        <p className="cg-prose text-text-secondary text-base leading-7">
          Public listings display honest availability per title: streaming, authorized download, or
          catalogue-only reference when territorial media delivery rights are inactive.
        </p>
      </header>

      <Suspense fallback={<ContentRowSkeleton count={4} />}>
        <MoviesDirectoryResults searchParams={props.searchParams} />
      </Suspense>
    </ConsumerShell>
  );
}
