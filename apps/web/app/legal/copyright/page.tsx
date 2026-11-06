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

        <section
          id="development-fixtures"
          className="legal-fixture-section text-text-secondary space-y-3 text-base leading-7"
        >
          <p className="eyebrow">Preview data, not a release</p>
          <h2 className="font-display text-text text-xl font-semibold">
            Development fixtures &amp; original artwork
          </h2>
          <p>
            Development and test environments contain visibly marked editorial reference records for
            real early films. These are interface fixtures, not published catalogue offers. Their
            age is not a legal determination: public-domain claims require independent legal review
            for each territory, version, restoration, score and translation.
          </p>
          <p>
            Every fixture remains unpublished. All seeded rights requests are pending, with zero
            reviewed evidence and zero approved distribution grants. No video, trailer, stream
            manifest or downloadable media file is connected. Streaming and download rights are
            always evaluated separately on the server.
          </p>
          <p>
            The posters and backdrops are original SVG illustrations generated in code for this
            preview. No third-party commercial film poster, still, actor portrait or competitor
            identity is used. The artwork’s provenance does not confer any right to distribute the
            referenced films.
          </p>
          <p>
            Factual metadata and translations are development editorial drafts requiring source
            verification before publication. Fixture records are excluded from staging and
            production catalogue reads. The device-only saved list is local to the browser and never
            grants playback access.
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
