import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { getEnv } from "@movie/config";
import { drizzle as drizzleNodePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate as migrateNodePg } from "drizzle-orm/node-postgres/migrator";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import pg from "pg";
import * as schema from "./schema/index.ts";

export type MovieDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

export interface ManagedDatabaseHandle {
  db: MovieDatabase;
  driver: "node-postgres" | "pglite";
  migrate: () => Promise<void>;
  close: () => Promise<void>;
}

function resolveMigrationsFolder(): string {
  const candidates: string[] = [];
  if (typeof import.meta.dirname === "string") {
    candidates.push(path.resolve(/*turbopackIgnore: true*/ import.meta.dirname, "../migrations"));
  }
  if (import.meta.url.startsWith("file:")) {
    candidates.push(
      path.resolve(
        /*turbopackIgnore: true*/ path.dirname(fileURLToPath(import.meta.url)),
        "../migrations",
      ),
    );
  }
  const cwd = process.cwd();
  candidates.push(path.resolve(/*turbopackIgnore: true*/ cwd, "packages/db/migrations"));
  candidates.push(path.resolve(/*turbopackIgnore: true*/ cwd, "../../packages/db/migrations"));
  candidates.push(path.resolve(/*turbopackIgnore: true*/ cwd, "migrations"));

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "meta", "_journal.json"))) {
      return dir;
    }
  }
  return candidates[0] ?? path.resolve(/*turbopackIgnore: true*/ cwd, "migrations");
}

function resolveDefaultPgliteDir(): string {
  const cwd = process.cwd();
  const normalized = cwd.replace(/\\/g, "/");
  const repoRoot = normalized.endsWith("/apps/web")
    ? path.resolve(/*turbopackIgnore: true*/ cwd, "../..")
    : normalized.endsWith("/packages/db")
      ? path.resolve(/*turbopackIgnore: true*/ cwd, "../..")
      : cwd;
  return path.resolve(/*turbopackIgnore: true*/ repoRoot, ".local-data", "pglite");
}

const MIGRATIONS_FOLDER = resolveMigrationsFolder();

export async function createTestDatabase(): Promise<ManagedDatabaseHandle> {
  const pglite = new PGlite();
  const db: PgliteDatabase<typeof schema> = drizzlePglite(pglite, { schema });
  await migratePglite(db, { migrationsFolder: MIGRATIONS_FOLDER });

  return {
    db: db as unknown as MovieDatabase,
    driver: "pglite",
    migrate: async () => {
      await migratePglite(db, { migrationsFolder: MIGRATIONS_FOLDER });
    },
    close: async () => {
      await pglite.close();
    },
  };
}

export function createDatabaseHandle(databaseUrl?: string): ManagedDatabaseHandle {
  const resolvedUrl = databaseUrl ?? getEnv().DATABASE_URL;

  if (resolvedUrl && /^postgres(ql)?:\/\//i.test(resolvedUrl)) {
    const pool = new pg.Pool({
      connectionString: resolvedUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
    });
    const db: NodePgDatabase<typeof schema> = drizzleNodePg(pool, { schema });

    return {
      db: db as unknown as MovieDatabase,
      driver: "node-postgres",
      migrate: async () => {
        await migrateNodePg(db, { migrationsFolder: MIGRATIONS_FOLDER });
      },
      close: async () => {
        await pool.end();
      },
    };
  }

  const isTestEnv = process.env.NODE_ENV === "test" || process.env.APP_ENV === "test";
  let dataDir: string | undefined;
  if (!isTestEnv) {
    if (resolvedUrl?.startsWith("pglite://")) {
      dataDir = resolvedUrl.slice("pglite://".length);
    } else {
      dataDir = resolveDefaultPgliteDir();
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  const pglite = dataDir ? new PGlite(dataDir) : new PGlite();
  const db: PgliteDatabase<typeof schema> = drizzlePglite(pglite, { schema });

  return {
    db: db as unknown as MovieDatabase,
    driver: "pglite",
    migrate: async () => {
      await migratePglite(db, { migrationsFolder: MIGRATIONS_FOLDER });
    },
    close: async () => {
      await pglite.close();
    },
  };
}

let singletonPromise: Promise<ManagedDatabaseHandle> | null = null;

export async function getDatabase(): Promise<MovieDatabase> {
  if (!singletonPromise) {
    singletonPromise = (async () => {
      const handle = createDatabaseHandle();
      if (handle.driver === "pglite") {
        await handle.migrate();
      }
      return handle;
    })();
  }
  const handle = await singletonPromise;
  return handle.db;
}

export async function resetDatabaseSingletonForTests(): Promise<void> {
  if (singletonPromise) {
    const handle = await singletonPromise;
    singletonPromise = null;
    await handle.close();
  }
}
