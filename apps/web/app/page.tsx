import type { Metadata } from "next";
import { ConsumerShell } from "@/components/layout/site-shell";
import { AvailabilityBadge, Badge, ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Home · Cinematic Graphite",
  description:
    "Lawful movie discovery and rights-gated media distribution platform. Only owned, licensed, or counsel-verified public-domain films are published.",
};

const FOUNDATION_MODULES = [
  {
    name: "Design System & Accessibility",
    state: "Active",
    tone: "success" as const,
    detail:
      "Cinematic Graphite semantic tokens, self-hosted typography, keyboard skip-links, and 360px–1920px responsive shell.",
  },
  {
    name: "Central Rights Decision Engine",
    state: "Active",
    tone: "success" as const,
    detail:
      "Deny-by-default server policy enforcing territory, date windows, separate stream/download rights, legal holds, and DRM gates.",
  },
  {
    name: "Private Quarantine Storage Adapter",
    state: "Active",
    tone: "success" as const,
    detail:
      "Multipart ingest with SHA-256 checksum verification, opaque non-PII object keys, and short-lived HMAC delivery URLs.",
  },
  {
    name: "Database, Identity & Catalogue Gate",
    state: "Milestone M2",
    tone: "info" as const,
    detail:
      "PostgreSQL persistence, RBAC sessions, editorial draft workflow, and rights-verified public catalogue publication.",
  },
] as const;

export default function Home() {
  return (
    <ConsumerShell>
      <section aria-labelledby="hero-heading" className="py-6 sm:py-12">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge tone="accent">Milestone M1 · Foundation Active</Badge>
          <AvailabilityBadge kind="rights_pending" />
        </div>

        <h1
          id="hero-heading"
          className="font-display text-text mt-5 max-w-3xl text-[length:var(--cg-text-4xl)] leading-tight font-bold text-balance sm:text-[length:var(--cg-text-display)]"
        >
          The catalogue opens only to verified rights.
        </h1>

        <p className="cg-prose text-text-secondary mt-5 text-lg leading-8">
          Cinematic Graphite lists and delivers only films that the operator owns, holds a
          documented distribution licence for, or has verified for public-domain release. No
          unverified uploads, scraped streams, or unauthorized mirrors are permitted.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ButtonLink href="/movies" variant="primary" size="lg">
            Browse Catalogue Shell
          </ButtonLink>
          <ButtonLink href="/search" variant="secondary" size="lg">
            Search Catalogue
          </ButtonLink>
          <ButtonLink href="/admin" variant="outline" size="lg">
            Operations Console
          </ButtonLink>
        </div>
      </section>

      <section aria-labelledby="readiness-heading" className="mt-10 sm:mt-14">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-text-muted font-mono text-xs tracking-wide uppercase">
              Platform readiness
            </p>
            <h2
              id="readiness-heading"
              className="font-display text-text mt-1 text-2xl font-semibold"
            >
              Verified architecture foundations
            </h2>
          </div>
          <ButtonLink href="/legal/copyright" variant="ghost" size="sm">
            Read Copyright &amp; Rights Policy
          </ButtonLink>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {FOUNDATION_MODULES.map((mod) => (
            <article key={mod.name} className="cg-surface flex flex-col justify-between p-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-text text-lg font-semibold">{mod.name}</h3>
                  <Badge tone={mod.tone}>{mod.state}</Badge>
                </div>
                <p className="text-text-secondary mt-3 text-sm leading-6">{mod.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </ConsumerShell>
  );
}
