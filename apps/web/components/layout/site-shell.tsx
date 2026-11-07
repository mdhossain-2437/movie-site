import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { FloatingDock } from "./floating-dock";
import { DesktopNavLinks, MobileNavLinks, type NavItem } from "./nav-links";
import { SearchCommandModal } from "./search-command";

export const PRIMARY_NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Featured" },
  { href: "/movies", label: "Films" },
  { href: "/series", label: "Series" },
  { href: "/tmdb", label: "TMDB Live" },
  { href: "/studios", label: "Studios" },
  { href: "/collections", label: "Collections" },
  { href: "/people", label: "Directors & Cast" },
  { href: "/watchlist", label: "Watchlist" },
];

export const MOBILE_NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/account", label: "Sign In" },
];

/**
 * Original minimal anamorphic frame & projection monogram for CINEVA.
 */
export function BrandMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="text-accent h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 9V5h4" />
      <path d="M20 9V5h-4" />
      <path d="M4 15v4h4" />
      <path d="M20 15v4h-4" />
      <polygon points="10,8.5 16,12 10,15.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DesktopNavFallback({ items }: { items: readonly NavItem[] }) {
  return (
    <ul className="hidden items-center gap-1 lg:flex">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="text-text-muted hover:text-text inline-flex min-h-10 items-center rounded-sm px-2.5 py-2 text-xs font-medium tracking-wide whitespace-nowrap transition-colors xl:px-3.5"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function MobileNavFallback({ items }: { items: readonly NavItem[] }) {
  return (
    <ul className="grid grid-cols-4 gap-1 px-2 py-1.5">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="text-text-secondary hover:bg-surface-2 hover:text-text flex min-h-11 flex-col items-center justify-center rounded-sm px-2 py-1.5 text-xs font-medium"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SiteHeader() {
  return (
    <header className="bg-canvas/85 sticky top-0 z-20 max-w-full overflow-x-clip backdrop-blur-md">
      <div className="cg-container flex h-14 max-w-full items-center justify-between gap-2 sm:gap-4">
        <div className="flex min-w-0 shrink items-center gap-4 sm:gap-8">
          <Link
            href="/"
            className="font-display text-text inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm px-1 text-sm font-black tracking-[0.16em] uppercase sm:text-base"
          >
            <span className="bg-accent text-on-accent rounded-xs px-2 py-0.5 text-xs font-black tracking-tight">
              CINEVA
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <Suspense fallback={<DesktopNavFallback items={PRIMARY_NAV_ITEMS} />}>
              <DesktopNavLinks items={PRIMARY_NAV_ITEMS} />
            </Suspense>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <SearchCommandModal />
          <Link
            href="/account"
            className="border-border bg-surface-1 text-text-secondary hover:border-border-strong hover:text-text rounded-pill hidden min-h-9 items-center border px-4 py-1.5 text-xs font-medium transition-colors lg:inline-flex"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="border-border bg-canvas-raised fixed right-0 bottom-0 left-0 z-20 border-t md:hidden"
    >
      <Suspense fallback={<MobileNavFallback items={MOBILE_NAV_ITEMS} />}>
        <MobileNavLinks items={MOBILE_NAV_ITEMS} />
      </Suspense>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-border/60 bg-canvas-raised border-t pb-24 md:pb-24">
      <div className="cg-container flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="bg-accent text-on-accent font-display rounded-xs px-2 py-0.5 text-xs font-black tracking-tight">
              CINEVA
            </span>
            <p className="font-display text-text text-sm font-semibold">
              World Cinema, Restored Classics &amp; Original Features
            </p>
          </div>
          <p className="text-text-muted mt-1.5 text-xs">
            Curated theatrical streaming and high-definition cinema archive.
          </p>
        </div>

        <nav aria-label="Legal and compliance">
          <ul className="text-text-muted flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <li>
              <Link href="/movies" className="hover:text-text transition-colors">
                Films
              </Link>
            </li>
            <li>
              <Link href="/series" className="hover:text-text transition-colors">
                Series
              </Link>
            </li>
            <li>
              <Link href="/studios" className="hover:text-text transition-colors">
                Studios
              </Link>
            </li>
            <li>
              <Link href="/collections" className="hover:text-text transition-colors">
                Collections
              </Link>
            </li>
            <li>
              <Link href="/people" className="hover:text-text transition-colors">
                Directors
              </Link>
            </li>
            <li>
              <Link href="/legal/terms" className="hover:text-text transition-colors">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/legal/privacy" className="hover:text-text transition-colors">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/legal/copyright" className="hover:text-text transition-colors">
                Licensing
              </Link>
            </li>
            <li>
              <Link href="/legal/takedown" className="hover:text-text transition-colors">
                Rights Inquiries
              </Link>
            </li>
            <li>
              <Link href="/report-content" className="hover:text-text transition-colors">
                Report Issue
              </Link>
            </li>
          </ul>
        </nav>
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
    <div className="bg-canvas text-text flex min-h-screen max-w-full flex-col overflow-x-clip">
      <SiteHeader />
      <main
        id="main"
        tabIndex={-1}
        className={
          fullBleed
            ? `consumer-main max-w-full flex-1 overflow-x-clip pb-28 sm:pb-32 ${className}`.trim()
            : `cg-container max-w-full flex-1 overflow-x-clip py-10 pb-28 sm:py-14 sm:pb-32 ${className}`.trim()
        }
      >
        {children}
      </main>
      <SiteFooter />
      <Suspense fallback={null}>
        <FloatingDock />
      </Suspense>
    </div>
  );
}
