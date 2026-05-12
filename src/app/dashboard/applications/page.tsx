'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

// ─── Types ────────────────────────────────────────────────
type AppStatus =
  | 'wishlist'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'ghosted'

interface Application {
  id:          string
  user_id:     string
  company:     string
  role:        string
  status:      AppStatus
  applied_at:  string | null
  notes:       string | null
  ghost_score: number | null
  ats_score:   number | null
  stale_flag:  boolean
  created_at:  string
  updated_at:  string
}

// ─── Constants ────────────────────────────────────────────
const ALL_STATUSES: AppStatus[] = [
  'wishlist', 'applied', 'screening', 'interview', 'offer', 'rejected', 'ghosted',
]

const STATUS_LABEL: Record<AppStatus, string> = {
  wishlist:   'Wishlist',
  applied:    'Applied',
  screening:  'Screening',
  interview:  'Interview',
  offer:      'Offer',
  rejected:   'Rejected',
  ghosted:    'Ghosted',
}

const STATUS_DOT: Record<AppStatus, string> = {
  wishlist:   'bg-border',
  applied:    'bg-text-disabled',
  screening:  'bg-accent',
  interview:  'bg-accent',
  offer:      'bg-success',
  rejected:   'bg-error',
  ghosted:    'bg-warning',
}

const STATUS_TEXT: Record<AppStatus, string> = {
  wishlist:   'text-text-disabled',
  applied:    'text-text-secondary',
  screening:  'text-accent',
  interview:  'text-accent',
  offer:      'text-success',
  rejected:   'text-error',
  ghosted:    'text-warning',
}

const ACTIVE_STATUSES: AppStatus[] = ['applied', 'screening', 'interview']

// ─── Helpers ──────────────────────────────────────────────
function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

function isStale(app: Application): boolean {
  if (!ACTIVE_STATUSES.includes(app.status)) return false
  return daysSince(app.updated_at) >= 14
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function cn(...c: (string | boolean | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

// ─── Pipeline health bar ──────────────────────────────────
function PipelineHealth({ apps }: { apps: Application[] }) {
  if (apps.length === 0) return null

  const stages: { label: string; statuses: AppStatus[]; accent: string }[] = [
    { label: 'Wishlist',  statuses: ['wishlist'],              accent: 'bg-border' },
    { label: 'Applied',   statuses: ['applied'],               accent: 'bg-text-disabled' },
    { label: 'Screening', statuses: ['screening'],             accent: 'bg-accent' },
    { label: 'Interview', statuses: ['interview'],             accent: 'bg-accent' },
    { label: 'Offer',     statuses: ['offer'],                 accent: 'bg-success' },
    { label: 'Closed',    statuses: ['rejected', 'ghosted'],   accent: 'bg-border-strong' },
  ]

  const staleCount  = apps.filter(isStale).length
  const activeCount = apps.filter(a => ACTIVE_STATUSES.includes(a.status)).length

  return (
    <div className="mb-8 animate-slide-up-2">
      {/* Stage counts */}
      <div className="flex items-center gap-0 mb-3 overflow-x-auto">
        {stages.map((stage, i) => {
          const count = apps.filter(a => stage.statuses.includes(a.status)).length
          if (count === 0) return null
          return (
            <div key={stage.label} className="flex items-center gap-0 shrink-0">
              {i > 0 && <span className="text-text-disabled mx-2 text-micro">→</span>}
              <div className="flex items-center gap-1.5">
                <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', stage.accent)} />
                <span className="text-micro font-mono text-text-disabled">{stage.label}</span>
                <span className="text-micro font-mono text-text-primary font-medium tabular-nums">{count}</span>
              </div>
            </div>
          )
        })}
      </div>
      {/* Signal health line */}
      {(activeCount > 0 || staleCount > 0) && (
        <p className="text-micro font-mono text-text-disabled">
          {activeCount > 0 && <span className="text-accent">{activeCount} active signal{activeCount !== 1 ? 's' : ''}</span>}
          {activeCount > 0 && staleCount > 0 && <span className="mx-1.5">·</span>}
          {staleCount > 0 && <span className="text-warning">{staleCount} stale</span>}
        </p>
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-20 text-center">
      <p className="text-micro font-mono text-text-disabled uppercase tracking-widest mb-2">
        No applications tracked yet
      </p>
      <p className="text-small text-text-secondary max-w-sm mx-auto mb-8">
        Add every role you apply to. ForgeFolio flags which ones went cold, which need a follow-up, and where you&apos;re stuck — so nothing slips through.
      </p>
      <button
        onClick={onAdd}
        className="text-small font-mono text-accent border border-accent/30 px-4 py-2 hover:bg-accent/5 transition-colors"
      >
        + Track your first application
      </button>
    </div>
  )
}

// ─── Add / Edit form ──────────────────────────────────────
interface FormState {
  company:    string
  role:       string
  status:     AppStatus
  applied_at: string
  notes:      string
}

const EMPTY_FORM: FormState = {
  company: '', role: '', status: 'applied', applied_at: '', notes: '',
}

interface AppFormProps {
  initial:   FormState
  saving:    boolean
  onSave:    (f: FormState, ghostScore?: number | null) => void
  onCancel:  () => void
  onDelete?: () => void
  mode:      'add' | 'edit'
}

function AppForm({ initial, saving, onSave, onCancel, onDelete, mode }: AppFormProps) {
  const [form, setForm]               = useState<FormState>(initial)
  const [ghostScore, setGhostScore]   = useState<number | null>(null)
  const [ghostVerdict, setGhostVerdict] = useState<string | null>(null)
  const [ghostChecking, setGhostChecking] = useState(false)
  const companyRef = useRef<HTMLInputElement>(null)

  useEffect(() => { companyRef.current?.focus() }, [])

  function set(k: keyof FormState, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    if (k === 'notes') { setGhostScore(null); setGhostVerdict(null) }
  }

  async function runGhostCheck() {
    setGhostChecking(true)
    try {
      const res = await fetch('/api/intelligence/ghost', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ jd: form.notes }),
      })
      if (res.ok) {
        const report = await res.json() as { hiring_confidence: number; verdict: string }
        setGhostScore(100 - report.hiring_confidence)
        setGhostVerdict(report.verdict)
      }
    } catch (err) {
      console.error('[ghost-check]', err)
      setGhostVerdict('Check failed — please try again.')
    }
    setGhostChecking(false)
  }

  return (
    <div className="border border-border bg-surface p-5 animate-slide-up-1">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-micro font-mono text-text-disabled uppercase tracking-widest">Company</label>
          <input
            ref={companyRef}
            value={form.company}
            onChange={e => set('company', e.target.value)}
            placeholder="Razorpay"
            className="w-full px-3 py-2 bg-background border border-border text-small text-text-primary focus:border-accent focus:outline-none transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-micro font-mono text-text-disabled uppercase tracking-widest">Role</label>
          <input
            value={form.role}
            onChange={e => set('role', e.target.value)}
            placeholder="SDE-1"
            className="w-full px-3 py-2 bg-background border border-border text-small text-text-primary focus:border-accent focus:outline-none transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-micro font-mono text-text-disabled uppercase tracking-widest">Status</label>
          <select
            value={form.status}
            onChange={e => set('status', e.target.value as AppStatus)}
            className="w-full px-3 py-2 bg-background border border-border text-small text-text-primary focus:border-accent focus:outline-none transition-colors"
          >
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-micro font-mono text-text-disabled uppercase tracking-widest">Applied</label>
          <input
            type="date"
            value={form.applied_at}
            onChange={e => set('applied_at', e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border text-small text-text-primary focus:border-accent focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mb-5">
        <label className="text-micro font-mono text-text-disabled uppercase tracking-widest">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Referral from Priya. JD mentions Go and Kafka."
          rows={2}
          className="w-full px-3 py-2 bg-background border border-border text-small text-text-primary resize-none focus:border-accent focus:outline-none transition-colors"
        />
        {/* Ghost check — shows when notes look like a pasted JD */}
        {form.notes.trim().length >= 150 && (
          <div className="flex items-center gap-3 mt-1">
            <button
              type="button"
              onClick={runGhostCheck}
              disabled={ghostChecking}
              className="text-micro font-mono text-text-disabled hover:text-accent transition-colors disabled:opacity-40"
            >
              {ghostChecking ? 'Checking…' : 'Check ghost risk →'}
            </button>
            {ghostVerdict && ghostScore !== null && (
              <span className={cn(
                'text-micro font-mono px-2 py-0.5 rounded border',
                ghostScore >= 60
                  ? 'text-error bg-error/5 border-error/20'
                  : ghostScore >= 40
                  ? 'text-warning bg-warning/5 border-warning/20'
                  : 'text-success bg-success/5 border-success/20',
              )}>
                {ghostVerdict} · risk {ghostScore}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Outcome capture — appears only when status = offer */}
      {form.status === 'offer' && (
        <div className="mb-5 border border-success/30 bg-success/5 px-5 py-4 animate-slide-up-1">
          <p className="text-micro font-mono text-success uppercase tracking-widest mb-1.5">Offer received</p>
          <p className="text-small font-medium text-text-primary mb-3">
            {form.company ? `${form.company} made you an offer.` : 'You got an offer.'} What happened?
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set('notes', form.notes
                ? form.notes.includes('[Outcome:')
                  ? form.notes.replace(/\[Outcome:[^\]]*\]/, '[Outcome: Accepted]')
                  : form.notes + '\n[Outcome: Accepted]'
                : '[Outcome: Accepted]'
              )}
              className={cn(
                'text-small font-mono px-3 py-1.5 border rounded transition-colors',
                form.notes.includes('[Outcome: Accepted]')
                  ? 'border-success text-success bg-success/5'
                  : 'border-border text-text-secondary hover:border-success hover:text-success'
              )}
            >
              ✓ Accepted
            </button>
            <button
              type="button"
              onClick={() => set('notes', form.notes
                ? form.notes.includes('[Outcome:')
                  ? form.notes.replace(/\[Outcome:[^\]]*\]/, '[Outcome: Declined]')
                  : form.notes + '\n[Outcome: Declined]'
                : '[Outcome: Declined]'
              )}
              className={cn(
                'text-small font-mono px-3 py-1.5 border rounded transition-colors',
                form.notes.includes('[Outcome: Declined]')
                  ? 'border-error text-error bg-error/5'
                  : 'border-border text-text-secondary hover:border-error hover:text-error'
              )}
            >
              Declined
            </button>
            <button
              type="button"
              onClick={() => set('notes', form.notes
                ? form.notes.includes('[Outcome:')
                  ? form.notes.replace(/\[Outcome:[^\]]*\]/, '[Outcome: Negotiating]')
                  : form.notes + '\n[Outcome: Negotiating]'
                : '[Outcome: Negotiating]'
              )}
              className={cn(
                'text-small font-mono px-3 py-1.5 border rounded transition-colors',
                form.notes.includes('[Outcome: Negotiating]')
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-border text-text-secondary hover:border-accent hover:text-accent'
              )}
            >
              Negotiating
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => onSave(form, ghostScore)}
          disabled={saving || !form.company.trim() || !form.role.trim()}
          className="text-small font-mono text-white bg-accent px-4 py-2 rounded disabled:opacity-40 hover:bg-accent-hover transition-colors"
        >
          {saving ? 'Saving…' : mode === 'add' ? 'Add application' : 'Save changes'}
        </button>
        <button
          onClick={onCancel}
          className="text-small font-mono text-text-disabled hover:text-text-secondary transition-colors"
        >
          Cancel
        </button>
        {mode === 'edit' && onDelete && (
          <button
            onClick={onDelete}
            className="ml-auto text-small font-mono text-error hover:text-error/80 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Row ──────────────────────────────────────────────────
interface RowProps {
  app:      Application
  onEdit:   (app: Application) => void
}

function AppRow({ app, onEdit }: RowProps) {
  const stale    = isStale(app)
  const days     = daysSince(app.updated_at)
  const receded  = app.status === 'rejected' || app.status === 'ghosted'
  const isOffer  = app.status === 'offer'
  const noteSnip = app.notes ? app.notes.slice(0, 72) + (app.notes.length > 72 ? '…' : '') : null

  return (
    <button
      onClick={() => onEdit(app)}
      className={cn(
        'w-full text-left py-4 flex items-start gap-3 sm:grid sm:grid-cols-[1fr_140px_90px_72px_auto] sm:gap-4 hover:bg-border-subtle/60 transition-colors group',
        stale   && 'border-l-2 border-warning/40 pl-3 -ml-3',
        receded && 'opacity-50',
      )}
    >
      {/* Company + role + note snippet */}
      <div>
        <p className={cn(
          'text-small font-medium transition-colors',
          receded ? 'text-text-secondary' : 'text-text-primary group-hover:text-accent',
        )}>
          {app.company}
        </p>
        <p className="text-micro text-text-disabled mt-0.5">{app.role}</p>
        {noteSnip && (
          <p className="text-micro text-text-disabled mt-1 leading-relaxed">{noteSnip}</p>
        )}
        {/* Offer outcome nudge */}
        {isOffer && (
          <p className="text-micro font-mono text-success mt-1">
            Offer received · log outcome →
          </p>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 pt-0.5">
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', STATUS_DOT[app.status])} />
        <span className={cn('text-small font-mono', STATUS_TEXT[app.status])}>
          {STATUS_LABEL[app.status]}
        </span>
      </div>

      {/* Applied date */}
      <p className="hidden sm:block text-small text-text-disabled font-mono tabular-nums pt-0.5">
        {formatDate(app.applied_at)}
      </p>

      {/* Days since update */}
      <p className={cn(
        'hidden sm:block text-small font-mono tabular-nums pt-0.5',
        stale ? 'text-warning' : 'text-text-disabled',
      )}>
        {days === 0 ? 'today' : `${days}d`}
      </p>

      {/* Intelligence scores */}
      <div className="flex flex-col items-end gap-1.5 pt-0.5">
        {app.ghost_score !== null && (
          <span className={cn(
            'text-micro font-mono tabular-nums px-2 py-0.5 rounded border',
            app.ghost_score >= 60
              ? 'text-error bg-error/5 border-error/20'
              : app.ghost_score >= 40
              ? 'text-warning bg-warning/5 border-warning/20'
              : 'text-success bg-success/5 border-success/20',
          )}>
            Ghost·{app.ghost_score}
          </span>
        )}
        {app.ats_score !== null && (
          <span className={cn(
            'text-micro font-mono tabular-nums px-2 py-0.5 rounded border',
            app.ats_score >= 70
              ? 'text-success bg-success/5 border-success/20'
              : app.ats_score >= 50
              ? 'text-warning bg-warning/5 border-warning/20'
              : 'text-error bg-error/5 border-error/20',
          )}>
            ATS·{app.ats_score}
          </span>
        )}
        {stale && !app.ghost_score && !app.ats_score && (
          <span className="text-micro font-mono text-warning">
            Signal cold
          </span>
        )}
      </div>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────
type Filter = 'all' | AppStatus

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ApplicationsContent />
    </Suspense>
  )
}

function ApplicationsContent() {
  const router      = useRouter()
  const supabase    = createClient()
  const searchParams = useSearchParams()

  const [apps,       setApps]       = useState<Application[]>([])
  const [loading,    setLoading]    = useState(true)
  const [userName,   setUserName]   = useState('')
  const [userInitial,setUserInitial]= useState('?')
  const [filter,     setFilter]     = useState<Filter>('all')
  const [showForm,   setShowForm]   = useState(false)
  const [editApp,    setEditApp]    = useState<Application | null>(null)
  const [saving,     setSaving]     = useState(false)
  const [prefill,    setPrefill]    = useState<string | null>(null)

  // Auto-open form with pre-filled company from ?company= param (warm signal CTA)
  useEffect(() => {
    const company = searchParams.get('company')
    if (company) {
      setPrefill(company)
      setShowForm(true)
    }
  }, [searchParams])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const name = user.user_metadata?.full_name as string ?? ''
      setUserName(name || user.email?.split('@')[0] || '')
      setUserInitial((name || user.email || '?')[0].toUpperCase())

      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (!error && data) {
        const STALE_MS = 14 * 24 * 60 * 60 * 1000
        const STALE_STATUSES: AppStatus[] = ['applied', 'screening', 'interview']
        const now = Date.now()
        const enriched = (data as Application[]).map(app => ({
          ...app,
          stale_flag: STALE_STATUSES.includes(app.status) &&
            (now - new Date(app.updated_at).getTime()) > STALE_MS,
        }))
        setApps(enriched)
      }
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const displayed = filter === 'all'
    ? apps
    : apps.filter(a => a.status === filter)

  const counts = ALL_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = apps.filter(a => a.status === s).length
    return acc
  }, {})

  const staleCount = apps.filter(isStale).length
  const activeCount = apps.filter(a => ACTIVE_STATUSES.includes(a.status)).length

  // ── Add ────────────────────────────────────────────────── //
  async function handleAdd(form: FormState, ghostScore?: number | null) {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('applications')
      .insert({
        user_id:    user.id,
        company:    form.company.trim(),
        role:       form.role.trim(),
        status:     form.status,
        applied_at: form.applied_at || null,
        notes:      form.notes.trim() || null,
        ghost_score: ghostScore ?? null,
        stale_flag: false,
      })
      .select()
      .single()

    if (!error && data) {
      setApps(prev => [data as Application, ...prev])
    }
    setSaving(false)
    setShowForm(false)
  }

  // ── Edit ───────────────────────────────────────────────── //
  async function handleEdit(form: FormState, ghostScore?: number | null) {
    if (!editApp) return
    setSaving(true)

    const updatePayload: Record<string, unknown> = {
      company:    form.company.trim(),
      role:       form.role.trim(),
      status:     form.status,
      applied_at: form.applied_at || null,
      notes:      form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    }
    // Preserve existing ghost_score unless a new check was run in this edit session
    if (ghostScore !== undefined) updatePayload.ghost_score = ghostScore

    const { data, error } = await supabase
      .from('applications')
      .update(updatePayload)
      .eq('id', editApp.id)
      .select()
      .single()

    if (!error && data) {
      setApps(prev => prev.map(a => a.id === editApp.id ? data as Application : a))

      // Layer 3 seed — snapshot portfolio at moment of acceptance
      const isAccepted = form.notes.includes('[Outcome: Accepted]') && form.status === 'offer'
      if (isAccepted) {
        fetch('/api/outcomes', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            application_id: editApp.id,
            company:        form.company.trim(),
            role:           form.role.trim(),
          }),
        }).catch(() => {}) // fire-and-forget — non-critical
      }
    }
    setSaving(false)
    setEditApp(null)
  }

  // ── Delete ─────────────────────────────────────────────── //
  async function handleDelete() {
    if (!editApp) return
    const { error } = await supabase.from('applications').delete().eq('id', editApp.id)
    if (!error) {
      setApps(prev => prev.filter(a => a.id !== editApp.id))
      setEditApp(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
          <div className="h-px w-full bg-border animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      <main className="mx-auto max-w-4xl px-6 py-10 lg:px-8">

        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors mb-8 block">
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-8 animate-slide-up-1">
          <div>
            <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-1.5">
              Application pipeline
            </span>
            <h1 className="text-h2 font-bold text-text-primary tracking-tight">
              {apps.length === 0
                ? 'Applications'
                : `${apps.length} application${apps.length !== 1 ? 's' : ''}`}
            </h1>
            {activeCount > 0 && (
              <p className="text-small text-text-secondary mt-1">
                {activeCount} in progress
                {staleCount > 0 && (
                  <span className="text-warning ml-2">· {staleCount} stale</span>
                )}
              </p>
            )}
          </div>

          <button
            onClick={() => { setShowForm(true); setEditApp(null) }}
            className="shrink-0 text-small font-mono text-accent border border-accent/30 px-4 py-2 hover:bg-accent/5 transition-colors"
          >
            + Add
          </button>
        </div>

        {/* Pipeline health */}
        <PipelineHealth apps={apps} />

        {/* Stale signal nudge */}
        {staleCount > 0 && (
          <div className="mb-6 border-l-2 border-warning pl-4 py-1 animate-slide-up-1">
            <p className="text-small text-text-primary">
              {staleCount} signal{staleCount !== 1 ? 's' : ''} gone cold — no movement in 14+ days
            </p>
            <p className="text-small text-text-secondary mt-0.5">
              Send a follow-up or mark as ghosted to keep the pipeline honest.
            </p>
          </div>
        )}

        {/* Add form */}
        {showForm && !editApp && (
          <div className="mb-6 animate-slide-up-1">
            <AppForm
              initial={prefill ? { ...EMPTY_FORM, company: prefill } : EMPTY_FORM}
              saving={saving}
              onSave={handleAdd}
              onCancel={() => { setShowForm(false); setPrefill(null) }}
              mode="add"
            />
          </div>
        )}

        {apps.length === 0 && !showForm ? (
          <EmptyState onAdd={() => setShowForm(true)} />
        ) : (
          <>
            {/* Status filter tabs */}
            {apps.length > 0 && (
              <div className="flex items-center gap-0 border-b border-border mb-0 animate-slide-up-2">
                {(['all', ...ALL_STATUSES] as (Filter)[]).map(f => {
                  const c = f === 'all' ? apps.length : (counts[f] ?? 0)
                  if (f !== 'all' && c === 0) return null
                  return (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        'pb-2.5 mr-5 text-micro font-mono uppercase tracking-widest transition-colors border-b-2 -mb-px',
                        filter === f
                          ? 'border-accent text-text-primary'
                          : 'border-transparent text-text-disabled hover:text-text-secondary',
                      )}
                    >
                      {f === 'all' ? 'All' : STATUS_LABEL[f]}
                      <span className="ml-1.5 text-text-disabled">{c}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Column headers */}
            {displayed.length > 0 && (
              <div className="hidden sm:grid grid-cols-[1fr_140px_90px_72px_auto] gap-4 py-2 border-b border-border animate-slide-up-2">
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Company</span>
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Status</span>
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Applied</span>
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Updated</span>
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest text-right">Signals</span>
              </div>
            )}

            {/* Application rows */}
            <div className="divide-y divide-border animate-slide-up-2">
              {displayed.map(app => (
                <div key={app.id}>
                  {editApp?.id === app.id ? (
                    <div className="py-3">
                      <AppForm
                        initial={{
                          company:    app.company,
                          role:       app.role,
                          status:     app.status,
                          applied_at: app.applied_at?.slice(0, 10) ?? '',
                          notes:      app.notes ?? '',
                        }}
                        saving={saving}
                        onSave={handleEdit}
                        onCancel={() => setEditApp(null)}
                        onDelete={handleDelete}
                        mode="edit"
                      />
                    </div>
                  ) : (
                    <AppRow app={app} onEdit={a => { setEditApp(a); setShowForm(false) }} />
                  )}
                </div>
              ))}
            </div>

            {displayed.length === 0 && (
              <p className="py-10 text-center text-small text-text-disabled">
                No applications with status &ldquo;{filter}&rdquo; yet.
              </p>
            )}

            {/* Intelligence nudges */}
            {(apps.some(a => ACTIVE_STATUSES.includes(a.status) && a.ghost_score === null) ||
              apps.some(a => ACTIVE_STATUSES.includes(a.status) && a.ats_score === null)) && (
              <div className="mt-8 py-5 border-t border-border animate-slide-up-2">
                <p className="text-micro font-mono text-text-disabled uppercase tracking-widest mb-3">Intelligence</p>
                <div className="space-y-2">
                  {apps.some(a => ACTIVE_STATUSES.includes(a.status) && a.ghost_score === null) && (
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-small text-text-secondary">
                        Check if active postings are real before investing more time.
                      </p>
                      <Link
                        href="/dashboard/intelligence/ghost"
                        className="text-small font-mono text-accent hover:text-accent/80 transition-colors shrink-0"
                      >
                        Ghost Detector →
                      </Link>
                    </div>
                  )}
                  {apps.some(a => ACTIVE_STATUSES.includes(a.status) && a.ats_score === null) && (
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-small text-text-secondary">
                        See if your portfolio survives the filter for these roles.
                      </p>
                      <Link
                        href="/dashboard/intelligence/ats"
                        className="text-small font-mono text-accent hover:text-accent/80 transition-colors shrink-0"
                      >
                        ATS Check →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
