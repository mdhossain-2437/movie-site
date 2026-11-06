/** Artwork rights describe the illustration only, never the referenced film or a restoration. */
export const GENERATED_ART_PROVENANCE = {
  kind: "ORIGINAL_GENERATED_SVG",
  creator: "Cinematic Graphite development interface",
  source: "components/art/scenes.tsx",
  rightsNote:
    "Original code-generated illustration. No third-party poster, still or portrait is used.",
  filmRightsIncluded: false,
  language: "neutral",
  crops: ["poster-2x3", "backdrop-16x9"],
} as const;

export type ArtworkProvenance = typeof GENERATED_ART_PROVENANCE;
