import { fetchTmdbImageBytes } from "@/lib/metadata/tmdb-client";
import { extractRequestId, toProblemResponse } from "@/lib/server/api-helpers";

export async function GET(
  request: Request,
  context: { params: Promise<{ size: string; file: string }> },
) {
  const requestId = extractRequestId(request);
  try {
    const { size, file } = await context.params;
    const { bytes, contentType } = await fetchTmdbImageBytes(size, file);
    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "X-Content-Type-Options": "nosniff",
        "x-request-id": requestId,
      },
    });
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
