'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

/* ─────────────────────────────────────────────────────────
   PROVIDERS — Client-side provider tree.
   Kept separate from layout.tsx (which is a Server Component)
   so we can use 'use client' without making the whole layout
   client-side.

   Add providers here as the product grows:
   - QueryClientProvider (TanStack Query) ✓
   - Future: Analytics provider
   - Future: Feature flag provider
   ───────────────────────────────────────────────────────── */

export default function Providers({ children }: { children: ReactNode }) {
  // Create QueryClient inside component to ensure each request
  // in SSR gets a fresh instance (prevents data leaking between users)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 30 seconds
            // Prevents unnecessary refetches on tab focus
            staleTime: 30 * 1000,
            // Keep data in cache for 5 minutes after component unmounts
            gcTime: 5 * 60 * 1000,
            // Don't retry on 4xx errors — they're not transient
            retry: (failureCount, error: unknown) => {
              const status = (error as { status?: number })?.status
              if (status && status >= 400 && status < 500) return false
              return failureCount < 2
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
