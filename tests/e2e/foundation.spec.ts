import { expect, test } from "@playwright/test";

const VIEWPORT_WIDTHS = [360, 390, 430, 768, 1024, 1280, 1440, 1920] as const;

test.describe("Milestone M1 foundation routes & security headers", () => {
  test("serves /api/v1/health with security headers and no-store cache control", async ({
    request,
  }) => {
    const response = await request.get("/api/v1/health");
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-frame-options"]).toBe("DENY");

    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("@movie/web");
  });

  test("navigates across consumer, search, legal, and operations shells with keyboard skip-link", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: /catalogue opens only to verified rights/i }),
    ).toBeVisible();

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
