"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePosterTransition } from "./providers";

export function PosterLink({
  href,
  color,
  title,
  children,
  className = "",
  label,
}: {
  href: string;
  color: string;
  title: string;
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  const begin = usePosterTransition();
  return (
    <Link
      href={href}
      prefetch={true}
      className={className}
      aria-label={label}
      onClick={(event) => {
        if (
          !begin ||
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        const art = event.currentTarget.querySelector("[data-poster-art]") ?? event.currentTarget;
        if (begin(href, color, title, art.getBoundingClientRect())) event.preventDefault();
      }}
    >
      {children}
    </Link>
  );
}
