import type { Metadata } from "next";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Copyright & Licensing Policy · Cinematic Graphite",
  description: "Strict rights-first publication policy and separation of duties.",
};

export default function CopyrightPolicyPage() {
  return (
    <ConsumerShell>
      <article className="cg-prose space-y-6">
        <header className="space-y-3">
          <Badge tone="accent">Rights Governance</Badge>
          <h1 className="font-display text-text text-3xl font-bold sm:text-4xl">
            Copyright &amp; Licensing Policy
          </h1>
          <p className="text-text-muted text-sm">
            Core non-negotiable platform invariant · Applicable across all environments.
          </p>
        </header>

        <section className="text-text-secondary space-y-3 text-base leading-7">
          <h2 className="font-display text-text text-xl font-semibold">
            1. Verified Chain of Title
          </h2>
          <p>
            Every media asset remains private and unplayable until an authorized Rights Admin
            records and approves documentary rights evidence establishing direct ownership, an
            active distribution licence, or a counsel-verified public-domain determination for each
            permitted territory.
          </p>
        </section>

        <section className="text-text-secondary space-y-3 text-base leading-7">
          <h2 className="font-display text-text text-xl font-semibold">
            2. Separation of Stream, Download &amp; Metadata Rights
          </h2>
          <p>
            Catalogue metadata attribution (such as licensed or attributed third-party data) never
            grants video playback or download rights. Streaming grants and file download grants are
            evaluated independently on every request.
          </p>
        </section>

        <section className="text-text-secondary space-y-3 text-base leading-7">
          <h2 className="font-display text-text text-xl font-semibold">
            3. Separation of Operational Duties
          </h2>
          <p>
            Media operators and catalogue editors cannot self-approve rights grants. Publication
            requires completed quarantine checks, SHA-256 verification, and explicit rights sign-off
            protected by multi-factor authentication.
          </p>
        </section>

        <div className="flex flex-wrap gap-3 pt-2">
          <ButtonLink href="/legal/takedown" variant="secondary">
            Takedown Procedure
          </ButtonLink>
          <ButtonLink href="/report-content" variant="outline">
            Report a Concern
          </ButtonLink>
        </div>
      </article>
    </ConsumerShell>
  );
}
