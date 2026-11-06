import { expect, test } from "@playwright/test";

test.describe("Cinematic Graphite Hybrid Discovery & Editorial Archive Experience", () => {
  test("renders editorial archive rail on Home and navigates to /collections and /people index pages", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: /catalogue opens only to verified rights/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "From the archive." })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("link", { name: "Curated Collections" }).click();
    await expect(page).toHaveURL(/\/collections$/);
    await expect(page.getByRole("heading", { level: 1, name: /Collections/i })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/people");
    await expect(page.getByRole("heading", { level: 1, name: /People/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("heading", { name: "The filmmakers." })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("explores a monochrome filmography through the cinematic poster transition to archive reference detail", async ({
    page,
  }) => {
    await page.goto("/people/f-w-murnau");
    await expect(page.getByRole("heading", { level: 1, name: "F. W. Murnau" })).toBeVisible({
      timeout: 15_000,
    });
    await page
      .getByRole("link", { name: "Nosferatu: A Symphony of Horror, 1922", exact: true })
      .click();
    await expect(page).toHaveURL(/\/movies\/nosferatu$/, { timeout: 15_000 });
    await expect(page.locator(".poster-wipe")).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1, name: /Nosferatu/ })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText("Rights verification pending", { exact: true }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("toggles local reduced-motion and Bangla-title preferences on /account alongside auth controls", async ({
    page,
  }) => {
    await page.goto("/account");
    await expect(
      page.getByRole("heading", { level: 1, name: /Profile & Account Security/i }),
    ).toBeVisible({ timeout: 15_000 });

    const motionSwitch = page.getByRole("switch", { name: "Reduced motion" });
    const banglaSwitch = page.getByRole("switch", { name: "Show Bangla titles" });

    await expect(motionSwitch).toBeVisible({ timeout: 15_000 });
    await expect(banglaSwitch).toBeVisible({ timeout: 15_000 });

    await motionSwitch.click();
    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");

    await banglaSwitch.click();
    await expect(page.locator("html")).toHaveAttribute("data-bangla", "show");
  });

  test("keeps every hybrid & archive screen within the viewport with zero console errors", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    const routes = [
      "/collections",
      "/people",
      "/movies/nosferatu",
      "/people/f-w-murnau",
      "/collections/german-expressionism",
      "/genres/science-fiction",
      "/watch/sunrise",
      "/watchlist",
      "/account",
    ];

    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status(), `HTTP status on ${route}`).toBe(200);
      await expect(page.locator("main#main")).toBeVisible({ timeout: 15_000 });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow, `Horizontal overflow on ${route}`).toBe(false);
    }

    expect(errors).toEqual([]);
  });
});
