# Verification & Test Plan

## 1. Verification Philosophy

Every vertical slice must ship with automated unit, schema, and **negative security/policy tests** before advancing to the next milestone. No test, lint check, typecheck, or build is ever reported as passing without actual terminal execution.

## 2. Test Layers

| Layer | Runner & Location | Scope |
| --- | --- | --- |
| **Environment & Guardrails** | Vitest (`packages/config/src/index.test.ts`) | Dev defaults, production fail-fast missing secret rejection, secret-reuse rejection, memory-storage rejection in prod, TMDb commercial license gate. |
| **Observability Redaction** | Vitest (`packages/observability/src/index.test.ts`) | Recursive scrubbing of passwords, cookies, JWTs, Bearer headers, refresh tokens, `sourceObjectKey`, and presigned URL query signatures. |
| **API & Error Contracts** | Vitest (`packages/contracts/src/index.test.ts`) | RFC 9457 Problem Details, cursor pagination bounds, health payload schema, role/state enums. |
| **Domain Policy & Negative Suite** | Vitest (`packages/domain/src/domain.test.ts`) | Deny-by-default rights evaluation, `STREAM` != `DOWNLOAD`, `BD` != `WORLDWIDE`, expired/future grants, legal holds, DRM fail-closed, RBAC separation of duties, MFA requirements, asset lifecycle state guards (`UPLOADED -> PUBLISHED` blocked). |
| **Storage Quarantine & Integrity** | Vitest (`packages/storage/src/storage.test.ts`) | Opaque key validation (traversal/PII blocked), multipart upload completion, idempotency, automatic quarantine on SHA-256 or byte-size mismatch, short-lived signed GET URLs, expired session cleanup. |
| **Web UI, Proxy & Health Route** | Vitest + Testing Library (`apps/web/tests/foundation.test.tsx`) | Accessible button/badge/alert/chip states, honest rights-gated Home page, `GET /api/v1/health` `no-store` & `x-request-id`, `proxy.ts` CSP & `/watch` `no-referrer` header. |
| **End-to-End & Responsive Breakpoints** | Playwright (`tests/e2e/foundation.spec.ts`) | Health endpoint, consumer/search/legal/admin navigation, skip-link focus, and zero horizontal overflow across `360px`–`1920px` viewports. |

## 3. Execution Commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```
