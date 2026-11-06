---
trigger: always_on
description: "Frontend design engineering rules, token constraints, taste calibration, anti-slop governance, and accessibility standards for Cinematic Graphite."
---

# Frontend Design Engineering Rules (`frontend-design-engineering.md`)

These rules are canonical for all frontend and UI engineering work across `Cinematic Graphite` (`d:\movie-site`). They are grounded directly in `d:\movie-site\DESIGN.md` and `apps/web/app/globals.css`. Every frontend component, layout, page, and test must conform to these principles without exception.

---

## 1. Taste Calibration Sliders

Every visual component and layout must align with the calibrated taste parameters:

| Dimension | Calibration | Architectural Requirements |
|---|:---:|---|
| **BOLD** | **7 / 10** | High-contrast editorial display typography (`font-display`), multi-line title hierarchy, commanding full-bleed hero stages, deep obsidian scrims, authoritative warm-gold accents (`#D8B36A`), and authentic localized typography (including Bengali script). |
| **MOTION** | **6 / 10** | Purposeful 120ms–240ms cinematic easing (`cubic-bezier(0.2, 0.7, 0.2, 1)`) on interactive film strips, hover glow elevation, and floating dock transitions. **Mandatory zero-motion fallback**: Every transition and transform must honor `prefers-reduced-motion: reduce` via `motion-reduce:transition-none` and `motion-reduce:transform-none`. |
| **DENSITY** | **5 / 10** | Balanced, comfortable spatial rhythm based on a 4px/8px modular grid. Generous breathing room on hero and showcase stages with compact, high-precision information density in metadata pills and technical ledgers. |

---

## 2. Token Architecture & Tailwind Palette Constraint

`apps/web/app/globals.css` explicitly resets Tailwind default colors with `--color-*: initial`.
**Default Tailwind palette utility classes (e.g., `bg-zinc-*`, `text-white`, `bg-black`, `bg-gray-*`, `text-slate-*`) DO NOT EXIST.**

### 2.1 Approved Semantic Color Tokens
Only the following semantic CSS token utilities may be used in component markup:

- **Canvas & Backgrounds**:
  - `bg-canvas` (`#000000`): Pitch cinema black base canvas.
  - `bg-canvas-raised` (`#090909`): Raised black canvas, footers, modal backdrops.
  - `bg-surface-1` (`#141414`): Warm smoke charcoal cards, segmented dock, inputs.
  - `bg-surface-2` (`#1E1E1E`): Elevated smoke surfaces, hover states, secondary controls.
  - `bg-surface-3` (`#292929`): Active pressed surfaces, popovers.
- **Borders**:
  - `border-border` (`#262626`): Primary smoke hairline border (1px).
  - `border-border-strong` (`#4A4642`): Focused and highlighted warm borders.
  - `border-accent` (`#F5C518`): Vibrant Cinema Gold accent highlights.
- **Brand, Solar Stage & Accents**:
  - `text-accent`, `bg-accent`, `border-accent` (`#F5C518`): Vibrant Cinema Gold brand accent.
  - `text-on-accent` (`#0A0A0A`): High-contrast dark ink on solid gold badges.
  - `bg-ember` (`#D95B16`), `bg-ember-glow` (`#F29F24`), `bg-ember-deep` (`#1A0601`), `bg-bronze-glass`: Full-bleed Solar Amber & Burnt Sienna hero stage palette.
- **Typography & Foreground**:
  - `text-text` (`#FFFFFF`): Pure cinema ivory primary titles and body (`21:1` on `#000000`).
  - `text-text-secondary` (`#D8D3CC`): Warm silver synopses and metadata values.
  - `text-text-muted` (`#8F8A83`): Warm muted breadcrumbs, timestamps, captions.
- **State & Rights Indicators**:
  - `text-success`, `bg-success/15`, `border-success/30` (`#49C69A`): Authorized rights (`Stream + Download`).
  - `text-warning`, `bg-warning/15`, `border-warning/30` (`#F0B85F`): Territorial restriction or review.
  - `text-danger`, `bg-danger/15`, `border-danger/30` (`#F16B73`): Takedown, DRM rejection, errors.
  - `text-info`, `bg-info/15`, `border-info/30` (`#73A9F4`): Dev fixture tags, informational callouts.

### 2.2 Typography Hierarchy
- `font-display`: Reserved for editorial titles, section heads, and watermark backdrops.
- `font-sans`: Optimized for legible synopses, navigation, and body copy.
- `font-mono`: Reserved for technical metadata, runtimes (`2h 18m`), maturity ratings (`PG13`), dates, and hashes.

---

## 3. Anti-Slop Governance (Strict Prohibitions)

1. **Zero Purple-Blue Gradient Headlines**: Never use arbitrary web3/AI purple-blue, magenta, or neon gradients. All typography must use semantic ivory (`text-text`), muted slate (`text-text-secondary`), or warm gold (`text-accent`).
2. **Zero Emoji Feature Tiles**: Never use emojis as functional icons or decorative badges (e.g. 🎬, 🍿, 🚀, 🔒). All iconography must be clean, bespoke SVGs (1.5–2px stroke, round caps/joins).
3. **Zero Fake Copyright / Rating Badges**: Never render IMDb rating badges, Rotten Tomatoes splats, Warner Bros. shield logos, or unverified copyrighted film assets. All badges represent verifiable rights states (`Stream + Download`, `Stream Only`, `Rights Restricted`).
4. **Zero State Conveyed by Color Alone**: Every badge, status indicator, and prompt must pair a distinct SVG glyph or geometric symbol with an explicit text label for colorblind accessibility (WCAG 1.4.1).
5. **Zero External Raster Images / Remote URLs**: Never load images from external unauthenticated CDNs or third-party scraper hosts.

---

## 4. Accessibility & Touch Standards (WCAG 2.2 AA)

1. **Touch Target Dimensions**:
   - **Mobile Viewports (< 768px)**: Every interactive element (buttons, floating dock links, quick rail actions, modal close triggers, select menus) must maintain an explicit minimum bounding box of **>= 44x44px** (`min-h-11 min-w-11`).
   - **Desktop Viewports (>= 768px)**: Minimum interactive hit target size is **>= 24x24px**, with standard controls targeting **>= 36px**.
2. **Viewport Scaling**:
   - `user-scalable=no` and `maximum-scale=1` are strictly prohibited in HTML viewport meta tags. Users must always be permitted to zoom up to 200%.
3. **Contrast Compliance**:
   - Contrast ratio between text and background must meet or exceed WCAG 2.2 AA (4.5:1 for body copy, 3:1 for large display text).
   - `#F4F6F8` on `#080A0D` achieves **18.2:1** contrast ratio.
   - `#D8B36A` on `#080A0D` achieves **10.5:1** contrast ratio.
4. **Asynchronous Feedback**:
   - Every async form submission, search query, or button state must render an explicit, accessible `<Spinner />` with `role="status"` and visually hidden text (`sr-only`).
   - Async buttons must transition to `aria-busy="true"` and `disabled` while pending.
5. **Horizontal Overflow Immunity**:
   - Every page and component must maintain `scrollWidth <= clientWidth` on `document.documentElement` and `document.body` across all viewports from 360px to 1920px.
   - Backdrop watermarks and absolute positioned decorative elements must be contained with `overflow-hidden` and `pointer-events-none`.

---

## 5. Closed-Loop Visual QA Protocol

Before declaring any frontend work complete:
1. Run Playwright across both Desktop (1440x900) and Mobile (390x844) viewports.
2. Programmatically verify bounding box dimensions for interactive controls (`>=24px` desktop, `>=44px` mobile).
3. Verify zero console errors, zero layout shifts, and zero horizontal scrollbars.
4. Capture high-fidelity screenshots for regression tracking and review.
