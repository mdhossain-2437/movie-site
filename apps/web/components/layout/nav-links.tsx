"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
}

export function DesktopNavLinks({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname() ?? "";
  return (
    <ul className="hidden items-center gap-1 lg:flex">
      {items.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex min-h-10 items-center rounded-sm px-3.5 py-2 text-sm font-medium transition-colors duration-[var(--cg-motion-fast)] ${
                isActive
                  ? "bg-surface-2 text-accent"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function MobileNavLinks({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname() ?? "";
  return (
    <ul className="grid grid-cols-4 gap-1 px-2 py-1.5">
      {items.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-11 flex-col items-center justify-center rounded-sm px-2 py-1.5 text-xs font-medium transition-colors duration-[var(--cg-motion-fast)] ${
                isActive
                  ? "bg-surface-2 text-accent"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
