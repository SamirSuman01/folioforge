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
  portfolios:          Portfolio[]
  userName:            string
  userInitial:         string
  college:             string
  apps:                Application[]
  recentViews:         { company: string; visited_at: string }[]
  scoreHistory:        ScorePoint[]
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

// ─── Mini sparkline ───────────────────────────────────────
function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null
  const W = 80, H = 24
  const min = Math.min(...points) - 2
  const max = Math.max(...points) + 2
  const x = (i: number) => (i / (points.length - 1)) * W
  const y = (v: number) => H - ((v - min) / (max - min)) * H
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ')
  const trend = points[points.length - 1] - points[0]
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <path d={d} fill="none" stroke={trend >= 0 ? '#166534' : '#991B1B'} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Priority actions ─────────────────────────────────────
function buildActions(data: HomeData): { label: string; href: string; why: string }[] {
  const actions: { label: string; href: string; why: string }[] = []
  const best = data.portfolios.find(p => p.score != null) ?? data.portfolios[0]

  // Stale apps
  const staleApps = data.apps.filter(isStale)
  if (staleApps.length > 0) {
    actions.push({
      label: `Follow up on ${staleApps.length} stale application${staleApps.length > 1 ? 's' : ''}`,
      href:  '/dashboard/applications',
      why:   '14+ days with no response — follow up or mark as ghosted',
    })
  }

  // No published portfolio
  const published = data.portfolios.filter(p => p.is_published)
  if (published.length === 0 && data.portfolios.length > 0 && best) {
    actions.push({
      label: 'Publish your portfolio',
      href:  `/editor/${best.id}`,
      why:   'No one can find you — publish to start getting analytics',
    })
  }

  // Low score
  if (best?.score != null && best.score < 70) {
    actions.push({
      label: 'Improve your signal score',
      href:  `/editor/${best.id}`,
      why:   `Score is ${best.score}/100 — add metrics to bullets to push above 70`,
    })
  }

  // No applications tracked
  if (data.apps.length === 0) {
    actions.push({
      label: 'Track your first application',
      href:  '/dashboard/applications',
      why:   'Start tracking where you apply — the pipeline catches ghost jobs automatically',
    })
  }

  // No portfolio at all
  if (data.portfolios.length === 0) {
    actions.push({
      label: 'Build your first portfolio',
      href:  '/onboarding',
      why:   'Takes 3 minutes — paste your resume and the AI does the rest',
    })
  }

  return actions.slice(0, 3)
}

// ─── Page ─────────────────────────────────────────────────
export default function DashboardPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [data,     setData]     = useState<HomeData | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [copied,   setCopied]   = useState<string | null>(null)
  const [view,     setView]     = useState<'home' | 'portfolios'>('home')
  const [liveView, setLiveView] = useState<{ company: string } | null>(null)
  const copiedTimerRef          = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/auth/login'); return }

        const fullName    = user.user_metadata?.full_name as string ?? ''
        const userName    = fullName || user.email?.split('@')[0] || 'there'
        const userInitial = (fullName || userName)[0]?.toUpperCase() ?? '?'
        const college     = user.user_metadata?.college as string ?? ''

        // Parallel fetch everything
        const [portfolioRes, appsRes, historyRes, analyticsRes] = await Promise.all([
          fetch('/api/portfolio'),
          supabase.from('applications').select('id,company,role,status,updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(20),
          supabase.from('score_history').select('score,recorded_at').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(10),
          // Get recent views from first portfolio only
          supabase.from('portfolios').select('id').eq('user_id', user.id).eq('is_published', true).limit(1),
        ])

        const portfolios: Portfolio[] = portfolioRes.ok ? await portfolioRes.json() : []
        const apps = (appsRes.data ?? []) as Application[]
        const scoreHistory = ((historyRes.data ?? []) as ScorePoint[]).reverse()

        // Get recent analytics views if published portfolio exists
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
          has_portfolio:  portfolios.length > 0,
          has_score:      portfolios.some(p => p.score != null),
          has_apps:       apps.length > 0,
          has_views:      recentViews.length > 0,
        })
      } catch {
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime — pulse when a new view lands on the published portfolio
  useEffect(() => {
    const id = data?.publishedPortfolioId
    if (!id) return
    const channel = supabase
      .channel(`live_views_${id}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'analytics',
        filter: `portfolio_id=eq.${id}`,
      }, (payload) => {
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
    } catch { /* network error — silent fail */ }
  }

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`).then(() => {
      setCopied(slug)
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopied(null), 2000)
    }).catch(() => {})
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav />
        <main className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
          <div className="h-4 w-40 rounded bg-border animate-shimmer mb-10" />
          <div className="grid grid-cols-3 gap-px bg-border border border-border">
            {[1,2,3].map(i => <div key={i} className="bg-background p-6 h-28 animate-shimmer" />)}
          </div>
        </main>
      </div>
    )
  }

  const { portfolios, userName, userInitial, college, apps, recentViews, scoreHistory } = data!
  const bestPortfolio = portfolios.find(p => p.score != null) ?? portfolios[0] ?? null
  const activeApps    = apps.filter(a => ACTIVE_STATUSES.includes(a.status))
  const staleCount    = apps.filter(isStale).length
  const identifiedViews = recentViews.filter(v => v.company && v.company !== 'Unknown')
  const scoreTrend    = scoreHistory.map(h => h.score)

  // Warm signals — companies that viewed but aren't tracked in pipeline
  const warmSignals = identifiedViews
    .filter(v => {
      const viewed = v.company.toLowerCase()
      return !apps.some(a => {
        const tracked = a.company.toLowerCase()
        return tracked.includes(viewed) || viewed.includes(tracked)
      })
    })
    .slice(0, 3)
  const scoreDelta    = scoreTrend.length >= 2 ? scoreTrend[scoreTrend.length - 1] - scoreTrend[0] : null
  const actions       = buildActions(data!)

  const hour  = new Date().getHours()
  const month = new Date().getMonth() + 1  // 1–12
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Calendar-aware season nudge — one sentence, never generic
  const seasonNudge: string | null = (() => {
    if (month >= 8 && month <= 11) {
      const score = bestPortfolio?.score ?? null
      if (score !== null && score < 70)
        return `Placement season is active — your score is ${score}. Push above 70 before companies start shortlisting.`
      if (score !== null && score >= 70)
        return `Placement season is active — your signal is strong at ${score}. Keep it updated as applications move.`
      return 'Placement season is active. Build and publish your portfolio before companies start shortlisting.'
    }
    if (month >= 12 || month <= 2)
      return 'Lateral move window is open — Jan–Mar is when companies backfill. Good time to test the market.'
    if (month >= 3 && month <= 4)
      return 'Pre-placement prep window. Placement season starts in August — 4 months to sharpen your signal.'
    return null
  })()

  return (
    <div className="min-h-screen bg-background">
      <AppNav userName={userName} userInitial={userInitial} />

      <main className="mx-auto max-w-4xl px-6 py-10 lg:px-8">

        {/* ── Greeting + tabs ── */}
        <div className="flex items-end justify-between mb-8 animate-slide-up-1">
          <div>
            <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-1">
              Career OS
            </span>
            <h1 className="text-h2 font-bold text-text-primary tracking-tight">
              {greeting}, {userName.split(' ')[0]}.
            </h1>
            {seasonNudge && (
              <p className="text-small text-text-secondary mt-1.5 max-w-md">
                {seasonNudge}
              </p>
            )}
          </div>
          <div className="flex items-center gap-0 border-b border-border">
            {(['home', 'portfolios'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setView(tab); track('dashboard_tab_switch', { tab }) }}
                className={cn(
                  'pb-2 mr-5 text-micro font-mono uppercase tracking-widest transition-colors border-b-2 -mb-px',
                  view === tab
                    ? 'border-accent text-text-primary'
                    : 'border-transparent text-text-disabled hover:text-text-secondary'
                )}
              >
                {tab === 'home' ? 'Overview' : 'Portfolios'}
              </button>
            ))}
          </div>
        </div>

        {view === 'portfolios' ? (
          /* ── Portfolios list view ── */
          <div className="animate-slide-up-1">
            <div className="flex items-baseline justify-between mb-6">
              <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                {portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''}
              </span>
              <Button asChild size="md">
                <Link href="/onboarding"><PlusIcon /> New portfolio</Link>
              </Button>
            </div>

            {portfolios.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-small text-text-disabled mb-6">No portfolios yet.</p>
                <Button asChild size="lg"><Link href="/onboarding">Build my first portfolio →</Link></Button>
              </div>
            ) : (
              <div className="divide-y divide-border stagger-children">
                {portfolios.map(p => (
                  <PortfolioRow key={p.id} portfolio={p} copied={copied === p.slug} onCopy={() => copyLink(p.slug)} onDelete={() => handleDelete(p.id)} />
                ))}
                <div className="py-4">
                  <Link href="/onboarding" className="flex items-center gap-2 text-small text-text-disabled hover:text-text-secondary transition-colors">
                    <PlusIcon />New portfolio
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Command center ── */
          <>
            {/* ── 3-panel status row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border border border-border mb-8 animate-slide-up-2">

              {/* Signal — identity score */}
              <div className="bg-background p-6">
                <p className="text-micro font-mono text-text-disabled uppercase tracking-widest mb-3">Your Signal Score</p>
                {bestPortfolio?.score != null ? (
                  <>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[2rem] font-bold font-mono text-text-primary tabular-nums leading-none">
                        {bestPortfolio.score}
                      </span>
                      <span className="text-small font-mono text-text-disabled">/100 · {scoreGrade(bestPortfolio.score)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      {scoreDelta !== null && scoreDelta !== 0 && (
                        <span className={cn(
                          'text-micro font-mono',
                          scoreDelta > 0 ? 'text-success' : 'text-error'
                        )}>
                          {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} since start
                        </span>
                      )}
                      <Sparkline points={scoreTrend.slice(-6)} />
                    </div>
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      {bestPortfolio.is_published && bestPortfolio.slug && (
                        <Link
                          href={`/badge/${bestPortfolio.slug}`}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-1 text-micro font-mono text-text-disabled hover:text-accent transition-colors"
                        >
                          <span className="h-1 w-1 rounded-full bg-success" />
                          Share your score →
                        </Link>
                      )}
                      {college && (
                        <span className="text-micro font-mono text-text-disabled">
                          {college}
                        </span>
                      )}
                      {!college && (
                        <Link
                          href="/dashboard/settings"
                          className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors"
                        >
                          + Add college
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-small text-text-disabled mb-3">Your score is waiting to be built</p>
                    <Link href="/onboarding" className="text-small font-mono text-accent hover:text-accent/80 transition-colors">
                      Build portfolio →
                    </Link>
                  </div>
                )}
              </div>

              {/* Pipeline */}
              <div className="bg-background p-6 border-t sm:border-t-0 sm:border-l border-border">
                <p className="text-micro font-mono text-text-disabled uppercase tracking-widest mb-3">Pipeline</p>
                {apps.length === 0 ? (
                  <div>
                    <p className="text-small text-text-disabled mb-3">Every application is a signal — start tracking</p>
                    <Link href="/dashboard/applications" className="text-small font-mono text-accent hover:text-accent/80 transition-colors">
                      Start tracking →
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[2rem] font-bold font-mono text-text-primary tabular-nums leading-none">
                        {activeApps.length}
                      </span>
                      <span className="text-small font-mono text-text-disabled">active</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      {staleCount > 0 && (
                        <span className="text-micro font-mono text-warning">{staleCount} stale</span>
                      )}
                      <Link href="/dashboard/applications" className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors">
                        {apps.length} total →
                      </Link>
                    </div>
                  </>
                )}
              </div>

              {/* Views */}
              <div className="bg-background p-6 border-t sm:border-t-0 sm:border-l border-border">
                <p className="text-micro font-mono text-text-disabled uppercase tracking-widest mb-3">Views</p>
                {recentViews.length === 0 ? (
                  <div>
                    <p className="text-small text-text-disabled mb-3">Publish your portfolio to start getting seen</p>
                    {bestPortfolio && !bestPortfolio.is_published && (
                      <Link href={`/editor/${bestPortfolio.id}`} className="text-small font-mono text-accent hover:text-accent/80 transition-colors">
                        Publish to track →
                      </Link>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[2rem] font-bold font-mono text-text-primary tabular-nums leading-none">
                        {recentViews.length}
                      </span>
                      <span className="text-small font-mono text-text-disabled">recent</span>
                    </div>
                    {identifiedViews[0] && (
                      <p className="text-micro font-mono text-text-secondary mt-2">
                        {identifiedViews[0].company} · {timeAgo(identifiedViews[0].visited_at)}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── Warm signals — companies that viewed but aren't in pipeline ── */}
            {warmSignals.length > 0 && (
              <div className="mb-8 animate-slide-up-3">
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">
                  Warm signals
                </span>
                <div className="divide-y divide-border border-t border-border">
                  {warmSignals.map((v, i) => (
                    <div key={`${v.company}-${i}`} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                        <div className="min-w-0">
                          <p className="text-small font-medium text-text-primary">{v.company}</p>
                          <p className="text-micro font-mono text-text-disabled">viewed {timeAgo(v.visited_at)} · they haven&apos;t heard from you yet</p>
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/applications?company=${encodeURIComponent(v.company)}`}
                        className="text-micro font-mono text-accent hover:text-accent/80 transition-colors shrink-0"
                        onClick={() => track('dashboard_warm_signal_click', { company: v.company })}
                      >
                        Add to pipeline →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── What to do today ── */}
            {actions.length > 0 && (
              <div className="mb-8 animate-slide-up-3">
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">
                  Do this today
                </span>
                <div className="divide-y divide-border border-t border-border">
                  {actions.map((action, i) => (
                    <Link
                      key={i}
                      href={action.href}
                      className="flex items-start justify-between gap-4 py-3.5 group hover:bg-border-subtle/50 transition-colors -mx-1 px-1"
                      onClick={() => track('dashboard_action_click', { label: action.label, href: action.href })}
                    >
                      <div>
                        <p className="text-small font-medium text-text-primary group-hover:text-accent transition-colors">
                          {action.label}
                        </p>
                        <p className="text-micro text-text-disabled mt-0.5">{action.why}</p>
                      </div>
                      <span className="text-text-disabled group-hover:text-accent transition-colors mt-0.5 shrink-0">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── Two columns: recent activity + quick tools ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 animate-slide-up-4">

              {/* Recent applications */}
              <div>
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Applications</span>
                  <Link href="/dashboard/applications" className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors">
                    View all →
                  </Link>
                </div>
                {apps.length === 0 ? (
                  <p className="text-small text-text-disabled py-2">Nothing tracked yet.</p>
                ) : (
                  <div className="divide-y divide-border border-t border-border">
                    {apps.slice(0, 4).map(app => (
                      <div key={app.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-small text-text-primary truncate">{app.company}</p>
                          <p className="text-micro text-text-disabled truncate">{app.role}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isStale(app) && (
                            <span className="text-micro font-mono text-warning">Stale</span>
                          )}
                          <span className="text-micro font-mono text-text-disabled">{timeAgo(app.updated_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Intelligence tools */}
              <div>
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">Intelligence</span>
                <div className="divide-y divide-border border-t border-border">
                  {[
                    { label: 'Career Mirror',   desc: 'How recruiters read you',        href: '/dashboard/intelligence/mirror' },
                    { label: 'Job Filter Check', desc: 'Paste a JD — see what fails',    href: '/dashboard/intelligence/ats'    },
                    { label: 'Offer Analyzer',   desc: 'Is the salary fair?',            href: '/dashboard/intelligence/offer'  },
                    { label: 'Fake Job Detector', desc: 'Is this role actually real?',   href: '/dashboard/intelligence/ghost'  },
                  ].map(tool => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className="flex items-center justify-between gap-3 py-3 group hover:bg-border-subtle/50 transition-colors -mx-1 px-1"
                    >
                      <div>
                        <p className="text-small text-text-primary group-hover:text-accent transition-colors">{tool.label}</p>
                        <p className="text-micro text-text-disabled">{tool.desc}</p>
                      </div>
                      <span className="text-text-disabled group-hover:text-accent transition-colors shrink-0">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Live view notification */}
      {liveView && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 border border-border bg-background text-micro font-mono text-text-primary animate-slide-up whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse shrink-0" />
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
    <div className="py-5 flex items-center gap-5">
      <div className="flex-1 min-w-0">
        <p className="text-small font-medium text-text-primary truncate">{name}</p>
        {subtitle && <p className="text-micro text-text-disabled mt-0.5 truncate">{subtitle}</p>}
      </div>
      <div className="shrink-0 w-16 text-right hidden sm:block">
        {p.score != null ? (
          <span className="text-small font-mono text-text-primary tabular-nums">
            {p.score}<span className="text-text-disabled text-micro"> / {scoreGrade(p.score)}</span>
          </span>
        ) : (
          <span className="text-micro font-mono text-text-disabled">—</span>
        )}
      </div>
      <div className="shrink-0 w-20 hidden sm:block">
        <span className={cn('text-micro font-mono', p.is_published ? 'text-success' : 'text-text-disabled')}>
          {p.is_published ? 'Published' : 'Draft'}
        </span>
      </div>
      <div className="shrink-0 w-16 hidden md:block">
        <span className="text-micro font-mono text-text-disabled tabular-nums">
          {p.created_at ? formatDate(p.created_at) : '—'}
        </span>
      </div>
      <div className="shrink-0 flex items-center gap-1">
        <Button size="sm" asChild><Link href={`/editor/${p.id}`}>Edit</Link></Button>
        {p.is_published && (
          <>
            <Button size="sm" variant="secondary" asChild>
              <Link href={`/p/${p.slug}`} target="_blank" rel="noopener noreferrer" aria-label="View live"><ExternalLinkIcon /></Link>
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
