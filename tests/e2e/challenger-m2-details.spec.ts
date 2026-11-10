import { expect, test } from "@playwright/test";

const BREAKPOINTS = [360, 375, 390, 414, 430, 768, 1024, 1280, 1440, 1920] as const;

test.describe("Empirical Challenger M2: Movie Details (/movies/[slug]) Deep Audit", () => {
  test("1. Page loads cleanly with zero console errors and zero uncaught pageerror", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    const response = await page.goto("/movies/the-last-monsoon", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(200);

    // Wait for hero stage and sections to hydrate
    await expect(page.getByRole("heading", { level: 1, name: /The Last Monsoon/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator("#download-section")).toBeVisible();
    await expect(page.locator("#credits")).toBeVisible();
    await expect(page.locator("#details")).toBeVisible();

    expect(
      consoleErrors,
      `Uncaught console errors detected: ${JSON.stringify(consoleErrors)}`,
    ).toEqual([]);
    expect(pageErrors, `Uncaught page errors detected: ${JSON.stringify(pageErrors)}`).toEqual([]);
  });

  test("2. Cumulative Layout Shift (CLS) on /movies/the-last-monsoon is strictly <= 0.05", async ({
    page,
  }) => {
    // Inject PerformanceObserver before page scripts run to capture all layout shifts from frame 0
    await page.addInitScript(() => {
      (window as unknown as { __clsScore: number; __clsSources: any[] }).__clsScore = 0;
      (window as unknown as { __clsScore: number; __clsSources: any[] }).__clsSources = [];
      try {
        const observer = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            const shiftEntry = entry as unknown as {
              hadRecentInput: boolean;
              value: number;
              sources?: Array<{
                node?: Node;
                previousRect?: DOMRectReadOnly;
                currentRect?: DOMRectReadOnly;
              }>;
            };
            if (!shiftEntry.hadRecentInput) {
              (window as unknown as { __clsScore: number }).__clsScore += shiftEntry.value;
              const sourceSummaries = (shiftEntry.sources ?? []).map((s) => ({
                tag: (s.node as HTMLElement)?.tagName,
                id: (s.node as HTMLElement)?.id,
                className: (s.node as HTMLElement)?.className,
                prev: s.previousRect
                  ? { top: s.previousRect.top, height: s.previousRect.height }
                  : null,
                curr: s.currentRect
                  ? { top: s.currentRect.top, height: s.currentRect.height }
                  : null,
              }));
              (window as unknown as { __clsSources: any[] }).__clsSources.push({
                value: shiftEntry.value,
                sources: sourceSummaries,
              });
            }
          }
        });
        observer.observe({ type: "layout-shift", buffered: true });
      } catch {
        // Fallback if layout-shift observer not supported
      }
    });

    await page.goto("/movies/the-last-monsoon", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: /The Last Monsoon/i })).toBeVisible({
      timeout: 15_000,
    });

    // Allow any initial hydration or layout to settle
    await page.waitForTimeout(500);

    // Scroll using authentic user mouse wheel events
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(300);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(300);
    await page.mouse.wheel(0, -1200);
    await page.waitForTimeout(300);

    const result = await page.evaluate(() => {
      const win = window as unknown as { __clsScore: number; __clsSources: any[] };
      return {
        clsScore: win.__clsScore ?? 0,
        sources: win.__clsSources ?? [],
      };
    });

    // Core Web Vitals standard: good CLS is < 0.1, cinematic standard <= 0.05
    expect(
      result.clsScore,
      `Cumulative Layout Shift (CLS) must be minimal (got ${result.clsScore.toFixed(4)}). Sources: ${JSON.stringify(result.sources, null, 2)}`,
    ).toBeLessThanOrEqual(0.05);
  });

  test("3. Anti-Slop Governance Audit on /movies/the-last-monsoon", async ({ page }) => {
    await page.goto("/movies/the-last-monsoon", { waitUntil: "domcontentloaded" });

    // A. Zero emojis in visible text nodes
    const emojiRegex =
      /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u;
    const emojiIssues = await page.evaluate((pattern) => {
      const issues: string[] = [];
      const regex = new RegExp(pattern, "u");
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node.textContent?.trim();
        if (text && regex.test(text)) {
          issues.push(`<${node.parentElement?.tagName.toLowerCase()}> "${text.slice(0, 40)}"`);
        }
      }
      return issues;
    }, emojiRegex.source);

    expect(emojiIssues, `Forbidden emojis detected: ${JSON.stringify(emojiIssues)}`).toEqual([]);

    // B. Zero fake third-party rating emblems or unauthenticated external raster images
    const emblemViolations = await page.evaluate(() => {
      const violations: string[] = [];
      const images = Array.from(document.querySelectorAll("img"));
      for (const img of images) {
        const src = img.getAttribute("src") ?? "";
        if (src.includes("imdb") || src.includes("rottentomatoes") || src.includes("metacritic")) {
          violations.push(`Fake rating image emblem found: <img src="${src}">`);
        }
        if (/^https?:\/\//i.test(src) && !src.includes("cinematicgraphite")) {
          violations.push(`Unverified external raster image found: <img src="${src}">`);
        }
      }
      return violations;
    });

    expect(
      emblemViolations,
      `Prohibited emblem images found: ${JSON.stringify(emblemViolations)}`,
    ).toEqual([]);

    // C. Zero default Tailwind palette utility classes in DOM
    const forbiddenClassViolations = await page.evaluate(() => {
      const forbiddenPatterns = [
        /^bg-zinc-/,
        /^text-zinc-/,
        /^border-zinc-/,
        /^bg-gray-/,
        /^text-gray-/,
        /^border-gray-/,
        /^bg-slate-/,
        /^text-slate-/,
        /^border-slate-/,
        /^bg-neutral-/,
        /^text-neutral-/,
        /^border-neutral-/,
        /^text-white$/,
        /^bg-black$/,
        /^from-(purple|indigo|violet|blue)-/i,
        /^to-(purple|indigo|violet|blue)-/i,
      ];

      const detected: string[] = [];
      const allElements = document.querySelectorAll("*");
      for (const el of allElements) {
        for (const cls of Array.from(el.classList)) {
          if (forbiddenPatterns.some((p) => p.test(cls))) {
            detected.push(`<${el.tagName.toLowerCase()} class="${cls}">`);
          }
        }
      }
      return Array.from(new Set(detected));
    });

    expect(
      forbiddenClassViolations,
      `Forbidden default Tailwind classes or neon gradients detected: ${JSON.stringify(forbiddenClassViolations)}`,
    ).toEqual([]);
  });

  test("4. Interactive Touch Target Bounding Box Audit on Mobile Viewport (390x844)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/movies/the-last-monsoon", { waitUntil: "domcontentloaded" });

    // A. Floating Quick Action Rail (Download, Cast, Details)
    const quickActions = page.locator("div[aria-label='Quick Actions'] a");
    const actionCount = await quickActions.count();
    expect(actionCount).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < actionCount; i++) {
      const action = quickActions.nth(i);
      const box = await action.boundingBox();
      expect(box, `Quick action #${i} must have bounding box`).not.toBeNull();
      if (box) {
        expect(
          Math.round(box.width),
          `Quick action #${i} width >= 44px (got ${box.width}px)`,
        ).toBeGreaterThanOrEqual(44);
        expect(
          Math.round(box.height),
          `Quick action #${i} height >= 44px (got ${box.height}px)`,
        ).toBeGreaterThanOrEqual(44);
      }
    }

    // B. Main Play CTA
    const playCta = page.locator("a[aria-label*='Play stream for']");
    if (await playCta.isVisible()) {
      const playBox = await playCta.boundingBox();
      expect(playBox).not.toBeNull();
      if (playBox) {
        expect(playBox.width).toBeGreaterThanOrEqual(44);
        expect(playBox.height).toBeGreaterThanOrEqual(44);
      }
    }

    // C. Watchlist Toggle Button
    const watchlistBtn = page.locator("button[aria-label*='watchlist' i]");
    if (await watchlistBtn.isVisible()) {
      const wlBox = await watchlistBtn.boundingBox();
      expect(wlBox).not.toBeNull();
      if (wlBox) {
        expect(wlBox.height).toBeGreaterThanOrEqual(44);
      }
    }

    // D. Watch Now Button (in #download-section)
    const watchNowBtn = page.locator("#download-section a:has-text('Watch Now')");
    if (await watchNowBtn.isVisible()) {
      const wnBox = await watchNowBtn.boundingBox();
      expect(wnBox).not.toBeNull();
      if (wnBox) {
        expect(wnBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test("5. Interactive Touch Target Bounding Box Audit on Desktop Viewport (1440x900)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/movies/the-last-monsoon", { waitUntil: "domcontentloaded" });

    // All buttons and primary links on desktop must be >= 24x24px
    const desktopControls = page.locator(
      "#download-section a, #download-section button, div[aria-label='Quick Actions'] a, a[aria-label*='Play']",
    );
    const count = await desktopControls.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const ctrl = desktopControls.nth(i);
      if (await ctrl.isVisible()) {
        const box = await ctrl.boundingBox();
        if (box) {
          expect(
            Math.round(box.width),
            `Desktop control #${i} width >= 24px (got ${box.width}px)`,
          ).toBeGreaterThanOrEqual(24);
          expect(
            Math.round(box.height),
            `Desktop control #${i} height >= 24px (got ${box.height}px)`,
          ).toBeGreaterThanOrEqual(24);
        }
      }
    }
  });

  for (const width of BREAKPOINTS) {
    test(`6. Zero horizontal overflow at ${width}px viewport on /movies/the-last-monsoon`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/movies/the-last-monsoon", { waitUntil: "domcontentloaded" });

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const windowWidth = window.innerWidth;
        const docScrollWidth = doc.scrollWidth;
        const bodyScrollWidth = body ? body.scrollWidth : 0;
        return {
          windowWidth,
          docScrollWidth,
          bodyScrollWidth,
          hasDocOverflow: docScrollWidth > windowWidth,
          hasBodyOverflow: bodyScrollWidth > windowWidth,
        };
      });

      expect(
        overflow.hasDocOverflow,
        `Document horizontal overflow at ${width}px: scrollWidth=${overflow.docScrollWidth} > innerWidth=${overflow.windowWidth}`,
      ).toBe(false);

      expect(
        overflow.hasBodyOverflow,
        `Body horizontal overflow at ${width}px: body.scrollWidth=${overflow.bodyScrollWidth} > innerWidth=${overflow.windowWidth}`,
      ).toBe(false);
    });
  }
});
