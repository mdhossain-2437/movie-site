import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ContinueWatchingRail,
  formatResumeClock,
  type ContinueWatchingItemDto,
} from "@/components/catalogue/continue-watching-rail";
import { getCinevaFilmBySlug } from "@/lib/catalogue/cineva-database";

describe("ContinueWatchingRail & formatResumeClock", () => {
  it("formats playback timestamps cleanly into MM:SS and H:MM:SS", () => {
    expect(formatResumeClock(0)).toBe("0:00");
    expect(formatResumeClock(65)).toBe("1:05");
    expect(formatResumeClock(125)).toBe("2:05");
    expect(formatResumeClock(4460)).toBe("1:14:20");
  });

  it("renders nothing when initialItems is empty", () => {
    const { container } = render(<ContinueWatchingRail initialItems={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders synced playback progress, resume links, semantic tokens, and zero emojis", () => {
    const monsoon = getCinevaFilmBySlug("the-last-monsoon");
    const items: ContinueWatchingItemDto[] = [
      {
        titleId: "ttl_1",
        titleSlug: "the-last-monsoon",
        titleEn: "The Last Monsoon",
        kind: "MOVIE",
        releaseYear: 2025,
        runtimeMinutes: 118,
        lastPositionSeconds: 125,
        durationSeconds: 7080,
        progressPercent: 18,
        updatedAt: "2026-11-07T10:00:00.000Z",
        studio: "Dhaka Riverfront Pictures",
        art: monsoon?.art ?? null,
      },
    ];

    const { container } = render(<ContinueWatchingRail initialItems={items} />);

    expect(screen.getByRole("heading", { name: "Continue Watching" })).toBeTruthy();
    expect(screen.getByText("The Last Monsoon")).toBeTruthy();
    expect(screen.getByText("Resume 2:05")).toBeTruthy();
    expect(screen.getByText("18% watched")).toBeTruthy();

    const progressBar = screen.getByRole("progressbar", {
      name: /The Last Monsoon playback progress/i,
    });
    expect(progressBar.getAttribute("aria-valuenow")).toBe("18");

    const resumeLink = screen.getByRole("link", {
      name: /Resume The Last Monsoon at 2:05/i,
    });
    expect(resumeLink.getAttribute("href")).toBe("/watch/the-last-monsoon?t=125");

    // Zero forbidden default Tailwind palette classes and zero decorative emojis
    expect(container.innerHTML).not.toMatch(/\b(bg-zinc-|text-white\b|bg-black\b|bg-slate-)/);
    expect(container.textContent ?? "").not.toMatch(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u,
    );
  });
});
