"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function FloatingDock() {
  const pathname = usePathname();

  const isFilms = pathname?.startsWith("/movies");
  const isCollections = pathname?.startsWith("/collections");
  const isWatchlist = pathname === "/watchlist";
  const isAccount = pathname === "/account";

  return (
    <nav
      aria-label="Signature floating dock navigation"
      className="border-border/80 bg-canvas/90 fixed bottom-4 left-1/2 z-30 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-1 rounded-xl border p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.88)] backdrop-blur-md transition-all motion-reduce:transition-none sm:bottom-5 sm:gap-1.5"
    >
      {/* Segment 1: Signature Reddish Cinema Crimson (#E50914) Brand Tile */}
      <Link
        href="/"
        aria-label="CINEVA Home"
        className="bg-accent text-on-accent hover:bg-accent-hover focus-visible:outline-accent font-display flex min-h-11 min-w-13 items-center justify-center rounded-lg px-2.5 text-xs font-black tracking-tight transition-colors motion-reduce:transition-none sm:min-w-20 sm:px-4 sm:text-sm"
      >
        CINEVA
      </Link>

      {/* Segment 2: Smoke-Charcoal (#141414) Primary Navigation Bar */}
      <div className="border-border bg-surface-1 flex min-h-11 items-center gap-0.5 rounded-lg border px-1 sm:gap-1.5 sm:px-2.5">
        <Link
          href="/movies"
          aria-current={isFilms ? "page" : undefined}
          className={`focus-visible:outline-accent flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md px-2 text-xs font-medium transition-colors motion-reduce:transition-none sm:px-3.5 ${
            isFilms
              ? "bg-surface-2 text-text"
              : "text-text-secondary hover:bg-surface-2/80 hover:text-text"
          }`}
        >
          {/* 9-dot cinema menu grid icon matching reference concept */}
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="text-text-muted h-3.5 w-3.5 shrink-0"
          >
            <circle cx="3" cy="3" r="1.2" />
            <circle cx="8" cy="3" r="1.2" />
            <circle cx="13" cy="3" r="1.2" />
            <circle cx="3" cy="8" r="1.2" />
            <circle cx="8" cy="8" r="1.2" />
            <circle cx="13" cy="8" r="1.2" />
            <circle cx="3" cy="13" r="1.2" />
            <circle cx="8" cy="13" r="1.2" />
            <circle cx="13" cy="13" r="1.2" />
          </svg>
          <span className="sr-only sm:not-sr-only">Films</span>
        </Link>

        <span aria-hidden="true" className="bg-border hidden h-4 w-px sm:block" />

        <Link
          href="/collections/monsoon-noir-archive"
          aria-current={isCollections ? "page" : undefined}
          className={`focus-visible:outline-accent flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors motion-reduce:transition-none sm:px-3.5 ${
            isCollections
              ? "bg-surface-2 text-text"
              : "text-text-secondary hover:bg-surface-2/80 hover:text-text"
          }`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4 shrink-0 sm:hidden"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span className="sr-only sm:not-sr-only">Collections</span>
        </Link>
      </div>

      {/* Segment 3: Saved / Watchlist Tile with Crimson Indicator Dot */}
      <Link
        href="/watchlist"
        aria-current={isWatchlist ? "page" : undefined}
        className={`border-border bg-surface-1 focus-visible:outline-accent relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-lg border px-2 py-1 transition-colors motion-reduce:transition-none sm:min-w-13 ${
          isWatchlist
            ? "border-accent/60 bg-surface-2 text-text"
            : "text-text-secondary hover:bg-surface-2 hover:text-text"
        }`}
      >
        <span className="relative inline-flex">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-3.5 w-3.5 shrink-0"
          >
            <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
          </svg>
          <span
            aria-hidden="true"
            className="bg-accent ring-surface-1 absolute -top-0.5 -right-1 h-2 w-2 rounded-full ring-2"
          />
        </span>
        <span className="text-text-muted sr-only text-[9px] leading-none sm:not-sr-only">
          Watchlist
        </span>
      </Link>

      {/* Segment 4: Quick Search Tile (Ctrl+K dispatcher) */}
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
        }}
        aria-label="Search"
        className="border-border bg-surface-1 text-text-secondary hover:bg-surface-2 hover:text-text focus-visible:outline-accent flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-lg border px-2 py-1 transition-colors motion-reduce:transition-none sm:min-w-13"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-3.5 w-3.5 shrink-0"
        >
          <circle cx="11" cy="11" r="7.5" />
          <path d="m20 20-4.2-4.2" strokeLinecap="round" />
        </svg>
        <span
          aria-hidden="true"
          className="text-text-muted hidden text-[9px] leading-none sm:inline"
        >
          Search
        </span>
      </button>

      {/* Segment 5: Sign In / Account Tile */}
      <Link
        href="/account"
        aria-current={isAccount ? "page" : undefined}
        aria-label="Account Profile"
        className={`border-border bg-surface-1 focus-visible:outline-accent flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-lg border px-2 py-1 transition-colors motion-reduce:transition-none sm:min-w-13 ${
          isAccount
            ? "border-accent/60 bg-surface-2 text-text"
            : "text-text-secondary hover:bg-surface-2 hover:text-text"
        }`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-3.5 w-3.5 shrink-0"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M5 20c0-3.8 3.1-6 7-6s7 2.2 7 6" />
        </svg>
        <span
          aria-hidden="true"
          className="text-text-muted hidden text-[9px] leading-none sm:inline"
        >
          Sign in
        </span>
      </Link>
    </nav>
  );
}

export default FloatingDock;
