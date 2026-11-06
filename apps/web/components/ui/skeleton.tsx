export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-surface-2 animate-pulse rounded-md ${className}`.trim()}
    />
  );
}

export function PosterSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-2.5">
      <div className="cg-poster animate-pulse" />
      <div className="bg-surface-2 h-4 w-3/4 animate-pulse rounded-xs" />
      <div className="bg-surface-2 h-3.5 w-1/2 animate-pulse rounded-xs" />
    </div>
  );
}

export function ContentRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <section aria-busy="true" aria-label="Loading titles" className="space-y-4">
      <div className="bg-surface-2 h-6 w-48 animate-pulse rounded-xs" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: count }, (_, idx) => (
          <PosterSkeleton key={idx} />
        ))}
      </div>
    </section>
  );
}
