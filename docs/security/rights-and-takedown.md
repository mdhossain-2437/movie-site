# Rights Governance & Emergency Takedown Specification

## 1. Chain-of-Title Requirement

No title or media asset may transition to `PUBLISHED` unless an active `RightsGrant` exists with:
- Verified grant status (`APPROVED`) recorded by an MFA-authenticated `RIGHTS_ADMIN` or `SUPER_ADMIN`.
- Explicit territory coverage matching the viewer's ISO 3166-1 alpha-2 territory (e.g., `BD`) or explicit `WORLDWIDE` scope (`BD` never implies `WORLDWIDE`).
- Active validity window (`startsAt <= now < endsAt`).
- Explicit delivery capability (`CATALOGUE`, `STREAM`, `DOWNLOAD` evaluated separately—`STREAM` never grants `DOWNLOAD`).
- Satisfied entitlement tier and maximum resolution cap.
- Satisfied DRM gate (`drmRequired === true` fails closed unless an approved DRM license adapter is active for the rendition).

## 2. Asset Quarantine & Publication State Machine

1. `DRAFT` / `UPLOADING` — Multipart session initialized; bytes written only to private staging bucket.
2. `UPLOADED` — Multipart upload completed; byte size and SHA-256 verified (mismatches transition immediately to `QUARANTINED`).
3. `SCANNING` -> `PROCESSING` -> `READY_FOR_REVIEW` — Automated integrity/container checks and rendition packaging complete.
4. `APPROVED` — Editorial/QC reviewer approves technical quality.
5. `PUBLISHED` — Requires **both** `APPROVED` lifecycle state and an active `RightsGrant` (`canPublishAssetWithRights`).

## 3. Emergency Takedown & Legal Hold Runbook

When a rights dispute, contract revocation, or statutory takedown notice (including under the Bangladesh Copyright Act 2023) is received:
1. **Immediate Kill-Switch**: Setting `legalHold = true` on the title or asset causes `evaluateRights()` to return `DENIED_LEGAL_HOLD` instantaneously across catalogue playback and download endpoints.
2. **Cache Invalidation**: Public catalogue tags are invalidated while personalized endpoints already enforce `Cache-Control: no-store`.
3. **Non-Destructive Preservation**: Quarantined files, rights evidence records, and immutable audit log entries are preserved under legal hold and are never hard-deleted during an active investigation.
