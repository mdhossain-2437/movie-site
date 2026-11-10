import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OfficialArtworkGallery } from "@/components/catalogue/official-artwork-gallery";
import { ProductionReleaseDossier } from "@/components/catalogue/production-release-dossier";
import { VerifiedRatingsBreakdown } from "@/components/catalogue/verified-ratings-breakdown";
import {
  buildArtworkGalleryItems,
  buildMultiSourceRatings,
  buildProductionDossierFromTmdbAndOmdb,
  isAllowedAmazonPosterUrl,
  normalizeOmdbTitleDetail,
} from "@/lib/metadata/omdb-types";
import { buildDeterministicArtSpecForTmdbId, type TmdbWorkDetail } from "@/lib/metadata/tmdb-types";

const GUARDIANS_VOL2_OMDB = {
  Title: "Guardians of the Galaxy Vol. 2",
  Year: "2017",
  Rated: "PG-13",
  Released: "05 May 2017",
  Runtime: "136 min",
  Genre: "Action, Adventure, Comedy",
  Director: "James Gunn",
  Writer: "James Gunn, Dan Abnett, Andy Lanning",
  Actors: "Chris Pratt, Zoe Saldana, Dave Bautista",
  Plot: "The Guardians struggle to keep together as a team while dealing with their personal family issues, notably Star-Lord's encounter with his father, the ambitious celestial being Ego.",
  Language: "English",
  Country: "United States",
  Awards: "Nominated for 1 Oscar. 15 wins & 62 nominations total",
  Poster:
    "https://m.media-amazon.com/images/M/MV5BNWE5MGI3MDctMmU5Ni00YzI2LWEzMTQtZGIyZDA5MzQzNDBhXkEyXkFqcGc@._V1_QL75_UX380_CR0,1,380,562_.jpg",
  Ratings: [
    { Source: "Internet Movie Database", Value: "7.6/10" },
    { Source: "Rotten Tomatoes", Value: "85%" },
    { Source: "Metacritic", Value: "67/100" },
    { Source: "CinemaScore Registry", Value: "92%" },
  ],
  Metascore: "67",
  imdbRating: "7.6",
  imdbVotes: "849,165",
  imdbID: "tt3896198",
  Type: "movie",
  DVD: "N/A",
  BoxOffice: "$389,813,101",
  Production: "N/A",
  Website: "N/A",
  Response: "True",
};

const SAMPLE_TMDB_DETAIL: TmdbWorkDetail = {
  tmdbId: 283995,
  mediaKind: "movie",
  kind: "MOVIE",
  title: "Guardians of the Galaxy Vol. 2",
  originalTitle: "Guardians of the Galaxy Vol. 2",
  originalLanguage: "en",
  releaseYear: 2017,
  releaseDate: "2017-05-05",
  synopsis: "The Guardians must fight to keep their newfound family together.",
  voteAverage: 7.6,
  voteCount: 23703,
  bayesianScore: 7.59,
  popularity: 17.7,
  genreLabels: ["Adventure", "Action", "Sci-Fi"],
  posterUrl: "/api/v1/tmdb/image/w500/y4MBh0EjBlMuOzv9axM4qJlmhzz.jpg",
  backdropUrl: "/api/v1/tmdb/image/w1280/aJn9XeesqsrSLKcHfHP4u5985hn.jpg",
  fallbackArt: buildDeterministicArtSpecForTmdbId(283995),
  detailHref: "/tmdb/movie/283995",
  tagline: "Obviously.",
  statusLabel: "Released",
  runtimeMinutes: 137,
  certification: "PG-13",
  seasonCount: null,
  episodeCount: null,
  budget: 200000000,
  revenue: 863756051,
  formattedBudget: "$200,000,000",
  formattedRevenue: "$863,756,051",
  studios: [{ id: 420, name: "Marvel Studios", originCountry: "US", logoUrl: null }],
  spokenLanguages: [{ iso_639_1: "en", name: "English", englishName: "English" }],
  countries: ["United States of America"],
  directors: [
    {
      personId: 15218,
      name: "James Gunn",
      department: "DIRECTOR",
      roleLabel: "Director",
      profileUrl: null,
    },
  ],
  writers: [
    {
      personId: 15218,
      name: "James Gunn",
      department: "WRITER",
      roleLabel: "Writer",
      profileUrl: null,
    },
  ],
  cast: [
    {
      personId: 73457,
      name: "Chris Pratt",
      department: "ACTOR",
      roleLabel: "Peter Quill / Star-Lord",
      profileUrl: null,
    },
  ],
  posters: [
    {
      url: "/api/v1/tmdb/image/w500/y4MBh0EjBlMuOzv9axM4qJlmhzz.jpg",
      width: 1000,
      height: 1500,
      aspectRatio: 0.667,
      voteAverage: 8.2,
      voteCount: 45,
      language: "en",
    },
    {
      url: "/api/v1/tmdb/image/w500/altPosterTwo.jpg",
      width: 1000,
      height: 1500,
      aspectRatio: 0.667,
      voteAverage: 7.9,
      voteCount: 30,
      language: "en",
    },
  ],
  backdrops: [
    {
      url: "/api/v1/tmdb/image/w1280/aJn9XeesqsrSLKcHfHP4u5985hn.jpg",
      width: 1920,
      height: 1080,
      aspectRatio: 1.778,
      voteAverage: 8.0,
      voteCount: 22,
      language: null,
    },
  ],
  externalIds: {
    imdbId: "tt3896198",
    wikidataId: "Q20001199",
  },
  seasons: [],
  initialSeasonEpisodes: [],
  recommendations: [],
};

describe("Milestone 2 Expansion: Full OMDb + TMDB Ratings, Dossier & Multi-Poster Gallery", () => {
  afterEach(() => {
    cleanup();
  });

  it("normalizes all 25+ OMDb fields, filters N/A to null, and builds same-origin poster proxy URL", () => {
    const omdb = normalizeOmdbTitleDetail(GUARDIANS_VOL2_OMDB);
    expect(omdb).not.toBeNull();
    expect(omdb?.title).toBe("Guardians of the Galaxy Vol. 2");
    expect(omdb?.rated).toBe("PG-13");
    expect(omdb?.released).toBe("05 May 2017");
    expect(omdb?.runtimeMinutes).toBe(136);
    expect(omdb?.writers).toEqual(["James Gunn", "Dan Abnett", "Andy Lanning"]);
    expect(omdb?.actorsList).toEqual(["Chris Pratt", "Zoe Saldana", "Dave Bautista"]);
    expect(omdb?.awards).toBe("Nominated for 1 Oscar. 15 wins & 62 nominations total");
    expect(omdb?.boxOffice).toBe("$389,813,101");
    expect(omdb?.boxOfficeAmount).toBe(389813101);
    expect(omdb?.imdbRating).toBe("7.6");
    expect(omdb?.imdbVotes).toBe("849,165");
    expect(omdb?.imdbVotesCount).toBe(849165);
    expect(omdb?.rottenTomatoes).toBe("85%");
    expect(omdb?.metascore).toBe("67");
    expect(omdb?.dvd).toBeNull();
    expect(omdb?.production).toBeNull();
    expect(omdb?.website).toBeNull();
    expect(omdb?.proxiedPosterUrl).toBe("/api/v1/omdb/poster?imdbId=tt3896198");
    expect(omdb?.ratings).toHaveLength(4);
  });

  it("enforces strict SSRF allowlist on OMDb Amazon poster URLs", () => {
    expect(isAllowedAmazonPosterUrl(GUARDIANS_VOL2_OMDB.Poster)).toBe(true);
    expect(isAllowedAmazonPosterUrl("http://m.media-amazon.com/images/M/abc.jpg")).toBe(false);
    expect(isAllowedAmazonPosterUrl("https://evil.example.com/images/M/abc.jpg")).toBe(false);
    expect(isAllowedAmazonPosterUrl("https://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isAllowedAmazonPosterUrl("https://m.media-amazon.com/images/M/../secret.jpg")).toBe(
      false,
    );
    expect(isAllowedAmazonPosterUrl("https://m.media-amazon.com/images/M/vector.svg")).toBe(false);
  });

  it("renders all rating sources (IMDb, Rotten Tomatoes, Metacritic, TMDB, Bayesian, dynamic OMDb) cleanly without emojis or default Tailwind colors", () => {
    const omdb = normalizeOmdbTitleDetail(GUARDIANS_VOL2_OMDB);
    const ratings = buildMultiSourceRatings({
      omdb,
      tmdbVoteAverage: SAMPLE_TMDB_DETAIL.voteAverage,
      tmdbVoteCount: SAMPLE_TMDB_DETAIL.voteCount,
      tmdbPopularity: SAMPLE_TMDB_DETAIL.popularity,
      bayesianScore: SAMPLE_TMDB_DETAIL.bayesianScore,
    });

    const { container } = render(<VerifiedRatingsBreakdown ratings={ratings} />);
    expect(screen.getByTestId("rating-card-imdb")).toHaveTextContent("7.6");
    expect(screen.getByTestId("rating-card-imdb")).toHaveTextContent("849,165 votes");
    expect(screen.getByTestId("rating-card-rotten-tomatoes")).toHaveTextContent("85%");
    expect(screen.getByTestId("rating-card-metacritic")).toHaveTextContent("67");
    expect(screen.getByTestId("rating-card-tmdb")).toHaveTextContent("7.6");
    expect(screen.getByTestId("rating-card-tmdb")).toHaveTextContent("23,703 votes");
    expect(screen.getByTestId("rating-card-bayesian")).toHaveTextContent("7.59");
    expect(screen.getByTestId("rating-card-omdb-cinemascore-registry")).toHaveTextContent("92%");

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(container.textContent ?? "")).toBe(false);
    expect(container.querySelectorAll("img")).toHaveLength(0);
    expect(container.innerHTML).not.toMatch(/bg-(zinc|slate|gray|black)|text-white/);
  });

  it("renders complete Production & Release Dossier with Awards callout and Box Office financials", () => {
    const omdb = normalizeOmdbTitleDetail(GUARDIANS_VOL2_OMDB);
    const dossier = buildProductionDossierFromTmdbAndOmdb({
      detail: SAMPLE_TMDB_DETAIL,
      omdb,
    });

    render(<ProductionReleaseDossier dossier={dossier} />);
    expect(screen.getByTestId("dossier-awards-callout")).toHaveTextContent(
      "Nominated for 1 Oscar. 15 wins & 62 nominations total",
    );
    expect(screen.getByTestId("dossier-financial-ledger")).toHaveTextContent("$389,813,101");
    expect(screen.getByTestId("dossier-financial-ledger")).toHaveTextContent("$863,756,051");
    expect(screen.getByTestId("dossier-financial-ledger")).toHaveTextContent("$200,000,000");
    expect(screen.getByText("PG-13")).toBeDefined();
    expect(screen.getByText("James Gunn, Dan Abnett, Andy Lanning")).toBeDefined();
    expect(screen.getByText("tt3896198")).toBeDefined();
  });

  it("renders interactive OfficialArtworkGallery with same-origin OMDb + TMDB posters and stills", () => {
    const omdb = normalizeOmdbTitleDetail(GUARDIANS_VOL2_OMDB);
    const gallery = buildArtworkGalleryItems({
      detail: SAMPLE_TMDB_DETAIL,
      omdb,
    });
    expect(gallery.length).toBe(4);
    expect(gallery.every((g) => g.url.startsWith("/api/v1/"))).toBe(true);

    render(
      <OfficialArtworkGallery
        title="Guardians of the Galaxy Vol. 2"
        items={gallery}
        fallbackArt={SAMPLE_TMDB_DETAIL.fallbackArt}
      />,
    );

    expect(screen.getByRole("button", { name: /Posters \(3\)/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Stills \(1\)/i })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Stills \(1\)/i }));
    expect(screen.getAllByText(/Theatrical Still #1/i).length).toBeGreaterThan(0);
  });
});
