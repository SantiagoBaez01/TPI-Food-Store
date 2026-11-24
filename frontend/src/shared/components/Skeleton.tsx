export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-stone-200 ${className}`} />
}

export function SkeletonTabla({ filas = 5 }: { filas?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: filas }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}
