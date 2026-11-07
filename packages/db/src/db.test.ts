// @vitest-environment node
import type { ActorIdentity } from "@movie/domain";
import { describe, expect, it } from "vitest";
import {
  addWatchlistItem,
  approveRightsGrant,
  createDraftTitle,
  createTestDatabase,
  getPublishedTitleBySlug,
  listPublishedTitles,
  listWatchlistItems,
  newEntityId,
  publishTitle,
  registerRightsGrant,
  removeWatchlistItem,
  searchPublishedTitles,
  submitContentReport,
  unpublishTitle,
  users,
} from "./index";

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

describe("@movie/db centralized DAL, rights gate, separation of duties & IDOR defense", () => {
  it("enforces RBAC, MFA, separation of duties, territorial rights, Bangla search, IDOR isolation, and legal hold kill-switch", async () => {
    const handle = await createTestDatabase();
    try {
      const viewerA = await seedActor(handle.db, "viewer-a@example.org", ["VIEWER"], false);
      const viewerB = await seedActor(handle.db, "viewer-b@example.org", ["VIEWER"], false);
      const editor = await seedActor(handle.db, "editor@example.org", ["EDITOR"], false);
      const adminNoMfa = await seedActor(handle.db, "admin-nomfa@example.org", ["ADMIN"], false);
      const adminMfa = await seedActor(handle.db, "admin-mfa@example.org", ["ADMIN"], true);
      const reviewerA = await seedActor(
        handle.db,
        "reviewer-a@example.org",
        ["RIGHTS_REVIEWER"],
        true,
      );
      const reviewerB = await seedActor(
        handle.db,
        "reviewer-b@example.org",
        ["RIGHTS_REVIEWER"],
        true,
      );

      // 1. Negative RBAC: VIEWER cannot create a draft title.
      await expect(
        createDraftTitle(
          handle.db,
          { actor: viewerA, requestId: "req_1" },
          {
            slug: "unauthorized-draft",
            originalTitle: "Unauthorized",
            originalLanguage: "en",
            releaseYear: 1960,
            runtimeMinutes: 95,
            maturityRating: "PG",
            isDevelopmentFixture: true,
            translations: [{ locale: "en", localizedTitle: "Unauthorized", synopsis: "Test" }],
            attribution: {
              provider: "PUBLIC_DOMAIN_RECORD",
              attributionText: "Public domain archival fixture",
              licenseConfirmed: true,
            },
          },
        ),
      ).rejects.toThrow(/Missing required permission/);

      // 2. Negative TMDb commercial guard: unconfirmed TMDb attribution is rejected.
      await expect(
        createDraftTitle(
          handle.db,
          { actor: editor, requestId: "req_2" },
          {
            slug: "unlicensed-tmdb-draft",
            originalTitle: "Unlicensed TMDb Test",
            originalLanguage: "en",
            releaseYear: 1970,
            runtimeMinutes: 100,
            maturityRating: "PG",
            isDevelopmentFixture: true,
            translations: [{ locale: "en", localizedTitle: "Test", synopsis: "Test" }],
            attribution: {
              provider: "TMDB",
              attributionText: "TMDb",
              licenseConfirmed: false,
            },
          },
        ),
      ).rejects.toThrow(/TMDb metadata cannot be persisted/);

      // 3. EDITOR creates a valid draft with English + Bangla localized metadata.
      const draft = await createDraftTitle(
        handle.db,
        { actor: editor, requestId: "req_3" },
        {
          slug: "open-river-chronicle",
          originalTitle: "Open River Chronicle",
          originalLanguage: "bn",
          releaseYear: 1958,
          runtimeMinutes: 112,
          maturityRating: "U",
          isDevelopmentFixture: true,
          translations: [
            {
              locale: "en",
              localizedTitle: "Open River Chronicle",
              synopsis: "Archival public-domain test fixture set along the Padma river.",
            },
            {
              locale: "bn",
              localizedTitle: "মুক্ত নদীর উপাখ্যান",
              synopsis: "পদ্মা নদীর তীরে নির্মিত পরীক্ষামূলক পাবলিক ডোমেইন চলচ্চিত্র রেকর্ড।",
            },
          ],
          credits: [
            {
              personSlug: "kamal-choudhury-fixture",
              nameEn: "Kamal Choudhury",
              nameBn: "কামাল চৌধুরী",
              department: "DIRECTOR",
              billingOrder: 1,
            },
          ],
          attribution: {
            provider: "PUBLIC_DOMAIN_RECORD",
            attributionText: "Verified open archival test record (development fixture)",
            licenseConfirmed: true,
          },
        },
      );

      // Drafts must NEVER appear in public listings or search.
      expect(await listPublishedTitles(handle.db)).toHaveLength(0);
      expect(await searchPublishedTitles(handle.db, "মুক্ত নদীর")).toHaveLength(0);

      // 4. Negative MFA check: ADMIN without MFA cannot publish.
      await expect(
        publishTitle(handle.db, { actor: adminNoMfa, requestId: "req_4" }, draft.id),
      ).rejects.toThrow(/Multi-factor authentication is required/);

      // 5. Negative Rights Gate: ADMIN with MFA still cannot publish without an approved grant.
      await expect(
        publishTitle(handle.db, { actor: adminMfa, requestId: "req_5" }, draft.id),
      ).rejects.toThrow(/approved rights grant with reviewed evidence is required/);

      // 6. Reviewer A registers a PENDING rights grant for BD only.
      const now = new Date("2026-11-06T12:00:00Z");
      const pendingGrant = await registerRightsGrant(
        handle.db,
        { actor: reviewerA, requestId: "req_6" },
        {
          titleId: draft.id,
          licensorLegalName: "Open Archival Film Trust",
          licensorContactEmail: "rights@archive.example.org",
          licensorCountryCode: "BD",
          basis: "PUBLIC_DOMAIN_VERIFIED",
          documentRef: "DOC-PD-2026-0001",
          evidenceSha256: "a".repeat(64),
          allowedActions: ["METADATA", "ARTWORK"],
          allowedTerritories: ["BD"],
          validFrom: new Date("2026-01-01T00:00:00Z"),
          validUntil: new Date("2028-01-01T00:00:00Z"),
        },
      );

      // Pending grant still cannot publish!
      await expect(
        publishTitle(handle.db, { actor: adminMfa, requestId: "req_7" }, draft.id, { at: now }),
      ).rejects.toThrow(/approved rights grant/);

      // 7. Separation of duties: Reviewer A CANNOT self-approve the grant they submitted!
      await expect(
        approveRightsGrant(
          handle.db,
          { actor: reviewerA, requestId: "req_8" },
          pendingGrant.grantId,
          { at: now },
        ),
      ).rejects.toThrow(/Separation of duties violation/);

      // Distinct Reviewer B (with MFA) approves the grant.
      await approveRightsGrant(
        handle.db,
        { actor: reviewerB, requestId: "req_9" },
        pendingGrant.grantId,
        { at: now },
      );

      // 8. Publication succeeds now that chain-of-title is verified!
      const pub = await publishTitle(
        handle.db,
        { actor: adminMfa, requestId: "req_10" },
        draft.id,
        { at: now },
      );
      expect(pub.status).toBe("PUBLISHED");

      // 9. Honest territorial availability: BD gets catalogue_only (no stream/download falsely promised); US gets region_restricted.
      const bdList = await listPublishedTitles(handle.db, { territoryCode: "BD", at: now });
      expect(bdList).toHaveLength(1);
      expect(bdList[0]?.availability).toEqual({
        streamAllowed: false,
        downloadAllowed: false,
        metadataAllowed: true,
        badgeKind: "catalogue_only",
      });

      const usList = await listPublishedTitles(handle.db, { territoryCode: "US", at: now });
      expect(usList[0]?.availability.badgeKind).toBe("region_restricted");

      // 10. Search works across Bangla script and filmmaker credit name.
      const bnMatches = await searchPublishedTitles(handle.db, "মুক্ত নদীর", {
        territoryCode: "BD",
        at: now,
      });
      expect(bnMatches).toHaveLength(1);
      expect(bnMatches[0]?.localizedTitleBn).toBe("মুক্ত নদীর উপাখ্যান");

      const directorMatches = await searchPublishedTitles(handle.db, "কামাল চৌধুরী", {
        territoryCode: "BD",
        at: now,
      });
      expect(directorMatches).toHaveLength(1);

      // 10b. Multi-dimensional DAL filtering by directorSlug, castSlug, kind, and studioSlug.
      expect(
        await listPublishedTitles(handle.db, {
          territoryCode: "BD",
          directorSlug: "kamal-choudhury-fixture",
          kind: "MOVIE",
          at: now,
        }),
      ).toHaveLength(1);
      expect(
        await listPublishedTitles(handle.db, {
          territoryCode: "BD",
          directorSlug: "unknown-director",
          at: now,
        }),
      ).toHaveLength(0);
      expect(
        await listPublishedTitles(handle.db, {
          territoryCode: "BD",
          kind: "SERIES",
          at: now,
        }),
      ).toHaveLength(0);
      expect(
        await listPublishedTitles(handle.db, {
          territoryCode: "BD",
          castSlug: "kamal-choudhury-fixture",
          at: now,
        }),
      ).toHaveLength(0);

      // 11. IDOR Negative Test: Viewer B cannot view or delete Viewer A's watchlist items.
      await addWatchlistItem(handle.db, { actor: viewerA, requestId: "req_11" }, draft.id);
      expect(
        await listWatchlistItems(handle.db, { actor: viewerA, requestId: "req_12" }, { at: now }),
      ).toHaveLength(1);
      expect(
        await listWatchlistItems(handle.db, { actor: viewerB, requestId: "req_13" }, { at: now }),
      ).toHaveLength(0);
      await removeWatchlistItem(handle.db, { actor: viewerB, requestId: "req_14" }, draft.id);
      expect(
        await listWatchlistItems(handle.db, { actor: viewerA, requestId: "req_15" }, { at: now }),
      ).toHaveLength(1);

      // 12. Emergency Takedown & Legal Hold Kill-Switch removes public access instantaneously.
      const report = await submitContentReport(
        handle.db,
        { actor: null, requestId: "req_16" },
        {
          targetPath: `/movies/${draft.slug}`,
          titleSlug: draft.slug,
          reporterName: "Compliance Officer",
          reporterEmail: "compliance@example.org",
          claimSummary: "Simulated territorial dispute test",
        },
      );
      expect(report.caseNumber).toMatch(/^TKD-/);

      await unpublishTitle(handle.db, { actor: adminMfa, requestId: "req_17" }, draft.id, {
        applyLegalHold: true,
        reason: `Emergency hold for ${report.caseNumber}`,
        at: now,
      });

      expect(await listPublishedTitles(handle.db, { territoryCode: "BD", at: now })).toHaveLength(
        0,
      );
      expect(await getPublishedTitleBySlug(handle.db, draft.slug, { at: now })).toBeNull();
      expect(
        await listWatchlistItems(handle.db, { actor: viewerA, requestId: "req_18" }, { at: now }),
      ).toHaveLength(0);
    } finally {
      await handle.close();
    }
  });
});
