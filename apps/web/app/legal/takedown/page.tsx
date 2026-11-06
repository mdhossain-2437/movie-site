import type { Metadata } from "next";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Takedown & Legal Hold Procedure · Cinematic Graphite",
  description: "Emergency unpublish, token revocation, and audit preservation workflow.",
};

export default function TakedownPolicyPage() {
  return (
    <ConsumerShell>
      <article className="cg-prose space-y-6">
        <header className="space-y-3">
          <Badge tone="warning">Emergency Compliance</Badge>
          <h1 className="font-display text-text text-3xl font-bold sm:text-4xl">
            Takedown &amp; Legal Hold Procedure
          </h1>
          <p className="text-text-muted text-sm">
            Enforced under Bangladesh Copyright Act 2023 &amp; international rights obligations.
          </p>
        </header>

        <section className="text-text-secondary space-y-3 text-base leading-7">
          <h2 className="font-display text-text text-xl font-semibold">
            1. Immediate Emergency Kill-Switch
          </h2>
          <p>
            When a credible rights dispute, expired contract notice, or compliance hold is logged,
            the central Rights Decision Service flips the affected title or asset into legal hold,
            immediately denying new playback manifests and download grants across all regions.
          </p>
        </section>

        <section className="text-text-secondary space-y-3 text-base leading-7">
          <h2 className="font-display text-text text-xl font-semibold">
            2. Evidence Preservation (Non-Destructive Hold)
          </h2>
          <p>
            Emergency takedowns block public access and purge public cache tags without destroying
            immutable audit events, rights evidence records, or quarantined master files subject to
            legal review.
          </p>
        </section>

        <div className="flex flex-wrap gap-3 pt-2">
          <ButtonLink href="/report-content" variant="primary">
            Read Notice Requirements
          </ButtonLink>
          <ButtonLink href="/legal/copyright" variant="secondary">
            Copyright Policy
          </ButtonLink>
        </div>
      </article>
    </ConsumerShell>
  );
}
