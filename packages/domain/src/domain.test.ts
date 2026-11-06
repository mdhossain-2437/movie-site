import { describe, expect, it } from "vitest";
import {
  assertPermission,
  canPublishAssetWithRights,
  canTransitionAssetState,
  evaluateRights,
  hasPermission,
  transitionAssetState,
  type ActorIdentity,
  type RightsEvaluationContext,
  type RightsGrantRecord,
} from "./index";

const REVIEWED_EVIDENCE = [
  {
    id: "ev_01",
    evidenceSha256: "a".repeat(64),
    reviewedBy: "usr_reviewer_01",
    reviewedAt: new Date("2026-11-01T00:00:00Z"),
  },
] as const;

function buildValidGrant(overrides?: Partial<RightsGrantRecord>): RightsGrantRecord {
  return {
    id: "rg_01",
    titleId: "ttl_01",
    assetId: "ast_01",
    status: "APPROVED",
    allowedActions: ["STREAM"],
    allowedTerritories: ["BD"],
    validFrom: new Date("2026-10-01T00:00:00Z"),
    validUntil: new Date("2027-01-01T00:00:00Z"),
    requiredEntitlement: "FREE",
    maxResolution: "1080p",
    requiresDrm: false,
    evidence: REVIEWED_EVIDENCE,
    ...overrides,
  };
}

function buildValidContext(overrides?: Partial<RightsEvaluationContext>): RightsEvaluationContext {
  return {
    titleId: "ttl_01",
    titleStatus: "PUBLISHED",
    titleMaturityRating: "PG13",
    assetId: "ast_01",
    assetState: "PUBLISHED",
    assetChecksumVerified: true,
    drmCapableClient: true,
    action: "STREAM",
    territoryCode: "BD",
    at: new Date("2026-11-06T12:00:00Z"),
    userId: "usr_viewer_01",
    accountStatus: "ACTIVE",
    userEntitlement: "FREE",
    grants: [buildValidGrant()],
    ...overrides,
  };
}

describe("@movie/domain — RightsDecisionService", () => {
  it("allows playback when title, asset, territory, window, and reviewed evidence are valid", () => {
    const decision = evaluateRights(buildValidContext());
    expect(decision).toEqual({
      allowed: true,
      grantId: "rg_01",
      policyVersion: "2026-11-06.v1",
      maxResolution: "1080p",
      requiresDrm: false,
    });
  });

  it("denies DOWNLOAD when grant only permits STREAM (action isolation)", () => {
    const decision = evaluateRights(buildValidContext({ action: "DOWNLOAD" }));
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.code).toBe("ACTION_NOT_PERMITTED");
    }
  });

  it("denies delivery outside permitted territory and never infers worldwide rights from BD", () => {
    const decision = evaluateRights(buildValidContext({ territoryCode: "US" }));
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.code).toBe("TERRITORY_RESTRICTED");
      expect(decision.publicReason).toBe("Not available in your region.");
    }
  });

  it("denies delivery when rights window has expired or has not started", () => {
    const expired = evaluateRights(buildValidContext({ at: new Date("2027-01-01T00:00:00Z") }));
    expect(expired.allowed).toBe(false);
    if (!expired.allowed) {
      expect(expired.code).toBe("RIGHTS_EXPIRED");
    }

    const future = evaluateRights(buildValidContext({ at: new Date("2026-09-30T23:59:59Z") }));
    expect(future.allowed).toBe(false);
    if (!future.allowed) {
      expect(future.code).toBe("RIGHTS_WINDOW_NOT_STARTED");
    }
  });

  it("denies pending, revoked, or evidence-unreviewed grants", () => {
    const pending = evaluateRights(
      buildValidContext({ grants: [buildValidGrant({ status: "PENDING" })] }),
    );
    expect(pending.allowed).toBe(false);
    if (!pending.allowed) {
      expect(pending.code).toBe("RIGHTS_NOT_APPROVED");
    }

    const unreviewed = evaluateRights(
      buildValidContext({
        grants: [
          buildValidGrant({
            evidence: [
              { id: "ev_02", evidenceSha256: "b".repeat(64), reviewedBy: null, reviewedAt: null },
            ],
          }),
        ],
      }),
    );
    expect(unreviewed.allowed).toBe(false);
    if (!unreviewed.allowed) {
      expect(unreviewed.code).toBe("RIGHTS_EVIDENCE_MISSING");
    }
  });

  it("fails closed immediately on takedown hold, unpublished title, or quarantined asset", () => {
    const takedown = evaluateRights(buildValidContext({ takedownActive: true }));
    expect(takedown.allowed).toBe(false);
    if (!takedown.allowed) {
      expect(takedown.code).toBe("TAKEDOWN_HOLD_ACTIVE");
    }

    const unpublished = evaluateRights(buildValidContext({ titleStatus: "DRAFT" }));
    expect(unpublished.allowed).toBe(false);
    if (!unpublished.allowed) {
      expect(unpublished.code).toBe("TITLE_NOT_PUBLISHED");
    }

    const quarantined = evaluateRights(buildValidContext({ assetState: "QUARANTINED" }));
    expect(quarantined.allowed).toBe(false);
    if (!quarantined.allowed) {
      expect(quarantined.code).toBe("ASSET_NOT_PUBLISHABLE");
    }
  });

  it("enforces DRM client requirement (fail closed, never fall back to clear)", () => {
    const decision = evaluateRights(
      buildValidContext({
        drmCapableClient: false,
        grants: [buildValidGrant({ requiresDrm: true })],
      }),
    );
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.code).toBe("DRM_REQUIRED");
    }
  });

  it("enforces resolution caps, maturity limits, entitlement tiers, and concurrent device limits", () => {
    const resDenied = evaluateRights(buildValidContext({ requestedResolution: "2160p" }));
    expect(resDenied.allowed).toBe(false);
    if (!resDenied.allowed) {
      expect(resDenied.code).toBe("RESOLUTION_NOT_PERMITTED");
    }

    const maturityDenied = evaluateRights(
      buildValidContext({ titleMaturityRating: "R18", profileMaxMaturity: "PG13" }),
    );
    expect(maturityDenied.allowed).toBe(false);
    if (!maturityDenied.allowed) {
      expect(maturityDenied.code).toBe("MATURITY_RESTRICTED");
    }

    const subDenied = evaluateRights(
      buildValidContext({
        userEntitlement: "FREE",
        grants: [buildValidGrant({ requiredEntitlement: "SUBSCRIBER" })],
      }),
    );
    expect(subDenied.allowed).toBe(false);
    if (!subDenied.allowed) {
      expect(subDenied.code).toBe("ENTITLEMENT_REQUIRED");
    }

    const sessionCap = evaluateRights(
      buildValidContext({ activeConcurrentSessions: 2, maxConcurrentSessions: 2 }),
    );
    expect(sessionCap.allowed).toBe(false);
    if (!sessionCap.allowed) {
      expect(sessionCap.code).toBe("CONCURRENT_SESSION_LIMIT");
    }
  });

  it("blocks publication when takedown owner or reviewed rights are missing", () => {
    expect(
      canPublishAssetWithRights({
        titleId: "ttl_01",
        assetId: "ast_01",
        at: new Date("2026-11-06T12:00:00Z"),
        takedownOwnerAssigned: false,
        attributionSatisfied: true,
        grants: [buildValidGrant()],
      }).publishable,
    ).toBe(false);

    expect(
      canPublishAssetWithRights({
        titleId: "ttl_01",
        assetId: "ast_01",
        at: new Date("2026-11-06T12:00:00Z"),
        takedownOwnerAssigned: true,
        attributionSatisfied: true,
        grants: [buildValidGrant()],
      }).publishable,
    ).toBe(true);
  });
});

describe("@movie/domain — RBAC & Asset Lifecycle", () => {
  it("enforces separation of duties and MFA for privileged roles", () => {
    const editor: ActorIdentity = { userId: "u1", roles: ["EDITOR"], status: "ACTIVE" };
    const mediaOp: ActorIdentity = { userId: "u2", roles: ["MEDIA_OPERATOR"], status: "ACTIVE" };
    const reviewerNoMfa: ActorIdentity = {
      userId: "u3",
      roles: ["RIGHTS_REVIEWER"],
      status: "ACTIVE",
      mfaVerified: false,
    };
    const reviewerWithMfa: ActorIdentity = {
      userId: "u3",
      roles: ["RIGHTS_REVIEWER"],
      status: "ACTIVE",
      mfaVerified: true,
    };

    expect(hasPermission(editor, "catalogue:update")).toBe(true);
    expect(hasPermission(editor, "rights:approve")).toBe(false);
    expect(hasPermission(editor, "catalogue:publish")).toBe(false);

    expect(hasPermission(mediaOp, "media:upload")).toBe(true);
    expect(hasPermission(mediaOp, "rights:approve")).toBe(false);

    expect(() => assertPermission(reviewerNoMfa, "rights:approve")).toThrow(/Multi-factor/);
    expect(() => assertPermission(reviewerWithMfa, "rights:approve")).not.toThrow();
  });

  it("prevents uploaded files from bypassing quarantine/validation/review to reach PUBLISHED", () => {
    expect(canTransitionAssetState("UPLOADED", "PUBLISHED")).toBe(false);
    expect(canTransitionAssetState("UPLOADED", "QUARANTINED")).toBe(true);

    expect(() =>
      transitionAssetState({
        from: "READY_FOR_REVIEW",
        to: "PUBLISHED",
        hasApprovedRights: true,
        checksumVerified: true,
        qcPassed: false,
        reviewerApproved: true,
      }),
    ).toThrow(/Publication gate blocked/);

    expect(
      transitionAssetState({
        from: "READY_FOR_REVIEW",
        to: "PUBLISHED",
        hasApprovedRights: true,
        checksumVerified: true,
        qcPassed: true,
        reviewerApproved: true,
      }),
    ).toBe("PUBLISHED");
  });
});
