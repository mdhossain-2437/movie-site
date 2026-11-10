import { NextResponse, type NextRequest } from "next/server";

const BASE_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self' blob:",
  "connect-src 'self' https://test-streams.mux.dev https://dash.akamaized.net",
  "media-src 'self' blob: https://test-streams.mux.dev https://dash.akamaized.net",
];

export function proxy(request: NextRequest) {
  const existingRequestId = request.headers.get("x-request-id");
  const requestId =
    existingRequestId && /^[a-zA-Z0-9_-]{8,64}$/.test(existingRequestId)
      ? existingRequestId
      : `req_${crypto.randomUUID().replace(/-/g, "")}`;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const isWatchRoute = request.nextUrl.pathname.startsWith("/watch");

  response.headers.set("x-request-id", requestId);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Referrer-Policy",
    isWatchRoute ? "no-referrer" : "strict-origin-when-cross-origin",
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  // Next's development-only error-stack reconstruction needs eval. Production stays strict.
  const scriptPolicy =
    process.env.NODE_ENV === "development"
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";
  response.headers.set("Content-Security-Policy", [...BASE_CSP, scriptPolicy].join("; "));

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
