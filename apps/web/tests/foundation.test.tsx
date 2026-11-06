import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { NextRequest } from "next/server";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { GET as getHealth } from "@/app/api/v1/health/route";
import Home from "@/app/page";
import { proxy } from "@/proxy";
import { AvailabilityBadge, Button, ErrorState, FilterChip } from "@/components/ui";
import { HealthResponseSchema } from "@movie/contracts";

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("Cinematic Graphite UI primitives", () => {
  it("disables Button and marks aria-busy while loading", () => {
    render(<Button loading>Saving draft</Button>);
    const button = screen.getByRole("button", { name: "Saving draft" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("renders AvailabilityBadge with non-color glyph and accessible copy", () => {
    render(<AvailabilityBadge kind="rights_pending" />);
    expect(screen.getByText("Rights verification pending")).toBeInTheDocument();
    expect(screen.getByText("▲")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders ErrorState with role=alert and correlation ID", () => {
    render(
      <ErrorState
        title="Playback unavailable"
        description="No active rights grant was found for your region."
        correlationId="corr_test_12345"
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Playback unavailable");
    expect(alert).toHaveTextContent("corr_test_12345");
  });

  it("exposes aria-pressed state on FilterChip", () => {
    render(<FilterChip selected>Bangla</FilterChip>);
    const chip = screen.getByRole("button", { name: "Bangla" });
    expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  it("renders the rights-first archive with visibly marked development fixtures and no playback offer", () => {
    vi.stubEnv("APP_ENV", "test");
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: /rights-first film archive/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse the archive/i })).toHaveAttribute(
      "href",
      "/movies",
    );
    expect(
      screen.getByText(/development fixture · rights verification pending/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /watch now|play now|download now/i }),
    ).not.toBeInTheDocument();
  });

  it("shows an honest empty catalogue in production rather than publishing development references", () => {
    vi.stubEnv("APP_ENV", "production");
    render(<Home />);
    expect(screen.getByText(/catalogue opens only to verified rights/i)).toBeInTheDocument();
    expect(screen.queryByText("Sunrise")).not.toBeInTheDocument();
    expect(screen.queryByText(/development preview/i)).not.toBeInTheDocument();
  });
});

describe("GET /api/v1/health and Next.js 16 proxy security headers", () => {
  it("allows React debugging eval only in development, never in production", () => {
    vi.stubEnv("NODE_ENV", "development");
    const req = new NextRequest("http://localhost:3000/");
    expect(proxy(req).headers.get("Content-Security-Policy")).toContain("'unsafe-eval'");
    vi.stubEnv("NODE_ENV", "production");
    expect(proxy(req).headers.get("Content-Security-Policy")).not.toContain("'unsafe-eval'");
  });
  it("returns validated HealthResponseSchema with Cache-Control: no-store and propagates x-request-id", async () => {
    const req = new Request("http://localhost:3000/api/v1/health", {
      headers: { "x-request-id": "req_foundation_check_01" },
    });
    const res = await getHealth(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("x-request-id")).toBe("req_foundation_check_01");

    const json = await res.json();
    const parsed = HealthResponseSchema.safeParse(json);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe("ok");
      expect(parsed.data.requestId).toBe("req_foundation_check_01");
    }
  });

  it("sets strict security headers and uses no-referrer on /watch routes", () => {
    const homeReq = new NextRequest("http://localhost:3000/movies");
    const homeRes = proxy(homeReq);
    expect(homeRes.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(homeRes.headers.get("X-Frame-Options")).toBe("DENY");
    expect(homeRes.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(homeRes.headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(homeRes.headers.get("x-request-id")).toMatch(/^req_/);

    const watchReq = new NextRequest("http://localhost:3000/watch/example-slug");
    const watchRes = proxy(watchReq);
    expect(watchRes.headers.get("Referrer-Policy")).toBe("no-referrer");
  });
});
