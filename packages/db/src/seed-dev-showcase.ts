import path from "node:path";
import { eq } from "drizzle-orm";
import { getEnv } from "@movie/config";
import type { DeliveryAction, MaturityRating, ResolutionTier } from "@movie/contracts";
import { createLogger } from "@movie/observability";
import { createDatabaseHandle, type MovieDatabase } from "./client.ts";
import {
  collectionItems,
  collections,
  genres,
  mediaAssets,
  mediaObjects,
  mediaRenditions,
  metadataSources,
  people,
  rightsEvidence,
  rightsGrants,
  rightsHolders,
  subtitleTracks,
  titleCredits,
  titleGenres,
  titles,
  titleTranslations,
  users,
} from "./schema/index.ts";

const logger = createLogger({ service: "@movie/db:seed-dev-showcase" });

export interface FixtureFilmDefinition {
  slug: string;
  originalTitle: string;
  originalLanguage: string;
  releaseYear: number;
  runtimeMinutes: number;
  maturityRating: MaturityRating;
  titleEn: string;
  titleBn?: string;
  taglineEn: string;
  taglineBn?: string;
  synopsisEn: string;
  synopsisBn?: string;
  originCountry: string;
  genreSlugs: string[];
  collectionSlug: "monsoon-noir-archive" | "public-domain-restoration-vault";
  collectionSortOrder: number;
  studioName: string;
  castNameEn: string;
  castNameBn?: string;
  characterName: string;
}

export const SHOWCASE_FILMS: readonly FixtureFilmDefinition[] = [
  {
    slug: "the-last-monsoon",
    originalTitle: "The Last Monsoon",
    originalLanguage: "bn",
    releaseYear: 2024,
    runtimeMinutes: 118,
    maturityRating: "PG13",
    titleEn: "The Last Monsoon",
    taglineEn: "Secrets run deeper than rain.",
    synopsisEn:
      "In the shadow of a prolonged monsoon in Old Dhaka, an archivist uncovers a forgotten film reel that implicates a prominent riverfront family in an unresolved 1980s disappearance.",
    originCountry: "BD",
    genreSlugs: ["noir", "drama"],
    collectionSlug: "monsoon-noir-archive",
    collectionSortOrder: 1,
    studioName: "Monsoon Shadow Studios",
    castNameEn: "Tariq Anam",
    characterName: "Ahsan Habib",
  },
  {
    slug: "neon-bhasha",
    originalTitle: "Neon Bhasha",
    originalLanguage: "bn",
    releaseYear: 2023,
    runtimeMinutes: 104,
    maturityRating: "PG13",
    titleEn: "Neon Bhasha",
    taglineEn: "In a city of algorithms, poetry is contraband.",
    synopsisEn:
      "Across the neon-washed rain towers of near-future coastal Chittagong, a synthetic linguist decodes an encrypted transmission hidden inside obsolete analog maritime frequencies.",
    originCountry: "BD",
    genreSlugs: ["sci-fi", "noir"],
    collectionSlug: "monsoon-noir-archive",
    collectionSortOrder: 2,
    studioName: "Bengal Cyber Cinema",
    castNameEn: "Mehazabien Chowdhury",
    characterName: "Dr. Maya Sen",
  },
  {
    slug: "shadows-over-buriganga",
    originalTitle: "Shadows Over Buriganga",
    originalLanguage: "bn",
    releaseYear: 2022,
    runtimeMinutes: 132,
    maturityRating: "R16",
    titleEn: "Shadows Over Buriganga",
    taglineEn: "The river remembers what the city tries to drown.",
    synopsisEn:
      "A veteran river-police detective navigates the labyrinthine docks and fog-shrouded cargo hulls of the Buriganga to dismantle an illicit international shipping syndicate.",
    originCountry: "BD",
    genreSlugs: ["thriller", "noir"],
    collectionSlug: "monsoon-noir-archive",
    collectionSortOrder: 3,
    studioName: "Dhaka Riverfront Films",
    castNameEn: "Fazlur Rahman Babu",
    characterName: "Inspector Kabir",
  },
  {
    slug: "echoes-of-the-delta",
    originalTitle: "Echoes of the Delta",
    originalLanguage: "bn",
    releaseYear: 2021,
    runtimeMinutes: 92,
    maturityRating: "U",
    titleEn: "Echoes of the Delta",
    taglineEn: "Where water writes history.",
    synopsisEn:
      "An intimate, sweeping visual study documenting the resilient wooden boat-building masters and nocturnal musical traditions of the lower Brahmaputra-Meghna confluence.",
    originCountry: "BD",
    genreSlugs: ["documentary"],
    collectionSlug: "public-domain-restoration-vault",
    collectionSortOrder: 1,
    studioName: "Delta Heritage Trust",
    castNameEn: "Amina Rahman",
    characterName: "Narrator",
  },
  {
    slug: "midnight-at-curzon-hall",
    originalTitle: "Midnight at Curzon Hall",
    originalLanguage: "bn",
    releaseYear: 2024,
    runtimeMinutes: 126,
    maturityRating: "PG13",
    titleEn: "Midnight at Curzon Hall",
    taglineEn: "Red brick walls guard colonial ghosts.",
    synopsisEn:
      "A visiting archivist spends a storm-locked night inside the century-old red-brick halls, unearthing forgotten correspondence that rewrites the history of an early expedition.",
    originCountry: "BD",
    genreSlugs: ["thriller", "drama"],
    collectionSlug: "monsoon-noir-archive",
    collectionSortOrder: 4,
    studioName: "Curzon Archival Media",
    castNameEn: "Chanchal Chowdhury",
    characterName: "Professor Alam",
  },
  {
    slug: "voyage-beyond-stars",
    originalTitle: "Voyage Beyond Stars",
    originalLanguage: "en",
    releaseYear: 2025,
    runtimeMinutes: 140,
    maturityRating: "PG",
    titleEn: "Voyage Beyond Stars",
    taglineEn: "The quietest journey across the cosmos.",
    synopsisEn:
      "A generational sleeper transport embarks on a silent century-long drift as the custodial botanist discovers an unexpected bloom thriving inside the cryogenic engine bay.",
    originCountry: "US",
    genreSlugs: ["sci-fi", "drama"],
    collectionSlug: "public-domain-restoration-vault",
    collectionSortOrder: 2,
    studioName: "Cosmos Restorations International",
    castNameEn: "Elena Vance",
    characterName: "Chief Botanist Iris",
  },
  {
    slug: "symphony-of-the-loom",
    originalTitle: "Symphony of the Loom",
    originalLanguage: "bn",
    releaseYear: 2020,
    runtimeMinutes: 85,
    maturityRating: "U",
    titleEn: "Symphony of the Loom",
    taglineEn: "The lost rhythm of Jamdani.",
    synopsisEn:
      "A lyrical restoration capturing traditional master Jamdani weavers along the Shitalakshya River, preserving ancient geometric motifs and acoustic loom rhythms.",
    originCountry: "BD",
    genreSlugs: ["documentary"],
    collectionSlug: "public-domain-restoration-vault",
    collectionSortOrder: 3,
    studioName: "Shitalakshya Textile Arts",
    castNameEn: "Monirul Islam",
    characterName: "Master Weaver Kashem",
  },
] as const;

export async function seedDevShowcase(customDb?: MovieDatabase): Promise<{
  titlesSeeded: number;
  collectionsSeeded: number;
  genresSeeded: number;
}> {
  const env = getEnv();
  const effectiveStage = env.APP_ENV ?? env.NODE_ENV;
  if (
    effectiveStage === "production" ||
    process.env.NODE_ENV === "production" ||
    env.APP_ENV === "production"
  ) {
    throw new Error("db:seed:dev is strictly blocked when effective stage is production");
  }

  let handle = null;
  let db = customDb;
  if (!db) {
    handle = createDatabaseHandle();
    await handle.migrate();
    db = handle.db;
  }

  try {
    // 1. Showcase Curator User
    const adminUserId = "usr_dev_showcase_admin";
    await db
      .insert(users)
      .values({
        id: adminUserId,
        email: "showcase.curator@cinematic-graphite.local",
        passwordHash: "$scrypt$showcase$hash",
        displayName: "Showcase Curator",
        status: "ACTIVE",
        entitlementTier: "FREE",
      })
      .onConflictDoNothing({ target: users.id });

    // 2. Showcase Rights Holder
    const rightsHolderId = "rhl_showcase_studios";
    await db
      .insert(rightsHolders)
      .values({
        id: rightsHolderId,
        legalName: "Cinematic Graphite Showcase Studios Ltd.",
        contactEmail: "licensing@cinematic-graphite.local",
        countryCode: "BD",
        notes:
          "Lawful editorial showcase licensor for local development and visual QA verification.",
      })
      .onConflictDoNothing({ target: rightsHolders.id });

    // 3. Editorial Showcase Director: Amina Rahman
    const aminaId = "per_amina_rahman";
    await db
      .insert(people)
      .values({
        id: aminaId,
        slug: "amina-rahman",
        nameEn: "Amina Rahman",
        nameBn: null,
        bio: "Pioneering Bangladeshi independent filmmaker and visual artist celebrated for atmospheric noir and neo-realist cinema.",
      })
      .onConflictDoNothing({ target: people.slug });

    // 4. Curated Collections
    const collectionDefs = [
      {
        id: "col_monsoon_noir",
        slug: "monsoon-noir-archive",
        titleEn: "Monsoon Noir Archive",
        description:
          "Curated atmospheric neo-noir and mystery films set during the South Asian monsoon.",
        isPublished: true,
      },
      {
        id: "col_public_domain_vault",
        slug: "public-domain-restoration-vault",
        titleEn: "Public Domain Restoration Vault",
        description:
          "Lawful digital restorations of seminal open-licensed and public-domain cinematic works.",
        isPublished: true,
      },
    ] as const;

    for (const c of collectionDefs) {
      await db
        .insert(collections)
        .values({
          id: c.id,
          slug: c.slug,
          titleEn: c.titleEn,
          titleBn: null,
          description: c.description,
          isPublished: c.isPublished,
        })
        .onConflictDoNothing({ target: collections.slug });
    }

    // 5. Curated Genres
    const genreDefs = [
      { slug: "sci-fi", nameEn: "Sci-Fi", nameBn: null },
      { slug: "noir", nameEn: "Noir", nameBn: null },
      { slug: "drama", nameEn: "Drama", nameBn: null },
      { slug: "thriller", nameEn: "Thriller", nameBn: null },
      { slug: "documentary", nameEn: "Documentary", nameBn: null },
    ] as const;

    const genreIdMap = new Map<string, string>();
    for (const g of genreDefs) {
      const fallbackId = `gnr_${g.slug.replace(/-/g, "_")}`;
      await db
        .insert(genres)
        .values({
          id: fallbackId,
          slug: g.slug,
          nameEn: g.nameEn,
          nameBn: g.nameBn,
        })
        .onConflictDoNothing({ target: genres.slug });

      const [existing] = await db
        .select({ id: genres.id })
        .from(genres)
        .where(eq(genres.slug, g.slug))
        .limit(1);
      genreIdMap.set(g.slug, existing?.id ?? fallbackId);
    }

    // 6. 7 Original Fixture Films
    for (const film of SHOWCASE_FILMS) {
      const titleId = `ttl_${film.slug.replace(/-/g, "_")}`;
      const assetId = `ast_${film.slug.replace(/-/g, "_")}`;
      const evidenceId = `rev_${film.slug.replace(/-/g, "_")}`;
      const grantId = `rgr_${film.slug.replace(/-/g, "_")}`;
      const castPersonId = `per_${film.castNameEn.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

      // Insert cast person if not Amina
      if (film.castNameEn !== "Amina Rahman") {
        await db
          .insert(people)
          .values({
            id: castPersonId,
            slug: film.castNameEn.toLowerCase().replace(/[^a-z0-9]/g, "-"),
            nameEn: film.castNameEn,
            nameBn: film.castNameBn,
            bio: `Celebrated screen actor featured in ${film.titleEn}.`,
          })
          .onConflictDoNothing({ target: people.slug });
      }

      // Title
      await db
        .insert(titles)
        .values({
          id: titleId,
          slug: film.slug,
          kind: "MOVIE",
          status: "PUBLISHED",
          originalTitle: film.originalTitle,
          originalLanguage: film.originalLanguage,
          releaseYear: film.releaseYear,
          runtimeMinutes: film.runtimeMinutes,
          maturityRating: film.maturityRating,
          legalHold: false,
          isDevelopmentFixture: true,
          publishedAt: new Date("2024-01-01T00:00:00Z"),
          createdByUserId: adminUserId,
        })
        .onConflictDoNothing({ target: titles.slug });

      // Title Translations (en & bn)
      await db
        .insert(titleTranslations)
        .values({
          id: `ttr_${film.slug.replace(/-/g, "_")}_en`,
          titleId,
          locale: "en",
          localizedTitle: film.titleEn,
          tagline: film.taglineEn,
          synopsis: film.synopsisEn,
        })
        .onConflictDoNothing();

      // Title Genres
      for (const gSlug of film.genreSlugs) {
        const gId = genreIdMap.get(gSlug);
        if (gId) {
          await db
            .insert(titleGenres)
            .values({
              titleId,
              genreId: gId,
            })
            .onConflictDoNothing();
        }
      }

      // Title Credits: Director (Amina Rahman) + Actor
      await db
        .insert(titleCredits)
        .values({
          id: `crd_${film.slug.replace(/-/g, "_")}_dir`,
          titleId,
          personId: aminaId,
          department: "DIRECTOR",
          billingOrder: 1,
        })
        .onConflictDoNothing();

      if (film.castNameEn !== "Amina Rahman") {
        await db
          .insert(titleCredits)
          .values({
            id: `crd_${film.slug.replace(/-/g, "_")}_actor`,
            titleId,
            personId: castPersonId,
            department: "ACTOR",
            characterName: film.characterName,
            billingOrder: 2,
          })
          .onConflictDoNothing();
      }

      // Curated Collection Item
      const targetColId =
        film.collectionSlug === "monsoon-noir-archive"
          ? "col_monsoon_noir"
          : "col_public_domain_vault";
      await db
        .insert(collectionItems)
        .values({
          collectionId: targetColId,
          titleId,
          sortOrder: film.collectionSortOrder,
        })
        .onConflictDoNothing();

      // Metadata source attribution
      await db
        .insert(metadataSources)
        .values({
          id: `src_${film.slug.replace(/-/g, "_")}`,
          titleId,
          provider: "OPERATOR_ORIGINAL",
          attributionText: film.studioName,
          licenseConfirmed: true,
        })
        .onConflictDoNothing();

      // Media Asset (FEATURE)
      await db
        .insert(mediaAssets)
        .values({
          id: assetId,
          titleId,
          kind: "FEATURE",
          lifecycleState: "PUBLISHED",
          drmRequired: false,
          containerFormat: "mp4",
          durationSeconds: film.runtimeMinutes * 60,
          sha256Checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          checksumVerified: true,
          qcPassed: true,
          qcApprovedByUserId: adminUserId,
          qcApprovedAt: new Date("2024-01-01T00:00:00Z"),
        })
        .onConflictDoNothing({ target: mediaAssets.id });

      // Packaged Media Object (master manifest)
      const manifestObjectKey = `assets/${assetId}/v1/master.m3u8`;
      await db
        .insert(mediaObjects)
        .values({
          id: `obj_${film.slug.replace(/-/g, "_")}_manifest`,
          assetId,
          provider: "memory",
          bucket: "media-packaged-private",
          objectKey: manifestObjectKey,
          byteLength: 2048,
          sha256Checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          contentType: "application/vnd.apple.mpegurl",
        })
        .onConflictDoNothing({ target: mediaObjects.id });

      // ABR Renditions (360p, 720p, 1080p)
      const renditionsData: Array<{
        resolution: ResolutionTier;
        codec: string;
        bitrateKbps: number;
      }> = [
        { resolution: "360p", codec: "avc1.4d401e", bitrateKbps: 800 },
        { resolution: "720p", codec: "avc1.64001f", bitrateKbps: 2800 },
        { resolution: "1080p", codec: "avc1.640028", bitrateKbps: 5200 },
      ];

      for (const r of renditionsData) {
        await db
          .insert(mediaRenditions)
          .values({
            id: `rnd_${film.slug.replace(/-/g, "_")}_${r.resolution}`,
            assetId,
            resolution: r.resolution,
            codec: r.codec,
            bitrateKbps: r.bitrateKbps,
            manifestObjectKey: `assets/${assetId}/v1/${r.resolution}/index.m3u8`,
            hasConfiguredDrm: false,
          })
          .onConflictDoNothing({ target: mediaRenditions.id });
      }

      // Subtitle Tracks (en, bn)
      await db
        .insert(subtitleTracks)
        .values({
          id: `sub_${film.slug.replace(/-/g, "_")}_en`,
          assetId,
          languageCode: "en",
          label: "English (SDH)",
          objectKey: `assets/${assetId}/subtitles/en/v1.vtt`,
          isForced: false,
        })
        .onConflictDoNothing({ target: subtitleTracks.id });

      // Rights Evidence
      await db
        .insert(rightsEvidence)
        .values({
          id: evidenceId,
          rightsHolderId,
          titleId,
          basis: "OWNED",
          documentRef: `DOC-SHOWCASE-${film.slug.toUpperCase()}-2024`,
          evidenceSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          submittedByUserId: adminUserId,
          reviewedByUserId: adminUserId,
          reviewedAt: new Date("2024-01-01T00:00:00Z"),
        })
        .onConflictDoNothing({ target: rightsEvidence.id });

      // Approved Rights Grant (STREAM + DOWNLOAD for BD, US, DE, GLOBAL)
      await db
        .insert(rightsGrants)
        .values({
          id: grantId,
          titleId,
          assetId,
          rightsHolderId,
          evidenceId,
          status: "APPROVED",
          allowedActions: ["STREAM", "DOWNLOAD"] as DeliveryAction[],
          allowedTerritories: ["BD", "US", "DE", "GLOBAL"],
          excludedTerritories: [],
          validFrom: new Date("2024-01-01T00:00:00Z"),
          validUntil: new Date("2035-12-31T23:59:59Z"),
          requiredEntitlement: "FREE",
          maxResolution: "1080p",
          requiresDrm: false,
          attributionText: `Licensed by ${film.studioName} for lawful demonstration and streaming.`,
          createdByUserId: adminUserId,
          approvedByUserId: adminUserId,
          approvedAt: new Date("2024-01-01T00:00:00Z"),
        })
        .onConflictDoNothing({ target: rightsGrants.id });
    }

    logger.info("Dev showcase fixture seeding completed successfully", {
      titlesCount: SHOWCASE_FILMS.length,
      director: "Amina Rahman",
      collectionsCount: collectionDefs.length,
      genresCount: genreDefs.length,
    });

    return {
      titlesSeeded: SHOWCASE_FILMS.length,
      collectionsSeeded: collectionDefs.length,
      genresSeeded: genreDefs.length,
    };
  } finally {
    if (handle) {
      await handle.close();
    }
  }
}

// Direct execution entrypoint
if (
  process.argv[1] &&
  (process.argv[1].endsWith("seed-dev-showcase.ts") ||
    process.argv[1].endsWith("seed-dev-showcase.js"))
) {
  seedDevShowcase()
    .then((res) => {
      console.log(
        `✓ Successfully seeded ${res.titlesSeeded} fixture films, ${res.collectionsSeeded} collections, and ${res.genresSeeded} genres.`,
      );
      process.exit(0);
    })
    .catch((err) => {
      console.error("✗ Dev showcase fixture seed failed:", err);
      process.exit(1);
    });
}
