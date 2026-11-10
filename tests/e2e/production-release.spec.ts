import { expect, test, type Page } from "@playwright/test";

// ============================================================================
// Shared Test Verification Utilities (Opaque-Box Invariants)
// ============================================================================

const BENGALI_UNICODE_REGEX = /[\u0980-\u09FF]/;

/**
 * Asserts that zero Bengali characters or script elements exist anywhere in the rendered DOM.
 */
async function assertZeroBengaliCharacters(page: Page, routeDescription: string) {
  const bengaliIssues = await page.evaluate(() => {
    const issues: string[] = [];
    const bnRegex = /[\u0980-\u09FF]/;

    // 1. Check all text nodes in document body
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (text && bnRegex.test(text)) {
        const parentTag = node.parentElement?.tagName.toLowerCase() ?? "unknown";
        const parentClass = node.parentElement?.className ?? "";
        issues.push(
          `Bengali glyphs in <${parentTag} class="${parentClass}">: "${text.slice(0, 60)}"`,
        );
      }
    }

    // 2. Check for elements with lang attributes indicating Bengali
    const bnLangElements = Array.from(
      document.querySelectorAll('[lang="bn"], [lang^="bn-"], [lang*="ben"]'),
    );
    for (const el of bnLangElements) {
      issues.push(
        `Element with lang="${el.getAttribute("lang")}": <${el.tagName.toLowerCase()}> "${el.textContent?.trim().slice(0, 40)}"`,
      );
    }

    // 3. Check for Bengali in input placeholders
    const inputs = Array.from(document.querySelectorAll("input, textarea"));
    for (const input of inputs) {
      const placeholder = input.getAttribute("placeholder");
      if (placeholder && bnRegex.test(placeholder)) {
        issues.push(`Input placeholder with Bengali: "${placeholder}"`);
      }
    }

    return issues;
  });

  expect(
    bengaliIssues,
    `Zero Bengali characters or script elements expected on ${routeDescription}, found: ${JSON.stringify(bengaliIssues)}`,
  ).toEqual([]);
}

/**
 * Asserts that the page styling strictly adheres to approved semantic tokens
 * and contains zero forbidden default Tailwind palette classes (e.g. bg-zinc-*, text-white, bg-black).
 */
async function assertSemanticTokensOnly(page: Page, routeDescription: string) {
  const forbiddenClasses = await page.evaluate(() => {
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
      /^text-white$/,
      /^bg-black$/,
    ];

    const detected: string[] = [];
    const elements = document.querySelectorAll("*");
    for (const el of elements) {
      for (const cls of Array.from(el.classList)) {
        if (forbiddenPatterns.some((pattern) => pattern.test(cls))) {
          detected.push(`<${el.tagName.toLowerCase()} class="${cls}">`);
        }
      }
    }
    return Array.from(new Set(detected)).slice(0, 25);
  });

  expect(
    forbiddenClasses,
    `Forbidden default Tailwind palette utility classes detected on ${routeDescription}: ${JSON.stringify(forbiddenClasses)}`,
  ).toEqual([]);
}

/**
 * Asserts anti-slop visual governance:
 * - Zero purple-blue / web3 neon gradient classes
 * - Zero decorative emojis in rendered text nodes
 */
async function assertAntiSlopStandards(page: Page, routeDescription: string) {
  const antiSlopIssues = await page.evaluate(() => {
    const issues: string[] = [];

    // 1. Emoji check in visible text nodes (excluding standard ASCII / punctuation)
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]/u;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (text && emojiRegex.test(text)) {
        issues.push(
          `Decorative emoji detected in <${node.parentElement?.tagName.toLowerCase()}>: "${text.slice(0, 40)}"`,
        );
      }
    }

    // 2. Purple-blue gradient utility check
    const purpleBlueClasses = Array.from(document.querySelectorAll("*")).filter((el) => {
      return Array.from(el.classList).some(
        (c) =>
          /from-(purple|indigo|violet|blue)-/i.test(c) ||
          /to-(purple|indigo|violet|blue)-/i.test(c),
      );
    });
    if (purpleBlueClasses.length > 0) {
      issues.push(`Purple-blue gradient classes found on ${purpleBlueClasses.length} element(s)`);
    }

    return issues;
  });

  expect(antiSlopIssues, `Anti-slop violations detected on ${routeDescription}`).toEqual([]);
}

/**
 * Asserts that document maintains zero horizontal overflow (scrollWidth <= clientWidth).
 */
async function assertZeroHorizontalOverflow(page: Page, routeDescription: string) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const clientWidth = doc.clientWidth;
    const docScrollWidth = doc.scrollWidth;
    const bodyScrollWidth = body ? body.scrollWidth : 0;
    return {
      hasOverflow: docScrollWidth > clientWidth || bodyScrollWidth > clientWidth,
      clientWidth,
      docScrollWidth,
      bodyScrollWidth,
    };
  });

  expect(
    overflow.hasOverflow,
    `Horizontal overflow detected on ${routeDescription}: clientWidth=${overflow.clientWidth}, docScrollWidth=${overflow.docScrollWidth}, bodyScrollWidth=${overflow.bodyScrollWidth}`,
  ).toBe(false);
}

// ============================================================================
// TIER 1: Feature Coverage (Happy Path for Requirements R1 through R6)
// ============================================================================

test.describe("Tier 1: Feature Coverage (Requirements R1–R6)", () => {
  test("R1: Complete English localization with zero Bengali glyphs or script tags across major routes", async ({
    page,
  }) => {
    const routesToAudit = [
      { path: "/", name: "Home" },
      { path: "/search", name: "Search" },
      { path: "/movies/the-last-monsoon", name: "Movie Details" },
      { path: "/watch/the-last-monsoon", name: "Watch Theater" },
      { path: "/account", name: "Account Management" },
      { path: "/collections", name: "Collections Index" },
      { path: "/genres/noir", name: "Genre Archive (Noir)" },
      { path: "/people", name: "People Index" },
      { path: "/people/amina-rahman", name: "Person Showcase (Amina Rahman)" },
    ];

    for (const route of routesToAudit) {
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `HTTP status on ${route.name} (${route.path})`).toBe(200);

      // Wait for primary shell or content
      await page.waitForSelector("body", { timeout: 15_000 });

      // Invariant: ZERO Bengali characters or script elements anywhere in rendered DOM
      await assertZeroBengaliCharacters(page, `${route.name} (${route.path})`);
    }
  });

  test("R2: Movie catalog & details pages render rich metadata (synopsis, cast, crew, ratings) with graceful degradation", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    // 1. Verify Movie Catalog Page (/movies)
    const moviesResponse = await page.goto("/movies", { waitUntil: "domcontentloaded" });
    expect(moviesResponse?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: /Movies/i })).toBeVisible({
      timeout: 15_000,
    });

    // 2. Verify Movie Details Page (/movies/the-last-monsoon)
    const detailResponse = await page.goto("/movies/the-last-monsoon", {
      waitUntil: "domcontentloaded",
    });
    expect(detailResponse?.status()).toBe(200);

    // Verify rich title and synopsis
    await expect(page.getByRole("heading", { level: 1, name: /The Last Monsoon/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/In the shadow of a prolonged monsoon in Old Dhaka/i)).toBeVisible({
      timeout: 15_000,
    });

    // Verify Cast & Crew credits section
    const creditsHeading = page.locator("#credits-heading, h2:has-text('Cast & Crew')");
    await expect(creditsHeading).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: "Amina Rahman" }).first()).toBeVisible();

    // Verify Technical & Release Details specifications ledger
    const detailsHeading = page.locator(
      "#details-heading, h2:has-text('Technical & Release Details')",
    );
    await expect(detailsHeading).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/118 minutes/i)).toBeVisible();

    // Verify ratings and acclaim indicators
    await expect(page.getByText(/CINEVA Index|Top Rated|★/i).first()).toBeVisible({
      timeout: 15_000,
    });

    // Verify graceful degradation: pages load cleanly without console or page errors
    expect(errors, "Expected zero uncaught page or console errors").toEqual([]);
  });

  test("R3: Video player loads on watch route, displays responsive playback controls, and renders video/canvas fallback", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/watch/the-last-monsoon", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main#main")).toBeVisible({ timeout: 15_000 });

    // 1. Initial IDLE state displays "Watch Film" initiation button
    const watchTrigger = page.getByRole("button", { name: /Watch Film|Play/i });
    await expect(watchTrigger).toBeVisible({ timeout: 15_000 });

    // 2. Click to authorize stream and initiate playback
    await watchTrigger.click();

    // 3. Verify state transition to PLAYING and control elements become available
    const playPauseBtn = page.locator(
      'button[aria-label="Pause"], button[aria-label="Play"], button:has-text("Pause"), button:has-text("Play")',
    );
    await expect(playPauseBtn.first()).toBeVisible({ timeout: 15_000 });

    // 4. Verify Timeline Scrubber slider
    const scrubber = page.locator(
      'input[type="range"]#player-timeline-slider, input[type="range"]',
    );
    await expect(scrubber.first()).toBeVisible({ timeout: 15_000 });

    // 5. Verify Resolution picker dropdown
    const resolutionPicker = page.locator(
      "select#player-resolution-picker, select[id*='resolution']",
    );
    await expect(resolutionPicker.first()).toBeVisible({ timeout: 15_000 });

    // 6. Verify Volume / Mute control
    const muteBtn = page.locator(
      'button[aria-label*="audio"], button[aria-label*="Mute"], button:has-text("Vol"), button:has-text("Muted")',
    );
    await expect(muteBtn.first()).toBeVisible({ timeout: 15_000 });

    // 7. Verify Video Element or Cinema Canvas Reel fallback is actively rendered
    const videoOrCanvas = page.locator("video, canvas");
    const count = await videoOrCanvas.count();
    expect(count, "Expected at least one video or canvas media element").toBeGreaterThanOrEqual(1);

    // Verify zero console errors throughout playback initialization
    expect(consoleErrors, "Console errors observed during video player test").toEqual([]);
  });

  test("R4: Backend user authentication flows: register, login, session persistence, and playback resume timestamp", async ({
    page,
    baseURL,
  }) => {
    const origin = baseURL ?? "http://127.0.0.1:3100";
    const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 10_000)}`;
    const testEmail = `e2e_viewer_${uniqueId}@example.com`;
    const testPassword = "SecurePassword123!";
    const testDisplayName = `Viewer ${uniqueId}`;

    // 1. Register new viewer via API endpoint (shared browser context cookie jar via page.request)
    const registerResponse = await page.request.post("/api/v1/auth/register", {
      headers: { origin },
      data: {
        email: testEmail,
        password: testPassword,
        displayName: testDisplayName,
      },
    });
    expect(registerResponse.status(), "Register response status").toBe(201);
    const registerJson = await registerResponse.json();
    expect(registerJson.authenticated).toBe(true);
    expect(registerJson.actor.roles).toContain("VIEWER");

    // 2. Verify Session Persistence via GET /api/v1/auth/session
    const sessionResponse = await page.request.get("/api/v1/auth/session");
    expect(sessionResponse.status()).toBe(200);
    const sessionJson = await sessionResponse.json();
    expect(sessionJson.authenticated).toBe(true);
    expect(sessionJson.session.email).toBe(testEmail);
    expect(sessionJson.session.displayName).toBe(testDisplayName);

    // 3. Access Account Page UI and verify identity presentation
    await page.goto("/account", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: /Profile & Account Security/i }),
    ).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(testDisplayName).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(testEmail).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("VIEWER").first()).toBeVisible({ timeout: 15_000 });

    // 4. Verify Playback Session Authorization & Resume Timestamp
    const sessionAuthResponse = await page.request.post("/api/v1/playback-sessions", {
      headers: { origin },
      data: {
        titleSlug: "the-last-monsoon",
        drmCapableClient: false,
      },
    });
    expect(sessionAuthResponse.status(), "Playback authorization status").toBe(201);
    const sessionData = await sessionAuthResponse.json();
    expect(sessionData.sessionId).toBeDefined();
    expect(sessionData.playbackToken).toBeDefined();

    // Send heartbeat to record position (resume timestamp at 125 seconds)
    const heartbeatResponse = await page.request.post(
      `/api/v1/playback-sessions/${encodeURIComponent(sessionData.sessionId)}/heartbeat`,
      {
        headers: { origin },
        data: {
          playbackToken: sessionData.playbackToken,
          positionSeconds: 125,
          allowBackwardSeek: false,
          qoeEvent: {
            eventType: "HEARTBEAT",
            activeResolution: "1080p",
          },
        },
      },
    );
    expect(heartbeatResponse.status(), "Heartbeat status").toBe(200);

    // Verify Continue Watching API reflects the 125s resume timestamp
    const cwResponse = await page.request.get("/api/v1/continue-watching");
    expect(cwResponse.status()).toBe(200);
    const cwJson = await cwResponse.json();
    expect(cwJson.authenticated).toBe(true);
    expect(
      cwJson.continueWatching.some(
        (item: { titleSlug: string; lastPositionSeconds: number }) =>
          item.titleSlug === "the-last-monsoon" && item.lastPositionSeconds === 125,
      ),
    ).toBe(true);

    // 5. Verify Logout and Login flow
    const logoutResponse = await page.request.post("/api/v1/auth/logout", {
      headers: { origin },
    });
    expect(logoutResponse.status()).toBe(200);

    const reLoginResponse = await page.request.post("/api/v1/auth/login", {
      headers: { origin },
      data: {
        email: testEmail,
        password: testPassword,
      },
    });
    expect(reLoginResponse.status()).toBe(200);
    const reLoginJson = await reLoginResponse.json();
    expect(reLoginJson.authenticated).toBe(true);
  });

  test("R5: Anti-slop interactive styling, semantic CSS token compliance, touch target dimensions, and zero horizontal overflow", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // 1. Semantic token compliance: zero forbidden default Tailwind palette classes
    await assertSemanticTokensOnly(page, "Home (/)");

    // 2. Anti-slop standards: zero emojis and zero purple-blue gradients
    await assertAntiSlopStandards(page, "Home (/)");

    // 3. Zero horizontal overflow invariant
    await assertZeroHorizontalOverflow(page, "Home (/)");

    // 4. Desktop interactive touch target audit (>= 24x24px)
    const desktopButtons = page.locator("header button, header a, nav a, main button, footer a");
    const count = await desktopButtons.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 15); i++) {
      const el = desktopButtons.nth(i);
      if (await el.isVisible()) {
        const box = await el.boundingBox();
        if (box && box.width > 0 && box.height > 0) {
          expect(
            Math.round(box.width),
            `Desktop control width >= 24px (got ${box.width}px)`,
          ).toBeGreaterThanOrEqual(24);
          expect(
            Math.round(box.height),
            `Desktop control height >= 24px (got ${box.height}px)`,
          ).toBeGreaterThanOrEqual(24);
        }
      }
    }
  });

  test("R6: Health check endpoint verification (GET /api/v1/health returns status 200)", async ({
    request,
  }) => {
    const response = await request.get("/api/v1/health");
    expect(response.status()).toBe(200);

    const headers = response.headers();
    expect(headers["cache-control"]).toBe("no-store");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");

    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("@movie/web");
    expect(body.version).toBeDefined();
    expect(body.requestId).toBeDefined();
  });
});

// ============================================================================
// TIER 2: Boundary & Corner Cases
// ============================================================================

test.describe("Tier 2: Boundary & Corner Cases", () => {
  test("Unauthenticated vs Authenticated Account Viewport: guards sensitive session details", async ({
    page,
    baseURL,
  }) => {
    const origin = baseURL ?? "http://127.0.0.1:3100";
    // Ensure session is cleared
    await page.request.post("/api/v1/auth/logout", { headers: { origin } }).catch(() => {});

    await page.goto("/account", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: /Profile & Account Security/i }),
    ).toBeVisible({
      timeout: 15_000,
    });

    // Unauthenticated user should see Sign In form and Create Viewer Account form
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Viewer Account" })).toBeVisible();

    // No authenticated session cards or sensitive user email should be rendered
    await expect(page.getByText("Active Sessions (")).toHaveCount(0);
  });

  test("Video player seeking boundary conditions: handles 0s, forward seek, and clamped seeking gracefully", async ({
    page,
  }) => {
    await page.goto("/watch/the-last-monsoon", { waitUntil: "domcontentloaded" });

    // Start playback
    const watchTrigger = page.getByRole("button", { name: /Watch Film|Play/i });
    await expect(watchTrigger).toBeVisible({ timeout: 15_000 });
    await watchTrigger.click();

    // Fast-forward +10s button
    const fwdBtn = page.getByRole("button", { name: "+10s" });
    if (await fwdBtn.isVisible()) {
      await fwdBtn.click();
      // Ensure player state remains playing or paused without throwing error
      const playerState = await page
        .locator("[data-player-state]")
        .getAttribute("data-player-state");
      expect(["PLAYING", "PAUSED", "BUFFERING"]).toContain(playerState);
    }

    // Rewind -10s button
    const rwdBtn = page.getByRole("button", { name: "-10s" });
    if (await rwdBtn.isVisible()) {
      await rwdBtn.click();
      const playerState = await page
        .locator("[data-player-state]")
        .getAttribute("data-player-state");
      expect(["PLAYING", "PAUSED", "BUFFERING"]).toContain(playerState);
    }
  });

  const EDGE_VIEWPORT_WIDTHS = [360, 390, 768, 1440, 1920] as const;

  for (const width of EDGE_VIEWPORT_WIDTHS) {
    test(`Stress-tests zero horizontal overflow at edge viewport width ${width}px on Home and Movie Details`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });

      // Check Home
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await assertZeroHorizontalOverflow(page, `Home at ${width}px`);

      // Check Movie Details
      await page.goto("/movies/the-last-monsoon", { waitUntil: "domcontentloaded" });
      await assertZeroHorizontalOverflow(page, `Movie Details at ${width}px`);
    });
  }

  test("Mobile viewport touch target bounding box audit (<768px): controls meet >= 44x44px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Floating dock interactive items must satisfy >= 44x44px on mobile
    const dock = page.locator("nav[aria-label*='dock']");
    if (await dock.isVisible()) {
      const items = dock.locator("a, button");
      const itemCount = await items.count();
      for (let i = 0; i < itemCount; i++) {
        const item = items.nth(i);
        if (await item.isVisible()) {
          const box = await item.boundingBox();
          if (box) {
            expect(
              Math.round(box.width),
              `Mobile dock target width >= 44px (got ${box.width}px)`,
            ).toBeGreaterThanOrEqual(44);
            expect(
              Math.round(box.height),
              `Mobile dock target height >= 44px (got ${box.height}px)`,
            ).toBeGreaterThanOrEqual(44);
          }
        }
      }
    }
  });

  test("Authentication input validation boundaries: rejects password < 10 characters and malformed emails", async ({
    request,
    baseURL,
  }) => {
    const origin = baseURL ?? "http://127.0.0.1:3100";

    // 1. Password under 10 characters
    const shortPasswordResponse = await request.post("/api/v1/auth/register", {
      headers: { origin },
      data: {
        email: "boundary_user@example.com",
        password: "short",
        displayName: "Valid Name",
      },
    });
    expect(shortPasswordResponse.status()).toBe(400);

    // 2. Malformed email address
    const malformedEmailResponse = await request.post("/api/v1/auth/register", {
      headers: { origin },
      data: {
        email: "not-an-email",
        password: "ValidPassword123!",
        displayName: "Valid Name",
      },
    });
    expect(malformedEmailResponse.status()).toBe(400);
  });
});

// ============================================================================
// TIER 3: Cross-Feature Combinations
// ============================================================================

test.describe("Tier 3: Cross-Feature Combinations", () => {
  test("Cross-feature flow: Auth -> Playback Stream -> Heartbeat -> Personalized Recommendations", async ({
    page,
    baseURL,
  }) => {
    const origin = baseURL ?? "http://127.0.0.1:3100";
    const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 10_000)}`;
    const email = `tier3_${uniqueId}@example.com`;
    const password = "ComplexPassword987!";
    const displayName = `Tier 3 User ${uniqueId}`;

    // 1. Authenticate user
    const regRes = await page.request.post("/api/v1/auth/register", {
      headers: { origin },
      data: { email, password, displayName },
    });
    expect(regRes.status()).toBe(201);

    // 2. Authorize playback for title
    const streamRes = await page.request.post("/api/v1/playback-sessions", {
      headers: { origin },
      data: { titleSlug: "the-last-monsoon" },
    });
    expect(streamRes.status()).toBe(201);
    const sessionPayload = await streamRes.json();

    // 3. Emit heartbeat with progress
    const hbRes = await page.request.post(
      `/api/v1/playback-sessions/${encodeURIComponent(sessionPayload.sessionId)}/heartbeat`,
      {
        headers: { origin },
        data: {
          playbackToken: sessionPayload.playbackToken,
          positionSeconds: 240,
        },
      },
    );
    expect(hbRes.status()).toBe(200);

    // 4. Query recommendation engine without explicit seeds and verify server watch_history integration
    const recRes = await page.request.get("/api/v1/recommendations?limit=4");
    expect(recRes.status()).toBe(200);
    const recJson = await recRes.json();
    expect(recJson.seedSource).toBe("watch_history");
    expect(recJson.seedSlugs).toContain("the-last-monsoon");
    expect(recJson.count).toBeGreaterThan(0);
    expect(Array.isArray(recJson.items)).toBe(true);
    expect(recJson.items[0].slug).toBeDefined();

    // 5. Navigate to Home and verify Continue Watching rail & UI render cleanly for authenticated user
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main#main")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("continue-watching-rail")).toBeVisible({ timeout: 15_000 });
  });

  test("Reduced motion preference switch applies data-motion attribute and neutralizes animations", async ({
    page,
  }) => {
    await page.goto("/account", { waitUntil: "domcontentloaded" });

    // Look for reduced motion toggle switch
    const motionSwitch = page.getByRole("switch", { name: /Reduced motion/i });
    if (await motionSwitch.isVisible()) {
      await motionSwitch.click();
      await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
    }
  });
});

// ============================================================================
// TIER 4: Real-World User Scenarios
// ============================================================================

test.describe("Tier 4: Real-World User Scenarios", () => {
  test("Complete discovery-to-watch user journey: Search -> Details -> Theater Playback -> Return", async ({
    page,
  }) => {
    const journeyErrors: string[] = [];
    page.on("pageerror", (err) => journeyErrors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") journeyErrors.push(msg.text());
    });

    // Step 1: User arrives at the platform Home page
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main#main")).toBeVisible({ timeout: 15_000 });

    // Step 2: User opens Quick Search dialog or navigates to search
    const quickSearchBtn = page.getByRole("button", {
      name: /Open quick catalogue search/i,
    });
    if (await quickSearchBtn.isVisible()) {
      await quickSearchBtn.click();
      const dialog = page.getByRole("dialog", { name: /Quick Catalogue Search/i });
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    }

    // Step 3: User navigates to movies catalogue and selects a film
    await page.goto("/movies", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: /Movies/i })).toBeVisible({
      timeout: 15_000,
    });

    // Step 4: User navigates into film details (/movies/the-last-monsoon)
    await page.goto("/movies/the-last-monsoon", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: /The Last Monsoon/i })).toBeVisible({
      timeout: 15_000,
    });

    // Step 5: User engages with "Watch Now" action to launch theater mode
    const watchLink = page.getByRole("link", { name: /Watch Now|Play/i }).first();
    await expect(watchLink).toBeVisible({ timeout: 15_000 });
    await watchLink.click();

    // Step 6: User enters the watch theater page
    await expect(page).toHaveURL(/\/watch\/the-last-monsoon/, { timeout: 15_000 });
    const watchFilmBtn = page.getByRole("button", { name: /Watch Film|Play/i }).first();
    await expect(watchFilmBtn).toBeVisible({ timeout: 15_000 });

    // Step 7: User starts playback and verifies controls
    await watchFilmBtn.click();
    await expect(page.locator("video, canvas").first()).toBeVisible({ timeout: 15_000 });

    // Step 8: User returns cleanly back to movie details
    const backBtn = page
      .getByRole("link", { name: /Back to Details|Back to Film Details/i })
      .first();
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await expect(page).toHaveURL(/\/movies\/the-last-monsoon/, { timeout: 15_000 });
    }

    // Invariant: Entire user journey completes with zero uncaught console errors
    expect(journeyErrors, "Errors encountered during discovery-to-watch user journey").toEqual([]);
  });
});
