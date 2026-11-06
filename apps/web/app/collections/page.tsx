import { getDatabase, listPublicCollections } from "@movie/db";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { EmptyArchive, FixtureNotice } from "@/components/catalogue/common";
import { CollectionTile } from "@/components/catalogue/editorial";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, ButtonLink, ContentRowSkeleton } from "@/components/ui";
import { pad2 } from "@/lib/catalogue/format";
import { listCollections } from "@/lib/catalogue/repository";

export const metadata: Metadata = {
  title: "Collections · Cinematic Graphite",
  description:
    "Editorial paths through the film archive. Follow a movement, a mood, or a shared idea.",
};

async function PublishedCollectionsSection() {
  await connection();
  const db = await getDatabase();
  const dbCollections = await listPublicCollections(db);

  if (dbCollections.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="published-collections-heading" className="mb-14 space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">Verified Catalogue</Badge>
        <h2
          id="published-collections-heading"
          className="font-display text-text text-2xl font-bold"
        >
          Curated Licensed Collections ({dbCollections.length})
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {dbCollections.map((col) => (
          <article
            key={col.id}
            className="cg-surface hover:border-accent/60 flex flex-col justify-between p-6 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <Badge tone="neutral">{col.itemCount} Titles</Badge>
              </div>
              <h3 className="font-display text-text mt-3 text-xl font-bold">
                <Link href={`/collections/${col.slug}`} className="hover:text-accent">
                  {col.titleEn}
                </Link>
              </h3>
              {col.titleBn ? (
                <p className="text-text-secondary mt-1 text-sm" lang="bn">
                  {col.titleBn}
                </p>
              ) : null}
              {col.description ? (
                <p className="text-text-secondary mt-3 text-sm leading-relaxed">
                  {col.description}
                </p>
              ) : null}
            </div>
            <div className="mt-5 pt-2">
              <ButtonLink href={`/collections/${col.slug}`} variant="outline" size="sm">
                Explore Collection
              </ButtonLink>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function CollectionsPage() {
  const collections = listCollections();

  return (
    <ConsumerShell>
      <header className="page-header page-header-split">
        <div>
          <p className="eyebrow">A different way to discover</p>
          <h1>
            Collections<sup>{pad2(collections.length)}</sup>
          </h1>
        </div>
        <p>
          Some films are better in conversation.
          <br />
          Follow a movement, a mood, a shared idea.
        </p>
      </header>

      <Suspense fallback={<ContentRowSkeleton count={2} />}>
        <PublishedCollectionsSection />
      </Suspense>

      <FixtureNotice compact />
      {collections.length > 0 ? (
        <div className="collection-grid collections-index">
          {collections.map((collection, i) => (
            <CollectionTile key={collection.slug} collection={collection} index={i} />
          ))}
        </div>
      ) : (
        <EmptyArchive
          title="Threads waiting to be woven."
          description="Editorial collections will appear as the verified catalogue grows. No invented popularity, no filler."
        />
      )}
    </ConsumerShell>
  );
}
