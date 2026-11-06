import type { PublicTitleSummary } from "@movie/db";
import Link from "next/link";
import { AvailabilityBadge } from "@/components/ui";

export function TitleCard({ title }: { title: PublicTitleSummary }) {
  return (
    <article className="group cg-surface hover:border-border-strong flex flex-col justify-between overflow-hidden transition-colors">
      <Link href={`/movies/${title.slug}`} className="block p-4 focus:outline-offset-[-2px]">
        <div className="cg-poster flex flex-col justify-between p-4">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="border-border bg-canvas/85 text-text-secondary rounded-xs border px-2 py-0.5 font-mono text-xs">
              {title.maturityRating}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-text-muted font-mono text-xs uppercase">
              {title.originalLanguage.toUpperCase()} · {title.releaseYear} · {title.runtimeMinutes}m
            </p>
            <h3 className="font-display text-text group-hover:text-accent text-lg leading-snug font-semibold">
              {title.localizedTitleEn}
            </h3>
            {title.localizedTitleBn ? (
              <p className="text-text-secondary text-sm" lang="bn">
                {title.localizedTitleBn}
              </p>
            ) : null}
          </div>
        </div>

        <p className="text-text-secondary mt-3 line-clamp-2 text-xs leading-5">
          {title.synopsisEn}
        </p>
      </Link>

      <div className="border-border border-t px-4 py-3">
        <AvailabilityBadge kind={title.availability.badgeKind} />
      </div>
    </article>
  );
}
