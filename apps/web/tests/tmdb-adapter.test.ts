import { describe, expect, it } from "vitest";
import {
  buildDeterministicArtSpecForTmdbId,
  TMDB_GENRE_PRESETS,
  TMDB_STUDIO_PRESETS,
  toSameOriginTmdbImagePath,
} from "../lib/metadata/tmdb-types";

describe("TMDB metadata adapter types & SSRF-safe artwork path validator", () => {
  it("converts valid TMDB image paths into same-origin /api/v1/tmdb/image URLs and rejects traversal/external/SVG vectors", () => {
    expect(toSameOriginTmdbImagePath("/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg", "w500")).toBe(
      "/api/v1/tmdb/image/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    );
    expect(toSameOriginTmdbImagePath("poster_01.webp", "w342")).toBe(
      "/api/v1/tmdb/image/w342/poster_01.webp",
    );

    // Reject path traversal, subdirectories, external origins, and SVG script vectors
    expect(toSameOriginTmdbImagePath("../etc/passwd.jpg", "w500")).toBeNull();
    expect(toSameOriginTmdbImagePath("/nested/path/file.jpg", "w500")).toBeNull();
    expect(toSameOriginTmdbImagePath("https://evil.example/a.jpg", "w500")).toBeNull();
    expect(toSameOriginTmdbImagePath("/payload.svg", "w500")).toBeNull();
    expect(toSameOriginTmdbImagePath(null, "w500")).toBeNull();
  });

  it("includes official TMDB studio company IDs for Marvel, DC, Sony, 20th Century, and Warner Bros.", () => {
    const bySlug = new Map(TMDB_STUDIO_PRESETS.map((s) => [s.slug, s]));
    expect(bySlug.get("marvel")?.companyIds).toContain("420");
    expect(bySlug.get("dc")?.companyIds).toContain("128064");
    expect(bySlug.get("sony")?.companyIds).toContain("34");
    expect(bySlug.get("fox")?.companyIds).toContain("127928");
    expect(bySlug.get("warner")?.companyIds).toContain("174");
    expect(TMDB_GENRE_PRESETS.length).toBeGreaterThanOrEqual(8);
  });

  it("builds deterministic fallback KeyArt specs for offline or posterless TMDB records", () => {
    const first = buildDeterministicArtSpecForTmdbId(693134);
    const second = buildDeterministicArtSpecForTmdbId(693134);
    expect(first).toEqual(second);
    expect(first.palette.accent).toMatch(/^#/);
  });
});
