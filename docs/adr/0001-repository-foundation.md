# ADR 0001 — Repository foundation

- **Status:** Accepted (M1)
- **Date:** 2026-11-06

## Context

The repository started as planning documents only (blueprints V2–V4, design system, tokens). The
blueprint calls for a modular monolith on current stable Next.js App Router + React + TypeScript,
Tailwind CSS with a token-based design system, PostgreSQL, and Vitest/Playwright.

## Decision

- pnpm monorepo: `apps/*` for deployables, `packages/*` for shared modules (e.g. future `@movie/db`).
- `apps/web` (`@movie/web`): Next.js 16 App Router, React 19, TypeScript strict (extends
  `tsconfig.base.json`), Tailwind CSS v4.
- Design tokens: `apps/web/styles/cinematic-graphite.tokens.css` is a copy of the root token file and
  is bridged into Tailwind via `@theme` in `app/globals.css`. Tailwind's default colour palette is
  disabled so only design-system colours can be used.
- Fonts: Manrope / Inter / Geist Mono via `next/font` (self-hosted at build time, no runtime font CDN).
- Planning documents stay at the repo root, unchanged, as the source of truth.

## Consequences

- Shared M1 foundation packages (`@movie/config`, `@movie/observability`, `@movie/contracts`,
  `@movie/domain`, `@movie/storage` mock adapter) establish fail-fast configuration, redacted
  structured logging, central `RightsDecisionService` + RBAC + asset lifecycle policy, and private
  quarantine storage semantics before database and auth land in M2.
- Consumer, legal, and operations route shells present honest platform status — zero fake or
  invented catalogue data.
