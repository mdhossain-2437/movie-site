import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { AvailabilityBadge } from "@/components/ui";
import type { TitleDetail } from "@/lib/catalogue/repository";

export function RightsPanel({ detail }: { detail: TitleDetail }) {
  const firstDenied = detail.actions
    .map((action) => action.decision)
    .find((decision) => !decision.allowed);
  return (
    <section id="availability" className="rights-panel">
      <div className="rights-panel-heading">
        <div>
          <p className="eyebrow">The fine print, in plain sight</p>
          <h2>Rights &amp; availability.</h2>
        </div>
        <Icon name="shield" />
      </div>
      <AvailabilityBadge kind={detail.card.availability} />
      <p className="rights-intro">
        This is a development reference, not a published offer. A film’s age, or the right to
        display its artwork, does not establish permission to stream it.
      </p>
      <dl className="rights-summary">
        <div>
          <dt>Review status</dt>
          <dd>{detail.rights.claim}</dd>
        </div>
        <div>
          <dt>Requested territory</dt>
          <dd>
            {detail.rights.territories.join(", ") || "None"} <span>· not worldwide</span>
          </dd>
        </div>
        <div>
          <dt>Approved grants</dt>
          <dd>{detail.rights.approvedCount}</dd>
        </div>
        <div>
          <dt>Reviewed evidence</dt>
          <dd>{detail.rights.evidenceCount} documents</dd>
        </div>
      </dl>
      <div className="rights-actions">
        {detail.actions.map((action) => (
          <div key={action.action}>
            <span>
              <Icon name={action.decision.allowed ? "check" : "lock"} />
              {action.label}
            </span>
            <span>
              {action.decision.allowed
                ? "Authorized by policy"
                : action.requested
                  ? "Pending review"
                  : "Not offered"}
            </span>
          </div>
        ))}
      </div>
      <details className="policy-details">
        <summary>
          How this decision was made
          <Icon name="plus" />
        </summary>
        <p>
          Every action is evaluated separately by the server’s central rights engine. For this
          record the first blocker is{" "}
          <code>{firstDenied && !firstDenied.allowed ? firstDenied.code : "None"}</code>. This
          catalogue snapshot is dated {detail.evaluatedAt.slice(0, 10)}; the watch page re-evaluates
          at request time.
        </p>
        <p>
          Unpublished titles, missing media, unapproved rights, territorial restrictions and
          unsupported DRM fail closed. No stream or download token is issued.
        </p>
      </details>
      <Link href="/legal/copyright" className="text-link">
        Our rights-first approach
        <Icon name="arrow-up-right" />
      </Link>
    </section>
  );
}
