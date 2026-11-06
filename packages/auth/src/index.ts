import crypto from "node:crypto";
import type { Role } from "@movie/contracts";
import {
  mfaFactors,
  type MovieDatabase,
  newEntityId,
  recordAuditEvent,
  sessions,
  userRoles,
  users,
} from "@movie/db";
import { type ActorIdentity, AuthorizationError } from "@movie/domain";
import { and, desc, eq, gt, isNull } from "drizzle-orm";

function deriveScryptKey(
  password: string,
  salt: Buffer,
  keylen: number,
  options: crypto.ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

const SCRYPT_N = 32_768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;
const SCRYPT_MAXMEM = 64 * 1024 * 1024;

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 10 || password.length > 256) {
    throw new Error("Password must be between 10 and 256 characters");
  }
  const salt = crypto.randomBytes(16);
  const derived = await deriveScryptKey(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  });

  return `$scrypt$n=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const parts = encoded.split("$");
  // ["", "scrypt", "n=...,r=...,p=...", "<salt>", "<hash>"]
  if (parts.length !== 5 || parts[1] !== "scrypt") {
    return false;
  }
  const paramStr = parts[2] ?? "";
  const saltB64 = parts[3] ?? "";
  const hashB64 = parts[4] ?? "";

  const params = Object.fromEntries(
    paramStr.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k, Number(v)];
    }),
  );
  if (!params.n || !params.r || !params.p) {
    return false;
  }

  const salt = Buffer.from(saltB64, "base64url");
  const expected = Buffer.from(hashB64, "base64url");
  if (salt.length < 16 || expected.length < 32) {
    return false;
  }

  const derived = await deriveScryptKey(password, salt, expected.length, {
    N: params.n,
    r: params.r,
    p: params.p,
    maxmem: SCRYPT_MAXMEM,
  });

  if (derived.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(derived, expected);
}

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function encodeBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return out;
}

export function decodeBase32(encoded: string): Buffer {
  const cleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generateTotpSecret(): string {
  return encodeBase32(crypto.randomBytes(20));
}

export function computeTotpCode(secretBase32: string, timestampMs: number = Date.now()): string {
  const key = decodeBase32(secretBase32);
  const step = Math.floor(timestampMs / 1000 / 30);
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));

  const digest = crypto.createHmac("sha1", key).update(counter).digest();
  const offset = (digest[digest.length - 1] ?? 0) & 0x0f;
  const binary =
    (((digest[offset] ?? 0) & 0x7f) << 24) |
    (((digest[offset + 1] ?? 0) & 0xff) << 16) |
    (((digest[offset + 2] ?? 0) & 0xff) << 8) |
    ((digest[offset + 3] ?? 0) & 0xff);

  return String(binary % 1_000_000).padStart(6, "0");
}

export function verifyTotpCode(
  secretBase32: string,
  code: string,
  timestampMs: number = Date.now(),
): boolean {
  const normalized = code.trim();
  if (!/^\d{6}$/.test(normalized)) {
    return false;
  }
  const codeBuf = Buffer.from(normalized, "utf8");
  for (const drift of [-1, 0, 1]) {
    const candidate = Buffer.from(
      computeTotpCode(secretBase32, timestampMs + drift * 30_000),
      "utf8",
    );
    if (crypto.timingSafeEqual(codeBuf, candidate)) {
      return true;
    }
  }
  return false;
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashSessionToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export function getSessionCookieName(appUrl: string): string {
  return appUrl.startsWith("https://") ? "__Host-cg_session" : "cg_session";
}

export function buildSessionCookieOptions(appUrl: string, expiresAt: Date) {
  const secure = appUrl.startsWith("https://");
  return {
    name: getSessionCookieName(appUrl),
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export function assertSameOriginRequest(request: Request, allowedOrigin: string): void {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return;
  }
  const originHeader = request.headers.get("origin");
  if (!originHeader) {
    throw new AuthorizationError("FORBIDDEN", "Missing Origin header on state-changing request");
  }
  let parsedOrigin: string;
  let expectedOrigin: string;
  try {
    parsedOrigin = new URL(originHeader).origin;
    expectedOrigin = new URL(allowedOrigin).origin;
  } catch {
    throw new AuthorizationError("FORBIDDEN", "Malformed Origin header");
  }

  const hostHeader = request.headers.get("host");
  const requestHostOrigin = hostHeader
    ? `${parsedOrigin.startsWith("https:") ? "https" : "http"}://${hostHeader}`
    : null;

  if (parsedOrigin !== expectedOrigin && parsedOrigin !== requestHostOrigin) {
    throw new AuthorizationError("FORBIDDEN", "Cross-origin state-changing request rejected");
  }
}

export interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
  roles?: Role[];
  enrollTotpSecret?: string;
  requestId: string;
}

export async function createUserWithRoles(db: MovieDatabase, input: CreateUserInput) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);
  const userId = newEntityId("usr");
  const assignedRoles: Role[] = input.roles && input.roles.length > 0 ? input.roles : ["VIEWER"];

  await db.transaction(async (tx) => {
    const txDb = tx as unknown as MovieDatabase;
    await txDb.insert(users).values({
      id: userId,
      email: normalizedEmail,
      passwordHash,
      displayName: input.displayName.trim(),
      status: "ACTIVE",
    });

    for (const role of assignedRoles) {
      await txDb.insert(userRoles).values({
        id: newEntityId("url"),
        userId,
        role,
      });
    }

    if (input.enrollTotpSecret) {
      await txDb.insert(mfaFactors).values({
        id: newEntityId("mfa"),
        userId,
        kind: "TOTP",
        secretBase32: input.enrollTotpSecret,
        verifiedAt: new Date(),
      });
    }

    await recordAuditEvent(txDb, {
      actor: { userId, roles: assignedRoles, status: "ACTIVE" },
      action: "auth.user.create",
      targetType: "user",
      targetId: userId,
      requestId: input.requestId,
      metadata: { roles: assignedRoles, mfaEnrolled: Boolean(input.enrollTotpSecret) },
    });
  });

  return { userId, email: normalizedEmail, roles: assignedRoles };
}

export async function authenticateWithPassword(
  db: MovieDatabase,
  input: {
    email: string;
    password: string;
    userAgent?: string | null;
    previousRawToken?: string | null;
    requestId: string;
    now?: Date;
  },
) {
  const now = input.now ?? new Date();
  const normalizedEmail = input.email.trim().toLowerCase();

  const userRows = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  const user = userRows[0];

  // Mitigate user-enumeration timing skew when email is unknown.
  if (!user) {
    await hashPassword("timing_equalization_placeholder_secret");
    throw new AuthorizationError("UNAUTHENTICATED", "Invalid email or password");
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AuthorizationError("UNAUTHENTICATED", "Invalid email or password");
  }
  if (user.status !== "ACTIVE") {
    throw new AuthorizationError("FORBIDDEN", "Account is suspended");
  }

  // Session rotation: revoke any prior token presented on login.
  if (input.previousRawToken) {
    const prevHash = hashSessionToken(input.previousRawToken);
    await db
      .update(sessions)
      .set({ revokedAt: now })
      .where(and(eq(sessions.tokenHash, prevHash), isNull(sessions.revokedAt)));
  }

  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const sessionId = newEntityId("ses");
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  const roleRows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, user.id));
  const roles = roleRows.map((r) => r.role);

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    tokenHash,
    userAgent: input.userAgent?.slice(0, 256) ?? null,
    expiresAt,
    createdAt: now,
    lastSeenAt: now,
  });

  await recordAuditEvent(db, {
    actor: { userId: user.id, roles, status: user.status, mfaVerified: false },
    action: "auth.session.login",
    targetType: "session",
    targetId: sessionId,
    requestId: input.requestId,
  });

  return {
    sessionId,
    rawToken,
    expiresAt,
    actor: {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      roles,
      status: user.status,
      mfaVerified: false,
    },
  };
}

export async function verifySessionMfa(
  db: MovieDatabase,
  input: {
    rawSessionToken: string;
    totpCode: string;
    requestId: string;
    now?: Date;
  },
) {
  const now = input.now ?? new Date();
  const currentHash = hashSessionToken(input.rawSessionToken);

  const sessionRows = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.tokenHash, currentHash),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
      ),
    )
    .limit(1);

  const session = sessionRows[0];
  if (!session) {
    throw new AuthorizationError("UNAUTHENTICATED", "Active session required for MFA verification");
  }

  const factors = await db.select().from(mfaFactors).where(eq(mfaFactors.userId, session.userId));
  const factor = factors[0];
  if (!factor) {
    throw new AuthorizationError("FORBIDDEN", "No MFA factor is enrolled on this account");
  }

  if (!verifyTotpCode(factor.secretBase32, input.totpCode, now.getTime())) {
    throw new AuthorizationError("FORBIDDEN", "Invalid multi-factor authentication code");
  }

  // Rotate session token on privilege elevation (MFA step-up).
  const rotatedRawToken = generateSessionToken();
  const rotatedHash = hashSessionToken(rotatedRawToken);

  await db
    .update(sessions)
    .set({
      tokenHash: rotatedHash,
      mfaVerifiedAt: now,
      lastSeenAt: now,
    })
    .where(eq(sessions.id, session.id));

  const roleRows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, session.userId));

  await recordAuditEvent(db, {
    actor: {
      userId: session.userId,
      roles: roleRows.map((r) => r.role),
      status: "ACTIVE",
      mfaVerified: true,
    },
    action: "auth.session.mfa_verified",
    targetType: "session",
    targetId: session.id,
    requestId: input.requestId,
  });

  return {
    sessionId: session.id,
    rawToken: rotatedRawToken,
    expiresAt: session.expiresAt,
    mfaVerified: true,
  };
}

export interface ResolvedSessionInfo {
  sessionId: string;
  email: string;
  displayName: string;
  actor: ActorIdentity;
  expiresAt: Date;
}

export async function resolveSessionActor(
  db: MovieDatabase,
  rawToken: string | null | undefined,
  now: Date = new Date(),
): Promise<ResolvedSessionInfo | null> {
  if (!rawToken || rawToken.length < 20) {
    return null;
  }
  const tokenHash = hashSessionToken(rawToken);
  const rows = await db
    .select({
      sessionId: sessions.id,
      userId: users.id,
      email: users.email,
      displayName: users.displayName,
      status: users.status,
      mfaVerifiedAt: sessions.mfaVerifiedAt,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row || row.status !== "ACTIVE") {
    return null;
  }

  const roleRows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, row.userId));

  const roles: Role[] = roleRows.length > 0 ? roleRows.map((r) => r.role) : ["VIEWER"];

  return {
    sessionId: row.sessionId,
    email: row.email,
    displayName: row.displayName,
    expiresAt: row.expiresAt,
    actor: {
      userId: row.userId,
      roles,
      status: row.status,
      mfaVerified: row.mfaVerifiedAt !== null,
    },
  };
}

export async function revokeSessionByToken(
  db: MovieDatabase,
  rawToken: string,
  requestId: string,
  now: Date = new Date(),
): Promise<void> {
  const tokenHash = hashSessionToken(rawToken);
  const existing = await db
    .select({ id: sessions.id, userId: sessions.userId })
    .from(sessions)
    .where(and(eq(sessions.tokenHash, tokenHash), isNull(sessions.revokedAt)))
    .limit(1);

  if (!existing[0]) {
    return;
  }

  await db.update(sessions).set({ revokedAt: now }).where(eq(sessions.id, existing[0].id));
  await recordAuditEvent(db, {
    actor: { userId: existing[0].userId, roles: [], status: "ACTIVE" },
    action: "auth.session.revoke",
    targetType: "session",
    targetId: existing[0].id,
    requestId,
  });
}

export async function listActiveSessionsForUser(
  db: MovieDatabase,
  userId: string,
  now: Date = new Date(),
) {
  return db
    .select({
      id: sessions.id,
      userAgent: sessions.userAgent,
      mfaVerifiedAt: sessions.mfaVerifiedAt,
      createdAt: sessions.createdAt,
      lastSeenAt: sessions.lastSeenAt,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(
      and(eq(sessions.userId, userId), isNull(sessions.revokedAt), gt(sessions.expiresAt, now)),
    )
    .orderBy(desc(sessions.lastSeenAt));
}
