'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AppNav from '@/components/ui/AppNav'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/funnel'

interface AnalyticsData {
  totalViews:             number
  uniqueVisitors:         number
  avgDuration:            number
  topCompanies:           { name: string; count: number }[]
  topCities:              { name: string; count: number }[]
  topReferrers:           { name: string; count: number }[]
  recentVisitors: {
    company:   string
    city:      string
    country:   string
    referrer:  string
    duration:  number | null
    visitedAt: string
  }[]
  isPro:                  boolean
  portfolioName:          string
  identifiedCompanyCount: number
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<Shell><LoadingSkeleton /></Shell>}>
      <AnalyticsContent />
    </Suspense>
  )
}

function AnalyticsContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const portfolioId  = searchParams.get('id')
  const [data,        setData]        = useState<AnalyticsData | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [userName,    setUserName]    = useState('')
  const [userInitial, setUserInitial] = useState('?')

  useEffect(() => {
    const supabase = (async () => {
      const { createClient } = await import('@/lib/supabase-client')
      return createClient()
    })()
    supabase.then(sb => sb.auth.getUser()).then(({ data: { user } }) => {
      if (!user) return
      const name = user.user_metadata?.full_name as string ?? ''
      setUserName(name || user.email?.split('@')[0] || '')
      setUserInitial((name || user.email || '?')[0].toUpperCase())
    }).catch(() => {})
  }, [])

  // If no portfolio id in URL, auto-redirect to the user's first portfolio
  useEffect(() => {
    if (portfolioId) return
    async function autoRedirect() {
      const { createClient } = await import('@/lib/supabase-client')
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const { data: portfolios } = await sb
        .from('portfolios')
        .select('id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
      if (portfolios?.[0]?.id) {
        router.replace(`/dashboard/analytics?id=${portfolios[0].id}`)
      } else {
        setError('Build and publish a portfolio first to see analytics.')
        setLoading(false)
      }
    }
    autoRedirect()
  }, [portfolioId, router])

  useEffect(() => {
    let cancelled = false
    if (!portfolioId) {
      return
    }
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 30_000)
    async function load() {
      try {
        const res = await fetch(`/api/analytics?portfolioId=${portfolioId}`, { signal: controller.signal })
        clearTimeout(timeoutId)
        if (!res.ok) throw new Error('Failed to load analytics.')
        const d: AnalyticsData = await res.json()
        if (!cancelled) {
          setData(d)
          track('analytics_page_view', {
            total_views:          d.totalViews,
            identified_companies: d.identifiedCompanyCount,
            is_pro:               d.isPro,
          })
        }
      } catch (e) {
        clearTimeout(timeoutId)
        if (!cancelled) setError(
          (e instanceof Error && e.name === 'AbortError')
            ? 'Analytics took too long to load. Please try again.'
            : 'Analytics could not be loaded right now.'
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true; controller.abort() }
  }, [portfolioId])

  if (loading) return <Shell userName={userName} userInitial={userInitial}><LoadingSkeleton /></Shell>

  if (error || !data) {
    return (
      <Shell userName={userName} userInitial={userInitial}>
        <div className="py-16">
          <span className="text-micro font-mono text-error uppercase tracking-widest block mb-3">Unavailable</span>
          <p className="text-small text-text-secondary mb-6">{error ?? 'Something went wrong.'}</p>
          <Button asChild><Link href="/dashboard">Back to dashboard</Link></Button>
        </div>
      </Shell>
    )
  }

  return (
    <Shell userName={userName} userInitial={userInitial}>
      {/* Page header */}
      <div className="flex items-start justify-between gap-6 mb-10 animate-slide-up-1">
        <div>
          <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-1">Analytics · Last 30 days</span>
          <h1 className="text-h2 font-bold text-text-primary tracking-tight">{data.portfolioName}</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {data.isPro
            ? <span className="text-micro font-mono text-success border border-success/30 rounded-sm px-2 py-0.5">Pro</span>
            : <Button size="sm" asChild><Link href={`/dashboard/upgrade?from=analytics&id=${portfolioId}`}>Upgrade</Link></Button>
          }
        </div>
      </div>

      {/* Who / When / Where — emotional hook before the detail list */}
      {data.recentVisitors.length > 0 && (
        <div className="grid grid-cols-3 border border-border mb-10 animate-slide-up-2">
          {/* Who */}
          <div className="p-5 border-r border-border">
            <p className="text-micro font-mono text-text-disabled uppercase tracking-widest mb-3">Who</p>
            {data.identifiedCompanyCount > 0 ? (
              <>
                <p className="text-[1.75rem] font-bold font-mono text-text-primary tabular-nums leading-none mb-1">
                  {data.identifiedCompanyCount}
                </p>
                <p className="text-micro text-text-secondary">
                  {data.identifiedCompanyCount === 1 ? 'company' : 'companies'} identified
                </p>
                {!data.isPro && (
                  <Link
                    href={`/dashboard/upgrade?from=analytics&id=${portfolioId}`}
                    className="text-micro font-mono text-accent hover:text-accent/80 transition-colors mt-1 block"
                  >
                    See who →
                  </Link>
                )}
              </>
            ) : (
              <p className="text-small text-text-disabled">No companies yet — updates as views come in</p>
            )}
          </div>

          {/* When */}
          <div className="p-5 border-r border-border">
            <p className="text-micro font-mono text-text-disabled uppercase tracking-widest mb-3">When</p>
            {data.recentVisitors[0] ? (
              <>
                <p className="text-[1.75rem] font-bold font-mono text-text-primary tabular-nums leading-none mb-1">
                  {timeAgo(data.recentVisitors[0].visitedAt)}
                </p>
                <p className="text-micro text-text-secondary">most recent visit</p>
              </>
            ) : (
              <p className="text-small text-text-disabled">No visits yet</p>
            )}
          </div>

          {/* Where */}
          <div className="p-5">
            <p className="text-micro font-mono text-text-disabled uppercase tracking-widest mb-3">Where</p>
            {data.topCities[0] ? (
              <>
                <p className="text-[1.75rem] font-bold font-mono text-text-primary tabular-nums leading-none mb-1 truncate">
                  {data.topCities[0].name !== 'Unknown' ? data.topCities[0].name : '—'}
                </p>
                <p className="text-micro text-text-secondary">top location</p>
              </>
            ) : (
              <p className="text-small text-text-disabled">No location data</p>
            )}
          </div>
        </div>
      )}

      {/* Visitor feed FIRST */}
      <div className="mb-12 animate-slide-up-2">
        <div className="flex items-baseline justify-between mb-4">
          <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">People who viewed you</span>
          <span className="text-micro font-mono text-text-disabled">Last 30 days</span>
        </div>

        {/* Pro gate banner */}
        {!data.isPro && data.identifiedCompanyCount > 0 && (
          <div className="mb-4 flex items-center justify-between gap-4 border border-accent/20 bg-accent-subtle px-4 py-3 rounded-sm">
            <p className="text-small text-accent">
              <span className="font-medium">{data.identifiedCompanyCount} {data.identifiedCompanyCount === 1 ? 'company' : 'companies'}</span> viewed you — you just can&apos;t see who yet
            </p>
            <Button size="sm" asChild>
              <Link href={`/dashboard/upgrade?from=analytics&id=${portfolioId}`} onClick={() => track('analytics_upgrade_click', { trigger: 'gate_banner' })}>See who →</Link>
            </Button>
          </div>
        )}

        {/* Zero state */}
        {data.recentVisitors.length === 0 ? (
          <div className="border-t border-border relative">
            {/* Blurred mock rows */}
            <div className="select-none pointer-events-none" aria-hidden="true">
              {['Razorpay', 'Unknown visitor', 'Zepto'].map((label, i) => (
                <div key={i} className="py-4 flex items-start justify-between gap-4 border-b border-border opacity-30 blur-[2px]">
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${i !== 1 ? 'bg-accent' : 'bg-border'}`} />
                    <div>
                      <p className={`text-small ${i !== 1 ? 'font-medium text-text-primary' : 'text-text-disabled'}`}>{label}</p>
                      <p className="text-micro font-mono text-text-disabled mt-0.5">Mumbai, India · via linkedin.com · 2m 14s</p>
                    </div>
                  </div>
                  <span className="text-micro font-mono text-text-disabled">3h ago</span>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60">
              <p className="text-small font-medium text-text-primary">No visits yet</p>
              <p className="text-small text-text-secondary text-center max-w-xs">
                Once someone opens your portfolio, they&apos;ll appear here. The first view is closer than you think.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border border-t border-border">
            {(data.isPro ? data.recentVisitors : data.recentVisitors.slice(0, 5)).map((v, i) => {
              const identified   = v.company && v.company !== 'Unknown'
              const durationLabel = formatDuration(v.duration)
              return (
                <div key={`${v.visitedAt}-${i}`} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${identified ? 'bg-accent' : 'bg-border'}`} />
                    <div className="min-w-0">
                      {identified
                        ? <p className="text-body font-semibold text-text-primary tracking-tight">{v.company}</p>
                        : <p className="text-small text-text-disabled">Unknown visitor</p>
                      }
                      <p className="text-micro font-mono text-text-disabled mt-0.5">
                        {[v.city !== 'Unknown' ? v.city : null, v.country !== 'Unknown' ? v.country : null].filter(Boolean).join(', ') || 'Location unknown'}
                        {v.referrer && v.referrer !== 'direct' && <> · via {formatReferrer(v.referrer)}</>}
                        {durationLabel && <span className={durationLabel === 'Quick glance' ? '' : 'text-accent'}> · {durationLabel}</span>}
                      </p>
                    </div>
                  </div>
                  <span className="text-micro font-mono text-text-disabled tabular-nums shrink-0 mt-0.5">
                    {timeAgo(v.visitedAt)}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {!data.isPro && data.recentVisitors.length > 5 && (
          <div className="pt-4 flex items-center justify-between border-t border-border">
            <p className="text-micro font-mono text-text-disabled">
              {data.recentVisitors.length - 5} more visit{data.recentVisitors.length - 5 !== 1 ? 's' : ''} · company names hidden
            </p>
            <Button size="sm" asChild>
              <Link href={`/dashboard/upgrade?from=analytics&id=${portfolioId}`}>Unlock Pro →</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Core metrics */}
      <div className="grid grid-cols-3 border border-border mb-12 animate-slide-up-3">
        {[
          { label: 'Total views',       value: data.totalViews.toString(),                               note: 'All recorded visits'        },
          { label: 'Unique visitors',   value: data.uniqueVisitors.toString(),                           note: 'Estimated distinct viewers'  },
          { label: 'Avg. time on page', value: data.avgDuration ? formatDuration(data.avgDuration) ?? '—' : '—', note: 'Time spent viewing' },
        ].map(({ label, value, note }, i) => (
          <div key={label} className={`p-6 ${i < 2 ? 'border-r border-border' : ''}`}>
            <p className="text-[2rem] font-bold font-mono text-text-primary tabular-nums leading-none mb-2">{value}</p>
            <p className="text-micro font-mono text-text-primary mb-0.5">{label}</p>
            <p className="text-micro text-text-disabled">{note}</p>
          </div>
        ))}
      </div>

      {/* Breakdown columns — companies dominant */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr] gap-10 animate-slide-up-4">
        {/* Companies — dominant */}
        <div>
          <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">Companies who viewed you</span>
          {data.topCompanies.filter(c => c.name !== 'Unknown').length === 0 ? (
            <p className="text-micro text-text-disabled">No companies identified yet — they appear as views come in</p>
          ) : (
            <BreakdownSection
              items={(data.isPro ? data.topCompanies : data.topCompanies.slice(0, 3)).filter(c => c.name !== 'Unknown')}
              total={data.totalViews}
              isPro={data.isPro}
              portfolioId={portfolioId}
              hiddenCount={data.isPro ? 0 : Math.max(0, data.topCompanies.filter(c => c.name !== 'Unknown').length - 3)}
            />
          )}
        </div>

        {/* Locations */}
        <div>
          <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">Where they came from</span>
          {data.topCities.length === 0 ? (
            <p className="text-micro text-text-disabled">No location data yet</p>
          ) : (
            <BreakdownSection
              items={data.isPro ? data.topCities : data.topCities.slice(0, 2)}
              total={data.totalViews}
              isPro={data.isPro}
              portfolioId={portfolioId}
              hiddenCount={0}
            />
          )}
        </div>

        {/* Sources */}
        <div>
          <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">How they found you</span>
          {data.topReferrers.length === 0 ? (
            <p className="text-micro text-text-disabled">No sources tracked yet</p>
          ) : (
            <BreakdownSection
              items={(data.isPro ? data.topReferrers : data.topReferrers.slice(0, 2)).map(r => ({
                ...r, name: formatReferrer(r.name),
              }))}
              total={data.totalViews}
              isPro={data.isPro}
              portfolioId={portfolioId}
              hiddenCount={0}
            />
          )}
        </div>
      </div>
    </Shell>
  )
}

// ─── Breakdown section ────────────────────────────────────
function BreakdownSection({ items, total, portfolioId, hiddenCount }: {
  items: { name: string; count: number }[]
  total: number
  isPro?: boolean
  portfolioId: string | null
  hiddenCount: number
}) {
  const maxCount = Math.max(...items.map(i => i.count), 1)
  return (
    <div className="space-y-3">
      {items.map(item => {
        const share = total > 0 ? Math.round((item.count / total) * 100) : 0
        const width = Math.round((item.count / maxCount) * 100)
        return (
          <div key={item.name}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-small text-text-primary truncate">{item.name}</span>
              <span className="text-micro font-mono text-text-disabled tabular-nums ml-2">{share}%</span>
            </div>
            <div className="h-px w-full bg-border relative">
              <div className="absolute top-[-0.5px] left-0 h-[2px] bg-accent/50" style={{ width: `${width}%` }} />
            </div>
          </div>
        )
      })}
      {hiddenCount > 0 && (
        <div className="pt-1 flex items-center justify-between">
          <p className="text-micro font-mono text-text-disabled">+{hiddenCount} more</p>
          <Button size="sm" variant="secondary" asChild>
            <Link href={`/dashboard/upgrade?from=analytics&id=${portfolioId}`}>Unlock</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Shell ────────────────────────────────────────────────
function Shell({ children, userName, userInitial }: { children: React.ReactNode; userName?: string; userInitial?: string }) {
  return (
    <div className="min-h-screen bg-background">
      <AppNav userName={userName} userInitial={userInitial} />
      <main className="mx-auto max-w-4xl px-6 py-10 lg:px-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors mb-8">
          ← Dashboard
        </Link>
        {children}
      </main>
    </div>
  )
}

// ─── Loading ──────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-10 animate-fade-in">
      <div className="h-5 w-48 bg-border rounded animate-shimmer" />
      <div className="space-y-3 border-t border-border pt-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-border">
            <div className="w-1.5 h-1.5 rounded-full bg-border" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-32 bg-border rounded animate-shimmer" />
              <div className="h-2.5 w-48 bg-border rounded animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 border border-border">
        {[1, 2, 3].map(i => (
          <div key={i} className={`p-6 ${i < 3 ? 'border-r border-border' : ''}`}>
            <div className="h-8 w-16 bg-border rounded animate-shimmer mb-3" />
            <div className="h-3 w-24 bg-border rounded animate-shimmer" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────
function formatDuration(s: number | null): string | null {
  if (!s || s <= 0) return null
  if (s < 30)  return 'Quick glance'
  if (s < 60)  return `${s}s`
  const m = Math.floor(s / 60), sec = s % 60
  return sec > 0 ? `${m}m ${sec}s` : `${m}m`
}

function formatReferrer(r: string) {
  if (!r || r === 'direct') return 'Direct'
  try {
    return new URL(r).hostname.replace(/^www\./, '')
  } catch {
    return r.replace(/^www\./, '')
  }
}

function timeAgo(dateStr: string): string {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (s < 60)    return 'Just now'
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
