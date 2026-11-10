import type { MultiSourceRatingsData, RatingCardItem } from "@/lib/metadata/omdb-types";

export interface VerifiedRatingsBreakdownProps {
  ratings: MultiSourceRatingsData | null | undefined;
  className?: string;
}

function RatingGlyph({ glyph }: { glyph: RatingCardItem["glyph"] }) {
  switch (glyph) {
    case "star":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      );
    case "gauge":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      );
    case "meter":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      );
    case "pulse":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case "diamond":
    default:
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <polygon points="12,2 22,12 12,22 2,12" />
        </svg>
      );
  }
}

export function VerifiedRatingsBreakdown({
  ratings,
  className = "",
}: VerifiedRatingsBreakdownProps) {
  if (!ratings || ratings.items.length === 0) {
    return null;
  }

  return (
    <section
      id="ratings-breakdown"
      aria-labelledby="ratings-breakdown-heading"
      data-testid="verified-ratings-breakdown"
      className={`cg-surface space-y-6 p-6 sm:p-8 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-accent font-mono text-xs tracking-widest uppercase">
            Multi-Registry Score Ledger
          </p>
          <h2
            id="ratings-breakdown-heading"
            className="font-display text-text text-xl font-bold sm:text-2xl"
          >
            Verified Ratings &amp; Critic Consensus
          </h2>
          <p className="text-text-secondary mt-1 text-xs sm:text-sm">
            Exact scores, critic meters, and audience vote tallies aggregated across OMDb, IMDb,
            Rotten Tomatoes, Metacritic, and TMDB.
          </p>
        </div>
        <span className="border-border bg-surface-2 text-text-secondary rounded-pill inline-flex items-center border px-3 py-1 font-mono text-xs">
          {ratings.items.length} {ratings.items.length === 1 ? "Source" : "Sources"} Active
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ratings.items.map((item) => (
          <article
            key={item.id}
            data-testid={`rating-card-${item.id}`}
            className="border-border bg-surface-2 hover:border-border-strong flex flex-col justify-between rounded-xl border p-4 transition-colors motion-reduce:transition-none"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-accent" aria-hidden="true">
                    <RatingGlyph glyph={item.glyph} />
                  </span>
                  <span className="text-text font-sans text-xs font-bold">{item.shortName}</span>
                </div>
                <span className="border-border bg-surface-3 text-text-muted rounded-xs border px-1.5 py-0.5 font-mono text-[10px]">
                  {item.scale || "SCORE"}
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-text font-mono text-3xl font-extrabold tracking-tight">
                  {item.score}
                </span>
                {item.scale && item.scale !== "%" && !item.score.includes("/") ? (
                  <span className="text-text-muted font-mono text-xs">{item.scale}</span>
                ) : null}
              </div>

              <div
                aria-hidden="true"
                className="bg-surface-3 mt-3 h-1.5 w-full overflow-hidden rounded-full"
              >
                <div
                  className="bg-accent h-full rounded-full transition-all duration-200 motion-reduce:transition-none"
                  style={{ width: `${Math.min(100, Math.max(0, item.scorePercent))}%` }}
                />
              </div>
            </div>

            <div className="border-border mt-4 border-t pt-3">
              <p className="text-text-secondary truncate font-sans text-xs font-semibold">
                {item.sourceName}
              </p>
              <p className="text-text-muted mt-0.5 font-mono text-[11px]">
                {item.votes ?? item.subtitle}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
