"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "./site-shell";

export function FloatingDock() {
  const pathname = usePathname();

  const isFilms = pathname?.startsWith("/movies");
  const isCollections = pathname?.startsWith("/collections");
  const isWatchlist = pathname === "/watchlist";
  const isAdmin = pathname?.startsWith("/admin");
  const isAccount = pathname === "/account";

  return (
    <nav
      aria-label="Signature floating dock navigation"
      className="rounded-pill border-border/90 bg-surface-1/90 fixed bottom-4 left-1/2 z-30 flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-1 border px-2.5 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.65)] backdrop-blur-md transition-all sm:bottom-6 sm:gap-2 sm:px-4"
    >
      {/* BrandMark Aperture Button */}
      <Link
        href="/"
        aria-label="Cinematic Graphite Home"
        className="rounded-pill text-accent hover:bg-surface-2 focus-visible:outline-accent flex min-h-11 min-w-11 items-center justify-center transition-colors"
      >
        <BrandMark />
      </Link>

      {/* Films Link */}
      <Link
        href="/movies"
        aria-current={isFilms ? "page" : undefined}
        className={`rounded-pill focus-visible:outline-accent flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
          isFilms
            ? "bg-surface-2 text-accent border-accent/40 border"
            : "text-text-secondary hover:bg-surface-2 hover:text-text"
        }`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4 shrink-0"
        >
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
          <line x1="7" y1="2" x2="7" y2="22" />
          <line x1="17" y1="2" x2="17" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="2" y1="7" x2="7" y2="7" />
          <line x1="2" y1="17" x2="7" y2="17" />
          <line x1="17" y1="17" x2="22" y2="17" />
          <line x1="17" y1="7" x2="22" y2="7" />
        </svg>
        <span className="hidden sm:inline">Films</span>
      </Link>

      {/* Collections Link */}
      <Link
        href="/collections/monsoon-noir-archive"
        aria-current={isCollections ? "page" : undefined}
        className={`rounded-pill focus-visible:outline-accent flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
          isCollections
            ? "bg-surface-2 text-accent border-accent/40 border"
            : "text-text-secondary hover:bg-surface-2 hover:text-text"
        }`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4 shrink-0"
        >
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span className="hidden sm:inline">Collections</span>
      </Link>

      {/* Watchlist Link */}
      <Link
        href="/watchlist"
        aria-current={isWatchlist ? "page" : undefined}
        className={`rounded-pill focus-visible:outline-accent flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
          isWatchlist
            ? "bg-surface-2 text-accent border-accent/40 border"
            : "text-text-secondary hover:bg-surface-2 hover:text-text"
        }`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4 shrink-0"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        <span className="hidden sm:inline">Watchlist</span>
      </Link>

      {/* Quick Search Trigger (Ctrl+K dispatcher) */}
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
        }}
        aria-label="Search"
        className="rounded-pill text-text-secondary hover:bg-surface-2 hover:text-text focus-visible:outline-accent flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4 shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Search</span>
      </button>

      {/* Operations / Admin Link */}
      <Link
        href="/admin"
        aria-current={isAdmin ? "page" : undefined}
        className={`rounded-pill focus-visible:outline-accent flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
          isAdmin
            ? "bg-surface-2 text-accent border-accent/40 border"
            : "text-text-secondary hover:bg-surface-2 hover:text-text"
        }`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 shrink-0"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span className="hidden md:inline">Admin</span>
      </Link>

      {/* Account Profile Link */}
      <Link
        href="/account"
        aria-current={isAccount ? "page" : undefined}
        aria-label="Account Profile"
        className={`rounded-pill focus-visible:outline-accent flex min-h-11 min-w-11 items-center justify-center transition-colors ${
          isAccount
            ? "bg-surface-2 text-accent border-accent/40 border"
            : "text-text-secondary hover:bg-surface-2 hover:text-text"
        }`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </Link>
    </nav>
  );
}

export default FloatingDock;
