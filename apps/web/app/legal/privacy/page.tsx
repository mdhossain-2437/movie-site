import type { Metadata } from "next";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy Policy · Cinematic Graphite",
  description: "Data minimization, redacted observability, and viewer session privacy.",
};

export default function PrivacyPage() {
  return (
    <ConsumerShell>
      <article className="cg-prose space-y-6">
        <header className="space-y-3">
          <Badge tone="neutral">Privacy &amp; Data Protection</Badge>
          <h1 className="font-display text-text text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
          <p className="text-text-muted text-sm">
            Working operational draft · Requires legal review prior to public launch.
          </p>
        </header>

        <section className="text-text-secondary space-y-3 text-base leading-7">
          <h2 className="font-display text-text text-xl font-semibold">1. Data Minimization</h2>
          <p>
            We collect only the account, session, and playback telemetry required to operate lawful
            media delivery, prevent abuse, and honor contractual rights reporting. Storage object
            keys use opaque non-PII identifiers.
          </p>
        </section>

        <section className="text-text-secondary space-y-3 text-base leading-7">
          <h2 className="font-display text-text text-xl font-semibold">
            2. Redacted Structured Logging
          </h2>
          <p>
            Passwords, session cookies, Bearer tokens, OAuth refresh tokens, and signed delivery
            URLs are scrubbed at the logger boundary before telemetry is written. Watch routes emit{" "}
            <code className="text-text font-mono text-xs">Referrer-Policy: no-referrer</code>.
          </p>
        </section>

        <section className="text-text-secondary space-y-3 text-base leading-7">
          <h2 className="font-display text-text text-xl font-semibold">
            3. Self-Hosted Fonts &amp; Third-Party Assets
          </h2>
          <p>
            Typography is self-hosted at build time so viewer IP addresses are not leaked to
            third-party font CDNs on page load.
          </p>
        </section>
      </article>
    </ConsumerShell>
  );
}
