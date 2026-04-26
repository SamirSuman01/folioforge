'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import AppNav from '@/components/ui/AppNav'
import { Button } from '@/components/ui/button'
import { SkeletonCard } from '@/components/ui/skeleton'
import type { WarmPath, Portfolio } from '@/lib/types'

// ─── Icons ────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  )
}

function PathIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────

const STRENGTH_COLORS: Record<string, string> = {
  strong: 'bg-success-subtle text-success border-success-border',
  medium: 'bg-warning-subtle text-warning border-warning-border',
  weak:   'bg-border text-text-secondary border-border',
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 70 ? 'bg-success' : value >= 40 ? 'bg-warning' : 'bg-border'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-micro font-mono text-text-secondary w-8 text-right">{value}</span>
    </div>
  )
}

// ─── Path Card ─────────────────────────────────────────────

function PathCard({ path }: { path: WarmPath }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-background/60 transition-colors"
      >
        <div className="w-10 h-10 rounded bg-accent-subtle border border-accent/20 flex items-center justify-center text-body font-bold text-accent shrink-0">
          {path.target.company_name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-small font-semibold text-text-primary">{path.target.company_name}</p>
            <span className="text-micro font-mono text-text-disabled">{path.target.target_role}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {path.connections.slice(0, 3).map(c => (
                <span key={c.id} className={`text-micro px-1.5 py-0.5 rounded border font-medium ${STRENGTH_COLORS[c.strength]}`}>
                  {c.name.split(' ')[0]}
                </span>
              ))}
              {path.connections.length > 3 && (
                <span className="text-micro text-text-disabled">+{path.connections.length - 3} more</span>
              )}
            </div>
          </div>
        </div>
        <div className="shrink-0 w-32">
          <p className="text-micro text-text-disabled mb-1 font-mono">CONFIDENCE</p>
          <ConfidenceBar value={path.confidence} />
        </div>
        <div className={`shrink-0 transition-transform mt-1 ${open ? 'rotate-180' : ''}`}>
          <ChevronDownIcon />
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
          {/* Approach */}
          <div>
            <p className="text-micro font-mono text-text-disabled mb-1.5">AI APPROACH</p>
            <p className="text-small text-text-secondary leading-relaxed">{path.approach}</p>
          </div>

          {/* Connections detail */}
          <div>
            <p className="text-micro font-mono text-text-disabled mb-2">CONNECTIONS AT THIS COMPANY</p>
            <div className="space-y-2">
              {path.connections.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-accent-subtle border border-accent/20 flex items-center justify-center text-micro font-bold text-accent shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-small font-medium text-text-primary">{c.name}</p>
                    <p className="text-micro text-text-secondary">{c.role} · <span className="capitalize">{c.relationship}</span></p>
                  </div>
                  <span className={`text-micro px-1.5 py-0.5 rounded border font-medium shrink-0 ${STRENGTH_COLORS[c.strength]}`}>
                    {c.strength}
                  </span>
                  <Link
                    href={`/dashboard/network/outreach?connectionId=${c.id}&targetId=${path.target.id}`}
                    className="text-micro text-accent hover:underline shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    Draft outreach
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button asChild>
              <Link href={`/dashboard/network/outreach?targetId=${path.target.id}`}>
                Draft outreach for {path.target.company_name}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────

export default function WarmPathsPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [paths,       setPaths]       = useState<WarmPath[]>([])
  const [portfolios,  setPortfolios]  = useState<Portfolio[]>([])
  const [selectedPF,  setSelectedPF]  = useState<string>('')
  const [loading,     setLoading]     = useState(false)
  const [fetched,     setFetched]     = useState(false)
  const [userName,    setUserName]    = useState('')
  const [userInitial, setUserInitial] = useState('?')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const fullName = user.user_metadata?.full_name as string ?? ''
      setUserName(fullName)
      setUserInitial(fullName.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?')

      const res = await fetch('/api/portfolio')
      if (res.ok) {
        const pfs = await res.json() as Portfolio[]
        setPortfolios(pfs)
        if (pfs.length > 0) setSelectedPF(pfs[0].id)
      }
    }
    init()
  }, [router, supabase])

  async function analyze() {
    setLoading(true)
    setFetched(false)
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 60_000)
    try {
      const res = await fetch('/api/network/warm-paths', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ portfolioId: selectedPF || undefined }),
        signal:  controller.signal,
      })
      clearTimeout(timeoutId)
      if (res.ok) setPaths(await res.json() as WarmPath[])
    } catch { clearTimeout(timeoutId) }
    finally { setLoading(false); setFetched(true) }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav userName={userName} userInitial={userInitial} />

      <main className="mx-auto max-w-4xl px-5 lg:px-8 py-10">

        <Link href="/dashboard/network" className="flex items-center gap-1 text-small text-text-secondary hover:text-text-primary mb-6 transition-colors">
          <BackIcon /> Back to Network
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-accent mb-2">
              <PathIcon />
              <span className="text-micro font-mono uppercase tracking-wider">Warm path analysis</span>
            </div>
            <h1 className="text-h2 font-bold text-text-primary">Find warm paths</h1>
            <p className="text-body text-text-secondary mt-1">
              AI maps your connections to target companies and surfaces the highest-confidence paths to a referral.
            </p>
          </div>
        </div>

        {/* Run analysis */}
        <div className="bg-surface border border-border rounded-xl p-5 mb-6">
          <div className="flex items-end gap-4">
            {portfolios.length > 0 && (
              <div className="flex-1">
                <label className="text-micro font-mono text-text-disabled block mb-1.5">CONTEXT PORTFOLIO</label>
                <select
                  className="w-full px-3 py-2 text-small bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
                  value={selectedPF}
                  onChange={e => setSelectedPF(e.target.value)}
                >
                  {portfolios.map(p => (
                    <option key={p.id} value={p.id}>{p.data?.name || p.data?.headline || 'Portfolio'}</option>
                  ))}
                </select>
              </div>
            )}
            <Button onClick={analyze} disabled={loading} className="shrink-0">
              {loading ? 'Analyzing…' : fetched ? 'Re-analyze' : 'Analyze paths'}
            </Button>
          </div>
          {!fetched && !loading && (
            <p className="text-micro text-text-disabled mt-3">
              Requires at least one connection and one target company. Add them in{' '}
              <Link href="/dashboard/network/connections" className="text-accent hover:underline">Connections & Targets</Link>.
            </p>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : fetched && paths.length === 0 ? (
          <div className="text-center py-16 bg-surface border border-border rounded-xl">
            <p className="text-body font-medium text-text-primary mb-2">No warm paths found</p>
            <p className="text-small text-text-secondary mb-6">
              Add connections at your target companies to unlock warm paths.
            </p>
            <Button variant="secondary" asChild>
              <Link href="/dashboard/network/connections">Add connections</Link>
            </Button>
          </div>
        ) : paths.length > 0 ? (
          <div className="space-y-3">
            <p className="text-micro font-mono text-text-disabled">
              {paths.length} PATH{paths.length !== 1 ? 'S' : ''} IDENTIFIED — sorted by confidence
            </p>
            {paths.map((p, i) => <PathCard key={i} path={p} />)}
          </div>
        ) : null}

      </main>
    </div>
  )
}
