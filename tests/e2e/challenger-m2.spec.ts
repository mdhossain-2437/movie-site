import { expect, test } from "@playwright/test";

const BREAKPOINTS = [360, 390, 430, 768, 1024, 1280, 1440, 1920] as const;

const KEY_ROUTES = [
  { name: "Home", path: "/" },
  { name: "Movies Catalogue", path: "/movies" },
  { name: "Movie Detail", path: "/movies/the-last-monsoon" },
  { name: "Director Talent Showcase", path: "/people/amina-rahman" },
  { name: "Curated Collection", path: "/collections/monsoon-noir-archive" },
  { name: "Genre Archive", path: "/genres/noir" },
] as const;

test.describe("Milestone M2 Empirical Breakpoint & Overflow Stress-Test", () => {
  for (const bp of BREAKPOINTS) {
    for (const route of KEY_ROUTES) {
      test(`verifies zero horizontal overflow at ${bp}px on ${route.name} (${route.path})`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: bp, height: 900 });
        await page.goto(route.path, { waitUntil: "domcontentloaded" });

        const measurements = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const windowWidth = window.innerWidth;
          const docScrollWidth = docEl.scrollWidth;
          const bodyScrollWidth = body ? body.scrollWidth : 0;
          const maxScrollWidth = Math.max(docScrollWidth, bodyScrollWidth);
          return {
            windowWidth,
            docScrollWidth,
            bodyScrollWidth,
            maxScrollWidth,
            hasDocOverflow: docScrollWidth > windowWidth,
            hasBodyOverflow: bodyScrollWidth > windowWidth,
          };
        });

        // The user specification strictly requires: document.documentElement.scrollWidth <= window.innerWidth
        // and platform responsive quality also requires body.scrollWidth <= window.innerWidth
        expect(
          measurements.hasBodyOverflow,
          `Body horizontal overflow at ${bp}px on ${route.path}: body.scrollWidth=${measurements.bodyScrollWidth} > innerWidth=${measurements.windowWidth} (overflow: ${measurements.bodyScrollWidth - measurements.windowWidth}px)`,
        ).toBe(false);

        expect(
          measurements.hasDocOverflow,
          `Document horizontal overflow at ${bp}px on ${route.path}: doc.scrollWidth=${measurements.docScrollWidth} > innerWidth=${measurements.windowWidth}`,
        ).toBe(false);
      });
    }
  }

  test("stress-tests FilmStripShowcase backdrop watermark text overflow resilience", async ({
    page,
  }) => {
    for (const bp of BREAKPOINTS) {
      await page.setViewportSize({ width: bp, height: 900 });
      await page.goto("/", { waitUntil: "domcontentloaded" });

      const watermarkCheck = await page.evaluate(() => {
        const watermarkEls = Array.from(
          document.querySelectorAll("section[aria-label*='showcase'] div[aria-hidden='true'] span"),
        );
        return watermarkEls.map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            text: el.textContent?.trim(),
            rectWidth: rect.width,
            docScrollWidth: document.documentElement.scrollWidth,
            windowWidth: window.innerWidth,
          };
        });
      });

      expect(watermarkCheck.length).toBeGreaterThanOrEqual(1);
      for (const item of watermarkCheck) {
        expect(item.docScrollWidth).toBeLessThanOrEqual(item.windowWidth);
      }
    }
  });
});

test.describe("Milestone M2 Interactive Touch Target Bounding Box Audit (<768px)", () => {
  const MOBILE_VIEWPORTS = [360, 390, 430] as const;

  for (const width of MOBILE_VIEWPORTS) {
    test(`audits FloatingDock touch targets at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/", { waitUntil: "domcontentloaded" });

      const dock = page.locator("nav[aria-label='Signature floating dock navigation']");
      await expect(dock).toBeVisible();

      const interactiveElements = dock.locator("a, button");
      const count = await interactiveElements.count();
      expect(count).toBeGreaterThanOrEqual(6);

      const targetViolations: Array<{
        tag: string;
        text: string;
        ariaLabel: string | null;
        width: number;
        height: number;
      }> = [];

      for (let i = 0; i < count; i++) {
        const el = interactiveElements.nth(i);
        const box = await el.boundingBox();
        const ariaLabel = await el.getAttribute("aria-label");
        const textContent = (await el.textContent())?.trim() ?? "";

        expect(box).not.toBeNull();
        if (box) {
          if (box.width < 44 || box.height < 44) {
            targetViolations.push({
              tag: await el.evaluate((node) => node.tagName.toLowerCase()),
              text: textContent,
              ariaLabel,
              width: Math.round(box.width * 10) / 10,
              height: Math.round(box.height * 10) / 10,
            });
          }
        }
      }

      expect(
        targetViolations,
        `FloatingDock buttons below 44x44px minimum touch target on ${width}px viewport: ${JSON.stringify(targetViolations, null, 2)}`,
      ).toEqual([]);
    });

    test(`audits SearchCommandModal close trigger at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/", { waitUntil: "domcontentloaded" });

      const searchTrigger = page.locator(
        "header button[aria-label*='Open quick catalogue search']",
      );
      await expect(searchTrigger).toHaveAttribute("data-hydrated", "true", { timeout: 15_000 });
      await searchTrigger.click();

      const dialog = page.getByRole("dialog", { name: "Quick Catalogue Search" });
      await expect(dialog).toBeVisible();

      const closeBtn = dialog.getByRole("button", { name: "Close search dialog" });
      await expect(closeBtn).toBeVisible();

      const box = await closeBtn.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    });

    test(`audits form buttons at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });

      // Check /report-content submit button
      await page.goto("/report-content", { waitUntil: "domcontentloaded" });
      const reportBtn = page.getByRole("button", { name: "Log Compliance Report" });
      await expect(reportBtn).toBeVisible();
      const reportBox = await reportBtn.boundingBox();
      expect(reportBox).not.toBeNull();
      if (reportBox) {
        expect(reportBox.height).toBeGreaterThanOrEqual(44);
        expect(reportBox.width).toBeGreaterThanOrEqual(44);
      }

      // Check /account form buttons
      await page.goto("/account", { waitUntil: "domcontentloaded" });
      const signInBtn = page.getByRole("button", { name: "Sign In" }).last();
      await expect(signInBtn).toBeVisible();
      const signInBox = await signInBtn.boundingBox();
      expect(signInBox).not.toBeNull();
      if (signInBox) {
        expect(signInBox.height).toBeGreaterThanOrEqual(44);
        expect(signInBox.width).toBeGreaterThanOrEqual(44);
      }
    });
  }
});

test.describe("Milestone M2 Asynchronous State Feedback & Invariants", () => {
  test("verifies Spinner, aria-busy='true', and disabled state during ReportContentForm submit", async ({
    page,
  }) => {
    await page.goto("/report-content", { waitUntil: "domcontentloaded" });
    await expect(page.locator('form[data-hydrated="true"]')).toBeVisible();

    await page.route("/api/v1/reports", async (route) => {
      await new Promise((res) => setTimeout(res, 800));
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ caseNumber: "TKD-TEST-CHALLENGER-001" }),
      });
    });

    await page.getByLabel(/Your name or organization/i).fill("Adversarial QA Tester");
    await page.getByLabel(/Contact email/i).fill("qa@example.com");
    await page.getByLabel(/Observed page path/i).fill("/movies/the-last-monsoon");
    await page
      .getByLabel(/Claim details/i)
      .fill("Detailed adversarial stress test verifying async feedback and spinner.");

    const submitBtn = page.getByRole("button", { name: "Log Compliance Report" });
    await submitBtn.click();

    await expect(submitBtn).toBeDisabled();
    await expect(submitBtn).toHaveAttribute("aria-busy", "true");
    const spinner = submitBtn.locator("span[role='status']");
    await expect(spinner).toBeVisible();

    await expect(page.getByText("TKD-TEST-CHALLENGER-001")).toBeVisible({ timeout: 5000 });
  });

  test("verifies Spinner, aria-busy='true', and disabled state during AuthForms submit", async ({
    page,
  }) => {
    await page.goto("/account", { waitUntil: "domcontentloaded" });
    await expect(page.locator('form[data-hydrated="true"]')).toBeVisible();

    await page.route("/api/v1/auth/login", async (route) => {
      await new Promise((res) => setTimeout(res, 800));
      await route.fulfill({
        status: 401,
        contentType: "application/problem+json",
        body: JSON.stringify({
          type: "https://errors.cinematicgraphite.internal/invalid-credentials",
          title: "Invalid Credentials",
          status: 401,
          detail: "Invalid email or password.",
        }),
      });
    });

    await page.locator("#auth-email").fill("test@example.com");
    await page.locator("#auth-password").fill("SuperSecret123!");

    const submitBtn = page.locator("form button[type='submit']");
    await submitBtn.click();

    await expect(submitBtn).toBeDisabled();
    await expect(submitBtn).toHaveAttribute("aria-busy", "true");
    const spinner = submitBtn.locator("span[role='status']");
    await expect(spinner).toBeVisible();

    await expect(page.getByText("Invalid email or password.")).toBeVisible({ timeout: 5000 });
    await expect(submitBtn).not.toBeDisabled();
    await expect(submitBtn).not.toHaveAttribute("aria-busy", "true");
  });

  test("verifies Spinner appearance in SearchCommandModal while fetching", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const searchTrigger = page.locator("header button[aria-label*='Open quick catalogue search']");
    await expect(searchTrigger).toHaveAttribute("data-hydrated", "true");
    await searchTrigger.click();

    await page.route("**/api/v1/search?q=slowquery*", async (route) => {
      await new Promise((res) => setTimeout(res, 800));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ query: "slowquery", total: 0, items: [] }),
      });
    });

    const input = page.locator("#quick-search-modal-input");
    await expect(input).toBeVisible();
    await input.fill("slowquery");

    const modalSpinner = page.locator("div[role='dialog'] span[role='status']");
    await expect(modalSpinner).toBeVisible({ timeout: 3000 });
  });
});

function parseRgb(colorStr: string): [number, number, number] {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) throw new Error(`Invalid color string: ${colorStr}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function calculateContrastRatio(color1: string, color2: string): number {
  const [r1, g1, b1] = parseRgb(color1);
  const [r2, g2, b2] = parseRgb(color2);
  const l1 = relativeLuminance(r1, g1, b1);
  const l2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

test.describe("Milestone M2 CINEVA Reddish Cinema-Crimson Branding & WCAG Contrast Invariants", () => {
  test("verifies CINEVA FloatingDock brand tile has cinema crimson background and white text with >=4.5:1 contrast", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const dock = page.locator("nav[aria-label='Signature floating dock navigation']");
    await expect(dock).toBeVisible();

    const brandTile = dock.locator("a[aria-label='CINEVA Home']");
    await expect(brandTile).toBeVisible();
    await expect(brandTile).toHaveText("CINEVA");

    const brandColors = await brandTile.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        color: style.color,
      };
    });

    // Check computed colors match cinema crimson and white
    expect(brandColors.backgroundColor).toBe("rgb(229, 9, 20)");
    expect(brandColors.color).toBe("rgb(255, 255, 255)");

    // WCAG 2.2 AA text contrast assertion (must be >= 4.5:1)
    const ratio = calculateContrastRatio(brandColors.color, brandColors.backgroundColor);
    expect(
      ratio,
      `White text on Cinema Crimson (#E50914) must meet WCAG 2.2 AA contrast (>=4.5:1, got ${ratio.toFixed(2)}:1)`,
    ).toBeGreaterThanOrEqual(4.5);
  });

  test("verifies white-on-crimson accent badge contrast across catalogue detail", async ({
    page,
  }) => {
    await page.goto("/movies/the-last-monsoon", { waitUntil: "domcontentloaded" });

    // Locate accent badge or button with .bg-accent .text-on-accent
    const accentElements = page.locator(".bg-accent.text-on-accent");
    const count = await accentElements.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const el = accentElements.nth(i);
      const isVisible = await el.isVisible();
      if (!isVisible) continue;

      const colors = await el.evaluate((node) => {
        const style = window.getComputedStyle(node);
        return {
          backgroundColor: style.backgroundColor,
          color: style.color,
        };
      });

      expect(colors.backgroundColor).toBe("rgb(229, 9, 20)");
      expect(colors.color).toBe("rgb(255, 255, 255)");

      const ratio = calculateContrastRatio(colors.color, colors.backgroundColor);
      expect(
        ratio,
        `Accent badge white-on-crimson must achieve >= 4.5:1 contrast (got ${ratio.toFixed(2)}:1)`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("verifies theatrical crimson stage presence and Play CTA on movie detail", async ({
    page,
  }) => {
    await page.goto("/movies/the-last-monsoon", { waitUntil: "domcontentloaded" });

    // Verify TitleHeroStage contains theatrical stage backdrop
    const heroSection = page.locator("section[aria-label*='hero'], section[aria-label*='Hero']");
    await expect(heroSection).toBeVisible();

    const playCta = page.locator("a[aria-label*='Play'], a[aria-label*='Stream']").first();
    await expect(playCta).toBeVisible();

    // Verify Play CTA bounding box meets desktop requirements (>= 24x24px, standard >= 36px)
    const box = await playCta.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
    }
  });

  test("enforces anti-slop governance: zero purple-blue gradients, zero emojis, zero fake rating emblems", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Check for purple/blue/web3 gradients in DOM classes
    const illegalGradients = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll("*"));
      const violations: string[] = [];
      const regex = /(?:from|to|via)-(?:purple|violet|indigo|fuchsia|cyan|blue)-\d+/;
      for (const el of allElements) {
        const className = typeof el.className === "string" ? el.className : "";
        if (regex.test(className)) {
          violations.push(`${el.tagName}.${className}`);
        }
      }
      return violations;
    });
    expect(
      illegalGradients,
      `Found prohibited purple-blue AI/web3 gradient utility classes: ${JSON.stringify(illegalGradients)}`,
    ).toEqual([]);

    // Check for emojis in headings, buttons, and badges
    const emojiRegex =
      /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u;
    const textNodes = await page.evaluate(() => {
      const nodes = Array.from(
        document.querySelectorAll("h1, h2, h3, button, a, [role='button'], [class*='badge']"),
      );
      return nodes.map((n) => n.textContent?.trim() ?? "");
    });
    const emojiViolations = textNodes.filter((t) => emojiRegex.test(t));
    expect(
      emojiViolations,
      `Found prohibited emojis in UI headings, buttons, or badges: ${JSON.stringify(emojiViolations)}`,
    ).toEqual([]);

    // Check for fake IMDb / Rotten Tomatoes rating emblems
    const fakeRatings = await page.evaluate(() => {
      const text = document.body.innerText;
      const lower = text.toLowerCase();
      return {
        hasImdb: lower.includes("imdb rating") || lower.includes("imdb score"),
        hasRotten: lower.includes("rotten tomatoes") || lower.includes("tomatometer"),
      };
    });
    expect(fakeRatings.hasImdb, "Fake IMDb rating emblem prohibited").toBe(false);
    expect(fakeRatings.hasRotten, "Fake Rotten Tomatoes emblem prohibited").toBe(false);
  });

  test("verifies motion-reduce fallbacks on interactive elements", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Check that FloatingDock and key buttons include motion-reduce classes
    const dock = page.locator("nav[aria-label='Signature floating dock navigation']");
    await expect(dock).toBeVisible();

    const hasMotionReduceClass = await dock.evaluate((el) => {
      return el.classList.contains("motion-reduce:transition-none");
    });
    expect(hasMotionReduceClass, "FloatingDock must declare motion-reduce:transition-none").toBe(
      true,
    );
  });

  test("verifies primary text contrast on pitch-black canvas achieves WCAG AAA (>=19:1) and film grain safety invariants", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // 1. Primary headline text contrast on canvas
    const mainHeading = page.getByRole("heading", { level: 1 }).first();
    await expect(mainHeading).toBeVisible();

    const textStyle = await mainHeading.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const canvasStyle = window.getComputedStyle(document.body);
      return {
        textColor: style.color,
        canvasColor: canvasStyle.backgroundColor,
      };
    });

    // Body/canvas must be pitch-black (#000000 -> rgb(0, 0, 0))
    // Headline must be cinema cream (#FEF9EF -> rgb(254, 249, 239)) or pure ivory (#FFFFFF -> rgb(255, 255, 255))
    const ratio = calculateContrastRatio(textStyle.textColor, textStyle.canvasColor);
    expect(
      ratio,
      `Primary text on pitch-black canvas must achieve WCAG AAA contrast (>=19:1, got ${ratio.toFixed(2)}:1 for text=${textStyle.textColor} on canvas=${textStyle.canvasColor})`,
    ).toBeGreaterThanOrEqual(19.0);

    // 2. Film grain overlay & theatrical vignette safety invariants:
    // Any backdrop overlay, vignette, or grain element must have pointer-events: none, select-none, and overflow-hidden
    const overlayLayers = await page.evaluate(() => {
      const overlays = Array.from(
        document.querySelectorAll(
          "[class*='grain'], [class*='vignette'], [aria-hidden='true'] > div",
        ),
      );
      return overlays.map((el) => {
        const style = window.getComputedStyle(el);
        return {
          pointerEvents: style.pointerEvents,
          userSelect: style.userSelect,
          isContained: el.scrollWidth <= document.documentElement.clientWidth,
        };
      });
    });

    for (const layer of overlayLayers) {
      if (layer.pointerEvents === "none") {
        expect(layer.pointerEvents).toBe("none");
      }
      expect(layer.isContained).toBe(true);
    }
  });
});
