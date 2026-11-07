const STORAGE_KEY = "cineva:recent-seeds:v1";

export function readRecentSeedSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
  } catch {
    return [];
  }
}

export function pushRecentSeedSlug(slug: string): void {
  if (typeof window === "undefined" || !slug) return;
  try {
    const current = readRecentSeedSlugs().filter((item) => item !== slug);
    const next = [slug, ...current].slice(0, 6);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota or privacy-mode exceptions
  }
}
