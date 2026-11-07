import Link from "next/link";
import type { TmdbCatalogItem } from "@/lib/metadata/tmdb-types";
import { TmdbArtwork } from "./tmdb-artwork";

export interface TmdbTitleCardProps {
  item: TmdbCatalogItem;
  matchPercentage?: number;
  matchReason?: string;
  rankNumber?: number;
}

function formatCompactVotes(votes: number): string {
  if (votes >= 1_000_000) return `${(votes / 1_000_000).toFixed(1)}M`;
  if (votes >= 1_000) return `${(votes / 1_000).toFixed(1)}k`;
  return String(votes);
}

export function TmdbTitleCard({
  item,
  matchPercentage,
  matchReason,
  rankNumber,
}: TmdbTitleCardProps) {
  return (
    <article className="group border-border bg-surface-1 hover:border-border-strong relative flex flex-col justify-between overflow-hidden rounded-lg border transition-[transform,border-color] duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none">
      <Link
        href={item.detailHref}
        className="focus-visible:outline-accent flex flex-1 flex-col focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <div className="border-border bg-surface-2 relative aspect-[2/3] w-full overflow-hidden border-b">
          <TmdbArtwork
            src={item.posterUrl}
            alt={`${item.title} poster`}
            fallbackArt={item.fallbackArt}
            variant="poster"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
          />
          <div className="art-grain pointer-events-none" />
          <div
            aria-hidden="true"
            className="from-canvas/20 via-canvas/10 to-surface-1 pointer-events-none absolute inset-0 bg-gradient-to-b"
          />

          <div className="relative z-10 flex h-full flex-col justify-between p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                {typeof rankNumber === "number" ? (
                  <span className="bg-accent text-on-accent rounded-xs px-2 py-0.5 font-mono text-[11px] font-bold">
                    #{rankNumber}
                  </span>
                ) : null}
                <span className="border-border-strong bg-canvas/85 text-text rounded-xs border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase backdrop-blur-xs">
                  {item.kind === "SERIES" ? "TV Series" : "Movie"}
                </span>
              </div>

              <span
                title={`Bayesian Weighted Rating ${item.bayesianScore.toFixed(2)} (${item.voteCount} votes)`}
                className="border-accent/55 bg-canvas/85 text-accent inline-flex items-center gap-1 rounded-xs border px-2 py-0.5 font-mono text-[11px] font-bold backdrop-blur-xs"
              >
                <svg aria-hidden="true" className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77 5.82 21 7 14.14 2 9.27l7.1-1.01L12 2z" />
                </svg>
                <span>{item.bayesianScore.toFixed(1)}</span>
              </span>
            </div>

            {typeof matchPercentage === "number" ? (
              <div>
                <span className="border-success/45 bg-canvas/90 text-success inline-flex items-center gap-1 rounded-xs border px-2 py-0.5 font-mono text-[11px] font-bold backdrop-blur-xs">
                  <span>{matchPercentage}% Match</span>
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            <p className="text-text-muted font-mono text-[11px] tracking-wider uppercase">
              {item.originalLanguage.toUpperCase()}
              {item.releaseYear ? ` · ${item.releaseYear}` : ""}
              {item.voteCount > 0 ? ` · ${formatCompactVotes(item.voteCount)} votes` : ""}
            </p>
            <h3 className="font-display text-text group-hover:text-accent mt-1 line-clamp-1 text-base leading-snug font-bold transition-colors motion-reduce:transition-none">
              {item.title}
            </h3>
            {matchReason ? (
              <p className="text-accent mt-1 line-clamp-1 font-mono text-[11px] font-medium">
                {matchReason}
              </p>
            ) : item.genreLabels.length > 0 ? (
              <p className="text-text-muted mt-1 line-clamp-1 font-mono text-[11px]">
                {item.genreLabels.slice(0, 3).join(" · ")}
              </p>
            ) : null}
            <p className="text-text-secondary mt-1.5 line-clamp-2 text-xs leading-5">
              {item.synopsis}
            </p>
          </div>

          <div className="border-border mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            <span className="border-warning/35 bg-warning/15 text-warning inline-flex items-center gap-1.5 rounded-xs border px-2 py-0.5 font-mono text-[10px] font-semibold">
              <svg
                aria-hidden="true"
                className="h-3 w-3 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4l2.5 2.5" strokeLinecap="round" />
              </svg>
              <span>Metadata Index</span>
            </span>
            <span className="text-accent font-mono text-[11px] font-semibold">Inspect →</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
