"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface SessionSummary {
  displayName: string;
  email: string;
}

export function HeaderAccountControl() {
  const [session, setSession] = useState<SessionSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    fetch("/api/v1/auth/session", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as {
          authenticated?: boolean;
          session?: { displayName?: string; email?: string } | null;
        };
      })
      .then((payload) => {
        if (!cancelled && payload?.authenticated && payload.session?.displayName) {
          setSession({
            displayName: payload.session.displayName,
            email: payload.session.email ?? "",
          });
        }
      })
      .catch(() => {
        // Unauthenticated fallback
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  if (session) {
    return (
      <Link
        href="/account"
        data-testid="header-authenticated-user"
        aria-label={`Signed in as ${session.displayName}. Open Account`}
        className="border-accent/50 bg-surface-1 text-text hover:border-accent hover:bg-surface-2 rounded-pill hidden min-h-9 items-center gap-2 border px-3.5 py-1.5 text-xs font-semibold transition-colors motion-reduce:transform-none motion-reduce:transition-none lg:inline-flex"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-success h-3.5 w-3.5 shrink-0"
        >
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span className="max-w-36 truncate">{session.displayName}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      className="border-border bg-surface-1 text-text-secondary hover:border-border-strong hover:text-text rounded-pill hidden min-h-9 items-center border px-4 py-1.5 text-xs font-medium transition-colors motion-reduce:transform-none motion-reduce:transition-none lg:inline-flex"
    >
      Sign In
    </Link>
  );
}
