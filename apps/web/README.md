# `@movie/web` — Next.js 16 Application

Consumer discovery shell, legal compliance pages, internal Operations Console (`/admin`), and versioned Route Handlers (`/api/v1/*`) for Cinematic Graphite.

## Key Next.js 16 Conventions

- **Proxy (`proxy.ts`)**: Request correlation IDs (`x-request-id`), strict `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and route-aware `Referrer-Policy` (`no-referrer` on `/watch/*`).
- **Cache Components (`cacheComponents: true`) & Partial Prefetching (`partialPrefetching: true`)**: Dynamic runtime data (`searchParams`, `cookies()`, `headers()`, uncached DB queries) and navigation pathname hooks (`usePathname()`) are isolated inside `<Suspense>` boundaries so static shells prerender cleanly.
- **Semantic Design Tokens Only**: `app/globals.css` resets `--color-*: initial` and maps Cinematic Graphite CSS custom properties from `styles/cinematic-graphite.tokens.css`.

## Commands (from repo root)

```bash
pnpm dev
pnpm lint
pnpm --filter @movie/web typecheck
pnpm build
```
