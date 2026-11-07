import { describe, expect, it } from "vitest";
import {
  computeBayesianTopScore,
  rankTopRatedCandidates,
  type RecommendationCandidate,
  recommendPersonalizedForSeeds,
  recommendSimilarTitles,
} from "./recommendation-engine.ts";

const SAMPLE_POOL: RecommendationCandidate[] = [
  {
    slug: "the-last-monsoon",
    kind: "MOVIE",
    titleEn: "The Last Monsoon",
    releaseYear: 2024,
    runtimeMinutes: 118,
    originalLanguage: "bn",
    studioSlug: "monsoon-shadow-studios",
    studioName: "Monsoon Shadow Pictures",
    genreSlugs: ["noir", "thriller", "drama"],
    genreNames: { noir: "Noir", thriller: "Thriller", drama: "Drama" },
    directorSlugs: ["amina-rahman"],
    directorNames: { "amina-rahman": "Amina Rahman" },
    castSlugs: ["tariq-anam", "nusrat-imrose"],
    castNames: { "tariq-anam": "Tariq Anam", "nusrat-imrose": "Nusrat Imrose" },
    categorySlugs: ["top-rated-250", "obsidian-vigilante-mythos"],
    categoryNames: {
      "top-rated-250": "Top Rated Hall of Fame",
      "obsidian-vigilante-mythos": "Dark Vigilante Mythos",
    },
    moodTags: ["rain", "detective", "riverfront", "conspiracy"],
    rawRating: 9.4,
    voteCount: 48_200,
  },
  {
    slug: "the-obsidian-watchman",
    kind: "MOVIE",
    titleEn: "The Obsidian Watchman",
    releaseYear: 2024,
    runtimeMinutes: 136,
    originalLanguage: "bn",
    studioSlug: "monsoon-shadow-studios",
    studioName: "Monsoon Shadow Pictures",
    genreSlugs: ["noir", "action", "thriller"],
    genreNames: { noir: "Noir", action: "Action", thriller: "Thriller" },
    directorSlugs: ["amina-rahman"],
    directorNames: { "amina-rahman": "Amina Rahman" },
    castSlugs: ["tariq-anam"],
    castNames: { "tariq-anam": "Tariq Anam" },
    categorySlugs: ["obsidian-vigilante-mythos"],
    categoryNames: { "obsidian-vigilante-mythos": "Dark Vigilante Mythos" },
    moodTags: ["rain", "vigilante", "conspiracy"],
    rawRating: 9.3,
    voteCount: 52_000,
  },
  {
    slug: "starfall-vanguard",
    kind: "SERIES",
    titleEn: "Starfall Vanguard",
    releaseYear: 2025,
    runtimeMinutes: 52,
    originalLanguage: "en",
    studioSlug: "vanguard-mythic-studios",
    studioName: "Vanguard Mythic Studios",
    genreSlugs: ["sci-fi", "action"],
    genreNames: { "sci-fi": "Sci-Fi", action: "Action" },
    directorSlugs: ["elena-rostova"],
    directorNames: { "elena-rostova": "Elena Rostova" },
    castSlugs: ["aupee-karim"],
    castNames: { "aupee-karim": "Aupee Karim" },
    categorySlugs: ["crimson-multiverse", "original-series"],
    categoryNames: {
      "crimson-multiverse": "Crimson Vanguard Universe",
      "original-series": "Original Series",
    },
    moodTags: ["cosmic", "orbital", "heroic"],
    rawRating: 9.2,
    voteCount: 64_000,
  },
  {
    slug: "low-vote-outlier",
    kind: "MOVIE",
    titleEn: "Low Vote Outlier",
    releaseYear: 2023,
    runtimeMinutes: 90,
    originalLanguage: "en",
    studioSlug: "atlas-public-domain-vault",
    studioName: "Atlas Heritage Vault",
    genreSlugs: ["documentary"],
    directorSlugs: ["rafiq-azad"],
    castSlugs: [],
    categorySlugs: [],
    moodTags: ["loom"],
    rawRating: 9.9,
    voteCount: 40, // tiny sample size — Bayesian WR must shrink toward catalogue mean!
  },
];

describe("@movie/domain Recommendation & Bayesian Top-Rated Engine", () => {
  it("prevents low-vote outliers from outranking high-confidence acclaim via Bayesian WR", () => {
    const ranked = rankTopRatedCandidates(SAMPLE_POOL, 10_000);
    expect(ranked[0]?.slug).toBe("the-last-monsoon");
    const outlier = ranked.find((r) => r.slug === "low-vote-outlier")!;
    expect(outlier.bayesianScore).toBeLessThan(ranked[0]!.bayesianScore);
    expect(computeBayesianTopScore(9.5, 50_000, 8.5, 5_000)).toBeGreaterThan(9.35);
  });

  it("ranks same-director, shared-cast, shared-universe noir highest and explains why", () => {
    const anchor = SAMPLE_POOL[0]!;
    const recs = recommendSimilarTitles(anchor, SAMPLE_POOL, { limit: 3 });

    expect(recs).toHaveLength(3);
    expect(recs[0]?.slug).toBe("the-obsidian-watchman");
    expect(recs[0]!.matchPercentage).toBeGreaterThan(recs[1]!.matchPercentage);
    expect(recs[0]!.reasons).toContain("Same Director: Amina Rahman");
    expect(recs[0]!.reasons).toContain("Dark Vigilante Mythos");
  });

  it("produces deterministic personalized multi-seed recommendations with recency decay", () => {
    const feed = recommendPersonalizedForSeeds(["the-last-monsoon"], SAMPLE_POOL, {
      limit: 2,
      excludeSeeds: true,
    });
    expect(feed).toHaveLength(2);
    expect(feed[0]?.slug).toBe("the-obsidian-watchman");
    expect(feed[0]?.reasons[0]).toBe("Because you watched The Last Monsoon");
  });
});
