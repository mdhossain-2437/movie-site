---
name: visual-qa
description: Automated visual QA and Playwright screenshot verification skill. Covers multi-viewport screenshot capture, element bounding box audits, image diffing, and artifact indexing.
---

# Visual QA (`visual-qa`)

Use this skill to automate browser-driven visual quality assurance, multi-viewport screenshot capture, element geometry audits, and visual artifact indexing for web applications.

---

## Core Capabilities

1. **Multi-Viewport Visual Capture**:
   - Capture clean, full-page or scoped element screenshots across standard breakpoints:
     - **Desktop Wide**: `1440x900` (primary desktop baseline)
     - **Mobile Portrait**: `390x844` (modern mobile reference viewport)
     - **Tablet / Responsive**: `768x1024` and `1024x768`
2. **Hydration Verification Preflight**:
   - Always await page hydration and network quiescence before capturing screenshots:
     ```ts
     await page.goto(url, { waitUntil: "domcontentloaded" });
     await page.waitForLoadState("networkidle");
     // or await page.locator('[data-hydrated="true"]').waitFor();
     ```
3. **Interactive Target Bounding Box Auditing**:
   - Programmatically evaluate computed bounding boxes of interactive controls (`button`, `a`, `[role="button"]`):
     ```ts
     const box = await element.boundingBox();
     expect(box.width).toBeGreaterThanOrEqual(minWidth);
     expect(box.height).toBeGreaterThanOrEqual(minHeight);
     ```
   - Enforce `>= 44x44px` on mobile (< 768px).
   - Enforce `>= 24x24px` on desktop (>= 768px).
4. **Horizontal Overflow Verification**:
   - Check that `scrollWidth <= clientWidth` across both `document.documentElement` and `document.body`.
5. **Artifact Indexing & Verification**:
   - Save captured screenshots into the designated artifact directory (e.g. brain/scratch directory).
   - Validate that files exist on disk and possess non-zero byte size (`fs.statSync(file).size > 0`).

---

## Playwright Spec Structure

When authoring visual QA test specs in Playwright:

```ts
import { expect, test } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

test.describe("Visual QA Capture Suite", () => {
  const ARTIFACT_DIR = path.resolve("path/to/artifacts");

  test.beforeAll(() => {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  });

  test("captures desktop showcase stage at 1440x900", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    const outputPath = path.join(ARTIFACT_DIR, "qa-home-showcase-desktop.png");
    await page.screenshot({ path: outputPath, fullPage: false });

    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.statSync(outputPath).size).toBeGreaterThan(0);
  });
});
```

---

## Visual Defect Remediation

When visual defects are detected:
1. **Clipping / Truncation**: Check flexbox/grid containers for missing `min-w-0` or unconstrained text wrapping.
2. **Horizontal Overflow**: Trace child elements with fixed widths exceeding container boundaries, or negative margins without clipping.
3. **Touch Target Violations**: Add `min-h-11 min-w-11` (`44px`) padding or explicit sizing classes to mobile interactive controls.
4. **Contrast Failures**: Realign color classes with canonical semantic tokens (`text-text`, `text-text-secondary`, `bg-canvas`, `bg-surface-1`).
