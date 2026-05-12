'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import type { GhostReport, GhostVerdict, Portfolio } from '@/lib/types'

// ─── Constants ───────────────────────────────────────────────

type PostingAge = '< 2 weeks' | '2–4 weeks' | '1–2 months' | '2+ months'

const SCAN_STEPS = [
  'Checking requirements specificity…',
  'Analysing seniority alignment…',
  'Verifying legal compliance signals…',
  'Reading hiring urgency indicators…',
  'Evaluating stack specificity…',
  'Reviewing benefits language…',
  'Finalising analysis…',
]

const VERDICT_CONFIG: Record<GhostVerdict, { color: string; bg: string; label: string; action: string }> = {
  'Likely Active': {
    color:  'text-success',
    bg:     'bg-success/5 border-success/20',
    label:  'Likely Active',
    action: 'Posting shows real hiring intent.',
  },
  'Uncertain': {
    color:  'text-warning',
    bg:     'bg-warning/5 border-warning/20',
    label:  'Uncertain',
    action: 'Hiring intent unclear — verify activity on LinkedIn before investing time.',
  },
  'Likely Ghost': {
    color:  'text-error',
    bg:     'bg-error/5 border-error/20',
    label:  'Likely Ghost',
    action: 'High ghost signals detected — check posting age before applying.',
  },
}

const WEIGHT_LABEL: Record<string, string> = {
  high:   'High',
  medium: 'Med',
  low:    'Low',
}

// ─── Portfolio odds ───────────────────────────────────────────
function portfolioOdds(score: number, seniorityLevel: string): 'Favorable' | 'Borderline' | 'Thin' {
  const needed = seniorityLevel === 'staff' ? 82 : seniorityLevel === 'senior' ? 68 : seniorityLevel === 'mid' ? 55 : 45
  if (score >= needed + 12) return 'Favorable'
  if (score >= needed - 10) return 'Borderline'
  return 'Thin'
}

// ─── Icons ────────────────────────────────────────────────────
function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

// ─── Types ────────────────────────────────────────────────────
interface AppStub { id: string; company: string; role: string }

// ─── Page ─────────────────────────────────────────────────────
export default function GhostDetectorPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [userName,    setUserName]    = useState('')
  const [userInitial, setUserInitial] = useState('?')
  const [userId,      setUserId]      = useState<string>('')
  const [portfolios,  setPortfolios]  = useState<Portfolio[]>([])
  const [selectedId,  setSelectedId]  = useState<string>('')

  const [jd,          setJd]          = useState('')
  const [postingAge,  setPostingAge]  = useState<PostingAge | ''>('')
  const [report,      setReport]      = useState<GhostReport | null>(null)
  const [analyzing,   setAnalyzing]   = useState(false)
  const [scanStep,    setScanStep]    = useState(0)
  const [error,       setError]       = useState<string | null>(null)
  const [history,     setHistory]     = useState<Array<{ snippet: string; confidence: number; verdict: GhostVerdict; report: GhostReport }>>([])

  // Pipeline linking state
  const [applications,   setApplications]   = useState<AppStub[]>([])
  const [pipelineAppId,  setPipelineAppId]  = useState<string>('') // '' = none selected
  const [pipelineMode,   setPipelineMode]   = useState<'select' | 'new'>('select')
  const [newCompany,     setNewCompany]     = useState('')
  const [newRole,        setNewRole]        = useState('')
  const [pipelineSaving, setPipelineSaving] = useState(false)
  const [pipelineSaved,  setPipelineSaved]  = useState(false)

  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
          .update({ ghost_score: report.hiring_confidence })
          .eq('id', pipelineAppId)
      } else if (pipelineMode === 'new' && newCompany.trim() && newRole.trim()) {
        const { data: inserted } = await supabase
          .from('applications')
          .insert({
            user_id:     userId,
            company:     newCompany.trim(),
            role:        newRole.trim(),
            status:      'wishlist',
            ghost_score: report.hiring_confidence,
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

  async function analyse() {
    if (jd.trim().length < 150 || analyzing) return
    setAnalyzing(true)
    setReport(null)
    setError(null)
    setScanStep(0)

    // Parallel: API call + minimum 3.5s scan animation
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 60_000)

    const apiCall = fetch('/api/intelligence/ghost', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        jd:         jd.trim(),
        postingAge: postingAge || null,
      }),
      signal:  controller.signal,
    })

    const minDelay = new Promise<void>(res => setTimeout(res, 3500))

    // Run scan step animation
    let step = 0
    scanTimerRef.current = setInterval(() => {
      step = Math.min(step + 1, SCAN_STEPS.length - 1)
      setScanStep(step)
    }, 600)

    try {
      const [res] = await Promise.all([apiCall, minDelay])
      clearTimeout(timeoutId)
      if (scanTimerRef.current) clearInterval(scanTimerRef.current)

      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Analysis failed')
        return
      }

      const data = await res.json() as GhostReport
      setReport(data)

      const snippet = jd.trim().slice(0, 55) + (jd.trim().length > 55 ? '…' : '')
      setHistory(prev => [{ snippet, confidence: data.hiring_confidence, verdict: data.verdict, report: data }, ...prev.slice(0, 4)])
    } catch (err) {
      clearTimeout(timeoutId)
      const isAbort = err instanceof Error && err.name === 'AbortError'
      setError(isAbort ? 'Analysis timed out (60s) — please try again.' : 'Network error — please try again')
    } finally {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current)
      setAnalyzing(false)
    }
  }

  const selectedPortfolio = portfolios.find(p => p.id === selectedId)
  const portfolioScore    = selectedPortfolio?.score ?? null
  const isPro             = true
  const charCount         = jd.trim().length
  const readyToSubmit     = charCount >= 150 && !analyzing

  return (
    <div className="min-h-screen bg-background">

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
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-slow shrink-0" />
            <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">
              Ghost Analysis // Pattern Model
            </span>
          </div>
          <h1 className="text-h3 font-bold text-text-primary tracking-tight mt-2">Ghost Job Detector</h1>
          <p className="text-small text-text-secondary mt-1">
            1 in 5 job postings is a ghost — active with no real hiring intent. Paste a JD to find out.
          </p>
        </div>

        {/* Input */}
        {!analyzing && !report && (
          <div className="space-y-4 animate-slide-up-2">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                  Job Description
                </label>
                <span className={cn(
                  'text-micro font-mono tabular-nums',
                  charCount === 0 ? 'text-text-disabled' : charCount < 150 ? 'text-warning' : 'text-success'
                )}>
                  {charCount < 150 ? `${charCount} / 150 min` : `${charCount} chars`}
                </span>
              </div>
              <textarea
                value={jd}
                onChange={e => setJd(e.target.value)}
                rows={10}
                placeholder="Paste the full job description here…"
                className="w-full px-3 py-2.5 bg-background border border-border rounded text-small text-text-primary focus:border-accent focus:outline-none transition-colors placeholder:text-text-disabled resize-none leading-relaxed"
              />
              {charCount < 150 && charCount > 0 && (
                <p className="text-micro text-warning">Need at least 150 characters for accurate analysis</p>
              )}
            </div>

            {/* Posting age — only shown once user has pasted enough */}
            {charCount > 100 && (
              <div className="flex flex-col gap-1.5 animate-fade-in">
                <label className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                  Posting Age <span className="normal-case tracking-normal text-text-disabled opacity-60">— optional, improves accuracy</span>
                </label>
                <select
                  value={postingAge}
                  onChange={e => setPostingAge(e.target.value as PostingAge | '')}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-small text-text-primary focus:border-accent focus:outline-none transition-colors"
                >
                  <option value="">Unknown</option>
                  <option value="< 2 weeks">&lt; 2 weeks</option>
                  <option value="2–4 weeks">2–4 weeks</option>
                  <option value="1–2 months">1–2 months</option>
                  <option value="2+ months">2+ months (stale)</option>
                </select>
              </div>
            )}

            <button
              onClick={analyse}
              disabled={!readyToSubmit}
              className={cn(
                'w-full py-2.5 rounded text-small font-medium transition-colors',
                readyToSubmit
                  ? 'bg-accent text-text-inverse hover:bg-accent-hover'
                  : 'bg-border-subtle text-text-disabled cursor-not-allowed'
              )}
            >
              Analyse Job Posting
            </button>

            {error && (
              <p className="text-micro text-error">{error}</p>
            )}
          </div>
        )}

        {/* Scanning state */}
        {analyzing && (
          <div className="py-16 animate-fade-in">
            <div className="flex gap-1 mb-8">
              {SCAN_STEPS.slice(0, -1).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-px flex-1 transition-all duration-500',
                    i <= scanStep ? 'bg-accent' : 'bg-border'
                  )}
                />
              ))}
            </div>
            <p className="text-small font-mono text-text-primary">
              {SCAN_STEPS[scanStep]}
              <span className="animate-[mirror-cursor_1s_ease-in-out_infinite]">▌</span>
            </p>
            <p className="text-micro text-text-disabled mt-1">Typically 4–6 seconds</p>
          </div>
        )}

        {/* Result */}
        {report && !analyzing && (
          <div className="space-y-0 animate-fade-in">

            {/* Reset */}
            <div className="flex items-center justify-between mb-8">
              <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Analysis complete</span>
              <button
                onClick={() => { setReport(null); setJd(''); setPostingAge(''); setError(null); setPipelineSaved(false); setPipelineAppId(''); setNewCompany(''); setNewRole('') }}
                className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors"
              >
                Analyse another →
              </button>
            </div>

            {/* Confidence + Verdict */}
            <div className={cn('rounded border px-6 py-5 mb-6', VERDICT_CONFIG[report.verdict].bg)}>
              <div className="flex items-end justify-between mb-3">
                <div className="flex items-baseline gap-3">
                  <span className={cn('font-mono font-bold leading-none tabular-nums', VERDICT_CONFIG[report.verdict].color)}
                    style={{ fontSize: 'clamp(3.5rem, 10vw, 5.5rem)' }}>
                    {report.hiring_confidence}
                  </span>
                  <span className="text-small text-text-disabled mb-1">/100</span>
                </div>
                <span className={cn('font-mono text-small font-bold uppercase tracking-wide mb-1', VERDICT_CONFIG[report.verdict].color)}>
                  {VERDICT_CONFIG[report.verdict].label}
                </span>
              </div>
              <p className="text-small text-text-secondary">{VERDICT_CONFIG[report.verdict].action}</p>
              {report.top_concern && (
                <p className="text-micro font-mono text-text-disabled mt-2">
                  Primary signal — {report.top_concern}
                </p>
              )}
            </div>

            {/* Signal grid */}
            <div className="border-t border-border pt-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Signal Forensics</span>
                <span className="text-micro font-mono text-text-disabled">{report.signals.filter(s => s.detected).length} of 6 detected</span>
              </div>
              <div className="divide-y divide-border">
                {report.signals.map((signal) => (
                  <div key={signal.name} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          signal.detected ? 'bg-error' : 'bg-success'
                        )} />
                        <span className={cn(
                          'text-micro font-mono uppercase tracking-widest',
                          signal.detected ? 'text-text-primary' : 'text-text-disabled'
                        )}>
                          {signal.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-micro font-mono text-text-disabled">{WEIGHT_LABEL[signal.weight]}</span>
                        <span className={cn(
                          'text-micro font-mono',
                          signal.detected ? 'text-error' : 'text-text-disabled'
                        )}>
                          {signal.detected ? 'Detected' : 'Clear'}
                        </span>
                      </div>
                    </div>
                    {signal.detected && signal.evidence && isPro && (
                      <p className="text-micro text-text-disabled mt-1.5 pl-3.5 leading-relaxed">
                        {signal.evidence}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio context — Pro feature */}
            {portfolioScore !== null && (
              <div className="border-t border-border pt-5 mb-6">
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-3">Your Signal vs This Role</span>
                {isPro ? (
                  <>
                    {(() => {
                      const odds = portfolioOdds(portfolioScore, report.seniority_level)
                      const oddsColor = odds === 'Favorable' ? 'text-success' : odds === 'Borderline' ? 'text-warning' : 'text-error'
                      const seniorityLabel = report.seniority_level.charAt(0).toUpperCase() + report.seniority_level.slice(1)
                      return (
                        <div className="grid grid-cols-[1fr_auto] gap-4 items-baseline">
                          <p className="text-small text-text-secondary">
                            Your signal score is <span className="font-mono font-bold text-text-primary">{portfolioScore}/100</span>.
                            Role reads as <span className="font-mono text-text-primary">{seniorityLabel}-level</span>.
                          </p>
                          <span className={cn('text-small font-mono font-bold shrink-0', oddsColor)}>{odds}</span>
                        </div>
                      )
                    })()}
                    {portfolios.length > 1 && (
                      <div className="flex items-center gap-1.5 mt-3">
                        <span className="text-micro text-text-disabled">Comparing against</span>
                        {portfolios.slice(0, 3).map(p => (
                          <button
                            key={p.id}
                            onClick={() => setSelectedId(p.id)}
                            className={cn(
                              'text-micro font-mono px-2 py-0.5 rounded-sm border transition-colors',
                              selectedId === p.id
                                ? 'border-accent text-accent'
                                : 'border-border text-text-disabled hover:text-text-secondary'
                            )}
                          >
                            {p.data?.name ?? 'Portfolio'}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-4 py-1">
                    <p className="text-small text-text-disabled">
                      See how your signal score compares to this role&apos;s seniority requirements.
                    </p>
                    <Link
                      href="/dashboard/upgrade?from=ghost"
                      className="text-micro font-mono text-accent hover:text-accent-hover transition-colors shrink-0"
                    >
                      Upgrade →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Accuracy note */}
            <p className="text-micro font-mono text-text-disabled opacity-60 pb-2">
              Pattern-based analysis · 65–80% accuracy · Not a guarantee
            </p>

            {/* ── Save to Pipeline ───────────────────────── */}
            <div className="border-t border-border pt-5 mt-4">
              <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-3">
                Track in Pipeline
              </span>

              {pipelineSaved ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-small text-success">Ghost score saved to pipeline.</p>
                  <Link href="/dashboard/applications" className="text-micro font-mono text-accent hover:text-accent-hover transition-colors">
                    View Pipeline →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Mode toggle */}
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
                    {pipelineSaving ? 'Saving…' : 'Save ghost score to pipeline'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Session history */}
        {history.length > 1 && (
          <div className="mt-12 border-t border-border pt-6">
            <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">This Session</span>
            <div className="divide-y divide-border">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => { setReport(h.report); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className="w-full py-3 flex items-center justify-between gap-4 hover:bg-border-subtle/50 transition-colors -mx-2 px-2 rounded-sm"
                >
                  <span className="text-micro text-text-secondary text-left truncate">{h.snippet}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-micro font-mono text-text-disabled tabular-nums">{h.confidence}/100</span>
                    <span className={cn('text-micro font-mono', VERDICT_CONFIG[h.verdict].color)}>
                      {h.verdict === 'Likely Active' ? 'Active' : h.verdict === 'Likely Ghost' ? 'Ghost' : 'Uncertain'}
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
