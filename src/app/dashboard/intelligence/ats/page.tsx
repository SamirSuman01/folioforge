'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import AppNav from '@/components/ui/AppNav'
import type { ATSReport, ATSCriterion, ATSVerdict, Portfolio } from '@/lib/types'

// ─── Constants ───────────────────────────────────────────────

const SCAN_STEPS = [
  'Parsing job description…',
  'Extracting required criteria…',
  'Mapping against your portfolio…',
  'Calculating match rate…',
]

const VERDICT_CONFIG: Record<ATSVerdict, { color: string; bg: string; description: string }> = {
  'Strong Pass': {
    color:       'text-success',
    bg:          'bg-success/5 border-success/20',
    description: 'Your portfolio signals match what this role screens for. A human reviewer should see your application.',
  },
  'Marginal': {
    color:       'text-warning',
    bg:          'bg-warning/5 border-warning/20',
    description: 'Small gaps detected — a few targeted fixes could tip you into a clear pass.',
  },
  'Likely Filtered': {
    color:       'text-error',
    bg:          'bg-error/5 border-error/20',
    description: 'ATS would likely remove you before a human sees your application. Fix the failures below.',
  },
}

const WEIGHT_LABEL: Record<string, string> = {
  knockout: 'Knockout',
  high:     'High',
  medium:   'Med',
}

// ─── Helpers ─────────────────────────────────────────────────

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function sortCriteria(criteria: ATSCriterion[]): ATSCriterion[] {
  const order = { knockout: 3, high: 2, medium: 1 }
  return [...criteria].sort((a, b) => {
    if (!a.present && b.present) return -1
    if (a.present && !b.present) return 1
    return (order[b.weight] ?? 0) - (order[a.weight] ?? 0)
  })
}

function failCount(criteria: ATSCriterion[]) {
  return criteria.filter(c => !c.present).length
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

// ─── Criterion Row ────────────────────────────────────────────

function CriterionRow({
  criterion: c,
  isPro,
  onOpenInEditor,
}: {
  criterion:      ATSCriterion
  isPro:          boolean
  onOpenInEditor: () => void
}) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            c.present ? 'bg-success' : 'bg-error',
          )} />
          <span className={cn(
            'text-micro font-mono truncate',
            c.present ? 'text-text-secondary' : 'text-text-primary',
          )}>
            {c.criterion}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            'text-micro font-mono',
            c.weight === 'knockout' ? 'text-error' : 'text-text-disabled',
          )}>
            {WEIGHT_LABEL[c.weight]}
          </span>
          <span className={cn(
            'text-micro font-mono',
            c.present ? 'text-text-disabled' : 'text-error',
          )}>
            {c.present ? 'Pass' : 'Fail'}
          </span>
        </div>
      </div>

      {/* Pro: evidence for passes */}
      {c.present && c.found_at && isPro && (
        <p className="text-micro text-text-disabled mt-1.5 pl-3.5 leading-relaxed">
          Found: &ldquo;{c.found_at}&rdquo;
        </p>
      )}

      {/* Pro: exact fix + editor link for fails */}
      {!c.present && isPro && c.fix && (
        <div className="mt-1.5 pl-3.5">
          <p className="text-micro text-text-disabled leading-relaxed">{c.fix}</p>
          <button
            onClick={onOpenInEditor}
            className="text-micro font-mono text-accent hover:text-accent-hover transition-colors mt-1 inline-block"
          >
            Fix in editor →
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────
interface AppStub { id: string; company: string; role: string }

// ─── Page ─────────────────────────────────────────────────────

export default function ATSAutopsyPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [userName,    setUserName]    = useState('')
  const [userInitial, setUserInitial] = useState('?')
  const [userId,      setUserId]      = useState<string>('')
  const [portfolios,  setPortfolios]  = useState<Portfolio[]>([])
  const [selectedId,  setSelectedId]  = useState<string>('')

  const [jd,        setJd]        = useState('')
  const [report,    setReport]    = useState<ATSReport | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [scanStep,  setScanStep]  = useState(0)
  const [slowNet,   setSlowNet]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [history,   setHistory]   = useState<Array<{
    snippet:   string
    pass_rate: number
    verdict:   ATSVerdict
    report:    ATSReport
  }>>([])

  // Pipeline linking state
  const [applications,   setApplications]   = useState<AppStub[]>([])
  const [pipelineAppId,  setPipelineAppId]  = useState<string>('')
  const [pipelineMode,   setPipelineMode]   = useState<'select' | 'new'>('select')
  const [newCompany,     setNewCompany]     = useState('')
  const [newRole,        setNewRole]        = useState('')
  const [pipelineSaving, setPipelineSaving] = useState(false)
  const [pipelineSaved,  setPipelineSaved]  = useState(false)

  const scanTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const slowNetTimerRef = useRef<ReturnType<typeof setTimeout>  | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const fullName = user.user_metadata?.full_name as string ?? ''
      setUserName(fullName)
      setUserInitial(fullName.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?')
      setUserId(user.id)

      const [portfolioRes, appRes] = await Promise.all([
        supabase
          .from('portfolios')
          .select('id, data, field, score, is_pro')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }),
        supabase
          .from('applications')
          .select('id, company, role')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ])

      const list = (portfolioRes.data ?? []) as Portfolio[]
      setPortfolios(list)
      if (list[0]) setSelectedId(list[0].id)

      setApplications((appRes.data ?? []) as AppStub[])
    }
    load()
  }, [router, supabase])

  async function saveToPipeline() {
    if (pipelineSaving || !report) return
    setPipelineSaving(true)
    try {
      if (pipelineMode === 'select' && pipelineAppId) {
        await supabase
          .from('applications')
          .update({ ats_score: report.pass_rate })
          .eq('id', pipelineAppId)
      } else if (pipelineMode === 'new' && newCompany.trim() && newRole.trim()) {
        const { data: inserted } = await supabase
          .from('applications')
          .insert({
            user_id:   userId,
            company:   newCompany.trim(),
            role:      newRole.trim(),
            status:    'wishlist',
            ats_score: report.pass_rate,
          })
          .select('id, company, role')
          .single()
        if (inserted) setApplications(prev => [inserted as AppStub, ...prev])
      }
      setPipelineSaved(true)
    } catch (err) {
      console.error('[saveToPipeline]', err)
      setError('Failed to save — please try again.')
    } finally {
      setPipelineSaving(false)
    }
  }

  function portfolioIsEmpty(p: Portfolio | undefined): boolean {
    if (!p?.data) return true
    const d = p.data
    const skillCount  = d.skills?.length ?? 0
    const expBullets  = (d.experience ?? []).flatMap(e => e.bullets ?? e.highlights ?? []).length
    const projectCount = d.projects?.length ?? 0
    return (skillCount + expBullets + projectCount) < 3
  }

  async function runAutopsy() {
    if (jd.trim().length < 200 || !selectedId || analyzing) return
    if (portfolioIsEmpty(selectedPortfolio)) {
      setError('Your portfolio looks empty — add skills, experience, or projects before running an autopsy.')
      return
    }
    setAnalyzing(true)
    setReport(null)
    setError(null)
    setSlowNet(false)
    setScanStep(0)

    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 60_000)

    const apiCall  = fetch('/api/intelligence/ats', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ portfolioId: selectedId, jd: jd.trim() }),
      signal:  controller.signal,
    })
    const minDelay = new Promise<void>(res => setTimeout(res, 4000))

    let step = 0
    scanTimerRef.current = setInterval(() => {
      step = Math.min(step + 1, SCAN_STEPS.length - 1)
      setScanStep(step)
    }, 1200)

    slowNetTimerRef.current = setTimeout(() => setSlowNet(true), 6000)

    try {
      const [res] = await Promise.all([apiCall, minDelay])
      clearTimeout(timeoutId)
      if (scanTimerRef.current)    clearInterval(scanTimerRef.current)
      if (slowNetTimerRef.current) clearTimeout(slowNetTimerRef.current)

      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Analysis failed')
        return
      }

      const data = await res.json() as ATSReport
      setReport(data)

      const snippet = jd.trim().slice(0, 55) + (jd.trim().length > 55 ? '…' : '')
      setHistory(prev => [
        { snippet, pass_rate: data.pass_rate, verdict: data.verdict, report: data },
        ...prev.slice(0, 4),
      ])
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

  const selectedPortfolio = portfolios.find(p => p.id === selectedId)
  const isPro             = true

  function openInEditor() {
    if (!report || !selectedId) return
    const failing = [...(report.required ?? []), ...(report.preferred ?? [])]
      .filter(c => !c.present)
      .map(c => ({ criterion: c.criterion, fix: c.fix ?? null }))
    try {
      sessionStorage.setItem('ff_ats_overlay', JSON.stringify({
        portfolioId: selectedId,
        failing,
        quickWins:   report.quick_wins ?? [],
        verdict:     report.verdict,
        ts:          Date.now(),
      }))
    } catch { /* sessionStorage unavailable */ }
    router.push(`/editor/${selectedId}`)
  }
  const charCount         = jd.trim().length
  const readyToSubmit     = charCount >= 200 && !!selectedId && !analyzing
  const totalFails        = report
    ? failCount(report.required) + failCount(report.preferred)
    : 0

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
              ATS Analysis // Two-Step Match
            </span>
          </div>
          <h1 className="text-h3 font-bold text-text-primary tracking-tight mt-2">ATS Autopsy</h1>
          <p className="text-small text-text-secondary mt-1">
            See if your portfolio survives the filter before a human reads it.
          </p>
        </div>

        {/* Input */}
        {!analyzing && !report && (
          <div className="space-y-4 animate-slide-up-2">

            {/* No portfolio guard */}
            {portfolios.length === 0 ? (
              <div className="border border-border rounded px-5 py-8 text-center">
                <p className="text-small text-text-secondary mb-3">
                  You need a portfolio before running an autopsy.
                </p>
                <Link
                  href="/onboarding"
                  className="text-small font-mono text-accent hover:text-accent-hover transition-colors"
                >
                  Build your portfolio →
                </Link>
              </div>
            ) : (
              <>
                {/* Portfolio select — only shown when multiple */}
                {portfolios.length > 1 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                      Portfolio
                    </label>
                    <select
                      value={selectedId}
                      onChange={e => setSelectedId(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded text-small text-text-primary focus:border-accent focus:outline-none transition-colors"
                    >
                      {portfolios.map(p => (
                        <option key={p.id} value={p.id}>{p.data?.name ?? 'Portfolio'}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* JD textarea */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                      Job Description
                    </label>
                    <span className={cn(
                      'text-micro font-mono tabular-nums',
                      charCount === 0
                        ? 'text-text-disabled'
                        : charCount < 200
                        ? 'text-warning'
                        : 'text-success',
                    )}>
                      {charCount < 200 ? `${charCount} / 200 min` : `${charCount} chars`}
                    </span>
                  </div>
                  <textarea
                    value={jd}
                    onChange={e => setJd(e.target.value)}
                    rows={11}
                    placeholder="Paste the full job description — include requirements, qualifications, and any 'nice to have' sections."
                    className="w-full px-3 py-2.5 bg-background border border-border rounded text-small text-text-primary focus:border-accent focus:outline-none transition-colors placeholder:text-text-disabled resize-none leading-relaxed"
                  />
                  {charCount > 0 && charCount < 200 && (
                    <p className="text-micro text-warning">
                      Need at least 200 characters for accurate analysis
                    </p>
                  )}
                </div>

                <button
                  onClick={runAutopsy}
                  disabled={!readyToSubmit}
                  className={cn(
                    'w-full py-2.5 rounded text-small font-medium transition-colors',
                    readyToSubmit
                      ? 'bg-accent text-text-inverse hover:bg-accent-hover'
                      : 'bg-border-subtle text-text-disabled cursor-not-allowed',
                  )}
                >
                  Run Autopsy
                </button>

                {error && <p className="text-micro text-error">{error}</p>}
              </>
            )}
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
                Still running — Gemini is under load, usually resolves in a few seconds
              </p>
            ) : (
              <p className="text-micro text-text-disabled mt-1">Typically 5–7 seconds</p>
            )}
          </div>
        )}

        {/* Results */}
        {report && !analyzing && (
          <div className="animate-fade-in">

            {/* Reset */}
            <div className="flex items-center justify-between mb-8">
              <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                Analysis complete
              </span>
              <div className="flex items-center gap-3">
                {charCount > 0 && (
                  <button
                    onClick={() => setJd('')}
                    className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => { setReport(null); setError(null); setPipelineSaved(false); setPipelineAppId(''); setNewCompany(''); setNewRole('') }}
                  className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors"
                >
                  Analyse another →
                </button>
              </div>
            </div>

            {/* Verdict block */}
            <div className={cn('rounded border px-6 py-5 mb-5', VERDICT_CONFIG[report.verdict].bg)}>
              <p className="text-micro font-mono text-text-disabled mb-2">{report.job_title}</p>
              <div className="flex items-end justify-between mb-3">
                <div className="flex items-baseline gap-3">
                  <span
                    className={cn('font-mono font-bold leading-none tabular-nums', VERDICT_CONFIG[report.verdict].color)}
                    style={{ fontSize: 'clamp(3.5rem, 10vw, 5.5rem)' }}
                  >
                    {report.pass_rate}
                  </span>
                  <span className="text-small text-text-disabled mb-1">/ 100</span>
                </div>
                <span className={cn(
                  'font-mono text-small font-bold uppercase tracking-wide mb-1',
                  VERDICT_CONFIG[report.verdict].color,
                )}>
                  {report.verdict}
                </span>
              </div>
              <p className="text-small text-text-secondary">{VERDICT_CONFIG[report.verdict].description}</p>
            </div>

            {/* Strong Pass — zero failures */}
            {totalFails === 0 && !report.has_knockout_fail && (
              <div className="bg-success/5 border border-success/20 rounded px-4 py-3 mb-5">
                <p className="text-micro font-mono text-success uppercase tracking-widest mb-1">
                  No Failures Detected
                </p>
                <p className="text-small text-text-secondary mb-3">
                  Your portfolio meets this role&apos;s screening criteria. A human reviewer should see your application.
                </p>
                <Link
                  href={`/editor/${selectedId}`}
                  className="text-micro font-mono text-accent hover:text-accent-hover transition-colors"
                >
                  Polish your portfolio before applying →
                </Link>
              </div>
            )}

            {/* Knockout disqualifier */}
            {report.has_knockout_fail && (
              <div className="bg-error/5 border border-error/30 rounded px-4 py-3 mb-5">
                <p className="text-micro font-mono text-error uppercase tracking-widest mb-1">
                  Disqualifier Detected
                </p>
                <p className="text-small text-text-secondary">
                  A knockout criterion failed — you&apos;d be filtered regardless of overall match rate. Fix it first.
                </p>
              </div>
            )}

            {/* Quick wins */}
            {report.quick_wins.length > 0 && (
              <div className="bg-success/5 border border-success/20 rounded px-4 py-4 mb-6">
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-3">
                  Fix These First — under 10 minutes
                </span>
                {totalFails > report.quick_wins.length && (
                  <p className="text-micro text-text-disabled mb-3">
                    {report.quick_wins.length} of your {totalFails} failure{totalFails !== 1 ? 's' : ''}{' '}
                    {report.quick_wins.length === 1 ? 'is' : 'are'} fixable in minutes.
                  </p>
                )}
                <div className="space-y-2">
                  {/* First quick win always free */}
                  <p className="text-small text-text-primary">{report.quick_wins[0]}</p>

                  {/* Remaining: Pro gated */}
                  {report.quick_wins.length > 1 && isPro && (
                    report.quick_wins.slice(1).map((win, i) => (
                      <p key={i} className="text-small text-text-primary">{win}</p>
                    ))
                  )}
                  {report.quick_wins.length > 1 && !isPro && (
                    <div className="flex items-center gap-2 mt-1">
                      <LockIcon />
                      <Link
                        href="/dashboard/upgrade?from=ats"
                        className="text-micro font-mono text-accent hover:text-accent-hover transition-colors"
                      >
                        Upgrade to see {report.quick_wins.length - 1} more quick{' '}
                        {report.quick_wins.length - 1 === 1 ? 'win' : 'wins'} →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Editor CTA — after quick wins, where intent forms */}
            {report.quick_wins.length > 0 && (
              <div className="px-4 pb-2 -mt-2">
                <button
                  onClick={openInEditor}
                  className="text-micro font-mono text-accent hover:text-accent-hover transition-colors"
                >
                  Fix in editor →
                </button>
              </div>
            )}

            {/* Single Pro gate banner */}
            {!isPro && totalFails > 0 && (
              <div className="border-t border-border pt-4 pb-4 mb-2 flex items-center justify-between gap-4">
                <p className="text-small text-text-disabled">
                  Upgrade to Pro to see exact fixes for all {totalFails} failing{' '}
                  {totalFails === 1 ? 'criterion' : 'criteria'} and editor deep links.
                </p>
                <Link
                  href="/dashboard/upgrade?from=ats"
                  className="text-micro font-mono text-accent hover:text-accent-hover transition-colors shrink-0"
                >
                  Upgrade →
                </Link>
              </div>
            )}

            {/* Required criteria */}
            <div className="border-t border-border pt-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                  Required Criteria
                </span>
                <span className="text-micro font-mono text-text-disabled">
                  {report.required.filter(c => c.present).length}/{report.required.length} passing
                </span>
              </div>
              <div className="divide-y divide-border">
                {sortCriteria(report.required).map((c, i) => (
                  <CriterionRow
                    key={i}
                    criterion={c}
                    isPro={isPro}
                    onOpenInEditor={openInEditor}
                  />
                ))}
              </div>
            </div>

            {/* Preferred criteria */}
            {report.preferred.length > 0 && (
              <div className="border-t border-border pt-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                    Preferred Criteria
                  </span>
                  <span className="text-micro font-mono text-text-disabled">
                    {report.preferred.filter(c => c.present).length}/{report.preferred.length} passing
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {sortCriteria(report.preferred).map((c, i) => (
                    <CriterionRow
                      key={i}
                      criterion={c}
                      isPro={isPro}
                      onOpenInEditor={openInEditor}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Editor CTA — all users */}
            <div className="border-t border-border pt-4 mb-5 flex items-center justify-between gap-4">
              <p className="text-small text-text-secondary">Ready to apply these fixes?</p>
              <Link
                href={`/editor/${selectedId}`}
                className="text-small font-mono text-accent hover:text-accent-hover transition-colors shrink-0"
              >
                Open editor →
              </Link>
            </div>

            {/* Accuracy note */}
            <p className="text-micro font-mono text-text-disabled opacity-60 pb-2">
              Pattern-based analysis · 88–92% accuracy · Criteria extracted from JD text only
            </p>

            {/* ── Save to Pipeline ───────────────────────── */}
            <div className="border-t border-border pt-5 mt-4">
              <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-3">
                Track in Pipeline
              </span>

              {pipelineSaved ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-small text-success">ATS score saved to pipeline.</p>
                  <Link href="/dashboard/applications" className="text-micro font-mono text-accent hover:text-accent-hover transition-colors">
                    View Pipeline →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-0 border-b border-border">
                    {(['select', 'new'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setPipelineMode(mode)}
                        className={cn(
                          'pb-2 mr-4 text-micro font-mono uppercase tracking-widest transition-colors border-b-2 -mb-px',
                          pipelineMode === mode
                            ? 'border-accent text-text-primary'
                            : 'border-transparent text-text-disabled hover:text-text-secondary',
                        )}
                      >
                        {mode === 'select' ? 'Existing application' : 'New application'}
                      </button>
                    ))}
                  </div>

                  {pipelineMode === 'select' ? (
                    applications.length === 0 ? (
                      <p className="text-micro text-text-disabled">No applications in your pipeline yet. Switch to "New application".</p>
                    ) : (
                      <select
                        value={pipelineAppId}
                        onChange={e => setPipelineAppId(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded text-small text-text-primary focus:border-accent focus:outline-none transition-colors"
                      >
                        <option value="">Select an application…</option>
                        {applications.map(a => (
                          <option key={a.id} value={a.id}>{a.company} — {a.role}</option>
                        ))}
                      </select>
                    )
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={newCompany}
                        onChange={e => setNewCompany(e.target.value)}
                        placeholder="Company"
                        className="px-3 py-2 bg-background border border-border rounded text-small text-text-primary focus:border-accent focus:outline-none transition-colors placeholder:text-text-disabled"
                      />
                      <input
                        value={newRole}
                        onChange={e => setNewRole(e.target.value)}
                        placeholder="Role title"
                        className="px-3 py-2 bg-background border border-border rounded text-small text-text-primary focus:border-accent focus:outline-none transition-colors placeholder:text-text-disabled"
                      />
                    </div>
                  )}

                  <button
                    onClick={saveToPipeline}
                    disabled={
                      pipelineSaving ||
                      (pipelineMode === 'select' && !pipelineAppId) ||
                      (pipelineMode === 'new' && (!newCompany.trim() || !newRole.trim()))
                    }
                    className={cn(
                      'w-full py-2 rounded text-small font-medium transition-colors',
                      !pipelineSaving &&
                      ((pipelineMode === 'select' && pipelineAppId) ||
                       (pipelineMode === 'new' && newCompany.trim() && newRole.trim()))
                        ? 'bg-accent text-text-inverse hover:bg-accent-hover'
                        : 'bg-border-subtle text-text-disabled cursor-not-allowed',
                    )}
                  >
                    {pipelineSaving ? 'Saving…' : 'Save ATS score to pipeline'}
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Session history */}
        {history.length > 1 && (
          <div className="mt-12 border-t border-border pt-6">
            <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">
              This Session
            </span>
            <div className="divide-y divide-border">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => { setReport(h.report); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className="w-full py-3 flex items-center justify-between gap-4 hover:bg-border-subtle/50 transition-colors -mx-2 px-2 rounded-sm"
                >
                  <span className="text-micro text-text-secondary text-left truncate">{h.snippet}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-micro font-mono text-text-disabled tabular-nums">
                      {h.pass_rate}/100
                    </span>
                    <span className={cn('text-micro font-mono', VERDICT_CONFIG[h.verdict].color)}>
                      {h.verdict === 'Strong Pass'
                        ? 'Pass'
                        : h.verdict === 'Likely Filtered'
                        ? 'Filtered'
                        : 'Marginal'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
