import { assertSameOriginRequest } from "@movie/auth";
import { getEnv } from "@movie/config";
import { authorizeAssetDownload, getDatabase } from "@movie/db";
import {
  extractRequestId,
  getCurrentSession,
  jsonNoStore,
  resolveViewerTerritory,
  toProblemResponse,
} from "@/lib/server/api-helpers";
import { getStorageAdapter } from "@/lib/server/storage";

export async function POST(request: Request, context: { params: Promise<{ assetId: string }> }) {
  const requestId = extractRequestId(request);
  try {
    assertSameOriginRequest(request, getEnv().APP_URL);
    const { assetId } = await context.params;
    const territoryCode = await resolveViewerTerritory(request);
    const { session } = await getCurrentSession();
    const db = await getDatabase();
    const storage = getStorageAdapter();

    const authorized = await authorizeAssetDownload(
      db,
      storage,
      { actor: session?.actor ?? null, requestId },
      { assetId, territoryCode },
    );

    return jsonNoStore(authorized, 200, requestId);
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
