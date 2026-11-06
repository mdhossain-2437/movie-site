import type { Metadata } from "next";
import Link from "next/link";
import { ConsumerShell } from "@/components/layout/site-shell";
import { DeviceList } from "@/components/experience/device-list";
import { FixtureNotice } from "@/components/catalogue/common";
import { Icon } from "@/components/ui/icon";
import { listTitles } from "@/lib/catalogue/repository";

export const metadata: Metadata = {
  title: "My List",
  description:
    "Keep a personal list of film references on this device. Saved titles never grant streaming or download rights.",
};
export default function WatchlistPage() {
  return (
    <ConsumerShell>
      <header className="page-header page-header-split">
        <div>
          <p className="eyebrow">A little collection of your own</p>
          <h1>
            My List<span className="cg-accent">.</span>
          </h1>
        </div>
        <p>
          For the films that catch your eye.
          <br />
          Keep them close. Come back when curiosity calls.
        </p>
      </header>
      <div className="device-notice">
        <Icon name="info" />
        <p>
          This is a <strong>device-only preview list</strong>, saved in this browser. No account or
          cloud sync is connected, and saving never unlocks playback.{" "}
          <Link href="/account">
            Account &amp; privacy
            <Icon name="arrow-up-right" />
          </Link>
        </p>
      </div>
      <DeviceList
        cards={listTitles()}
        emptyState={
          <section className="list-empty">
            <div className="empty-poster-stack" aria-hidden="true">
              <span />
              <span />
              <span>
                <Icon name="plus" />
              </span>
            </div>
            <p className="eyebrow">A blank frame. Endless possibilities.</p>
            <h2>
              Your story starts
              <br />
              with a little curiosity.
            </h2>
            <p>
              Tap the plus beside a film to save it here. A personal path through the archive, one
              discovery at a time.
            </p>
            <Link href="/movies" className="action-button action-primary">
              Explore the archive
              <Icon name="arrow-up-right" />
            </Link>
          </section>
        }
      />
      <FixtureNotice compact />
    </ConsumerShell>
  );
}
