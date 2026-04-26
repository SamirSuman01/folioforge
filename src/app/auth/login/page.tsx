'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { track } from '@/lib/funnel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router         = useRouter()
  const searchParams   = useSearchParams()
  const redirectTo     = searchParams.get('redirect') ?? '/dashboard'
  const fromOnboarding = searchParams.get('from') === 'onboarding'
  const callbackError  = searchParams.get('error')
  const pageLoadRef    = useRef(Date.now())
  const supabase       = createClient()

  const [email,          setEmail]          = useState('')
  const [password,       setPassword]       = useState('')
  const [error,          setError]          = useState<string | null>(
    callbackError === 'auth_failed'
      ? 'Sign-in failed — please try again or use a different method.'
      : null
  )
  const [credentialError, setCredentialError] = useState(false)
  const [loading,         setLoading]         = useState(false)
  const [googleLoading,   setGoogleLoading]   = useState(false)
  const [showPw,          setShowPw]          = useState(false)
  const [showEmailForm,   setShowEmailForm]   = useState(false)

  useEffect(() => {
    track('login_page_view', {
      from_onboarding:    fromOnboarding,
      has_callback_error: !!callbackError,
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGoogle() {
    setGoogleLoading(true)
    track('login_google_click', {
      time_to_click_ms:      Date.now() - pageLoadRef.current,
      from_onboarding:       fromOnboarding,
      email_form_was_visible: showEmailForm,
    })
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
    setLoading(true)
    setError(null)
    setCredentialError(false)

    track('login_email_submit', {
      time_to_submit_ms: Date.now() - pageLoadRef.current,
      from_onboarding:   fromOnboarding,
    })

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const msg          = error.message
      const isCredential = msg.includes('Invalid login credentials')

      if (isCredential) setCredentialError(true)

      track('login_email_error', {
        type: isCredential
          ? 'invalid_credentials'
          : msg.includes('Email not confirmed') ? 'unconfirmed_email'
          : msg.includes('rate limit')          ? 'rate_limited'
          : msg.includes('network')             ? 'network'
          : 'unknown',
        from_onboarding: fromOnboarding,
      })

      setError(
        isCredential                        ? 'Incorrect email or password.' :
        msg.includes('Email not confirmed') ? 'Check your inbox — confirm your email first.' :
        msg.includes('rate limit')          ? 'Too many attempts. Wait a minute.' :
        msg.includes('network')             ? 'Connection issue — check your internet.' :
        'Something went wrong. Try again.'
      )
      setLoading(false)
      return
    }

    track('login_success', {
      method:             'email',
      time_to_success_ms: Date.now() - pageLoadRef.current,
      from_onboarding:    fromOnboarding,
    })

    router.push(redirectTo)
  }

  return (
    <div className="flex flex-col gap-7 animate-slide-up" data-testid="login-form">

      {/* Onboarding endowment strip — only shown when user has a pending report */}
      {fromOnboarding && (
        <div
          className="flex items-start gap-3 rounded border border-accent/20 bg-accent/5 px-4 py-3"
          role="status"
          aria-label="Your portfolio is ready and waiting"
          data-testid="onboarding-endowment-strip"
        >
          <span
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
            style={{ animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
            aria-hidden="true"
          />
          <div>
            <p className="text-small font-semibold text-text-primary leading-snug">
              Your signal report is ready
            </p>
            <p className="mt-0.5 font-mono text-micro text-text-secondary">
              Resume scored &nbsp;·&nbsp; Portfolio built &nbsp;·&nbsp; Waiting for you
            </p>
          </div>
        </div>
      )}

      {/* Heading */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-micro uppercase tracking-widest text-text-disabled">
          {fromOnboarding ? 'Your portfolio is ready' : 'Your career OS'}
        </span>
        <h1 className="text-h3 font-bold text-text-primary tracking-tight">
          {fromOnboarding ? "Don't lose your report" : 'Welcome back'}
        </h1>
        <p className="text-small text-text-secondary">
          {fromOnboarding
            ? 'Sign in to keep your signal analysis — it disappears if you leave.'
            : 'Your score, gaps, and market data are waiting.'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" aria-live="assertive" className="flex flex-col gap-2" data-testid="login-error">
          <div className="flex items-start gap-2 border-l-2 border-error py-1 pl-3 text-small text-error">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 shrink-0" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 4.5v3M7 9.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
          {credentialError && (
            <button
              type="button"
              onClick={() => {
                track('login_google_recovery_click', { from_onboarding: fromOnboarding })
                handleGoogle()
              }}
              className="pl-5 text-left font-mono text-micro text-accent hover:text-accent/80 transition-colors"
              data-testid="credential-error-google-recovery"
            >
              Try signing in with Google instead →
            </button>
          )}
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
        data-testid="google-oauth-btn"
        aria-label="Continue with Google"
      >
        {!googleLoading && <GoogleIcon />}
        {googleLoading ? 'Opening Google…' : 'Continue with Google'}
      </Button>

      {/* Email form — progressive disclosure is defensible on login:
          returning users who set up Google won't need this at all */}
      {!showEmailForm ? (
        <button
          type="button"
          onClick={() => {
            setShowEmailForm(true)
            track('login_email_form_revealed', {
              time_to_reveal_ms: Date.now() - pageLoadRef.current,
              from_onboarding:   fromOnboarding,
            })
          }}
          className="py-2 text-center font-mono text-micro text-text-disabled hover:text-text-secondary transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded"
          data-testid="reveal-email-form-btn"
        >
          Sign in with email instead
        </button>
      ) : (
        <>
          <div className="flex items-center gap-3" role="separator" aria-hidden="true">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-micro uppercase tracking-widest text-text-disabled">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" data-testid="email-form" noValidate>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username email"
              required
              autoFocus
              data-testid="email-input"
            />

            <div className="flex flex-col gap-1.5">
              <Input
                label="Password"
                type={showPw ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                data-testid="password-input"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="text-text-disabled hover:text-text-primary transition-colors"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    data-testid="toggle-password-visibility"
                  >
                    {showPw ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                }
              />
              <div className="flex justify-end">
                <Link
                  href="/auth/reset-password"
                  className="text-small text-text-secondary hover:text-text-primary transition-colors"
                  data-testid="forgot-password-link"
                  onClick={() => track('login_forgot_password_click', { from_onboarding: fromOnboarding })}
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full"
              data-testid="email-submit-btn"
            >
              {loading
                ? (fromOnboarding ? 'Getting your report…' : 'Signing in…')
                : (fromOnboarding ? 'Save my report →' : 'Sign in →')}
            </Button>
          </form>
        </>
      )}

      <p className="text-center font-mono text-micro text-text-disabled">
        New here?{' '}
        <Link
          href={`/auth/signup?redirect=${redirectTo}`}
          className="text-accent hover:text-accent/80 transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded"
          data-testid="signup-link"
          onClick={() => track('login_signup_link_click', { from_onboarding: fromOnboarding })}
        >
          Get your free signal score →
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
