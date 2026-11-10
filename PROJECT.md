# Project: CINEVA Production-Ready Media Platform Release

## Architecture
CINEVA is a lawful movie discovery and authorized media distribution platform built on a 7-plane architecture:
- **Control Plane**: Next.js 16.4.5 (`apps/web`) with Turbopack, App Router, `proxy.ts`, `cacheComponents: true`, and PPR `<Suspense>` boundaries.
- **Data & Contracts Plane**: `@movie/db` (Drizzle ORM, PostgreSQL / PGlite WASM engine) and `@movie/contracts` (Zod schemas).
- **Domain & Rights Plane**: `@movie/domain` central rights evaluation (`RightsDecisionService`) and recommendation engines (`recommendation-engine.ts`).
- **Storage & Ingestion Plane**: `@movie/storage` multi-adapter object storage with RFC 9110 HTTP Range byte serving.
- **Media Plane**: `@movie/media` adaptive bitrate packaging, capacity models, and delivery bitrate formulas.
- **Protection & Observability Plane**: `@movie/observability` and privacy-safe QoE telemetry (`delivery_events`).
- **Production Infrastructure Plane**: Pilot Compose (`docker-compose.yml`), Caddy TLS reverse proxy, and multi-stage Docker container (`Dockerfile`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Font & CSS Bengali Purge | Remove `Noto_Sans_Bengali` from `layout.tsx`, `--font-bengali` and `:lang(bn)` rules from `experience.css` | M1 | Survey 1 (R1) |
| 2 | Device Preferences Localization | Remove `banglaTitles` from `DeviceState`, remove "Bangla titles" toggle in `preferences.tsx`, simplify `synopsis.tsx` | M1 | Survey 1 (R1) |
| 3 | Page & Component English Normalization | Remove secondary `<p lang="bn">` titles and search Bengali placeholders across 11 pages and 7 components | M1 | Survey 1 (R1) |
| 4 | Data Fixtures & DAL Bengali Removal | Purge Bengali strings from `cineva-database.ts`, `fixtures.ts`, `tmdb-types.ts`, `search.ts`, and db seeds | M1 | Survey 1 (R1) |
| 5 | Test Assertions English Alignment | Update unit tests and Playwright E2E (`discovery.spec.ts`) to remove Bengali assertions and assert 100% English | M1 | Survey 1 (R1) |
| 6 | Mobile Touch Target Standardization | Adjust 6 responsive CSS rules in `experience.css` and admin nav to guarantee `>= 44x44px` on mobile (<768px) and `>= 24x24px` on desktop | M1 | Survey 1 (R5) |
| 7 | Motion-Reduction Fallback Coverage | Add explicit `motion-reduce:transition-none` and `motion-reduce:transform-none` to 14 interactive components | M1 | Survey 1 (R5) |
| 8 | OMDb Environment & Secret Redaction | Add optional `OMDB_API_KEY` to `packages/config`, `# OMDB_API_KEY=` to `.env.example`, and redact `apikey=` in `packages/observability` | M2 | Survey 2 (R2) |
| 9 | Server-Only OMDb Metadata Client | Implement `apps/web/lib/metadata/omdb-client.ts` with graceful degradation, 5s timeout, and normalized critic scores | M2 | Survey 2 (R2) |
| 10 | Lawful TMDb & Critic Ratings Presentation | Enforce `language=en-US` on TMDb and render clean semantic badges for IMDb, Metascore, Rotten Tomatoes (no fake emblems) | M2 | Survey 2 (R2) |
| 11 | Piracy & Scraping Zero-Tolerance Gate | Maintain strict audit gate ensuring zero scraping, shortlink bypass, CAPTCHA bypass, or torrent ingestion code | M2 | Survey 2 (R2) |
| 12 | Adaptive Player Library Integration | Install `hls.js` and `dashjs` in `apps/web` and integrate MSE adaptive engines into `video-player-shell.tsx` | M3 | Survey 2 (R3) |
| 13 | ABR Dynamic Quality Switching | Switch resolution tiers via `hls.currentLevel` and `dashjs.setQualityFor` without altering `video.src` or dumping buffer | M3 | Survey 2 (R3) |
| 14 | Event-Driven Buffer & Clock Sync | Replace `setInterval` with native `<video>` events (`timeupdate`, `waiting`, `playing`, `pause`, `ended`) for playback and heartbeats | M3 | Survey 2 (R3) |
| 15 | Authorized Media Test Streams & CSP | Configure lawful open-source test streams (Blender Foundation HLS/DASH) and configure CSP `connect-src` / `media-src` in `proxy.ts` | M3 | Survey 2 (R3) |
| 16 | Continue-Watching DAL & API | Implement `listUserContinueWatching` in `@movie/db` and route `/api/v1/continue-watching` for user in-progress resume | M4 | Survey 3 (R4) |
| 17 | Server-Side Personalized Recommendations | Connect authenticated user watch history (`playback_sessions`) to `GET /api/v1/recommendations` and render personalized rail | M4 | Survey 3 (R4) |
| 18 | Dynamic Auth UI & Session Persistence | Update header to display user status/name when authenticated, backed by existing scrypt/TOTP/cookie auth system | M4 | Survey 3 (R4) |
| 19 | Production VPS Docker Compose | Create root `docker-compose.yml` with right-sized limits (2 vCPU / 8 GB RAM VPS) and automated startup migrations | M5 | Survey 3 (R6) |
| 20 | Monorepo Verification & E2E Test Suite | Pass 6-gate verification: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `APP_ENV=test pnpm build`, `pnpm test:e2e` | M5 | Survey 3 (R6) |
| 21 | Requirement-Driven E2E Test Track | Build independent 4-tier E2E test suite derived from ORIGINAL_REQUEST.md and publish TEST_READY.md | E2E | Top-Level Orchestrator |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Complete English Localization & Design System Accessibility | Features 1–7 (Bengali purge across 24 files, touch targets >=44px mobile, motion-reduce fallbacks) | none | IN_PROGRESS |
| M2 | Lawful Movie Catalog, Open Metadata & Secret Hygiene | Features 8–11 (OMDb client, config, observability redaction, TMDb en-US, critic rating badges) | M1 | PLANNED |
| M3 | Adaptive Bitrate Video Player & Streaming Architecture | Features 12–15 (hls.js, dashjs, ABR quality switching, native event sync, CSP, authorized test streams) | M1 | PLANNED |
| M4 | Backend Auth, Playback Resume & Recommendation Engine | Features 16–18 (Continue-watching DAL/API, server watch history recs, auth header session display) | M1, M2 | PLANNED |
| M5 | Docker VPS Architecture & Production Verification | Features 19–20 (Root docker-compose.yml, 2 vCPU / 8 GB sizing, 6-gate repository verification, Playwright E2E) | M1, M2, M3, M4, TEST_READY | PLANNED |
| E2E | Requirement-Driven E2E Testing Suite | Feature 21 (Opaque-box test suite for R1–R6, published via TEST_READY.md) | none (parallel track) | DONE |

## Interface Contracts
### Metadata Contracts (M1 ↔ M2)
- All catalog schemas (`titles`, `genres`, `people`, `collections`, `SearchEntry`) use English strings exclusively.
- OMDb metadata model: `{ imdbRating: string | null, imdbVotes: string | null, metascore: string | null, rottenTomatoes: string | null }`.
- OMDb client function: `getOmdbRatings(imdbId?: string, title?: string, year?: number): Promise<OmdbRatings | null>`.
- Secret hygiene: `OMDB_API_KEY` never appears in client bundles, log messages, or URL parameters.

### Player Contracts (M1 ↔ M3 ↔ M4)
- Player props: `interface VideoPlayerShellProps { title: PublishedTitleSummary; activeRendition?: DeliveryRendition; initialStartSeconds?: number; streamSessionId?: string; ... }`.
- Manifest types: HLS (`application/x-mpegURL` / `.m3u8`), DASH (`application/dash+xml` / `.mpd`).
- Player ABR interface: Level switching without video element teardown or src modification.
- Heartbeat interface: `POST /api/v1/playback-sessions/[id]/heartbeat` with `{ positionSeconds: number, bufferedSeconds: number, metrics: QoEMetrics }`.

### User & Resume Contracts (M4 ↔ M5)
- Continue-watching record: `{ titleSlug: string, titleEn: string, lastPositionSeconds: number, durationSeconds: number, progressPercent: number, updatedAt: string }`.
- Route: `GET /api/v1/continue-watching` returns `{ continueWatching: ContinueWatchingItem[] }`.
- Recommendations route: `GET /api/v1/recommendations` without `seeds` queries database for authenticated user's recent sessions.

## Code Layout
- `apps/web/app/` — Next.js 16 App Router pages and API routes
- `apps/web/components/` — UI components (catalogue, layout, player, account)
- `apps/web/lib/metadata/` — TMDb and OMDb metadata adapters
- `apps/web/styles/` — `globals.css`, `experience.css`, `cinematic-graphite.tokens.css`
- `packages/auth/` — Native scrypt, TOTP MFA, session tokens
- `packages/config/` — Environment validation schemas
- `packages/contracts/` — Zod schemas and API contracts
- `packages/db/` — Database schema (catalogue, identity, playback-audit), migrations, DAL
- `packages/domain/` — Rights evaluation, recommendation engine
- `packages/observability/` — Structured logging, sensitive query param redaction, QoE telemetry
- `tests/e2e/` — Playwright end-to-end test suites
- `docker-compose.yml` & `Dockerfile` — Production container and self-hosting configuration
