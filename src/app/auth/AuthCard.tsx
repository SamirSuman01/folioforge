'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

// Utility flows skip the preview — user arrived with intent already formed
const SKIP_PREVIEW = ['/auth/login', '/auth/reset-password', '/auth/update-password', '/auth/callback']

export default function AuthCard({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname()
  const skipPreview = SKIP_PREVIEW.some(p => pathname.startsWith(p))
  const [showForm, setShowForm] = useState(skipPreview)

  if (!showForm) {
    return <PreviewCard onContinue={() => setShowForm(true)} />
  }

  return (
    <div className="animate-slide-up">
      {children}
    </div>
  )
}

function PreviewCard({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col gap-8 animate-slide-up">

      {/* Brand */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] font-semibold tracking-widest uppercase text-accent">FF</span>
        <span className="font-mono text-[11px]" style={{ color: '#94A3B8' }}>·</span>
        <span className="font-mono text-[11px] tracking-wide text-text-secondary">ForgeFolio</span>
      </div>

      {/* Score display */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <span
            className="leading-none font-black tracking-tight"
            style={{ fontFamily: 'var(--font-bricolage)', fontSize: 96, color: '#B45309' }}
          >
            81
          </span>
          <span className="font-mono text-lg text-text-disabled leading-none">/100</span>
          <span
            className="font-mono text-[11px] font-semibold px-2 py-1 rounded ml-1"
            style={{ background: '#1B4FD8', color: '#fff' }}
          >
            B+
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <h1
            className="font-bold tracking-tight text-text-primary"
            style={{ fontFamily: 'var(--font-bricolage)', fontSize: 22 }}
          >
            Most engineers get filtered before a recruiter reads their name.
          </h1>
          <p className="text-small text-text-secondary">
            Upload your resume. Get scored in under 2 minutes.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-6 pt-4 border-t border-border">
        {[
          { value: '18k+',  label: 'Engineers scored' },
          { value: '+31pt', label: 'Avg score lift'   },
          { value: '2min',  label: 'Avg completion'    },
        ].map(({ value, label }) => (
          <div key={label}>
            <div
              className="font-bold leading-none text-text-primary"
              style={{ fontFamily: 'var(--font-bricolage)', fontSize: 22 }}
            >
              {value}
            </div>
            <div className="font-mono text-[9px] tracking-widest uppercase mt-1 text-text-disabled">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onContinue}
          className="w-full h-11 rounded-md font-semibold text-small text-white transition-all
            hover:opacity-90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: '#1B4FD8' }}
        >
          Get your free score →
        </button>
        <p className="text-center text-micro font-mono text-text-disabled">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="text-accent hover:text-accent/80 transition-colors"
            onClick={onContinue}
          >
            Sign in →
          </Link>
        </p>
      </div>

    </div>
  )
}
