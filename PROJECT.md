# Project: Cinematic Graphite V4 Multi-Stream Architecture

## Architecture
Cinematic Graphite is a lawful movie discovery and authorized media distribution platform built on a 7-plane architecture:
- **Control Plane**: Next.js 16.4.5 (`apps/web`) with Turbopack, App Router, `proxy.ts`, `cacheComponents: true`, and PPR `<Suspense>` boundaries.
- **Data & Contracts Plane**: `@movie/db` (Drizzle ORM, PostgreSQL / PGlite WASM engine) and `@movie/contracts` (Zod schemas).
- **Domain & Rights Plane**: `@movie/domain` central rights evaluation (`RightsDecisionService`).
- **Storage & Ingestion Plane**: `@movie/storage` multi-adapter object storage with RFC 9110 HTTP Range byte serving.
- **Media Plane**: `@movie/media` adaptive bitrate packaging, capacity models, and delivery bitrate formulas.
- **Protection & Observability Plane**: `@movie/observability` and privacy-safe QoE telemetry (`delivery_events`).
- **Production Infrastructure Plane**: Pilot Compose (`infra/compose/prod.pilot.yml`), Caddy TLS reverse proxy, and multi-stage Docker container calibrated for 4 vCPU / 16 GB RAM VPS (`dark-crow`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | .gitignore Tracking Fix | Update `.gitignore` line 4 to ignore `.agents/teamwork/` while tracking `.agents/rules/` and `.agents/skills/` | M1 | User Follow-up |
| 2 | V4 Database Schema & Migration | Add `delivery_events`, `replication_tasks`, `drm_configurations` tables and generate incremental migration | M1 | Master Spec §85, §91, §93 |
| 3 | V4 DAL & QoE Telemetry API | Add `recordPlaybackQoeEvent`, `getPlaybackQoeSummaryForAdmin` in DAL and `POST /api/v1/playback-sessions/[id]/qoe` | M1 | Master Spec §89, §91 |
| 4 | Replica State Machine & Takedown Kill-Switch | Add replica lifecycle helpers and atomic replication task decommissioning in `resolveTakedownCase` | M1 | Master Spec §85.4 |
| 5 | RFC 9110 HTTP Range Byte-Serving | Add `parseHttpByteRange` and `readObjectByteRange` with 206 Partial Content and 416 Range Not Satisfiable | M1 | Master Spec §86.3 |
| 6 | Delivery Capacity & Bitrate Math | Add `calculateDeliveryCapacityModel` and `calculateFileSizeFromBitrate` with control-plane guardrails | M1 | Master Spec §87, §88 |
| 7 | Opt-In Dev Showcase Fixture Seeder | Add `seed-dev-showcase.ts` + `db:seed:dev` script with 7 lawful fixture films, Bangla Unicode, and dev HLS manifests | M1 | WS1.3 Request |
| 8 | V4 Architecture & Evidence Doc | Write `docs/architecture/v4-distributed-delivery-and-evidence.md` with HDHub4u classification matrix and 7-plane doc | M1 | WS1.4 Request |
| 9 | DESIGN.md Standards | Create `d:\movie-site\DESIGN.md` with Taste sliders (7/6/5), anti-slop rules, tokens, and accessibility standards | M2 | WS2.1 Request |
| 10 | UI Primitives & Async Spinner | Add `Spinner` primitive, integrate `loading` in `Button`, enforce mobile >=44x44px touch targets across all forms | M2 | WS2.2 Request |
| 11 | Video Player QoE Telemetry | Integrate QoE lifecycle telemetry emission into `VideoPlayerShell` | M2 | WS2.2 Request |
| 12 | Concept #1 Vertical Film-Strip Showcase | Add `FilmStripShowcase` with 7 vertical panels, procedural SVG art, hover elevation, and Garamond watermark backdrop | M2 | WS2.3 Request, Concept #1 |
| 13 | Concept #2 Full-Bleed Title Detail Hero | Add `TitleHeroStage` and update `/movies/[slug]/page.tsx` with multi-line title, Bangla subtitle, metadata pills, right quick rail, play CTA | M2 | WS2.4 Request, Concept #2 |
| 14 | New Discovery Pages | Add `/people/[slug]`, `/collections/[slug]`, `/genres/[slug]` with DAL queries and Next.js 16 Suspense boundaries | M2 | WS2.5 Request |
| 15 | Signature Floating Bottom Dock | Add `FloatingDock` with warm gold aperture BrandMark, nav links, search modal trigger, profile, and pb-28 spacing | M2 | WS2.6 Request |
| 16 | Workflow Migration Verification | Inspect and record clean state of global and workspace workflow directories per `migrate-workflows` skill | M3 | WS3.1 Request |
| 17 | Workspace Customizations & Skills | Create `rules/frontend-design-engineering.md`, `CLAUDE.md`, and skills `impeccable-audit`, `visual-qa` | M3 | WS3.2 Request |
| 18 | Local Antigravity Plugin Bundle | Create local plugin `cinematic-frontend-qa` at `%USERPROFILE%\.gemini\config\plugins\` | M3 | WS3.2 Request |
| 19 | Closed-Loop Playwright Visual QA | Add `tests/e2e/visual-qa.spec.ts` capturing 5 screenshots across Desktop/Mobile and asserting bounding boxes >=24px / >=44px | M3 | WS3.3 Request |
| 20 | Host boxd CLI & Remote VPS Inspection | Run read-only hardware/OS check on `dark-crow` via `boxd` CLI and document verified host resources | M4 | WS4.1 Request |
| 21 | Multi-Stage Production Dockerfile | Author hardened multi-stage `Dockerfile` and `.dockerignore` for Node 24 + pnpm 11.18.0 with non-root user and healthcheck | M4 | WS4.2 Request |
| 22 | Pilot Compose & Caddy Reverse Proxy | Create `infra/compose/prod.pilot.yml` (calibrated for 4 vCPU / 16 GB) and `infra/caddy/Caddyfile` | M4 | WS4.2 Request |
| 23 | VPS Automation & Pipeline Scripts | Create `bootstrap-vps.sh`, `deploy.sh`, `healthcheck.sh`, `backup-postgres.sh`, `restore-postgres.sh`, `connect-dark-crow.ps1` | M4 | WS4.2 Request |
| 24 | Full Verification Suite Pass | Run and pass with 0 errors: format:check, lint, typecheck, vitest (42/42), build, test:e2e (30/30) | M4 | WS4.3 Request |
| 25 | Clean Git Commit & Remote Push | Stage verified lawful files, rebase with origin/main if needed, commit, and push cleanly to GitHub remote | M4 | WS4.3 Request |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: V4 Core Media Engine & Backend Evidence | Features 1–8 (`.gitignore`, schema, DAL, Range serving, capacity math, seeder, doc) | none | DONE |
| 2 | M2: Score 98/100 Cinematic Editorial UI/UX Upgrade | Features 9–15 (`DESIGN.md`, Spinner, FilmStripShowcase, TitleHeroStage, Discovery Pages, FloatingDock) | M1 | DONE |
| 3 | M3: Antigravity Customizations, Plugin & Visual QA | Features 16–19 (Rules, skills, local plugin bundle, Playwright visual QA spec) | M2 | IN_PROGRESS |
| 4 | M4: Production Pipeline, Verification & Git Push | Features 20–25 (boxd VPS check, Dockerfile, Compose, Caddy, Scripts, 6-gate verification, Git push) | M3 | PLANNED |

## Interface Contracts
### @movie/db ↔ apps/web (QoE & DAL)
- `recordPlaybackQoeEvent(sessionTokenHash: string, event: PlaybackQoeEventInput): Promise<DeliveryEvent>`
- `getPlaybackQoeSummaryForAdmin(titleId?: string): Promise<PlaybackQoeSummary>`
- `getPublicPersonBySlug(slug: string): Promise<PublicPersonWithTitles | null>`
- `getPublicCollectionBySlug(slug: string): Promise<PublicCollectionWithTitles | null>`
- `getPublicGenreBySlug(slug: string): Promise<PublicGenreWithTitles | null>`
- `listPublicCollections(): Promise<PublicCollectionSummary[]>`

### @movie/storage ↔ HTTP Range Clients
- `parseHttpByteRange(rangeHeader: string | null | undefined, totalSize: number): ByteRangeSelection | null`
- `readObjectByteRange(key: string, rangeHeader?: string): Promise<ByteRangeResult>`
  - Returns: `{ stream: ReadableStream | Buffer, statusCode: 200 | 206, contentRange?: string, contentLength: number, acceptRanges: "bytes", etag: string }`
  - Error: throws/returns 416 `RangeNotSatisfiableError`

### @movie/media ↔ Delivery Planning
- `calculateDeliveryCapacityModel(params: DeliveryCapacityParams): DeliveryCapacityModel`
  - Egress Mbps = concurrentViewers * avgBitrateMbps
  - Session GB = (avgBitrateMbps * durationSeconds) / (8 * 1024)

## Code Layout
- `packages/db/src/schema/playback-audit.ts` & `media.ts` — V4 entity schemas
- `packages/db/migrations/0001_v4_media_qoe_replication.sql` — Migration
- `packages/db/src/media-playback-dal.ts` & `dal.ts` — DAL methods
- `packages/storage/src/range.ts` — RFC 9110 Range serving
- `packages/media/src/capacity.ts` — Delivery capacity math
- `packages/db/src/seed-dev-showcase.ts` — Dev showcase seeder
- `docs/architecture/v4-distributed-delivery-and-evidence.md` — V4 architecture doc
- `d:\movie-site\DESIGN.md` — Design system & taste calibration standards
- `apps/web/components/ui/spinner.tsx` — Spinner primitive
- `apps/web/components/catalogue/film-strip-showcase.tsx` — Concept #1 vertical film-strip stage
- `apps/web/components/catalogue/title-hero-stage.tsx` — Concept #2 full-bleed detail hero stage
- `apps/web/components/layout/floating-dock.tsx` — Signature floating bottom dock
- `apps/web/app/people/[slug]/page.tsx` — Director/talent showcase page
- `apps/web/app/collections/[slug]/page.tsx` — Curated collection showcase page
- `apps/web/app/genres/[slug]/page.tsx` — Genre archive page
- `d:\movie-site\.agents/rules/frontend-design-engineering.md` — Workspace design rule
- `d:\movie-site\CLAUDE.md` — Pointer to AGENTS.md & DESIGN.md
- `d:\movie-site\.agents/skills/` — `impeccable-audit`, `visual-qa`
- `%USERPROFILE%\.gemini\config\plugins\cinematic-frontend-qa\` — Local plugin bundle
- `tests/e2e/visual-qa.spec.ts` — Closed-loop visual QA spec
- `Dockerfile` & `.dockerignore` — Production container
- `infra/compose/prod.pilot.yml` — Hardened pilot compose
- `infra/caddy/Caddyfile` — Production reverse proxy
- `infra/scripts/` — VPS automation scripts
