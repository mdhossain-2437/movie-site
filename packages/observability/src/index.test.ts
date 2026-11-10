import { describe, expect, it } from "vitest";
import { createLogger, createRequestId, redactSensitive, redactString } from "./index";

describe("@movie/observability", () => {
  it("redacts passwords, tokens, OAuth refresh tokens, cookies, and private object keys", () => {
    const raw = {
      actorId: "usr_01",
      password: "super-secret-password",
      refreshToken: "1//0gsecret-google-refresh-token",
      authorization: "Bearer secret-session-token",
      cookie: "session=abc123; csrf=xyz",
      signedUrl: "https://r2.internal/bucket/obj?X-Amz-Signature=deadbeef1234",
      sourceObjectKey: "quarantine/ast_1/upl_1/source.bin",
      nested: {
        playbackToken: "playback-secret-value",
        contentKey: "00112233445566778899aabbccddeeff",
      },
    };

    const sanitized = JSON.stringify(redactSensitive(raw));
    expect(sanitized).toContain('"actorId":"usr_01"');
    expect(sanitized).not.toContain("super-secret-password");
    expect(sanitized).not.toContain("1//0gsecret-google-refresh-token");
    expect(sanitized).not.toContain("secret-session-token");
    expect(sanitized).not.toContain("session=abc123");
    expect(sanitized).not.toContain("deadbeef1234");
    expect(sanitized).not.toContain("quarantine/ast_1/upl_1/source.bin");
    expect(sanitized).not.toContain("playback-secret-value");
    expect(sanitized).not.toContain("00112233445566778899aabbccddeeff");
  });

  it("scrubs inline JWTs, Bearer headers, and presigned query parameters from free-form log messages", () => {
    const lines: string[] = [];
    const logger = createLogger({
      service: "@movie/test",
      environment: "test",
      sink: (line) => lines.push(line),
    });

    const sampleJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfMDEiLCJhc3NldCI6ImFzdF8wMSJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    logger.warn(
      `Upstream failed for https://cdn.example.com/seg-01.m4s?token=secret123&X-Amz-Signature=sig999 with ${sampleJwt} and Bearer rawBearer987`,
      { requestId: createRequestId() },
    );

    expect(lines).toHaveLength(1);
    const line = lines[0]!;
    expect(line).not.toContain("secret123");
    expect(line).not.toContain("sig999");
    expect(line).not.toContain(sampleJwt);
    expect(line).not.toContain("rawBearer987");
    expect(line).toContain("[REDACTED]");
  });

  it("redacts OMDb and general apikey query parameters and context keys", () => {
    const rawUrl = "https://www.omdbapi.com/?apikey=super-secret-key&i=tt3896198";
    expect(redactString(rawUrl)).toBe("https://www.omdbapi.com/?apikey=[REDACTED]&i=tt3896198");

    const secondaryUrl = "https://www.omdbapi.com/?i=tt3896198&apikey=super-secret-key";
    expect(redactString(secondaryUrl)).toBe(
      "https://www.omdbapi.com/?i=tt3896198&apikey=[REDACTED]",
    );

    const rawObj = {
      omdbApiKey: "super-secret-key",
      nested: {
        apikey: "another-secret",
        omdb_api_key: "third-secret",
      },
    };
    const sanitized = redactSensitive(rawObj) as Record<string, unknown>;
    expect(sanitized.omdbApiKey).toBe("[REDACTED]");
    expect((sanitized.nested as Record<string, unknown>).apikey).toBe("[REDACTED]");
    expect((sanitized.nested as Record<string, unknown>).omdb_api_key).toBe("[REDACTED]");
  });
});
