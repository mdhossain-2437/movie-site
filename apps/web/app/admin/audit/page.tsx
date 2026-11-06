import { getDatabase, listAdminAuditLedger } from "@movie/db";
import { AuthorizationError } from "@movie/domain";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge, ButtonLink, EmptyState, Skeleton } from "@/components/ui";
import { getCurrentSession } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "Immutable Audit Trail",
};

async function AuditLedgerBody() {
  const { session } = await getCurrentSession();
  const db = await getDatabase();

  let events: Awaited<ReturnType<typeof listAdminAuditLedger>> | null = null;
  let deniedMessage: string | null = null;

  try {
    events = await listAdminAuditLedger(db, {
      actor: session?.actor ?? null,
      requestId: "rsc_admin_audit",
    });
  } catch (err) {
    if (err instanceof AuthorizationError) {
      deniedMessage = err.message;
    } else {
      throw err;
    }
  }

  if (deniedMessage || !events) {
    return (
      <EmptyState
        eyebrow="Audit Authorization Required"
        title="Sign in with audit:read capability (MFA enforced)"
        description={deniedMessage ?? "Access requires an authorized reviewer or admin session."}
        actions={
          <ButtonLink href="/account" variant="primary" size="sm">
            Sign In
          </ButtonLink>
        }
      />
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        eyebrow="0 Audit Events"
        title="No administrative or compliance mutations recorded yet"
        description="Every catalogue, rights, media quarantine, playback authorization, download, and takedown action writes an append-only audit entry."
      />
    );
  }

  return (
    <div className="border-border bg-surface-1 overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-border bg-surface-2 text-text-secondary border-b">
            <th scope="col" className="px-4 py-3 font-semibold">
              Timestamp
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Action
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Target
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Actor / Roles
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Request ID
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {events.map((ev) => (
            <tr key={ev.id} className="hover:bg-surface-2/60">
              <td className="text-text-muted px-4 py-3 font-mono">{ev.createdAt.toISOString()}</td>
              <td className="text-text px-4 py-3 font-mono font-medium">{ev.action}</td>
              <td className="text-text-secondary px-4 py-3 font-mono">
                {ev.targetType}:{ev.targetId}
              </td>
              <td className="text-text-secondary px-4 py-3 font-mono">
                {ev.actorUserId ?? "public"} ({ev.actorRoles.join(",") || "guest"})
              </td>
              <td className="text-text-muted px-4 py-3 font-mono">{ev.requestId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge tone="neutral">Append-Only Security Log</Badge>
        <h1 className="font-display text-text text-2xl font-bold">Immutable Audit Explorer</h1>
        <p className="cg-prose text-text-secondary text-sm">
          Append-only record of administrative, rights, ingestion, delivery, and takedown actions
          correlated by request ID. Secrets and presigned query parameters are never stored here.
        </p>
      </header>
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <AuditLedgerBody />
      </Suspense>
    </div>
  );
}
