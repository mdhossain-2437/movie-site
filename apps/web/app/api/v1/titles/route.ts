import { CatalogueSortSchema, MaturityRatingSchema, TitleKindSchema } from "@movie/contracts";
import { getDatabase, listPublishedTitles, type PublicTitleSummary } from "@movie/db";
import { z } from "zod";
import {
  CINEVA_GENRES,
  CINEVA_PEOPLE,
  CINEVA_SPECIAL_CATEGORIES,
  CINEVA_STUDIOS,
  getCinevaFilmBySlug,
  getCinevaTopRatedMap,
} from "@/lib/catalogue/cineva-database";
import { listDevShowcaseSummaries } from "@/lib/catalogue/dev-showcase";
import {
  extractRequestId,
  jsonNoStore,
  resolveViewerTerritory,
  toProblemResponse,
} from "@/lib/server/api-helpers";

const SlugParamSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(80)
  .optional();

const QuerySchema = z.object({
  kind: TitleKindSchema.optional(),
  lang: z
    .string()
    .regex(/^[a-z]{2,5}$/)
    .optional(),
  genre: SlugParamSchema,
  director: SlugParamSchema,
  cast: SlugParamSchema,
  category: SlugParamSchema,
  studio: SlugParamSchema,
  rating: MaturityRatingSchema.optional(),
  access: z.enum(["all", "stream", "download"]).optional(),
  sort: CatalogueSortSchema.default("featured"),
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});

export async function GET(request: Request) {
  const requestId = extractRequestId(request);
  try {
    const url = new URL(request.url);
    const getOpt = (key: string) => {
      const val = url.searchParams.get(key);
      return val && val !== "all" && val !== "ALL" ? val : undefined;
    };

    const query = QuerySchema.parse({
      kind: getOpt("kind"),
      lang: getOpt("lang"),
      genre: getOpt("genre"),
      director: getOpt("director"),
      cast: getOpt("cast"),
      category: getOpt("category"),
      studio: getOpt("studio"),
      rating: getOpt("rating"),
      access: url.searchParams.get("access") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });

    const territoryCode = await resolveViewerTerritory(request);
    const db = await getDatabase();
    const dbItems = await listPublishedTitles(db, {
      territoryCode,
      kind: query.kind,
      language: query.lang,
      genreSlug: query.genre,
      directorSlug: query.director,
      castSlug: query.cast,
      collectionSlug: query.category,
      studioSlug: query.studio,
      maturityRating: query.rating,
      sort: query.sort,
      limit: query.limit,
    });

    const showcaseItems = listDevShowcaseSummaries({
      kind: query.kind,
      language: query.lang,
      genreSlug: query.genre,
      directorSlug: query.director,
      castSlug: query.cast,
      categorySlug: query.category,
      studioSlug: query.studio,
      maturityRating: query.rating,
      access: query.access,
      sort: query.sort,
      query: query.q,
    });

    const seenSlugs = new Set<string>();
    let merged: PublicTitleSummary[] = [];

    for (const item of dbItems) {
      if (query.access === "stream" && !item.availability.streamAllowed) continue;
      if (query.access === "download" && !item.availability.downloadAllowed) continue;
      if (query.q) {
        const needle = query.q.toLowerCase();
        const hay =
          `${item.localizedTitleEn} ${item.localizedTitleBn ?? ""} ${item.originalTitle} ${item.synopsisEn} ${item.studioName ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) continue;
      }
      seenSlugs.add(item.slug);
      merged.push(item);
    }

    for (const sc of showcaseItems) {
      if (!seenSlugs.has(sc.slug)) {
        seenSlugs.add(sc.slug);
        merged.push(sc);
      }
    }

    const topMap = getCinevaTopRatedMap();
    if (query.sort === "top_rated") {
      merged = [...merged].sort((a, b) => {
        const scoreA = topMap.get(a.slug)?.bayesianScore ?? 8.0;
        const scoreB = topMap.get(b.slug)?.bayesianScore ?? 8.0;
        return scoreB - scoreA || b.releaseYear - a.releaseYear;
      });
    }

    const totalCount = merged.length;
    const items = merged.slice(0, query.limit).map((item) => {
      const cineva = getCinevaFilmBySlug(item.slug);
      const ranking = topMap.get(item.slug);
      return {
        ...item,
        bayesianScore: ranking?.bayesianScore ?? cineva?.rawRating ?? null,
        topRank: ranking?.topRank ?? null,
        seasonCount: cineva?.seasons?.length ?? (item.kind === "SERIES" ? 1 : 0),
        categorySlugs: cineva?.categorySlugs ?? item.collectionSlugs ?? [],
      };
    });

    return jsonNoStore(
      {
        items,
        territoryCode,
        count: items.length,
        totalCount,
        facets: {
          genres: CINEVA_GENRES,
          studios: CINEVA_STUDIOS.map((s) => ({
            slug: s.slug,
            nameEn: s.nameEn,
            shortLabel: s.shortLabel,
          })),
          categories: CINEVA_SPECIAL_CATEGORIES.map((c) => ({
            slug: c.slug,
            titleEn: c.titleEn,
            shortLabel: c.shortLabel,
          })),
          directors: CINEVA_PEOPLE.filter((p) =>
            p.primaryRole.toLowerCase().includes("director"),
          ).map((p) => ({ slug: p.slug, nameEn: p.nameEn })),
          cast: CINEVA_PEOPLE.filter((p) => p.primaryRole.toLowerCase().includes("actor")).map(
            (p) => ({ slug: p.slug, nameEn: p.nameEn }),
          ),
        },
      },
      200,
      requestId,
    );
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
