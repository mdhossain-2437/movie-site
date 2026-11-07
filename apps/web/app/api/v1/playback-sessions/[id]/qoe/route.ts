import { assertSameOriginRequest } from "@movie/auth";
import { getEnv } from "@movie/config";
import { PlaybackQoeEventInputSchema } from "@movie/contracts";
import { getDatabase, recordPlaybackQoeEvent } from "@movie/db";
import { AuthorizationError } from "@movie/domain";
import { verifyDevShowcasePlaybackToken } from "@/lib/catalogue/dev-showcase";
import { extractRequestId, jsonNoStore, toProblemResponse } from "@/lib/server/api-helpers";

// Strict secret and PII rejection regex (Blueprint §89.2, §91.1)
const FORBIDDEN_SECRET_KEY_PATTERN =
  /(bearer|authorization|cookie|password|jwt|auth_token|secret_key)/i;

function assertNoForbiddenSecrets(obj: unknown, path = ""): void {
  if (obj === null || typeof obj !== "object") return;
  for (const [key, val] of Object.entries(obj)) {
    // playbackToken is the authorized session bearer parameter for this endpoint; other secret fields are blocked
    if (key !== "playbackToken" && FORBIDDEN_SECRET_KEY_PATTERN.test(key)) {
      throw new AuthorizationError(
        "FORBIDDEN",
        `Forbidden sensitive key rejected in QoE telemetry: ${path ? `${path}.${key}` : key}`,
      );
    }
    if (typeof val === "object" && val !== null) {
      assertNoForbiddenSecrets(val, path ? `${path}.${key}` : key);
    }
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = extractRequestId(request);
  try {
    assertSameOriginRequest(request, getEnv().APP_URL);
    const { id } = await context.params;
    const rawJson = await request.json();

    assertNoForbiddenSecrets(rawJson);
    const body = PlaybackQoeEventInputSchema.parse(rawJson);

    if (id.startsWith("pbs_sc_")) {
      if (!verifyDevShowcasePlaybackToken(id, body.playbackToken)) {
        throw new AuthorizationError(
          "UNAUTHENTICATED",
          "Invalid or expired playback session token",
        );
      }
      return jsonNoStore(
        {
          success: true,
          eventId: `qoe_sc_${Date.now()}`,
          status: "RECORDED",
          occurredAt: new Date().toISOString(),
        },
        200,
        requestId,
      );
    }

    const db = await getDatabase();

    const result = await recordPlaybackQoeEvent(db, {
      sessionId: id,
      playbackToken: body.playbackToken,
      eventType: body.eventType,
      startupLatencyMs: body.startupLatencyMs,
      rebufferDurationMs: body.rebufferDurationMs,
      renditionProfile: body.renditionProfile,
      regionCode: body.regionCode,
      errorCode: body.errorCode,
      correlationId: body.correlationId,
      metrics: body.metrics,
      occurredAt: body.occurredAt,
    });

    return jsonNoStore(
      {
        success: true,
        eventId: result.eventId,
        status: result.status,
        occurredAt: result.occurredAt.toISOString(),
      },
      200,
      requestId,
    );
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
