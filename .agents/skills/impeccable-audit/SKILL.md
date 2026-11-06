---
name: impeccable-audit
description: Comprehensive visual, design, and accessibility audit skill for web applications. Verifies color contrast, responsive typography, viewport overflow, touch target bounding boxes, focus indicators, and semantic token usage.
---

# Impeccable Audit (`impeccable-audit`)

Use this skill to perform rigorous, multi-point visual, design system, and WCAG 2.2 AA accessibility audits across modern web applications, specifically calibrated for Cinematic Graphite platforms.

---

## Audit Dimensions & Checklists

### 1. Semantic Token & Palette Integrity
- **Zero Default Tailwind Palette**: Confirm `--color-*: initial` is respected. Search markup for unapproved utilities:
  - Reject: `bg-zinc-*`, `text-white`, `bg-black`, `bg-gray-*`, `text-slate-*`, `border-neutral-*`.
  - Enforce: `bg-canvas`, `bg-canvas-raised`, `bg-surface-1`, `bg-surface-2`, `bg-surface-3`, `border-border`, `border-border-strong`, `border-accent`, `text-text`, `text-text-secondary`, `text-text-muted`, `text-accent`, `text-success`, `text-warning`, `text-danger`, `text-info`.
- **Anti-Slop Visual Governance**:
  - Verify zero purple-blue/magenta/neon gradient headlines or buttons.
  - Verify zero decorative or functional emojis (e.g. 🎬, 🍿, 🚀). SVGs with clean geometric paths only.
  - Verify zero fake copyright or third-party rating emblems (e.g. IMDb badges, Rotten Tomatoes).
  - Verify badges convey meaning through both SVG glyphs and clear text labels (never color alone).

### 2. Touch Targets & Hit Dimensions (WCAG 2.2 SC 2.5.8)
- **Mobile Viewports (< 768px)**:
  - Every interactive control (buttons, links, floating dock items, modal close triggers, tabs, quick-action rails) must measure **>= 44x44px** in computed bounding box (`min-h-11 min-w-11`).
  - Minimum spacing: Ensure at least 8px separation between adjacent touch targets.
- **Desktop Viewports (>= 768px)**:
  - Every interactive control must measure **>= 24x24px** minimum hit size, with primary interactive controls targeting **>= 36px**.
- **Viewport Scaling**:
  - Ensure `<meta name="viewport">` does not contain `user-scalable=no` or `maximum-scale=1`. Users must be free to zoom up to 200%.

### 3. Viewport & Horizontal Overflow Immunity
- **Document Boundary Rule**:
  - `document.documentElement.scrollWidth <= window.innerWidth` across all viewports (360px, 390px, 430px, 768px, 1024px, 1280px, 1440px, 1920px).
  - `document.body.scrollWidth <= window.innerWidth`.
- **Backdrop & Decorative Containment**:
  - Verify oversized typography watermarks, radial gradient scrims, and decorative canvas elements are clipped using `overflow-hidden` with `pointer-events-none`.

### 4. Color Contrast Compliance (WCAG 2.2 SC 1.4.3 / 1.4.11)
- **Contrast Ratios**:
  - Body text (`text-text`, `#F4F6F8`) on canvas (`#080A0D`): **18.2:1** (exceeds 4.5:1 AA threshold).
  - Secondary text (`text-text-secondary`, `#B2BBC7`) on canvas: **8.6:1** (exceeds 4.5:1 AA threshold).
  - Accent text/borders (`text-accent`, `#D8B36A`) on canvas: **10.5:1** (exceeds 4.5:1 AA threshold).
  - Interactive component boundaries and graphical objects: Minimum **3:1** against adjacent background.

### 5. Focus Indicators & Keyboard Navigation (WCAG 2.2 SC 2.4.7 / 2.4.11)
- Every interactive element must display an unambiguous focus indicator upon keyboard navigation (`focus-visible:ring-2 focus-visible:ring-accent` or `focus-visible:outline-accent`).
- Modal dialogs (such as Quick Search) must trap focus inside the modal and release focus upon Esc or close.
- Skip links or top-level landmark navigation must be accessible.

### 6. Asynchronous State Feedback & Loading Indicators
- Every asynchronous action (form submission, rights evaluation, live search, session generation) must provide immediate feedback.
- Buttons must display an explicit `<Spinner />` with `role="status"` and accessible `sr-only` description.
- Pending buttons must have `aria-busy="true"` and `disabled` attribute set during network requests.

### 7. Motion & Accessibility (WCAG 2.2 SC 2.3.3)
- Check that `@media (prefers-reduced-motion: reduce)` is respected across all transitions, keyframe animations, and transforms (`motion-reduce:transition-none motion-reduce:transform-none`).

---

## Execution Runbook

When performing an impeccable audit on a route:
1. Load page in Playwright or browser across target breakpoints (390px mobile, 1440px desktop).
2. Execute automated bounding box scanner on all `button`, `a[href]`, and `[role="button"]`.
3. Check `window.innerWidth` vs `document.documentElement.scrollWidth`.
4. Check console log for any runtime errors or warnings.
5. Review generated screenshots against design system tokens and anti-slop rules.
