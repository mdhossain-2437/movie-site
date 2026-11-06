import type {
  DeliveryAction,
  EntitlementTier,
  ResolutionTier,
  RightsGrantStatus,
} from "@movie/contracts";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { titles } from "./catalogue";
import { users } from "./identity";

export const rightsHolders = pgTable("rights_holders", {
  id: text("id").primaryKey(),
  legalName: text("legal_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  countryCode: text("country_code").notNull().default("BD"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rightsEvidence = pgTable(
  "rights_evidence",
  {
    id: text("id").primaryKey(),
    rightsHolderId: text("rights_holder_id")
      .notNull()
      .references(() => rightsHolders.id, { onDelete: "restrict" }),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    basis: text("basis")
      .$type<"OWNED" | "LICENSED" | "PUBLIC_DOMAIN_VERIFIED">()
      .notNull(),
    documentRef: text("document_ref").notNull(),
    evidenceSha256: text("evidence_sha256").notNull(),
    submittedByUserId: text("submitted_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    reviewedByUserId: text("reviewed_by_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("rights_evidence_title_idx").on(table.titleId)],
);

export const rightsGrants = pgTable(
  "rights_grants",
  {
    id: text("id").primaryKey(),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    assetId: text("asset_id"),
    rightsHolderId: text("rights_holder_id")
      .notNull()
      .references(() => rightsHolders.id, { onDelete: "restrict" }),
    evidenceId: text("evidence_id")
      .notNull()
      .references(() => rightsEvidence.id, { onDelete: "restrict" }),
    status: text("status").$type<RightsGrantStatus>().notNull().default("PENDING"),
    allowedActions: jsonb("allowed_actions").$type<DeliveryAction[]>().notNull(),
    allowedTerritories: jsonb("allowed_territories").$type<string[]>().notNull(),
    excludedTerritories: jsonb("excluded_territories").$type<string[]>().notNull().default([]),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
    requiredEntitlement: text("required_entitlement")
      .$type<EntitlementTier>()
      .notNull()
      .default("FREE"),
    maxResolution: text("max_resolution").$type<ResolutionTier>().notNull().default("1080p"),
    requiresDrm: boolean("requires_drm").notNull().default(false),
    attributionText: text("attribution_text"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    approvedByUserId: text("approved_by_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    revokedReason: text("revoked_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("rights_grants_title_status_idx").on(table.titleId, table.status),
    index("rights_grants_asset_idx").on(table.assetId),
  ],
);

export const takedownCases = pgTable(
  "takedown_cases",
  {
    id: text("id").primaryKey(),
    caseNumber: text("case_number").notNull(),
    titleId: text("title_id").references(() => titles.id, { onDelete: "set null" }),
    targetPath: text("target_path").notNull(),
    reporterName: text("reporter_name").notNull(),
    reporterEmail: text("reporter_email").notNull(),
    claimSummary: text("claim_summary").notNull(),
    status: text("status")
      .$type<"OPEN" | "LEGAL_HOLD_APPLIED" | "RESOLVED_UPHELD" | "RESOLVED_REJECTED">()
      .notNull()
      .default("OPEN"),
    legalHoldApplied: boolean("legal_hold_applied").notNull().default(false),
    handledByUserId: text("handled_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    resolutionNotes: text("resolution_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("takedown_cases_case_number_unique").on(table.caseNumber),
    index("takedown_cases_title_status_idx").on(table.titleId, table.status),
  ],
);
