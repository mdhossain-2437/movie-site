"use client";

import { useState } from "react";
import { Badge, Button, ButtonLink, Spinner } from "@/components/ui";
import type { TmdbEpisodeItem, TmdbMediaKind, TmdbSeasonSummary } from "@/lib/metadata/tmdb-types";
import { TmdbArtwork } from "./tmdb-artwork";
import { buildDeterministicArtSpecForTmdbId } from "@/lib/metadata/tmdb-types";

export function TmdbSeriesSeasonGuide({
  tvId,
  seriesTitle,
  seasons,
  initialEpisodes,
}: {
  tvId: number;
  seriesTitle: string;
  seasons: TmdbSeasonSummary[];
  initialEpisodes: TmdbEpisodeItem[];
}) {
  const firstSeason = seasons[0]?.seasonNumber ?? 1;
  const [selectedSeason, setSelectedSeason] = useState<number>(firstSeason);
  const [episodesBySeason, setEpisodesBySeason] = useState<Record<number, TmdbEpisodeItem[]>>({
    [firstSeason]: initialEpisodes,
  });
  const [loadingSeason, setLoadingSeason] = useState<number | null>(null);

  const handleSelectSeason = async (seasonNumber: number) => {
    setSelectedSeason(seasonNumber);
    if (episodesBySeason[seasonNumber]) return;

    setLoadingSeason(seasonNumber);
    try {
      const res = await fetch(`/api/v1/tmdb/tv/${tvId}?season=${seasonNumber}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setEpisodesBySeason((prev) => ({
          ...prev,
          [seasonNumber]: Array.isArray(data.episodes) ? data.episodes : [],
        }));
      }
    } finally {
      setLoadingSeason(null);
    }
  };

  const activeEpisodes = episodesBySeason[selectedSeason] ?? [];

  return (
    <section
      aria-labelledby="tmdb-episodes-heading"
      data-testid="tmdb-series-episodes-guide"
      className="space-y-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-accent font-mono text-xs tracking-widest uppercase">
            TMDB Episodic Broadcast Ledger
          </p>
          <h2 id="tmdb-episodes-heading" className="font-display text-text text-2xl font-bold">
            Seasons &amp; Episodes ({seasons.length})
          </h2>
        </div>

        <div
          role="group"
          aria-label="Select TV season"
          className="flex flex-wrap items-center gap-2"
        >
          {seasons.slice(0, 12).map((s) => {
            const active = selectedSeason === s.seasonNumber;
            const busy = loadingSeason === s.seasonNumber;
            return (
              <button
                key={s.seasonNumber}
                type="button"
                aria-pressed={active}
                aria-busy={busy}
                disabled={busy}
                onClick={() => void handleSelectSeason(s.seasonNumber)}
                className={`rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 border px-4 py-1.5 font-mono text-xs font-semibold transition-colors motion-reduce:transition-none md:min-h-9 ${
                  active
                    ? "border-accent bg-accent text-on-accent"
                    : "border-border bg-surface-1 text-text-secondary hover:border-border-strong hover:text-text"
                }`}
              >
                {busy ? <Spinner size="sm" label={`Loading Season ${s.seasonNumber}…`} /> : null}
                <span>
                  {s.name} ({s.episodeCount})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loadingSeason === selectedSeason ? (
        <div className="border-border bg-surface-1 flex items-center justify-center gap-3 rounded-xl border p-8">
          <Spinner size="md" label="Loading season episodes…" />
          <span className="text-text-secondary font-mono text-xs">
            Fetching Season {selectedSeason} episode ledger…
          </span>
        </div>
      ) : activeEpisodes.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeEpisodes.slice(0, 24).map((ep) => (
            <article
              key={`s${ep.seasonNumber}-e${ep.episodeNumber}`}
              className="border-border bg-surface-1 flex flex-col justify-between overflow-hidden rounded-xl border"
            >
              <div className="border-border bg-surface-2 relative aspect-video w-full overflow-hidden border-b">
                <TmdbArtwork
                  src={ep.stillUrl}
                  alt={`${seriesTitle} S${ep.seasonNumber}:E${ep.episodeNumber} — ${ep.name}`}
                  fallbackArt={buildDeterministicArtSpecForTmdbId(tvId + ep.episodeNumber)}
                  variant="backdrop"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                />
                <div className="art-grain pointer-events-none" />
                <div className="relative z-10 flex items-center justify-between p-3">
                  <span className="border-accent/45 bg-canvas/85 text-accent rounded-xs border px-2 py-0.5 font-mono text-[11px] font-bold">
                    S{ep.seasonNumber}:E{ep.episodeNumber}
                  </span>
                  {ep.runtimeMinutes ? (
                    <span className="border-border-strong bg-canvas/85 text-text-secondary rounded-xs border px-2 py-0.5 font-mono text-[10px]">
                      {ep.runtimeMinutes}m
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-text line-clamp-1 text-base font-bold">
                    {ep.name}
                  </h3>
                  {ep.voteAverage > 0 ? (
                    <span className="text-accent font-mono text-xs font-semibold">
                      ★ {ep.voteAverage.toFixed(1)}
                    </span>
                  ) : null}
                </div>
                {ep.airDate ? (
                  <p className="text-text-muted font-mono text-[11px]">Aired {ep.airDate}</p>
                ) : null}
                <p className="text-text-secondary line-clamp-3 text-xs leading-relaxed">
                  {ep.overview}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-text-muted font-mono text-xs">
          Episode metadata for Season {selectedSeason} has not yet been published upstream.
        </p>
      )}
    </section>
  );
}

export function TmdbOperatorImportControl({
  mediaKind,
  tmdbId,
  canImport,
}: {
  mediaKind: TmdbMediaKind;
  tmdbId: number;
  canImport: boolean;
}) {
  const [isImporting, setIsImporting] = useState(false);
  const [importedSlug, setImportedSlug] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  if (!canImport) return null;

  const handleImport = async () => {
    setIsImporting(true);
    setImportError(null);
    try {
      const res = await fetch("/api/v1/admin/tmdb/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaKind,
          tmdbId,
          licenseConfirmed: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail ?? "Import failed");
      }
      setImportedSlug(data.slug);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Unable to import draft");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="border-border bg-surface-1 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge tone="accent">Operator Control Plane</Badge>
          <span className="text-text font-mono text-xs font-semibold">
            Stage Metadata into Local Draft Ledger
          </span>
        </div>
        <p className="text-text-secondary text-xs">
          Imports verified title metadata as `DRAFT`. Publishing remains gated by `evaluateRights`
          until distribution rights and packaged media are attached.
        </p>
        {importError ? <p className="text-danger font-mono text-xs">{importError}</p> : null}
      </div>

      {importedSlug ? (
        <ButtonLink href="/admin/titles" variant="primary" size="sm">
          Draft Created ({importedSlug}) → Open Admin
        </ButtonLink>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isImporting}
          aria-busy={isImporting}
          onClick={() => void handleImport()}
        >
          {isImporting ? (
            <>
              <Spinner size="sm" label="Importing TMDB draft…" />
              <span>Staging Draft…</span>
            </>
          ) : (
            "Stage into Local Draft Catalogue"
          )}
        </Button>
      )}
    </div>
  );
}
