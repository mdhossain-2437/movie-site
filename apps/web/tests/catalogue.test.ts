import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FIXTURE_COLLECTIONS,
  FIXTURE_PEOPLE,
  FIXTURE_SNAPSHOT_AT,
  FIXTURE_TITLES,
} from "@/lib/catalogue/fixtures";
import {
  deriveAvailability,
  evaluateDisplayActions,
  evaluateTitleAction,
} from "@/lib/catalogue/availability";
import {
  decadeOf,
  formatLifespan,
  formatRuntime,
  joinNames,
  slugify,
} from "@/lib/catalogue/format";
import { normalizeForSearch, sanitizeQuery, searchEntries } from "@/lib/catalogue/search";
import {
  isFixtureCatalogueEnabled,
  resolveEffectiveStage,
  resolveViewerTerritory,
} from "@/lib/catalogue/stage";
import {
  authorizePlayback,
  browseTitles,
  EMPTY_CATALOGUE_PARAM,
  getCollection,
  getGenre,
  getOperationsSnapshot,
  getPerson,
  getSearchIndex,
  getTitle,
  listCollections,
  listDirectors,
  listPeople,
  listTitles,
  parseBrowseFilters,
  searchCatalogue,
  titleStaticParams,
} from "@/lib/catalogue/repository";

afterEach(() => vi.unstubAllEnvs());

describe("development fixture environment boundary", () => {
  it.each(["development", "test"])(
    "allows fixtures only in the explicit %s application stage",
    (stage) => {
      expect(isFixtureCatalogueEnabled({ APP_ENV: stage, NODE_ENV: "production" })).toBe(true);
    },
  );
  it.each(["staging", "production"])("never exposes fixtures in %s", (stage) => {
    expect(isFixtureCatalogueEnabled({ APP_ENV: stage, NODE_ENV: "development" })).toBe(false);
  });
  it("fails closed for a misspelled explicit application stage", () => {
    expect(resolveEffectiveStage({ APP_ENV: "stagin", NODE_ENV: "development" })).toBe(
      "production",
    );
    expect(isFixtureCatalogueEnabled({ APP_ENV: "stagin" })).toBe(false);
  });
  it("uses NODE_ENV only when APP_ENV is absent", () => {
    expect(resolveEffectiveStage({ NODE_ENV: "production" })).toBe("production");
    expect(resolveEffectiveStage({ NODE_ENV: "test" })).toBe("test");
    expect(resolveEffectiveStage({})).toBe("development");
  });
  it("validates the configured territory without inferring worldwide scope or geolocation", () => {
    expect(resolveViewerTerritory({ DEFAULT_TERRITORY: " bd " })).toBe("BD");
    expect(resolveViewerTerritory({ DEFAULT_TERRITORY: "WORLDWIDE" })).toBe("BD");
  });
  it.each(["staging", "production", "misspelled"])(
    "keeps every read model empty in %s",
    (stage) => {
      vi.stubEnv("APP_ENV", stage);
      expect(listTitles()).toEqual([]);
      expect(listPeople()).toEqual([]);
      expect(listCollections()).toEqual([]);
      expect(getSearchIndex()).toEqual([]);
      expect(getTitle("sunrise")).toBeNull();
      expect(getPerson("f-w-murnau")).toBeNull();
      expect(getCollection("german-expressionism")).toBeNull();
      expect(authorizePlayback("sunrise", FIXTURE_SNAPSHOT_AT)).toBeNull();
      expect(titleStaticParams()).toEqual([{ slug: EMPTY_CATALOGUE_PARAM }]);
    },
  );
});

describe("fixture integrity and deny-by-default rights", () => {
  beforeEach(() => vi.stubEnv("APP_ENV", "test"));
  it("has unique, explicitly marked, unpublished references and no seeded approvals", () => {
    expect(new Set(FIXTURE_TITLES.map((title) => title.slug)).size).toBe(FIXTURE_TITLES.length);
    const people = new Set(FIXTURE_PEOPLE.map((person) => person.slug));
    const titles = new Set(FIXTURE_TITLES.map((title) => title.slug));
    for (const title of FIXTURE_TITLES) {
      expect(title.isDevelopmentFixture).toBe(true);
      expect(title.rightsClaim).toBe("PUBLIC_DOMAIN_CLAIM_UNVERIFIED");
      expect(title.artworkProvenance.kind).toBe("ORIGINAL_GENERATED_SVG");
      expect(title.artworkProvenance.filmRightsIncluded).toBe(false);
      expect(title.status).not.toBe("PUBLISHED");
      expect(title.maturityRating).toBe("UNRATED");
      expect(title.runtimeMinutes).toBeGreaterThan(0);
      expect(title.year).toBeGreaterThanOrEqual(1900);
      expect(title.year).toBeLessThanOrEqual(1930);
      for (const credit of title.credits) {
        expect(Boolean(credit.name || credit.person)).toBe(true);
        if (credit.person) expect(people.has(credit.person)).toBe(true);
      }
      for (const grant of title.grants) {
        expect(grant.status).toBe("PENDING");
        expect(grant.evidence).toEqual([]);
        expect(grant.assetId).toBeNull();
        expect(grant.allowedTerritories).toEqual(["BD"]);
        expect(grant.allowedActions).not.toContain("DOWNLOAD");
      }
    }
    for (const collection of FIXTURE_COLLECTIONS) {
      for (const slug of collection.items) expect(titles.has(slug)).toBe(true);
    }
  });
  it("denies every action on every fixture through the central policy engine", () => {
    for (const title of FIXTURE_TITLES) {
      const scope = { territory: "BD", at: FIXTURE_SNAPSHOT_AT };
      expect(deriveAvailability(title, scope)).toBe("rights_pending");
      for (const action of evaluateDisplayActions(title, scope)) {
        expect(action.decision).toMatchObject({ allowed: false, code: "TITLE_NOT_PUBLISHED" });
      }
      expect(evaluateTitleAction(title, "STREAM", { ...scope, territory: "US" }).allowed).toBe(
        false,
      );
      expect(evaluateTitleAction(title, "DOWNLOAD", scope).allowed).toBe(false);
    }
  });
  it("re-evaluates streaming and download independently at the caller’s current instant", () => {
    const at = new Date("2032-01-01T12:00:00Z");
    const result = authorizePlayback("sunrise", at);
    expect(result?.stream.allowed).toBe(false);
    expect(result?.download.allowed).toBe(false);
    expect(result?.evaluatedAt).toBe(at.toISOString());
    expect(
      result?.facts.some((fact) => fact.label === "Playable media asset" && fact.state === "fail"),
    ).toBe(true);
  });
  it("reports genuine fixture metrics, not fabricated production activity", () => {
    const stats = getOperationsSnapshot();
    expect(stats.titleCount).toBe(FIXTURE_TITLES.length);
    expect(stats.pendingRequests).toBe(FIXTURE_TITLES.length);
    expect(stats.approvedGrants).toBe(0);
    expect(stats.publishedCount).toBe(0);
    expect(stats.evidenceDocuments).toBe(0);
  });
  it("projects only client-safe catalogue metadata", () => {
    const serialized = JSON.stringify(getSearchIndex());
    expect(serialized).not.toMatch(
      /sourceObjectKey|manifestUrl|masterUrl|signingKey|evidenceSha256|allowedActions|presigned|https?:\/\//i,
    );
    expect(getSearchIndex().every((entry) => entry.href.startsWith("/"))).toBe(true);
  });
});

describe("catalogue discovery", () => {
  beforeEach(() => vi.stubEnv("APP_ENV", "test"));
  it("resolves titles, collections, genres and linked filmographies", () => {
    expect(getTitle("sunrise")?.directors[0]?.name).toBe("F. W. Murnau");
    expect(getPerson("f-w-murnau")?.films).toHaveLength(5);
    expect(getCollection("german-expressionism")?.titles).toHaveLength(6);
    expect(getGenre("science-fiction")?.titles.length).toBeGreaterThan(0);
    expect(listDirectors().every((person) => person.roles.includes("DIRECTOR"))).toBe(true);
    expect(getTitle("unknown")).toBeNull();
    expect(getPerson("unknown")).toBeNull();
  });
  it("filters by known facets and applies sort/view settings without echoing unknown values", () => {
    const filters = parseBrowseFilters({
      genre: "horror",
      decade: "1920s",
      sort: "year-desc",
      view: "index",
    });
    const titles = browseTitles(filters);
    expect(titles.length).toBeGreaterThan(0);
    expect(
      titles.every((card) => card.genres.includes("Horror") && decadeOf(card.year) === "1920s"),
    ).toBe(true);
    expect(titles[0]!.year).toBeGreaterThanOrEqual(titles.at(-1)!.year);
    const bad = parseBrowseFilters({
      genre: "<script>",
      decade: "2050s",
      country: "worldwide",
      sort: "popularity",
      view: "garbage",
    });
    expect(bad).toEqual({ genre: null, decade: null, country: null, sort: "year", view: "grid" });
  });
  it("sorts alphabetically when requested", () => {
    const titles = browseTitles(parseBrowseFilters({ sort: "title" }));
    expect(titles.map((card) => card.title)).toEqual(
      titles.map((card) => card.title).sort((a, b) => a.localeCompare(b)),
    );
  });
  it("matches Latin accents, Bangla vowel signs, years, genres and people", () => {
    expect(normalizeForSearch("MÉLIÈS")).toBe("melies");
    expect(normalizeForSearch("বাংলা")).toBe("বাংলা");
    expect(searchCatalogue("নসফেরাতু").titles.some((card) => card.slug === "nosferatu")).toBe(true);
    expect(searchCatalogue("Murnau 1927").titles.map((card) => card.slug)).toContain("sunrise");
    expect(
      searchCatalogue("melies").people.some((hit) => hit.entry.slug === "georges-melies"),
    ).toBe(true);
    expect(searchCatalogue("horror").titles.length).toBeGreaterThan(0);
    expect(searchCatalogue("german expressionism").collections.length).toBeGreaterThan(0);
    expect(searchCatalogue("an-unfindable-film-123").total).toBe(0);
  });
  it("ranks exact title matches first and sanitizes query input", () => {
    expect(searchEntries(getSearchIndex(), "Sunrise")[0]?.entry.slug).toBe("sunrise");
    expect(searchEntries(getSearchIndex(), "")).toEqual([]);
    expect(sanitizeQuery(["  nosferatu\u0000 ", "ignored"])).toBe("nosferatu");
    expect(sanitizeQuery("x".repeat(500))).toHaveLength(120);
  });
});

describe("editorial formatting", () => {
  it("formats runtimes without inventing precision or missing metadata", () => {
    expect(formatRuntime(94)).toBe("1h 34m");
    expect(formatRuntime(120)).toBe("2h");
    expect(formatRuntime(13)).toBe("13 min");
    expect(formatRuntime(0)).toBe("Runtime unknown");
    expect(formatRuntime(Number.NaN)).toBe("Runtime unknown");
  });
  it("formats names, life spans and facet slugs", () => {
    expect(formatLifespan(1888, 1931)).toBe("1888–1931");
    expect(formatLifespan(null, null)).toBeNull();
    expect(joinNames(["A", "B", "C"])).toBe("A, B & C");
    expect(slugify("Science fiction")).toBe("science-fiction");
    expect(slugify("Méliès")).toBe("melies");
  });
});
