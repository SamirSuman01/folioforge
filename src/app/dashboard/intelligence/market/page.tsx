'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import AppNav from '@/components/ui/AppNav'
import { SkeletonCard } from '@/components/ui/skeleton'
import type { IntelligenceReport, MarketSignal, DemandTrend } from '@/lib/types'

// ─── Icons ────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  )
}

function TrendUpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  )
}

function TrendDownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/>
      <polyline points="16 17 22 17 22 11"/>
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────

const TREND_CONFIG: Record<DemandTrend, { icon: React.ReactNode; color: string; bg: string }> = {
  rising:    { icon: <TrendUpIcon />,   color: 'text-success',  bg: 'bg-success-subtle border-success-border'  },
  stable:    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>, color: 'text-accent', bg: 'bg-accent-subtle border-border' },
  declining: { icon: <TrendDownIcon />, color: 'text-error',   bg: 'bg-error-subtle border-error-border'    },
}

function SalaryBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-micro text-text-secondary">{label}</span>
        <span className="text-small font-semibold text-text-primary">${(value / 1000).toFixed(0)}K</span>
      </div>
      <div className="h-2.5 bg-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  )
}

function SkillDemandBar({ skill, index, total }: { skill: string; index: number; total: number }) {
  const width = Math.round(100 - (index / total) * 40)
  return (
    <div className="flex items-center gap-3">
      <span className="text-small text-text-primary w-32 shrink-0 truncate">{skill}</span>
      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-700"
          style={{ width: `${width}%`, transitionDelay: `${index * 80}ms` }}
        />
      </div>
      <span className="text-micro text-text-disabled w-8 text-right">{width}%</span>
    </div>
  )
}

// ─── Market view ──────────────────────────────────────────

function MarketView({ market, role }: { market: MarketSignal; role: string }) {
  const trend = TREND_CONFIG[market.trend]
  const salaryMax = market.salaryRange.high * 1.1

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Demand + trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-xl p-6">
          <p className="text-small text-text-secondary mb-2">Market demand for {role}</p>
          <div className="flex items-end gap-3 mb-4">
            <span className="text-4xl font-bold text-text-primary">{market.demandScore}</span>
            <span className="text-body text-text-secondary mb-1">/ 100</span>
          </div>
          <div className="h-3 bg-border rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${market.demandScore}%`,
                background: market.demandScore >= 70 ? '#173f35' : market.demandScore >= 50 ? '#c98561' : '#dc2626',
              }}
            />
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-small font-medium ${trend.color} ${trend.bg}`}>
            {trend.icon}
            {market.trendLabel}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <p className="text-small text-text-secondary mb-4">Work arrangement</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-4 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-700"
                style={{ width: `${market.remotePercent}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-small">
            <span className="font-semibold text-text-primary">{market.remotePercent}% remote</span>
            <span className="text-text-secondary">{100 - market.remotePercent}% on-site / hybrid</span>
          </div>
          <p className="text-micro text-text-disabled mt-4 leading-relaxed">{market.insight}</p>
        </div>
      </div>

      {/* Salary bands */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-small font-semibold text-text-primary mb-5">Salary range (US, 2024–2025)</h2>
        <div className="space-y-4">
          <SalaryBar label="Entry / Low"    value={market.salaryRange.low}    max={salaryMax} color="bg-border" />
          <SalaryBar label="Median"         value={market.salaryRange.median} max={salaryMax} color="bg-accent" />
          <SalaryBar label="Senior / High"  value={market.salaryRange.high}   max={salaryMax} color="bg-accent/60" />
        </div>
        <div className="mt-4 p-3 bg-accent-subtle border border-accent/10 rounded-lg text-small text-text-secondary">
          Median <span className="font-semibold text-text-primary">${(market.salaryRange.median / 1000).toFixed(0)}K</span> —
          range ${(market.salaryRange.low / 1000).toFixed(0)}K to ${(market.salaryRange.high / 1000).toFixed(0)}K {market.salaryRange.currency}
        </div>
      </div>

      {/* Top skills in demand */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-small font-semibold text-text-primary mb-5">Top skills in demand</h2>
        <div className="space-y-3">
          {market.topSkillsInDemand.map((skill, i) => (
            <SkillDemandBar key={skill} skill={skill} index={i} total={market.topSkillsInDemand.length} />
          ))}
        </div>
      </div>

      {/* Top locations */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-small font-semibold text-text-primary mb-4">Top hiring locations</h2>
        <div className="flex flex-wrap gap-2">
          {market.topLocations.map((loc, i) => (
            <div key={loc} className="flex items-center gap-1.5 px-3 py-2 bg-background border border-border rounded-lg">
              <MapPinIcon />
              <span className="text-small text-text-primary">{loc}</span>
              {i === 0 && <span className="text-micro text-accent font-medium">#1</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────

function MarketPageContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  const [report,      setReport]      = useState<IntelligenceReport | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [generating,  setGenerating]  = useState(false)
  const [genError,    setGenError]    = useState<string | null>(null)
  const [userName,    setUserName]    = useState('')
  const [userInitial, setUserInitial] = useState('?')

  const portfolioId = searchParams.get('id') ?? ''

  const generate = useCallback(async (id: string) => {
    setGenerating(true)
    setReport(null)
    setGenError(null)
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 60_000)
    try {
      const res  = await fetch('/api/intelligence', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ portfolioId: id }),
        signal:  controller.signal,
      })
      clearTimeout(timeoutId)
      if (res.status === 403) {
        router.push(`/dashboard/upgrade?from=intelligence&id=${id}`)
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setGenError((body as { error?: string }).error ?? 'Analysis failed — please try again.')
        return
      }
      const data = await res.json() as IntelligenceReport
      setReport(data)
    } catch (err) {
      clearTimeout(timeoutId)
      const isAbort = err instanceof Error && err.name === 'AbortError'
      setGenError(isAbort ? 'Analysis timed out (60s) — please try again.' : 'Network error — please try again.')
    } finally {
      setGenerating(false)
    }
  }, [router])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const fullName = user.user_metadata?.full_name as string ?? ''
      setUserName(fullName)
      setUserInitial(fullName.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?')
      setLoading(false)

      if (portfolioId) generate(portfolioId)
    }
    load()
  }, [router, supabase, portfolioId, generate])

  return (
    <div className="min-h-screen bg-background">
      <AppNav userName={userName} userInitial={userInitial} />

      <main className="mx-auto max-w-4xl px-5 lg:px-8 py-10">

        <Link
          href={`/dashboard/intelligence${portfolioId ? `?id=${portfolioId}` : ''}`}
          className="flex items-center gap-1 text-small text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <BackIcon /> Back to Intelligence
        </Link>

        <div className="mb-8">
          <h1 className="text-h2 font-bold text-text-primary">Market Pulse</h1>
          <p className="text-body text-text-secondary mt-1">
            Demand, salary, and location data for {report?.targetRole ?? 'your target role'}.
          </p>
        </div>

        {loading || generating ? (
          <div className="space-y-4">
            {[0,1,2].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : genError ? (
          <div className="border border-error/30 bg-error/5 rounded px-5 py-4">
            <p className="text-small text-error">{genError}</p>
          </div>
        ) : !report ? (
          <p className="text-text-secondary">No portfolio selected. <Link href="/dashboard/intelligence" className="text-accent underline">Go back</Link>.</p>
        ) : (
          <MarketView market={report.market} role={report.targetRole} />
        )}
      </main>
    </div>
  )
}

export default function MarketPage() {
  return (
    <Suspense>
      <MarketPageContent />
    </Suspense>
  )
}
