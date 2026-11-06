# Movie Discovery & Authorized Media Distribution Platform
## Deep Production Blueprint + Canonical AI Coding-Agent Master Prompt

**Version:** 3.0 (Append-only streaming, DRM, product design and scale edition)  
**Prepared:** 6 November 2026  
**Project assumption:** This blueprint is for a lawful movie catalogue and media-distribution platform. It supports films that the operator owns, has licensed, or has individually verified as public-domain / appropriately Creative-Commons-licensed in the relevant territory. It is not a piracy-site scraper, mirror-leech bot, or copyright-evasion system.

**How to use this document:** This V3 edition preserves the complete V2 blueprint and adds an append-only engineering and design expansion. Parts I–VII remain intact; Sections 58 onward add the premium streaming architecture, DRM model, complete UI/UX design system, capacity plan for up to 8 vCPU / 32 GB RAM, and an upgraded agent brief. Where an earlier statement is less specific, the V3 addendum is the authoritative refinement. **Section 51 remains the original canonical prompt; Section 65 is the mandatory V3 extension to run with it.** Build milestone by milestone and require human approval for rights, paid spend and production actions.

---

# PART I — PRODUCT AND ENGINEERING BLUEPRINT

## 1. Executive direction

Build one platform with four integrated capabilities:

1. **Movie discovery:** browse, search, filter, view movie details, cast, genres, languages, release year, trailers, subtitles, and availability.
2. **Authorized watch/download:** stream or download a film only when an active rights record explicitly permits that action for the user's territory and the current date.
3. **Media library and ingestion:** ingest owner-supplied files, licensed distributor deliveries, or explicitly authorized source files; validate, fingerprint, process, store, and publish them.
4. **Operations console:** manage metadata, files, rights, storage, jobs, users, access, reports, takedowns, and audit logs.

### Non-negotiable product rule

A movie record is not proof that the platform has the right to distribute its video file. Metadata, artwork, trailers, subtitles, and the full audiovisual work can have different owners and different licenses. The platform must maintain a separate rights record for each relevant asset and use type.

**Publication gate:** no movie can become publicly streamable or downloadable unless an administrator has approved an active rights grant that covers the asset, territory, use type, and date range.

## 2. What the supplied conversation establishes

The initial concept described in the conversation is:

- A movie catalogue inspired by sites such as HDHub4u.
- Collecting movie metadata, posters, categories, and file availability.
- Automatically fetching files, moving them through a VPS, and uploading them to four separate Google accounts.
- A VPS currently described as 2 vCPU, 8 GB RAM, and 100 GB storage from boxd.sh.
- Four separate Google accounts, each described as having a 5 TB Google One plan.

The technical product goal can be preserved in a lawful implementation: one website, one backend, one job system, multiple storage destinations, and an admin interface. The acquisition mechanism must be changed to authorized uploads and licensed provider integrations, not unauthorized extraction from piracy sites or bypassing shortlink / anti-bot controls.

## 3. Scope: MVP versus later releases

### MVP — prove the complete legal workflow

- Public homepage with featured, recent, popular, and curated titles.
- Movie detail page with metadata, artwork, trailer, languages, subtitles, and availability.
- Search by title and filters for genre, year, language, country, and content type.
- User registration, login, watchlist, and download history.
- Admin CMS for movie metadata and people/genre relationships.
- Rights ledger and approval workflow.
- Direct owner upload to object storage using short-lived upload credentials.
- File validation, checksum, metadata probing, job queue, and processing status.
- Authorized streaming and/or download through expiring signed access.
- Admin job monitor, audit log, report/takedown intake, and basic analytics.

### Release 2 — operational maturity

- Partner/distributor API integrations.
- Bulk metadata import from licensed sources.
- Subtitle management and subtitle quality checks.
- Advanced search, recommendations, collections, and localization.
- Storage replication / backup policies and restore testing.
- Creator / distributor portal with scoped access.
- Subscription or payment entitlement only after legal rights and payment-provider policies are confirmed.

### Release 3 — scale

- Dedicated media-processing workers with autoscaling.
- Multi-region delivery and origin failover.
- Search engine such as Meilisearch or OpenSearch when PostgreSQL search is no longer sufficient.
- Recommendation pipeline based on privacy-conscious first-party events.
- Data warehouse / analytics pipeline.
- Multi-tenant partner management and detailed revenue reporting.

Do not start with microservices, Kubernetes, a custom CDN, or an elaborate recommendation model. A modular monolith plus background workers is simpler to build, secure, debug, and operate for the first release.

## 4. Recommended system architecture

```mermaid
flowchart TD
  U[Viewer / Admin / Content Partner] --> CF[Cloudflare DNS, WAF, Bot Protection]
  CF --> WEB[Next.js Web App + API]
  WEB --> AUTH[Authentication + RBAC]
  WEB --> DB[(Managed PostgreSQL)]
  WEB --> REDIS[(Redis)]
  WEB --> Q[BullMQ Queues]
  Q --> W[Authorized Ingestion Worker]
  W --> VALIDATE[Validation, Hashing, ffprobe, Malware Scan]
  VALIDATE --> R2[(Cloudflare R2 / S3 Object Storage)]
  VALIDATE --> VIDEO[Managed Video Processing or Dedicated FFmpeg Worker]
  VIDEO --> STREAM[HLS/DASH Playback Origin]
  WEB --> SIGN[Entitlement + Signed URL Service]
  SIGN --> R2
  SIGN --> STREAM
  WEB --> TMDB[Licensed Metadata Provider]
  W --> AUDIT[Audit / Observability]
  WEB --> SENTRY[Sentry / OpenTelemetry]
```

### Architectural principles

- **Modular monolith first:** keep catalog, identity, rights, ingestion, storage, and downloads in clear modules in one deployable application.
- **Async for heavy work:** never transcode, scan, copy, or hash very large media files inside a normal web request.
- **Direct-to-object-storage uploads:** the browser uploads to R2/S3 using short-lived upload credentials; the VPS should not be the middleman for large media payloads.
- **Database is the source of truth:** the database stores metadata, permissions, lifecycle state, asset references, and checksums. The object store stores bytes.
- **Private by default:** source videos and originals are private. Public delivery happens only through an authorization check and a short-lived signed URL or playback token.
- **Idempotent jobs:** retrying a job must not create duplicate movie records, duplicate billing, or corrupt files.
- **Provider abstraction:** define a storage interface so the application can use R2, S3, or another S3-compatible provider without rewriting business logic.

## 5. Recommended technology stack

| Layer | Recommended choice | Reason / trade-off |
|---|---|---|
| Web application | Next.js App Router + React + TypeScript | Full-stack routing, server rendering, API route handlers, and a mature production ecosystem. |
| Styling / components | Tailwind CSS + shadcn/ui or Radix primitives | Consistent, accessible components with control over visual quality. |
| Backend structure | Next.js route handlers + modular service layer | Avoids premature microservices. Extract a separate API later only if justified. |
| Database | Managed PostgreSQL 18 (or provider-supported stable version) | Relational rights, asset, user, job, and catalogue data fit PostgreSQL well. |
| ORM | Prisma 7 stable or Drizzle | Pick one; avoid adopting a release candidate for the first production build. |
| Authentication | Auth.js or a managed provider such as Clerk | Use secure session handling, email verification, MFA for admins, and database-backed roles. |
| Queue / workers | Redis + BullMQ | Retries, delayed jobs, concurrency controls, and rate limiting. |
| Object storage | Cloudflare R2 or S3-compatible storage | Media objects, originals, subtitles, and thumbnails; R2 has no direct egress charge under its current pricing model. |
| Video processing | Cloudflare Stream for suitable 360p–1080p workflows; otherwise a managed transcoder or isolated FFmpeg workers | Keep encoding away from the small web VPS. Verify resolution, codec, DRM, and pricing requirements before committing. |
| Search | PostgreSQL full-text search initially | No extra service until relevance, scale, or language needs justify one. |
| CDN / edge security | Cloudflare DNS, WAF, rate limits, cache rules | Protect the app and accelerate static/media delivery. |
| Testing | Vitest + Playwright | Unit/integration tests plus browser-level end-to-end tests. |
| Monitoring | Sentry + structured logs + OpenTelemetry | Errors, traces, worker failures, and operational visibility. |
| CI/CD | GitHub Actions | Lint, typecheck, tests, dependency audit, build, and deployment. |

**Version discipline:** use current stable releases when implementation begins, pin exact versions in the lockfile, and do not let an AI agent silently upgrade major dependencies mid-task.

## 6. Storage and media-delivery strategy

### Recommended role for each service

| Service | Use it for | Do not use it for |
|---|---|---|
| Cloudflare R2 / S3 | Private originals, authorized downloadable files, subtitles, thumbnails, manifests, and backups | Database records or secrets. |
| Cloudflare Stream or another managed video platform | Adaptive-bitrate playback, encoding, playback analytics, signed playback access | A general-purpose archive for every arbitrary file type. |
| Google Drive | Secondary private backup or internal collaboration for files the operator is authorized to store | Primary public movie CDN, hot streaming origin, or a way to bypass third-party service limits. |
| VPS local disk | Temporary processing scratch space, logs, Docker volumes, and small cache | Permanent media storage or a public file origin at scale. |

### R2 cost model (illustrative, based on documentation checked 6 Nov 2026)

Cloudflare's published R2 Standard storage price is currently $0.015 per GB-month, with no direct egress charge. Using decimal units for a rough estimate:

- 1 TB stored: about **$15/month** before operations and other services.
- 5 TB stored: about **$75/month**.
- 20 TB stored: about **$300/month**.

Actual billing depends on billable GB-months, request volume, storage class, and any connected metered services. Recheck current pricing before launch.

### Managed video pricing model

Cloudflare Stream currently bills by stored video minutes and delivered video minutes. Its published pricing states $5 per 1,000 minutes of stored video capacity per month and $1 per 1,000 minutes delivered. Its standard automatic encoding documentation currently describes 360p through 1080p. If 4K playback is a hard requirement, benchmark another provider or build a separate encoding pipeline before selecting the platform.

### Download delivery design

1. User requests a download from a movie detail page.
2. API verifies session, entitlement, rights grant, country/territory, expiry, content status, and rate limit.
3. API creates a short-lived download grant and logs the event.
4. API returns a short-lived signed URL with the correct content disposition.
5. Storage/CDN serves the file, supporting HTTP Range requests for resumable downloads where supported.
6. The application records an event without exposing storage credentials or permanent public object paths.

Do not proxy a multi-gigabyte download through a Next.js serverless function.

## 7. Google One: four separate 5 TB accounts

The four accounts are separate Google identities and separate storage allocations. They are not automatically one 20 TB Google Drive volume. The site should therefore not assume that the four accounts behave like one reliable origin store.

### Recommended use

- Keep Google Drive as a **secondary backup / private archive**, not the primary public delivery path.
- Connect each account using its own explicit Google OAuth authorization.
- Request only the Drive scopes required for the backup workflow.
- Store OAuth refresh tokens encrypted at rest; never put them in frontend code, source control, logs, or a public environment variable.
- Maintain a backup manifest with file ID, account reference, checksum, size, backup timestamp, and restore status.
- Perform periodic restore tests. A backup that has never been restored is not a proven backup.

### Important corrections to the earlier conversation

- Google documentation says service accounts do not have their own Drive storage quota and cannot own files; use OAuth on behalf of a real account or a properly configured shared drive where appropriate.
- Google's published 750 GB-per-day upload limit in the cited Drive API documentation is explicitly described for Google Workspace users. Do not assume that the same exact rule necessarily applies to every consumer Google One account.
- Do not implement account rotation to evade quotas or policy limits. Respect account-specific limits and Google terms.
- A Drive storage plan is not a content-distribution license. You still need rights to every movie file.

## 8. Existing VPS assessment: 2 vCPU / 8 GB RAM / 100 GB disk

### Verdict

**Good for development, staging, and a low-traffic pilot control plane. Not sufficient evidence of production readiness for a high-traffic media platform.**

### Suitable workloads

- Docker Compose for the application and one or two small workers.
- Admin dashboard and API for a pilot.
- Metadata sync jobs and lightweight file checks.
- Queue processing at low concurrency.
- Temporary files only, with strict disk quotas.

### Workloads to offload

- Multi-tenant PostgreSQL for production: use a managed database or a separately backed-up database host.
- Large media upload: direct-to-object-storage, not through VPS disk.
- 1080p/4K transcoding at scale: managed transcoding or dedicated CPU/GPU workers.
- Public media traffic: object storage + CDN / managed video delivery.
- Redis in production: managed Redis or separately monitored, persistent deployment.

### What to verify about boxd.sh before relying on it

- Is the CPU dedicated or shared / throttled?
- Is there a hard monthly transfer cap or fair-use policy?
- Is the 1 Gbps port guaranteed or only a peak interface rate?
- Are inbound ports, Docker, systemd, and long-running workers allowed?
- Is outbound traffic unrestricted to Google APIs and the selected storage provider?
- Are backups/snapshots available, and what is the restore process?
- Is uptime or support guaranteed on the free tier?
- Can the instance be upgraded without rebuilding the application?

Do not infer download speed from the vCPU and RAM specifications alone. Actual throughput depends on provider limits, route quality, storage performance, and destination throttling.

## 9. User-facing website requirements

### Public pages

- `/` — editorial homepage: hero feature, trending/curated collections, new additions, genres, languages.
- `/movies` — catalogue with filters, sorting, pagination or cursor-based loading.
- `/movies/[slug]` — title detail, synopsis, artwork, cast, crew, runtime, release date, languages, subtitles, trailer, availability, legal notice, watch/download actions.
- `/search` — title/person/genre search with clear empty and loading states.
- `/collections/[slug]` — curated lists.
- `/genres/[slug]` and `/people/[slug]` — browse taxonomy and credits.
- `/watchlist` — user's saved titles.
- `/account` — profile, security, history, preferences.
- `/downloads` — authorized download history and expiry states.
- `/report-content` — report incorrect metadata or rights concerns.
- `/legal/terms`, `/legal/privacy`, `/legal/copyright`, `/legal/takedown`.

### Design direction

Use a premium cinema/editorial aesthetic rather than copying a piracy-site layout:

- Dark graphite / midnight palette with controlled accent color.
- Strong poster artwork, deliberate typography, generous spacing, and clear content hierarchy.
- Responsive poster rails, but do not make every section a carousel.
- Detail page should show availability and format clearly, not hide file properties in misleading buttons.
- Keyboard navigation, visible focus, sufficient contrast, reduced-motion support, semantic headings, and alt text.
- Loading skeletons, empty states, errors, offline states, and disabled states must be designed—not left as defaults.

## 10. Admin and operations console

### Core modules

1. **Dashboard:** total titles, published titles, pending rights reviews, active jobs, storage usage, recent downloads, failures, and reports.
2. **Catalogue manager:** create/edit movies, people, genres, language, artwork, translations, and collections.
3. **Rights manager:** owner/licensor, license evidence, territories, permitted actions, valid dates, monetization restrictions, allowed resolutions, and renewal dates.
4. **Media manager:** original file, processed derivatives, subtitles, thumbnails, checksum, size, MIME type, storage provider, object key, and status.
5. **Ingestion manager:** upload session, validation, queue state, retry, cancel, quarantine, and publish approval.
6. **Storage manager:** provider health, object counts, capacity, backup status, checksum drift, failed copies, and restore tests.
7. **User manager:** roles, suspensions, access history, and support actions.
8. **Reports/takedowns:** report intake, evidence, reviewer, decision, timestamps, and content-disable action.
9. **Audit log:** actor, action, target, before/after state, IP/device metadata where justified, and timestamp.

### Roles

- `VIEWER`: browse, watch/download only when entitled.
- `EDITOR`: edit catalogue metadata but cannot approve rights or publish restricted files.
- `MEDIA_OPERATOR`: manage uploads and processing jobs but cannot change licensing approvals.
- `RIGHTS_REVIEWER`: review rights evidence and approve/reject grants.
- `ADMIN`: full operational access with MFA.
- `SUPER_ADMIN`: sensitive platform configuration and access management.

Separate rights approval from media ingestion/publishing where possible. Use dual approval for high-risk content.

## 11. Authorized ingestion pipeline

Only accept files from:

- An owner or creator uploading content they control.
- A distributor or partner using a contractually authorized delivery process.
- A direct storage location or API that the operator is explicitly authorized to access.
- A verified public-domain / Creative Commons source after item-level rights review.

Do not make a general-purpose arbitrary URL fetcher. That creates SSRF, malware, copyright, and operational risks.

### Pipeline states

`DRAFT → RIGHTS_PENDING → RIGHTS_APPROVED → UPLOAD_PENDING → UPLOADING → UPLOADED → VALIDATING → QUARANTINED | PROCESSING → READY_FOR_REVIEW → PUBLISHED`

Failure, cancellation, expiry, and takedown are explicit terminal or recoverable states. Never let a worker mark content public merely because the upload succeeded.

### Job sequence

1. Create title and asset records; attach rights evidence.
2. Rights reviewer approves the relevant asset and use types.
3. Create a short-lived multipart upload intent for private object storage.
4. Browser uploads directly to storage.
5. Browser calls completion endpoint; server verifies object existence and expected size.
6. Worker calculates checksum and validates actual file type; do not trust filename extension.
7. Run malware scanning / quarantine policy and media probing (`ffprobe`).
8. Validate codec, duration, frame size, streams, subtitle tracks, and file integrity.
9. Process/transcode only to formats permitted by the license and product requirements.
10. Generate thumbnails and manifests from authorized media.
11. Reviewer approves publication.
12. Publish catalog record and access entitlements.
13. Schedule backup job and record its completion.

### Job-engine rules

- Every job has a stable idempotency key.
- Retries use exponential backoff and a maximum-attempt policy.
- Permanent failures move to a dead-letter / failed queue with a human-readable reason.
- Limit concurrency by worker type and storage/provider quota.
- Apply provider rate limits; never treat retries as a way to evade limits.
- Record progress and allow safe cancellation.
- Keep temporary-file cleanup jobs and disk-usage alerts.

## 12. Data model (initial relational design)

| Entity | Important fields / purpose |
|---|---|
| `User` | id, email, password/auth-provider reference, status, createdAt. |
| `UserRole` | userId, role, grantedBy, grantedAt. |
| `Movie` | id, slug, title, originalTitle, synopsis, releaseDate, year, runtime, language, country, ageRating, status. |
| `MovieTranslation` | movieId, locale, translated title/synopsis. |
| `Person` | name, profile image reference, biography where licensed. |
| `MovieCredit` | movieId, personId, role, character, order. |
| `Genre` / `MovieGenre` | normalized genre taxonomy. |
| `MediaAsset` | movieId, assetType, storageObjectId, source, technical metadata, status. |
| `StorageObject` | provider, bucket, objectKey, sizeBytes, checksum, contentType, encryption state, lifecycle. |
| `RightsGrant` | assetId/movieId, rightsHolder, territory, permittedUse, validFrom, validTo, monetization, allowedResolutions, approvalStatus. |
| `RightsEvidence` | rightsGrantId, evidenceObjectId, contract/reference, reviewer, decision, audit metadata. |
| `SubtitleTrack` | assetId, language, format, forced/default flags, storageObjectId. |
| `IngestionJob` | type, assetId, queueId, status, attempts, progress, errorCode, idempotencyKey. |
| `DownloadGrant` | userId, assetId, expiresAt, entitlement, tokenHash, revokedAt. |
| `DownloadEvent` | userId, movieId, assetId, timestamp, result, bytes where available. |
| `PlaybackEvent` | userId/session, movieId, timestamp, duration, device class, consent policy. |
| `WatchlistItem` | userId, movieId, createdAt. |
| `ProviderConnection` | provider, ownerUserId, encrypted credential reference, scopes, status. |
| `TakedownCase` | reporter, asset/movie, reason, evidence, status, resolution, timestamps. |
| `AuditLog` | actor, action, resource, before/after, timestamp, traceId. |

Use foreign keys, unique constraints, indexes, and database transactions for rights approval and publish operations. Store large binary files outside PostgreSQL.

## 13. API surface (example contract)

### Public endpoints

- `GET /api/v1/movies` — filter/sort/paginate published titles only.
- `GET /api/v1/movies/:slug` — public metadata plus currently available actions.
- `GET /api/v1/search?q=` — search title, people, genres.
- `POST /api/v1/movies/:id/watch-session` — verify access and issue a short-lived playback token.
- `POST /api/v1/movies/:id/download-session` — verify rights/entitlement and issue short-lived download URL.
- `POST /api/v1/watchlist/:movieId` — add/remove user's watchlist entry.
- `POST /api/v1/reports` — submit metadata or rights report.

### Admin endpoints

- `POST /api/admin/movies` — create draft title.
- `PATCH /api/admin/movies/:id` — edit metadata.
- `POST /api/admin/rights-grants` — create rights grant.
- `POST /api/admin/rights-grants/:id/approve` — rights reviewer approval.
- `POST /api/admin/ingestions` — create authorized media ingestion.
- `POST /api/admin/ingestions/:id/upload-intent` — generate direct upload instructions.
- `POST /api/admin/ingestions/:id/complete` — verify upload completion and enqueue processing.
- `GET /api/admin/jobs` — monitor jobs.
- `POST /api/admin/jobs/:id/retry` — retry allowed failed job.
- `POST /api/admin/movies/:id/publish` — publish only after rights and media checks pass.
- `POST /api/admin/takedowns/:id/resolve` — resolve a case and disable access where required.

All admin routes require server-side role checks. Hiding an admin button in the UI is not authorization.

## 14. Security, privacy, and compliance

### Required controls

- MFA for all privileged accounts.
- RBAC and object-level authorization on every sensitive API operation.
- Short-lived signed upload, playback, and download URLs.
- Least-privilege OAuth scopes and encrypted refresh tokens.
- Secrets stored in a secret manager or protected environment, never committed.
- Secure cookies, CSRF protections where applicable, CSP, HSTS, and strict CORS.
- Request validation with a schema library; output validation for external provider data.
- Rate limits for login, search, upload intent, playback, download, and report endpoints.
- Upload size limits, file signature detection, archive-bomb protection, malware quarantine, and checksum validation.
- SSRF protection: do not fetch arbitrary user-submitted URLs from the server; allowlist authorized providers and validate destinations.
- Avoid shell command construction with user input. If invoking FFmpeg/ffprobe, pass a fixed executable and a validated argument array with `shell: false`.
- Audit privileged actions and rights changes.
- Encrypt sensitive fields and backups; define retention and deletion policies.
- Test backup restoration and disaster recovery.
- Security review against OWASP API Security Top 10.

### Copyright and rights workflow

- Store a rights grant for each film / media asset and each allowed use (stream, download, trailer, artwork, subtitle).
- Record territory, date range, exclusivity, monetization, resolution, language, and distributor restrictions.
- Block publication when evidence is missing, expired, ambiguous, or rejected.
- Provide an accessible rights-contact and report/takedown channel.
- Support immediate unpublish / access revocation and a complete audit trail.
- Keep metadata-provider licensing separate from film distribution rights.
- Obtain advice from a qualified Bangladesh copyright professional before commercial launch and before making any cross-border availability decisions.

## 15. Search, metadata, and content sourcing

### Metadata providers

- **TMDb:** useful for title metadata and artwork workflows. Its FAQ says the developer API is free for non-commercial use with attribution; revenue-oriented commercial projects should contact TMDb for commercial licensing. A TMDb metadata response does not grant the right to distribute a movie file.
- **IMDb datasets:** IMDb's help page restricts the datasets to personal/non-commercial use and prohibits republishing/repurposing them as an online movie-information database. Do not build a commercial/public catalogue from those datasets without an appropriate license.
- **OMDb / other providers:** review their current license, caching, attribution, and commercial terms before integrating.
- **Public-domain / Creative Commons repositories:** verify the rights of each individual work and each embedded component. Do not infer that every item on a repository is public domain.

Start with a provider adapter interface so metadata sources can be changed without coupling the database schema to one vendor.

### Search implementation

Start with PostgreSQL full-text search, normalized title aliases, trigram/fuzzy matching where useful, and indexes. Add Meilisearch/OpenSearch only when the measured search experience or load requires it.

## 16. Suggested repository structure

```text
movie-platform/
├── apps/
│   ├── web/                       # Next.js application
│   └── worker/                    # BullMQ worker process
├── packages/
│   ├── db/                        # schema, migrations, repositories
│   ├── config/                    # shared config and env validation
│   ├── contracts/                 # Zod schemas and API types
│   ├── ui/                        # shared UI components
│   ├── storage/                   # R2/S3 provider adapter
│   ├── metadata/                  # TMDb / licensed provider adapters
│   └── rights/                    # rights evaluation and policy engine
├── infra/
│   ├── docker/
│   ├── cloudflare/
│   └── scripts/
├── docs/
│   ├── architecture.md
│   ├── threat-model.md
│   ├── rights-and-content-policy.md
│   ├── runbook.md
│   └── adr/                       # architecture decision records
├── tests/
│   ├── integration/
│   └── e2e/
├── .github/workflows/
├── .env.example
├── docker-compose.yml
└── README.md
```

## 17. Environment variables (names only; do not commit secrets)

```dotenv
NODE_ENV=development
APP_URL=http://localhost:3000

DATABASE_URL=
REDIS_URL=
AUTH_SECRET=

S3_ENDPOINT=
S3_REGION=auto
S3_BUCKET_PRIVATE=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

VIDEO_PROVIDER=
VIDEO_PROVIDER_ACCOUNT_ID=
VIDEO_PROVIDER_API_TOKEN=

TMDB_API_KEY=
TMDB_COMMERCIAL_LICENSE_CONFIRMED=false

GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=
TOKEN_ENCRYPTION_KEY=

SENTRY_DSN=
POSTHOG_KEY=
```

Use an environment schema that fails fast when required configuration is missing. `TMDB_COMMERCIAL_LICENSE_CONFIRMED` is a deployment gate, not a substitute for an actual license agreement.

## 18. Deployment topology

### Development

- Local Next.js app.
- Local Docker Compose Redis.
- Local or managed PostgreSQL.
- R2 development bucket with private access.
- Small sample media that is owned / licensed / public-domain verified.

### Staging

- Staging app on the VPS or a preview deployment.
- Separate staging database, Redis namespace, and storage bucket.
- Non-production OAuth credentials.
- Fake/synthetic users and test media.
- CI deploy only after tests pass.

### Production

- Cloudflare DNS/WAF in front of the application.
- Next.js app on a reliable managed host or properly monitored VPS.
- Managed PostgreSQL with automated backups and point-in-time recovery where available.
- Managed Redis or dedicated Redis with persistence/monitoring.
- R2/S3 private bucket for originals and authorized downloads.
- Managed video delivery or isolated encoding workers.
- Separate worker deployment with queue metrics and concurrency controls.
- Sentry/OpenTelemetry and uptime monitoring.
- Tested backup and incident-response runbooks.

## 19. Testing and release gates

### Unit tests

- Rights grant validity and territory evaluation.
- User entitlement and role policies.
- Signed URL expiry and revocation.
- Metadata normalization and deduplication.
- Job state transitions and retry rules.

### Integration tests

- Database transaction for rights approval + publish.
- Upload-intent creation and upload completion verification.
- Queue event -> validation -> processing -> review pipeline.
- Storage adapter and checksum consistency.
- OAuth token refresh and revocation handling.

### End-to-end tests

- Viewer can browse and search published titles.
- Viewer cannot see unpublished titles or unauthorized assets.
- Viewer without entitlement cannot create a playback/download session.
- A valid user can receive an expiring authorized URL.
- Admin without rights-review role cannot approve rights.
- Takedown action immediately disables future access.
- Worker failure is visible and can be safely retried.

### Initial launch targets (set as measurable SLOs, then verify)

- No unapproved content can be published through UI or API.
- No permanent public URL to private originals.
- Every published downloadable/streamable asset has a current rights grant.
- Critical API routes have rate limits and object-level authorization.
- Job retries are idempotent.
- A tested database restore and media-backup restore have been completed.
- Establish and measure API p95 latency, search latency, playback-start time, worker queue age, error rate, and storage cost before increasing traffic.

## 20. Practical build sequence

### Milestone 0 — rights, product definition, and accounts

- Choose the business model: free public-domain library, creator platform, licensed distributor catalogue, or subscription service.
- Confirm the first 10–20 titles are legally distributable for the intended territories and use types.
- Decide whether MVP is download-only, stream-only, or both.
- Obtain necessary metadata, artwork, video, subtitle, and distribution permissions.
- Create Cloudflare, database, auth, monitoring, and source-control accounts.

**Exit condition:** every pilot title has a documented rights decision and source provenance.

### Milestone 1 — foundation

- Scaffold Next.js App Router + TypeScript.
- Set up lint, typecheck, formatting, unit tests, Playwright, and CI.
- Create PostgreSQL schema and migrations.
- Implement authentication, RBAC, audit log, and environment validation.
- Build a responsive design system and public/admin route shells.

**Exit condition:** protected admin routes and public app work end-to-end with test data.

### Milestone 2 — catalogue and discovery

- Movie, people, genre, language, translation, and collection CRUD.
- Metadata-provider adapter and licensed API integration.
- Search, filters, pagination, movie detail, and watchlist.

**Exit condition:** complete catalogue UX works without media distribution enabled.

### Milestone 3 — rights and ingestion

- Rights grants, evidence uploads, reviewer workflow, and publication guards.
- Private object-storage integration and direct multipart upload.
- Worker queue, file validation, checksum, `ffprobe`, malware scan, and retry policy.

**Exit condition:** authorized sample file reaches `READY_FOR_REVIEW` with verified checksum and valid rights record.

### Milestone 4 — watch/download

- Signed download session and/or playback session.
- Entitlement, territory, date, rate-limit, and audit checks.
- HTTP Range / resumable delivery tests.
- Subtitle and playback UI.

**Exit condition:** an authorized user can access the correct media; an unauthorized user cannot.

### Milestone 5 — operations and reliability

- Admin dashboard, job monitor, storage monitor, takedown/report handling.
- Monitoring, logs, alerts, backups, restore tests, and runbooks.
- Load, security, accessibility, and cross-browser tests.

**Exit condition:** operational checklist passes and recovery is demonstrated.

### Milestone 6 — controlled launch

- Start with a limited catalogue and a small invited audience.
- Measure storage, delivery, API, search, worker, and support costs.
- Fix incidents and UX friction before scaling.
- Add paid subscriptions only after rights and payment-provider compliance are verified.

---

# PART II — SKILLS AND LEARNING RESOURCES

## 21. Required skills

| Skill area | What you need to be able to do | Priority |
|---|---|---|
| TypeScript / modern JavaScript | Strict typing, async workflows, error handling, schema validation | Must-have |
| React + Next.js App Router | Server/client boundaries, route handlers, forms, caching, deployment | Must-have |
| Backend architecture | Modular services, authorization, API contracts, idempotency | Must-have |
| PostgreSQL | Relational modeling, constraints, transactions, indexes, full-text search | Must-have |
| Authentication / security | OAuth, sessions, RBAC, MFA, token encryption, CSRF, SSRF | Must-have |
| Object storage | S3 API, multipart uploads, presigned URLs, checksums, lifecycle rules | Must-have |
| Redis + BullMQ | Queues, workers, retries, backoff, concurrency, dead-letter handling | Must-have |
| Linux / Docker | SSH, systemd, Docker Compose, logs, disk/network monitoring, backups | Must-have |
| Media fundamentals | Containers, codecs, bitrate, resolution, HLS/DASH, subtitles, `ffprobe` | Important |
| FFmpeg | Probe, validate, transcode, extract thumbnails, package media | Important; offload heavy jobs |
| Testing | Unit, integration, end-to-end, security, load, restore tests | Must-have |
| Observability | Structured logs, metrics, traces, alerts, error triage | Must-have before production |
| Product / UI design | Information architecture, responsive layout, accessibility, empty/error states | Must-have |
| Rights operations | Asset provenance, license review, territory, permitted use, takedown workflow | Must-have for launch |

## 22. Official learning and reference links

### Application and data layer

- Next.js App Router: https://nextjs.org/docs/app/getting-started
- PostgreSQL documentation: https://www.postgresql.org/docs/current/
- PostgreSQL full-text search: https://www.postgresql.org/docs/current/textsearch.html
- Prisma documentation: https://docs.prisma.io/docs/orm
- BullMQ workers: https://docs.bullmq.io/guide/workers
- BullMQ retry policies: https://docs.bullmq.io/guide/retrying-failing-jobs
- BullMQ rate limiting: https://docs.bullmq.io/guide/rate-limiting

### Media and storage

- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Cloudflare R2 S3 compatibility: https://developers.cloudflare.com/r2/api/s3/api/
- Cloudflare Stream overview: https://developers.cloudflare.com/stream/
- Cloudflare Stream pricing: https://developers.cloudflare.com/stream/pricing/
- Cloudflare Stream signed URLs: https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/
- FFmpeg documentation: https://ffmpeg.org/ffmpeg.html

### Identity, rights, and security

- Google OAuth web-server flow: https://developers.google.com/identity/protocols/oauth2/web-server
- Google Drive API limits: https://developers.google.com/workspace/drive/api/guides/limits
- Google Drive API errors (service-account note): https://developers.google.com/workspace/drive/api/guides/handle-errors
- TMDb API FAQ and licensing: https://developer.themoviedb.org/docs/faq
- IMDb data-use policy: https://help.imdb.com/article/imdb/general-information/can-i-use-imdb-data-in-my-software/G5JTRESSHJBBHTGX
- OWASP API Security Top 10: https://owasp.org/www-project-api-security/
- Bangladesh Copyright Office — laws: https://copyrightoffice.gov.bd/pages/laws

---

# PART III — AI CODING-AGENT MASTER PROMPT

Copy the prompt below into your coding agent (Codex, Claude Code, Gemini CLI, Cursor Agent, or another repository-aware coding agent). Run it in the project repository. The agent should inspect the repository first and implement one milestone at a time.

```text
You are the Staff Software Architect, Senior Full-Stack Engineer, Media Systems Engineer, Security Engineer, QA Lead, and Product Designer responsible for building a production-grade Movie Discovery & Authorized Media Distribution Platform.

PROJECT MISSION
Build a complete, modern, responsive movie catalogue and authorized media distribution platform from scratch. The platform must support only movies and media assets that the operator owns, is licensed to distribute, or has individually verified as public-domain / appropriately licensed for the relevant territory and usage. It must include the public website, admin CMS, rights-management workflow, authorized media ingestion, file processing, private storage, signed playback/download, monitoring, security, and production deployment documentation.

LEGAL AND SAFETY BOUNDARIES — NON-NEGOTIABLE
1. Do not scrape piracy sites or extract copyrighted movie files from unauthorized sources.
2. Do not bypass Cloudflare, CAPTCHAs, shortlinks, paywalls, access controls, anti-bot protections, or download restrictions.
3. Do not build torrent/magnet acquisition from unauthorized sources, mirror-leech tooling, or account-rotation logic to evade storage/provider quotas.
4. Do not assume a title's metadata, poster, trailer, subtitles, or file is free to use because it appears online.
5. Support only owner uploads, licensed partner feeds, or explicitly authorized storage/API sources.
6. Every distributable media asset must have a verified rights record covering the specific use (stream/download/trailer/artwork/subtitle), territory, validity period, and applicable restrictions.
7. If rights are missing, ambiguous, expired, or rejected, block publication and block playback/download. Do not make assumptions to pass the gate.
8. If the user requests an unsafe/unauthorized source integration, explain the issue and provide the lawful provider-upload or licensed-API alternative.

WORKING STYLE
- First inspect the repository, current files, package manager, existing code, and deployment configuration. Do not overwrite useful work.
- If the repo is empty, scaffold the architecture below. If code exists, propose a migration plan before large refactors.
- Begin by writing `docs/implementation-plan.md`, `docs/architecture.md`, `docs/threat-model.md`, `docs/rights-and-content-policy.md`, and `docs/adr/` decisions.
- Work in small, reviewable milestones. After each milestone: run format, lint, typecheck, unit tests, integration tests where available, and build. Fix failures before moving on.
- Do not claim a feature is complete unless code, tests, and documentation support the claim.
- Use the current stable release of each dependency at implementation time, pin versions in the lockfile, and explain any version choice. Do not silently introduce release-candidate dependencies.
- Prefer a modular monolith plus background workers. Do not introduce microservices or Kubernetes without measured need.
- Never hardcode secrets. Provide `.env.example` with placeholder names only and validate environment variables at startup.
- Use accessible components, semantic HTML, keyboard support, visible focus, responsive layouts, and reduced-motion support.
- Avoid generic AI-generated UI. Produce a distinctive premium cinema/editorial interface with clear hierarchy and thoughtful loading, empty, error, and disabled states.

TARGET STACK
- Next.js App Router, React, TypeScript (strict mode).
- Tailwind CSS and shadcn/ui or Radix primitives.
- PostgreSQL with a stable ORM (Prisma 7 or Drizzle; verify current stable versions before choosing).
- Auth.js or a secure managed auth provider; database-backed RBAC; MFA for privileged roles.
- Redis + BullMQ for asynchronous jobs.
- Cloudflare R2 or another S3-compatible private object store.
- Cloudflare Stream or another managed video platform for suitable streaming workflows; use isolated FFmpeg workers when required. Verify codec, max resolution, DRM, delivery, and pricing requirements.
- PostgreSQL full-text search first; add Meilisearch/OpenSearch only when needed.
- Vitest and Playwright.
- Sentry and structured logs; add OpenTelemetry where practical.
- GitHub Actions for CI/CD.

SYSTEM MODULES
1. Identity & Access: users, sessions, email verification, admin MFA, RBAC, permission checks.
2. Catalogue: movies, translations, people, credits, genres, languages, countries, collections, trailers, artwork.
3. Rights: rights holders, evidence, territories, use types, valid dates, monetization rules, resolution restrictions, approval/rejection, renewal alerts.
4. Media Library: original assets, processed variants, subtitles, thumbnails, checksums, object keys, storage provider, technical metadata.
5. Ingestion: owner/partner upload workflows, multipart upload, validation, malware quarantine, ffprobe, processing, review, publish.
6. Delivery: entitlement and rights checks, signed playback/download sessions, expiring URLs, range/resume support, event logging.
7. Operations: job monitoring, retries, dead-letter queue, storage health, reports/takedowns, audit logs, backup and restore status.
8. Discovery: catalogue pages, search, filters, sorting, collections, watchlist, download history.
9. Observability: structured logs, error reports, metrics, alerts, trace IDs, incident runbooks.

PUBLIC ROUTES
- `/`
- `/movies`
- `/movies/[slug]`
- `/search`
- `/collections/[slug]`
- `/genres/[slug]`
- `/people/[slug]`
- `/watchlist`
- `/account`
- `/downloads`
- `/report-content`
- `/legal/terms`
- `/legal/privacy`
- `/legal/copyright`
- `/legal/takedown`

ADMIN ROUTES
- `/admin`
- `/admin/movies`
- `/admin/movies/new`
- `/admin/people`
- `/admin/genres`
- `/admin/rights`
- `/admin/rights/review`
- `/admin/media`
- `/admin/ingestions`
- `/admin/jobs`
- `/admin/storage`
- `/admin/users`
- `/admin/reports`
- `/admin/audit`
- `/admin/settings`

INITIAL DATABASE ENTITIES
User, UserRole, Movie, MovieTranslation, Person, MovieCredit, Genre, MovieGenre, MediaAsset, StorageObject, RightsGrant, RightsEvidence, SubtitleTrack, IngestionJob, DownloadGrant, DownloadEvent, PlaybackEvent, WatchlistItem, ProviderConnection, TakedownCase, AuditLog.
Use foreign keys, constraints, indexes, transactions, and explicit enums for states. Keep large binaries in object storage, not the relational database.

RIGHTS POLICY ENGINE
Create a server-only rights evaluation service. Given an asset, requested action, user/territory, and current timestamp, it must return an explicit allow/deny decision plus a machine-readable reason. It must check:
- rights approval status;
- asset and movie publication status;
- allowed use type (stream/download/etc.);
- territory;
- valid-from and valid-to dates;
- monetization constraints;
- resolution / format restrictions;
- user entitlement and account state;
- takedown / revocation status.
All public playback and download endpoints must call this service. The UI is not a security boundary.

INGESTION PIPELINE
Use explicit states such as:
DRAFT -> RIGHTS_PENDING -> RIGHTS_APPROVED -> UPLOAD_PENDING -> UPLOADING -> UPLOADED -> VALIDATING -> QUARANTINED or PROCESSING -> READY_FOR_REVIEW -> PUBLISHED.
A successful upload alone must never publish content.

For each ingestion:
1. Confirm an approved rights grant exists.
2. Create a private, short-lived multipart upload intent.
3. Upload directly from browser/partner to object storage.
4. Verify object existence and expected size server-side.
5. Calculate a cryptographic checksum.
6. Validate actual MIME/file signature, not only extension.
7. Apply malware/quarantine checks.
8. Probe technical metadata with ffprobe.
9. Validate allowed codec, duration, resolution, streams, and subtitles.
10. Enqueue processing with an idempotency key.
11. Generate permitted derivatives, thumbnails, and manifests.
12. Move to READY_FOR_REVIEW.
13. Require authorized reviewer approval before publication.
14. Schedule a backup and record its checksum/restore metadata.

Do not add an arbitrary URL downloader. If a partner integration is required, use a documented, authenticated, allowlisted provider API and only the permissions granted by the content owner.

JOB ENGINE
- Use BullMQ workers for metadata sync, file verification, scanning, media probing, transcoding, thumbnail generation, backup, cleanup, and notification.
- Implement attempts, exponential backoff, maximum retry count, concurrency limits, provider-aware rate limits, job progress, cancellation, and a failed/dead-letter state.
- Make every job idempotent.
- Never retry a provider error indefinitely or use retries to evade rate limits.
- Track queue age, failure rate, duration, and storage/disk pressure.

STORAGE DESIGN
- Use a private bucket for originals and restricted media.
- Use short-lived signed URLs or a trusted delivery proxy for access.
- Never store permanent public URLs to private originals in public API responses.
- Keep original and derivative objects separate.
- Store object metadata: provider, bucket, key, size, content type, checksum, encryption state, createdAt, lifecycle state.
- Add lifecycle rules, cleanup for incomplete multipart uploads, and periodic integrity checks.
- Google Drive may be implemented as a private secondary backup integration only, using explicit per-account OAuth consent and encrypted refresh tokens. Do not use service accounts as file owners; do not implement account rotation to evade quotas; do not use Drive as the public CDN.

DOWNLOAD / PLAYBACK SECURITY
- Verify the authenticated user or public entitlement.
- Run the rights policy engine for every request.
- Issue a short-lived signed URL/token, scoped to one asset and one action.
- Ensure revocation and takedown are honored for newly issued sessions.
- Support HTTP Range where the delivery provider supports it.
- Apply IP/user/device-aware rate limits with privacy-conscious retention.
- Log access outcome and reason without logging tokens or secrets.

API CONTRACTS
Implement typed, validated APIs including:
- GET `/api/v1/movies`
- GET `/api/v1/movies/:slug`
- GET `/api/v1/search`
- POST `/api/v1/movies/:id/watch-session`
- POST `/api/v1/movies/:id/download-session`
- POST `/api/v1/watchlist/:movieId`
- POST `/api/v1/reports`
- POST `/api/admin/movies`
- PATCH `/api/admin/movies/:id`
- POST `/api/admin/rights-grants`
- POST `/api/admin/rights-grants/:id/approve`
- POST `/api/admin/ingestions`
- POST `/api/admin/ingestions/:id/upload-intent`
- POST `/api/admin/ingestions/:id/complete`
- GET `/api/admin/jobs`
- POST `/api/admin/jobs/:id/retry`
- POST `/api/admin/movies/:id/publish`
- POST `/api/admin/takedowns/:id/resolve`
All admin operations must enforce role and object-level authorization on the server.

UI / UX DIRECTION
Create a premium cinema/editorial identity. Use a dark graphite or midnight base, controlled accent color, high-quality licensed artwork, strong typography, clean spacing, deliberate poster grids, and clear availability labels. Do not copy any specific piracy website. Avoid excessive neon, random gradients, giant glass cards, noisy animations, or generic AI slop. Build responsive desktop/tablet/mobile layouts. Include loading skeletons, empty states, error recovery, disabled states, focus states, and accessible contrast.

SECURITY BASELINE
- MFA for admins and sensitive roles.
- Secure sessions/cookies, CSRF protections where applicable, CSP, HSTS, strict CORS.
- Rate limits and brute-force protections.
- Validate all inputs and external provider responses.
- Prevent SSRF; do not fetch arbitrary user URLs.
- Avoid shell interpolation; use fixed executable paths and validated argument arrays with shell disabled.
- Encrypt OAuth refresh tokens and sensitive evidence.
- Audit all rights changes, role changes, publishing, takedowns, and storage operations.
- Apply upload limits, file signature checks, malware quarantine, archive-bomb defenses, and storage lifecycle cleanup.
- Review against OWASP API Security Top 10, especially broken object-level authorization, broken authentication, unrestricted resource consumption, SSRF, and unsafe third-party API consumption.

TEST REQUIREMENTS
Write tests for:
- Rights evaluation across territory/date/use/entitlement combinations.
- Unpublished/expired/revoked content denial.
- Role and object-level access control.
- Signed URL scope and expiry.
- Upload completion validation and checksum mismatch.
- Idempotent processing and safe retries.
- Takedown access revocation.
- OAuth refresh and failure handling.
- Public search and detail pages.
- Admin cannot approve rights without the rights-review permission.
- End-to-end authorized and unauthorized watch/download flows.
Use realistic test fixtures that contain only owned, licensed, or public-domain-verified media.

DEPLOYMENT TARGET
- Development: local app + Docker Redis + local/managed Postgres + private test bucket.
- Staging: isolated database, Redis namespace, bucket, OAuth keys, and synthetic test assets.
- Production: Cloudflare DNS/WAF, reliable Next.js host, managed PostgreSQL, managed Redis, private R2/S3, managed video delivery or isolated encoding workers, monitoring, backups, and tested restore runbooks.
- The supplied 2 vCPU / 8 GB RAM / 100 GB VPS is a development/staging or small pilot worker only until its CPU, bandwidth, disk I/O, egress, port, and uptime limits are measured. Do not assume it is a production media origin.

REQUIRED DELIVERABLES
1. Working application with public and admin routes.
2. Database schema and migrations.
3. `.env.example` and configuration validation.
4. Dockerfile and Docker Compose for local development.
5. Queue/worker implementation.
6. Storage adapter and signed upload/download flow.
7. Rights ledger and server-enforced policy engine.
8. Test suite and CI workflow.
9. Seed data containing only clearly identified demo titles and rights-safe placeholder assets.
10. README with setup, development, testing, deployment, and operations.
11. Architecture diagram, threat model, rights/content policy, API documentation, runbooks, and ADRs.
12. A deployment checklist and a backup/restore test report template.

IMPLEMENTATION ORDER
Milestone 0: inspect repo, define assumptions, write docs and threat model.
Milestone 1: scaffold, CI, database, auth, RBAC, audit log, design system.
Milestone 2: catalogue CRUD, metadata adapter, search, public pages.
Milestone 3: rights grants, evidence, review, publication guard.
Milestone 4: private storage, direct multipart upload, worker jobs, validation.
Milestone 5: signed playback/download, entitlements, range/resume testing.
Milestone 6: admin operations, takedown, monitoring, backup/restore.
Milestone 7: security, accessibility, load testing, staging and controlled production release.

FIRST RESPONSE REQUIRED FROM YOU, THE AGENT
Before changing code, return:
1. Repository inspection summary.
2. Assumptions and unresolved decisions.
3. Proposed architecture and trade-offs.
4. Risks and security concerns.
5. Milestone plan with files/modules to create.
6. The exact first implementation step.
Then implement Milestone 1 (or the next incomplete milestone if the repository already contains work). Do not attempt to generate the entire platform in one giant code dump.
```

---

# PART IV — DECISIONS TO MAKE BEFORE CODING

Answer these in the project README / product brief before enabling public downloads:

1. **Content model:** creator-owned independent films, a distributor's licensed catalogue, public-domain works, or a combination?
2. **Territories:** Bangladesh only at first, or multiple countries? Rights can differ by territory.
3. **Experience:** download-only, streaming-only, or both?
4. **Quality:** 720p/1080p only, or must the first release support 4K?
5. **Business model:** free, ad-supported, subscription, rental, or partner distribution?
6. **Metadata/artwork:** which provider has granted the required commercial use rights?
7. **Storage:** R2/S3 as primary media storage, with Google Drive only as backup?
8. **Operations:** who reviews rights evidence and responds to takedown reports?

## Recommended first version

For a solo developer using the current 2 vCPU / 8 GB / 100 GB VPS, the most realistic first release is:

- Next.js modular monolith.
- Managed PostgreSQL.
- Redis + BullMQ worker on the VPS.
- Cloudflare R2 for private originals and authorized downloads.
- Managed video delivery only if streaming is required; otherwise launch with secure authorized downloads first.
- TMDb only after commercial licensing is resolved; otherwise use creator-supplied metadata and appropriately licensed sources.
- A strict rights approval gate before anything is published.

This lets you validate the product and workflow without pretending that a small free VPS or four consumer cloud-storage accounts are a production CDN.

---

# PART V — V2 DEEP ENGINEERING SPECIFICATION

> This section expands the original blueprint into an implementation-level plan. It supersedes any shorter, less specific suggestion earlier in this document where the two differ. Automated file collection means ingestion from owner uploads, contracted distributors, and explicitly authorized provider integrations—not scraping or bypassing third-party protections.

## 24. Product definition and operating assumptions

### 24.1 Product statement

Build a premium, bilingual-ready movie discovery platform that combines a searchable catalogue; editorial discovery; territory-aware availability; a private digital media library with chain of custody for every original and derivative; and an operations system for authorized ingestion, review, processing, publication, backup, reporting and takedown.

The website should feel like a well-designed film product, not a link farm. The interface must never imply that a movie is downloadable merely because its metadata exists in the catalogue.

### 24.2 Source conversation translated into requirements

| User-provided context | Engineering interpretation | Decision |
|---|---|---|
| Wants one complete movie website | One product with public app and operations console | One repository and one coherent deployment plan |
| Wants movie database/catalogue | Searchable title, person, genre, language and collection records | Licensed metadata provider(s) plus editorial overrides |
| Wants to collect video files automatically | Automated intake from sources the operator is allowed to access | Source adapters with allowlists and explicit authorization |
| Wants files moved to cloud storage | Media lifecycle and storage-provider abstraction | Primary object store plus optional private backups |
| Has four separate 5 TB Google One accounts | Four separate identity/storage destinations | Separate backup destinations, not one pooled filesystem |
| Has 2 vCPU, 8 GB RAM, 100 GB VPS | Small control-plane / low-concurrency worker | No public media origin or sustained 4K transcoding on this host |
| Wants production-ready architecture | Reproducible environments, observability, tests, security, backups and operations | Modular monolith + queue workers first |

### 24.3 Explicit assumptions to document before implementation

1. The operator owns the media, is an authorized distributor, or has item-level permission to distribute it.
2. Metadata, poster, trailer, subtitles, original file, streaming derivatives and downloadable files can have different rights.
3. Rights vary by territory, date, audience, monetization model and quality.
4. A catalogue may contain titles without playable files; label them catalogue-only or unavailable.
5. The MVP is initially Bangladesh-focused, but the data model supports territory-specific rules. Never infer worldwide rights from a Bangladesh-only license.
6. The MVP is a web application. Mobile/TV apps, DRM, paid plans and partner self-service are later phases.
7. The free VPS is not assumed to have production-grade uptime, dedicated CPU or guaranteed bandwidth. Verify its actual plan and terms.

## 25. Product requirements document (PRD)

### 25.1 Personas

- **Visitor:** discovers a movie and inspects synopsis, cast, language, runtime, trailer and availability without an account.
- **Registered viewer:** saves titles, maintains a watchlist, resumes viewing where supported, checks history and manages preferences.
- **Catalogue editor:** adds/corrects titles, credits, posters, genres, translations and collections, but cannot approve distribution rights.
- **Media operator:** uploads/imports authorized media, inspects technical metadata, monitors validation/processing, retries recoverable jobs and checks storage integrity.
- **Rights reviewer:** inspects evidence, approves/rejects rights grants, sets territory/date restrictions and protects publication integrity.
- **Administrator:** manages users, roles, settings, reports, takedowns, service health and audit records.
- **Content partner (future):** submits titles/files through a scoped partner portal and sees intake status without access to other partners' content.

### 25.2 Primary user journeys

**A — Discover a title:** visitor opens home → selects collection/genre/language/search result → opens detail page → sees metadata, artwork, credits, trailer, subtitles and availability. If the user is outside the permitted territory or the rights window expired, show an unavailable state rather than a broken button.

**B — Create account and save titles:** visitor registers/signs in → completes verification if enabled → adds title to watchlist → list persists server-side → user may remove title and use privacy controls.

**C — Ingest an owner-authorized file:** admin creates/selects title → rights reviewer approves asset grant → media operator creates ingestion → backend creates short-lived upload session → browser uploads directly to private object storage → completion endpoint verifies object and enqueues validation → worker hashes, inspects, scans and probes → permitted derivatives are generated → reviewer checks playback/captions/metadata → publication occurs as a separate rights-guarded action.

**D — Watch a licensed title:** user selects Watch → backend checks session, publication state, entitlement, territory, grant dates, action and asset readiness → issues short-lived playback token → player loads HLS/DASH → events are recorded under the privacy policy → expired/revoked rights deny new sessions.

**E — Download a licensed file:** user selects Download → backend verifies explicit `DOWNLOAD` permission (a stream grant does not imply download) → checks territory, entitlement, dates, asset status and rate limits → returns short-lived signed URL → browser downloads directly from storage/CDN → event is logged without persisting the signed token.

**F — Rights concern/takedown:** reporter submits title/asset, reason, contact channel and evidence → case is created and reviewer alerted → reviewer may place temporary access hold → decision and timestamps are audited → accepted case revokes/disables delivery and unpublishes → restore requires a new documented review.

### 25.3 Functional requirement catalogue

| ID | Requirement | Priority | Acceptance condition |
|---|---|---|---|
| FR-001 | Browse published titles | P0 | Only published titles are visible publicly |
| FR-002 | Search titles/people | P0 | Case-insensitive search and reasonable typo handling |
| FR-003 | Filter genre/year/language/country/type | P0 | Filters combine correctly and remain shareable in URL |
| FR-004 | Title detail page | P0 | Metadata and availability render reliably |
| FR-005 | Auth/session management | P0 | Secure sign-in/out, session rotation and recovery |
| FR-006 | Watchlist | P1 | Authenticated user can add/remove/list titles |
| FR-007 | Admin catalogue CRUD | P0 | Role-protected draft/edit/publish operations |
| FR-008 | Rights ledger | P0 | Asset, territory, use, dates, restrictions, evidence and approval |
| FR-009 | Rights-enforced availability | P0 | No missing/expired/revoked grant can issue a delivery session |
| FR-010 | Direct file upload | P0 | File bytes do not pass through Next.js process |
| FR-011 | Media validation | P0 | File signature, checksum, size and technical streams checked |
| FR-012 | Job monitoring | P0 | Admin sees queued/running/failed/completed and safe retry |
| FR-013 | Private object storage | P0 | Original objects are not anonymous public URLs |
| FR-014 | Signed delivery | P0 | Token expires and is bound to resource/action |
| FR-015 | Google Drive backup | P2 | Explicit OAuth, encrypted token and verified backup manifest |
| FR-016 | Reports/takedowns | P0 | Reviewer can disable access and audit decision |
| FR-017 | Bangla/English UI | P1 | Language toggle and locale-aware labels/metadata |
| FR-018 | Analytics | P1 | Aggregate product metrics without unnecessary personal tracking |
| FR-019 | Payments | P2 | Only after rights, tax and provider policy review |
| FR-020 | Partner portal | P3 | Tenant-isolated submission and status view |

### 25.4 Non-functional requirements (initial targets)

These are goals to validate, not guarantees about the free VPS.

| Area | MVP target | Validation |
|---|---|---|
| Availability | 99.5% monthly pilot target | External uptime checks |
| Catalogue API | p95 under 500 ms for cached/list requests | Realistic load test |
| Search | p95 under 700 ms for common queries | Benchmark and query plan review |
| Detail page | LCP under 2.5 s on representative mobile network where feasible | Lighthouse/real-user monitoring |
| Background jobs | Observable, safe retry, no duplicate published asset | Queue/fault-injection tests |
| Upload | Resumable after network interruption | Disconnect/retry tests |
| Integrity | SHA-256 for originals and backups | Reconciliation job |
| Security | No unresolved critical/high findings at public launch | ASVS review and dependency audit |
| Accessibility | WCAG 2.2 AA as design goal | Automated + manual review |
| Recovery | RPO/RTO documented and tested | Restore drill |

## 26. Product information architecture and page-level UX

### 26.1 Global navigation

Brand/home, Movies, optional Series, Genres, Collections, Search, English/বাংলা selector, Account/Sign in. On mobile, keep search visible or one tap away. Do not bury core filters in several layers of menus.

### 26.2 Home page composition

1. **Header:** compact, stable, keyboard accessible.
2. **Hero feature:** one editorial selection with poster/backdrop, short synopsis, key metadata and one primary action; no autoplay audio.
3. **Continue watching:** signed-in users only, and only when resume tracking is supported and policy allows it.
4. **Recently added:** sort by publication timestamp, not release date.
5. **Popular this week:** derive from defined first-party events with bot filtering and privacy controls.
6. **Browse by language:** only show languages supported by actual catalogue data.
7. **Curated collections:** editorial lists with truthful descriptions.
8. **Footer:** legal, copyright contact, privacy, terms, source attribution, accessibility and support.

### 26.3 Catalogue/search page

Search input with accessible debounce; facets for year, genre, language, country, type, availability and rating source; sort by relevance/newest-added/release-date/title. Store filter state in query parameters. Use cursor pagination for large lists. Include clear reset and zero-results recovery. Do not load thousands of records in the browser.

### 26.4 Title detail page

Above the fold: backdrop/poster, title/original title, release year, runtime, content rating, language/country, synopsis, Watch/Download/Trailer/Watchlist actions. Render Watch and Download only if that specific action is currently permitted. Availability should be explicit, e.g. “Available in Bangladesh until 31 Dec 2026” or “Not available for streaming in your region.” Do not expose contract terms.

Below the fold: cast/crew, genres/languages, related collections, audio/subtitle tracks, approved download formats, provider attribution and report issue link.

### 26.5 Player experience

Use HLS/DASH where supported. Provide accessible play/pause, volume, timeline, captions, audio selection, optional quality/speed controls, fullscreen and PiP when supported. Handle expired token, revoked access, unsupported codec, network failure and provider outage with clear messages. Never expose credentials or long-lived public object keys in client code.

### 26.6 Download experience

Show accurate file size, resolution, container and audio/subtitle details. Explain signed-link expiry and provide safe link renewal after rechecking rights. Do not promise resume unless the chosen CDN/storage supports Range requests. Rate-limit repeated link generation.

### 26.7 Admin dashboard information architecture

- Overview
- Catalogue: titles, seasons/episodes (future), people, genres/languages/countries, collections
- Rights & Licenses: grants, evidence, expiring grants, pending reviews
- Media Library: originals, derivatives, subtitles, artwork/trailers, quarantine
- Ingestion: intake, upload sessions, processing jobs, failed jobs
- Storage: providers, objects/replicas, capacity/cost, backup manifest, integrity audit
- Users & roles
- Reports/takedowns
- Analytics
- Audit log
- Settings

Every destructive action needs an impact summary and confirmation. Rights approval must be a distinct decision—not a generic status dropdown.

## 27. Design system and visual specification

### 27.1 Art direction

Premium cinema/editorial: dark, cinematic, calm and trustworthy. Do not copy HDHub4u or another piracy site's layout, logo, wording or identity.

| Token | Value | Purpose |
|---|---|---|
| `--background` | `#080B10` | Deep page background |
| `--surface-1` | `#101722` | Main cards/panels |
| `--surface-2` | `#172231` | Elevated/hover surface |
| `--border` | `#283548` | Subtle separators |
| `--text-primary` | `#F2F5F9` | Primary text |
| `--text-secondary` | `#AAB6C5` | Secondary text |
| `--accent` | `#4FB7A5` | Primary action accent |
| `--accent-strong` | `#2F8F82` | Active states |
| `--warning` | `#E4B45D` | Warnings |
| `--danger` | `#E06C75` | Destructive/failed states |

Use these as initial art direction, not as a requirement to use every color everywhere. Keep visual noise low.

### 27.2 Typography

Use a high-quality Latin sans and a legible Bengali UI font. Define type roles (display, title, section, body, metadata, caption). Keep body text readable; test Bangla glyph rendering, mixed-script spacing and line height. Do not use tiny metadata as a substitute for hierarchy.

### 27.3 Components

Build reusable `Button`, `IconButton`, `Input`, `SearchInput`, `Select`, `Badge`, `AvailabilityBadge`, `PosterCard`, `PosterGrid`, `PosterRail`, `MovieHero`, `MovieMetadata`, `CastList`, `AvailabilityPanel`, `VideoPlayerShell`, `SubtitleSelector`, `DataTable`, `FilterPanel`, `Dialog`, `Drawer`, `Toast`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `JobStatus`, `StorageUsage` and `AuditTimeline`.

### 27.4 Motion/accessibility

Use Framer Motion only when motion clarifies hierarchy/state. Respect `prefers-reduced-motion`; avoid scroll-jacking and constantly moving rails. All controls must work by keyboard. Keep focus rings visible; label controls; announce form errors; never use color alone to communicate state; provide accessible captions and dialog focus management.

## 28. Detailed technical architecture

### 28.1 Architecture decision

Use a **pnpm monorepo with a modular monolith web application and a separate worker process**. The worker is separate because long-running jobs must not share request-handler resource budgets. Business rules and data access stay in shared packages. Do not start with microservices; extract a service only when independent scaling or genuine boundaries justify the extra operations cost.

### 28.2 Logical components

| Component | Responsibility | Runtime |
|---|---|---|
| Web app | Public pages, admin, API handlers, auth callbacks | Next.js Node server |
| Domain packages | Rights evaluator, catalogue rules, validation, contracts | Shared TypeScript |
| Worker app | Queue consumers, metadata sync, media validation, backups | Node worker |
| PostgreSQL | Durable canonical state | Managed database preferred |
| Redis | Queue coordination and short-lived cache/limits | Managed Redis preferred for production |
| Object storage | Originals, derivatives, subtitles, artwork, manifests | R2/S3 compatible |
| Video platform | Managed encoding/playback | Cloudflare Stream or alternative |
| Observability | Errors, metrics, logs, traces | Sentry + logs/OpenTelemetry |

### 28.3 Data-flow boundaries

**Request:** browser → reverse proxy/CDN → Next.js → auth → authorization → domain service → PostgreSQL. Request path may create upload intent but must not receive/transcode multi-GB files.

**Upload:** browser → short-lived signed multipart upload → private object store. Browser then calls completion API; API confirms object state and queues validation.

**Worker:** BullMQ → worker → object storage/provider/ffprobe → DB state update → audit event. Each step idempotent and observable.

**Playback:** browser → authorization endpoint → short-lived token → provider/CDN. Do not proxy video segments through the application.

### 28.4 Repository structure

```text
movie-platform/
├── apps/
│   ├── web/                         # Next.js App Router
│   │   ├── app/(public)/            # Home, catalogue, title, search
│   │   ├── app/(auth)/              # Sign-in, sign-up, recovery
│   │   ├── app/(account)/           # Watchlist, downloads, profile
│   │   ├── app/admin/               # Admin console
│   │   └── app/api/                 # Versioned route handlers
│   └── worker/                      # BullMQ consumers and scheduled jobs
│       └── src/{jobs,processors,queues,health}/
├── packages/
│   ├── db/                          # Schema, migrations, repositories
│   ├── domain/                      # Business rules/entities
│   ├── rights/                      # Rights engine and tests
│   ├── storage/                     # Provider adapters
│   ├── metadata/                    # Metadata provider adapters
│   ├── media/                       # ffprobe parsing/media contracts
│   ├── contracts/                   # Zod schemas, DTOs, API contracts
│   ├── auth/                        # Session and permission helpers
│   ├── ui/                          # Design system
│   ├── config/                      # Typed runtime config
│   └── observability/               # Logs, traces, metrics
├── infra/{docker,caddy,compose,scripts}/
│   └── scripts/{bootstrap-vps.sh,deploy.sh,healthcheck.sh,backup-postgres.sh,restore-postgres.sh,storage-reconcile.ts}
├── docs/{product-requirements,architecture,data-model,api-contract,threat-model,rights-and-content-policy,operations-runbook,disaster-recovery,cost-model,testing-strategy}.md
├── docs/adr/
├── .github/workflows/
├── .env.example
├── compose.yaml
├── package.json
├── pnpm-workspace.yaml
├── turbo.json                       # Optional
└── README.md
```

Never put real credentials, OAuth tokens, customer uploads, original media or license contracts in Git. Keep rights evidence in private storage and store only its reference/review metadata in PostgreSQL.

### 28.5 Module boundaries

- `catalogue` does not decide distribution rights.
- `rights` evaluates policy but does not stream files.
- `media` owns technical asset state, not commercial entitlement.
- `storage` uploads/reads/copies/deletes objects but does not decide who may watch.
- `delivery` combines rights, entitlement and asset readiness before issuing token.
- `admin` orchestrates but may not bypass domain rules.

## 29. Recommended stack and version policy

### 29.1 Primary stack

| Layer | Selection | Rationale / rule |
|---|---|---|
| Runtime | Current supported Node.js LTS | Pin exact version in toolchain and CI |
| Frontend/full-stack | Next.js App Router + React + strict TypeScript | Confirm current stable compatibility before locking |
| Monorepo | pnpm workspaces; Turborepo optional | Shared domain logic without microservices |
| UI | Tailwind CSS + Radix/shadcn primitives | Custom visual system with accessible primitives |
| Forms | React Hook Form + Zod or server actions + Zod | Validate on client and server boundaries |
| Database | Managed PostgreSQL 18.x | Relational constraints, JSONB for provider snapshots, full-text search |
| ORM | Prisma supported stable version or Drizzle | Pick one; avoid release candidates in production |
| Auth | Auth.js or established managed provider | Do not hand-roll password/session primitives casually |
| Queue | Redis + BullMQ | Job state, retries, rate limits, worker concurrency |
| Object store | R2 or S3-compatible provider | Private objects, multipart uploads, signed URLs |
| Streaming | Cloudflare Stream for compatible 1080p use, or another provider | Verify 4K/DRM and minute-based delivery cost |
| Media inspection | FFmpeg/ffprobe in isolated worker | Probe streams; validate arguments and resources |
| Search | PostgreSQL FTS + `pg_trgm` initially | Add dedicated search only after measurement |
| Logging | Pino/structured logs + Sentry | Redact secrets and attach trace IDs |
| Testing | Vitest + Testing Library + Playwright | Unit, integration and E2E |
| Load tests | k6 or equivalent | API, queue and control-path measurement |
| CI/CD | GitHub Actions | Lint, typecheck, tests, dependency/container scans |

### 29.2 Version selection rules

1. Check official release notes and supported-version documentation at implementation time.
2. Choose stable/supported versions, not nightly or release candidates.
3. Pin lockfile and runtime versions.
4. Record decisions in `docs/adr/0001-stack-selection.md`.
5. Upgrade majors in a dedicated tested change.
6. Never run an unrestricted “upgrade all dependencies” task.

Official docs checked 6 Nov 2026: [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting), [PostgreSQL 18](https://www.postgresql.org/docs/18/), [Prisma ORM](https://www.prisma.io/docs/orm). Next.js self-hosting docs recommend a reverse proxy and discuss cache coordination for multiple instances.

## 30. Data architecture and database design

### 30.1 Data ownership principles

PostgreSQL stores canonical business state; object storage stores media bytes; provider APIs are not the database. An object key is not a public URL or delivery permission. Every asset has immutable identity and mutable lifecycle state. Rights evidence and approval history must be auditable.

### 30.2 Suggested entities

**Identity/access:** `users`, `auth_accounts`, `sessions`, `roles`, `permissions`, `user_roles`, `role_permissions`, `mfa_factors`.

**Catalogue:** `titles` (movie/series/special), `title_translations`, `title_external_ids`, `people`, `credits`, `genres`, `title_genres`, `languages`, `title_languages`, `countries`, `title_countries`, `collections`, `collection_items`, `artwork_assets`. For series, add `seasons` and `episodes`; do not flatten episodes into movies.

**Media/storage:** `media_assets` (kind, lifecycle, original filename, detected MIME, size, checksum, duration, dimensions, frame rate, codec, language, provenance); `storage_objects` (provider, account/tenant, bucket, object key/version, size, ETag, checksum, type, encryption, verification); `asset_object_links` (primary/backup/derivative/quarantine); `media_variants` (parent, profile, provider/object reference, codec, bitrate, state); `subtitle_tracks`; `media_probe_results` (ffprobe JSON, version, timestamp, warnings).

**Rights/evidence:** `rights_holders`, `rights_grants` (holder, title/asset, permitted action, territories, dates, monetization, quality, language, exclusivity, status, reviewer), `rights_evidence` (private object, evidence type/version, uploader/reviewer/checksum), `rights_decisions` (immutable actor/action/reason/timestamp), `territories` (ISO codes), `content_reports`/`takedown_cases`.

**Automation/operations:** `ingestions`, `jobs`, `storage_provider_connections`, `backup_runs`, `webhook_events`, `audit_logs`.

**User features/analytics:** `watchlist_items`, `playback_sessions`, `playback_events`, `download_events`, `user_preferences`.

### 30.3 Constraints and indexes

- Use UUID or ULID consistently.
- Enforce normalized unique email; unique `(provider, external_id)`; unique `(user_id, title_id)`; unique idempotency keys.
- Add foreign keys, check constraints for non-negative size/duration and valid date ranges.
- Use `timestamptz` in UTC.
- Add partial indexes for published titles and active grants when query plans justify them.
- Index commonly joined foreign keys and `(status, created_at)` on jobs.
- Use GIN for PostgreSQL FTS and `pg_trgm` for typo-tolerant title search after profiling.
- Do not index every JSONB field by default.

### 30.4 Core rights evaluator contract

```ts
export type DeliveryAction = "STREAM" | "DOWNLOAD" | "TRAILER";
export interface RightsContext {
  titleId: string; assetId: string; action: DeliveryAction;
  territoryCode: string; at: Date; userId?: string;
  entitlement?: "FREE" | "SUBSCRIBER" | "RENTED" | "PARTNER";
  requestedQuality?: string;
}
export type RightsDecision =
  | { allowed: true; grantId: string; policyVersion: string }
  | { allowed: false; code: string; publicReason: string };
```

Rules: deny by default; match the actual asset or an explicit asset-class grant; require exact action (`STREAM` never implies `DOWNLOAD`); require territory coverage; use UTC with exclusive end date (`validFrom <= at < validUntil`); require approved, unrevoked grant and no takedown hold; enforce monetization/entitlement and quality; require reviewed evidence; return stable internal denial code and safe public reason; persist grant ID and policy version with session. The API and token service must enforce the decision, not only UI.

### 30.5 Lifecycle and deletion

States: `DRAFT → RIGHTS_PENDING → RIGHTS_APPROVED → INGESTING → QUARANTINED | PROCESSING → READY_FOR_REVIEW → PUBLISHED`; side states include `UNPUBLISHED`, `TAKEDOWN_HOLD`, `ARCHIVED`, `PROCESSING_FAILED`. Never hard-delete before retention/legal-hold checks. Use two-step deletion: mark pending, wait policy period, confirm no active grant/hold, delete primary/replicas according to policy, audit result.

## 31. Media storage, file naming and integrity system

### 31.1 Provider interface

Create a provider-agnostic adapter similar to:

```ts
export interface StorageAdapter {
  createMultipartUpload(input: CreateUploadInput): Promise<UploadSession>;
  createPartUploadUrls(input: PartUploadInput): Promise<SignedPartUrl[]>;
  completeMultipartUpload(input: CompleteUploadInput): Promise<StoredObjectRef>;
  abortMultipartUpload(input: AbortUploadInput): Promise<void>;
  headObject(input: ObjectKeyInput): Promise<ObjectMetadata | null>;
  getSignedReadUrl(input: SignedReadInput): Promise<string>;
  copyObject(input: CopyObjectInput): Promise<StoredObjectRef>;
  deleteObject(input: DeleteObjectInput): Promise<void>;
}
```

The domain layer must not know whether the implementation is R2, AWS S3, Backblaze B2 or another provider. The adapter owns provider API details, retries and error mapping.

### 31.2 Object key convention

Use opaque IDs, not user-controlled filenames:

```text
private-originals/{ownerId}/{titleId}/{assetId}/source.bin
private-derivatives/{titleId}/{assetId}/{variantId}/manifest.m3u8
private-subtitles/{titleId}/{assetId}/{trackId}/subtitle.vtt
private-artwork/{titleId}/{assetId}/{artworkId}/image.webp
private-rights-evidence/{rightsGrantId}/{evidenceId}/evidence.pdf
```

Do not include emails, personal names or contract titles in object paths. Store original filename in PostgreSQL and sanitize it for display.

### 31.3 Integrity strategy

- Compute SHA-256 with a streaming implementation; never load a multi-GB file into memory.
- Store expected and observed byte size.
- Verify provider object size after upload completion.
- Do not treat multipart ETag as SHA-256; store checksum independently.
- Recompute checksum on backup copies when practical.
- Periodically reconcile DB assets with missing objects, orphan objects, size/checksum mismatch and stale multipart sessions.
- Quarantine and alert on integrity mismatch; never silently mark the file healthy.

### 31.4 Large-file upload strategy

For small uploads, signed PUT may be enough. For large media, use multipart/resumable upload. R2's current documentation describes multipart uploads for large/resumable objects and S3-compatible tooling.

1. `POST /api/admin/ingestions` creates ingestion with expected size, asset type, rightsGrantId and idempotency key.
2. Validate caller role and size ceiling.
3. Create pending storage-object record and multipart session.
4. Return short-lived signed part URLs and required part-size rules.
5. Browser uploads directly to R2 using bounded concurrency.
6. Browser submits completion with part numbers/ETags.
7. Server completes upload, performs HEAD, stores size/ETag, and queues `validate-media`.
8. Worker streams object bytes to calculate SHA-256, probes it and updates lifecycle state.

For direct uploads to Cloudflare Stream, use Direct Creator Upload. Its current documentation says files over 200 MB require TUS; this is relevant to feature-length videos. Verify upload limits, duration and quality capabilities before selecting it.

### 31.5 Private bucket layout

Prefer separate private buckets or clear prefixes:

- `movie-originals-private`
- `movie-derivatives-private`
- `movie-artwork-private`
- `movie-rights-evidence-private`
- `movie-backups-private` (only if that backup design is selected)

Use separate API tokens for upload/read/delete responsibilities. A validation worker should not have delete permission if unnecessary. Public website code must not possess a general bucket secret.

### 31.6 Lifecycle rules

- Auto-abort incomplete multipart uploads after a documented short retention window.
- Delete abandoned staging objects only after confirming DB upload session expired.
- Move cold backup objects to lower-cost storage only after checking retrieval cost and minimum retention.
- Never apply broad auto-delete to originals, rights evidence or legal holds.
- R2 lifecycle documentation notes expiry/transition rules, 30-day minimum duration for Infrequent Access and retrieval fees. Test in a non-production bucket first.

## 32. Authorized content collection and metadata ingestion

### 32.1 Three different imports

**Metadata import:** title, synopsis, cast, genres, language, release date, ratings and poster/backdrop references. It is not a movie file and has its own provider terms.

**Media ingestion:** full audiovisual files, trailers, subtitles, artwork and audio tracks. Every asset needs provenance and rights evidence.

**Backup replication:** copying an already-authorized object from primary storage to a separately-authorized backup destination. This is reliability engineering, not a discovery/source-acquisition system.

Do not combine these into one vague “movie scraper.” They have different permissions, failure modes and data schemas.

### 32.2 Supported source adapters

Implement only explicit adapters:

- `ManualUploadAdapter`: admin/owner upload.
- `PartnerApiAdapter`: authenticated partner API with contract and documented allowed endpoints.
- `PartnerSftpAdapter`: known partner SFTP account/folder agreement.
- `OwnerObjectStorageAdapter`: owner-controlled bucket/account with explicit read permission.
- `PublicDomainRegistryAdapter`: metadata import from a curated rights-reviewed public-domain catalogue; still requires item-level territory review.
- `MetadataProviderAdapter`: metadata imported under provider license.

Each adapter declares provider, permitted domains/accounts, authentication, supported asset types, max size, retry policy, retention policy and evidence requirements.

### 32.3 No arbitrary URL fetcher

Do not expose an endpoint where an admin pastes any URL and the server blindly fetches it. A genuine partner URL pull must use an allowlisted integration with:

- Exact approved hostnames and certificate validation.
- DNS/IP checks blocking loopback, private, link-local and metadata-service addresses at connection time.
- Redirect count and every redirect destination validated.
- Strict size/time limits.
- No forwarding of credentials/headers across origins.
- MIME sniffing and checksum verification.
- Egress network policy where feasible.
- Audit record containing provider and approved contract/source reference.

Do not bypass logins, CAPTCHAs, anti-bot protections, paywalls, shortlink gates or other access controls.

### 32.4 Metadata licensing and attribution

TMDb's official FAQ says free API use is for non-commercial purposes with attribution; revenue-generating projects should contact TMDb for commercial licensing and comply with branding/attribution requirements. Therefore:

- Do not assume developer API access is free for a commercial platform.
- Store provider source, retrieval timestamp and external ID.
- Build a replaceable metadata adapter.
- Cache only as permitted by provider terms.
- Do not scrape IMDb's consumer website or republish datasets without valid licensing; verify current dataset use restrictions before use.
- Posters, backdrops, trailers and profile photos need their own usage permission. Metadata API access does not grant full-film rights.

## 33. Video processing, codecs and streaming architecture

### 33.1 Asset roles

Keep originals immutable. A title may have original master, web playback source, adaptive HLS/DASH renditions, approved downloadable source/derivative, trailer, subtitle tracks, alternate audio, poster, backdrop and thumbnails. Each derivative references its parent and processing profile/version.

### 33.2 Probe before process

Use `ffprobe` machine-readable output to validate:

- Container and detected format.
- Duration and stream count.
- Video codec/profile/dimensions/pixel format/frame rate/bitrate.
- Audio codec/channels/sample rate/language.
- Subtitle streams and languages.
- Rotation/orientation metadata.
- Corrupt or truncated stream errors.

Do not trust filename extension. Do not execute arbitrary embedded metadata or shell commands. Run probes/transcodes in a low-privilege isolated worker with CPU/memory/time limits and no access to unrelated secrets.

### 33.3 Suggested profiles (rights and provider permitting)

| Profile | Video | Audio | Typical use |
|---|---|---|---|
| Source | Preserve original | Preserve original | Archive/download only where permitted |
| 1080p | H.264 High, measured bitrate | AAC stereo | High-quality web playback |
| 720p | H.264 Main/High | AAC stereo | Mid-bandwidth default |
| 480p | H.264 Main | AAC stereo | Lower bandwidth |
| 360p | H.264 Baseline/Main | AAC stereo | Weak network/mobile |

Choose CRF/bitrate according to measured quality and size. Do not upscale low-resolution source and label it genuine 1080p/4K.

### 33.4 Adaptive bitrate packaging

- Use HLS or DASH based on selected provider/player.
- HLS uses master manifest, variant playlists and segments.
- Follow provider segment recommendations; test seeking and startup behavior.
- Store caption/subtitle language and label accurately.
- Cloudflare Stream's current documentation describes H.264 adaptive delivery from 360p to 1080p. Do not promise 4K via Stream without verified support. If 4K is mandatory, select and benchmark a provider/encoding pipeline that supports it.

### 33.5 DRM and watermarking

Signed URLs/tokens reduce casual link sharing but are not DRM and do not make content “unpiratable.” If a contract requires Widevine/FairPlay/PlayReady or forensic watermarking, choose a provider/player with explicit support. Offline downloadable files are a separate DRM/product problem.

### 33.6 Versioned processing profiles

Store profile ID such as `h264-aac-1080p-v1`, FFmpeg build/version, parameters, output checksum and status. If a profile changes, create a new derivative version; never overwrite the only known-good output in place.

## 34. API contract and service behavior

### 34.1 API conventions

- Prefix `/api/v1`.
- JSON request/response except binary upload path handled by storage.
- Schema validation on external boundaries.
- Consistent error shape based on RFC 9457 Problem Details or equivalent.
- Cursor pagination for long lists.
- UTC ISO-8601 timestamps.
- Idempotency keys for ingestion creation/completion, rights approval, publish and backup creation.
- Request/trace ID returned and logged.

### 34.2 Public API

| Method | Path | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/titles` | Filtered public catalogue | Public |
| GET | `/api/v1/titles/:slug` | Detail + public availability summary | Public |
| GET | `/api/v1/search` | Title/person/collection search | Public, rate-limited |
| GET | `/api/v1/genres` | Available genres | Public |
| GET | `/api/v1/collections` | Published collections | Public |
| POST | `/api/v1/watchlist/:titleId` | Add/remove watchlist | Authenticated |
| GET | `/api/v1/watchlist` | List watchlist | Authenticated |
| POST | `/api/v1/titles/:id/playback-session` | Issue playback access | Auth + rights + entitlement |
| POST | `/api/v1/titles/:id/download-session` | Issue download access | Access policy + rights + entitlement |
| POST | `/api/v1/reports` | Content/metadata report | Public, rate-limited |

### 34.3 Admin API

| Method | Path | Purpose | Permission |
|---|---|---|---|
| POST | `/api/v1/admin/titles` | Create draft | `catalogue:create` |
| PATCH | `/api/v1/admin/titles/:id` | Edit metadata | `catalogue:update` |
| POST | `/api/v1/admin/titles/:id/submit-review` | Submit for review | `catalogue:submit` |
| POST | `/api/v1/admin/rights-grants` | Create grant | `rights:create` |
| POST | `/api/v1/admin/rights-grants/:id/approve` | Approve grant | `rights:approve` |
| POST | `/api/v1/admin/ingestions` | Create ingestion | `media:ingest` |
| POST | `/api/v1/admin/ingestions/:id/upload-session` | Signed upload session | `media:upload` |
| POST | `/api/v1/admin/ingestions/:id/complete` | Complete upload | `media:upload` |
| GET | `/api/v1/admin/jobs` | Monitor jobs | `jobs:read` |
| POST | `/api/v1/admin/jobs/:id/retry` | Retry failed job | `jobs:retry` |
| POST | `/api/v1/admin/titles/:id/publish` | Publish subject to rights guard | `catalogue:publish` |
| POST | `/api/v1/admin/titles/:id/unpublish` | Disable public title | `catalogue:unpublish` |
| POST | `/api/v1/admin/reports/:id/resolve` | Resolve case | `reports:resolve` |
| GET | `/api/v1/admin/audit-logs` | Query audit history | `audit:read` |

### 34.4 Example error contract

```json
{
  "type": "https://example.invalid/problems/rights-not-available",
  "title": "Content is not available",
  "status": 403,
  "code": "RIGHTS_NOT_AVAILABLE_IN_TERRITORY",
  "detail": "This title is not currently available for this action in your region.",
  "requestId": "req_01..."
}
```

Never expose rights-holder names, contract terms, internal storage keys, secrets or security internals in public errors.

### 34.5 Webhooks

Verify signature using raw body and documented algorithm; reject invalid signatures; dedupe by provider event ID; store raw event securely with retention; process asynchronously; don't trust browser callbacks; reconcile provider status periodically to recover missed webhooks.

## 35. Authentication, authorization and account security

### 35.1 Roles and permissions

| Role | Catalogue | Rights | Media | Users | Takedown | Settings |
|---|---|---|---|---|---|---|
| Viewer | Read published | None | Watch/download by policy | Own account | Submit report | Own preferences |
| Editor | Create/update drafts | Read status only | Read metadata | None | Assigned cases only | None |
| Media operator | Read title metadata | Read approved grants | Upload/process/retry | None | Report issue | Provider health read |
| Rights reviewer | Read | Create/review/approve/revoke | Read evidence | None | Review | None |
| Admin | Operational | Manage with audit | Manage | Ordinary roles | Resolve | Most settings |
| Super admin | Full | Full with dual control for critical changes | Full | Role administration | Full | Critical config |

Prefer capability permissions (`rights:approve`) over scattered role-name checks. A user may have multiple scoped roles.

### 35.2 Authorization rules

Authenticate every private route; authorize at DAL/service layer; enforce owner/tenant scope in queries; use DTOs to avoid exposing internal fields; UI hiding is not security; high-impact actions require reason and audit; keep rights approval separate from media operations. Next.js auth guidance distinguishes authentication, session management and authorization, and recommends centralized DAL/DTO patterns.

### 35.3 Session protection

Use Secure, HttpOnly, SameSite cookies with explicit expiry. Rotate session identifiers after login and privilege changes. Use maintained password hashing (Argon2id is a strong default where supported). Recovery tokens should be single-use and short-lived. Enforce MFA for admins, rights reviewers and storage connections. Rate-limit login and do not disclose whether an email exists in reset flows.

## 36. Google Drive and four-account backup design

### 36.1 Correct mental model

Four Google One accounts remain four identities and allocations. They do not automatically become one shared 20 TB volume. A service account is not an additional consumer storage account. Treat each destination as separately authorized backup target.

### 36.2 Recommended topology

**Primary:** private object storage (R2 or selected S3-compatible store).

**Secondary:** one designated backup destination for critical objects/database dumps/originals according to retention and restore needs.

**Optional tertiary:** a second provider or offline copy for critical rights evidence and database backups.

Use Drive only if account terms permit the intended backup workflow. Do not use Drive share links as a public CDN.

### 36.3 OAuth requirements

Each account owner explicitly authorizes via OAuth. Request least-privilege Drive scope. Encrypt refresh tokens at rest, with key rotation/revocation handling. Separate token key from database backup. Disconnect cleanly when owner revokes. On refresh failure mark `REAUTH_REQUIRED`, not endless retries. Never put tokens into frontend code, source control, logs or job payloads.

Google's OAuth best practices say client credentials belong in secure storage and user tokens should be securely stored; apps must handle refresh-token revocation. Google Drive docs describe resumable upload. Current API limits explicitly describe 750 GB/day for Google Workspace users. Do not generalize that plan-specific rule to every consumer Google One account without verifying terms.

### 36.4 Backup account assignment

Do not rotate identities to evade quotas. Let an admin select the permitted destination for a backup policy; use deterministic mapping for restore predictability; respect quota errors with truncated exponential backoff; alert when capacity is insufficient; request approved capacity or choose a contracted provider; keep provider mapping in database rather than hardcoded scripts.

### 36.5 Backup manifest and integrity

Record source object ID/SHA-256; destination provider/account/file ID; source and destination size; timestamps/status; retries/provider errors; verification method/checksum result; restore-test date/result. A successful upload response is not proof of a valid backup. Restore samples and verify checksums on a schedule.

### 36.6 Example backup policy

- Database: managed Postgres automated backup plus encrypted logical dump to a separate provider.
- Rights evidence: redundant encrypted copy with legal-hold/retention rules.
- Original media: backup based on rights and cost policy.
- Derivatives: can often be regenerated if original and processing profile are retained.
- Logs: retain per operational policy; never store secrets or signed URLs.

---

# PART VI — PRODUCTION ENGINEERING PLAN

> This part extends the earlier product and architecture specification into deployable operating procedures. Where earlier short examples conflict with this part, the more restrictive production rule here takes precedence. This blueprint is for content the operator owns, has licensed, or may lawfully distribute. A metadata record is not proof of a right to host a film.

## 37. Exact deployment topology for the current VPS

### 37.1 What the Boxd server should do

The current server (2 vCPU, 8 GB RAM, 100 GB disk) is suitable for a low-traffic pilot and control-plane services, subject to the provider's actual network, CPU, I/O, uptime, acceptable-use and outbound-bandwidth terms. Use it for:

- Next.js web application and lightweight server-side rendering.
- API routes or a separate lightweight Node.js API process.
- PostgreSQL only for a small pilot if backups and disk alerts are configured; managed PostgreSQL is preferable for production.
- Redis and BullMQ for low-volume jobs.
- A single low-concurrency worker for metadata, checksum, media-probe and backup orchestration jobs.
- Reverse proxy, TLS termination, health checks, metrics/log forwarding and deployment agent.

Do **not** use this VPS as the public origin for large video files, a high-volume streaming server, a 4K transcoding farm, or a permanent media archive. Do not assume it has a 1 Gbps guaranteed port or unlimited traffic unless the contract and measured tests establish that.

### 37.2 Resource budget for the pilot

These are initial guardrails, not provider guarantees. Measure real RSS, I/O, CPU steal and network throughput before increasing concurrency.

| Service | Initial memory budget | CPU policy | Notes |
|---|---:|---:|---|
| OS, SSH, system services | 0.8–1.2 GB | reserved | Keep an emergency margin |
| Next.js application | 0.8–1.5 GB | 1–2 workers | Avoid uncontrolled build concurrency |
| API / scheduler | 0.4–0.8 GB | low | Can share process only for pilot |
| PostgreSQL | 1.0–1.5 GB | capped | Prefer external managed DB as traffic grows |
| Redis | 0.2–0.5 GB | low | Set maxmemory and eviction policy intentionally |
| Worker process | 0.5–1.0 GB | 1 concurrent job | Do not transcode on this host |
| Monitoring / headroom | 1.0–1.5 GB | reserved | Leave room for spikes and deploys |

Keep at least 15–20 GB of disk free for operating-system updates, logs, temporary files and rollback. Configure log rotation and hard limits. Use a separate `/data` mount only if the VPS provider supplies a distinct volume; a directory on the same disk is not a separate failure domain.

### 37.3 Storage layout

```text
/opt/movie-platform/
  app/                  # immutable release or container definitions
  deploy/               # compose, proxy, scripts, systemd units
  config/               # non-secret deployment config only
/var/lib/movie-platform/
  postgres/             # only if self-hosted DB is used
  redis/                # optional persistence
  temp-ingest/          # bounded temporary files; auto-cleaned
  quarantine/           # isolated untrusted files; never served
/var/log/movie-platform/
  app/ worker/ proxy/ audit/
/etc/movie-platform/
  env/                  # root-readable secrets, not in git
```

Do not store long-term video masters in the VPS filesystem. Temporary intake must have a quota, age-based cleanup, and a job that refuses new work when free space is below the configured threshold. Quarantine files must not be reachable through the public web server.

### 37.4 Concurrency policy

Pilot defaults: one media-probe job at a time; one checksum stream at a time; one backup upload at a time; no FFmpeg transcode on the VPS. Use CPU/memory limits at the container level and BullMQ concurrency limits at the worker level. Increase only after a load test demonstrates sufficient headroom. A worker should claim a job with a lease, heartbeat long-running work and release or fail safely if the process stops.

### 37.5 Production expansion path

When usage grows, separate the roles:

1. Web/API: two stateless application instances behind a reverse proxy/load balancer.
2. Database: managed PostgreSQL with point-in-time recovery and tested restore.
3. Queue: managed Redis or a separately managed Redis service.
4. Workers: separately scaled CPU workers for probe/transcode, network workers for storage transfer, and scheduled maintenance workers.
5. Storage: private object storage for masters and derivatives.
6. Delivery: a managed video platform or a CDN in front of an authorized origin.
7. Observability: central logs, metrics, traces and alerting independent of the app host.

Do not scale all parts together merely because one part is saturated. Use queue depth, request latency, database saturation, storage throughput and delivered video minutes to identify the bottleneck.

## 38. Environments, deployment and configuration

### 38.1 Three environments

- **Development:** local Docker Compose, synthetic fixtures and mock storage provider. No real user files or production OAuth tokens.
- **Staging:** production-like topology, separate database/bucket/OAuth application, test-only users and test content with clear rights.
- **Production:** locked deployment identity, private storage, approved content only, backups, security alerts, documented rollback.

Never copy production secrets into development. Never point staging at the production bucket. Database migrations must be backward-compatible with the currently deployed application for the rollout window.

### 38.2 Deployment sequence

1. CI runs formatting, lint, type-check, unit tests, dependency audit and build.
2. CI creates an immutable image identified by commit SHA and software bill of materials.
3. Deploy to staging and run migrations in expand-only mode.
4. Run API smoke tests, login flow, catalogue search, authorized playback and signed-download tests.
5. Promote the same image digest to production; do not rebuild a different artifact.
6. Apply backward-compatible migration, deploy application, verify health/readiness and critical synthetic transactions.
7. Monitor error rate, queue lag, database load and video-delivery errors.
8. Roll back the application if needed. Do not automatically run destructive down-migrations; use forward fixes or restore procedures.

### 38.3 Environment variable contract

Create `.env.example` with placeholders only. Validate required variables at process startup using a schema library. Group variables by service and never print values.

```dotenv
NODE_ENV=production
APP_BASE_URL=https://example.invalid
SESSION_SECRET=replace-with-32+-bytes-from-secret-manager
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require
REDIS_URL=rediss://USER:PASSWORD@HOST:6379
OBJECT_STORAGE_PROVIDER=s3-compatible
OBJECT_STORAGE_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
OBJECT_STORAGE_REGION=auto
OBJECT_STORAGE_BUCKET=private-media
OBJECT_STORAGE_ACCESS_KEY_ID=replace-me
OBJECT_STORAGE_SECRET_ACCESS_KEY=replace-me
OBJECT_STORAGE_PUBLIC_BASE_URL=
MEDIA_SIGNING_SECRET=replace-with-independent-secret
TMDB_API_KEY=replace-only-after-licence-approval
TMDB_COMMERCIAL_APPROVED=false
SENTRY_DSN=
LOG_LEVEL=info
UPLOAD_MAX_BYTES=53687091200
TEMP_STORAGE_MAX_BYTES=21474836480
```

The sample values are illustrative. Do not use `example.invalid` in production. Store actual credentials in a secret manager or root-readable deployment secret file. Restrict access to the deployment operator and relevant service identity. Rotate credentials and revoke old keys after compromise or staff departure.

### 38.4 Docker Compose operational rules

Compose is appropriate for a single VPS pilot, not a substitute for production orchestration. Pin image versions/digests; use non-root containers; define health checks; declare resource limits; put stateful data in named volumes; put secrets outside the image; expose only the reverse proxy publicly; and use private internal networks for database/Redis. Do not publish PostgreSQL or Redis ports to the Internet.

### 38.5 Reverse proxy and Next.js deployment

Put a maintained reverse proxy (for example Caddy or Nginx) in front of the Next.js server for TLS, request limits, timeouts, security headers and buffering policy. Confirm upload limits and streaming behavior end-to-end; proxy buffering can create unexpected disk usage or playback latency. For multiple app instances, configure a shared cache strategy where applicable and ensure build IDs and cache invalidation are consistent. Next.js self-hosting documentation recommends a reverse proxy and discusses shared cache coordination for multi-instance deployments. <Cite refs={['turn346949view2','turn659893view3']}/>

## 39. Automation engine — job contracts, retries and state transitions

### 39.1 Queue separation

Use separate queues or clearly isolated job classes so one workload cannot starve another:

| Queue | Job types | Initial priority |
|---|---|---|
| `catalogue` | metadata refresh, title normalization, artwork validation | normal |
| `ingest` | source registration, upload-session finalization, checksum | high |
| `media` | probe, profile selection, transcode submission, derivative validation | normal |
| `delivery` | playback authorization side effects, manifest audit | high |
| `backup` | database/object backup, verification | low/normal |
| `maintenance` | expired URL cleanup, orphan scan, retention enforcement | low |

The user-facing request should not wait for a full transcode or multi-gigabyte backup. Return a job ID and status resource; notify when the state changes.

### 39.2 Job envelope

Every job should carry a stable idempotency key and immutable entity IDs, not secrets or arbitrary URLs.

```ts
type JobEnvelope<T> = {
  jobId: string;
  jobType: string;
  schemaVersion: number;
  idempotencyKey: string;
  tenantId?: string;
  actorId: string;
  requestedAt: string;
  traceId: string;
  payload: T;
};
```

Worker validates the schemaVersion and payload before processing. Store the job's current state and attempts in PostgreSQL (or an outbox/job table) so operational state survives Redis loss. Redis is a delivery mechanism, not the sole source of truth.

### 39.3 Idempotency pattern

Use an idempotency table with a unique key such as `(job_type, idempotency_key)`. A worker should:

1. Atomically claim the job and record a lease owner/expiry.
2. Check whether the target operation already completed.
3. Perform the external action with a provider idempotency token where supported.
4. Persist provider response identifiers and checksum/size evidence.
5. Transition state using compare-and-swap or a guarded update.
6. Emit an outbox event in the same database transaction.
7. Acknowledge the queue message only after durable state is committed.

BullMQ supports retries/backoff and idempotent job design; configure bounded attempts and exponential backoff with jitter, not infinite retry loops. <Cite refs={['turn899085search1','turn899085search2','turn899085search13']}/>

### 39.4 Retry classes

- **Transient:** network timeout, 429, temporary 5xx; bounded exponential backoff with jitter and provider `Retry-After` support.
- **Permanent:** invalid format, rights not approved, checksum mismatch after defined reattempts, unsupported codec; mark failed with actionable reason.
- **Credential:** OAuth revoked/expired or key invalid; pause integration and request reauthorization. Never retry in a tight loop.
- **Capacity:** bucket full, VPS disk pressure, quota or rate limit; pause queue, alert, and resume only after capacity is restored.
- **Policy:** rights expired, content hold, takedown; stop all publication and delivery immediately.

### 39.5 State machine

```text
DRAFT
  -> RIGHTS_PENDING
  -> RIGHTS_APPROVED
  -> SOURCE_REGISTERED
  -> UPLOAD_PENDING
  -> UPLOADING
  -> QUARANTINED
  -> VALIDATING
  -> READY_FOR_PROCESSING
  -> PROCESSING
  -> READY
  -> PUBLISHED
  -> UNPUBLISHED / EXPIRED / TAKEDOWN
```

Any state may transition to `BLOCKED` or `FAILED` with a reason code. A content item must not become `PUBLISHED` until rights, integrity, metadata minimums, media profile and playback authorization are all green. A successful transfer alone never publishes a title.

## 40. Storage and video delivery — choose based on usage, not guesswork

### 40.1 Primary media origin

Use a private S3-compatible object store (R2 is one option) for original masters, thumbnails, subtitles and generated derivatives, with a storage abstraction so providers can be replaced. Keep object keys opaque and immutable; do not use human titles or personal data in object paths.

Example:

```text
tenants/{tenantId}/assets/{assetId}/source/{uploadId}/original
assets/{assetId}/derivatives/{profileId}/{version}/master.m3u8
assets/{assetId}/derivatives/{profileId}/{version}/segment-000001.m4s
assets/{assetId}/subtitles/{language}/{version}.vtt
```

Do not make the bucket public. Use short-lived signed URLs or a media platform's signed playback token after server-side authorization. A signed URL is a bearer credential: anyone possessing it until expiry can use it, so keep TTL short and never log it. <Cite refs={['turn899085search6','turn148837search3']}/>

### 40.2 Upload protocol

For large files, use multipart or resumable upload. The backend creates an upload session after rights and actor checks, issues a narrowly scoped upload capability, tracks part IDs/size, and finalizes only after provider-confirmed completion. Then calculate/verify checksum and probe the media file in quarantine. Never accept a client-provided checksum as the only integrity evidence. R2 documents multipart uploads and presigned URL behavior; Google Drive has a separate resumable-upload protocol when Drive is used for an approved backup. <Cite refs={['turn899085search15','turn899085search6','turn597235search4']}/>

### 40.3 R2 cost model

Use the current vendor calculator before procurement; prices can change and request/operation counts matter. At the researched Standard storage rate of approximately $0.015 per GB-month, rough storage-only examples are:

| Stored amount | Approximate monthly storage charge before taxes/other operations |
|---:|---:|
| 100 GB | $1.50 |
| 1 TB (decimal 1,000 GB) | $15.00 |
| 5 TB | $75.00 |
| 20 TB | $300.00 |

If an applicable free allowance is available, subtract it only after confirming account eligibility and current pricing. This table excludes Class A/B operations, retrieval/early deletion where applicable, taxes, application compute, database, transcoding, CDN, logs, and backup duplication. R2 currently advertises no direct internet egress fee, but requests and other service usage still matter. <Cite refs={['turn863697search0']}/>

Do not decide based only on storage price: model total cost per hour watched, number of requests, concurrent users, video bitrate, cache hit ratio, transcoding minutes, retention, restore and egress path.

### 40.4 Cloudflare Stream cost model

Managed Stream is convenient because encoding, storage and delivery are billed with separate usage metrics. Researched published rates were $5 per 1,000 stored minutes per month and $1 per 1,000 delivered minutes, with encoding/ingress included under the stated pricing. Confirm current terms and regional product behavior in the vendor dashboard before launch. The published product documentation described adaptive output through 1080p; do not assume 4K output. <Cite refs={['turn110011view2','turn148837search5']}/>

Example, 100 titles averaging 120 minutes = 12,000 stored minutes, approximately $60/month storage component. If viewers watch 50,000 minutes in a month, delivered component is approximately $50. Approximate combined usage component: $110/month, before taxes/add-ons/other services. This is a scenario, not a quote. 

### 40.5 HLS and download behavior

- Public catalogue pages never expose raw origin object keys.
- Playback authorization runs on the server and evaluates user, title, territory, rights window, subscription/access state and takedown state.
- A playback token should be short-lived, scope-bound and revocable where supported.
- Never put a long-lived storage secret or unrestricted presigned URL in HTML metadata.
- For downloadable assets, issue a short-lived, one-object, GET-only URL; rate-limit requests and retain audit events.
- Do not promise DRM from signed URLs. Signed URL access control is not equivalent to DRM or screen-recording prevention.
- Store captions/subtitles and language variants as separate versioned assets.

## 41. Search, browse, recommendations and metadata quality

### 41.1 Search requirements

Search fields: canonical title, localized title, original title, alternate title, synopsis, people, collection/franchise, genre, language, release year and asset availability. Normalize Unicode and whitespace. Preserve the original script and user input for Bangla titles; do not transliterate as a replacement for original text.

### 41.2 Search implementation

Start with PostgreSQL full-text search and `pg_trgm` for typo tolerance. Add a dedicated search cluster only when product analytics show database search is the bottleneck. Build a denormalized `search_document` with normalized names and weighted fields. Index by tenant, publication state, territory and availability to avoid leaking unpublished titles.

### 41.3 Search ranking

A tunable ranking model can combine:

- exact title match (highest weight),
- title prefix and alternate-title match,
- original-title/localized-title match,
- people/genre/synopsis match,
- popularity/freshness as a small secondary signal,
- availability and territory eligibility as hard filters.

Do not let popularity override rights/access filters. Log query, latency, result count and clicked result without collecting unnecessary sensitive user text.

### 41.4 Recommendations

MVP: editorial collections, similar-genre, same-franchise, same-person, trending by verified first-party usage and recently added. Later: implicit-feedback ranking with user consent, minimum cohort thresholds and privacy controls. Do not call a simple “same genre” carousel AI personalization.

### 41.5 Metadata provenance

Store provider, external ID, retrieval timestamp, licence/terms reference, field-level confidence and manual override history. Revalidate metadata-provider licence before commercial use. TMDb's developer API is free for non-commercial use subject to attribution; commercial use requires a commercial licence/permission. <Cite refs={['turn110011view4']}/>

## 42. Threat model and security controls

### 42.1 Threat model

| Asset | Threat | Required control |
|---|---|---|
| User account | credential stuffing/session theft | MFA for admins, rate limit, secure cookie, session revocation |
| Admin console | privilege escalation | server-side RBAC, step-up auth, audit log |
| Media source | malware, parser exploit | quarantine, file signature/probe in sandbox, resource limits |
| Storage bucket | public exposure/key theft | private bucket, least privilege, signed short-lived access |
| Upload endpoint | storage exhaustion | quotas, multipart part limits, actor/tenant limits |
| Webhook endpoint | spoof/replay | signature validation, timestamp, idempotency |
| Job queue | forged/duplicated jobs | authenticated producer, schema validation, idempotency |
| OAuth refresh token | account takeover | encrypted at rest, least scope, rotation/revocation |
| User-provided URL | SSRF/internal metadata access | do not build arbitrary URL fetcher; strict allowlist if a partner integration needs fetch |
| Search/filter API | injection/resource abuse | parameterized query, bounded pagination, query timeout |
| Logs | signed URL/PII leakage | redact tokens, presigned URLs, passwords and secrets |
| Content rights | unlicensed publication | mandatory rights state machine, geo/time windows, takedown workflow |

### 42.2 SSRF rules

The public API must not accept an arbitrary URL and fetch it server-side. If a verified partner integration requires pulling a source, use a registered connector with a fixed hostname allowlist, HTTPS, redirect disabled or revalidated at every hop, private/link-local/reserved IP blocking after DNS resolution, outbound egress restrictions, byte/time limits, MIME validation and isolated worker networking. Reject userinfo in URLs and unusual IP encodings. Resolve DNS again at connection time to reduce rebinding risk.

### 42.3 Upload safety

- Enforce authenticated actor, tenant and per-file limits before issuing upload credentials.
- Store in private quarantine, never directly in public delivery path.
- Verify magic bytes / file signature and compare with declared MIME; MIME alone is untrusted.
- Probe using a sandboxed worker with network disabled, CPU/memory/time limits and patched FFmpeg/ffprobe.
- Treat parsers/codecs as attack surface; keep software patched.
- Scan where commercially appropriate; never claim an antivirus scan guarantees safety.
- Re-encode/transcode only in an isolated worker; no shell interpolation from file names or metadata.
- Restrict file names and never use them directly as filesystem paths.

### 42.4 Authentication and authorization

Follow a layered model: authentication proves identity, session management maintains identity, authorization decides each action. Put authorization in a central server-side data-access layer; deny by default. Check ownership/tenant scope on every data access. Hide internal role flags from client-controlled updates. Admin and publisher roles require MFA and audited step-up for high-risk actions. Next.js documentation describes the authentication/session/authorization split and recommends a DAL and DTO pattern. <Cite refs={['turn597235search0']}/>

### 42.5 Security verification baseline

Use OWASP ASVS 5.0.0 as a verification baseline and map each requirement to test evidence; do not merely write “OWASP compliant”. The release security gate should cover access control, session, input validation, cryptography, file handling, API security, logging, error handling, privacy and deployment configuration. <Cite refs={['turn346949view5']}/>

## 43. Content rights, legal workflow and takedown operations

> This is an engineering control framework, not legal advice. Before launch, obtain advice from counsel familiar with Bangladesh law and the law of every country/territory where the service is operated or marketed. A content licence can have territory, language, format, platform, subscription/ad-supported, download, rental, term and exclusivity limits.

### 43.1 Rights are structured data, not a checkbox

For every asset/title, store at minimum:

- Rights holder / licensor legal name and verified contact.
- Contract or permission document ID and immutable evidence hash.
- Rights grant type: ownership, licence, public-domain determination, open licence, partner distribution or other counsel-approved basis.
- Permitted territories (ISO country codes), excluded territories and geo-enforcement mode.
- Start and expiry timestamps with timezone policy.
- Permitted modes: catalogue listing, trailer, full playback, download, offline access, clips, promotional stills, subtitles/dubbing.
- Platform/device restrictions, monetization model, audience restrictions and any holdback window.
- Allowed languages, subtitles and dubbed tracks.
- Attribution requirements and copyright notice text.
- Distributor obligations: reporting, takedown contact, revenue share, audit and content-delivery conditions.
- Status: pending, approved, suspended, expired, disputed, revoked.
- Approval actor, timestamp, evidence and next review date.

A public-domain label must be supported by documented research for the relevant territory and version/recording. The underlying film, soundtrack, restoration, subtitles, artwork or recording may have separate rights. A CC licence can have conditions; preserve attribution and licence version.

### 43.2 Rights evaluator

Implement a central `RightsDecisionService` used by catalogue publication, search filtering, playback, download, API responses and scheduled expiry checks. Input includes asset/title, current time, user territory (derived only through an approved mechanism), requested action, customer/contract entitlement and rights record. Output is a structured allow/deny decision with reason code and audit reference. Fail closed if rights data is missing, stale or contradictory.

### 43.3 Publication gate

An admin cannot publish a media asset by clicking a generic “Publish” button unless all blockers are resolved:

1. Rights basis and evidence exist.
2. Rights window and territory are valid.
3. Delivery method matches grant (stream/download/trailer).
4. Asset integrity and media validation pass.
5. Metadata and attribution obligations are met.
6. Geo/access policy is configured.
7. Takedown contact and owner are assigned.
8. Publisher permission and audit record are present.

Require dual approval for high-risk rights changes, wide territory grants or bulk publication. Preserve a versioned rights decision history.

### 43.4 Takedown / dispute runbook

1. Create a case ID; record submitter, contact, timestamp, claimed work, URL/asset IDs, territory and allegation. Avoid requesting unnecessary identity documents.
2. Acknowledge receipt according to counsel-approved policy.
3. Place the identified asset and derivatives in `LEGAL_HOLD` or `TAKEDOWN_PENDING`; prevent new publication, playback and downloads while the claim is reviewed under the service's legal process.
4. Preserve relevant evidence securely: source licence, contract, upload actor, publication history, storage object IDs, audit logs and prior communications. Do not expose private uploader data to complainants without lawful basis.
5. Assign trained reviewer/legal contact; evaluate the notice and any counter-notice under applicable law and policy.
6. Apply outcome: restore, restrict territory, keep blocked, remove, or escalate to counsel. Do not delete evidence while a legal hold exists.
7. Remove from search index and caches, invalidate playback/download tokens where possible and notify affected parties as required.
8. Record decision, reviewer, deadlines, appeal route and completion evidence.
9. Run periodic trend review for repeat abuse and improve upload friction/policy.

### 43.5 Bangladesh and multi-territory review

Use the Bangladesh Copyright Office's current law/resource portal as an official starting point, then have counsel confirm the applicable statutes, rules, amendments, intermediary/platform obligations and cross-border implications. This blueprint does not interpret local legal requirements or assume that possession of a Google Drive link grants redistribution rights. Official resource: https://copyrightoffice.gov.bd/pages/laws

## 44. Testing strategy and release quality gates

### 44.1 Test pyramid

| Layer | What to verify | Tooling direction |
|---|---|---|
| Unit | rights evaluator, URL signer, title normalizer, permission rules, state transitions | Vitest/Jest |
| Component | accessible UI states, forms, player states, admin dialogs | React Testing Library |
| API integration | auth, ownership, pagination, filtering, validation, error contract | Supertest or API client |
| Database integration | constraints, transactions, migrations, outbox, tenant isolation | disposable PostgreSQL |
| Queue integration | retry, duplicate message, worker crash, lease expiry, dead-letter | real Redis test container |
| Storage contract | multipart completion/abort, checksum, presign TTL, provider failure | local S3-compatible test + staging bucket |
| Media integration | probe, invalid media, long duration, subtitles, audio tracks | curated legal fixtures |
| E2E | sign-up, browse, title detail, admin upload, rights approval, playback/download | Playwright |
| Security | RBAC, IDOR, SSRF, upload abuse, token leakage, CSRF, rate limits | OWASP tests + manual review |
| Performance | page p95, search p95, API throughput, queue lag, concurrent playback authorization | k6/Artillery |
| Recovery | restore DB, restore media sample, secret rotation, provider outage | scheduled disaster drill |

### 44.2 Mandatory negative tests

- User A cannot read/update User B's private records or upload sessions.
- Viewer cannot access admin routes, hidden API endpoints or unpublished assets.
- A title with expired rights cannot be found through search or played through a previously issued URL beyond the enforceable revocation window.
- Changing an object ID in a request never bypasses ownership/tenant checks.
- A signed URL for object X cannot read object Y or perform PUT/DELETE.
- Expired, tampered, replayed or revoked webhook events do not mutate state.
- Duplicate upload-complete events do not create duplicate assets or billing events.
- Malformed file names, MIME types, metadata and huge files are rejected safely.
- A ZIP bomb, parser-crashing fixture or unsupported codec cannot exhaust the worker host.
- Worker restart midway through transfer produces a recoverable state, not silent success or a second public asset.
- Database downtime returns a controlled error and does not publish stale data.
- Logs contain no passwords, OAuth refresh tokens, API secrets or full signed URLs.

### 44.3 Accessibility and UX tests

Check keyboard-only navigation, visible focus, semantic landmarks, labels/errors, color contrast, reduced-motion preference, captions/subtitles, player controls, accessible modal behavior, responsive layout and screen-reader announcements. Target WCAG 2.2 AA as a product goal, with automated scans supplemented by manual testing.

### 44.4 Release gates

Block release if:

- Type-check, lint, test or production build fails.
- Migrations are not rehearsed on a copy of staging data.
- A critical or high-severity security finding has no approved mitigation.
- Any published media lacks approved rights evidence.
- Backup restore was not tested inside the defined recovery window.
- Core E2E journey or signed playback fails.
- Monitoring/alerts and rollback owner are missing.
- No operator is assigned to takedown and incident response.

## 45. Observability, incident response and disaster recovery

### 45.1 Structured logging

Use JSON logs with timestamp, level, service, environment, build SHA, request ID, trace ID, actor ID (internal identifier only), tenant ID, action, entity ID and sanitized result code. Redact authorization headers, cookies, credentials, OAuth tokens, signed URLs, query tokens and unnecessary personal data. Keep audit logs separate from debug logs with stricter mutation/deletion controls.

### 45.2 Core metrics

**Web/API:** request rate, p50/p95/p99 latency, error rate, saturation, auth failures, rate-limit triggers.

**Database:** active connections, slow queries, lock waits, replication lag (if used), storage growth, backup age, restore test age.

**Queues:** waiting/active/delayed/failed jobs, oldest waiting age, processing duration, retry count, dead-letter count, worker heartbeat.

**Storage:** bytes stored, object count, multipart sessions open, upload success/failure, checksum mismatch, backup age, orphan object count.

**Media:** probe failures, transcode duration, output profile, playback authorization errors, delivered minutes, buffering/rebuffer rate if the delivery platform exposes it.

**Business:** published titles, assets awaiting rights approval, expiring rights windows, active users, search success, playback starts/completions and downloads—subject to privacy and consent policy.

### 45.3 Alert rules

Set actionable thresholds from baseline rather than guessing. At minimum alert on: public 5xx spike; DB unavailable; queue oldest job exceeds SLO; backup overdue; checksum mismatch; disk free below warning/critical thresholds; object storage credentials failing; OAuth connection revoked; unusual admin login; rights expiry/takedown job stuck; signed playback unauthorized spike; and storage/cost budget threshold reached.

Every alert needs an owner, runbook link, severity, deduplication key and expected response. Avoid alerting on every transient single error.

### 45.4 SLOs and recovery targets

Before production, explicitly select:

- Web/API availability target.
- Catalogue/search latency target at p95.
- Playback authorization latency target.
- Maximum acceptable queue lag for rights expiry/takedown jobs.
- Recovery Time Objective (RTO) for database and application.
- Recovery Point Objective (RPO) for catalogue/rights data and media assets.

Rights and takedown controls should have stricter freshness requirements than non-critical recommendation jobs. A stale recommendation is inconvenient; stale rights state may be unlawful.

### 45.5 Backup and restore

Use a managed database's automated backups plus encrypted logical exports as a separate recovery path. Back up database, rights evidence and key configuration independently. Do not back up secrets in plaintext. Media masters and derivatives need an explicit retention/replication policy based on rights and cost. Schedule restore tests; verify checksums and application-level invariants after restore. A backup that has never been restored is an unverified assumption.

### 45.6 Incident response

Maintain runbooks for: credential compromise, storage exposure, malicious upload, rights complaint/takedown, database loss, queue backlog, provider outage, unusual traffic/cost spike and corrupted media. Define incident commander, technical lead, legal/privacy contact, communication owner, evidence preservation and post-incident review. Revoke leaked keys first; deploy fixes after containment. Document lessons and regression tests.

## 46. SEO, privacy, analytics and localization

### 46.1 SEO

- Server-render title pages with canonical URLs, title/description, Open Graph and structured data only when accurate.
- Sitemap includes published, rights-valid, indexable catalogue records only.
- `noindex` private dashboards, account pages, upload endpoints, search result pages with low-quality thin permutations and unpublished content.
- Avoid duplicate pages for every filter combination; set canonical strategy.
- Do not expose unlicensed poster/backdrop images just because a metadata provider returns them.
- Make title pages useful: synopsis, language, release date, runtime, credits, availability, captions and where/how content can be accessed lawfully.

### 46.2 Privacy

Create a data inventory and purpose/retention matrix for identity, account, analytics, viewing history, access logs, uploaded files, rights evidence and support cases. Collect minimum data. Provide clear privacy notice and account deletion/export procedures where legally required. Separate account deletion from audit/legal-hold retention. Limit internal access to viewing activity; use aggregated analytics where possible.

### 46.3 Analytics

Track product events with a versioned event schema, consent rules and server-side validation. Candidate events: `catalogue_search_submitted`, `title_viewed`, `playback_authorized`, `playback_started`, `playback_completed`, `download_authorized`, `upload_completed`, `rights_review_completed`. Do not send signed URLs, file contents or raw personal data to analytics tools. Define retention and opt-out behavior.

### 46.4 Localization

Plan `en` and `bn` as first-class locales. Store original and localized title fields separately; preserve Unicode correctly in database, search and rendering; use locale-aware date/number formatting; use server-side translation dictionaries; avoid concatenating translated fragments; provide language selection persistently. Verify Bangla typography and line wrapping across mobile breakpoints.

## 47. Skills and learning roadmap

| Skill area | What to learn/build | Priority |
|---|---|---|
| TypeScript/React/Next.js | App Router, server/client boundaries, caching, forms, accessible components | Must-have |
| Backend/API design | REST contracts, validation, auth, DTOs, rate limits | Must-have |
| PostgreSQL | schema design, indexes, transactions, FTS, migrations, backup/restore | Must-have |
| Object storage | S3 APIs, multipart, presigning, lifecycle, checksums | Must-have |
| Queue engineering | at-least-once delivery, idempotency, retry, outbox, dead letters | Must-have |
| Media fundamentals | containers vs codecs, H.264/H.265/AV1, AAC, HLS, manifests, subtitles, ffprobe | Must-have for media |
| Linux/DevOps | SSH hardening, systemd, Docker, reverse proxy, TLS, firewall, monitoring | Must-have |
| Security | OWASP ASVS, RBAC, CSRF, SSRF, IDOR, secrets, upload isolation | Must-have |
| UI/UX | information architecture, design tokens, accessibility, responsive media player | Must-have |
| Testing | unit/integration/E2E/load/security/restore tests | Must-have |
| Product analytics | event taxonomy, funnel, cohort, cost per user/watch minute | Useful |
| AI/agents | code review agents, metadata-assisted curation with human approval, support search | Later |

### 47.1 Recommended learning order

1. Build a secure CRUD catalogue and admin workflow using TypeScript, Next.js and PostgreSQL.
2. Add role-based authorization, rights records and publish gate before handling real media.
3. Implement private object storage upload and checksum verification using test fixtures.
4. Build the queue/outbox/job-state model and test crash/retry behavior.
5. Add probe and managed transcoding/delivery on legal test files.
6. Add observability, backups, threat-model tests and a staging deployment.
7. Only then add real partner/owner media onboarding and public traffic.

### 47.2 Official reference set

- Next.js App Router and self-hosting: https://nextjs.org/docs/app and https://nextjs.org/docs/app/guides/self-hosting
- Next.js authentication: https://nextjs.org/docs/app/guides/authentication
- PostgreSQL documentation: https://www.postgresql.org/docs/
- Prisma documentation: https://www.prisma.io/docs
- BullMQ: https://docs.bullmq.io/
- Cloudflare R2: https://developers.cloudflare.com/r2/
- Cloudflare Stream: https://developers.cloudflare.com/stream/
- FFmpeg / ffprobe: https://ffmpeg.org/ffmpeg.html and https://ffmpeg.org/ffprobe.html
- Google Drive API: https://developers.google.com/workspace/drive/api/guides/about-sdk
- Google OAuth best practices: https://developers.google.com/identity/protocols/oauth2/resources/best-practices
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- OWASP API Security: https://owasp.org/www-project-api-security/
- Web Content Accessibility Guidelines: https://www.w3.org/TR/WCAG22/

Always re-check official docs for current stable versions, API limits, pricing and licensing at implementation time.

# PART VII — EXECUTION PLAN AND AI-AGENT OPERATING SYSTEM

## 48. Milestone roadmap with dependencies and Definition of Done

The roadmap deliberately starts with rights, data integrity and core catalogue foundations. Do not begin bulk media intake before those controls exist.

### M0 — Product decisions, rights model and risk review

**Deliverables**
- Product one-pager: audience, geography, content model, business model, catalogue scope, access modes.
- Rights and evidence data model reviewed by counsel/qualified rights owner.
- Content intake policy and prohibited-source policy.
- Infrastructure budget and vendor selection record.
- Threat model, privacy data inventory and initial SLO targets.

**Dependencies:** none.

**Definition of Done**
- Every content type has a documented rights basis and permitted distribution mode.
- No user story assumes that a public metadata record or URL gives permission to host a file.
- A named person is responsible for rights review, takedown intake and production operations.
- The MVP scope is approved and features outside scope are explicitly deferred.

### M1 — Repository foundation, design system and CI

**Deliverables**
- Monorepo or well-structured single repo based on team size; TypeScript strict mode.
- Next.js app, shared UI primitives, tokens, responsive shell and route layout.
- API validation, logging, environment-schema validation and health endpoints.
- CI workflow for lint, type-check, tests, build and dependency checks.
- Local Docker Compose for PostgreSQL and Redis; mock object-storage adapter.

**Definition of Done**
- A new developer can run the project using documented setup steps.
- No secrets are committed; `.env.example` contains placeholders only.
- CI blocks merge on failure.
- Dark/light behavior is intentional even if dark is the default; keyboard navigation and focus styles work.
- Error and loading states are represented in the design system.

### M2 — Authentication, roles, database and catalogue

**Deliverables**
- User/admin authentication with a maintained auth library or reviewed implementation.
- Server-side session management, RBAC, central DAL and audit events.
- PostgreSQL migrations and seed fixtures.
- Movie/title/people/genre/collection/language metadata model.
- Catalogue browse, title detail, filters, pagination and search.
- Admin CRUD with draft/published states; rights-aware publication gate.

**Definition of Done**
- IDOR/tenant-isolation tests pass.
- Users cannot discover or access unpublished content.
- Search uses parameterized queries and bounded result size.
- A title cannot publish without required rights evidence and allowed actions.
- Metadata provider licence is documented; commercial use is not enabled until approval.

### M3 — Rights ledger and asset intake

**Deliverables**
- Rights contract/evidence records and rights evaluator.
- Admin approval workflow and content hold/takedown states.
- Upload session APIs and private multipart object-storage integration.
- Quarantine bucket/prefix and temporary upload limits.
- SHA-256 integrity verification and media-probe jobs.
- Asset/source/derivative state model and audit log.

**Definition of Done**
- A test asset cannot publish while rights are pending, expired, disputed or outside territory.
- Upload is private, scoped to one object and time-limited.
- An interrupted upload can be resumed or safely aborted.
- Checksum mismatch moves the asset to quarantine/failure and never to public delivery.
- Untrusted media is probed in a bounded worker, not the Next.js request process.

### M4 — Media processing and authorized delivery

**Deliverables**
- Managed video integration or isolated FFmpeg worker architecture.
- Media profile registry: codecs, resolution, audio/subtitle tracks, target bitrate and packaging.
- Playback authorization service and signed playback/session tokens.
- Subtitle/caption tracks, poster and thumbnail assets.
- Signed download flow for allowed files, including expiry and audit event.
- Player UI with loading, error, unsupported browser and caption states.

**Definition of Done**
- Only approved rights-valid content can play or download.
- An expired or revoked title is blocked by server-side authorization.
- The platform never exposes storage credentials or a public bucket.
- Player tests cover desktop/mobile, captions, retry and playback errors.
- Load tests demonstrate the authorization/API tier can support the agreed pilot traffic; media bytes are delivered by the chosen provider/CDN.

### M5 — Automation, provider integrations and backup

**Deliverables**
- BullMQ job queues, outbox, idempotency and dead-letter handling.
- Approved source adapters: manual upload, rights-holder API, partner SFTP/API or a controlled storage connector.
- Job dashboard with retry/pause/cancel and audit history.
- Google Drive OAuth backup integration (if policy/terms permit), separately connected accounts and restore manifest.
- Database and rights-evidence backup with verification.
- Cost, storage and queue alerts.

**Definition of Done**
- Duplicate webhooks/jobs do not create duplicate assets or billing/backup records.
- Worker restart and provider outage tests recover correctly.
- OAuth tokens are encrypted at rest and never exposed in logs or frontend code.
- Backup restore test succeeds and checksums match.
- The system does not rotate accounts or identities to evade provider limits.

### M6 — Production hardening and launch candidate

**Deliverables**
- Staging deployment matching production topology.
- Security tests, dependency audit, threat-model review and ASVS mapping.
- Load tests for catalogue, authorization and queue jobs.
- SLOs, alerts, dashboards, incident runbooks, takedown runbook and rollback plan.
- Privacy notice, terms, content policy, metadata attribution and rights-holder contact flows reviewed by counsel.
- Accessibility pass and content QA.

**Definition of Done**
- No unresolved critical/high issue without formally approved mitigation.
- Database and media recovery exercises complete.
- On-call/incident owner and legal escalation contacts are known.
- No sample/demo content has accidentally entered production.
- Launch checklist signed by product, engineering and rights owner.

### M7 — Controlled launch and optimization

**Deliverables**
- Invite-only or limited public beta with a documented content set.
- Funnel analytics and support/feedback collection.
- Cost dashboard: storage, delivered minutes, operations, compute and backup.
- Product iteration backlog based on actual user behavior.
- Capacity plan for next 90 days.

**Definition of Done**
- Error rates, latency, queue age and unit cost stay within agreed guardrails for the pilot window.
- Rights expiry/takedown drills work end-to-end.
- User feedback has been translated into prioritized tickets.
- No scaling purchase is made without measured bottleneck evidence.

## 49. Prioritized backlog

### P0 — Must exist before real users/content

- Rights model and verified evidence.
- User/admin authentication and server-side permissions.
- Private storage, quarantine and checksum verification.
- Publish gate and rights evaluator.
- Catalogue browse/search/title detail.
- Secure upload lifecycle and file limits.
- Signed playback/download authorization.
- Audit log, error monitoring, database backup and restore test.
- Legal notice/contact/takedown workflow.

### P1 — Must exist before public beta

- Background queue with idempotency and retry.
- Worker isolation and media-probe pipeline.
- Captions/subtitles, multiple audio tracks if required.
- Admin asset lifecycle UI and job dashboard.
- Search quality, filters, localized titles and Bangla UI.
- Rate limits, abuse protections, admin MFA.
- Cost and quota alerts, operational runbooks.
- SEO metadata and sitemap with rights-aware index rules.

### P2 — High value after beta validation

- Editorial collections and curated landing pages.
- Watchlist/favorites and viewing progress.
- Better recommendation surfaces.
- Partner onboarding and controlled bulk-import tool.
- Automated metadata match suggestions with human review.
- Multi-region rights windows, territory-specific catalogues.
- More sophisticated analytics and A/B testing with consent.

### P3 — Defer until justified by data

- Microservices decomposition.
- Kubernetes and multi-region active-active deployment.
- Custom DRM implementation.
- AI-generated artwork or synopsis without rights/quality review.
- Real-time social features, comments and public uploads.
- Complex account-based storage sharding.
- Bespoke transcoding farm before managed provider economics are measured.

## 50. AI coding-agent operating model

### 50.1 The agent is an implementation assistant, not the product owner

The agent can inspect the repository, draft designs, implement a bounded task, run tests, review diffs and propose changes. It must not make unilateral legal, licensing, security-risk acceptance, spend or production-deployment decisions. Human approval is required for publishing content, deleting production data, changing rights, adding external providers, exposing endpoints, spending money and production releases.

### 50.2 Required agent workflow per task

1. **Context:** read `README`, architecture decision records (ADRs), product requirements, existing code conventions and relevant tests.
2. **Inspect:** map the affected files, routes, components, database tables, permissions and external dependencies. Do not assume the repository matches the prompt.
3. **Plan:** state intended changes, assumptions, risks, test strategy and migrations. If a critical requirement is absent, document it rather than inventing policy.
4. **Bound:** implement the smallest coherent vertical slice; avoid unrelated refactors.
5. **Build:** preserve TypeScript strictness, validation at boundaries, server-side authorization, accessibility and design tokens.
6. **Test:** add regression tests, run required commands, inspect logs and check the production build.
7. **Review:** inspect diff for secret leakage, unsafe shell use, unbounded queries, raw SQL, SSRF, IDOR, public storage and missing audit events.
8. **Report:** list changed files, behavior, tests run/result, migrations, manual steps, risks and follow-ups. Never claim a command/test passed without actually running it.
9. **Stop safely:** do not publish content, migrate production, rotate credentials, delete data, incur paid spend or deploy to production without explicit approval.

### 50.3 Repository governance files

Create and maintain:

- `AGENTS.md` (or agent instruction file supported by the chosen coding tool): global rules and commands.
- `docs/product/PRD.md`: product scope and personas.
- `docs/architecture/overview.md`: context/container diagrams and service boundaries.
- `docs/architecture/decisions/`: ADRs for storage, database, auth, video, search, deployment.
- `docs/security/threat-model.md`: threats and mitigations.
- `docs/security/rights-and-takedown.md`: rights state machine and response ownership.
- `docs/operations/runbooks/`: database restore, queue stuck, media failure, storage outage, credential leak, takedown.
- `docs/operations/cost-model.md`: usage assumptions and vendor calculator links.
- `docs/api/openapi.yaml`: API contract.
- `docs/testing/test-plan.md`: test matrix and release gates.

### 50.4 Human review boundaries

Always require human review for: rights changes, publication, provider credentials/scopes, new outbound network integration, database destructive migration, infrastructure spend, public DNS, production secrets, production deploy, backup deletion and user data deletion. A coding agent may prepare commands and a checklist but must stop before executing irreversible/high-impact actions.

## 51. Master AI development prompt — canonical version

Copy the prompt below into a repository-aware coding agent (Codex, Claude Code, Gemini CLI or equivalent). Start it at the repository root. It is designed to make the agent inspect and build in stages, not hallucinate that a complete platform can be generated in a single pass.

```text
ROLE
You are the principal product engineer, staff software architect, senior full-stack engineer, platform engineer, security-minded reviewer and pragmatic UX implementation partner for a lawful movie discovery and authorized media distribution platform.

PRODUCT MISSION
Build a premium, reliable, accessible, production-oriented movie catalogue and media distribution platform. It supports discovery, search, metadata, authorized uploads, rights management, private storage, media processing, playback, permitted downloads, administrative review, auditability, backups and operations.

NON-NEGOTIABLE CONTENT AND LEGAL BOUNDARY
Only process and distribute content the operator owns, has documented permission/licence to distribute, or has a counsel-reviewed public-domain/open-licence basis to use. Never build or implement piracy-site scraping, unauthorized link extraction, hidden download-link resolution, CAPTCHA/Cloudflare/shortlink bypass, torrent piracy workflows, DRM circumvention, unauthorized Drive mirroring, or storage-account/quota rotation to evade provider limits. Do not fetch arbitrary user-supplied URLs server-side. Do not infer distribution rights from a metadata API, poster URL or public file link. Metadata access and media-distribution rights are separate approvals. If a task would cross this boundary, refuse that implementation path and propose a lawful partner/owner-upload alternative.

FIRST ACTION — REPOSITORY AUDIT
Do not start coding immediately. Inspect the entire repository structure and relevant files. Read README, package manifests, lockfile, current routes, components, styling, database schema/migrations, auth, tests, deployment files and existing agent instructions. Identify actual framework/runtime/package versions from the repository and current official stable docs where access is available. Do not assume an empty repo. Do not overwrite existing work before understanding it.

Deliver an audit report containing:
1. Current stack and exact versions.
2. Existing features and architecture.
3. Broken, duplicated, unsafe or incomplete areas.
4. Current UI/design system assessment.
5. Database/auth/API state.
6. Security and rights-management gaps.
7. Deployment and testing state.
8. Proposed phased plan with dependencies.
9. Highest-risk assumptions and questions requiring human decision.
Then stop and ask for approval if the requested scope would cause destructive changes, production actions, paid resources or rights decisions. For low-risk repo inspection and local tests, proceed without waiting.

ENGINEERING PRINCIPLES
- Prefer a modular monolith initially; split services only when measurable scaling or team boundaries justify it.
- Use TypeScript strict mode and small, explicit module boundaries.
- Validate every external boundary with schemas; never trust client values.
- Keep authorization on the server and centralize it in a data-access/rights layer.
- Deny by default; enforce tenant/owner scope on every data access.
- Use PostgreSQL as the source of truth; use Redis/BullMQ for asynchronous delivery, not as the only durable job record.
- Use an outbox/idempotency design for external side effects.
- Use private object storage and short-lived, scoped signed access. Do not expose storage keys or public buckets.
- Treat media parsing and transcoding as untrusted workload: isolate workers, limit CPU/memory/time, patch FFmpeg/ffprobe, and disable unnecessary network access.
- Do not use user-supplied URL fetching as a generic ingestion mechanism. Prefer upload, registered partner API/SFTP, or owner-controlled storage connector.
- Do not log passwords, tokens, OAuth refresh tokens, cookies or full signed URLs.
- Use accessible semantic UI, keyboard navigation, focus states, reduced-motion support and responsive layouts.
- Prefer maintainable code over abstraction for abstraction's sake. Do not introduce microservices, Kubernetes or expensive dependencies before evidence requires them.

PREFERRED BASELINE (ADAPT TO REPOSITORY; DO NOT FORCE A REWRITE)
- Frontend/full-stack: current stable Next.js App Router + React + TypeScript.
- Styling: Tailwind CSS and a restrained token-based component system; reuse existing UI library if sound.
- Database: PostgreSQL; select Prisma or Drizzle based on existing repo and stable compatibility.
- Validation: Zod or equivalent.
- Queue: Redis + BullMQ for Node.js workers, with durable job state/outbox in PostgreSQL.
- Storage: S3-compatible private object storage (Cloudflare R2 is an option); define a provider adapter.
- Video: managed video platform or isolated FFmpeg/HLS pipeline; select only after cost/quality/legal review. Do not assume 4K from a 1080p-managed service.
- Observability: structured logs, Sentry or equivalent error tracking, metrics and actionable alerts.
- Tests: Vitest/Jest, React Testing Library, Playwright, API integration tests, load tests and restore drills.
- Deployment: Docker, reverse proxy, TLS, CI/CD and environment separation. A small VPS may host a pilot control plane, not large-scale video origin/transcoding by default.

PRODUCT MODULES
1. Public catalogue: home, discovery, search, filters, title pages, collections, people pages, genres, localized titles.
2. Identity: sign-up/login, sessions, account security, watchlist and preferences.
3. Rights and compliance: evidence, territories, windows, permitted actions, approval, expiry, legal hold, takedown and audit history.
4. Media assets: original, derivative, subtitle, poster, audio track, checksum, technical metadata and lifecycle.
5. Ingestion: owner uploads, manual registration, partner API/SFTP connectors and approved storage connectors.
6. Processing: quarantine, file validation, ffprobe, transcode submission, derivative validation and failure recovery.
7. Delivery: server-authorized playback, signed URL/token, permitted download, captions and access audit.
8. Admin: users/roles, titles, rights, assets, uploads, jobs, provider connections, reports, takedowns and settings.
9. Operations: queues, health, storage, backup, cost, audit, incident and restore dashboards.
10. Analytics: privacy-conscious search, discovery, playback and delivery funnel.

RIGHTS GATE
Implement a central RightsDecisionService. It must check asset/title, requested action (metadata view, poster, trailer, full stream, download), territory, current time, rights term, audience restrictions, user entitlement and legal hold/takedown state. Missing or conflicting rights data must deny delivery. Publication must require evidence, permitted mode, territory, time window, attribution, reviewer and audit entry. Rights expiry must automatically unpublish and invalidate delivery through the authorization layer. Never rely on a frontend-only visibility flag.

DATA MODEL
Design normalized, indexed PostgreSQL tables with constraints and migrations. At minimum consider:
- users, sessions, accounts, roles, permissions, user_roles;
- titles, localized_titles, people, title_credits, genres, title_genres, collections;
- metadata_sources, external_ids, metadata_snapshots, attribution_requirements;
- rights_holders, rights_grants, rights_evidence, rights_territories, rights_actions, rights_reviews, takedown_cases;
- assets, asset_versions, upload_sessions, media_tracks, media_profiles, derivatives, subtitles;
- storage_objects, storage_providers, backup_policies, backup_runs, backup_manifest;
- jobs, job_attempts, outbox_events, webhooks;
- watchlists, viewing_progress, playback_sessions, download_events;
- audit_events, support_cases, feature_flags, app_settings.
Use UUID/ULID identifiers, timestamps with timezone, explicit status enums, foreign keys, uniqueness rules, soft-delete only when justified and immutable audit history for critical operations. Add indexes from real query patterns. Do not store binary media in PostgreSQL.

API RULES
Design versioned, documented endpoints with schema validation, stable error shapes, pagination and rate limits. Keep internal object IDs separate from provider object keys. Generate an OpenAPI contract. Every mutation checks authenticated actor, role, tenant scope, resource ownership and rights policy. Return 404 or 403 intentionally to avoid resource enumeration. Use idempotency keys for create/upload-complete and provider webhook operations.

UPLOAD AND INGESTION
For large files, use provider-supported multipart/resumable uploads. Backend creates an upload session only after permissions, rights and quota checks; issue a limited, short-lived upload capability; track parts and expiry; finalize; verify object size and checksum; move to quarantine; probe in a resource-limited worker; record codec/container/audio/subtitle details; then move to ready-for-processing. On failure, retain an actionable error, clean abandoned multipart sessions and never expose quarantined media. Accept only registered partner connectors or owner-controlled sources. Never create an open proxy or arbitrary URL fetch endpoint.

MEDIA PROCESSING
Represent original masters separately from derivatives. Define named profiles, codec/container/audio/subtitle requirements and versioned processing settings. Prefer managed processing until usage justifies self-hosted workers. If using FFmpeg, execute with argument arrays (never shell string interpolation), no privileged container, read-only root, bounded temp volume, no network unless explicitly needed, CPU/memory/pids/time limits, updated codecs and a patched base image. Validate HLS manifests/segments and output duration before marking ready. Record tool version and profile version for reproducibility.

PLAYBACK AND DOWNLOAD SECURITY
Check rights and entitlement at playback-session creation and every refresh. Use short-lived scoped signed playback credentials; enforce allowed origins/territories where supported. Do not pretend signed URL equals DRM. Never expose unrestricted object keys. For download, verify action permission, user limit, expiry and audit event; issue one-object GET only. Re-check rights on every new authorization, and design token revocation/short TTL for urgent holds.

QUEUE AND RELIABILITY
Use separate queues for catalogue, ingest, media, backup and maintenance. Keep durable job state in PostgreSQL. Implement outbox, idempotency key, attempt history, lease/heartbeat, bounded exponential backoff with jitter, dead-letter handling, cancellation, rate limits and provider Retry-After. A duplicate job/webhook must not duplicate a transfer, asset, charge or publication. Do not retry permanent errors. Make all state transitions guarded and auditable.

STORAGE AND BACKUP
Define a provider-neutral StorageProvider interface. Keep buckets private. Use immutable opaque keys, checksums, lifecycle rules, multipart abort cleanup and storage quota telemetry. Model storage cost and delivery cost separately. Google Drive may be an optional authorized backup destination only if plan terms and policy allow it. Connect each account independently with user OAuth, least privilege and encrypted refresh-token storage. Do not pool consumer storage, rotate accounts to evade quotas or expose Drive public links as CDN. Record backup manifest and periodically restore/verify samples.

SEARCH AND UX
Start with PostgreSQL FTS and pg_trgm; add a search cluster only when metrics justify it. Preserve Bangla Unicode/original titles and store transliterations as separate fields. Filter by publication, territory and rights before ranking. Build a premium cinematic interface with restrained dark visual system, editorial typography, clear hierarchy, responsive cards, accessible focus, skeletons, empty/error states, keyboard support and mobile-first navigation. Avoid generic AI-generated slop, excessive glass effects, decorative animations that harm usability and fake controls. All visible controls must work.

SECURITY
Threat-model auth, admin, storage, upload, jobs, webhooks, SSRF, IDOR, CSRF, XSS, SQL injection, path traversal, file parser exploits, secrets and cost abuse. Apply least privilege, MFA for administrators, secure cookies, CSRF protection, rate limits, request-size limits, private networking, secret manager, key rotation, dependency scanning, audit log, CSP/security headers and backup encryption. Use OWASP ASVS 5.0 as a verifiable baseline; map controls to tests/evidence. Never claim compliance without assessment.

TESTING
Write unit, component, database integration, API, queue, storage contract, media integration, Playwright E2E, accessibility, security, load and disaster-recovery tests. Include negative tests for IDOR, rights expiry, revoked links, duplicate events, malformed uploads, storage outage, worker crash and secret redaction. No critical/high security issue can be ignored without a documented risk acceptance by a human owner.

OBSERVABILITY
Use structured redacted JSON logs, request/trace IDs, metrics for API latency/errors, DB health, queue lag, storage/backup, media probe/transcode, playback authorization and cost. Define SLO, RTO, RPO, alerts and incident owners. Build runbooks for DB restore, queue stuck, upload failure, storage outage, leaked secret and takedown case.

DEPLOYMENT
Create development/staging/production environments with separate data, storage and OAuth clients. Use CI to lint, typecheck, test, audit dependencies, build immutable image and deploy the same digest. Use reverse proxy/TLS, health/readiness checks, private database/Redis, container resource limits, backup, migration expand/contract, rollback plan and release notes. Never expose DB/Redis publicly. Never deploy or run destructive migrations to production without human approval.

UI QUALITY BAR
The design should feel like a premium modern film service: cinematic but restrained, editorial, fast, consistent and usable. Build tokens for color, typography, spacing, elevation, radius and motion. Include all breakpoints, focus/hover/active/disabled/loading/error/empty states. Do not use lorem ipsum or fake movie data in production. Fixtures must be visibly marked development-only. Use real legally usable images or placeholders. Do not assume a metadata provider's image is licensed for every commercial use.

IMPLEMENTATION STRATEGY
Work in milestones: M0 requirements/rights; M1 repo foundation/design/CI; M2 auth/database/catalogue; M3 rights/asset intake; M4 processing/playback; M5 queues/backups; M6 security/ops/staging; M7 controlled beta. At the beginning of each milestone, inspect current state and dependencies. Implement small vertical slices. Do not attempt the entire platform in one code-generation pass.

AGENT REPORTING
Before implementation, provide repo audit and plan. For each bounded task, report: objective, files changed, migration impact, security/rights implications, tests run with actual results, deployment notes, unresolved risks and next step. Never say tests pass unless executed. Do not conceal incomplete work. Keep docs/ADRs synchronized with real code.

HUMAN APPROVAL REQUIRED
Stop and request approval before: content publication, rights changes, external provider onboarding, OAuth scopes, paid resources, production DNS/deployment, production secret changes, destructive migration, deleting backups/user data, bulk media ingest or any irreversible action.

START NOW
First inspect the repository and produce the audit report. Do not invent that files, credentials, provider accounts or licences exist. Then propose the smallest safe M1 task and its acceptance tests. Wait for approval only where a human decision or high-impact action is required; otherwise proceed with reversible local work.
```

## 52. Specialist prompts for controlled implementation

Use these after the canonical master prompt, one at a time. They narrow scope so an agent does not mix UI, schema, infrastructure and production operations in one uncontrolled pass.

### Prompt A — Repository audit and engineering plan

```text
Inspect this repository without modifying files. Map the app structure, installed versions, routes, components, styles, server/client boundaries, API, database, auth, tests, deployment and dependencies. Run only safe read-only commands and existing test/build commands. Identify missing rights controls, authorization gaps, unsafe media handling, public storage, secrets, SSRF, missing migrations and inaccessible UI states. Produce an evidence-based report with exact file paths, severity, dependencies, a phased plan and recommended ADRs. Separate verified facts from assumptions. Do not propose a rewrite unless you show why incremental refactoring is insufficient.
```

### Prompt B — Premium product UI implementation

```text
Implement only the approved product UI slice. First inspect the existing design and preserve working patterns. Create a token-based cinematic design system with dark-first palette, editorial typography, restrained motion, responsive grid, accessible components and realistic loading/empty/error states. Build the agreed routes: home/discovery, search, title detail, collections, sign-in/account, admin shell. Use fixture data only in development and clearly mark it. Do not create inert controls or fake player functionality. Add responsive and keyboard/accessibility tests. Do not change database, storage or rights logic unless explicitly included in the ticket.
```

### Prompt C — Database, auth and rights gate

```text
Implement the approved PostgreSQL schema, migrations, validation, server-side auth and RightsDecisionService. Begin with an ERD and migration plan. Enforce deny-by-default authorization in the DAL and tenant/ownership checks on every mutation/read. Add rights evidence, territory/action/window constraints, expiry and takedown state. The publish and delivery paths must use the same evaluator. Add unit/integration tests including expired rights, pending rights, wrong territory, download-not-allowed, revoked grant and user IDOR. Do not seed fake rights approval.
```

### Prompt D — Authorized ingestion and storage

```text
Implement a provider-neutral private object-storage adapter and authorized upload lifecycle. Support upload-session creation, short-lived scoped upload capability, multipart/resumable handling as supported by provider, completion verification, checksum, quarantine and cleanup of abandoned sessions. Accept only authenticated owner uploads or registered partner connectors. Do not accept arbitrary URLs or scrape external sites. Validate file size, type/signature and actor quota. Add failure, retry, duplicate completion and checksum mismatch tests. Keep all media private until the rights and media readiness gates pass.
```

### Prompt E — Media processing and player

```text
Implement media probing and delivery only for test fixtures or approved assets. Define a versioned media profile. If FFmpeg is self-hosted, execute safely in an isolated least-privilege worker with argument arrays, resource limits and no unnecessary network. Validate output manifests/segments, duration, audio and subtitle tracks. Implement playback-session authorization and short-lived signed delivery. Do not describe signed URLs as DRM. Add player states, captions, errors and browser tests. Do not assume 4K if selected managed provider documents only 1080p output.
```

### Prompt F — Queue, backup and Google Drive integration

```text
Implement durable job state, outbox, idempotency, lease/heartbeat, bounded exponential retry, dead-letter handling and queue observability. Add an optional Google Drive backup adapter only after account owner OAuth consent and plan-policy review. Encrypt refresh tokens at rest, minimize OAuth scopes, handle revocation and upload resumably. Keep each authorized account as a separate backup destination; do not pool capacity or rotate accounts to evade limits. Record checksums and a backup manifest and write a restore verification test. No public movie links should point to Drive.
```

### Prompt G — Security, performance and recovery audit

```text
Perform a security and reliability review against OWASP ASVS 5.0 and the documented threat model. Test RBAC/IDOR, CSRF/XSS, SSRF exposure, upload limits, file parser isolation, signed URL scope/expiry, webhook signature/replay, queue idempotency, secrets/log redaction, rate limits and tenant isolation. Run measured load tests for web/API/search/authorization/queue. Review DB indexes, slow queries, memory, disk and worker saturation. Test DB restore and media checksum restore. Output findings by severity with reproduction evidence and fixes. Do not claim compliance without evidence.
```

### Prompt H — VPS deployment and operations

```text
Prepare a single-VPS pilot deployment plan for the currently available 2 vCPU / 8 GB RAM / 100 GB disk host. Do not assume guaranteed port speed, bandwidth or root capabilities; inspect provider constraints first. Use Docker Compose or systemd based on repository. Put a reverse proxy/TLS in front, keep database/Redis private, set container resource limits, log rotation, disk alerts, backup, firewall and SSH hardening. Keep media origin/transcoding off this VPS. Prepare dev/staging/prod env separation, safe migrations, health checks, rollback and runbooks. Do not run production commands, expose ports, modify DNS or buy resources without explicit approval.
```

### Prompt I — Production launch review

```text
Act as a release manager. Do not change code yet. Verify launch checklist: rights evidence, takedown process, privacy/terms, metadata attribution and commercial licence, admin MFA, no exposed secrets, private storage, signed access, expiry enforcement, backup/restore, security tests, accessibility, load test, error monitoring, cost alerts, SLOs, incident owner and rollback. Produce go/no-go with objective evidence and blocking issues. Any missing rights evidence or takedown capability is a no-go.
```

## 53. Decision register — decide now, defer later

A decision register prevents an AI agent or developer from silently choosing expensive or legally sensitive defaults.

| Decision | Recommended default | Human decision required? | When to revisit |
|---|---|---|---|
| Content model | Rights-cleared catalogue only | Yes: scope and legal basis | Before M0 sign-off |
| Launch territory | One defined territory first | Yes | Before rights evaluator implementation |
| Monetization | None for private pilot; decide before public launch | Yes | M0/M6 |
| Catalogue metadata | Manual/approved provider integration | Yes: provider terms and budget | Before import |
| Metadata API | TMDb only after correct non-commercial/commercial approval | Yes | Before production key use |
| Primary database | PostgreSQL | No, unless existing system dictates otherwise | Revisit only after measured needs |
| ORM | Preserve existing ORM; otherwise select one stable option | Engineering review | M1 |
| Queue | Redis + BullMQ for Node-based worker | Engineering review | M1/M5 |
| Primary media storage | Private R2/S3-compatible object storage | Yes: vendor, jurisdiction, cost | Before first real upload |
| Video delivery | Managed Stream for pilot if its resolution/price meets requirements | Yes: budget/quality | After measured watch-time model |
| 4K delivery | Not in MVP unless validated provider supports it | Yes | After product validation |
| Drive use | Optional backup only, not streaming origin | Yes: plan terms and OAuth | M5 |
| Four Google One accounts | Four separate authorized destinations; do not treat as pooled block storage | Yes: confirm exact plan and intended backup terms | Before connection |
| Current VPS | Pilot control plane only | No for local development; yes before production exposure | M1/M6 |
| Admin MFA | Required | No | Before production |
| Public registration | Invite-only beta first | Yes | M7 |
| Recommendations | Editorial/similar titles first | No | Revisit after usage data |
| Dedicated search cluster | No; use Postgres first | No | Only after p95/scale evidence |
| Microservices/Kubernetes | Defer | No | Only when measured need and team capability exist |

### 53.1 Decisions that must never be guessed by an agent

- Whether a particular film, poster, subtitle, trailer or soundtrack may be distributed.
- Which territory is allowed and when rights begin/end.
- Whether a provider plan permits the intended storage/backup/public-delivery workflow.
- Whether a metadata/image API licence is sufficient for commercial use.
- Whether to incur recurring cost, expose a public endpoint, run a production migration or delete a backup.

## 54. Practical 12-week execution calendar

The calendar assumes one developer using an AI coding assistant, part-time product/design review and no major legacy application to preserve. It is an effort plan, not a promise of completion time; legal approval, provider onboarding and external dependencies can change it.

| Week | Focus | Tangible outcome | Exit test |
|---|---|---|---|
| 1 | M0 discovery and rights scope | PRD, rights matrix, ADRs, vendor/price assumptions | Human owner signs off scope and content basis |
| 2 | Repo, CI, design tokens | Working app shell, CI, local Docker services | Fresh clone setup and CI green |
| 3 | Auth, roles, admin shell | Secure login/session, admin role, audit events | RBAC and IDOR tests pass |
| 4 | Catalogue schema and UI | Browse, title detail, filters and search | Catalogue E2E works with fixtures |
| 5 | Rights ledger and publish gate | Rights evidence, territories, actions, expiry | No unapproved item can publish or play |
| 6 | Private upload sessions | Multipart upload, quarantine, checksum | Interrupted upload recovers; mismatch blocks |
| 7 | Probe and asset validation | Worker pipeline, media metadata, safe error state | Invalid media cannot reach delivery |
| 8 | Playback and captions | Signed playback/session, player UX, captions | Authorized playback works; revoked rights deny |
| 9 | Queue, backup and admin jobs | Idempotent jobs, retries, Drive backup adapter if approved | Duplicate event and worker crash tests pass |
| 10 | Security, privacy, SEO, accessibility | Threat fixes, notices, metadata attribution, accessible UX | Security and accessibility gates documented |
| 11 | Staging, load and restore | Production-like staging, monitoring, restore drill | Measured SLOs and RTO/RPO report |
| 12 | Controlled beta readiness | Launch decision pack, runbooks, first legal content set | Go/no-go review complete |

### 54.1 Weekly operating cadence

- **Start of week:** select one milestone outcome and write acceptance criteria before coding.
- **Daily:** inspect the smallest vertical slice, run targeted tests, review AI-generated diffs.
- **End of week:** deploy to staging, demo real workflow, review defects/cost/security, update ADRs and backlog.
- **Every release:** check rights gate, backup, rollback, observability and incident ownership.

## 55. Exact project layout and setup conventions

The initial repository should be a modular monolith. Keep it simple enough for one developer but explicit enough to split later.

```text
movie-platform/
├── apps/
│   └── web/
│       ├── app/
│       │   ├── (public)/
│       │   ├── (auth)/
│       │   ├── account/
│       │   ├── admin/
│       │   └── api/v1/
│       ├── components/
│       ├── features/
│       │   ├── catalogue/
│       │   ├── search/
│       │   ├── player/
│       │   ├── watchlist/
│       │   ├── account/
│       │   ├── rights/
│       │   ├── assets/
│       │   └── admin/
│       ├── styles/
│       └── tests/
├── packages/
│   ├── db/             # schema, migrations, seed fixtures
│   ├── domain/         # rights, catalogue, asset state machines
│   ├── contracts/      # shared API/event schemas
│   ├── storage/        # provider-neutral storage adapters
│   ├── media/          # probe/profile/manifest validation
│   ├── jobs/           # queue definitions and producers
│   ├── ui/             # shared accessible primitives
│   ├── config/         # lint, tsconfig, test config
│   └── observability/  # logging, tracing, metrics helpers
├── workers/
│   ├── ingest-worker/
│   ├── media-worker/
│   ├── backup-worker/
│   └── maintenance-worker/
├── infra/
│   ├── docker/
│   ├── compose/
│   ├── proxy/
│   ├── systemd/
│   └── scripts/
├── docs/
│   ├── product/
│   ├── architecture/decisions/
│   ├── security/
│   ├── api/
│   ├── operations/runbooks/
│   ├── testing/
│   └── cost-model.md
├── .github/workflows/
├── AGENTS.md
├── .env.example
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

The exact folder layout may be adapted to a starter repository, but keep domain logic outside route handlers and UI components. Do not create a `workers` app until there is a real background workload; a first pilot may run a separate worker process from the same package.

### 55.1 Local setup sequence

Use current stable versions verified at implementation time. Example flow (the package manager and scripts must match the actual repo):

```bash
# 1. Clone the repository and enter it
git clone <YOUR_AUTHORIZED_REPOSITORY_URL> movie-platform
cd movie-platform

# 2. Install the lockfile-pinned dependencies
corepack enable
pnpm install --frozen-lockfile

# 3. Create local configuration from the documented template
cp .env.example .env.local
# Fill only local development values; never use production credentials.

# 4. Start local dependencies
# Use the repository's documented compose file and service names.
docker compose -f infra/compose/dev.yml up -d

# 5. Apply migrations and seed development-only fixtures
pnpm db:migrate
pnpm db:seed

# 6. Run the application and checks
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Do not paste real secrets into a coding-agent prompt. Store them in a local secret manager or ignored environment file and provide the agent only the variable names and whether they are configured.

### 55.2 Suggested scripts to standardize

| Script | Required behavior |
|---|---|
| `dev` | Start local web app |
| `build` | Reproducible production build |
| `start` | Start compiled app |
| `lint` | Static lint checks |
| `typecheck` | TypeScript strict checks |
| `test` | Unit and component tests |
| `test:integration` | DB/API/queue integration tests |
| `test:e2e` | Playwright E2E |
| `db:migrate` | Apply forward migrations |
| `db:seed` | Development-only deterministic fixtures |
| `db:backup` | Encrypted backup procedure with clear target |
| `db:restore:verify` | Restore into isolated DB and validate |
| `worker:ingest` | Start ingestion worker |
| `worker:media` | Start media worker |
| `worker:backup` | Start backup worker |

## 56. Go-live checklist — sign-off sheet

### Product and UX
- [ ] MVP scope, target audience and launch territory are written down.
- [ ] Homepage, catalogue, search, title detail and account flows work at mobile/tablet/desktop sizes.
- [ ] Every visible control has a working action or is explicitly disabled with explanation.
- [ ] Loading, empty, error, unauthorized and offline/provider-failure states are designed.
- [ ] Bangla/English title and interface rendering have been tested if both locales are supported.
- [ ] Keyboard navigation, focus visibility, contrast and captions are reviewed.

### Content and rights
- [ ] Each published title/asset has a traceable rights basis.
- [ ] Territory, start/end dates and allowed actions are recorded.
- [ ] Metadata, images, trailers, subtitles and video rights are considered separately.
- [ ] Attribution/notice requirements are visible where required.
- [ ] Takedown contact, review owner, legal hold and response runbook exist.
- [ ] Rights expiry and emergency unpublish paths are tested.

### Application security
- [ ] Admin MFA is enabled.
- [ ] RBAC/IDOR/tenant isolation tests pass.
- [ ] Cookies, CSRF, rate limits, request size and security headers are configured.
- [ ] Secrets are stored outside source control and container images.
- [ ] No public database, Redis or private media bucket.
- [ ] Upload and media parsing are isolated and resource bounded.
- [ ] No arbitrary URL fetcher/SSRF path is exposed.
- [ ] Logs redact tokens, credentials and signed URLs.

### Media and storage
- [ ] Upload is authenticated and scoped to an exact object.
- [ ] Multipart expiry and cleanup are configured.
- [ ] SHA-256 verification and quarantine path are tested.
- [ ] Media probe and derivative validation pass for the approved content set.
- [ ] Playback/download tokens are short-lived and rights-aware.
- [ ] CDN/cache invalidation or expiry behavior is documented for takedown.
- [ ] Backup and restore checksums are verified.

### Reliability and operations
- [ ] Production database backup and recovery target are documented.
- [ ] Restore drill succeeds.
- [ ] Worker retry, idempotency, dead-letter and restart behavior are tested.
- [ ] SLOs, dashboards and actionable alerts are active.
- [ ] Disk, database, queue, storage and video-delivery cost alerts are set.
- [ ] Incident owner, rollback owner and legal escalation contact are known.
- [ ] Staging deployment and migration rehearsal are complete.

### Commercial and vendor readiness
- [ ] Metadata provider licence covers the intended use.
- [ ] Hosting/storage/video provider terms are compatible with the service.
- [ ] Current pricing is checked with realistic traffic assumptions.
- [ ] Privacy notice, terms, content policy and contact details are approved.
- [ ] No paid resource or production provider is activated without budget approval.

**Go/no-go rule:** any missing rights evidence, public storage exposure, broken authorization, untested database recovery or absent takedown owner is a launch blocker.

## 57. Source register and verification notes

This section distinguishes official product documentation used for engineering choices from project assumptions. Vendor limits, pricing, API versions and licences can change. Re-check them in the actual account and official documentation before implementation and procurement.

| Topic | Official source | Used for |
|---|---|---|
| Next.js self-hosting | https://nextjs.org/docs/app/guides/self-hosting | Reverse proxy, caching and multi-instance considerations |
| Next.js authentication | https://nextjs.org/docs/app/guides/authentication | Authentication/session/authorization separation, DAL and DTO pattern |
| PostgreSQL | https://www.postgresql.org/docs/ | Database design, indexes, FTS and operations |
| BullMQ retries | https://docs.bullmq.io/guide/retrying-failing-jobs | Bounded retry/backoff design |
| BullMQ idempotency | https://docs.bullmq.io/patterns/idempotent-jobs | Duplicate-safe job processing |
| Cloudflare R2 pricing | https://developers.cloudflare.com/r2/pricing/ | Storage and request cost assumptions |
| R2 presigned URLs | https://developers.cloudflare.com/r2/api/s3/presigned-urls/ | Short-lived object capabilities |
| R2 multipart uploads | https://developers.cloudflare.com/r2/objects/multipart-objects/ | Large/resumable upload architecture |
| Cloudflare Stream pricing | https://developers.cloudflare.com/stream/pricing/ | Stored and delivered video-minute cost model |
| Stream direct upload | https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/ | Direct upload and large-upload protocol |
| Stream signed URLs | https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/ | Private playback authorization |
| Google Drive API | https://developers.google.com/workspace/drive/api/guides/about-sdk | Drive API operations and quota notes |
| Google OAuth | https://developers.google.com/identity/protocols/oauth2/resources/best-practices | Secure credentials, tokens and revocation |
| TMDb FAQ | https://www.themoviedb.org/faq/api | Non-commercial vs commercial API use and attribution |
| FFmpeg | https://ffmpeg.org/documentation.html | Media probe/transcoding toolchain |
| OWASP ASVS | https://owasp.org/www-project-application-security-verification-standard/ | Application security verification baseline |
| OWASP API Security | https://owasp.org/www-project-api-security/ | API threat model |
| WCAG 2.2 | https://www.w3.org/TR/WCAG22/ | Accessibility target |
| Bangladesh Copyright Office | https://copyrightoffice.gov.bd/pages/laws | Official starting point for local legal review |

### 57.1 Verified project facts versus assumptions

**Provided by the user in the conversation:** four separate Google One accounts, each described as a 5 TB plan; a boxd.sh VPS described as 2 vCPU, 8 GB RAM and 100 GB storage; desire for one site and centralized automation.

**Not independently verified:** current billing status, exact Google One plan names/terms, whether the accounts are eligible for a particular backup workflow, the VPS network port/transfer allowance/CPU limits/acceptable-use policy, available root access, IPv4/IPv6, or actual disk performance. Test or obtain these from the provider before production use.

**Engineering recommendation:** launch with one private object-storage provider and one approved content source. Connect Google Drive only as an optional backup after policy review. Keep the first pilot small, rights-cleared and invite-only. Scale only after measured demand and cost per delivered watch minute are known.

---

# FINAL ARCHITECTURE DECISION

For the first serious release, build a **modular monolith with separate background workers**. Use Next.js/TypeScript for the application, PostgreSQL for canonical data and rights state, Redis/BullMQ for asynchronous job delivery, private R2/S3-compatible object storage for approved media, and a managed video platform for delivery if its resolution, price and rights terms fit the product. Keep the existing 2 vCPU/8 GB/100 GB VPS as a low-volume control-plane/pilot host only; do not make it the public media CDN or a 4K transcoding server.

Do not spend the first month building a complex leech bot, account rotator, microservice mesh, Kubernetes cluster or custom streaming stack. First prove this complete lawful vertical slice:

**admin creates title → rights evidence approved → authorized owner uploads file → private quarantine → checksum/probe → media ready → admin publishes → user searches → server authorizes playback/download → delivery succeeds → audit and metrics recorded → backup is verified.**

That vertical slice is the real product foundation. Everything else should be added only when user demand, legal rights, operational evidence and unit economics justify it.

---

# DOCUMENT MAINTENANCE

- This is the expanded V2 master blueprint. Sections 24 onward supersede shorter earlier descriptions where they conflict; Sections 37 onward add production operating details; Section 51 is the canonical coding-agent prompt; Section 52 contains bounded specialist prompts.
- Keep ADRs and actual repository implementation synchronized with this document. A plan is not proof that a feature is implemented.
- Before each release, re-check current provider terms, vendor pricing, stable versions, data-protection requirements and content rights.
- Maintain a changelog with date, change, rationale, owner and affected milestone.

---

# PART VIII — V3 PREMIUM STREAMING, DRM, UX AND CAPACITY EXPANSION

> **Append-only guarantee:** Everything in Sections 1–57 above is retained. This part adds depth; it does not delete or silently replace the original requirements. Where a V2 implementation note is too general, use the more precise V3 design below. The target is a lawful, rights-cleared, streaming-first VOD product with an original premium visual identity—not a pixel-copy of Netflix.

## 58. V3 product north star and quality bar

### 58.1 Product promise

The platform should make three things feel effortless:

1. **Find something worth watching:** discovery feels curated and personal rather than an endless database dump.
2. **Start watching immediately:** the path from title selection to first frame is short, predictable, and resilient on ordinary mobile networks.
3. **Trust the experience:** playback is private, content rights are respected, progress is saved, captions/audio work, and the product explains errors instead of leaving the user with a blank player.

### 58.2 Product principles

- Cinema-first visual hierarchy: artwork and editorial choices lead; controls and metadata support them.
- Fast to value: no forced onboarding, newsletter wall, or account creation before a permitted preview.
- Personal, not invasive: explainable recommendations, profile-level preferences, privacy controls, and a non-personalized browse route.
- Streaming-first: the original source file is never a public asset. A downloadable file is exposed only when a separate rights grant explicitly allows downloads.
- Content truth: never show fake view counts, fake ratings, fake availability, or fabricated quality badges.
- Resilient playback: adaptive bitrate, resume, retry, subtitles, alternate audio, and clear network/error states.
- Accessible by design: keyboard navigation, captions, audio description metadata, reduced motion, screen-reader labels, and sufficient contrast are foundational.
- Original design language: borrow proven patterns from the market, not logos, copy, component artwork, exact layouts, or trademark assets.

### 58.3 Quality bar by release

| Area | MVP bar | Public beta bar | Mature product bar |
|---|---|---|---|
| Discovery | Useful editorial rows, title search, genre/year/language filters | Personal row ordering and stronger ranking | Experiment-driven recommendations and curated collections |
| Player | HLS playback, adaptive bitrate, resume, subtitles, keyboard controls | Multi-DRM where required, alternate audio, robust telemetry | Device-specific playback tuning, TV apps/casting where justified |
| Security | Private origin, authorization, short-lived tokens, TLS | Multi-DRM, concurrency controls, session revocation | Forensic watermarking, advanced fraud controls, contractual security levels |
| Media | Validated upload, source preservation, standard renditions | Automated QC, ABR package, captions/audio tracks | Multi-region origin strategy, codec optimization and dedicated processing |
| Operations | Logs, backups, alerts, restore rehearsal | SLO dashboards, on-call runbooks, cost alerts | Capacity forecasting, chaos/failover tests, formal incident reviews |
| Accessibility | WCAG 2.2 AA-oriented controls and captions | Automated and manual audits | Regular assistive technology and TV/device testing |

---

## 59. Deep UX research and competitive product synthesis

There is no universally “best” movie website: a high-performing service balances catalogue size, editorial taste, recommendation relevance, playback friction, device context, rights constraints, and business model. The design goal is to combine the strongest user-facing patterns while retaining a recognizably original visual language.

### 59.1 Netflix: personalized content hierarchy

Netflix describes personalization as applying at multiple levels: which rows appear, which titles populate a row, and the ordering of titles. It also describes using engagement signals such as watching and feedback to refine recommendations. The practical lesson is that personalization is not merely a “Recommended for you” shelf; it can influence the order and composition of the entire home screen. Do not copy Netflix's layout or branding. Implement an explainable, privacy-conscious version using the platform's own viewing events and explicit profile preferences. Source: [Netflix — How recommendations work](https://help.netflix.com/en/node/100639/).

**Adopt:** Continue Watching, because it directly advances the user's active intent; profile-specific ranking; editorial shelves; recent engagement signals; a clear My List destination.

**Avoid:** endless repeated shelves with near-identical content, opaque ranking that hides all non-personalized discovery, or autoplay that hijacks browsing.

### 59.2 Apple TV: playback continuity and low-friction resume

Apple's video guidance emphasizes a smooth transition and getting the selected content on screen immediately, avoiding unnecessary launch, detail, or intro barriers when a user expects playback or resume. The practical lesson is to prioritize a reliable “Play” and “Resume” path over decorative transitions. Source: [Apple Human Interface Guidelines — Playing video](https://developer.apple.com/design/human-interface-guidelines/playing-video).

**Adopt:** immediate playback state, predictable resume, clear transport controls, consistent system-level behavior, and no unnecessary loading theatrics.

**Avoid:** delaying playback with an animated brand intro, hiding the play action below the fold, or showing a full-page interstitial before resume.

### 59.3 MUBI: editorial curation and discovery depth

MUBI's public-facing product direction is a useful benchmark for film-led curation: collections, director/cast discovery, and strong editorial framing can make a smaller catalogue feel intentional. Use this as a design heuristic, not as a claim that a specific internal MUBI design system or algorithm is known.

**Adopt:** curated collections, director/actor pathways, country/era/genre filters, film essays or editorial notes when licensed and staffed, and distinct art direction per collection.

**Avoid:** a database-only interface that treats every title as a poster tile with no context.

### 59.4 Competitive pattern matrix

| Product pattern | User problem solved | Platform interpretation | Do not copy |
|---|---|---|---|
| Personalized home rows | “What should I watch?” | Rank shelves and titles from profile signals | Exact row labels, Netflix typography, branded red treatments |
| Continue Watching | “Where did I stop?” | Resume card with progress and one-click resume | Unwanted automatic next-play behavior |
| Editorial collections | “Help me explore outside my usual taste” | Curator-created collections with synopsis | MUBI artwork, copy, collection names, or visual assets |
| Direct resume | “I pressed play; let me watch” | Resume playback with minimal transitions | Apple interface assets or proprietary UI patterns |
| Global search | “I know what I want” | Search titles, aliases, people, genres, languages | Search data without proper metadata licensing |
| Profiles and parental controls | “Keep my household preferences separate” | Separate watch history, maturity limits, language, and recommendations | Treating a profile switch as a new account identity |

### 59.5 Research-derived design decisions

1. The homepage is not a static poster wall. Its row order and title order are purposeful.
2. Discovery must support both “I know the title” and “I want to explore” modes.
3. A title detail page must answer: What is it? Why should I watch it? Is it available to me? What language/audio/subtitle options exist? Can I start now?
4. The player is a core product surface, not an embedded afterthought.
5. Recommendation explanations should be concise (“Because you watched…”, “From your saved directors”), and should not reveal sensitive profile assumptions.
6. Search must remain useful without personalization or cookies.
7. Every row should earn its vertical space. Remove shelves with low engagement or repetitive content.

---

## 60. Original visual direction: CINEMATIC GRAPHITE

### 60.1 Design concept

Use a restrained cinematic system: deep graphite surfaces, carefully controlled warm metallic accent, high-contrast typography, large editorial artwork, minimal chrome, and precise motion. The platform should feel like a premium film journal that happens to stream video—not a generic dashboard wearing a dark theme.

**Working visual codename:** `Cinematic Graphite`. This is a design direction, not a final product name or logo.

### 60.2 Brand attributes

- Cinematic, not noisy.
- Editorial, not cluttered.
- Premium, not ostentatious.
- Technically trustworthy, not cryptic.
- Discovery-led, not algorithm-only.
- International-ready, including Bangla and RTL-ready layout primitives.

### 60.3 Visual hierarchy rules

1. Artwork is the primary visual signal.
2. Title and one-sentence context are secondary.
3. Metadata is tertiary and compact.
4. Actions are obvious, consistent, and limited to the most important one or two choices.
5. Badges are rare and meaningful: “New”, “4K”, “Dolby Atmos”, “Subtitles”, or an availability restriction only when verified.
6. Never place low-contrast metadata directly on busy artwork without a tested gradient/scrim.
7. Avoid excessive glassmorphism, glow, neon, gradients on every card, and perpetual motion.

---

## 61. Complete design token foundation

### 61.1 Core color tokens

| Token | Value | Usage |
|---|---|---|
| `--cg-bg` | `#080A0D` | Main canvas |
| `--cg-bg-raised` | `#0D1116` | Elevated page region |
| `--cg-surface-1` | `#12171E` | Card and panel surface |
| `--cg-surface-2` | `#181F28` | Raised card, menu, popover |
| `--cg-surface-3` | `#222B36` | Hover/selected surface |
| `--cg-border` | `#2B3542` | Subtle dividers and borders |
| `--cg-border-strong` | `#425063` | Active/strong borders |
| `--cg-text` | `#F4F6F8` | Primary text |
| `--cg-text-secondary` | `#B2BBC7` | Secondary text |
| `--cg-text-muted` | `#818D9B` | Tertiary text |
| `--cg-accent` | `#D8B36A` | Primary brand/action accent |
| `--cg-accent-hover` | `#E8C77F` | Hover accent |
| `--cg-accent-pressed` | `#B9924D` | Pressed accent |
| `--cg-positive` | `#49C69A` | Success and available state |
| `--cg-warning` | `#F0B85F` | Warning/expiring state |
| `--cg-danger` | `#F16B73` | Destructive/error state |
| `--cg-info` | `#73A9F4` | Informational state |

These colors are starting tokens, not a claim that every foreground/background pairing passes contrast. Validate all combinations using WCAG 2.2 AA. In particular, muted text, focus rings, icon-only controls, disabled states, and text over poster art require contrast testing.

### 61.2 Typography

**Preferred stack:** Manrope for display/headline typography, Inter for UI/body, and Geist Mono for admin identifiers, technical values, timestamps, and file hashes. Self-host font assets only after checking each font's license; use resilient system fallbacks.

| Style | Desktop size / line height | Mobile size / line height | Weight | Use |
|---|---:|---:|---:|---|
| Display | 56 / 62 px | 38 / 44 px | 650–750 | Hero title / campaign title |
| H1 | 44 / 52 px | 34 / 40 px | 650–700 | Page title |
| H2 | 32 / 40 px | 27 / 34 px | 650 | Section title |
| H3 | 24 / 32 px | 21 / 28 px | 600 | Detail headings |
| H4 | 20 / 28 px | 18 / 26 px | 600 | Card/dialog heading |
| Body large | 18 / 28 px | 17 / 26 px | 400 | Synopsis / editorial copy |
| Body | 16 / 24 px | 15 / 23 px | 400 | Standard UI |
| Body small | 14 / 20 px | 13 / 19 px | 400–500 | Metadata |
| Caption | 12 / 16 px | 12 / 16 px | 500 | Labels, timestamps |
| Technical | 12 / 18 px | 12 / 18 px | 450 | IDs, hashes, logs |

Rules: use sentence case; do not use all caps for long labels; keep synopsis line length around 55–80 characters; avoid ultra-thin weights; don't shrink important mobile text to fit a card.

### 61.3 Spacing scale

Use a 4 px base scale. Tokens: `space-0=0`, `space-1=4`, `space-2=8`, `space-3=12`, `space-4=16`, `space-5=20`, `space-6=24`, `space-8=32`, `space-10=40`, `space-12=48`, `space-16=64`, `space-20=80`, `space-24=96`.

Use 24–32 px between content sections on mobile, 40–56 px on desktop. Do not apply identical spacing to every component; establish clear section hierarchy.

### 61.4 Radius, border and elevation

| Token | Value | Usage |
|---|---:|---|
| `radius-xs` | 4 px | Chips, compact metadata |
| `radius-sm` | 8 px | Inputs, buttons |
| `radius-md` | 12 px | Standard cards |
| `radius-lg` | 16 px | Feature cards/dialogs |
| `radius-xl` | 22 px | Hero media panels |
| `radius-pill` | 999 px | Status and filter chips |

Use borders before shadows. Shadows are reserved for menus, dialogs, floating player controls, and raised surfaces. Avoid heavy blur/glow that reduces text clarity or causes GPU overdraw.

### 61.5 Motion system

| Token | Duration | Usage |
|---|---:|---|
| `motion-fast` | 120 ms | Button feedback, icon state |
| `motion-standard` | 180 ms | Card hover, small menus |
| `motion-enter` | 240 ms | Dialogs, popovers |
| `motion-emphasis` | 360 ms | Hero/route transition, only when useful |

Use a restrained easing curve such as `cubic-bezier(0.2, 0.7, 0.2, 1)`. Honor `prefers-reduced-motion`; do not make core controls depend on animation finishing. Avoid autoplaying video with sound. Hero previews, if enabled, must be muted, user-controllable, and respect data-saving preferences.

### 61.6 Layout and responsive tokens

| Breakpoint | Width | Layout behavior |
|---|---:|---|
| `xs` | 360–479 px | 2–2.3 poster cards visible; compact nav/bottom nav |
| `sm` | 480–639 px | 2.5–3 cards, wider dialogs |
| `md` | 640–767 px | Tablet portrait, 3–4 cards |
| `lg` | 768–1023 px | Compact desktop/tablet landscape |
| `xl` | 1024–1279 px | Full navigation and 4–5 cards |
| `2xl` | 1280–1535 px | 12-column editorial grid |
| `3xl` | 1536 px+ | Max-width content container; avoid infinite stretched rows |

Container max width: 1440 px for main discovery surfaces; detail content max width: 1280 px; prose max width: 760 px. Use fluid side padding: 20 px mobile, 32 px tablet, 48–72 px large desktop. A 12-column grid is the primary desktop layout; use 4/6/8 columns on smaller surfaces according to content.

### 61.7 CSS token starter

```css
:root {
  color-scheme: dark;
  --cg-bg: #080A0D;
  --cg-bg-raised: #0D1116;
  --cg-surface-1: #12171E;
  --cg-surface-2: #181F28;
  --cg-surface-3: #222B36;
  --cg-border: #2B3542;
  --cg-border-strong: #425063;
  --cg-text: #F4F6F8;
  --cg-text-secondary: #B2BBC7;
  --cg-text-muted: #818D9B;
  --cg-accent: #D8B36A;
  --cg-accent-hover: #E8C77F;
  --cg-positive: #49C69A;
  --cg-warning: #F0B85F;
  --cg-danger: #F16B73;
  --cg-info: #73A9F4;
  --cg-radius-sm: 8px;
  --cg-radius-md: 12px;
  --cg-radius-lg: 16px;
  --cg-radius-xl: 22px;
  --cg-content-max: 1440px;
  --cg-motion-fast: 120ms;
  --cg-motion-standard: 180ms;
  --cg-motion-enter: 240ms;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 62. Component design system and interaction contracts

Build components as accessible, composable primitives. Use Radix UI or another audited primitive layer for dialogs, menus, tabs, tooltips, and popovers; wrap them in the platform's own design tokens. Do not create a second component framework inside the app.

### 62.1 Core component inventory

| Component | Variants / states | Required behavior |
|---|---|---|
| `Button` | primary, secondary, outline, ghost, destructive; default/hover/focus/pressed/disabled/loading | Visible focus, adequate target, disabled semantics, loading cannot double-submit |
| `IconButton` | neutral, accent, danger | Always has accessible name and tooltip where needed |
| `MoviePosterCard` | default, compact, landscape, featured | Title and actions accessible without hover; focus state; no layout jump |
| `FeaturedHero` | standard, compact, editorial | Art gradient, title, metadata, Play and Details actions; no autoplay sound |
| `ContentRow` | standard, compact, editorial, ranked | Keyboard-scrollable rail; visible arrows; correct scroll boundaries |
| `FilterChip` | idle, selected, removable, disabled | Selection exposed to screen readers; no color-only status |
| `SearchCommand` | closed, open, loading, results, empty, error | Cmd/Ctrl+K, Escape, arrows, Enter, debounced input |
| `MetadataList` | compact, expanded | Semantic list; unknown metadata omitted, not fabricated |
| `RatingBadge` | source-backed, unavailable | Never imply editorial rating is platform rating |
| `AvailabilityLabel` | stream, download, unavailable, region-limited, scheduled | Driven by rights/entitlement service, never hardcoded |
| `ProgressBar` | watch progress, loading, buffering | Separate progress, buffered, and loading states |
| `Dialog / Drawer` | modal, responsive sheet | Focus trap, Escape, initial focus, restore focus |
| `Toast` | success, info, warning, error | Non-blocking; ARIA live region; not the only place for critical errors |
| `Skeleton` | poster, row, hero, detail | Preserve layout dimensions to avoid CLS |
| `ErrorState` | network, entitlement, DRM, media, server | Actionable retry/support path and error correlation ID |
| `SubtitleMenu` | language, style, off | Accessible selection; track availability labels |
| `QualityMenu` | auto, available renditions | “Auto” default; avoid claiming 4K if no 4K rendition/device support |

### 62.2 Movie poster card specification

- Artwork ratio: 2:3 poster by default. Use `object-fit: cover` and a neutral placeholder while loading.
- Metadata below the art: title, year, and one verified signal (e.g., genre, newness, or availability). Avoid four lines of badges.
- Hover: lift by 2–4 px, scale image no more than 1.035, reveal secondary actions without covering the title.
- Focus: show a strong 2–3 px outline, not only a shadow. Focused cards must remain visible inside the row container.
- Mobile: no hover dependency; actions appear on tap or on a detail sheet.
- If content is unavailable in the user's region, do not show a misleading Play button. A detail page may still be browsable if metadata rights permit.
- Keep reserved image dimensions to avoid layout shift.

### 62.3 Content row specification

- Each row has a meaningful title and optional short supporting sentence.
- Use horizontal overflow with scroll-snap, but provide previous/next buttons on desktop and keyboard access.
- Do not autoplay row movement.
- On mobile, show a visible part of the next card as a discoverability cue, but don't clip card actions.
- Lazy-load images near the viewport and prefetch only the likely next row; do not fetch every poster on initial render.
- Hide arrows at scroll boundaries and support RTL direction.
- Use list semantics and accessible labels such as “Continue Watching, 8 titles”.

### 62.4 Navigation system

**Desktop primary nav:** brand mark, Home, Movies, Series (only if series exist), Collections, Search, My List, profile menu. Search remains one action away.

**Mobile nav:** bottom bar with Home, Search, My List, and Profile; keep a compact top brand/search context on detail and player routes. Do not stuff every category into the bottom bar.

**Header behavior:** transparent/gradient over a hero only when contrast has been tested; becomes a solid elevated surface after scrolling. Avoid a sticky header that consumes a large portion of a small mobile viewport.

### 62.5 Search UX contract

- Search titles, localized titles, original titles, aliases, cast/crew names, directors, genres, collections, and supported identifiers.
- Debounce around 180–250 ms; cancel stale requests; use a minimum query policy only where it improves relevance.
- Show a loading state quickly, then ranked results. Keep recent searches local to the current profile only when privacy settings allow.
- Keyboard: `Ctrl/Cmd + K` opens; `Esc` closes; arrow keys navigate; `Enter` selects; focus is restored to the invoking element.
- Empty result state suggests spelling/title/filters and gives the user a way back to browse.
- Search result metadata must not reveal restricted asset identifiers, internal storage keys, or source locations.

### 62.6 Feedback, loading and failure patterns

- Every async user action has immediate feedback; use optimistic UI only where rollback is safe.
- Every form shows field-specific validation, a summary for long forms, and preserves entered data after recoverable failures.
- Skeletons must match final layout; avoid spinner-only pages.
- Errors should state the user impact and next step, not infrastructure details or stack traces.
- For playback failures, distinguish: unsupported browser/DRM, expired session, entitlement denied, network interruption, source processing, and provider outage.

---

## 63. Screen-by-screen UX specification

### 63.1 Home / Discover

**Goal:** help a returning user resume in seconds and a new user discover a compelling title.

Suggested order for a returning profile:

1. Compact top navigation.
2. Continue Watching (only if there is meaningful progress).
3. Personalized hero or “Featured tonight” (not always a full-viewport billboard).
4. Because You Watched / Similar to Saved Titles.
5. New and Recently Added (only when release/availability dates are verified).
6. Curated collections.
7. Genre, language, country, era, and director exploration.
8. Popular in the relevant territory (only with valid, privacy-conscious aggregate data).

For a first-time profile: short optional taste selection (choose 3–5 titles or genres), plus a “Skip” option; show diverse/popular items when skipped. Do not block the catalogue behind onboarding.

Hero rules: title, one-sentence synopsis, verified release/year metadata, content rating, audio/subtitle availability, Play/Resume, and Details. The hero artwork must have crop variants for desktop and mobile. On mobile, use a shorter hero with the main action visible without excessive scrolling.

### 63.2 Browse / catalogue

- Filter groups: genre, release year/range, language, country, runtime, content type, subtitle availability, audio language, and availability.
- Sort: relevance, recently added, release year, title, and popularity only when a defensible metric exists.
- Selected filters become removable chips with a “Clear all” control.
- Preserve filters in the URL query string so the page can be shared and restored.
- On mobile, use a bottom filter sheet with clear Apply and Reset actions.
- Use server-side pagination or cursor pagination; do not load the full catalogue in the browser.

### 63.3 Movie detail

Content layout:

- Backdrop hero with gradient and responsive crop.
- Poster, title, original title if different, year, runtime, genres, country, maturity rating, and verified technical labels.
- Primary Play/Resume action; secondary Trailer and Save actions only if assets/rights are valid.
- Synopsis with expand/collapse.
- Cast and crew, director, related titles, collection membership, available audio and subtitle languages.
- Rights-aware availability explanation (e.g., not available in the selected region) without leaking rights-holder details.
- “More like this” only when there are real related titles.

Do not show user ratings as if they are official. Label rating source and vote count if a source is used and the licence permits display.

### 63.4 Watch page

- Player takes priority; avoid unrelated sidebars on mobile.
- Desktop: 16:9 player in a centered container, optional right-side “Up next” or details panel only when useful.
- Mobile: player spans available width; controls must be large and safe from device navigation gestures.
- Below player: title, next/previous navigation (for series), synopsis, audio/subtitle controls if not inside player, and related content.
- Keep the screen awake where browser APIs and permissions allow; do not assume this works across all browsers.
- Resume from server-saved position; ask whether to resume only when the previous position is meaningful and near neither the beginning nor the end.
- Save progress periodically and on pause/page lifecycle events; do not rely on `beforeunload` alone.

### 63.5 My List and profile

- Saved titles, watched titles, Continue Watching, and playback preferences are profile-scoped.
- Profile settings: display name/avatar, preferred audio and subtitle languages, autoplay preferences, caption appearance, privacy settings, and maturity level.
- Account-level settings: sign-in methods, sessions/devices, password/passkey, MFA, notification settings, data export/delete, and security history.
- A profile is not a legal bypass. Entitlements, territorial rights, and household policies still apply.

### 63.6 Admin and content operations

Separate the consumer experience from the operations console. The admin UI prioritizes clarity, dense data, traceability, and safe destructive actions over cinematic artwork.

Admin sections:

- Overview: ingestion health, processing queue, playback errors, storage use, delivery cost, rights expiries, and takedown queue.
- Catalogue: title records, metadata provenance, art assets, cast/crew, collections, aliases.
- Rights: grants, territories, dates, allowed uses, exclusivity, restrictions, proof documents, approver and audit trail.
- Assets: source file, rendition set, caption/audio tracks, checksum, validation results, provider IDs, lifecycle.
- Ingestion: upload batches, quarantine, scan, probe, transcode, QC, publish/rollback.
- Playback: session lookup by internal correlation ID, entitlement result, DRM outcome, QoE metrics—never display reusable full tokens.
- Storage: usage, replication/backup status, integrity checks, restore test status.
- Users: profiles, sessions, entitlements, reports, appeals, and safety controls.
- Audit: immutable event view with actor, action, resource, time, reason, and correlation ID.

Dangerous actions (delete source, revoke rights, purge asset, disable DRM, export user data) require role checks, confirmation with resource context, audit entry, and preferably a two-person approval where impact is high.

---

## 64. Accessibility and localization requirements

Target WCAG 2.2 AA. The W3C guidance includes contrast, focus visibility, focus-not-obscured, target-size, and accessible authentication requirements. Source: [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/).

Minimum implementation requirements:

- Text contrast: at least 4.5:1 for normal text and 3:1 for large text, with the defined WCAG exceptions.
- Interactive target size: meet WCAG 2.2 minimum target-size requirements or an allowed exception; use 44–48 px where practical for primary touch controls.
- Visible keyboard focus, never removed without a replacement.
- Focus is not hidden behind sticky headers, dialogs, carousels, or player overlays.
- Every icon-only button has an accessible name; images have purpose-appropriate alt text or empty alt for decorative art.
- Dialogs, popovers, filters, carousels, player controls, and menus work without a mouse.
- Captions/subtitles are selectable, synchronized, styled, and tested. Store language, label, format, forced flag, hearing-impaired flag, and provenance.
- Audio-description tracks are represented separately from regular audio languages.
- Player controls announce state changes without excessive screen-reader noise.
- Reduced-motion preferences are respected. Avoid flashing and aggressive animated thumbnails.
- Text can resize up to 200% without content/functionality loss.
- Bangla content uses an appropriate font with tested glyph coverage, line-height, punctuation, and subtitle positioning. Test long Bangla titles and mixed Latin/Bangla metadata.
- Use locale-aware date, number, and runtime formatting. Store canonical timestamps in UTC and display in the user's selected locale/timezone.
- Use logical CSS properties (`margin-inline`, `padding-inline`, `inset-inline`) to keep RTL support viable even if initial release is LTR.

---

# PART IX — PREMIUM VIDEO DELIVERY AND CONTENT PROTECTION

## 65. Streaming security: threat model and non-negotiable truth

### 65.1 A browser URL cannot be made perfectly invisible

A browser must request playback manifests, media segments, keys/licenses, thumbnails, and related resources. A technically capable viewer can inspect requests in browser developer tools, proxy logs on their own device, or network diagnostics. Therefore **“no one can ever see any streaming URL” is not a realizable web-browser requirement**.

The achievable engineering requirement is stronger and more meaningful:

- Never expose the original master MP4/MKV/source object URL to public pages or client code.
- Never store permanent public media URLs in the database or HTML.
- Never expose object storage credentials, DRM content keys, signing keys, provider secrets, or service-account credentials to the browser.
- Keep source objects private and deliver only encrypted adaptive-streaming packages through an authorized playback path.
- Require a fresh server-issued playback authorization and a valid DRM license for protected premium titles.
- Make tokens short-lived, scoped, revocable, and unusable for other titles/actions.
- Do not claim that these controls prevent every recording method. External cameras and some capture paths remain possible; DRM and watermarking mitigate risk but do not make copying mathematically impossible.

### 65.2 Separate the protection layers

| Layer | Control | What it protects | What it does not guarantee |
|---|---|---|---|
| Network | TLS 1.2+ (prefer TLS 1.3 where available) | Transport confidentiality/integrity | Does not protect content after it reaches an authorized endpoint |
| Storage at rest | Provider encryption + envelope/KMS keys | Stored originals, renditions, DB backups | Does not prevent an authorized service from reading the object |
| Object access | Private bucket, IAM least privilege, origin access policy | Prevents anonymous direct access to master files | Does not stop an app bug from issuing bad authorization |
| Playback authorization | Short-lived signed playback session | Who may start/view the title, expiry and scope | A stolen valid token can be replayed until expired/revoked if not further constrained |
| CDN authorization | Signed cookie/token, edge validation, rate controls | Segment access and hotlinking | Referer checks alone are not strong authentication |
| Media encryption | CENC/CBCS or provider-supported encrypted packaging | Segments are not usable as clear media without the required key/license | Not equivalent to DRM by itself if keys are exposed |
| Multi-DRM | Widevine, FairPlay, PlayReady | License-controlled decryption on supported devices | Does not block every screen capture or analog capture method |
| Forensic watermark | User/session-specific visible or invisible watermark | Helps trace leaks and deter redistribution | Does not prevent a leak; requires vendor/tooling and legal review |
| App hardening | CSP, no token logs, no third-party scripts on watch page | Reduces token theft/XSS exposure | Cannot defend against all compromised clients/devices |

### 65.3 Recommended protection profiles

**Profile A — Standard private streaming:** use provider signed playback tokens or CDN-signed cookies, private origins, TLS, and entitlement checks. Appropriate for low-risk content whose licence does not require commercial multi-DRM.

**Profile B — Premium licensed content:** encrypted HLS/DASH package plus multi-DRM with Widevine, Apple FairPlay, and Microsoft PlayReady, short-lived playback and license authorization, concurrency/device controls, and optional forensic watermarking. This is the target profile when distribution contracts require studio-grade content protection.

**Profile C — Authorized downloadable asset:** show a download action only if rights permit that use. Use separate short-lived download authorization, audit events, file integrity checks, and explicit user/device restrictions where legally and technically appropriate. A streaming playback entitlement must not automatically grant a download entitlement.

### 65.4 Do not call these “DRM”

- A hidden `<video>` URL is not DRM.
- Base64 encoding is not encryption.
- Obfuscated JavaScript is not content protection.
- Disabling right-click is not content protection.
- Hiding a download button is not content protection.
- A Referer/Origin allowlist alone is not strong authorization.
- A signed URL is a bearer credential; whoever has it can use it until expiry or revocation.
- AES-128 HLS encryption with a public/static key URL is not equivalent to a managed multi-DRM system.

---

## 66. Recommended streaming architecture and vendor decision

### 66.1 Primary recommendation: managed video service with DRM abstraction

For the first premium streaming release, do not build a DRM license server yourself. Use a managed video platform that explicitly offers the DRM systems your contracts require. The application owns business authorization; the video vendor owns encoding/packaging/delivery mechanics; a DRM provider issues device-compatible licenses.

**Candidate for evaluation: Mux Video with DRM.** Mux documentation describes signed playback JWTs and playback restrictions, and its DRM offering supports Widevine, FairPlay, and PlayReady. Mux currently documents DRM as a paid add-on of USD $100/month plus USD $0.003 per license, subject to current account terms and volume discounts; verify actual pricing/contract before purchase. Sources: [Mux DRM guide](https://www.mux.com/docs/guides/protect-videos-with-drm), [Mux secure playback](https://www.mux.com/docs/guides/secure-video-playback), [Mux pricing](https://www.mux.com/docs/pricing/video).

This does not mean Mux is automatically the cheapest or best vendor for every catalogue. The decision must include encoding, storage, delivery, DRM licenses, analytics, support, geography, contractual security level, data export, and exit strategy.

### 66.2 Alternative: AWS-controlled VOD pipeline

For greater control and a dedicated media engineering budget:

`Private S3 source → MediaConvert ABR job → CMAF/HLS/DASH package → MediaPackage/CloudFront origin and CDN → SPEKE-compatible DRM key provider → Widevine/FairPlay/PlayReady-capable player`

AWS documents MediaConvert ABR output groups for Apple HLS, DASH ISO, and CMAF. AWS Elemental MediaPackage uses the SPEKE interface to work with a DRM provider for encryption keys and playback licenses. Sources: [MediaConvert ABR output groups](https://docs.aws.amazon.com/mediaconvert/latest/ug/choosing-your-streaming-output-groups.html), [MediaPackage encryption](https://docs.aws.amazon.com/mediapackage/latest/ug/endpoints-hls-encryption.html), [SPEKE implementation](https://docs.aws.amazon.com/mediapackage/latest/userguide/implementing-speke-v2.html).

This option has more control but more operational responsibility: AWS account configuration, encoding templates, key provider contract, origin/CDN policy, player compatibility, DRM test matrix, storage lifecycle, cost monitoring, and incident response.

### 66.3 Cloudflare Stream and R2 positioning

Cloudflare Stream documents signed URL/token access for videos that should not be public. Its documented signed-token workflow is useful for private access and time-limited playback. Do **not** assume that signed tokens alone equal Widevine/FairPlay/PlayReady studio DRM; treat the product as a signed-access option unless Cloudflare contractually confirms the exact multi-DRM capability required for the intended content and plan. Source: [Cloudflare Stream — Secure your Stream](https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/).

Cloudflare R2 presigned URLs are temporary bearer URLs for a specific object and operation. They are useful for controlled uploads/downloads, but a presigned URL is not a DRM license and should not be used as the normal public movie playback architecture. Source: [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/).

### 66.4 Vendor capability matrix

| Capability | Managed platform with multi-DRM (e.g., Mux DRM) | Cloudflare Stream signed access | AWS DIY with MediaConvert/MediaPackage + DRM vendor |
|---|---|---|---|
| Encoding/packaging | Managed | Managed | Configurable, operator-owned workflow |
| Signed playback | Yes, provider-specific JWT | Yes, signed tokens | Implement via CDN/API |
| Widevine/FairPlay/PlayReady | Documented by Mux | Do not assume from signed-token docs | Via SPEKE-compatible DRM provider |
| Operational burden | Lower | Lower | Higher |
| Fine-grained infrastructure control | Medium | Medium | High |
| Cost predictability | Per-minute and add-on based | Provider pricing model | Multiple AWS + DRM provider meters |
| Best initial use | Premium VOD where multi-DRM is required | Private/standard VOD where signed access meets rights obligations | High control, larger scale, capable media operations team |

### 66.5 Architecture decision rule

- If content contracts require multi-DRM and the team is small: evaluate Mux DRM first.
- If the catalogue is low-risk/public-domain or creator-owned and signed access satisfies the rights/security obligations: evaluate Cloudflare Stream, but don't label it multi-DRM.
- If control, customization, or large-scale economics justify a media engineering team: evaluate AWS MediaConvert + MediaPackage + a contracted DRM provider.
- Keep the application behind a `VideoProvider` interface so the UI and entitlement service do not depend on one vendor's response shape.

---

## 67. Playback authorization protocol

### 67.1 End-to-end sequence

```mermaid
sequenceDiagram
  participant B as Browser Player
  participant A as Application API
  participant E as Entitlement/Rights Service
  participant P as Playback Provider
  participant D as DRM License Service
  participant C as CDN/Media Origin

  B->>A: POST /api/playback-sessions (assetId, profileId)
  A->>E: Check user, profile, rights, territory, window, plan, device limits
  E-->>A: ALLOW or DENY + policy snapshot
  A->>P: Create/authorize short-lived playback context
  P-->>A: Playback locator + provider-specific claims
  A-->>B: Playback session config (no source master URL or secret)
  B->>C: Request manifest/segments using scoped token/cookie
  C-->>B: Encrypted HLS/DASH package
  B->>D: Request DRM license using separate license token
  D->>E: Validate playback and license claims
  D-->>B: Device-bound/DRM-protected license response
  B->>B: Secure decode and render when supported
  B->>A: Progress/QoE heartbeat
  A->>E: Re-check revocation/entitlement/session policy as applicable
```

### 67.2 Playback-session endpoint

`POST /api/v1/playback-sessions`

Request (illustrative contract):

```json
{
  "assetId": "asset_public_id",
  "profileId": "profile_public_id",
  "deviceId": "installation_scoped_id",
  "startPositionSeconds": 842
}
```

Response should contain only the minimum provider-specific playback configuration required by the client:

```json
{
  "sessionId": "ps_public_id",
  "expiresAt": "2026-11-06T12:05:00Z",
  "playback": {
    "provider": "managed_drm_provider",
    "manifestUrl": "https://provider.example/opaque-playback-id/manifest.m3u8",
    "playbackToken": "SHORT_LIVED_SIGNED_TOKEN",
    "drm": {
      "widevineLicenseUrl": "https://license.example/widevine",
      "fairplayLicenseUrl": "https://license.example/fairplay",
      "fairplayCertificateUrl": "https://license.example/fairplay-certificate",
      "playreadyLicenseUrl": "https://license.example/playready"
    }
  },
  "resumePositionSeconds": 842,
  "policy": {
    "maxResolution": "1080p",
    "allowDownload": false,
    "allowedAudioLanguages": ["en", "bn"],
    "allowedSubtitleLanguages": ["en", "bn"]
  }
}
```

The sample hostnames are placeholders; the coding agent must use the actual chosen provider SDK and never invent provider API fields. In a real implementation, omit DRM systems not configured for the active device/provider. The client must never receive secret signing keys, raw content keys, private origin credentials, master upload URLs, or service account credentials.

### 67.3 Authorization checks

Before issuing a playback context, check:

1. User is authenticated or the title's rights permit anonymous preview.
2. Profile belongs to the authenticated account.
3. Asset is published and passed QC.
4. Active rights grant covers this exact asset and action (`stream`).
5. Current UTC time lies in the rights window.
6. Territory policy allows the viewer's effective region. Use a compliant geolocation source; define behavior for VPN/unknown location and contract-required restrictions.
7. User subscription/transaction entitlement is valid if the business model requires it.
8. Profile maturity settings permit the title.
9. Account/session is not suspended or revoked.
10. Concurrent-device and playback-session limits are respected.
11. DRM/provider availability and the requested device/security level are supported.
12. Asset has a compatible rendition set and at least one valid audio/subtitle track.

Deny by default. A metadata page can be visible even if playback is not allowed, provided the metadata/artwork licence allows display.

### 67.4 Token design

- Use different claims/tokens for application session, media playback, CDN access, and DRM license. Do not reuse the user's login JWT as a media token.
- Playback token claims should minimally scope subject/user reference, profile reference, asset/playback ID, session ID, issued-at, not-before, expiry, entitlement version, rights-policy version, permitted action, allowed restriction set, and token ID (`jti`).
- Keep PII out of tokens. Use opaque identifiers.
- Sign with rotating asymmetric keys where supported; keep private signing material in a secret manager/KMS. Publish/rotate verification keys without downtime.
- Short TTL is a policy choice; start around 2–5 minutes for bootstrap tokens and implement an authenticated renewal path for long playback sessions. Provider-specific token semantics may require a different TTL; verify them before implementation.
- Never store raw reusable tokens in database, logs, analytics, support tickets, or browser localStorage. Prefer in-memory/session-bound handling and secure cookies only where provider flow supports them.
- A token is a bearer credential. Redact query strings and authorization headers from logs, error tools, analytics, and referrer flows.
- Use revocation/versioning where supported. For a revoked entitlement, deny token renewal and license issuance even if an older media token has not yet expired.
- Do not rigidly IP-bind every token by default; mobile network changes and carrier NAT can break legitimate playback. Use geography and risk controls according to rights policy and test real networks.

### 67.5 Secure headers and page isolation

For watch pages:

- Strong Content Security Policy with explicit trusted player, media, image, and license origins.
- `Referrer-Policy: no-referrer` or a stricter policy suitable for the app, so token-bearing URLs do not leak through referrer headers.
- `Permissions-Policy` restricted to required browser features.
- No third-party ad/analytics scripts with unnecessary access to player context.
- No media tokens in page source, canonical URLs, social metadata, or client-side analytics events.
- Redact `Authorization`, cookies, signatures, query parameters, and license request bodies in logs.
- Set secure cookie flags (`Secure`, `HttpOnly`, `SameSite` according to the auth flow) for application sessions.
- Use CSRF protection for cookie-authenticated state-changing endpoints.

---

## 68. Multi-DRM implementation requirements

### 68.1 Target DRM systems

| DRM system | Primary ecosystem | Typical web/browser use |
|---|---|---|
| Google Widevine | Chrome/Android and many Android TV/OTT devices | Commonly used through Encrypted Media Extensions (EME) |
| Apple FairPlay Streaming | Safari, Apple platforms | Commonly delivered with HLS and Apple's FairPlay key flow |
| Microsoft PlayReady | Edge/Windows and supported TV/OTT devices | Commonly used with DASH/CMAF or device-specific packaging |

Google's Widevine overview describes its use in premium media and common-encryption standards. A Widevine licence agreement is required for use of Widevine products/services. Source: [Google Widevine overview](https://developers.google.com/widevine/drm/overview).

### 68.2 Encryption format

Use a commercial DRM provider's documented packaging profiles. A typical multi-DRM design uses Common Encryption (CENC) with CMAF/DASH and a compatible CBCS profile for HLS/FairPlay, but the exact scheme, manifest signaling, key IDs, certificates, and license flow must follow the provider's support matrix and the target device matrix. Do not invent your own key exchange or encryption scheme.

AWS SPEKE documentation includes distinct system identifiers and encryption scheme support for FairPlay, Widevine and PlayReady. Source: [AWS SPEKE v2 implementation](https://docs.aws.amazon.com/mediapackage/latest/userguide/implementing-speke-v2.html).

### 68.3 Key management

- Content encryption keys are generated/managed by the contracted DRM/key provider or approved KMS integration.
- Keys are never embedded in source code, public environment variables, manifests, ordinary application DB rows, source maps, or browser JavaScript.
- Key IDs (`KID`) are identifiers, not secrets; content keys are secrets.
- Support rotation and re-packaging according to vendor and contract requirements.
- Use separate key namespaces/environments for development, staging, and production.
- Key access must be auditable and least-privilege.
- A key-service outage should fail closed for premium protected content; do not silently fall back to clear MP4.
- Define emergency key revocation/reissue and content re-encryption procedure with the DRM vendor before launch.

### 68.4 Player integration

Use a well-maintained player with EME support and a documented DRM integration. Candidate: Shaka Player for HLS/DASH with DRM configuration; on Safari, verify the required native HLS/FairPlay path. Video.js can also integrate DRM through its media source/EME integration, but every browser/device combination must be tested. References: [Shaka Player project and DRM support matrix](https://github.com/shaka-project/shaka-player), [Shaka DRM configuration](https://shaka-player-demo.appspot.com/docs/api/tutorial-drm-config.html), [Video.js DRM source configuration](https://videojs.org/docs/framework/html/guides/media-sources).

Do not hardcode only one key system. Select the correct system based on the browser/device. Maintain a compatibility matrix for Chrome, Edge, Firefox, Safari desktop, Safari iOS, Android Chrome, and target TV platforms if supported.

### 68.5 License policy

- Issue a license only after validating playback session, entitlement, asset, territory, and provider claims.
- Enforce expiry, output restrictions, resolution limits, and device security level as required by content contracts and provider capabilities.
- Persistent/offline licenses are out of scope for MVP unless offline viewing is an explicit licensed product requirement.
- Do not use ClearKey as production protection; it is suitable for development/testing only.
- Test HDCP/output policy behavior on actual supported devices; browser VMs may not represent hardware DRM capabilities.

### 68.6 Security limitation statement

Even a multi-DRM architecture cannot promise zero copying. It raises the cost of extracting a playable media file, binds decryption to supported client/device controls, and can support stronger security requirements. It does not prevent all screen capture, external capture, compromised devices, or human redistribution. Use contractual controls, watermarking, rapid revocation, and incident response in addition to DRM.

---

## 69. VOD media engineering and quality pipeline

### 69.1 Canonical media lifecycle

```text
OWNER / LICENSED DELIVERY
        ↓
DIRECT PRIVATE UPLOAD / PROVIDER INGEST
        ↓
QUARANTINE OBJECT + IMMUTABLE SOURCE CHECKSUM
        ↓
FILE VALIDATION + MALWARE SCAN + ffprobe
        ↓
RIGHTS / ASSET / METADATA ASSOCIATION
        ↓
TRANSCODE / ABR RENDITIONS / AUDIO / CAPTIONS
        ↓
PACKAGE HLS / DASH / CMAF
        ↓
ENCRYPT + DRM SIGNALLING (when required)
        ↓
AUTOMATED QC + HUMAN REVIEW
        ↓
PRIVATE PUBLISH / CANARY PLAYBACK
        ↓
RIGHTS GATE → PUBLIC AVAILABILITY
        ↓
CDN DELIVERY + PLAYBACK TELEMETRY
```

### 69.2 Source preservation

- Keep an immutable original source in a private archive bucket when the rights grant and retention policy permit it.
- Store source SHA-256, byte size, container, codecs, duration, dimensions, frame rate, audio tracks, language metadata, and ingest provenance.
- Never overwrite the source with a transcode.
- Create a new asset version for each reprocess. Keep old renditions available for rollback until the new set passes QC.
- Delete/quarantine according to legal retention, rights expiry, and data minimization rules.

### 69.3 Adaptive bitrate ladder

A reasonable initial 16:9 SDR ladder for testing (not a universal fixed bitrate prescription):

| Rendition | Resolution | Starting video bitrate range | Notes |
|---|---:|---:|---|
| 240p | 426×240 | 250–400 kbps | Very constrained connections |
| 360p | 640×360 | 500–800 kbps | Low bandwidth/mobile |
| 480p | 854×480 | 900–1,400 kbps | SD |
| 720p | 1280×720 | 2,000–3,500 kbps | HD |
| 1080p | 1920×1080 | 4,000–7,000 kbps | Full HD |
| 1440p | 2560×1440 | 8,000–12,000 kbps | Optional higher tier |
| 2160p | 3840×2160 | 15,000–25,000+ kbps | 4K, only after rights/device/cost validation |

The ladder should be content-aware and tested against motion/detail, codec, frame rate, and device support. These are starting test ranges, not guaranteed quality targets. Use aligned GOP/keyframe boundaries and consistent segment durations across renditions. Do not transcode every title to 4K simply because the source is 4K; compare quality, bitrate, storage, decode performance, and cost.

### 69.4 Codec strategy

- Baseline compatibility: H.264/AVC video plus AAC audio for broad browser/device support.
- Newer codecs: HEVC/H.265 or AV1 as optional device/provider-supported efficiencies; evaluate licensing, hardware decode, browser support, and DRM package compatibility before activation.
- Keep codec-specific ladders separately selectable; do not assume every browser can decode AV1/HEVC.
- Audio: AAC stereo baseline; use additional codecs/channels only where licensing, device support, and provider/package flow justify them.
- Captions: WebVTT as a practical web baseline; support TTML/IMSC or provider formats where contracts/devices need them. Preserve caption language, forced/SDH flags, timing, and source provenance.

AWS MediaConvert documents output support for HLS, DASH, and CMAF with codec combinations including AVC, HEVC, AV1 and VP9 depending on container. Source: [AWS MediaConvert supported formats](https://docs.aws.amazon.com/mediaconvert/latest/ug/reference-codecs-containers.html).

### 69.5 Segment and manifest policy

- Use HLS for broad Apple support and DASH where supported; CMAF can reduce duplicate media storage when the packaging/player matrix supports the selected encryption scheme.
- Choose segment duration based on startup, rebuffer, seeking, CDN request overhead, and packaging provider constraints. Start with a tested 4–6 second VOD segment target; validate on mobile networks.
- Keep keyframe intervals aligned across ABR renditions so players can switch smoothly.
- Use separate audio rendition groups for language/channel options.
- Include subtitles/captions in manifests or their provider-supported companion tracks.
- Avoid putting source file names, internal folder paths, license contract IDs, or private metadata into public manifests.
- Configure CDN cache policy carefully: immutable encrypted segments may have long cache lifetimes; manifests/tokens have much shorter or no shared cache unless token handling is edge-safe.

### 69.6 Automated quality checks

Required checks after processing:

- Container and codec parse successfully.
- Duration delta vs source is within an approved tolerance.
- Frame size/frame rate are expected; no black/empty output where prohibited.
- Audio tracks exist and languages/channel layout are correct.
- Caption files parse, contain cues, and match duration.
- ABR package has expected manifests and all segment references resolve.
- Encryption and DRM signaling are correct where required.
- Sample playback succeeds on a browser/device matrix.
- No clear source MP4 is exposed through public/CDN paths.
- Thumbnail/poster images are generated and sanitized.
- Checksum and asset-version state are recorded.

### 69.7 Progress saving and playback events

Track events such as `playback_session_created`, `manifest_requested`, `license_issued`, `play`, `first_frame`, `playing`, `pause`, `seek`, `buffer_start`, `buffer_end`, `quality_change`, `audio_track_change`, `subtitle_change`, `heartbeat`, `ended`, `fatal_error`, and `session_revoked`.

Persist watch progress every 15–30 seconds during active playback plus on pause, seek, ended, and page lifecycle signals. Use a monotonic last-updated timestamp/version to prevent older concurrent devices overwriting newer progress. Store seconds watched and position separately from raw event telemetry. Apply retention and privacy rules to event detail.

---

## 70. Streaming Quality of Experience (QoE) and performance SLOs

### 70.1 User-visible measurements

| Metric | Definition | Initial target for a controlled pilot |
|---|---|---|
| Playback start time | User pressing Play to first decoded frame | p75 ≤ 2.5 s on the defined test network; p95 ≤ 5 s |
| Rebuffer ratio | Rebuffering time / total playing time | < 1% pilot target; investigate by geography/device |
| Fatal playback error | Playback sessions ending in unrecoverable playback error | < 0.5% of sessions as an initial target |
| Playback API availability | Successful authorized playback-session creation | 99.9% monthly target after baseline and provider agreement |
| Resume correctness | Saved position within accepted tolerance | ≥ 99% of test cases |
| Caption correctness | Selected caption track loads and renders correctly | ≥ 99% on supported test matrix |
| ABR stability | No repeated oscillation under stable bandwidth | Validate with controlled network tests |

These are product targets to measure, not vendor guarantees. Define network, region, browser/device, asset profile, and measurement methodology before using numbers as contractual SLOs.

### 70.2 QoE dimensions

- Startup: time to first frame, manifest time, license time, initial rendition.
- Continuity: rebuffer count, total buffer time, fatal error rate.
- Quality: rendition distribution, resolution, bitrate, dropped frames where available.
- Control usability: seek latency, subtitle switch latency, audio switch latency, pause/resume responsiveness.
- Security: token rejects, failed licenses, concurrency denials, suspicious session patterns.
- Business: starts, completion rate, abandonment point, watch time, content availability conversion.

### 70.3 Monitoring and alerts

- Alert on sudden rise in license failures, playback-start latency, 4xx/5xx origin/CDN responses, and rebuffering.
- Segment by country/ISP/provider/browser/device/asset version without collecting unnecessary personal data.
- Use a provider's video analytics where it offers reliable client QoE instrumentation; otherwise instrument the player and backend with a documented event schema.
- Keep media quality dashboards separate from application API uptime; a healthy homepage does not imply a healthy player.

---

## 71. Capacity plan for up to 8 vCPU / 32 GB RAM

The user can scale the current VPS to 8 vCPU and 32 GB RAM if the workload justifies it. Treat that as a comfortable initial application/automation host, not as an unlimited video origin or a guarantee that 4K transcoding is economical.

### 71.1 Recommended initial VPS profile

| Resource | Recommended starting capacity | Guidance |
|---|---:|---|
| CPU | 8 vCPU | Web/API, queue workers, metadata processing, light media validation |
| RAM | 32 GB | Enough headroom for application processes and controlled worker concurrency |
| OS | Ubuntu 24.04 LTS | Use security updates and a supported kernel |
| Storage | 100 GB SSD minimum; 160–250 GB preferred | OS, Docker images, logs, temporary processing; not a media library |
| Network | Verify sustained throughput, fair-use cap, monthly transfer, port speed, and abuse policy | A “1 Gbps port” is not a promise of 1 Gbps sustained delivery |
| Public ingress | Reverse proxy/WAF in front of app | Do not expose Node.js directly |
| Runtime | Docker Compose for first deployment | Add orchestration only when the team needs it |

### 71.2 Suggested resource allocation (starting hypothesis)

| Workload | CPU allocation | RAM budget | Notes |
|---|---:|---:|---|
| Reverse proxy / TLS / edge connector | 0.25–0.5 vCPU | 256–512 MB | Caddy or Nginx; Cloudflare in front where appropriate |
| Next.js app / API | 2–3 vCPU | 3–5 GB | Keep multiple Node processes bounded |
| Queue orchestration / scheduler | 0.25–0.5 vCPU | 512 MB–1 GB | Redis preferably managed or isolated |
| Metadata / ingestion workers | 1–2 vCPU | 2–4 GB | Provider/API calls, file metadata, small tasks |
| Media probe / checksum workers | 1–2 vCPU | 2–4 GB | Concurrency limited by disk and CPU |
| Optional light FFmpeg worker | 1–2 vCPU | 4–8 GB | Benchmark; do not run large 4K encodes here by default |
| OS / file cache / observability / safety reserve | Remaining capacity | 6–10 GB | Maintain headroom and alerts |

These allocations are not additive hard reservations; they are a planning starting point. Use cgroups/container limits and measure real RSS/CPU before raising concurrency. Keep at least 20–25% headroom during normal operation.

### 71.3 Production separation

**MVP/pilot:** one 8 vCPU / 32 GB VPS may host the web app, API, queue workers, and small file-validation jobs. Prefer managed PostgreSQL and managed Redis. Store media in managed object/video storage.

**Public production:** split app/API and CPU-heavy processing into separate hosts or cloud jobs. Use managed PostgreSQL with backups/PITR, managed Redis/queue where practical, object storage, and managed video delivery/DRM. Keep the VPS stateless except for temporary jobs/cache.

**Scale phase:** autoscale workers based on queue depth, estimated encode minutes, and provider job limits. Use a dedicated high-CPU or GPU pool only after benchmarks show a cost/performance advantage. Streaming delivery scales through the video provider/CDN, not by increasing the Next.js VPS size.

### 71.4 What should not run permanently on the VPS

- Original movie archive as the only copy.
- Public video segments or HLS/DASH origin for growing traffic.
- Database backups as the only disaster recovery copy.
- Long-running high-resolution transcodes competing with the web app.
- Publicly accessible download folders.
- Rclone credentials or Google OAuth tokens in a world-readable path.

### 71.5 Storage sizing formulas

Approximate source size in decimal GB:

`GB ≈ bitrate_Mbps × duration_seconds ÷ 8 ÷ 1000`

Example: a 120-minute title at an average 5 Mbps is approximately 4.5 GB before container/overhead. At 20 Mbps it is approximately 18 GB. Actual size depends on encoding and source content. A 100 GB VPS cannot be treated as a durable movie library; temporary workspace size must be tied to maximum concurrent ingest/processing jobs and cleanup guarantees.

### 71.6 Bandwidth/concurrency model

Approximate egress requirement:

`aggregate_Mbps ≈ concurrent_viewers × average_selected_bitrate_Mbps`

Example: 100 simultaneous viewers averaging 5 Mbps imply roughly 500 Mbps of delivered video payload, before protocol overhead and operational headroom. This traffic belongs at a video CDN/provider, not through the application server. The application VPS should only handle API, metadata, auth, events, and job coordination.

### 71.7 Concurrency policy

- Web/API concurrency is limited by provider and runtime metrics, not CPU count alone.
- Media probe jobs: start 1–2 concurrent jobs on the VPS and benchmark.
- Local FFmpeg: start one low-resolution test encode only; increase after measuring CPU, memory, temporary storage, and wall-clock factor.
- Production 1080p/4K encoding: prefer managed encoding or separate workers.
- Queue workers must enforce per-provider rate limits and per-job resource limits.

---

## 72. Data model additions for premium playback

Extend the existing schema rather than replacing it. Names below are conceptual; align naming and types with the selected ORM and existing schema.

### 72.1 `playback_sessions`

Fields: `id`, `public_id`, `user_id`, `profile_id`, `asset_version_id`, `provider`, `provider_playback_ref`, `status`, `started_at`, `last_heartbeat_at`, `expires_at`, `revoked_at`, `territory_code`, `device_installation_id`, `entitlement_snapshot_id`, `rights_grant_id`, `max_resolution`, `allow_download`, `correlation_id`, `created_at`.

Constraints: unique public ID; index on user/profile/status/expiry; foreign keys to user/profile/asset version; no raw playback JWT/license token columns.

### 72.2 `playback_entitlements`

Fields: `id`, `user_id`, `profile_id`, `asset_id`, `action`, `decision`, `reason_code`, `rights_grant_id`, `territory_code`, `policy_version`, `valid_from`, `valid_until`, `evaluated_at`, `correlation_id`.

Store decision context for audit/debug; avoid storing raw IP unless a reviewed retention policy requires it. Hash or reduce device signals where possible.

### 72.3 `drm_configurations`

Fields: `id`, `provider`, `environment`, `system`, `license_endpoint_ref`, `certificate_ref`, `key_rotation_policy_ref`, `security_policy`, `active`, `created_at`, `rotated_at`.

Store only secret-manager references and non-secret configuration metadata. Never store content keys or private signing keys in this table.

### 72.4 `media_renditions`

Fields: `id`, `asset_version_id`, `provider_asset_ref`, `package_type`, `codec`, `resolution_width`, `resolution_height`, `bitrate_kbps`, `frame_rate`, `audio_language`, `subtitle_language`, `encryption_scheme`, `drm_systems`, `manifest_ref`, `status`, `qc_report_ref`, `created_at`.

`manifest_ref` must be a private provider/storage reference, not a permanent public playback URL.

### 72.5 `playback_events`

Fields: `id`, `playback_session_id`, `event_type`, `position_ms`, `selected_height`, `bitrate_kbps`, `startup_ms`, `buffer_ms`, `error_code`, `provider_event_ref`, `occurred_at`, `received_at`, `coarse_region`, `device_family`.

Partition/expire high-volume telemetry. Do not store license request bodies, auth headers, token query parameters, or unnecessary personal device fingerprints.

---

## 73. API contract additions

Use versioned routes and one documented schema source (OpenAPI or typed contracts). Validate all input and output schemas. IDs are opaque public IDs; never accept bucket keys from the client as authorization.

| Method | Route | Responsibility |
|---|---|---|
| `POST` | `/api/v1/playback-sessions` | Check entitlement and create an authorized playback session |
| `POST` | `/api/v1/playback-sessions/:id/renew` | Renew a still-valid session and provider token |
| `DELETE` | `/api/v1/playback-sessions/:id` | Revoke current session |
| `POST` | `/api/v1/playback-sessions/:id/heartbeat` | Persist progress and health event |
| `POST` | `/api/v1/playback-sessions/:id/events` | Ingest allowlisted client QoE events |
| `GET` | `/api/v1/profiles/:id/continue-watching` | Return profile-scoped resumable items |
| `GET` | `/api/v1/search/suggestions` | Return safe metadata search suggestions |
| `GET` | `/api/v1/catalogue` | Filter/sort catalogue with cursor pagination |
| `GET` | `/api/v1/titles/:id/availability` | Return rights-aware current availability |
| `POST` | `/api/v1/admin/assets/:id/publish` | Publish after rights/QC gate and admin authorization |
| `POST` | `/api/v1/admin/assets/:id/revoke` | Revoke availability, invalidate future sessions/tokens |

### 73.1 Required API safeguards

- Per-user and per-IP rate limits with adaptive thresholds.
- Request body size limits and strict JSON schema validation.
- Idempotency key for ingestion/publish/payment-like requests.
- Explicit authorization on every resource access; never trust IDs from the browser.
- Consistent error envelope with safe code, user message, and correlation ID.
- No internal storage paths, vendor account IDs, or license secrets in public responses.
- Cache public metadata independently from private availability and user-specific entitlements.
- Avoid caching playback-session responses in shared caches (`Cache-Control: no-store` or equivalent).

---

## 74. Security test plan for media and playback

Required negative tests before public beta:

1. Anonymous user cannot play a restricted asset.
2. Authenticated user without entitlement cannot obtain a playback session.
3. User cannot use another profile's session.
4. User cannot swap `assetId` after receiving a token.
5. Expired playback token is rejected by provider/CDN/license endpoint.
6. Revoked rights block new sessions and license renewal.
7. A token for one title cannot authorize a different title.
8. Direct origin and source object URL return denied/not found from public networks.
9. Original MP4/MKV path is never present in HTML, API payload, source map, analytics, or logs.
10. DRM license endpoint rejects a missing, malformed, expired, or mismatched token.
11. ClearKey/development keys are impossible to activate in production.
12. CORS is not treated as authorization; untrusted origin cannot obtain a valid server-signed token.
13. CSRF, XSS, IDOR, session fixation, and token exfiltration scenarios are tested.
14. Query-string signatures and auth headers are redacted from logs and error tracking.
15. A provider outage does not fall back to an unencrypted public rendition.
16. Account/device concurrency limits behave consistently across tabs/devices.
17. Geographic rights denial is enforced server-side; UI labels cannot override it.
18. User account/session revocation stops new playback authorization.
19. Captions/audio tracks do not accidentally reveal restricted asset URLs or internal storage paths.
20. A signed R2 object URL is treated as a temporary bearer secret and expires as expected.

### 74.1 Red-team review

Before licensing premium content, hire or commission an independent application/security review covering the player integration, token issuance, origin policy, DRM configuration, secret storage, API authorization, and logging. Do not describe an internal checklist as an external penetration test.

---

## 75. Storage and backup architecture clarification

### 75.1 Primary and secondary storage roles

- **Primary streaming system:** managed video provider/DRM/CDN or a controlled object-storage + packaging + CDN system.
- **Source archive:** private object storage with lifecycle/immutability according to contract.
- **Database:** managed PostgreSQL with automated backups and point-in-time recovery.
- **Secondary backup:** a separate provider/account/location where permitted, with restore verification.
- **Google Drive accounts:** optional human-accessible backup/archive copies for content the operator is authorized to retain; not the streaming origin, not a public distribution layer, and not a single logical 20 TB pool unless the provider explicitly offers such pooling.

### 75.2 Four Google accounts

The four 5 TB Google One accounts are four independent accounts and quotas, not one bucket. Before integration, verify the current Google One plan/Drive account features, Google Drive API limits, terms, and ownership/retention rights. Do not design around quota evasion, automated account rotation, or service-account tricks. Do not assume a Google One storage entitlement is transferable to service accounts or shared drives.

If backup is needed, design one explicit destination per account with:

- OAuth refresh tokens encrypted in a secret manager or encrypted config store.
- Minimal scopes and one connection record per account.
- A user-approved account ownership/permission check.
- A backup queue with one item state machine and integrity verification.
- Provider error handling and alerting, not unlimited retry loops.
- A retention policy and deletion workflow.
- No public sharing links by default.
- Restore drill to a separate temporary location.

Do not use Google Drive as the hot playback origin. It is not a video CDN or multi-DRM packaging service.

---

## 76. Search and recommendation engineering refinement

### 76.1 Search progression

Phase 1: PostgreSQL full-text search + trigram similarity + normalized aliases. Add language-aware title fields and weighted ranking. Use a provider metadata ID only as a match hint, never as proof of content rights.

Phase 2: Meilisearch or OpenSearch only when search latency, typo tolerance, faceting, language analysis, or catalogue scale justifies operational complexity. Keep PostgreSQL canonical; search index is a derived projection.

Search ranking should combine:

- Exact original/localized title match.
- Alias and alternate title match.
- People/cast/director match.
- Prefix/typo similarity.
- Popularity only when grounded in an internal or licensed metric.
- Availability in current territory.
- Freshness only for clearly time-sensitive rows.

### 76.2 Recommendation progression

MVP: curated rows + deterministic content similarity (genre, language, country, people, era) + popularity/freshness signals with honest labels.

Beta: profile interaction events (impression, click, trailer start, play start, watch completion, save, dismiss) and lightweight ranking. Avoid training on raw sensitive fields.

Scale: candidate generation + ranking service, offline evaluation, online A/B tests, diversity constraints, freshness, repetition controls, and user “Why this title?” feedback.

Guardrails:

- Do not infer protected/sensitive traits.
- Do not use a child's profile events for adult targeting.
- Allow clearing/resetting watch history where the product policy supports it.
- Avoid feedback loops that show only one genre.
- Keep an accessible general browse mode.
- Recommendations must never override rights/territory availability.

---

## 77. Business, cost and service selection model

### 77.1 Avoid single-line infrastructure cost estimates

A video streaming service's cost is not primarily determined by VPS RAM. Model these separate meters:

1. Video ingest/encoding minutes and output resolution/quality tier.
2. Stored source and rendition minutes/GB.
3. Delivered minutes or GB, depending on provider/CDN.
4. DRM license count and access fee, if applicable.
5. Object storage requests and retrieval/egress where applicable.
6. Database, Redis, logs, monitoring, backups, and support tiers.
7. Payment processing and taxes if subscriptions are introduced.
8. Rights/licensing, metadata/artwork licensing, legal review, and customer support.

Mux currently publishes separate input, storage, delivery and DRM meters; its documentation states an included monthly delivery allowance and a separate DRM add-on. Re-check rates at procurement because prices, tiers, and contracts may change. Sources: [Mux pricing guide](https://www.mux.com/docs/pricing/video), [Mux pricing page](https://www.mux.com/pricing).

### 77.2 Cost calculator inputs

The project cost model should expose:

- Number of titles ingested/month.
- Average title runtime.
- Average source bitrate/file size.
- Rendition ladder and encoded minutes.
- Average monthly stored minutes or GB.
- Monthly active viewers.
- Average watch minutes per viewer.
- Resolution/bitrate distribution.
- DRM license count.
- Backup retention and replicas.
- CDN/provider region and contract tier.

Never invent a “per movie” fixed cost without these inputs.

### 77.3 Vendor procurement checklist

Before choosing a video provider, ask for written answers to:

- Which DRM systems and browser/device combinations are supported on our plan?
- Is Widevine/FairPlay/PlayReady production licensed and contractually covered?
- Are security levels configurable for studio contracts?
- Which encryption schemes/packaging profiles are supported?
- Can tokens be bound to asset, expiry, geography, referrer, user agent, or other claims?
- Can playback be revoked mid-session? What is the propagation delay?
- Can the source and renditions be exported if we leave?
- What is the SLA and regional coverage?
- What are input, storage, delivery, DRM, analytics, and support charges?
- How are failed transcodes and retries billed?
- Are forensic watermarking and concurrency controls supported or separately priced?
- What data is used for analytics, how long is it retained, and can it be deleted/exported?

---

## 78. Visual design and implementation acceptance scorecard

Rate each area 0–5. Do not launch publicly if any critical area scores below 4 or any accessibility/security blocker remains open.

| Review dimension | 0–1 | 2–3 | 4–5 (launch quality) |
|---|---|---|---|
| Brand coherence | Generic template | Some consistent tokens | Distinctive cinematic/editorial system used consistently |
| Visual hierarchy | Competing elements | Understandable but uneven | Primary actions/artwork/title hierarchy clear at every breakpoint |
| Poster/artwork quality | Crops broken/low-res | Mostly acceptable | Correct aspect/crop, responsive assets, no layout shift |
| Discovery UX | Poster dump | Basic rows/search | Search + editorial + personal discovery, no dead rows |
| Detail UX | Missing decision information | Basic metadata | Clear synopsis, cast/crew, availability, languages and play action |
| Player UX | Unreliable controls | Basic playback | Resume, ABR, captions/audio, keyboard, quality states and actionable errors |
| Responsive behavior | Overflow/overlap | Works at common sizes | Tested 360 px to large desktop and touch/keyboard |
| Accessibility | Keyboard blockers | Partial coverage | WCAG 2.2 AA test evidence and manual screen-reader review |
| Performance | Large layout shifts | Acceptable lab result | Field metrics, optimized images, controlled JS, fast first frame |
| Security | Public source links | Signed access only | Threat-modeled, DRM as required, private origin, redacted tokens, tests |
| Content rights | Unverified titles | Manual checks | Rights ledger + publication gate + expiry/takedown workflow |
| Operations | Manual SSH fixes | Basic logs | Automated deployment, backup restore test, alerts and runbooks |

### 78.1 Design QA viewport matrix

At minimum test widths: 360, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS px. Test Chrome desktop, Firefox, Edge, Safari macOS, Safari iOS, Android Chrome, and the actual DRM-compatible device matrix. Browser coverage does not guarantee DRM coverage; test licensed CDM/device conditions.

### 78.2 Real-device playback matrix

At minimum:

- Chrome on Windows/Android (Widevine where available).
- Edge on Windows (PlayReady/Widevine path per environment).
- Safari on macOS/iOS (FairPlay path).
- Firefox desktop (Widevine if enabled by user/device).
- Android device with hardware decode.
- One low/mid-range Android phone on a throttled 4G network.
- One older supported device to validate fallback and error messaging.

Record OS, browser version, DRM system, security level where available, resolution, startup time, rebuffer ratio, license time, and result. Do not claim support for devices that were not tested.

---

## 79. V3 implementation order and launch gates

This extends the original 12-week calendar; it does not invalidate the earlier plan.

### V3-A — Product and design foundation

Deliverables:
- Approved brand direction and token sheet.
- Figma-ready page map and component inventory.
- Responsive wireframes for Home, Browse, Detail, Watch, Search, Profile, Admin.
- Accessibility annotations and content model.
- Rights/availability terminology.

Gate: product owner signs off the UX flow and design system before production UI work.

### V3-B — Catalogue and discovery

Deliverables:
- Licensed metadata importer.
- PostgreSQL search/filter endpoints.
- Poster/backdrop asset pipeline with rights/provenance.
- Home rows and title detail screens.

Gate: all visible title data has provenance and permitted display rights.

### V3-C — Playback provider spike

Deliverables:
- Provider comparison and written quote.
- One rights-cleared sample asset uploaded.
- Signed access test.
- DRM capability test if premium licensing requires it.
- Safari/FairPlay and Chrome/Widevine proof of concept.
- Playback-session API, event schema, and token redaction.

Gate: confirm device matrix, price model, and contract/security requirements. Do not build the full ingestion pipeline around a provider until the test passes.

### V3-D — Production media pipeline

Deliverables:
- Quarantine upload, hash/probe, encoding job, ABR package, captions/audio tracks, QC.
- Private source storage and rendition provider references.
- Rights gate and rollback.
- Worker concurrency and retry policy.

Gate: a sample title passes automated checks and human playback review.

### V3-E — Hardening and controlled beta

Deliverables:
- Security review and negative-test evidence.
- QoE dashboards and alerts.
- Restore drill and rollback procedure.
- Consent/privacy notices and support/takedown process.
- Load test on catalogue/API and video-provider path.

Gate: all P0 issues closed; no direct source asset is public; rights and playback rules are enforced; operating costs are understood.

---

## 80. Mandatory V3 AI-agent master prompt extension

**Use this extension together with the complete Section 51 master prompt. It adds requirements; it does not replace or delete Section 51.**

```text
You are the lead product architect, staff full-stack engineer, video platform engineer,
security engineer, and senior product designer implementing this repository.

SOURCE OF TRUTH
- Read the entire docs/MASTER_BLUEPRINT.md, including original Sections 1–57 and the V3
  additions from Sections 58–80. Do not omit, summarize away, or silently rewrite requirements.
- Preserve every prior decision unless a newer V3 section explicitly refines it.
- Do not make undocumented product, licensing, pricing, security, or vendor assumptions.
- If a requirement is uncertain, produce a decision record and ask for human approval only
  when the decision is genuinely blocking. Otherwise use a reversible, documented default.

DESIGN QUALITY
- Implement the original Cinematic Graphite visual direction and its tokens.
- Build a cohesive design system: typography, spacing, radii, color, elevations, motion,
  buttons, cards, rows, search, dialogs, states, player controls, and admin primitives.
- Create responsive Home, Browse, Search, Movie Detail, Watch, My List, Profile, and Admin
  interfaces. Do not copy Netflix, Apple TV, MUBI, or any competitor's exact layout, logo,
  branding, copy, artwork, or assets.
- Artwork is the visual hero; metadata and controls are restrained and legible.
- No generic AI-slop gradients, excessive glassmorphism, random neon, meaningless badges,
  fake ratings, fake counts, or unverified quality claims.
- Make keyboard, touch, screen-reader, reduced-motion, and WCAG 2.2 AA requirements part
  of acceptance criteria.
- Use real licensed/test fixture assets with explicit rights; never invent content records.

STREAMING AND SECURITY
- Treat the original master file as private and never expose it through public HTML, source
  code, API output, browser storage, analytics, logs, or error reports.
- Do not promise that every manifest/segment request URL is invisible to browser DevTools.
  The requirement is that the original source is never public and protected playback requires
  scoped authorization plus encrypted media and a DRM license when the content contract requires it.
- Separate application authentication, entitlement authorization, playback token, CDN token,
  and DRM license token. Do not reuse login tokens for media delivery.
- Build an entitlement check before playback-session creation. Check asset status, active
  rights grant, territory, date window, allowed action, user/profile, maturity policy, device
  limits, and subscription/transaction entitlement where applicable.
- Use a VideoProvider adapter. Evaluate Mux DRM as a managed multi-DRM candidate and AWS
  MediaConvert/MediaPackage + SPEKE DRM provider as a control-oriented alternative. Cloudflare
  Stream signed URLs must not be mislabeled as multi-DRM. Choose a provider only after a
  documented proof of concept, supported-device test, and cost review.
- Use Widevine/FairPlay/PlayReady only through a correctly licensed provider and supported
  packaging/player flow. Never build a home-made DRM or expose content keys.
- No fallback from a DRM failure to a public clear MP4. Fail closed for protected titles.
- Use encrypted HLS/DASH/CMAF packaging only according to provider-supported profiles.
- Keep tokens out of logs and analytics. Add CSP, strict referrer policy, origin protections,
  secure cookies, CSRF protection, rate limits, and secret-manager-backed keys.
- Distinguish signed URLs from DRM; signed URLs are bearer credentials and are not sufficient
  by themselves for premium studio content unless the rights/security agreement says so.
- Add a documented warning that no web DRM system prevents every external/analog capture.

MEDIA ENGINEERING
- Implement a lifecycle: authorized upload -> quarantine -> checksum/probe -> rights
  association -> transcode/ABR -> package -> encrypt/DRM -> automated QC -> human review
  -> rights-gated publish -> delivery telemetry.
- Keep source files immutable and private. Version renditions; support rollback.
- Do not route large media payloads through the Next.js API server.
- Use background jobs with idempotency, bounded retries, concurrency, timeout, cancellation,
  dead-letter handling, and cleanup.
- Implement progress heartbeats and conflict-safe resume position updates.
- Add player QoE telemetry: time to first frame, rebuffering, fatal errors, rendition changes,
  license outcomes, and subtitle/audio switching.

INFRASTRUCTURE
- Plan the initial host for up to 8 vCPU / 32 GB RAM, but keep the web/API host separate
  conceptually from the streaming delivery plane. Use the VPS for application, API, orchestration,
  and light validation; use managed video/CDN for delivery and managed encoding or dedicated
  workers for expensive transcodes.
- Never assume 8 vCPU / 32 GB means unlimited 4K transcoding or unlimited bandwidth.
- Prefer managed PostgreSQL and controlled Redis/queue in production; if self-hosted for
  development, document backup, restore, persistence, and monitoring.
- Keep 100 GB disk as app/temp workspace, not as the permanent source-media library.
- Use private object storage, retention policies, backup integrity checks, and restore drills.
- Google One accounts are independent destinations, not a pooled 20 TB streaming origin.
  Do not implement quota-evasion or automated account-rotation patterns.

ENGINEERING EXECUTION
- Start by inspecting repository files, existing code, dependency versions, environment
  configuration, tests, and deployment state. Do not overwrite an existing app before audit.
- Produce an architecture map, current-vs-target gap analysis, risk list, task plan, and
  milestone acceptance tests.
- Implement one vertical slice at a time. Do not generate the whole platform in one pass.
- For each task: state scope, inspect affected code, implement, run typecheck/lint/tests/build,
  inspect screenshots at listed breakpoints, review accessibility/security, summarize files
  changed, remaining risks, and next task.
- Use stable releases only; check current official docs before adding fast-changing packages.
- Pin dependencies and commit lockfiles. Avoid installing redundant libraries.
- Keep secrets out of git and sample files. Provide .env.example with placeholders only.
- Migrations must be reversible or have a documented recovery plan. Never run destructive
  production migrations or delete media without explicit human approval.
- Do not invent test results, production URLs, provider accounts, credentials, or successful
  deployments. Report exactly what was run and what remains unverified.

DEFINITION OF DONE
- Feature works end to end with real API/database contracts, not hardcoded mock state.
- Responsive layout works at 360, 390, 430, 768, 1024, 1280, 1440, and 1920 px.
- WCAG-oriented keyboard, focus, target-size, contrast, captions, and reduced-motion tests pass.
- Tests cover both permitted and denied states; unauthorized access is tested negatively.
- No secret, original media URL, content key, permanent storage link, or private object key is
  exposed to the browser or logs.
- Playback works with the configured provider and real licensed test fixture on supported devices.
- Cost meters, monitoring, rollback, and operator runbook are documented.
- No feature is marked complete unless its acceptance tests actually ran.

Begin with a repository audit and return the gap analysis before implementing features.
```

---

## 81. Specialist prompt additions

### Prompt J — Premium visual system and UI quality

```text
Read Sections 59–64 and 78 of the Master Blueprint. Audit the existing UI and build a
complete original Cinematic Graphite design system. Deliver token definitions, component
variants, responsive behavior, state matrix, accessibility behavior, and page-specific specs.
Do not clone Netflix or any competitor. Implement Home, Browse, Search, Detail, Watch,
My List, Profile, and Admin using real typed data. Test keyboard, touch, reduced motion,
WCAG 2.2 AA contrast and focus behavior. Return screenshots and a design QA report at
360, 390, 430, 768, 1024, 1280, 1440, and 1920 px. Do not call a page complete because
it looks attractive in one desktop screenshot.
```

### Prompt K — DRM and secure playback proof of concept

```text
Read Sections 65–70 and 74. Do not implement homemade DRM. Compare provider-supported
signed playback and multi-DRM options using current official docs and written pricing.
Build a proof of concept using only a rights-cleared sample video. Verify browser/device
support for Widevine, FairPlay and PlayReady as applicable. Demonstrate: no public master
file; entitlement-gated session; short-lived token; encrypted HLS/DASH; license request;
expiry/revocation; and failure closed when DRM is unavailable. Inspect browser DevTools
and document honestly which manifest/segment/endpoint URLs remain observable. Never claim
that a web URL can be perfectly hidden. Provide a threat model and negative-test report.
```

### Prompt L — VOD pipeline and QoE

```text
Read Sections 69–70. Build an idempotent media lifecycle using authorized source fixtures:
upload, quarantine, hash, ffprobe, transcode, ABR package, subtitles/audio, encryption/DRM
provider integration, QC, publication gate, rollback, and telemetry. Do not process files
inside a web request. Add queue concurrency limits, retry/dead-letter behavior, progress
heartbeats, cleanup, and test fixtures. Report encode time, CPU/RAM, storage footprint,
playback start, rebuffer, and error metrics on the test matrix. Do not promise 4K support
without measuring it on the selected provider/device combination.
```

### Prompt M — Capacity and cost architecture

```text
Read Sections 71, 75, and 77. Audit the actual VPS provider's vCPU, RAM, disk, port speed,
transfer limits, fair-use policy, and network restrictions. Model 8 vCPU / 32 GB as the
application/automation capacity, not CDN capacity. Produce a resource budget, queue
concurrency benchmark, storage growth model, egress/concurrency calculation, vendor cost
spreadsheet assumptions, and scale thresholds. Separate application compute, encoding,
object storage, CDN delivery, DRM licenses, database, backups, observability, and rights
costs. Do not invent provider prices or assume a 1 Gbps port is sustained throughput.
```

---

## 82. V3 technical decision register

| Decision | V3 recommendation | Must be verified before production |
|---|---|---|
| App topology | Modular monolith + separate media workers/provider | Actual traffic and team capacity |
| VPS | Up to 8 vCPU / 32 GB for app and orchestration | Provider bandwidth/fair-use, disk IOPS, CPU generation |
| Database | Managed PostgreSQL | Provider PITR, connection limits, region |
| Queue | Redis + BullMQ | Redis persistence/HA and worker semantics |
| Primary video | Managed provider first | DRM, region, device compatibility, pricing, exportability |
| Premium DRM | Widevine + FairPlay + PlayReady if contract requires | Contractual security level and provider plan |
| Player | Shaka Player or provider player | Actual browser/DRM matrix and provider support |
| Storage | Private object storage for source/archive | Rights retention, lifecycle, egress, encryption controls |
| CDN | Provider CDN or contracted CDN | Bangladesh/target territory latency and cache behavior |
| Google Drive | Optional backup destinations only | Google plan/API limits and current terms |
| Design | Cinematic Graphite original system | User testing and brand approval |
| Metadata | Properly licensed metadata provider | Commercial display rights, attribution, territorial terms |

---

## 83. V3 source register and verification boundary

This addendum uses the following primary/official references for specific technical claims. Vendor features, pricing, browser support, and contractual conditions change; re-verify during procurement and before implementation.

1. Netflix Help Center, [How Netflix's recommendations system works](https://help.netflix.com/en/node/100639/) — official description of row/title/ranking personalization and engagement signals.
2. Netflix Help Center, [An update to the Netflix TV experience and layout](https://help.netflix.com/en/node/321880164349028) — official description of the newer TV navigation and My Netflix destination.
3. Apple Developer, [Human Interface Guidelines: Playing video](https://developer.apple.com/design/human-interface-guidelines/playing-video) — playback continuity and minimizing barriers to expected playback.
4. W3C, [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/) — contrast, focus, target size, resize, and accessibility success criteria.
5. Google, [Widevine DRM overview](https://developers.google.com/widevine/drm/overview) — premium media DRM, EME/Common Encryption context, supported ecosystems and agreement requirement.
6. Mux, [Protect videos with DRM](https://www.mux.com/docs/guides/protect-videos-with-drm) — Widevine/FairPlay/PlayReady, player integration, license and pricing notes.
7. Mux, [Secure video playback](https://www.mux.com/docs/guides/secure-video-playback) — signed playback policies, JWTs, expiry and playback restrictions.
8. Mux, [Video pricing](https://www.mux.com/docs/pricing/video) and [Pricing](https://www.mux.com/pricing) — input/storage/delivery/DRM pricing dimensions; re-check exact current rates.
9. Cloudflare, [Secure your Stream](https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/) — signed URL/token access for private video.
10. Cloudflare, [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) — temporary bearer access, operations, expiry and security caveats.
11. AWS, [MediaConvert ABR output groups](https://docs.aws.amazon.com/mediaconvert/latest/ug/choosing-your-streaming-output-groups.html) — HLS, DASH ISO and CMAF ABR output groups.
12. AWS, [MediaConvert supported formats](https://docs.aws.amazon.com/mediaconvert/latest/ug/reference-codecs-containers.html) — container and codec support.
13. AWS, [MediaPackage encryption fields](https://docs.aws.amazon.com/mediapackage/latest/ug/endpoints-hls-encryption.html) — DRM provider integration through SPEKE.
14. AWS, [SPEKE v2 implementation](https://docs.aws.amazon.com/mediapackage/latest/userguide/implementing-speke-v2.html) — DRM system identifiers and signaling/encryption schemes.
15. Shaka Player, [Project and DRM support matrix](https://github.com/shaka-project/shaka-player) and [DRM configuration](https://shaka-player-demo.appspot.com/docs/api/tutorial-drm-config.html) — playback/EME configuration and compatibility information.
16. Video.js, [Media sources and DRM](https://videojs.org/docs/framework/html/guides/media-sources) — DRM source configuration for supported key systems.
17. Next.js, [Self-hosting guide](https://nextjs.org/docs/app/guides/self-hosting) — reverse proxy, deployment, caching and multi-instance considerations.

### 83.1 Facts versus recommendations

- **Documented facts:** a vendor's current public docs describe a feature, interface, supported format, or published price at the time of review.
- **Recommendations:** this blueprint's preferred architecture, token TTL starting points, ladder ranges, SLO targets, component tokens, and capacity allocations are engineering starting points that must be benchmarked.
- **Unknown until procurement:** actual contract pricing, account-level eligibility, service limits, Bangladesh/target-region performance, rights-holder requirements, support SLA, and device-specific DRM behavior.

---

# FINAL V3 ARCHITECTURE DECISION

Build a distinctive, editorial, cinematic movie discovery experience on Next.js and PostgreSQL; use a modular monolith for catalogue, identity, rights, availability and playback authorization; use Redis/BullMQ for asynchronous work; keep original media in private object storage; and use a managed video platform with multi-DRM for premium licensed streaming when the content contract requires it. Use the VPS—up to 8 vCPU and 32 GB RAM—as the application and orchestration host, not as the public video CDN or permanent media archive. Treat Google Drive as optional backup storage only. Enforce rights at publication and playback time. Keep source files private, encrypted at rest, and out of browser responses. Deliver encrypted adaptive streams with short-lived authorization and DRM licenses where required. Design for measured QoE, WCAG 2.2 AA, rollback, observability, and a provider exit strategy.

**Security truth:** the original file URL can and should remain private. A browser-visible manifest/segment request cannot be made perfectly invisible. Multi-DRM and scoped tokens are the correct protection model; never promise zero capture or zero leakage.

---

# DOCUMENT MAINTENANCE — V3

- V3 preserves V2 Sections 1–57 and adds Sections 58–83.
- Section 51 remains part of the preserved original prompt; Section 80 is the required additional instruction for streaming, DRM, product design and the expanded VPS profile.
- Section 81 adds specialist prompts J–M without removing prompts A–I.
- Recheck all linked vendor docs, contracts, and prices at procurement time.
- Every implementation-specific number (bitrate, token TTL, SLO, concurrency) is a starting hypothesis until validated on the chosen provider, device matrix and real traffic.
- Rights clearance remains a mandatory human-reviewed publication gate.

---

# V4 ADDENDUM — DISTRIBUTED MEDIA DELIVERY, HIGH-SPEED STREAMING & INFRASTRUCTURE RESEARCH

**Version:** V4 additive extension  
**Research reviewed:** 6 November 2026  
**Preservation rule:** Sections 1–83 above are retained. This addendum appends Sections 84–96; it does not replace or silently rewrite the earlier blueprint. Where this addendum corrects an earlier assumption, the correction is called out explicitly and the earlier section remains available as historical context.

## 84. HDHub4u infrastructure analysis: what is known, what is not known

### 84.1 Evidence boundary

The user-provided notes hypothesize that HDHub4u may use Google Drive/enterprise storage, third-party file-hosting providers, S3-compatible storage, high-port VPS/dedicated servers, Cloudflare CDN, mirror links, remote-upload workflows and HEVC/x265 encodes. Those are plausible categories used across many file-distribution and video-delivery services. They are **not proof that HDHub4u uses any particular provider or exact architecture**.

The supplied references (including a Scribd overview, a YouTube video, a W3Techs technology profile, a third-party site and forum/Q&A pages) do not establish the actual private storage accounts, origin servers, upload workflow, contracts, CDN configuration, bitrate ladder or encoding settings of HDHub4u. Public technology profiling can show technologies observed on a website; it does not reveal the complete private media-origin or storage backend. No provider should be attributed to HDHub4u without reliable evidence from the provider, site operator or defensible technical measurement.

This blueprint therefore uses the notes as **hypotheses to investigate**, not facts to copy. It does not provide a workflow for scraping unauthorized movie sources, bypassing shorteners/anti-bot controls, evading copyright enforcement, abusing cloud accounts or mirroring infringing files. The architecture below applies the underlying performance concepts to content the platform owns, has licensed, or may lawfully distribute.

### 84.2 Claim assessment matrix

| Claim in supplied notes | Assessment | Engineering interpretation for this project |
|---|---|---|
| Google Drive / Workspace / Google One is the confirmed HDHub4u media origin | Not verified | Drive can be an optional backup or owner-controlled archive, but it is not the default public streaming origin. |
| Clicknupload, Indishare, Pixeldrain, DropGalaxy or similar hosts are used by HDHub4u | Not verified | Third-party file hosts exist, but provider use, reliability, terms and actual content rights need independent proof. Do not rely on opaque hosts for a commercial platform. |
| Cloudflare R2 or Wasabi is used by HDHub4u | Not verified | S3-compatible object storage can be a legitimate origin/archive layer. It still needs a delivery/CDN design, access policy, monitoring and legal rights. |
| Same title is replicated to multiple mirrors | Plausible general pattern; not verified for this site | Replication can improve resilience and origin capacity. Use asset IDs, checksums, replication state and CDN steering rather than unmanaged public mirror links. |
| A 10 Gbps VPS causes every viewer to receive 10 Gbps | Incorrect interpretation | 10 Gbps is a possible server-port ceiling, not an end-user guarantee. ISP peering, shared uplink, congestion, disk, origin, CDN and viewer connection constrain the result. |
| Cloudflare automatically makes every movie file fast | Incorrect as a blanket claim | CDN cacheability, cache rules, object size, byte-range behavior, token validation, cache hit ratio and origin response all matter. |
| All files transfer at 1–5 Gbps because Drive internal traffic is unlimited | Unsupported | No general Google Drive guarantee of this kind is documented. API and product quotas apply; do not build performance plans around an assumed unlimited internal path. |
| x265 makes a 4–5 GB 1080p source become 800 MB–1 GB at the same quality | Overstated | HEVC can improve compression efficiency, but the result depends on source, duration, bitrate, encoder settings, motion/grain, audio and quality target. Smaller size can mean lower quality. |
| The described torrent → VPS → 10 Drives → shortener flow is the confirmed HDHub4u pipeline | Not verified and not a lawful implementation target | Build a rights-cleared ingest pipeline with source authorization, checksum verification, private storage, content QC and a publication gate. |

### 84.3 Corrections to earlier technical assumptions

1. **Google Drive quota wording:** the official Drive API page states a 750 GB/day upload/copy cap for Google Workspace users across My Drive and shared drives, with a 24-hour wait after reaching the cap. It also documents file-size constraints. This specific Workspace rule must not be casually generalized to every consumer Google One plan. Account-level terms and current product rules must be checked. The official API quota model was updated on 1 May 2026 for newly created Cloud projects; API request quota and storage/upload restrictions are different concepts.
2. **No assumed Drive bandwidth:** Google does not provide a general public guarantee that a Drive file will download to every viewer at a fixed gigabit rate. Test actual measured throughput for the account, region, file, network and API path.
3. **No 10 Gbps promise:** a VPS advertised with a 10 Gbps port does not guarantee a sustained 10 Gbps transfer to a viewer in Bangladesh. Verify the provider’s network policy, burst/sustained behavior, transfer allowance, peering, congestion and fair-use restrictions.
4. **CDN is not magic:** a CDN can serve eligible cached objects from edge locations and reduce origin load, but cold-cache requests still need origin fetches. Cache rules, response headers, file-size eligibility, authorization and range-request configuration determine behavior.
5. **Encoding is a quality trade-off:** a smaller file is not automatically “same quality”. Use measured perceptual quality and playback tests before publishing each rendition.
6. **Mirrors are not synonymous with speed:** extra origins help only when replicas are healthy, close enough to users, correctly routed and actually have available capacity. Bad mirrors add failure modes and operational cost.

## 85. Recommended high-performance media architecture (lawful content only)

### 85.1 Separate the control plane from the media data plane

The application VPS is not the streaming CDN. A production system should separate these responsibilities:

| Plane | Main components | Responsibility | Scaling model |
|---|---|---|---|
| Control plane | Next.js app, API, auth, catalogue, entitlement, admin | Metadata, user identity, search, rights and playback authorization | Horizontal app instances; managed DB/cache |
| Ingestion plane | Upload gateway, signed multipart upload, quarantine bucket, validator | Receive and verify authorized master assets | Queue-based workers; storage scales separately |
| Processing plane | Managed transcoder or isolated FFmpeg workers | Probe, transcode, package, subtitle/audio alignment, QC | Independently scaled CPU/GPU workers or managed service |
| Origin/storage plane | Private object storage, master archive, ABR package store | Durable source and packaged media storage | Object storage capacity; versioning/replication/lifecycle |
| Delivery plane | CDN, origin shield, edge cache, routing | Deliver manifests and segments close to viewers | CDN network, not the VPS CPU/RAM |
| Protection plane | Playback token service, DRM provider, KMS | Entitlement, token, content-key and license enforcement | Highly available API/provider integration |
| Observability plane | QoE telemetry, logs, traces, metrics, cost events | Detect startup/rebuffer/errors, cache misses, cost spikes | Event ingestion and analytical storage |

### 85.2 Canonical VOD lifecycle

```text
Rights evidence approved
        ↓
Admin creates an asset record and permitted territories/windows
        ↓
Server issues short-lived upload authorization
        ↓
Browser/admin uploads directly to private quarantine storage
        ↓
Checksum + file-size + MIME/signature + malware/parser safety checks
        ↓
ffprobe metadata extraction in isolated worker
        ↓
Human/automated source QC and rights/policy validation
        ↓
Transcode into device-tested ABR ladder
        ↓
Package HLS/DASH/CMAF; align GOP/keyframes and audio/subtitles
        ↓
Encrypt using selected managed DRM / key-management workflow
        ↓
Validate every manifest, rendition, segment, caption and license path
        ↓
Publication gate checks rights + QC + delivery configuration
        ↓
CDN warms popular assets; user requests playback session
        ↓
Entitlement check → short-lived playback token → player → QoE events
```

A failed step leaves the asset quarantined or in a failed state. It must never become publicly playable merely because the upload completed.

### 85.3 Origin and storage topology

Use a private object-store bucket/container for each security purpose:

- `media-source-private`: original authorized masters. No anonymous public access.
- `media-staging-private`: temporary ingestion and processing artifacts with strict lifecycle cleanup.
- `media-packaged-private`: encrypted HLS/DASH/CMAF manifests and segments; access mediated by the selected video provider/CDN policy.
- `media-artwork-public`: only rights-cleared posters, backdrops, logos and promotional artwork.
- `media-backup-vault`: independent backup copies, preferably in a separate account/provider or storage boundary.

Use opaque asset identifiers rather than user-supplied file names in object keys. Store original filename, source provenance, rights evidence and checksum as database metadata, not as public path data. Enable versioning or immutable retention where required by the content contract. Encrypt at rest, scope IAM credentials to the smallest required bucket/prefix, and log privileged object access.

**Provider roles are not interchangeable:**

- **Cloudflare R2:** S3-compatible object storage; published R2 pricing separates storage and Class A/B operations and currently documents no Internet egress charge. It is an origin/storage option, not a complete DRM or OTT player system by itself.
- **Wasabi / other S3-compatible storage:** evaluate storage price, minimum retention, egress/usage policy, regions, API compatibility, support and contractual terms. Never assume “unlimited” egress without reading the current agreement.
- **Mux / managed video provider:** evaluate upload, transcoding, playback, signed access, DRM, analytics, supported devices and total cost. This can reduce the operational burden of building a video platform.
- **AWS MediaConvert + S3 + MediaPackage + CloudFront + SPEKE-compatible DRM:** a more configurable cloud-native stack, but with more services, IAM, observability, cost dimensions and operational ownership.
- **Google Drive:** optional backup/export destination for authorized content. Do not use it as the canonical public video origin or assume account pooling, fixed high throughput, or quota bypass.

### 85.4 Storage replication and mirror strategy

If the platform genuinely needs multiple storage origins, implement **managed replication**, not a list of fragile public download links:

- One canonical asset ID and one authoritative publication record.
- Replicas keyed by asset ID + rendition/package version + checksum.
- Object versioning and cryptographic checksum verification (SHA-256 or provider-supported integrity checksum).
- Explicit replication states: `PENDING`, `IN_PROGRESS`, `VERIFIED`, `FAILED`, `STALE`, `DECOMMISSIONED`.
- Replication lag metric and alert; never route viewers to an unverified or stale replica.
- Origin selection based on provider health, region, cache miss cost and measured latency—not round-robin alone.
- A documented failover policy and a regular restore/replication drill.
- Legal rights, territory and availability restrictions must follow every replica; deleting or disabling an asset must propagate to all origins and caches.

Multi-origin replication is a resilience and capacity choice, not an excuse to evade provider terms or copyright enforcement.

## 86. How fast media delivery actually works

### 86.1 The bottleneck model

For a single download or stream, achievable throughput is bounded by the slowest relevant part of the path:

```text
Viewer device / Wi-Fi / ISP
        ↓
ISP peering and international route
        ↓
CDN edge capacity and cache hit/miss
        ↓
Origin shield / regional cache
        ↓
Object storage or media origin
        ↓
Origin NIC + disk/object service + rate limits
```

A high port speed at the origin only raises one ceiling. It cannot repair a weak viewer connection, congested route, low cache-hit ratio, overloaded origin, slow disk or provider rate limit.

### 86.2 CDN edge caching and origin shielding

A CDN stores eligible responses at points of presence (PoPs). Popular segments can be served from edge cache without fetching the full object from the origin on every request. Origin shielding adds a regional shared cache layer so multiple edge misses can be collapsed or served through fewer origin fetches, subject to the CDN's implementation.

Recommended policy for VOD:

- **Versioned media segments:** immutable content-addressed or versioned paths; long cache lifetime after encryption/package version is finalized.
- **Manifests:** shorter or explicitly versioned cache policy. If manifests embed short-lived credentials, design the authorization/cache-key behavior carefully.
- **DRM license requests:** do not treat them as ordinary public static cache objects; use provider-prescribed authorization and caching behavior.
- **Artwork:** long-lived immutable caching when rights permit.
- **API and user-specific data:** private/no-store or carefully scoped cache; never cache one user's entitlement response for another.
- **Purge/invalidation:** support asset removal, license expiry, rights-window end and takedown across CDN and all origins. Use versioned paths for safe rollout and rollback.

Do not configure a CDN to ignore authorization query tokens or cookies unless a trusted edge authorization step validates every request before cached bytes are returned. An incorrectly designed cache key can turn private content into public content.

Cloudflare documents byte-range handling for eligible cacheable GET requests, including partial cached files and `206 Partial Content` responses. This behavior has eligibility and maximum-cacheable-size constraints; a Range header does not make an otherwise ineligible object cacheable. Test the exact CDN plan, object size and response headers before relying on it.

### 86.3 HTTP Range Requests and resumable transfer

For lawful file downloads and media seeking, the origin should correctly support:

- `Accept-Ranges: bytes` where supported.
- `206 Partial Content` for satisfiable byte ranges.
- `Content-Range` and `Content-Length` consistent with the returned interval.
- `416 Range Not Satisfiable` for invalid ranges.
- Stable `ETag` or `Last-Modified` validators and `If-Range` behavior.
- Resume only when the source object version/checksum is unchanged.

Range requests improve seek/resume behavior and may allow clients to fetch separate intervals concurrently. They do **not** guarantee a higher speed: too many parallel requests can increase contention, request charges, origin pressure or throttling. Use bounded concurrency, test on real networks and respect CDN/provider limits.

### 86.4 Load balancing, origin selection and multi-CDN

Use health- and performance-aware routing:

1. Health checks for app, playback-token service, origin, CDN and DRM integration.
2. Regional latency and error-rate telemetry from real users and synthetic probes.
3. CDN or DNS steering only when measured benefits justify the added complexity.
4. Circuit breakers and failover when an origin/provider is unhealthy.
5. Controlled origin failover that preserves authorization, rights restrictions and asset version.
6. Multi-CDN only after traffic, availability targets and egress economics justify it; otherwise one well-configured CDN is simpler and safer.

Do not tell an agent to randomly rotate links or pick the “least busy” mirror without a trustworthy health/load signal. DNS latency is not equivalent to actual throughput, and client network routes may differ from the server-side probe.

### 86.5 Adaptive Bitrate Streaming (ABR)

For streaming, package a tested ladder rather than forcing every viewer to fetch one huge MP4. The player estimates available throughput and buffer health, then selects an appropriate rendition and switches as conditions change. A ladder should include multiple resolution/bitrate combinations and should be optimized from actual device/network data, not copied blindly from another service.

Profile dimensions to benchmark:

- 360p / 480p / 720p / 1080p / optional 1440p / 4K, only when source and target devices justify them.
- Video codec: H.264 for broad baseline compatibility; HEVC/H.265 and AV1 for compatible clients where encoding, licensing and decode support make sense.
- Audio: language/track selection, stereo/surround variants, codec and bitrate.
- Closed captions/subtitles: WebVTT/TTML or provider-supported format, language metadata and accessibility.
- Segment duration, keyframe/GOP alignment, scene changes and audio/video sync.
- Startup, rebuffering, bitrate switches, decoder failures and device CPU/thermal behavior.

Do not set “4K available” merely because the master file is 4K. The provider, plan, DRM level, device, codec, network and content license must all support the target playback path.

## 87. Network and capacity math for this project

### 87.1 Port-speed conversion

Theoretical, decimal conversion before protocol overhead and other bottlenecks:

| Port rate | Maximum raw bit rate | Approximate maximum bytes/second |
|---:|---:|---:|
| 100 Mbps | 100 megabits/s | 12.5 MB/s |
| 1 Gbps | 1 gigabit/s | 125 MB/s |
| 10 Gbps | 10 gigabits/s | 1.25 GB/s |

A theoretical 10 GB transfer at 1 Gbps takes about 80 seconds; at 10 Gbps about 8 seconds. Real transfers take longer because of TCP/QUIC overhead, RTT, congestion, disk/object-store behavior, provider shaping, encryption, peering and shared capacity. These figures are ceilings for reasoning, not promises.

### 87.2 Concurrent-stream bandwidth

Approximate aggregate delivery bandwidth:

`Required egress (Mbps) = concurrent viewers × average delivered bitrate (Mbps)`

| Concurrent viewers | Average bitrate per viewer | Aggregate delivered bandwidth |
|---:|---:|---:|
| 100 | 4 Mbps | 400 Mbps |
| 500 | 4 Mbps | 2 Gbps |
| 1,000 | 5 Mbps | 5 Gbps |
| 5,000 | 5 Mbps | 25 Gbps |
| 10,000 | 5 Mbps | 50 Gbps |

This is why the application VPS should not directly serve every movie segment. The CDN/media provider delivers the bytes. The VPS authorizes sessions and manages catalogue/business logic.

### 87.3 Viewer data volume and cost model

Approximate data delivered per two-hour viewing session:

`5 Mbps × 7,200 seconds ÷ 8 = 4,500 MB ≈ 4.5 GB`

At that average bitrate, 1,000 full two-hour sessions deliver roughly 4.5 TB before overhead, previews, retries and cache behavior. If 10,000 such sessions occur, the delivered volume is roughly 45 TB. Actual delivery cost depends on provider billing units, geography, cache policy, free allowances, encoding/storage and DRM fees. A product's “free egress” claim must be evaluated alongside operation costs, storage, delivery constraints and plan terms.

### 87.4 VPS sizing: 8 vCPU / 32 GB RAM

Treat 8 vCPU / 32 GB RAM as a strong application/control-plane node for an early-stage platform—not as a substitute for CDN or distributed encoding capacity.

Suggested role split once this capacity is available:

| Workload | Preferred placement | Notes |
|---|---|---|
| Next.js web + API | 2+ application processes/replicas when traffic warrants | Reverse proxy, health checks, resource limits. One VPS remains a single failure domain. |
| Admin and scheduled jobs | App/worker process | Keep admin jobs separate from latency-sensitive playback authorization. |
| Queue orchestration | Managed Redis or isolated Redis service | Avoid exposing Redis publicly; persistence/HA based on reliability needs. |
| Main PostgreSQL | Managed PostgreSQL preferred for production | PITR, backups, monitoring and connection pooling. Local DB can be pilot-only. |
| Light metadata/image tasks | Worker container | Do not let image generation/thumbnails starve the API. |
| Full video encoding | Managed transcoding or separate worker fleet | CPU/GPU, temp disk and concurrent jobs should be benchmarked independently. |
| CDN/media segments | External CDN/video platform | Not the application VPS. |

If only one VPS is available initially, it can host a pilot stack with Docker resource limits, monitoring and backups. Document that it is not highly available. Keep media processing concurrency low, store temporary files in a bounded work directory, and reserve disk space for logs, deployments, database if present and safety margin. A 100 GB disk is not a media library.

### 87.5 Provider procurement checklist

Before upgrading or paying for 8 vCPU / 32 GB, obtain written answers for:

- Dedicated versus shared vCPU and CPU model/generation.
- RAM guarantee and swap behavior.
- NVMe/SSD type, IOPS, throughput and disk durability.
- Network port speed and whether it is shared, burstable or sustained.
- Monthly outbound transfer allowance, overage charges and fair-use policy.
- Inbound/outbound traffic shaping, abuse policies and permitted workloads.
- Data-center region, upstream carriers, peering and routes toward Bangladesh ISPs.
- IPv4/IPv6, reverse DNS, firewall and DDoS protection.
- Snapshot/backup capability and restore time.
- SLA, support response and cancellation/renewal terms.

Run repeatable tests from several Bangladesh networks and at multiple times of day. Measure `iperf3` only between endpoints you control and are authorized to test; also measure real HTTP object fetches, TTFB, sustained throughput, packet loss and route variability. Never infer end-user delivery performance from one speed test.

## 88. Video compression: x265/HEVC and quality engineering

### 88.1 Codec facts

HEVC/H.265 can deliver comparable visual quality at lower bitrates than older H.264 in many workloads, but the savings are content- and encoder-dependent. HEVC decode support, hardware acceleration, browser/device behavior, patent/licensing considerations and service-provider support must be checked. AV1 may be useful for supported devices, but encode cost and client decode support also need measurement.

A transcode profile should be selected from:

- Source quality and frame rate (do not invent detail absent from the master).
- Resolution and display size.
- Motion, noise, film grain and scene complexity.
- Target device support and hardware decode capability.
- Target bitrate/quality and audio/subtitle requirements.
- Encode cost and processing latency.

### 88.2 File-size formula and example

Approximate file size:

`Size (bytes) ≈ average total bitrate (bits/s) × duration (seconds) ÷ 8`

A two-hour asset at 5 Mbps average total bitrate is approximately 4.5 GB decimal. At 2 Mbps it is approximately 1.8 GB. An 800 MB file for two hours implies roughly 0.89 Mbps average total bitrate across video and audio; that can be a very aggressive target for 1080p, depending on content. It is not evidence of the same quality.

### 88.3 Encoding policy

- Preserve an authorized high-quality master separately from delivery renditions.
- Use quality-based encoding (e.g., CRF/CQ) or managed per-title/per-scene optimization only with a validated bitrate ceiling and target constraints.
- Compare quality with VMAF/SSIM/PSNR as supporting measurements plus human viewing tests; no one metric perfectly models perception.
- Keep audio language tracks and subtitles intact; verify timing and sync.
- Align keyframes across ABR renditions so switching is safe.
- Maintain codec/device fallback and do not force HEVC/AV1 on unsupported clients.
- Record encoder version, command/profile, source checksum, output checksum, bitrate, duration, frame rate, codec, pixel format and QC result for reproducibility.
- Re-encode only when the rights permit it and the output passes acceptance tests.

## 89. Protected playback and source-file privacy: security requirements

### 89.1 Privacy guarantee must be stated accurately

The original source/master file URL must never be sent to the browser. A browser-based player necessarily requests some playback resources (manifest, segments, thumbnails and possibly a DRM license endpoint); those requests can be observed in browser developer tools. The design goal is not “hide every URL” but **never expose an unprotected original file or reusable public secret, and require authorization for each playback resource according to the selected provider's supported model**.

### 89.2 Defense-in-depth controls

1. Private source bucket: block public access, no anonymous object listing, least-privilege service credentials.
2. Server-side entitlement: verify account status, content rights, subscription/purchase, territory, age/parental policy and active playback-session limits before issuing access.
3. Short-lived playback JWT/token: sign on the server only; audience, asset, expiry, allowed policy and session claims. Never place signing private keys or provider secrets in browser code.
4. Signed playback policy: use provider-supported signed playback. Bind expiry and permitted domain/referrer restrictions as supported. Referrer checks are supplementary, not sole authentication.
5. DRM when contract/security level requires it: integrate a legitimate provider for Widevine, FairPlay and/or PlayReady. Do not implement a homemade DRM or invent content-key encryption.
6. License security: follow provider key-management, license token, certificate, robustness and renewal/revocation requirements. Keep raw content keys out of logs, frontend bundles and general application databases.
7. Session control: per-user/device concurrency, token revocation, suspicious sharing detection, rate limits and abuse audit events.
8. Watermarking: visible or forensic watermarking only where the provider and content rights support it; never assume a watermark prevents capture.
9. Origin lockdown: CDN/provider-only access where supported; restrict bucket IAM and origin network paths. Rotate credentials and signing keys.
10. Cache isolation: verify authorization before serving cached private content; never let cache-key normalization ignore the only access credential.
11. Logging: redact JWTs, signed URLs, cookies, DRM license bodies, API keys and personally identifiable data.
12. Takedown/rights expiry: revoke tokens, disable playback, purge affected cache paths, stop distribution and propagate deletion/hold states to replicas.

DRM can deter or limit common extraction and screen-recording paths, but cannot guarantee that no viewer can capture pixels or audio (for example, using an external camera or compromised device). The player must fail closed if a required license cannot be obtained. Do not state “unbreakable” or “100% copy-proof”.

### 89.3 Playback session API contract (illustrative)

`POST /api/v1/playback-sessions`

Request (browser):

```json
{
  "assetId": "asset_public_uuid",
  "deviceClass": "web",
  "requestedProfile": "auto"
}
```

Server steps:

1. Authenticate user and validate CSRF/origin policy.
2. Load published asset and current rights window.
3. Check territory, plan/purchase, age policy and account/device limits.
4. Check provider asset state and supported playback policy.
5. Create a playback session row with expiry and audit metadata.
6. Ask provider adapter to issue a short-lived signed playback token and (when required) DRM license token.
7. Return only the provider-approved playback configuration required by the player; never return source storage credentials or master-file key/path.

Response (illustrative; provider-specific fields must be adapted):

```json
{
  "sessionId": "session_uuid",
  "playback": {
    "provider": "managed-video-provider",
    "manifestUrl": "provider_manifest_url",
    "token": "short_lived_playback_token",
    "expiresAt": "ISO-8601 timestamp",
    "drm": {
      "enabled": true,
      "licenseConfiguration": "provider_defined_configuration"
    }
  }
}
```

Do not persist or log the raw response token. The URL/token being visible to the authorized player is expected; provider signature, expiry, DRM and server-side entitlement are the protection mechanisms. Avoid placing user email, name or other PII in token custom claims.

### 89.4 Playback token and session tests

- Anonymous request cannot create a session.
- User without subscription/purchase/entitlement is denied.
- Asset outside territory or rights window is denied.
- Unpublished or quarantined asset is denied.
- Expired or malformed token is rejected by provider.
- Revoked session cannot obtain new licenses/resources where provider supports revocation.
- Token for asset A cannot be used for asset B.
- One user's entitlement is never served from another user's cache.
- Source/master bucket cannot be read from browser or anonymous network.
- Private keys and content keys do not appear in JS bundles, source maps, logs or analytics.
- Signed token never contains PII.
- CDN cache hit for a private segment still enforces the intended authorization policy.
- Playback fails closed when required DRM/license service is down.
- Rights expiry/takedown disables playback and purges relevant delivery caches.

## 90. CDN cache policy and delivery tuning

### 90.1 Cache-key principles

- Use immutable, versioned segment URLs so a new encode never accidentally reuses stale bytes.
- Include every representation-changing dimension in the cache key (asset version, rendition, language/audio track, encryption/package version where applicable).
- Ensure access control is checked before a shared cache response is served. Use the video provider's documented signed playback model or a verified edge-auth scheme.
- Do not blindly ignore `token`, `signature`, `Authorization`, cookies or tenant ID in the cache key.
- Do not cache user-specific API responses or DRM licenses as public static objects.
- Respect provider cache-size, range-request, status-code and TTL limitations.

### 90.2 Cache warming

For a newly published high-demand title, a controlled warm-up can fetch the most popular manifests and initial segments from selected edge regions after legal/publishing approval. Cache warming should be rate-limited, measured and limited to authorized assets. Do not warm every rendition or every region blindly; it can create request cost and origin load without meaningful viewers.

### 90.3 Cache and origin metrics

Track:

- CDN cache hit ratio by bytes and requests.
- Origin shield hit ratio and origin fetch requests.
- TTFB and 2xx/3xx/4xx/5xx by region.
- 206/416 range response rate and malformed-range events.
- Bytes delivered per title/rendition/region.
- Cold-cache startup versus warm-cache startup.
- Token-denial and license-failure rate.
- Purge propagation latency after takedown or rights expiry.

## 91. QoE, SLO and real-world performance validation

### 91.1 Playback Quality of Experience (QoE)

Collect privacy-conscious player events:

- `playback_requested`, `playback_authorized`, `manifest_loaded`, `first_frame`, `rebuffer_started`, `rebuffer_ended`, `quality_changed`, `playback_error`, `ended`, `abandoned`.
- Time to first frame, startup latency, rebuffer ratio, average delivered bitrate, fatal playback error rate, quality-switch count, playback completion and user exit point.
- Segment download duration, buffer length, CDN region/PoP, provider request ID and anonymized device/network category.

Avoid storing raw tokens, precise unnecessary location, full IP where not needed, or sensitive viewing history beyond the privacy policy. Apply retention and access rules.

### 91.2 Initial pilot objectives (hypotheses, not guarantees)

Use these as provisional engineering goals to validate with Bangladesh user testing; do not represent them as universal industry promises:

| Metric | Initial pilot target | Measurement |
|---|---:|---|
| Playback startup p75 | ≤ 2.5 seconds on supported test network | `first_frame - playback_requested` |
| Playback startup p95 | ≤ 5 seconds | p95 by ISP/device/rendition |
| Rebuffer ratio | < 1% of watched time | Rebuffer seconds / total play seconds |
| Fatal playback errors | < 0.5% of play attempts | Failed play attempts / all attempts |
| Playback authorization p95 | ≤ 300 ms at the API layer | Server trace, excluding DRM provider latency |
| CDN cache hit ratio | Establish baseline; improve by title/segment | Provider analytics |
| Restore test | Successful quarterly restore exercise | Checksum and playback QC |

Segment by mobile broadband, fixed broadband, ISP, device, browser, time-of-day, region, and codec. An overall average can hide a bad experience for one ISP or low-end Android device.

### 91.3 Test plan

- Test from at least three independent Bangladesh network paths where available (major mobile operators and fixed broadband), plus at least one international probe region.
- Test Wi-Fi/mobile handoff, packet loss, 3G/4G/5G variability, high RTT and constrained bandwidth.
- Test Android low-memory devices, current Chrome/Firefox/Edge, Safari/iOS and supported TV devices according to the provider matrix.
- Validate subtitle selection, audio language, resume position, seeking, picture-in-picture where supported, keyboard control, captions, reduced motion and accessibility.
- Run load tests against a rights-cleared staging asset and provider-approved test environment. Test manifest and segment traffic, not only the homepage/API.
- Simulate cold cache, warm cache, origin failure, CDN error, expired token, DRM outage, bad manifest, missing segment and queue backlog.
- Do not generate high-volume traffic against a vendor or production endpoint unless the contract and provider allow the test.

## 92. Cost and vendor decision framework

### 92.1 Compare total cost of ownership, not only storage price

For each candidate, estimate separately:

1. Master storage (GB-month), versioning, replication, backup and archive retrieval.
2. ABR package storage and output count.
3. Transcoding minutes, resolution/codec, GPU/CPU, retry and failed jobs.
4. CDN delivery by geography, bytes, request count, cache hit ratio and range requests.
5. DRM activation/license cost, key management and supported security level.
6. Database, Redis/queue, compute, logging, analytics, monitoring and alerting.
7. Support/SLA, migration, egress/exit costs and engineering operations.
8. Content licensing/royalties, music/subtitle rights, territory windows and legal support.

A low-cost bucket can be expensive when read requests, origin fetch, CDN, support, replication and application operations are included. R2 currently publishes Standard storage and Class A/B operation prices and states no Internet egress charge; the exact pricing page and account terms must be rechecked at procurement time.

### 92.2 Provider scorecard (weighted)

Score each vendor 1–5 and multiply by weight. These weights are an initial decision template, not an objective universal ranking.

| Criterion | Weight | Evidence to collect |
|---|---:|---|
| Bangladesh/target-region playback QoE | 20% | Repeated real-network tests, route and CDN PoP data |
| DRM/device support | 15% | Official device matrix, test devices, license flow |
| Total delivery economics | 15% | Written quote and traffic-based model |
| Reliability/SLA/support | 10% | Contract, incident history, support SLA |
| Encoding quality/latency | 10% | Benchmark authorized sample assets |
| Private-origin/access controls | 10% | Architecture review, signed access, audit logs |
| Exportability/portability | 10% | Can originals and packages be migrated? In what format/cost? |
| API/webhooks/observability | 5% | SDK/API quality, signed webhooks, analytics |
| Operational simplicity | 5% | Deployment effort and team skills |

### 92.3 Suggested procurement shortlist

- **Managed video-first MVP:** evaluate Mux and comparable managed video providers for ingest, encode, player, signed playback, DRM and QoE. Confirm feature availability and price for the account/contract.
- **Cloud-native configurable path:** evaluate AWS S3 + MediaConvert + MediaPackage + CloudFront + a SPEKE-compatible DRM provider. This is powerful but needs experienced cloud operations and cost governance.
- **Object storage + separate delivery:** evaluate Cloudflare R2 or another object store with a correctly configured CDN and a separate DRM/video workflow. Do not assume that an object store alone provides a Netflix-equivalent streaming platform.

Do a short proof-of-concept with one or two sample titles and representative devices before committing to a vendor. Keep originals and a provider-independent metadata/rights catalogue so migration remains possible.

## 93. Revised data model additions

The prior database model should be extended with the following entities/fields. Implement as relational tables and foreign keys; do not store the entire workflow as a single JSON column.

| Entity/table | Important fields | Purpose |
|---|---|---|
| `media_assets` | `id`, `content_id`, `source_object_key`, `source_sha256`, `duration_ms`, `container`, `video_codec`, `audio_tracks`, `status` | One canonical source asset and technical facts |
| `media_renditions` | `id`, `asset_id`, `profile`, `codec`, `width`, `height`, `bitrate`, `frame_rate`, `package_version`, `checksum`, `status` | ABR outputs and provenance |
| `media_objects` | `id`, `asset_id`, `provider`, `bucket`, `object_key`, `object_version`, `region`, `checksum`, `visibility`, `replication_status` | Origin and replica inventory |
| `media_jobs` | `id`, `asset_id`, `job_type`, `idempotency_key`, `attempt`, `lease_expires_at`, `heartbeat_at`, `status`, `error_code` | Durable ingest/transcode/QC job state |
| `playback_sessions` | `id`, `user_id`, `asset_id`, `device_class`, `issued_at`, `expires_at`, `revoked_at`, `provider_session_ref` | Entitlement and session auditing without persisting bearer tokens |
| `drm_configurations` | `id`, `provider`, `system`, `provider_config_ref`, `status`, `created_at`, `rotated_at` | Reference provider DRM configs; never store raw keys here |
| `delivery_events` | `id`, `session_id`, `event_type`, `occurred_at`, `region`, `rendition`, `error_code`, `correlation_id` | QoE metrics and diagnostics |
| `replication_tasks` | `id`, `media_object_id`, `target_provider`, `target_region`, `status`, `checksum_verified_at`, `last_error` | Verifiable replica lifecycle |
| `rights_evidence` | `id`, `content_id`, `licensor`, `contract_ref`, `territories`, `valid_from`, `valid_until`, `allowed_modes`, `reviewed_by`, `reviewed_at` | Rights evidence and publication gate |

Required constraints:

- Unique checksum/version constraints appropriate to the asset and package.
- Foreign keys from renditions/objects/jobs/sessions to canonical assets and content.
- Database transactions for publication state and rights window changes.
- No raw signed playback token, DRM license token or content key persisted in normal tables/logs.
- Row-level access checks and explicit tenant scope if multi-tenant administration is later introduced.

## 94. Updated AI-agent execution instructions

Append these instructions to the existing canonical prompt; do not remove Sections 1–83, Prompts A–M, or any previous acceptance criteria.

### Prompt N — Research the unknown external site without inventing infrastructure

```text
Treat the user-supplied HDHub4u notes as hypotheses, not verified facts. Do not claim to know
its private storage, cloud provider, VPS, CDN, mirror layout, encoder settings or automation
pipeline unless a reliable primary source proves it. Classify each statement as confirmed,
plausible general pattern, unsupported or contradicted. Explain what public technology profiling
can and cannot prove. Do not scrape, bypass anti-bot controls/shorteners, retrieve infringing
files, evade takedowns or automate unauthorized rehosting. Translate only general performance
concepts into an architecture for owned, licensed or public-domain content.
```

### Prompt O — CDN, cache and high-throughput delivery

```text
Read Sections 85–87 and 90. Design a rights-cleared VOD delivery path with private object
storage, managed transcoding/package output, CDN/origin shield, HTTP Range support where
appropriate, immutable segment paths, controlled cache warming, origin failover and a measured
cache policy. Model cold/warm cache, origin load and concurrent viewers. Never configure a
cache to ignore the only auth token/cookie. Verify object-size and range-request limitations
for the exact CDN plan. Benchmark from Bangladesh networks; do not assume the VPS port speed
is end-user throughput. Present a cost and failure-mode table.
```

### Prompt P — Codec, ABR ladder and media quality

```text
Read Sections 86 and 88. Use only approved sample assets. Probe sources, propose an ABR ladder
for actual target devices, align GOP/keyframes, preserve audio/subtitles and package HLS/DASH/CMAF
as supported by the selected provider. Compare H.264/HEVC/AV1 where supported using encode time,
output size, VMAF/SSIM/PSNR as supporting metrics and human review. Do not assert that a fixed
codec reduces every 1080p movie to a particular size or preserves identical quality. Document
compatibility fallbacks and licensing/provider requirements.
```

### Prompt Q — Network/capacity benchmark and production sizing

```text
Read Sections 87, 91 and 92. Verify the VPS contract: shared/dedicated vCPU, CPU generation,
RAM, disk IOPS, port speed, sustained bandwidth, traffic allowance, fair-use, peering, region
and SLA. Model required CDN bandwidth from simultaneous viewers × delivered bitrate. Model
GB per session from average bitrate × duration / 8. Keep the 8 vCPU/32 GB application host
separate from CDN delivery and heavy transcoding. Run only authorized, provider-approved load
tests. Produce reproducible test scripts, raw results, resource budgets, bottleneck analysis,
monthly cost assumptions and scale thresholds. Do not invent prices or guarantee throughput.
```

### Prompt R — Streaming privacy and DRM threat model

```text
Read Sections 89–91. Keep original masters private and never send their object paths or
credentials to the browser. Implement entitlement-gated short-lived playback tokens using the
chosen provider's documented policy. Use legitimate multi-DRM only when required by rights
contracts; do not implement homemade DRM. Verify expiry, asset/session binding, revocation
where supported, key rotation, cache isolation, signed webhook validation, token redaction and
fail-closed behavior. Document that manifests/segments and network requests remain observable
in browser developer tools; never promise that all URLs or screen capture can be hidden.
```

### Prompt S — Storage replication, backup and portability

```text
Read Sections 85, 89, 92 and 93. Implement a canonical asset ID, SHA-256/checksum verification,
versioned object metadata, replication state machine, retry/dead-letter handling, lifecycle
and restore drills. Keep replicas private and enforce the same rights/territory windows everywhere.
Do not pool consumer cloud accounts or rotate accounts to bypass quotas. Maintain provider-neutral
metadata and a documented export/migration process for master assets and rights records.
```

## 95. V4 implementation milestones and acceptance gates

| Milestone | Deliverable | Acceptance gate |
|---|---|---|
| V4-A — Evidence and vendor proof | HDHub4u claim matrix; provider scorecard; two-provider shortlist | No unsupported claim appears as fact; written pricing/feature evidence captured |
| V4-B — Network baseline | VPS/network audit and Bangladesh test baseline | Sustained throughput, latency, packet loss, transfer allowance and disk results recorded |
| V4-C — Private ingest | Direct-to-private upload, quarantine, checksum, ffprobe, rights record | No public object; bad/mismatched file cannot progress to publish |
| V4-D — Encode and package | Tested H.264 baseline + optional HEVC/AV1; HLS/DASH as provider supports | Device matrix, output QC, captions/audio and quality metrics pass |
| V4-E — Playback security | Entitlement, signed session, DRM proof-of-concept if contract requires | Expired/unauthorized/revoked flows denied; source master never exposed |
| V4-F — CDN and QoE | Cache policy, Range test, cache warm, failover, QoE events | Cold/warm tests, auth isolation, startup/rebuffer/error baseline recorded |
| V4-G — Capacity and cost | Concurrent viewer model and vendor cost model | Evidence-backed concurrency target, cost per viewing hour and scale trigger approved |
| V4-H — Operational readiness | Backup, restore, takedown, incident and runbooks | Restore and purge drills demonstrated; go/no-go review passed |

### 95.1 Explicit non-goals

- Discovering or reproducing HDHub4u's private infrastructure.
- Downloading or mirroring unauthorized movie files.
- Circumventing shorteners, Cloudflare challenges, file-host access controls or provider quotas.
- Claiming that a browser can never reveal a manifest, segment or license endpoint.
- Claiming that DRM prevents every type of screen capture.
- Claiming that a 10 Gbps port guarantees a 10 Gbps user download.
- Claiming that HEVC always creates a particular file size at unchanged quality.

## 96. V4 source register and evidence links

The following are official/primary technical references checked for this addendum. Their current contents and terms must be re-checked during implementation and procurement.

1. Google Drive API — [Usage limits](https://developers.google.com/workspace/drive/api/guides/limits). The current page describes Drive API quotas and additional constraints; it specifies the 750 GB/day upload/copy cap for Google Workspace users across My Drive and shared drives, and notes the API quota change effective 1 May 2026.
2. Cloudflare — [Range request behavior](https://developers.cloudflare.com/cache/reference/range-requests/). Documents eligible cacheable GET byte-range behavior, partial-file caching, `206`, origin range request alignment and limitations.
3. Cloudflare R2 — [Pricing](https://developers.cloudflare.com/r2/pricing/). Current published storage and Class A/B operation pricing, free Internet egress, free-tier and Infrequent Access retrieval details.
4. AWS CloudFront — [Video on demand and live streaming video](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/on-demand-streaming-video.html). Describes the need to encode/package media into segments/manifests such as HLS, DASH and CMAF before delivery.
5. Mux — [Secure video playback](https://www.mux.com/docs/guides/secure-video-playback). Documents public/signed playback policies, server-signed JWTs, expiration and supported playback restrictions.
6. Mux — [Protect videos with DRM](https://www.mux.com/docs/guides/protect-videos-with-drm). Documents Mux DRM workflow and Widevine, FairPlay and PlayReady integrations, with provider-specific tokens and player setup.
7. Mux — [Playback ID API reference](https://www.mux.com/docs/api-reference/video/playback-id). Documents public, signed and DRM playback ID policy types.
8. Cloudflare — [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/). Documents time-limited bearer access and operational caveats for S3-compatible presigned URLs.
9. FFmpeg — [Documentation](https://ffmpeg.org/documentation.html). Reference for media probing/transcoding; exact codec and encoder behavior is version/build dependent.
10. x265 — [Documentation](https://x265.readthedocs.io/). Reference for HEVC encoder options and quality/performance trade-offs.
11. W3C — [Encrypted Media Extensions](https://www.w3.org/TR/encrypted-media/). Browser API model for interacting with content decryption systems; it does not itself provide a DRM service or license server.

### 96.1 Research confidence statement

- **Verified from primary docs:** Drive Workspace upload/copy limits as documented, Cloudflare's documented range-request behavior, R2's published price dimensions, AWS's packaged VOD delivery model, and Mux's signed playback/DRM product behavior.
- **General engineering inference:** CDN edge caching, origin shielding, ABR, replicated origins and efficient encoding can improve throughput/resilience when correctly configured and measured.
- **Unknown:** HDHub4u's actual private cloud providers, file-hosting accounts, server port speeds, storage mirrors, CDN configuration, file processing pipeline and encoder presets.
- **Project recommendation:** build a lawful, provider-supported VOD stack with private origins, tested ABR, measured CDN delivery, rights-aware publication and secure playback.

---

# FINAL V4 ARCHITECTURE DECISION

Keep the earlier V3 product, design, database, security and AI-agent plan intact. Add an evidence-led distributed media plane: private object storage for approved masters; a quarantined, checksum-verified ingestion workflow; managed or isolated transcoding and HLS/DASH/CMAF packaging; provider-backed encryption/DRM when required; signed entitlement-gated playback; CDN edge caching and origin shielding; measured Range/seek support; replica integrity and failover; QoE analytics; and a cost/capacity model based on concurrent bitrate rather than VPS RAM alone. Use the 8 vCPU / 32 GB VPS for the control plane and orchestration, not as the global video delivery network. Treat Google Drive as optional backup, not a public streaming origin. Never attribute an unverified provider or pipeline to HDHub4u.

**V4 security truth:** the original master-file URL stays private; the player necessarily makes visible network requests for playback resources; provider-backed signed access and DRM protect the media path but cannot make a browser session invisible or guarantee zero capture.

---

# DOCUMENT MAINTENANCE — V4

- V4 preserves V3 Sections 1–83 and adds Sections 84–96.
- V3 Prompts A–M are preserved; Prompts N–S add external-infrastructure evidence review, CDN, codec, capacity, DRM and storage replication instructions.
- Existing Design System and CSS token deliverables remain unchanged; no Figma file is claimed as created.
- Every provider feature, plan limitation, price, region, quota and device-support claim must be checked against current official documentation and contract before purchase.
- Every speed, SLO, bitrate ladder and cost number is a model or pilot target until validated using the real provider, content, device matrix and Bangladesh networks.
- Rights clearance remains a human-reviewed publication gate.
