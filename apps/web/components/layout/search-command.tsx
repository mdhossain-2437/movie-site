"use client";

import type { PublicTitleSummary } from "@movie/db";
import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { AvailabilityBadge, Badge, Spinner } from "@/components/ui";

const emptySubscribe = () => () => {};

export function SearchCommandModal() {
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PublicTitleSummary[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dialogTitleId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const triggerElement = triggerRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 10);

    function handleDialogKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", handleDialogKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleDialogKeyDown);
      if (triggerElement) {
        triggerElement.focus();
      } else {
        previousFocus?.focus();
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const controller = new AbortController();
    const debounceId = window.setTimeout(async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          throw new Error("Search request failed");
        }
        const payload = (await res.json()) as { items?: PublicTitleSummary[] };
        setResults(payload.items ?? []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setErrorMsg("Unable to fetch search results right now.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 180);

    return () => {
      window.clearTimeout(debounceId);
      controller.abort();
    };
  }, [query, open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Open quick catalogue search (Ctrl+K)"
        data-hydrated={hydrated ? "true" : undefined}
        className="border-border bg-surface-1 text-text-secondary hover:bg-surface-2 hover:text-text inline-flex min-h-11 items-center gap-2 rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors"
      >
        <svg
          aria-hidden="true"
          className="text-text-secondary h-4 w-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Quick Search</span>
        <kbd className="border-border bg-surface-2 text-text-muted hidden rounded-xs border px-1.5 py-0.5 font-mono text-[11px] lg:inline-block">
          Ctrl K
        </kbd>
      </button>

      {open ? (
        <div
          className="bg-canvas/85 fixed inset-0 z-50 flex items-start justify-center p-4 pt-14 backdrop-blur-xs sm:pt-24"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="border-border-strong bg-surface-1 text-text w-full max-w-2xl rounded-lg border p-4 shadow-xl sm:p-6"
          >
            <div className="flex items-center justify-between gap-3 pb-3">
              <h2 id={dialogTitleId} className="font-display text-text text-base font-semibold">
                Quick Catalogue Search
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close search dialog"
                className="border-border bg-surface-2 text-text-secondary hover:text-text min-h-11 min-w-11 rounded-sm border px-3 py-1.5 font-mono text-xs"
              >
                Esc
              </button>
            </div>

            <div>
              <label htmlFor="quick-search-modal-input" className="sr-only">
                Search published films, cast, or Bangla/English titles
              </label>
              <input
                ref={inputRef}
                id="quick-search-modal-input"
                type="search"
                value={query}
                onChange={(e) => {
                  const next = e.target.value;
                  setQuery(next);
                  if (!next.trim()) {
                    setResults([]);
                    setErrorMsg(null);
                    setLoading(false);
                  }
                }}
                maxLength={120}
                placeholder="Type an English or বাংলা title, director, or actor…"
                className="border-border-strong bg-surface-2 text-text placeholder:text-text-muted min-h-11 w-full rounded-sm border px-4 py-2.5 text-base"
              />
            </div>

            <div aria-live="polite" className="mt-4 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="text-text-muted flex items-center gap-2 py-4 text-xs">
                  <Spinner size="sm" />
                  <span>Searching published catalogue…</span>
                </div>
              ) : errorMsg ? (
                <p role="alert" className="text-danger py-4 text-xs">
                  {errorMsg}
                </p>
              ) : query.trim().length === 0 ? (
                <p className="text-text-muted py-4 text-xs">
                  Only rights-cleared published titles are indexed. Press{" "}
                  <span className="font-mono">Escape</span> to dismiss.
                </p>
              ) : results.length === 0 ? (
                <div className="space-y-2 py-4">
                  <p className="text-text-secondary text-sm">
                    No published film matched &ldquo;{query.trim()}&rdquo;.
                  </p>
                  <Link
                    href={`/search?q=${encodeURIComponent(query.trim())}`}
                    onClick={() => setOpen(false)}
                    className="text-accent inline-block text-xs underline"
                  >
                    Open full Search page
                  </Link>
                </div>
              ) : (
                <ul className="divide-border divide-y">
                  {results.map((item) => (
                    <li key={item.id} className="py-2.5">
                      <Link
                        href={`/movies/${item.slug}`}
                        onClick={() => setOpen(false)}
                        className="hover:bg-surface-2 flex min-h-11 flex-wrap items-center justify-between gap-2 rounded-sm p-2 transition-colors"
                      >
                        <div>
                          <p className="font-display text-text text-sm font-semibold">
                            {item.localizedTitleEn}
                          </p>
                          {item.localizedTitleBn ? (
                            <p className="text-text-secondary text-xs" lang="bn">
                              {item.localizedTitleBn}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone="neutral">{item.releaseYear}</Badge>
                          <AvailabilityBadge kind={item.availability.badgeKind} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
