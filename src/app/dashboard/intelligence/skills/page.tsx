'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { SkeletonCard } from '@/components/ui/skeleton'
import type { IntelligenceReport, SkillGap, SkillGapLevel } from '@/lib/types'

// ─── Icons ────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────

const LEVEL_CONFIG: Record<SkillGapLevel, { label: string; color: string; bg: string; bar: string; order: number }> = {
  'critical':     { label: 'Critical',      color: 'text-error',    bg: 'bg-error-subtle border-error-border',    bar: 'bg-error',    order: 0 },
  'important':    { label: 'Important',     color: 'text-warning',  bg: 'bg-warning-subtle border-warning-border',bar: 'bg-warning',  order: 1 },
  'nice-to-have': { label: 'Nice to have',  color: 'text-accent',   bg: 'bg-accent-subtle border-border',         bar: 'bg-accent',   order: 2 },
}

function SkillGapCard({ gap, index }: { gap: SkillGap; index: number }) {
  const cfg = LEVEL_CONFIG[gap.level]
  return (
    <div
      className="bg-surface border border-border rounded-xl p-5 animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-h3 font-bold text-text-primary">{gap.skill}</span>
          <span className={`text-micro px-2 py-0.5 rounded border font-medium ${cfg.color} ${cfg.bg}`}>
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-1 text-text-disabled shrink-0">
          <ClockIcon />
          <span className="text-micro">{gap.timeToLearn}</span>
        </div>
      </div>

      <p className="text-small text-text-secondary mb-4">{gap.reason}</p>

      <div className={`rounded-lg border p-3 flex items-start gap-2 ${cfg.bg}`}>
        <BookIcon />
        <div className="min-w-0">
          <p className="text-micro font-semibold text-text-primary mb-0.5">Learning path</p>
          <p className="text-micro text-text-secondary">{gap.learningPath}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Skill distribution bar ───────────────────────────────

function DistributionBar({ gaps }: { gaps: SkillGap[] }) {
  const counts = {
    critical:     gaps.filter(g => g.level === 'critical').length,
    important:    gaps.filter(g => g.level === 'important').length,
    'nice-to-have': gaps.filter(g => g.level === 'nice-to-have').length,
  }
  const total = gaps.length || 1

  return (
    <div className="bg-surface border border-border rounded-xl p-5 mb-6">
      <h2 className="text-small font-semibold text-text-primary mb-4">Gap distribution</h2>
      <div className="flex h-3 rounded-full overflow-hidden mb-3 gap-0.5">
        {counts.critical     > 0 && <div className="bg-error   rounded-full" style={{ width: `${(counts.critical / total) * 100}%` }} />}
        {counts.important    > 0 && <div className="bg-warning rounded-full" style={{ width: `${(counts.important / total) * 100}%` }} />}
        {counts['nice-to-have'] > 0 && <div className="bg-accent rounded-full" style={{ width: `${(counts['nice-to-have'] / total) * 100}%` }} />}
      </div>
      <div className="flex items-center gap-4">
        {(Object.entries(counts) as [SkillGapLevel, number][]).map(([level, count]) => (
          count > 0 && (
            <div key={level} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${LEVEL_CONFIG[level].bar}`} />
              <span className="text-micro text-text-secondary">{count} {LEVEL_CONFIG[level].label.toLowerCase()}</span>
            </div>
          )
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────

function SkillsPageContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  const [report,      setReport]      = useState<IntelligenceReport | null>(null)
  const [genError,    setGenError]    = useState<string | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [generating,  setGenerating]  = useState(false)
  const [userName,    setUserName]    = useState('')
  const [userInitial, setUserInitial] = useState('?')
  const [filter,      setFilter]      = useState<SkillGapLevel | 'all'>('all')

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

  const gaps = report?.skillGaps ?? []
  const filtered = filter === 'all' ? gaps : gaps.filter(g => g.level === filter)
  const sorted   = [...filtered].sort((a, b) => LEVEL_CONFIG[a.level].order - LEVEL_CONFIG[b.level].order)

  return (
    <div className="min-h-screen bg-background">

      <main className="mx-auto max-w-4xl px-5 lg:px-8 py-10">

        {/* Breadcrumb */}
        <Link
          href={`/dashboard/intelligence${portfolioId ? `?id=${portfolioId}` : ''}`}
          className="flex items-center gap-1 text-small text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <BackIcon /> Back to Intelligence
        </Link>

        <div className="mb-8">
          <h1 className="text-h2 font-bold text-text-primary">Skill Gap Analysis</h1>
          <p className="text-body text-text-secondary mt-1">
            Skills you need to close for {report?.targetRole ?? 'your target role'}.
          </p>
        </div>

        {loading || generating ? (
          <div className="space-y-4">
            {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : genError ? (
          <div className="border border-error/30 bg-error/5 rounded px-5 py-4">
            <p className="text-small text-error">{genError}</p>
          </div>
        ) : !report ? (
          <p className="text-text-secondary">No portfolio selected. <Link href="/dashboard/intelligence" className="text-accent underline">Go back</Link>.</p>
        ) : (
          <>
            <DistributionBar gaps={gaps} />

            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-0.5 w-fit mb-6">
              {(['all', 'critical', 'important', 'nice-to-have'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-micro rounded-md whitespace-nowrap capitalize transition-all ${
                    filter === f
                      ? 'bg-background text-text-primary font-medium shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {f === 'all' ? `All (${gaps.length})` : `${LEVEL_CONFIG[f].label} (${gaps.filter(g => g.level === f).length})`}
                </button>
              ))}
            </div>

            {sorted.length === 0 ? (
              <p className="text-text-secondary text-center py-12">No gaps in this category.</p>
            ) : (
              <div className="space-y-3">
                {sorted.map((gap, i) => <SkillGapCard key={gap.skill} gap={gap} index={i} />)}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default function SkillsPage() {
  return (
    <Suspense>
      <SkillsPageContent />
    </Suspense>
  )
}
