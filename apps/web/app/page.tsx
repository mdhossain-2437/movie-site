import type { Metadata } from "next";
import Link from "next/link";
import { ConsumerShell } from "@/components/layout/site-shell";
import { FeaturedHero } from "@/components/experience/featured-hero";
import {
  ArtBackdrop,
  EmptyArchive,
  FixtureNotice,
  SectionHeading,
} from "@/components/catalogue/common";
import { CollectionTile, DirectorIndex, TitleRail } from "@/components/catalogue/editorial";
import { Icon } from "@/components/ui/icon";
import {
  getFeaturedTitles,
  getBrowseFacets,
  listCollections,
  listDirectors,
  listTitles,
} from "@/lib/catalogue/repository";

export const metadata: Metadata = {
  title: { absolute: "Cinematic Graphite — The rights-first film archive" },
  description:
    "A considered space for cinema. Explore films, filmmakers and original editorial collections, with transparent rights-aware availability.",
};

export default function Home() {
  const featured = getFeaturedTitles();
  const titles = listTitles();
  const collections = listCollections();
  const allDirectors = listDirectors();
  const directors = ["f-w-murnau", "fritz-lang", "buster-keaton", "lotte-reiniger"].flatMap(
    (slug) => {
      const person = allDirectors.find((candidate) => candidate.slug === slug);
      return person ? [person] : [];
    },
  );
  const facets = getBrowseFacets();
  const archive = [
    "nosferatu",
    "metropolis",
    "the-cabinet-of-dr-caligari",
    "man-with-a-movie-camera",
    "the-general",
    "the-adventures-of-prince-achmed",
    "a-trip-to-the-moon",
    "battleship-potemkin",
  ].flatMap((slug) => {
    const title = titles.find((candidate) => candidate.slug === slug);
    return title ? [title] : [];
  });
  return (
    <ConsumerShell fullBleed>
      {featured.length > 0 ? (
        <FeaturedHero cards={featured} />
      ) : (
        <section className="home-hero empty-home-hero">
          <ArtBackdrop
            spec={{
              motif: "sun",
              palette: {
                bg: "#1f0802",
                bg2: "#b7410e",
                ink: "#140501",
                accent: "#ff8c1a",
                light: "#ffd08a",
              },
            }}
          />
          <div className="hero-topline">
            <h1>The rights-first film archive</h1>
            <span className="eyebrow">Independent by design</span>
          </div>
          <div className="hero-content">
            <p className="hero-kicker">For the love of the frame</p>
            <h2 className="hero-display">
              Cinema.
              <br />
              Considered.
            </h2>
            <p className="hero-synopsis">
              A space for remarkable films. A respect for their makers. The catalogue opens only to
              verified rights.
            </p>
            <Link href="/movies" className="action-button action-primary">
              Browse the archive
              <Icon name="arrow-up-right" />
            </Link>
          </div>
          <a className="hero-scroll" href="#archive">
            <Icon name="arrow" />
            Discover our approach
          </a>
        </section>
      )}
      <div className="home-body">
        <div className="intro-band">
          <p>
            Not an endless feed.
            <br />
            <span>A new way into the world of film.</span>
          </p>
          <FixtureNotice compact />
        </div>
        <div id="archive">
          {archive.length > 0 ? (
            <TitleRail
              cards={archive}
              eyebrow="Stories that shaped the screen"
              title="From the archive."
              href="/movies"
              linkLabel="All films"
            />
          ) : (
            <EmptyArchive />
          )}
        </div>
        {directors.length > 0 ? (
          <section className="director-section" id="filmmakers">
            <SectionHeading
              eyebrow="The vision behind the frame"
              title="A world of auteurs."
              href="/people"
              linkLabel="All people"
            />
            <DirectorIndex people={directors} compact />
          </section>
        ) : null}
        {collections.length > 0 ? (
          <section className="collections-section" id="collections">
            <SectionHeading
              eyebrow="Different films. A shared idea."
              title="Follow the thread."
              href="/collections"
              linkLabel="All collections"
            />
            <div className="collection-grid">
              {collections.slice(0, 2).map((collection, i) => (
                <CollectionTile key={collection.slug} collection={collection} index={i} />
              ))}
            </div>
          </section>
        ) : null}
        {facets.genres.length > 0 ? (
          <section className="browse-section">
            <SectionHeading eyebrow="Let curiosity lead" title="Find your kind of cinema." />
            <div className="genre-links">
              {facets.genres.map((genre) => (
                <Link className="genre-link" href={`/genres/${genre.slug}`} key={genre.slug}>
                  {genre.label}
                  <span>{String(genre.count).padStart(2, "0")}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
        <section className="trust-band" aria-label="A different kind of film platform">
          <div className="trust-band-intro">
            <p className="eyebrow">A more thoughtful archive</p>
            <h2>
              Cinema, with
              <br />a conscience.
            </h2>
            <Link href="/legal/copyright" className="text-link">
              Our approach
              <Icon name="arrow-up-right" />
            </Link>
          </div>
          <div>
            <Icon name="shield" />
            <h3>Rights before release.</h3>
            <p>
              Owned, licensed, or legally verified public-domain works only. No shortcuts, no
              scraped streams.
            </p>
          </div>
          <div>
            <Icon name="globe" />
            <h3>Clarity, wherever you are.</h3>
            <p>
              Territory, viewing windows and delivery rights are checked independently. Availability
              is never assumed.
            </p>
          </div>
          <div>
            <Icon name="films" />
            <h3>Made to be explored.</h3>
            <p>
              Original editorial paths through films, people and movements. No invented scores or
              manufactured popularity.
            </p>
          </div>
        </section>
      </div>
    </ConsumerShell>
  );
}
