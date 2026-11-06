"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { BrandMark } from "@/components/layout/brand";
import { Icon, type IconName } from "@/components/ui/icon";
import { searchEntries, type SearchEntry } from "@/lib/catalogue/search";
import { useDeviceState } from "@/lib/client/device-state";
import { Dialog } from "./dialog";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Discover", icon: "home" },
  { href: "/movies", label: "Films", icon: "films" },
  { href: "/people", label: "People", icon: "people" },
  { href: "/collections", label: "Collections", icon: "collection" },
];

const MENU = [
  ...NAV,
  { href: "/search", label: "Search", icon: "search" as const },
  { href: "/watchlist", label: "My List", icon: "bookmark" as const },
  { href: "/account", label: "Account", icon: "user" as const },
];

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Chrome({ entries }: { entries: SearchEntry[] }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const menu = useRef<HTMLDialogElement>(null);
  const palette = useRef<HTMLDialogElement>(null);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const { saved } = useDeviceState();
  const uid = useId();
  const listId = `${uid}-results`;
  const hits = query.trim()
    ? searchEntries(entries, query, 8).map((hit) => hit.entry)
    : entries
        .filter((entry) => entry.kind === "title")
        .filter((_, i) => [0, 6, 8, 14, 18].includes(i))
        .slice(0, 5);
  const activeEntry = hits[active];

  function closeMenu() {
    menu.current?.close();
  }
  function closePalette() {
    palette.current?.close();
  }
  function openPalette() {
    closeMenu();
    setQuery("");
    setActive(0);
    palette.current?.showModal();
    input.current?.focus();
  }
  function select(entry: SearchEntry) {
    closePalette();
    router.push(entry.href);
  }

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k" &&
        !event.altKey &&
        !event.repeat
      ) {
        event.preventDefault();
        if (palette.current?.open) {
          palette.current.close();
        } else {
          menu.current?.close();
          palette.current?.showModal();
          input.current?.focus();
        }
      }
    }
    window.addEventListener("keydown", shortcut);
    const trigger = searchTrigger.current;
    // Advertise the shortcut only after its listener is available following hydration.
    trigger?.setAttribute("aria-keyshortcuts", "Control+K Meta+K");
    return () => {
      window.removeEventListener("keydown", shortcut);
      trigger?.removeAttribute("aria-keyshortcuts");
    };
  }, []);

  useEffect(() => {
    list.current
      ?.querySelector(`[data-result-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <>
      {!pathname.startsWith("/admin") ? (
        <nav aria-label="Primary" className="floating-dock">
          <Link href="/" className="dock-brand" aria-label="Cinematic Graphite home">
            <BrandMark />
            <span>
              CG<span className="dock-brand-period">.</span>
            </span>
          </Link>
          <div className="dock-primary">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`dock-link dock-${item.icon}`}
                aria-current={isActive(item.href, pathname) ? "page" : undefined}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
          <span className="dock-separator" aria-hidden="true" />
          <button
            ref={searchTrigger}
            type="button"
            className="dock-link"
            onClick={openPalette}
            title="Search · Ctrl/⌘ K"
            aria-haspopup="dialog"
            aria-controls={`${uid}-search-dialog`}
          >
            <Icon name="search" />
            <span>Search</span>
          </button>
          <Link
            href="/watchlist"
            className="dock-link dock-saved"
            aria-current={isActive("/watchlist", pathname) ? "page" : undefined}
          >
            <span className="dock-icon-wrap">
              <Icon name="bookmark" />
              {saved.length > 0 ? <span className="dock-count">{saved.length}</span> : null}
            </span>
            <span>My List</span>
          </Link>
          <Link
            href="/account"
            className="dock-link dock-account"
            aria-current={isActive("/account", pathname) ? "page" : undefined}
          >
            <Icon name="user" />
            <span>Account</span>
          </Link>
          <button
            type="button"
            className="dock-link dock-menu"
            onClick={() => menu.current?.showModal()}
            aria-label="Open navigation menu"
          >
            <Icon name="menu" />
            <span>Menu</span>
          </button>
        </nav>
      ) : null}

      <Dialog
        ref={menu}
        aria-labelledby={`${uid}-menu-label`}
        className="menu-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) closeMenu();
        }}
      >
        <div className="menu-top">
          <Link href="/" onClick={closeMenu} className="wordmark">
            <BrandMark />
            <span>Cinematic Graphite</span>
          </Link>
          <button
            type="button"
            className="icon-button"
            onClick={closeMenu}
            aria-label="Close navigation menu"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="menu-body">
          <div className="menu-main">
            <p id={`${uid}-menu-label`} className="eyebrow">
              Find your next frame
            </p>
            <nav aria-label="All pages">
              <ol>
                {MENU.map((item, i) => (
                  <li key={item.href}>
                    <Link href={item.href} onClick={closeMenu}>
                      <span className="menu-number">{String(i + 1).padStart(2, "0")}</span>
                      <span>{item.label}</span>
                      <Icon name="arrow-up-right" />
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
          <aside className="menu-aside">
            <span className="menu-monogram" aria-hidden="true">
              CG.
            </span>
            <p>
              A space for cinema.
              <br />A respect for its makers.
            </p>
            <div className="menu-secondary">
              <Link href="/admin" onClick={closeMenu}>
                Operations <Icon name="arrow-up-right" />
              </Link>
              <Link href="/legal/copyright" onClick={closeMenu}>
                Rights &amp; licensing
              </Link>
              <Link href="/legal/privacy" onClick={closeMenu}>
                Privacy
              </Link>
              <Link href="/report-content" onClick={closeMenu}>
                Report a concern
              </Link>
            </div>
            <span className="eyebrow">Independent by design.</span>
          </aside>
        </div>
      </Dialog>

      <Dialog
        ref={palette}
        id={`${uid}-search-dialog`}
        aria-labelledby={`${uid}-search-label`}
        className="command-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) closePalette();
        }}
      >
        <div className="command-head">
          <Icon name="search" />
          <label id={`${uid}-search-label`} htmlFor={`${uid}-search-input`} className="sr-only">
            Search the film archive
          </label>
          <input
            ref={input}
            id={`${uid}-search-input`}
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded="true"
            aria-activedescendant={activeEntry ? `${uid}-option-${active}` : undefined}
            value={query}
            maxLength={120}
            autoComplete="off"
            placeholder="A film, a filmmaker, a feeling…"
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((value) => Math.max(0, Math.min(value + 1, hits.length - 1)));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((value) => Math.max(value - 1, 0));
              }
              if (event.key === "Enter") {
                event.preventDefault();
                if (activeEntry) select(activeEntry);
              }
            }}
          />
          <button
            type="button"
            className="command-escape"
            onClick={closePalette}
            aria-label="Close search"
          >
            Esc
          </button>
        </div>
        <div className="command-results" ref={list}>
          <p className="eyebrow">
            {query.trim()
              ? `${hits.length} ${hits.length === 1 ? "result" : "results"}`
              : "A few places to begin"}
          </p>
          <div id={listId} role="listbox" aria-label="Search results">
            {hits.map((entry, i) => (
              <button
                key={`${entry.kind}-${entry.slug}`}
                id={`${uid}-option-${i}`}
                type="button"
                role="option"
                aria-selected={active === i}
                className="command-result"
                data-result-index={i}
                onPointerMove={() => setActive(i)}
                onClick={() => select(entry)}
              >
                <span className="command-result-icon">
                  <Icon
                    name={
                      entry.kind === "title"
                        ? "films"
                        : entry.kind === "person"
                          ? "people"
                          : "collection"
                    }
                  />
                </span>
                <span>
                  <strong>{entry.label}</strong>
                  <small>{entry.sublabel}</small>
                </span>
                <Icon name="arrow-up-right" />
              </button>
            ))}
          </div>
          {hits.length === 0 ? (
            <div className="command-empty">
              <Icon name="search" />
              <p>
                {entries.length === 0
                  ? "The catalogue is awaiting rights-approved records."
                  : `No results for “${query}”.`}
              </p>
              <small>Try an English or Bangla title, a year, or a filmmaker.</small>
            </div>
          ) : null}
        </div>
        <div className="command-footer">
          <span>
            ↑ ↓ to explore <span className="command-return">↵ to open</span>
          </span>
          <Link
            href={`/search${query ? `?q=${encodeURIComponent(query)}` : ""}`}
            onClick={closePalette}
          >
            Full search <Icon name="arrow" />
          </Link>
        </div>
        {entries.length > 0 ? (
          <p className="command-fixture">Development catalogue · no playback access</p>
        ) : null}
      </Dialog>
    </>
  );
}

export function DockFallback() {
  return (
    <nav className="floating-dock dock-fallback" aria-label="Primary">
      <Link href="/" className="dock-brand">
        <BrandMark />
        <span>CG.</span>
      </Link>
      <Link href="/movies" className="dock-link">
        <Icon name="films" />
        <span>Films</span>
      </Link>
      <Link href="/search" className="dock-link">
        <Icon name="search" />
        <span>Search</span>
      </Link>
      <Link href="/watchlist" className="dock-link">
        <Icon name="bookmark" />
        <span>My List</span>
      </Link>
      <Link href="/account" className="dock-link">
        <Icon name="user" />
        <span>Account</span>
      </Link>
    </nav>
  );
}
