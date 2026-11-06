import type { HTMLAttributes } from "react";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

const SIZE_MAP: Record<SpinnerSize, string> = {
  sm: "h-3.5 w-3.5 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-7 w-7 border-[2.5px]",
};

/**
 * Accessible SVG-like CSS border spinner primitive.
 * Strictly uses currentColor so it adapts to parent button or text contrast.
 */
export function Spinner({
  size = "md",
  className = "",
  label = "Loading…",
  ...rest
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`rounded-pill inline-block shrink-0 animate-spin border-current border-t-transparent ${SIZE_MAP[size]} ${className}`.trim()}
      {...rest}
    >
      <span className="sr-only">{label}</span>
    </span>
  );
}
