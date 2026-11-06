import { getEnv } from "@movie/config";
import { HealthResponseSchema } from "@movie/contracts";
import { createLogger, createRequestId } from "@movie/observability";

const logger = createLogger({ service: "@movie/web" });

export async function GET(request: Request) {
  const incomingId = request.headers.get("x-request-id");
  const requestId =
    incomingId && /^[a-zA-Z0-9_-]{8,64}$/.test(incomingId) ? incomingId : createRequestId();

  const env = getEnv();
  const payload = HealthResponseSchema.parse({
    status: "ok",
    service: "@movie/web",
    version: "0.1.0",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    requestId,
    checks: {
      config: "ok",
      storageAdapter: env.OBJECT_STORAGE_PROVIDER,
    },
  });

  logger.debug("Health check served", { requestId, action: "health.check", resultCode: "OK" });

  return Response.json(payload, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "x-request-id": requestId,
    },
  });
}
