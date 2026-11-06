import {
  extractRequestId,
  getCurrentSession,
  jsonNoStore,
  toProblemResponse,
} from "@/lib/server/api-helpers";

export async function GET(request: Request) {
  const requestId = extractRequestId(request);
  try {
    const { session } = await getCurrentSession();
    if (!session) {
      return jsonNoStore({ authenticated: false, session: null }, 200, requestId);
    }

    return jsonNoStore(
      {
        authenticated: true,
        session: {
          email: session.email,
          displayName: session.displayName,
          userId: session.actor.userId,
          roles: session.actor.roles,
          mfaVerified: Boolean(session.actor.mfaVerified),
          expiresAt: session.expiresAt.toISOString(),
        },
      },
      200,
      requestId,
    );
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
