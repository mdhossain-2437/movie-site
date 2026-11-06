import { assertSameOriginRequest, buildSessionCookieOptions, verifySessionMfa } from "@movie/auth";
import { getEnv } from "@movie/config";
import { getDatabase } from "@movie/db";
import { AuthorizationError } from "@movie/domain";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  extractRequestId,
  getCurrentSession,
  jsonNoStore,
  toProblemResponse,
} from "@/lib/server/api-helpers";

const MfaVerifySchema = z.object({
  totpCode: z.string().regex(/^\d{6}$/, "Enter a 6-digit authenticator code"),
});

export async function POST(request: Request) {
  const requestId = extractRequestId(request);
  try {
    const env = getEnv();
    assertSameOriginRequest(request, env.APP_URL);
    const body = MfaVerifySchema.parse(await request.json());

    const { rawToken } = await getCurrentSession();
    if (!rawToken) {
      throw new AuthorizationError("UNAUTHENTICATED", "Sign in before verifying MFA");
    }

    const db = await getDatabase();
    const verified = await verifySessionMfa(db, {
      rawSessionToken: rawToken,
      totpCode: body.totpCode,
      requestId,
    });

    const cookieOpts = buildSessionCookieOptions(env.APP_URL, verified.expiresAt);
    const cookieStore = await cookies();
    cookieStore.set(cookieOpts.name, verified.rawToken, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      expires: cookieOpts.expires,
    });

    return jsonNoStore(
      { mfaVerified: true, expiresAt: verified.expiresAt.toISOString() },
      200,
      requestId,
    );
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
