# Workspace Agent Operating Guide (`AGENTS.md`)

This repository builds the **Lawful Movie Discovery & Authorized Media Distribution Platform** (working codename: **Cinematic Graphite**).

## 1. Non-Negotiable Legal & Security Rules

1. **Lawful content only**: Only works owned by the operator, covered by a documented distribution licence, or verified by legal review as public domain may be published or delivered.
2. **Prohibited capabilities**: Never implement piracy scraping, third-party host extraction, shortlink/CAPTCHA/Cloudflare bypass, torrent/magnet ingestion, unauthorized mirroring, Google One multi-account quota rotation, or arbitrary user-supplied URL fetching (SSRF).
3. **Central rights enforcement**: Every publish, stream manifest, and file download check must pass through `@movie/domain`'s `evaluateRights` (`RightsDecisionService`) on the server.
   - `STREAM` never implies `DOWNLOAD`.
   - Territorial rights (e.g., `BD`) never imply worldwide rights.
   - Completed upload (`UPLOADED`) never auto-publishes (`PUBLISHED`).
   - Signed URLs are access controls, **not** DRM; fail closed when `drmRequired === true` and no approved DRM adapter is configured.
4. **Secret & token hygiene**: Never commit credentials or expose private object keys, master URLs, session secrets, signing keys, cookies, or full presigned URLs in browser bundles or logs. Route telemetry through `@movie/observability`.
5. **Approval gates**: Pause for human sign-off before publishing real content, approving live rights, provisioning paid cloud resources, registering OAuth apps, configuring production DNS/TLS, or running destructive migrations.

## 2. Technical Conventions

- **Package manager**: `pnpm@11.18.0` on Node.js `24.x` (`save-exact=true` in `.npmrc`; lifecycle scripts restricted in `pnpm-workspace.yaml`).
- **Next.js 16.4.5 (`apps/web`)**:
  - Read `apps/web/AGENTS.md` and `apps/web/node_modules/next/dist/docs/` before changing Next.js routing, caching, or config.
  - Use `apps/web/proxy.ts` (`export function proxy`), **never** `middleware.ts`.
  - `cacheComponents: true` and `partialPrefetching: true` are enabled. Wrap dynamic runtime reads (`cookies()`, `headers()`, `searchParams`, uncached DB reads) and layout `usePathname()`/`useSearchParams()` hooks inside `<Suspense fallback={...}>`.
- **Design system (`Cinematic Graphite`)**:
  - `apps/web/app/globals.css` sets `--color-*: initial` under `@theme inline`. Default Tailwind palette classes (`bg-zinc-*`, `text-white`, `bg-black`, etc.) do **not** exist. Use semantic tokens only (`bg-canvas`, `bg-surface-1`, `text-text`, `text-text-secondary`, `border-border`, `text-accent`, `text-success`, `text-warning`, `text-danger`, `text-info`).
  - Never convey state by color alone; pair glyphs and text labels (`Badge`, `AvailabilityBadge`).

## 3. Standard Verification Commands

Run from repository root (`d:\movie-site`):

- `pnpm format:check` — Prettier check
- `pnpm lint` — ESLint (`@movie/web`)
- `pnpm typecheck` — `next typegen` + TypeScript `--noEmit` across all workspace packages
- `pnpm test` — Vitest unit, contract, and negative policy suite
- `pnpm build` — Next.js 16 Turbopack production build
- `pnpm test:e2e` — Playwright end-to-end suite
