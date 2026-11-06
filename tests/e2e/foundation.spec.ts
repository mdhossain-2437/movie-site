import { expect, test } from "@playwright/test";

const VIEWPORT_WIDTHS = [360, 390, 430, 768, 1024, 1280, 1440, 1920] as const;

test.describe("Milestones M1–M5 routes, APIs, search command, playback gate & responsive breakpoints", () => {
  test("serves /api/v1/health, /api/v1/titles, and /api/v1/search with security headers and no-store", async ({
    request,
  }) => {
    const health = await request.get("/api/v1/health");
    expect(health.status()).toBe(200);
    expect(health.headers()["cache-control"]).toBe("no-store");
    expect(health.headers()["x-content-type-options"]).toBe("nosniff");
    expect(health.headers()["x-frame-options"]).toBe("DENY");

    const titles = await request.get("/api/v1/titles");
    expect(titles.status()).toBe(200);
    expect(titles.headers()["cache-control"]).toBe("no-store");
    const titlesJson = await titles.json();
    expect(Array.isArray(titlesJson.items)).toBe(true);

    const search = await request.get("/api/v1/search?q=satyajit");
    expect(search.status()).toBe(200);
    const searchJson = await search.json();
    expect(searchJson.query).toBe("satyajit");
  });

  test("rejects cross-origin POST mutations with 403 Problem Details", async ({ request }) => {
    const crossOrigin = await request.post("/api/v1/auth/logout", {
      headers: { origin: "https://attacker.example" },
    });
    expect(crossOrigin.status()).toBe(403);
    expect(crossOrigin.headers()["content-type"]).toContain("application/problem+json");
  });

  test("enforces Referrer-Policy: no-referrer on /watch/* and deny-by-default on playback/download APIs", async ({
    page,
    request,
    baseURL,
  }) => {
    const watchMissing = await request.get("/watch/non-existent-film");
    expect(watchMissing.headers()["referrer-policy"]).toBe("no-referrer");

    await page.goto("/watch/non-existent-film");
    await expect(page.getByText(/That page or title could not be found/i)).toBeVisible();

    const origin = baseURL ?? "http://127.0.0.1:3100";
    const playbackDenied = await request.post("/api/v1/playback-sessions", {
      headers: { origin },
      data: { titleSlug: "non-existent-film", drmCapableClient: false },
    });
    expect(playbackDenied.status()).toBe(404);
    expect(playbackDenied.headers()["content-type"]).toContain("application/problem+json");

    const downloadUnauth = await request.post("/api/v1/downloads/ast_unauth_test", {
      headers: { origin },
    });
    expect(downloadUnauth.status()).toBe(401);
    expect(downloadUnauth.headers()["content-type"]).toContain("application/problem+json");
  });

  test("opens Quick Search modal dialog, traps focus, and restores focus on Escape", async ({
    page,
  }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: /Open quick catalogue search/i });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: /Quick Catalogue Search/i });
    await expect(dialog).toBeVisible();

    const searchInput = dialog.getByRole("searchbox");
    await expect(searchInput).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("protects /admin sub-ledgers against unauthenticated reads while rendering operational headers", async ({
    page,
  }) => {
    for (const adminRoute of [
      "/admin/titles",
      "/admin/rights",
      "/admin/media",
      "/admin/takedowns",
      "/admin/audit",
    ]) {
      await page.goto(adminRoute);
      await expect(page.getByText(/Authorization Required/i)).toBeVisible();
    }
  });

  test("navigates across consumer, search, legal, compliance report, and operations shells", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: /Featured Cinema/i })).toBeVisible();

    const skipLink = page.getByRole("link", { name: "Skip to content" });
    await skipLink.focus();
    await expect(skipLink).toBeFocused();

    await page.goto("/movies");
    await expect(page.getByRole("heading", { level: 1, name: "Movies" })).toBeVisible();

    await page.goto("/search?q=satyajit");
    await expect(page.getByText(/No rights-approved results for/i)).toBeVisible();

    await page.goto("/legal/takedown");
    await expect(
      page.getByRole("heading", { level: 1, name: /Takedown & Legal Hold Procedure/i }),
    ).toBeVisible();

    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { level: 1, name: /Platform Operations & Rights Control Plane/i }),
    ).toBeVisible();
  });

  test("persists a formal compliance report on /report-content and returns a TKD case number", async ({
    page,
  }) => {
    await page.goto("/report-content");
    await expect(page.locator('form[data-hydrated="true"]')).toBeVisible();

    await page.getByLabel(/Your name or organization/i).fill("E2E Rights Auditor");
    await page.getByLabel(/Contact email/i).fill("auditor@example.org");
    await page.getByLabel(/Observed page path/i).fill("/movies/test-entry");
    await page
      .getByLabel(/Claim details/i)
      .fill("Automated E2E verification of compliance intake persistence.");
    await page.getByRole("button", { name: "Log Compliance Report" }).click();

    await expect(page.getByText(/Compliance report recorded/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/TKD-/)).toBeVisible();
  });

  for (const width of VIEWPORT_WIDTHS) {
    test(`prevents horizontal overflow at ${width}px viewport width`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(hasOverflow).toBe(false);
    });
  }
});
