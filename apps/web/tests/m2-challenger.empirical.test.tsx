import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlaybackQoeEventInputSchema } from "@movie/contracts";
import { FloatingDock } from "@/components/layout/floating-dock";
import { SearchCommandModal } from "@/components/layout/search-command";
import { VideoPlayerShell } from "@/components/player/video-player-shell";
import { POST as handleQoePost } from "@/app/api/v1/playback-sessions/[id]/qoe/route";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/movies/the-last-monsoon",
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Empirical Challenger: Milestone 2 UI, Search Navigation & QoE Telemetry Stress Suite", () => {
  describe("1. FloatingDock & Ctrl+K Search Navigation", () => {
    it("dispatches Ctrl+K keyboard event when quick search trigger is clicked", () => {
      render(<FloatingDock />);
      const searchButton = screen.getByRole("button", { name: /^search$/i });

      let capturedEvent: KeyboardEvent | null = null;
      const keyHandler = (event: KeyboardEvent) => {
        capturedEvent = event;
      };
      window.addEventListener("keydown", keyHandler);

      fireEvent.click(searchButton);

      window.removeEventListener("keydown", keyHandler);

      expect(capturedEvent).not.toBeNull();
      const evt = capturedEvent as unknown as KeyboardEvent;
      expect(evt.key).toBe("k");
      expect(evt.ctrlKey).toBe(true);
    });

    it("opens SearchCommandModal on Ctrl+K and sets aria-modal dialog attributes", () => {
      render(<SearchCommandModal />);

      // Initially dialog is closed
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      // Dispatch Ctrl+K
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(screen.getByRole("heading", { name: /quick catalogue search/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/type an english or বাংলা title/i)).toBeInTheDocument();
    });

    it("opens SearchCommandModal on Meta+K (macOS Cmd+K support)", () => {
      render(<SearchCommandModal />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      fireEvent.keyDown(window, { key: "k", metaKey: true });

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("traps focus inside SearchCommandModal and handles Tab / Shift+Tab wrapping", () => {
      render(<SearchCommandModal />);

      // Open the modal
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      expect(focusable.length).toBeGreaterThanOrEqual(2);

      const firstElement = focusable[0]!;
      const lastElement = focusable[focusable.length - 1]!;

      // Test Shift+Tab wrapping: when focused on first element, pressing Shift+Tab moves focus to last element
      firstElement.focus();
      expect(document.activeElement).toBe(firstElement);

      const shiftTabEvent = new KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      const shiftTabPreventDefault = vi.spyOn(shiftTabEvent, "preventDefault");
      window.dispatchEvent(shiftTabEvent);

      expect(shiftTabPreventDefault).toHaveBeenCalled();
      expect(document.activeElement).toBe(lastElement);

      // Test Tab wrapping: when focused on last element, pressing Tab moves focus to first element
      lastElement.focus();
      expect(document.activeElement).toBe(lastElement);

      const tabEvent = new KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey: false,
        bubbles: true,
        cancelable: true,
      });
      const tabPreventDefault = vi.spyOn(tabEvent, "preventDefault");
      window.dispatchEvent(tabEvent);

      expect(tabPreventDefault).toHaveBeenCalled();
      expect(document.activeElement).toBe(firstElement);
    });

    it("closes SearchCommandModal on Escape key press", () => {
      render(<SearchCommandModal />);

      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("2. VideoPlayerShell & QoE Telemetry Integration", () => {
    it("validates all VideoPlayerShell telemetry event payloads against Zod schema", () => {
      const validToken = "pbk_mock_test_token_min_16_characters";

      // 1. MANIFEST_LOADED payload
      const manifestLoaded = {
        playbackToken: validToken,
        eventType: "MANIFEST_LOADED",
        startupLatencyMs: 380,
        renditionProfile: "1080p",
      };
      expect(() => PlaybackQoeEventInputSchema.parse(manifestLoaded)).not.toThrow();

      // 2. FIRST_FRAME payload
      const firstFrame = {
        playbackToken: validToken,
        eventType: "FIRST_FRAME",
        startupLatencyMs: 1420,
        renditionProfile: "1080p",
      };
      expect(() => PlaybackQoeEventInputSchema.parse(firstFrame)).not.toThrow();

      // 3. PLAYBACK_ERROR payload
      const playbackError = {
        playbackToken: validToken,
        eventType: "PLAYBACK_ERROR",
        errorCode: "SESSION_EXPIRED",
        renditionProfile: "1080p",
      };
      expect(() => PlaybackQoeEventInputSchema.parse(playbackError)).not.toThrow();

      // 4. ENDED payload
      const ended = {
        playbackToken: validToken,
        eventType: "ENDED",
        renditionProfile: "1080p",
      };
      expect(() => PlaybackQoeEventInputSchema.parse(ended)).not.toThrow();
    });

    it("rejects telemetry payloads containing sensitive secrets or PII with 403 Forbidden", async () => {
      const APP_URL = "http://localhost:3000";
      const forbiddenKeys = [
        "cookie",
        "bearer",
        "authorization",
        "password",
        "jwt",
        "auth_token",
        "secret_key",
      ];

      for (const secretKey of forbiddenKeys) {
        const req = new Request(`${APP_URL}/api/v1/playback-sessions/pbs_sec_test/qoe`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: APP_URL,
          },
          body: JSON.stringify({
            playbackToken: "pbk_valid_token_string_16_chars",
            eventType: "FIRST_FRAME",
            [secretKey]: "confidential_leak_123",
          }),
        });

        const res = await handleQoePost(req, {
          params: Promise.resolve({ id: "pbs_sec_test" }),
        });
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.code).toBe("FORBIDDEN");
        expect(json.detail).toContain(secretKey);
      }
    });

    it("renders VideoPlayerShell in unauthenticated IDLE state without throwing errors", () => {
      expect(() => {
        render(
          <VideoPlayerShell
            titleSlug="the-last-monsoon"
            localizedTitle="The Last Monsoon"
            runtimeMinutes={118}
          />,
        );
      }).not.toThrow();

      expect(screen.getByText("Server-Authorized Stream")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Authorize & Load Stream" })).toBeInTheDocument();
      expect(
        screen.getByText(/Signed URLs enforce short-lived access control, not DRM/i),
      ).toBeInTheDocument();
    });

    it("handles keyboard interactions safely when sessionData is absent", () => {
      render(
        <VideoPlayerShell
          titleSlug="the-last-monsoon"
          localizedTitle="The Last Monsoon"
          runtimeMinutes={118}
        />,
      );

      // Keyboard shortcuts when idle must not throw
      expect(() => {
        fireEvent.keyDown(window, { key: " " });
        fireEvent.keyDown(window, { key: "ArrowLeft" });
        fireEvent.keyDown(window, { key: "ArrowRight" });
        fireEvent.keyDown(window, { key: "ArrowUp" });
        fireEvent.keyDown(window, { key: "ArrowDown" });
        fireEvent.keyDown(window, { key: "m" });
        fireEvent.keyDown(window, { key: "c" });
        fireEvent.keyDown(window, { key: "f" });
      }).not.toThrow();
    });

    it("silently absorbs QoE telemetry network drops without unhandled rejections", async () => {
      // Mock global fetch to reject
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockRejectedValue(new Error("Network connection dropped"));

      render(
        <VideoPlayerShell
          titleSlug="the-last-monsoon"
          localizedTitle="The Last Monsoon"
          runtimeMinutes={118}
        />,
      );

      // Trigger authorization attempt which fails with network error
      const authButton = screen.getByRole("button", { name: "Authorize & Load Stream" });
      fireEvent.click(authButton);

      // Verify component transitions to ERROR state safely without crashing
      const alert = await screen.findByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(screen.getByText(/Playback Unavailable/i)).toBeInTheDocument();
      expect(screen.getByText(/Network connection interrupted/i)).toBeInTheDocument();

      fetchSpy.mockRestore();
    });
  });
});
