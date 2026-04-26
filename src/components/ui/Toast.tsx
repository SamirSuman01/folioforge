'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────
   TOAST — Notification system. No Framer Motion.
   CSS animations only: toast-enter / toast-leave
   (defined in tailwind.config.ts keyframes)

   Usage:
   const { toast } = useToast()
   toast('Portfolio saved', 'success')
   toast('Something went wrong', 'error')
   toast('3 views this week', 'info')

   Provider wraps the app in layout.tsx:
   <ToastProvider>{children}</ToastProvider>
   ───────────────────────────────────────────────────────── */

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id:      number
  message: string
  type:    ToastType
  leaving: boolean
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue>({
  toast:   () => {},
  dismiss: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0
const DURATION   = 4000  // Auto-dismiss after 4s
const LEAVE_MS   = 150   // Must match tailwind toast-leave duration

// Icons — inline SVG, no icon library dependency
const icons: Record<ToastType, JSX.Element> = {
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2L14 13H2L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 7v2.5M8 11.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 8v3M8 5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
}

// Style maps using our design token colors
const styles: Record<ToastType, { wrapper: string; icon: string; text: string }> = {
  success: {
    wrapper: 'bg-surface border-success-border',
    icon:    'text-success',
    text:    'text-text-primary',
  },
  error: {
    wrapper: 'bg-surface border-error-border',
    icon:    'text-error',
    text:    'text-text-primary',
  },
  warning: {
    wrapper: 'bg-surface border-warning-border',
    icon:    'text-warning',
    text:    'text-text-primary',
  },
  info: {
    wrapper: 'bg-surface border-border',
    icon:    'text-accent',
    text:    'text-text-primary',
  },
}

function ToastItem({
  item,
  onDismiss,
}: {
  item: ToastItem
  onDismiss: (id: number) => void
}) {
  const s = styles[item.type]

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      onClick={() => onDismiss(item.id)}
      className={cn(
        'flex items-start gap-3 w-full max-w-sm',
        'px-4 py-3 rounded-md border shadow-md cursor-pointer',
        'select-none',
        item.leaving ? 'animate-toast-leave' : 'animate-toast-enter',
        s.wrapper,
      )}
    >
      {/* Icon */}
      <span className={cn('mt-0.5 shrink-0', s.icon)}>
        {icons[item.type]}
      </span>

      {/* Message */}
      <span className={cn('flex-1 text-small font-medium leading-snug', s.text)}>
        {item.message}
      </span>

      {/* Dismiss */}
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(item.id) }}
        className="shrink-0 mt-0.5 text-text-disabled hover:text-text-secondary transition-colors duration-fast"
        aria-label="Dismiss notification"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    // Mark as leaving first (triggers CSS exit animation)
    setToasts(prev =>
      prev.map(t => t.id === id ? { ...t, leaving: true } : t)
    )
    // Remove after animation completes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, LEAVE_MS)
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++
    setToasts(prev => [...prev, { id, message, type, leaving: false }])
    const timer = setTimeout(() => dismiss(id), DURATION)
    // Cleanup handled by dismiss itself
    return () => clearTimeout(timer)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}

      {/* Toast portal — fixed bottom-right */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-5 right-5 z-overlay flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem item={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
