import Link from "next/link";
import { KeyArt } from "@/components/art/key-art";
import { Icon } from "@/components/ui/icon";
import { PosterCard } from "./poster-card";
import { ScrollRail } from "@/components/experience/scroll-rail";
import { SectionHeading } from "./common";
import { formatLifespan, pad2, pluralize } from "@/lib/catalogue/format";
import type { CollectionSummary, PersonSummary } from "@/lib/catalogue/repository";
import type { TitleCard } from "@/lib/catalogue/types";

export function TitleRail({
  cards,
  title,
  eyebrow,
  href,
  linkLabel,
}: {
  cards: TitleCard[];
  title: string;
  eyebrow?: string;
  href?: string;
  linkLabel?: string;
}) {
  if (cards.length === 0) return null;
  return (
    <section className="archive-section">
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        count={cards.length}
        href={href}
        linkLabel={linkLabel}
      />
      <ScrollRail label={title}>
        {cards.map((card, i) => (
          <div className="rail-item" key={card.slug}>
            <PosterCard card={card} index={i} />
          </div>
        ))}
      </ScrollRail>
    </section>
  );
}

export function DirectorIndex({
  people,
  compact = false,
}: {
  people: PersonSummary[];
  compact?: boolean;
}) {
  return (
    <div className={`director-index ${compact ? "director-index-compact" : ""}`}>
      {people.map((person, i) => (
        <Link href={`/people/${person.slug}`} className="director-row" key={person.slug}>
          <span className="director-number">{pad2(i + 1)}</span>
          <div className="director-name">
            <span className="director-full-name">{person.name}</span>
            <h3>{person.displayName}</h3>
            <span className="director-lifespan">{formatLifespan(person.born, person.died)}</span>
          </div>
          <div className="director-fan" aria-hidden="true">
            {person.films.slice(0, 3).map((film, j) => (
              <div className={`fan-poster fan-poster-${j}`} key={film.slug}>
                <KeyArt spec={film.art} />
                <div className="art-grain" />
              </div>
            ))}
          </div>
          <span className="director-film-count">
            {pluralize(person.films.length, "film")}
            <Icon name="arrow-up-right" />
          </span>
        </Link>
      ))}
    </div>
  );
}

export function CollectionTile({
  collection,
  index = 0,
}: {
  collection: CollectionSummary;
  index?: number;
}) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className={`collection-tile collection-tile-${index % 4}`}
    >
      <div className="collection-tile-art" aria-hidden="true">
        {collection.titles.slice(0, 3).map((card, i) => (
          <div className={`collection-art-piece collection-art-piece-${i}`} key={card.slug}>
            <KeyArt spec={card.art} />
            <div className="art-grain" />
          </div>
        ))}
      </div>
      <div className="collection-tile-shade" />
      <div className="collection-tile-top">
        <span className="eyebrow">Collection / {pad2(index + 1)}</span>
        <span>{pluralize(collection.titles.length, "film")}</span>
      </div>
      <div className="collection-tile-copy">
        <h3>{collection.title}</h3>
        <p>{collection.description}</p>
        <span className="collection-tile-arrow">
          <Icon name="arrow-up-right" />
        </span>
      </div>
    </Link>
  );
}
