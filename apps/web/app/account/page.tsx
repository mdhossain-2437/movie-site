import type { Metadata } from "next";
import Link from "next/link";
import { ConsumerShell } from "@/components/layout/site-shell";
import { DevicePreferences } from "@/components/experience/preferences";
import { KeyArt } from "@/components/art/key-art";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = {
  title: "Account & Security",
  description:
    "Device preferences, privacy and transparent account status. No live sign-in is connected in this preview.",
};
export default function AccountPage() {
  return (
    <ConsumerShell>
      <header className="page-header">
        <p className="eyebrow">Make a little space for cinema</p>
        <h1>
          Your perspective<span className="cg-accent">.</span>
        </h1>
        <p>Personal, without the unnecessary personal data.</p>
      </header>
      <div className="account-layout">
        <aside className="account-art">
          <KeyArt
            spec={{
              motif: "screen",
              palette: {
                bg: "#140d10",
                bg2: "#4a2230",
                ink: "#070405",
                accent: "#d8b36a",
                light: "#f6ead7",
              },
            }}
          />
          <div className="art-grain" />
          <div className="account-art-copy">
            <p className="eyebrow">The best seat is your own.</p>
            <h2>
              A world of films.
              <br />A space for you.
            </h2>
            <span>Original generated illustration</span>
          </div>
        </aside>
        <div className="account-content">
          <section className="account-status">
            <div className="account-status-top">
              <span className="account-avatar">
                <Icon name="user" />
              </span>
              <span className="account-status-badge">
                <Icon name="info" />
                Browsing as a guest
              </span>
            </div>
            <h2>
              No sign-in required
              <br />
              to be curious.
            </h2>
            <p>
              Accounts and server sessions aren’t connected in this UI preview. We won’t ask for a
              password we can’t safely use. Explore freely and keep a list on this device.
            </p>
            <div>
              <Link href="/watchlist" className="action-button action-primary">
                <Icon name="bookmark" />
                My device’s list
              </Link>
              <Link href="/movies" className="text-link">
                Keep exploring
                <Icon name="arrow-up-right" />
              </Link>
            </div>
          </section>
          <section className="account-preferences" id="preferences">
            <p className="eyebrow">A small adjustment, a better experience</p>
            <h2>Your viewing environment.</h2>
            <DevicePreferences />
          </section>
          <section className="account-security" id="security">
            <p className="eyebrow">The account architecture / not yet connected</p>
            <h2>Privacy is part of the picture.</h2>
            <div className="security-principles">
              <div>
                <Icon name="lock" />
                <h3>Revocable sessions</h3>
                <p>
                  The planned account system uses server-managed, HttpOnly sessions, with individual
                  device revocation.
                </p>
              </div>
              <div>
                <Icon name="shield" />
                <h3>Protected operations</h3>
                <p>
                  Privileged publishing and rights approvals require verified MFA and separation of
                  duties.
                </p>
              </div>
            </div>
            <Link href="/legal/privacy" className="text-link">
              Read our privacy approach
              <Icon name="arrow-up-right" />
            </Link>
          </section>
        </div>
      </div>
    </ConsumerShell>
  );
}
