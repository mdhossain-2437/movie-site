import type { DeliveryAction } from "@movie/contracts";
import { evaluateRights, type RightsDecision } from "@movie/domain";
import type { AvailabilityKind } from "@/components/ui/badge";
import type { CatalogueTitle } from "./types";

export interface EvaluationScope {
  /** Evaluation instant. Catalogue display uses a fixed snapshot; playback uses request time. */
  at: Date;
  territory: string;
}

export const ACTION_LABELS: Readonly<Record<DeliveryAction, string>> = {
  METADATA: "Catalogue metadata",
  ARTWORK: "Artwork display",
  STREAM: "Streaming",
  DOWNLOAD: "Download",
  TRAILER: "Trailer",
};

export const DISPLAY_ACTIONS: readonly DeliveryAction[] = [
  "STREAM",
  "DOWNLOAD",
  "TRAILER",
  "ARTWORK",
  "METADATA",
];

/**
 * Every availability statement in the UI is derived from the central rights engine.
 * No catalogue entry has an ingested, checksum-verified media asset yet, so media delivery
 * (STREAM / DOWNLOAD / TRAILER) always fails closed.
 */
export function evaluateTitleAction(
  title: CatalogueTitle,
  action: DeliveryAction,
  scope: EvaluationScope,
): RightsDecision {
  return evaluateRights({
    titleId: title.id,
    titleStatus: title.status,
    titleMaturityRating: title.maturityRating,
    takedownActive: false,
    action,
    territoryCode: scope.territory,
    at: scope.at,
    grants: title.grants,
  });
}

export function deriveAvailability(
  title: CatalogueTitle,
  scope: EvaluationScope,
): AvailabilityKind {
  const stream = evaluateTitleAction(title, "STREAM", scope);
  if (stream.allowed) return "stream_allowed";

  // STREAM never implies DOWNLOAD; download is evaluated on its own.
  const download = evaluateTitleAction(title, "DOWNLOAD", scope);
  if (download.allowed) return "download_allowed";

  if (stream.code === "TERRITORY_RESTRICTED" || stream.code === "RIGHTS_WINDOW_NOT_STARTED") {
    return "region_restricted";
  }

  const reviewPending =
    title.status === "DRAFT" ||
    title.status === "IN_REVIEW" ||
    title.grants.some((grant) => grant.status === "PENDING");
  return reviewPending ? "rights_pending" : "catalogue_only";
}

export interface ActionAvailability {
  action: DeliveryAction;
  label: string;
  /** Whether any rights record (pending or approved) lists this action. */
  requested: boolean;
  decision: RightsDecision;
}

export function evaluateDisplayActions(
  title: CatalogueTitle,
  scope: EvaluationScope,
): ActionAvailability[] {
  return DISPLAY_ACTIONS.map((action) => ({
    action,
    label: ACTION_LABELS[action],
    requested: title.grants.some((grant) => grant.allowedActions.includes(action)),
    decision: evaluateTitleAction(title, action, scope),
  }));
}

export type FactState = "pass" | "fail" | "info";

export interface AuthorizationFact {
  label: string;
  value: string;
  state: FactState;
}

const TITLE_STATUS_LABEL: Readonly<Record<CatalogueTitle["status"], string>> = {
  DRAFT: "Draft",
  IN_REVIEW: "In editorial & rights review",
  PUBLISHED: "Published",
  UNPUBLISHED: "Unpublished",
  TAKEDOWN_HOLD: "Takedown hold",
  ARCHIVED: "Archived",
};

/**
 * Recorded facts shown beside the authoritative decision. These are inputs, not a second
 * policy implementation: the allow/deny outcome always comes from `evaluateRights`.
 */
export function describeAuthorizationFacts(
  title: CatalogueTitle,
  territory: string,
): AuthorizationFact[] {
  const approved = title.grants.filter((grant) => grant.status === "APPROVED");
  const pending = title.grants.filter((grant) => grant.status === "PENDING");
  const evidence = title.grants.reduce((sum, grant) => sum + grant.evidence.length, 0);
  const territories = [...new Set(title.grants.flatMap((grant) => grant.allowedTerritories))];
  const actionState = (action: "STREAM" | "DOWNLOAD") => {
    if (approved.some((grant) => grant.allowedActions.includes(action))) return "approved";
    if (title.grants.some((grant) => grant.allowedActions.includes(action))) return "requested";
    return "absent";
  };
  const stream = actionState("STREAM");
  const download = actionState("DOWNLOAD");

  return [
    {
      label: "Title status",
      value: TITLE_STATUS_LABEL[title.status],
      state: title.status === "PUBLISHED" ? "pass" : "fail",
    },
    {
      label: "Playable media asset",
      value: "None ingested or checksum-verified",
      state: "fail",
    },
    {
      label: "Rights grant",
      value:
        approved.length > 0
          ? `${approved.length} approved`
          : pending.length > 0
            ? `${pending.length} request pending review`
            : "No rights record",
      state: approved.length > 0 ? "pass" : "fail",
    },
    {
      label: "Reviewed evidence",
      value: evidence === 1 ? "1 document" : `${evidence} documents`,
      state: evidence > 0 ? "pass" : "fail",
    },
    {
      label: "Territory",
      value: `Viewer ${territory} · requested for ${territories.length > 0 ? territories.join(", ") : "no territory"}`,
      state: "info",
    },
    {
      label: "Streaming",
      value:
        stream === "approved"
          ? "Listed on an approved grant"
          : stream === "requested"
            ? "Requested, not approved"
            : "Not requested",
      state: "info",
    },
    {
      label: "Download",
      value:
        download === "approved"
          ? "Listed on an approved grant"
          : download === "requested"
            ? "Requested separately, not approved"
            : "Not requested — streaming never implies download",
      state: "info",
    },
  ];
}
