"use client";

import { Icon } from "@/components/ui/icon";
import { updateDeviceState, useDeviceState } from "@/lib/client/device-state";
import { useNotify } from "./providers";

export function SaveButton({
  slug,
  title,
  compact = false,
}: {
  slug: string;
  title: string;
  compact?: boolean;
}) {
  const state = useDeviceState();
  const saved = state.saved.includes(slug);
  const notify = useNotify();
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={`${saved ? "Remove" : "Save"} ${title}${saved ? " from" : " to"} this device’s list`}
      title={saved ? "Remove from this device’s list" : "Save on this device"}
      className={compact ? "icon-button save-button" : "action-button action-outline"}
      onClick={() => {
        const persisted = updateDeviceState((current) => ({
          ...current,
          saved: saved ? current.saved.filter((value) => value !== slug) : [...current.saved, slug],
        }));
        notify(
          saved
            ? "Removed from your device’s list."
            : persisted
              ? "Saved on this device. No account or playback access is created."
              : "Saved for this visit. Browser storage is unavailable.",
        );
      }}
    >
      <Icon name={saved ? "check" : "plus"} />
      {!compact ? <span>{saved ? "Saved" : "My List"}</span> : null}
    </button>
  );
}

export function ShareButton({
  title,
  path,
  compact = false,
}: {
  title: string;
  path: string;
  compact?: boolean;
}) {
  const notify = useNotify();
  async function share() {
    const url = new URL(path, window.location.origin).href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        notify("Page link copied.");
      } else {
        window.prompt("Copy this page link", url);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      notify("Sharing wasn’t available. Copy the page address from your browser.");
    }
  }
  return (
    <button
      type="button"
      className={compact ? "icon-button" : "action-button action-outline"}
      onClick={share}
      aria-label={`Share ${title}`}
      title="Share this page"
    >
      <Icon name="share" />
      {!compact ? <span>Share</span> : null}
    </button>
  );
}
