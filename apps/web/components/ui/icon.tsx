import type { SVGProps } from "react";

export type IconName =
  | "arrow"
  | "arrow-up-right"
  | "arrow-left"
  | "chevron"
  | "search"
  | "menu"
  | "close"
  | "home"
  | "films"
  | "people"
  | "collection"
  | "bookmark"
  | "user"
  | "plus"
  | "check"
  | "lock"
  | "shield"
  | "share"
  | "download"
  | "play"
  | "grid"
  | "list"
  | "globe"
  | "settings"
  | "info"
  | "volume"
  | "external";

const PATHS: Record<IconName, React.ReactNode> = {
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  "arrow-up-right": <path d="M6 18 18 6M6 6h12v12" />,
  "arrow-left": <path d="M20 12H5m6-6-6 6 6 6" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  menu: (
    <>
      <path d="M4 8h16M4 16h16" />
      <circle cx="8" cy="8" r="1" />
      <circle cx="16" cy="16" r="1" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  home: (
    <>
      <path d="m3 10 9-7 9 7M5 9v12h14V9" />
      <path d="M9 21v-7h6v7" />
    </>
  ),
  films: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M3 9h4m-4 6h4m10-6h4m-4 6h4" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-2a6 6 0 0 1 12 0v2M16 4a3 3 0 0 1 0 6m2 4a6 6 0 0 1 3 5v2" />
    </>
  ),
  collection: (
    <>
      <path d="M7 3h10M5 7h14" />
      <rect x="3" y="11" width="18" height="10" rx="1.5" />
    </>
  ),
  bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12 4 4L19 6" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
    </>
  ),
  shield: (
    <>
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  share: (
    <>
      <path d="M12 15V3m-4 4 4-4 4 4M5 12v8h14v-8" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4" />
    </>
  ),
  play: <path d="m8 4 12 8-12 8V4Z" />,
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" />
      <rect x="14" y="4" width="6" height="6" />
      <rect x="4" y="14" width="6" height="6" />
      <rect x="14" y="14" width="6" height="6" />
    </>
  ),
  list: (
    <>
      <path d="M9 5h12M9 12h12M9 19h12" />
      <path d="M3 5h1m-1 7h1m-1 7h1" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h16M4 17h16" />
      <circle cx="9" cy="7" r="3" />
      <circle cx="16" cy="17" r="3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v7m0-11v1" />
    </>
  ),
  volume: (
    <>
      <path d="M4 9h4l5-5v16l-5-5H4V9ZM17 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
    </>
  ),
  external: (
    <>
      <path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7" />
    </>
  ),
};

export function Icon({
  name,
  className = "",
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`cg-icon ${className}`}
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
