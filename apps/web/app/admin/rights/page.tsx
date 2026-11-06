import { getDatabase, listAdminRightsLedger } from "@movie/db";
import { AuthorizationError } from "@movie/domain";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge, ButtonLink, EmptyState, Skeleton } from "@/components/ui";
import { getCurrentSession } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "Rights Ledger",
};

async function RightsLedgerBody() {
  const { session } = await getCurrentSession();
  const db = await getDatabase();

  let grants: Awaited<ReturnType<typeof listAdminRightsLedger>> | null = null;
  let deniedMessage: string | null = null;

  try {
    grants = await listAdminRightsLedger(db, {
      actor: session?.actor ?? null,
      requestId: "rsc_admin_rights",
    });
  } catch (err) {
    if (err instanceof AuthorizationError) {
      deniedMessage = err.message;
    } else {
      throw err;
    }
  }

  if (deniedMessage || !grants) {
    return (
      <EmptyState
        eyebrow="Rights Review Authorization Required"
        title="Sign in with rights:read capability (MFA enforced for reviewers)"
        description={deniedMessage ?? "Access requires an authorized staff session."}
        actions={
          <ButtonLink href="/account" variant="primary" size="sm">
            Sign In
          </ButtonLink>
        }
      />
    );
  }

  if (grants.length === 0) {
    return (
      <EmptyState
        eyebrow="0 Rights Grants"
        title="No licensing grants registered yet"
        description="Grants require SHA-256 contract evidence, explicit ISO territory codes, separate STREAM/DOWNLOAD actions, and approval by a distinct Rights Reviewer."
      />
    );
  }

  return (
    <div className="border-border bg-surface-1 overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-border bg-surface-2 text-text-secondary border-b">
            <th scope="col" className="px-4 py-3 font-semibold">
              Grant ID
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Licensor
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Actions / Max Res
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Territories
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              DRM
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {grants.map((g) => (
            <tr key={g.id} className="hover:bg-surface-2/60">
              <td className="text-text px-4 py-3 font-mono">{g.id}</td>
              <td className="text-text px-4 py-3">{g.licensorName}</td>
              <td className="text-text-secondary px-4 py-3 font-mono">
                {g.allowedActions.join(", ")} · {g.maxResolution}
              </td>
              <td className="text-text-secondary px-4 py-3 font-mono">
                {g.allowedTerritories.join(", ")}
              </td>
              <td className="px-4 py-3">
                {g.requiresDrm ? <Badge tone="warning">DRM Required</Badge> : "Standard"}
              </td>
              <td className="px-4 py-3">
                <Badge tone={g.status === "APPROVED" ? "success" : "warning"}>{g.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminRightsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge tone="warning">Separation of Duties Enforced</Badge>
        <h1 className="font-display text-text text-2xl font-bold">Rights &amp; Evidence Ledger</h1>
        <p className="cg-prose text-text-secondary text-sm">
          STREAM never implies DOWNLOAD, and territorial grants never imply worldwide rights.
          Submitters are blocked from self-approving their own rights grants.
        </p>
      </header>
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <RightsLedgerBody />
      </Suspense>
    </div>
  );
}
