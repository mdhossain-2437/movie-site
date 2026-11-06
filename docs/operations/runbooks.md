# Operational Runbooks & Incident Procedures

## 1. Urgent Copyright Takedown / Emergency Legal Hold

1. Locate the `TKD-*` case in `/admin/takedowns` or identify the `titleId` in `/admin/titles`.
2. Authenticate as `ADMIN` or `SUPER_ADMIN` with an active TOTP MFA session.
3. Execute `POST /api/v1/admin/takedowns/:caseId/resolve` with `{ "outcome": "LEGAL_HOLD_APPLIED", "resolutionNotes": "..." }` (or `POST /api/v1/admin/titles/:id/unpublish` with `{ "applyLegalHold": true, "reason": "..." }`).
4. **Automated Effect:** Within a single PostgreSQL transaction:
   - `titles.status` transitions to `TAKEDOWN_HOLD` and `titles.legal_hold = true`.
   - All associated `media_assets` transition to `TAKEDOWN_HOLD`.
   - All active `playback_sessions` for the title receive `revoked_at = now()`, terminating in-progress playback on the next heartbeat.
   - Next.js `revalidateTag("catalogue", "max")` purges cached public listings.
   - An append-only `audit_events` record is persisted.

## 2. Stuck or Dead-Letter Outbox Job Recovery

1. Inspect `outbox_jobs` in `/admin/media` for entries in `DEAD_LETTER` or expired `LEASED` state.
2. Review `last_error` to distinguish transient storage timeouts from permanent `MALICIOUS_PAYLOAD_SIGNATURE` or `CHECKSUM_MISMATCH` errors.
3. **Never retry permanent integrity or signature failures.** Delete or archive failed quarantine objects and require a clean re-upload from the authorized rights holder.
4. For transient infrastructure timeouts after storage recovery, reset `status = 'PENDING'` and `attempts = 0` via an audited maintenance transaction.

## 3. Cryptographic Key Rotation (`SESSION_SECRET` & `MEDIA_SIGNING_SECRET`)

1. `SESSION_SECRET` and `MEDIA_SIGNING_SECRET` are strictly independent (`@movie/config` blocks startup if they match in production).
2. **Rotating `MEDIA_SIGNING_SECRET`:** Invalidates outstanding short-lived (`5 min`) manifest/download URLs without logging users out. Deploy new secret and allow active players to re-authorize via `POST /api/v1/playback-sessions`.
3. **Rotating `SESSION_SECRET` / Emergency Session Flush:** Truncating or stamping `revoked_at` on `sessions` immediately invalidates SHA-256 session tokens across all browsers.

## 4. PostgreSQL Backup & Restore Verification Drill

1. Primary relational truth lives in PostgreSQL (`26` tables; binary media is never stored in PostgreSQL).
2. Take encrypted logical/physical backups (`pg_dump --format=custom` + WAL archiving on managed PostgreSQL).
3. **Monthly Restore Drill:** Restore into an isolated staging database, run `pnpm db:migrate`, verify `audit_events` row counts and `rights_evidence.evidence_sha256` integrity, and confirm `evaluateRights` denies expired grants before signing off.

## 5. Pilot Host Capacity Boundary (Control Plane vs. Streaming Plane)

- Application VPS (`2–8 vCPU / 8–32 GB RAM / 100 GB NVMe`) hosts Next.js, API orchestration, PostgreSQL/Redis (or private VPC links), and lightweight header/probe validation only.
- Heavy ABR transcoding and high-concurrency segment egress must run on isolated workers and S3-compatible private object storage + CDN (e.g., Cloudflare R2 / Mux / AWS MediaConvert), never saturating the web control plane disk or NIC.
