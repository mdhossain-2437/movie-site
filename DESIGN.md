# CINEVA — Cinema Noir & Solar Amber Design System (`DESIGN.md`)

**Version:** 3.0  
**Status:** Canonical Deploy-Ready Design Standard  
**Authority:** `AGENTS.md`, `apps/web/app/globals.css`, and `apps/web/styles/cinematic-graphite.tokens.css`  
**Brand Identity:** CINEVA (Platform architecture codename: Cinematic Graphite)  

---

## 1. Executive Summary & Design Philosophy

The **Cinematic Graphite** design system delivers an immersive, editorial cinema discovery and lawful media distribution interface. Grounded in the tactile physical language of archival 35mm film exhibition, fine typography, and dark-room optics, it strictly rejects generic web SaaS tropes, AI-generated generic gradients, and playful emoji kits.

### Calibrated Taste Sliders
| Dimension | Rating | Description & Implementation |
|---|:---:|---|
| **BOLD** | **7 / 10** | High-contrast editorial display typography, multi-line headline hierarchy, commanding full-bleed hero stages, deep obsidian scrims, and authoritative warm-gold accents (`#D8B36A`). |
| **MOTION** | **6 / 10** | Purposeful 120ms–240ms cinematic easing (`cubic-bezier(0.2, 0.7, 0.2, 1)`) on interactive film strips, hover glow elevation, and dock transitions. Strictly incorporates `prefers-reduced-motion: reduce` zero-motion overrides (`motion-reduce:transition-none`, `motion-reduce:transform-none`). |
| **DENSITY** | **5 / 10** | Balanced, comfortable spatial rhythm based on a 4px/8px modular grid. Generous breathing room on hero and showcase stages with crisp, compact information density in metadata pills and technical ledgers. |

---

## 2. Anti-Slop Governance (Strict Prohibitions)

To maintain an uncompromised cinematic aesthetic, the following patterns are **permanently prohibited**:

1. **Zero Purple-Blue Gradient Headlines**: Never use arbitrary web3/AI purple-blue, neon pink, or iridescent text gradients. All typography must use semantic ivory (`text-text`, `#F4F6F8`), muted slate (`text-text-secondary`, `#B2BBC7`), or warm-gold accents (`text-accent`, `#D8B36A`).
2. **Zero Emoji Feature Tiles**: Never use emojis as functional icons or decorative badges (e.g., 🎬, 🍿, 🚀, 🔒). All iconography must be bespoke, accessible SVGs (stroke width 1.5–2px, round caps and joins).
3. **Zero Default Palette Utilities**: Tailwind default colors (`bg-zinc-*`, `text-white`, `bg-black`, `bg-gray-*`, `text-slate-*`) are wiped (`--color-*: initial`). All styling must use semantic tokens (`bg-canvas`, `bg-surface-1`, `border-border`, etc.).
4. **Zero Copyright / IMDb Infringements**: Never render fake IMDb rating badges, Warner Bros. logos, or unverified copyrighted film art. All badges represent verifiable rights states (`Stream + Download`, `Stream Only`, `Rights Restricted`).
5. **Zero State Conveyed by Color Alone**: Every badge, status indicator, and prompt must pair a distinct SVG glyph or geometric symbol with an explicit text label for colorblind accessibility.

---

## 3. Token Architecture (`apps/web/app/globals.css`)

### 3.1 Color Primitives & Semantic Mapping

| Token Name | Hex Value | Semantic Usage |
|---|---|---|
| `--cg-graphite-950` / `bg-canvas` | `#000000` | Pitch cinema black base page background, showcase stage |
| `--cg-graphite-900` / `bg-canvas-raised` | `#090909` | Raised black canvas, footers, modal scrims |
| `--cg-graphite-850` / `bg-surface-1` | `#141414` | Warm smoke charcoal cards, segmented dock bar, inputs |
| `--cg-graphite-800` / `bg-surface-2` | `#1E1E1E` | Elevated smoke surfaces, hover states, secondary controls |
| `--cg-graphite-750` / `bg-surface-3` | `#292929` | Active pressed surfaces, popovers |
| `--cg-graphite-700` / `border-border` | `#262626` | Primary smoke hairline border (1px) |
| `--cg-graphite-600` / `border-border-strong` | `#4A4642` | Focused and highlighted warm borders |
| `--cg-gold-500` / `text-accent` / `bg-accent` | `#F5C518` | Vibrant Cinema Gold brand badge & primary highlight |
| `--cg-gold-400` / `text-accent-hover` | `#FFD43B` | Interactive hover gold glow |
| `--cg-gold-600` / `text-accent-pressed` | `#D9A700` | Pressed/active gold state |
| `--cg-on-gold` / `text-on-accent` | `#0A0A0A` | High-contrast ink on `#F5C518` gold badges |
| `--cg-ember-600` / `bg-ember` | `#D95B16` | Blazing Solar Amber hero stage core |
| `--cg-ember-400` / `bg-ember-glow` | `#F29F24` | Golden-hour ochre solar dome rim |
| `--cg-ivory-50` / `text-text` | `#FFFFFF` | Pure cinema ivory primary headlines & body |
| `--cg-slate-200` / `text-text-secondary` | `#D8D3CC` | Warm silver secondary text & synopses |
| `--cg-slate-400` / `text-text-muted` | `#8F8A83` | Warm muted captions, breadcrumbs, timestamps |
| `--cg-green-500` / `text-success` | `#3DD68C` | Stream/Download authorized, verified states |
| `--cg-amber-500` / `text-warning` | `#F59E0B` | Pending review, regional warning |
| `--cg-red-500` / `text-danger` | `#F25F5C` | Takedown hold, DRM rejection, critical errors |
| `--cg-blue-500` / `text-info` | `#60A5FA` | Informational callouts |

### 3.2 Typography Hierarchy

- **Display**: `font-display` (Manrope / Cormorant Garamond aesthetic). Reserved for film titles, section headers, and oversized backdrop watermarks.
- **Body**: `font-sans` (Inter). Optimized for legible synopses, forms, and navigation items.
- **Monospace**: `font-mono` (Geist Mono). Reserved for technical metadata, time codes (`2h 18m`), maturity ratings (`PG13`), dates, and case numbers.

### 3.3 Geometry & Radii
- Pill radius: `rounded-pill` (`999px`) — buttons, metadata pills, floating dock, quick-action rails.
- Small radius: `rounded-sm` (`0.5rem`) — cards, form inputs.
- Medium/Large: `rounded-md` (`0.75rem`) to `rounded-lg` (`1rem`) — modal dialogs, player stage.

---

## 4. Accessibility & Touch Standards (WCAG 2.2 AA)

1. **Touch Targets**:
   - **Mobile Viewports (< 768px)**: Every interactive element (buttons, floating dock links, quick rail actions, modal close targets, dropdowns) must maintain an explicit minimum bounding box of **>= 44x44px** (`min-h-11 min-w-11`).
   - **Desktop Viewports (>= 768px)**: Minimum interactive hit target size is **>= 24x24px**, with standard controls targeting **>= 36px**.
2. **Viewport Scaling**:
   - `user-scalable=no` and `maximum-scale=1` are strictly prohibited in HTML viewport meta tags.
3. **Contrast Compliance**:
   - Text pairings must meet or exceed WCAG 2.2 AA (4.5:1 for body copy, 3:1 for large display text).
   - `#F4F6F8` on `#080A0D` achieves **18.2:1** contrast ratio.
   - `#D8B36A` on `#080A0D` achieves **10.5:1** contrast ratio.
4. **Asynchronous Feedback**:
   - Every async form submission, search query, or button state must render an explicit, accessible `<Spinner />` with `role="status"` and visually hidden text (`sr-only`). Buttons transition to `aria-busy="true"` and `disabled`.

---

## 5. Signature Component Architecture

### 5.1 Interactive Vertical Film-Strip Showcase Stage (`film-strip-showcase.tsx`)
- **Breadcrumb**: Centered path (`Main > Films > [Director / Collection Name]`).
- **Desktop 7-Panel Strip**: 7 vertical columns (`min-h-[520px]`) side-by-side.
  - *Resting State*: Muted graphite treatment (`bg-surface-1`, `border-border/80`, low saturation procedural key art).
  - *Hover/Focus State*: Smooth scale elevation (`scale-[1.03] z-10`), warm-gold border illumination (`border-accent shadow-[0_0_24px_rgba(216,179,106,0.25)]`), rich procedural color reveal, bottom synopsis & year reveal.
  - *Reduced Motion*: Instant transition without transform easing (`motion-reduce:transition-none`).
- **Mobile Snap Carousel**: Below 768px, gracefully transitions to a horizontal snap carousel (`snap-x snap-mandatory overflow-x-auto`) with touch gesture support.
- **Lower Backdrop Watermark**: Giant display typography (`opacity-[0.06] font-display pointer-events-none select-none overflow-hidden`) anchored across the lower backdrop with zero horizontal overflow.

### 5.2 Full-Bleed Atmospheric Title Detail Hero (`title-hero-stage.tsx`)
- **Atmospheric Scrim**: Procedural obsidian-to-amber radial glow fading into `#080A0D`.
- **Dual Title Typography**: Giant multi-line English title (`text-4xl sm:text-6xl lg:text-7xl font-bold`) paired with an authentic localized Bengali title (`text-xl sm:text-2xl text-text-secondary`) when available.
- **Top-Right Availability**: Concise synopsis with lawful `AvailabilityBadge` (`Stream + Download`, `Stream Only`, `Rights Restricted`).
- **Center Translucent Play CTA**: Circular glass disc (`min-h-16 min-w-16`, warm-gold accent ring, SVG play symbol) linking to `/watch/[slug]` when streaming rights are approved.
- **Bottom-Left Metadata Pills**: Monospace pills with Country, Licensor / Studio, Runtime, Release Year, and Maturity Rating in crisp hairline borders (`border-border bg-surface-1/80`).
- **Right-Edge Floating Quick-Action Rail**: Vertically stacked Download, Details, and Trailer actions with SVG icons, tooltip labels, and `>= 44x44px` hit targets safely contained without viewport overflow.

### 5.3 Signature Floating Bottom Dock (`floating-dock.tsx`)
- **Container**: Centered floating pill (`fixed bottom-5 left-1/2 -translate-x-1/2 z-30 bg-surface-1/90 backdrop-blur-md border border-border shadow-2xl rounded-pill px-4 py-2`).
- **Navigation Controls**: Warm-gold `BrandMark` aperture emblem, links to Films, Collections, Watchlist, Operations/Admin, Quick Search modal trigger (Ctrl+K), and Account profile.
- **App Shell Inset**: Root layout applies `pb-28` to ensure page content, buttons, and legal footer links are never obscured by the dock.
