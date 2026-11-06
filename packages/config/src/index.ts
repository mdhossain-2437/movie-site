import { z } from "zod";

const BooleanFlagSchema = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
  .transform((val) => val === true || val === "true" || val === "1");

export const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    APP_ENV: z.enum(["development", "test", "staging", "production"]).optional(),
    APP_URL: z.url().default("http://localhost:3000"),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    DEFAULT_TERRITORY: z
      .string()
      .regex(/^[A-Z]{2}$/, "DEFAULT_TERRITORY must be an ISO 3166-1 alpha-2 code")
      .default("BD"),

    DATABASE_URL: z.string().min(1).optional(),
    REDIS_URL: z.string().min(1).optional(),

    SESSION_SECRET: z.string().min(32).optional(),
    MEDIA_SIGNING_SECRET: z.string().min(32).optional(),
    TOKEN_ENCRYPTION_KEY: z.string().min(32).optional(),

    OBJECT_STORAGE_PROVIDER: z.enum(["memory", "r2", "s3-compatible"]).default("memory"),
    OBJECT_STORAGE_ENDPOINT: z.url().optional(),
    OBJECT_STORAGE_REGION: z.string().min(1).default("auto"),
    OBJECT_STORAGE_BUCKET_SOURCE: z.string().min(1).default("media-source-private"),
    OBJECT_STORAGE_BUCKET_STAGING: z.string().min(1).default("media-staging-private"),
    OBJECT_STORAGE_BUCKET_PACKAGED: z.string().min(1).default("media-packaged-private"),
    OBJECT_STORAGE_BUCKET_ARTWORK: z.string().min(1).default("media-artwork-public"),
    OBJECT_STORAGE_BUCKET_BACKUP: z.string().min(1).default("media-backup-vault"),
    OBJECT_STORAGE_ACCESS_KEY_ID: z.string().min(1).optional(),
    OBJECT_STORAGE_SECRET_ACCESS_KEY: z.string().min(1).optional(),

    VIDEO_PROVIDER: z
      .enum(["none", "mux", "cloudflare-stream", "aws-mediaconvert"])
      .default("none"),
    VIDEO_PROVIDER_ACCOUNT_ID: z.string().min(1).optional(),
    VIDEO_PROVIDER_API_TOKEN: z.string().min(1).optional(),
    DRM_ADAPTER_CONFIGURED: BooleanFlagSchema.default(false),

    TMDB_API_KEY: z.string().min(1).optional(),
    TMDB_COMMERCIAL_LICENSE_CONFIRMED: BooleanFlagSchema.default(false),

    UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(53_687_091_200),
    TEMP_STORAGE_MAX_BYTES: z.coerce.number().int().positive().default(21_474_836_480),

    SENTRY_DSN: z.url().optional(),
  })
  .superRefine((env, ctx) => {
    const effectiveStage = env.APP_ENV ?? env.NODE_ENV;
    if (effectiveStage === "production") {
      const requiredInProd = ["DATABASE_URL", "SESSION_SECRET", "MEDIA_SIGNING_SECRET"] as const;

      for (const key of requiredInProd) {
        if (!env[key]) {
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: `${key} is required when NODE_ENV=production`,
          });
        }
      }

      if (env.SESSION_SECRET && env.SESSION_SECRET === env.MEDIA_SIGNING_SECRET) {
        ctx.addIssue({
          code: "custom",
          path: ["MEDIA_SIGNING_SECRET"],
          message: "MEDIA_SIGNING_SECRET must be independent from SESSION_SECRET",
        });
      }

      if (env.OBJECT_STORAGE_PROVIDER === "memory") {
        ctx.addIssue({
          code: "custom",
          path: ["OBJECT_STORAGE_PROVIDER"],
          message: "In-memory storage adapter cannot be used in production",
        });
      }

      if (env.APP_URL.includes("example.invalid") || env.APP_URL.includes("localhost")) {
        ctx.addIssue({
          code: "custom",
          path: ["APP_URL"],
          message: "APP_URL must be a real HTTPS origin in production",
        });
      }
    }
  });

export type AppEnv = z.infer<typeof EnvSchema>;

export function parseEnv(raw: Record<string, string | undefined>): AppEnv {
  const cleaned: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(raw)) {
    cleaned[k] = v === "" ? undefined : v;
  }
  const result = EnvSchema.safeParse(cleaned);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return result.data;
}

export function assertTmdbCommercialUseAllowed(
  env: Pick<AppEnv, "TMDB_API_KEY" | "TMDB_COMMERCIAL_LICENSE_CONFIRMED">,
  options: { isCommercialDeployment: boolean },
): void {
  if (!env.TMDB_API_KEY) {
    throw new Error("TMDB_API_KEY is not configured");
  }
  if (options.isCommercialDeployment && !env.TMDB_COMMERCIAL_LICENSE_CONFIRMED) {
    throw new Error(
      "TMDb commercial use is blocked until TMDB_COMMERCIAL_LICENSE_CONFIRMED=true with a documented commercial agreement",
    );
  }
}

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (!cachedEnv) {
    cachedEnv = parseEnv(process.env);
  }
  return cachedEnv;
}

export function resetEnvCacheForTests(): void {
  cachedEnv = null;
}
