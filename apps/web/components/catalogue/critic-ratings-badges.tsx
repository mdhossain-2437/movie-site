import type { OmdbRatings } from "@/lib/metadata/omdb-client";

export interface CriticRatingsBadgesProps {
  ratings?: OmdbRatings | null;
  className?: string;
  variant?: "scorebar" | "hero" | "ledger";
}

/**
 * Lawful, Anti-Slop Critic & Open Ratings Presentation.
 * Conforms to repository design tokens (bg-surface-2, border-border, text-accent, text-text).
 * Prohibits fake third-party raster emblems, SVG tomato splats, and emojis.
 * Degrades gracefully with zero layout shifts when ratings are absent.
 */
export function CriticRatingsBadges({
  ratings,
  className = "",
  variant = "scorebar",
}: CriticRatingsBadgesProps) {
  if (!ratings) return null;

  const hasImdb = Boolean(ratings.imdbRating && ratings.imdbRating !== "N/A");
  const hasRotten = Boolean(ratings.rottenTomatoes && ratings.rottenTomatoes !== "N/A");
  const hasMetascore = Boolean(ratings.metascore && ratings.metascore !== "N/A");

  if (!hasImdb && !hasRotten && !hasMetascore) {
    return null;
  }

  if (variant === "ledger") {
    return (
      <div className={`sm:col-span-2 ${className}`.trim()} data-testid="critic-ratings-ledger">
        <dt className="text-text-muted uppercase">Critic Ratings &amp; Metascores</dt>
        <dd className="text-text mt-1 flex flex-wrap items-center gap-2 font-mono text-xs">
          {hasImdb && (
            <span>
              IMDb {ratings.imdbRating}/10
              {ratings.imdbVotes ? ` (${ratings.imdbVotes} votes)` : ""}
            </span>
          )}
          {hasRotten && (
            <span>
              {hasImdb ? " · " : ""}Rotten Tomatoes {ratings.rottenTomatoes}
            </span>
          )}
          {hasMetascore && (
            <span>
              {hasImdb || hasRotten ? " · " : ""}Metascore {ratings.metascore}/100
            </span>
          )}
        </dd>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div
        data-testid="critic-ratings-hero"
        className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}
      >
        {hasImdb && (
          <span
            data-testid="hero-critic-imdb"
            className="border-border bg-canvas/45 text-text rounded-pill inline-flex items-center gap-1 border px-2.5 py-0.5 font-mono text-[11px] backdrop-blur-xs"
          >
            <span className="text-accent font-sans font-bold">IMDb</span>
            <span>{ratings.imdbRating}</span>
          </span>
        )}
        {hasRotten && (
          <span
            data-testid="hero-critic-rotten"
            className="border-border bg-canvas/45 text-text rounded-pill inline-flex items-center gap-1 border px-2.5 py-0.5 font-mono text-[11px] backdrop-blur-xs"
          >
            <span className="text-accent font-sans font-bold">RT</span>
            <span>{ratings.rottenTomatoes}</span>
          </span>
        )}
        {hasMetascore && (
          <span
            data-testid="hero-critic-metascore"
            className="border-border bg-canvas/45 text-text rounded-pill inline-flex items-center gap-1 border px-2.5 py-0.5 font-mono text-[11px] backdrop-blur-xs"
          >
            <span className="text-accent font-sans font-bold">Meta</span>
            <span>{ratings.metascore}</span>
          </span>
        )}
      </div>
    );
  }

  // Default "scorebar" variant (Watch, Save & Score Bar)
  return (
    <div
      data-testid="critic-ratings-scorebar"
      className={`flex flex-wrap items-center gap-2 ${className}`.trim()}
    >
      {hasImdb && (
        <span
          data-testid="critic-badge-imdb"
          className="border-border bg-surface-2 text-text rounded-pill inline-flex items-center gap-1.5 border px-3 py-1 font-mono text-xs font-semibold"
        >
          <span className="text-accent font-sans font-bold">IMDb</span>
          <span>{ratings.imdbRating}</span>
          {ratings.imdbVotes ? (
            <span className="text-text-muted text-[10px] font-normal">({ratings.imdbVotes})</span>
          ) : null}
        </span>
      )}

      {hasRotten && (
        <span
          data-testid="critic-badge-rotten"
          className="border-border bg-surface-2 text-text rounded-pill inline-flex items-center gap-1.5 border px-3 py-1 font-mono text-xs font-semibold"
        >
          <span className="text-accent font-sans font-bold">Rotten Tomatoes</span>
          <span>{ratings.rottenTomatoes}</span>
        </span>
      )}

      {hasMetascore && (
        <span
          data-testid="critic-badge-metascore"
          className="border-border bg-surface-2 text-text rounded-pill inline-flex items-center gap-1.5 border px-3 py-1 font-mono text-xs font-semibold"
        >
          <span className="text-accent font-sans font-bold">Metascore</span>
          <span>{ratings.metascore}</span>
        </span>
      )}
    </div>
  );
}
