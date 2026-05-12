'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

// ─── Helpers ──────────────────────────────────────────────
function getLastQuarter() {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() // 0-based

  let start: Date, end: Date, label: string

  if (month < 3) {
    start = new Date(year - 1, 9, 1); end = new Date(year, 0, 1); label = `Q4 ${year - 1}`
  } else if (month < 6) {
    start = new Date(year, 0, 1); end = new Date(year, 3, 1); label = `Q1 ${year}`
  } else if (month < 9) {
    start = new Date(year, 3, 1); end = new Date(year, 6, 1); label = `Q2 ${year}`
  } else {
    start = new Date(year, 6, 1); end = new Date(year, 9, 1); label = `Q3 ${year}`
  }

  return { label, start, end }
}

function scoreGrade(s: number) {
  if (s >= 95) return 'A+'
  if (s >= 88) return 'A'
  if (s >= 80) return 'B+'
  if (s >= 70) return 'B'
  if (s >= 60) return 'C+'
  if (s >= 50) return 'C'
  return 'D'
}

function cn(...c: (string | boolean | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

// ─── Types ────────────────────────────────────────────────
interface WrappedData {
  quarter:             string
  scoreStart:          number | null
  scoreEnd:            number | null
  scorePeak:           number | null
  saves:               number
  totalViews:          number
  identifiedCompanies: number
  activeApps:          number
  closedApps:          number
  portfolioName:       string
}

// ─── Narrative — derived from data, no AI ─────────────────
function deriveNarrative(d: WrappedData): string {
  const delta =
    d.scoreStart !== null && d.scoreEnd !== null
      ? d.scoreEnd - d.scoreStart
      : null

  const hasActivity = d.saves > 0 || d.totalViews > 0 || d.activeApps > 0

  if (!hasActivity) {
    return `Nothing tracked for ${d.quarter} yet — every application you log, every edit you make, every view your portfolio gets, it all shows up here. Start now and this card fills itself.`
  }
  if (delta !== null && delta >= 15) {
    return `A breakthrough quarter — ${delta > 0 ? '+' : ''}${delta} points of signal growth across ${d.saves} editing session${d.saves === 1 ? '' : 's'}.`
  }
  if (delta !== null && delta >= 5) {
    return `Steady progress — signal up ${delta} points while ${d.totalViews} people checked you out.`
  }
  if (d.totalViews >= 50) {
    return `High-visibility quarter — ${d.totalViews} profile views, ${d.identifiedCompanies} from identified companies.`
  }
  if (d.activeApps >= 5) {
    return `An active search quarter — ${d.activeApps} application${d.activeApps === 1 ? '' : 's'} in the pipeline.`
  }
  return `${d.saves} editing session${d.saves === 1 ? '' : 's'}, ${d.totalViews} views, ${d.activeApps} application${d.activeApps === 1 ? '' : 's'} tracked.`
}

// ─── Page ─────────────────────────────────────────────────
export default function WrappedPage() {
  const router    = useRouter()
  const supabase  = createClient()
  const quarter   = getLastQuarter()

  const [data,        setData]        = useState<WrappedData | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [copied,      setCopied]      = useState(false)
  const [userInitial, setUserInitial] = useState('?')
  const [userName,    setUserName]    = useState('')
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const name = user.user_metadata?.full_name as string ?? ''
      setUserName(name || user.email?.split('@')[0] || '')
      setUserInitial((name || user.email || '?')[0].toUpperCase())

      const qStart = quarter.start.toISOString()
      const qEnd   = quarter.end.toISOString()

      // ── 1. Main portfolio ──────────────────────────────
      const { data: pData } = await supabase
        .from('portfolios')
        .select('id, data')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)

      const portfolio     = pData?.[0] ?? null
      const portfolioId   = portfolio?.id ?? null
      const portfolioName = (portfolio?.data as { name?: string })?.name ?? 'Your portfolio'

      // ── 2. Score history for the quarter ──────────────
      const scoreHistData = portfolioId
        ? (await supabase
            .from('score_history')
            .select('score, recorded_at')
            .eq('portfolio_id', portfolioId)
            .gte('recorded_at', qStart)
            .lt('recorded_at', qEnd)
            .order('recorded_at', { ascending: true })
          ).data ?? []
        : []

      // ── 3. Analytics (views) for the quarter ──────────
      const analyticsData = portfolioId
        ? (await supabase
            .from('analytics')
            .select('company')
            .eq('portfolio_id', portfolioId)
            .gte('visited_at', qStart)
            .lt('visited_at', qEnd)
          ).data ?? []
        : []

      // ── 4. Applications (current totals) ──────────────
      const { data: appsData } = await supabase
        .from('applications')
        .select('status')
        .eq('user_id', user.id)

      const apps    = appsData ?? []
      const active  = ['wishlist', 'applied', 'screening', 'interview']
      const closed  = ['offer', 'rejected', 'ghosted']

      const scores = scoreHistData as { score: number; recorded_at: string }[]
      const views  = analyticsData as { company: string | null }[]

      setData({
        quarter:             quarter.label,
        scoreStart:          scores[0]?.score ?? null,
        scoreEnd:            scores[scores.length - 1]?.score ?? null,
        scorePeak:           scores.length ? Math.max(...scores.map(s => s.score)) : null,
        saves:               scores.length,
        totalViews:          views.length,
        identifiedCompanies: views.filter(v => v.company && v.company !== 'Unknown').length,
        activeApps:          apps.filter(a => active.includes(a.status)).length,
        closedApps:          apps.filter(a => closed.includes(a.status)).length,
        portfolioName,
      })

      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleCopy() {
    if (!data) return
    const delta =
      data.scoreStart !== null && data.scoreEnd !== null
        ? data.scoreEnd - data.scoreStart
        : null
    const totalApps = data.activeApps + data.closedApps
    const text = [
      `${data.quarter} wrapped — ${data.portfolioName}`,
      ``,
      `Signal score  ${data.scoreEnd ?? '—'}${delta !== null ? `  (${delta >= 0 ? '+' : ''}${delta} pts)` : ''}`,
      data.identifiedCompanies > 0
        ? `${data.totalViews} views · ${data.identifiedCompanies} from identified companies`
        : `${data.totalViews} profile views`,
      totalApps > 0 ? `${totalApps} application${totalApps !== 1 ? 's' : ''} tracked` : '',
      ``,
      `Built on ForgeFolio — forgefolio.com`,
    ].filter(Boolean).join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="h-px bg-border animate-pulse" />
        </div>
      </div>
    )
  }

  const delta =
    data?.scoreStart !== null && data?.scoreEnd !== null &&
    data?.scoreStart !== undefined && data?.scoreEnd !== undefined
      ? data.scoreEnd - data.scoreStart
      : null

  const narrative  = data ? deriveNarrative(data) : ''
  const hasActivity = (data?.saves ?? 0) > 0 || (data?.totalViews ?? 0) > 0 || (data?.activeApps ?? 0) > 0

  const METRICS = [
    {
      label: 'Profile views',
      value: String(data?.totalViews ?? 0),
      note:  data?.totalViews === 0 ? 'Share your link' : 'this quarter',
    },
    {
      label: 'Companies',
      value: (data?.identifiedCompanies ?? 0) > 0
        ? String(data!.identifiedCompanies)
        : '—',
      note:  (data?.identifiedCompanies ?? 0) > 0
        ? 'identified viewers'
        : 'Upgrade to see who',
    },
    {
      label: 'Applications',
      value: String((data?.activeApps ?? 0) + (data?.closedApps ?? 0)),
      note:  `${data?.activeApps ?? 0} active · ${data?.closedApps ?? 0} closed`,
    },
    {
      label: 'Score edits',
      value: String(data?.saves ?? 0),
      note:  data?.scorePeak !== null && data?.scorePeak !== undefined
        ? `Peak ${data.scorePeak}`
        : 'No saves yet',
    },
  ]

  return (
    <div className="min-h-screen bg-background">

      <main className="mx-auto max-w-4xl px-6 py-10 lg:px-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-10 animate-slide-up-1">
          <div>
            <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-1">
              Career signal
            </span>
            <h1 className="text-h2 font-bold text-text-primary tracking-tight">Quarter Wrapped</h1>
          </div>
          <Link
            href="/dashboard/score"
            className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors shrink-0 mt-1"
          >
            ← Timeline
          </Link>
        </div>

        {/* ── The Card ────────────────────────────────────── */}
        <div className="wc-card animate-slide-up-2" id="wrapped-card">

          {/* Quarter label */}
          <div className="wc-quarter">{data?.quarter ?? quarter.label} · Career Signal</div>

          {/* Score journey */}
          <div className="wc-score-row">
            {data?.scoreStart !== null && data?.scoreEnd !== null &&
             data?.scoreStart !== undefined && data?.scoreEnd !== undefined ? (
              <>
                <span className="wc-score">{data.scoreStart}</span>
                <span className="wc-arrow">→</span>
                <span className={cn(
                  'wc-score',
                  delta !== null && delta > 0 && 'wc-score--up',
                  delta !== null && delta < 0 && 'wc-score--down',
                )}>
                  {data.scoreEnd}
                </span>
                {delta !== null && (
                  <span className={cn(
                    'wc-delta',
                    delta > 0 ? 'wc-delta--pos' : delta < 0 ? 'wc-delta--neg' : 'wc-delta--flat',
                  )}>
                    {delta > 0 ? '+' : ''}{delta}
                  </span>
                )}
              </>
            ) : (
              <span className="wc-score wc-score--empty">—</span>
            )}
          </div>

          {/* Grade + portfolio */}
          <div className="wc-grade">
            {data?.scoreEnd !== null && data?.scoreEnd !== undefined
              ? `Grade ${scoreGrade(data.scoreEnd)} · ${data.portfolioName}`
              : data?.portfolioName ?? 'No score yet'}
          </div>

          {/* Divider */}
          <div className="wc-divider" />

          {/* Metrics */}
          <div className="wc-metrics">
            {METRICS.map(({ label, value, note }) => (
              <div key={label} className="wc-metric">
                <span className="wc-metric-val">{value}</span>
                <span className="wc-metric-label">{label}</span>
                {note && <span className="wc-metric-note">{note}</span>}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="wc-divider" />

          {/* Narrative */}
          <p className="wc-narrative">{narrative}</p>

          {/* Watermark */}
          <div className="wc-watermark">ForgeFolio · Career Signal OS</div>
        </div>

        {/* ── Actions ──────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mt-6 animate-slide-up-3">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 text-micro font-mono border border-border px-4 py-2.5 text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors"
          >
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <rect x="4.5" y="4.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M7.5 4.5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v3.5a1 1 0 0 0 1 1h1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Copy summary
              </>
            )}
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 text-micro font-mono border border-border px-4 py-2.5 text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M3 4V2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <rect x="1.5" y="4" width="9" height="5" rx=".75" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M3.5 7H8.5M3.5 9H8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Save as PDF
          </button>

          <Link
            href="/dashboard/score"
            className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors"
          >
            View full timeline →
          </Link>
        </div>

        {/* Empty state nudge */}
        {!hasActivity && (
          <div className="mt-10 border-l-2 border-border pl-4 animate-slide-up-4">
            <p className="text-small text-text-secondary mb-4">
              No activity recorded for {quarter.label} yet. Edit your portfolio, track applications,
              and share your link — your card fills automatically.
            </p>
            <div className="flex flex-wrap gap-5">
              <Link href="/dashboard" className="text-micro font-mono text-accent hover:opacity-70 transition-opacity">
                Portfolios →
              </Link>
              <Link href="/dashboard/applications" className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors">
                Track applications →
              </Link>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
