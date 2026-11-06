import type { Metadata } from "next";
import { ConsumerShell } from "@/components/layout/site-shell";
import { EmptyArchive, FixtureNotice } from "@/components/catalogue/common";
import { CollectionTile } from "@/components/catalogue/editorial";
import { listCollections } from "@/lib/catalogue/repository";
import { pad2 } from "@/lib/catalogue/format";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Editorial paths through the film archive. Follow a movement, a mood, or a shared idea.",
};
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
