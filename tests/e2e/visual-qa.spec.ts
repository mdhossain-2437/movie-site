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

    // Verify CINEVA signature brand tile on FloatingDock
    const brandTile = page.locator(
      "nav[aria-label='Signature floating dock navigation'] a[aria-label='CINEVA Home']",
    );
    await expect(brandTile).toBeVisible();
    await expect(brandTile).toHaveText("CINEVA");

    // Zero horizontal overflow invariant
    const hasOverflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const clientWidth = doc.clientWidth;
      return doc.scrollWidth > clientWidth || (body && body.scrollWidth > clientWidth);
    });
    expect(hasOverflow, "Page must have zero horizontal overflow").toBe(false);

    // Verify film grain & vignette overlay safety invariants: pointer-events: none and containment
    const grainSafety = await page.evaluate(() => {
      const overlays = Array.from(
        document.querySelectorAll(
          "[class*='grain'], [class*='vignette'], [aria-hidden='true'] > div",
        ),
      );
      return overlays.every((el) => {
        const style = window.getComputedStyle(el);
        return (
          style.pointerEvents === "none" || el.scrollWidth <= document.documentElement.clientWidth
        );
      });
    });
    expect(grainSafety, "Film grain and vignette layers must maintain safety containment").toBe(
      true,
    );

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

    // Non-overlap invariant: Quick Actions rail must never overlap synopsis text on desktop
    const synopsisBox = await page.getByTestId("hero-synopsis-column").boundingBox();
    const quickRailBox = await page.locator("div[aria-label='Quick Actions']").boundingBox();
    expect(synopsisBox).not.toBeNull();
    expect(quickRailBox).not.toBeNull();
    if (synopsisBox && quickRailBox) {
      expect(
        synopsisBox.x + synopsisBox.width,
        `Desktop synopsis right edge (${synopsisBox.x + synopsisBox.width}) must stay clear of Quick Actions rail left edge (${quickRailBox.x})`,
      ).toBeLessThanOrEqual(quickRailBox.x - 12);
    }

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

    // Mobile quick-action rail non-overlap & touch target audit (>= 44x44px)
    const mobileSynopsisBox = await page.getByTestId("hero-synopsis-column").boundingBox();
    const mobileRailBox = await page.locator("div[aria-label='Quick Actions']").boundingBox();
    const dockBox = await dock.boundingBox();
    const metadataBox = await page.getByTestId("hero-metadata-ledger").boundingBox();
    expect(mobileSynopsisBox).not.toBeNull();
    expect(mobileRailBox).not.toBeNull();
    expect(dockBox).not.toBeNull();
    if (mobileSynopsisBox && mobileRailBox) {
      expect(
        mobileSynopsisBox.y + mobileSynopsisBox.height,
        `Mobile synopsis bottom (${mobileSynopsisBox.y + mobileSynopsisBox.height}) must not overlap Quick Actions rail top (${mobileRailBox.y})`,
      ).toBeLessThanOrEqual(mobileRailBox.y);
    }
    if (mobileRailBox && dockBox) {
      expect(
        mobileRailBox.y + mobileRailBox.height,
        `Mobile Quick Actions bottom (${mobileRailBox.y + mobileRailBox.height}) must stay clear of FloatingDock top (${dockBox.y})`,
      ).toBeLessThanOrEqual(dockBox.y - 8);
    }
    if (metadataBox && dockBox) {
      const overlapsDockAtRest =
        metadataBox.y < dockBox.y + dockBox.height &&
        metadataBox.y + metadataBox.height > dockBox.y;
      expect(
        overlapsDockAtRest,
        `Mobile metadata ledger (y=${metadataBox.y}) must not collide behind FloatingDock (y=${dockBox.y}..${dockBox.y + dockBox.height}) at initial viewport`,
      ).toBe(false);
    }

    const quickRailControls = page.locator(
      "div[aria-label='Quick Actions'] a, div[aria-label='Quick Actions'] button",
    );
    const quickCount = await quickRailControls.count();
    expect(quickCount).toBeGreaterThanOrEqual(2);
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

    const videoShell = page.locator("div[data-player-state]");
    await expect(videoShell).toBeVisible();
    await expect(page.getByRole("button", { name: /Watch Film/i })).toBeVisible();

    // Skip link must be visually hidden (sr-only, <=1x1px) until keyboard focused
    const skipLinkBox = await page
      .getByRole("link", { name: /Skip to video player/i })
      .boundingBox();
    if (skipLinkBox) {
      expect(skipLinkBox.width).toBeLessThanOrEqual(2);
      expect(skipLinkBox.height).toBeLessThanOrEqual(2);
    }

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

  test("6. verifies live streaming playback on /watch/neon-bhasha and captures qa-watch-playing-desktop.png", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/watch/neon-bhasha?t=12", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    const watchTitle = page.getByRole("heading", { level: 1, name: /Neon Bhasha/i });
    await expect(watchTitle).toBeVisible();

    await page.getByRole("button", { name: /Watch Film/i }).click();

    const playingShell = page.locator("div[data-player-state='PLAYING']");
    await expect(playingShell).toBeVisible({ timeout: 10000 });

    const canvasReel = page.getByTestId("cinema-canvas-reel");
    await expect(canvasReel).toBeVisible();

    const screenshotPath = path.join(BRAIN_ARTIFACT_DIR, "qa-watch-playing-desktop.png");
    await page.screenshot({ path: screenshotPath, fullPage: false });
    expect(fs.existsSync(screenshotPath)).toBe(true);
    expect(fs.statSync(screenshotPath).size).toBeGreaterThan(0);
  });

  test("7. verifies multi-dimensional Movie & Series Explorer on /movies and captures qa-movies-database-desktop.png", async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/movies", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    const explorer = page.getByTestId("movie-database-explorer");
    await expect(explorer).toBeVisible();
    await expect(page.getByText(/Showing 20 of 20 Titles/i)).toBeVisible();

    // Verify Format filter: Series (6)
    await page.getByRole("button", { name: /Series \(6\)/i }).click();
    await expect(page.getByText(/Showing 6 of 20 Titles/i)).toBeVisible();
    await page.getByRole("button", { name: /All \(20\)/i }).click();

    // Verify Director + Cast + Studio + Universe + Sort filters
    await page.locator("#movie-db-director").selectOption("amina-rahman");
    await expect(page.getByText(/Director: amina-rahman/i)).toBeVisible();
    await page.locator("#movie-db-cast").selectOption("tariq-anam");
    await expect(page.getByText(/Cast: tariq-anam/i)).toBeVisible();
    await page.getByRole("button", { name: /Reset Database Filters/i }).click();
    await expect(page.getByText(/Showing 20 of 20 Titles/i)).toBeVisible();

    // Verify Special Category filter (Heroic Multiverse) & Studio filter
    await page.getByRole("button", { name: /Heroic Multiverse/i }).click();
    await expect(
      page.getByRole("heading", { name: "Iron Eclipse: Vanguard Protocol" }),
    ).toBeVisible();
    await page.getByRole("button", { name: /All Universes/i }).click();

    await page.locator("#movie-db-sort").selectOption("top_rated");

    // Verify Tech Ledger toggle works cleanly without horizontal document overflow
    await page.getByRole("button", { name: "Tech Ledger" }).click();
    await expect(page.getByRole("columnheader", { name: /Bayesian WR/i })).toBeVisible();

    const hasLedgerOverflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      return doc.scrollWidth > doc.clientWidth || (body && body.scrollWidth > doc.clientWidth);
    });
    expect(hasLedgerOverflow, "Tech Ledger view must have zero document overflow").toBe(false);

    // Return to Poster Grid for visual capture
    await page.getByRole("button", { name: "Poster Grid" }).click();

    // Verify Backend Faceted Titles API & Netflix-class Recommendation Engine API
    const apiFaceted = await request.get(
      "/api/v1/titles?director=amina-rahman&genre=noir&sort=top_rated",
    );
    expect(apiFaceted.status()).toBe(200);
    const apiFacetedJson = await apiFaceted.json();
    expect(apiFacetedJson.count).toBeGreaterThanOrEqual(3);

    const apiRecItem = await request.get("/api/v1/recommendations?slug=the-last-monsoon&limit=4");
    expect(apiRecItem.status()).toBe(200);
    const apiRecJson = await apiRecItem.json();
    expect(apiRecJson.algorithm).toBe("idf-cosine-graph-bayesian-v1");
    expect(apiRecJson.mode).toBe("item_similarity");
    expect(apiRecJson.items.length).toBe(4);
    expect(apiRecJson.items[0].matchPercentage).toBeGreaterThanOrEqual(60);
    expect(apiRecJson.items[0].reasons.length).toBeGreaterThan(0);

    const apiRecSeeds = await request.get(
      "/api/v1/recommendations?seeds=iron-eclipse,the-obsidian-watchman&limit=4",
    );
    expect(apiRecSeeds.status()).toBe(200);
    const apiRecSeedsJson = await apiRecSeeds.json();
    expect(apiRecSeedsJson.mode).toBe("personalized_seeds");
    expect(apiRecSeedsJson.items[0].reasons[0]).toMatch(/Because you watched/i);

    const screenshotPath = path.join(BRAIN_ARTIFACT_DIR, "qa-movies-database-desktop.png");
    await page.screenshot({ path: screenshotPath, fullPage: false });
    expect(fs.existsSync(screenshotPath)).toBe(true);
    expect(fs.statSync(screenshotPath).size).toBeGreaterThan(0);
  });

  test("8. verifies /series hub, Series Episode Guide, Episode Streaming & /studios hub", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // /series hub
    await page.goto("/series", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { level: 1, name: "Series" })).toBeVisible();
    await expect(page.getByText(/Showing 6 of 6 Titles/i)).toBeVisible();

    const seriesScreenshot = path.join(BRAIN_ARTIFACT_DIR, "qa-series-hub-desktop.png");
    await page.screenshot({ path: seriesScreenshot, fullPage: false });

    // Series detail Seasons & Episodes guide (/movies/syndicate-of-ash)
    await page.goto("/movies/syndicate-of-ash", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    const episodesGuide = page.getByTestId("series-episodes-guide");
    await expect(episodesGuide).toBeVisible();
    await expect(episodesGuide.getByRole("heading", { name: "Berth Nine" })).toBeVisible();
    await episodesGuide.getByRole("button", { name: /Season 2/i }).click();
    await expect(episodesGuide.getByRole("heading", { name: "The Watchtower Pact" })).toBeVisible();

    // Episode streaming (/watch/syndicate-of-ash?s=1&e=1) -> Next Episode S1:E2
    await page.goto("/watch/syndicate-of-ash?s=1&e=1", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { level: 1, name: /Syndicate of Ash · S1:E1/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Next: S1:E2/i })).toBeVisible();

    // /studios hub & /studios/vanguard-mythic-studios
    await page.goto("/studios", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { level: 1, name: "Studios" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Vanguard Mythic Studios" })).toBeVisible();

    const studiosScreenshot = path.join(BRAIN_ARTIFACT_DIR, "qa-studios-hub-desktop.png");
    await page.screenshot({ path: studiosScreenshot, fullPage: false });

    await page.goto("/studios/vanguard-mythic-studios", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { level: 1, name: /Vanguard Mythic Studios/i }),
    ).toBeVisible();
  });

  test("9. verifies /tmdb Live Global Index, SSRF image guard & captures qa-tmdb-global-desktop.png", async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Verify SSRF / invalid size & SVG rejection on /api/v1/tmdb/image
    const badSizeRes = await request.get("/api/v1/tmdb/image/original/test.jpg");
    expect(badSizeRes.status()).toBe(400);
    const badSvgRes = await request.get("/api/v1/tmdb/image/w500/evil.svg");
    expect(badSvgRes.status()).toBe(400);

    const discoverApi = await request.get("/api/v1/tmdb/discover?mode=trending&limit=8");
    expect(discoverApi.status()).toBe(200);
    const discoverJson = await discoverApi.json();
    expect(typeof discoverJson.configured).toBe("boolean");

    await page.goto("/tmdb", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { level: 1, name: /TMDB Global Index/i })).toBeVisible();

    if (discoverJson.configured) {
      await expect(page.getByTestId("tmdb-live-explorer")).toBeVisible();
      expect(discoverJson.items.length).toBeGreaterThan(0);
    }

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow, "/tmdb must have zero horizontal overflow").toBe(false);

    const tmdbScreenshot = path.join(BRAIN_ARTIFACT_DIR, "qa-tmdb-global-desktop.png");
    await page.screenshot({ path: tmdbScreenshot, fullPage: false });
  });

  test("10. asserts all 10 captured screenshot files exist and have size > 0", async () => {
    const requiredScreenshots = [
      "qa-home-showcase-desktop.png",
      "qa-movie-detail-hero-desktop.png",
      "qa-director-showcase-desktop.png",
      "qa-mobile-detail-hero.png",
      "qa-watch-player-desktop.png",
      "qa-watch-playing-desktop.png",
      "qa-movies-database-desktop.png",
      "qa-series-hub-desktop.png",
      "qa-studios-hub-desktop.png",
      "qa-tmdb-global-desktop.png",
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
