import { assertSameOriginRequest } from "@movie/auth";
import { getEnv } from "@movie/config";
import { getDatabase, initiateAuthorizedAssetUpload } from "@movie/db";
import { z } from "zod";
import {
  extractRequestId,
  getCurrentSession,
  jsonNoStore,
  toProblemResponse,
} from "@/lib/server/api-helpers";
import { getStorageAdapter } from "@/lib/server/storage";

const InitiateUploadSchema = z.object({
  titleId: z.string().min(4).max(80),
  assetId: z.string().min(4).max(80).optional(),
  kind: z.enum(["FEATURE", "TRAILER"]).optional(),
  drmRequired: z.boolean().optional(),
  contentType: z.enum(["video/mp4", "video/webm", "text/vtt"]),
  expectedSizeBytes: z
    .number()
    .int()
    .positive()
    .max(25 * 1024 * 1024 * 1024),
  expectedSha256: z.string().regex(/^[a-fA-F0-9]{64}$/),
  partCount: z.number().int().min(1).max(10_000),
  sourceUrl: z.unknown().optional(),
});

export async function POST(request: Request) {
  const requestId = extractRequestId(request);
  try {
    assertSameOriginRequest(request, getEnv().APP_URL);
    const body = InitiateUploadSchema.parse(await request.json());
    const { session } = await getCurrentSession();
    const db = await getDatabase();
    const storage = getStorageAdapter();

    const initiated = await initiateAuthorizedAssetUpload(
      db,
      storage,
      { actor: session?.actor ?? null, requestId },
      body,
    );

    return jsonNoStore(initiated, 201, requestId);
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
