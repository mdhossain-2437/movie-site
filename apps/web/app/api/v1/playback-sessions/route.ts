import { assertSameOriginRequest } from "@movie/auth";
import { getEnv } from "@movie/config";
import { ResolutionTierSchema } from "@movie/contracts";
import { authorizePlaybackSession, getDatabase, NotFoundError } from "@movie/db";
import { StorageIntegrityError } from "@movie/storage";
import { z } from "zod";
import { authorizeDevShowcasePlaybackSession } from "@/lib/catalogue/dev-showcase";
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
  seasonNumber: z.number().int().min(1).max(50).optional(),
  episodeNumber: z.number().int().min(1).max(200).optional(),
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

    try {
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
    } catch (innerError) {
      const isShowcaseFallbackEligible =
        innerError instanceof NotFoundError ||
        (innerError instanceof StorageIntegrityError &&
          innerError.code === "OBJECT_NOT_FOUND" &&
          env.OBJECT_STORAGE_PROVIDER === "memory");

      if (isShowcaseFallbackEligible) {
        const showcaseSession = authorizeDevShowcasePlaybackSession({
          titleSlug: body.titleSlug,
          territoryCode,
          requestedResolution: body.requestedResolution,
          drmCapableClient: body.drmCapableClient ?? false,
          seasonNumber: body.seasonNumber,
          episodeNumber: body.episodeNumber,
        });
        if (showcaseSession) {
          return jsonNoStore(showcaseSession, 201, requestId);
        }
      }
      throw innerError;
    }
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
