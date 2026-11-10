import type { NextRequest } from "next/server";
import { fetchOmdbPosterBytesByImdbId } from "@/lib/metadata/omdb-client";
import { extractRequestId } from "@/lib/server/api-helpers";

const SAFE_IMDB_ID_RE = /^tt\d{7,10}$/i;

export async function GET(request: NextRequest) {
  const requestId = extractRequestId(request);
  const imdbId = request.nextUrl.searchParams.get("imdbId")?.trim() ?? "";

  if (!SAFE_IMDB_ID_RE.test(imdbId)) {
    return Response.json(
      { code: "BAD_REQUEST", detail: "Valid IMDb identifier (ttXXXXXXX) is required." },
      { status: 400, headers: { "x-request-id": requestId } },
    );
  }

  const poster = await fetchOmdbPosterBytesByImdbId(imdbId);
  if (!poster) {
    return Response.json(
      { code: "NOT_FOUND", detail: "Official OMDb poster artwork is unavailable for this title." },
      { status: 404, headers: { "x-request-id": requestId } },
    );
  }

  return new Response(Buffer.from(poster.bytes), {
    status: 200,
    headers: {
      "Content-Type": poster.contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
      "x-request-id": requestId,
    },
  });
}
