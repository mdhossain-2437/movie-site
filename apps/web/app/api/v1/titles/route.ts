import { getDatabase, listPublishedTitles } from "@movie/db";
import { z } from "zod";
import {
  extractRequestId,
  jsonNoStore,
  resolveViewerTerritory,
  toProblemResponse,
} from "@/lib/server/api-helpers";

const QuerySchema = z.object({
  lang: z
    .string()
    .regex(/^[a-z]{2,5}$/)
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});

export async function GET(request: Request) {
  const requestId = extractRequestId(request);
  try {
    const url = new URL(request.url);
    const query = QuerySchema.parse({
      lang: url.searchParams.get("lang") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });
    const territoryCode = await resolveViewerTerritory(request);
    const db = await getDatabase();
    const items = await listPublishedTitles(db, {
      territoryCode,
      language: query.lang,
      limit: query.limit,
    });

    return jsonNoStore(
      {
        items,
        territoryCode,
        count: items.length,
      },
      200,
      requestId,
    );
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
