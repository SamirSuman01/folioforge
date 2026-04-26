import * as React from 'react'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────
   CARD — Container component.

   Variants:
   default    — standard card with border and surface background
   elevated   — shadow instead of border (for floating contexts)
   interactive — hover state (for clickable cards)
   flat       — no border, no shadow (for nested cards)

   Usage:
   <Card>
     <CardHeader>
       <CardTitle>Title</CardTitle>
       <CardDescription>Description</CardDescription>
     </CardHeader>
     <CardContent>...</CardContent>
     <CardFooter>...</CardFooter>
   </Card>
   ───────────────────────────────────────────────────────── */

type CardVariant = 'default' | 'elevated' | 'interactive' | 'flat'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
}

const cardVariants: Record<CardVariant, string> = {
  default:     'border border-border bg-surface',
  elevated:    'border-0 bg-surface shadow-md',
  interactive: 'border border-border bg-surface cursor-pointer transition-shadow duration-fast hover:shadow',
  flat:        'border-0 bg-transparent',
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-md overflow-hidden',
        cardVariants[variant],
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'


const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1 p-5', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'


const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-h4 text-text-primary', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'


const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-small text-text-secondary leading-relaxed', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'


const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-5 pb-5', className)}
      {...props}
    />
  )
)
CardContent.displayName = 'CardContent'


const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center px-5 py-4',
        'border-t border-border bg-background',
        className
      )}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'


// Optional action slot in card header (right-aligned)
const CardAction = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('ml-auto flex items-center gap-2', className)}
      {...props}
    />
  )
)
CardAction.displayName = 'CardAction'

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
}
