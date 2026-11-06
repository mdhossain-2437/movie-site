import Link from "next/link";
import type { ReactNode } from "react";
import { getCatalogueMode } from "@/lib/catalogue/repository";
import { Icon } from "@/components/ui/icon";
import { BrandMark } from "./brand";

export { BrandMark } from "./brand";

export function SiteHeader() {
  const fixtures = getCatalogueMode() === "fixtures";
  return (
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label="Cinematic Graphite home">
        <BrandMark />
        <span>
          Cinematic
          <br className="wordmark-break" /> Graphite<span className="wordmark-dot">.</span>
        </span>
      </Link>
      <div className="header-center">
        <span className="header-line" />
        An independent film archive
      </div>
      <div className="header-right">
        {fixtures ? (
          <Link href="/legal/copyright#development-fixtures" className="fixture-indicator">
            <span className="status-square" aria-hidden="true" />
            <span>Development preview</span>
            <Icon name="arrow-up-right" />
          </Link>
        ) : (
          <Link href="/legal/copyright" className="fixture-indicator">
            <Icon name="shield" />
            <span>Rights first. Always.</span>
          </Link>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <p>
          Good cinema stays with you.
          <br />
          <span>So should the curiosity.</span>
        </p>
        <Link href="/movies" className="round-link" aria-label="Explore all films">
          <Icon name="arrow-up-right" />
        </Link>
      </div>
      <div className="footer-wordmark" aria-hidden="true">
        Graphite<span>.</span>
      </div>
      <div className="footer-bottom">
        <div>
          <span className="eyebrow">Cinematic Graphite</span>
          <p>Working codename. Owned, licensed, or legally verified works only.</p>
        </div>
        <nav aria-label="Legal and compliance">
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal/copyright">Copyright</Link>
          <Link href="/legal/takedown">Takedowns</Link>
          <Link href="/report-content">Report content</Link>
          <Link href="/admin">
            Operations <Icon name="arrow-up-right" />
          </Link>
        </nav>
        <a href="#main" className="back-top">
          Back to top <Icon name="arrow-up-right" />
        </a>
      </div>
    </footer>
  );
}

export function ConsumerShell({
  children,
  fullBleed = false,
  className = "",
}: {
  children: ReactNode;
  fullBleed?: boolean;
  className?: string;
}) {
  return (
    <>
      <SiteHeader />
      <main
        id="main"
        tabIndex={-1}
        className={`${fullBleed ? "consumer-main" : "consumer-main page-content"} ${className}`.trim()}
      >
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
