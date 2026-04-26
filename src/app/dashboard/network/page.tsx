'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import AppNav from '@/components/ui/AppNav'
import { Button } from '@/components/ui/button'
import type { Connection, TargetCompany, TargetPriority, TargetStatus } from '@/lib/types'

// ─── Helpers ──────────────────────────────────────────────
const PRIORITY_STYLE: Record<TargetPriority, string> = {
  high:   'text-accent',
  medium: 'text-text-disabled',
  low:    'text-text-disabled',
}

const STATUS_LABELS: Record<TargetStatus, string> = {
  researching:  'Researching',
  'warm-path':  'Warm path',
  applied:      'Applied',
  interviewing: 'Interviewing',
  offer:        'Offer',
}

const STRENGTH_STYLE: Record<string, string> = {
  strong: 'text-success',
  medium: 'text-warning',
  weak:   'text-text-disabled',
}

// ─── Page ─────────────────────────────────────────────────
export default function NetworkPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [connections, setConnections] = useState<Connection[]>([])
  const [targets,     setTargets]     = useState<TargetCompany[]>([])
  const [loading,     setLoading]     = useState(true)
  const [userName,    setUserName]    = useState('')
  const [userInitial, setUserInitial] = useState('?')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const fullName = user.user_metadata?.full_name as string ?? ''
      setUserName(fullName)
      setUserInitial(fullName.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?')

      try {
        const [connsRes, targetsRes] = await Promise.all([
          fetch('/api/network/connections'),
          fetch('/api/network/targets'),
        ])

        setConnections(connsRes.ok ? await connsRes.json() as Connection[] : [])
        setTargets(targetsRes.ok ? await targetsRes.json() as TargetCompany[] : [])
      } catch (err) {
        console.error('[network] Failed to load:', err)
      }
      setLoading(false)
    }
    load()
  }, [router, supabase])

  const warmPaths = targets.filter(t =>
    connections.some(c => c.company.trim().toLowerCase() === t.company_name.trim().toLowerCase())
  )

  const isEmpty = connections.length === 0 && targets.length === 0

  return (
    <div className="min-h-screen bg-background">
      <AppNav userName={userName} userInitial={userInitial} />

      <main className="mx-auto max-w-4xl px-6 lg:px-8 py-12">

        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors mb-8 block">
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-baseline justify-between mb-10 animate-slide-up-1">
          <div>
            <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-1">Relationships</span>
            <h1 className="text-h3 font-bold text-text-primary tracking-tight">Your Network</h1>
            <p className="text-small text-text-secondary mt-1">
              Map connections to target companies. Find warm paths. Get referred.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="secondary" size="sm" asChild>
              <Link href="/dashboard/network/connections">Add connection</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/network/warm-paths">Warm paths</Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : isEmpty ? (
          <EmptyState />
        ) : (
          <div className="space-y-12 animate-slide-up-2">

            {/* Stat row — 3-column ledger */}
            <div className="grid grid-cols-3 border border-border">
              {[
                { label: 'Connections',       value: connections.length, href: '/dashboard/network/connections' },
                { label: 'Target companies',  value: targets.length,     href: '/dashboard/network/connections' },
                { label: 'Warm paths',        value: warmPaths.length,   href: '/dashboard/network/warm-paths' },
              ].map(({ label, value, href }, i) => (
                <Link key={label} href={href} className={`p-6 hover:bg-surface transition-colors ${i < 2 ? 'border-r border-border' : ''}`}>
                  <p className="text-[2rem] font-bold font-mono text-text-primary tabular-nums leading-none mb-1">{value}</p>
                  <p className="text-micro font-mono text-text-disabled">{label}</p>
                </Link>
              ))}
            </div>

            {/* Warm paths */}
            {warmPaths.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Warm paths</span>
                  <Link href="/dashboard/network/warm-paths" className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors">
                    Full analysis →
                  </Link>
                </div>
                <div className="divide-y divide-border border-t border-border">
                  {warmPaths.slice(0, 3).map(t => {
                    const matched = connections.filter(c =>
                      c.company.toLowerCase() === t.company_name.toLowerCase()
                    )
                    return (
                      <div key={t.id} className="py-3.5 grid grid-cols-[1fr_auto] gap-4 items-start">
                        <div>
                          <p className="text-small text-text-primary">{t.company_name}</p>
                          <p className="text-micro text-text-disabled mt-0.5">
                            {t.target_role}
                            {' · '}
                            {matched.slice(0, 2).map(c => c.name.split(' ')[0]).join(', ')}
                            {matched.length > 2 ? ` +${matched.length - 2}` : ''}
                          </p>
                        </div>
                        <Link
                          href={`/dashboard/network/outreach?targetId=${t.id}`}
                          className="text-micro font-mono text-accent hover:text-accent/70 transition-colors shrink-0 mt-0.5"
                        >
                          Draft outreach →
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Two-column: connections + targets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

              <section>
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Recent connections</span>
                  <Link href="/dashboard/network/connections" className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors">Manage →</Link>
                </div>
                <div className="divide-y divide-border border-t border-border">
                  {connections.slice(0, 5).map(c => (
                    <div key={c.id} className="py-3 grid grid-cols-[1fr_auto] gap-3 items-baseline">
                      <div>
                        <p className="text-small text-text-primary">{c.name}</p>
                        <p className="text-micro text-text-disabled mt-0.5">{c.role}{c.company ? ` · ${c.company}` : ''}</p>
                      </div>
                      <span className={`text-micro font-mono uppercase tracking-widest shrink-0 ${STRENGTH_STYLE[c.strength] ?? 'text-text-disabled'}`}>
                        {c.strength}
                      </span>
                    </div>
                  ))}
                  {connections.length > 5 && (
                    <div className="py-3">
                      <Link href="/dashboard/network/connections" className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors">
                        +{connections.length - 5} more
                      </Link>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Target companies</span>
                  <Link href="/dashboard/network/connections?tab=targets" className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors">Manage →</Link>
                </div>
                <div className="divide-y divide-border border-t border-border">
                  {targets.slice(0, 5).map(t => (
                    <div key={t.id} className="py-3 grid grid-cols-[1fr_auto] gap-3 items-baseline">
                      <div>
                        <p className="text-small text-text-primary">{t.company_name}</p>
                        <p className="text-micro text-text-disabled mt-0.5">{t.target_role}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-micro font-mono uppercase tracking-widest ${PRIORITY_STYLE[t.priority]}`}>{t.priority}</span>
                        <span className="text-micro text-text-disabled">{STATUS_LABELS[t.status]}</span>
                      </div>
                    </div>
                  ))}
                  {targets.length > 5 && (
                    <div className="py-3">
                      <Link href="/dashboard/network/connections?tab=targets" className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors">
                        +{targets.length - 5} more
                      </Link>
                    </div>
                  )}
                </div>
              </section>

            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Loading ──────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-3 border border-border">
        {[1, 2, 3].map(i => (
          <div key={i} className={`p-6 ${i < 3 ? 'border-r border-border' : ''}`}>
            <div className="h-8 w-10 bg-border rounded animate-shimmer mb-2" />
            <div className="h-3 w-20 bg-border rounded animate-shimmer" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-3 bg-border rounded animate-shimmer" />)}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────
function EmptyState() {
  return (
    <div className="py-20 animate-slide-up-2">
      <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-3">No data</span>
      <p className="text-small text-text-secondary mb-6 max-w-sm">
        Add people you know and companies you&apos;re targeting. We&apos;ll find warm paths and help you draft outreach.
      </p>
      <div className="flex items-center gap-3">
        <Button size="sm" asChild>
          <Link href="/dashboard/network/connections">Add first connection</Link>
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/dashboard/network/connections?tab=targets">Add target company</Link>
        </Button>
      </div>
    </div>
  )
}
