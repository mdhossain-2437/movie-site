import type { Role } from "@movie/contracts";
import { ROLE_PERMISSIONS, roleRequiresMfa } from "@movie/domain";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui";
import { Icon } from "@/components/ui/icon";
import { getOperationsSnapshot } from "@/lib/catalogue/repository";
import { sanitizeQuery, normalizeForSearch } from "@/lib/catalogue/search";
import { pad2 } from "@/lib/catalogue/format";

const ROLES: readonly Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "RIGHTS_REVIEWER",
  "MEDIA_OPERATOR",
  "EDITOR",
];
const GATES = [
  {
    label: "Editorial review",
    description: "Source-verified metadata, translations and attribution.",
    icon: "films" as const,
  },
  {
    label: "Rights evidence",
    description: "Separate approved actions, explicit territory and date window.",
    icon: "shield" as const,
  },
  {
    label: "Quarantine & integrity",
    description: "Private ingest, SHA-256 verification and quality control.",
    icon: "lock" as const,
  },
  {
    label: "Human sign-off",
    description: "Independent reviewer, authenticated session and verified MFA.",
    icon: "people" as const,
  },
  {
    label: "Authorized delivery",
    description: "Server evaluation on every manifest and file request.",
    icon: "play" as const,
  },
];

async function RightsQueue({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const q = sanitizeQuery(resolved.q);
  const snapshot = getOperationsSnapshot();
  const query = normalizeForSearch(q);
  const queue = snapshot.queue.filter(
    (row) => !query || normalizeForSearch(`${row.title} ${row.year}`).includes(query),
  );
  return (
    <>
      <form
        role="search"
        aria-label="Search rights queue"
        action="/admin#rights-queue"
        method="get"
        className="admin-search"
      >
        <Icon name="search" />
        <label className="sr-only" htmlFor="rights-queue-query">
          Search rights queue
        </label>
        <input
          id="rights-queue-query"
          name="q"
          defaultValue={q}
          placeholder="Find a title in the rights queue…"
          maxLength={120}
        />
        <button type="submit">
          Search
          <Icon name="arrow" />
        </button>
        {q ? (
          <Link href="/admin#rights-queue" aria-label="Clear queue search">
            <Icon name="close" />
          </Link>
        ) : null}
      </form>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Title / development reference</th>
              <th scope="col">Requested scope</th>
              <th scope="col">Evidence</th>
              <th scope="col">Review</th>
              <th scope="col">
                <span className="sr-only">View record</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {queue.map((row) => (
              <tr key={row.slug}>
                <td>
                  <Link href={`/movies/${row.slug}`}>{row.title}</Link>
                  <small>{row.year} / Unpublished fixture</small>
                </td>
                <td>
                  <span className="admin-scope">{row.territories.join(", ")} only</span>
                  <small>{row.requestedActions.join(" · ")}</small>
                </td>
                <td>
                  <span className="admin-evidence">
                    <Icon name="lock" />
                    {row.evidenceCount} docs
                  </span>
                </td>
                <td>
                  <Badge tone="warning">Pending</Badge>
                </td>
                <td>
                  <Link
                    href={`/movies/${row.slug}#availability`}
                    className="icon-button"
                    aria-label={`View ${row.title} rights status`}
                  >
                    <Icon name="arrow-up-right" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {queue.length === 0 ? (
          <div className="admin-queue-empty">
            <Icon name="shield" />
            <h3>{q ? `No references for “${q}”` : "No records awaiting review"}</h3>
            <p>
              {q
                ? "Try another title or clear the queue search."
                : "The catalogue is empty. Live database records are not connected in this preview."}
            </p>
          </div>
        ) : null}
      </div>
      <div className="admin-table-foot">
        <span>
          {queue.length} of {snapshot.queue.length} development references
        </span>
        <span>No approval action is exposed</span>
      </div>
    </>
  );
}

export default function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const snapshot = getOperationsSnapshot();
  return (
    <div>
      <section className="admin-overview" id="overview">
        <div className="admin-page-heading">
          <div>
            <p className="eyebrow">Operations / overview</p>
            <h1>Platform Operations &amp; Rights Control Plane</h1>
          </div>
          <span className="admin-preview-badge">
            <Icon name="info" />
            Read-only preview
          </span>
        </div>
        <p>
          A clear view of the catalogue, its evidence, and the gates between a record and a release.
        </p>
        <div className="admin-fixture-notice">
          <Icon name="info" />
          <p>
            {snapshot.mode === "fixtures"
              ? "These are development fixtures, not live operational records. No rights have been approved and no content is published."
              : "The production catalogue is empty. Live database, authentication and ingest integrations are not connected in this preview."}
          </p>
        </div>
        <div className="admin-metrics">
          {[
            {
              label: "Catalogue references",
              value: snapshot.titleCount,
              icon: "films" as const,
              note: "Development only",
            },
            {
              label: "Pending rights requests",
              value: snapshot.pendingRequests,
              icon: "shield" as const,
              note: "Legal review required",
            },
            {
              label: "Approved grants",
              value: snapshot.approvedGrants,
              icon: "lock" as const,
              note: "No delivery rights inferred",
            },
            {
              label: "Published titles",
              value: snapshot.publishedCount,
              icon: "play" as const,
              note: "Fail-closed by design",
            },
          ].map((metric) => (
            <article key={metric.label}>
              <div>
                <span>{metric.label}</span>
                <Icon name={metric.icon} />
              </div>
              <strong>{pad2(metric.value)}</strong>
              <p>{metric.note}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="admin-section" id="rights-queue">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">Review before release</p>
            <h2>Rights verification queue</h2>
          </div>
          <span>{pad2(snapshot.pendingRequests)} pending</span>
        </div>
        <Suspense
          fallback={
            <div className="admin-queue-empty" aria-busy="true">
              Loading rights queue…
            </div>
          }
        >
          <RightsQueue searchParams={searchParams} />
        </Suspense>
      </section>
      <section className="admin-section" id="delivery">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">A policy path, not a live job timeline</p>
            <h2>The release gates</h2>
          </div>
          <Link href="/legal/copyright" className="text-link">
            Policy
            <Icon name="arrow-up-right" />
          </Link>
        </div>
        <div className="release-gates">
          {GATES.map((gate, i) => (
            <article key={gate.label}>
              <div>
                <span>{pad2(i + 1)}</span>
                <Icon name={gate.icon} />
              </div>
              <h3>{gate.label}</h3>
              <p>{gate.description}</p>
              <span className="gate-status">
                <Icon name="lock" />
                Required
              </span>
            </article>
          ))}
        </div>
        <div className="admin-invariants">
          <span>
            <Icon name="shield" />
            STREAM ≠ DOWNLOAD
          </span>
          <span>
            <Icon name="globe" />
            BD ≠ WORLDWIDE
          </span>
          <span>
            <Icon name="lock" />
            UPLOADED ≠ PUBLISHED
          </span>
        </div>
      </section>
      <section className="admin-section" id="access">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">Separation of duties</p>
            <h2>Access &amp; approval model</h2>
          </div>
          <span>From @movie/domain</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table admin-roles">
            <thead>
              <tr>
                <th scope="col">Role</th>
                <th scope="col">MFA</th>
                <th scope="col">Rights approval</th>
                <th scope="col">Capabilities</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((role) => (
                <tr key={role}>
                  <td>
                    <span className="role-name">{role.replaceAll("_", " ")}</span>
                  </td>
                  <td>
                    {roleRequiresMfa(role) ? (
                      <span className="mfa-label">
                        <Icon name="shield" />
                        Mandatory
                      </span>
                    ) : (
                      "Not required"
                    )}
                  </td>
                  <td>
                    {ROLE_PERMISSIONS[role].includes("rights:approve") ? (
                      <span className="approval-label">
                        <Icon name="check" />
                        Role permits
                      </span>
                    ) : (
                      <span className="denied-label">
                        <Icon name="lock" />
                        Denied
                      </span>
                    )}
                  </td>
                  <td>{ROLE_PERMISSIONS[role].length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="admin-access-note">
          This matrix describes the domain’s capability model, not a current signed-in user.
          Operational mutations remain unavailable until real sessions, CSRF enforcement and staff
          MFA are connected.
        </p>
      </section>
    </div>
  );
}
