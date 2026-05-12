'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import type { Portfolio, IntelligenceReport, SkillGapLevel, CompanySignalType } from '@/lib/types'
import { track } from '@/lib/funnel'

// ─── Gap level → mono label style ─────────────────────────
const GAP_STYLES: Record<SkillGapLevel, string> = {
  'critical':     'text-error',
  'important':    'text-warning',
  'nice-to-have': 'text-text-disabled',
}

const GAP_DISPLAY: Record<SkillGapLevel, string> = {
  'critical':     'Fix first',
  'important':    'High value',
  'nice-to-have': 'Nice to have',
}

const SIGNAL_STYLES: Record<CompanySignalType, string> = {
  'hiring-surge':   'text-success',
  'funding':        'text-accent',
  'expansion':      'text-accent',
  'product-launch': 'text-warning',
}

// ─── Icons ─────────────────────────────────────────────────
function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
      <path d="M8 16H3v5"/>
    </svg>
  )
}

// ─── Page ──────────────────────────────────────────────────
function IntelligencePageContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  const [portfolios,  setPortfolios]  = useState<Portfolio[]>([])
  const [selectedId,  setSelectedId]  = useState<string>('')
  const [report,      setReport]      = useState<IntelligenceReport | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [generating,  setGenerating]  = useState(false)
  const [userName,    setUserName]    = useState('')
  const [userInitial, setUserInitial] = useState('?')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const fullName = user.user_metadata?.full_name as string ?? ''
      setUserName(fullName)
      setUserInitial(fullName.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?')

      const { data } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      const list = (data ?? []) as Portfolio[]
      setPortfolios(list)

      const paramId = searchParams.get('id')
      const initial = paramId ?? list[0]?.id ?? ''
      setSelectedId(initial)
      setLoading(false)
      track('intelligence_page_view', { portfolio_count: list.length })
    }
    load()
  }, [router, supabase, searchParams])

  const generate = useCallback(async (id: string) => {
    if (!id) return
    setGenerating(true)
    setReport(null)

    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 30_000)

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
      const data = await res.json() as IntelligenceReport
      setReport(data)
      track('intelligence_generation_success', { portfolio_id: id, readiness: data.readiness?.overall ?? 0 })
    } catch (err) {
      clearTimeout(timeoutId)
      const msg = err instanceof Error ? err.message : 'unknown'
      track('intelligence_generation_error', { portfolio_id: id, error: msg })
      console.error('[intelligence] generate failed:', err)
    } finally {
      setGenerating(false)
    }
  }, [router])

  useEffect(() => {
    if (selectedId && !loading) generate(selectedId)
  }, [selectedId, loading, generate])

  const selectedPortfolio = portfolios.find(p => p.id === selectedId)

  return (
    <div className="min-h-screen bg-background">

      <main className="mx-auto max-w-4xl px-6 lg:px-8 py-12">

        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors mb-8 block">
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-baseline justify-between mb-10 animate-slide-up-1">
          <div>
            <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-1">Intelligence</span>
            <h1 className="text-h3 font-bold text-text-primary tracking-tight">Career Intelligence</h1>
            <p className="text-small text-text-secondary mt-1">
              What the market says about you, right now.
            </p>
          </div>
          {report && (
            <Button variant="secondary" size="sm" onClick={() => generate(selectedId)} className="flex items-center gap-1.5 shrink-0">
              <RefreshIcon />
              Refresh
            </Button>
          )}
        </div>

        {/* Portfolio selector */}
        {portfolios.length > 1 && (
          <div className="flex items-center gap-4 mb-8 border-b border-border pb-6 animate-slide-up-2">
            <span className="text-micro font-mono text-text-disabled">Analyzing</span>
            <div className="flex items-center gap-1">
              {portfolios.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`px-3 py-1 text-micro font-mono transition-colors ${
                    selectedId === p.id
                      ? 'text-text-primary border-b border-accent'
                      : 'text-text-disabled hover:text-text-secondary'
                  }`}
                >
                  {p.data?.name ?? p.data?.headline ?? 'Portfolio'}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : portfolios.length === 0 ? (
          <div className="py-20">
            <p className="text-small text-text-disabled mb-4">Intelligence runs on your portfolio data — you don&apos;t have one yet.</p>
            <Button asChild><Link href="/onboarding">Build your portfolio →</Link></Button>
          </div>
        ) : generating ? (
          <GeneratingState role={selectedPortfolio?.data?.role ?? selectedPortfolio?.data?.headline ?? 'your role'} />
        ) : report ? (
          <ReportView report={report} portfolioId={selectedId} />
        ) : selectedId ? (
          <div className="py-10">
            <p className="text-small text-text-disabled">
              Couldn&apos;t load your intelligence report.{' '}
              <button onClick={() => generate(selectedId)} className="text-accent hover:text-accent/80 transition-colors">
                Try again →
              </button>
            </p>
          </div>
        ) : null}
      </main>
    </div>
  )
}

// ─── Loading ───────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="h-3 w-20 bg-border rounded animate-shimmer" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-3 bg-border rounded animate-shimmer" />)}
      </div>
    </div>
  )
}

// ─── Generating ────────────────────────────────────────────
function GeneratingState({ role }: { role: string }) {
  const steps = [
    'Scanning job market signals…',
    `Mapping skill gaps for ${role}…`,
    'Identifying high-fit companies…',
    'Calculating readiness score…',
  ]
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 1400)
    return () => clearInterval(t)
  }, [steps.length])

  return (
    <div className="py-20 flex flex-col gap-6 animate-fade-in">
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-px flex-1 transition-all duration-500 ${i <= step ? 'bg-accent' : 'bg-border'}`}
          />
        ))}
      </div>
      <div>
        <p className="text-small text-text-primary font-mono">{steps[step]}</p>
        <p className="text-micro text-text-disabled mt-1">10–15 seconds — then you&apos;ll see your full picture</p>
      </div>
    </div>
  )
}

// ─── Report ────────────────────────────────────────────────
function ReportView({ report, portfolioId }: { report: IntelligenceReport; portfolioId: string }) {
  const { readiness, skillGaps, market, companies } = report

  return (
    <div className="space-y-12 animate-slide-up-2">

      {/* Readiness — 3-column metric row */}
      <section>
        <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">Your readiness</span>
        <div className="grid grid-cols-3 border border-border mb-6">
          <div className="p-6 border-r border-border">
            <p className="text-[2.5rem] font-bold font-mono text-text-primary tabular-nums leading-none mb-1">{readiness.overall}</p>
            <p className="text-micro font-mono text-text-disabled">Overall</p>
          </div>
          <div className="col-span-2 p-6 grid grid-cols-2 gap-x-8 gap-y-3 content-center">
            {Object.entries(readiness.breakdown).map(([key, val]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-micro text-text-disabled capitalize">{key}</span>
                  <span className="text-micro font-mono text-text-primary tabular-nums">{val}</span>
                </div>
                <div className="h-px w-full bg-border relative">
                  <div className="absolute top-[-0.5px] left-0 h-[2px] bg-accent/50" style={{ width: `${val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strongest / Biggest gap — two flat rows */}
        <div className="divide-y divide-border border-t border-border">
          <div className="py-4 grid grid-cols-[80px_1fr] gap-4">
            <span className="text-micro font-mono text-success uppercase tracking-widest pt-0.5">Strength</span>
            <p className="text-small text-text-primary">{readiness.topWin}</p>
          </div>
          <div className="py-4 grid grid-cols-[80px_1fr] gap-4">
            <span className="text-micro font-mono text-warning uppercase tracking-widest pt-0.5">Gap</span>
            <p className="text-small text-text-primary">{readiness.topGap}</p>
          </div>
        </div>
      </section>

      {/* Skill gaps — flat ledger */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Skill gaps</span>
          <span className="text-micro font-mono text-text-disabled">{skillGaps.length} gaps to close</span>
        </div>
        <div className="divide-y divide-border border-t border-border">
          {skillGaps.slice(0, 5).map((gap, i) => (
            <div key={i} className="py-3.5 grid grid-cols-[80px_1fr_auto] gap-4 items-baseline">
              <span className={`text-micro font-mono uppercase tracking-widest ${GAP_STYLES[gap.level]}`}>
                {GAP_DISPLAY[gap.level]}
              </span>
              <div>
                <p className="text-small text-text-primary">{gap.skill}</p>
                <p className="text-micro text-text-disabled mt-0.5">{gap.reason}</p>
              </div>
              <span className="text-micro font-mono text-text-disabled shrink-0">{gap.timeToLearn}</span>
            </div>
          ))}
          {skillGaps.length > 5 && (
            <div className="py-3.5">
              <Link
                href={`/dashboard/intelligence/skills?id=${portfolioId}`}
                className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors"
              >
                +{skillGaps.length - 5} more →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Market pulse — metric grid */}
      <section>
        <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">Market pulse</span>
        <div className="grid grid-cols-4 border border-border mb-4">
          {[
            { label: 'Demand score',  value: `${market.demandScore}`, sub: market.trendLabel },
            { label: 'Median salary', value: `$${(market.salaryRange.median / 1000).toFixed(0)}K`, sub: `$${(market.salaryRange.low/1000).toFixed(0)}K–$${(market.salaryRange.high/1000).toFixed(0)}K` },
            { label: 'Remote',        value: `${market.remotePercent}%`, sub: 'of open roles' },
            { label: 'Top location',  value: market.topLocations[0] ?? '—', sub: market.topLocations[1] ?? '' },
          ].map(({ label, value, sub }, i) => (
            <div key={label} className={`p-4 ${i < 3 ? 'border-r border-border' : ''}`}>
              <p className="text-micro font-mono text-text-disabled mb-1">{label}</p>
              <p className="text-small font-bold font-mono text-text-primary tabular-nums">{value}</p>
              {sub && <p className="text-micro text-text-disabled mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>
        <p className="text-small text-text-secondary border-l-2 border-border pl-3">{market.insight}</p>
      </section>

      {/* Company signals — flat list */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Company signals</span>
          <Link
            href={`/dashboard/intelligence/companies?id=${portfolioId}`}
            className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors"
          >
            All →
          </Link>
        </div>
        <div className="divide-y divide-border border-t border-border">
          {companies.slice(0, 5).map((co, i) => (
            <div key={i} className="py-3.5 grid grid-cols-[1fr_auto] gap-4 items-start">
              <div>
                <div className="flex items-center gap-3 mb-0.5">
                  <p className="text-small text-text-primary">{co.name}</p>
                  <span className={`text-micro font-mono uppercase tracking-widest ${SIGNAL_STYLES[co.signal]}`}>
                    {co.signalLabel}
                  </span>
                </div>
                <p className="text-micro text-text-disabled">{co.why}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="h-px w-16 bg-border relative">
                    <div className="absolute top-[-0.5px] left-0 h-[2px] bg-accent/50" style={{ width: `${co.fitScore}%` }} />
                  </div>
                  <span className="text-micro font-mono text-text-disabled tabular-nums">{co.fitScore}% fit</span>
                </div>
              </div>
              <span className={`text-micro font-mono uppercase tracking-widest shrink-0 mt-0.5 ${co.urgency === 'high' ? 'text-accent' : 'text-text-disabled'}`}>
                {co.urgency}
              </span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}

export default function IntelligencePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background"><LoadingSkeleton /></div>}>
      <IntelligencePageContent />
    </Suspense>
  )
}
