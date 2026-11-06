"use client";

import Link from "next/link";
import { useState } from "react";
import { ArtBackdrop } from "@/components/art/backdrop";
import { Icon } from "@/components/ui/icon";
import { formatRuntime, joinNames, pad2, slugify, splitDisplayTitle } from "@/lib/catalogue/format";
import type { TitleCard } from "@/lib/catalogue/types";

export function FeaturedHero({ cards }: { cards: TitleCard[] }) {
  const [selected, setSelected] = useState(0);
  const card = cards[selected] ?? cards[0];
  if (!card) return null;
  const parts = splitDisplayTitle(card.title);
  const mainTitle = (parts[0] ?? card.title).replace(/:$/, "");
  return (
    <section className="home-hero" aria-label="Featured archive titles">
      <ArtBackdrop spec={card.art} key={card.slug} className="featured-art" />
      <div className="hero-topline">
        <h1>The rights-first film archive</h1>
        <span className="hero-edition">Archive / A new perspective</span>
      </div>
      <div className="hero-content" key={`copy-${card.slug}`} aria-live="polite" aria-atomic="true">
        <p className="hero-kicker">
          In focus / {joinNames(card.directors.map((person) => person.name))}
        </p>
        <h2 className={`hero-display ${mainTitle.length > 14 ? "hero-display-long" : ""}`}>
          {mainTitle}
          <span className="hero-title-dot">.</span>
        </h2>
        <p className="hero-subtitle">
          {parts[1] ??
            `${card.year} · An exploration in ${card.genres[0]?.toLowerCase() ?? "cinema"}`}
        </p>
        <div className="metadata-chips">
          <span>{card.year}</span>
          <span title="Approximate running time">≈ {formatRuntime(card.runtimeMinutes)}</span>
          {card.genres.slice(0, 2).map((genre) => (
            <Link href={`/genres/${slugify(genre)}`} key={genre}>
              {genre}
            </Link>
          ))}
        </div>
        <p className="hero-synopsis">{card.synopsis.split(" — ")[0]?.split(". ")[0]}.</p>
        <div className="hero-actions">
          <Link href={`/movies/${card.slug}`} className="action-button action-primary">
            Explore the film
            <Icon name="arrow-up-right" />
          </Link>
          <Link href="/movies" className="action-button action-outline">
            <Icon name="films" />
            Browse the archive
          </Link>
        </div>
        <p className="hero-access">
          <Icon name="lock" />
          Development fixture · rights verification pending
        </p>
      </div>
      <Link
        href={`/watch/${card.slug}`}
        className="hero-play"
        aria-label={`Why playback is locked for ${card.title}`}
      >
        <span className="hero-play-circle">
          <Icon name="lock" />
        </span>
        <span>Playback locked</span>
      </Link>
      <div className="hero-bottom">
        <a className="hero-scroll" href="#archive">
          <Icon name="arrow" />
          Scroll to discover
        </a>
        <div className="hero-selectors" aria-label="Choose featured title">
          {cards.map((item, i) => (
            <button
              type="button"
              key={item.slug}
              className="hero-selector"
              aria-label={`Feature ${item.title}`}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              <span>{pad2(i + 1)}</span>
              <span className="hero-selector-track" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
