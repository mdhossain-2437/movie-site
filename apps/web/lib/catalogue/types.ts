import type { MaturityRating, TitleStatus } from "@movie/contracts";
import type { RightsGrantRecord } from "@movie/domain";
import type { AvailabilityKind } from "@/components/ui/badge";
import type { ArtworkProvenance } from "./provenance";

/**
 * Original, operator-generated key-art motifs. Title artwork is drawn in code so the catalogue
 * never depends on third-party posters whose display rights are unverified.
 */
export type ArtMotif =
  | "sun"
  | "moon"
  | "shadow"
  | "tower"
  | "steps"
  | "shards"
  | "lens"
  | "wheel"
  | "silhouette"
  | "spiral"
  | "wings"
  | "door"
  | "constructivist"
  | "forest"
  | "screen"
  | "eye"
  | "horizon"
  | "fields";

export type ArtOption = "crescent" | "rails" | "domes" | "turrets" | "beams" | "factory";

/** Artwork colours are image content (like pixels in a poster file), not UI chrome tokens. */
export interface ArtPalette {
  bg: string;
  bg2: string;
  ink: string;
  accent: string;
  light: string;
}

export interface ArtSpec {
  motif: ArtMotif;
  palette: ArtPalette;
  option?: ArtOption;
}

export type CreditDepartment = "DIRECTOR" | "WRITER" | "ACTOR";

export interface FixtureCredit {
  department: CreditDepartment;
  /** Linked person record slug. */
  person?: string;
  /** Unlinked credit name when no person record exists yet. */
  name?: string;
  character?: string;
}

export interface CatalogueTitle {
  id: string;
  slug: string;
  title: string;
  titleBn: string;
  originalTitle: string;
  originalLanguage: string;
  soundFormat: string;
  year: number;
  runtimeMinutes: number;
  countries: readonly string[];
  studio: string;
  genres: readonly string[];
  maturityRating: MaturityRating;
  status: TitleStatus;
  synopsis: string;
  synopsisBn: string | null;
  credits: readonly FixtureCredit[];
  art: ArtSpec;
  artworkProvenance: ArtworkProvenance;
  /** Development fixtures are never shown in staging or production builds. */
  isDevelopmentFixture: true;
  rightsClaim: "PUBLIC_DOMAIN_CLAIM_UNVERIFIED";
  grants: readonly RightsGrantRecord[];
}

export interface CataloguePerson {
  slug: string;
  name: string;
  nameBn: string | null;
  /** Word shown as the oversized background type on the person page. */
  displayName: string;
  born: number | null;
  died: number | null;
  origin: string | null;
  bio: string | null;
}

export interface CatalogueCollection {
  slug: string;
  title: string;
  titleBn: string;
  description: string;
  items: readonly string[];
}

export interface PersonRef {
  /** Null when the credit is not linked to a person record. */
  slug: string | null;
  name: string;
}

/** Client-safe projection used by cards, rails, strips, and the search palette. */
export interface TitleCard {
  slug: string;
  title: string;
  titleBn: string;
  year: number;
  runtimeMinutes: number;
  countries: readonly string[];
  genres: readonly string[];
  directors: readonly PersonRef[];
  art: ArtSpec;
  availability: AvailabilityKind;
  synopsis: string;
  synopsisBn: string | null;
  studio: string;
  isDevelopmentFixture: boolean;
}

export interface ResolvedCredit {
  department: CreditDepartment;
  name: string;
  personSlug: string | null;
  character: string | null;
}
