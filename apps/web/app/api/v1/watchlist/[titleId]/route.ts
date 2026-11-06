import { assertSameOriginRequest } from "@movie/auth";
import { getEnv } from "@movie/config";
import { addWatchlistItem, getDatabase, removeWatchlistItem } from "@movie/db";
import {
  extractRequestId,
  getCurrentSession,
  jsonNoStore,
  toProblemResponse,
} from "@/lib/server/api-helpers";

export async function POST(request: Request, context: { params: Promise<{ titleId: string }> }) {
  const requestId = extractRequestId(request);
  try {
    assertSameOriginRequest(request, getEnv().APP_URL);
    const { titleId } = await context.params;
    const { session } = await getCurrentSession();
    const db = await getDatabase();
    const saved = await addWatchlistItem(db, { actor: session?.actor ?? null, requestId }, titleId);
    return jsonNoStore({ saved: true, titleId: saved.titleId }, 200, requestId);
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ titleId: string }> }) {
  const requestId = extractRequestId(request);
  try {
    assertSameOriginRequest(request, getEnv().APP_URL);
    const { titleId } = await context.params;
    const { session } = await getCurrentSession();
    const db = await getDatabase();
    await removeWatchlistItem(db, { actor: session?.actor ?? null, requestId }, titleId);
    return jsonNoStore({ saved: false, titleId }, 200, requestId);
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
