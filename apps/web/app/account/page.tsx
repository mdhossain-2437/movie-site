import { listActiveSessionsForUser } from "@movie/auth";
import { getDatabase } from "@movie/db";
import { roleRequiresMfa } from "@movie/domain";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountAuthForms, AccountSessionControls } from "@/components/account/auth-forms";
import { DevicePreferences } from "@/components/experience/preferences";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, Skeleton } from "@/components/ui";
import { getCurrentSession } from "@/lib/server/api-helpers";

export const metadata: Metadata = {
  title: "Account · CINEVA",
  description: "Manage your CINEVA account, active sessions, and playback preferences.",
};

async function AccountSessionPanel() {
  const { session } = await getCurrentSession();

  if (!session) {
    return <AccountAuthForms />;
  }

  const db = await getDatabase();
  const activeSessions = await listActiveSessionsForUser(db, session.actor.userId);
  const needsMfa =
    session.actor.roles.some((role) => roleRequiresMfa(role)) && !session.actor.mfaVerified;

  return (
    <div className="space-y-8">
      <section className="cg-surface space-y-4 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-text text-xl font-semibold">{session.displayName}</h2>
            <p className="text-text-muted font-mono text-xs">{session.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {session.actor.roles.map((r) => (
              <Badge key={r} tone="accent">
                {r}
              </Badge>
            ))}
            <Badge tone={session.actor.mfaVerified ? "success" : "neutral"}>
              {session.actor.mfaVerified ? "MFA Verified" : "Password Session"}
            </Badge>
          </div>
        </div>

        <AccountSessionControls requiresMfaStepUp={needsMfa} />
      </section>

      <section aria-labelledby="sessions-heading" className="space-y-3">
        <h2 id="sessions-heading" className="font-display text-text text-lg font-semibold">
          Active Sessions ({activeSessions.length})
        </h2>
        <div className="divide-border border-border bg-surface-1 divide-y rounded-lg border">
          {activeSessions.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 p-4 text-xs"
            >
              <div>
                <p className="text-text font-mono">{s.id}</p>
                <p className="text-text-muted">{s.userAgent ?? "Browser session"}</p>
              </div>
              <p className="text-text-secondary font-mono">
                Expires {s.expiresAt.toISOString().slice(0, 10)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AccountPage() {
  return (
    <ConsumerShell>
      <header className="mb-8 space-y-3">
        <Badge tone="info">Identity &amp; Sessions</Badge>
        <h1 className="font-display text-text text-3xl font-bold sm:text-4xl">
          Profile &amp; Account Security
        </h1>
        <p className="cg-prose text-text-secondary text-base leading-7">
          Viewer accounts use revocable server-side sessions with HttpOnly cookies and SHA-256
          hashed session tokens. Privileged staff roles require TOTP multi-factor authentication.
        </p>
      </header>

      <Suspense fallback={<Skeleton className="h-72 max-w-xl" />}>
        <AccountSessionPanel />
      </Suspense>

      <section aria-labelledby="device-prefs-heading" className="cg-surface mt-12 p-6 sm:p-8">
        <div className="mb-6 space-y-1">
          <Badge tone="neutral">Display &amp; Accessibility</Badge>
          <h2 id="device-prefs-heading" className="font-display text-text pt-1 text-xl font-bold">
            Local Viewing Preferences
          </h2>
          <p className="text-text-secondary text-sm">
            Customize motion sensitivity and viewing settings on this browser.
          </p>
        </div>
        <DevicePreferences />
      </section>
    </ConsumerShell>
  );
}
