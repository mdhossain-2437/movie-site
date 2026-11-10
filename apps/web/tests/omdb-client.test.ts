import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearOmdbCache, getOmdbRatings } from "../lib/metadata/omdb-client";

describe("OMDb Metadata Client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    clearOmdbCache();
    process.env = { ...originalEnv, OMDB_API_KEY: "test_omdb_key_123" };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("returns null immediately when OMDB_API_KEY is not configured or empty", async () => {
    process.env.OMDB_API_KEY = "";
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await getOmdbRatings("tt3896198");
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();

    delete process.env.OMDB_API_KEY;
    const result2 = await getOmdbRatings("tt3896198");
    expect(result2).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns null immediately when neither imdbId nor title are provided", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await getOmdbRatings(null, null);
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();

    const result2 = await getOmdbRatings("   ", "");
    expect(result2).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("normalizes a full valid OMDb ratings payload", async () => {
    const mockPayload = {
      Response: "True",
      Title: "Guardians of the Galaxy Vol. 2",
      Year: "2017",
      imdbRating: "7.6",
      imdbVotes: "754,231",
      Metascore: "67",
      Ratings: [
        { Source: "Internet Movie Database", Value: "7.6/10" },
        { Source: "Rotten Tomatoes", Value: "85%" },
        { Source: "Metacritic", Value: "67/100" },
      ],
      imdbID: "tt3896198",
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const ratings = await getOmdbRatings("tt3896198");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(ratings).toEqual({
      imdbRating: "7.6",
      imdbVotes: "754,231",
      metascore: "67",
      rottenTomatoes: "85%",
    });

    const calledUrl = new URL(fetchSpy.mock.calls[0]![0] as string);
    expect(calledUrl.origin).toBe("https://www.omdbapi.com");
    expect(calledUrl.searchParams.get("apikey")).toBe("test_omdb_key_123");
    expect(calledUrl.searchParams.get("i")).toBe("tt3896198");
  });

  it("normalizes N/A and absent rating values to null", async () => {
    const mockPayload = {
      Response: "True",
      Title: "Indie Short",
      Year: "2024",
      imdbRating: "N/A",
      imdbVotes: "N/A",
      Metascore: "N/A",
      Ratings: [{ Source: "Internet Movie Database", Value: "N/A" }],
      imdbID: "tt9999999",
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const ratings = await getOmdbRatings("tt9999999");
    expect(ratings).toBeNull();
  });

  it("handles fallback to Title and Year when IMDb ID is missing or returns Response False", async () => {
    const notFoundPayload = {
      Response: "False",
      Error: "Incorrect IMDb ID.",
    };

    const foundByTitlePayload = {
      Response: "True",
      Title: "The Last Monsoon",
      Year: "2024",
      imdbRating: "8.2",
      imdbVotes: "1,200",
      Metascore: "74",
      Ratings: [
        { Source: "Internet Movie Database", Value: "8.2/10" },
        { Source: "Rotten Tomatoes", Value: "91%" },
      ],
      imdbID: "tt1234567",
    };

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify(notFoundPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(foundByTitlePayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const ratings = await getOmdbRatings("tt0000000", "The Last Monsoon", 2024);
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    const secondUrl = new URL(fetchSpy.mock.calls[1]![0] as string);
    expect(secondUrl.searchParams.get("t")).toBe("The Last Monsoon");
    expect(secondUrl.searchParams.get("y")).toBe("2024");

    expect(ratings).toEqual({
      imdbRating: "8.2",
      imdbVotes: "1,200",
      metascore: "74",
      rottenTomatoes: "91%",
    });
  });

  it("falls back to title when IMDb ID is not formatted as tt identifier", async () => {
    const foundByTitlePayload = {
      Response: "True",
      Title: "The Last Monsoon",
      Year: "2024",
      imdbRating: "8.5",
      imdbVotes: "500",
      Metascore: "N/A",
      Ratings: [],
      imdbID: "tt1234567",
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(foundByTitlePayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const ratings = await getOmdbRatings("invalid_id", "The Last Monsoon", 2024);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const url = new URL(fetchSpy.mock.calls[0]![0] as string);
    expect(url.searchParams.get("t")).toBe("The Last Monsoon");
    expect(ratings?.imdbRating).toBe("8.5");
  });

  it("handles upstream HTTP 500 without throwing and returns null", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 }),
    );

    const ratings = await getOmdbRatings("tt3896198");
    expect(ratings).toBeNull();
  });

  it("handles network failure or timeout without throwing and returns null", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network connection reset"));

    const ratings = await getOmdbRatings("tt3896198");
    expect(ratings).toBeNull();
  });

  it("caches successful ratings in-memory to prevent duplicate requests", async () => {
    const mockPayload = {
      Response: "True",
      Title: "Cache Test",
      Year: "2024",
      imdbRating: "8.0",
      imdbVotes: "100",
      Metascore: "60",
      Ratings: [],
      imdbID: "tt7654321",
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const first = await getOmdbRatings("tt7654321");
    const second = await getOmdbRatings("tt7654321");

    expect(first).toEqual(second);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
