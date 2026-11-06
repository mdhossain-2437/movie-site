import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: {
    default: "Operations Console",
    template: "%s · Operations Console · Cinematic Graphite",
  },
  robots: { index: false, follow: false },
};

const ADMIN_SECTIONS = [
  { label: "Overview", href: "/admin" },
  { label: "Public Site", href: "/" },
  { label: "Takedown Policy", href: "/legal/takedown" },
] as const;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-canvas text-text flex min-h-dvh flex-col">
      <header className="border-border bg-canvas-raised border-b">
        <div className="cg-container flex min-h-14 flex-wrap items-center justify-between gap-3 py-2">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="font-display text-text inline-flex min-h-10 items-center gap-2 rounded-sm px-1 text-base font-bold tracking-tight"
            >
              <BrandMark />
              <span>Operations Console</span>
            </Link>
            <Badge tone="warning">MFA Required for Mutations</Badge>
          </div>

          <nav aria-label="Operations navigation">
            <ul className="flex flex-wrap items-center gap-1">
              {ADMIN_SECTIONS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-text-secondary hover:bg-surface-2 hover:text-text inline-flex min-h-9 items-center rounded-sm px-3 py-1.5 text-xs font-medium"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" className="cg-container flex-1 py-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}
