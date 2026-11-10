// @vitest-environment node
import crypto from "node:crypto";
import type { ActorIdentity } from "@movie/domain";
import { computeSha256Hex, InMemoryStorageAdapter } from "@movie/storage";
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import {
  approveAssetPackagingQc,
  approveRightsGrant,
  authorizeAssetDownload,
  authorizePlaybackSession,
  completeAuthorizedAssetUpload,
  createDraftMediaAsset,
  createDraftTitle,
  createTestDatabase,
  initiateAuthorizedAssetUpload,
  leaseAndProcessNextOutboxJob,
  listUserContinueWatching,
  listUserWatchHistorySlugs,
  mediaAssets,
  newEntityId,
  outboxJobs,
  playbackSessions,
  rightsEvidence,
  rightsGrants,
  rightsHolders,
  titles,
  titleTranslations,
  watchlistItems,
  createReplicationTask,
  getPlaybackQoeSummaryForAdmin,
  mediaObjects,
  publishApprovedMediaAsset,
  publishTitle,
  recordPlaybackHeartbeat,
  recordPlaybackQoeEvent,
  registerRightsGrant,
  replicationTasks,
  resolveTakedownCase,
  submitContentReport,
  users,
  verifyReplicationTaskChecksum,
} from "./index.ts";

async function seedActor(
  db: Awaited<ReturnType<typeof createTestDatabase>>["db"],
  email: string,
  roles: ActorIdentity["roles"],
  mfaVerified: boolean,
): Promise<ActorIdentity> {
  const id = newEntityId("usr");
  await db.insert(users).values({
    id,
    email,
    passwordHash: "$scrypt$n=32768,r=8,p=1$placeholder$placeholder",
    displayName: email,
    status: "ACTIVE",
  });
  return { userId: id, roles, status: "ACTIVE", mfaVerified };
}

describe("@movie/db M3–M5 — quarantine upload, durable outbox worker, playback sessions, DRM fail-closed, separate download gate & takedown revocation", () => {
  it("enforces rights-before-upload, checksum quarantine, idempotent outbox jobs, resolution caps, separate download rights, DRM fail-closed, and mid-stream takedown revocation", async () => {
    const handle = await createTestDatabase();
    const storage = new InMemoryStorageAdapter({
      signingSecret: "test-media-signing-secret-32-bytes-minimum!!",
    });

    try {
      const editor = await seedActor(handle.db, "editor-m3@example.org", ["EDITOR"], false);
      const mediaOp = await seedActor(handle.db, "media-op@example.org", ["MEDIA_OPERATOR"], false);
      const reviewer = await seedActor(
        handle.db,
        "reviewer-m3@example.org",
        ["RIGHTS_REVIEWER"],
        true,
      );
      const adminMfa = await seedActor(handle.db, "admin-m3@example.org", ["ADMIN"], true);
      const viewer = await seedActor(handle.db, "viewer-m3@example.org", ["VIEWER"], false);

      const now = new Date("2026-11-06T12:00:00Z");
      const validFrom = new Date("2026-11-01T00:00:00Z");
      const validUntil = new Date("2027-11-01T00:00:00Z");
      const fakeContractHash = crypto.createHash("sha256").update("contract-v1").digest("hex");

      const draft = await createDraftTitle(
        handle.db,
        { actor: editor, requestId: "req_m3_draft" },
        {
          slug: "meghna-chronicle-fixture",
          originalTitle: "Meghna Chronicle",
          originalLanguage: "bn",
          releaseYear: 2025,
          runtimeMinutes: 95,
          maturityRating: "PG13",
          isDevelopmentFixture: true,
          translations: [
            {
              locale: "en",
              localizedTitle: "Meghna Chronicle",
              synopsis: "Authorized test fixture film.",
            },
          ],
          attribution: {
            provider: "OPERATOR_ORIGINAL",
            attributionText: "© 2025 Operator Test Studio",
            licenseConfirmed: true,
          },
        },
      );

      // 1. Upload BEFORE rights grant approval must be denied!
      const validMp4Bytes = Buffer.from([
        0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02,
        0x00, 0x6d, 0x64, 0x61, 0x74, 0x01, 0x02, 0x03, 0x04,
      ]);
      const mp4Sha256 = await computeSha256Hex([validMp4Bytes]);

      await expect(
        initiateAuthorizedAssetUpload(
          handle.db,
          storage,
          { actor: mediaOp, requestId: "req_early_upload" },
          {
            titleId: draft.id,
            contentType: "video/mp4",
            expectedSizeBytes: validMp4Bytes.byteLength,
            expectedSha256: mp4Sha256,
            partCount: 1,
            at: now,
          },
        ),
      ).rejects.toThrowError(/Cannot initiate upload before rights grant is approved/);

      // 2. SSRF external URL ingestion must be explicitly blocked!
      await expect(
        initiateAuthorizedAssetUpload(
          handle.db,
          storage,
          { actor: mediaOp, requestId: "req_ssrf_attempt" },
          {
            titleId: draft.id,
            contentType: "video/mp4",
            expectedSizeBytes: validMp4Bytes.byteLength,
            expectedSha256: mp4Sha256,
            partCount: 1,
            sourceUrl: "https://external-host.example/movie.mp4",
            at: now,
          },
        ),
      ).rejects.toThrowError(/Arbitrary URL fetching is prohibited/);

      // Create draft feature asset + register STREAM-only BD 720p grant & approve via separate reviewer
      const { assetId } = await createDraftMediaAsset(
        handle.db,
        { actor: mediaOp, requestId: "req_create_asset" },
        { titleId: draft.id, kind: "FEATURE", drmRequired: false },
      );

      const streamOnlyGrant = await registerRightsGrant(
        handle.db,
        { actor: adminMfa, requestId: "req_grant_stream" },
        {
          titleId: draft.id,
          assetId,
          licensorLegalName: "Operator Test Studio Ltd.",
          licensorContactEmail: "rights@example.org",
          basis: "OWNED",
          documentRef: "LIC-2026-STREAM-BD",
          evidenceSha256: fakeContractHash,
          allowedActions: ["METADATA", "STREAM"],
          allowedTerritories: ["BD"],
          validFrom,
          validUntil,
          maxResolution: "720p",
          requiresDrm: false,
        },
      );

      await approveRightsGrant(
        handle.db,
        { actor: reviewer, requestId: "req_approve_stream" },
        streamOnlyGrant.grantId,
        { at: now },
      );

      await publishTitle(handle.db, { actor: adminMfa, requestId: "req_pub_title" }, draft.id, {
        at: now,
      });

      // 3. Tampered upload checksum must fail & mark asset FAILED!
      const badUpload = await initiateAuthorizedAssetUpload(
        handle.db,
        storage,
        { actor: mediaOp, requestId: "req_bad_upload" },
        {
          titleId: draft.id,
          contentType: "video/mp4",
          expectedSizeBytes: validMp4Bytes.byteLength,
          expectedSha256: mp4Sha256,
          partCount: 1,
          at: now,
        },
      );
      const tamperedBytes = Buffer.from(validMp4Bytes);
      tamperedBytes[tamperedBytes.length - 1] =
        (tamperedBytes[tamperedBytes.length - 1] ?? 0) ^ 0xff;
      const badPart = await storage.putPart(badUpload.uploadId, 1, tamperedBytes, now);

      await expect(
        completeAuthorizedAssetUpload(
          handle.db,
          storage,
          { actor: mediaOp, requestId: "req_bad_complete" },
          {
            assetId: badUpload.assetId,
            uploadId: badUpload.uploadId,
            parts: [{ partNumber: 1, etag: badPart.etag }],
            idempotencyKey: "idem-bad-1",
            at: now,
          },
        ),
      ).rejects.toThrowError(/Observed SHA-256 did not match/);

      // 4. Valid upload enters QUARANTINED (never auto-PUBLISHED!) + deduplicates repeated Idempotency-Key
      const goodUpload = await initiateAuthorizedAssetUpload(
        handle.db,
        storage,
        { actor: mediaOp, requestId: "req_good_upload" },
        {
          titleId: draft.id,
          assetId,
          contentType: "video/mp4",
          expectedSizeBytes: validMp4Bytes.byteLength,
          expectedSha256: mp4Sha256,
          partCount: 1,
          at: now,
        },
      );
      const goodPart = await storage.putPart(goodUpload.uploadId, 1, validMp4Bytes, now);

      const completed = await completeAuthorizedAssetUpload(
        handle.db,
        storage,
        { actor: mediaOp, requestId: "req_good_complete_1" },
        {
          assetId,
          uploadId: goodUpload.uploadId,
          parts: [{ partNumber: 1, etag: goodPart.etag }],
          idempotencyKey: "idem-good-upload-1",
          at: now,
        },
      );
      expect(completed.lifecycleState).toBe("QUARANTINED");

      // Replay identical completion with same idempotencyKey -> must NOT duplicate outbox job
      await completeAuthorizedAssetUpload(
        handle.db,
        storage,
        { actor: mediaOp, requestId: "req_good_complete_replay" },
        {
          assetId,
          uploadId: goodUpload.uploadId,
          parts: [{ partNumber: 1, etag: goodPart.etag }],
          idempotencyKey: "idem-good-upload-1",
          at: now,
        },
      );
      const jobsBefore = await handle.db.select().from(outboxJobs);
      expect(jobsBefore).toHaveLength(1);

      // 5. Outbox worker probes quarantined bytes and moves to READY_FOR_REVIEW (still NOT PUBLISHED)
      const workerRun = await leaseAndProcessNextOutboxJob(handle.db, {
        now,
        readHeaderBytes: async () => validMp4Bytes,
        defaultDurationSeconds: 5700,
      });
      expect(workerRun.processed).toBe(true);
      if (workerRun.processed) {
        expect(workerRun.status).toBe("COMPLETED");
        expect(workerRun.assetState).toBe("READY_FOR_REVIEW");
      }

      // 6. Media operator signs off QC (attaching 360p, 720p, and 1080p renditions + English VTT)
      await approveAssetPackagingQc(
        handle.db,
        storage,
        { actor: mediaOp, requestId: "req_qc_approve" },
        {
          assetId,
          renditions: [
            { profileId: "cmaf-360p", resolution: "360p", codec: "avc1.4d401e", bitrateKbps: 800 },
            { profileId: "cmaf-720p", resolution: "720p", codec: "avc1.64001f", bitrateKbps: 2800 },
            {
              profileId: "cmaf-1080p",
              resolution: "1080p",
              codec: "avc1.640028",
              bitrateKbps: 5200,
            },
          ],
          subtitles: [{ trackId: "sub-en", languageCode: "en", label: "English CC" }],
          at: now,
        },
      );

      // Separate publisher (`adminMfa` !== `mediaOp`) publishes the asset
      const publishedAsset = await publishApprovedMediaAsset(
        handle.db,
        { actor: adminMfa, requestId: "req_pub_asset" },
        assetId,
        { at: now },
      );
      expect(publishedAsset.lifecycleState).toBe("PUBLISHED");

      // 7. Playback session in BD succeeds, caps renditions at 720p (1080p excluded!), and hides sourceObjectKey
      const sessionBd = await authorizePlaybackSession(
        handle.db,
        storage,
        { actor: viewer, requestId: "req_play_bd" },
        {
          titleSlug: draft.slug,
          territoryCode: "BD",
          at: now,
        },
      );
      expect(sessionBd.maxResolution).toBe("720p");
      expect(sessionBd.renditions.map((r) => r.resolution)).toEqual(["360p", "720p"]);
      expect(JSON.stringify(sessionBd)).not.toContain("quarantine/");
      expect(JSON.stringify(sessionBd)).not.toContain("source.bin");
      expect(sessionBd.subtitles).toHaveLength(1);

      // Territorial restriction: US viewer must be denied!
      await expect(
        authorizePlaybackSession(
          handle.db,
          storage,
          { actor: viewer, requestId: "req_play_us" },
          {
            titleSlug: draft.slug,
            territoryCode: "US",
            at: now,
          },
        ),
      ).rejects.toThrowError(/Not available in your region/);

      // 8. STREAM grant NEVER implies DOWNLOAD! Download must be denied with ACTION_NOT_PERMITTED
      await expect(
        authorizeAssetDownload(
          handle.db,
          storage,
          { actor: viewer, requestId: "req_dl_denied" },
          {
            assetId,
            territoryCode: "BD",
            at: now,
          },
        ),
      ).rejects.toThrowError(/delivery option is not available/);

      // Add explicit DOWNLOAD grant & approve -> Download now succeeds with single-object GET URL!
      const downloadGrant = await registerRightsGrant(
        handle.db,
        { actor: adminMfa, requestId: "req_grant_dl" },
        {
          titleId: draft.id,
          assetId,
          licensorLegalName: "Operator Test Studio Ltd.",
          licensorContactEmail: "rights@example.org",
          basis: "OWNED",
          documentRef: "LIC-2026-DL-BD",
          evidenceSha256: fakeContractHash,
          allowedActions: ["DOWNLOAD"],
          allowedTerritories: ["BD"],
          validFrom,
          validUntil,
          maxResolution: "720p",
        },
      );
      await approveRightsGrant(
        handle.db,
        { actor: reviewer, requestId: "req_approve_dl" },
        downloadGrant.grantId,
        { at: now },
      );

      const authorizedDl = await authorizeAssetDownload(
        handle.db,
        storage,
        { actor: viewer, requestId: "req_dl_ok" },
        { assetId, territoryCode: "BD", at: now },
      );
      expect(authorizedDl.resolution).toBe("720p");
      expect(authorizedDl.downloadUrl).toContain("method=GET");

      // 9. Monotonic heartbeat updates resume position and ignores stale out-of-order updates
      const hb1 = await recordPlaybackHeartbeat(handle.db, {
        sessionId: sessionBd.sessionId,
        playbackToken: sessionBd.playbackToken,
        positionSeconds: 185,
        qoeEvent: { eventType: "HEARTBEAT", activeResolution: "720p" },
        at: now,
      });
      expect(hb1.lastPositionSeconds).toBe(185);

      const hbStale = await recordPlaybackHeartbeat(handle.db, {
        sessionId: sessionBd.sessionId,
        playbackToken: sessionBd.playbackToken,
        positionSeconds: 40,
        at: now,
      });
      expect(hbStale.lastPositionSeconds).toBe(185);

      // 10. Takedown resolution with LEGAL_HOLD_APPLIED immediately revokes active playback mid-stream!
      const report = await submitContentReport(
        handle.db,
        { actor: null, requestId: "req_report_1" },
        {
          targetPath: `/movies/${draft.slug}`,
          titleSlug: draft.slug,
          reporterName: "Counsel Review",
          reporterEmail: "counsel@example.org",
          claimSummary: "Urgent rights dispute drill requiring immediate hold.",
        },
      );

      await resolveTakedownCase(
        handle.db,
        { actor: adminMfa, requestId: "req_resolve_hold" },
        {
          caseId: report.id,
          outcome: "LEGAL_HOLD_APPLIED",
          resolutionNotes: "Emergency hold applied; revoking active streams.",
          at: now,
        },
      );

      await expect(
        recordPlaybackHeartbeat(handle.db, {
          sessionId: sessionBd.sessionId,
          playbackToken: sessionBd.playbackToken,
          positionSeconds: 210,
          at: now,
        }),
      ).rejects.toThrowError(/revoked/);

      // 11. Fail-closed DRM check: DRM-required title/asset MUST deny playback when no DRM adapter is configured
      const drmDraft = await createDraftTitle(
        handle.db,
        { actor: editor, requestId: "req_drm_draft" },
        {
          slug: "studio-drm-fixture",
          originalTitle: "Studio DRM Fixture",
          originalLanguage: "en",
          releaseYear: 2026,
          runtimeMinutes: 110,
          maturityRating: "PG13",
          isDevelopmentFixture: true,
          translations: [
            { locale: "en", localizedTitle: "Studio DRM Fixture", synopsis: "Protected fixture." },
          ],
          attribution: {
            provider: "LICENSED_PARTNER",
            attributionText: "© 2026 Studio Partner",
            licenseConfirmed: true,
          },
        },
      );
      const { assetId: drmAssetId } = await createDraftMediaAsset(
        handle.db,
        { actor: mediaOp, requestId: "req_drm_asset" },
        { titleId: drmDraft.id, kind: "FEATURE", drmRequired: true },
      );
      const drmGrant = await registerRightsGrant(
        handle.db,
        { actor: adminMfa, requestId: "req_drm_grant" },
        {
          titleId: drmDraft.id,
          assetId: drmAssetId,
          licensorLegalName: "Studio Partner Inc.",
          licensorContactEmail: "legal@studio.example",
          basis: "LICENSED",
          documentRef: "DRM-LIC-01",
          evidenceSha256: fakeContractHash,
          allowedActions: ["METADATA", "STREAM"],
          allowedTerritories: ["BD"],
          validFrom,
          validUntil,
          maxResolution: "1080p",
          requiresDrm: true,
        },
      );
      await approveRightsGrant(
        handle.db,
        { actor: reviewer, requestId: "req_drm_approve" },
        drmGrant.grantId,
        { at: now },
      );
      await publishTitle(handle.db, { actor: adminMfa, requestId: "req_drm_pub" }, drmDraft.id, {
        at: now,
      });

      const drmUpload = await initiateAuthorizedAssetUpload(
        handle.db,
        storage,
        { actor: mediaOp, requestId: "req_drm_upload" },
        {
          titleId: drmDraft.id,
          assetId: drmAssetId,
          drmRequired: true,
          contentType: "video/mp4",
          expectedSizeBytes: validMp4Bytes.byteLength,
          expectedSha256: mp4Sha256,
          partCount: 1,
          at: now,
        },
      );
      const drmPart = await storage.putPart(drmUpload.uploadId, 1, validMp4Bytes, now);
      await completeAuthorizedAssetUpload(
        handle.db,
        storage,
        { actor: mediaOp, requestId: "req_drm_complete" },
        {
          assetId: drmAssetId,
          uploadId: drmUpload.uploadId,
          parts: [{ partNumber: 1, etag: drmPart.etag }],
          idempotencyKey: "idem-drm-1",
          at: now,
        },
      );
      await leaseAndProcessNextOutboxJob(handle.db, {
        now,
        readHeaderBytes: async () => validMp4Bytes,
      });
      await approveAssetPackagingQc(
        handle.db,
        storage,
        { actor: mediaOp, requestId: "req_drm_qc" },
        {
          assetId: drmAssetId,
          renditions: [
            {
              profileId: "cmaf-1080p",
              resolution: "1080p",
              codec: "avc1.640028",
              bitrateKbps: 5200,
              hasConfiguredDrm: false,
            },
          ],
          at: now,
        },
      );
      await publishApprovedMediaAsset(
        handle.db,
        { actor: adminMfa, requestId: "req_drm_pub_asset" },
        drmAssetId,
        { at: now },
      );

      // Even if client claims `drmCapableClient: true`, server has no licensed DRM adapter configured -> FAIL CLOSED!
      await expect(
        authorizePlaybackSession(
          handle.db,
          storage,
          { actor: viewer, requestId: "req_drm_play_fail_closed" },
          {
            titleSlug: drmDraft.slug,
            territoryCode: "BD",
            drmCapableClient: true,
            drmLicenseAdapterConfigured: false,
            at: now,
          },
        ),
      ).rejects.toThrowError(/clear-stream fallback is prohibited/);
    } finally {
      await handle.close();
    }
  });

  it("enforces V4 QoE telemetry recording, admin summary aggregation, and replication task lifecycle with atomic takedown decommission", async () => {
    const handle = await createTestDatabase();
    const storage = new InMemoryStorageAdapter();
    const now = new Date("2026-11-06T12:00:00Z");

    try {
      const adminMfa = await seedActor(
        handle.db,
        "admin.mfa@example.com",
        ["ADMIN", "RIGHTS_REVIEWER", "MEDIA_OPERATOR"],
        true,
      );
      const editor = await seedActor(handle.db, "editor@example.com", ["EDITOR"], false);
      const reviewer = await seedActor(
        handle.db,
        "reviewer@example.com",
        ["RIGHTS_REVIEWER"],
        true,
      );
      const mediaOp = await seedActor(handle.db, "mediaop@example.com", ["MEDIA_OPERATOR"], false);
      const viewer = await seedActor(handle.db, "viewer@example.com", ["VIEWER"], false);

      // Create and publish a title with approved rights
      const title = await createDraftTitle(
        handle.db,
        { actor: editor, requestId: "req_v4_draft" },
        {
          slug: "monsoon-noir-qoe",
          originalTitle: "Monsoon Noir QoE",
          originalLanguage: "bn",
          releaseYear: 2026,
          runtimeMinutes: 100,
          maturityRating: "PG13",
          isDevelopmentFixture: true,
          translations: [{ locale: "en", localizedTitle: "Monsoon Noir QoE", synopsis: "Test." }],
          attribution: {
            provider: "OPERATOR_ORIGINAL",
            attributionText: "© 2026 Operator",
            licenseConfirmed: true,
          },
        },
      );

      const asset = await createDraftMediaAsset(
        handle.db,
        { actor: adminMfa, requestId: "req_v4_asset" },
        { titleId: title.id, kind: "FEATURE" },
      );

      const grant = await registerRightsGrant(
        handle.db,
        { actor: adminMfa, requestId: "req_v4_grant" },
        {
          titleId: title.id,
          assetId: asset.assetId,
          licensorLegalName: "Operator Rights",
          licensorContactEmail: "legal@example.com",
          basis: "OWNED",
          documentRef: "DOC-V4-001",
          evidenceSha256: "a".repeat(64),
          allowedActions: ["STREAM", "DOWNLOAD"],
          allowedTerritories: ["BD", "US"],
          validFrom: new Date("2026-01-01T00:00:00Z"),
          validUntil: new Date("2027-01-01T00:00:00Z"),
          maxResolution: "1080p",
          requiresDrm: false,
        },
      );

      await approveRightsGrant(
        handle.db,
        { actor: reviewer, requestId: "req_v4_appr_grant" },
        grant.grantId,
        { at: now },
      );
      await publishTitle(handle.db, { actor: adminMfa, requestId: "req_v4_pub_title" }, title.id, {
        at: now,
      });

      // Upload and approve media asset
      const chunk = Buffer.from([
        0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02,
        0x00, 0x6d, 0x64, 0x61, 0x74, 0x01, 0x02, 0x03, 0x04,
      ]);
      const chunkSha = await computeSha256Hex([chunk]);
      const upl = await initiateAuthorizedAssetUpload(
        handle.db,
        storage,
        { actor: adminMfa, requestId: "req_v4_upl_init" },
        {
          titleId: title.id,
          assetId: asset.assetId,
          expectedSizeBytes: chunk.byteLength,
          expectedSha256: chunkSha,
          contentType: "video/mp4",
          partCount: 1,
          at: now,
        },
      );
      const putPartRes = await storage.putPart(upl.uploadId, 1, chunk, now);
      await completeAuthorizedAssetUpload(
        handle.db,
        storage,
        { actor: adminMfa, requestId: "req_v4_upl_comp" },
        {
          assetId: asset.assetId,
          uploadId: upl.uploadId,
          parts: [{ partNumber: 1, etag: putPartRes.etag }],
          idempotencyKey: "idem-v4-upl-1",
          at: now,
        },
      );
      await leaseAndProcessNextOutboxJob(handle.db, {
        now,
        readHeaderBytes: async () => chunk,
        defaultDurationSeconds: 5700,
      });
      await approveAssetPackagingQc(
        handle.db,
        storage,
        { actor: mediaOp, requestId: "req_v4_qc" },
        {
          assetId: asset.assetId,
          renditions: [
            {
              profileId: "cmaf-1080p",
              resolution: "1080p",
              codec: "avc1.640028",
              bitrateKbps: 5200,
              hasConfiguredDrm: false,
            },
          ],
          at: now,
        },
      );
      await publishApprovedMediaAsset(
        handle.db,
        { actor: adminMfa, requestId: "req_v4_pub_ast" },
        asset.assetId,
        { at: now },
      );

      // Authorize playback session
      const session = await authorizePlaybackSession(
        handle.db,
        storage,
        { actor: viewer, requestId: "req_v4_session" },
        { titleSlug: title.slug, territoryCode: "BD", at: now },
      );

      // 1. Record QoE events
      const qoe1 = await recordPlaybackQoeEvent(handle.db, {
        sessionId: session.sessionId,
        playbackToken: session.playbackToken,
        eventType: "FIRST_FRAME",
        startupLatencyMs: 1200,
        renditionProfile: "cmaf-1080p-avc",
        regionCode: "BD",
        occurredAt: now,
        at: now,
      });
      expect(qoe1.status).toBe("RECORDED");
      expect(qoe1.eventId).toMatch(/^qoe_/);

      const qoe2 = await recordPlaybackQoeEvent(handle.db, {
        sessionId: session.sessionId,
        playbackToken: session.playbackToken,
        eventType: "REBUFFER_STARTED",
        rebufferDurationMs: 450,
        occurredAt: now,
        at: now,
      });
      expect(qoe2.status).toBe("RECORDED");

      // Invalid token rejected with UNAUTHENTICATED
      await expect(
        recordPlaybackQoeEvent(handle.db, {
          sessionId: session.sessionId,
          playbackToken: "invalid_playback_token_32_bytes_long",
          eventType: "ENDED",
          at: now,
        }),
      ).rejects.toThrowError(/Invalid playback session token/);

      // Explicit verification: expired session rejected with SESSION_EXPIRED
      const expiredTimestamp = new Date(session.expiresAt.getTime() + 1000);
      await expect(
        recordPlaybackQoeEvent(handle.db, {
          sessionId: session.sessionId,
          playbackToken: session.playbackToken,
          eventType: "ENDED",
          at: expiredTimestamp,
        }),
      ).rejects.toThrowError(/Playback session has expired/);

      // 2. Query QoE Summary for Admin
      const summary = await getPlaybackQoeSummaryForAdmin(handle.db, {
        actor: adminMfa,
        requestId: "req_v4_admin_summary",
      });
      expect(summary.totalEvents).toBeGreaterThanOrEqual(2);
      expect(summary.totalSessions).toBe(1);
      expect(summary.startupLatencyStats.count).toBe(1);
      expect(summary.startupLatencyStats.p75Ms).toBe(1200);
      expect(summary.rebufferStats.totalDurationMs).toBe(450);

      // Non-staff rejected from admin summary
      await expect(
        getPlaybackQoeSummaryForAdmin(handle.db, {
          actor: viewer,
          requestId: "req_v4_viewer_denied",
        }),
      ).rejects.toThrowError(/Staff role required/);

      // 3. Replication Task Lifecycle
      const [storageObj] = await handle.db.select().from(mediaObjects).limit(1);
      expect(storageObj).toBeDefined();

      const repTask = await createReplicationTask(
        handle.db,
        { actor: adminMfa, requestId: "req_v4_rep_task" },
        {
          storageObjectId: storageObj!.id,
          targetProvider: "r2",
          targetRegion: "wnam",
          expectedSha256: storageObj!.sha256Checksum,
        },
      );
      expect(repTask.status).toBe("PENDING");

      // Verify checksum mismatch -> FAILED
      const failedVerify = await verifyReplicationTaskChecksum(
        handle.db,
        { actor: adminMfa, requestId: "req_v4_fail_verify" },
        { taskId: repTask.taskId, computedSha256: "0".repeat(64) },
      );
      expect(failedVerify.status).toBe("FAILED");
      expect(failedVerify.verified).toBe(false);

      // Verify matching checksum -> VERIFIED
      const passVerify = await verifyReplicationTaskChecksum(
        handle.db,
        { actor: adminMfa, requestId: "req_v4_pass_verify" },
        { taskId: repTask.taskId, computedSha256: storageObj!.sha256Checksum },
      );
      expect(passVerify.status).toBe("VERIFIED");
      expect(passVerify.verified).toBe(true);

      // 4. Atomic Takedown Kill-Switch: upholding takedown decommissions replication tasks
      const report = await submitContentReport(
        handle.db,
        { actor: null, requestId: "req_v4_report" },
        {
          targetPath: `/movies/${title.slug}`,
          titleSlug: title.slug,
          reporterName: "Rights Holder",
          reporterEmail: "counsel@studio.com",
          claimSummary: "Infringement assertion.",
        },
      );

      await resolveTakedownCase(
        handle.db,
        { actor: adminMfa, requestId: "req_v4_takedown_resolve" },
        {
          caseId: report.id,
          outcome: "RESOLVED_UPHELD",
          resolutionNotes: "Takedown upheld; decommissioning all replicas.",
          at: now,
        },
      );

      const [updatedTask] = await handle.db
        .select()
        .from(replicationTasks)
        .where(eq(replicationTasks.id, repTask.taskId));
      expect(updatedTask?.status).toBe("DECOMMISSIONED");

      // Further QoE on revoked session rejected
      await expect(
        recordPlaybackQoeEvent(handle.db, {
          sessionId: session.sessionId,
          playbackToken: session.playbackToken,
          eventType: "ENDED",
          at: now,
        }),
      ).rejects.toThrowError(/revoked/);
    } finally {
      await handle.close();
    }
  });

  it("lists in-progress Continue Watching records (deduplicated, completed-filtered, legal-hold-safe) and watch history slugs", async () => {
    const handle = await createTestDatabase();
    try {
      const viewer = await seedActor(handle.db, "viewer-cw@example.org", ["VIEWER"], false);
      const holderId = newEntityId("rh");
      await handle.db.insert(rightsHolders).values({
        id: holderId,
        legalName: "Cineva Studio Holdings",
        contactEmail: "rights@cineva.example",
      });

      const seedPublishedTitle = async (
        slug: string,
        titleEn: string,
        runtimeMinutes: number,
        legalHold = false,
      ) => {
        const titleId = newEntityId("ttl");
        const assetId = newEntityId("ast");
        const grantId = newEntityId("grt");
        await handle.db.insert(titles).values({
          id: titleId,
          slug,
          kind: "MOVIE",
          status: "PUBLISHED",
          originalTitle: titleEn,
          originalLanguage: "en",
          releaseYear: 2025,
          runtimeMinutes,
          maturityRating: "PG13",
          legalHold,
        });
        await handle.db.insert(titleTranslations).values({
          id: newEntityId("trn"),
          titleId,
          locale: "en",
          localizedTitle: titleEn,
          synopsis: "English synopsis.",
        });
        await handle.db.insert(mediaAssets).values({
          id: assetId,
          titleId,
          kind: "FEATURE",
          lifecycleState: "PUBLISHED",
          durationSeconds: runtimeMinutes * 60,
        });
        const evidenceId = newEntityId("rev");
        await handle.db.insert(rightsEvidence).values({
          id: evidenceId,
          rightsHolderId: holderId,
          titleId,
          basis: "OWNED",
          documentRef: `DOC-${slug}`,
          evidenceSha256: "a".repeat(64),
          submittedByUserId: viewer.userId,
        });
        await handle.db.insert(rightsGrants).values({
          id: grantId,
          titleId,
          assetId,
          rightsHolderId: holderId,
          evidenceId,
          status: "APPROVED",
          allowedActions: ["STREAM"],
          allowedTerritories: ["WORLDWIDE"],
          maxResolution: "1080p",
          requiresDrm: false,
          validFrom: new Date("2026-01-01T00:00:00Z"),
          validUntil: new Date("2028-01-01T00:00:00Z"),
          createdByUserId: viewer.userId,
        });
        return { titleId, assetId, grantId };
      };

      const filmA = await seedPublishedTitle("the-last-monsoon", "The Last Monsoon", 100);
      const filmB = await seedPublishedTitle("iron-eclipse", "Iron Eclipse", 120);
      const filmCompleted = await seedPublishedTitle("finished-film", "Finished Film", 100);
      const filmHeld = await seedPublishedTitle("held-film", "Held Film", 100, true);
      const filmWatchlistOnly = await seedPublishedTitle(
        "syndicate-of-ash",
        "Syndicate of Ash",
        110,
      );

      // Older session on filmA at 120s, newer session on filmA at 900s (15% of 6000s)
      await handle.db.insert(playbackSessions).values([
        {
          id: newEntityId("pbs"),
          userId: viewer.userId,
          titleId: filmA.titleId,
          assetId: filmA.assetId,
          grantId: filmA.grantId,
          territoryCode: "US",
          maxResolution: "1080p",
          tokenHash: crypto.randomBytes(32).toString("hex"),
          lastPositionSeconds: 120,
          expiresAt: new Date("2027-01-01T00:00:00Z"),
          createdAt: new Date("2026-11-06T10:00:00Z"),
        },
        {
          id: newEntityId("pbs"),
          userId: viewer.userId,
          titleId: filmA.titleId,
          assetId: filmA.assetId,
          grantId: filmA.grantId,
          territoryCode: "US",
          maxResolution: "1080p",
          tokenHash: crypto.randomBytes(32).toString("hex"),
          lastPositionSeconds: 900,
          expiresAt: new Date("2027-01-01T00:00:00Z"),
          createdAt: new Date("2026-11-06T11:00:00Z"),
        },
        {
          id: newEntityId("pbs"),
          userId: viewer.userId,
          titleId: filmB.titleId,
          assetId: filmB.assetId,
          grantId: filmB.grantId,
          territoryCode: "US",
          maxResolution: "1080p",
          tokenHash: crypto.randomBytes(32).toString("hex"),
          lastPositionSeconds: 1800,
          expiresAt: new Date("2027-01-01T00:00:00Z"),
          createdAt: new Date("2026-11-06T12:00:00Z"),
        },
        {
          id: newEntityId("pbs"),
          userId: viewer.userId,
          titleId: filmCompleted.titleId,
          assetId: filmCompleted.assetId,
          grantId: filmCompleted.grantId,
          territoryCode: "US",
          maxResolution: "1080p",
          tokenHash: crypto.randomBytes(32).toString("hex"),
          lastPositionSeconds: 5990,
          expiresAt: new Date("2027-01-01T00:00:00Z"),
          createdAt: new Date("2026-11-06T12:30:00Z"),
        },
        {
          id: newEntityId("pbs"),
          userId: viewer.userId,
          titleId: filmHeld.titleId,
          assetId: filmHeld.assetId,
          grantId: filmHeld.grantId,
          territoryCode: "US",
          maxResolution: "1080p",
          tokenHash: crypto.randomBytes(32).toString("hex"),
          lastPositionSeconds: 600,
          expiresAt: new Date("2027-01-01T00:00:00Z"),
          createdAt: new Date("2026-11-06T13:00:00Z"),
        },
      ]);

      await handle.db.insert(watchlistItems).values({
        userId: viewer.userId,
        titleId: filmWatchlistOnly.titleId,
      });

      const cw = await listUserContinueWatching(handle.db, viewer.userId, 8);
      expect(cw.map((item) => item.titleSlug)).toEqual(["iron-eclipse", "the-last-monsoon"]);
      expect(cw[0]?.progressPercent).toBe(25);
      expect(cw[1]?.lastPositionSeconds).toBe(900);
      expect(cw[1]?.progressPercent).toBe(15);

      const historySlugs = await listUserWatchHistorySlugs(handle.db, viewer.userId, 6);
      expect(historySlugs).toContain("iron-eclipse");
      expect(historySlugs).toContain("the-last-monsoon");
      expect(historySlugs).toContain("syndicate-of-ash");
      expect(historySlugs).not.toContain("held-film");
    } finally {
      await handle.close();
    }
  });
});
