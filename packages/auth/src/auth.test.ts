// @vitest-environment node
import { createTestDatabase, sessions } from "@movie/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  assertSameOriginRequest,
  authenticateWithPassword,
  computeTotpCode,
  createUserWithRoles,
  generateTotpSecret,
  hashPassword,
  resolveSessionActor,
  revokeSessionByToken,
  verifyPassword,
  verifySessionMfa,
  verifyTotpCode,
} from "./index";

describe("@movie/auth", () => {
  it("hashes and verifies passwords with scrypt and rejects tampered hashes", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(hash.startsWith("$scrypt$")).toBe(true);
    expect(await verifyPassword("correct-horse-battery-staple", hash)).toBe(true);
    expect(await verifyPassword("wrong-password-attempt", hash)).toBe(false);
    await expect(hashPassword("short")).rejects.toThrow(/between 10 and 256/);
  });

  it("generates and validates RFC 6238 TOTP codes", () => {
    const secret = generateTotpSecret();
    const fixedNow = 1_762_000_000_000;
    const validCode = computeTotpCode(secret, fixedNow);
    expect(verifyTotpCode(secret, validCode, fixedNow)).toBe(true);
    expect(verifyTotpCode(secret, "000000", fixedNow) && validCode !== "000000").toBe(false);
  });

  it("enforces same-origin CSRF checks on state-changing HTTP methods", () => {
    const safeGet = new Request("http://localhost:3000/api/v1/auth/session", { method: "GET" });
    expect(() => assertSameOriginRequest(safeGet, "http://localhost:3000")).not.toThrow();

    const missingOriginPost = new Request("http://localhost:3000/api/v1/auth/logout", {
      method: "POST",
    });
    expect(() => assertSameOriginRequest(missingOriginPost, "http://localhost:3000")).toThrow(
      /Missing Origin header/,
    );

    const crossOriginPost = new Request("http://localhost:3000/api/v1/auth/logout", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });
    expect(() => assertSameOriginRequest(crossOriginPost, "http://localhost:3000")).toThrow(
      /Cross-origin/,
    );

    const validPost = new Request("http://localhost:3000/api/v1/auth/logout", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    });
    expect(() => assertSameOriginRequest(validPost, "http://localhost:3000")).not.toThrow();
  });

  it("stores hashed session tokens, rotates tokens on login and MFA step-up, and revokes cleanly", async () => {
    const handle = await createTestDatabase();
    try {
      const totpSecret = generateTotpSecret();
      const created = await createUserWithRoles(handle.db, {
        email: "Admin@Example.org",
        password: "strong-admin-passphrase-2026",
        displayName: "Operations Lead",
        roles: ["ADMIN"],
        enrollTotpSecret: totpSecret,
        requestId: "req_auth_test_1",
      });

      const login1 = await authenticateWithPassword(handle.db, {
        email: "admin@example.org",
        password: "strong-admin-passphrase-2026",
        requestId: "req_auth_test_2",
      });

      // Raw token must never be persisted verbatim in PostgreSQL.
      const storedSession = await handle.db
        .select()
        .from(sessions)
        .where(eq(sessions.id, login1.sessionId));
      expect(storedSession[0]?.tokenHash).not.toBe(login1.rawToken);
      expect(storedSession[0]?.tokenHash).toHaveLength(64);

      // Re-authenticating with previousRawToken revokes the prior session immediately.
      const login2 = await authenticateWithPassword(handle.db, {
        email: "admin@example.org",
        password: "strong-admin-passphrase-2026",
        previousRawToken: login1.rawToken,
        requestId: "req_auth_test_3",
      });
      expect(await resolveSessionActor(handle.db, login1.rawToken)).toBeNull();

      const preMfa = await resolveSessionActor(handle.db, login2.rawToken);
      expect(preMfa?.actor.userId).toBe(created.userId);
      expect(preMfa?.actor.mfaVerified).toBe(false);

      // Step-up MFA rotates the raw session token and marks mfaVerified=true.
      const now = new Date();
      const validTotp = computeTotpCode(totpSecret, now.getTime());
      const steppedUp = await verifySessionMfa(handle.db, {
        rawSessionToken: login2.rawToken,
        totpCode: validTotp,
        requestId: "req_auth_test_4",
        now,
      });
      expect(steppedUp.rawToken).not.toBe(login2.rawToken);
      expect(await resolveSessionActor(handle.db, login2.rawToken, now)).toBeNull();

      const postMfa = await resolveSessionActor(handle.db, steppedUp.rawToken, now);
      expect(postMfa?.actor.mfaVerified).toBe(true);

      // Explicit logout revokes the stepped-up session.
      await revokeSessionByToken(handle.db, steppedUp.rawToken, "req_auth_test_5", now);
      expect(await resolveSessionActor(handle.db, steppedUp.rawToken, now)).toBeNull();
    } finally {
      await handle.close();
    }
  });
});
