import * as React from 'react'
import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────
   BUTTON — Three variants, three sizes.

   VARIANTS:
   primary   — filled accent, for the ONE most important action per screen
   secondary — outlined, for secondary actions
   ghost     — no border/background, for tertiary inline actions

   RULE: Never show two primary buttons simultaneously.
   If two are visible, neither is primary.
   ───────────────────────────────────────────────────────── */

const buttonVariants = cva(
  // Base: shared across all variants
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium whitespace-nowrap select-none',
    'border transition-colors',
    'disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        // Primary: filled, accent color
        // Use for the single most important action on a screen
        primary: [
          'bg-accent text-text-inverse border-accent',
          'hover:bg-accent-hover hover:border-accent-hover',
          'active:bg-accent-active active:border-accent-active',
        ],

        // Secondary: outlined, transparent background
        // Use for secondary actions alongside a primary
        secondary: [
          'bg-surface text-text-primary border-border-strong',
          'hover:bg-background hover:border-border-strong',
          'active:bg-border-subtle',
        ],

        // Ghost: no border, no background
        // Use for tertiary actions, inline with content
        ghost: [
          'bg-transparent text-text-secondary border-transparent',
          'hover:bg-border-subtle hover:text-text-primary',
          'active:bg-border',
        ],

        // Destructive: for delete/remove actions only
        destructive: [
          'bg-error-subtle text-error border-error-border',
          'hover:bg-error hover:text-text-inverse hover:border-error',
          'active:bg-error-hover',
        ],
      },

      size: {
        sm: 'h-8 px-3 text-small rounded',           // 32px — compact contexts
        md: 'h-10 px-4 text-body rounded',            // 40px — standard (default)
        lg: 'h-11 px-5 text-body rounded',            // 44px — primary CTAs
        icon: 'h-10 w-10 rounded',                    // 40px — icon-only
        'icon-sm': 'h-8 w-8 rounded',                 // 32px — icon-only compact
      },
    },

    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // When true, renders as a loading state (spinner + disabled)
  loading?: boolean
  // When true, renders children as a Slot (for use with Next.js Link etc.)
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, asChild, children, ...props }, ref) => {
    // asChild path: merges button styles onto the child element (e.g. <Link>)
    // Must pass a single element child — no spinner wrapper.
    if (asChild) {
      return (
        <Slot.Root
          ref={ref}
          className={cn(buttonVariants({ variant, size }), className)}
          {...props}
        >
          {children}
        </Slot.Root>
      )
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
