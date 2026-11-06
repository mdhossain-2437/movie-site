import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { GET as getHealth } from "@/app/api/v1/health/route";
import Home from "@/app/page";
import { proxy } from "@/proxy";
import { VideoPlayerShell } from "@/components/player/video-player-shell";
import { AvailabilityBadge, Button, ErrorState, FilterChip } from "@/components/ui";
import { HealthResponseSchema } from "@movie/contracts";

afterEach(() => {
  cleanup();
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

  it("renders the CINEVA Featured Cinema showcase Home page", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: /Featured Cinema/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse catalogue/i })).toHaveAttribute(
      "href",
      "/movies",
    );
  });

  it("renders VideoPlayerShell in IDLE state without autoplay and displays DRM disclosure", () => {
    render(
      <VideoPlayerShell
        titleSlug="meghna-chronicle-fixture"
        localizedTitle="Meghna Chronicle"
        runtimeMinutes={95}
      />,
    );
    const authorizeBtn = screen.getByRole("button", { name: /watch film/i });
    expect(authorizeBtn).toBeInTheDocument();
    const videoEl = screen.getByLabelText("Video player for Meghna Chronicle");
    expect(videoEl).toHaveAttribute("preload", "none");
    expect(videoEl).not.toHaveAttribute("autoplay");
    expect(
      screen.getByText(/Signed URLs enforce short-lived access control, not DRM/i),
    ).toBeInTheDocument();
  });
});

describe("GET /api/v1/health and Next.js 16 proxy security headers", () => {
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
