import "server-only";

import { getSessionCookieName, type ResolvedSessionInfo, resolveSessionActor } from "@movie/auth";
import { getEnv } from "@movie/config";
import { createProblemDetails } from "@movie/contracts";
import { getDatabase, NotFoundError, RightsGateError } from "@movie/db";
import { AuthorizationError } from "@movie/domain";
import { createLogger, createRequestId } from "@movie/observability";
import { cookies, headers } from "next/headers";
import { connection } from "next/server";
import { z } from "zod";

const logger = createLogger({ service: "@movie/web:api" });

export function extractRequestId(request?: Request): string {
  const raw = request?.headers.get("x-request-id");
  return raw && /^[a-zA-Z0-9_-]{8,64}$/.test(raw) ? raw : createRequestId();
}

export async function resolveViewerTerritory(request?: Request): Promise<string> {
  if (!request) {
    await connection();
  }
  const fallback = getEnv().DEFAULT_TERRITORY;
  const reqHeaders = request ? request.headers : await headers();
  const candidate = reqHeaders.get("cf-ipcountry") ?? reqHeaders.get("x-country-code");

  if (candidate && /^[A-Za-z]{2}$/.test(candidate.trim())) {
    return candidate.trim().toUpperCase();
  }
  return fallback;
}

export async function getCurrentSession(): Promise<{
  session: ResolvedSessionInfo | null;
  rawToken: string | null;
}> {
  const cookieStore = await cookies();
  const cookieName = getSessionCookieName(getEnv().APP_URL);
  const rawToken = cookieStore.get(cookieName)?.value ?? null;
  if (!rawToken) {
    return { session: null, rawToken: null };
  }
  const db = await getDatabase();
  const session = await resolveSessionActor(db, rawToken);
  return { session, rawToken };
}

export function jsonNoStore(
  data: unknown,
  status: number,
  requestId: string,
  extraHeaders?: HeadersInit,
) {
  const responseHeaders = new Headers(extraHeaders);
  responseHeaders.set("Cache-Control", "no-store");
  responseHeaders.set("x-request-id", requestId);
  return Response.json(data, { status, headers: responseHeaders });
}

export function toProblemResponse(error: unknown, requestId: string): Response {
  if (error instanceof z.ZodError) {
    const detail = error.issues
      .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
      .join("; ");
    const problem = createProblemDetails({
      status: 400,
      code: "VALIDATION_ERROR",
      title: "Invalid request payload",
      detail,
      requestId,
    });
    return new Response(JSON.stringify(problem), {
      status: 400,
      headers: {
        "Content-Type": "application/problem+json",
        "Cache-Control": "no-store",
        "x-request-id": requestId,
      },
    });
  }

  if (error instanceof AuthorizationError) {
    const status = error.code === "UNAUTHENTICATED" ? 401 : 403;
    const problem = createProblemDetails({
      status,
      code: error.code,
      title: error.code === "UNAUTHENTICATED" ? "Authentication required" : "Access denied",
      detail: error.message,
      requestId,
    });
    return new Response(JSON.stringify(problem), {
      status,
      headers: {
        "Content-Type": "application/problem+json",
        "Cache-Control": "no-store",
        "x-request-id": requestId,
      },
    });
  }

  if (error instanceof NotFoundError) {
    const problem = createProblemDetails({
      status: 404,
      code: "NOT_FOUND",
      title: "Resource not found",
      detail: error.message,
      requestId,
    });
    return new Response(JSON.stringify(problem), {
      status: 404,
      headers: {
        "Content-Type": "application/problem+json",
        "Cache-Control": "no-store",
        "x-request-id": requestId,
      },
    });
  }

  if (error instanceof RightsGateError) {
    const problem = createProblemDetails({
      status: 422,
      code: error.code,
      title: "Rights policy gate blocked operation",
      detail: error.message,
      requestId,
    });
    return new Response(JSON.stringify(problem), {
      status: 422,
      headers: {
        "Content-Type": "application/problem+json",
        "Cache-Control": "no-store",
        "x-request-id": requestId,
      },
    });
  }

  logger.error("Unhandled API exception", {
    requestId,
    errorMessage: error instanceof Error ? error.message : String(error),
  });

  const problem = createProblemDetails({
    status: 500,
    code: "INTERNAL_ERROR",
    title: "Unexpected server error",
    detail: "An unexpected error occurred while processing the request.",
    requestId,
  });
  return new Response(JSON.stringify(problem), {
    status: 500,
    headers: {
      "Content-Type": "application/problem+json",
      "Cache-Control": "no-store",
      "x-request-id": requestId,
    },
  });
}
