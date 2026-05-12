'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
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

// Always inline styles — never dynamic Tailwind classes (purged in prod)
function scoreHex(s: number) {
  if (s >= 80) return '#3FB950'
  if (s >= 60) return '#FBBF24'
  return '#F87171'
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60)         return 'Just now'
  if (s < 3600)       return `${Math.floor(s / 60)}m ago`
  if (s < 86400)      return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 7)  return `${Math.floor(s / 86400)}d ago`
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
function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return null
  const W = 88, H = 24
  const lo = Math.min(...points) - 2, hi = Math.max(...points) + 2
  const px = (i: number) => (i / (points.length - 1)) * W
  const py = (v: number) => H - ((v - lo) / (hi - lo)) * H
  const d  = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// ─── Priority actions ─────────────────────────────────────
function buildActions(data: HomeData) {
  const acts: { label: string; href: string; why: string }[] = []
  const best = data.portfolios.find(p => p.score != null) ?? data.portfolios[0]

  const stale = data.apps.filter(isStale)
  if (stale.length)
    acts.push({ label: `Follow up on ${stale.length} stale application${stale.length > 1 ? 's' : ''}`, href: '/dashboard/applications', why: '14+ days no response' })

  if (!data.portfolios.some(p => p.is_published) && best)
    acts.push({ label: 'Publish your portfolio', href: `/editor/${best.id}`, why: 'No one can find you yet' })

  if (best?.score != null && best.score < 70)
    acts.push({ label: 'Improve your signal score', href: `/editor/${best.id}`, why: `${best.score}/100 — add metrics to bullets` })

  if (!data.apps.length)
    acts.push({ label: 'Track your first application', href: '/dashboard/applications', why: 'Pipeline detects ghost jobs automatically' })

  if (!data.portfolios.length)
    acts.push({ label: 'Build your first portfolio', href: '/onboarding', why: '3 minutes — paste resume, AI does the rest' })

  return acts.slice(0, 2)
}

// ─── Page ─────────────────────────────────────────────────
export default function DashboardPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [data,     setData]     = useState<HomeData | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [copied,   setCopied]   = useState<string | null>(null)
  const [liveView, setLiveView] = useState<{ company: string } | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/auth/login'); return }

        const full     = (user.user_metadata?.full_name as string) ?? ''
        const userName = full || user.email?.split('@')[0] || 'there'
        const college  = (user.user_metadata?.college as string) ?? ''

        const [portRes, appsRes, histRes, pubRes] = await Promise.all([
          fetch('/api/portfolio'),
          supabase.from('applications').select('id,company,role,status,updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(20),
          supabase.from('score_history').select('score,recorded_at').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(10),
          supabase.from('portfolios').select('id').eq('user_id', user.id).eq('is_published', true).limit(1),
        ])

        const portfolios: Portfolio[] = portRes.ok ? await portRes.json() : []
        const apps         = (appsRes.data ?? []) as Application[]
        const scoreHistory = ((histRes.data ?? []) as ScorePoint[]).reverse()

        let recentViews: { company: string; visited_at: string }[] = []
        const firstPub = (pubRes.data ?? [])[0]
        if (firstPub) {
          const { data: views } = await supabase
            .from('analytics').select('company,visited_at')
            .eq('portfolio_id', firstPub.id).order('visited_at', { ascending: false }).limit(5)
          recentViews = (views ?? []).map(v => ({ company: v.company ?? 'Unknown', visited_at: v.visited_at }))
        }

        setData({ portfolios, userName, college, apps, recentViews, scoreHistory, publishedPortfolioId: firstPub?.id ?? '' })
        track('dashboard_page_view', { has_portfolio: portfolios.length > 0, has_apps: apps.length > 0 })
      } catch { router.push('/auth/login') }
      finally  { setLoading(false) }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = data?.publishedPortfolioId
    if (!id) return
    const ch = supabase
      .channel(`lv_${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'analytics', filter: `portfolio_id=eq.${id}` }, payload => {
        const company = (payload.new as { company?: string }).company ?? ''
        setLiveView({ company: company || 'Someone' })
        track('dashboard_live_view_received', { company: company || 'unknown' })
        setTimeout(() => setLiveView(null), 8000)
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [data?.publishedPortfolioId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(id: string) {
    if (!confirm('Delete this portfolio? This cannot be undone.')) return
    const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' })
    if (res.ok && data) setData({ ...data, portfolios: data.portfolios.filter(p => p.id !== id) })
  }

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`).then(() => {
      setCopied(slug)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(null), 2000)
    }).catch(() => {})
  }

  // ── Skeleton ─────────────────────────────────────────────
  if (loading) return (
    <div className="px-10 xl:px-16 py-14">
      <div className="h-6 w-48 rounded-lg bg-border animate-pulse mb-14" />
      <div className="h-56 rounded-2xl bg-[#0F172A]/8 animate-pulse mb-6" />
      <div className="grid grid-cols-3 gap-5 mb-14">
        {[0,1,2].map(i => <div key={i} className="h-32 rounded-xl bg-border animate-pulse" />)}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {[0,1,2,3].map(i => <div key={i} className="h-36 rounded-xl bg-border animate-pulse" />)}
      </div>
    </div>
  )

  const { portfolios, userName, college, apps, recentViews, scoreHistory } = data!
  const best         = portfolios.find(p => p.score != null) ?? portfolios[0] ?? null
  const score        = best?.score ?? null
  const activeApps   = apps.filter(a => ACTIVE_STATUSES.includes(a.status))
  const staleCount   = apps.filter(isStale).length
  const idViews      = recentViews.filter(v => v.company && v.company !== 'Unknown')
  const trend        = scoreHistory.map(h => h.score)
  const delta        = trend.length >= 2 ? trend[trend.length - 1] - trend[0] : null
  const warmSignals  = idViews.filter(v => {
    const c = v.company.toLowerCase()
    return !apps.some(a => { const t = a.company.toLowerCase(); return t.includes(c) || c.includes(t) })
  }).slice(0, 3)
  const actions = buildActions(data!)

  const hour    = new Date().getHours()
  const month   = new Date().getMonth() + 1
  const hi      = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name    = userName.split(' ')[0]
  const nudge: string | null = (() => {
    if (month >= 8 && month <= 11) {
      if (score !== null && score < 70) return `Placement season is active — score is ${score}. Push above 70 before shortlisting begins.`
      if (score !== null)              return `Placement season active. Signal is strong at ${score}. Keep it updated.`
      return 'Placement season is active. Build and publish your portfolio now.'
    }
    if (month >= 12 || month <= 2) return 'Lateral move window — Jan–Mar is when companies backfill roles.'
    if (month >= 3 && month <= 4)  return 'Placement season starts in August. 4 months to sharpen your signal.'
    return null
  })()

  // ═══════════════════════════════════════════════════════
  return (
    <div className="px-10 xl:px-16 py-14">

      {/* Full-width content, no artificial max-width centering */}
      <div className="space-y-14">

        {/* ── 1. GREETING ────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight leading-tight">
            {hi}, {name}.
          </h1>
          {nudge && (
            <p className="mt-2 text-sm text-text-secondary leading-relaxed max-w-2xl">{nudge}</p>
          )}
        </div>

        {/* ── 2. SCORE + STATS GROUP ─────────────────────── */}
        <div className="space-y-5">

          {/* Signal Score — dark hero */}
          <div className="rounded-2xl bg-[#0F172A] px-10 py-10 relative overflow-hidden">
            {score != null && (
              <div
                className="absolute right-0 top-0 w-96 h-96 pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${scoreHex(score)} 0%, transparent 70%)`,
                  opacity: 0.07,
                  transform: 'translate(40%, -40%)',
                }}
              />
            )}

            <p className="text-[11px] font-mono text-slate-500 uppercase tracking-[0.18em] mb-8">Signal Score</p>

            {score != null ? (
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">

                {/* Number block */}
                <div>
                  <div className="flex items-end gap-4 mb-6">
                    <span
                      className="font-black font-mono tabular-nums leading-none"
                      style={{ fontSize: 'clamp(88px, 9vw, 120px)', color: scoreHex(score) }}
                    >
                      {score}
                    </span>
                    <div className="flex flex-col gap-1.5 mb-2">
                      <span className="text-xl font-semibold text-slate-600">/100</span>
                      <span
                        className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-md w-fit tracking-wide"
                        style={{ background: 'rgba(255,255,255,0.08)', color: scoreHex(score) }}
                      >
                        Grade {scoreGrade(score)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar — h-2 for visibility */}
                  <div className="h-2 rounded-full overflow-hidden" style={{ width: 'clamp(200px, 30vw, 320px)', background: 'rgba(255,255,255,0.10)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${score}%`, backgroundColor: scoreHex(score), transition: 'width 0.5s ease' }}
                    />
                  </div>
                </div>

                {/* Sparkline + meta */}
                <div className="flex flex-col gap-3 lg:items-end pb-1">
                  {trend.length >= 2 && (
                    <Sparkline points={trend.slice(-8)} color={scoreHex(score)} />
                  )}
                  <div className="flex items-center gap-5 flex-wrap">
                    {delta !== null && delta !== 0 && (
                      <span className="text-xs font-mono" style={{ color: delta > 0 ? '#3FB950' : '#F87171' }}>
                        {delta > 0 ? `+${delta}` : delta} points
                      </span>
                    )}
                    {best?.is_published && best.slug && (
                      <Link
                        href={`/badge/${best.slug}`}
                        target="_blank" rel="noopener"
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[#3FB950]" />
                        Share score →
                      </Link>
                    )}
                    {college
                      ? <span className="text-xs font-mono text-slate-600">{college}</span>
                      : <Link href="/dashboard/settings" className="text-xs font-mono text-slate-600 hover:text-slate-400 transition-colors">+ Add college</Link>
                    }
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="font-black font-mono text-slate-700 leading-none mb-5"
                  style={{ fontSize: 'clamp(80px, 8vw, 108px)' }}>—</p>
                <p className="text-sm text-slate-500 mb-5">Build a portfolio to unlock your signal score</p>
                <Link href="/onboarding" className="text-sm font-mono text-[#3B82F6] hover:text-blue-400 transition-colors">
                  Start now →
                </Link>
              </div>
            )}
          </div>

          {/* Stat strip — 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

            {/* Pipeline */}
            <div className="rounded-xl border border-border bg-background p-8">
              <p className="text-[11px] font-mono text-text-disabled uppercase tracking-[0.15em] mb-5">Pipeline</p>
              <div className="flex items-end gap-2.5 mb-3">
                <span className="text-5xl font-black font-mono tabular-nums text-text-primary leading-none">
                  {activeApps.length}
                </span>
                <span className="text-sm text-text-disabled pb-1">active</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {staleCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono" style={{ color: '#92400E' }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#92400E' }} />
                    {staleCount} stale
                  </span>
                )}
                <Link href="/dashboard/applications" className="text-xs font-mono text-text-disabled hover:text-text-secondary transition-colors">
                  {apps.length} total →
                </Link>
              </div>
            </div>

            {/* Views */}
            <div className="rounded-xl border border-border bg-background p-8">
              <p className="text-[11px] font-mono text-text-disabled uppercase tracking-[0.15em] mb-5">Views</p>
              {recentViews.length > 0 ? (
                <>
                  <div className="flex items-end gap-2.5 mb-3">
                    <span className="text-5xl font-black font-mono tabular-nums text-text-primary leading-none">
                      {recentViews.length}
                    </span>
                    <span className="text-sm text-text-disabled pb-1">recent</span>
                  </div>
                  {idViews[0] && (
                    <p className="text-xs font-mono text-text-secondary">
                      {idViews[0].company} · {timeAgo(idViews[0].visited_at)}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-5xl font-black font-mono tabular-nums text-text-primary leading-none mb-3">0</p>
                  <p className="text-xs text-text-disabled">
                    {best && !best.is_published
                      ? <Link href={`/editor/${best.id}`} className="text-accent hover:text-accent/80 transition-colors">Publish to start →</Link>
                      : 'Publish a portfolio first'}
                  </p>
                </>
              )}
            </div>

            {/* Portfolios */}
            <div className="rounded-xl border border-border bg-background p-8">
              <p className="text-[11px] font-mono text-text-disabled uppercase tracking-[0.15em] mb-5">Portfolios</p>
              <div className="flex items-end gap-2.5 mb-3">
                <span className="text-5xl font-black font-mono tabular-nums text-text-primary leading-none">
                  {portfolios.length}
                </span>
                <span className="text-sm text-text-disabled pb-1">built</span>
              </div>
              {portfolios.length === 0
                ? <Link href="/onboarding" className="text-xs font-mono text-accent hover:text-accent/80 transition-colors">Build first →</Link>
                : <p className="text-xs font-mono text-text-disabled">{portfolios.filter(p => p.is_published).length} published</p>
              }
            </div>
          </div>
        </div>

        {/* ── 3. WARM SIGNALS (conditional) ──────────────── */}
        {warmSignals.length > 0 && (
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <h2 className="text-sm font-semibold text-text-primary">Warm Signals</h2>
              <span className="text-xs text-text-disabled">· viewed but never heard from you</span>
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              {warmSignals.map((v, i) => (
                <div
                  key={`${v.company}-${i}`}
                  className={cn('flex items-center gap-5 px-6 py-5', i > 0 && 'border-t border-border')}
                >
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-accent">{v.company[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
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

        {/* ── 4. PRIORITY ACTIONS (conditional) ──────────── */}
        {actions.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-5">Do this today</h2>
            <div className="flex flex-col gap-3">
              {actions.map((a, i) => (
                <Link
                  key={i}
                  href={a.href}
                  className="group flex items-center gap-5 px-6 py-5 rounded-xl border border-border hover:border-accent/30 hover:bg-border-subtle/50 transition-all"
                  onClick={() => track('dashboard_action_click', { label: a.label })}
                >
                  <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">{a.label}</p>
                    <p className="text-xs text-text-disabled mt-0.5">{a.why}</p>
                  </div>
                  <span className="text-text-disabled group-hover:text-accent transition-colors shrink-0">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── 5. INTELLIGENCE ────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-text-primary mb-5">Intelligence</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">

            {[
              { href: '/dashboard/intelligence/mirror', label: 'Career Mirror',  desc: 'How recruiters see you',    Icon: MirrorIcon, bg: '#DBEAFE', color: '#1D4ED8' },
              { href: '/dashboard/intelligence/ats',    label: 'ATS Filter',     desc: 'See what fails the scan',   Icon: FilterIcon, bg: '#EDE9FE', color: '#6D28D9' },
              { href: '/dashboard/intelligence/ghost',  label: 'Ghost Detector', desc: 'Real job or ghost listing?',Icon: GhostIcon,  bg: '#FEF3C7', color: '#B45309' },
              { href: '/dashboard/intelligence/offer',  label: 'Offer Analyzer', desc: 'Is the salary fair?',       Icon: OfferIcon,  bg: '#D1FAE5', color: '#065F46' },
            ].map(({ href, label, desc, Icon, bg, color }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col gap-5 p-6 rounded-xl border border-border bg-background hover:shadow-sm transition-all group"
                style={{ '--hover-border': color } as React.CSSProperties}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: bg, color }}
                >
                  <Icon />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{label}</p>
                  <p className="text-xs text-text-disabled mt-1.5 leading-relaxed">{desc}</p>
                </div>
              </Link>
            ))}

          </div>
        </div>

        {/* ── 6. RECENT APPLICATIONS (only if tracking) ──── */}
        {apps.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-text-primary">Recent Applications</h2>
              <Link href="/dashboard/applications" className="text-xs text-text-disabled hover:text-text-secondary transition-colors">
                View all →
              </Link>
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              {apps.slice(0, 5).map((app, i) => (
                <div
                  key={app.id}
                  className={cn('flex items-center gap-5 px-6 py-4', i > 0 && 'border-t border-border')}
                >
                  <div className="w-8 h-8 rounded-lg bg-border-subtle flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-text-secondary">{app.company[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{app.company}</p>
                    <p className="text-xs text-text-disabled truncate">{app.role}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isStale(app) && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(146,64,14,0.1)', color: '#92400E' }}>Stale</span>
                    )}
                    <span className="text-xs font-mono text-text-disabled">{timeAgo(app.updated_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 7. PORTFOLIOS ──────────────────────────────── */}
        <div className="pt-6 border-t border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-text-primary">
              Portfolios <span className="text-text-disabled font-normal ml-1">({portfolios.length})</span>
            </h2>
            <Button asChild size="md">
              <Link href="/onboarding"><PlusIcon />New portfolio</Link>
            </Button>
          </div>

          {portfolios.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-8 py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-border-subtle flex items-center justify-center mx-auto mb-5">
                <FolderIcon />
              </div>
              <p className="text-sm font-medium text-text-primary mb-1.5">No portfolios yet</p>
              <p className="text-xs text-text-disabled mb-7 max-w-xs mx-auto">
                Build one in 3 minutes — paste your resume and AI extracts everything automatically.
              </p>
              <Button asChild size="lg">
                <Link href="/onboarding">Build my first portfolio →</Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              {portfolios.map((p, i) => (
                <PortfolioRow
                  key={p.id}
                  portfolio={p}
                  index={i}
                  copied={copied === p.slug}
                  onCopy={() => copyLink(p.slug)}
                  onDelete={() => handleDelete(p.id)}
                />
              ))}
            </div>
          )}
        </div>

      </div>{/* end space-y-14 */}

      {/* ── Live view toast ───────────────────────────────── */}
      {liveView && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-full bg-[#0F172A] shadow-xl text-sm font-medium text-white whitespace-nowrap" style={{ animation: 'slideUp 0.3s ease' }}>
          <span className="h-2 w-2 rounded-full bg-[#3FB950] animate-pulse shrink-0" />
          {liveView.company === 'Someone' ? 'Someone' : liveView.company} is reading your portfolio right now
        </div>
      )}
    </div>
  )
}

// ─── Portfolio Row ─────────────────────────────────────────
function PortfolioRow({ portfolio: p, index, copied, onCopy, onDelete }: {
  portfolio: Portfolio; index: number; copied: boolean; onCopy: () => void; onDelete: () => void
}) {
  const name = p.data?.name || 'Untitled'
  const sub  = (p.data as { role?: string })?.role || (p.data as { tagline?: string })?.tagline || ''
  return (
    <div className={cn('flex items-center gap-5 px-6 py-5', index > 0 && 'border-t border-border')}>
      <div className="w-9 h-9 rounded-xl bg-border-subtle flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-text-secondary">{name[0]?.toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{name}</p>
        {sub && <p className="text-xs text-text-disabled mt-0.5 truncate">{sub}</p>}
      </div>

      {p.score != null && (
        <div className="shrink-0 hidden sm:flex items-baseline gap-1">
          <span className="text-sm font-mono font-bold text-text-primary tabular-nums">{p.score}</span>
          <span className="text-xs text-text-disabled font-mono">/{scoreGrade(p.score)}</span>
        </div>
      )}

      <div className="shrink-0 hidden sm:block">
        <span
          className="text-[11px] font-mono px-2 py-1 rounded-md"
          style={p.is_published
            ? { background: 'rgba(22,101,52,0.1)', color: '#166534' }
            : { background: '#F1F5F9', color: '#94A3B8' }
          }
        >
          {p.is_published ? 'Published' : 'Draft'}
        </span>
      </div>

      <div className="shrink-0 hidden md:block w-14 text-right">
        <span className="text-xs font-mono text-text-disabled">{p.created_at ? formatDate(p.created_at) : '—'}</span>
      </div>

      <div className="shrink-0 flex items-center gap-1.5">
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
function MirrorIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="1.4"/><path d="M3 17c0-3 3.1-4.5 7-4.5s7 1.5 7 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
}
function FilterIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function GhostIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 10V9a5 5 0 0 1 10 0v8l-2-2-2 2-2-2-2 2V10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><circle cx="8.5" cy="10" r="1" fill="currentColor"/><circle cx="11.5" cy="10" r="1" fill="currentColor"/></svg>
}
function OfferIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 14l5-5 4 4 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 6h3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function FolderIcon() {
  return <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 6a2 2 0 0 1 2-2h3.5a1 1 0 0 1 .8.4l1.4 1.6a1 1 0 0 0 .8.4H17a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" stroke="currentColor" strokeWidth="1.4"/></svg>
}
function PlusIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function ExternalLinkIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5.5 2H2v9h9V7.5M7.5 2H11v3.5M5 8l6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function CopyIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="4.5" y="4.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.4"/><path d="M3 8.5H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
}
function CheckIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3.5 3.5 5.5-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function TrashIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 3.5h10M5 3.5V2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M4.5 3.5l.5 7M8.5 3.5l-.5 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
}
