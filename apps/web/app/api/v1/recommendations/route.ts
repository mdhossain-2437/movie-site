import { getDatabase, listPublishedTitles, listUserWatchHistorySlugs } from "@movie/db";
import {
  type RecommendationCandidate,
  recommendPersonalizedForSeeds,
  recommendSimilarTitles,
} from "@movie/domain";
import { z } from "zod";
import {
  CINEVA_DATABASE_FILMS,
  getCinevaFilmBySlug,
  toRecommendationCandidate,
} from "@/lib/catalogue/cineva-database";
import { toPublicSummary } from "@/lib/catalogue/dev-showcase";
import { isFixtureCatalogueEnabled } from "@/lib/catalogue/stage";
import {
  extractRequestId,
  getCurrentSession,
  jsonNoStore,
  resolveViewerTerritory,
  toProblemResponse,
} from "@/lib/server/api-helpers";

const QuerySchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(120)
    .optional(),
  seeds: z.string().max(600).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(6),
});

export async function GET(request: Request) {
  const requestId = extractRequestId(request);
  try {
    const url = new URL(request.url);
    const query = QuerySchema.parse({
      slug: url.searchParams.get("slug") ?? undefined,
      seeds: url.searchParams.get("seeds") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });

    const territoryCode = await resolveViewerTerritory(request);
    const db = await getDatabase();
    const dbSummaries = await listPublishedTitles(db, { territoryCode, limit: 50 });

    const candidateMap = new Map<string, RecommendationCandidate>();
    const summaryMap = new Map(dbSummaries.map((s) => [s.slug, s]));

    for (const s of dbSummaries) {
      candidateMap.set(s.slug, {
        slug: s.slug,
        kind: s.kind,
        titleEn: s.localizedTitleEn,
        releaseYear: s.releaseYear,
        runtimeMinutes: s.runtimeMinutes,
        originalLanguage: s.originalLanguage,
        studioSlug: s.studioSlug ?? "independent",
        studioName: s.studioName ?? "Independent Studio",
        genreSlugs: s.genreSlugs ?? [],
        directorSlugs: s.directorSlugs ?? [],
        castSlugs: s.castSlugs ?? [],
        categorySlugs: s.collectionSlugs ?? [],
        moodTags: [],
        rawRating: 8.6,
        voteCount: 6500,
        streamAllowed: s.availability.streamAllowed,
      });
    }

    if (isFixtureCatalogueEnabled()) {
      for (const film of CINEVA_DATABASE_FILMS) {
        if (!candidateMap.has(film.slug)) {
          candidateMap.set(film.slug, toRecommendationCandidate(film));
          summaryMap.set(film.slug, toPublicSummary(film));
        } else {
          // Enrich DB seeded records with rich showcase mood/category signals when matching by slug
          candidateMap.set(film.slug, toRecommendationCandidate(film));
        }
      }
    }

    const pool = Array.from(candidateMap.values());
    let seedSlugs = query.seeds
      ? query.seeds
          .split(",")
          .map((s) => s.trim())
          .filter((s) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s))
      : [];

    let seedSource: "item_slug" | "query_seeds" | "watch_history" | "bayesian_prior" =
      seedSlugs.length > 0 ? "query_seeds" : "bayesian_prior";

    if (!query.slug && seedSlugs.length === 0) {
      const { session } = await getCurrentSession();
      if (session?.actor.userId) {
        const dbHistorySlugs = await listUserWatchHistorySlugs(db, session.actor.userId, 6);
        if (dbHistorySlugs.length > 0) {
          seedSlugs = dbHistorySlugs;
          seedSource = "watch_history";
        }
      }
    }

    let mode: "item_similarity" | "personalized_seeds" | "bayesian_top_rated" =
      "bayesian_top_rated";
    let matches = [] as ReturnType<typeof recommendSimilarTitles>;

    if (query.slug) {
      seedSource = "item_slug";
      const target = candidateMap.get(query.slug);
      if (target) {
        mode = "item_similarity";
        matches = recommendSimilarTitles(target, pool, { limit: query.limit });
      }
    } else {
      mode = seedSlugs.length > 0 ? "personalized_seeds" : "bayesian_top_rated";
      matches = recommendPersonalizedForSeeds(seedSlugs, pool, { limit: query.limit });
    }

    const items = matches.map((match) => {
      const summary = summaryMap.get(match.slug);
      const cineva = getCinevaFilmBySlug(match.slug);
      return {
        ...match,
        summary: summary ?? (cineva ? toPublicSummary(cineva) : null),
        seasonCount: cineva?.seasons?.length ?? 0,
      };
    });

    return jsonNoStore(
      {
        algorithm: "idf-cosine-graph-bayesian-v1",
        mode,
        seedSource,
        seedSlugs,
        territoryCode,
        count: items.length,
        items,
      },
      200,
      requestId,
    );
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
