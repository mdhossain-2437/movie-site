import { getDatabase, listAdminCatalogueLedger } from "@movie/db";
import { AuthorizationError } from "@movie/domain";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge, ButtonLink, EmptyState, Skeleton } from "@/components/ui";
import { getCurrentSession } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "Catalogue Ledger",
};

async function CatalogueLedgerBody() {
  const { session } = await getCurrentSession();
  const db = await getDatabase();

  let rows: Awaited<ReturnType<typeof listAdminCatalogueLedger>> | null = null;
  let deniedMessage: string | null = null;

  try {
    rows = await listAdminCatalogueLedger(db, {
      actor: session?.actor ?? null,
      requestId: "rsc_admin_titles",
    });
  } catch (err) {
    if (err instanceof AuthorizationError) {
      deniedMessage = err.message;
    } else {
      throw err;
    }
  }

  if (deniedMessage || !rows) {
    return (
      <EmptyState
        eyebrow="Staff Authorization Required"
        title="Sign in with an editorial or operations role"
        description={deniedMessage ?? "Access requires an active staff session."}
        actions={
          <ButtonLink href="/account" variant="primary" size="sm">
            Sign In
          </ButtonLink>
        }
      />
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        eyebrow="0 Catalogue Entries"
        title="No draft or published titles recorded yet"
        description="Create drafts via POST /api/v1/admin/titles after confirming source attribution. Publication remains blocked until an independent Rights Reviewer approves a rights grant."
      />
    );
  }

  return (
    <div className="border-border bg-surface-1 overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-border bg-surface-2 text-text-secondary border-b">
            <th scope="col" className="px-4 py-3 font-semibold">
              Slug
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Original Title
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Year / Lang
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Status
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Legal Hold
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-surface-2/60">
              <td className="text-text px-4 py-3 font-mono">{row.slug}</td>
              <td className="text-text px-4 py-3 font-medium">{row.originalTitle}</td>
              <td className="text-text-secondary px-4 py-3 font-mono">
                {row.releaseYear} · {row.originalLanguage.toUpperCase()}
              </td>
              <td className="px-4 py-3">
                <Badge tone={row.status === "PUBLISHED" ? "success" : "neutral"}>
                  {row.status}
                </Badge>
              </td>
              <td className="px-4 py-3">
                {row.legalHold ? (
                  <Badge tone="danger">HOLD ACTIVE</Badge>
                ) : (
                  <span className="text-text-muted">Clear</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminCataloguePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge tone="neutral">Catalogue Management</Badge>
        <h1 className="font-display text-text text-2xl font-bold">Catalogue Ledger</h1>
        <p className="cg-prose text-text-secondary text-sm">
          Drafts, localized metadata, and publication states. Human sign-off and approved rights
          evidence are required before live publication.
        </p>
      </header>
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <CatalogueLedgerBody />
      </Suspense>
    </div>
  );
}
