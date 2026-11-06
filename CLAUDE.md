# CLAUDE.md — Operating Guidelines for Claude & LLM Assistants

Welcome to **Cinematic Graphite** (`d:\movie-site`), a lawful movie discovery and authorized media distribution platform.

When operating in this codebase, you must strictly follow these instructions, conventions, and security boundaries.

---

## 1. Non-Negotiable Legal, Copyright & Security Boundaries

1. **Lawful Content Only**:
   - Only works owned by the operator, covered by a documented distribution licence, or verified by legal counsel as public domain may be published, catalogued, or delivered.
   - Central rights enforcement: Every publish, stream manifest, and file download check must pass through `@movie/domain`'s `RightsDecisionService` (`evaluateRights`).
   - `STREAM` never implies `DOWNLOAD`. Territorial rights (e.g., `BD`) never imply worldwide rights. Completed upload never auto-publishes.
2. **Strictly Prohibited Capabilities**:
   - **ZERO** references to IMDb logos/ratings, Warner Bros., *Dune*, Arrakis, or Atreides.
   - **ZERO** scraping, probing, or links to piracy sources including `HDHUB4U` or `4khdhub.one`.
   - Never implement piracy scraping, third-party host extraction, shortlink/CAPTCHA/Cloudflare bypass, torrent/magnet ingestion, or SSRF fetching.
3. **Asset & Token Integrity**:
   - 100% original Cinematic Graphite design tokens (`#080A0D` canvas, `#181F28` surface, `#D8B36A` warm gold, aperture `BrandMark`).
   - No external raster images or unverified remote URLs. Use procedural SVG/gradient artwork.
4. **Secret Hygiene & Human Approval**:
   - Never commit credentials or expose private object keys, session secrets, or full presigned URLs in browser bundles or logs.
   - Pause for human approval before publishing real content, approving live rights, provisioning paid cloud resources, or running destructive migrations.

---

## 2. Canonical Architecture & Guidelines

Always consult these authoritative reference files before proposing or making changes:
- `d:\movie-site\AGENTS.md`: Non-negotiable legal, security, and operational rules.
- `d:\movie-site\PROJECT.md`: 7-plane system architecture, feature inventory, interface contracts, and code layout.
- `d:\movie-site\DESIGN.md`: Design system tokens, taste calibration sliders (BOLD 7/10, MOTION 6/10, DENSITY 5/10), anti-slop rules, and accessibility standards.
- `d:\movie-site\.agents\rules\frontend-design-engineering.md`: Frontend engineering and token constraints.

---

## 3. Technical Conventions & Tooling

### Package Manager & Runtime
- **Package Manager**: `pnpm@11.18.0` (`save-exact=true` in `.npmrc`).
- **Node.js**: `24.x` (enforced via `package.json` engines).

### Next.js 16 (`apps/web`)
- **Next.js Version**: `16.4.5` with Turbopack and App Router.
- **Routing & Proxy**: Use `apps/web/proxy.ts` (`export function proxy`), **NEVER** `middleware.ts`.
- **Partial Prerendering (PPR)**: `cacheComponents: true` and `partialPrefetching: true` are enabled. Wrap dynamic runtime reads (`cookies()`, `headers()`, `searchParams`, uncached DB queries) and client layout hooks inside `<Suspense fallback={...}>` with `await connection()`.

### Design Tokens & Styling
- `apps/web/app/globals.css` sets `--color-*: initial` under `@theme inline`.
- Default Tailwind palette classes (`bg-zinc-*`, `text-white`, `bg-black`, `bg-gray-*`) **do not exist**.
- Use semantic tokens only: `bg-canvas`, `bg-canvas-raised`, `bg-surface-1`, `bg-surface-2`, `bg-surface-3`, `border-border`, `border-border-strong`, `border-accent`, `text-text`, `text-text-secondary`, `text-text-muted`, `text-accent`, `text-success`, `text-warning`, `text-danger`, `text-info`.

### Accessibility & Touch Standards
- Minimum mobile touch target: **>= 44x44px** (`min-h-11 min-w-11`).
- Minimum desktop interactive target: **>= 24x24px**.
- Zero `user-scalable=no` or `maximum-scale=1` in viewport tags.
- Explicit `<Spinner />` with `role="status"` and `sr-only` text on all async buttons and forms.
- All animated elements must honor `prefers-reduced-motion` (`motion-reduce:transition-none`).

---

## 4. Standard Verification Commands

Run all verification commands from the repository root (`d:\movie-site`):

```bash
# 1. Format check (Prettier)
pnpm format:check

# 2. ESLint linting across all packages
pnpm lint

# 3. TypeScript type checking (next typegen + tsc --noEmit)
pnpm typecheck

# 4. Unit, contract, and negative policy test suite (Vitest)
pnpm test

# 5. Production Next.js build
pnpm build

# 6. End-to-end integration and visual QA suite (Playwright)
pnpm test:e2e
```

When modifying code:
1. Make minimal, focused changes (no unrelated refactoring).
2. Keep existing comments and docstrings intact.
3. Verify that all standard verification commands pass with 0 errors.
