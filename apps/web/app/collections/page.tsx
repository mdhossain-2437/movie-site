import { getDatabase, listPublicCollections } from "@movie/db";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { KeyArt } from "@/components/art/key-art";
import { EmptyArchive } from "@/components/catalogue/common";
import { CollectionTile } from "@/components/catalogue/editorial";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, ButtonLink, ContentRowSkeleton } from "@/components/ui";
import { CINEVA_COLLECTIONS, getCinevaFilmBySlug } from "@/lib/catalogue/cineva-database";
import { pad2 } from "@/lib/catalogue/format";
import { listCollections } from "@/lib/catalogue/repository";

export const metadata: Metadata = {
  title: "Collections · CINEVA",
  description:
    "Curated retrospectives, nocturnal thrillers, and restored world cinema vaults on CINEVA.",
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
  const totalCount = CINEVA_COLLECTIONS.length + collections.length;

  return (
    <ConsumerShell>
      <header className="page-header page-header-split">
        <div>
          <p className="eyebrow">A different way to discover</p>
          <h1>
            Collections<sup>{pad2(totalCount)}</sup>
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

      {/* CINEVA Streaming & Thematic Vaults */}
      <section aria-labelledby="cineva-signature-vaults" className="mb-16 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-accent font-mono text-xs font-semibold tracking-widest uppercase">
              Streaming &amp; Anamorphic Programs
            </p>
            <h2
              id="cineva-signature-vaults"
              className="font-display text-text text-2xl font-bold sm:text-3xl"
            >
              Signature CINEVA Vaults
            </h2>
          </div>
          <Badge tone="accent">{CINEVA_COLLECTIONS.length} Active Programs</Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {CINEVA_COLLECTIONS.map((col) => {
            const leadFilm = getCinevaFilmBySlug(col.filmSlugs[0] ?? "");
            return (
              <article
                key={col.id}
                className="group border-border bg-surface-1 hover:border-accent/60 flex flex-col justify-between overflow-hidden rounded-xl border transition-colors duration-200 motion-reduce:transition-none"
              >
                {leadFilm ? (
                  <div className="border-border relative aspect-[21/9] w-full overflow-hidden border-b">
                    <KeyArt
                      spec={leadFilm.art}
                      variant="backdrop"
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
                    />
                    <div
                      aria-hidden="true"
                      className="art-grain pointer-events-none absolute inset-0 opacity-30"
                    />
                    <div
                      aria-hidden="true"
                      className="from-canvas/35 via-canvas/35 to-canvas pointer-events-none absolute inset-0 bg-gradient-to-b"
                    />
                    <div className="relative z-10 flex h-full items-end justify-between p-5">
                      <span className="text-accent font-mono text-xs font-semibold tracking-widest uppercase">
                        {col.eyebrow}
                      </span>
                      <Badge tone="neutral">{col.filmSlugs.length} Films</Badge>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className="font-display text-text group-hover:text-accent text-2xl font-bold transition-colors motion-reduce:transition-none">
                      <Link href={`/collections/${col.slug}`}>{col.titleEn}</Link>
                    </h3>
                    <p className="text-text-secondary mt-1 text-sm" lang="bn">
                      {col.titleBn}
                    </p>
                    <p className="text-text-secondary mt-3 text-sm leading-relaxed">
                      {col.description}
                    </p>
                  </div>

                  <div className="border-border mt-6 flex items-center justify-between border-t pt-4">
                    <span className="text-text-muted font-mono text-xs">
                      HD Streaming · 7-Strip Showcase
                    </span>
                    <ButtonLink href={`/collections/${col.slug}`} variant="primary" size="sm">
                      Enter Vault
                    </ButtonLink>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {collections.length > 0 ? (
        <section aria-labelledby="historical-essays-heading" className="space-y-6">
          <div className="space-y-1">
            <p className="text-text-muted font-mono text-xs tracking-widest uppercase">
              World Cinema Movements
            </p>
            <h2
              id="historical-essays-heading"
              className="font-display text-text text-2xl font-bold"
            >
              Historical Cinema Essays
            </h2>
          </div>
          <div className="collection-grid collections-index">
            {collections.map((collection, i) => (
              <CollectionTile key={collection.slug} collection={collection} index={i} />
            ))}
          </div>
        </section>
      ) : (
        <EmptyArchive
          title="Threads waiting to be woven."
          description="Editorial collections will appear as the verified catalogue grows."
        />
      )}
    </ConsumerShell>
  );
}
