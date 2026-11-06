import { assertSameOriginRequest } from "@movie/auth";
import { getEnv } from "@movie/config";
import { ResolutionTierSchema } from "@movie/contracts";
import { getDatabase, recordPlaybackHeartbeat } from "@movie/db";
import { z } from "zod";
import { extractRequestId, jsonNoStore, toProblemResponse } from "@/lib/server/api-helpers";

const HeartbeatBodySchema = z.object({
  playbackToken: z.string().min(16).max(256),
  positionSeconds: z.number().min(0).max(86_400),
  allowBackwardSeek: z.boolean().optional(),
  qoeEvent: z
    .object({
      eventType: z.enum(["FIRST_FRAME", "BUFFER_UNDERRUN", "RENDITION_SWITCH", "HEARTBEAT"]),
      ttffMs: z.number().min(0).max(120_000).optional(),
      rebufferCount: z.number().int().min(0).max(1000).optional(),
      activeResolution: ResolutionTierSchema.optional(),
    })
    .optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = extractRequestId(request);
  try {
    assertSameOriginRequest(request, getEnv().APP_URL);
    const { id } = await context.params;
    const body = HeartbeatBodySchema.parse(await request.json());
    const db = await getDatabase();

    const updated = await recordPlaybackHeartbeat(db, {
      sessionId: id,
      playbackToken: body.playbackToken,
      positionSeconds: body.positionSeconds,
      allowBackwardSeek: body.allowBackwardSeek,
      qoeEvent: body.qoeEvent,
    });

    return jsonNoStore(updated, 200, requestId);
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
