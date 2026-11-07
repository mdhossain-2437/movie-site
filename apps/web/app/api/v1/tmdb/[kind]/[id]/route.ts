import { z } from "zod";
import { fetchTmdbSeasonEpisodes, fetchTmdbWorkDetail } from "@/lib/metadata/tmdb-client";
import { TMDB_OFFICIAL_ATTRIBUTION } from "@/lib/metadata/tmdb-types";
import { extractRequestId, jsonNoStore, toProblemResponse } from "@/lib/server/api-helpers";

const ParamsSchema = z.object({
  kind: z.enum(["movie", "tv"]),
  id: z.coerce.number().int().positive(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ kind: string; id: string }> },
) {
  const requestId = extractRequestId(request);
  try {
    const rawParams = await context.params;
    const { kind, id } = ParamsSchema.parse(rawParams);
    const url = new URL(request.url);
    const seasonRaw = url.searchParams.get("season");

    if (kind === "tv" && seasonRaw !== null) {
      const seasonNumber = z.coerce.number().int().min(0).max(100).parse(seasonRaw);
      const episodes = await fetchTmdbSeasonEpisodes(id, seasonNumber);
      return jsonNoStore(
        {
          tmdbId: id,
          seasonNumber,
          episodes,
          attribution: TMDB_OFFICIAL_ATTRIBUTION,
        },
        200,
        requestId,
      );
    }

    const detail = await fetchTmdbWorkDetail(kind, id);
    return jsonNoStore(
      {
        item: detail,
        attribution: TMDB_OFFICIAL_ATTRIBUTION,
      },
      200,
      requestId,
    );
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
