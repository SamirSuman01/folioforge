'use client'

import * as React from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────
   DIALOG — Modal overlay. Built on Radix UI Dialog primitive.

   Design decisions:
   - Overlay: 40% black, no blur (blur causes performance issues
     on low-end devices, and we don't need cinematic effects)
   - Content: white surface, 12px radius, md shadow
   - Max width: 480px (form width) on desktop, full-width minus
     32px margin on mobile
   - Animation: fade-in only (200ms) — no zoom/scale
     (scale animations cause layout shifts)
   - Close button: top-right, always present by default

   Usage:
   <Dialog>
     <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
     <DialogContent>
       <DialogHeader>
         <DialogTitle>Title</DialogTitle>
         <DialogDescription>Description</DialogDescription>
       </DialogHeader>
       ...content...
       <DialogFooter>
         <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
         <Button>Confirm</Button>
       </DialogFooter>
     </DialogContent>
   </Dialog>
   ───────────────────────────────────────────────────────── */

function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root {...props} />
}

function DialogTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger {...props} />
}

function DialogPortal(props: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal {...props} />
}

function DialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-40 bg-black/40',
        'data-[state=open]:animate-fade-in',
        'data-[state=closed]:opacity-0',
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          // Position
          'fixed left-1/2 top-1/2 z-50',
          '-translate-x-1/2 -translate-y-1/2',
          // Size
          'w-[calc(100%-2rem)] max-w-form',
          // Appearance
          'rounded-lg bg-surface border border-border shadow-lg',
          // Animation
          'data-[state=open]:animate-slide-up',
          'data-[state=closed]:opacity-0',
          'outline-none',
          className
        )}
        {...props}
      >
        {/* Close button */}
        {showCloseButton && (
          <DialogPrimitive.Close
            className={cn(
              'absolute right-4 top-4',
              'flex h-7 w-7 items-center justify-center rounded',
              'text-text-secondary hover:text-text-primary',
              'hover:bg-border-subtle',
              'transition-colors duration-fast',
              'focus-visible:outline-2 focus-visible:outline-accent',
            )}
            aria-label="Close dialog"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </DialogPrimitive.Close>
        )}

        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-1 px-5 pt-5 pb-4', className)}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-h4 text-text-primary pr-6', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-small text-text-secondary leading-relaxed', className)}
      {...props}
    />
  )
}

function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-5 pb-5', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2',
        'px-5 py-4 border-t border-border bg-background',
        'rounded-b-lg',
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
}
