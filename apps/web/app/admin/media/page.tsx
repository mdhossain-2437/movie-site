import { getDatabase, listAdminMediaAndJobsLedger } from "@movie/db";
import { AuthorizationError } from "@movie/domain";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge, ButtonLink, EmptyState, Skeleton } from "@/components/ui";
import { getCurrentSession } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "Media & Outbox Queue",
};

async function MediaAndJobsBody() {
  const { session } = await getCurrentSession();
  const db = await getDatabase();

  let ledger: Awaited<ReturnType<typeof listAdminMediaAndJobsLedger>> | null = null;
  let deniedMessage: string | null = null;

  try {
    ledger = await listAdminMediaAndJobsLedger(db, {
      actor: session?.actor ?? null,
      requestId: "rsc_admin_media",
    });
  } catch (err) {
    if (err instanceof AuthorizationError) {
      deniedMessage = err.message;
    } else {
      throw err;
    }
  }

  if (deniedMessage || !ledger) {
    return (
      <EmptyState
        eyebrow="Media Operations Authorization Required"
        title="Sign in with media:read capability"
        description={deniedMessage ?? "Access requires an authorized media or admin session."}
        actions={
          <ButtonLink href="/account" variant="primary" size="sm">
            Sign In
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-display text-text text-lg font-semibold">
          Media Assets ({ledger.assets.length})
        </h2>
        {ledger.assets.length === 0 ? (
          <EmptyState
            eyebrow="0 Ingested Assets"
            title="No quarantined or packaged media assets yet"
            description="Uploads initiate via POST /api/v1/admin/ingestions only after rights approval, verify SHA-256 in quarantine, and never expose private storage keys."
          />
        ) : (
          <div className="border-border bg-surface-1 overflow-x-auto rounded-lg border">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-border bg-surface-2 text-text-secondary border-b">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Asset ID
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Kind / Format
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    SHA-256 Verified
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    QC Passed
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Lifecycle State
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {ledger.assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-surface-2/60">
                    <td className="text-text px-4 py-3 font-mono">{asset.id}</td>
                    <td className="text-text-secondary px-4 py-3 font-mono">
                      {asset.kind} · {asset.containerFormat ?? "pending"}
                    </td>
                    <td className="px-4 py-3">
                      {asset.checksumVerified ? (
                        <Badge tone="success">Verified</Badge>
                      ) : (
                        <Badge tone="warning">Unverified</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {asset.qcPassed ? <Badge tone="success">Passed</Badge> : "Pending"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={asset.lifecycleState === "PUBLISHED" ? "success" : "info"}>
                        {asset.lifecycleState}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-text text-lg font-semibold">
          Durable PostgreSQL Outbox Jobs ({ledger.jobs.length})
        </h2>
        {ledger.jobs.length === 0 ? (
          <p className="text-text-muted text-xs">No pending or historical outbox jobs.</p>
        ) : (
          <div className="border-border bg-surface-1 overflow-x-auto rounded-lg border">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-border bg-surface-2 text-text-secondary border-b">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Job ID
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Type / Idempotency Key
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Attempts
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {ledger.jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-surface-2/60">
                    <td className="text-text px-4 py-3 font-mono">{job.id}</td>
                    <td className="text-text-secondary px-4 py-3 font-mono">
                      {job.jobType} ({job.idempotencyKey})
                    </td>
                    <td className="text-text-secondary px-4 py-3 font-mono">{job.attempts}</td>
                    <td className="px-4 py-3">
                      <Badge tone={job.status === "COMPLETED" ? "success" : "warning"}>
                        {job.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function AdminMediaPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge tone="info">Private Quarantine &amp; Outbox</Badge>
        <h1 className="font-display text-text text-2xl font-bold">
          Media Ingestion &amp; Durable Job Monitor
        </h1>
        <p className="cg-prose text-text-secondary text-sm">
          Uploaded files enter isolated quarantine, pass SHA-256 and header/ffprobe inspection, and
          require separate QC and human publication sign-off. Raw storage keys are never exposed.
        </p>
      </header>
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <MediaAndJobsBody />
      </Suspense>
    </div>
  );
}
