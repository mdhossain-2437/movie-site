import { assertSameOriginRequest, getSessionCookieName, revokeSessionByToken } from "@movie/auth";
import { getEnv } from "@movie/config";
import { getDatabase } from "@movie/db";
import { cookies } from "next/headers";
import {
  extractRequestId,
  getCurrentSession,
  jsonNoStore,
  toProblemResponse,
} from "@/lib/server/api-helpers";

export async function POST(request: Request) {
  const requestId = extractRequestId(request);
  try {
    const env = getEnv();
    assertSameOriginRequest(request, env.APP_URL);

    const { rawToken } = await getCurrentSession();
    if (rawToken) {
      const db = await getDatabase();
      await revokeSessionByToken(db, rawToken, requestId);
    }

    const cookieStore = await cookies();
    cookieStore.delete(getSessionCookieName(env.APP_URL));

    return jsonNoStore({ authenticated: false }, 200, requestId);
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
