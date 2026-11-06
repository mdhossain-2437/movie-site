import { getDatabase, searchPublishedTitles } from "@movie/db";
import { z } from "zod";
import {
  extractRequestId,
  jsonNoStore,
  resolveViewerTerritory,
  toProblemResponse,
} from "@/lib/server/api-helpers";

const SearchQuerySchema = z.object({
  q: z.string().trim().max(120).default(""),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});

export async function GET(request: Request) {
  const requestId = extractRequestId(request);
  try {
    const url = new URL(request.url);
    const parsed = SearchQuerySchema.parse({
      q: url.searchParams.get("q") ?? "",
      limit: url.searchParams.get("limit") ?? undefined,
    });
    const territoryCode = await resolveViewerTerritory(request);
    const db = await getDatabase();
    const items = parsed.q
      ? await searchPublishedTitles(db, parsed.q, { territoryCode, limit: parsed.limit })
      : [];

    return jsonNoStore(
      {
        query: parsed.q,
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
