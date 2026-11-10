import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExperienceProviders } from "@/components/experience/providers";
import { SaveButton } from "@/components/experience/actions";
import { Chrome } from "@/components/experience/chrome";
import { DevicePreferences } from "@/components/experience/preferences";
import { getDeviceState, updateDeviceState } from "@/lib/client/device-state";

vi.mock("next/navigation", () => ({
  usePathname: () => "/account",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
beforeEach(() => {
  window.localStorage.clear();
  getDeviceState();
});
afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-motion");
});

describe("device-only preview interactions", () => {
  it("advertises keyboard search only while its listener is registered and supports both modifiers", () => {
    const removeListener = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<Chrome entries={[]} />);
    const dialog = screen.getByLabelText<HTMLDialogElement>("Search the film archive", {
      selector: "dialog",
    });
    // jsdom lacks dialog methods; end-to-end tests cover the native focus trap.
    const showModal = vi.fn(() => {
      dialog.open = true;
    });
    dialog.showModal = showModal;
    for (const modal of document.querySelectorAll("dialog")) {
      modal.close = vi.fn(() => {
        modal.open = false;
      });
    }
    const trigger = screen.getByRole("button", { name: "Search" });
    expect(trigger).toHaveAttribute("aria-keyshortcuts", "Control+K Meta+K");
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getByRole("dialog", { name: "Search the film archive" })).toBe(dialog);
    expect(dialog).toBeVisible();
    expect(screen.getByRole("combobox")).toHaveFocus();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true, repeat: true });
    expect(dialog).toBeVisible();
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(dialog).not.toBeVisible();
    unmount();
    expect(trigger).not.toHaveAttribute("aria-keyshortcuts");
    expect(removeListener).toHaveBeenCalledWith("keydown", expect.any(Function));
    showModal.mockClear();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(showModal).not.toHaveBeenCalled();
  });

  it("saves and removes a reference, never an authorization token", () => {
    render(
      <ExperienceProviders>
        <SaveButton slug="sunrise" title="Sunrise" />
      </ExperienceProviders>,
    );
    const save = screen.getByRole("button", { name: /save sunrise to this device/i });
    fireEvent.click(save);
    expect(getDeviceState().saved).toEqual(["sunrise"]);
    expect(
      screen.getByRole("button", { name: /remove sunrise from this device/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent(/no account or playback access/i);
    fireEvent.click(screen.getByRole("button", { name: /remove sunrise/i }));
    expect(getDeviceState().saved).toEqual([]);
  });
  it("applies reduced-motion switch to the actual document", () => {
    render(
      <ExperienceProviders>
        <DevicePreferences />
      </ExperienceProviders>,
    );
    fireEvent.click(screen.getByRole("switch", { name: "Reduced motion" }));
    expect(document.documentElement).toHaveAttribute("data-motion", "reduce");
    expect(getDeviceState()).toMatchObject({ reduceMotion: true });
  });
  it("rejects malformed or unsafe saved values in browser storage", () => {
    window.localStorage.setItem(
      "cinematic-graphite:device:v1",
      JSON.stringify({
        saved: ["sunrise", "sunrise", "../secret", "https://bad.test"],
      }),
    );
    expect(getDeviceState().saved).toEqual(["sunrise"]);
    window.localStorage.setItem("cinematic-graphite:device:v1", "{broken");
    expect(getDeviceState().saved).toEqual([]);
  });
  it("updates the external store without an account or network request", () => {
    act(() => {
      updateDeviceState((current) => ({ ...current, saved: ["nosferatu"] }));
    });
    expect(getDeviceState().saved).toEqual(["nosferatu"]);
    expect(window.localStorage.getItem("cinematic-graphite:device:v1")).not.toMatch(
      /token|cookie|session|https/i,
    );
  });
});
