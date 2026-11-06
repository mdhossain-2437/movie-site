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
      await expect(searchTrigger).toHaveAttribute("data-hydrated", "true");
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
