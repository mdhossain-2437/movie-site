import { getEnv } from "@movie/config";
import { createLogger } from "@movie/observability";
import { createDatabaseHandle } from "../client.ts";
import { newEntityId } from "../dal.ts";
import { genres } from "../schema/index.ts";

const logger = createLogger({ service: "@movie/db:seed" });

const BASELINE_GENRES = [
  { slug: "drama", nameEn: "Drama", nameBn: null },
  { slug: "documentary", nameEn: "Documentary", nameBn: null },
  { slug: "classic", nameEn: "Classic", nameBn: null },
  { slug: "mystery", nameEn: "Mystery", nameBn: null },
  { slug: "history", nameEn: "History", nameBn: null },
] as const;

async function main() {
  const env = getEnv();
  const effectiveStage = env.APP_ENV ?? env.NODE_ENV;
  if (effectiveStage === "production") {
    throw new Error("db:seed is strictly blocked when effective stage is production");
  }

  const handle = createDatabaseHandle();
  try {
    await handle.migrate();
    for (const g of BASELINE_GENRES) {
      await handle.db
        .insert(genres)
        .values({
          id: newEntityId("gnr"),
          slug: g.slug,
          nameEn: g.nameEn,
          nameBn: g.nameBn,
        })
        .onConflictDoNothing({ target: genres.slug });
    }
    logger.info("Baseline genre taxonomy seeded (0 fake titles created)", {
      action: "db.seed",
      driver: handle.driver,
      genreCount: BASELINE_GENRES.length,
    });
  } finally {
    await handle.close();
  }
}

main().catch((err: unknown) => {
  logger.error("Database seed failed", {
    action: "db.seed",
    error: err instanceof Error ? err.message : String(err),
  });
  process.exitCode = 1;
});
