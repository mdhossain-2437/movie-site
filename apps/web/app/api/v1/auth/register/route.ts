import {
  assertSameOriginRequest,
  authenticateWithPassword,
  buildSessionCookieOptions,
  createUserWithRoles,
} from "@movie/auth";
import { getEnv } from "@movie/config";
import { getDatabase } from "@movie/db";
import { cookies } from "next/headers";
import { z } from "zod";
import { extractRequestId, jsonNoStore, toProblemResponse } from "@/lib/server/api-helpers";

const RegisterBodySchema = z.object({
  email: z.email().max(180),
  password: z.string().min(10).max(256),
  displayName: z.string().trim().min(2).max(80),
});

export async function POST(request: Request) {
  const requestId = extractRequestId(request);
  try {
    const env = getEnv();
    assertSameOriginRequest(request, env.APP_URL);
    const body = RegisterBodySchema.parse(await request.json());

    const db = await getDatabase();
    // Self-registration strictly grants VIEWER role only; staff roles require privileged grant.
    await createUserWithRoles(db, {
      email: body.email,
      password: body.password,
      displayName: body.displayName,
      roles: ["VIEWER"],
      requestId,
    });

    const login = await authenticateWithPassword(db, {
      email: body.email,
      password: body.password,
      userAgent: request.headers.get("user-agent"),
      requestId,
    });

    const cookieOpts = buildSessionCookieOptions(env.APP_URL, login.expiresAt);
    const cookieStore = await cookies();
    cookieStore.set(cookieOpts.name, login.rawToken, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      expires: cookieOpts.expires,
    });

    return jsonNoStore(
      {
        authenticated: true,
        actor: login.actor,
        expiresAt: login.expiresAt.toISOString(),
      },
      201,
      requestId,
    );
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
