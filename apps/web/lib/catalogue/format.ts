export function formatRuntime(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "Runtime unknown";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatLifespan(born: number | null, died: number | null): string | null {
  if (born && died) return `${born}–${died}`;
  if (born) return `b. ${born}`;
  return null;
}

export function decadeOf(year: number): string {
  return `${Math.floor(year / 10) * 10}s`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

/** Splits a long title into display lines on a colon (e.g. "Sunrise:" / "A Song of Two Humans"). */
export function splitDisplayTitle(title: string): string[] {
  const idx = title.indexOf(":");
  if (idx > 0 && idx < title.length - 1) {
    return [title.slice(0, idx + 1), title.slice(idx + 1).trim()];
  }
  return [title];
}

/** URL slug for facet values such as genres and countries ("Science fiction" → "science-fiction"). */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
