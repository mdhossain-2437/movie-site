"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KeyArt } from "@/components/art/key-art";
import { Badge } from "@/components/ui";
import type { ArtSpec } from "@/lib/catalogue/types";

export interface ContinueWatchingItemDto {
  titleId: string;
  titleSlug: string;
  titleEn: string;
  kind: "MOVIE" | "SERIES";
  releaseYear: number;
  runtimeMinutes: number;
  lastPositionSeconds: number;
  durationSeconds: number;
  progressPercent: number;
  updatedAt: string;
  studio: string;
  art: ArtSpec | null;
}

export function formatResumeClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

export function ContinueWatchingRail({
  initialItems,
}: {
  initialItems?: readonly ContinueWatchingItemDto[];
}) {
  const [items, setItems] = useState<readonly ContinueWatchingItemDto[]>(initialItems ?? []);

  useEffect(() => {
    if (initialItems !== undefined) {
      return;
    }
    let cancelled = false;
    const controller = new AbortController();

    fetch("/api/v1/continue-watching?limit=4", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as {
          authenticated?: boolean;
          continueWatching?: ContinueWatchingItemDto[];
        };
      })
      .then((payload) => {
        if (!cancelled && payload?.authenticated && Array.isArray(payload.continueWatching)) {
          setItems(payload.continueWatching);
        }
      })
      .catch(() => {
        // Silent fallback when offline or unauthenticated
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [initialItems]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="continue-watching-heading"
      data-testid="continue-watching-rail"
      className="space-y-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">Synced Playback Progress</Badge>
            <span className="text-text-muted font-mono text-xs">
              Authenticated Theater Session Resume
            </span>
          </div>
          <h2
            id="continue-watching-heading"
            className="font-display text-text text-2xl font-bold tracking-tight sm:text-4xl"
          >
            Continue Watching
          </h2>
        </div>
        <Link
          href="/account"
          className="border-border bg-surface-1 text-text-secondary hover:border-border-strong hover:text-text rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center border px-4 py-1.5 font-mono text-xs font-semibold transition-colors motion-reduce:transition-none md:min-h-9"
        >
          Manage Account
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const remainingMinutes = Math.max(
            1,
            Math.ceil((item.durationSeconds - item.lastPositionSeconds) / 60),
          );
          const watchHref = `/watch/${item.titleSlug}?t=${item.lastPositionSeconds}`;

          return (
            <article
              key={item.titleSlug}
              className="group border-border bg-surface-1 hover:border-accent/65 flex flex-col justify-between overflow-hidden rounded-xl border transition-colors duration-200 motion-reduce:transition-none"
            >
              <Link href={watchHref} className="block">
                <div className="border-border bg-surface-2 relative aspect-video w-full overflow-hidden border-b">
                  {item.art ? (
                    <KeyArt
                      spec={item.art}
                      variant="backdrop"
                      className="pointer-events-none h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
                    />
                  ) : null}
                  <div className="art-grain" />
                  <div className="from-canvas/40 to-canvas/90 pointer-events-none absolute inset-0 bg-gradient-to-b via-transparent" />

                  <div className="absolute top-2.5 right-2.5 left-2.5 flex items-center justify-between gap-2">
                    <span className="border-accent/50 bg-canvas/90 text-accent inline-flex items-center gap-1.5 rounded-xs border px-2 py-0.5 font-mono text-[11px] font-bold">
                      <svg aria-hidden="true" className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span>Resume {formatResumeClock(item.lastPositionSeconds)}</span>
                    </span>
                    <span className="border-border-strong bg-canvas/90 text-text-secondary rounded-xs border px-2 py-0.5 font-mono text-[10px] font-semibold">
                      {remainingMinutes}m left
                    </span>
                  </div>

                  {/* Progress Track */}
                  <div className="bg-surface-3 absolute inset-x-0 bottom-0 h-1.5">
                    <div
                      role="progressbar"
                      aria-label={`${item.titleEn} playback progress`}
                      aria-valuenow={item.progressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      style={{ width: `${item.progressPercent}%` }}
                      className="bg-accent h-full transition-all duration-200 motion-reduce:transition-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 p-4">
                  <p className="text-text-muted font-mono text-[11px] uppercase">
                    {item.releaseYear} · {item.studio}
                  </p>
                  <h3 className="font-display text-text group-hover:text-accent line-clamp-1 text-lg font-bold transition-colors motion-reduce:transition-none">
                    {item.titleEn}
                  </h3>
                </div>
              </Link>

              <div className="border-border flex items-center justify-between gap-2 border-t px-4 py-2.5">
                <span className="text-text-secondary font-mono text-xs">
                  {item.progressPercent}% watched
                </span>
                <Link
                  href={watchHref}
                  aria-label={`Resume ${item.titleEn} at ${formatResumeClock(item.lastPositionSeconds)}`}
                  className="border-accent bg-accent text-on-accent hover:bg-ember-glow rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 border px-3.5 py-1 font-mono text-xs font-bold transition-colors motion-reduce:transition-none md:min-h-8"
                >
                  <svg aria-hidden="true" className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Resume</span>
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
