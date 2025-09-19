import * as React from "react"

import { cn } from '@/src/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border p-6 shadow-sm", className)}>
      <div className="space-y-4">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  )
}

function SkeletonTable({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-8 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

function SkeletonForm({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-10 w-[120px]" />
    </div>
  )
}

function SkeletonAvatar({ className }: { className?: string }) {
  return (
    <Skeleton className={cn("h-10 w-10 rounded-full", className)} />
  )
}

function SkeletonText({
  lines = 3,
  className
}: {
  lines?: number;
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <Skeleton className="h-4 w-[200px]" />
      <div className="flex items-end space-x-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "w-8 rounded-t",
              `h-${Math.floor(Math.random() * 20) + 20}`
            )}
          />
        ))}
      </div>
    </div>
  )
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonForm,
  SkeletonAvatar,
  SkeletonText,
  SkeletonChart,
}