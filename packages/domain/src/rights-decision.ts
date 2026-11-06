import type {
  AssetLifecycleState,
  DeliveryAction,
  EntitlementTier,
  MaturityRating,
  ResolutionTier,
  RightsGrantStatus,
  TitleStatus,
} from "@movie/contracts";

export const RIGHTS_POLICY_VERSION = "2026-11-06.v1";

const RESOLUTION_RANK: Readonly<Record<ResolutionTier, number>> = {
  "240p": 240,
  "360p": 360,
  "480p": 480,
  "720p": 720,
  "1080p": 1080,
  "1440p": 1440,
  "2160p": 2160,
};

const MATURITY_RANK: Readonly<Record<MaturityRating, number>> = {
  U: 0,
  PG: 8,
  PG13: 13,
  R16: 16,
  R18: 18,
  UNRATED: 99,
};

const ENTITLEMENT_RANK: Readonly<Record<EntitlementTier, number>> = {
  FREE: 0,
  RENTED: 1,
  SUBSCRIBER: 2,
  PARTNER: 3,
};

export interface RightsEvidenceSummary {
  id: string;
  evidenceSha256: string;
  reviewedBy: string | null;
  reviewedAt: Date | null;
}

export interface RightsGrantRecord {
  id: string;
  titleId: string;
  /** If null, covers explicit title-level metadata/artwork; media delivery requires exact assetId match. */
  assetId: string | null;
  status: RightsGrantStatus;
  allowedActions: readonly DeliveryAction[];
  /** ISO 3166-1 alpha-2 country codes. Explicit territory list only — never inferred globally. */
  allowedTerritories: readonly string[];
  excludedTerritories?: readonly string[];
  validFrom: Date;
  validUntil: Date;
  requiredEntitlement: EntitlementTier;
  maxResolution?: ResolutionTier;
  requiresDrm?: boolean;
  attributionText?: string | null;
  evidence: readonly RightsEvidenceSummary[];
}

export interface RightsEvaluationContext {
  titleId: string;
  titleStatus: TitleStatus;
  titleMaturityRating?: MaturityRating;
  takedownActive?: boolean;
  assetId?: string;
  assetState?: AssetLifecycleState;
  assetChecksumVerified?: boolean;
  drmCapableClient?: boolean;
  action: DeliveryAction;
  territoryCode: string;
  at: Date;
  userId?: string;
  accountStatus?: "ACTIVE" | "SUSPENDED";
  userEntitlement?: EntitlementTier;
  profileMaxMaturity?: MaturityRating;
  activeConcurrentSessions?: number;
  maxConcurrentSessions?: number;
  requestedResolution?: ResolutionTier;
  grants: readonly RightsGrantRecord[];
}

export type RightsDenialCode =
  | "TAKEDOWN_HOLD_ACTIVE"
  | "TITLE_NOT_PUBLISHED"
  | "ASSET_NOT_PUBLISHABLE"
  | "ACCOUNT_SUSPENDED"
  | "AUTHENTICATION_REQUIRED"
  | "CONCURRENT_SESSION_LIMIT"
  | "MATURITY_RESTRICTED"
  | "NO_MATCHING_RIGHTS_GRANT"
  | "RIGHTS_NOT_APPROVED"
  | "RIGHTS_EVIDENCE_MISSING"
  | "ACTION_NOT_PERMITTED"
  | "RIGHTS_WINDOW_NOT_STARTED"
  | "RIGHTS_EXPIRED"
  | "TERRITORY_RESTRICTED"
  | "ENTITLEMENT_REQUIRED"
  | "RESOLUTION_NOT_PERMITTED"
  | "DRM_REQUIRED";

export type RightsDecision =
  | {
      allowed: true;
      grantId: string;
      policyVersion: string;
      maxResolution: ResolutionTier;
      requiresDrm: boolean;
    }
  | {
      allowed: false;
      code: RightsDenialCode;
      publicReason: string;
      policyVersion: string;
    };

const PUBLIC_REASON_BY_CODE: Readonly<Record<RightsDenialCode, string>> = {
  TAKEDOWN_HOLD_ACTIVE: "This title is currently unavailable.",
  TITLE_NOT_PUBLISHED: "This title is not currently available.",
  ASSET_NOT_PUBLISHABLE: "This media version is not ready for playback.",
  ACCOUNT_SUSPENDED: "Your account is not permitted to start playback.",
  AUTHENTICATION_REQUIRED: "Please sign in to access this title.",
  CONCURRENT_SESSION_LIMIT: "Maximum active playback sessions reached on your account.",
  MATURITY_RESTRICTED: "This title exceeds the maturity setting for the current profile.",
  NO_MATCHING_RIGHTS_GRANT: "This title is not currently available.",
  RIGHTS_NOT_APPROVED: "This title is not currently available.",
  RIGHTS_EVIDENCE_MISSING: "This title is not currently available.",
  ACTION_NOT_PERMITTED: "This delivery option is not available for this title.",
  RIGHTS_WINDOW_NOT_STARTED: "This title is not yet available in your region.",
  RIGHTS_EXPIRED: "This title is no longer available.",
  TERRITORY_RESTRICTED: "Not available in your region.",
  ENTITLEMENT_REQUIRED: "Your current plan does not include this title.",
  RESOLUTION_NOT_PERMITTED: "The requested video quality is not available for this title.",
  DRM_REQUIRED: "Protected playback is not supported in this browser or device.",
};

function deny(code: RightsDenialCode): RightsDecision {
  return {
    allowed: false,
    code,
    publicReason: PUBLIC_REASON_BY_CODE[code],
    policyVersion: RIGHTS_POLICY_VERSION,
  };
}

function hasVerifiedEvidence(grant: RightsGrantRecord): boolean {
  return grant.evidence.some(
    (ev) =>
      ev.evidenceSha256.length >= 64 &&
      ev.reviewedBy !== null &&
      ev.reviewedBy.trim().length > 0 &&
      ev.reviewedAt !== null,
  );
}

function isEntitlementSatisfied(
  required: EntitlementTier,
  actual: EntitlementTier | undefined,
): boolean {
  if (required === "FREE") {
    return true;
  }
  if (!actual) {
    return false;
  }
  if (required === "RENTED") {
    return actual === "RENTED" || actual === "SUBSCRIBER" || actual === "PARTNER";
  }
  return ENTITLEMENT_RANK[actual] >= ENTITLEMENT_RANK[required];
}

/**
 * Central RightsDecisionService (Blueprint §30.4, §43.2, §67.3, §74).
 * Fail-closed, side-effect-free policy evaluator shared by publication, catalogue availability,
 * playback authorization, and download authorization.
 */
export function evaluateRights(ctx: RightsEvaluationContext): RightsDecision {
  if (
    ctx.takedownActive ||
    ctx.titleStatus === "TAKEDOWN_HOLD" ||
    ctx.assetState === "TAKEDOWN_HOLD"
  ) {
    return deny("TAKEDOWN_HOLD_ACTIVE");
  }

  if (ctx.titleStatus !== "PUBLISHED") {
    return deny("TITLE_NOT_PUBLISHED");
  }

  const isMediaDelivery =
    ctx.action === "STREAM" || ctx.action === "DOWNLOAD" || ctx.action === "TRAILER";

  if (isMediaDelivery) {
    if (!ctx.assetId || ctx.assetState !== "PUBLISHED" || ctx.assetChecksumVerified === false) {
      return deny("ASSET_NOT_PUBLISHABLE");
    }
  }

  if (ctx.accountStatus === "SUSPENDED") {
    return deny("ACCOUNT_SUSPENDED");
  }

  if (
    ctx.maxConcurrentSessions !== undefined &&
    ctx.activeConcurrentSessions !== undefined &&
    ctx.activeConcurrentSessions >= ctx.maxConcurrentSessions
  ) {
    return deny("CONCURRENT_SESSION_LIMIT");
  }

  if (ctx.profileMaxMaturity && ctx.titleMaturityRating) {
    if (MATURITY_RANK[ctx.titleMaturityRating] > MATURITY_RANK[ctx.profileMaxMaturity]) {
      return deny("MATURITY_RESTRICTED");
    }
  }

  const normalizedTerritory = ctx.territoryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalizedTerritory)) {
    return deny("TERRITORY_RESTRICTED");
  }

  const candidateGrants = ctx.grants.filter((g) => {
    if (g.titleId !== ctx.titleId) {
      return false;
    }
    if (isMediaDelivery) {
      return g.assetId === ctx.assetId;
    }
    return g.assetId === null || g.assetId === ctx.assetId;
  });

  if (candidateGrants.length === 0) {
    return deny("NO_MATCHING_RIGHTS_GRANT");
  }

  let mostSpecificDenial: RightsDenialCode = "NO_MATCHING_RIGHTS_GRANT";
  const nowMs = ctx.at.getTime();

  for (const grant of candidateGrants) {
    if (grant.status !== "APPROVED") {
      mostSpecificDenial = grant.status === "EXPIRED" ? "RIGHTS_EXPIRED" : "RIGHTS_NOT_APPROVED";
      continue;
    }

    if (!hasVerifiedEvidence(grant)) {
      mostSpecificDenial = "RIGHTS_EVIDENCE_MISSING";
      continue;
    }

    // STREAM never implies DOWNLOAD; each action must be explicitly listed.
    if (!grant.allowedActions.includes(ctx.action)) {
      mostSpecificDenial = "ACTION_NOT_PERMITTED";
      continue;
    }

    const startMs = grant.validFrom.getTime();
    const endMs = grant.validUntil.getTime();
    if (!(startMs < endMs)) {
      mostSpecificDenial = "RIGHTS_NOT_APPROVED";
      continue;
    }
    if (nowMs < startMs) {
      mostSpecificDenial = "RIGHTS_WINDOW_NOT_STARTED";
      continue;
    }
    if (nowMs >= endMs) {
      mostSpecificDenial = "RIGHTS_EXPIRED";
      continue;
    }

    const excluded = grant.excludedTerritories?.map((t) => t.toUpperCase()) ?? [];
    const allowed = grant.allowedTerritories.map((t) => t.toUpperCase());
    if (excluded.includes(normalizedTerritory) || !allowed.includes(normalizedTerritory)) {
      mostSpecificDenial = "TERRITORY_RESTRICTED";
      continue;
    }

    if (grant.requiredEntitlement !== "FREE" && !ctx.userId) {
      mostSpecificDenial = "AUTHENTICATION_REQUIRED";
      continue;
    }

    if (!isEntitlementSatisfied(grant.requiredEntitlement, ctx.userEntitlement)) {
      mostSpecificDenial = "ENTITLEMENT_REQUIRED";
      continue;
    }

    const maxRes = grant.maxResolution ?? "1080p";
    if (
      ctx.requestedResolution &&
      RESOLUTION_RANK[ctx.requestedResolution] > RESOLUTION_RANK[maxRes]
    ) {
      mostSpecificDenial = "RESOLUTION_NOT_PERMITTED";
      continue;
    }

    const requiresDrm = Boolean(grant.requiresDrm);
    if (requiresDrm && ctx.drmCapableClient === false) {
      mostSpecificDenial = "DRM_REQUIRED";
      continue;
    }

    return {
      allowed: true,
      grantId: grant.id,
      policyVersion: RIGHTS_POLICY_VERSION,
      maxResolution: maxRes,
      requiresDrm,
    };
  }

  return deny(mostSpecificDenial);
}

export interface PublicationCheckInput {
  titleId: string;
  assetId: string;
  at: Date;
  takedownOwnerAssigned: boolean;
  attributionSatisfied: boolean;
  grants: readonly RightsGrantRecord[];
}

export function canPublishAssetWithRights(
  input: PublicationCheckInput,
): { publishable: true; grantIds: string[] } | { publishable: false; reason: string } {
  if (!input.takedownOwnerAssigned) {
    return {
      publishable: false,
      reason: "Takedown contact and owner must be assigned before publication",
    };
  }
  if (!input.attributionSatisfied) {
    return { publishable: false, reason: "Required metadata/licensor attribution is incomplete" };
  }

  const nowMs = input.at.getTime();
  const validGrants = input.grants.filter(
    (g) =>
      g.titleId === input.titleId &&
      g.assetId === input.assetId &&
      g.status === "APPROVED" &&
      g.allowedActions.length > 0 &&
      g.allowedTerritories.length > 0 &&
      g.validFrom.getTime() <= nowMs &&
      nowMs < g.validUntil.getTime() &&
      hasVerifiedEvidence(g),
  );

  if (validGrants.length === 0) {
    return {
      publishable: false,
      reason: "At least one active, approved rights grant with reviewed evidence is required",
    };
  }

  return {
    publishable: true,
    grantIds: validGrants.map((g) => g.id),
  };
}

export interface TitlePublicationCheckInput {
  titleId: string;
  at: Date;
  takedownActive: boolean;
  attributionSatisfied: boolean;
  grants: readonly RightsGrantRecord[];
}

export function canPublishTitleWithRights(
  input: TitlePublicationCheckInput,
): { publishable: true; grantIds: string[] } | { publishable: false; reason: string } {
  if (input.takedownActive) {
    return {
      publishable: false,
      reason: "Cannot publish a title while a takedown or legal hold is active",
    };
  }
  if (!input.attributionSatisfied) {
    return { publishable: false, reason: "Required metadata/licensor attribution is incomplete" };
  }

  const nowMs = input.at.getTime();
  const validGrants = input.grants.filter(
    (g) =>
      g.titleId === input.titleId &&
      g.status === "APPROVED" &&
      g.allowedActions.length > 0 &&
      g.allowedTerritories.length > 0 &&
      g.validFrom.getTime() <= nowMs &&
      nowMs < g.validUntil.getTime() &&
      hasVerifiedEvidence(g),
  );

  if (validGrants.length === 0) {
    return {
      publishable: false,
      reason: "At least one active, approved rights grant with reviewed evidence is required",
    };
  }

  return {
    publishable: true,
    grantIds: validGrants.map((g) => g.id),
  };
}
