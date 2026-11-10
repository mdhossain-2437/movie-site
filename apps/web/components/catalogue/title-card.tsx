import type { PublicTitleSummary } from "@movie/db";
import Link from "next/link";
import { KeyArt } from "@/components/art/key-art";
import { AvailabilityBadge } from "@/components/ui";
import { getCinevaFilmBySlug, getCinevaTopRatedMap } from "@/lib/catalogue/cineva-database";
import type { ArtSpec } from "@/lib/catalogue/types";

const FALLBACK_POSTER_ART: ArtSpec = {
  motif: "shadow",
  palette: {
    bg: "#040507",
    bg2: "#16070A",
    ink: "#020203",
    accent: "#E50914",
    light: "#FEF9EF",
  },
};

export interface TitleCardProps {
  title: PublicTitleSummary;
  matchPercentage?: number;
  matchReason?: string;
  rankNumber?: number;
}

export function TitleCard({ title, matchPercentage, matchReason, rankNumber }: TitleCardProps) {
  const cinevaFilm = getCinevaFilmBySlug(title.slug);
  const topRatedEntry = getCinevaTopRatedMap().get(title.slug);
  const artSpec = cinevaFilm?.art ?? FALLBACK_POSTER_ART;
  const isSeries = (cinevaFilm?.kind ?? title.kind) === "SERIES";
  const seasonCount = cinevaFilm?.seasons?.length ?? (isSeries ? 1 : 0);
  const director = cinevaFilm?.credits.find((c) => c.department === "DIRECTOR")?.nameEn;
  const studioLabel = cinevaFilm?.studio ?? title.studioName;
  const genreLine = cinevaFilm?.genres
    .slice(0, 2)
    .map((g) => g.nameEn)
    .join(" · ");
  const displayScore = topRatedEntry?.bayesianScore ?? cinevaFilm?.rawRating;

  return (
    <article className="group cg-surface hover:border-accent/60 flex flex-col justify-between overflow-hidden transition-colors duration-200 motion-reduce:transition-none">
      <Link
        href={`/movies/${title.slug}`}
        className="block p-3.5 focus:outline-offset-[-2px] sm:p-4"
      >
        <div className="cg-poster border-border relative flex flex-col justify-between overflow-hidden rounded-md border p-4">
          <KeyArt
            spec={artSpec}
            variant="poster"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none"
          />
          <div
            aria-hidden="true"
            className="art-grain pointer-events-none absolute inset-0 opacity-30"
          />
          <div
            aria-hidden="true"
            className="from-canvas/65 via-canvas/25 to-canvas/95 pointer-events-none absolute inset-0 bg-gradient-to-b"
          />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {typeof rankNumber === "number" ? (
                <span className="border-accent bg-accent text-on-accent rounded-xs border px-2 py-0.5 font-mono text-[11px] font-black">
                  #{rankNumber}
                </span>
              ) : null}
              <span className="border-border-strong bg-canvas/90 text-text-secondary rounded-xs border px-2 py-0.5 font-mono text-[11px] font-semibold">
                {title.maturityRating}
              </span>
              {isSeries ? (
                <span className="border-accent/60 bg-canvas/90 text-accent rounded-xs border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase">
                  Series · {seasonCount}S
                </span>
              ) : null}
            </div>

            {typeof matchPercentage === "number" ? (
              <span className="border-success/45 bg-canvas/90 text-success inline-flex items-center gap-1 rounded-xs border px-2 py-0.5 font-mono text-[11px] font-bold">
                <span aria-hidden="true">◆</span>
                <span>{matchPercentage}% Match</span>
              </span>
            ) : displayScore ? (
              <span className="border-accent/45 bg-canvas/90 text-accent inline-flex items-center gap-1 rounded-xs border px-2 py-0.5 font-mono text-[11px] font-bold">
                <span aria-hidden="true">★</span>
                <span>{displayScore.toFixed(1)}</span>
              </span>
            ) : null}
          </div>

          {title.availability.streamAllowed ? (
            <div
              aria-hidden="true"
              className="pointer-events-none relative z-10 my-auto flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none"
            >
              <span className="border-accent/70 bg-canvas/85 text-text flex h-12 w-12 items-center justify-center rounded-full border shadow-[0_0_24px_rgba(229,9,20,0.45)]">
                <svg className="ml-0.5 h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </div>
          ) : null}

          <div className="relative z-10 space-y-1 pt-8">
            <p className="text-text-secondary font-mono text-[11px] tracking-wider uppercase">
              {title.originalLanguage.toUpperCase()} · {title.releaseYear} · {title.runtimeMinutes}
              {isSeries ? "m/ep" : "m"}
              {genreLine ? ` · ${genreLine}` : ""}
            </p>
            <h3 className="font-display text-text group-hover:text-accent text-lg leading-snug font-bold transition-colors motion-reduce:transition-none">
              {title.localizedTitleEn}
            </h3>
          </div>
        </div>

        <p className="text-text-muted mt-3 font-mono text-[11px] tracking-wide uppercase">
          {director ? `${isSeries ? "Creator" : "Dir."} ${director}` : "CINEVA Archive"}
          {studioLabel ? ` · ${studioLabel}` : ""}
        </p>

        {matchReason ? (
          <p className="text-accent mt-1 font-mono text-[11px] font-medium">{matchReason}</p>
        ) : null}

        <p className="text-text-secondary mt-1.5 line-clamp-2 text-xs leading-5">
          {title.synopsisEn}
        </p>
      </Link>

      <div className="border-border flex items-center justify-between gap-2 border-t px-3.5 py-2.5 sm:px-4">
        <AvailabilityBadge kind={title.availability.badgeKind} />
        {title.availability.streamAllowed ? (
          <Link
            href={isSeries ? `/watch/${title.slug}?s=1&e=1` : `/watch/${title.slug}`}
            aria-label={`Stream ${title.localizedTitleEn}`}
            className="border-accent/50 bg-accent/15 text-text hover:bg-accent hover:text-on-accent rounded-pill inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 border px-3.5 py-1.5 font-mono text-xs font-semibold transition-colors motion-reduce:transition-none md:min-h-8 md:min-w-8 md:py-1"
          >
            <svg aria-hidden="true" className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>{isSeries ? "S1:E1" : "Stream"}</span>
          </Link>
        ) : null}
      </div>
    </article>
  );
}
