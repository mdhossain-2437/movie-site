import { z } from "zod";

export const RoleSchema = z.enum([
  "VIEWER",
  "EDITOR",
  "MEDIA_OPERATOR",
  "RIGHTS_REVIEWER",
  "ADMIN",
  "SUPER_ADMIN",
]);
export type Role = z.infer<typeof RoleSchema>;

export const PermissionSchema = z.enum([
  "catalogue:read",
  "catalogue:create",
  "catalogue:update",
  "catalogue:submit",
  "catalogue:publish",
  "catalogue:unpublish",
  "rights:read",
  "rights:create",
  "rights:approve",
  "rights:revoke",
  "media:read",
  "media:ingest",
  "media:upload",
  "media:process",
  "jobs:read",
  "jobs:retry",
  "jobs:cancel",
  "storage:read",
  "storage:manage",
  "reports:submit",
  "reports:review",
  "reports:resolve",
  "users:read",
  "users:manage",
  "roles:manage",
  "audit:read",
  "settings:manage",
]);
export type Permission = z.infer<typeof PermissionSchema>;

export const DeliveryActionSchema = z.enum([
  "STREAM",
  "DOWNLOAD",
  "TRAILER",
  "ARTWORK",
  "METADATA",
]);
export type DeliveryAction = z.infer<typeof DeliveryActionSchema>;

export const EntitlementTierSchema = z.enum(["FREE", "SUBSCRIBER", "RENTED", "PARTNER"]);
export type EntitlementTier = z.infer<typeof EntitlementTierSchema>;

export const ResolutionTierSchema = z.enum([
  "240p",
  "360p",
  "480p",
  "720p",
  "1080p",
  "1440p",
  "2160p",
]);
export type ResolutionTier = z.infer<typeof ResolutionTierSchema>;

export const TitleStatusSchema = z.enum([
  "DRAFT",
  "IN_REVIEW",
  "PUBLISHED",
  "UNPUBLISHED",
  "TAKEDOWN_HOLD",
  "ARCHIVED",
]);
export type TitleStatus = z.infer<typeof TitleStatusSchema>;

export const AssetLifecycleStateSchema = z.enum([
  "DRAFT",
  "RIGHTS_PENDING",
  "RIGHTS_APPROVED",
  "UPLOAD_PENDING",
  "UPLOADING",
  "UPLOADED",
  "QUARANTINED",
  "VALIDATING",
  "READY_FOR_PROCESSING",
  "PROCESSING",
  "READY_FOR_REVIEW",
  "PUBLISHED",
  "UNPUBLISHED",
  "TAKEDOWN_HOLD",
  "FAILED",
  "ARCHIVED",
]);
export type AssetLifecycleState = z.infer<typeof AssetLifecycleStateSchema>;

export const RightsGrantStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "SUSPENDED",
  "EXPIRED",
  "DISPUTED",
  "REVOKED",
  "REJECTED",
]);
export type RightsGrantStatus = z.infer<typeof RightsGrantStatusSchema>;

export const ReplicationStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "VERIFIED",
  "FAILED",
  "STALE",
  "DECOMMISSIONED",
]);
export type ReplicationStatus = z.infer<typeof ReplicationStatusSchema>;

export const MaturityRatingSchema = z.enum(["U", "PG", "PG13", "R16", "R18", "UNRATED"]);
export type MaturityRating = z.infer<typeof MaturityRatingSchema>;

export const ProblemDetailsSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  status: z.number().int().min(400).max(599),
  code: z.string().min(1),
  detail: z.string().min(1),
  requestId: z.string().min(1),
});
export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;

export interface CreateProblemInput {
  status: number;
  code: string;
  title: string;
  detail: string;
  requestId: string;
  typeSlug?: string;
}

export function createProblemDetails(input: CreateProblemInput): ProblemDetails {
  const slug = input.typeSlug ?? input.code.toLowerCase().replace(/_/g, "-");
  return {
    type: `urn:movie-platform:problem:${slug}`,
    title: input.title,
    status: input.status,
    code: input.code,
    detail: input.detail,
    requestId: input.requestId,
  };
}

export const CursorPageQuerySchema = z.object({
  cursor: z.string().max(128).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});
export type CursorPageQuery = z.infer<typeof CursorPageQuerySchema>;

export const HealthResponseSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  service: z.literal("@movie/web"),
  version: z.string().min(1),
  environment: z.enum(["development", "test", "production"]),
  timestamp: z.iso.datetime(),
  requestId: z.string().min(1),
  checks: z.object({
    config: z.enum(["ok", "error"]),
    storageAdapter: z.enum(["memory", "r2", "s3-compatible"]),
  }),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
