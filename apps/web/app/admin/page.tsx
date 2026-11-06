import type { Role } from "@movie/contracts";
import { ROLE_PERMISSIONS, roleRequiresMfa } from "@movie/domain";
import { Badge, ButtonLink } from "@/components/ui";

const ADMIN_MODULES = [
  {
    title: "Catalogue & Localized Metadata",
    milestone: "M2",
    status: "Schema & DAL Next",
    tone: "info" as const,
    summary:
      "Draft-first title ingestion, English/Bangla localized metadata, cast/crew credits, and source attribution.",
  },
  {
    title: "Rights Grants & Evidence Gate",
    milestone: "M1 Core / M2 DB",
    status: "Policy Engine Active",
    tone: "success" as const,
    summary:
      "Central evaluateRights() enforces territory, date window, stream vs download separation, and separation of duties.",
  },
  {
    title: "Media Quarantine & Ingest",
    milestone: "M1 Mock / M3 Live",
    status: "Adapter Active",
    tone: "success" as const,
    summary:
      "Multipart upload session lifecycle, SHA-256 checksum verification, and automatic quarantine on integrity mismatch.",
  },
  {
    title: "Playback, Packaging & DRM",
    milestone: "M4",
    status: "Planned",
    tone: "neutral" as const,
    summary:
      "HLS/DASH CMAF renditions, subtitle/audio tracks, short-lived playback sessions, and fail-closed DRM adapter.",
  },
  {
    title: "Storage Replication & Backups",
    milestone: "M5",
    status: "Planned",
    tone: "neutral" as const,
    summary:
      "Private S3-compatible primary storage and optional operator-owned archive connector with zero public Drive hotlinks.",
  },
  {
    title: "Takedowns, Legal Hold & Audit Log",
    milestone: "M5",
    status: "Policy Defined",
    tone: "warning" as const,
    summary:
      "Emergency unpublish kill-switch, active session revocation, non-destructive legal hold, and immutable audit events.",
  },
] as const;

const PRIVILEGED_ROLES: readonly Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "RIGHTS_REVIEWER",
  "MEDIA_OPERATOR",
  "EDITOR",
];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="text-text-muted font-mono text-xs tracking-wide uppercase">
          Internal Operations · Deny by Default
        </p>
        <h1 className="font-display text-text text-2xl font-bold sm:text-3xl">
          Platform Operations &amp; Rights Control Plane
        </h1>
        <p className="cg-prose text-text-secondary text-sm leading-6">
          Separated from consumer discovery chrome for high-density operational review. Mutating
          actions activate in Milestone M2 behind PostgreSQL RBAC sessions, CSRF checks, and
          verified MFA.
        </p>
      </section>

      <section aria-labelledby="modules-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="modules-heading" className="font-display text-text text-lg font-semibold">
            Control Plane Modules
          </h2>
          <ButtonLink href="/api/v1/health" variant="outline" size="sm">
            Inspect Health JSON
          </ButtonLink>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ADMIN_MODULES.map((mod) => (
            <article key={mod.title} className="cg-surface flex flex-col justify-between p-5">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-text-muted font-mono text-xs">{mod.milestone}</span>
                  <Badge tone={mod.tone}>{mod.status}</Badge>
                </div>
                <h3 className="font-display text-text text-base font-semibold">{mod.title}</h3>
                <p className="text-text-secondary text-xs leading-5">{mod.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="rbac-heading" className="space-y-4">
        <h2 id="rbac-heading" className="font-display text-text text-lg font-semibold">
          Active RBAC &amp; Separation-of-Duties Matrix
        </h2>
        <div className="border-border bg-surface-1 overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-border bg-surface-2 text-text-secondary border-b">
                <th scope="col" className="px-4 py-3 font-semibold">
                  Role
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  MFA Required
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Can Approve Rights
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Capability Count
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {PRIVILEGED_ROLES.map((role) => {
                const perms = ROLE_PERMISSIONS[role];
                const canApproveRights = perms.includes("rights:approve");
                return (
                  <tr key={role} className="hover:bg-surface-2/60">
                    <td className="text-text px-4 py-3 font-mono font-medium">{role}</td>
                    <td className="text-text-secondary px-4 py-3">
                      {roleRequiresMfa(role) ? "Yes (Mandatory)" : "No"}
                    </td>
                    <td className="px-4 py-3">
                      {canApproveRights ? (
                        <Badge tone="warning">Authorized</Badge>
                      ) : (
                        <span className="text-text-muted">Denied</span>
                      )}
                    </td>
                    <td className="text-text-secondary px-4 py-3 font-mono">{perms.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
