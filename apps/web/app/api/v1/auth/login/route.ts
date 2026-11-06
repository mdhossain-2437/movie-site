import {
  assertSameOriginRequest,
  authenticateWithPassword,
  buildSessionCookieOptions,
} from "@movie/auth";
import { getEnv } from "@movie/config";
import { getDatabase } from "@movie/db";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  extractRequestId,
  getCurrentSession,
  jsonNoStore,
  toProblemResponse,
} from "@/lib/server/api-helpers";

const LoginBodySchema = z.object({
  email: z.email().max(180),
  password: z.string().min(1).max(256),
});

export async function POST(request: Request) {
  const requestId = extractRequestId(request);
  try {
    const env = getEnv();
    assertSameOriginRequest(request, env.APP_URL);
    const body = LoginBodySchema.parse(await request.json());

    const { rawToken: previousRawToken } = await getCurrentSession();
    const db = await getDatabase();
    const result = await authenticateWithPassword(db, {
      email: body.email,
      password: body.password,
      userAgent: request.headers.get("user-agent"),
      previousRawToken,
      requestId,
    });

    const cookieOpts = buildSessionCookieOptions(env.APP_URL, result.expiresAt);
    const cookieStore = await cookies();
    cookieStore.set(cookieOpts.name, result.rawToken, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      expires: cookieOpts.expires,
    });

    return jsonNoStore(
      {
        authenticated: true,
        actor: result.actor,
        expiresAt: result.expiresAt.toISOString(),
      },
      200,
      requestId,
    );
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
