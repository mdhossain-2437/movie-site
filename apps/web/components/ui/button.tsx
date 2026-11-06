import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-text text-canvas hover:bg-accent-hover active:bg-accent-pressed font-semibold border border-transparent",
  secondary:
    "bg-surface-2 text-text hover:bg-surface-3 active:bg-surface-1 font-medium border border-border",
  outline:
    "bg-transparent text-text hover:bg-surface-2 active:bg-surface-3 font-medium border border-border-strong",
  ghost:
    "bg-transparent text-text-secondary hover:bg-surface-2 hover:text-text active:bg-surface-3 font-medium border border-transparent",
  destructive:
    "bg-surface-2 text-danger hover:bg-surface-3 active:bg-surface-1 font-semibold border border-danger",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3.5 py-1.5 text-sm rounded-sm",
  md: "min-h-11 px-5 py-2.5 text-sm rounded-sm",
  lg: "min-h-12 px-6 py-3 text-base rounded-md",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 transition-colors duration-[var(--cg-motion-fast)] ease-standard select-none disabled:cursor-not-allowed disabled:opacity-50";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  type = "button",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`.trim()}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="rounded-pill inline-block h-4 w-4 animate-spin border-2 border-current border-t-transparent"
        />
      ) : null}
      <span>{children}</span>
    </button>
  );
}

export interface ButtonLinkProps extends Omit<ComponentProps<typeof Link>, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Link>
  );
}
