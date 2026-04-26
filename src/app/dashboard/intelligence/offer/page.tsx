'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import AppNav from '@/components/ui/AppNav'
import type { OfferReport, OfferSeniority } from '@/lib/types'

// ─── Constants ───────────────────────────────────────────────

const SCAN_STEPS = [
  'Analysing compensation data…',
  'Benchmarking against market rates…',
  'Evaluating equity structure…',
  'Building negotiation strategy…',
  'Finalising your script…',
]

const SENIORITY_OPTIONS: { value: OfferSeniority; label: string }[] = [
  { value: 'junior',    label: 'Junior'    },
  { value: 'mid',       label: 'Mid'       },
  { value: 'senior',    label: 'Senior'    },
  { value: 'staff',     label: 'Staff'     },
  { value: 'principal', label: 'Principal' },
  { value: 'director',  label: 'Director'  },
]

const LEVERAGE_COLOR: Record<string, string> = {
  High:   'text-success',
  Medium: 'text-warning',
  Low:    'text-text-disabled',
}

const COMP_VERDICT_COLOR: Record<string, string> = {
  'Above Market': 'text-success',
  'At Market':    'text-warning',
  'Below Market': 'text-error',
}

const SESSION_KEY = 'offer_form_v1'
const SESSION_TTL = 48 * 60 * 60 * 1000 // 48 hours

// ─── Helpers ─────────────────────────────────────────────────

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function parseSalary(raw: string): number | null {
  const s = raw.replace(/[$,\s]/g, '').toLowerCase()
  if (s.endsWith('k')) {
    const n = parseFloat(s)
    return isNaN(n) ? null : Math.round(n * 1000)
  }
  const n = parseFloat(s)
  return isNaN(n) ? null : Math.round(n)
}

function formatSalary(n: number): string {
  return '$' + n.toLocaleString('en-US')
}

// ─── Icons ────────────────────────────────────────────────────

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <rect x="1.5" y="4.5" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M3 4.5V3a2 2 0 0 1 4 0v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M2 8H1.5A.5.5 0 0 1 1 7.5v-6A.5.5 0 0 1 1.5 1h6a.5.5 0 0 1 .5.5V2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Form state ───────────────────────────────────────────────

interface FormState {
  company:         string
  is_public:       boolean | null
  role:            string
  seniority:       OfferSeniority | ''
  location:        string
  base_salary:     string
  equity_annual:   string
  competing_offer: string
  current_comp:    string
  other_comp:      string
}

const EMPTY_FORM: FormState = {
  company:         '',
  is_public:       null,
  role:            '',
  seniority:       '',
  location:        '',
  base_salary:     '',
  equity_annual:   '',
  competing_offer: '',
  current_comp:    '',
  other_comp:      '',
}

// ─── Page ─────────────────────────────────────────────────────

export default function OfferAnalyzerPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [userName,    setUserName]    = useState('')
  const [userInitial, setUserInitial] = useState('?')
  const [isPro,       setIsPro]       = useState(false)

  const [form,            setForm]            = useState<FormState>(EMPTY_FORM)
  const [showOptional,    setShowOptional]    = useState(false)
  const [prefilledNotice, setPrefilledNotice] = useState(false)

  const [report,    setReport]    = useState<OfferReport | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [scanStep,  setScanStep]  = useState(0)
  const [slowNet,   setSlowNet]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [copied,       setCopied]       = useState(false)
  const [showCompHow,  setShowCompHow]  = useState(false)
  const [showEquityHow,setShowEquityHow]= useState(false)

  const scanTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const slowNetTimerRef = useRef<ReturnType<typeof setTimeout>  | null>(null)
  const copiedTimerRef  = useRef<ReturnType<typeof setTimeout>  | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const fullName = user.user_metadata?.full_name as string ?? ''
      setUserName(fullName)
      setUserInitial(fullName.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?')

      // Fetch is_pro from any portfolio
      const { data } = await supabase
        .from('portfolios')
        .select('is_pro')
        .eq('user_id', user.id)
        .limit(1)
        .single()
      setIsPro((data as { is_pro?: boolean } | null)?.is_pro ?? false)

      // sessionStorage pre-fill
      try {
        const saved = sessionStorage.getItem(SESSION_KEY)
        if (saved) {
          const parsed = JSON.parse(saved) as FormState & { savedAt: number }
          if (Date.now() - parsed.savedAt < SESSION_TTL) {
            const { savedAt: _, ...formData } = parsed
            setForm(formData)
            setPrefilledNotice(true)
          } else {
            sessionStorage.removeItem(SESSION_KEY)
          }
        }
      } catch { /* sessionStorage unavailable */ }
    }
    load()
  }, [router, supabase])

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  const baseParsed         = parseSalary(form.base_salary)
  const competingParsed    = parseSalary(form.competing_offer)
  const equityParsed       = parseSalary(form.equity_annual)
  const currentCompParsed  = parseSalary(form.current_comp)
  const otherCompParsed    = parseSalary(form.other_comp)

  const requiredValid =
    form.company.trim().length > 0 &&
    form.is_public !== null &&
    form.role.trim().length > 0 &&
    form.seniority !== '' &&
    form.location.trim().length > 0 &&
    baseParsed !== null && baseParsed > 0

  const readyToSubmit = requiredValid && !analyzing

  async function runAnalysis() {
    if (!readyToSubmit) return
    setAnalyzing(true)
    setReport(null)
    setError(null)
    setSlowNet(false)
    setScanStep(0)

    // Save to sessionStorage before submitting
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...form, savedAt: Date.now() }))
      setPrefilledNotice(false)
    } catch { /* unavailable */ }

    const body = {
      company:         form.company.trim(),
      is_public:       form.is_public,
      role:            form.role.trim(),
      seniority:       form.seniority,
      location:        form.location.trim(),
      base_salary:     baseParsed,
      equity_annual:   equityParsed,
      competing_offer: competingParsed,
      current_comp:    currentCompParsed,
      other_comp:      otherCompParsed,
    }

    const abortCtrl = new AbortController()
    const timeoutId = setTimeout(() => abortCtrl.abort(), 60_000)

    const apiCall  = fetch('/api/intelligence/offer', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  abortCtrl.signal,
    })
    const minDelay = new Promise<void>(res => setTimeout(res, 6000))

    let step = 0
    scanTimerRef.current = setInterval(() => {
      step = Math.min(step + 1, SCAN_STEPS.length - 1)
      setScanStep(step)
    }, 1400)

    slowNetTimerRef.current = setTimeout(() => setSlowNet(true), 10000)

    try {
      const [res] = await Promise.all([apiCall, minDelay])
      clearTimeout(timeoutId)
      if (scanTimerRef.current)    clearInterval(scanTimerRef.current)
      if (slowNetTimerRef.current) clearTimeout(slowNetTimerRef.current)

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Analysis failed')
        return
      }

      const data = await res.json() as OfferReport
      setReport(data)
    } catch (err) {
      clearTimeout(timeoutId)
      const isAbort = err instanceof Error && err.name === 'AbortError'
      setError(isAbort ? 'Analysis timed out (60s) — please try again.' : 'Network error — please try again')
    } finally {
      if (scanTimerRef.current)    clearInterval(scanTimerRef.current)
      if (slowNetTimerRef.current) clearTimeout(slowNetTimerRef.current)
      setAnalyzing(false)
      setSlowNet(false)
    }
  }

  async function copyScript() {
    if (!report) return
    try {
      await navigator.clipboard.writeText(report.negotiation.script)
      setCopied(true)
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable */ }
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <AppNav userName={userName} userInitial={userInitial} />

      <main className="mx-auto max-w-2xl px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="mb-10 animate-slide-up-1">
          <Link
            href="/dashboard/intelligence"
            className="inline-flex items-center gap-1.5 text-small text-text-disabled hover:text-text-secondary transition-colors mb-5"
          >
            <ChevronLeftIcon />
            Intelligence
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">
              Offer Analysis // Three-Step Chain
            </span>
          </div>
          <h1 className="text-h3 font-bold text-text-primary tracking-tight mt-2">Offer Analyzer</h1>
          <p className="text-small text-text-secondary mt-1">
            Find out if the offer is fair — and get the exact words to negotiate more.
          </p>
        </div>

        {/* Form */}
        {!analyzing && !report && (
          <div className="space-y-5 animate-slide-up-2">

            {/* Prefilled notice */}
            {prefilledNotice && (
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border">
                <p className="text-micro text-text-disabled">Loaded from your last analysis.</p>
                <button
                  onClick={() => { setForm(EMPTY_FORM); setPrefilledNotice(false) }}
                  className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors"
                >
                  Clear →
                </button>
              </div>
            )}

            {/* Company */}
            <div className="flex flex-col gap-1.5">
              <label className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                Company
              </label>
              <input
                type="text"
                value={form.company}
                onChange={e => setField('company', e.target.value)}
                placeholder="e.g. Stripe, Acme Corp"
                className="w-full px-3 py-2 bg-background border border-border rounded text-small text-text-primary focus:border-accent focus:outline-none transition-colors placeholder:text-text-disabled"
              />
            </div>

            {/* Public company toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                Publicly Traded?
              </label>
              <div className="flex gap-2">
                {([true, false] as const).map(val => (
                  <button
                    key={String(val)}
                    onClick={() => setField('is_public', val)}
                    className={cn(
                      'flex-1 py-2 rounded text-small font-mono transition-colors border',
                      form.is_public === val
                        ? 'border-accent text-accent bg-accent/5'
                        : 'border-border text-text-disabled hover:border-border-subtle hover:text-text-secondary',
                    )}
                  >
                    {val ? 'Yes — listed on stock exchange' : 'No — private company'}
                  </button>
                ))}
              </div>
            </div>

            {/* Role */}
            <div className="flex flex-col gap-1.5">
              <label className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                Role Title
              </label>
              <input
                type="text"
                value={form.role}
                onChange={e => setField('role', e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className="w-full px-3 py-2 bg-background border border-border rounded text-small text-text-primary focus:border-accent focus:outline-none transition-colors placeholder:text-text-disabled"
              />
            </div>

            {/* Seniority */}
            <div className="flex flex-col gap-1.5">
              <label className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                Seniority Level
              </label>
              <p className="text-micro text-text-disabled -mt-0.5">Use market level, not your title. SE II at most companies = Mid.</p>
              <select
                value={form.seniority}
                onChange={e => setField('seniority', e.target.value as OfferSeniority)}
                className="w-full px-3 py-2 bg-background border border-border rounded text-small text-text-primary focus:border-accent focus:outline-none transition-colors"
              >
                <option value="" disabled>Select level…</option>
                {SENIORITY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1.5">
              <label className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={e => setField('location', e.target.value)}
                placeholder="e.g. San Francisco, CA · Remote, US · New York"
                className="w-full px-3 py-2 bg-background border border-border rounded text-small text-text-primary focus:border-accent focus:outline-none transition-colors placeholder:text-text-disabled"
              />
            </div>

            {/* Base salary */}
            <div className="flex flex-col gap-1.5">
              <label className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                Base Salary
              </label>
              <input
                type="text"
                value={form.base_salary}
                onChange={e => setField('base_salary', e.target.value)}
                placeholder="150000 · $150k · $150,000"
                className={cn(
                  'w-full px-3 py-2 bg-background border rounded text-small text-text-primary focus:border-accent focus:outline-none transition-colors placeholder:text-text-disabled',
                  form.base_salary && baseParsed === null ? 'border-error' : 'border-border',
                )}
              />
              {form.base_salary && baseParsed === null && (
                <p className="text-micro text-error">Enter a number — e.g. 150000 or 150k</p>
              )}
            </div>

            {/* Optional section */}
            <div className="border-t border-border pt-4">
              {!showOptional ? (
                <button
                  onClick={() => setShowOptional(true)}
                  className="text-small font-mono text-accent hover:text-accent-hover transition-colors"
                >
                  Add more detail for a stronger analysis ↓
                </button>
              ) : (
                <div className="space-y-5">
                  <p className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                    Optional — improves accuracy
                  </p>

                  {/* Equity */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                      Annual Equity Value (USD)
                    </label>
                    <p className="text-micro text-text-disabled -mt-0.5">
                      RSUs: shares ÷ vesting years × stock price. Options: ask your recruiter for the grant value.
                    </p>
                    <input
                      type="text"
                      value={form.equity_annual}
                      onChange={e => setField('equity_annual', e.target.value)}
                      placeholder="e.g. 50000 or 50k"
                      className="w-full px-3 py-2 bg-background border border-border rounded text-small text-text-primary focus:border-accent focus:outline-none transition-colors placeholder:text-text-disabled"
                    />
                  </div>

                  {/* Competing offer */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                      Competing Offer Base (USD)
                    </label>
                    <input
                      type="text"
                      value={form.competing_offer}
                      onChange={e => setField('competing_offer', e.target.value)}
                      placeholder="e.g. 175000 — leave blank if none"
                      className="w-full px-3 py-2 bg-background border border-border rounded text-small text-text-primary focus:border-accent focus:outline-none transition-colors placeholder:text-text-disabled"
                    />
                    {form.competing_offer && competingParsed !== null && (
                      <p className="text-micro text-success">
                        Competing offer entered — your leverage increases.
                      </p>
                    )}
                  </div>

                  {/* Current comp */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                      Current Compensation (USD)
                    </label>
                    <input
                      type="text"
                      value={form.current_comp}
                      onChange={e => setField('current_comp', e.target.value)}
                      placeholder="Your current total base — leave blank if not applicable"
                      className="w-full px-3 py-2 bg-background border border-border rounded text-small text-text-primary focus:border-accent focus:outline-none transition-colors placeholder:text-text-disabled"
                    />
                  </div>

                  {/* Other comp */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                      Other Compensation
                    </label>
                    <input
                      type="text"
                      value={form.other_comp}
                      onChange={e => setField('other_comp', e.target.value)}
                      placeholder="Signing bonus + annual bonus combined — e.g. 20000"
                      className="w-full px-3 py-2 bg-background border border-border rounded text-small text-text-primary focus:border-accent focus:outline-none transition-colors placeholder:text-text-disabled"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={runAnalysis}
              disabled={!readyToSubmit}
              className={cn(
                'w-full py-2.5 rounded text-small font-medium transition-colors mt-2',
                readyToSubmit
                  ? 'bg-accent text-text-inverse hover:bg-accent-hover'
                  : 'bg-border-subtle text-text-disabled cursor-not-allowed',
              )}
            >
              Analyse Offer
            </button>

            {error && <p className="text-micro text-error">{error}</p>}
          </div>
        )}

        {/* Scanning */}
        {analyzing && (
          <div className="py-16 animate-fade-in">
            <div className="flex gap-1 mb-8">
              {SCAN_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-px flex-1 transition-all duration-500',
                    i <= scanStep ? 'bg-accent' : 'bg-border',
                  )}
                />
              ))}
            </div>
            <p className="text-small font-mono text-text-primary">
              {SCAN_STEPS[scanStep]}
              <span className="animate-[mirror-cursor_1s_ease-in-out_infinite]">▌</span>
            </p>
            {slowNet ? (
              <p className="text-micro text-text-disabled mt-1">
                Still running — AI is finalising your script. Do not refresh or you will lose your results.
              </p>
            ) : (
              <p className="text-micro text-text-disabled mt-1">Typically 9–12 seconds</p>
            )}
          </div>
        )}

        {/* Results — Negotiation first */}
        {report && !analyzing && (
          <div className="animate-fade-in">

            {/* Header row */}
            <div className="flex items-center justify-between mb-8">
              <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                Analysis complete
              </span>
              <button
                onClick={() => { setReport(null); setError(null) }}
                className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors"
              >
                Analyse another →
              </button>
            </div>

            {/* ── NEGOTIATION — hero section ───────────────────── */}
            <div className="mb-8">
              <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-5">
                Negotiation Strategy
              </span>

              {/* Pro gate — above the counter number */}
              {!isPro && (
                <div className="border border-border rounded px-4 py-3 mb-5 flex items-center justify-between gap-4">
                  <p className="text-small text-text-disabled">
                    Upgrade to Pro to unlock your counter offer amount, full script, and walk-away line.
                  </p>
                  <Link
                    href="/dashboard/upgrade?from=offer"
                    className="text-micro font-mono text-accent hover:text-accent-hover transition-colors shrink-0"
                  >
                    Upgrade →
                  </Link>
                </div>
              )}

              {isPro ? (
                <>
                  {/* Counter offer hero number */}
                  <div className="mb-5">
                    <span className="text-micro font-mono text-text-disabled block mb-1">Counter offer</span>
                    <span
                      className="font-mono font-bold leading-none tabular-nums text-text-primary"
                      style={{ fontSize: 'clamp(3.5rem, 10vw, 5.5rem)' }}
                    >
                      {formatSalary(report.negotiation.counter_base)}
                    </span>
                    {(report.negotiation.counter_equity || report.negotiation.counter_signing) && (
                      <div className="flex gap-4 mt-2">
                        {report.negotiation.counter_equity && (
                          <span className="text-micro font-mono text-text-disabled">
                            + {formatSalary(report.negotiation.counter_equity)} equity
                          </span>
                        )}
                        {report.negotiation.counter_signing && (
                          <span className="text-micro font-mono text-text-disabled">
                            + {formatSalary(report.negotiation.counter_signing)} signing
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Leverage */}
                  <div className="border-t border-border pt-4 mb-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Leverage</span>
                      <span className={cn('text-small font-mono font-semibold', LEVERAGE_COLOR[report.negotiation.leverage])}>
                        {report.negotiation.leverage}
                      </span>
                    </div>
                    <p className="text-micro text-text-secondary">{report.negotiation.leverage_reason}</p>
                  </div>

                  {/* Talking points */}
                  {report.negotiation.talking_points.length > 0 && (
                    <div className="border-t border-border pt-4 mb-4">
                      <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-2">
                        Your Leverage Points
                      </span>
                      <ul className="space-y-1.5">
                        {report.negotiation.talking_points.map((pt, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-accent shrink-0 mt-1.5" />
                            <span className="text-small text-text-secondary">{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Script — teleprompter */}
                  <div className="border-t border-border pt-4 mb-4">
                    <p className="text-micro text-text-disabled mb-3">
                      Call is fastest — you get a response that day. Email works if you need time to prepare. Either way, use the exact words below.
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                        Open with:
                      </span>
                      <button
                        onClick={copyScript}
                        className="flex items-center gap-1.5 text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors"
                      >
                        <CopyIcon />
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="bg-border-subtle rounded px-4 py-3">
                      <p className="text-small font-mono text-text-primary leading-relaxed">
                        &ldquo;{report.negotiation.script}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Walk-away */}
                  <div className="border-t border-border pt-4 mb-2">
                    <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-2">
                      If they come back below {formatSalary(report.negotiation.walk_away_floor)}, say:
                    </span>
                    <div className="bg-border-subtle rounded px-4 py-3">
                      <p className="text-small font-mono text-text-primary leading-relaxed">
                        &ldquo;{report.negotiation.walk_away_line}&rdquo;
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                /* Free — leverage level + 1 talking point only */
                <>
                  <div className="border-t border-border pt-4 mb-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Leverage</span>
                      <span className={cn('text-small font-mono font-semibold', LEVERAGE_COLOR[report.negotiation.leverage])}>
                        {report.negotiation.leverage}
                      </span>
                    </div>
                    <p className="text-micro text-text-secondary">{report.negotiation.leverage_reason}</p>
                  </div>
                  {report.negotiation.talking_points[0] && (
                    <div className="border-t border-border pt-4 mb-4">
                      <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-2">
                        Leverage Point
                      </span>
                      <div className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-accent shrink-0 mt-1.5" />
                        <span className="text-small text-text-secondary">{report.negotiation.talking_points[0]}</span>
                      </div>
                    </div>
                  )}
                  <div className="border border-border rounded px-4 py-3 flex items-center gap-2">
                    <LockIcon />
                    <p className="text-small text-text-disabled">
                      Counter offer amount, script, and walk-away line are Pro features.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* ── COMP ANALYSIS ────────────────────────────────── */}
            <div className="border-t border-border pt-5 mb-6">
              <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">
                Compensation Analysis
              </span>

              {/* Market range */}
              <div className="divide-y divide-border mb-4">
                <div className="py-2 flex items-center justify-between">
                  <span className="text-small text-text-secondary">Market low (10th pct)</span>
                  <span className="text-small font-mono text-text-primary tabular-nums">
                    {formatSalary(report.comp.market_low)}
                  </span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-small text-text-secondary">Market median (50th pct)</span>
                  <span className="text-small font-mono text-text-primary tabular-nums">
                    {formatSalary(report.comp.market_median)}
                  </span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-small text-text-secondary">Market high (90th pct)</span>
                  <span className="text-small font-mono text-text-primary tabular-nums">
                    {formatSalary(report.comp.market_high)}
                  </span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-small text-text-secondary">Your offer</span>
                  <div className="flex items-center gap-2">
                    <span className="text-small font-mono text-text-primary tabular-nums">
                      {formatSalary(baseParsed ?? 0)}
                    </span>
                    <span className={cn('text-micro font-mono', COMP_VERDICT_COLOR[report.comp.verdict])}>
                      {report.comp.verdict}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gap + insight */}
              {report.comp.gap !== 0 && (
                <p className="text-small text-text-secondary mb-2">
                  You&apos;re{' '}
                  <span className={cn('font-mono', report.comp.gap < 0 ? 'text-error' : 'text-success')}>
                    {report.comp.gap < 0 ? '-' : '+'}{formatSalary(Math.abs(report.comp.gap))}
                  </span>
                  {' '}vs the market median for this role.
                </p>
              )}
              <p className="text-small text-text-disabled">{report.comp.insight}</p>

              {/* How we calculated this */}
              <button
                onClick={() => setShowCompHow(v => !v)}
                className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors mt-3"
              >
                How we calculated this {showCompHow ? '↑' : '↓'}
              </button>
              {showCompHow && (
                <p className="text-micro text-text-disabled mt-2 leading-relaxed">
                  Market data reflects reported salaries for this role, seniority level, and location from public compensation datasets. The percentile shows where your offer sits in that distribution. Gap is your offer minus the market median.
                </p>
              )}
            </div>

            {/* ── EQUITY ANALYSIS ──────────────────────────────── */}
            <div className="border-t border-border pt-5 mb-6">
              <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">
                Equity Analysis
              </span>

              {!report.equity.has_equity ? (
                <p className="text-small text-text-disabled">
                  No equity provided — analysis based on base compensation only. Add your annual equity value above for exit scenario projections.
                </p>
              ) : (
                <>
                  <p className="text-small text-text-secondary mb-4">{report.equity.verdict}</p>

                  {isPro ? (
                    <div className="divide-y divide-border">
                      {[
                        { label: 'Conservative exit (1.5×)', value: report.equity.exit_1_5x },
                        { label: 'Base exit (3×)',            value: report.equity.exit_3x   },
                        { label: 'Upside exit (10×)',         value: report.equity.exit_10x  },
                      ].map(row => row.value !== null && (
                        <div key={row.label} className="py-2 flex items-center justify-between">
                          <span className="text-small text-text-secondary">{row.label}</span>
                          <span className="text-small font-mono text-text-primary tabular-nums">
                            {formatSalary(row.value)}/yr
                          </span>
                        </div>
                      ))}
                      <div className="py-2 flex items-center justify-between">
                        <span className="text-small text-text-secondary">Risk level</span>
                        <span className={cn(
                          'text-micro font-mono',
                          report.equity.risk_level === 'High'   ? 'text-error'   :
                          report.equity.risk_level === 'Medium' ? 'text-warning' : 'text-success',
                        )}>
                          {report.equity.risk_level}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-2">
                      <LockIcon />
                      <p className="text-small text-text-disabled">
                        Exit scenario projections (1.5× / 3× / 10×) are a Pro feature.{' '}
                        <Link href="/dashboard/upgrade?from=offer" className="text-accent hover:text-accent-hover transition-colors">
                          Upgrade →
                        </Link>
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* How we calculated this — equity */}
              {report.equity.has_equity && (
                <>
                  <button
                    onClick={() => setShowEquityHow(v => !v)}
                    className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors mt-3"
                  >
                    How we calculated this {showEquityHow ? '↑' : '↓'}
                  </button>
                  {showEquityHow && (
                    <p className="text-micro text-text-disabled mt-2 leading-relaxed">
                      Annual equity value uses the figure you provided. Exit scenarios multiply that annual value by the exit multiple across a 4-year vesting period. Public company risk is lower due to immediate liquidity; private company equity depends on an exit event that may never occur.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Disclaimer */}
            <p className="text-micro font-mono text-text-disabled opacity-60 pb-2">
              For informational purposes only — not financial or legal advice. Compensation data is AI-estimated and may not reflect your exact market.
            </p>

          </div>
        )}

      </main>
    </div>
  )
}
