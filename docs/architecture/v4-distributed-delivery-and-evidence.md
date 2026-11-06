# V4 Distributed Media Delivery & Evidence Architecture

**Platform:** Lawful Movie Discovery & Authorized Media Distribution Platform (*Cinematic Graphite*)  
**Version:** V4 Core Media Architecture Extension  
**Date:** November 2026  
**Status:** Approved Architecture Specification  
**Authority:** Master Blueprint Sections 84–96, `AGENTS.md` Legal & Security Operating Rules

---

## 1. Executive Summary

This architecture specification documents the design, mathematical models, empirical evidence, and operational controls of the V4 Distributed Media Delivery Engine for Cinematic Graphite. 

In strict adherence to `AGENTS.md` §1:
1. **Lawful Content Only**: The platform ingests and distributes only works owned by the operator, licensed under verified distribution agreements, or certified as public domain by legal review.
2. **Prohibited Capabilities & Absolute Refusal**: Piracy scraping, third-party cyberlocker host extraction, shortlink/CAPTCHA/Cloudflare challenge bypass, torrent/magnet downloading, unauthorized mirroring, and consumer multi-account quota rotation (e.g., Google One pooling) are strictly prohibited and architecturally rejected.
3. **Decoupled Architecture**: High-throughput media streaming is completely decoupled from application compute: the control plane runs on application nodes (e.g., Next.js 16, PostgreSQL, Redis), while high-bandwidth media segments and manifests are delivered through edge CDN networks and verified object storage origins.

---

## 2. HDHub4u Claim Classification Matrix

Public claims regarding external high-traffic piracy and aggregation platforms (including HDHub4u) frequently conflate observed edge behaviors with internal infrastructure reality. Under Master Blueprint §84, claims from external notes are classified into four rigorous categories:

| # | User / Industry Claim | Classification | Engineering Reality & Evidence | Cinematic Graphite Architecture |
|---|---|---|---|---|
| 1 | "Google Drive / Google One is the primary media streaming origin" | **Unsupported / Unverified** | Google Workspace enforces a strict 750 GB/day upload/copy quota per user across My Drive and Shared Drives with a mandatory 24-hour backoff (Google Drive API Limits, 2026). Consumer Google One accounts are subject to abuse detection and rate limiting. There is no documented high-concurrency public streaming SLA. | Google Drive is never used as a hot public streaming origin. S3-compatible private object storage (e.g. Cloudflare R2 / AWS S3) serves as canonical storage. Drive is restricted to optional cold backup export under operator control. |
| 2 | "Third-party cyberlockers (Clicknupload, Indishare, Pixeldrain) provide enterprise reliability" | **Unsupported / Unverified** | Unmanaged third-party file hosts offer zero availability SLAs, display intrusive third-party advertising, frequently remove files on DMCA notices, and throttle connections. Commercial platforms cannot depend on opaque cyberlockers. | Banned from production ingestion and delivery. Origin and replication nodes use first-party or contracted enterprise storage with verifiable cryptographic integrity. |
| 3 | "S3-compatible object storage (Cloudflare R2, Wasabi) can serve as origin" | **Confirmed from Primary Docs** | Cloudflare R2 publishes zero egress fee policies for Internet delivery, charging only for storage ($0.015/GB-mo) and Class A/B API operations (Cloudflare R2 Pricing, 2026). Wasabi offers flat-rate S3 storage subject to fair-use egress ratios. | R2 is approved as a primary media origin. Packaged ABR segments are stored under opaque keys in `media-packaged-private`. |
| 4 | "Replicating identical titles across multiple mirrors enhances uptime" | **Plausible General VOD Pattern** | Multi-origin replication improves disaster recovery, regional latency, and origin failover if managed via deterministic state machines, versioning, and cryptographic checksums. | Implemented via `replication_tasks` table (`PENDING` → `IN_PROGRESS` → `VERIFIED` / `FAILED` → `DECOMMISSIONED`). Replicas must pass SHA-256 validation before traffic steering. |
| 5 | "A 10 Gbps VPS port guarantees 10 Gbps download speed to every user" | **Unsupported & Incorrect** | 10 Gbps is a theoretical server network interface card (NIC) ceiling. End-user throughput is strictly bounded by the slowest hop: viewer Wi-Fi/4G/5G, local ISP peering, transit congestion, CDN edge hit ratio, and disk I/O. | Mathematical capacity models verify egress ceilings. High-volume media bytes are never routed through the VPS NIC; CDN edge caching offloads >95% of byte transfer. |
| 6 | "Cloudflare automatically accelerates all large video files" | **Plausible General VOD Pattern (with caveats)** | Cloudflare caches static assets at edge PoPs, but video file caching depends strictly on byte-range support, plan cache limits, TTL rules, and cache-key configuration (Cloudflare Range Requests documentation). Ineligible or non-range requests miss origin. | Implements RFC 9110 HTTP Range byte-serving (`206 Partial Content`), immutable versioned segment paths, and cache-control headers. |
| 7 | "Internal Google Drive traffic is unlimited at 1–5 Gbps" | **Unsupported** | No primary Google documentation supports unlimited throughput or quota exemption for internal traffic. API request limits and abuse throttles apply universally. | Rejected as an architectural assumption. Delivery models rely solely on contracted provider bandwidth. |
| 8 | "x265/HEVC reduces a 5 GB 1080p movie to 800 MB at identical quality" | **Unsupported as blanket claim (Overstated)** | HEVC provides ~30–50% compression efficiency gains over H.264 at comparable VMAF scores depending on film grain, motion complexity, and encoder presets. An 800 MB file for 120 minutes implies an average total bitrate of 0.89 Mbps—which results in visible artifacting and detail loss in high-motion/grain scenes. | Multi-rendition ABR ladder (360p to 1080p/4K) calibrated for perceptual quality (target VMAF ≥ 93 for top renditions) with multi-track audio and WebVTT preservation. |
| 9 | "Download from HDHub4u, scrape shortlinks, bypass Cloudflare, and mirror to Drive" | **Prohibited & Refused** | Violates anti-circumvention provisions, copyright statutes, and platform acceptable use policies. Involves unauthorized copying and distribution of copyrighted works. | **STRICTLY REFUSED.** Zero scraper code, zero bypass scripts, zero unauthorized links. Ingestion requires documented rights evidence approved by legal counsel via `evaluateRights()`. |

---

## 3. The 7-Plane Media Architecture

Cinematic Graphite isolates system responsibilities into 7 distinct planes to ensure that high-volume streaming traffic never destabilizes transactional databases, authentication systems, or administrative consoles:

```text
                        [ Client / Viewer Device ]
                                    │
              ┌─────────────────────┴─────────────────────┐
              ▼                                           ▼
      [ Control Plane ]                           [ Delivery Plane ]
   Next.js 16 / Auth / DAL                         Cloudflare CDN PoP
   Session Token Issuance                      Edge Cache / Range Serving
              │                                           │
              ▼                                           ▼
     [ Protection Plane ]                       [ Origin/Storage Plane ]
   RightsDecisionService / DRM                media-packaged-private (R2)
   Revocation & Legal Hold                     media-source-private (Vault)
              │                                           │
              ├─────────────────────┬─────────────────────┤
              ▼                     ▼                     ▼
     [ Ingestion Plane ]   [ Processing Plane ]  [ Observability Plane ]
    Quarantine Bucket     FFprobe Worker / ABR     QoE Telemetry / DAL
   Magic-Byte Validation  Keyframe-Aligned CMAF   Startup / Rebuffer / SLO
```

### Plane Specifications

| Plane | Core Components | Primary Responsibilities | Scaling Model | Security & Privacy Guardrails |
|---|---|---|---|---|
| **1. Control Plane** | Next.js 16 (`apps/web`), `@movie/auth`, `@movie/db` | User identity, catalogue browsing, search, watchlist, rights verification, and session token generation. | Horizontal Node.js containers behind reverse proxy (Caddy / Cloudflare). | No bearer secrets in browser bundles; CSRF protection via same-origin verification; CSP headers enforced in `proxy.ts`. |
| **2. Ingestion Plane** | Multipart upload gateway, `@movie/storage`, quarantine bucket | Receiving master media files from verified rights holders; quarantine isolation. | Asynchronous S3 multipart uploads directly to private staging bucket. | Reject public ACLs; magic-byte probing (`probeMediaHeaderBytes`) blocks executables, scripts, and HTML polyglots. |
| **3. Processing Plane** | Isolated FFprobe adapter, Transcoder, ABR packager | Checksum validation, metadata extraction, keyframe-aligned CMAF packaging, WebVTT subtitle alignment. | Queue-driven background workers (`outbox_jobs`) on separate compute instances. | Sandboxed execution (`-protocol_whitelist file`); strict path validation (`assertSafeLocalProbePath`) blocks SSRF. |
| **4. Origin / Storage Plane** | S3-compatible object storage (Cloudflare R2, AWS S3), Vault | Durable storage of master archives and packaged HLS/DASH media segments. | Cloud object storage capacity; multi-region verified replication (`replication_tasks`). | Opaque keys (`assets/{id}/v{ver}/...`); no user filenames or PII in storage paths; bucket policies deny anonymous access. |
| **5. Delivery Plane** | Global Anycast CDN (Cloudflare), Edge Origin Shield | Edge caching of manifests and segments, RFC 9110 HTTP Range byte-serving, latency reduction. | Global edge network with origin shielding and anycast routing. | Edge authorization validation; no caching of private session tokens; immutable cache keys for versioned segments. |
| **6. Protection Plane** | `RightsDecisionService`, Session Ledger, DRM Registry | Centralized rights evaluation, territory checking, 15-minute revocable playback tokens, multi-DRM config. | High-availability in-memory / relational policy evaluation. | Fail-closed DRM boundary; instant legal-hold kill switch revokes all active playback sessions and decommissions replicas. |
| **7. Observability Plane** | QoE Telemetry (`POST /api/v1/playback-sessions/[id]/qoe`), Audit Ledger | Playback startup latency, rebuffer duration, rendition switching, error rates, immutable audit events. | Stream ingestion into `delivery_events` table; admin aggregation queries. | Zero raw tokens, zero passwords, zero PII; IPs redacted; country codes limited to ISO 3166-1 alpha-2. |

---

## 4. CDN Cache & Range Policy

### 4.1 Cache Hierarchy & Key Isolation

To balance high cache hit ratios (>95%) with strict access control, cache policies are differentiated by asset classification:

| Resource Type | Cache Location | `Cache-Control` Header | Cache Key Dimensions | Invalidation / Purge Policy |
|---|---|---|---|---|
| **Encrypted Media Segments (`.m4s`)** | Edge PoP + Browser Cache | `public, max-age=31536000, immutable` | URI path (contains asset ID, package version, rendition, segment index). | Immutable: new encodes publish under incremented version (`v2/`). |
| **HLS Master Manifest (`master.m3u8`)** | Edge PoP (Short) / No Browser Cache | `public, max-age=60, s-maxage=300` | URI path + Version query parameter. | Purged on asset unpublish, takedown hold, or rendition update. |
| **Playback Session Manifests** | No Edge Cache (Private) | `private, no-store, no-cache` | User / Session Token specific. | Session manifests embed short-lived signed tokens; never cached across users. |
| **Subtitle Tracks (`.vtt`)** | Edge PoP + Browser Cache | `public, max-age=86400, stale-while-revalidate=604800` | URI path + Track ID + Version. | Purged on subtitle update or title legal hold. |
| **Public Artwork / Posters** | Edge PoP + Browser Cache | `public, max-age=2592000, immutable` | URI path (`titles/{id}/artwork/{id}.webp`). | Purged on artwork replacement. |
| **QoE / API Endpoints** | Never Cached | `private, no-store` | N/A | Never cached. |

### 4.2 RFC 9110 HTTP Range Compliance

Seeking within media files and resumable file downloads require RFC 9110 compliant byte-range handling:

1. **Header Parsing (`parseHttpByteRange`)**:
   - Supports standard range (`bytes=0-1048575` → first 1 MB).
   - Supports prefix range (`bytes=1048576-` → byte 1 MB to end of file).
   - Supports suffix range (`bytes=-524288` → last 512 KB of file).
   - Clamps requested upper bounds exceeding `totalByteLength - 1` to prevent out-of-bounds access.
2. **Response Semantics (`readObjectByteRange`)**:
   - **Satisfiable Range**: Emits `HTTP 206 Partial Content`, `Accept-Ranges: bytes`, `Content-Range: bytes {start}-{end}/{total}`, `Content-Length: {length}`, and stable `ETag`.
   - **Unsatisfiable Range**: Emits `HTTP 416 Range Not Satisfiable` with `Content-Range: bytes */{total}` whenever `start >= totalByteLength` or `start > end`.
   - **Full Request**: Serves full file with `HTTP 200 OK`, `Accept-Ranges: bytes`, and total `Content-Length`.

---

## 5. Video Compression: x265/HEVC/AV1 Quality & Bitrate Math

### 5.1 Empirical Mathematical Model

File size in digital video delivery is governed strictly by bitrate and duration:

$$\text{File Size (bytes)} = \frac{\text{Average Total Bitrate (bits/second)} \times \text{Duration (seconds)}}{8}$$

$$\text{Volume (GB decimal)} = \frac{\text{Bitrate (Mbps)} \times \text{Duration (seconds)}}{8 \times 1,000}$$

#### Representative Calculations (120-minute / 7,200s Feature Film)

| Profile / Codec | Target Resolution | Video Bitrate | Audio Bitrate | Total Bitrate | Total File Size | Typical Perceptual Quality |
|---|---|---|---|---|---|---|
| **CMAF 360p (AVC)** | 640×360 | 700 kbps | 96 kbps | 796 kbps | **0.716 GB** (716 MB) | Mobile fallback; VMAF ~75–80 |
| **CMAF 480p (AVC)** | 854×480 | 1,250 kbps | 128 kbps | 1,378 kbps | **1.240 GB** (1,240 MB) | Standard definition; VMAF ~84–88 |
| **CMAF 720p (AVC)** | 1280×720 | 2,500 kbps | 160 kbps | 2,660 kbps | **2.394 GB** (2,394 MB) | High definition baseline; VMAF ~90–93 |
| **CMAF 1080p (AVC)** | 1920×1080 | 4,800 kbps | 192 kbps | 4,992 kbps | **4.493 GB** (4.49 GB) | Full HD; broad compatibility; VMAF ~94–96 |
| **CMAF 1080p (HEVC)** | 1920×1080 | 2,800 kbps | 192 kbps | 2,992 kbps | **2.693 GB** (2.69 GB) | Full HD efficient; VMAF ~94–96 (40% savings) |
| **CMAF 2160p (HEVC)** | 3840×2160 | 13,500 kbps | 384 kbps | 13,884 kbps | **12.496 GB** (12.50 GB) | 4K UHD premium; VMAF ≥ 97 |

### 5.2 Quality Engineering Guardrails

1. **VMAF Benchmarking**: No rendition is published unless automated quality probes confirm a minimum VMAF threshold:
   - 1080p Top Rendition: VMAF $\ge 93$
   - 720p Mid Rendition: VMAF $\ge 88$
   - 480p Low Rendition: VMAF $\ge 80$
2. **GOP & Keyframe Alignment**: All ABR ladder variants share identical GOP sizes (2.0 or 4.0 seconds) and closed keyframe intervals to guarantee seamless rendition switching without player buffering or decoder stalls.
3. **Preservation of Ancillary Assets**: Video compression must never strip original stereo/5.1 audio channels or discard WebVTT closed captions.

---

## 6. Sizing & Workload Partitioning: 8 vCPU / 32 GB vs Pilot VPS

### 6.1 Network Egress Bottleneck Model

The required outbound streaming bandwidth scales directly with concurrent viewer volume:

$$\text{Required Bandwidth (Mbps)} = \text{Concurrent Viewers} \times \text{Average Delivered Bitrate (Mbps)}$$

```text
Concurrent Viewers vs Required Delivery Bandwidth:
  100 Viewers  @ 4 Mbps  =   400 Mbps  (Fits within 1 Gbps port)
  500 Viewers  @ 4 Mbps  = 2,000 Mbps  (2.0 Gbps — EXCEEDS 1 Gbps VPS PORT!)
 1,000 Viewers @ 5 Mbps  = 5,000 Mbps  (5.0 Gbps — 500% of 1 Gbps VPS Port)
 5,000 Viewers @ 5 Mbps  = 25,000 Mbps (25.0 Gbps — Requires CDN Edge Grid)
```

**Architectural Law**: An application VPS port ceiling cannot sustain multi-viewer VOD streaming directly. The application VPS must serve exclusively as the control plane; media segments must be delivered by CDN edge PoPs.

### 6.2 Host Sizing & Workload Split

| Workload Component | Pilot Machine (`dark-crow`, 4 vCPU / 16 GB) | Scale Target Node (8 vCPU / 32 GB) | Preferred Production Placement |
|---|---|---|---|
| **Next.js 16 Web App** | 1 instance (1.5 vCPU, 2 GB RAM limit) | 2 clustered instances (3.0 vCPU, 4 GB RAM) | Dedicated Web Container |
| **API & Auth Handlers** | Co-located in Next.js process | Co-located in Next.js process | Web Container |
| **PostgreSQL Database** | Containerized Postgres 18 (0.75 vCPU, 2 GB RAM) | Containerized Postgres 18 (2.0 vCPU, 8 GB RAM) | Managed PostgreSQL (Cloud RDS / Supabase) |
| **Redis Cache & Outbox** | Containerized Redis 7.4 (0.25 vCPU, 512 MB RAM) | Containerized Redis 7.4 (0.5 vCPU, 1 GB RAM) | Managed Redis (Upstash / Aiven) |
| **Reverse Proxy (Caddy)** | Caddy 2.9 (0.5 vCPU, 256 MB RAM) | Caddy 2.9 (0.5 vCPU, 512 MB RAM) | Edge CDN Reverse Proxy |
| **Outbox Media Worker** | 1 worker (1.0 vCPU, 2 GB RAM, read-only root) | 2 workers (2.0 vCPU, 4 GB RAM) | Background Worker Cluster |
| **Heavy Video Transcoding** | **STRICTLY PROHIBITED** (would starve API) | **STRICTLY PROHIBITED** | Dedicated GPU Workers or Managed SaaS (Mux) |
| **Video Segment Egress** | **STRICTLY PROHIBITED** | **STRICTLY PROHIBITED** | Cloudflare CDN / Origin Shield |

---

## 7. Weighted Provider Scorecard

To evaluate media infrastructure options for Cinematic Graphite, candidate providers are evaluated across 9 weighted operational criteria:

$$\text{Composite Score} = \sum_{i=1}^{n} (\text{Score}_i \times \text{Weight}_i)$$

| Criteria | Weight | Evaluation Method / Evidence Required | Cloudflare R2 + CDN | AWS Media Services | Managed Provider (Mux) |
|---|---|---|---|---|---|
| **1. Regional Playback QoE (BD & Global)** | 20% | Local Bangladesh ISP peering, latency probes, edge PoP presence in South Asia. | 4.5 / 5 (Strong Dhaka/Kolkata PoPs) | 4.2 / 5 (CloudFront Mumbai/regional) | 4.6 / 5 (Multi-CDN automated steering) |
| **2. DRM & Device Compatibility** | 15% | Widevine, FairPlay, PlayReady support; HTML5 EME integration; iOS/Android support. | 2.5 / 5 (Requires external KMS/SPEKE adapter) | 4.8 / 5 (SPEKE v2, MediaPackage DRM) | 4.9 / 5 (Turnkey native multi-DRM) |
| **3. Total Delivery Economics** | 15% | Storage GB-mo, egress pricing, API request fees, transcode minute cost. | 4.8 / 5 ($0.015/GB-mo, $0 egress) | 3.2 / 5 (Significant egress fees after 1 TB) | 3.8 / 5 (Predictable per-minute pricing) |
| **4. High Availability & SLA** | 10% | Contracted availability, multi-region failover, incident history. | 4.5 / 5 (99.9% R2 SLA, global network) | 4.9 / 5 (99.99% AWS enterprise SLA) | 4.7 / 5 (99.95% managed service SLA) |
| **5. Encoding Quality & Latency** | 10% | VMAF output scores, per-title encoding presets, transcode throughput. | 2.0 / 5 (No native transcoding included) | 4.5 / 5 (MediaConvert broadcast-grade) | 4.8 / 5 (Instant ingest, automated ABR) |
| **6. Private Access & Zero-Trust** | 10% | Signed URLs, token expiry, referrer checks, origin access control. | 4.6 / 5 (R2 presigned URLs, Cloudflare WAF) | 4.7 / 5 (CloudFront OAC, signed cookies) | 4.6 / 5 (Signed playback JWTs) |
| **7. Portability & Open Standards** | 10% | Standard S3 API, standard CMAF/HLS outputs, no proprietary lock-in. | 4.9 / 5 (Fully standard S3 API & HLS) | 4.0 / 5 (Standard outputs, complex IAM) | 3.5 / 5 (Proprietary asset management API) |
| **8. Observability & QoE API** | 5% | Real-time startup metrics, rebuffering telemetry, webhook callbacks. | 3.5 / 5 (Cloudflare Analytics / GraphQL) | 4.2 / 5 (CloudWatch + CloudFront logs) | 5.0 / 5 (Mux Data integrated QoE) |
| **9. Operational Simplicity** | 5% | Deployment overhead, team cognitive load, maintenance hours. | 4.2 / 5 (Simple S3 API, minimal moving parts) | 2.2 / 5 (High complexity, 6+ AWS services) | 4.8 / 5 (Turnkey SDK, fastest time-to-market) |
| **Weighted Total Score (out of 5.0)** | **100%** | **Composite Evaluation** | **3.95 / 5.0** | **4.01 / 5.0** | **4.45 / 5.0** |

### Strategic Recommendation
1. **Pilot / Early-Stage Phase**: Cloudflare R2 + CDN provides the most cost-effective, zero-egress foundation for lawful, self-encoded HLS packages with deterministic in-house access control.
2. **Commercial Production Scale**: A managed video infrastructure provider (e.g., Mux) or AWS MediaPackage + CloudFront is recommended when studio contracts strictly mandate studio-approved hardware-level DRM (Widevine L1 / FairPlay) and commercial SLA guarantees.

---

## 8. Data Schema & Verifiable State Machine

The relational database schema enforces verifiable asset lifecycles and compliance invariants:

```text
[ media_assets ] ──1:N──> [ media_objects ] ──1:N──> [ replication_tasks ]
       │                         │
      1:N                       1:N
       ▼                         ▼
[ media_renditions ]      [ subtitle_tracks ]

[ playback_sessions ] ──1:N──> [ delivery_events (QoE) ]
```

- **`delivery_events`**: Stores telemetry (`startup_latency_ms`, `rebuffer_duration_ms`, `rendition_profile`, `region_code`, `error_code`, `correlation_id`, `occurred_at`). Sanitized to ensure no sensitive bearer tokens or user identifiers are ever recorded.
- **`replication_tasks`**: Manages multi-origin replication state (`PENDING` → `IN_PROGRESS` → `VERIFIED` → `FAILED` → `DECOMMISSIONED`).
- **`drm_configurations`**: Tracks DRM system references (`WIDEVINE`, `FAIRPLAY`, `PLAYREADY`) without ever persisting raw encryption content keys.
- **Atomic Takedown Kill-Switch**: Upholding a takedown report atomically sets `titles.status = 'TAKEDOWN_HOLD'`, `titles.legalHold = true`, `mediaAssets.lifecycleState = 'TAKEDOWN_HOLD'`, revokes active `playback_sessions`, and transitions all associated `replication_tasks` to `DECOMMISSIONED`.

---

## 9. Verification & Audit Trail

| Verification Dimension | Automated Test Target | Acceptance Threshold |
|---|---|---|
| **Range Byte-Serving** | `packages/storage/src/storage.test.ts` | 100% pass: standard, prefix, suffix, clamped ranges, 206 headers, 416 rejection. |
| **Capacity & Bitrate Math** | `packages/media/src/media.test.ts` | 100% pass: VPS egress ceiling alarms, GB/session formulas, non-negative inputs. |
| **QoE Telemetry & DAL** | `packages/db/src/media-playback.test.ts` | 100% pass: token validation, PII redaction, admin metrics aggregation. |
| **Atomic Kill-Switch** | `packages/db/src/media-playback.test.ts` | 100% pass: takedown resolution atomically decommissions all asset replication tasks. |
| **Dev Fixture Seeder** | `packages/db/src/seed-dev-showcase.ts` | Refuses production execution; idempotently seeds 7 films, 2 collections, 5 genres. |

*Document compiled in strict accordance with Cinematic Graphite Project Standards and Legal Operating Rules.*
