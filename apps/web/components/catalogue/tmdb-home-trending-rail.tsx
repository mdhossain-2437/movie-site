"use client";

import { useEffect, useState } from "react";
import { Badge, ButtonLink, Spinner } from "@/components/ui";
import { TMDB_OFFICIAL_ATTRIBUTION, type TmdbCatalogItem } from "@/lib/metadata/tmdb-types";
import { TmdbTitleCard } from "./tmdb-title-card";

const QUICK_FEEDS = [
  { id: "trending", label: "Trending This Week", query: "mode=trending&kind=ALL&limit=8" },
  {
    id: "top_rated",
    label: "Top Rated All-Time",
    query: "mode=top_rated&kind=MOVIE&sort=vote_average.desc&limit=8",
  },
  { id: "marvel", label: "Marvel Studios", query: "mode=discover&studio=marvel&limit=8" },
  { id: "dc", label: "DC Studios", query: "mode=discover&studio=dc&limit=8" },
  { id: "sony", label: "Sony & Columbia", query: "mode=discover&studio=sony&limit=8" },
  { id: "fox", label: "20th Century (Fox)", query: "mode=discover&studio=fox&limit=8" },
  { id: "series", label: "Trending TV Series", query: "mode=trending&kind=SERIES&limit=8" },
] as const;

export function TmdbHomeTrendingRail() {
  const [activeTab, setActiveTab] = useState<(typeof QUICK_FEEDS)[number]["id"]>("trending");
  const [items, setItems] = useState<TmdbCatalogItem[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const feed = QUICK_FEEDS.find((f) => f.id === activeTab) ?? QUICK_FEEDS[0];

    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/tmdb/discover?${feed.query}`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          if (!cancelled) setConfigured(false);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setConfigured(Boolean(data.configured));
        setItems(Array.isArray(data.items) ? data.items.slice(0, 8) : []);
      } catch {
        if (!cancelled) setConfigured(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  if (configured === false) {
    return null;
  }

  return (
    <section
      aria-labelledby="tmdb-home-rail-heading"
      data-testid="tmdb-home-trending-rail"
      className="space-y-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">Live TMDB v3 Global Index</Badge>
            <Badge tone="neutral">Marvel · DC · Sony · 20th Century · TV Series</Badge>
          </div>
          <h2
            id="tmdb-home-rail-heading"
            className="font-display text-text text-2xl font-bold sm:text-3xl"
          >
            Global Box Office, Franchises &amp; Series Index
          </h2>
          <p className="text-text-secondary text-sm">
            Live global film &amp; TV metadata synced via TMDB API alongside CINEVA’s rights-cleared
            streaming vault.
          </p>
        </div>
        <ButtonLink href="/tmdb" variant="primary" size="sm">
          Open Full TMDB Explorer →
        </ButtonLink>
      </div>

      <div
        role="group"
        aria-label="Select live TMDB feed"
        className="flex flex-wrap items-center gap-2"
      >
        {QUICK_FEEDS.map((feed) => {
          const active = activeTab === feed.id;
          return (
            <button
              key={feed.id}
              type="button"
              aria-pressed={active}
              aria-busy={isLoading && active}
              disabled={isLoading}
              onClick={() => setActiveTab(feed.id)}
              className={`rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 border px-4 py-1.5 text-xs font-semibold transition-colors motion-reduce:transition-none md:min-h-9 ${
                active
                  ? "border-accent bg-accent text-on-accent"
                  : "border-border bg-surface-1 text-text-secondary hover:border-border-strong hover:text-text"
              }`}
            >
              {isLoading && active ? <Spinner size="sm" label="Loading feed…" /> : null}
              <span>{feed.label}</span>
            </button>
          );
        })}
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, idx) => (
            <TmdbTitleCard
              key={`${item.mediaKind}-${item.tmdbId}`}
              item={item}
              rankNumber={activeTab === "top_rated" ? idx + 1 : undefined}
            />
          ))}
        </div>
      ) : isLoading ? (
        <div className="border-border bg-surface-1 flex items-center justify-center gap-3 rounded-xl border p-10">
          <Spinner size="md" label="Loading live TMDB global titles…" />
          <span className="text-text-secondary font-mono text-xs">
            Loading live TMDB global catalogue…
          </span>
        </div>
      ) : null}

      <p className="text-text-muted font-mono text-[11px]">{TMDB_OFFICIAL_ATTRIBUTION}</p>
    </section>
  );
}
