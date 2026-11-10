import type { ProductionReleaseDossierData } from "@/lib/metadata/omdb-types";

export interface ProductionReleaseDossierProps {
  dossier: ProductionReleaseDossierData | null | undefined;
  className?: string;
}

export function ProductionReleaseDossier({
  dossier,
  className = "",
}: ProductionReleaseDossierProps) {
  if (!dossier) {
    return null;
  }

  const hasFinancials = Boolean(dossier.budget || dossier.revenue || dossier.boxOffice);

  return (
    <section
      id="production-dossier"
      aria-labelledby="production-dossier-heading"
      data-testid="production-release-dossier"
      className={`space-y-5 ${className}`.trim()}
    >
      <div>
        <p className="text-accent font-mono text-xs tracking-widest uppercase">
          Complete Archival Metadata
        </p>
        <h2 id="production-dossier-heading" className="font-display text-text text-2xl font-bold">
          Production, Credits &amp; Box Office Dossier
        </h2>
      </div>

      <div className="cg-surface space-y-6 p-6 sm:p-8">
        {dossier.awards ? (
          <div
            data-testid="dossier-awards-callout"
            className="border-accent bg-surface-2 relative overflow-hidden rounded-xl border p-5"
          >
            <div className="flex items-start gap-3.5">
              <span className="text-accent mt-0.5 shrink-0" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              </span>
              <div className="space-y-1">
                <p className="text-accent font-mono text-xs font-bold tracking-wider uppercase">
                  Awards &amp; Critical Recognition
                </p>
                <p className="text-text font-sans text-sm leading-relaxed font-semibold sm:text-base">
                  {dossier.awards}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {dossier.plot ? (
          <div className="border-border bg-surface-2 rounded-xl border p-5">
            <p className="text-text-muted font-mono text-[10px] tracking-wider uppercase">
              Full Archival Plot Synopsis
            </p>
            <p className="text-text-secondary mt-2 font-sans text-sm leading-7">{dossier.plot}</p>
          </div>
        ) : null}

        {hasFinancials ? (
          <div
            data-testid="dossier-financial-ledger"
            className="border-border bg-surface-2 rounded-xl border p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-accent" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
              <h3 className="text-text font-mono text-xs font-bold tracking-wider uppercase">
                Theatrical &amp; Box Office Financials
              </h3>
            </div>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {dossier.boxOffice ? (
                <div>
                  <dt className="text-text-muted font-mono text-[10px] uppercase">
                    Box Office Gross (OMDb)
                  </dt>
                  <dd className="text-text mt-0.5 font-mono text-base font-bold">
                    {dossier.boxOffice}
                  </dd>
                </div>
              ) : null}
              {dossier.revenue ? (
                <div>
                  <dt className="text-text-muted font-mono text-[10px] uppercase">
                    Worldwide Revenue (TMDB)
                  </dt>
                  <dd className="text-text mt-0.5 font-mono text-base font-bold">
                    {dossier.revenue}
                  </dd>
                </div>
              ) : null}
              {dossier.budget ? (
                <div>
                  <dt className="text-text-muted font-mono text-[10px] uppercase">
                    Production Budget
                  </dt>
                  <dd className="text-text mt-0.5 font-mono text-base font-bold">
                    {dossier.budget}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}

        <dl className="grid grid-cols-1 gap-6 font-mono text-xs sm:grid-cols-2 lg:grid-cols-4">
          {dossier.rated ? (
            <div>
              <dt className="text-text-muted uppercase">Maturity Rating</dt>
              <dd className="mt-1">
                <span className="border-accent bg-surface-2 text-accent rounded-pill inline-flex items-center border px-2.5 py-0.5 font-mono text-xs font-bold">
                  {dossier.rated}
                </span>
              </dd>
            </div>
          ) : null}

          {dossier.released ? (
            <div>
              <dt className="text-text-muted uppercase">Release Date</dt>
              <dd className="text-text mt-1 font-sans text-sm font-medium">{dossier.released}</dd>
            </div>
          ) : null}

          {dossier.runtime ? (
            <div>
              <dt className="text-text-muted uppercase">Runtime</dt>
              <dd className="text-text mt-1 font-sans text-sm font-medium">{dossier.runtime}</dd>
            </div>
          ) : null}

          {dossier.type ? (
            <div>
              <dt className="text-text-muted uppercase">Format Classification</dt>
              <dd className="text-text mt-1 font-sans text-sm font-medium">
                {dossier.type}
                {dossier.totalSeasons
                  ? ` · ${dossier.totalSeasons} ${dossier.totalSeasons === 1 ? "Season" : "Seasons"}`
                  : ""}
              </dd>
            </div>
          ) : null}

          {dossier.genres && dossier.genres.length > 0 ? (
            <div>
              <dt className="text-text-muted uppercase">Genres</dt>
              <dd className="text-text mt-1 font-sans text-sm font-medium">
                {dossier.genres.join(", ")}
              </dd>
            </div>
          ) : null}

          {dossier.directors && dossier.directors.length > 0 ? (
            <div>
              <dt className="text-text-muted uppercase">Director</dt>
              <dd className="text-text mt-1 font-sans text-sm font-medium">
                {dossier.directors.join(", ")}
              </dd>
            </div>
          ) : null}

          {dossier.writers && dossier.writers.length > 0 ? (
            <div>
              <dt className="text-text-muted uppercase">Writers &amp; Screenplay</dt>
              <dd className="text-text mt-1 font-sans text-sm font-medium">
                {dossier.writers.join(", ")}
              </dd>
            </div>
          ) : null}

          {dossier.actors && dossier.actors.length > 0 ? (
            <div>
              <dt className="text-text-muted uppercase">Principal Cast</dt>
              <dd className="text-text mt-1 font-sans text-sm font-medium">
                {dossier.actors.join(", ")}
              </dd>
            </div>
          ) : null}

          {dossier.languages && dossier.languages.length > 0 ? (
            <div>
              <dt className="text-text-muted uppercase">Languages</dt>
              <dd className="text-text mt-1 font-sans text-sm font-medium">
                {dossier.languages.join(", ")}
              </dd>
            </div>
          ) : null}

          {dossier.countries && dossier.countries.length > 0 ? (
            <div>
              <dt className="text-text-muted uppercase">Country of Origin</dt>
              <dd className="text-text mt-1 font-sans text-sm font-medium">
                {dossier.countries.join(", ")}
              </dd>
            </div>
          ) : null}

          {dossier.production ? (
            <div>
              <dt className="text-text-muted uppercase">Production Studio</dt>
              <dd className="text-text mt-1 font-sans text-sm font-medium">{dossier.production}</dd>
            </div>
          ) : null}

          {dossier.dvd ? (
            <div>
              <dt className="text-text-muted uppercase">Home Video / DVD</dt>
              <dd className="text-text mt-1 font-sans text-sm font-medium">{dossier.dvd}</dd>
            </div>
          ) : null}

          {dossier.website ? (
            <div>
              <dt className="text-text-muted uppercase">Official Website</dt>
              <dd className="text-text mt-1 truncate font-mono text-xs">{dossier.website}</dd>
            </div>
          ) : null}

          {dossier.imdbId ? (
            <div>
              <dt className="text-text-muted uppercase">IMDb Registry ID</dt>
              <dd className="mt-1">
                <span className="border-border bg-surface-2 text-text inline-block rounded-xs border px-2 py-0.5 font-mono text-xs font-semibold">
                  {dossier.imdbId}
                </span>
              </dd>
            </div>
          ) : null}

          {dossier.tmdbId ? (
            <div>
              <dt className="text-text-muted uppercase">TMDB Registry ID</dt>
              <dd className="mt-1">
                <span className="border-border bg-surface-2 text-text inline-block rounded-xs border px-2 py-0.5 font-mono text-xs font-semibold">
                  #{dossier.tmdbId}
                </span>
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </section>
  );
}
