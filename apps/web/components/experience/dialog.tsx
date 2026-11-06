"use client";

import type { ComponentProps, KeyboardEvent } from "react";

function containFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (
    event.defaultPrevented ||
    event.key !== "Tab" ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return;

  const dialog = event.currentTarget;
  const controls = Array.from(
    dialog.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea, [tabindex]"),
  ).filter(
    (control) =>
      control.tabIndex >= 0 &&
      !control.matches(":disabled") &&
      control.getClientRects().length > 0 &&
      getComputedStyle(control).visibility !== "hidden",
  );
  const first = controls[0];
  const last = controls.at(-1);
  const active = dialog.ownerDocument.activeElement;

  if (!first || !last) {
    event.preventDefault();
    dialog.focus();
  } else if (event.shiftKey && (active === first || !dialog.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
    event.preventDefault();
    first.focus();
  }
}

/** Native modal behavior with an explicit Tab loop that does not escape into browser chrome. */
export function Dialog({ onKeyDown, ...props }: ComponentProps<"dialog">) {
  return (
    <dialog
      {...props}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        containFocus(event);
      }}
    />
  );
}
