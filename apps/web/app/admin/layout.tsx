import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/layout/brand";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = {
  title: { default: "Operations", template: "%s · Operations · Cinematic Graphite" },
  robots: { index: false, follow: false },
};
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="wordmark">
          <BrandMark />
          <span>
            Cinematic Graphite<span className="cg-accent">.</span>
          </span>
        </Link>
        <div className="admin-workspace">
          <span className="admin-workspace-symbol">CG</span>
          <div>
            <strong>Operations workspace</strong>
            <span>Read-only UI preview</span>
          </div>
          <Icon name="lock" />
        </div>
        <p className="eyebrow">Control plane</p>
        <nav aria-label="Operations navigation">
          <Link href="/admin#overview">
            <Icon name="grid" />
            Overview
          </Link>
          <Link href="/admin#rights-queue">
            <Icon name="shield" />
            Rights queue
          </Link>
          <Link href="/admin#delivery">
            <Icon name="films" />
            Delivery gates
          </Link>
          <Link href="/admin#access">
            <Icon name="people" />
            Access model
          </Link>
        </nav>
        <div className="admin-sidebar-bottom">
          <p>
            <Icon name="lock" />
            No live mutations
          </p>
          <span>
            Publishing, ingest and rights approval require authenticated staff sessions and MFA. No
            secrets or private records appear here.
          </span>
          <Link href="/" className="text-link">
            <Icon name="arrow-left" />
            Return to public site
          </Link>
        </div>
      </aside>
      <div className="admin-main-wrap">
        <header className="admin-topbar">
          <div>
            <Icon name="shield" />
            <span>Rights first. Deny by default.</span>
          </div>
          <Link href="/legal/takedown">
            Takedown policy
            <Icon name="arrow-up-right" />
          </Link>
          <span className="admin-preview-badge">Preview workspace</span>
        </header>
        <main id="main" tabIndex={-1} className="admin-main">
          {children}
        </main>
        <footer className="admin-footer">
          <span>Cinematic Graphite / Operations preview</span>
          <Link href="/api/v1/health">
            Health endpoint
            <Icon name="arrow-up-right" />
          </Link>
        </footer>
      </div>
    </div>
  );
}
