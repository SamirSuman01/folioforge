import * as React from 'react'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────
   EMPTY STATE — The most neglected design surface.

   Every empty state has exactly three elements:
   1. CONTEXT:  What this section is for
   2. WHY:      The benefit, not the instruction
   3. ACTION:   One specific thing to do

   Wrong: "No portfolios yet. Click Add to get started."
   Right: "Your career story starts here. Add your most
           recent role — that's the first thing recruiters
           look for." [Add your first role →]

   Usage:
   <EmptyState
     title="No portfolios yet"
     description="Your career story starts here. Add your most
       recent role — that's the first thing recruiters look for."
     action={<Button>Add your first role</Button>}
   />
   ───────────────────────────────────────────────────────── */

interface EmptyStateProps {
  // Optional icon — should be a Lucide icon or similar, sized appropriately
  icon?: React.ReactNode
  // The "what" — what this section is for
  title: string
  // The "why" — benefit-focused, not instruction-focused
  description: string
  // The "do" — one specific action, usually a Button
  action?: React.ReactNode
  // Optional: secondary link or action below primary
  secondaryAction?: React.ReactNode
  className?: string
  // Size variant for different contexts
  size?: 'sm' | 'md' | 'lg'
}

function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        size === 'sm' && 'gap-3 py-8 px-4',
        size === 'md' && 'gap-4 py-12 px-6',
        size === 'lg' && 'gap-5 py-16 px-8',
        className
      )}
    >
      {/* Icon — muted, not decorative */}
      {icon && (
        <div
          className={cn(
            'flex items-center justify-center rounded-md bg-border-subtle text-text-disabled',
            size === 'sm' && 'h-10 w-10',
            size === 'md' && 'h-12 w-12',
            size === 'lg' && 'h-14 w-14',
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      {/* Content */}
      <div className={cn(
        'flex flex-col items-center',
        size === 'sm' && 'gap-1 max-w-xs',
        size === 'md' && 'gap-1.5 max-w-sm',
        size === 'lg' && 'gap-2 max-w-md',
      )}>
        <p className={cn(
          'font-semibold text-text-primary',
          size === 'sm' && 'text-small',
          size === 'md' && 'text-body',
          size === 'lg' && 'text-h4',
        )}>
          {title}
        </p>
        <p className={cn(
          'text-text-secondary leading-relaxed',
          size === 'sm' && 'text-micro',
          size === 'md' && 'text-small',
          size === 'lg' && 'text-body',
        )}>
          {description}
        </p>
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col items-center gap-2">
          {action}
          {secondaryAction && (
            <div className="text-small text-text-secondary">
              {secondaryAction}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export { EmptyState }
export type { EmptyStateProps }
