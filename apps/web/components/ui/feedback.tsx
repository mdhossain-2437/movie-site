import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface EmptyStateProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function EmptyState({ eyebrow, title, description, actions }: EmptyStateProps) {
  return (
    <section className="cg-surface p-6 sm:p-10">
      {eyebrow ? (
        <p className="text-text-muted font-mono text-xs tracking-wide uppercase">{eyebrow}</p>
      ) : null}
      <h2 className="font-display text-text mt-2 text-2xl font-semibold">{title}</h2>
      <p className="cg-prose text-text-secondary mt-3 text-base leading-7">{description}</p>
      {actions ? <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div> : null}
    </section>
  );
}

export interface ErrorStateProps {
  title: string;
  description: string;
  correlationId?: string;
  actions?: ReactNode;
}

export function ErrorState({ title, description, correlationId, actions }: ErrorStateProps) {
  return (
    <section role="alert" className="border-danger bg-surface-1 rounded-lg border p-6 sm:p-8">
      <div className="text-danger flex items-center gap-2 text-sm font-medium">
        <span aria-hidden="true">✕</span>
        <span>Error</span>
      </div>
      <h2 className="font-display text-text mt-2 text-2xl font-semibold">{title}</h2>
      <p className="cg-prose text-text-secondary mt-3 text-base leading-7">{description}</p>
      {correlationId ? (
        <p className="text-text-muted mt-4 font-mono text-xs">
          Reference ID: <span>{correlationId}</span>
        </p>
      ) : null}
      {actions ? <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div> : null}
    </section>
  );
}

export interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  children: ReactNode;
}

export function FilterChip({
  selected = false,
  className = "",
  children,
  ...rest
}: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`rounded-pill inline-flex min-h-11 items-center gap-2 border px-4 py-1.5 text-sm font-medium transition-colors duration-[var(--cg-motion-fast)] motion-reduce:transition-none sm:min-h-10 ${
        selected
          ? "border-accent bg-surface-3 text-text"
          : "border-border bg-surface-1 text-text-secondary hover:bg-surface-2 hover:text-text"
      } ${className}`.trim()}
      {...rest}
    >
      {selected ? (
        <span aria-hidden="true" className="text-accent">
          ✓
        </span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}
