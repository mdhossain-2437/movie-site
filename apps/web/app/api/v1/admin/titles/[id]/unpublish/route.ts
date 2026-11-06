import { assertSameOriginRequest } from "@movie/auth";
import { getEnv } from "@movie/config";
import { getDatabase, unpublishTitle } from "@movie/db";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import {
  extractRequestId,
  getCurrentSession,
  jsonNoStore,
  toProblemResponse,
} from "@/lib/server/api-helpers";

const UnpublishBodySchema = z.object({
  applyLegalHold: z.boolean().default(false),
  reason: z.string().trim().min(5).max(500),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = extractRequestId(request);
  try {
    assertSameOriginRequest(request, getEnv().APP_URL);
    const { id } = await context.params;
    const body = UnpublishBodySchema.parse(await request.json());
    const { session } = await getCurrentSession();
    const db = await getDatabase();
    const result = await unpublishTitle(db, { actor: session?.actor ?? null, requestId }, id, body);

    revalidateTag("catalogue", "max");
    return jsonNoStore(result, 200, requestId);
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
