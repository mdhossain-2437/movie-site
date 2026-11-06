import { createLogger } from "@movie/observability";
import { createDatabaseHandle } from "../client.ts";
import { leaseAndProcessNextOutboxJob } from "../media-playback-dal.ts";

const logger = createLogger({ service: "@movie/db:worker" });
const POLL_INTERVAL_MS = Number(process.env.OUTBOX_POLL_INTERVAL_MS ?? "2500");

async function main() {
  const handle = createDatabaseHandle();
  let stopping = false;

  const stop = (signal: string) => {
    if (!stopping) {
      stopping = true;
      logger.info("Outbox worker received shutdown signal", {
        action: "worker.shutdown",
        signal,
      });
    }
  };

  process.on("SIGTERM", () => stop("SIGTERM"));
  process.on("SIGINT", () => stop("SIGINT"));

  logger.info("Durable PostgreSQL outbox worker started", {
    action: "worker.start",
    driver: handle.driver,
    pollIntervalMs: POLL_INTERVAL_MS,
  });

  try {
    while (!stopping) {
      try {
        const result = await leaseAndProcessNextOutboxJob(handle.db);
        if (result.processed) {
          logger.info("Processed outbox job", {
            action: "worker.job.processed",
            jobId: result.jobId,
            status: result.status,
            assetState: result.assetState ?? null,
          });
          continue;
        }
      } catch (err: unknown) {
        logger.error("Outbox worker iteration failed", {
          action: "worker.job.error",
          error: err instanceof Error ? err.message : String(err),
        });
      }

      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, POLL_INTERVAL_MS);
        timer.unref?.();
      });
    }
  } finally {
    await handle.close();
    logger.info("Outbox worker closed database handle", {
      action: "worker.stopped",
    });
  }
}

main().catch((err: unknown) => {
  logger.error("Fatal outbox worker failure", {
    action: "worker.fatal",
    error: err instanceof Error ? err.message : String(err),
  });
  process.exitCode = 1;
});
