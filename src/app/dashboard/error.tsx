'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[dashboard error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <span className="text-micro font-mono text-error uppercase tracking-widest block mb-3">
          Something went wrong
        </span>
        <h1 className="text-h3 font-bold text-text-primary tracking-tight mb-2">
          This page failed to load
        </h1>
        <p className="text-small text-text-secondary mb-8">
          A data fetch failed. This is usually temporary — try again or go back to your dashboard.
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={reset}
            className="text-small font-medium text-text-primary border border-border px-4 py-2 hover:border-accent/40 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="text-small text-text-secondary hover:text-text-primary transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
        {error.digest && (
          <p className="mt-8 text-micro font-mono text-text-disabled">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
