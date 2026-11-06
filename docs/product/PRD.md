# Product Requirements Document (PRD) — Cinematic Graphite

## 1. Product Vision

Cinematic Graphite is a Bangladesh-ready, globally extensible **Lawful Movie Discovery & Authorized Media Distribution Platform**. It enables viewers to discover films with rich English and Bangla metadata, stream authorized titles smoothly across unstable mobile and broadband networks, and download offline copies **only** where explicit download distribution rights exist.

## 2. Non-Negotiable Scope Boundaries

- **Included**:
  - Rights-verified film catalogue with English and Bangla localized titles, synopses, cast/crew credits, maturity guidance, and source attribution.
  - Honest availability states (`Available to stream`, `Available to download`, `Catalogue entry only`, `Not available in your region`, `Rights verification pending`).
  - Adaptive HLS/DASH streaming (M4) and separately gated signed downloads (M5) backed by private S3-compatible object storage.
  - Internal Operations Console (`/admin`) with RBAC, MFA enforcement for privileged staff, separation of duties for rights approvals, quarantine ingest, and emergency legal hold / takedown controls.
- **Strictly Excluded**:
  - Any scraping, extraction, mirroring, or embedding of unlicensed content.
  - Shortlink/CAPTCHA/Cloudflare bypasses, torrent/magnet ingestion, or consumer Google One multi-account storage rotation.
  - Fake movie records, fabricated ratings/counts, or deceptive "Watch/Download HD" buttons.

## 3. Target Personas

1. **Viewer (Guest / Registered)**: Browses, searches in English or Bangla, saves a personal watchlist, streams authorized titles, and downloads explicitly licensed offline copies.
2. **Editor & Media Operator**: Drafts metadata, uploads master/subtitle assets into private staging quarantine, and verifies QC checksums—without authority to self-approve rights.
3. **Rights Admin & Content Admin**: Reviews chain-of-title evidence, approves territorial/windowed rights grants (with mandatory MFA), publishes cleared titles, and executes emergency legal holds or takedowns.

## 4. Milestone Delivery Roadmap

- **M1 — Foundation**: Monorepo packages, Zod v4 config, redacted logger, RFC 9457 contracts, central `RightsDecisionService` + RBAC + asset state machine, private quarantine `StorageAdapter`, Cinematic Graphite UI shell, Next.js 16 `proxy.ts`, health API, CI & test harness.
- **M2 — Persistence, Auth & Catalogue Gate**: PostgreSQL schema & migrations, revocable sessions, centralized DAL, admin draft/rights/publish workflow, public browse/search/title detail.
- **M3 — Quarantine Ingest & Background Jobs**: Resumable multipart upload API, checksum/probe worker, asset QC review.
- **M4 — Adaptive Playback & DRM Boundary**: CMAF HLS/DASH manifests, subtitle/audio tracks, short-lived playback sessions, fail-closed DRM adapter.
- **M5 — Downloads, Archive Backup, Takedowns & Audit**: Separate download grant flow, optional operator-owned archive backup connector, emergency kill-switch, immutable audit explorer.
- **M6 — Launch Hardening**: Load/accessibility audits, backup restore drill, legal/brand sign-off checklist.
