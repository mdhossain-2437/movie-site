import { assertSameOriginRequest } from "@movie/auth";
import { getEnv } from "@movie/config";
import { completeAuthorizedAssetUpload, getDatabase } from "@movie/db";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import {
  extractRequestId,
  getCurrentSession,
  jsonNoStore,
  toProblemResponse,
} from "@/lib/server/api-helpers";
import { getStorageAdapter } from "@/lib/server/storage";

const CompleteUploadSchema = z.object({
  uploadId: z.string().min(4).max(128),
  idempotencyKey: z.string().min(4).max(128).optional(),
  parts: z
    .array(
      z.object({
        partNumber: z.number().int().min(1).max(10_000),
        etag: z.string().min(2).max(128),
      }),
    )
    .min(1),
});

export async function POST(request: Request, context: { params: Promise<{ assetId: string }> }) {
  const requestId = extractRequestId(request);
  try {
    assertSameOriginRequest(request, getEnv().APP_URL);
    const { assetId } = await context.params;
    const body = CompleteUploadSchema.parse(await request.json());
    const headerIdempotencyKey = request.headers.get("idempotency-key")?.trim();
    const idempotencyKey =
      headerIdempotencyKey || body.idempotencyKey || `${assetId}:${body.uploadId}`;

    const { session } = await getCurrentSession();
    const db = await getDatabase();
    const storage = getStorageAdapter();

    const completed = await completeAuthorizedAssetUpload(
      db,
      storage,
      { actor: session?.actor ?? null, requestId },
      {
        assetId,
        uploadId: body.uploadId,
        parts: body.parts,
        idempotencyKey,
      },
    );

    revalidateTag("catalogue", "max");
    return jsonNoStore(completed, 200, requestId);
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
