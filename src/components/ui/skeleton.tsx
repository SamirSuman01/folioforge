import * as React from 'react'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────
   SKELETON — Loading placeholder shapes.

   Use skeleton screens instead of spinners for content
   that takes > 300ms to load. Skeleton screens reduce
   perceived wait time by showing layout structure.

   Usage:
   <Skeleton className="h-4 w-48" />           — text line
   <Skeleton variant="avatar" />                — avatar circle
   <Skeleton variant="button" />                — button shape
   <SkeletonCard />                             — full card
   ───────────────────────────────────────────────────────── */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'avatar' | 'button' | 'text'
}

function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'skeleton-bg rounded',
        variant === 'avatar' && 'rounded-full h-10 w-10',
        variant === 'button' && 'rounded h-10 w-24',
        variant === 'text'   && 'rounded h-4',
        className
      )}
      {...props}
    />
  )
}

/* ─── Pre-built skeleton compositions ──────────────────── */

// Skeleton for a card with title + description
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-md border border-border bg-surface p-5 space-y-4', className)}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

// Skeleton for a portfolio list item
function SkeletonPortfolioItem({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 p-4 rounded-md border border-border bg-surface', className)}>
      <Skeleton variant="avatar" className="h-12 w-12 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton variant="button" className="h-8 w-16" />
    </div>
  )
}

// Skeleton for a stats number
function SkeletonStat({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-1', className)}>
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonPortfolioItem, SkeletonStat }
