'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard } from '@/components/ui/skeleton'
import type { IntelligenceReport, CompanySignal, CompanySignalType } from '@/lib/types'

// ─── Icons ────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  )
}

function BriefcaseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  )
}

function LightningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────

const SIGNAL_CONFIG: Record<CompanySignalType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  'hiring-surge':   { label: 'Hiring surge',    color: 'text-success',  bg: 'bg-success-subtle border-success-border',   icon: <BriefcaseIcon /> },
  'funding':        { label: 'New funding',      color: 'text-accent',   bg: 'bg-accent-subtle border-border',            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg> },
  'expansion':      { label: 'Expanding',        color: 'text-accent',   bg: 'bg-accent-subtle border-border',            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
  'product-launch': { label: 'Product launch',   color: 'text-warning',  bg: 'bg-warning-subtle border-warning-border',   icon: <LightningIcon /> },
}

const URGENCY_VARIANTS: Record<string, 'default' | 'secondary'> = {
  high:   'default',
  medium: 'secondary',
  low:    'secondary',
}

function FitScoreStars({ score }: { score: number }) {
  const filled = Math.round((score / 100) * 5)
  return (
    <div className="flex items-center gap-0.5 text-accent">
      {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= filled} />)}
      <span className="text-micro text-text-secondary ml-1">{score}% fit</span>
    </div>
  )
}

function CompanyCard({ co, index }: { co: CompanySignal; index: number }) {
  const signal = SIGNAL_CONFIG[co.signal]

  return (
    <div
      className="bg-surface border border-border rounded-xl p-5 animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Company initial avatar */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-subtle border border-accent/20 flex items-center justify-center text-small font-bold text-accent shrink-0">
            {co.name.charAt(0)}
          </div>
          <div>
            <p className="text-body font-semibold text-text-primary">{co.name}</p>
            <p className="text-micro text-text-secondary">{co.openRoles} open role{co.openRoles !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Badge variant={URGENCY_VARIANTS[co.urgency]} className="text-micro shrink-0">
          {co.urgency} urgency
        </Badge>
      </div>

      {/* Signal badge */}
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-micro font-medium mb-3 ${signal.color} ${signal.bg}`}>
        {signal.icon}
        {co.signalLabel}
      </div>

      <p className="text-small text-text-secondary mb-4 leading-relaxed">{co.why}</p>

      {/* Fit score */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <FitScoreStars score={co.fitScore} />
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-700"
              style={{ width: `${co.fitScore}%`, transitionDelay: `${index * 60}ms` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sort / filter bar ────────────────────────────────────

type SortKey = 'fit' | 'urgency' | 'roles'

function sortCompanies(companies: CompanySignal[], sort: SortKey): CompanySignal[] {
  return [...companies].sort((a, b) => {
    if (sort === 'fit')     return b.fitScore   - a.fitScore
    if (sort === 'roles')   return b.openRoles  - a.openRoles
    if (sort === 'urgency') {
      const order = { high: 0, medium: 1, low: 2 }
      return order[a.urgency] - order[b.urgency]
    }
    return 0
  })
}

// ─── Page ─────────────────────────────────────────────────

function CompaniesPageContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  const [report,      setReport]      = useState<IntelligenceReport | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [generating,  setGenerating]  = useState(false)
  const [genError,    setGenError]    = useState<string | null>(null)
  const [userName,    setUserName]    = useState('')
  const [userInitial, setUserInitial] = useState('?')
  const [sort,        setSort]        = useState<SortKey>('fit')

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

  const companies = sortCompanies(report?.companies ?? [], sort)

  return (
    <div className="min-h-screen bg-background">

      <main className="mx-auto max-w-4xl px-5 lg:px-8 py-10">

        <Link
          href={`/dashboard/intelligence${portfolioId ? `?id=${portfolioId}` : ''}`}
          className="flex items-center gap-1 text-small text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <BackIcon /> Back to Intelligence
        </Link>

        <div className="mb-8">
          <h1 className="text-h2 font-bold text-text-primary">Company Signals</h1>
          <p className="text-body text-text-secondary mt-1">
            Companies worth targeting right now — ranked by fit and timing.
          </p>
        </div>

        {loading || generating ? (
          <div className="space-y-4">
            {[0,1,2,3,4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : genError ? (
          <div className="border border-error/30 bg-error/5 rounded px-5 py-4">
            <p className="text-small text-error">{genError}</p>
          </div>
        ) : !report ? (
          <p className="text-text-secondary">No portfolio selected. <Link href="/dashboard/intelligence" className="text-accent underline">Go back</Link>.</p>
        ) : (
          <>
            {/* Sort bar */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-small text-text-secondary shrink-0">Sort by:</span>
              <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-0.5">
                {(['fit', 'urgency', 'roles'] as SortKey[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`px-3 py-1.5 text-micro rounded-md capitalize whitespace-nowrap transition-all ${
                      sort === s
                        ? 'bg-background text-text-primary font-medium shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {s === 'fit' ? 'Best fit' : s === 'roles' ? 'Open roles' : 'Urgency'}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-surface border border-border rounded-lg p-3 text-center">
                <p className="text-h2 font-bold text-text-primary">{companies.length}</p>
                <p className="text-micro text-text-secondary">companies</p>
              </div>
              <div className="bg-surface border border-border rounded-lg p-3 text-center">
                <p className="text-h2 font-bold text-text-primary">
                  {companies.reduce((sum, c) => sum + c.openRoles, 0)}
                </p>
                <p className="text-micro text-text-secondary">open roles</p>
              </div>
              <div className="bg-surface border border-border rounded-lg p-3 text-center">
                <p className="text-h2 font-bold text-text-primary">
                  {companies.filter(c => c.urgency === 'high').length}
                </p>
                <p className="text-micro text-text-secondary">high urgency</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companies.map((co, i) => (
                <CompanyCard key={co.name} co={co} index={i} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default function CompaniesPage() {
  return (
    <Suspense>
      <CompaniesPageContent />
    </Suspense>
  )
}
