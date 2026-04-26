import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────
   BADGE — Small label for status, categories, counts.

   border-radius: sm (4px) — badges represent precise,
   official things (credentials, status, counts). The tighter
   radius signals precision, not friendliness.

   Variants:
   default     — accent tinted (for primary categories)
   secondary   — neutral (for secondary labels)
   success     — for positive states
   warning     — for cautionary states
   error       — for negative states
   outline     — transparent with border (subtle)
   ───────────────────────────────────────────────────────── */

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1',
    'rounded-sm px-2 py-0.5',
    'text-micro font-medium whitespace-nowrap',
    'border',
    '[&_svg]:size-3 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-accent-subtle text-accent border-accent/20',
        ],
        secondary: [
          'bg-border-subtle text-text-secondary border-border',
        ],
        success: [
          'bg-success-subtle text-success border-success-border',
        ],
        warning: [
          'bg-warning-subtle text-warning border-warning-border',
        ],
        error: [
          'bg-error-subtle text-error border-error-border',
        ],
        outline: [
          'bg-transparent text-text-secondary border-border-strong',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
)

Badge.displayName = 'Badge'

export { Badge, badgeVariants }
