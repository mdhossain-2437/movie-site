import type { TitleKind } from "@movie/contracts";

export interface RecommendationCandidate {
  slug: string;
  kind: TitleKind;
  titleEn: string;
  releaseYear: number;
  runtimeMinutes: number;
  originalLanguage: string;
  studioSlug: string;
  studioName: string;
  genreSlugs: readonly string[];
  genreNames?: Readonly<Record<string, string>>;
  directorSlugs: readonly string[];
  directorNames?: Readonly<Record<string, string>>;
  castSlugs: readonly string[];
  castNames?: Readonly<Record<string, string>>;
  categorySlugs: readonly string[];
  categoryNames?: Readonly<Record<string, string>>;
  moodTags: readonly string[];
  /** Rating on a 0..10 scale (e.g. 9.4) */
  rawRating: number;
  /** Number of verified ratings */
  voteCount: number;
  streamAllowed?: boolean;
}

export interface RecommendationScoreBreakdown {
  genreMoodCosine: number;
  directorOverlap: number;
  castOverlap: number;
  universeCategoryOverlap: number;
  contextQualityPrior: number;
  compositeScore: number;
}

export interface RecommendationMatch {
  slug: string;
  kind: TitleKind;
  titleEn: string;
  matchPercentage: number;
  bayesianScore: number;
  reasons: string[];
  seedTitleEn?: string;
  breakdown: RecommendationScoreBreakdown;
}

export interface RankedTopRatedEntry {
  slug: string;
  topRank: number;
  bayesianScore: number;
  rawRating: number;
  voteCount: number;
}

/**
 * Computes the Bayesian Weighted Rating (WR) used by authoritative film databases:
 *   WR = (v / (v + m)) * R + (m / (v + m)) * C
 * where:
 *   R = title's average rating (0..10)
 *   v = title's verified vote count
 *   m = minimum vote confidence threshold
 *   C = mean rating across the entire catalogue
 */
export function computeBayesianTopScore(
  rawRating: number,
  voteCount: number,
  catalogueMeanRating: number,
  minVotesConfidence = 5000,
): number {
  const safeRating = Math.min(Math.max(Number.isFinite(rawRating) ? rawRating : 0, 0), 10);
  const safeVotes = Math.max(Number.isFinite(voteCount) ? voteCount : 0, 0);
  const safeMean = Math.min(
    Math.max(Number.isFinite(catalogueMeanRating) ? catalogueMeanRating : 7.5, 0),
    10,
  );
  const m = Math.max(minVotesConfidence, 1);

  const wr = (safeVotes / (safeVotes + m)) * safeRating + (m / (safeVotes + m)) * safeMean;
  return Math.round(wr * 100) / 100;
}

export function computeCatalogueMeanRating(pool: readonly RecommendationCandidate[]): number {
  if (pool.length === 0) return 8.0;
  let weightedSum = 0;
  let totalVotes = 0;
  let rawSum = 0;
  for (const item of pool) {
    const v = Math.max(0, item.voteCount);
    weightedSum += item.rawRating * v;
    totalVotes += v;
    rawSum += item.rawRating;
  }
  return totalVotes > 0 ? weightedSum / totalVotes : rawSum / pool.length;
}

export function rankTopRatedCandidates(
  pool: readonly RecommendationCandidate[],
  minVotesConfidence = 5000,
): RankedTopRatedEntry[] {
  const mean = computeCatalogueMeanRating(pool);
  return [...pool]
    .map((c) => ({
      slug: c.slug,
      bayesianScore: computeBayesianTopScore(c.rawRating, c.voteCount, mean, minVotesConfidence),
      rawRating: c.rawRating,
      voteCount: c.voteCount,
    }))
    .sort((a, b) => {
      if (b.bayesianScore !== a.bayesianScore) return b.bayesianScore - a.bayesianScore;
      if (b.rawRating !== a.rawRating) return b.rawRating - a.rawRating;
      return b.voteCount - a.voteCount;
    })
    .map((entry, idx) => ({
      ...entry,
      topRank: idx + 1,
    }));
}

function buildIdfMap(pool: readonly RecommendationCandidate[]): Map<string, number> {
  const docFreq = new Map<string, number>();
  const totalDocs = Math.max(pool.length, 1);

  for (const doc of pool) {
    const uniqueTokens = new Set<string>([
      ...doc.genreSlugs.map((g) => `g:${g}`),
      ...doc.moodTags.map((m) => `m:${m}`),
    ]);
    for (const token of uniqueTokens) {
      docFreq.set(token, (docFreq.get(token) ?? 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [token, df] of docFreq.entries()) {
    idf.set(token, Math.log((totalDocs + 1) / (df + 1)) + 1);
  }
  return idf;
}

function computeIdfCosine(
  tokensA: readonly string[],
  tokensB: readonly string[],
  idf: ReadonlyMap<string, number>,
): number {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  if (setA.size === 0 || setB.size === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const t of setA) {
    const w = idf.get(t) ?? 1;
    normA += w * w;
    if (setB.has(t)) {
      dot += w * w;
    }
  }
  for (const t of setB) {
    const w = idf.get(t) ?? 1;
    normB += w * w;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function computeSetOverlap(
  a: readonly string[],
  b: readonly string[],
): {
  score: number;
  shared: string[];
} {
  if (a.length === 0 || b.length === 0) {
    return { score: 0, shared: [] };
  }
  const setB = new Set(b);
  const shared = a.filter((x) => setB.has(x));
  if (shared.length === 0) {
    return { score: 0, shared: [] };
  }
  const denom = Math.sqrt(a.length * b.length);
  return {
    score: Math.min(shared.length / denom, 1),
    shared,
  };
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Ranks similar movies & series for an anchor title using IDF-weighted genre/mood cosine similarity,
 * director & principal cast graph overlap, universe/category affinity, studio/era proximity, and
 * Bayesian rating quality prior.
 */
export function recommendSimilarTitles(
  anchor: RecommendationCandidate,
  pool: readonly RecommendationCandidate[],
  options?: {
    limit?: number;
    preferSameKind?: boolean;
  },
): RecommendationMatch[] {
  const limit = Math.min(Math.max(options?.limit ?? 6, 1), 24);
  const idf = buildIdfMap(pool);
  const globalMean = computeCatalogueMeanRating(pool);

  const anchorTokens = [
    ...anchor.genreSlugs.map((g) => `g:${g}`),
    ...anchor.moodTags.map((m) => `m:${m}`),
  ];

  const scored: RecommendationMatch[] = [];

  for (const candidate of pool) {
    if (candidate.slug === anchor.slug) continue;

    const candidateTokens = [
      ...candidate.genreSlugs.map((g) => `g:${g}`),
      ...candidate.moodTags.map((m) => `m:${m}`),
    ];

    const genreMoodCosine = computeIdfCosine(anchorTokens, candidateTokens, idf);
    const dirMatch = computeSetOverlap(anchor.directorSlugs, candidate.directorSlugs);
    const castMatch = computeSetOverlap(anchor.castSlugs, candidate.castSlugs);
    const catMatch = computeSetOverlap(anchor.categorySlugs, candidate.categorySlugs);
    const sharedGenres = computeSetOverlap(anchor.genreSlugs, candidate.genreSlugs);

    const yearDelta = Math.abs(anchor.releaseYear - candidate.releaseYear);
    const eraSimilarity = Math.exp(-(yearDelta * yearDelta) / (2 * 14 * 14));
    const studioMatch = anchor.studioSlug && anchor.studioSlug === candidate.studioSlug ? 1 : 0;
    const kindAffinity = anchor.kind === candidate.kind ? 1 : options?.preferSameKind ? 0.45 : 0.78;
    const langAffinity = anchor.originalLanguage === candidate.originalLanguage ? 1 : 0.65;

    const bayesianScore = computeBayesianTopScore(
      candidate.rawRating,
      candidate.voteCount,
      globalMean,
    );
    const normalizedQuality = Math.min(Math.max((bayesianScore - 6.0) / 4.0, 0), 1);

    const contextQualityPrior =
      0.28 * studioMatch +
      0.24 * eraSimilarity +
      0.18 * kindAffinity +
      0.12 * langAffinity +
      0.18 * normalizedQuality;

    const compositeScore =
      0.35 * genreMoodCosine +
      0.2 * dirMatch.score +
      0.13 * castMatch.score +
      0.18 * catMatch.score +
      0.14 * contextQualityPrior;

    // Calibrated deterministic match percentage (60..99%)
    const calibrated = Math.round(60 + Math.min(compositeScore / 0.82, 1) * 39);
    const matchPercentage = Math.min(Math.max(calibrated, 60), 99);

    const reasons: string[] = [];
    if (dirMatch.shared.length > 0) {
      const dirSlug = dirMatch.shared[0]!;
      const dirName =
        candidate.directorNames?.[dirSlug] ??
        anchor.directorNames?.[dirSlug] ??
        dirSlug.replace(/-/g, " ");
      reasons.push(`Same Director: ${dirName}`);
    }
    if (catMatch.shared.length > 0) {
      const catSlug = catMatch.shared[0]!;
      const catName = candidate.categoryNames?.[catSlug] ?? anchor.categoryNames?.[catSlug] ?? null;
      if (catName) {
        reasons.push(catName);
      }
    }
    if (castMatch.shared.length > 0 && reasons.length < 3) {
      const castSlug = castMatch.shared[0]!;
      const castName =
        candidate.castNames?.[castSlug] ??
        anchor.castNames?.[castSlug] ??
        castSlug.replace(/-/g, " ");
      reasons.push(`Features ${castName}`);
    }
    if (sharedGenres.shared.length > 0 && reasons.length < 3) {
      const labels = sharedGenres.shared
        .slice(0, 2)
        .map((s) => candidate.genreNames?.[s] ?? anchor.genreNames?.[s] ?? s.toUpperCase());
      reasons.push(`Shared ${labels.join(" & ")} DNA`);
    }
    if (studioMatch === 1 && reasons.length < 3) {
      reasons.push(`Studio: ${candidate.studioName}`);
    }
    if (reasons.length === 0) {
      reasons.push(
        candidate.kind === "SERIES" ? "Acclaimed CINEVA Series" : "Top-Rated CINEVA Feature",
      );
    }

    scored.push({
      slug: candidate.slug,
      kind: candidate.kind,
      titleEn: candidate.titleEn,
      matchPercentage,
      bayesianScore,
      reasons: reasons.slice(0, 3),
      breakdown: {
        genreMoodCosine: round3(genreMoodCosine),
        directorOverlap: round3(dirMatch.score),
        castOverlap: round3(castMatch.score),
        universeCategoryOverlap: round3(catMatch.score),
        contextQualityPrior: round3(contextQualityPrior),
        compositeScore: round3(compositeScore),
      },
    });
  }

  scored.sort((a, b) => {
    if (b.breakdown.compositeScore !== a.breakdown.compositeScore) {
      return b.breakdown.compositeScore - a.breakdown.compositeScore;
    }
    return b.bayesianScore - a.bayesianScore;
  });

  return scored.slice(0, limit);
}

/**
 * Generates personalized multi-seed recommendations from a viewer's watched/saved seed titles
 * with recency decay (0.85^index).
 */
export function recommendPersonalizedForSeeds(
  seedSlugs: readonly string[],
  pool: readonly RecommendationCandidate[],
  options?: {
    limit?: number;
    excludeSeeds?: boolean;
  },
): RecommendationMatch[] {
  const limit = Math.min(Math.max(options?.limit ?? 8, 1), 24);
  const excludeSeeds = options?.excludeSeeds ?? true;
  const uniqueSeeds = Array.from(new Set(seedSlugs))
    .map((slug) => pool.find((c) => c.slug === slug))
    .filter((c): c is RecommendationCandidate => Boolean(c))
    .slice(0, 6);

  if (uniqueSeeds.length === 0) {
    const top = rankTopRatedCandidates(pool).slice(0, limit);
    return top
      .map((entry) => {
        const c = pool.find((item) => item.slug === entry.slug);
        if (!c) return null;
        return {
          slug: c.slug,
          kind: c.kind,
          titleEn: c.titleEn,
          matchPercentage: Math.min(98, Math.round(c.rawRating * 10 + 3)),
          bayesianScore: entry.bayesianScore,
          reasons: [`#${entry.topRank} in Top Rated Hall of Fame`, `Studio: ${c.studioName}`],
          breakdown: {
            genreMoodCosine: 0,
            directorOverlap: 0,
            castOverlap: 0,
            universeCategoryOverlap: 0,
            contextQualityPrior: round3(entry.bayesianScore / 10),
            compositeScore: round3(entry.bayesianScore / 10),
          },
        } satisfies RecommendationMatch;
      })
      .filter((x): x is RecommendationMatch => x !== null);
  }

  const seedSlugSet = new Set(uniqueSeeds.map((s) => s.slug));
  const aggregated = new Map<
    string,
    {
      weightedSum: number;
      weightTotal: number;
      bestMatch: RecommendationMatch;
      bestSeedTitle: string;
    }
  >();

  uniqueSeeds.forEach((seed, idx) => {
    const recencyWeight = Math.pow(0.85, idx);
    const matches = recommendSimilarTitles(seed, pool, { limit: pool.length });
    for (const m of matches) {
      if (excludeSeeds && seedSlugSet.has(m.slug)) continue;
      const existing = aggregated.get(m.slug);
      if (!existing) {
        aggregated.set(m.slug, {
          weightedSum: m.breakdown.compositeScore * recencyWeight,
          weightTotal: recencyWeight,
          bestMatch: m,
          bestSeedTitle: seed.titleEn,
        });
      } else {
        existing.weightedSum += m.breakdown.compositeScore * recencyWeight;
        existing.weightTotal += recencyWeight;
        if (m.breakdown.compositeScore > existing.bestMatch.breakdown.compositeScore) {
          existing.bestMatch = m;
          existing.bestSeedTitle = seed.titleEn;
        }
      }
    }
  });

  const merged: RecommendationMatch[] = [];
  for (const entry of aggregated.values()) {
    const meanComposite = round3(entry.weightedSum / Math.max(entry.weightTotal, 0.001));
    const matchPercentage = Math.min(
      99,
      Math.max(62, Math.round(60 + Math.min(meanComposite / 0.8, 1) * 39)),
    );
    const seedReason = `Because you watched ${entry.bestSeedTitle}`;
    const reasons = [seedReason, ...entry.bestMatch.reasons.filter((r) => r !== seedReason)].slice(
      0,
      3,
    );

    merged.push({
      ...entry.bestMatch,
      matchPercentage,
      seedTitleEn: entry.bestSeedTitle,
      reasons,
      breakdown: {
        ...entry.bestMatch.breakdown,
        compositeScore: meanComposite,
      },
    });
  }

  merged.sort((a, b) => {
    if (b.breakdown.compositeScore !== a.breakdown.compositeScore) {
      return b.breakdown.compositeScore - a.breakdown.compositeScore;
    }
    return b.bayesianScore - a.bayesianScore;
  });

  return merged.slice(0, limit);
}
