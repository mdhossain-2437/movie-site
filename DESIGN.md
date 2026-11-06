# CINEVA — Theatrical Reddish Cinema-Crimson Design System (`DESIGN.md`)

**Version:** 4.1  
**Status:** Canonical Deploy-Ready Design Standard  
**Authority:** `AGENTS.md`, `apps/web/app/globals.css`, and `apps/web/styles/cinematic-graphite.tokens.css`  
**Brand Identity:** CINEVA (Platform architecture codename: Cinematic Graphite)  

---

## 1. Context and Goals

### 1.1 Mission & Vision
The **CINEVA** design system delivers an immersive, editorial cinema discovery and lawful media distribution interface inspired by the theatrical aesthetics of Netflix and IMAX exhibition. Grounded in the tactile physical language of archival 35mm celluloid film, fine typography, chiaroscuro lighting, and deep obsidian-crimson optics, it strictly rejects generic web SaaS tropes, arbitrary purple-blue web3/AI gradients, and playful emoji kits.

### 1.2 Target Audience & Product Surface
- **Audience**: Authenticated users, moviegoers, film archivists, and operators seeking high-definition legal movie streaming and curated archival catalogs.
- **Product Surface**: Responsive web application (`apps/web`), consumer detail showcase, streaming theater player, and operator administration surfaces.

### 1.3 Calibrated Taste Sliders
| Dimension | Rating | Description & Implementation |
|---|:---:|---|
| **BOLD** | **7 / 10** | High-contrast editorial display typography, multi-line headline hierarchy, commanding full-bleed hero stages, deep obsidian scrims, ruby rim highlights, and authoritative cinema-crimson accents (`#E50914`). |
| **MOTION** | **6 / 10** | Purposeful 120ms–240ms cinematic easing (`cubic-bezier(0.2, 0.7, 0.2, 1)`) on interactive film strips, hover glow elevation, and dock transitions. Strictly incorporates `prefers-reduced-motion: reduce` zero-motion overrides (`motion-reduce:transition-none`, `motion-reduce:transform-none`). |
| **DENSITY** | **5 / 10** | Balanced, comfortable spatial rhythm based on a 4px/8px modular grid. Generous breathing room on hero and showcase stages with crisp, compact information density in metadata pills and technical ledgers. |

---

## 2. Design Tokens and Foundations

### 2.1 Color Palette & Tokens
`apps/web/app/globals.css` explicitly resets Tailwind default colors with `--color-*: initial`. All styles use canonical CSS tokens defined in `cinematic-graphite.tokens.css`.

| Token Name | Value | Semantic Role & Optical Rationale |
|---|---|---|
| `--cg-graphite-950` / `bg-canvas` | `#000000` | Pitch cinema black base canvas (`color.surface.base`) |
| `--cg-graphite-900` / `bg-canvas-raised` | `#090909` | Raised black canvas, modal scrims, footers |
| `--cg-graphite-850` / `bg-surface-1` | `#141414` | Warm smoke charcoal cards, segmented dock bar, inputs |
| `--cg-graphite-800` / `bg-surface-2` | `#1E1E1E` | Elevated smoke surfaces, hover states, secondary controls |
| `--cg-graphite-750` / `bg-surface-3` | `#292929` | Active pressed surfaces, popovers |
| `--cg-graphite-700` / `border-border` | `#262626` | Primary smoke hairline border (1px) |
| `--cg-graphite-600` / `border-border-strong`| `#4A4642` | Focused and highlighted warm borders |
| `--cg-crimson-950` / `bg-ember-deep` | `#120203` | Obsidian-crimson abyss floor; deepest shadow in hero stages |
| `--cg-crimson-900` | `#220406` | Deep garnet under-stage scrim |
| `--cg-crimson-800` / `bg-ember-umbrage` | `#48080D` | Velvet burgundy shadow for theatrical lighting gradients |
| `--cg-crimson-700` | `#780D14` | Theatrical mid-shadow and active border highlight |
| `--cg-crimson-600` / `bg-ember` | `#B8141B` | Deep cinema red for pressed states and rich background cards |
| `--cg-crimson-500` / `text-accent` / `bg-accent` | `#E50914` | **Signature Cinema Crimson**: Primary brand mark, primary CTA, active indicators |
| `--cg-crimson-400` / `text-accent-hover` / `bg-ember-glow` | `#FF2A34` | Theatrical laser-red glow for hover states, focus rings, illumination veils |
| `--cg-crimson-300` | `#FF5C64` | High-contrast ruby rim light on chiaroscuro vector illustrations |
| `--cg-on-crimson` / `text-on-accent` | `#FFFFFF` | **Pure Cinema White Text**: High-contrast text on solid crimson badges/buttons (4.75:1) |
| `--cg-ivory-50` / `text-text` / `--cg-color-text` | `#FEF9EF` | **Warm Cinema Cream Text**: Primary titles and body copy (19.8:1 WCAG AAA on `#000000`) |
| `--cg-slate-200` / `text-text-secondary` | `#D8D3CC` | Warm silver secondary text, synopses, and metadata values (14.2:1) |
| `--cg-slate-400` / `text-text-muted` | `#8F8A83` | Warm muted captions, breadcrumbs, timestamps (7.1:1) |
| `--cg-crimson-glass` / `bg-bronze-glass` | `rgba(184, 20, 27, 0.48)` | Translucent theatrical glass disc for Play CTA and modals |
| `--cg-crimson-glow` | `rgba(229, 9, 20, 0.35)` | Volumetric ambient bloom for hero stages and hover elevation |
| `--cg-green-500` / `text-success` | `#3DD68C` | Authorized rights indicator (`Stream + Download`) |
| `--cg-amber-500` / `text-warning` | `#F59E0B` | Territorial restriction, review pending indicator |
| `--cg-red-500` / `text-danger` | `#F25F5C` | Takedown hold, DRM rejection, errors |
| `--cg-blue-500` / `text-info` | `#60A5FA` | Informational callouts |

### 2.2 Typography & Font Hierarchy
- **Display**: `font-display` (`neue-haas-grotesk-display`, `Manrope`, `Inter`, ui-sans-serif, system-ui, sans-serif). Reserved for monumental film titles, editorial headers, and oversized backdrop watermarks. Weight: `500` / `700`.
- **Body**: `font-sans` (`neue-haas-grotesk-display`, `Inter`, ui-sans-serif, system-ui, sans-serif). Base size: `16px` (`1rem`), base line-height: `1.5`, base weight: `500`.
- **Monospace**: `font-mono` (`Geist Mono`, ui-monospace, SFMono-Regular, Consolas, monospace). Reserved for technical metadata, runtimes (`2h 18m`), maturity ratings (`PG13`), dates, and session tokens.

### 2.3 Spacing Scale (4px Base Grid)
- `space.1`: `4px` (`0.25rem`) — micro-pill insets, badge padding.
- `space.2`: `8px` (`0.5rem`) — card gaps, compact pill margins.
- `space.3`: `12px` (`0.75rem`) — icon-to-label gaps, quick-action spacing.
- `space.4`: `16px` (`1rem`) — card interior gutters, mobile margins.
- `space.6`: `24px` (`1.5rem`) — section separators, desktop rail gaps.
- `space.8`: `32px` (`2rem`) — stage headers, grid row gaps.
- `space.12`: `48px` (`3rem`) — major layout boundaries.
- `space.16`: `64px` (`4rem`) — hero vertical breathing room.

### 2.4 Geometry & Radii
- `rounded-pill` (`999px`): Primary buttons, metadata pills, floating dock, quick-action rails.
- `rounded-sm` (`0.5rem` / `8px`): Content cards, form inputs.
- `rounded-md` (`0.75rem` / `12px`): Modal dialogs, player stage container.
- `rounded-xl` (`1.375rem` / `22px`): Backdrop illustrations, theater stage.

### 2.5 Atmospheric Film Grain & Halation Effects
- **35mm Celluloid Film Grain (`.art-grain`)**: Bespoke procedural SVG `<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />` blended at `opacity: 0.12` with `mix-blend-mode: soft-light`. Always configured with `pointer-events-none select-none overflow-hidden`.
- **Theatrical Vignette Halation (`.cinema-vignette`)**: Radial gradient from transparent center (`60%`) into obsidian-crimson (`rgba(18, 2, 3, 0.60)` at `100%`), evoking anamorphic cinema projection.

---

## 3. Component-Level Rules (7-State Specification)

Every interactive component across CINEVA must define explicit behavior across all 7 interaction states:
1. **Default**: Calibrated resting visual appearance.
2. **Hover**: Pointer hover feedback.
3. **Focus-Visible**: Keyboard-driven navigation indicator (2px outline with 3px offset in `--cg-focus-color` `#FF2A34`).
4. **Active**: Pressed/engaged state with haptic visual feedback.
5. **Disabled**: Non-interactive state (`opacity: 0.5`, `cursor: not-allowed`).
6. **Loading**: Asynchronous busy state (`aria-busy="true"`, accessible `<Spinner />`).
7. **Error**: Alert state with semantic tone (`border-danger`, `text-danger`).

### 3.1 Button Primitive (`apps/web/components/ui/button.tsx`)
- **Anatomy**: Bounding box, icon slot (optional), text label, spinner slot (async).
- **Variants**: `primary` (`bg-accent text-on-accent`), `secondary` (`bg-surface-2 text-text`), `outline` (`border-border-strong text-text`), `ghost` (`text-text-secondary`), `destructive` (`border-danger text-danger`).
- **7-State Matrix**:
  - *Default*: Solid background, crisp semantic text.
  - *Hover*: Lightens to `bg-accent-hover` (`#FF2A34` for primary) or `bg-surface-3`.
  - *Focus-Visible*: Outlined with `2px solid var(--cg-crimson-400)` and `3px` offset.
  - *Active*: Darkens to `bg-accent-pressed` (`#B8141B` for primary).
  - *Disabled*: `opacity: 0.5`, `cursor: not-allowed`, pointer events suppressed.
  - *Loading*: Displays `<Spinner size="sm" />`, text remains visible, `aria-busy="true"`, `disabled="true"`.
  - *Error*: Border transitions to `border-danger`, screen reader alert announced.
- **Interaction Behavior**:
  - *Keyboard*: Activates on `Enter` and `Space`.
  - *Pointer*: 120ms color transition; motion-reduced fallback cancels transition.
  - *Touch*: Hit target bounding box `>= 44x44px` on mobile (`min-h-11`).

### 3.2 Vertical Film Strip Showcase (`apps/web/components/catalogue/film-strip-showcase.tsx`)
- **Anatomy**: 7 vertical columns on desktop, horizontal snap carousel on mobile, centered breadcrumb, lower backdrop watermark typography.
- **7-State Matrix**:
  - *Default*: 35mm silver-halide monochrome art (`bg-surface-1`, `border-border/80`).
  - *Hover*: Elevates `-translate-y-1.5`, blooms with crimson shadow `hover:shadow-[0_18px_44px_rgba(229,9,20,0.32)]`, reveals crimson illumination veil (`from-ember/45 via-ember-glow/20`) and slide-up story metadata.
  - *Focus-Visible*: Card ring highlights with `ring-1 ring-accent`, triggers same reveal as hover.
  - *Active*: Scale softens slightly (`scale-[1.02]`).
  - *Disabled*: Not applicable (catalogue items are navigational).
  - *Loading*: Skeleton shimmer rendered during data prefetch.
  - *Error*: Fallback poster card with error badge if title metadata fails.
- **Interaction Behavior**:
  - *Keyboard*: `Tab` traverses between cards sequentially, `Enter` navigates to `/movies/[slug]`.
  - *Pointer*: Hover reveals full title and metadata in 240ms cinematic easing.
  - *Touch*: Horizontal swipe with CSS scroll-snap (`snap-x snap-mandatory`).

### 3.3 Theatrical Title Hero Stage (`apps/web/components/catalogue/title-hero-stage.tsx`)
- **Anatomy**: `CinemaCrimsonHeroBackdrop` full-bleed procedural SVG, monumental multi-line title, Bengali subtitle, white-on-crimson CINEVA brand pill, center circular Play CTA disc (`bg-crimson-glass`), right-edge floating quick-action rail, and 5 structured metadata pills.
- **7-State Matrix (Play CTA Disc)**:
  - *Default*: `bg-crimson-glass` with `border-accent/50` hairline and SVG play symbol.
  - *Hover*: Scales up `scale-105` with `hover:shadow-[0_0_36px_rgba(229,9,20,0.40)]` and `border-accent`.
  - *Focus-Visible*: Outlined with `2px solid var(--cg-crimson-400)` with `outline-offset-4`.
  - *Active*: Presses down `scale-[0.98]`.
  - *Disabled (Unavailable)*: Locks disc with `cursor-not-allowed`, renders lock icon and unavailability territory notice.
  - *Loading*: Renders circular spinner inside disc during playback token verification.
  - *Error*: Renders error badge if session rights fail.
- **Interaction Behavior**:
  - *Keyboard*: `Tab` accesses Play CTA, quick-action rail buttons, and breadcrumbs.
  - *Pointer*: 240ms ease-standard transitions on CTA scale and shadow.
  - *Touch*: Minimum bounding box `88x88px` on mobile (`h-22 w-22`), comfortably exceeding 44px.

### 3.4 Signature Floating Dock (`apps/web/components/layout/floating-dock.tsx`)
- **Anatomy**: Floating horizontal capsule (`bg-canvas/90 backdrop-blur-md`), Crimson CINEVA brand tile, segmented smoke-charcoal navigation bar (`Films`, `Collections`), Watchlist tile with crimson notification dot, Quick Search trigger (Ctrl+K), and Account tile.
- **7-State Matrix**:
  - *Default*: Smoke-charcoal surfaces (`bg-surface-1`, `text-text-secondary`).
  - *Hover*: Elevates surface to `bg-surface-2`, text brightens to `text-text`.
  - *Focus-Visible*: Focus ring `outline-accent` with `2px` offset.
  - *Active / Current Page*: Highlights active tab with `bg-surface-2 text-text` or `border-accent/60`.
  - *Disabled*: Disabled navigation items show dimmed indicator.
  - *Loading*: Search icon transitions to mini-spinner during index fetch.
  - *Error*: Gracefully degrades to basic links if JavaScript fails.
- **Interaction Behavior**:
  - *Keyboard*: `Tab` navigates through all 6 segments; `Enter` activates links; `Ctrl+K` triggers quick search command palette.
  - *Pointer*: Smooth 180ms hover transition.
  - *Touch*: Every item enforces `min-h-11 min-w-11` (>=44x44px).

### 3.5 Video Player Shell (`apps/web/components/player/video-player-shell.tsx`)
- **Anatomy**: Responsive video viewport, obsidian-crimson idle state overlay, entitlement verification spinner, native timeline scrubber slider (`accent-accent`), playback controls, and fail-closed error dialogs.
- **7-State Matrix**:
  - *Default (Idle)*: Obsidian-crimson gradient overlay with "Watch Film" primary button.
  - *Authorizing (Loading)*: `<Spinner size="lg" className="text-accent" />` spinning while verifying scoped token and DRM.
  - *Playing (Active)*: Video streams with auto-hiding controls; captions preview displayed.
  - *Paused*: Controls remain pinned, playback resumes on click/space.
  - *Scrubbing (Hover/Focus)*: Scrubber slider thumb highlights in crimson (`#FF2A34`).
  - *Disabled*: Disabled when revoked or unauthorized.
  - *Error / Revoked*: Fail-closed security card (`Badge tone="danger"`), retry and back buttons.
- **Interaction Behavior**:
  - *Keyboard*: `Space` toggles play/pause, `Left`/`Right` arrow keys scrub timeline, `M` mutes.
  - *Pointer*: Click on player viewport toggles playback.
  - *Touch*: Full-width scrub bar with `min-h-11` touch target.

---

## 4. Accessibility Requirements & Testable Criteria (WCAG 2.2 AA)

1. **Touch Target Dimensions**:
   - **Mobile Viewports (< 768px)**: Every interactive element (buttons, floating dock links, quick rail actions, modal close triggers, select menus) **must** maintain an explicit minimum computed bounding box of **>= 44x44px** (`min-h-11 min-w-11`).
   - **Desktop Viewports (>= 768px)**: Minimum interactive hit target size **must** be **>= 24x24px**, with standard controls targeting **>= 36px**.
   - *Testable Verification*: Verified via Playwright bounding-box assertions in `tests/e2e/challenger-m2.spec.ts` across `360px`, `390px`, `430px`, and `1440px`.
2. **Contrast Ratio Compliance**:
   - Primary foreground text (`#FEF9EF`) on base canvas (`#000000`) **must** meet or exceed **19.8:1** (WCAG AAA).
   - Secondary text (`#D8D3CC`) on base canvas (`#000000`) **must** meet or exceed **14.2:1** (WCAG AAA).
   - Muted text (`#8F8A83`) on base canvas (`#000000`) **must** meet or exceed **7.1:1** (WCAG AA).
   - Pure white text (`#FFFFFF`) on Signature Cinema Crimson (`#E50914`) **must** achieve **4.75:1** (WCAG AA standard).
   - *Testable Verification*: Programmatic contrast ratio formulas verified in automated test suite.
3. **Horizontal Overflow Immunity**:
   - `scrollWidth <= clientWidth` **must** hold on both `document.documentElement` and `document.body` across all viewports from 360px to 1920px.
   - All atmospheric backdrops and decorative watermarks **must** include `pointer-events-none select-none overflow-hidden`.
   - *Testable Verification*: Automated Playwright evaluation across 8 breakpoints (`[360, 390, 430, 768, 1024, 1280, 1440, 1920]`).
4. **Motion-Reduce Safeguards**:
   - All interactive transitions and SVG transforms **must** specify explicit `motion-reduce:transition-none` and `motion-reduce:transform-none` fallbacks.
   - Global stylesheet **must** include `@media (prefers-reduced-motion: reduce)` zero-duration reset.
5. **Asynchronous Feedback & Focus**:
   - Every async action **must** present an accessible `<Spinner />` with `role="status"` and visually hidden text (`sr-only`).
   - Active async controls **must** set `aria-busy="true"` and `disabled`.
   - All interactive controls **must** display visible focus rings (`--cg-focus-color: #FF2A34`, 2px width, 3px offset).
6. **Viewport Scaling**:
   - Viewport meta tags **must not** disable user scaling (`user-scalable=no` and `maximum-scale=1` are strictly prohibited).

---

## 5. Content and Tone Standards

### 5.1 Voice and Tone
- **Concise, Confident, Archival**: The interface speaks with editorial authority and clarity. Descriptions focus on cinema history, artistic pedigree, and verified licensing facts.
- **Zero Clickbait**: Never use sensationalized marketing phrasing, fake timers, or artificial urgency badges.
- **Lawful & Transparent**: Rights badges explicitly convey verified legal status (`Stream + Download`, `Stream Only`, `Rights Restricted`).

### 5.2 Microcopy Examples
- *Primary Action*: "Watch Film", "Watch Now", "Explore Movies".
- *Secondary Action*: "Download Film", "Film Details", "Cast & Filmmakers".
- *Async Pending*: "Verifying Entitlement & Rights Ledger…", "Issuing playback token…".
- *Fail-Closed Alert*: "Playback Unavailable (Fail-Closed Policy) — Not licensed for streaming in BD".

---

## 6. Anti-Patterns and Prohibited Implementations

The following implementations are strictly prohibited across the codebase:

1. **❌ Default Tailwind Palette Leakage**: Never use Tailwind default classes (`bg-zinc-*`, `text-white`, `bg-black`, `bg-gray-*`, `text-slate-*`). Always use approved semantic tokens (`bg-canvas`, `bg-surface-1`, `text-text`, `text-accent`).
2. **❌ Purple-Blue Web3/AI Gradients**: Never use purple, violet, indigo, magenta, or cyan text or background gradients.
3. **❌ Emoji Badges or Feature Tiles**: Never render emojis (e.g. 🎬, 🍿, 🚀, 🔒). Use clean bespoke SVGs.
4. **❌ Fake Third-Party Ratings or Logos**: Never render IMDb rating badges, Rotten Tomatoes emblems, or unverified studio trademarks.
5. **❌ Color-Only State Communication**: Never convey status solely through color. Every badge must pair an SVG glyph or geometric mark (`✓`, `▲`, `✕`, `●`, `ℹ`, `◆`) with a text label.
6. **❌ External Raster Images or Remote CDN Calls**: Never fetch images from unauthenticated external scraping CDNs. Key art is procedurally generated with inline SVGs and authentic 35mm grain.
7. **❌ Hidden Focus Rings**: Never remove outline with `outline-none` without pairing with `focus-visible:outline-accent`.

---

## 7. Quality Assurance (QA) Checklist

Every frontend feature, layout, and component release must be verified against this checklist before merging:

### Must-Pass Quality Gates (Non-Negotiable)
- [ ] **Must** pass `pnpm format:check` with zero Prettier formatting warnings.
- [ ] **Must** pass `pnpm lint` with zero ESLint errors in `@movie/web`.
- [ ] **Must** pass `pnpm typecheck` with zero TypeScript errors across all workspace packages.
- [ ] **Must** pass `pnpm test` (Vitest unit, contract, and DAL suites) with 100% pass rate.
- [ ] **Must** pass `APP_ENV=test pnpm build` (Next.js 16 production build) with zero errors.
- [ ] **Must** enforce computed touch target bounding boxes `>= 44x44px` on mobile (<768px) and `>= 24x24px` on desktop.
- [ ] **Must** enforce zero horizontal overflow (`scrollWidth <= clientWidth`) across 360px–1920px viewports.
- [ ] **Must** enforce `motion-reduce:transition-none` and `motion-reduce:transform-none` on all animated elements.
- [ ] **Must** achieve WCAG 2.2 AA contrast compliance (4.75:1 for crimson badges, 19.8:1 for `#FEF9EF` text).
- [ ] **Must** verify zero default Tailwind classes (`bg-zinc-*`, `text-white`, `bg-black`, `bg-gray-*`).

### Should-Pass Quality Recommendations (Best Practices)
- [ ] **Should** provide localized Bengali typography (`font-display`, `lang="bn"`) for all titles with verified Bengali metadata.
- [ ] **Should** maintain 35mm grain overlay opacity between `0.10` and `0.14` for optimal cinematic ambiance.
- [ ] **Should** display asynchronous loading spinner within 100ms of any async button click.
- [ ] **Should** preserve 7-column vertical layout on desktop viewports and smooth horizontal snap on mobile.
