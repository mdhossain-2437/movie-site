import { assertSameOriginRequest } from "@movie/auth";
import { getEnv } from "@movie/config";
import { getDatabase, publishTitle } from "@movie/db";
import { revalidateTag } from "next/cache";
import {
  extractRequestId,
  getCurrentSession,
  jsonNoStore,
  toProblemResponse,
} from "@/lib/server/api-helpers";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = extractRequestId(request);
  try {
    assertSameOriginRequest(request, getEnv().APP_URL);
    const { id } = await context.params;
    const { session } = await getCurrentSession();
    const db = await getDatabase();
    const published = await publishTitle(db, { actor: session?.actor ?? null, requestId }, id);

    revalidateTag("catalogue", "max");
    return jsonNoStore(published, 200, requestId);
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
