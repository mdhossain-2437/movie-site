import type { Role } from "@movie/contracts";
import { getAdminDashboardSummary, getDatabase } from "@movie/db";
import { AuthorizationError, ROLE_PERMISSIONS, roleRequiresMfa } from "@movie/domain";
import { Suspense } from "react";
import { Badge, ButtonLink, Skeleton } from "@/components/ui";
import { getCurrentSession } from "@/lib/server/api-helpers";

const PRIVILEGED_ROLES: readonly Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "RIGHTS_REVIEWER",
  "MEDIA_OPERATOR",
  "EDITOR",
];

async function AdminLiveMetricsPanel() {
  const { session } = await getCurrentSession();
  const db = await getDatabase();

  let summary: Awaited<ReturnType<typeof getAdminDashboardSummary>> | null = null;
  let authRequired = false;

  try {
    summary = await getAdminDashboardSummary(db, {
      actor: session?.actor ?? null,
      requestId: "rsc_admin_dashboard",
    });
  } catch (err) {
    if (err instanceof AuthorizationError) {
      authRequired = true;
    } else {
      throw err;
    }
  }

  if (authRequired || !summary) {
    return (
      <section className="cg-surface flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <Badge tone="warning">Staff Authentication Required</Badge>
          <h2 className="font-display text-text pt-1 text-lg font-semibold">
            Sign in with an authorized staff role to inspect live ledger records
          </h2>
          <p className="text-text-secondary text-xs">
            Mutating endpoints (`/api/v1/admin/*`) enforce server-side RBAC, CSRF origin checks, and
            TOTP multi-factor authentication.
          </p>
        </div>
        <ButtonLink href="/account" variant="primary" size="sm">
          Sign In
        </ButtonLink>
      </section>
    );
  }

  return (
    <section aria-labelledby="live-metrics-heading" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="live-metrics-heading" className="font-display text-text text-lg font-semibold">
          Live Control Plane Ledger
        </h2>
        <Badge tone="success">Staff Session: {session?.displayName}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="cg-surface p-4">
          <p className="text-text-muted font-mono text-xs uppercase">Total Titles</p>
          <p className="font-display text-text mt-2 text-2xl font-bold">
            {summary.counts.totalTitles}
          </p>
        </div>
        <div className="cg-surface p-4">
          <p className="text-text-muted font-mono text-xs uppercase">Published</p>
          <p className="font-display text-text mt-2 text-2xl font-bold">
            {summary.counts.publishedTitles}
          </p>
        </div>
        <div className="cg-surface p-4">
          <p className="text-text-muted font-mono text-xs uppercase">Pending Rights Grants</p>
          <p className="font-display text-text mt-2 text-2xl font-bold">
            {summary.counts.pendingRightsGrants}
          </p>
        </div>
        <div className="cg-surface p-4">
          <p className="text-text-muted font-mono text-xs uppercase">Open Takedown Cases</p>
          <p className="font-display text-text mt-2 text-2xl font-bold">
            {summary.counts.openTakedownCases}
          </p>
        </div>
      </div>

      {summary.recentAudit.length > 0 ? (
        <div className="border-border bg-surface-1 rounded-lg border p-4">
          <h3 className="font-display text-text text-sm font-semibold">
            Recent Immutable Audit Events
          </h3>
          <ul className="divide-border mt-3 divide-y text-xs">
            {summary.recentAudit.map((ev) => (
              <li key={ev.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span className="text-text font-mono">{ev.action}</span>
                <span className="text-text-muted font-mono">
                  {ev.targetType}:{ev.targetId}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

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
          actions run behind PostgreSQL RBAC sessions, separation-of-duties checks, and verified
          MFA.
        </p>
      </section>

      <Suspense fallback={<Skeleton className="h-36 w-full" />}>
        <AdminLiveMetricsPanel />
      </Suspense>

      <section aria-labelledby="rbac-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="rbac-heading" className="font-display text-text text-lg font-semibold">
            Active RBAC &amp; Separation-of-Duties Matrix
          </h2>
          <ButtonLink href="/api/v1/health" variant="outline" size="sm">
            Inspect Health JSON
          </ButtonLink>
        </div>
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
