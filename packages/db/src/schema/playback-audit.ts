import type { DeliveryEventType, ResolutionTier, Role } from "@movie/contracts";
import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { titles } from "./catalogue.ts";
import { users } from "./identity.ts";
import { mediaAssets } from "./media.ts";
import { rightsGrants } from "./rights.ts";

export const playbackSessions = pgTable(
  "playback_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    grantId: text("grant_id")
      .notNull()
      .references(() => rightsGrants.id, { onDelete: "restrict" }),
    territoryCode: text("territory_code").notNull(),
    maxResolution: text("max_resolution").$type<ResolutionTier>().notNull(),
    tokenHash: text("token_hash").notNull(),
    lastPositionSeconds: integer("last_position_seconds").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("playback_sessions_token_hash_unique").on(table.tokenHash),
    index("playback_sessions_user_active_idx").on(table.userId, table.expiresAt),
  ],
);

export const deliveryEvents = pgTable(
  "delivery_events",
  {
    id: text("id").primaryKey(),
    playbackSessionId: text("playback_session_id")
      .notNull()
      .references(() => playbackSessions.id, { onDelete: "cascade" }),
    eventType: text("event_type").$type<DeliveryEventType>().notNull(),
    startupLatencyMs: integer("startup_latency_ms"),
    rebufferDurationMs: integer("rebuffer_duration_ms"),
    renditionProfile: text("rendition_profile"),
    regionCode: text("region_code"),
    errorCode: text("error_code"),
    correlationId: text("correlation_id"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    metrics: jsonb("metrics").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("delivery_events_session_idx").on(table.playbackSessionId),
    index("delivery_events_type_occurred_idx").on(table.eventType, table.occurredAt),
    index("delivery_events_occurred_idx").on(table.occurredAt),
  ],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id"),
    actorRoles: jsonb("actor_roles").$type<Role[]>().notNull().default([]),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    requestId: text("request_id").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_events_target_idx").on(table.targetType, table.targetId),
    index("audit_events_created_idx").on(table.createdAt),
  ],
);
