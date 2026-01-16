import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0",
        "before:-translate-x-full",
        "before:animate-shimmer",
        "before:bg-gradient-to-r",
        "before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

// Specialized skeleton components for common use cases
function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 space-y-4", className)} {...props}>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  )
}

function SkeletonTable({ rows = 5, columns = 4, ...props }: { rows?: number; columns?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="space-y-3" {...props}>
      {/* Table header */}
      <div className="flex gap-4 pb-2 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 items-center">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function SkeletonChart({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)} {...props}>
      <Skeleton className="h-6 w-1/4 mb-4" />
      <Skeleton className="h-[300px] w-full" />
      <div className="flex gap-4 mt-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

function SkeletonList({ items = 5, ...props }: { items?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="space-y-3" {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={`list-item-${i}`} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonTable, SkeletonChart, SkeletonList }
