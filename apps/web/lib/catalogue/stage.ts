/**
 * Development fixtures are visible only when the effective stage is development or test.
 * This intentionally avoids `getEnv()` so production builds never need secrets just to decide
 * that fixtures must stay hidden.
 */
export type EffectiveStage = "development" | "test" | "staging" | "production";

export function resolveEffectiveStage(
  raw: Record<string, string | undefined> = process.env,
): EffectiveStage {
  const appEnv = raw.APP_ENV?.trim();
  if (
    appEnv === "development" ||
    appEnv === "test" ||
    appEnv === "staging" ||
    appEnv === "production"
  ) {
    return appEnv;
  }
  // A misspelled explicit environment must never accidentally expose development fixtures.
  if (appEnv) return "production";
  const nodeEnv = raw.NODE_ENV?.trim();
  if (nodeEnv === "test" || nodeEnv === "production") {
    return nodeEnv;
  }
  return "development";
}

export function isFixtureCatalogueEnabled(
  raw: Record<string, string | undefined> = process.env,
): boolean {
  const stage = resolveEffectiveStage(raw);
  return stage === "development" || stage === "test";
}

export function resolveViewerTerritory(raw: Record<string, string | undefined> = process.env) {
  const territory = raw.DEFAULT_TERRITORY?.trim().toUpperCase();
  return territory && /^[A-Z]{2}$/.test(territory) ? territory : "BD";
}
