import crypto from "node:crypto";
import type {
  CatalogueSort,
  DeliveryAction,
  EntitlementTier,
  MaturityRating,
  ResolutionTier,
  Role,
  TitleKind,
  TitleStatus,
} from "@movie/contracts";
import {
  type ActorIdentity,
  AuthorizationError,
  assertPermission,
  canPublishTitleWithRights,
  evaluateRights,
  type RightsGrantRecord,
} from "@movie/domain";
import { and, asc, desc, eq, gte, ilike, inArray, isNull, lte, or, sql } from "drizzle-orm";
import type { MovieDatabase } from "./client.ts";
import {
  auditEvents,
  collectionItems,
  collections,
  genres,
  mediaAssets,
  metadataSources,
  people,
  playbackSessions,
  rightsEvidence,
  rightsGrants,
  rightsHolders,
  takedownCases,
  titleCredits,
  titleGenres,
  titles,
  titleTranslations,
  watchlistItems,
} from "./schema/index.ts";

export class RightsGateError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "RightsGateError";
    this.code = code;
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export function newEntityId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

export interface AuditContext {
  actor: ActorIdentity | null;
  requestId: string;
}

export async function recordAuditEvent(
  db: MovieDatabase,
  input: {
    actor: ActorIdentity | null;
    action: string;
    targetType: string;
    targetId: string;
    requestId: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await db.insert(auditEvents).values({
    id: newEntityId("aud"),
    actorUserId: input.actor?.userId ?? null,
    actorRoles: input.actor ? [...input.actor.roles] : [],
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    requestId: input.requestId,
    metadata: input.metadata ?? {},
  });
}

export interface CreateDraftTitleInput {
  slug: string;
  kind?: TitleKind;
  originalTitle: string;
  originalLanguage: string;
  releaseYear: number;
  runtimeMinutes: number;
  maturityRating: MaturityRating;
  isDevelopmentFixture?: boolean;
  translations: Array<{
    locale: string;
    localizedTitle: string;
    tagline?: string;
    synopsis: string;
  }>;
  genreSlugs?: string[];
  credits?: Array<{
    personSlug: string;
    nameEn: string;
    nameBn?: string;
    department: "DIRECTOR" | "WRITER" | "ACTOR" | "PRODUCER" | "COMPOSER";
    characterName?: string;
    billingOrder?: number;
  }>;
  attribution: {
    provider: "OPERATOR_ORIGINAL" | "PUBLIC_DOMAIN_RECORD" | "LICENSED_PARTNER" | "TMDB";
    externalId?: string;
    attributionText: string;
    licenseConfirmed: boolean;
  };
}

export async function createDraftTitle(
  db: MovieDatabase,
  ctx: AuditContext,
  input: CreateDraftTitleInput,
) {
  assertPermission(ctx.actor, "catalogue:create");
  const actor = ctx.actor!;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    throw new Error("Slug must be lowercase kebab-case alphanumeric");
  }
  if (input.translations.length === 0) {
    throw new Error("At least one localized translation is required");
  }
  if (input.attribution.provider === "TMDB" && !input.attribution.licenseConfirmed) {
    throw new RightsGateError(
      "TMDB_LICENSE_UNCONFIRMED",
      "TMDb metadata cannot be persisted for commercial catalogue entries without confirmed license",
    );
  }

  const titleId = newEntityId("ttl");

  await db.transaction(async (tx) => {
    const txDb = tx as unknown as MovieDatabase;
    await txDb.insert(titles).values({
      id: titleId,
      slug: input.slug,
      kind: input.kind ?? "MOVIE",
      status: "DRAFT",
      originalTitle: input.originalTitle,
      originalLanguage: input.originalLanguage,
      releaseYear: input.releaseYear,
      runtimeMinutes: input.runtimeMinutes,
      maturityRating: input.maturityRating,
      legalHold: false,
      isDevelopmentFixture: Boolean(input.isDevelopmentFixture),
      createdByUserId: actor.userId,
    });

    for (const tr of input.translations) {
      await txDb.insert(titleTranslations).values({
        id: newEntityId("ttr"),
        titleId,
        locale: tr.locale,
        localizedTitle: tr.localizedTitle,
        tagline: tr.tagline ?? null,
        synopsis: tr.synopsis,
      });
    }

    await txDb.insert(metadataSources).values({
      id: newEntityId("src"),
      titleId,
      provider: input.attribution.provider,
      externalId: input.attribution.externalId ?? null,
      attributionText: input.attribution.attributionText,
      licenseConfirmed: input.attribution.licenseConfirmed,
    });

    if (input.genreSlugs && input.genreSlugs.length > 0) {
      const matchingGenres = await txDb
        .select()
        .from(genres)
        .where(inArray(genres.slug, input.genreSlugs));
      for (const g of matchingGenres) {
        await txDb.insert(titleGenres).values({ titleId, genreId: g.id });
      }
    }

    if (input.credits && input.credits.length > 0) {
      for (const credit of input.credits) {
        const existingPerson = await txDb
          .select()
          .from(people)
          .where(eq(people.slug, credit.personSlug))
          .limit(1);
        let personId = existingPerson[0]?.id;
        if (!personId) {
          personId = newEntityId("prs");
          await txDb.insert(people).values({
            id: personId,
            slug: credit.personSlug,
            nameEn: credit.nameEn,
            nameBn: credit.nameBn ?? null,
          });
        }
        await txDb.insert(titleCredits).values({
          id: newEntityId("crd"),
          titleId,
          personId,
          department: credit.department,
          characterName: credit.characterName ?? null,
          billingOrder: credit.billingOrder ?? 0,
        });
      }
    }

    await recordAuditEvent(txDb, {
      actor,
      action: "catalogue.title.create_draft",
      targetType: "title",
      targetId: titleId,
      requestId: ctx.requestId,
      metadata: { slug: input.slug, status: "DRAFT" },
    });
  });

  return { id: titleId, slug: input.slug, status: "DRAFT" as TitleStatus };
}

export interface RegisterRightsGrantInput {
  titleId: string;
  assetId?: string | null;
  licensorLegalName: string;
  licensorContactEmail: string;
  licensorCountryCode?: string;
  basis: "OWNED" | "LICENSED" | "PUBLIC_DOMAIN_VERIFIED";
  documentRef: string;
  evidenceSha256: string;
  allowedActions: DeliveryAction[];
  allowedTerritories: string[];
  excludedTerritories?: string[];
  validFrom: Date;
  validUntil: Date;
  requiredEntitlement?: EntitlementTier;
  maxResolution?: ResolutionTier;
  requiresDrm?: boolean;
  attributionText?: string;
}

export async function registerRightsGrant(
  db: MovieDatabase,
  ctx: AuditContext,
  input: RegisterRightsGrantInput,
) {
  assertPermission(ctx.actor, "rights:create");
  const actor = ctx.actor!;

  if (!/^[a-f0-9]{64}$/i.test(input.evidenceSha256)) {
    throw new RightsGateError(
      "INVALID_EVIDENCE_HASH",
      "Rights evidence must carry a 64-character hexadecimal SHA-256 digest",
    );
  }
  if (!(input.validFrom.getTime() < input.validUntil.getTime())) {
    throw new RightsGateError(
      "INVALID_RIGHTS_WINDOW",
      "validFrom must precede validUntil on a rights grant",
    );
  }

  const holderId = newEntityId("rhd");
  const evidenceId = newEntityId("rev");
  const grantId = newEntityId("rgr");

  await db.transaction(async (tx) => {
    const txDb = tx as unknown as MovieDatabase;

    const existingTitle = await txDb
      .select({ id: titles.id })
      .from(titles)
      .where(eq(titles.id, input.titleId))
      .limit(1);
    if (!existingTitle[0]) {
      throw new NotFoundError(`Title not found: ${input.titleId}`);
    }

    await txDb.insert(rightsHolders).values({
      id: holderId,
      legalName: input.licensorLegalName,
      contactEmail: input.licensorContactEmail,
      countryCode: (input.licensorCountryCode ?? "BD").toUpperCase(),
    });

    await txDb.insert(rightsEvidence).values({
      id: evidenceId,
      rightsHolderId: holderId,
      titleId: input.titleId,
      basis: input.basis,
      documentRef: input.documentRef,
      evidenceSha256: input.evidenceSha256.toLowerCase(),
      submittedByUserId: actor.userId,
    });

    await txDb.insert(rightsGrants).values({
      id: grantId,
      titleId: input.titleId,
      assetId: input.assetId ?? null,
      rightsHolderId: holderId,
      evidenceId,
      status: "PENDING",
      allowedActions: input.allowedActions,
      allowedTerritories: input.allowedTerritories.map((t) => t.toUpperCase()),
      excludedTerritories: (input.excludedTerritories ?? []).map((t) => t.toUpperCase()),
      validFrom: input.validFrom,
      validUntil: input.validUntil,
      requiredEntitlement: input.requiredEntitlement ?? "FREE",
      maxResolution: input.maxResolution ?? "1080p",
      requiresDrm: Boolean(input.requiresDrm),
      attributionText: input.attributionText ?? null,
      createdByUserId: actor.userId,
    });

    await recordAuditEvent(txDb, {
      actor,
      action: "rights.grant.register_pending",
      targetType: "rights_grant",
      targetId: grantId,
      requestId: ctx.requestId,
      metadata: {
        titleId: input.titleId,
        basis: input.basis,
        territories: input.allowedTerritories,
        actions: input.allowedActions,
      },
    });
  });

  return { grantId, evidenceId, rightsHolderId: holderId, status: "PENDING" as const };
}

export async function approveRightsGrant(
  db: MovieDatabase,
  ctx: AuditContext,
  grantId: string,
  options?: { at?: Date },
) {
  assertPermission(ctx.actor, "rights:approve");
  const actor = ctx.actor!;
  const now = options?.at ?? new Date();

  await db.transaction(async (tx) => {
    const txDb = tx as unknown as MovieDatabase;
    const rows = await txDb
      .select()
      .from(rightsGrants)
      .where(eq(rightsGrants.id, grantId))
      .limit(1);
    const grant = rows[0];
    if (!grant) {
      throw new NotFoundError(`Rights grant not found: ${grantId}`);
    }

    // Separation of duties: submitter cannot self-approve their own rights grant.
    if (grant.createdByUserId === actor.userId) {
      throw new AuthorizationError(
        "FORBIDDEN",
        "Separation of duties violation: the creator of a rights grant cannot approve it",
      );
    }

    if (grant.status !== "PENDING") {
      throw new RightsGateError(
        "GRANT_NOT_PENDING",
        `Cannot approve rights grant in state ${grant.status}`,
      );
    }

    await txDb
      .update(rightsEvidence)
      .set({
        reviewedByUserId: actor.userId,
        reviewedAt: now,
      })
      .where(eq(rightsEvidence.id, grant.evidenceId));

    await txDb
      .update(rightsGrants)
      .set({
        status: "APPROVED",
        approvedByUserId: actor.userId,
        approvedAt: now,
        updatedAt: now,
      })
      .where(eq(rightsGrants.id, grantId));

    await recordAuditEvent(txDb, {
      actor,
      action: "rights.grant.approve",
      targetType: "rights_grant",
      targetId: grantId,
      requestId: ctx.requestId,
      metadata: { titleId: grant.titleId, evidenceId: grant.evidenceId },
    });
  });

  return { grantId, status: "APPROVED" as const };
}

export async function loadTitleGrantRecords(
  db: MovieDatabase,
  titleId: string,
): Promise<RightsGrantRecord[]> {
  const grantRows = await db.select().from(rightsGrants).where(eq(rightsGrants.titleId, titleId));

  if (grantRows.length === 0) {
    return [];
  }

  const evidenceIds = [...new Set(grantRows.map((g) => g.evidenceId))];
  const evidenceRows = await db
    .select()
    .from(rightsEvidence)
    .where(inArray(rightsEvidence.id, evidenceIds));
  const evidenceById = new Map(evidenceRows.map((ev) => [ev.id, ev]));

  return grantRows.map((g) => {
    const ev = evidenceById.get(g.evidenceId);
    return {
      id: g.id,
      titleId: g.titleId,
      assetId: g.assetId,
      status: g.status,
      allowedActions: g.allowedActions,
      allowedTerritories: g.allowedTerritories,
      excludedTerritories: g.excludedTerritories,
      validFrom: g.validFrom,
      validUntil: g.validUntil,
      requiredEntitlement: g.requiredEntitlement,
      maxResolution: g.maxResolution,
      requiresDrm: g.requiresDrm,
      attributionText: g.attributionText,
      evidence: ev
        ? [
            {
              id: ev.id,
              evidenceSha256: ev.evidenceSha256,
              reviewedBy: ev.reviewedByUserId,
              reviewedAt: ev.reviewedAt,
            },
          ]
        : [],
    };
  });
}

export async function publishTitle(
  db: MovieDatabase,
  ctx: AuditContext,
  titleId: string,
  options?: { at?: Date },
) {
  assertPermission(ctx.actor, "catalogue:publish");
  const actor = ctx.actor!;
  const now = options?.at ?? new Date();

  const titleRows = await db.select().from(titles).where(eq(titles.id, titleId)).limit(1);
  const title = titleRows[0];
  if (!title) {
    throw new NotFoundError(`Title not found: ${titleId}`);
  }

  const sources = await db
    .select()
    .from(metadataSources)
    .where(eq(metadataSources.titleId, titleId));
  const attributionSatisfied =
    sources.length > 0 &&
    sources.every((s) => s.attributionText.trim().length > 0 && s.licenseConfirmed);

  const openHoldCases = await db
    .select({ id: takedownCases.id })
    .from(takedownCases)
    .where(and(eq(takedownCases.titleId, titleId), eq(takedownCases.legalHoldApplied, true)))
    .limit(1);

  const grants = await loadTitleGrantRecords(db, titleId);
  const check = canPublishTitleWithRights({
    titleId,
    at: now,
    takedownActive: title.legalHold || title.status === "TAKEDOWN_HOLD" || openHoldCases.length > 0,
    attributionSatisfied,
    grants,
  });

  if (!check.publishable) {
    throw new RightsGateError("PUBLICATION_RIGHTS_GATE_BLOCKED", check.reason);
  }

  await db.transaction(async (tx) => {
    const txDb = tx as unknown as MovieDatabase;
    await txDb
      .update(titles)
      .set({
        status: "PUBLISHED",
        publishedAt: now,
        updatedAt: now,
      })
      .where(eq(titles.id, titleId));

    await recordAuditEvent(txDb, {
      actor,
      action: "catalogue.title.publish",
      targetType: "title",
      targetId: titleId,
      requestId: ctx.requestId,
      metadata: { grantIds: check.grantIds },
    });
  });

  return { titleId, status: "PUBLISHED" as TitleStatus, grantIds: check.grantIds };
}

export async function unpublishTitle(
  db: MovieDatabase,
  ctx: AuditContext,
  titleId: string,
  options: { applyLegalHold: boolean; reason: string; at?: Date },
) {
  assertPermission(ctx.actor, "catalogue:unpublish");
  const actor = ctx.actor!;
  const now = options.at ?? new Date();
  const nextStatus: TitleStatus = options.applyLegalHold ? "TAKEDOWN_HOLD" : "UNPUBLISHED";

  await db.transaction(async (tx) => {
    const txDb = tx as unknown as MovieDatabase;
    const rows = await txDb.select().from(titles).where(eq(titles.id, titleId)).limit(1);
    if (!rows[0]) {
      throw new NotFoundError(`Title not found: ${titleId}`);
    }

    await txDb
      .update(titles)
      .set({
        status: nextStatus,
        legalHold: options.applyLegalHold ? true : rows[0].legalHold,
        updatedAt: now,
      })
      .where(eq(titles.id, titleId));

    if (options.applyLegalHold) {
      await txDb
        .update(mediaAssets)
        .set({ lifecycleState: "TAKEDOWN_HOLD", updatedAt: now })
        .where(eq(mediaAssets.titleId, titleId));

      await txDb
        .update(playbackSessions)
        .set({ revokedAt: now })
        .where(and(eq(playbackSessions.titleId, titleId), isNull(playbackSessions.revokedAt)));
    }

    await recordAuditEvent(txDb, {
      actor,
      action: options.applyLegalHold
        ? "catalogue.title.emergency_legal_hold"
        : "catalogue.title.unpublish",
      targetType: "title",
      targetId: titleId,
      requestId: ctx.requestId,
      metadata: { reason: options.reason, status: nextStatus },
    });
  });

  return { titleId, status: nextStatus };
}

function slugifyStudioLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractStudioFromAttribution(
  externalId: string | null | undefined,
  attributionText: string | null | undefined,
): { studioSlug?: string; studioName?: string } {
  const rawName = attributionText?.split(/[—–|-]/)[0]?.trim();
  const studioName = rawName && rawName.length >= 2 ? rawName : undefined;
  if (externalId && externalId.startsWith("studio:")) {
    const slug = slugifyStudioLabel(externalId.slice("studio:".length));
    return {
      studioSlug: slug || (studioName ? slugifyStudioLabel(studioName) : undefined),
      studioName,
    };
  }
  return {
    studioSlug: studioName ? slugifyStudioLabel(studioName) : undefined,
    studioName,
  };
}

export interface PublicTitleSummary {
  id: string;
  slug: string;
  kind: TitleKind;
  featureAssetId: string | null;
  originalTitle: string;
  originalLanguage: string;
  releaseYear: number;
  runtimeMinutes: number;
  maturityRating: MaturityRating;
  isDevelopmentFixture: boolean;
  localizedTitleEn: string;
  localizedTitleBn: string | null;
  synopsisEn: string;
  synopsisBn: string | null;
  genreSlugs?: string[];
  directorSlugs?: string[];
  castSlugs?: string[];
  collectionSlugs?: string[];
  studioName?: string;
  studioSlug?: string;
  availability: {
    streamAllowed: boolean;
    downloadAllowed: boolean;
    metadataAllowed: boolean;
    badgeKind:
      | "stream_allowed"
      | "download_allowed"
      | "catalogue_only"
      | "region_restricted"
      | "rights_pending";
  };
}

async function hydratePublicTitleSummaries(
  db: MovieDatabase,
  titleRows: Array<typeof titles.$inferSelect>,
  territoryCode: string,
  at: Date,
): Promise<PublicTitleSummary[]> {
  if (titleRows.length === 0) {
    return [];
  }

  const ids = titleRows.map((t) => t.id);
  const translations = await db
    .select()
    .from(titleTranslations)
    .where(inArray(titleTranslations.titleId, ids));
  const assets = await db
    .select()
    .from(mediaAssets)
    .where(and(inArray(mediaAssets.titleId, ids), eq(mediaAssets.kind, "FEATURE")));
  const genreJoins = await db
    .select({
      titleId: titleGenres.titleId,
      slug: genres.slug,
    })
    .from(titleGenres)
    .innerJoin(genres, eq(titleGenres.genreId, genres.id))
    .where(inArray(titleGenres.titleId, ids));
  const creditJoins = await db
    .select({
      titleId: titleCredits.titleId,
      department: titleCredits.department,
      personSlug: people.slug,
      billingOrder: titleCredits.billingOrder,
    })
    .from(titleCredits)
    .innerJoin(people, eq(titleCredits.personId, people.id))
    .where(inArray(titleCredits.titleId, ids))
    .orderBy(titleCredits.billingOrder);
  const collectionJoins = await db
    .select({
      titleId: collectionItems.titleId,
      slug: collections.slug,
    })
    .from(collectionItems)
    .innerJoin(collections, eq(collectionItems.collectionId, collections.id))
    .where(and(inArray(collectionItems.titleId, ids), eq(collections.isPublished, true)));
  const sourceRows = await db
    .select({
      titleId: metadataSources.titleId,
      externalId: metadataSources.externalId,
      attributionText: metadataSources.attributionText,
    })
    .from(metadataSources)
    .where(inArray(metadataSources.titleId, ids));

  const summaries: PublicTitleSummary[] = [];
  for (const row of titleRows) {
    if (row.legalHold || row.status !== "PUBLISHED") {
      continue;
    }

    const rowTranslations = translations.filter((t) => t.titleId === row.id);
    const enTr = rowTranslations.find((t) => t.locale === "en") ?? rowTranslations[0];
    const titleFeatureAssets = assets.filter((a) => a.titleId === row.id);
    const featureAsset =
      titleFeatureAssets.find((a) => a.lifecycleState === "PUBLISHED") ?? titleFeatureAssets[0];
    const grants = await loadTitleGrantRecords(db, row.id);

    const metadataDecision = evaluateRights({
      titleId: row.id,
      titleStatus: row.status,
      takedownActive: row.legalHold,
      assetId: featureAsset?.id,
      action: "METADATA",
      territoryCode,
      at,
      grants,
    });

    const streamDecision = evaluateRights({
      titleId: row.id,
      titleStatus: row.status,
      takedownActive: row.legalHold,
      assetId: featureAsset?.id,
      assetState: featureAsset?.lifecycleState,
      assetChecksumVerified: featureAsset?.checksumVerified,
      action: "STREAM",
      territoryCode,
      at,
      grants,
    });

    const downloadDecision = evaluateRights({
      titleId: row.id,
      titleStatus: row.status,
      takedownActive: row.legalHold,
      assetId: featureAsset?.id,
      assetState: featureAsset?.lifecycleState,
      assetChecksumVerified: featureAsset?.checksumVerified,
      action: "DOWNLOAD",
      territoryCode,
      at,
      grants,
    });

    let badgeKind: PublicTitleSummary["availability"]["badgeKind"] = "catalogue_only";
    if (streamDecision.allowed) {
      badgeKind = "stream_allowed";
    } else if (downloadDecision.allowed) {
      badgeKind = "download_allowed";
    } else if (
      (!streamDecision.allowed && streamDecision.code === "TERRITORY_RESTRICTED") ||
      (!downloadDecision.allowed && downloadDecision.code === "TERRITORY_RESTRICTED") ||
      (!metadataDecision.allowed && metadataDecision.code === "TERRITORY_RESTRICTED")
    ) {
      badgeKind = "region_restricted";
    }

    const rowGenres = [
      ...new Set(genreJoins.filter((g) => g.titleId === row.id).map((g) => g.slug)),
    ];
    const rowDirectors = [
      ...new Set(
        creditJoins
          .filter((c) => c.titleId === row.id && c.department === "DIRECTOR")
          .map((c) => c.personSlug),
      ),
    ];
    const rowCast = [
      ...new Set(
        creditJoins
          .filter((c) => c.titleId === row.id && c.department === "ACTOR")
          .map((c) => c.personSlug),
      ),
    ];
    const rowCollections = [
      ...new Set(collectionJoins.filter((c) => c.titleId === row.id).map((c) => c.slug)),
    ];
    const primarySource = sourceRows.find((s) => s.titleId === row.id);
    const { studioSlug, studioName } = extractStudioFromAttribution(
      primarySource?.externalId,
      primarySource?.attributionText,
    );

    summaries.push({
      id: row.id,
      slug: row.slug,
      kind: row.kind,
      featureAssetId: featureAsset?.id ?? null,
      originalTitle: row.originalTitle,
      originalLanguage: row.originalLanguage,
      releaseYear: row.releaseYear,
      runtimeMinutes: row.runtimeMinutes,
      maturityRating: row.maturityRating,
      isDevelopmentFixture: row.isDevelopmentFixture,
      localizedTitleEn: enTr?.localizedTitle ?? row.originalTitle,
      localizedTitleBn: null,
      synopsisEn: enTr?.synopsis ?? "",
      synopsisBn: null,
      genreSlugs: rowGenres,
      directorSlugs: rowDirectors,
      castSlugs: rowCast,
      collectionSlugs: rowCollections,
      studioName,
      studioSlug,
      availability: {
        streamAllowed: streamDecision.allowed,
        downloadAllowed: downloadDecision.allowed,
        metadataAllowed: metadataDecision.allowed,
        badgeKind,
      },
    });
  }

  return summaries;
}

export interface ListPublishedTitlesOptions {
  territoryCode?: string;
  kind?: TitleKind;
  language?: string;
  genreSlug?: string;
  directorSlug?: string;
  castSlug?: string;
  collectionSlug?: string;
  studioSlug?: string;
  maturityRating?: MaturityRating;
  yearMin?: number;
  yearMax?: number;
  sort?: CatalogueSort;
  limit?: number;
  at?: Date;
}

export async function listPublishedTitles(
  db: MovieDatabase,
  options?: ListPublishedTitlesOptions,
): Promise<PublicTitleSummary[]> {
  const territoryCode = options?.territoryCode ?? "BD";
  const at = options?.at ?? new Date();
  const limit = Math.min(Math.max(options?.limit ?? 24, 1), 100);

  const conditions = [eq(titles.status, "PUBLISHED"), eq(titles.legalHold, false)];
  if (options?.kind) {
    conditions.push(eq(titles.kind, options.kind));
  }
  if (options?.language) {
    conditions.push(eq(titles.originalLanguage, options.language));
  }
  if (options?.maturityRating) {
    conditions.push(eq(titles.maturityRating, options.maturityRating));
  }
  if (typeof options?.yearMin === "number") {
    conditions.push(gte(titles.releaseYear, options.yearMin));
  }
  if (typeof options?.yearMax === "number") {
    conditions.push(lte(titles.releaseYear, options.yearMax));
  }

  if (options?.genreSlug) {
    const matched = await db
      .select({ titleId: titleGenres.titleId })
      .from(titleGenres)
      .innerJoin(genres, eq(titleGenres.genreId, genres.id))
      .where(eq(genres.slug, options.genreSlug));
    if (matched.length === 0) return [];
    conditions.push(inArray(titles.id, [...new Set(matched.map((m) => m.titleId))]));
  }

  if (options?.directorSlug) {
    const matched = await db
      .select({ titleId: titleCredits.titleId })
      .from(titleCredits)
      .innerJoin(people, eq(titleCredits.personId, people.id))
      .where(and(eq(people.slug, options.directorSlug), eq(titleCredits.department, "DIRECTOR")));
    if (matched.length === 0) return [];
    conditions.push(inArray(titles.id, [...new Set(matched.map((m) => m.titleId))]));
  }

  if (options?.castSlug) {
    const matched = await db
      .select({ titleId: titleCredits.titleId })
      .from(titleCredits)
      .innerJoin(people, eq(titleCredits.personId, people.id))
      .where(and(eq(people.slug, options.castSlug), eq(titleCredits.department, "ACTOR")));
    if (matched.length === 0) return [];
    conditions.push(inArray(titles.id, [...new Set(matched.map((m) => m.titleId))]));
  }

  if (options?.collectionSlug) {
    const matched = await db
      .select({ titleId: collectionItems.titleId })
      .from(collectionItems)
      .innerJoin(collections, eq(collectionItems.collectionId, collections.id))
      .where(and(eq(collections.slug, options.collectionSlug), eq(collections.isPublished, true)));
    if (matched.length === 0) return [];
    conditions.push(inArray(titles.id, [...new Set(matched.map((m) => m.titleId))]));
  }

  const orderClauses = (() => {
    switch (options?.sort) {
      case "newest":
        return [desc(titles.releaseYear), desc(titles.publishedAt)];
      case "classic":
        return [asc(titles.releaseYear), desc(titles.publishedAt)];
      case "runtime_desc":
        return [desc(titles.runtimeMinutes), desc(titles.releaseYear)];
      case "runtime_asc":
        return [asc(titles.runtimeMinutes), desc(titles.releaseYear)];
      case "title_asc":
        return [asc(titles.originalTitle)];
      default:
        return [desc(titles.publishedAt), desc(titles.createdAt)];
    }
  })();

  const queryLimit = options?.studioSlug ? Math.max(limit * 4, 100) : limit;
  const rows = await db
    .select()
    .from(titles)
    .where(and(...conditions))
    .orderBy(...orderClauses)
    .limit(queryLimit);

  const hydrated = await hydratePublicTitleSummaries(db, rows, territoryCode, at);
  if (options?.studioSlug) {
    return hydrated.filter((item) => item.studioSlug === options.studioSlug).slice(0, limit);
  }
  return hydrated;
}

export async function searchPublishedTitles(
  db: MovieDatabase,
  query: string,
  options?: { territoryCode?: string; at?: Date; limit?: number },
): Promise<PublicTitleSummary[]> {
  const trimmed = query.trim().slice(0, 120);
  if (!trimmed) {
    return [];
  }

  const escaped = trimmed.replace(/[%_\\]/g, "\\$&");
  const pattern = `%${escaped}%`;
  const limit = Math.min(Math.max(options?.limit ?? 24, 1), 50);

  const matchingTranslationTitleIds = await db
    .select({ titleId: titleTranslations.titleId })
    .from(titleTranslations)
    .where(
      or(
        ilike(titleTranslations.localizedTitle, pattern),
        ilike(titleTranslations.synopsis, pattern),
      ),
    );

  const matchingCreditTitleIds = await db
    .select({ titleId: titleCredits.titleId })
    .from(titleCredits)
    .innerJoin(people, eq(titleCredits.personId, people.id))
    .where(or(ilike(people.nameEn, pattern), ilike(people.nameBn, pattern)));

  const matchedIds = [
    ...new Set([
      ...matchingTranslationTitleIds.map((r) => r.titleId),
      ...matchingCreditTitleIds.map((r) => r.titleId),
    ]),
  ];

  const whereClause =
    matchedIds.length > 0
      ? and(
          eq(titles.status, "PUBLISHED"),
          eq(titles.legalHold, false),
          or(ilike(titles.originalTitle, pattern), inArray(titles.id, matchedIds)),
        )
      : and(
          eq(titles.status, "PUBLISHED"),
          eq(titles.legalHold, false),
          ilike(titles.originalTitle, pattern),
        );

  const rows = await db
    .select()
    .from(titles)
    .where(whereClause)
    .orderBy(desc(titles.publishedAt))
    .limit(limit);

  return hydratePublicTitleSummaries(
    db,
    rows,
    options?.territoryCode ?? "BD",
    options?.at ?? new Date(),
  );
}

export async function getPublishedTitleBySlug(
  db: MovieDatabase,
  slug: string,
  options?: { territoryCode?: string; at?: Date },
) {
  const rows = await db
    .select()
    .from(titles)
    .where(and(eq(titles.slug, slug), eq(titles.status, "PUBLISHED"), eq(titles.legalHold, false)))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  const [summary] = await hydratePublicTitleSummaries(
    db,
    [row],
    options?.territoryCode ?? "BD",
    options?.at ?? new Date(),
  );
  if (!summary) {
    return null;
  }

  const credits = await db
    .select({
      department: titleCredits.department,
      characterName: titleCredits.characterName,
      billingOrder: titleCredits.billingOrder,
      personSlug: people.slug,
      nameEn: people.nameEn,
      nameBn: people.nameBn,
    })
    .from(titleCredits)
    .innerJoin(people, eq(titleCredits.personId, people.id))
    .where(eq(titleCredits.titleId, row.id))
    .orderBy(titleCredits.billingOrder);

  const sources = await db
    .select({
      provider: metadataSources.provider,
      attributionText: metadataSources.attributionText,
    })
    .from(metadataSources)
    .where(eq(metadataSources.titleId, row.id));

  const titleGenreRows = await db
    .select({
      slug: genres.slug,
      nameEn: genres.nameEn,
      nameBn: genres.nameBn,
    })
    .from(titleGenres)
    .innerJoin(genres, eq(titleGenres.genreId, genres.id))
    .where(eq(titleGenres.titleId, row.id));

  return {
    ...summary,
    credits: credits.map((c) => ({
      ...c,
      nameBn: null,
    })),
    sources,
    genres: titleGenreRows.map((g) => ({
      ...g,
      nameBn: null,
    })),
  };
}

/**
 * Public Discovery: Filmmaker / Person profile with verified published titles (Blueprint §85.1).
 */
export async function getPublicPersonBySlug(
  db: MovieDatabase,
  slug: string,
  options?: { territoryCode?: string; at?: Date },
) {
  const [person] = await db.select().from(people).where(eq(people.slug, slug)).limit(1);

  if (!person) {
    return null;
  }

  const credits = await db
    .select({
      titleId: titleCredits.titleId,
      department: titleCredits.department,
      characterName: titleCredits.characterName,
      billingOrder: titleCredits.billingOrder,
    })
    .from(titleCredits)
    .where(eq(titleCredits.personId, person.id))
    .orderBy(titleCredits.billingOrder);

  const titleIds = [...new Set(credits.map((c) => c.titleId))];
  if (titleIds.length === 0) {
    return {
      person: {
        ...person,
        nameBn: null,
      },
      titles: [],
    };
  }

  const titleRows = await db
    .select()
    .from(titles)
    .where(
      and(
        inArray(titles.id, titleIds),
        eq(titles.status, "PUBLISHED"),
        eq(titles.legalHold, false),
      ),
    )
    .orderBy(desc(titles.releaseYear), desc(titles.publishedAt));

  const summaries = await hydratePublicTitleSummaries(
    db,
    titleRows,
    options?.territoryCode ?? "BD",
    options?.at ?? new Date(),
  );

  return {
    person: {
      ...person,
      nameBn: null,
    },
    titles: summaries,
  };
}

/**
 * Public Discovery: Editorial Curated Collection with verified published titles.
 */
export async function getPublicCollectionBySlug(
  db: MovieDatabase,
  slug: string,
  options?: { territoryCode?: string; at?: Date },
) {
  const [collection] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.slug, slug), eq(collections.isPublished, true)))
    .limit(1);

  if (!collection) {
    return null;
  }

  const items = await db
    .select({
      titleId: collectionItems.titleId,
      sortOrder: collectionItems.sortOrder,
    })
    .from(collectionItems)
    .where(eq(collectionItems.collectionId, collection.id))
    .orderBy(collectionItems.sortOrder);

  const titleIds = items.map((i) => i.titleId);
  if (titleIds.length === 0) {
    return { collection, titles: [] };
  }

  const titleRows = await db
    .select()
    .from(titles)
    .where(
      and(
        inArray(titles.id, titleIds),
        eq(titles.status, "PUBLISHED"),
        eq(titles.legalHold, false),
      ),
    );

  const titleMap = new Map(titleRows.map((t) => [t.id, t]));
  const orderedRows: Array<typeof titles.$inferSelect> = [];
  for (const item of items) {
    const t = titleMap.get(item.titleId);
    if (t) orderedRows.push(t);
  }

  const summaries = await hydratePublicTitleSummaries(
    db,
    orderedRows,
    options?.territoryCode ?? "BD",
    options?.at ?? new Date(),
  );

  return { collection, titles: summaries };
}

/**
 * Public Discovery: Titles by Genre Taxonomy with verified published titles.
 */
export async function getPublicGenreBySlug(
  db: MovieDatabase,
  slug: string,
  options?: { territoryCode?: string; at?: Date; limit?: number },
) {
  const [genre] = await db.select().from(genres).where(eq(genres.slug, slug)).limit(1);

  if (!genre) {
    return null;
  }

  const links = await db
    .select({ titleId: titleGenres.titleId })
    .from(titleGenres)
    .where(eq(titleGenres.genreId, genre.id));

  const titleIds = links.map((l) => l.titleId);
  if (titleIds.length === 0) {
    return { genre, titles: [] };
  }

  const limit = Math.min(Math.max(options?.limit ?? 24, 1), 50);
  const titleRows = await db
    .select()
    .from(titles)
    .where(
      and(
        inArray(titles.id, titleIds),
        eq(titles.status, "PUBLISHED"),
        eq(titles.legalHold, false),
      ),
    )
    .orderBy(desc(titles.publishedAt))
    .limit(limit);

  const summaries = await hydratePublicTitleSummaries(
    db,
    titleRows,
    options?.territoryCode ?? "BD",
    options?.at ?? new Date(),
  );

  return { genre, titles: summaries };
}

/**
 * Public Discovery: List all published editorial collections.
 */
export async function listPublicCollections(db: MovieDatabase, options?: { limit?: number }) {
  const limit = Math.min(Math.max(options?.limit ?? 24, 1), 50);
  const collectionRows = await db
    .select()
    .from(collections)
    .where(eq(collections.isPublished, true))
    .orderBy(desc(collections.createdAt))
    .limit(limit);

  const result = [];
  for (const c of collectionRows) {
    const [countRow] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(collectionItems)
      .where(eq(collectionItems.collectionId, c.id));

    result.push({
      ...c,
      itemCount: countRow?.count ?? 0,
    });
  }

  return result;
}

/**
 * Watchlist DAL — Strictly owner-scoped to `ctx.actor.userId` (IDOR defense).
 */
export async function addWatchlistItem(db: MovieDatabase, ctx: AuditContext, titleId: string) {
  if (!ctx.actor || ctx.actor.status !== "ACTIVE") {
    throw new AuthorizationError("UNAUTHENTICATED", "Sign in to manage your watchlist");
  }
  const userId = ctx.actor.userId;

  const publishedRows = await db
    .select({ id: titles.id })
    .from(titles)
    .where(and(eq(titles.id, titleId), eq(titles.status, "PUBLISHED"), eq(titles.legalHold, false)))
    .limit(1);
  if (!publishedRows[0]) {
    throw new NotFoundError("Published title not found");
  }

  await db.insert(watchlistItems).values({ userId, titleId }).onConflictDoNothing();

  return { userId, titleId };
}

export async function removeWatchlistItem(db: MovieDatabase, ctx: AuditContext, titleId: string) {
  if (!ctx.actor || ctx.actor.status !== "ACTIVE") {
    throw new AuthorizationError("UNAUTHENTICATED", "Sign in to manage your watchlist");
  }
  const userId = ctx.actor.userId;

  await db
    .delete(watchlistItems)
    .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.titleId, titleId)));

  return { userId, titleId };
}

export async function listWatchlistItems(
  db: MovieDatabase,
  ctx: AuditContext,
  options?: { territoryCode?: string; at?: Date },
): Promise<PublicTitleSummary[]> {
  if (!ctx.actor || ctx.actor.status !== "ACTIVE") {
    throw new AuthorizationError("UNAUTHENTICATED", "Sign in to view your watchlist");
  }

  const saved = await db
    .select({ titleId: watchlistItems.titleId })
    .from(watchlistItems)
    .where(eq(watchlistItems.userId, ctx.actor.userId))
    .orderBy(desc(watchlistItems.createdAt));

  if (saved.length === 0) {
    return [];
  }

  const rows = await db
    .select()
    .from(titles)
    .where(
      and(
        inArray(
          titles.id,
          saved.map((s) => s.titleId),
        ),
        eq(titles.status, "PUBLISHED"),
        eq(titles.legalHold, false),
      ),
    );

  return hydratePublicTitleSummaries(
    db,
    rows,
    options?.territoryCode ?? "BD",
    options?.at ?? new Date(),
  );
}

export interface SubmitContentReportInput {
  targetPath: string;
  titleSlug?: string;
  reporterName: string;
  reporterEmail: string;
  claimSummary: string;
}

export async function submitContentReport(
  db: MovieDatabase,
  ctx: AuditContext,
  input: SubmitContentReportInput,
) {
  const caseId = newEntityId("tkd");
  const caseNumber = `TKD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  let matchedTitleId: string | null = null;
  if (input.titleSlug) {
    const t = await db
      .select({ id: titles.id })
      .from(titles)
      .where(eq(titles.slug, input.titleSlug))
      .limit(1);
    matchedTitleId = t[0]?.id ?? null;
  }

  await db.transaction(async (tx) => {
    const txDb = tx as unknown as MovieDatabase;
    await txDb.insert(takedownCases).values({
      id: caseId,
      caseNumber,
      titleId: matchedTitleId,
      targetPath: input.targetPath.trim().slice(0, 256),
      reporterName: input.reporterName.trim().slice(0, 120),
      reporterEmail: input.reporterEmail.trim().toLowerCase().slice(0, 180),
      claimSummary: input.claimSummary.trim().slice(0, 4000),
      status: "OPEN",
      legalHoldApplied: false,
    });

    await recordAuditEvent(txDb, {
      actor: ctx.actor,
      action: "compliance.report.submit",
      targetType: "takedown_case",
      targetId: caseId,
      requestId: ctx.requestId,
      metadata: { caseNumber, targetPath: input.targetPath },
    });
  });

  return { id: caseId, caseNumber, status: "OPEN" as const };
}

export async function getAdminDashboardSummary(db: MovieDatabase, ctx: AuditContext) {
  const hasAdminView =
    ctx.actor &&
    ctx.actor.status === "ACTIVE" &&
    ctx.actor.roles.some((r: Role) =>
      ["EDITOR", "MEDIA_OPERATOR", "RIGHTS_REVIEWER", "ADMIN", "SUPER_ADMIN"].includes(r),
    );

  if (!hasAdminView) {
    throw new AuthorizationError(
      ctx.actor ? "FORBIDDEN" : "UNAUTHENTICATED",
      "Staff role required to view the Operations Console",
    );
  }

  const [titleCountRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(titles);
  const [publishedCountRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(titles)
    .where(eq(titles.status, "PUBLISHED"));
  const [pendingGrantsRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(rightsGrants)
    .where(eq(rightsGrants.status, "PENDING"));
  const [openCasesRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(takedownCases)
    .where(eq(takedownCases.status, "OPEN"));

  const recentTitles = await db
    .select({
      id: titles.id,
      slug: titles.slug,
      originalTitle: titles.originalTitle,
      status: titles.status,
      legalHold: titles.legalHold,
      releaseYear: titles.releaseYear,
      updatedAt: titles.updatedAt,
    })
    .from(titles)
    .orderBy(desc(titles.updatedAt))
    .limit(10);

  const recentAudit = await db
    .select()
    .from(auditEvents)
    .orderBy(desc(auditEvents.createdAt))
    .limit(10);

  return {
    counts: {
      totalTitles: titleCountRow?.count ?? 0,
      publishedTitles: publishedCountRow?.count ?? 0,
      pendingRightsGrants: pendingGrantsRow?.count ?? 0,
      openTakedownCases: openCasesRow?.count ?? 0,
    },
    recentTitles,
    recentAudit,
  };
}
