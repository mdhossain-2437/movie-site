import { assertSameOriginRequest } from "@movie/auth";
import { getEnv } from "@movie/config";
import { getDatabase, submitContentReport } from "@movie/db";
import { z } from "zod";
import {
  extractRequestId,
  getCurrentSession,
  jsonNoStore,
  toProblemResponse,
} from "@/lib/server/api-helpers";

const ReportSchema = z.object({
  targetPath: z.string().trim().min(1).max(256),
  titleSlug: z.string().trim().max(120).optional(),
  reporterName: z.string().trim().min(2).max(120),
  reporterEmail: z.email().max(180),
  claimSummary: z.string().trim().min(20).max(4000),
});

export async function POST(request: Request) {
  const requestId = extractRequestId(request);
  try {
    assertSameOriginRequest(request, getEnv().APP_URL);
    const body = ReportSchema.parse(await request.json());
    const { session } = await getCurrentSession();
    const db = await getDatabase();
    const created = await submitContentReport(
      db,
      { actor: session?.actor ?? null, requestId },
      body,
    );

    return jsonNoStore(created, 201, requestId);
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
