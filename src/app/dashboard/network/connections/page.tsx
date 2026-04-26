'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import AppNav from '@/components/ui/AppNav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type {
  Connection, TargetCompany,
  RelationshipType, ConnectionStrength,
  TargetPriority, TargetStatus,
} from '@/lib/types'

// ─── Icons ────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────

const STRENGTH_COLORS: Record<ConnectionStrength, string> = {
  strong: 'bg-success-subtle text-success border-success-border',
  medium: 'bg-warning-subtle text-warning border-warning-border',
  weak:   'bg-border text-text-secondary border-border',
}

const STATUS_LABELS: Record<TargetStatus, string> = {
  researching:  'Researching',
  'warm-path':  'Warm path',
  applied:      'Applied',
  interviewing: 'Interviewing',
  offer:        'Offer',
}

const PRIORITY_VARIANTS: Record<TargetPriority, 'default' | 'secondary'> = {
  high:   'default',
  medium: 'secondary',
  low:    'secondary',
}

// ─── Add Connection Form ───────────────────────────────────

function AddConnectionForm({ onAdd }: { onAdd: (c: Connection) => void }) {
  const [form, setForm] = useState({
    name: '', role: '', company: '',
    relationship: 'colleague' as RelationshipType,
    strength: 'medium' as ConnectionStrength,
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/network/connections', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      if (res.ok) {
        const c = await res.json() as Connection
        onAdd(c)
        setForm({ name: '', role: '', company: '', relationship: 'colleague', strength: 'medium', notes: '' })
      }
    } catch { /* network error */ } finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="bg-surface border border-border rounded-xl p-5 space-y-4">
      <h3 className="text-small font-semibold text-text-primary">Add connection</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-micro text-text-secondary block mb-1">Name *</label>
          <input
            className="w-full px-3 py-2 text-small bg-background border border-border rounded-lg text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent"
            placeholder="Alex Chen"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="text-micro text-text-secondary block mb-1">Their role</label>
          <input
            className="w-full px-3 py-2 text-small bg-background border border-border rounded-lg text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent"
            placeholder="Senior Engineer"
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-micro text-text-secondary block mb-1">Their company</label>
          <input
            className="w-full px-3 py-2 text-small bg-background border border-border rounded-lg text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent"
            placeholder="Stripe"
            value={form.company}
            onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-micro text-text-secondary block mb-1">How you know them</label>
          <select
            className="w-full px-3 py-2 text-small bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
            value={form.relationship}
            onChange={e => setForm(f => ({ ...f, relationship: e.target.value as RelationshipType }))}
          >
            <option value="colleague">Colleague</option>
            <option value="classmate">Classmate</option>
            <option value="friend">Friend</option>
            <option value="acquaintance">Acquaintance</option>
            <option value="mentor">Mentor</option>
          </select>
        </div>
        <div>
          <label className="text-micro text-text-secondary block mb-1">Relationship strength</label>
          <select
            className="w-full px-3 py-2 text-small bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
            value={form.strength}
            onChange={e => setForm(f => ({ ...f, strength: e.target.value as ConnectionStrength }))}
          >
            <option value="strong">Strong — close, comfortable asking</option>
            <option value="medium">Medium — know each other well enough</option>
            <option value="weak">Weak — met a few times</option>
          </select>
        </div>
        <div>
          <label className="text-micro text-text-secondary block mb-1">Notes (optional)</label>
          <input
            className="w-full px-3 py-2 text-small bg-background border border-border rounded-lg text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent"
            placeholder="Met at PyCon 2024, worked on same team"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving || !form.name.trim()}>
          {saving ? 'Adding…' : 'Add connection'}
        </Button>
      </div>
    </form>
  )
}

// ─── Add Target Form ──────────────────────────────────────

function AddTargetForm({ onAdd }: { onAdd: (t: TargetCompany) => void }) {
  const [form, setForm] = useState({
    company_name: '', target_role: '',
    priority: 'medium' as TargetPriority,
    status:   'researching' as TargetStatus,
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.company_name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/network/targets', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      if (res.ok) {
        const t = await res.json() as TargetCompany
        onAdd(t)
        setForm({ company_name: '', target_role: '', priority: 'medium', status: 'researching', notes: '' })
      }
    } catch { /* network error */ } finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="bg-surface border border-border rounded-xl p-5 space-y-4">
      <h3 className="text-small font-semibold text-text-primary">Add target company</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-micro text-text-secondary block mb-1">Company *</label>
          <input
            className="w-full px-3 py-2 text-small bg-background border border-border rounded-lg text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent"
            placeholder="Stripe"
            value={form.company_name}
            onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="text-micro text-text-secondary block mb-1">Role you're targeting</label>
          <input
            className="w-full px-3 py-2 text-small bg-background border border-border rounded-lg text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent"
            placeholder="Senior Product Designer"
            value={form.target_role}
            onChange={e => setForm(f => ({ ...f, target_role: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-micro text-text-secondary block mb-1">Priority</label>
          <select
            className="w-full px-3 py-2 text-small bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
            value={form.priority}
            onChange={e => setForm(f => ({ ...f, priority: e.target.value as TargetPriority }))}
          >
            <option value="high">High — dream company</option>
            <option value="medium">Medium — strong interest</option>
            <option value="low">Low — keeping an eye</option>
          </select>
        </div>
        <div>
          <label className="text-micro text-text-secondary block mb-1">Status</label>
          <select
            className="w-full px-3 py-2 text-small bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as TargetStatus }))}
          >
            {(Object.entries(STATUS_LABELS) as [TargetStatus, string][]).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving || !form.company_name.trim()}>
          {saving ? 'Adding…' : 'Add target'}
        </Button>
      </div>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────

function ConnectionsPageContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  const [connections,  setConnections]  = useState<Connection[]>([])
  const [targets,      setTargets]      = useState<TargetCompany[]>([])
  const [loading,      setLoading]      = useState(true)
  const [userName,     setUserName]     = useState('')
  const [userInitial,  setUserInitial]  = useState('?')
  const [tab,          setTab]          = useState<'connections' | 'targets'>(
    searchParams.get('tab') === 'targets' ? 'targets' : 'connections'
  )

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
      } catch { /* network error — show empty lists */ }
      finally { setLoading(false) }
    }
    load()
  }, [router, supabase])

  async function deleteConnection(id: string) {
    const res = await fetch('/api/network/connections', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    }).catch(() => null)
    if (res?.ok) setConnections(cs => cs.filter(c => c.id !== id))
  }

  async function deleteTarget(id: string) {
    const res = await fetch('/api/network/targets', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    }).catch(() => null)
    if (res?.ok) setTargets(ts => ts.filter(t => t.id !== id))
  }

  async function updateTargetStatus(id: string, status: TargetStatus) {
    const res = await fetch('/api/network/targets', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, status }),
    }).catch(() => null)
    if (res?.ok) setTargets(ts => ts.map(t => t.id === id ? { ...t, status } : t))
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav userName={userName} userInitial={userInitial} />

      <main className="mx-auto max-w-4xl px-5 lg:px-8 py-10">

        <Link href="/dashboard/network" className="flex items-center gap-1 text-small text-text-secondary hover:text-text-primary mb-6 transition-colors">
          <BackIcon /> Back to Network
        </Link>

        <div className="mb-8">
          <h1 className="text-h2 font-bold text-text-primary">Connections & Targets</h1>
          <p className="text-body text-text-secondary mt-1">Build your network map.</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-0.5 w-fit mb-6">
          {(['connections', 'targets'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-small rounded-md capitalize transition-all ${
                tab === t ? 'bg-background text-text-primary font-medium shadow-sm' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t === 'connections' ? `Connections (${connections.length})` : `Targets (${targets.length})`}
            </button>
          ))}
        </div>

        {tab === 'connections' ? (
          <div className="space-y-4">
            <AddConnectionForm onAdd={c => setConnections(cs => [c, ...cs])} />
            {!loading && connections.length === 0 && (
              <p className="text-center text-text-disabled py-8">No connections yet. Add your first one above.</p>
            )}
            {connections.map(c => (
              <div key={c.id} className="flex items-start gap-3 p-4 bg-surface border border-border rounded-xl animate-fade-in">
                <div className="w-9 h-9 rounded-full bg-accent-subtle border border-accent/20 flex items-center justify-center text-small font-bold text-accent shrink-0">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-small font-semibold text-text-primary">{c.name}</p>
                    <span className={`text-micro px-1.5 py-0.5 rounded border font-medium ${STRENGTH_COLORS[c.strength]}`}>
                      {c.strength}
                    </span>
                  </div>
                  <p className="text-micro text-text-secondary">{c.role}{c.company ? ` · ${c.company}` : ''}</p>
                  {c.notes && <p className="text-micro text-text-disabled mt-1 italic">{c.notes}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/dashboard/network/outreach?connectionId=${c.id}`}
                    className="text-micro text-accent hover:underline"
                  >
                    Draft outreach
                  </Link>
                  <button onClick={() => deleteConnection(c.id)} className="text-text-disabled hover:text-error transition-colors p-1">
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <AddTargetForm onAdd={t => setTargets(ts => [t, ...ts])} />
            {!loading && targets.length === 0 && (
              <p className="text-center text-text-disabled py-8">No target companies yet. Add your first one above.</p>
            )}
            {targets.map(t => (
              <div key={t.id} className="flex items-start gap-3 p-4 bg-surface border border-border rounded-xl animate-fade-in">
                <div className="w-9 h-9 rounded bg-surface border border-border flex items-center justify-center text-small font-bold text-text-secondary shrink-0">
                  {t.company_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-small font-semibold text-text-primary">{t.company_name}</p>
                    <Badge variant={PRIORITY_VARIANTS[t.priority]} className="text-micro">{t.priority}</Badge>
                  </div>
                  <p className="text-micro text-text-secondary">{t.target_role}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    className="text-micro bg-background border border-border rounded px-2 py-1 text-text-secondary focus:outline-none focus:border-accent"
                    value={t.status}
                    onChange={e => updateTargetStatus(t.id, e.target.value as TargetStatus)}
                  >
                    {(Object.entries(STATUS_LABELS) as [TargetStatus, string][]).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <button onClick={() => deleteTarget(t.id)} className="text-text-disabled hover:text-error transition-colors p-1">
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function ConnectionsPage() {
  return (
    <Suspense>
      <ConnectionsPageContent />
    </Suspense>
  )
}
