import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { redactSensitive, redactString } from "@movie/observability";
import { clearOmdbCache, getOmdbRatings } from "../lib/metadata/omdb-client";

describe("Milestone 2 Challenger: Secret Hygiene & OMDb Client Robustness", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    clearOmdbCache();
    process.env = { ...originalEnv, OMDB_API_KEY: "adversarial_test_key_999" };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("1. Secret Hygiene & Observability Redaction Verification", () => {
    it("redacts apikey when it is the first query parameter", () => {
      const url = "https://www.omdbapi.com/?apikey=secret123&i=tt3896198";
      expect(redactString(url)).toBe("https://www.omdbapi.com/?apikey=[REDACTED]&i=tt3896198");
    });

    it("redacts apikey when it is an intermediate query parameter", () => {
      const url = "https://www.omdbapi.com/?plot=full&apikey=secret123&i=tt3896198";
      expect(redactString(url)).toBe(
        "https://www.omdbapi.com/?plot=full&apikey=[REDACTED]&i=tt3896198",
      );
    });

    it("redacts apikey when it is the last query parameter", () => {
      const url = "https://www.omdbapi.com/?i=tt3896198&apikey=secret123";
      expect(redactString(url)).toBe("https://www.omdbapi.com/?i=tt3896198&apikey=[REDACTED]");
    });

    it("redacts api_key and apikey regardless of case", () => {
      const url1 = "https://www.omdbapi.com/?APIKEY=secret123&t=Inception";
      const url2 = "https://api.themoviedb.org/3/movie/550?api_key=secret456&language=en-US";
      expect(redactString(url1)).toBe("https://www.omdbapi.com/?APIKEY=[REDACTED]&t=Inception");
      expect(redactString(url2)).toBe(
        "https://api.themoviedb.org/3/movie/550?api_key=[REDACTED]&language=en-US",
      );
    });

    it("redacts secrets inside complex nested log context objects and error messages", () => {
      const complexContext = {
        requestUrl: "https://www.omdbapi.com/?apikey=secret789&i=tt0111161",
        omdbApiKey: "raw-api-key-value",
        nested: {
          apikey: "inner-secret",
          omdb_api_key: "nested-secret",
          tokens: ["token=sensitive-val", "normal-string"],
        },
        error: new Error("Failed fetching https://www.omdbapi.com/?apikey=secret789"),
      };

      const redacted = redactSensitive(complexContext) as {
        requestUrl: string;
        omdbApiKey: string;
        nested: { apikey: string; omdb_api_key: string };
        error: Error;
      };
      expect(redacted.requestUrl).toBe("https://www.omdbapi.com/?apikey=[REDACTED]&i=tt0111161");
      expect(redacted.omdbApiKey).toBe("[REDACTED]");
      expect(redacted.nested.apikey).toBe("[REDACTED]");
      expect(redacted.nested.omdb_api_key).toBe("[REDACTED]");
      expect(redacted.error.message).toBe(
        "Failed fetching https://www.omdbapi.com/?apikey=[REDACTED]",
      );
    });
  });

  describe("2. OMDb Robustness: Missing or Empty API Key", () => {
    it("returns null and does not fetch when OMDB_API_KEY is undefined", async () => {
      delete process.env.OMDB_API_KEY;
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const result = await getOmdbRatings("tt3896198");
      expect(result).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("returns null and does not fetch when OMDB_API_KEY is empty string", async () => {
      process.env.OMDB_API_KEY = "";
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const result = await getOmdbRatings("tt3896198");
      expect(result).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("returns null and does not fetch when OMDB_API_KEY is whitespace only", async () => {
      process.env.OMDB_API_KEY = "    ";
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const result = await getOmdbRatings("tt3896198");
      expect(result).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("3. OMDb Robustness: Non-Existent IMDb ID & Identifiers", () => {
    it("returns null when upstream responds with Movie not found (Response: False)", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ Response: "False", Error: "Movie not found!" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await getOmdbRatings("tt9999999");
      expect(result).toBeNull();
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("returns null without fetching when neither clean ID nor clean Title is provided", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      expect(await getOmdbRatings(undefined, undefined)).toBeNull();
      expect(await getOmdbRatings(null, null)).toBeNull();
      expect(await getOmdbRatings("", "")).toBeNull();
      expect(await getOmdbRatings("   ", "   ")).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("falls back to Title when IMDb ID is invalid format and does not throw", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            Response: "True",
            Title: "Inception",
            Year: "2010",
            imdbRating: "8.8",
            imdbVotes: "2,000,000",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const result = await getOmdbRatings("not-a-valid-id", "Inception", 2010);
      expect(result).toEqual({
        imdbRating: "8.8",
        imdbVotes: "2,000,000",
        metascore: null,
        rottenTomatoes: null,
      });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("returns null when both IMDb ID and Title fallback return Response: False", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ Response: "False", Error: "Incorrect IMDb ID." }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ Response: "False", Error: "Movie not found!" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );

      const result = await getOmdbRatings("tt0000000", "NonExistentMovie", 2099);
      expect(result).toBeNull();
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("4. OMDb Robustness: Upstream Timeouts & Network Failures", () => {
    it("handles AbortError timeout gracefully and returns null without throwing", async () => {
      const abortError = new DOMException(
        "The operation was aborted due to timeout",
        "TimeoutError",
      );
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(abortError);

      const result = await getOmdbRatings("tt3896198");
      expect(result).toBeNull();
    });

    it("handles generic network rejection gracefully and returns null without throwing", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new TypeError("Failed to fetch"));

      const result = await getOmdbRatings("tt3896198");
      expect(result).toBeNull();
    });

    it("verifies request signal timeout is configured on fetch", async () => {
      let passedSignal: AbortSignal | null | undefined = null;
      vi.spyOn(globalThis, "fetch").mockImplementationOnce(async (_input, init) => {
        passedSignal = init?.signal;
        return new Response(JSON.stringify({ Response: "True", imdbRating: "8.0" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });

      await getOmdbRatings("tt3896198");
      expect(passedSignal).toBeDefined();
      expect(passedSignal).toBeInstanceOf(AbortSignal);
    });
  });

  describe("5. OMDb Robustness: HTTP Non-200 Status Codes", () => {
    it.each([400, 401, 403, 404, 500, 502, 503, 504])(
      "returns null without throwing when upstream returns HTTP status %i",
      async (statusCode) => {
        vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
          new Response(`HTTP Error ${statusCode}`, {
            status: statusCode,
            statusText: "Upstream Error",
          }),
        );

        const result = await getOmdbRatings("tt3896198");
        expect(result).toBeNull();
      },
    );
  });

  describe("6. OMDb Robustness: Malformed JSON & Structural Anomalies", () => {
    it("handles non-JSON HTML error body gracefully and returns null", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("<!DOCTYPE html><html><body>502 Bad Gateway</body></html>", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }),
      );

      const result = await getOmdbRatings("tt3896198");
      expect(result).toBeNull();
    });

    it("handles truncated/invalid JSON gracefully and returns null", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response('{"Response":"True", "Title": "Truncat', {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await getOmdbRatings("tt3896198");
      expect(result).toBeNull();
    });

    it("handles empty response body gracefully and returns null", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await getOmdbRatings("tt3896198");
      expect(result).toBeNull();
    });

    it("handles JSON primitives (number, string, boolean) gracefully without throwing", async () => {
      for (const primitive of [123, "string-only", true, false]) {
        vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
          new Response(JSON.stringify(primitive), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
        const result = await getOmdbRatings("tt3896198");
        expect(result).toBeNull();
      }
    });

    it("handles JSON array instead of object gracefully without throwing", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify([{ item: 1 }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await getOmdbRatings("tt3896198");
      expect(result).toBeNull();
    });

    it("handles Ratings array containing null, undefined, or malformed entries", async () => {
      const payloadWithMalformedRatings = {
        Response: "True",
        Title: "Edge Case Film",
        imdbRating: "7.0",
        Ratings: [
          null as unknown as { Source: string; Value: string },
          undefined as unknown as { Source: string; Value: string },
          {} as unknown as { Source: string; Value: string },
          { Source: null as unknown as string, Value: null as unknown as string },
          { Source: "Rotten Tomatoes", Value: "88%" },
        ],
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(payloadWithMalformedRatings), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      // Verify whether this throws or handles gracefully
      let result: Awaited<ReturnType<typeof getOmdbRatings>> | null = null;
      let errorThrown: unknown = null;
      try {
        result = await getOmdbRatings("tt3896198");
      } catch (err) {
        errorThrown = err;
      }

      // Check the behavior: verify whether it threw
      expect(errorThrown).toBeNull();
      expect(result).not.toBeNull();
      expect(result?.imdbRating).toBe("7.0");
      expect(result?.rottenTomatoes).toBe("88%");
    });
  });

  describe("7. OMDb Robustness: Missing Scores & 'N/A' Score Normalization", () => {
    it("returns null when all score fields are 'N/A'", async () => {
      const mockPayload = {
        Response: "True",
        imdbRating: "N/A",
        imdbVotes: "N/A",
        Metascore: "N/A",
        Ratings: [
          { Source: "Internet Movie Database", Value: "N/A" },
          { Source: "Rotten Tomatoes", Value: "N/A" },
          { Source: "Metacritic", Value: "N/A" },
        ],
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await getOmdbRatings("tt3896198");
      expect(result).toBeNull();
    });

    it("returns null when all score fields are empty strings or whitespace", async () => {
      const mockPayload = {
        Response: "True",
        imdbRating: "   ",
        imdbVotes: "",
        Metascore: "  ",
        Ratings: [{ Source: "Rotten Tomatoes", Value: " " }],
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await getOmdbRatings("tt3896198");
      expect(result).toBeNull();
    });

    it("returns null when all score fields are string literals 'undefined' or 'null'", async () => {
      const mockPayload = {
        Response: "True",
        imdbRating: "undefined",
        imdbVotes: "null",
        Metascore: "undefined",
        Ratings: [{ Source: "Rotten Tomatoes", Value: "null" }],
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await getOmdbRatings("tt3896198");
      expect(result).toBeNull();
    });

    it("normalizes correctly when only one score (e.g. Rotten Tomatoes) is present", async () => {
      const mockPayload = {
        Response: "True",
        imdbRating: "N/A",
        imdbVotes: "N/A",
        Metascore: "N/A",
        Ratings: [{ Source: "Rotten Tomatoes", Value: "94%" }],
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await getOmdbRatings("tt3896198");
      expect(result).toEqual({
        imdbRating: null,
        imdbVotes: null,
        metascore: null,
        rottenTomatoes: "94%",
      });
    });

    it("normalizes Metacritic score correctly from Ratings array when Metascore is N/A", async () => {
      const mockPayload = {
        Response: "True",
        imdbRating: "N/A",
        Metascore: "N/A",
        Ratings: [{ Source: "Metacritic", Value: "82/100" }],
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await getOmdbRatings("tt3896198");
      expect(result).toEqual({
        imdbRating: null,
        imdbVotes: null,
        metascore: "82",
        rottenTomatoes: null,
      });
    });
  });

  describe("8. OMDb Cache Capacity & Boundary Inputs", () => {
    it("handles year boundary limits (ignores year < 1880 or > 2100)", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ Response: "False", Error: "Movie not found!" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      await getOmdbRatings(null, "Ancient Movie", 1800);
      const url1 = new URL(fetchSpy.mock.calls[0]![0] as string);
      expect(url1.searchParams.has("y")).toBe(false);

      await getOmdbRatings(null, "Future Movie", 2500);
      const url2 = new URL(fetchSpy.mock.calls[1]![0] as string);
      expect(url2.searchParams.has("y")).toBe(false);

      await getOmdbRatings(null, "Valid Year Movie", 2024);
      const url3 = new URL(fetchSpy.mock.calls[2]![0] as string);
      expect(url3.searchParams.get("y")).toBe("2024");
    });

    it("evicts oldest cache entries when reaching MAX_CACHE_ENTRIES limit (500)", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(
        async () =>
          new Response(JSON.stringify({ Response: "False", Error: "Not found" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      );

      // Insert 505 entries to verify FIFO eviction without memory leak
      for (let i = 0; i < 505; i++) {
        await getOmdbRatings(`tt${String(i).padStart(7, "0")}`);
      }

      // First entry tt0000000 should have been evicted
      const fetchSpy = vi.spyOn(globalThis, "fetch");
      await getOmdbRatings("tt0000000");
      expect(fetchSpy).toHaveBeenCalled();
    });

    it("verifies behavior when non-string arguments are supplied at runtime", async () => {
      let errorThrown: unknown = null;
      try {
        await getOmdbRatings(1234567 as unknown as string, null);
      } catch (err) {
        errorThrown = err;
      }

      // If getOmdbRatings threw an uncaught error on non-string inputs, assert it
      expect(errorThrown).toBeNull();
    });
  });
});
