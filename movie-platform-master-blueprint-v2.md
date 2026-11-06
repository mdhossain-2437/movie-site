# Movie Discovery & Authorized Media Distribution Platform
## Deep Production Blueprint + Canonical AI Coding-Agent Master Prompt

**Version:** 2.0 (Expanded engineering edition)  
**Prepared:** 6 November 2026  
**Project assumption:** This blueprint is for a lawful movie catalogue and media-distribution platform. It supports films that the operator owns, has licensed, or has individually verified as public-domain / appropriately Creative-Commons-licensed in the relevant territory. It is not a piracy-site scraper, mirror-leech bot, or copyright-evasion system.

**How to use this document:** Parts I–III establish the original product/engineering direction and a first agent prompt. Parts V–VII are the expanded production specification and supersede earlier shorter descriptions where they differ. **Section 51 is the canonical master coding-agent prompt; Section 52 contains the specialist prompts.** Build milestone by milestone and require human approval for rights, paid spend and production actions.

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
