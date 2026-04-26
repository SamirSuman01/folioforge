'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { track } from '@/lib/funnel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ResetPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    track('reset_password_page_view', {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    track('reset_password_submit', {})

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    if (error) {
      const msg = error.message
      const errMsg =
        msg.includes('rate limit')    ? "You're moving fast. Wait a moment, then try again." :
        msg.includes('Invalid email') ? "Check the email — something looks off." :
        "Something slipped — try again."

      track('reset_password_error', { message: msg })
      setError(errMsg)
      setLoading(false)
      return
    }

    track('reset_password_sent', {})
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-6 animate-slide-up" data-testid="reset-sent-screen">
        <div className="border-l-2 border-success pl-3 py-1">
          <span className="text-micro font-mono text-success uppercase tracking-widest">Link sent</span>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-h3 font-bold text-text-primary tracking-tight">Check your inbox</h1>
          <p className="text-small text-text-secondary">
            We sent a reset link to{' '}
            <span className="font-medium text-text-primary">{email}</span>.
            Click it to set a new password.
          </p>
        </div>

        <p className="text-micro font-mono text-text-disabled">
          Most emails arrive in under 30 seconds. Check spam if you don&apos;t see it.
        </p>

        <p className="text-small text-text-disabled">
          Wrong email?{' '}
          <button
            type="button"
            onClick={() => { setSent(false); setError(null) }}
            className="text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded"
            data-testid="reset-try-again-btn"
          >
            Try again
          </button>
          {' '}or{' '}
          <Link
            href="/auth/login"
            className="text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded"
          >
            back to login
          </Link>.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-7 animate-slide-up" data-testid="reset-form">
      <div className="flex flex-col gap-2">
        <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Account recovery</span>
        <h1 className="text-h3 font-bold text-text-primary tracking-tight">Reset your password</h1>
        <p className="text-small text-text-secondary">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2 border-l-2 border-error pl-3 py-1 text-small text-error"
          data-testid="reset-error"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 shrink-0" aria-hidden="true">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 4.5v3M7 9.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          required
          autoFocus
          data-testid="reset-email-input"
        />

        <Button type="submit" size="lg" loading={loading} className="w-full" data-testid="reset-submit-btn">
          {loading ? 'Sending…' : 'Send me a reset link'}
        </Button>
      </form>

      <Link
        href="/auth/login"
        className="text-small text-center text-text-secondary hover:text-text-primary transition-colors"
        data-testid="reset-back-link"
      >
        ← Back to login
      </Link>
    </div>
  )
}
