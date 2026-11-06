import type { MaturityRating, TitleStatus } from "@movie/contracts";
import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./identity.ts";

export const titles = pgTable(
  "titles",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    kind: text("kind").$type<"MOVIE">().notNull().default("MOVIE"),
    status: text("status").$type<TitleStatus>().notNull().default("DRAFT"),
    originalTitle: text("original_title").notNull(),
    originalLanguage: text("original_language").notNull().default("en"),
    releaseYear: integer("release_year").notNull(),
    runtimeMinutes: integer("runtime_minutes").notNull(),
    maturityRating: text("maturity_rating").$type<MaturityRating>().notNull().default("UNRATED"),
    legalHold: boolean("legal_hold").notNull().default(false),
    isDevelopmentFixture: boolean("is_development_fixture").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("titles_slug_unique").on(table.slug),
    index("titles_status_published_idx").on(table.status, table.publishedAt),
    index("titles_language_year_idx").on(table.originalLanguage, table.releaseYear),
  ],
);

export const titleTranslations = pgTable(
  "title_translations",
  {
    id: text("id").primaryKey(),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    localizedTitle: text("localized_title").notNull(),
    tagline: text("tagline"),
    synopsis: text("synopsis").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("title_translations_title_locale_unique").on(table.titleId, table.locale),
    index("title_translations_locale_idx").on(table.locale),
  ],
);

export const genres = pgTable(
  "genres",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    nameEn: text("name_en").notNull(),
    nameBn: text("name_bn"),
  },
  (table) => [uniqueIndex("genres_slug_unique").on(table.slug)],
);

export const titleGenres = pgTable(
  "title_genres",
  {
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    genreId: text("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.titleId, table.genreId] }),
    index("title_genres_genre_idx").on(table.genreId),
  ],
);

export const people = pgTable(
  "people",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    nameEn: text("name_en").notNull(),
    nameBn: text("name_bn"),
    bio: text("bio"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("people_slug_unique").on(table.slug)],
);

export const titleCredits = pgTable(
  "title_credits",
  {
    id: text("id").primaryKey(),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    personId: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    department: text("department")
      .$type<"DIRECTOR" | "WRITER" | "ACTOR" | "PRODUCER" | "COMPOSER">()
      .notNull(),
    characterName: text("character_name"),
    billingOrder: integer("billing_order").notNull().default(0),
  },
  (table) => [
    index("title_credits_title_idx").on(table.titleId),
    index("title_credits_person_idx").on(table.personId),
  ],
);

export const collections = pgTable(
  "collections",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    titleEn: text("title_en").notNull(),
    titleBn: text("title_bn"),
    description: text("description"),
    isPublished: boolean("is_published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("collections_slug_unique").on(table.slug)],
);

export const collectionItems = pgTable(
  "collection_items",
  {
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.collectionId, table.titleId] })],
);

export const metadataSources = pgTable(
  "metadata_sources",
  {
    id: text("id").primaryKey(),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    provider: text("provider")
      .$type<"OPERATOR_ORIGINAL" | "PUBLIC_DOMAIN_RECORD" | "LICENSED_PARTNER" | "TMDB">()
      .notNull(),
    externalId: text("external_id"),
    attributionText: text("attribution_text").notNull(),
    licenseConfirmed: boolean("license_confirmed").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("metadata_sources_title_idx").on(table.titleId)],
);

export const watchlistItems = pgTable(
  "watchlist_items",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.titleId] }),
    index("watchlist_items_user_created_idx").on(table.userId, table.createdAt),
  ],
);
