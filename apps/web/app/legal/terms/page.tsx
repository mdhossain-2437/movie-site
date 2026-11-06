import type { Metadata } from "next";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Terms of Use · Cinematic Graphite",
  description: "Authorized usage terms for viewers and rights-gated media delivery.",
};

export default function TermsPage() {
  return (
    <ConsumerShell>
      <article className="cg-prose space-y-6">
        <header className="space-y-3">
          <Badge tone="neutral">Legal Governance</Badge>
          <h1 className="font-display text-text text-3xl font-bold sm:text-4xl">Terms of Use</h1>
          <p className="text-text-muted text-sm">
            Working operational draft · Requires legal counsel sign-off prior to public launch.
          </p>
        </header>

        <section className="text-text-secondary space-y-3 text-base leading-7">
          <h2 className="font-display text-text text-xl font-semibold">
            1. Authorized Access Only
          </h2>
          <p>
            Cinematic Graphite provides film discovery, authorized streaming, and—only where
            separately licensed—authorized file downloads. Streaming authorization never implies a
            right to download, redistribute, mirror, or rebroadcast media.
          </p>
        </section>

        <section className="text-text-secondary space-y-3 text-base leading-7">
          <h2 className="font-display text-text text-xl font-semibold">
            2. Territorial &amp; Windowed Availability
          </h2>
          <p>
            Media availability is evaluated per request against active territorial grants and date
            windows. Rights granted for Bangladesh (BD) do not confer worldwide rights, and expired
            windows revoke playback and download tokens immediately.
          </p>
        </section>

        <section className="text-text-secondary space-y-3 text-base leading-7">
          <h2 className="font-display text-text text-xl font-semibold">3. Prohibited Conduct</h2>
          <p>
            Automated scraping, credential sharing, circumvention of playback session grants or DRM,
            and unauthorized uploading or linking of third-party material are strictly prohibited.
          </p>
        </section>
      </article>
    </ConsumerShell>
  );
}
