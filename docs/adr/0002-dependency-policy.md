# ADR 0002 — Dependency policy

- **Status:** Accepted (M1)
- **Date:** 2026-11-06

## Context

The master blueprint requires stable releases only, pinned dependencies, committed lockfiles and no
redundant libraries. pnpm 11 blocks dependency lifecycle (build) scripts unless explicitly allowed.

## Decision

1. **Package manager:** pnpm workspace (`pnpm-workspace.yaml`), version pinned via `packageManager`
   in the root `package.json`. Node.js 24 LTS (`engines`).
2. **Exact versions:** `.npmrc` sets `save-exact=true`; manifests use exact versions, never `^`/`~`.
3. **Lockfile:** `pnpm-lock.yaml` is committed and CI installs with `--frozen-lockfile`.
4. **Build scripts:** only packages listed under `allowBuilds` in `pnpm-workspace.yaml` may run
   install scripts. Each entry needs a reason:

   | Package | Reason |
   |---|---|
   | `sharp` | Next.js image optimization native binary |
   | `unrs-resolver` | Native resolver used by `eslint-config-next` import rules |
   | `esbuild` | Native binary used by Vite/Vitest |
   | `@tailwindcss/oxide` | Tailwind CSS v4 native engine |
   | `@prisma/client`, `@prisma/engines`, `prisma` | Legacy reservation (superseded by Drizzle ORM in ADR 0003; no native engine build needed) |

5. **Milestone M2 Database Dependencies (`@movie/db`):** `drizzle-orm@0.45.4`, `drizzle-kit@0.31.11`,
   `pg@8.23.1`, `@types/pg@8.23.1`, and `@electric-sql/pglite@0.5.15` (pure JS/TS + prebuilt WASM,
   requiring zero additional `allowBuilds` lifecycle exceptions).
6. **Adding a dependency** requires: stable release (no canary/beta/rc), check that the platform or an
   existing dependency doesn't already cover it, licence check, and a note in the PR.
7. **Shared dev tooling** (TypeScript, Vitest, Playwright, Prettier) lives in the root manifest;
   runtime dependencies live in the package that uses them.

## Consequences

Upgrades are explicit PRs. ESLint is held on the 9.x line until `eslint-config-next` and its plugins
are verified against ESLint 10.
