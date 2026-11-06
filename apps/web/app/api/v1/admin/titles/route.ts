import { assertSameOriginRequest } from "@movie/auth";
import { getEnv } from "@movie/config";
import { MaturityRatingSchema } from "@movie/contracts";
import { createDraftTitle, getDatabase } from "@movie/db";
import { z } from "zod";
import {
  extractRequestId,
  getCurrentSession,
  jsonNoStore,
  toProblemResponse,
} from "@/lib/server/api-helpers";

const CreateDraftTitleBodySchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(120),
  originalTitle: z.string().trim().min(1).max(200),
  originalLanguage: z.string().regex(/^[a-z]{2,5}$/),
  releaseYear: z.number().int().min(1895).max(2100),
  runtimeMinutes: z.number().int().min(1).max(1200),
  maturityRating: MaturityRatingSchema.default("UNRATED"),
  isDevelopmentFixture: z.boolean().optional(),
  translations: z
    .array(
      z.object({
        locale: z.string().regex(/^[a-z]{2,5}$/),
        localizedTitle: z.string().trim().min(1).max(200),
        tagline: z.string().trim().max(240).optional(),
        synopsis: z.string().trim().min(10).max(4000),
      }),
    )
    .min(1),
  genreSlugs: z.array(z.string().max(64)).optional(),
  attribution: z.object({
    provider: z.enum(["OPERATOR_ORIGINAL", "PUBLIC_DOMAIN_RECORD", "LICENSED_PARTNER", "TMDB"]),
    externalId: z.string().max(120).optional(),
    attributionText: z.string().trim().min(3).max(500),
    licenseConfirmed: z.boolean(),
  }),
});

export async function POST(request: Request) {
  const requestId = extractRequestId(request);
  try {
    assertSameOriginRequest(request, getEnv().APP_URL);
    const body = CreateDraftTitleBodySchema.parse(await request.json());
    const { session } = await getCurrentSession();
    const db = await getDatabase();
    const created = await createDraftTitle(db, { actor: session?.actor ?? null, requestId }, body);

    return jsonNoStore(created, 201, requestId);
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
