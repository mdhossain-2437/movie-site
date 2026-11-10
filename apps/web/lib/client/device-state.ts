"use client";

import { useSyncExternalStore } from "react";

export interface DeviceState {
  saved: string[];
  reduceMotion: boolean;
}

const KEY = "cinematic-graphite:device:v1";
const EVENT = "cg:device-state";
const EMPTY: DeviceState = { saved: [], reduceMotion: false };
let cachedRaw: string | null | undefined;
let snapshot: DeviceState = EMPTY;
let memoryOnly = false;

function parse(raw: string | null): DeviceState {
  if (!raw) return EMPTY;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return EMPTY;
    const obj = value as Record<string, unknown>;
    return {
      saved: Array.isArray(obj.saved)
        ? [
            ...new Set(
              obj.saved.filter(
                (slug): slug is string =>
                  typeof slug === "string" && /^[a-z0-9-]{1,100}$/.test(slug),
              ),
            ),
          ].slice(0, 200)
        : [],
      reduceMotion: obj.reduceMotion === true,
    };
  } catch {
    return EMPTY;
  }
}

export function getDeviceState(): DeviceState {
  if (typeof window === "undefined") return EMPTY;
  if (memoryOnly) return snapshot;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      snapshot = parse(raw);
    }
  } catch {
    memoryOnly = true;
  }
  return snapshot;
}

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) callback();
  };
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function useDeviceState() {
  return useSyncExternalStore(subscribe, getDeviceState, () => EMPTY);
}

/** Returns false if browser storage is blocked; the change still works for the current view. */
export function updateDeviceState(update: (current: DeviceState) => DeviceState): boolean {
  const next = update(getDeviceState());
  const raw = JSON.stringify(next);
  let persisted = true;
  try {
    window.localStorage.setItem(KEY, raw);
    memoryOnly = false;
  } catch {
    memoryOnly = true;
    persisted = false;
  }
  snapshot = next;
  cachedRaw = raw;
  window.dispatchEvent(new Event(EVENT));
  return persisted;
}
