import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Build your portfolio',
  description: 'See what your career looks like as a portfolio — in under 2 minutes.',
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal header — no distractions */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-border shrink-0">
        <Link
          href="/"
          className="text-h4 font-bold text-text-primary hover:text-accent transition-colors"
        >
          ForgeFolio
        </Link>
        <Link
          href="/auth/login"
          className="text-small text-text-secondary hover:text-text-primary transition-colors"
        >
          Already have an account? Sign in
        </Link>
      </header>

      {/* Content */}
      <main id="main-content" className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
