import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ConsumerShell } from "@/components/layout/site-shell";
import { EmptyArchive, FixtureNotice, SectionHeading } from "@/components/catalogue/common";
import { PosterGrid } from "@/components/catalogue/poster-card";
import { Icon } from "@/components/ui/icon";
import { ContentRowSkeleton } from "@/components/ui";
import { getBrowseFacets, listTitles, searchCatalogue } from "@/lib/catalogue/repository";
import { sanitizeQuery } from "@/lib/catalogue/search";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search films, people and collections in English or Bangla. Find a new path through cinema.",
};

async function SearchContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const query = sanitizeQuery(resolved.q);
  const rawKind = Array.isArray(resolved.type) ? resolved.type[0] : resolved.type;
  const kind = ["titles", "people", "collections"].includes(rawKind ?? "") ? rawKind : "all";
  const results = searchCatalogue(query);
  const titles = listTitles();
  const facets = getBrowseFacets();
  const filterHref = (type: string) =>
    `/search?${new URLSearchParams({ q: query, ...(type !== "all" ? { type } : {}) })}`;
  return (
    <>
      <form
        className="search-form"
        role="search"
        aria-label="Catalogue search"
        action="/search"
        method="get"
      >
        <Icon name="search" />
        <label htmlFor="catalogue-search-input" className="sr-only">
          Search titles, cast, or directors
        </label>
        <input
          id="catalogue-search-input"
          type="search"
          name="q"
          defaultValue={query}
          placeholder="A film, a filmmaker, a feeling…"
          maxLength={120}
          autoComplete="off"
        />
        <button type="submit" className="search-submit" aria-label="Search catalogue">
          <Icon name="arrow-up-right" />
        </button>
      </form>
      <div className="search-hint">
        <span>Search in English or বাংলা</span>
        <span>
          Anywhere, anytime <kbd>⌘ / Ctrl K</kbd>
        </span>
      </div>
      <FixtureNotice compact />
      {!query ? (
        titles.length > 0 ? (
          <>
            <section className="search-ways-in">
              <p className="eyebrow">Let curiosity do the searching</p>
              <div className="genre-links">
                {facets.genres.slice(0, 7).map((genre) => (
                  <Link
                    href={`/search?q=${encodeURIComponent(genre.label)}`}
                    className="genre-link"
                    key={genre.slug}
                  >
                    {genre.label}
                    <Icon name="arrow-up-right" />
                  </Link>
                ))}
              </div>
            </section>
            <section className="search-discover">
              <SectionHeading
                eyebrow="Before you know what you’re looking for"
                title="A place to start."
              />
              <PosterGrid cards={titles.slice(0, 5)} />
            </section>
          </>
        ) : (
          <EmptyArchive
            title="A little patience. A lot of possibility."
            description="Search will include the published catalogue once source verification and rights review are complete."
          />
        )
      ) : (
        <div className="search-results" aria-live="polite">
          <div className="search-result-summary">
            <p>
              {results.total > 0 ? (
                <>
                  <strong>{results.total}</strong> {results.total === 1 ? "result" : "results"} for{" "}
                  <span>“{query}”</span>
                </>
              ) : (
                <>No catalogue results for “{query}”</>
              )}
            </p>
            {query ? (
              <Link href="/search" className="text-link">
                Clear search
                <Icon name="close" />
              </Link>
            ) : null}
          </div>
          <nav className="search-tabs" aria-label="Filter search results">
            {[
              { key: "all", label: "Everything", count: results.total },
              { key: "titles", label: "Films", count: results.titles.length },
              { key: "people", label: "People", count: results.people.length },
              { key: "collections", label: "Collections", count: results.collections.length },
            ].map((tab) => (
              <Link
                key={tab.key}
                href={filterHref(tab.key)}
                aria-current={kind === tab.key ? "true" : undefined}
              >
                {tab.label}
                <span>{tab.count}</span>
              </Link>
            ))}
          </nav>
          {results.total === 0 ? (
            <EmptyArchive
              compact
              title="A different search. A new discovery."
              description="Try another title, a filmmaker’s name, a year, a country or a genre. No unverified external listings are fetched."
            />
          ) : (
            <>
              {(kind === "all" || kind === "titles") && results.titles.length > 0 ? (
                <section className="search-result-section">
                  <SectionHeading title="Films." count={results.titles.length} />
                  <PosterGrid cards={results.titles} />
                </section>
              ) : null}
              {(kind === "all" || kind === "people") && results.people.length > 0 ? (
                <section className="search-result-section">
                  <SectionHeading title="People." count={results.people.length} />
                  <div className="search-text-results">
                    {results.people.map(({ entry }) => (
                      <Link href={entry.href} key={entry.slug}>
                        <Icon name="people" />
                        <div>
                          <h3>{entry.label}</h3>
                          <p>{entry.sublabel}</p>
                        </div>
                        <Icon name="arrow-up-right" />
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
              {(kind === "all" || kind === "collections") && results.collections.length > 0 ? (
                <section className="search-result-section">
                  <SectionHeading title="Collections." count={results.collections.length} />
                  <div className="search-text-results">
                    {results.collections.map(({ entry }) => (
                      <Link href={entry.href} key={entry.slug}>
                        <Icon name="collection" />
                        <div>
                          <h3>{entry.label}</h3>
                          <p>{entry.sublabel}</p>
                        </div>
                        <Icon name="arrow-up-right" />
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
              {(kind === "titles" && results.titles.length === 0) ||
              (kind === "people" && results.people.length === 0) ||
              (kind === "collections" && results.collections.length === 0) ? (
                <EmptyArchive
                  compact
                  title="Nothing in this category."
                  description="Select Everything to see the matching records, or try a different search."
                />
              ) : null}
            </>
          )}
        </div>
      )}
    </>
  );
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ConsumerShell>
      <header className="page-header">
        <p className="eyebrow">Follow your curiosity</p>
        <h1>
          Find your
          <br />
          next frame<span className="cg-accent">.</span>
        </h1>
      </header>
      <Suspense fallback={<ContentRowSkeleton />}>
        <SearchContent searchParams={searchParams} />
      </Suspense>
    </ConsumerShell>
  );
}
