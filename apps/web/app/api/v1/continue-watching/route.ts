import { getDatabase, listUserContinueWatching } from "@movie/db";
import { z } from "zod";
import { getCinevaFilmBySlug } from "@/lib/catalogue/cineva-database";
import {
  extractRequestId,
  getCurrentSession,
  jsonNoStore,
  toProblemResponse,
} from "@/lib/server/api-helpers";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(16).default(6),
});

export async function GET(request: Request) {
  const requestId = extractRequestId(request);
  try {
    const url = new URL(request.url);
    const query = QuerySchema.parse({
      limit: url.searchParams.get("limit") ?? undefined,
    });

    const { session } = await getCurrentSession();
    if (!session) {
      return jsonNoStore({ authenticated: false, continueWatching: [] }, 200, requestId);
    }

    const db = await getDatabase();
    const records = await listUserContinueWatching(db, session.actor.userId, query.limit);

    const continueWatching = records.map((record) => {
      const cineva = getCinevaFilmBySlug(record.titleSlug);
      return {
        titleId: record.titleId,
        titleSlug: record.titleSlug,
        titleEn: record.titleEn,
        kind: record.kind,
        releaseYear: record.releaseYear,
        runtimeMinutes: record.runtimeMinutes,
        lastPositionSeconds: record.lastPositionSeconds,
        durationSeconds: record.durationSeconds,
        progressPercent: record.progressPercent,
        updatedAt: record.updatedAt.toISOString(),
        studio: cineva?.studio ?? "CINEVA Originals",
        art: cineva?.art ?? null,
      };
    });

    return jsonNoStore(
      {
        authenticated: true,
        continueWatching,
      },
      200,
      requestId,
    );
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
