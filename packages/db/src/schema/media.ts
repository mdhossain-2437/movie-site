import type { AssetLifecycleState, ResolutionTier } from "@movie/contracts";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { titles } from "./catalogue";
import { users } from "./identity";

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: text("id").primaryKey(),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    kind: text("kind").$type<"FEATURE" | "TRAILER">().notNull().default("FEATURE"),
    lifecycleState: text("lifecycle_state")
      .$type<AssetLifecycleState>()
      .notNull()
      .default("DRAFT"),
    drmRequired: boolean("drm_required").notNull().default(false),
    containerFormat: text("container_format"),
    durationSeconds: integer("duration_seconds"),
    sha256Checksum: text("sha256_checksum"),
    checksumVerified: boolean("checksum_verified").notNull().default(false),
    qcPassed: boolean("qc_passed").notNull().default(false),
    qcApprovedByUserId: text("qc_approved_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    qcApprovedAt: timestamp("qc_approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("media_assets_title_state_idx").on(table.titleId, table.lifecycleState)],
);

export const mediaObjects = pgTable(
  "media_objects",
  {
    id: text("id").primaryKey(),
    assetId: text("asset_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    provider: text("provider").$type<"memory" | "r2" | "s3-compatible">().notNull(),
    bucket: text("bucket").notNull(),
    objectKey: text("object_key").notNull(),
    byteLength: bigint("byte_length", { mode: "number" }).notNull(),
    sha256Checksum: text("sha256_checksum").notNull(),
    contentType: text("content_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("media_objects_bucket_key_unique").on(table.bucket, table.objectKey),
    index("media_objects_asset_idx").on(table.assetId),
  ],
);

export const mediaRenditions = pgTable(
  "media_renditions",
  {
    id: text("id").primaryKey(),
    assetId: text("asset_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    resolution: text("resolution").$type<ResolutionTier>().notNull(),
    codec: text("codec").notNull(),
    bitrateKbps: integer("bitrate_kbps").notNull(),
    manifestObjectKey: text("manifest_object_key").notNull(),
    hasConfiguredDrm: boolean("has_configured_drm").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("media_renditions_asset_idx").on(table.assetId)],
);

export const subtitleTracks = pgTable(
  "subtitle_tracks",
  {
    id: text("id").primaryKey(),
    assetId: text("asset_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    languageCode: text("language_code").notNull(),
    label: text("label").notNull(),
    objectKey: text("object_key").notNull(),
    isForced: boolean("is_forced").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("subtitle_tracks_asset_idx").on(table.assetId)],
);

export const outboxJobs = pgTable(
  "outbox_jobs",
  {
    id: text("id").primaryKey(),
    jobType: text("job_type").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    status: text("status")
      .$type<"PENDING" | "LEASED" | "COMPLETED" | "DEAD_LETTER">()
      .notNull()
      .default("PENDING"),
    attempts: integer("attempts").notNull().default(0),
    leasedUntil: timestamp("leased_until", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("outbox_jobs_type_idempotency_unique").on(table.jobType, table.idempotencyKey),
    index("outbox_jobs_status_idx").on(table.status, table.createdAt),
  ],
);
