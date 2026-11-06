# Cinematic Graphite — Lawful Movie Discovery & Authorized Media Platform

> **Working codename:** *Cinematic Graphite* (public brand pending trademark and domain approval).

A modular-monolith web platform for lawful film discovery, localized English/Bangla metadata, rights-gated streaming, and separately licensed downloads—engineered with **Next.js 16.4.5**, **React 19.3**, **TypeScript 5.9**, **Tailwind CSS v4**, and strict server-side rights governance.

---

## Core Architectural Principles

1. **Rights-First Publication & Delivery**: No title or media asset can be published, streamed, or downloaded without an approved rights grant verified by `@movie/domain` (`evaluateRights`). Streaming permission never implies download permission, and Bangladesh (`BD`) rights never imply worldwide rights.
2. **Separation of Duties & MFA**: Editors and media operators cannot self-approve rights grants. Privileged operational roles require multi-factor authentication.
3. **Quarantine-First Media Ingest**: Uploads land in private staging storage (`@movie/storage`), verify SHA-256 checksums and byte lengths, and quarantine automatically on mismatch.
4. **Cinematic Graphite Design System**: Token-driven dark obsidian palette (`cinematic-graphite.tokens.css`), self-hosted `Manrope` / `Inter` / `Geist Mono` typography, accessible keyboard navigation, and zero fake catalogue placeholders.

---

## Workspace Structure

```text
.
├── apps/
│   └── web/                  # @movie/web — Next.js 16 App Router, UI primitives, proxy.ts, Route Handlers
├── packages/
│   ├── config/               # @movie/config — Zod v4 environment validation & production fail-fast guards
│   ├── contracts/            # @movie/contracts — Shared schemas, enums & RFC 9457 Problem Details
│   ├── domain/               # @movie/domain — Central RightsDecisionService, RBAC matrix & asset state machine
│   ├── observability/        # @movie/observability — Structured JSON logger with secret/URL redaction
│   └── storage/              # @movie/storage — Private StorageAdapter, multipart quarantine & HMAC URLs
├── infra/
│   └── compose/dev.yml       # Local PostgreSQL 18 & Redis 7.4 Docker Compose stack
├── docs/                     # ADRs, PRD, architecture, threat model, rights/takedown, cost & test plans
└── tests/e2e/                # Playwright end-to-end & responsive viewport verification
```

---

## Quick Start

### Prerequisites

- **Node.js** `>=24.0.0 <25`
- **pnpm** `11.18.0`
- *(Optional for external DB/cache)* Docker Compose (`infra/compose/dev.yml`)

### Setup & Run

```bash
# 1. Copy environment template
cp .env.example .env.local

# 2. Install workspace dependencies
pnpm install

# 3. Start local development server (http://localhost:3000)
pnpm dev
```

### Verification Suite

```bash
pnpm format:check   # Verify code formatting
pnpm lint           # Run ESLint across @movie/web
pnpm typecheck      # Run next typegen + tsc --noEmit across all packages
pnpm test           # Run Vitest unit, schema & negative policy tests
pnpm build          # Build Next.js 16 production bundle (Cache Components enabled)
pnpm test:e2e       # Run Playwright E2E tests (requires Playwright Chromium installed)
```

---

## Governance & Documentation

- [Master Synthesis (`DOCUMENTATION_SUMMARY.md`)](./DOCUMENTATION_SUMMARY.md)
- [Product Requirements (`docs/product/PRD.md`)](./docs/product/PRD.md)
- [Architecture Overview (`docs/architecture/overview.md`)](./docs/architecture/overview.md)
- [Security Threat Model (`docs/security/threat-model.md`)](./docs/security/threat-model.md)
- [Rights & Takedown Governance (`docs/security/rights-and-takedown.md`)](./docs/security/rights-and-takedown.md)
- [Cost & Capacity Model (`docs/operations/cost-model.md`)](./docs/operations/cost-model.md)
- [Verification & Test Plan (`docs/testing/test-plan.md`)](./docs/testing/test-plan.md)
- [Architecture Decision Records (`docs/adr/`)](./docs/adr/)
