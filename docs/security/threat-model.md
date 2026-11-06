# Security Threat Model

## 1. Assets Protected

- Private master media files, packaged stream renditions, and subtitle tracks.
- Documentary rights evidence, contract terms, and compliance takedown records.
- Viewer credentials, session tokens, MFA secrets, and personal watchlists.
- Cryptographic signing secrets (`SESSION_SECRET`, `MEDIA_SIGNING_SECRET`, `TOKEN_ENCRYPTION_KEY`) and cloud storage credentials.

## 2. Primary Threats & Mitigations

| Threat Category | Attack Scenario | Platform Mitigation |
| --- | --- | --- |
| **Unauthorized Media Access / Hotlinking** | Attacker guesses object paths or shares playback/download URLs across regions. | Private buckets, opaque UUID/ULID object keys, server-side `evaluateRights()` per request, short-lived single-object signed URLs, and `Referrer-Policy: no-referrer` on `/watch/*`. |
| **Privilege Escalation / Self-Approval** | Editor or media operator uploads an unverified file and attempts to publish it directly. | RBAC separation of duties (`EDITOR` and `MEDIA_OPERATOR` lack `rights:approve`), guarded asset state machine (`UPLOADED -> PUBLISHED` forbidden), and mandatory MFA on privileged roles. |
| **Broken Object-Level Authorization (IDOR)** | Viewer requests another user's watchlist, session, or download grant ID. | Centralized Data Access Layer (M2) scoping every query by authenticated `userId` and active session state. |
| **Secret & Token Leakage in Telemetry** | Presigned query strings, cookies, or refresh tokens appear in error logs. | `@movie/observability` recursively redacts sensitive keys, Bearer/JWT strings, and signed URL query parameters (`token=`, `X-Amz-Signature=`, etc.) before serializing JSON logs. |
| **Server-Side Request Forgery (SSRF)** | Operator or user submits an internal metadata IP (`169.254.169.254` / `localhost`) for remote fetch. | Arbitrary URL ingestion is omitted by design; file ingest uses direct client-to-bucket presigned multipart uploads verified by server-side SHA-256 checks. |
| **Production Misconfiguration** | App boots in production with default secrets or in-memory mock storage. | `@movie/config` fails fast on startup when effective stage is `production` if `DATABASE_URL`, `SESSION_SECRET`, or independent `MEDIA_SIGNING_SECRET` are missing or `OBJECT_STORAGE_PROVIDER=memory`. |
