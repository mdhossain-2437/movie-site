import { createLogger } from "@movie/observability";
import { createDatabaseHandle } from "../client.ts";

const logger = createLogger({ service: "@movie/db:migrate" });

async function main() {
  const handle = createDatabaseHandle();
  try {
    await handle.migrate();
    logger.info("Database migrations applied cleanly", {
      action: "db.migrate",
      driver: handle.driver,
      resultCode: "OK",
    });
  } finally {
    await handle.close();
  }
}

main().catch((err: unknown) => {
  logger.error("Database migration failed", {
    action: "db.migrate",
    error: err instanceof Error ? err.message : String(err),
  });
  process.exitCode = 1;
});
