import { getDatabase, getPublishedTitleBySlug, NotFoundError } from "@movie/db";
import {
  extractRequestId,
  jsonNoStore,
  resolveViewerTerritory,
  toProblemResponse,
} from "@/lib/server/api-helpers";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const requestId = extractRequestId(request);
  try {
    const { slug } = await context.params;
    const territoryCode = await resolveViewerTerritory(request);
    const db = await getDatabase();
    const title = await getPublishedTitleBySlug(db, slug, { territoryCode });
    if (!title) {
      throw new NotFoundError(`Published title not found: ${slug}`);
    }

    return jsonNoStore({ title, territoryCode }, 200, requestId);
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
