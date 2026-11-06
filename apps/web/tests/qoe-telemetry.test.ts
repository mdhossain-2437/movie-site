import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { POST as handleQoePost } from "@/app/api/v1/playback-sessions/[id]/qoe/route";
import {
  getDatabase,
  newEntityId,
  playbackSessions,
  users,
  titles,
  mediaAssets,
  rightsHolders,
  rightsEvidence,
  rightsGrants,
} from "@movie/db";

function hashPlaybackToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken, "utf8").digest("hex");
}

const APP_URL = "http://localhost:3000";

function createQoeRequest(
  sessionId: string,
  body: Record<string, unknown>,
  options: {
    origin?: string;
    requestId?: string;
  } = {},
) {
  const headers = new Headers();
  headers.set("content-type", "application/json");
  if (options.origin !== undefined) {
    if (options.origin !== "") {
      headers.set("origin", options.origin);
    }
  } else {
    headers.set("origin", APP_URL);
  }
  if (options.requestId) {
    headers.set("x-request-id", options.requestId);
  }

  return new Request(`${APP_URL}/api/v1/playback-sessions/${sessionId}/qoe`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("QoE Telemetry Endpoint (POST /api/v1/playback-sessions/[id]/qoe)", () => {
  it("rejects cross-origin requests with 403 Forbidden", async () => {
    const req = createQoeRequest(
      "pbs_test_csrf",
      {
        playbackToken: "pbk_valid_dummy_token_12345",
        eventType: "FIRST_FRAME",
      },
      { origin: "https://malicious-origin.com" },
    );

    const res = await handleQoePost(req, { params: Promise.resolve({ id: "pbs_test_csrf" }) });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe("FORBIDDEN");
  });

  it("rejects state-changing requests missing an Origin header with 403 Forbidden", async () => {
    const req = createQoeRequest(
      "pbs_test_csrf",
      {
        playbackToken: "pbk_valid_dummy_token_12345",
        eventType: "FIRST_FRAME",
      },
      { origin: "" },
    );

    const res = await handleQoePost(req, { params: Promise.resolve({ id: "pbs_test_csrf" }) });
    expect(res.status).toBe(403);
  });

  describe("Forbidden secret key rejection (assertNoForbiddenSecrets)", () => {
    const forbiddenKeys = [
      "cookie",
      "bearer",
      "authorization",
      "password",
      "jwt",
      "auth_token",
      "secret_key",
    ];

    for (const secretKey of forbiddenKeys) {
      it(`rejects top-level secret key: '${secretKey}'`, async () => {
        const req = createQoeRequest("pbs_test_sec_top", {
          playbackToken: "pbk_valid_dummy_token_12345",
          eventType: "FIRST_FRAME",
          [secretKey]: "leaked_secret_value",
        });

        const res = await handleQoePost(req, {
          params: Promise.resolve({ id: "pbs_test_sec_top" }),
        });
        // The endpoint must cleanly reject forbidden sensitive payloads with 403 Forbidden
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.code).toBe("FORBIDDEN");
      });

      it(`rejects nested secret key in metrics: 'metrics.${secretKey}'`, async () => {
        const req = createQoeRequest("pbs_test_sec_nested", {
          playbackToken: "pbk_valid_dummy_token_12345",
          eventType: "FIRST_FRAME",
          metrics: {
            validMetric: 42,
            [secretKey]: "leaked_in_metrics",
          },
        });

        const res = await handleQoePost(req, {
          params: Promise.resolve({ id: "pbs_test_sec_nested" }),
        });
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.code).toBe("FORBIDDEN");
      });
    }
  });

  describe("Input schema validation (400 Bad Request)", () => {
    it("returns 400 when playbackToken is missing", async () => {
      const req = createQoeRequest("pbs_test_val", {
        eventType: "FIRST_FRAME",
      });

      const res = await handleQoePost(req, { params: Promise.resolve({ id: "pbs_test_val" }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("VALIDATION_ERROR");
      expect(json.detail).toContain("playbackToken");
    });

    it("returns 400 when playbackToken is shorter than 16 characters", async () => {
      const req = createQoeRequest("pbs_test_val", {
        playbackToken: "short_token",
        eventType: "FIRST_FRAME",
      });

      const res = await handleQoePost(req, { params: Promise.resolve({ id: "pbs_test_val" }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when eventType is invalid", async () => {
      const req = createQoeRequest("pbs_test_val", {
        playbackToken: "pbk_valid_dummy_token_12345",
        eventType: "NOT_AN_EVENT_TYPE",
      });

      const res = await handleQoePost(req, { params: Promise.resolve({ id: "pbs_test_val" }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when startupLatencyMs is negative", async () => {
      const req = createQoeRequest("pbs_test_val", {
        playbackToken: "pbk_valid_dummy_token_12345",
        eventType: "FIRST_FRAME",
        startupLatencyMs: -500,
      });

      const res = await handleQoePost(req, { params: Promise.resolve({ id: "pbs_test_val" }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Session lookup and token authentication", () => {
    it("returns 404 NOT_FOUND when the playback session does not exist", async () => {
      const req = createQoeRequest("pbs_non_existent_99999", {
        playbackToken: "pbk_valid_token_string_at_least_16_chars",
        eventType: "FIRST_FRAME",
      });

      const res = await handleQoePost(req, {
        params: Promise.resolve({ id: "pbs_non_existent_99999" }),
      });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.code).toBe("NOT_FOUND");
    });

    it("returns 401 UNAUTHENTICATED when the playback session exists but token does not match", async () => {
      const db = await getDatabase();
      const sessionId = newEntityId("pbs");
      const validToken = "pbk_real_session_token_12345678901234";
      const wrongToken = "pbk_wrong_session_token_12345678901234";

      const testUserId = newEntityId("usr");
      const testTitleId = newEntityId("ttl");
      const testAssetId = newEntityId("ast");
      const rightsHolderId = newEntityId("rhl");
      const evidenceId = newEntityId("rev");
      const grantId = newEntityId("rgr");

      await db.insert(users).values({
        id: testUserId,
        email: `qoe_tester_${Date.now()}@test.local`,
        passwordHash: "$scrypt$test",
        displayName: "QoE Tester",
        status: "ACTIVE",
        entitlementTier: "FREE",
      });

      await db.insert(rightsHolders).values({
        id: rightsHolderId,
        legalName: "Test Showcase Licensor",
        contactEmail: "legal@test.local",
        countryCode: "BD",
      });

      await db.insert(titles).values({
        id: testTitleId,
        slug: `qoe-film-${Date.now()}`,
        kind: "MOVIE",
        status: "PUBLISHED",
        originalTitle: "QoE Test Film",
        originalLanguage: "bn",
        releaseYear: 2026,
        runtimeMinutes: 100,
        maturityRating: "PG13",
        createdByUserId: testUserId,
      });

      await db.insert(rightsEvidence).values({
        id: evidenceId,
        rightsHolderId,
        titleId: testTitleId,
        basis: "OWNED",
        documentRef: "DOC-QOE-TEST",
        evidenceSha256: "b".repeat(64),
        submittedByUserId: testUserId,
      });

      await db.insert(mediaAssets).values({
        id: testAssetId,
        titleId: testTitleId,
        kind: "FEATURE",
        lifecycleState: "PUBLISHED",
        containerFormat: "mp4",
        durationSeconds: 6000,
        sha256Checksum: "b".repeat(64),
      });

      await db.insert(rightsGrants).values({
        id: grantId,
        titleId: testTitleId,
        assetId: testAssetId,
        rightsHolderId,
        evidenceId,
        status: "APPROVED",
        allowedActions: ["STREAM", "DOWNLOAD"],
        allowedTerritories: ["BD"],
        validFrom: new Date("2024-01-01"),
        validUntil: new Date("2035-12-31"),
        maxResolution: "1080p",
        createdByUserId: testUserId,
      });

      const now = new Date();
      await db.insert(playbackSessions).values({
        id: sessionId,
        userId: testUserId,
        titleId: testTitleId,
        assetId: testAssetId,
        grantId,
        tokenHash: hashPlaybackToken(validToken),
        territoryCode: "BD",
        maxResolution: "1080p",
        expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
        createdAt: now,
      });

      // Request with wrong token
      const reqWrong = createQoeRequest(sessionId, {
        playbackToken: wrongToken,
        eventType: "FIRST_FRAME",
      });
      const resWrong = await handleQoePost(reqWrong, {
        params: Promise.resolve({ id: sessionId }),
      });
      expect(resWrong.status).toBe(401);
      const jsonWrong = await resWrong.json();
      expect(jsonWrong.code).toBe("UNAUTHENTICATED");

      // Request with matching token -> should succeed 200
      const reqValid = createQoeRequest(sessionId, {
        playbackToken: validToken,
        eventType: "FIRST_FRAME",
        startupLatencyMs: 1400,
        regionCode: "BD",
        renditionProfile: "1080p",
        metrics: {
          deviceType: "desktop",
          bufferHealth: 5.2,
        },
      });
      const resValid = await handleQoePost(reqValid, {
        params: Promise.resolve({ id: sessionId }),
      });
      expect(resValid.status).toBe(200);
      const jsonValid = await resValid.json();
      expect(jsonValid.success).toBe(true);
      expect(jsonValid.eventId).toMatch(/^qoe_/);
      expect(jsonValid.status).toBe("RECORDED");

      // Test revoked session -> 422 SESSION_REVOKED
      const revokedSessionId = newEntityId("pbs");
      const revokedToken = "pbk_revoked_token_12345678901234";
      await db.insert(playbackSessions).values({
        id: revokedSessionId,
        userId: testUserId,
        titleId: testTitleId,
        assetId: testAssetId,
        grantId,
        tokenHash: hashPlaybackToken(revokedToken),
        territoryCode: "BD",
        maxResolution: "1080p",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        revokedAt: new Date(),
        createdAt: now,
      });

      const reqRevoked = createQoeRequest(revokedSessionId, {
        playbackToken: revokedToken,
        eventType: "ENDED",
      });
      const resRevoked = await handleQoePost(reqRevoked, {
        params: Promise.resolve({ id: revokedSessionId }),
      });
      expect(resRevoked.status).toBe(422);
      const jsonRevoked = await resRevoked.json();
      expect(jsonRevoked.code).toBe("SESSION_REVOKED");

      // Test expired session -> 422 SESSION_EXPIRED
      const expiredSessionId = newEntityId("pbs");
      const expiredToken = "pbk_expired_token_12345678901234";
      await db.insert(playbackSessions).values({
        id: expiredSessionId,
        userId: testUserId,
        titleId: testTitleId,
        assetId: testAssetId,
        grantId,
        tokenHash: hashPlaybackToken(expiredToken),
        territoryCode: "BD",
        maxResolution: "1080p",
        expiresAt: new Date(Date.now() - 60 * 1000), // 1 min in past
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
      });

      const reqExpired = createQoeRequest(expiredSessionId, {
        playbackToken: expiredToken,
        eventType: "ENDED",
      });
      const resExpired = await handleQoePost(reqExpired, {
        params: Promise.resolve({ id: expiredSessionId }),
      });
      expect(resExpired.status).toBe(422);
      const jsonExpired = await resExpired.json();
      expect(jsonExpired.code).toBe("SESSION_EXPIRED");
    });
  });
});
