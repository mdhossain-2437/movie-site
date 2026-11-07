import { z } from "zod";
import {
  discoverTmdbWorks,
  getTmdbRuntimeStatus,
  searchTmdbPeople,
} from "@/lib/metadata/tmdb-client";
import {
  TMDB_GENRE_PRESETS,
  TMDB_OFFICIAL_ATTRIBUTION,
  TMDB_STUDIO_PRESETS,
} from "@/lib/metadata/tmdb-types";
import { extractRequestId, jsonNoStore, toProblemResponse } from "@/lib/server/api-helpers";

const DiscoverQuerySchema = z.object({
  mode: z.enum(["trending", "top_rated", "discover", "search"]).default("trending"),
  kind: z.enum(["ALL", "MOVIE", "SERIES"]).default("ALL"),
  studio: z.string().trim().max(40).default("all"),
  genre: z.string().trim().max(40).default("all"),
  personId: z.coerce.number().int().positive().optional(),
  lang: z.string().trim().max(10).default("all"),
  sort: z
    .enum(["popularity.desc", "vote_average.desc", "release_date.desc", "revenue.desc"])
    .default("popularity.desc"),
  q: z.string().trim().max(120).default(""),
  peopleQuery: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().min(1).max(20).default(1),
  limit: z.coerce.number().int().min(1).max(40).default(20),
});

export async function GET(request: Request) {
  const requestId = extractRequestId(request);
  try {
    const status = getTmdbRuntimeStatus();
    if (!status.configured) {
      return jsonNoStore(
        {
          configured: false,
          attribution: TMDB_OFFICIAL_ATTRIBUTION,
          items: [],
          people: [],
          page: 1,
          totalPages: 0,
          totalResults: 0,
          studios: TMDB_STUDIO_PRESETS,
          genres: TMDB_GENRE_PRESETS,
        },
        200,
        requestId,
      );
    }

    const url = new URL(request.url);
    const parsed = DiscoverQuerySchema.parse({
      mode: url.searchParams.get("mode") ?? undefined,
      kind: url.searchParams.get("kind") ?? undefined,
      studio: url.searchParams.get("studio") ?? undefined,
      genre: url.searchParams.get("genre") ?? undefined,
      personId: url.searchParams.get("personId") || undefined,
      lang: url.searchParams.get("lang") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
      peopleQuery: url.searchParams.get("peopleQuery") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });

    if (parsed.peopleQuery) {
      const people = await searchTmdbPeople(parsed.peopleQuery);
      return jsonNoStore(
        {
          configured: true,
          attribution: TMDB_OFFICIAL_ATTRIBUTION,
          people,
        },
        200,
        requestId,
      );
    }

    const discovered = await discoverTmdbWorks({
      mode: parsed.mode,
      kind: parsed.kind,
      studio: parsed.studio,
      genre: parsed.genre,
      personId: parsed.personId,
      language: parsed.lang,
      sort: parsed.sort,
      query: parsed.q,
      page: parsed.page,
      limit: parsed.limit,
    });

    return jsonNoStore(
      {
        configured: true,
        attribution: TMDB_OFFICIAL_ATTRIBUTION,
        ...discovered,
        studios: TMDB_STUDIO_PRESETS,
        genres: TMDB_GENRE_PRESETS,
      },
      200,
      requestId,
    );
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
