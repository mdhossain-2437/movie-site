import * as fs from "node:fs";
import * as path from "node:path";
import { expect, test } from "@playwright/test";

const BRAIN_ARTIFACT_DIR =
  process.platform === "win32" && !process.env.CI
    ? path.resolve("C:/Users/mdhos/.gemini/antigravity/brain/6f91f9d8-4ba5-408f-b7f1-9dc66a34ad83")
    : path.resolve(process.cwd(), "test-results/visual-qa");

test.beforeAll(() => {
  if (!fs.existsSync(BRAIN_ARTIFACT_DIR)) {
    fs.mkdirSync(BRAIN_ARTIFACT_DIR, { recursive: true });
  }
});

test.describe("Cinematic Graphite Closed-Loop Visual QA & Screenshot Suite", () => {
  test.describe.configure({ mode: "serial" });

  test("1. captures qa-home-showcase-desktop.png (Home / with FilmStripShowcase at 1440x900)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    // Verify FilmStripShowcase presence and hydration
    const showcase = page.locator("section[aria-label*='showcase stage']");
    await expect(showcase).toBeVisible();

    // Verify search trigger hydration attribute
    const searchTrigger = page.locator("header button[aria-label*='Open quick catalogue search']");
    await expect(searchTrigger).toHaveAttribute("data-hydrated", "true");

    // Zero horizontal overflow invariant
    const hasOverflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const clientWidth = doc.clientWidth;
      return doc.scrollWidth > clientWidth || (body && body.scrollWidth > clientWidth);
    });
    expect(hasOverflow, "Page must have zero horizontal overflow").toBe(false);

    // Desktop interactive buttons bounding box audit (>= 24x24px)
    const buttons = page.locator("button:visible, [role='button']:visible");
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    for (let i = 0; i < buttonCount; i++) {
      const btn = buttons.nth(i);
      const box = await btn.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        expect(
          Math.round(box.width),
          `Desktop button width must be >= 24px (got ${box.width}px)`,
        ).toBeGreaterThanOrEqual(24);
        expect(
          Math.round(box.height),
          `Desktop button height must be >= 24px (got ${box.height}px)`,
        ).toBeGreaterThanOrEqual(24);
      }
    }

    // Capture screenshot to artifact directory
    const screenshotPath = path.join(BRAIN_ARTIFACT_DIR, "qa-home-showcase-desktop.png");
    await page.screenshot({ path: screenshotPath, fullPage: false });

    // Assert file exists and size > 0
    expect(fs.existsSync(screenshotPath)).toBe(true);
    expect(fs.statSync(screenshotPath).size).toBeGreaterThan(0);
  });

  test("2. captures qa-movie-detail-hero-desktop.png (Movie detail /movies/the-last-monsoon at 1440x900)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/movies/the-last-monsoon", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    // Verify TitleHeroStage title and play CTA
    const titleHeading = page.getByRole("heading", { level: 1, name: /The Last Monsoon/i });
    await expect(titleHeading).toBeVisible();

    const playCta = page.locator("a[aria-label*='Play'], a[aria-label*='Stream']").first();
    await expect(playCta).toBeVisible();

    // Verify metadata pill rows exist
    const metadataSection = page.locator(
      "section[aria-label*='Hero'], section[aria-label*='hero']",
    );
    await expect(metadataSection).toBeVisible();

    // Zero horizontal overflow invariant
    const hasOverflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const clientWidth = doc.clientWidth;
      return doc.scrollWidth > clientWidth || (body && body.scrollWidth > clientWidth);
    });
    expect(hasOverflow, "Movie detail page must have zero horizontal overflow").toBe(false);

    // Desktop interactive buttons bounding box audit (>= 24x24px)
    const buttons = page.locator("button:visible, [role='button']:visible");
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    for (let i = 0; i < buttonCount; i++) {
      const btn = buttons.nth(i);
      const box = await btn.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        expect(
          Math.round(box.width),
          `Desktop button width must be >= 24px (got ${box.width}px)`,
        ).toBeGreaterThanOrEqual(24);
        expect(
          Math.round(box.height),
          `Desktop button height must be >= 24px (got ${box.height}px)`,
        ).toBeGreaterThanOrEqual(24);
      }
    }

    // Capture screenshot to artifact directory
    const screenshotPath = path.join(BRAIN_ARTIFACT_DIR, "qa-movie-detail-hero-desktop.png");
    await page.screenshot({ path: screenshotPath, fullPage: false });

    // Assert file exists and size > 0
    expect(fs.existsSync(screenshotPath)).toBe(true);
    expect(fs.statSync(screenshotPath).size).toBeGreaterThan(0);
  });

  test("3. captures qa-director-showcase-desktop.png (Director showcase /people/amina-rahman at 1440x900)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/people/amina-rahman", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    // Verify Director heading and showcase
    const directorHeading = page.getByRole("heading", { level: 1, name: /Amina Rahman/i });
    await expect(directorHeading).toBeVisible();

    // Zero horizontal overflow invariant
    const hasOverflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const clientWidth = doc.clientWidth;
      return doc.scrollWidth > clientWidth || (body && body.scrollWidth > clientWidth);
    });
    expect(hasOverflow, "Director showcase page must have zero horizontal overflow").toBe(false);

    // Desktop interactive buttons bounding box audit (>= 24x24px)
    const buttons = page.locator("button:visible, [role='button']:visible");
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    for (let i = 0; i < buttonCount; i++) {
      const btn = buttons.nth(i);
      const box = await btn.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        expect(
          Math.round(box.width),
          `Desktop button width must be >= 24px (got ${box.width}px)`,
        ).toBeGreaterThanOrEqual(24);
        expect(
          Math.round(box.height),
          `Desktop button height must be >= 24px (got ${box.height}px)`,
        ).toBeGreaterThanOrEqual(24);
      }
    }

    // Capture screenshot to artifact directory
    const screenshotPath = path.join(BRAIN_ARTIFACT_DIR, "qa-director-showcase-desktop.png");
    await page.screenshot({ path: screenshotPath, fullPage: false });

    // Assert file exists and size > 0
    expect(fs.existsSync(screenshotPath)).toBe(true);
    expect(fs.statSync(screenshotPath).size).toBeGreaterThan(0);
  });

  test("4. captures qa-mobile-detail-hero.png (Movie detail /movies/the-last-monsoon at 390x844)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/movies/the-last-monsoon", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    // Verify TitleHeroStage title visible on mobile
    const titleHeading = page.getByRole("heading", { level: 1, name: /The Last Monsoon/i });
    await expect(titleHeading).toBeVisible();

    // Zero horizontal overflow on mobile invariant
    const hasOverflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const clientWidth = doc.clientWidth;
      return doc.scrollWidth > clientWidth || (body && body.scrollWidth > clientWidth);
    });
    expect(hasOverflow, "Mobile movie detail page must have zero horizontal overflow").toBe(false);

    // Mobile touch target audit on FloatingDock: all interactive controls must be >= 44x44px
    const dock = page.locator("nav[aria-label='Signature floating dock navigation']");
    await expect(dock).toBeVisible();

    const dockControls = dock.locator("a, button");
    const dockCount = await dockControls.count();
    expect(dockCount).toBeGreaterThanOrEqual(6);

    for (let i = 0; i < dockCount; i++) {
      const ctrl = dockControls.nth(i);
      const box = await ctrl.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(
          Math.round(box.width),
          `Mobile FloatingDock control width must be >= 44px (got ${box.width}px)`,
        ).toBeGreaterThanOrEqual(44);
        expect(
          Math.round(box.height),
          `Mobile FloatingDock control height must be >= 44px (got ${box.height}px)`,
        ).toBeGreaterThanOrEqual(44);
      }
    }

    // Mobile quick-action rail buttons bounding box audit (>= 44x44px)
    const quickRailControls = page.locator(
      "div[aria-label='Quick actions rail'] a, div[aria-label='Quick actions rail'] button",
    );
    const quickCount = await quickRailControls.count();
    for (let i = 0; i < quickCount; i++) {
      const ctrl = quickRailControls.nth(i);
      const box = await ctrl.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        expect(
          Math.round(box.width),
          `Mobile quick rail control width must be >= 44px (got ${box.width}px)`,
        ).toBeGreaterThanOrEqual(44);
        expect(
          Math.round(box.height),
          `Mobile quick rail control height must be >= 44px (got ${box.height}px)`,
        ).toBeGreaterThanOrEqual(44);
      }
    }

    // Capture mobile screenshot to artifact directory
    const screenshotPath = path.join(BRAIN_ARTIFACT_DIR, "qa-mobile-detail-hero.png");
    await page.screenshot({ path: screenshotPath, fullPage: false });

    // Assert file exists and size > 0
    expect(fs.existsSync(screenshotPath)).toBe(true);
    expect(fs.statSync(screenshotPath).size).toBeGreaterThan(0);
  });

  test("5. captures qa-watch-player-desktop.png (Watch player /watch/the-last-monsoon at 1440x900)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/watch/the-last-monsoon", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    // Verify title and video player container
    const watchTitle = page.getByRole("heading", { level: 1, name: /The Last Monsoon/i });
    await expect(watchTitle).toBeVisible();

    const videoShell = page.locator("section[aria-label*='player'], section[aria-label*='Player']");
    await expect(videoShell).toBeVisible();

    // Zero horizontal overflow invariant
    const hasOverflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const clientWidth = doc.clientWidth;
      return doc.scrollWidth > clientWidth || (body && body.scrollWidth > clientWidth);
    });
    expect(hasOverflow, "Watch player page must have zero horizontal overflow").toBe(false);

    // Desktop interactive buttons bounding box audit (>= 24x24px)
    const buttons = page.locator("button:visible, [role='button']:visible");
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    for (let i = 0; i < buttonCount; i++) {
      const btn = buttons.nth(i);
      const box = await btn.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        expect(
          Math.round(box.width),
          `Desktop button width must be >= 24px (got ${box.width}px)`,
        ).toBeGreaterThanOrEqual(24);
        expect(
          Math.round(box.height),
          `Desktop button height must be >= 24px (got ${box.height}px)`,
        ).toBeGreaterThanOrEqual(24);
      }
    }

    // Capture screenshot to artifact directory
    const screenshotPath = path.join(BRAIN_ARTIFACT_DIR, "qa-watch-player-desktop.png");
    await page.screenshot({ path: screenshotPath, fullPage: false });

    // Assert file exists and size > 0
    expect(fs.existsSync(screenshotPath)).toBe(true);
    expect(fs.statSync(screenshotPath).size).toBeGreaterThan(0);
  });

  test("6. asserts all 5 captured screenshot files exist and have size > 0", async () => {
    const requiredScreenshots = [
      "qa-home-showcase-desktop.png",
      "qa-movie-detail-hero-desktop.png",
      "qa-director-showcase-desktop.png",
      "qa-mobile-detail-hero.png",
      "qa-watch-player-desktop.png",
    ];

    for (const filename of requiredScreenshots) {
      const filePath = path.join(BRAIN_ARTIFACT_DIR, filename);
      expect(fs.existsSync(filePath), `Screenshot file must exist: ${filePath}`).toBe(true);

      const stats = fs.statSync(filePath);
      expect(
        stats.size,
        `Screenshot file must not be empty (got ${stats.size} bytes): ${filePath}`,
      ).toBeGreaterThan(0);
    }
  });
});
