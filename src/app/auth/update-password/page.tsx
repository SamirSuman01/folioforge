'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { track } from '@/lib/funnel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function UpdatePasswordPage() {
  const router    = useRouter()
  const supabase  = createClient()

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [sessionOk, setSessionOk] = useState(false)
  const [done,      setDone]      = useState(false)

  // Wait for Supabase to exchange the recovery code from the URL.
  // With PKCE flow the link arrives as ?code=...; the client exchanges it
  // async. PASSWORD_RECOVERY fires once that exchange succeeds.
  useEffect(() => {
    track('update_password_page_view', {})
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionOk(true)
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionOk(true)
    })
    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Redirect after showing success state
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => router.replace('/dashboard'), 1500)
    return () => clearTimeout(t)
  }, [done, router])

  const hasUpper  = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const strength  =
    password.length === 0                              ? 0 :
    password.length < 8                               ? 1 :
    password.length >= 12 && hasUpper && hasNumber    ? 3 :
    2

  const strengthLabel      = ['', 'Too short', 'Good', 'Strong'][strength]
  const strengthColors     = ['', 'bg-error', 'bg-warning', 'bg-success']
  const strengthTextColors = ['', 'text-error', 'text-[#B45309]', 'text-success']
  const strengthHint       =
    strength === 1 ? 'Use at least 8 characters' :
    strength === 2 ? 'Add uppercase + number for Strong' :
    null

  const confirmMatch = confirm.length > 0 && password === confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password needs to be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match — check both fields.")
      return
    }

    setLoading(true)
    track('update_password_submit', {})

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      const msg = error.message
      const errMsg =
        msg.includes('same password')  ? "That's the same as your current password. Try a new one." :
        msg.includes('weak')           ? 'Choose a stronger password.' :
        "Something went wrong — try again."

      track('update_password_error', { message: msg })
      setError(errMsg)
      setLoading(false)
      return
    }

    track('update_password_success', {})
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex flex-col gap-6 animate-slide-up" data-testid="update-done-screen">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7.5L5.5 10.5L11.5 4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-micro font-mono text-success uppercase tracking-widest">Password updated</span>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-h3 font-bold text-text-primary tracking-tight">You&apos;re back in</h1>
          <p className="text-small text-text-secondary">Taking you to your dashboard…</p>
        </div>
      </div>
    )
  }

  if (!sessionOk) {
    return (
      <div className="flex flex-col gap-4 animate-slide-up" data-testid="update-verifying-screen">
        <p className="text-micro font-mono text-text-disabled uppercase tracking-widest">Verifying link…</p>
        <p className="text-small text-text-secondary">Checking your reset link. This takes just a moment.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-7 animate-slide-up" data-testid="update-form">
      <div className="flex flex-col gap-2">
        <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">New password</span>
        <h1 className="text-h3 font-bold text-text-primary tracking-tight">Set a new password</h1>
        <p className="text-small text-text-secondary">Choose something you haven&apos;t used before.</p>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2 border-l-2 border-error pl-3 py-1 text-small text-error"
          data-testid="update-error"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 shrink-0" aria-hidden="true">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 4.5v3M7 9.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Input
            label="New password"
            type={showPw ? 'text' : 'password'}
            placeholder="Minimum 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            autoFocus
            data-testid="update-password-input"
            aria-describedby={password.length > 0 ? 'update-pw-strength' : undefined}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="text-text-disabled hover:text-text-primary transition-colors"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                data-testid="update-toggle-pw"
              >
                {showPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            }
          />

          {password.length > 0 && (
            <div
              id="update-pw-strength"
              className="flex flex-col gap-1"
              role="status"
              aria-label={`Password strength: ${strengthLabel}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-1 gap-0.5" aria-hidden="true">
                  {[1, 2, 3].map(level => (
                    <div
                      key={level}
                      className={cn(
                        'h-0.5 flex-1 transition-colors duration-fast',
                        level <= strength ? strengthColors[strength] : 'bg-border'
                      )}
                    />
                  ))}
                </div>
                <span className={cn('text-micro font-mono', strengthTextColors[strength])}>
                  {strengthLabel}
                </span>
              </div>
              {strengthHint && (
                <p className="text-micro text-text-disabled">{strengthHint}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            label="Confirm password"
            type={showPw ? 'text' : 'password'}
            placeholder="Repeat password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            data-testid="update-confirm-input"
          />
          {confirm.length > 0 && (
            <p className={cn('text-micro font-mono', confirmMatch ? 'text-success' : 'text-error')}>
              {confirmMatch ? 'Passwords match' : "Doesn't match yet"}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          loading={loading}
          className="w-full"
          data-testid="update-submit-btn"
        >
          {loading ? 'Updating…' : 'Set new password'}
        </Button>
      </form>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
