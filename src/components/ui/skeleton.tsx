export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-ink-100 dark:bg-ink-800/80 rounded-2xl ${className}`}
    />
  );
}

export function MosaicSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-3xl" />
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className={`h-32 ${i === 3 ? 'sm:col-span-2' : ''}`} />
      ))}
      <Skeleton className="col-span-full h-24" />
    </div>
  );
}
