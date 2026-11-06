# Cinematic Graphite — UI experience

An original editorial adaptation of the supplied motion, filmmaker-gallery and title-page concepts. It uses the existing Manrope / Inter / Geist Mono typography and semantic Graphite tokens, plus self-hosted Noto Sans Bengali for Bangla glyphs.

## Screen map

- `/` — manually selectable featured titles, archive rail, auteur index, collections, genres and rights-first principles.
- `/movies` — shareable GET filters for genre, decade and country, chronological/alphabetical sorting, poster grid and film index.
- `/movies/[slug]` — generated full-bleed art, metadata, English/Bangla synopsis, credits, related films, per-action rights panel, local save and page sharing.
- `/people` and `/people/[slug]` — filmmakers and contributors, oversized surname composition, monochrome-to-colour filmography and linked credits.
- `/collections` and `/collections/[slug]` — editorial collections, generated-art collages and numbered film lists.
- `/genres/[slug]` — genre-specific catalogue view.
- `/search` — English/Bangla title, person, genre, year and collection search; the persistent `Ctrl/Cmd + K` palette uses the same client-safe index.
- `/watch/[slug]` — server-authorized locked state, decision code and recorded input facts. No media is connected, no player is simulated and no delivery URL is issued.
- `/watchlist` — explicitly device-only saved references, including removal and confirmed clearing.
- `/account` — honest unconnected sign-in status, working local reduced-motion/Bangla-title preferences, and a description of the planned session/security model.
- `/admin` — read-only fixture metrics, searchable rights queue, required release gates and the domain-derived RBAC model. No publishing or rights-approval action is exposed.
- Legal, loading, route-error and 404 states use the same visual language.

## Fixture boundary

`lib/catalogue/repository.ts` is server-only. `stage.ts` enables the reference catalogue only for effective `development` or `test` application stages. Explicit `staging`, `production`, or misspelled stages return an empty catalogue. CI may build a test-stage bundle with `APP_ENV=test`; that is not a production content release.

The 22 early-film records are **development editorial references**, not published offers or legal public-domain determinations. Every title is `IN_REVIEW`, every rights request is `PENDING`, all evidence lists are empty, and no media asset exists. Metadata and translations require source verification before publication.

Artwork is generated in `components/art/scenes.tsx` and rendered as inline decorative SVG with unique React IDs. The source and rights note are recorded in `GENERATED_ART_PROVENANCE`. It contains no third-party poster, still, portrait, logo, external image URL or embedded film footage. This provenance is independent of film, restoration, music and distribution rights.

Catalogue availability uses a deterministic display snapshot and the central `@movie/domain` evaluator. The watch route calls `connection()` under Suspense and passes request time into the same evaluator. Streaming and download are evaluated independently. The authorization facts are recorded inputs, not a second allow/deny implementation.

## Interaction and accessibility

- No automatic carousel scrolling, audio, trailer, parallax or background video.
- Hover-capable devices see monochrome posters that reveal colour on hover/focus; touch devices receive colour without needing hover.
- Poster selection uses a bounded, reduced-motion-aware 360 ms wipe. Modified clicks retain browser behavior, and a safety timeout prevents a stuck overlay.
- Native modal dialogs provide Escape handling, background inertness and focus restoration. The local `Dialog` primitive adds an explicit Tab/Shift+Tab loop, including responsive menus whose secondary links are hidden.
- Rails support scroll snap, keyboard focus, touch scrolling and boundary-aware previous/next controls.
- The list and preferences use `useSyncExternalStore` over a validated, versioned localStorage object. They contain no credentials, session identifiers or delivery rights. Blocked storage falls back to the current visit.
- Reduced motion respects both system settings and the device switch. Bangla-title presentation changes the actual poster labels.
- Artwork SVGs are decorative; titles and all meaningful content remain accessible HTML.
- Fixed navigation has reserved scroll/focus clearance. Main content includes a skip-link destination.

## Integration boundary

Live accounts, cloud watchlist sync, private ingest, verified catalogue persistence, playable renditions, DRM, actual rights approvals, notice intake and production infrastructure are not claimed to be connected. Those remain separate authorized implementation and human-sign-off tasks.

## Verification

Use the repository's prescribed commands from the workspace root, on Node 24 and pnpm 11.18.0:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

The focused suites cover fixture exclusion, negative rights decisions, Unicode search, generated-art ID/accessibility integrity, local interactions, route navigation, poster transitions, keyboard dialogs and viewport overflow. The e2e discovery suite expects the development/test fixture catalogue, not a production content release.

For browser verification against a local production runtime, build the test-stage bundle and use a separate port from the supervised development preview:

```sh
NODE_ENV=production APP_ENV=test pnpm build
PORT=3100 NODE_ENV=production APP_ENV=test pnpm test:e2e
```

Playwright manages its local test server. `NODE_ENV=production` must be explicit if the shell inherits a development value. A test-stage bundle is not a production release; use `NODE_ENV=production APP_ENV=production pnpm build` to verify the empty production-catalogue boundary.
