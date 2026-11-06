import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const TONE_CLASSES: Record<BadgeTone, { wrapper: string; glyph: string; symbol: string }> = {
  neutral: {
    wrapper: "border-border bg-surface-2 text-text-secondary",
    glyph: "text-text-muted",
    symbol: "●",
  },
  accent: {
    wrapper: "border-accent bg-surface-2 text-accent",
    glyph: "text-accent",
    symbol: "◆",
  },
  success: {
    wrapper: "border-border bg-surface-2 text-text",
    glyph: "text-success",
    symbol: "✓",
  },
  warning: {
    wrapper: "border-border bg-surface-2 text-text",
    glyph: "text-warning",
    symbol: "▲",
  },
  danger: {
    wrapper: "border-danger bg-surface-2 text-text",
    glyph: "text-danger",
    symbol: "✕",
  },
  info: {
    wrapper: "border-border bg-surface-2 text-text",
    glyph: "text-info",
    symbol: "ℹ",
  },
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

/**
 * Semantic badge that pairs glyph + text (Design System §3.2 & §12: never convey state by color alone).
 */
export function Badge({ tone = "neutral", children, className = "" }: BadgeProps) {
  const spec = TONE_CLASSES[tone];
  return (
    <span
      className={`rounded-pill inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-medium ${spec.wrapper} ${className}`.trim()}
    >
      <span aria-hidden="true" className={spec.glyph}>
        {spec.symbol}
      </span>
      <span>{children}</span>
    </span>
  );
}

export type AvailabilityKind =
  "stream_allowed" | "download_allowed" | "catalogue_only" | "region_restricted" | "rights_pending";

const AVAILABILITY_SPEC: Record<AvailabilityKind, { tone: BadgeTone; label: string }> = {
  stream_allowed: { tone: "success", label: "Available to stream" },
  download_allowed: { tone: "success", label: "Available to download" },
  catalogue_only: { tone: "neutral", label: "Catalogue entry only" },
  region_restricted: { tone: "warning", label: "Not available in your region" },
  rights_pending: { tone: "warning", label: "Rights verification pending" },
};

export function AvailabilityBadge({ kind }: { kind: AvailabilityKind }) {
  const spec = AVAILABILITY_SPEC[kind];
  return <Badge tone={spec.tone}>{spec.label}</Badge>;
}
