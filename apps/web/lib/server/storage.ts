import "server-only";

import { getEnv } from "@movie/config";
import { InMemoryStorageAdapter, type StorageAdapter } from "@movie/storage";

let storageSingleton: StorageAdapter | null = null;

/**
 * Server-only private object storage adapter singleton.
 * Uses `MEDIA_SIGNING_SECRET` (distinct from `SESSION_SECRET`) for short-lived HMAC capabilities.
 */
export function getStorageAdapter(): StorageAdapter {
  if (!storageSingleton) {
    storageSingleton = new InMemoryStorageAdapter({
      signingSecret: getEnv().MEDIA_SIGNING_SECRET,
    });
  }
  return storageSingleton;
}
