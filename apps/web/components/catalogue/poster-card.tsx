import { KeyArt } from "@/components/art/key-art";
import { PosterLink } from "@/components/experience/poster-link";
import { SaveButton } from "@/components/experience/actions";
import { Icon } from "@/components/ui/icon";
import { formatRuntime, joinNames } from "@/lib/catalogue/format";
import type { TitleCard } from "@/lib/catalogue/types";

export function PosterCard({
  card,
  index,
  showSave = true,
}: {
  card: TitleCard;
  index?: number;
  showSave?: boolean;
}) {
  return (
    <article className="poster-card">
      <PosterLink
        href={`/movies/${card.slug}`}
        title={card.title}
        color={card.art.palette.bg2}
        label={`Explore ${card.title}, ${card.year}`}
        className="poster-card-link"
      >
        <div className="poster-art" data-poster-art>
          <div className="poster-visual">
            <KeyArt spec={card.art} />
            <div className="art-grain" />
          </div>
          <div className="poster-scrim" />
          <div className="poster-top">
            <span>CINEVA / {String(card.year).slice(-2)}</span>
            {index !== undefined ? (
              <span>{String(index + 1).padStart(2, "0")}</span>
            ) : (
              <span className="poster-open">
                <Icon name="arrow-up-right" />
              </span>
            )}
          </div>
          <h3 className="poster-title">{card.title}</h3>
        </div>
        <div className="poster-caption">
          <p className="poster-director">
            {joinNames(card.directors.map((director) => director.name))}
          </p>
          <p className="poster-meta">
            <span>{card.year}</span>
            <span>≈ {formatRuntime(card.runtimeMinutes)}</span>
          </p>
        </div>
      </PosterLink>
      <div className="poster-status">
        <span>
          <Icon name="lock" />
          {card.isDevelopmentFixture ? "Archival reference" : "Catalogue entry"}
        </span>
        {showSave ? <SaveButton slug={card.slug} title={card.title} compact /> : null}
      </div>
    </article>
  );
}

export function PosterGrid({ cards }: { cards: TitleCard[] }) {
  return (
    <div className="poster-grid">
      {cards.map((card, index) => (
        <PosterCard card={card} index={index} key={card.slug} />
      ))}
    </div>
  );
}
