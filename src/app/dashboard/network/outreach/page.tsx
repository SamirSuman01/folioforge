'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import AppNav from '@/components/ui/AppNav'
import { Button } from '@/components/ui/button'
import type { Connection, TargetCompany, OutreachMessage, Portfolio } from '@/lib/types'

// ─── Icons ────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────

const STRENGTH_COLORS: Record<string, string> = {
  strong: 'bg-success-subtle text-success border-success-border',
  medium: 'bg-warning-subtle text-warning border-warning-border',
  weak:   'bg-border text-text-secondary border-border',
}

const TONE_LABELS: Record<string, string> = {
  warm:         'Warm',
  professional: 'Professional',
  casual:       'Casual',
}

// ─── Copy Button ───────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable */ }
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-micro text-text-secondary hover:text-text-primary transition-colors"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? 'Copied' : label}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────

function OutreachPageContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  const prefillConnectionId = searchParams.get('connectionId') ?? ''
  const prefillTargetId     = searchParams.get('targetId') ?? ''

  const [connections,  setConnections]  = useState<Connection[]>([])
  const [targets,      setTargets]      = useState<TargetCompany[]>([])
  const [portfolios,   setPortfolios]   = useState<Portfolio[]>([])
  const [userName,     setUserName]     = useState('')
  const [userInitial,  setUserInitial]  = useState('?')

  const [selectedConn,   setSelectedConn]   = useState(prefillConnectionId)
  const [selectedTarget, setSelectedTarget] = useState(prefillTargetId)
  const [selectedPF,     setSelectedPF]     = useState('')
  const [customRole,     setCustomRole]     = useState('')
  const [customCompany,  setCustomCompany]  = useState('')

  const [loading,  setLoading]  = useState(false)
  const [message,  setMessage]  = useState<OutreachMessage | null>(null)
  const [error,    setError]    = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const fullName = user.user_metadata?.full_name as string ?? ''
      setUserName(fullName)
      setUserInitial(fullName.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?')

      const [connsRes, targetsRes, pfsRes] = await Promise.all([
        fetch('/api/network/connections'),
        fetch('/api/network/targets'),
        fetch('/api/portfolio'),
      ])

      const conns   = connsRes.ok   ? await connsRes.json()   as Connection[]    : []
      const tgts    = targetsRes.ok ? await targetsRes.json() as TargetCompany[] : []
      const pfs     = pfsRes.ok     ? await pfsRes.json()     as Portfolio[]     : []

      setConnections(conns)
      setTargets(tgts)
      setPortfolios(pfs)
      if (pfs.length > 0) setSelectedPF(pfs[0].id)

      // Apply prefill after we have the data
      if (!prefillConnectionId && conns.length > 0) setSelectedConn(conns[0].id)
      if (!prefillTargetId && tgts.length > 0)      setSelectedTarget(tgts[0].id)
    }
    init()
  }, [router, supabase, prefillConnectionId, prefillTargetId])

  const selectedConnection = connections.find(c => c.id === selectedConn)
  const selectedTargetObj  = targets.find(t => t.id === selectedTarget)

  const targetRole    = selectedTargetObj?.target_role  ?? customRole
  const targetCompany = selectedTargetObj?.company_name ?? customCompany

  async function generate() {
    if (!selectedConnection) { setError('Select a connection first.'); return }
    if (!targetRole || !targetCompany) { setError('Select a target or enter a role and company.'); return }

    setError('')
    setLoading(true)
    setMessage(null)

    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 60_000)

    try {
      const res = await fetch('/api/network/outreach', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          connection:    selectedConnection,
          targetRole,
          targetCompany,
          portfolioId:   selectedPF || undefined,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (res.ok) {
        setMessage(await res.json() as OutreachMessage)
      } else {
        setError('Failed to generate message. Try again.')
      }
    } catch (err) {
      clearTimeout(timeoutId)
      const isAbort = err instanceof Error && err.name === 'AbortError'
      setError(isAbort ? 'Request timed out (60s) — please try again.' : 'Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav userName={userName} userInitial={userInitial} />

      <main className="mx-auto max-w-3xl px-5 lg:px-8 py-10">

        <Link href="/dashboard/network" className="flex items-center gap-1 text-small text-text-secondary hover:text-text-primary mb-6 transition-colors">
          <BackIcon /> Back to Network
        </Link>

        <div className="mb-8">
          <span className="text-micro font-mono text-text-disabled uppercase tracking-wider">Outreach composer</span>
          <h1 className="text-h2 font-bold text-text-primary mt-1">Draft outreach</h1>
          <p className="text-body text-text-secondary mt-1">
            AI writes a specific, non-generic message based on your relationship and target role.
          </p>
        </div>

        {/* Config form */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-5 mb-6">

          {/* Connection */}
          <div>
            <label className="text-micro font-mono text-text-disabled block mb-1.5">WHO TO MESSAGE</label>
            {connections.length > 0 ? (
              <select
                className="w-full px-3 py-2 text-small bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
                value={selectedConn}
                onChange={e => setSelectedConn(e.target.value)}
              >
                {connections.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.company ? ` · ${c.company}` : ''} ({c.strength})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-small text-text-disabled">
                No connections yet.{' '}
                <Link href="/dashboard/network/connections" className="text-accent hover:underline">Add one</Link>.
              </p>
            )}
            {selectedConnection && (
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-micro px-1.5 py-0.5 rounded border font-medium ${STRENGTH_COLORS[selectedConnection.strength]}`}>
                  {selectedConnection.strength}
                </span>
                <span className="text-micro text-text-disabled capitalize">{selectedConnection.relationship}</span>
                {selectedConnection.role && (
                  <span className="text-micro text-text-disabled">· {selectedConnection.role}</span>
                )}
              </div>
            )}
          </div>

          {/* Target */}
          <div>
            <label className="text-micro font-mono text-text-disabled block mb-1.5">TARGET ROLE + COMPANY</label>
            {targets.length > 0 ? (
              <select
                className="w-full px-3 py-2 text-small bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
                value={selectedTarget}
                onChange={e => setSelectedTarget(e.target.value)}
              >
                <option value="">— Enter manually —</option>
                {targets.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.target_role} at {t.company_name}
                  </option>
                ))}
              </select>
            ) : null}
            {(!selectedTarget || targets.length === 0) && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="text-micro text-text-secondary block mb-1">Role</label>
                  <input
                    className="w-full px-3 py-2 text-small bg-background border border-border rounded-lg text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent"
                    placeholder="Senior Product Designer"
                    value={customRole}
                    onChange={e => setCustomRole(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-micro text-text-secondary block mb-1">Company</label>
                  <input
                    className="w-full px-3 py-2 text-small bg-background border border-border rounded-lg text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent"
                    placeholder="Stripe"
                    value={customCompany}
                    onChange={e => setCustomCompany(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Portfolio context */}
          {portfolios.length > 0 && (
            <div>
              <label className="text-micro font-mono text-text-disabled block mb-1.5">CONTEXT PORTFOLIO (optional)</label>
              <select
                className="w-full px-3 py-2 text-small bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
                value={selectedPF}
                onChange={e => setSelectedPF(e.target.value)}
              >
                <option value="">— No portfolio context —</option>
                {portfolios.map(p => (
                  <option key={p.id} value={p.id}>{p.data?.name || p.data?.headline || 'Portfolio'}</option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-small text-error">{error}</p>}

          <div className="flex justify-end">
            <Button onClick={generate} disabled={loading || !selectedConnection}>
              {loading ? 'Writing…' : message ? 'Regenerate' : 'Generate message'}
            </Button>
          </div>
        </div>

        {/* Result */}
        {message && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="text-micro font-mono text-text-disabled">GENERATED MESSAGE</span>
                <span className="text-micro px-2 py-0.5 rounded bg-background border border-border text-text-secondary">
                  {TONE_LABELS[message.tone] ?? message.tone} tone
                </span>
              </div>
              <CopyButton text={`Subject: ${message.subject}\n\n${message.body}`} label="Copy all" />
            </div>

            <div className="p-5 space-y-4">
              {/* Subject */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-micro font-mono text-text-disabled">SUBJECT</p>
                  <CopyButton text={message.subject} label="Copy" />
                </div>
                <p className="text-small font-medium text-text-primary px-3 py-2 bg-background border border-border rounded-lg">
                  {message.subject}
                </p>
              </div>

              {/* Body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-micro font-mono text-text-disabled">MESSAGE</p>
                  <CopyButton text={message.body} label="Copy" />
                </div>
                <div className="text-small text-text-primary px-4 py-3 bg-background border border-border rounded-lg whitespace-pre-wrap leading-relaxed">
                  {message.body}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-background/50">
              <p className="text-micro text-text-disabled">
                Written for <span className="text-text-secondary">{message.connection.name}</span>
                {' '}→{' '}
                <span className="text-text-secondary">{message.targetRole} at {message.company}</span>.
                Edit before sending — this is a starting point.
              </p>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default function OutreachPage() {
  return (
    <Suspense>
      <OutreachPageContent />
    </Suspense>
  )
}
