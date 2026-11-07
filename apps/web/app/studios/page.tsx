import type { Metadata } from "next";
import Link from "next/link";
import { KeyArt } from "@/components/art/key-art";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, ButtonLink } from "@/components/ui";
import {
  CINEVA_SPECIAL_CATEGORIES,
  CINEVA_STUDIOS,
  queryCinevaCatalogue,
} from "@/lib/catalogue/cineva-database";

export const metadata: Metadata = {
  title: "Studios & Universe Banners · CINEVA",
  description:
    "Browse CINEVA production houses, major studio banners, heroic multiverse divisions, dark vigilante works, and 4K public-domain restoration vaults.",
};

export default function StudiosDirectoryPage() {
  return (
    <ConsumerShell>
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">Production Houses &amp; Universe Hubs</Badge>
            <Badge tone="neutral">{CINEVA_STUDIOS.length} Verified Studio Banners</Badge>
          </div>
          <h1 className="font-display text-text text-3xl font-bold sm:text-5xl">Studios</h1>
          <p className="cg-prose text-text-secondary text-base leading-7">
            Explore every major CINEVA studio division—from interconnected heroic cosmic sagas and
            graphic-noir vigilante banners to 65mm large-format tentpoles and 4K archival vaults.
          </p>
        </div>
        <ButtonLink href="/tmdb?mode=discover&studio=marvel" variant="secondary" size="sm">
          Live TMDB Studios (Marvel · DC · Sony · Fox) →
        </ButtonLink>
      </header>

      {/* Special Categories Quick Strip */}
      <section aria-labelledby="universe-hubs-heading" className="mb-12 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="universe-hubs-heading" className="font-display text-text text-xl font-bold">
            Special Categories &amp; Franchises
          </h2>
          <ButtonLink href="/movies?sort=top_rated" variant="ghost" size="sm">
            Open Full Explorer →
          </ButtonLink>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CINEVA_SPECIAL_CATEGORIES.map((cat) => {
            const count = queryCinevaCatalogue({ category: cat.slug }).length;
            return (
              <Link
                key={cat.slug}
                href={`/movies?category=${cat.slug}`}
                className="group border-border bg-surface-1 hover:border-accent/60 flex min-h-11 flex-col justify-between rounded-xl border p-5 transition-colors motion-reduce:transition-none"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-accent font-mono text-[11px] font-semibold tracking-wider uppercase">
                      {cat.eyebrow}
                    </span>
                    <span className="border-border-strong bg-surface-2 text-text-secondary rounded-xs border px-2 py-0.5 font-mono text-[11px]">
                      {count} Titles
                    </span>
                  </div>
                  <h3 className="font-display text-text group-hover:text-accent text-xl font-bold transition-colors motion-reduce:transition-none">
                    {cat.titleEn}
                  </h3>
                  <p className="text-text-secondary text-xs leading-relaxed">{cat.description}</p>
                </div>
                <p className="text-accent mt-4 font-mono text-xs font-semibold">
                  Explore Category →
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Studio Banners Grid */}
      <section aria-labelledby="studios-grid-heading" className="space-y-5">
        <h2 id="studios-grid-heading" className="font-display text-text text-2xl font-bold">
          Production Houses &amp; Studio Divisions
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {CINEVA_STUDIOS.map((studio) => {
            const works = queryCinevaCatalogue({ studio: studio.slug, sort: "top_rated" });
            const leadWork = works[0];
            const movieCount = works.filter((w) => w.kind === "MOVIE").length;
            const seriesCount = works.filter((w) => w.kind === "SERIES").length;

            return (
              <article
                key={studio.slug}
                className="group border-border bg-surface-1 hover:border-accent/60 overflow-hidden rounded-xl border transition-colors motion-reduce:transition-none"
              >
                <div className="border-border relative h-44 overflow-hidden border-b">
                  {leadWork ? (
                    <KeyArt
                      spec={leadWork.art}
                      variant="backdrop"
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
                    />
                  ) : null}
                  <div
                    aria-hidden="true"
                    className="from-canvas/30 via-canvas/65 to-surface-1 pointer-events-none absolute inset-0 bg-gradient-to-b"
                  />
                  <div className="relative z-10 flex h-full flex-col justify-between p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="border-border-strong bg-canvas/85 text-text-secondary rounded-xs border px-2.5 py-1 font-mono text-[11px] uppercase">
                        Est. {studio.foundedYear} · {studio.headquarters}
                      </span>
                      <span className="border-accent/50 bg-canvas/85 text-accent rounded-xs border px-2.5 py-1 font-mono text-[11px] font-bold">
                        {movieCount} Films · {seriesCount} Series
                      </span>
                    </div>
                    <div>
                      <p className="text-accent font-mono text-[11px] font-semibold tracking-wider uppercase">
                        {studio.bannerFocus}
                      </p>
                      <h3 className="font-display text-text text-2xl font-bold sm:text-3xl">
                        {studio.nameEn}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {studio.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <ButtonLink href={`/studios/${studio.slug}`} variant="primary" size="sm">
                      Open Studio Hub
                    </ButtonLink>
                    <ButtonLink
                      href={`/movies?studio=${studio.slug}`}
                      variant="secondary"
                      size="sm"
                    >
                      Filter in Explorer
                    </ButtonLink>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </ConsumerShell>
  );
}
