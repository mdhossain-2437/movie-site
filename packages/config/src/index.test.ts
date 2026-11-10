import { describe, expect, it } from "vitest";
import { assertTmdbCommercialUseAllowed, parseEnv } from "./index";

describe("@movie/config", () => {
  it("applies safe development defaults when optional variables are omitted", () => {
    const env = parseEnv({ NODE_ENV: "development" });
    expect(env.NODE_ENV).toBe("development");
    expect(env.APP_URL).toBe("http://localhost:3000");
    expect(env.DEFAULT_TERRITORY).toBe("BD");
    expect(env.OBJECT_STORAGE_PROVIDER).toBe("memory");
    expect(env.TMDB_COMMERCIAL_LICENSE_CONFIRMED).toBe(false);
  });

  it("fails fast in production when required secrets or database URL are missing", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "production",
        APP_URL: "https://cinema.example.com",
        OBJECT_STORAGE_PROVIDER: "r2",
      }),
    ).toThrow(/DATABASE_URL is required when NODE_ENV=production/);
  });

  it("rejects reusing SESSION_SECRET as MEDIA_SIGNING_SECRET in production", () => {
    const sharedSecret = "a".repeat(40);
    expect(() =>
      parseEnv({
        NODE_ENV: "production",
        APP_URL: "https://cinema.example.com",
        DATABASE_URL: "postgresql://user:pass@db.internal:5432/movies",
        OBJECT_STORAGE_PROVIDER: "r2",
        SESSION_SECRET: sharedSecret,
        MEDIA_SIGNING_SECRET: sharedSecret,
      }),
    ).toThrow(/MEDIA_SIGNING_SECRET must be independent from SESSION_SECRET/);
  });

  it("rejects memory storage adapter and placeholder origins in production", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "production",
        APP_URL: "https://example.invalid",
        DATABASE_URL: "postgresql://user:pass@db.internal:5432/movies",
        OBJECT_STORAGE_PROVIDER: "memory",
        SESSION_SECRET: "a".repeat(40),
        MEDIA_SIGNING_SECRET: "b".repeat(40),
      }),
    ).toThrow(/In-memory storage adapter cannot be used in production/);
  });

  it("blocks commercial TMDb usage unless TMDB_COMMERCIAL_LICENSE_CONFIRMED is true", () => {
    expect(() =>
      assertTmdbCommercialUseAllowed(
        { TMDB_API_KEY: "test_key", TMDB_COMMERCIAL_LICENSE_CONFIRMED: false },
        { isCommercialDeployment: true },
      ),
    ).toThrow(/TMDb commercial use is blocked/);

    expect(() =>
      assertTmdbCommercialUseAllowed(
        { TMDB_API_KEY: "test_key", TMDB_COMMERCIAL_LICENSE_CONFIRMED: true },
        { isCommercialDeployment: true },
      ),
    ).not.toThrow();

    expect(() =>
      assertTmdbCommercialUseAllowed(
        {
          TMDB_READ_ACCESS_TOKEN: "test_bearer_token",
          TMDB_COMMERCIAL_LICENSE_CONFIRMED: false,
        },
        { isCommercialDeployment: false },
      ),
    ).not.toThrow();
  });

  it("allows OMDB_API_KEY to be omitted, empty, or provided", () => {
    const omitted = parseEnv({ NODE_ENV: "development" });
    expect(omitted.OMDB_API_KEY).toBeUndefined();

    const empty = parseEnv({ NODE_ENV: "development", OMDB_API_KEY: "" });
    expect(empty.OMDB_API_KEY).toBeUndefined();

    const populated = parseEnv({ NODE_ENV: "development", OMDB_API_KEY: "test_omdb_key" });
    expect(populated.OMDB_API_KEY).toBe("test_omdb_key");
  });
});
