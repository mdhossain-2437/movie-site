import { assertSameOriginRequest } from "@movie/auth";
import { getEnv } from "@movie/config";
import { getDatabase, resolveTakedownCase } from "@movie/db";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import {
  extractRequestId,
  getCurrentSession,
  jsonNoStore,
  toProblemResponse,
} from "@/lib/server/api-helpers";

const ResolveTakedownSchema = z.object({
  outcome: z.enum(["LEGAL_HOLD_APPLIED", "RESOLVED_UPHELD", "RESOLVED_REJECTED"]),
  resolutionNotes: z.string().trim().min(5).max(2000),
});

export async function POST(request: Request, context: { params: Promise<{ caseId: string }> }) {
  const requestId = extractRequestId(request);
  try {
    assertSameOriginRequest(request, getEnv().APP_URL);
    const { caseId } = await context.params;
    const body = ResolveTakedownSchema.parse(await request.json());
    const { session } = await getCurrentSession();
    const db = await getDatabase();

    const resolved = await resolveTakedownCase(
      db,
      { actor: session?.actor ?? null, requestId },
      {
        caseId,
        outcome: body.outcome,
        resolutionNotes: body.resolutionNotes,
      },
    );

    revalidateTag("catalogue", "max");
    return jsonNoStore(resolved, 200, requestId);
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
