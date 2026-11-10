// @vitest-environment node
import type { DeliveryAction } from "@movie/contracts";
import type { ActorIdentity } from "@movie/domain";
import { describe, expect, it } from "vitest";
import {
  approveRightsGrant,
  collectionItems,
  collections,
  createDraftTitle,
  createTestDatabase,
  genres,
  getPublicCollectionBySlug,
  getPublicGenreBySlug,
  getPublicPersonBySlug,
  listPublicCollections,
  mediaAssets,
  newEntityId,
  people,
  publishTitle,
  registerRightsGrant,
  titleCredits,
  titles,
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

describe("Empirical Challenger: Milestone 2 DAL Discovery & Rights Boundary Stress Suite", () => {
  it("enforces non-existent slug safety, draft title isolation, takedown kill-switch, and territorial badge adaptation", async () => {
    const handle = await createTestDatabase();
    try {
      const editor = await seedActor(handle.db, "ch_editor@movie.test", ["EDITOR"], true);
      const reviewerA = await seedActor(
        handle.db,
        "ch_rev_a@movie.test",
        ["RIGHTS_REVIEWER"],
        true,
      );
      const reviewerB = await seedActor(
        handle.db,
        "ch_rev_b@movie.test",
        ["RIGHTS_REVIEWER"],
        true,
      );
      const adminMfa = await seedActor(handle.db, "ch_admin@movie.test", ["ADMIN"], true);

      // ==========================================
      // 1. Non-Existent Slugs Edge Cases
      // ==========================================
      const nonExistentPerson = await getPublicPersonBySlug(
        handle.db,
        "completely-unknown-filmmaker-slug",
      );
      expect(nonExistentPerson).toBeNull();

      const nonExistentCollection = await getPublicCollectionBySlug(
        handle.db,
        "completely-unknown-collection-slug",
      );
      expect(nonExistentCollection).toBeNull();

      const nonExistentGenre = await getPublicGenreBySlug(
        handle.db,
        "completely-unknown-genre-slug",
      );
      expect(nonExistentGenre).toBeNull();

      // Person exists but has 0 credits -> returns { person, titles: [] }
      const solitaryPersonId = newEntityId("prs");
      await handle.db.insert(people).values({
        id: solitaryPersonId,
        slug: "solitary-writer-zero-credits",
        nameEn: "Solitary Writer",
      });
      const solitaryRes = await getPublicPersonBySlug(handle.db, "solitary-writer-zero-credits");
      expect(solitaryRes).not.toBeNull();
      expect(solitaryRes?.person.slug).toBe("solitary-writer-zero-credits");
      expect(solitaryRes?.titles).toEqual([]);

      // Collection exists but isPublished: false -> returns null cleanly
      const draftColId = newEntityId("col");
      await handle.db.insert(collections).values({
        id: draftColId,
        slug: "secret-internal-draft-collection",
        titleEn: "Draft Internal Collection",
        isPublished: false,
      });
      const draftColRes = await getPublicCollectionBySlug(
        handle.db,
        "secret-internal-draft-collection",
      );
      expect(draftColRes).toBeNull();

      const publicCollections = await listPublicCollections(handle.db);
      expect(publicCollections.some((c) => c.slug === "secret-internal-draft-collection")).toBe(
        false,
      );

      // ==========================================
      // 2. Unapproved / Draft Titles Leakage Prevention
      // ==========================================
      const draftDirectorSlug = "draft-leak-director";
      const draftDirectorId = newEntityId("prs");
      await handle.db.insert(people).values({
        id: draftDirectorId,
        slug: draftDirectorSlug,
        nameEn: "Draft Director",
      });

      const draftGenreSlug = "experimental-noir";
      const draftGenreId = newEntityId("gnr");
      await handle.db.insert(genres).values({
        id: draftGenreId,
        slug: draftGenreSlug,
        nameEn: "Experimental Noir",
      });

      const draftCollectionSlug = "noir-experimental-vault";
      const draftCollectionId = newEntityId("col");
      await handle.db.insert(collections).values({
        id: draftCollectionId,
        slug: draftCollectionSlug,
        titleEn: "Experimental Noir Vault",
        isPublished: true,
      });

      const draftTitle = await createDraftTitle(
        handle.db,
        { actor: editor, requestId: "req_draft_leak_test" },
        {
          slug: "unapproved-secret-film",
          originalTitle: "Unapproved Secret Film",
          originalLanguage: "bn",
          releaseYear: 2025,
          runtimeMinutes: 98,
          maturityRating: "PG13",
          translations: [
            {
              locale: "en",
              localizedTitle: "Unapproved Secret Film",
              synopsis: "Classified pre-release footage.",
            },
          ],
          genreSlugs: [draftGenreSlug],
          credits: [
            {
              personSlug: draftDirectorSlug,
              nameEn: "Draft Director",
              department: "DIRECTOR",
              billingOrder: 1,
            },
          ],
          attribution: {
            provider: "OPERATOR_ORIGINAL",
            attributionText: "Operator internal preview fixture",
            licenseConfirmed: true,
          },
        },
      );

      await handle.db.insert(collectionItems).values({
        collectionId: draftCollectionId,
        titleId: draftTitle.id,
        sortOrder: 1,
      });

      // Assert draft title NEVER leaks into person, collection, or genre responses
      const personRes = await getPublicPersonBySlug(handle.db, draftDirectorSlug);
      expect(personRes).not.toBeNull();
      expect(personRes?.titles).toHaveLength(0);

      const colRes = await getPublicCollectionBySlug(handle.db, draftCollectionSlug);
      expect(colRes).not.toBeNull();
      expect(colRes?.titles).toHaveLength(0);

      const genreRes = await getPublicGenreBySlug(handle.db, draftGenreSlug);
      expect(genreRes).not.toBeNull();
      expect(genreRes?.titles).toHaveLength(0);

      // ==========================================
      // 3. Takedown-Held and Revoked Titles Leakage Prevention
      // ==========================================
      const tkdDirectorSlug = "takedown-test-director";
      const tkdDirectorId = newEntityId("prs");
      await handle.db.insert(people).values({
        id: tkdDirectorId,
        slug: tkdDirectorSlug,
        nameEn: "Takedown Director",
      });

      const tkdColSlug = "takedown-test-collection";
      const tkdColId = newEntityId("col");
      await handle.db.insert(collections).values({
        id: tkdColId,
        slug: tkdColSlug,
        titleEn: "Takedown Showcase",
        isPublished: true,
      });

      const titleToTakedown = await createDraftTitle(
        handle.db,
        { actor: editor, requestId: "req_tkd_draft" },
        {
          slug: "revocation-target-film",
          originalTitle: "Revocation Target Film",
          originalLanguage: "en",
          releaseYear: 2024,
          runtimeMinutes: 110,
          maturityRating: "PG",
          translations: [
            {
              locale: "en",
              localizedTitle: "Revocation Target Film",
              synopsis: "Published title that will be revoked.",
            },
          ],
          credits: [
            {
              personSlug: tkdDirectorSlug,
              nameEn: "Takedown Director",
              department: "DIRECTOR",
            },
          ],
          attribution: {
            provider: "PUBLIC_DOMAIN_RECORD",
            attributionText: "Archival fixture",
            licenseConfirmed: true,
          },
        },
      );

      await handle.db.insert(collectionItems).values({
        collectionId: tkdColId,
        titleId: titleToTakedown.id,
        sortOrder: 1,
      });

      const now = new Date("2026-11-06T12:00:00Z");
      const tkdGrant = await registerRightsGrant(
        handle.db,
        { actor: reviewerA, requestId: "req_tkd_grant" },
        {
          titleId: titleToTakedown.id,
          licensorLegalName: "Film Trust",
          licensorContactEmail: "trust@example.org",
          basis: "PUBLIC_DOMAIN_VERIFIED",
          documentRef: "DOC-TKD-1",
          evidenceSha256: "c".repeat(64),
          allowedActions: ["STREAM", "METADATA"],
          allowedTerritories: ["BD", "US", "GLOBAL"],
          validFrom: new Date("2026-01-01"),
          validUntil: new Date("2030-01-01"),
        },
      );

      await approveRightsGrant(
        handle.db,
        { actor: reviewerB, requestId: "req_tkd_approve" },
        tkdGrant.grantId,
        { at: now },
      );

      await publishTitle(
        handle.db,
        { actor: adminMfa, requestId: "req_tkd_pub" },
        titleToTakedown.id,
        { at: now },
      );

      // Verify title is visible before takedown
      const personBefore = await getPublicPersonBySlug(handle.db, tkdDirectorSlug, { at: now });
      expect(personBefore?.titles).toHaveLength(1);
      expect(personBefore?.titles[0]?.slug).toBe("revocation-target-film");

      const colBefore = await getPublicCollectionBySlug(handle.db, tkdColSlug, { at: now });
      expect(colBefore?.titles).toHaveLength(1);

      // Apply emergency takedown
      await unpublishTitle(
        handle.db,
        { actor: adminMfa, requestId: "req_tkd_unpub" },
        titleToTakedown.id,
        {
          applyLegalHold: true,
          reason: "DMCA takedown notice received and legal hold enforced",
          at: now,
        },
      );

      // Verify title is immediately absent from discovery responses
      const personAfter = await getPublicPersonBySlug(handle.db, tkdDirectorSlug, { at: now });
      expect(personAfter?.titles).toHaveLength(0);

      const colAfter = await getPublicCollectionBySlug(handle.db, tkdColSlug, { at: now });
      expect(colAfter?.titles).toHaveLength(0);

      // ==========================================
      // 4. Territorial Restrictions & Badge Adaptation
      // ==========================================
      const terrDirectorSlug = "territorial-director";
      const terrDirectorId = newEntityId("prs");
      await handle.db.insert(people).values({
        id: terrDirectorId,
        slug: terrDirectorSlug,
        nameEn: "Territorial Director",
      });

      const terrColSlug = "territorial-collection";
      const terrColId = newEntityId("col");
      await handle.db.insert(collections).values({
        id: terrColId,
        slug: terrColSlug,
        titleEn: "Territorial Rights Collection",
        isPublished: true,
      });

      // Title A: BD exclusive
      const titleBdOnly = await createDraftTitle(
        handle.db,
        { actor: editor, requestId: "req_bd_only" },
        {
          slug: "bd-exclusive-film",
          originalTitle: "BD Exclusive Film",
          originalLanguage: "bn",
          releaseYear: 2024,
          runtimeMinutes: 105,
          maturityRating: "U",
          translations: [
            { locale: "en", localizedTitle: "BD Exclusive Film", synopsis: "Exclusive to BD." },
          ],
          credits: [
            {
              personSlug: terrDirectorSlug,
              nameEn: "Territorial Director",
              department: "DIRECTOR",
            },
          ],
          attribution: {
            provider: "LICENSED_PARTNER",
            attributionText: "BD Licensor",
            licenseConfirmed: true,
          },
        },
      );

      await handle.db.insert(collectionItems).values({
        collectionId: terrColId,
        titleId: titleBdOnly.id,
        sortOrder: 1,
      });

      const assetBdId = newEntityId("ast");
      await handle.db.insert(mediaAssets).values({
        id: assetBdId,
        titleId: titleBdOnly.id,
        kind: "FEATURE",
        lifecycleState: "PUBLISHED",
        drmRequired: false,
        containerFormat: "mp4",
        durationSeconds: 6300,
        sha256Checksum: "d".repeat(64),
        checksumVerified: true,
      });

      const grantBd = await registerRightsGrant(
        handle.db,
        { actor: reviewerA, requestId: "req_grant_bd" },
        {
          titleId: titleBdOnly.id,
          assetId: assetBdId,
          licensorLegalName: "Dhaka Pictures",
          licensorContactEmail: "bd@dhakapix.test",
          licensorCountryCode: "BD",
          basis: "LICENSED",
          documentRef: "DOC-BD-ONLY",
          evidenceSha256: "d".repeat(64),
          allowedActions: ["STREAM", "DOWNLOAD", "METADATA"] as DeliveryAction[],
          allowedTerritories: ["BD"],
          validFrom: new Date("2026-01-01"),
          validUntil: new Date("2030-01-01"),
        },
      );

      await approveRightsGrant(
        handle.db,
        { actor: reviewerB, requestId: "req_appr_bd" },
        grantBd.grantId,
        { at: now },
      );

      // Add companion title-level METADATA grant for BD
      const grantBdMeta = await registerRightsGrant(
        handle.db,
        { actor: reviewerA, requestId: "req_grant_bd_meta" },
        {
          titleId: titleBdOnly.id,
          licensorLegalName: "Dhaka Pictures",
          licensorContactEmail: "bd@dhakapix.test",
          licensorCountryCode: "BD",
          basis: "LICENSED",
          documentRef: "DOC-BD-META",
          evidenceSha256: "d".repeat(64),
          allowedActions: ["METADATA", "ARTWORK"] as DeliveryAction[],
          allowedTerritories: ["BD"],
          validFrom: new Date("2026-01-01"),
          validUntil: new Date("2030-01-01"),
        },
      );
      await approveRightsGrant(
        handle.db,
        { actor: reviewerB, requestId: "req_appr_bd_meta" },
        grantBdMeta.grantId,
        { at: now },
      );

      await publishTitle(handle.db, { actor: adminMfa, requestId: "req_pub_bd" }, titleBdOnly.id, {
        at: now,
      });

      // Title B: BD + US allowed, DE excluded
      const titleBdUs = await createDraftTitle(
        handle.db,
        { actor: editor, requestId: "req_bd_us" },
        {
          slug: "transatlantic-coproduction",
          originalTitle: "Transatlantic Co-Production",
          originalLanguage: "en",
          releaseYear: 2025,
          runtimeMinutes: 120,
          maturityRating: "PG13",
          translations: [
            {
              locale: "en",
              localizedTitle: "Transatlantic Co-Production",
              synopsis: "Cleared in BD and US.",
            },
          ],
          credits: [
            {
              personSlug: terrDirectorSlug,
              nameEn: "Territorial Director",
              department: "DIRECTOR",
            },
          ],
          attribution: {
            provider: "LICENSED_PARTNER",
            attributionText: "Global Co-Pro",
            licenseConfirmed: true,
          },
        },
      );

      await handle.db.insert(collectionItems).values({
        collectionId: terrColId,
        titleId: titleBdUs.id,
        sortOrder: 2,
      });

      const assetBdUsId = newEntityId("ast");
      await handle.db.insert(mediaAssets).values({
        id: assetBdUsId,
        titleId: titleBdUs.id,
        kind: "FEATURE",
        lifecycleState: "PUBLISHED",
        drmRequired: false,
        containerFormat: "mp4",
        durationSeconds: 7200,
        sha256Checksum: "e".repeat(64),
        checksumVerified: true,
      });

      const grantBdUs = await registerRightsGrant(
        handle.db,
        { actor: reviewerA, requestId: "req_grant_bd_us" },
        {
          titleId: titleBdUs.id,
          assetId: assetBdUsId,
          licensorLegalName: "Alliance Media",
          licensorContactEmail: "alliance@test.local",
          basis: "LICENSED",
          documentRef: "DOC-BD-US-1",
          evidenceSha256: "e".repeat(64),
          allowedActions: ["STREAM", "DOWNLOAD", "METADATA"] as DeliveryAction[],
          allowedTerritories: ["BD", "US"],
          excludedTerritories: ["DE"],
          validFrom: new Date("2026-01-01"),
          validUntil: new Date("2030-01-01"),
        },
      );

      await approveRightsGrant(
        handle.db,
        { actor: reviewerB, requestId: "req_appr_bd_us" },
        grantBdUs.grantId,
        { at: now },
      );

      // Add companion title-level METADATA grant for BD + US (DE excluded)
      const grantBdUsMeta = await registerRightsGrant(
        handle.db,
        { actor: reviewerA, requestId: "req_grant_bd_us_meta" },
        {
          titleId: titleBdUs.id,
          licensorLegalName: "Alliance Media",
          licensorContactEmail: "alliance@test.local",
          basis: "LICENSED",
          documentRef: "DOC-BD-US-META",
          evidenceSha256: "e".repeat(64),
          allowedActions: ["METADATA", "ARTWORK"] as DeliveryAction[],
          allowedTerritories: ["BD", "US"],
          excludedTerritories: ["DE"],
          validFrom: new Date("2026-01-01"),
          validUntil: new Date("2030-01-01"),
        },
      );
      await approveRightsGrant(
        handle.db,
        { actor: reviewerB, requestId: "req_appr_bd_us_meta" },
        grantBdUsMeta.grantId,
        { at: now },
      );

      await publishTitle(handle.db, { actor: adminMfa, requestId: "req_pub_bd_us" }, titleBdUs.id, {
        at: now,
      });

      // Verify BD viewer: both have streamAllowed=true, badgeKind="stream_allowed"
      const resBd = await getPublicCollectionBySlug(handle.db, terrColSlug, {
        territoryCode: "BD",
        at: now,
      });
      expect(resBd?.titles).toHaveLength(2);

      const bdExclusiveInBd = resBd?.titles.find((t) => t.slug === "bd-exclusive-film");
      expect(bdExclusiveInBd?.availability.streamAllowed).toBe(true);
      expect(bdExclusiveInBd?.availability.downloadAllowed).toBe(true);
      expect(bdExclusiveInBd?.availability.badgeKind).toBe("stream_allowed");

      const bdUsInBd = resBd?.titles.find((t) => t.slug === "transatlantic-coproduction");
      expect(bdUsInBd?.availability.streamAllowed).toBe(true);
      expect(bdUsInBd?.availability.downloadAllowed).toBe(true);
      expect(bdUsInBd?.availability.badgeKind).toBe("stream_allowed");

      // Verify US viewer: BD-exclusive is region_restricted, Transatlantic is stream_allowed
      const resUs = await getPublicCollectionBySlug(handle.db, terrColSlug, {
        territoryCode: "US",
        at: now,
      });
      expect(resUs?.titles).toHaveLength(2);

      const bdExclusiveInUs = resUs?.titles.find((t) => t.slug === "bd-exclusive-film");
      expect(bdExclusiveInUs?.availability.streamAllowed).toBe(false);
      expect(bdExclusiveInUs?.availability.downloadAllowed).toBe(false);
      expect(bdExclusiveInUs?.availability.badgeKind).toBe("region_restricted");

      const bdUsInUs = resUs?.titles.find((t) => t.slug === "transatlantic-coproduction");
      expect(bdUsInUs?.availability.streamAllowed).toBe(true);
      expect(bdUsInUs?.availability.downloadAllowed).toBe(true);
      expect(bdUsInUs?.availability.badgeKind).toBe("stream_allowed");

      // Verify DE viewer: both are region_restricted
      const resDe = await getPublicCollectionBySlug(handle.db, terrColSlug, {
        territoryCode: "DE",
        at: now,
      });
      expect(resDe?.titles).toHaveLength(2);

      const bdExclusiveInDe = resDe?.titles.find((t) => t.slug === "bd-exclusive-film");
      expect(bdExclusiveInDe?.availability.streamAllowed).toBe(false);
      expect(bdExclusiveInDe?.availability.downloadAllowed).toBe(false);
      expect(bdExclusiveInDe?.availability.badgeKind).toBe("region_restricted");

      const bdUsInDe = resDe?.titles.find((t) => t.slug === "transatlantic-coproduction");
      expect(bdUsInDe?.availability.streamAllowed).toBe(false);
      expect(bdUsInDe?.availability.downloadAllowed).toBe(false);
      expect(bdUsInDe?.availability.badgeKind).toBe("region_restricted");
    } finally {
      await handle.close();
    }
  }, 120_000);
});
