'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import AppNav from '@/components/ui/AppNav'
import { Button } from '@/components/ui/button'
import type { Portfolio } from '@/lib/types'
import { cn } from '@/lib/utils'
import { track } from '@/lib/funnel'

// ─── Types ────────────────────────────────────────────────
interface Application {
  id:         string
  company:    string
  role:       string
  status:     string
  updated_at: string
}

interface ScorePoint { score: number; recorded_at: string }

interface HomeData {
  portfolios:           Portfolio[]
  userName:             string
  userInitial:          string
  college:              string
  apps:                 Application[]
  recentViews:          { company: string; visited_at: string }[]
  scoreHistory:         ScorePoint[]
  publishedPortfolioId: string
}

// ─── Helpers ──────────────────────────────────────────────
function scoreGrade(s: number) {
  if (s >= 95) return 'A+'
  if (s >= 88) return 'A'
  if (s >= 80) return 'B+'
  if (s >= 70) return 'B'
  if (s >= 60) return 'C+'
  if (s >= 50) return 'C'
  return 'D'
}

function scoreColor(s: number) {
  if (s >= 80) return 'text-success'
  if (s >= 60) return 'text-warning'
  return 'text-error'
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60)    return 'Just now'
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const ACTIVE_STATUSES = ['applied', 'screening', 'interview']

function isStale(app: Application) {
  if (!ACTIVE_STATUSES.includes(app.status)) return false
  return Math.floor((Date.now() - new Date(app.updated_at).getTime()) / (1000 * 60 * 60 * 24)) >= 14
}

// ─── Sparkline ────────────────────────────────────────────
function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null
  const W = 96, H = 28
  const min = Math.min(...points) - 2
  const max = Math.max(...points) + 2
  const x = (i: number) => (i / (points.length - 1)) * W
  const y = (v: number) => H - ((v - min) / (max - min)) * H
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const trend = points[points.length - 1] - points[0]
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <path d={d} fill="none" stroke={trend >= 0 ? '#166534' : '#991B1B'} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// ─── Priority actions ─────────────────────────────────────
function buildActions(data: HomeData) {
  const actions: { label: string; href: string; why: string }[] = []
  const best = data.portfolios.find(p => p.score != null) ?? data.portfolios[0]

  const staleApps = data.apps.filter(isStale)
  if (staleApps.length > 0)
    actions.push({ label: `Follow up on ${staleApps.length} stale application${staleApps.length > 1 ? 's' : ''}`, href: '/dashboard/applications', why: '14+ days no response — follow up or mark ghosted' })

  const published = data.portfolios.filter(p => p.is_published)
  if (published.length === 0 && data.portfolios.length > 0 && best)
    actions.push({ label: 'Publish your portfolio', href: `/editor/${best.id}`, why: 'No one can find you — publish to start getting analytics' })

  if (best?.score != null && best.score < 70)
    actions.push({ label: 'Improve your signal score', href: `/editor/${best.id}`, why: `Score is ${best.score}/100 — add metrics to bullets to push above 70` })

  if (data.apps.length === 0)
    actions.push({ label: 'Track your first application', href: '/dashboard/applications', why: 'The pipeline catches ghost jobs and tracks your response rate' })

  if (data.portfolios.length === 0)
    actions.push({ label: 'Build your first portfolio', href: '/onboarding', why: 'Takes 3 minutes — paste your resume and AI does the rest' })

  return actions.slice(0, 3)
}

// ─── Intelligence tool icons ──────────────────────────────
function MirrorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M3 15c0-2.5 2.7-4 6-4s6 1.5 6 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}
function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 4h14M5 9h8M8 14h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function GhostIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 9V8a5 5 0 0 1 10 0v7l-2-2-2 2-2-2-2 2V9z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <circle cx="7" cy="9" r="1" fill="currentColor"/>
      <circle cx="11" cy="9" r="1" fill="currentColor"/>
    </svg>
  )
}
function OfferIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 12l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 6h2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const INTEL_TOOLS = [
  { label: 'Career Mirror',   desc: 'How recruiters see you',    href: '/dashboard/intelligence/mirror', Icon: MirrorIcon },
  { label: 'ATS Filter',      desc: 'See what fails the scan',   href: '/dashboard/intelligence/ats',    Icon: FilterIcon },
  { label: 'Ghost Detector',  desc: 'Is this job actually real?',href: '/dashboard/intelligence/ghost',  Icon: GhostIcon  },
  { label: 'Offer Analyzer',  desc: 'Is the salary fair?',       href: '/dashboard/intelligence/offer',  Icon: OfferIcon  },
]

// ─── Page ─────────────────────────────────────────────────
export default function DashboardPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [data,    setData]    = useState<HomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied,  setCopied]  = useState<string | null>(null)
  const [liveView,setLiveView]= useState<{ company: string } | null>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/auth/login'); return }

        const fullName    = user.user_metadata?.full_name as string ?? ''
        const userName    = fullName || user.email?.split('@')[0] || 'there'
        const userInitial = (fullName || userName)[0]?.toUpperCase() ?? '?'
        const college     = user.user_metadata?.college as string ?? ''

        const [portfolioRes, appsRes, historyRes, analyticsRes] = await Promise.all([
          fetch('/api/portfolio'),
          supabase.from('applications').select('id,company,role,status,updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(20),
          supabase.from('score_history').select('score,recorded_at').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(10),
          supabase.from('portfolios').select('id').eq('user_id', user.id).eq('is_published', true).limit(1),
        ])

        const portfolios: Portfolio[] = portfolioRes.ok ? await portfolioRes.json() : []
        const apps       = (appsRes.data ?? []) as Application[]
        const scoreHistory = ((historyRes.data ?? []) as ScorePoint[]).reverse()

        let recentViews: { company: string; visited_at: string }[] = []
        const firstPublished = (analyticsRes.data ?? [])[0]
        if (firstPublished) {
          const { data: views } = await supabase
            .from('analytics')
            .select('company, visited_at')
            .eq('portfolio_id', firstPublished.id)
            .order('visited_at', { ascending: false })
            .limit(5)
          recentViews = (views ?? []).map(v => ({ company: v.company ?? 'Unknown', visited_at: v.visited_at }))
        }

        const result = { portfolios, userName, userInitial, college, apps, recentViews, scoreHistory, publishedPortfolioId: firstPublished?.id ?? '' }
        setData(result)
        track('dashboard_page_view', {
          has_portfolio: portfolios.length > 0,
          has_score:     portfolios.some(p => p.score != null),
          has_apps:      apps.length > 0,
          has_views:     recentViews.length > 0,
        })
      } catch {
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime live view pulse
  useEffect(() => {
    const id = data?.publishedPortfolioId
    if (!id) return
    const channel = supabase
      .channel(`live_views_${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'analytics', filter: `portfolio_id=eq.${id}` }, (payload) => {
        const company = (payload.new as { company?: string }).company ?? ''
        setLiveView({ company: company || 'Someone' })
        track('dashboard_live_view_received', { company: company || 'unknown' })
        setTimeout(() => setLiveView(null), 8000)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [data?.publishedPortfolioId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(id: string) {
    if (!confirm('Delete this portfolio? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' })
      if (res.ok && data) setData({ ...data, portfolios: data.portfolios.filter(p => p.id !== id) })
    } catch { /* silent */ }
  }

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`).then(() => {
      setCopied(slug)
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopied(null), 2000)
    }).catch(() => {})
  }

  // ── Loading skeleton ──────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav />
        <main className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
          <div className="h-7 w-48 rounded bg-border animate-shimmer mb-10" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            <div className="lg:col-span-2 h-52 rounded-xl bg-border animate-shimmer" />
            <div className="flex flex-col gap-4">
              <div className="flex-1 rounded-xl bg-border animate-shimmer" />
              <div className="flex-1 rounded-xl bg-border animate-shimmer" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  const { portfolios, userName, userInitial, college, apps, recentViews, scoreHistory } = data!
  const bestPortfolio   = portfolios.find(p => p.score != null) ?? portfolios[0] ?? null
  const activeApps      = apps.filter(a => ACTIVE_STATUSES.includes(a.status))
  const staleCount      = apps.filter(isStale).length
  const identifiedViews = recentViews.filter(v => v.company && v.company !== 'Unknown')
  const scoreTrend      = scoreHistory.map(h => h.score)
  const scoreDelta      = scoreTrend.length >= 2 ? scoreTrend[scoreTrend.length - 1] - scoreTrend[0] : null

  const warmSignals = identifiedViews
    .filter(v => {
      const viewed = v.company.toLowerCase()
      return !apps.some(a => {
        const tracked = a.company.toLowerCase()
        return tracked.includes(viewed) || viewed.includes(tracked)
      })
    })
    .slice(0, 3)

  const actions = buildActions(data!)

  const hour  = new Date().getHours()
  const month = new Date().getMonth() + 1
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = userName.split(' ')[0]

  const seasonNudge: string | null = (() => {
    if (month >= 8 && month <= 11) {
      const score = bestPortfolio?.score ?? null
      if (score !== null && score < 70) return `Placement season is active — your score is ${score}. Push above 70 before companies start shortlisting.`
      if (score !== null && score >= 70) return `Placement season is active and your signal is strong at ${score}. Keep it updated.`
      return 'Placement season is active. Build and publish your portfolio before companies start shortlisting.'
    }
    if (month >= 12 || month <= 2) return 'Lateral move window is open — Jan–Mar is when companies backfill.'
    if (month >= 3 && month <= 4)  return 'Pre-placement prep window. Placement season starts in August — 4 months to sharpen your signal.'
    return null
  })()

  return (
    <div className="min-h-screen bg-background">
      <AppNav userName={userName} userInitial={userInitial} />

      <main className="mx-auto max-w-5xl px-6 py-10 lg:px-8">

        {/* ── Greeting ─────────────────────────────────────── */}
        <div className="mb-10 animate-slide-up-1">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            {greeting}, {firstName}.
          </h1>
          {seasonNudge && (
            <p className="text-sm text-text-secondary mt-1.5 max-w-lg leading-relaxed">
              {seasonNudge}
            </p>
          )}
        </div>

        {/* ── Hero metrics row ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8 animate-slide-up-2">

          {/* Signal Score — dominant (2/3 width) */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-background p-8">
            <p className="text-[11px] font-mono text-text-disabled uppercase tracking-widest mb-5">
              Signal Score
            </p>
            {bestPortfolio?.score != null ? (
              <>
                <div className="flex items-end gap-4 mb-4">
                  <span className={cn('text-[72px] font-black font-mono tabular-nums leading-none', scoreColor(bestPortfolio.score))}>
                    {bestPortfolio.score}
                  </span>
                  <div className="mb-1">
                    <span className="text-2xl font-bold text-text-disabled">/100</span>
                    <div className="text-base font-mono font-bold text-accent mt-1">{scoreGrade(bestPortfolio.score)}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-border rounded-full overflow-hidden mb-4">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      bestPortfolio.score >= 80 ? 'bg-success' : bestPortfolio.score >= 60 ? 'bg-warning' : 'bg-error'
                    )}
                    style={{ width: `${bestPortfolio.score}%` }}
                  />
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  {scoreDelta !== null && scoreDelta !== 0 && (
                    <span className={cn('text-xs font-mono', scoreDelta > 0 ? 'text-success' : 'text-error')}>
                      {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} since start
                    </span>
                  )}
                  <Sparkline points={scoreTrend.slice(-6)} />
                  {bestPortfolio.is_published && bestPortfolio.slug && (
                    <Link
                      href={`/badge/${bestPortfolio.slug}`}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-text-disabled hover:text-accent transition-colors"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      Share score →
                    </Link>
                  )}
                  {college ? (
                    <span className="text-xs font-mono text-text-disabled">{college}</span>
                  ) : (
                    <Link href="/dashboard/settings" className="text-xs font-mono text-text-disabled hover:text-text-secondary transition-colors">
                      + Add college
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <div>
                <p className="text-5xl font-black text-border mb-4">—</p>
                <p className="text-sm text-text-secondary mb-4">Build a portfolio to get your signal score</p>
                <Link href="/onboarding" className="text-sm font-mono text-accent hover:text-accent/80 transition-colors">
                  Start now →
                </Link>
              </div>
            )}
          </div>

          {/* Pipeline + Views stacked (1/3 width) */}
          <div className="flex flex-col gap-4">
            {/* Pipeline */}
            <div className="flex-1 rounded-xl border border-border bg-background p-6">
              <p className="text-[11px] font-mono text-text-disabled uppercase tracking-widest mb-4">Pipeline</p>
              {apps.length === 0 ? (
                <>
                  <p className="text-sm text-text-disabled mb-3 leading-relaxed">Start tracking applications</p>
                  <Link href="/dashboard/applications" className="text-xs font-mono text-accent hover:text-accent/80 transition-colors">
                    Add first →
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-black font-mono text-text-primary tabular-nums leading-none">
                      {activeApps.length}
                    </span>
                    <span className="text-sm text-text-disabled">active</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {staleCount > 0 && (
                      <span className="text-xs font-mono text-warning">{staleCount} stale</span>
                    )}
                    <Link href="/dashboard/applications" className="text-xs font-mono text-text-disabled hover:text-text-secondary transition-colors">
                      {apps.length} total →
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Views */}
            <div className="flex-1 rounded-xl border border-border bg-background p-6">
              <p className="text-[11px] font-mono text-text-disabled uppercase tracking-widest mb-4">Views</p>
              {recentViews.length === 0 ? (
                <>
                  <p className="text-sm text-text-disabled mb-3 leading-relaxed">Publish to see who's watching</p>
                  {bestPortfolio && !bestPortfolio.is_published && (
                    <Link href={`/editor/${bestPortfolio.id}`} className="text-xs font-mono text-accent hover:text-accent/80 transition-colors">
                      Publish →
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-black font-mono text-text-primary tabular-nums leading-none">
                      {recentViews.length}
                    </span>
                    <span className="text-sm text-text-disabled">recent</span>
                  </div>
                  {identifiedViews[0] && (
                    <p className="text-xs font-mono text-text-secondary">
                      {identifiedViews[0].company} · {timeAgo(identifiedViews[0].visited_at)}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Warm signals ─────────────────────────────────── */}
        {warmSignals.length > 0 && (
          <div className="mb-8 animate-slide-up-3">
            <div className="flex items-center gap-2 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <h2 className="text-sm font-semibold text-text-primary">Warm Signals</h2>
              <span className="text-xs text-text-disabled">— companies who viewed but haven&apos;t heard from you</span>
            </div>
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {warmSignals.map((v, i) => (
                <div key={`${v.company}-${i}`} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary">{v.company}</p>
                    <p className="text-xs text-text-disabled mt-0.5">Viewed {timeAgo(v.visited_at)}</p>
                  </div>
                  <Link
                    href={`/dashboard/applications?company=${encodeURIComponent(v.company)}`}
                    className="text-xs font-mono text-accent hover:text-accent/80 transition-colors shrink-0"
                    onClick={() => track('dashboard_warm_signal_click', { company: v.company })}
                  >
                    Add to pipeline →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Priority actions ─────────────────────────────── */}
        {actions.length > 0 && (
          <div className="mb-10 animate-slide-up-3">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Do this today</h2>
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {actions.map((action, i) => (
                <Link
                  key={i}
                  href={action.href}
                  className="flex items-start justify-between gap-4 px-5 py-4 group hover:bg-border-subtle/40 transition-colors"
                  onClick={() => track('dashboard_action_click', { label: action.label, href: action.href })}
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                      {action.label}
                    </p>
                    <p className="text-xs text-text-disabled mt-0.5">{action.why}</p>
                  </div>
                  <span className="text-text-disabled group-hover:text-accent transition-colors mt-0.5 shrink-0">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Bottom row: Applications + Intelligence ───────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12 animate-slide-up-4">

          {/* Recent applications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-primary">Recent Applications</h2>
              <Link href="/dashboard/applications" className="text-xs text-text-disabled hover:text-text-secondary transition-colors">
                View all →
              </Link>
            </div>
            {apps.length === 0 ? (
              <div className="rounded-xl border border-border px-5 py-8 text-center">
                <p className="text-sm text-text-disabled mb-3">Nothing tracked yet</p>
                <Link href="/dashboard/applications" className="text-xs font-mono text-accent hover:text-accent/80 transition-colors">
                  Start tracking →
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                {apps.slice(0, 5).map(app => (
                  <div key={app.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{app.company}</p>
                      <p className="text-xs text-text-disabled truncate">{app.role}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isStale(app) && (
                        <span className="text-[10px] font-mono text-warning">Stale</span>
                      )}
                      <span className="text-[10px] font-mono text-text-disabled">{timeAgo(app.updated_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Intelligence 2×2 grid */}
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-4">Intelligence</h2>
            <div className="grid grid-cols-2 gap-3">
              {INTEL_TOOLS.map(({ label, desc, href, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex flex-col gap-3 p-4 rounded-xl border border-border hover:border-accent/30 hover:bg-border-subtle/40 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg border border-border bg-background flex items-center justify-center text-text-secondary group-hover:text-accent group-hover:border-accent/30 transition-colors">
                    <Icon />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary leading-tight">{label}</p>
                    <p className="text-xs text-text-disabled mt-0.5 leading-tight">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Portfolios ────────────────────────────────────── */}
        <div className="pt-8 border-t border-border animate-slide-up-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-text-primary">
              Your Portfolios
              <span className="ml-2 text-text-disabled font-normal">({portfolios.length})</span>
            </h2>
            <Button asChild size="md">
              <Link href="/onboarding">
                <PlusIcon /> New portfolio
              </Link>
            </Button>
          </div>

          {portfolios.length === 0 ? (
            <div className="rounded-xl border border-border px-5 py-12 text-center">
              <p className="text-sm text-text-disabled mb-5">No portfolios yet. Build one in 3 minutes.</p>
              <Button asChild size="lg">
                <Link href="/onboarding">Build my first portfolio →</Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {portfolios.map(p => (
                <PortfolioRow
                  key={p.id}
                  portfolio={p}
                  copied={copied === p.slug}
                  onCopy={() => copyLink(p.slug)}
                  onDelete={() => handleDelete(p.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Live view toast */}
      {liveView && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-full border border-border bg-background shadow-lg text-sm font-medium text-text-primary animate-slide-up whitespace-nowrap">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse shrink-0" />
          {liveView.company === 'Someone' ? 'Someone' : liveView.company} is reading your portfolio right now
        </div>
      )}
    </div>
  )
}

// ─── Portfolio Row ─────────────────────────────────────────
function PortfolioRow({ portfolio: p, copied, onCopy, onDelete }: {
  portfolio: Portfolio; copied: boolean; onCopy: () => void; onDelete: () => void
}) {
  const name     = p.data?.name || 'Untitled'
  const subtitle = (p.data as { role?: string })?.role || (p.data as { tagline?: string })?.tagline || ''
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{name}</p>
        {subtitle && <p className="text-xs text-text-disabled mt-0.5 truncate">{subtitle}</p>}
      </div>

      {p.score != null && (
        <div className="shrink-0 hidden sm:block text-right w-16">
          <span className="text-sm font-mono font-bold text-text-primary tabular-nums">
            {p.score}
          </span>
          <span className="text-xs text-text-disabled font-mono"> /{scoreGrade(p.score)}</span>
        </div>
      )}

      <div className="shrink-0 hidden sm:block w-20">
        <span className={cn('text-xs font-mono', p.is_published ? 'text-success' : 'text-text-disabled')}>
          {p.is_published ? 'Published' : 'Draft'}
        </span>
      </div>

      <div className="shrink-0 hidden md:block w-16">
        <span className="text-xs font-mono text-text-disabled">{p.created_at ? formatDate(p.created_at) : '—'}</span>
      </div>

      <div className="shrink-0 flex items-center gap-1">
        <Button size="sm" asChild>
          <Link href={`/editor/${p.id}`}>Edit</Link>
        </Button>
        {p.is_published && (
          <>
            <Button size="sm" variant="secondary" asChild>
              <Link href={`/p/${p.slug}`} target="_blank" rel="noopener noreferrer" aria-label="View live">
                <ExternalLinkIcon />
              </Link>
            </Button>
            <Button size="sm" variant="secondary" onClick={onCopy} aria-label="Copy link">
              {copied ? <CheckIcon /> : <CopyIcon />}
            </Button>
          </>
        )}
        <Button size="sm" variant="ghost" onClick={onDelete} aria-label="Delete" className="text-text-disabled hover:text-error">
          <TrashIcon />
        </Button>
      </div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function ExternalLinkIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M6 2H2v10h10V8M8 2h4v4M6 8l6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function CopyIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="5" y="5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M3 9H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function TrashIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M5 3.5l.5 8M9 3.5l-.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
