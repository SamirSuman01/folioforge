import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-micro font-mono text-text-disabled uppercase tracking-widest mb-3">404</p>
        <h1 className="text-h2 font-bold text-text-primary mb-2">Page not found</h1>
        <p className="text-body text-text-secondary mb-8">
          This page doesn't exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="text-small font-mono text-accent hover:text-accent/80 transition-colors"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  )
}
