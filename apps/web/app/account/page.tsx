import type { Metadata } from "next";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, ButtonLink, EmptyState } from "@/components/ui";

export const metadata: Metadata = {
  title: "Profile & Security · Cinematic Graphite",
  description: "Account sessions, role-based access, and privacy controls.",
};

export default function AccountPage() {
  return (
    <ConsumerShell>
      <header className="mb-8 space-y-3">
        <Badge tone="info">Identity &amp; Sessions</Badge>
        <h1 className="font-display text-text text-3xl font-bold sm:text-4xl">
          Profile &amp; Account Security
        </h1>
        <p className="cg-prose text-text-secondary text-base leading-7">
          Viewer accounts use revocable server-side sessions with HttpOnly cookies, while
          operational and rights-approval roles require verified multi-factor authentication.
        </p>
      </header>

      <EmptyState
        eyebrow="Milestone M2 · Authentication slice"
        title="Sign-in opens in Milestone M2"
        description="Password hashing, session rotation, active device revocation, and MFA enforcement for privileged staff connect to PostgreSQL in the next milestone."
        actions={
          <>
            <ButtonLink href="/legal/privacy" variant="secondary">
              Privacy Policy
            </ButtonLink>
            <ButtonLink href="/" variant="outline">
              Return Home
            </ButtonLink>
          </>
        }
      />
    </ConsumerShell>
  );
}
