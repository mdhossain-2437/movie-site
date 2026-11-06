import { expect, test } from "@playwright/test";

test.describe("Cinematic Graphite discovery experience", () => {
  test("changes featured titles and moves the archive only through manual controls", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/");
    const hero = page.getByRole("region", { name: "Featured archive titles" });
    const feature = hero.getByRole("button", { name: "Feature Metropolis", exact: true });
    await feature.click();
    await expect(feature).toHaveAttribute("aria-pressed", "true");
    await expect(hero.getByRole("heading", { level: 2 })).toContainText("Metropolis");
    await expect(hero.getByRole("link", { name: "Explore the film" })).toHaveAttribute(
      "href",
      "/movies/metropolis",
    );
    await expect(hero.locator(".hero-play")).toHaveAttribute("href", "/watch/metropolis");

    const rail = page.getByRole("region", { name: "From the archive.", exact: true });
    const initial = await rail.evaluate((element) => element.scrollLeft);
    if (isMobile) {
      await rail.focus();
      await page.keyboard.press("ArrowRight");
      await expect
        .poll(() => rail.evaluate((element) => element.scrollLeft))
        .toBeGreaterThan(initial);
      await page.keyboard.press("ArrowLeft");
      await expect
        .poll(() => rail.evaluate((element) => element.scrollLeft))
        .toBeLessThanOrEqual(initial + 1);
    } else {
      const previous = page.getByRole("button", {
        name: "Previous From the archive.",
        includeHidden: true,
      });
      await expect(previous).toBeDisabled();
      await page.getByRole("button", { name: "Next From the archive." }).click();
      await expect
        .poll(() => rail.evaluate((element) => element.scrollLeft))
        .toBeGreaterThan(initial);
      await expect(previous).toBeEnabled();
      await previous.click();
      await expect(previous).toBeDisabled();
    }
    expect(await page.locator("video, audio, iframe").count()).toBe(0);
  });

  test("explores a monochrome filmography through the cinematic poster transition", async ({
    page,
  }) => {
    await page.goto("/people/f-w-murnau");
    await expect(page.getByRole("heading", { level: 1, name: "F. W. Murnau" })).toBeVisible();
    await page
      .getByRole("link", { name: "Nosferatu: A Symphony of Horror, 1922", exact: true })
      .click();
    await expect(page).toHaveURL(/\/movies\/nosferatu$/);
    await expect(page.locator(".poster-wipe")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: /Nosferatu/ })).toBeVisible();
    await expect(
      page.getByText("Rights verification pending", { exact: true }).first(),
    ).toBeVisible();
    expect(await page.locator("video, audio, iframe").count()).toBe(0);
  });

  test("opens the keyboard search palette and navigates to a real development reference", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Search", exact: true })).toHaveAttribute(
      "aria-keyshortcuts",
      "Control+K Meta+K",
    );
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: "Search the film archive" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("combobox")).toBeFocused();
    await page.keyboard.press("Control+k");
    await expect(dialog).not.toBeVisible();
    await page.keyboard.press("Meta+k");
    await expect(dialog).toBeVisible();
    const fullSearch = dialog.getByRole("link", { name: "Full search" });
    await fullSearch.focus();
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("combobox")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(fullSearch).toBeFocused();
    await dialog.getByRole("combobox").fill("metropolis");
    await expect(dialog.getByRole("option").first()).toContainText("Metropolis");
    await dialog.getByRole("combobox").press("Enter");
    await expect(page).toHaveURL(/\/movies\/metropolis$/);
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Metropolis" })).toBeVisible();
  });

  test("filters and sorts the catalogue using shareable URLs and an index view", async ({
    page,
  }) => {
    await page.goto("/movies");
    await page.getByRole("link", { name: /^Horror/ }).click();
    await expect(page).toHaveURL(/genre=horror/);
    await expect(page.locator(".poster-card")).toHaveCount(2);
    await page.getByRole("link", { name: "Film index view" }).click();
    await expect(page).toHaveURL(/view=index/);
    await expect(page.locator(".film-index-row")).toHaveCount(2);
    await page.getByRole("link", { name: "Newest", exact: true }).click();
    await expect(page).toHaveURL(/sort=year-desc/);
    await expect(page.locator(".film-index-row").first()).toContainText("Nosferatu");
    await page.getByRole("link", { name: /Clear filters/ }).click();
    await expect(page.locator(".film-index-row")).toHaveCount(22);
  });

  test("searches Bangla titles without stripping their vowel signs", async ({ page }) => {
    await page.goto("/search");
    await page
      .getByRole("searchbox", { name: "Search titles, cast, or directors" })
      .fill("নসফেরাতু");
    await page.getByRole("button", { name: "Search catalogue", exact: true }).click();
    await expect(page.locator(".search-results .poster-card")).toHaveCount(1);
    await expect(page.locator(".poster-title").first()).toContainText("Nosferatu");
  });

  test("saves a device-only reference and persists it across reloads without granting playback", async ({
    page,
  }) => {
    await page.goto("/movies/sunrise");
    await page.getByRole("button", { name: /^Save Sunrise.*this device/ }).click();
    await expect(page.getByRole("status")).toContainText(/Saved on this device/);
    await page.goto("/watchlist");
    await expect(page.locator(".poster-card")).toHaveCount(1);
    await expect(page.locator(".poster-title")).toContainText("Sunrise");
    await page.reload();
    await expect(page.locator(".poster-card")).toHaveCount(1);
    await page.getByRole("button", { name: /Remove Sunrise.*this device/ }).click();
    await expect(page.locator(".poster-card")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /Your story starts/ })).toBeVisible();
  });

  test("requires confirmation before clearing the device-only list", async ({ page }) => {
    await page.goto("/movies/sunrise");
    await page.getByRole("button", { name: /^Save Sunrise.*this device/ }).click();
    await page.goto("/watchlist");
    await page.getByRole("button", { name: "Clear my list" }).click();
    const dialog = page.getByRole("dialog", { name: "Start a new chapter?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Keep my list" }).click();
    await expect(page.locator(".poster-card")).toHaveCount(1);
    await page.getByRole("button", { name: "Clear my list" }).click();
    await dialog.getByRole("button", { name: "Clear list", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.locator(".poster-card")).toHaveCount(0);
    await expect(page.getByRole("status")).toContainText("Your device’s list is now clear.");
    await page.reload();
    await expect(page.locator(".poster-card")).toHaveCount(0);
  });

  test("connects device preferences to actual motion and language presentation", async ({
    page,
  }) => {
    await page.goto("/account");
    await page.getByRole("switch", { name: "Reduced motion", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
    await page.getByRole("switch", { name: "Show Bangla titles", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-bangla", "show");
    await page.goto("/movies");
    await expect(page.locator(".poster-title-bn").first()).toBeVisible();
    await page.locator(".poster-card-link").first().click();
    await expect(page).toHaveURL(/\/movies\/a-trip-to-the-moon$/);
    await expect(page.locator(".poster-wipe")).toHaveCount(0);
  });

  test("resets actual local preferences and saved references only after confirmation", async ({
    page,
  }) => {
    await page.goto("/movies/sunrise");
    await page.getByRole("button", { name: /^Save Sunrise.*this device/ }).click();
    await page.goto("/account");
    const motion = page.getByRole("switch", { name: "Reduced motion", exact: true });
    const bangla = page.getByRole("switch", { name: "Show Bangla titles", exact: true });
    await motion.click();
    await bangla.click();
    await page.getByRole("button", { name: "Reset local data" }).click();
    const dialog = page.getByRole("dialog", { name: "A clean slate." });
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(motion).toHaveAttribute("aria-checked", "true");
    await expect(bangla).toHaveAttribute("aria-checked", "true");
    await page.getByRole("button", { name: "Reset local data" }).click();
    await dialog.getByRole("button", { name: "Reset data", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(motion).toHaveAttribute("aria-checked", "false");
    await expect(bangla).toHaveAttribute("aria-checked", "false");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "system");
    await expect(page.locator("html")).toHaveAttribute("data-bangla", "hide");
    await page.reload();
    await expect(motion).toHaveAttribute("aria-checked", "false");
    await expect(bangla).toHaveAttribute("aria-checked", "false");
    await page.goto("/watchlist");
    await expect(page.locator(".poster-card")).toHaveCount(0);
  });

  test("copies the catalogue page address rather than a media delivery URL", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    });
    await page.goto("/movies/metropolis");
    await page.getByRole("button", { name: "Share Metropolis", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Page link copied.");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(page.url());
  });

  test("locks playback on a real server rights denial without loading a player or exposing asset URLs", async ({
    page,
  }) => {
    await page.goto("/watch/sunrise");
    await expect(
      page.getByRole("heading", { name: /Some stories.*need a little more time/ }),
    ).toBeVisible();
    await expect(page.getByText("TITLE_NOT_PUBLISHED", { exact: true })).toBeVisible();
    await expect(
      page.getByText("No manifest, segment or download URL issued", { exact: true }),
    ).toBeVisible();
    expect(await page.locator("video, audio, iframe").count()).toBe(0);
    const evaluationTime = page.locator(".watch-evaluation time");
    const previousEvaluation = await evaluationTime.getAttribute("datetime");
    await page.getByRole("button", { name: "Recheck availability" }).click();
    await expect.poll(() => evaluationTime.getAttribute("datetime")).not.toBe(previousEvaluation);
    await expect(page.getByText("TITLE_NOT_PUBLISHED", { exact: true })).toBeVisible();
  });

  test("opens and closes an accessible menu with Escape and restores focus", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("button", { name: "Open navigation menu" });
    await button.click();
    const dialog = page.getByRole("dialog", { name: "Find your next frame" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: /Collections/ })).toBeVisible();
    const lastLink = dialog.getByRole("link").last();
    await lastLink.focus();
    await page.keyboard.press("Tab");
    await expect(
      dialog.getByRole("link", { name: "Cinematic Graphite", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(lastLink).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(button).toBeFocused();
  });

  test("keeps every major screen within the viewport", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    const routes = [
      "/movies",
      "/movies/nosferatu",
      "/people/f-w-murnau",
      "/collections/german-expressionism",
      "/search?q=melies",
      "/watchlist",
      "/account",
      "/watch/sunrise",
      "/admin",
    ];
    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status(), `HTTP status on ${route}`).toBe(200);
      await expect(page.locator("main")).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow, `Horizontal overflow on ${route}`).toBe(false);
    }
    expect(errors).toEqual([]);
  });
});
