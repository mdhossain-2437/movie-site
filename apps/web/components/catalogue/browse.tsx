import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { PosterGrid } from "./poster-card";
import { EmptyArchive } from "./common";
import { formatRuntime, joinNames, pad2 } from "@/lib/catalogue/format";
import {
  browseTitles,
  getBrowseFacets,
  parseBrowseFilters,
  type BrowseFilters,
} from "@/lib/catalogue/repository";

function hrefFor(filters: BrowseFilters, patch: Partial<BrowseFilters>): string {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.genre) params.set("genre", next.genre);
  if (next.decade) params.set("decade", next.decade);
  if (next.country) params.set("country", next.country);
  if (next.sort !== "year") params.set("sort", next.sort);
  if (next.view !== "grid") params.set("view", next.view);
  return `/movies${params.size ? `?${params}` : ""}`;
}

export async function BrowseResults({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseBrowseFilters(await searchParams);
  const cards = browseTitles(filters);
  const facets = getBrowseFacets();
  const active = Boolean(filters.genre || filters.decade || filters.country);
  if (facets.genres.length === 0) return <EmptyArchive />;
  return (
    <div>
      <div className="browse-filters">
        <div className="browse-filter-row">
          <span className="filter-label">Genre</span>
          <div>
            <Link
              href={hrefFor(filters, { genre: null })}
              aria-current={!filters.genre ? "true" : undefined}
              className="filter-chip"
            >
              All films
            </Link>
            {facets.genres.map((facet) => (
              <Link
                href={hrefFor(filters, { genre: facet.slug === filters.genre ? null : facet.slug })}
                key={facet.slug}
                aria-current={filters.genre === facet.slug ? "true" : undefined}
                className="filter-chip"
              >
                {facet.label}
                <sup>{facet.count}</sup>
              </Link>
            ))}
          </div>
        </div>
        <div className="browse-filter-row">
          <span className="filter-label">Era</span>
          <div>
            <Link
              href={hrefFor(filters, { decade: null })}
              aria-current={!filters.decade ? "true" : undefined}
              className="filter-chip"
            >
              All years
            </Link>
            {facets.decades.map((facet) => (
              <Link
                className="filter-chip"
                href={hrefFor(filters, {
                  decade: facet.slug === filters.decade ? null : facet.slug,
                })}
                key={facet.slug}
                aria-current={filters.decade === facet.slug ? "true" : undefined}
              >
                {facet.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="browse-filter-row">
          <span className="filter-label">Origin</span>
          <div>
            <Link
              href={hrefFor(filters, { country: null })}
              aria-current={!filters.country ? "true" : undefined}
              className="filter-chip"
            >
              Everywhere
            </Link>
            {facets.countries.map((facet) => (
              <Link
                className="filter-chip"
                href={hrefFor(filters, {
                  country: facet.slug === filters.country ? null : facet.slug,
                })}
                key={facet.slug}
                aria-current={filters.country === facet.slug ? "true" : undefined}
              >
                {facet.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="browse-toolbar">
        <p aria-live="polite">
          <strong>{pad2(cards.length)}</strong> {cards.length === 1 ? "film" : "films"}
          {active ? (
            <Link href={`/movies${filters.view === "index" ? "?view=index" : ""}`}>
              Clear filters
              <Icon name="close" />
            </Link>
          ) : null}
        </p>
        <div className="browse-toolbar-controls">
          <div className="sort-links" aria-label="Sort films">
            <span>Sort</span>
            {[
              { value: "year", label: "Oldest" },
              { value: "year-desc", label: "Newest" },
              { value: "title", label: "A–Z" },
            ].map((sort) => (
              <Link
                href={hrefFor(filters, { sort: sort.value as BrowseFilters["sort"] })}
                key={sort.value}
                aria-current={filters.sort === sort.value ? "true" : undefined}
              >
                {sort.label}
              </Link>
            ))}
          </div>
          <div className="view-toggle">
            <Link
              href={hrefFor(filters, { view: "grid" })}
              aria-label="Poster grid view"
              aria-current={filters.view === "grid" ? "true" : undefined}
            >
              <Icon name="grid" />
            </Link>
            <Link
              href={hrefFor(filters, { view: "index" })}
              aria-label="Film index view"
              aria-current={filters.view === "index" ? "true" : undefined}
            >
              <Icon name="list" />
            </Link>
          </div>
        </div>
      </div>
      {cards.length === 0 ? (
        <EmptyArchive
          compact
          title="No films in this frame."
          description="Nothing matches this combination. Clear a filter to explore another path through the archive."
        />
      ) : filters.view === "grid" ? (
        <PosterGrid cards={cards} />
      ) : (
        <div className="film-index">
          <div className="film-index-head">
            <span>No.</span>
            <span>Title</span>
            <span>Director</span>
            <span>Year</span>
            <span>Time</span>
            <span />
          </div>
          {cards.map((card, i) => (
            <Link href={`/movies/${card.slug}`} key={card.slug} className="film-index-row">
              <span className="film-index-number">{pad2(i + 1)}</span>
              <span className="film-index-title">
                {card.title}
                <small>Development fixture · rights pending</small>
              </span>
              <span className="film-index-director">
                {joinNames(card.directors.map((person) => person.name))}
              </span>
              <span>{card.year}</span>
              <span className="film-index-runtime">≈ {formatRuntime(card.runtimeMinutes)}</span>
              <Icon name="arrow-up-right" />
            </Link>
          ))}
        </div>
      )}
      <p className="browse-footnote">
        Runtime is approximate. Silent-era versions vary by restoration and projection speed. No
        title is cleared for playback.
      </p>
    </div>
  );
}
