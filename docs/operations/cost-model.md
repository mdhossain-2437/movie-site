# Cost, Bandwidth & Storage Capacity Model

## 1. Key Economic Driver

For lawful video platforms, **egress bandwidth** and **transcoding/packaging compute** dominate monthly operating cost far more than raw gigabytes stored at rest. Architecture choices prioritize zero-egress-fee object storage (such as Cloudflare R2) paired with adaptive bitrate ladders tuned for mobile and broadband networks.

## 2. Reference Bitrate & File Size Assumptions (120-Minute Film)

| Rendition Tier | Target Bitrate | Approx. 2-Hour Stream Data | Notes |
| --- | --- | --- | --- |
| `360p` (Mobile Data Saver) | ~600 kbps | ~0.54 GB | Essential for constrained mobile connections |
| `480p` (SD) | ~1.1 Mbps | ~0.99 GB | Standard mobile/tablet fallback |
| `720p` (HD) | ~2.4 Mbps | ~2.16 GB | Default balanced stream tier |
| `1080p` (Full HD) | ~4.5 Mbps | ~4.05 GB | High-tier broadband / TV |

Packaged multi-rendition storage footprint per 2-hour film (HLS/DASH CMAF + subtitles + artwork, excluding archival ProRes/mezzanine master): **~7.8 GB – 9.0 GB**.

## 3. Illustrative Monthly Storage Footprint

- **100 licensed films** (packaged renditions + compressed mezzanine): ~1.5 TB – 2.5 TB stored.
- **1,000 licensed films**: ~15 TB – 25 TB stored.

## 4. Cost Control Guardrails Built into the Platform

1. **Zero Unauthorized Hotlinking**: Short-lived signed session manifests/downloads prevent third-party sites from leeching bandwidth.
2. **Bounded Upload & Temp Quotas**: `UPLOAD_MAX_BYTES` and `TEMP_STORAGE_MAX_BYTES` enforce hard ceilings on multipart sessions, and `cleanupExpiredUploads()` reclaims abandoned staging parts.
3. **Resolution Caps per Entitlement & Territory**: `evaluateRights()` enforces `maxResolution` so free or mobile-only grants do not serve `1080p`/`4K` bitrates unintentionally.
4. **Separate Download Authorization**: Offline file downloads require explicit `DOWNLOAD` rights and rate-limited single-object signed URLs.
