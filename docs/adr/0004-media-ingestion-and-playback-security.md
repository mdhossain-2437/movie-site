# ADR 0004: Quarantine Media Ingestion, Durable Outbox & Server-Authorized Playback

- **Status:** Accepted
- **Date:** 2026-11-06
- **Deciders:** Platform Architecture & Security Engineering

## Context

Milestones M3–M5 require authorized multipart upload ingestion, untrusted container probing, adaptive bitrate (ABR) rendition delivery, separate download authorization, and urgent legal-hold revocation without routing multi-gigabyte media payloads through Next.js API workers or misrepresenting signed URLs as DRM.

## Decisions

1. **Rights-Before-Upload & Quarantine Lifecycle (`@movie/domain`, `@movie/db`, `@movie/storage`):**
   - `initiateAuthorizedAssetUpload` requires `media:upload` AND an active `APPROVED` rights grant before creating a multipart session (`RIGHTS_APPROVED -> UPLOAD_PENDING -> UPLOADING`).
   - External URL ingestion (`sourceUrl`) is explicitly blocked to eliminate SSRF and unauthorized mirroring vectors.
   - Completed multipart uploads verify byte length and SHA-256 checksums; mismatches isolate the object and mark the asset `FAILED`. Valid uploads enter `QUARANTINED` (never `PUBLISHED`) and enqueue an idempotent `ASSET_PROBE_AND_VALIDATE` job in `outbox_jobs`.

2. **Safe Container Signature & `execFile` Probing (`@movie/media`):**
   - `probeMediaHeaderBytes` inspects magic headers (`ftyp` ISO-BMFF MP4/CMAF, `0x1A45DFA3` WebM, `WEBVTT`) and blocks PE/ELF executables, shell scripts, and HTML/SVG polyglots before any native parser runs.
   - `FfprobeExecFileAdapter` uses `node:child_process.execFile` with `shell: false`, `-protocol_whitelist file`, `--` argument termination, bounded `timeout` (`15s`), and bounded `maxBuffer` (`2 MiB`), rejecting URLs and FFmpeg `concat:`/`subfile:` protocols.
   - `validateHlsMasterManifest` rejects external `http(s)://` URIs and `..` traversal in playlists.

3. **Token Separation & Fail-Closed DRM Boundary:**
   - Login cookies (`SESSION_SECRET`), playback session tokens (`playback_sessions.token_hash`), and short-lived HMAC storage read capabilities (`MEDIA_SIGNING_SECRET`, `300s` TTL) are cryptographically separated.
   - Source quarantine keys (`quarantine/.../source.bin`) are never queried or returned by playback or public catalogue endpoints.
   - When `requiresDrm` or `drmRequired` is `true`, `authorizePlaybackSession` fails closed (`DRM_REQUIRED`) unless an approved multi-DRM provider (`mux` or `aws-mediaconvert` with `DRM_ADAPTER_CONFIGURED=true`) and encrypted renditions are active. `cloudflare-stream` signed URLs are never treated as multi-DRM.
   - `authorizeAssetDownload` evaluates `action: "DOWNLOAD"` independently (`STREAM` never implies `DOWNLOAD`) and requires an authenticated active user.

4. **Immediate Mid-Stream Takedown Revocation:**
   - `resolveTakedownCase` (`LEGAL_HOLD_APPLIED` / `RESOLVED_UPHELD`) and `unpublishTitle` (`applyLegalHold: true`) atomically transition the title and assets to `TAKEDOWN_HOLD` and stamp `revoked_at` on all active `playback_sessions`, terminating playback on the next heartbeat.

## Consequences

- Zero binary media bytes pass through Next.js route handlers in production S3/R2 deployments.
- Duplicate upload-complete requests or worker retries with the same `Idempotency-Key` cannot create duplicate jobs or publications.
- Protected studio titles cannot accidentally degrade to clear MP4/HLS streams.
