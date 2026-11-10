"use client";

import { useRef } from "react";
import { Icon } from "@/components/ui/icon";
import { updateDeviceState, useDeviceState } from "@/lib/client/device-state";
import { useNotify } from "./providers";
import { Dialog } from "./dialog";

export function DevicePreferences() {
  const state = useDeviceState();
  const confirm = useRef<HTMLDialogElement>(null);
  const notify = useNotify();
  return (
    <>
      <div className="preference-row">
        <div>
          <h3>Reduced motion</h3>
          <p>Keep the cinema. Lose the movement. Your system preference is also respected.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-label="Reduced motion"
          aria-checked={state.reduceMotion}
          className="preference-switch"
          onClick={() =>
            updateDeviceState((current) => ({ ...current, reduceMotion: !current.reduceMotion }))
          }
        >
          <span />
        </button>
      </div>
      <div className="preference-clear">
        <span>
          <Icon name="shield" />
          Stored on this browser only. No tracking cookies.
        </span>
        <button type="button" className="text-link" onClick={() => confirm.current?.showModal()}>
          Reset local data
          <Icon name="arrow-up-right" />
        </button>
      </div>
      <Dialog ref={confirm} className="confirmation-dialog" aria-labelledby="reset-local-heading">
        <span className="confirmation-icon">
          <Icon name="shield" />
        </span>
        <p className="eyebrow">Your device, your choice</p>
        <h2 id="reset-local-heading">A clean slate.</h2>
        <p>
          Reset motion settings and clear your device’s saved list. This does not affect server-side
          data or accounts.
        </p>
        <div>
          <button
            type="button"
            className="action-button action-outline"
            onClick={() => confirm.current?.close()}
          >
            Cancel
          </button>
          <button
            type="button"
            className="action-button action-primary"
            onClick={() => {
              updateDeviceState(() => ({ saved: [], reduceMotion: false }));
              confirm.current?.close();
              notify("Local preferences and saved references reset.");
            }}
          >
            Reset data
            <Icon name="arrow" />
          </button>
        </div>
      </Dialog>
    </>
  );
}
