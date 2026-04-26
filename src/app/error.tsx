'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-micro font-mono text-error uppercase tracking-widest mb-3">Error</p>
        <h1 className="text-h2 font-bold text-text-primary mb-2">Something went wrong</h1>
        <p className="text-body text-text-secondary mb-8">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          className="text-small font-mono text-accent hover:text-accent/80 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
