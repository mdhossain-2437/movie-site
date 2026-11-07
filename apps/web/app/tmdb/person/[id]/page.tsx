import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { TmdbArtwork } from "@/components/catalogue/tmdb-artwork";
import { TmdbTitleCard } from "@/components/catalogue/tmdb-title-card";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, ButtonLink, ContentRowSkeleton } from "@/components/ui";
import {
  fetchTmdbPersonDetail,
  getTmdbRuntimeStatus,
  TmdbAdapterError,
} from "@/lib/metadata/tmdb-client";
import { TMDB_OFFICIAL_ATTRIBUTION } from "@/lib/metadata/tmdb-types";

export const metadata: Metadata = {
  title: "Filmmaker & Cast Filmography · TMDB Global Index · CINEVA",
  description:
    "Explore director, showrunner, and actor global filmographies across feature films and TV series via TMDB.",
};

async function TmdbPersonSection({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const raw = await params;
  const personId = Number.parseInt(raw.id, 10);
  if (!Number.isFinite(personId) || personId <= 0) {
    notFound();
  }

  if (!getTmdbRuntimeStatus().configured) {
    notFound();
  }

  let person;
  try {
    person = await fetchTmdbPersonDetail(personId);
  } catch (err) {
    if (err instanceof TmdbAdapterError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <div className="space-y-12">
      <section className="border-border bg-surface-1 grid grid-cols-1 gap-8 rounded-2xl border p-6 sm:p-10 md:grid-cols-[220px_1fr]">
        <div className="border-border-strong bg-surface-2 relative mx-auto aspect-[2/3] w-48 overflow-hidden rounded-xl border md:mx-0 md:w-full">
          <TmdbArtwork
            src={person.profileUrl}
            alt={person.name}
            fallbackArt={person.fallbackArt}
            variant="poster"
            className="h-full w-full object-cover"
          />
          <div className="art-grain pointer-events-none" />
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{person.knownForDepartment}</Badge>
            {person.birthday ? <Badge tone="neutral">Born {person.birthday}</Badge> : null}
            {person.placeOfBirth ? <Badge tone="neutral">{person.placeOfBirth}</Badge> : null}
          </div>

          <h1 className="font-display text-text text-3xl font-bold sm:text-5xl">{person.name}</h1>

          <p className="cg-prose text-text-secondary line-clamp-6 text-sm leading-7">
            {person.biography}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <ButtonLink href="/tmdb" variant="secondary" size="sm">
              ← Back to TMDB Explorer
            </ButtonLink>
            <ButtonLink href="/people" variant="outline" size="sm">
              CINEVA Vault Filmmakers
            </ButtonLink>
          </div>
        </div>
      </section>

      {person.directedWorks.length > 0 ? (
        <section aria-labelledby="person-directed-heading" className="space-y-5">
          <h2 id="person-directed-heading" className="font-display text-text text-2xl font-bold">
            Directed &amp; Created ({person.directedWorks.length})
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {person.directedWorks.map((item) => (
              <TmdbTitleCard key={`dir-${item.mediaKind}-${item.tmdbId}`} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      {person.actedWorks.length > 0 ? (
        <section aria-labelledby="person-acted-heading" className="space-y-5">
          <h2 id="person-acted-heading" className="font-display text-text text-2xl font-bold">
            Acting Credits ({person.actedWorks.length})
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {person.actedWorks.map((item) => (
              <TmdbTitleCard key={`act-${item.mediaKind}-${item.tmdbId}`} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      <footer className="border-border bg-surface-1 rounded-lg border px-4 py-3">
        <p className="text-text-muted font-mono text-xs">{TMDB_OFFICIAL_ATTRIBUTION}</p>
      </footer>
    </div>
  );
}

export default function TmdbPersonPage(props: { params: Promise<{ id: string }> }) {
  return (
    <ConsumerShell>
      <Suspense fallback={<ContentRowSkeleton count={4} />}>
        <TmdbPersonSection params={props.params} />
      </Suspense>
    </ConsumerShell>
  );
}
