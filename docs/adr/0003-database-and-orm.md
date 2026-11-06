# ADR 0003 — Database, ORM & Disposable PostgreSQL Runtime

- **Status:** Accepted (M2)
- **Date:** 2026-11-06

## Context

Milestone M2 introduces the normalized PostgreSQL schema across all five platform domains (Identity
& RBAC, Catalogue & Localized Metadata, Rights Ledger & Takedowns, Media & Storage Inventory, and
Playback & Immutable Audit Events), along with revocable server-side sessions and a centralized Data
Access Layer (DAL).

We need:
1. Type-safe SQL queries, explicit constraints/indexes, and standard `.sql` migration files without
   opaque runtime query engines or native binary postinstall build fragility.
2. Compatibility with external PostgreSQL 18 (`DATABASE_URL=postgresql://...` in Docker Compose,
   staging, and production) **and** zero-daemon disposable PostgreSQL execution on developer hosts
   and CI runners where Docker or `pg_ctl` may not be running.

## Decision

1. **ORM & Migration Tooling:** Adopt **Drizzle ORM (`drizzle-orm`)** and **`drizzle-kit`** inside
   `packages/db` (`@movie/db`). Schema definitions live in TypeScript (`pg-core`), and `drizzle-kit`
   generates standard, auditable PostgreSQL SQL migrations.
2. **Dual PostgreSQL Driver Strategy:**
   - When `DATABASE_URL` starts with `postgres://` or `postgresql://`, `@movie/db` connects via
     `pg` (`drizzle-orm/node-postgres`).
   - In Automated Tests (`NODE_ENV=test` without external `DATABASE_URL`) or zero-daemon local
     development (`DATABASE_URL=pglite://...` or unset in `development`), `@movie/db` boots
     **`@electric-sql/pglite`** (`drizzle-orm/pglite`) — a real WebAssembly PostgreSQL engine
     supporting transactions, foreign keys, `CHECK` constraints, `JSONB`, and indexes.
   - Production fail-fast validation in `@movie/config` continues to require a real external
     `DATABASE_URL` when the effective stage is `production`.
3. **Centralized DAL:** `@movie/db` exposes domain repositories and transaction helpers, while
   application authorization (`assertPermission`, `evaluateRights`) and owner-scoping (IDOR
   prevention) are enforced in server-only service/DAL entrypoints before returning records.

## Consequences

- Every DB integration and negative security test runs against real PostgreSQL SQL semantics in
  milliseconds without requiring a background Docker daemon.
- `pnpm-workspace.yaml` does not need Prisma native engine build exceptions once `@movie/db` lands.
