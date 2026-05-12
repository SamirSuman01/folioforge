'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { track } from '@/lib/funnel'

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SignupForm />
    </Suspense>
  )
}

function SignupForm() {
  const router         = useRouter()
  const searchParams   = useSearchParams()
  const redirectTo     = searchParams.get('redirect') ?? '/dashboard'
  const fromOnboarding = searchParams.get('from') === 'onboarding'
  const pageLoadRef    = useRef(Date.now())
  const supabase       = createClient()

  const [fullName, setFullName] = useState(() => {
    if (!fromOnboarding) return ''
    try {
      const raw = localStorage.getItem('ff_onboarding')
      return raw ? (JSON.parse(raw).name ?? '') : ''
    } catch { return '' }
  })
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [showPw,          setShowPw]          = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [loading,         setLoading]         = useState(false)
  const [googleLoading,   setGoogleLoading]   = useState(false)
  const [awaitingConfirm, setAwaitingConfirm] = useState(false)

  useEffect(() => {
    track('signup_page_view', {
      from_onboarding: fromOnboarding,
      prefilled_name:  !!fullName,
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (awaitingConfirm) {
      track('signup_confirm_screen_view', {
        from_onboarding:    fromOnboarding,
        time_to_confirm_ms: Date.now() - pageLoadRef.current,
      })
    }
  }, [awaitingConfirm]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasUpper  = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const strength  =
    password.length === 0                               ? 0 :
    password.length < 8                                ? 1 :
    password.length >= 12 && hasUpper && hasNumber     ? 3 :
    2

  const strengthLabel      = ['', 'Too short', 'Good', 'Strong'][strength]
  const strengthColors     = ['', 'bg-error', 'bg-warning', 'bg-success']
  const strengthTextColors = ['', 'text-error', 'text-[#B45309]', 'text-success']
  const strengthHint       =
    strength === 1 ? 'Use at least 8 characters' :
    strength === 2 ? 'Add uppercase + number for Strong' :
    null

  async function handleGoogle() {
    setGoogleLoading(true)
    track('signup_google_click', { time_to_click_ms: Date.now() - pageLoadRef.current })
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}` },
    })
    if (error) {
      setError("Couldn't open Google. Check your connection and try again.")
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password needs to be at least 8 characters.')
      return
    }

    setLoading(true)
    track('signup_email_submit', {
      time_to_submit_ms: Date.now() - pageLoadRef.current,
      pw_strength:       strength,
      from_onboarding:   fromOnboarding,
    })

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    })

    if (error) {
      const msg = error.message
      const errorCategory =
        msg.includes('already registered') || msg.includes('already been registered') ? 'already_registered' :
        msg.includes('rate limit') || msg.includes('email_rate_limit')                ? 'rate_limited' :
        msg.includes('Password should be')                                             ? 'password_too_short' :
        msg.includes('Invalid email') || msg.includes('invalid email')                ? 'invalid_email' :
        msg.includes('network')                                                        ? 'network' :
        'unknown'

      track('signup_email_error', { error_category: errorCategory })
      setError(
        errorCategory === 'already_registered' ? "Already have an account?" :
        errorCategory === 'rate_limited'       ? "You're moving fast. Wait a moment, then try again." :
        errorCategory === 'password_too_short' ? 'Password needs to be at least 8 characters.' :
        errorCategory === 'invalid_email'      ? "Check the email — something looks off." :
        errorCategory === 'network'            ? "Check your connection and try again." :
        "Almost there — something slipped. Try again."
      )
      setLoading(false)
      return
    }

    if (!data.session) {
      track('signup_success', { method: 'email', awaiting_confirm: true })
      setAwaitingConfirm(true)
      setLoading(false)
      return
    }

    track('signup_success', { method: 'email', awaiting_confirm: false })
    router.push(redirectTo)
  }

  // ── Confirmation screen ──────────────────────────────────────────────────
  if (awaitingConfirm) {
    return (
      <div
        className="flex flex-col gap-6 animate-slide-up"
        role="main"
        aria-live="polite"
        data-testid="signup-confirm-screen"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7.5L5.5 10.5L11.5 4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-micro font-mono text-success uppercase tracking-widest">Account created</span>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-h3 font-bold text-text-primary tracking-tight">Check your inbox</h1>
          <p className="text-small text-text-secondary">
            We sent a confirmation link to{' '}
            <span className="font-medium text-text-primary">{email}</span>.
            Click it to unlock your score and report.
          </p>
        </div>

        <p className="text-micro font-mono text-text-disabled">
          Most emails arrive in under 30 seconds.
        </p>

        <p className="text-small text-text-disabled">
          Didn&apos;t get it? Check spam, or{' '}
          <button
            type="button"
            onClick={() => { setAwaitingConfirm(false); setError(null) }}
            className="text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded"
          >
            try again
          </button>.
        </p>
      </div>
    )
  }

  // ── Main signup form ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-7 animate-slide-up">

      {/* Onboarding endowment strip — only shown when user has a pending report */}
      {fromOnboarding && (
        <div
          role="status"
          aria-label="Your resume analysis is ready"
          className="flex items-center gap-2 border-l-2 border-accent pl-3 py-1.5"
        >
          <span className="text-micro font-mono text-accent uppercase tracking-widest">Your report is ready</span>
          <span className="text-micro text-text-disabled">— you&apos;re one step away</span>
        </div>
      )}

      {/* Heading */}
      <div className="flex flex-col gap-2">
        <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">
          {fromOnboarding ? 'Save your results' : 'Create account'}
        </span>
        <h1 className="text-h3 font-bold text-text-primary tracking-tight">
          {fromOnboarding
            ? 'One step to unlock your score'
            : 'Join 18,000+ engineers who know their signal'}
        </h1>
        <p className="text-small text-text-secondary">
          {fromOnboarding
            ? 'Free forever. No credit card. No spam.'
            : 'Under 2 minutes to your score. See exactly where you stand.'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2 border-l-2 border-error pl-3 py-1 text-small text-error"
          data-testid="signup-error"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 shrink-0" aria-hidden="true">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 4.5v3M7 9.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>
            {error}
            {error.includes("Already have an account") && (
              <>{' '}<Link href={`/auth/login?redirect=${redirectTo}`} className="underline font-medium">
                Sign in instead →
              </Link></>
            )}
          </span>
        </div>
      )}

      {/* Google OAuth */}
      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={handleGoogle}
        loading={googleLoading}
        disabled={googleLoading}
        data-testid="signup-google-btn"
        aria-label="Continue with Google"
      >
        {!googleLoading && <GoogleIcon />}
        {googleLoading ? 'Opening Google…' : 'Continue with Google'}
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3" role="separator" aria-hidden="true">
        <div className="h-px flex-1 bg-border" />
        <span className="text-micro text-text-disabled uppercase tracking-widest">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Email form — always visible on signup, one-time act */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Full name"
          type="text"
          placeholder="Alex Johnson"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          autoComplete="name"
          required
          data-testid="signup-name-input"
        />

        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          required
          data-testid="signup-email-input"
        />

        <div className="flex flex-col gap-1.5">
          <Input
            label="Password"
            type={showPw ? 'text' : 'password'}
            placeholder="Minimum 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            data-testid="signup-password-input"
            aria-describedby={password.length > 0 ? 'pw-strength' : undefined}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="text-text-disabled hover:text-text-primary transition-colors"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                data-testid="signup-toggle-pw"
              >
                {showPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            }
          />

          {password.length > 0 && (
            <div
              id="pw-strength"
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

        <Button
          type="submit"
          size="lg"
          loading={loading}
          className="w-full"
          data-testid="signup-submit-btn"
        >
          {loading
            ? (fromOnboarding ? 'Saving your report…' : 'Almost there…')
            : (fromOnboarding ? 'Unlock my score →' : 'Create free account')}
        </Button>

        <p className="text-micro text-text-disabled text-center">
          By signing up you agree to our{' '}
          <Link href="/terms" className="underline hover:text-text-secondary">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline hover:text-text-secondary">Privacy Policy</Link>.
          {' '}No spam, ever.
        </p>
      </form>

      <p className="text-center text-micro font-mono text-text-disabled">
        Already have an account?{' '}
        <Link
          href={`/auth/login?redirect=${redirectTo}`}
          className="text-accent hover:text-accent/80 transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded"
          data-testid="signup-signin-link"
          onClick={() => track('signup_signin_link_click', {})}
        >
          Sign in →
        </Link>
      </p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
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
