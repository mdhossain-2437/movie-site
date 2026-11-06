import { assertSameOriginRequest } from "@movie/auth";
import { getEnv } from "@movie/config";
import {
  DeliveryActionSchema,
  EntitlementTierSchema,
  ResolutionTierSchema,
} from "@movie/contracts";
import { getDatabase, registerRightsGrant } from "@movie/db";
import { z } from "zod";
import {
  extractRequestId,
  getCurrentSession,
  jsonNoStore,
  toProblemResponse,
} from "@/lib/server/api-helpers";

const RegisterGrantBodySchema = z.object({
  titleId: z.string().min(1).max(80),
  assetId: z.string().min(1).max(80).nullable().optional(),
  licensorLegalName: z.string().trim().min(2).max(200),
  licensorContactEmail: z.email().max(180),
  licensorCountryCode: z
    .string()
    .regex(/^[A-Za-z]{2}$/)
    .optional(),
  basis: z.enum(["OWNED", "LICENSED", "PUBLIC_DOMAIN_VERIFIED"]),
  documentRef: z.string().trim().min(3).max(240),
  evidenceSha256: z.string().regex(/^[a-fA-F0-9]{64}$/),
  allowedActions: z.array(DeliveryActionSchema).min(1),
  allowedTerritories: z.array(z.string().regex(/^[A-Za-z]{2}$/)).min(1),
  excludedTerritories: z.array(z.string().regex(/^[A-Za-z]{2}$/)).optional(),
  validFrom: z.iso.datetime(),
  validUntil: z.iso.datetime(),
  requiredEntitlement: EntitlementTierSchema.optional(),
  maxResolution: ResolutionTierSchema.optional(),
  requiresDrm: z.boolean().optional(),
  attributionText: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const requestId = extractRequestId(request);
  try {
    assertSameOriginRequest(request, getEnv().APP_URL);
    const body = RegisterGrantBodySchema.parse(await request.json());
    const { session } = await getCurrentSession();
    const db = await getDatabase();
    const created = await registerRightsGrant(
      db,
      { actor: session?.actor ?? null, requestId },
      {
        ...body,
        validFrom: new Date(body.validFrom),
        validUntil: new Date(body.validUntil),
      },
    );

    return jsonNoStore(created, 201, requestId);
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
