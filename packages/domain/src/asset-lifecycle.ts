import type { AssetLifecycleState } from "@movie/contracts";

/**
 * Guarded asset & ingestion lifecycle transitions (Blueprint §11, §30.5, §39.5, §85.2).
 * Notice:
 * - UPLOADED -> PUBLISHED does NOT exist. An uploaded file always enters QUARANTINED -> VALIDATING -> ...
 * - READY_FOR_REVIEW -> PUBLISHED additionally requires active approved rights & QC verification.
 */
export const ALLOWED_ASSET_TRANSITIONS: Readonly<
  Record<AssetLifecycleState, readonly AssetLifecycleState[]>
> = {
  DRAFT: ["RIGHTS_PENDING", "ARCHIVED"],
  RIGHTS_PENDING: ["RIGHTS_APPROVED", "DRAFT", "FAILED"],
  RIGHTS_APPROVED: ["UPLOAD_PENDING", "TAKEDOWN_HOLD", "ARCHIVED"],
  UPLOAD_PENDING: ["UPLOADING", "FAILED", "TAKEDOWN_HOLD"],
  UPLOADING: ["UPLOADED", "FAILED", "TAKEDOWN_HOLD"],
  UPLOADED: ["QUARANTINED", "FAILED", "TAKEDOWN_HOLD"],
  QUARANTINED: ["VALIDATING", "FAILED", "TAKEDOWN_HOLD"],
  VALIDATING: ["READY_FOR_PROCESSING", "QUARANTINED", "FAILED", "TAKEDOWN_HOLD"],
  READY_FOR_PROCESSING: ["PROCESSING", "FAILED", "TAKEDOWN_HOLD"],
  PROCESSING: ["READY_FOR_REVIEW", "FAILED", "TAKEDOWN_HOLD"],
  READY_FOR_REVIEW: ["PUBLISHED", "PROCESSING", "UNPUBLISHED", "TAKEDOWN_HOLD", "FAILED"],
  PUBLISHED: ["UNPUBLISHED", "TAKEDOWN_HOLD"],
  UNPUBLISHED: ["READY_FOR_REVIEW", "TAKEDOWN_HOLD", "ARCHIVED"],
  TAKEDOWN_HOLD: ["READY_FOR_REVIEW", "UNPUBLISHED", "ARCHIVED"],
  FAILED: ["UPLOAD_PENDING", "QUARANTINED", "READY_FOR_PROCESSING", "ARCHIVED"],
  ARCHIVED: [],
};

export function canTransitionAssetState(
  from: AssetLifecycleState,
  to: AssetLifecycleState,
): boolean {
  return ALLOWED_ASSET_TRANSITIONS[from].includes(to);
}

export interface TransitionAssetInput {
  from: AssetLifecycleState;
  to: AssetLifecycleState;
  hasApprovedRights?: boolean;
  checksumVerified?: boolean;
  qcPassed?: boolean;
  reviewerApproved?: boolean;
}

export function transitionAssetState(input: TransitionAssetInput): AssetLifecycleState {
  if (!canTransitionAssetState(input.from, input.to)) {
    throw new Error(`Invalid asset lifecycle transition: ${input.from} -> ${input.to}`);
  }
  if (input.to === "UPLOAD_PENDING" && !input.hasApprovedRights) {
    throw new Error("Cannot initiate upload before rights grant is approved");
  }
  if (input.to === "READY_FOR_PROCESSING" && !input.checksumVerified) {
    throw new Error("Cannot leave validation without verified SHA-256 checksum");
  }
  if (input.to === "PUBLISHED") {
    if (
      !input.hasApprovedRights ||
      !input.checksumVerified ||
      !input.qcPassed ||
      !input.reviewerApproved
    ) {
      throw new Error(
        "Publication gate blocked: requires approved rights, verified SHA-256, passed QC, and human reviewer approval",
      );
    }
  }
  return input.to;
}
