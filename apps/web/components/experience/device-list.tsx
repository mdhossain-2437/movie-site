"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { PosterGrid } from "@/components/catalogue/poster-card";
import { Icon } from "@/components/ui/icon";
import { updateDeviceState, useDeviceState } from "@/lib/client/device-state";
import type { TitleCard } from "@/lib/catalogue/types";
import { useNotify } from "./providers";
import { Dialog } from "./dialog";

export function DeviceList({ cards, emptyState }: { cards: TitleCard[]; emptyState: ReactNode }) {
  const { saved } = useDeviceState();
  const confirmation = useRef<HTMLDialogElement>(null);
  const notify = useNotify();
  const savedCards = cards.filter((card) => saved.includes(card.slug));
  return (
    <>
      <div className="list-toolbar">
        <p>
          <Icon name="bookmark" />
          <strong>{String(savedCards.length).padStart(2, "0")}</strong> saved on this device
        </p>
        {saved.length > 0 ? (
          <button
            type="button"
            className="text-link"
            onClick={() => confirmation.current?.showModal()}
          >
            Clear my list
            <Icon name="close" />
          </button>
        ) : (
          <Link href="/movies" className="text-link">
            Discover films
            <Icon name="arrow-up-right" />
          </Link>
        )}
      </div>
      {savedCards.length > 0 ? <PosterGrid cards={savedCards} /> : emptyState}
      {saved.length > savedCards.length ? (
        <p className="device-list-note">
          Some saved development references are not in the current catalogue. They do not grant
          playback access.
        </p>
      ) : null}
      <Dialog
        ref={confirmation}
        className="confirmation-dialog"
        aria-labelledby="clear-list-heading"
      >
        <span className="confirmation-icon">
          <Icon name="bookmark" />
        </span>
        <p className="eyebrow">Only this device</p>
        <h2 id="clear-list-heading">Start a new chapter?</h2>
        <p>
          This removes all saved references from this browser. It does not change any account,
          catalogue record or rights decision.
        </p>
        <div>
          <button
            type="button"
            className="action-button action-outline"
            onClick={() => confirmation.current?.close()}
          >
            Keep my list
          </button>
          <button
            type="button"
            className="action-button action-primary"
            onClick={() => {
              updateDeviceState((current) => ({ ...current, saved: [] }));
              confirmation.current?.close();
              notify("Your device’s list is now clear.");
            }}
          >
            Clear list
            <Icon name="arrow" />
          </button>
        </div>
      </Dialog>
    </>
  );
}
