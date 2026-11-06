import { assertSameOriginRequest } from "@movie/auth";
import { getEnv } from "@movie/config";
import { ResolutionTierSchema } from "@movie/contracts";
import { authorizePlaybackSession, getDatabase } from "@movie/db";
import { z } from "zod";
import {
  extractRequestId,
  getCurrentSession,
  jsonNoStore,
  resolveViewerTerritory,
  toProblemResponse,
} from "@/lib/server/api-helpers";
import { getStorageAdapter } from "@/lib/server/storage";

const AuthorizePlaybackBodySchema = z.object({
  titleSlug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(120),
  requestedResolution: ResolutionTierSchema.optional(),
  drmCapableClient: z.boolean().optional(),
});

export async function POST(request: Request) {
  const requestId = extractRequestId(request);
  try {
    assertSameOriginRequest(request, getEnv().APP_URL);
    const body = AuthorizePlaybackBodySchema.parse(await request.json());
    const territoryCode = await resolveViewerTerritory(request);
    const { session } = await getCurrentSession();
    const db = await getDatabase();
    const storage = getStorageAdapter();

    const env = getEnv();
    const isMultiDrmProvider =
      env.DRM_ADAPTER_CONFIGURED &&
      (env.VIDEO_PROVIDER === "mux" || env.VIDEO_PROVIDER === "aws-mediaconvert");

    const authorized = await authorizePlaybackSession(
      db,
      storage,
      { actor: session?.actor ?? null, requestId },
      {
        titleSlug: body.titleSlug,
        territoryCode,
        requestedResolution: body.requestedResolution,
        drmCapableClient: body.drmCapableClient ?? false,
        drmLicenseAdapterConfigured: isMultiDrmProvider,
      },
    );

    return jsonNoStore(authorized, 201, requestId);
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
