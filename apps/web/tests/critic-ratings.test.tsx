import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CriticRatingsBadges } from "@/components/catalogue/critic-ratings-badges";
import type { OmdbRatings } from "@/lib/metadata/omdb-client";

afterEach(() => {
  cleanup();
});

describe("CriticRatingsBadges Component", () => {
  const fullRatings: OmdbRatings = {
    imdbRating: "8.4",
    imdbVotes: "45,210",
    metascore: "78",
    rottenTomatoes: "92%",
  };

  it("renders IMDb, Rotten Tomatoes, and Metascore in the scorebar variant", () => {
    render(<CriticRatingsBadges ratings={fullRatings} variant="scorebar" />);

    const container = screen.getByTestId("critic-ratings-scorebar");
    expect(container).toBeInTheDocument();

    const imdbBadge = screen.getByTestId("critic-badge-imdb");
    expect(imdbBadge).toHaveTextContent("IMDb");
    expect(imdbBadge).toHaveTextContent("8.4");
    expect(imdbBadge).toHaveTextContent("(45,210)");

    const rtBadge = screen.getByTestId("critic-badge-rotten");
    expect(rtBadge).toHaveTextContent("Rotten Tomatoes");
    expect(rtBadge).toHaveTextContent("92%");

    const metaBadge = screen.getByTestId("critic-badge-metascore");
    expect(metaBadge).toHaveTextContent("Metascore");
    expect(metaBadge).toHaveTextContent("78");
  });

  it("renders critic ratings in the technical details ledger variant", () => {
    render(<CriticRatingsBadges ratings={fullRatings} variant="ledger" />);

    const container = screen.getByTestId("critic-ratings-ledger");
    expect(container).toBeInTheDocument();
    expect(screen.getByText(/Critic Ratings & Metascores/i)).toBeInTheDocument();
    expect(screen.getByText(/IMDb 8.4\/10 \(45,210 votes\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Rotten Tomatoes 92%/i)).toBeInTheDocument();
    expect(screen.getByText(/Metascore 78\/100/i)).toBeInTheDocument();
  });

  it("renders compact badges in the hero variant", () => {
    render(<CriticRatingsBadges ratings={fullRatings} variant="hero" />);

    const container = screen.getByTestId("critic-ratings-hero");
    expect(container).toBeInTheDocument();

    const imdbHero = screen.getByTestId("hero-critic-imdb");
    expect(imdbHero).toHaveTextContent("IMDb");
    expect(imdbHero).toHaveTextContent("8.4");

    const rtHero = screen.getByTestId("hero-critic-rotten");
    expect(rtHero).toHaveTextContent("RT");
    expect(rtHero).toHaveTextContent("92%");

    const metaHero = screen.getByTestId("hero-critic-metascore");
    expect(metaHero).toHaveTextContent("Meta");
    expect(metaHero).toHaveTextContent("78");
  });

  it("renders null gracefully when ratings is null, undefined, or empty", () => {
    const { container: c1 } = render(<CriticRatingsBadges ratings={null} />);
    expect(c1).toBeEmptyDOMElement();

    const { container: c2 } = render(<CriticRatingsBadges ratings={undefined} />);
    expect(c2).toBeEmptyDOMElement();

    const emptyRatings: OmdbRatings = {
      imdbRating: null,
      imdbVotes: null,
      metascore: null,
      rottenTomatoes: null,
    };
    const { container: c3 } = render(<CriticRatingsBadges ratings={emptyRatings} />);
    expect(c3).toBeEmptyDOMElement();

    const naRatings: OmdbRatings = {
      imdbRating: "N/A",
      imdbVotes: "N/A",
      metascore: "N/A",
      rottenTomatoes: "N/A",
    };
    const { container: c4 } = render(<CriticRatingsBadges ratings={naRatings} />);
    expect(c4).toBeEmptyDOMElement();
  });

  it("renders only available scores when partial ratings are provided", () => {
    const partialRatings: OmdbRatings = {
      imdbRating: "7.1",
      imdbVotes: null,
      metascore: null,
      rottenTomatoes: "80%",
    };

    render(<CriticRatingsBadges ratings={partialRatings} variant="scorebar" />);

    expect(screen.getByTestId("critic-badge-imdb")).toBeInTheDocument();
    expect(screen.getByTestId("critic-badge-rotten")).toBeInTheDocument();
    expect(screen.queryByTestId("critic-badge-metascore")).not.toBeInTheDocument();
  });

  it("complies strictly with anti-slop rules: zero emojis, zero fake rating emblems, semantic tokens only", () => {
    const { container } = render(<CriticRatingsBadges ratings={fullRatings} variant="scorebar" />);

    // 1. Zero emojis
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(container.textContent ?? "")).toBe(false);

    // 2. Zero raster images or fake emblem SVGs
    expect(container.querySelectorAll("img")).toHaveLength(0);

    // 3. Semantic classes used and no forbidden Tailwind palette utilities
    const classList = Array.from(container.querySelectorAll("*"))
      .flatMap((el) => Array.from(el.classList))
      .join(" ");

    expect(classList).not.toMatch(/\bbg-zinc-/);
    expect(classList).not.toMatch(/\btext-white\b/);
    expect(classList).not.toMatch(/\bbg-black\b/);
    expect(classList).not.toMatch(/\b(from|via|to)-(purple|indigo|blue)-/);

    expect(classList).toContain("bg-surface-2");
    expect(classList).toContain("border-border");
    expect(classList).toContain("text-accent");
    expect(classList).toContain("font-mono");
  });
});
