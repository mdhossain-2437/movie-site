# Production Release Verification & E2E Test Suite (`TEST_READY.md`)

This document certifies that the comprehensive, requirement-driven opaque-box End-to-End (E2E) test suite for the **CINEVA Production Release** has been designed, authored, formatted, and validated.

---

## 1. Test Runner Commands

The test suite is built on **Playwright (`@playwright/test` v1.65.0)** and executes against both desktop (`1440x900` Chromium) and mobile (`390x844` Pixel 7 emulation) target viewports.

### Standard Test Execution Commands

| Target | Command | Description |
|---|---|---|
| **Full E2E Suite** | `pnpm test:e2e` | Runs all Playwright test files in `tests/e2e/` against Desktop and Mobile |
| **Production Release Suite** | `pnpm exec playwright test tests/e2e/production-release.spec.ts` | Runs the dedicated R1–R6 4-tier production verification suite (36 tests) |
| **Desktop Only** | `pnpm exec playwright test tests/e2e/production-release.spec.ts --project=chromium-desktop` | Runs all 18 production tests on Desktop (1440x900) |
| **Mobile Only** | `pnpm exec playwright test tests/e2e/production-release.spec.ts --project=chromium-mobile` | Runs all 18 production tests on Mobile (390x844) |
| **Tier 1 (Feature Coverage)** | `pnpm exec playwright test tests/e2e/production-release.spec.ts --grep "Tier 1"` | Verifies happy paths for R1–R6 (12 tests) |
| **Tier 2 (Boundaries & Corners)** | `pnpm exec playwright test tests/e2e/production-release.spec.ts --grep "Tier 2"` | Verifies unauth/auth, seeking limits, breakpoints (16 tests) |
| **Tier 3 (Cross-Feature)** | `pnpm exec playwright test tests/e2e/production-release.spec.ts --grep "Tier 3"` | Verifies auth → stream → heartbeat → recs lifecycle (4 tests) |
| **Tier 4 (Real-World Scenarios)** | `pnpm exec playwright test tests/e2e/production-release.spec.ts --grep "Tier 4"` | Verifies full discovery-to-watch end-to-end journey (2 tests) |

*Note: Playwright automatically boots the Next.js production web server (`pnpm --filter @movie/web exec next start -p 3100`) and waits for `GET /api/v1/health` status 200 before executing tests.*

---

## 2. Requirement Coverage Summary (R1–R6)

The test suite directly implements the verification requirements from `ORIGINAL_REQUEST.md`:

| Requirement | Scope | Test Spec ID & Coverage | Status |
|---|---|---|:---:|
| **R1: English Localization & Bengali Removal** | 100% English experience across all major routes; zero Bengali script glyphs or script tags in rendered DOM. | `production-release.spec.ts: Tier 1 - R1`<br>Audits DOM tree via TreeWalker on `/`, `/search`, `/movies/the-last-monsoon`, `/watch/the-last-monsoon`, `/account`, `/collections`, `/genres/noir`, `/people`, `/people/amina-rahman`. | **TEST_READY** |
| **R2: Lawful Movie Catalog & Metadata** | Rich metadata (synopsis, cast, crew, ratings) via TMDb; graceful degradation when `OMDB_API_KEY` is not provided. | `production-release.spec.ts: Tier 1 - R2`<br>Audits catalogue on `/movies`, rich details on `/movies/the-last-monsoon`, verifies `#credits`, `#details`, Bayesian ratings, and zero uncaught console errors. | **TEST_READY** |
| **R3: Adaptive Video Player & Controls** | Video player on watch routes, responsive playback controls (play/pause, scrubber, resolution picker, volume/mute), and video/canvas fallback. | `production-release.spec.ts: Tier 1 - R3`<br>Navigates to `/watch/the-last-monsoon`, verifies IDLE stage, clicks play, verifies transport controls, video element, canvas fallback, and zero console errors. | **TEST_READY** |
| **R4: Backend Auth, Resume & Recommendations** | Register viewer, login credentials, session persistence, account page display, playback session authorization with resume timestamp. | `production-release.spec.ts: Tier 1 - R4` & `Tier 3`<br>Registers viewer, verifies `GET /api/v1/auth/session`, audits `/account` UI, authorizes playback session, issues 125s heartbeat, tests logout and relogin. | **TEST_READY** |
| **R5: Anti-Slop UI/UX & Accessibility** | Semantic CSS tokens (`bg-canvas`, `bg-surface-1`, `text-text`), no forbidden Tailwind palette (`bg-zinc-*`, `text-white`), no purple-blue gradients or emojis, hit targets >=44px mobile / >=24px desktop, zero overflow. | `production-release.spec.ts: Tier 1 - R5`, `Tier 2 - Breakpoints`, `Tier 2 - Mobile Touch Targets`<br>Evaluates DOM class lists, detects gradient utilities, audits touch bounding boxes, asserts `scrollWidth <= clientWidth`. | **TEST_READY** |
| **R6: Health Check Endpoint** | Production health check endpoint returns status 200, JSON payload, and `Cache-Control: no-store`. | `production-release.spec.ts: Tier 1 - R6`<br>Queries `GET /api/v1/health`, verifies status 200, `no-store` header, `nosniff`, `DENY`, and health check schema. | **TEST_READY** |

---

## 3. Test Architecture & Tier Breakdown

`tests/e2e/production-release.spec.ts` defines **18 distinct test scenarios** spanning **36 executions** across desktop and mobile browsers:

### Tier 1: Feature Coverage (Happy Paths)
1. `R1: Complete English localization with zero Bengali glyphs or script tags across major routes`
2. `R2: Movie catalog & details pages render rich metadata (synopsis, cast, crew, ratings) with graceful degradation`
3. `R3: Video player loads on watch route, displays responsive playback controls, and renders video/canvas fallback`
4. `R4: Backend user authentication flows: register, login, session persistence, and playback resume timestamp`
5. `R5: Anti-slop interactive styling, semantic CSS token compliance, touch target dimensions, and zero horizontal overflow`
6. `R6: Health check endpoint verification (GET /api/v1/health returns status 200)`

### Tier 2: Boundary & Corner Cases
7. `Unauthenticated vs Authenticated Account Viewport: guards sensitive session details`
8. `Video player seeking boundary conditions: handles 0s, forward seek, and clamped seeking gracefully`
9. `Stress-tests zero horizontal overflow at edge viewport width 360px on Home and Movie Details`
10. `Stress-tests zero horizontal overflow at edge viewport width 390px on Home and Movie Details`
11. `Stress-tests zero horizontal overflow at edge viewport width 768px on Home and Movie Details`
12. `Stress-tests zero horizontal overflow at edge viewport width 1440px on Home and Movie Details`
13. `Stress-tests zero horizontal overflow at edge viewport width 1920px on Home and Movie Details`
14. `Mobile viewport touch target bounding box audit (<768px): controls meet >= 44x44px`
15. `Authentication input validation boundaries: rejects password < 10 characters and malformed emails`

### Tier 3: Cross-Feature Combinations
16. `Cross-feature flow: Auth -> Playback Stream -> Heartbeat -> Personalized Recommendations`
17. `Reduced motion preference switch applies data-motion attribute and neutralizes animations`

### Tier 4: Real-World User Scenarios
18. `Complete discovery-to-watch user journey: Search -> Details -> Theater Playback -> Return`

---

## 4. Feature & Invariant Checklist

- [x] Opaque-box requirement-driven tests authored exclusively against public UI and API contracts.
- [x] Bengali glyph invariant strictly asserts zero Unicode matches `[\u0980-\u09FF]` and zero `[lang="bn"]` DOM elements.
- [x] Lawful streaming verification confirms DRM fail-closed policy, signed URL sessions, and legal attribution notices.
- [x] Playback controls verified: Play/Pause, timeline scrubber slider, resolution picker select, volume/mute button.
- [x] Backend authentication verified: Viewer registration, password hashing, session cookies, persistence, playback heartbeat tracking.
- [x] Anti-slop governance verified: Zero purple-blue gradients, zero decorative emojis, zero forbidden default Tailwind palette classes (`bg-zinc-*`, `text-white`, `bg-black`, `bg-gray-*`, `text-slate-*`).
- [x] Responsive accessibility verified: Touch targets >=44x44px on mobile (<768px) and >=24x24px on desktop; zero horizontal overflow across 360px, 390px, 768px, 1440px, 1920px.
- [x] Health check verified: `GET /api/v1/health` status 200 with security headers.
