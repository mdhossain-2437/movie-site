"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { KeyArt } from "@/components/art/key-art";
import { Badge } from "@/components/ui";
import {
  getCinevaFilmBySlug,
  getCinevaPersonalizedRecommendations,
} from "@/lib/catalogue/cineva-database";
import { readRecentSeedSlugs } from "@/lib/catalogue/recent-seeds";

const EMPTY_SEEDS: readonly string[] = [];
let cachedSeedKey = "";
let cachedSeedArray: readonly string[] = EMPTY_SEEDS;

function subscribeStorage(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getClientSeedSnapshot(): readonly string[] {
  const next = readRecentSeedSlugs();
  const key = next.join(",");
  if (key !== cachedSeedKey) {
    cachedSeedKey = key;
    cachedSeedArray = next;
  }
  return cachedSeedArray;
}

function getServerSeedSnapshot(): readonly string[] {
  return EMPTY_SEEDS;
}

const CURATED_TASTE_PROFILES = [
  {
    id: "history",
    label: "Your Recent Activity",
    defaultSeeds: ["the-obsidian-watchman", "the-last-monsoon"],
  },
  {
    id: "noir",
    label: "Riverfront Noir & Mystery",
    defaultSeeds: ["the-last-monsoon", "buriganga-files"],
  },
  {
    id: "heroic",
    label: "Heroic Multiverse & Sci-Fi",
    defaultSeeds: ["iron-eclipse", "voyage-beyond-stars"],
  },
  {
    id: "vigilante",
    label: "Dark Vigilante Mythos",
    defaultSeeds: ["the-obsidian-watchman", "syndicate-of-ash"],
  },
] as const;

export function PersonalizedRecommendationsRail() {
  const [activeProfile, setActiveProfile] =
    useState<(typeof CURATED_TASTE_PROFILES)[number]["id"]>("history");
  const [serverHistorySeeds, setServerHistorySeeds] = useState<readonly string[]>(EMPTY_SEEDS);
  const historySeeds = useSyncExternalStore(
    subscribeStorage,
    getClientSeedSnapshot,
    getServerSeedSnapshot,
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    fetch("/api/v1/recommendations?limit=4", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as {
          seedSource?: string;
          seedSlugs?: string[];
        };
      })
      .then((payload) => {
        if (
          !cancelled &&
          payload?.seedSource === "watch_history" &&
          Array.isArray(payload.seedSlugs) &&
          payload.seedSlugs.length > 0
        ) {
          setServerHistorySeeds(payload.seedSlugs);
        }
      })
      .catch(() => {
        // Fallback to local or editorial preset seeds
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const effectiveSeeds = useMemo(() => {
    if (activeProfile === "history") {
      if (serverHistorySeeds.length > 0) {
        return serverHistorySeeds;
      }
      if (historySeeds.length > 0) {
        return historySeeds;
      }
    }
    const preset = CURATED_TASTE_PROFILES.find((p) => p.id === activeProfile);
    return preset ? [...preset.defaultSeeds] : ["the-last-monsoon"];
  }, [activeProfile, historySeeds, serverHistorySeeds]);

  const recommendations = useMemo(
    () => getCinevaPersonalizedRecommendations(effectiveSeeds, 4),
    [effectiveSeeds],
  );

  const seedLabels = useMemo(
    () =>
      effectiveSeeds
        .slice(0, 2)
        .map((s) => getCinevaFilmBySlug(s)?.localizedTitleEn)
        .filter((x): x is string => Boolean(x)),
    [effectiveSeeds],
  );

  return (
    <section
      aria-labelledby="personalized-rec-heading"
      data-testid="personalized-recommendations-rail"
      className="space-y-6"
    >
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">CINEVA Similarity Graph Engine</Badge>
            <span className="text-text-muted font-mono text-xs">
              IDF Cosine + Director / Cast / Studio Overlap + Bayesian Prior
            </span>
          </div>
          <h2
            id="personalized-rec-heading"
            className="font-display text-text text-2xl font-bold tracking-tight sm:text-4xl"
          >
            Recommended For You
          </h2>
          {seedLabels.length > 0 ? (
            <p className="text-text-secondary text-xs sm:text-sm">
              Computed live from seed works:{" "}
              <span className="text-text font-semibold">{seedLabels.join(" + ")}</span>
            </p>
          ) : null}
        </div>

        <div
          role="group"
          aria-label="Recommendation taste profile"
          className="flex flex-wrap items-center gap-2"
        >
          {CURATED_TASTE_PROFILES.map((profile) => {
            const active = activeProfile === profile.id;
            return (
              <button
                key={profile.id}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveProfile(profile.id)}
                className={`rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center border px-3.5 py-1.5 font-mono text-xs font-semibold transition-colors motion-reduce:transition-none md:min-h-9 ${
                  active
                    ? "border-accent bg-accent text-on-accent"
                    : "border-border bg-surface-1 text-text-secondary hover:border-border-strong hover:text-text"
                }`}
              >
                {profile.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {recommendations.map(({ film, match }) => (
          <article
            key={film.slug}
            className="group border-border bg-surface-1 hover:border-accent/65 flex flex-col justify-between overflow-hidden rounded-xl border transition-colors duration-200 motion-reduce:transition-none"
          >
            <Link href={`/movies/${film.slug}`} className="block">
              <div className="border-border relative aspect-video w-full overflow-hidden border-b">
                <KeyArt
                  spec={film.art}
                  variant="backdrop"
                  className="pointer-events-none h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
                />
                <div className="art-grain" />
                <div className="from-canvas/45 to-canvas/90 pointer-events-none absolute inset-0 bg-gradient-to-b via-transparent" />

                <div className="absolute top-2.5 right-2.5 left-2.5 flex items-center justify-between gap-2">
                  <span className="border-success/50 bg-canvas/90 text-success inline-flex items-center gap-1 rounded-xs border px-2 py-0.5 font-mono text-[11px] font-bold">
                    <span aria-hidden="true">◆</span>
                    <span>{match.matchPercentage}% Match</span>
                  </span>
                  <span className="border-border-strong bg-canvas/90 text-text rounded-xs border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase">
                    {film.kind === "SERIES"
                      ? `Series · ${film.seasons?.length ?? 1}S`
                      : `${film.runtimeMinutes}m`}
                  </span>
                </div>
              </div>

              <div className="space-y-2 p-4">
                <p className="text-text-muted font-mono text-[11px] uppercase">
                  {film.releaseYear} · {film.studio}
                </p>
                <h3 className="font-display text-text group-hover:text-accent text-lg font-bold transition-colors motion-reduce:transition-none">
                  {film.localizedTitleEn}
                </h3>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {match.reasons.slice(0, 2).map((reason) => (
                    <span
                      key={reason}
                      className="border-accent/35 bg-accent/10 text-text-secondary rounded-xs border px-2 py-0.5 font-mono text-[10px]"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
                <p className="text-text-secondary line-clamp-2 pt-1 text-xs leading-relaxed">
                  {film.synopsisEn}
                </p>
              </div>
            </Link>

            <div className="border-border flex items-center justify-between gap-2 border-t px-4 py-2.5">
              <span className="text-accent font-mono text-xs font-bold">
                WR {match.bayesianScore.toFixed(2)}
              </span>
              <Link
                href={
                  film.kind === "SERIES" ? `/watch/${film.slug}?s=1&e=1` : `/watch/${film.slug}`
                }
                aria-label={`Stream ${film.localizedTitleEn}`}
                className="border-accent/50 bg-accent/15 text-text hover:bg-accent hover:text-on-accent rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center gap-1 border px-3.5 py-1 font-mono text-xs font-semibold transition-colors motion-reduce:transition-none md:min-h-8"
              >
                <svg aria-hidden="true" className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>{film.kind === "SERIES" ? "Play S1:E1" : "Stream"}</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
