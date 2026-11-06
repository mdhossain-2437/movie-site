import { getDatabase, listAdminTakedownLedger } from "@movie/db";
import { AuthorizationError } from "@movie/domain";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge, ButtonLink, EmptyState, Skeleton } from "@/components/ui";
import { getCurrentSession } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "Takedown Engine",
};

async function TakedownLedgerBody() {
  const { session } = await getCurrentSession();
  const db = await getDatabase();

  let cases: Awaited<ReturnType<typeof listAdminTakedownLedger>> | null = null;
  let deniedMessage: string | null = null;

  try {
    cases = await listAdminTakedownLedger(db, {
      actor: session?.actor ?? null,
      requestId: "rsc_admin_takedowns",
    });
  } catch (err) {
    if (err instanceof AuthorizationError) {
      deniedMessage = err.message;
    } else {
      throw err;
    }
  }

  if (deniedMessage || !cases) {
    return (
      <EmptyState
        eyebrow="Compliance Authorization Required"
        title="Sign in with reports:review capability (MFA enforced)"
        description={deniedMessage ?? "Access requires an authorized compliance or admin session."}
        actions={
          <ButtonLink href="/account" variant="primary" size="sm">
            Sign In
          </ButtonLink>
        }
      />
    );
  }

  if (cases.length === 0) {
    return (
      <EmptyState
        eyebrow="0 Takedown Cases"
        title="No copyright or compliance claims open"
        description="Public reports submitted at /report-content appear here immediately with TKD-* tracking numbers."
      />
    );
  }

  return (
    <div className="border-border bg-surface-1 overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-border bg-surface-2 text-text-secondary border-b">
            <th scope="col" className="px-4 py-3 font-semibold">
              Case Number
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Target Path
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Reporter
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Legal Hold
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {cases.map((c) => (
            <tr key={c.id} className="hover:bg-surface-2/60">
              <td className="text-text px-4 py-3 font-mono font-semibold">{c.caseNumber}</td>
              <td className="text-text-secondary px-4 py-3 font-mono">{c.targetPath}</td>
              <td className="text-text-secondary px-4 py-3">{c.reporterName}</td>
              <td className="px-4 py-3">
                {c.legalHoldApplied ? (
                  <Badge tone="danger">HOLD ACTIVE</Badge>
                ) : (
                  <span className="text-text-muted">None</span>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge tone={c.status === "OPEN" ? "warning" : "info"}>{c.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminTakedownsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge tone="danger">Immediate Kill-Switch Capable</Badge>
        <h1 className="font-display text-text text-2xl font-bold">
          Takedown &amp; Legal Hold Console
        </h1>
        <p className="cg-prose text-text-secondary text-sm">
          Applying a legal hold via POST /api/v1/admin/takedowns/:caseId/resolve atomically hides
          catalogue listings, locks media assets, and revokes active playback sessions mid-stream.
        </p>
      </header>
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <TakedownLedgerBody />
      </Suspense>
    </div>
  );
}
