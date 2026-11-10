import type { ArtSpec } from "./types";

export type SearchEntryKind = "title" | "person" | "collection";

export interface SearchEntry {
  kind: SearchEntryKind;
  slug: string;
  href: string;
  label: string;
  labelBn?: string | null;
  sublabel: string;
  /** Extra searchable text: original titles, people, years, countries, genres. */
  keywords: string;
  art: ArtSpec | null;
  year: number | null;
}

export interface SearchHit {
  entry: SearchEntry;
  score: number;
}

/**
 * Lower-cases and strips Latin diacritics only (U+0300–U+036F) so "Méliès" matches "melies".
 */
export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeQuery(raw: string | string[] | undefined): string {
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (!first) return "";
  return first
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 120);
}

function fieldScore(field: string, query: string, weight: number): number {
  if (!field) return 0;
  if (field === query) return 100 * weight;
  if (field.startsWith(query)) return 70 * weight;
  if (field.split(" ").some((word) => word.startsWith(query))) return 50 * weight;
  if (field.includes(query)) return 30 * weight;
  return 0;
}

export function searchEntries(
  entries: readonly SearchEntry[],
  rawQuery: string,
  limit = 24,
): SearchHit[] {
  const query = normalizeForSearch(rawQuery);
  if (!query) return [];
  const tokens = query.split(" ").filter(Boolean);

  const hits: SearchHit[] = [];
  for (const entry of entries) {
    const label = normalizeForSearch(entry.label);
    const labelBn = normalizeForSearch(entry.labelBn ?? "");
    const keywords = normalizeForSearch(entry.keywords);
    const haystack = `${label} ${labelBn} ${keywords}`;

    // Every token must appear somewhere; the whole query is then ranked by field.
    if (!tokens.every((token) => haystack.includes(token))) continue;

    const score =
      Math.max(
        fieldScore(label, query, 1.4),
        fieldScore(labelBn, query, 1.3),
        fieldScore(keywords, query, 0.8),
      ) +
      tokens.length * 4 +
      (entry.kind === "title" ? 3 : entry.kind === "person" ? 2 : 1);

    hits.push({ entry, score: score > 0 ? score : 10 });
  }

  return hits
    .sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label))
    .slice(0, limit);
}
