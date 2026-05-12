'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter }        from 'next/navigation'
import Link                 from 'next/link'
import { createClient }     from '@/lib/supabase-client'
import AppNav               from '@/components/ui/AppNav'
import { Button }           from '@/components/ui/button'
import type {
  Portfolio,
  CareerMirrorReport,
  MirrorEvidence,
  EvidenceType,
  GapSize,
} from '@/lib/types'

// ─── Constants ─────────────────────────────────────────────

const EVIDENCE_CONFIG: Record<EvidenceType, { label: string; className: string }> = {
  weakness: { label: 'WEAKNESS', className: 'text-error' },
  missing:  { label: 'MISSING',  className: 'text-warning' },
  strength: { label: 'STRENGTH', className: 'text-success' },
}

const GAP_LABELS: Record<GapSize, string> = {
  structural: 'Structural — target role requires experience not yet demonstrated',
  framing:    'Framing — experience exists, but your words aren\'t showing it',
  surgical:   'Surgical — small specific edits shift the read significantly',
}

const GAP_COLORS: Record<GapSize, string> = {
  structural: 'text-error',
  framing:    'text-warning',
  surgical:   'text-success',
}

// ─── Cache helpers ─────────────────────────────────────────
// Keyed by portfolioId + updatedAt — auto-invalidates when portfolio changes.
// A secondary key tracks whether ANY prior analysis exists, so we can show
// a "portfolio updated" message instead of a cold setup screen.

function cacheKey(portfolioId: string, updatedAt: string): string {
  return `ff_mirror_${portfolioId}_${updatedAt}`
}

function lastAnalyzedKey(portfolioId: string): string {
  return `ff_mirror_last_${portfolioId}`
}

function readCache(portfolioId: string, updatedAt: string): CareerMirrorReport | null {
  try {
    const raw = localStorage.getItem(cacheKey(portfolioId, updatedAt))
    return raw ? (JSON.parse(raw) as CareerMirrorReport) : null
  } catch {
    return null
  }
}

// Returns true if a previous analysis exists for this portfolio but is now stale
function isStale(portfolioId: string, currentUpdatedAt: string): boolean {
  try {
    const last = localStorage.getItem(lastAnalyzedKey(portfolioId))
    return last !== null && last !== currentUpdatedAt
  } catch {
    return false
  }
}

function writeCache(portfolioId: string, updatedAt: string, report: CareerMirrorReport) {
  try {
    localStorage.setItem(cacheKey(portfolioId, updatedAt), JSON.stringify(report))
    localStorage.setItem(lastAnalyzedKey(portfolioId), updatedAt)
  } catch { /* storage full — ignore */ }
}

// ─── Page ──────────────────────────────────────────────────

type Phase = 'loading' | 'setup' | 'generating' | 'done' | 'error'

export default function MirrorPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [phase,         setPhase]         = useState<Phase>('loading')
  const [portfolio,     setPortfolio]     = useState<Portfolio | null>(null)
  const [portfolios,    setPortfolios]    = useState<Portfolio[]>([])
  const [selectedId,    setSelectedId]    = useState<string>('')
  const [userName,      setUserName]      = useState('')
  const [userInitial,   setUserInitial]   = useState('?')
  const [targetRole,    setTargetRole]    = useState('')
  const [targetCompany, setTargetCompany] = useState('')
  const [report,        setReport]        = useState<CareerMirrorReport | null>(null)
  const [error,         setError]         = useState<string>('')
  const [staleCache,    setStaleCache]    = useState(false)  // portfolio edited since last analysis
  const inputRef = useRef<HTMLInputElement>(null)

  const isPro = true

  // Load user + portfolios
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

      if (!list.length) { setPhase('setup'); return }

      const first = list[0]
      setSelectedId(first.id)
      setPortfolio(first)

      // Check cache — also detect staleness (portfolio edited since last analysis)
      const updatedAt = first.updated_at ?? first.created_at ?? ''
      const cached    = readCache(first.id, updatedAt)
      if (cached) {
        setReport(cached)
        setTargetRole(cached.targetRole)
        setTargetCompany(cached.targetCompany ?? '')
        setPhase('done')
      } else {
        setStaleCache(isStale(first.id, updatedAt))
        setPhase('setup')
      }
    }
    load()
  }, [router, supabase])

  // Switch portfolio
  const switchPortfolio = useCallback((id: string, list: Portfolio[]) => {
    const p = list.find(x => x.id === id)
    if (!p) return
    setSelectedId(id)
    setPortfolio(p)
    const updatedAt = p.updated_at ?? p.created_at ?? ''
    const cached    = readCache(p.id, updatedAt)
    if (cached) {
      setReport(cached)
      setTargetRole(cached.targetRole)
      setTargetCompany(cached.targetCompany ?? '')
      setPhase('done')
    } else {
      setReport(null)
      setStaleCache(isStale(p.id, updatedAt))
      setPhase('setup')
    }
  }, [])

  // Generate
  const generate = useCallback(async (role: string, company: string) => {
    if (!portfolio) return
    setPhase('generating')
    setError('')

    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 30_000)

    try {
      const res = await fetch('/api/intelligence/mirror', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          portfolioId:   portfolio.id,
          targetRole:    role,
          targetCompany: company || undefined,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (res.status === 403) {
        const id = portfolio.id
        router.push(`/dashboard/upgrade?from=mirror&id=${id}`)
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error ?? `Error ${res.status}`)
      }
      const data = await res.json() as CareerMirrorReport
      setReport(data)
      const updatedAt = portfolio.updated_at ?? portfolio.created_at ?? ''
      writeCache(portfolio.id, updatedAt, data)
      setPhase('done')
    } catch (err) {
      clearTimeout(timeoutId)
      const isTimeout = err instanceof Error && err.name === 'AbortError'
      setError(isTimeout
        ? 'Analysis timed out (30s). Please try again.'
        : (err instanceof Error ? err.message : 'Generation failed'))
      setPhase('error')
    }
  }, [portfolio])

  const handleSetupSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!targetRole.trim()) { inputRef.current?.focus(); return }
    generate(targetRole, targetCompany)
  }, [targetRole, targetCompany, generate])

  const handleRegenerate = useCallback(() => {
    if (!targetRole.trim()) return
    generate(targetRole, targetCompany)
  }, [targetRole, targetCompany, generate])

  function openInEditor() {
    if (!report) return
    try {
      sessionStorage.setItem('ff_mirror_overlay', JSON.stringify({
        portfolioId: report.portfolioId,
        archetype:   report.coldRead.archetype,
        topFix:      report.topFix,
        moves:       report.topMoves.map(m => ({ action: m.action, location: m.location })),
        ts:          Date.now(),
      }))
    } catch { /* sessionStorage unavailable */ }
    router.push(`/editor/${report.portfolioId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav userName={userName} userInitial={userInitial} />

      <main className="mx-auto max-w-4xl px-6 lg:px-8 py-12">

        <Link href="/dashboard/intelligence" className="inline-flex items-center gap-1.5 text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors mb-8 block">
          ← Back to Intelligence
        </Link>

        {/* Portfolio selector — shown when multiple portfolios */}
        {phase !== 'loading' && portfolios.length > 1 && (
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border animate-slide-up-1">
            <span className="text-micro font-mono text-text-disabled">Analyzing</span>
            <div className="flex items-center gap-1">
              {portfolios.map(p => (
                <button
                  key={p.id}
                  onClick={() => switchPortfolio(p.id, portfolios)}
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

        {phase === 'loading'    && <PageSkeleton />}
        {phase === 'setup'      && (
          <SetupGate
            portfolio={portfolio}
            targetRole={targetRole}
            targetCompany={targetCompany}
            onRoleChange={setTargetRole}
            onCompanyChange={setTargetCompany}
            onSubmit={handleSetupSubmit}
            inputRef={inputRef}
            isStale={staleCache}
          />
        )}
        {phase === 'generating' && <GeneratingView portfolio={portfolio} />}
        {phase === 'error'      && (
          <ErrorView
            message={error}
            onRetry={() => setPhase('setup')}
          />
        )}
        {phase === 'done' && report && (
          <ReportView
            report={report}
            targetRole={targetRole}
            targetCompany={targetCompany}
            onRoleChange={setTargetRole}
            onCompanyChange={setTargetCompany}
            onRegenerate={handleRegenerate}
            onOpenInEditor={openInEditor}
            portfolioId={selectedId}
            isPro={isPro}
          />
        )}

      </main>
    </div>
  )
}

// ─── Page Skeleton ──────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in pt-2">
      <div className="h-3 w-32 bg-border rounded animate-shimmer" />
      <div className="h-8 w-48 bg-border rounded animate-shimmer" />
      <div className="space-y-3 pt-4">
        {[120, 80, 100].map(w => (
          <div key={w} className="h-3 bg-border rounded animate-shimmer" style={{ width: `${w}px` }} />
        ))}
      </div>
    </div>
  )
}

// ─── Setup Gate ─────────────────────────────────────────────

interface SetupGateProps {
  portfolio:       Portfolio | null
  targetRole:      string
  targetCompany:   string
  onRoleChange:    (v: string) => void
  onCompanyChange: (v: string) => void
  onSubmit:        (e: React.FormEvent) => void
  inputRef:        React.RefObject<HTMLInputElement>
  isStale:         boolean
}

function SetupGate({ portfolio, targetRole, targetCompany, onRoleChange, onCompanyChange, onSubmit, inputRef, isStale }: SetupGateProps) {
  return (
    <div className="animate-slide-up-1">

      {/* Terminal header */}
      <div className="flex items-center gap-2 mb-10">
        <span className="inline-block w-[7px] h-[7px] rounded-full bg-success" style={{ animation: 'statusBeacon 2s ease-in-out infinite' }} />
        <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">
          Career Mirror // Cold Read
        </span>
      </div>

      <div className="max-w-lg">
        {/* Staleness banner — shown when portfolio was edited since last analysis */}
        {isStale && (
          <div className="flex items-start gap-3 border border-border p-4 mb-8">
            <span className="inline-block w-[6px] h-[6px] rounded-full bg-warning mt-1.5 shrink-0" />
            <div>
              <p className="text-small text-text-primary font-medium">Your portfolio was updated</p>
              <p className="text-small text-text-secondary mt-0.5">
                Regenerate to see how your new read compares to the last one.
              </p>
            </div>
          </div>
        )}

        <h1 className="text-h3 font-bold text-text-primary tracking-tight mb-2">
          {isStale ? 'Ready for a new cold read?' : 'Before I read your portfolio —'}
        </h1>
        <p className="text-small text-text-secondary mb-10">
          The cold read is most accurate when calibrated to your target. One sentence is enough.
        </p>

        {!portfolio && (
          <div className="border border-border p-4 mb-8">
            <p className="text-small text-text-secondary mb-3">No portfolio found. Build one first.</p>
            <Button asChild size="sm"><Link href="/onboarding">Build your portfolio</Link></Button>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-2">
              What role are you targeting?
            </label>
            <input
              ref={inputRef}
              type="text"
              value={targetRole}
              onChange={e => onRoleChange(e.target.value)}
              placeholder="e.g. Senior Product Manager at a Series B startup"
              autoFocus
              className="w-full text-small text-text-primary bg-transparent border-b border-border focus:border-accent outline-none pb-2 transition-colors placeholder:text-text-disabled"
            />
          </div>

          <div>
            <label className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-2">
              Calibrate for a specific company? <span className="text-text-disabled normal-case tracking-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={targetCompany}
              onChange={e => onCompanyChange(e.target.value)}
              placeholder="e.g. Stripe, Google, early-stage startup"
              className="w-full text-small text-text-primary bg-transparent border-b border-border focus:border-accent outline-none pb-2 transition-colors placeholder:text-text-disabled"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={!targetRole.trim() || !portfolio}
              className="flex items-center gap-2"
            >
              Start Cold Read
              <ArrowRightIcon />
            </Button>
            <p className="text-micro text-text-disabled mt-3">
              Analysis takes 15–25 seconds · Powered by Gemini 2.5 Pro
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Generating View ────────────────────────────────────────
// Shows the user's actual portfolio content being "read" in real time.
// The experience IS the product.

function GeneratingView({ portfolio }: { portfolio: Portfolio | null }) {
  const [readStep, setReadStep] = useState(0)
  // steps: 0=cursor on headline, 1=reading bullets, 2=forming impression, 3=identifying gaps

  useEffect(() => {
    const timers = [
      setTimeout(() => setReadStep(1), 1800),
      setTimeout(() => setReadStep(2), 4000),
      setTimeout(() => setReadStep(3), 7000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const headline   = portfolio?.data?.headline ?? '...'
  const topRole    = portfolio?.data?.experience?.[0]
  const topBullet  = topRole?.bullets?.[0] ?? topRole?.highlights?.[0] ?? topRole?.description ?? null

  return (
    <div className="animate-fade-in">

      {/* Terminal header */}
      <div className="flex items-center gap-2 mb-10">
        <span className="inline-block w-[7px] h-[7px] rounded-full bg-accent" style={{ animation: 'statusBeacon 1.2s ease-in-out infinite' }} />
        <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">
          Career Mirror // Reading
        </span>
      </div>

      {/* Progress track */}
      <div className="flex gap-1 mb-10">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="h-px flex-1 transition-all duration-700"
            style={{ background: i <= readStep ? 'var(--accent)' : 'var(--border)' }}
          />
        ))}
      </div>

      {/* The "hiring manager reading your portfolio" experience */}
      <div className="space-y-8 font-mono text-small">

        {/* Step 0 — headline appears with cursor */}
        <div className="space-y-1">
          <span className="text-micro text-text-disabled uppercase tracking-widest">Reading headline</span>
          <div className="text-text-secondary flex items-center gap-1">
            <span>"{headline}"</span>
            <span
              className="inline-block w-[2px] h-[1em] bg-text-secondary"
              style={{ animation: readStep === 0 ? 'mirror-cursor 0.8s step-end infinite' : 'none', opacity: readStep === 0 ? 1 : 0 }}
            />
          </div>
        </div>

        {/* Step 1 — first bullet appears */}
        {readStep >= 1 && topBullet && (
          <div className="space-y-1 animate-fade-in">
            <span className="text-micro text-text-disabled uppercase tracking-widest">
              Scanning experience — {topRole?.company ?? 'most recent role'}
            </span>
            <div className="text-text-secondary">
              <span className="text-text-disabled mr-2">•</span>
              <span>"{topBullet}"</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning" />
              <span className="text-micro text-text-disabled">Pattern detected</span>
            </div>
          </div>
        )}

        {/* Step 2 — impression forming */}
        {readStep >= 2 && (
          <div className="space-y-1 animate-fade-in">
            <span className="text-micro text-text-disabled uppercase tracking-widest">Forming impression</span>
            <div className="text-text-secondary">
              Mapping language patterns across {portfolio?.data?.experience?.length ?? 0} roles…
            </div>
          </div>
        )}

        {/* Step 3 — identifying gaps */}
        {readStep >= 3 && (
          <div className="space-y-1 animate-fade-in">
            <span className="text-micro text-text-disabled uppercase tracking-widest">Identifying signals</span>
            <div className="text-text-secondary">Comparing perception vs target…</div>
          </div>
        )}
      </div>

      <p className="text-micro text-text-disabled mt-10 font-mono">
        15–25 seconds · Do not close this tab
      </p>
    </div>
  )
}

// ─── Error View ─────────────────────────────────────────────

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="py-16 animate-fade-in">
      <span className="text-micro font-mono text-error uppercase tracking-widest block mb-3">Error</span>
      <p className="text-small text-text-primary mb-6">{message}</p>
      <Button variant="secondary" onClick={onRetry}>Try again</Button>
    </div>
  )
}

// ─── Report View ────────────────────────────────────────────

interface ReportViewProps {
  report:          CareerMirrorReport
  targetRole:      string
  targetCompany:   string
  onRoleChange:    (v: string) => void
  onCompanyChange: (v: string) => void
  onRegenerate:    () => void
  onOpenInEditor:  () => void
  portfolioId:     string
  isPro:           boolean
}

function ReportView({ report, targetRole, targetCompany, onRoleChange, onCompanyChange, onRegenerate, onOpenInEditor, portfolioId, isPro }: ReportViewProps) {
  const [revealed, setRevealed] = useState(false)

  // Trigger verdict reveal animation after mount
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 100)
    return () => clearTimeout(t)
  }, [])

  // Split verdict into 3 dramatic chunks
  const verdict = report.coldRead.verdict
  const chunks  = splitVerdictChunks(verdict)

  return (
    <div className="space-y-16 animate-fade-in">

      {/* ── Terminal header ── */}
      <div className="animate-slide-up-1">
        <div className="flex items-center gap-2 mb-6">
          <span className="inline-block w-[7px] h-[7px] rounded-full bg-success" style={{ animation: 'statusBeacon 2s ease-in-out infinite' }} />
          <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">
            Career Mirror // Cold Read Complete
          </span>
        </div>

        {/* Archetype — the dominant element */}
        <div
          className="font-mono font-bold text-text-disabled uppercase tracking-[0.25em] mb-4"
          style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', lineHeight: 1 }}
        >
          {report.coldRead.archetype}
        </div>

        {/* Verdict — chunk reveal with dramatic pauses */}
        <div className="text-2xl font-medium text-text-primary tracking-tight leading-snug mb-3 max-w-2xl">
          {chunks.map((chunk, i) => (
            <span
              key={i}
              className="mirror-chunk"
              style={{
                opacity:   revealed ? 1 : 0,
                transform: revealed ? 'translateY(0)' : 'translateY(6px)',
                transition: `opacity 220ms ease ${i * 700 + 200}ms, transform 220ms ease ${i * 700 + 200}ms`,
                display: 'inline',
              }}
            >
              {chunk}
              {i < chunks.length - 1 ? ' ' : ''}
            </span>
          ))}
        </div>

        {/* First impression sub-line */}
        {report.coldRead.firstImpression && (
          <p
            className="text-small text-text-secondary max-w-xl"
            style={{
              opacity:    revealed ? 1 : 0,
              transform:  revealed ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 200ms ease 2400ms, transform 200ms ease 2400ms',
            }}
          >
            {report.coldRead.firstImpression}
          </p>
        )}

        <p className="text-micro font-mono text-text-disabled mt-3">
          Based on {report.coldRead.evidenceCount} signals from your portfolio · 30-second cold read
        </p>
      </div>

      {/* ── Evidence ledger ── */}
      <section className="animate-slide-up-2">
        <div className="flex items-baseline justify-between mb-4">
          <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Evidence</span>
          <span className="text-micro font-mono text-text-disabled">{report.evidence.length} signals</span>
        </div>
        <div className="divide-y divide-border border-t border-border">
          {/* Always show the first evidence item — it proves the analysis is real */}
          {report.evidence.slice(0, 1).map((ev, i) => (
            <EvidenceRow key={i} ev={ev} />
          ))}

          {/* Pro: show all remaining · Free: blur preview + gate */}
          {isPro ? (
            report.evidence.slice(1).map((ev, i) => (
              <EvidenceRow key={i + 1} ev={ev} />
            ))
          ) : (
            <>
              {/* Blurred preview rows — signals there's more, not a hard cutoff */}
              <div className="select-none pointer-events-none" style={{ filter: 'blur(4px)', opacity: 0.4 }}>
                {report.evidence.slice(1, 3).map((ev, i) => (
                  <EvidenceRow key={i + 1} ev={ev} />
                ))}
              </div>

              {/* Gate */}
              <div className="py-6 flex flex-col gap-3 border-t border-border">
                <p className="text-small text-text-primary font-medium">
                  {report.evidence.length - 1} more signal{report.evidence.length - 1 !== 1 ? 's' : ''} found in your portfolio
                </p>
                <p className="text-small text-text-secondary">
                  Unlock the full analysis — all evidence, your perception gap, and the 3 moves that change your read.
                </p>
                <div className="pt-1">
                  <Button asChild size="sm">
                    <Link href={`/dashboard/upgrade?from=mirror&id=${portfolioId}`}>
                      Unlock Career Mirror · Pro
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {isPro && (
          <div className="mt-4 border-l-2 border-border pl-4">
            <p className="text-micro text-text-disabled">
              This is how a hiring manager reads your portfolio in 30 seconds.
              Not a judgement of your ability — a map of what to change.
            </p>
          </div>
        )}
      </section>

      {/* ── Pro-only sections ── */}
      {isPro && (<>

      {/* ── Perception gap ── */}
      <section className="animate-slide-up-3">
        <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">
          Perception gap
        </span>

        {/* Gap size indicator */}
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-micro font-mono uppercase tracking-widest ${GAP_COLORS[report.perceptionGap.gapSize]}`}>
            {report.perceptionGap.gapSize}
          </span>
          <span className="text-micro text-text-disabled">
            {GAP_LABELS[report.perceptionGap.gapSize]}
          </span>
        </div>

        {/* Two-column flat table */}
        <div className="grid grid-cols-2 border border-border">
          <div className="p-5 border-r border-border">
            <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-3">
              What your words say
            </span>
            <p className="text-small text-text-primary">{report.perceptionGap.yourWordsSignal}</p>
          </div>
          <div className="p-5">
            <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-3">
              What a hiring manager hears
            </span>
            <p className="text-small text-text-primary">{report.perceptionGap.hiringManagerReads}</p>
          </div>
        </div>
      </section>

      {/* ── Top moves ── */}
      <section className="animate-slide-up-4">
        <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-6">
          Three moves that change this
        </span>
        <div className="space-y-0 divide-y divide-border border-t border-border">
          {report.topMoves.map((move, i) => (
            <div key={i} className="py-6 grid grid-cols-[32px_1fr] gap-4">
              <span className="text-micro font-mono text-text-disabled tabular-nums mt-0.5">
                0{i + 1}
              </span>
              <div>
                <p className="text-micro font-mono text-text-disabled uppercase tracking-widest mb-1">
                  {move.location}
                </p>
                <p className="text-small font-medium text-text-primary mb-1">{move.action}</p>
                <p className="text-small text-text-secondary">{move.reason}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Apply to editor CTA */}
        <div className="mt-4">
          <button
            onClick={onOpenInEditor}
            className="inline-flex items-center gap-1.5 text-micro font-mono text-text-disabled hover:text-accent transition-colors"
          >
            Apply changes in editor
            <ArrowRightIcon size={11} />
          </button>
        </div>
      </section>

      {/* ── Archetype path ── */}
      {report.archetypePath?.summary && (
        <section className="animate-slide-up-5">
          <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">
            Where this archetype goes
          </span>
          <p className="text-small text-text-secondary mb-4 border-l-2 border-border pl-4">
            {report.archetypePath.summary}
          </p>
          {report.archetypePath.moves?.length > 0 && (
            <div className="divide-y divide-border border-t border-border">
              {report.archetypePath.moves.map((move, i) => (
                <div key={i} className="py-3 grid grid-cols-[20px_1fr] gap-3">
                  <span className="text-micro font-mono text-text-disabled">—</span>
                  <p className="text-small text-text-secondary">{move}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Diagnosis closer ── */}
      <section className="animate-slide-up-6">
        <div className="border-t border-border pt-8">
          <p className="text-small font-medium text-text-primary border-l-2 border-accent pl-4 leading-relaxed max-w-xl">
            {report.diagnosis}
          </p>
          {report.topFix && (
            <p className="text-small text-text-secondary mt-4 pl-6">
              Start here: {report.topFix}
            </p>
          )}
        </div>
      </section>

      {/* ── Calibrate / Regenerate ── */}
      <section className="border-t border-border pt-8 animate-slide-up-6">
        <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">
          Recalibrate
        </span>
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="text-micro font-mono text-text-disabled block mb-1">Role</label>
            <input
              type="text"
              value={targetRole}
              onChange={e => onRoleChange(e.target.value)}
              className="w-full text-small text-text-primary bg-transparent border-b border-border focus:border-accent outline-none pb-1.5 transition-colors"
            />
          </div>
          <div className="flex-1 min-w-48">
            <label className="text-micro font-mono text-text-disabled block mb-1">Company (optional)</label>
            <input
              type="text"
              value={targetCompany}
              onChange={e => onCompanyChange(e.target.value)}
              placeholder="e.g. Stripe"
              className="w-full text-small text-text-primary bg-transparent border-b border-border focus:border-accent outline-none pb-1.5 transition-colors placeholder:text-text-disabled"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={onRegenerate} className="shrink-0 flex items-center gap-1.5">
            <RefreshIcon />
            Regenerate
          </Button>
        </div>
        <p className="text-micro text-text-disabled mt-3">
          Generated {formatRelativeTime(report.generatedAt)} ·{' '}
          Edit your portfolio and regenerate to track perception change
        </p>
      </section>

      </>)}

    </div>
  )
}

// ─── Evidence Row ───────────────────────────────────────────

function EvidenceRow({ ev }: { ev: MirrorEvidence }) {
  const cfg = EVIDENCE_CONFIG[ev.type]
  return (
    <div className="py-4">
      {/* Row 1: type tag + finding */}
      <div className="grid grid-cols-[90px_1fr] gap-4 items-baseline">
        <span className={`text-micro font-mono uppercase tracking-widest shrink-0 ${cfg.className}`}>
          {cfg.label}
        </span>
        <p className="text-small text-text-primary">{ev.finding}</p>
      </div>
      {/* Row 2: quote (if present) */}
      {ev.quote && (
        <div className="grid grid-cols-[90px_1fr] gap-4 mt-1.5">
          <span />
          <p className="text-small font-mono text-text-disabled border-l-2 border-border pl-3 italic">
            ↳ "{ev.quote}"
          </p>
        </div>
      )}
      {/* Row 3: impact */}
      <div className="grid grid-cols-[90px_1fr] gap-4 mt-1">
        <span />
        <p className="text-small text-text-disabled">{ev.impact}</p>
      </div>
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────

// Split verdict into 3 chunks at semantic boundaries for the dramatic reveal.
// "The market reads you as" / "a strong executor" / "who hasn't demonstrated ownership."
function splitVerdictChunks(verdict: string): string[] {
  // Try to split at " as " and then at the last clause boundary
  const asIdx = verdict.indexOf(' as ')
  if (asIdx === -1) {
    // Fallback: split roughly into thirds
    const third = Math.floor(verdict.length / 3)
    return [
      verdict.slice(0, third),
      verdict.slice(third, third * 2),
      verdict.slice(third * 2),
    ].filter(Boolean)
  }

  const prefix  = verdict.slice(0, asIdx + 4)        // "The market reads you as "
  const rest    = verdict.slice(asIdx + 4)
  // Find a split point in rest — comma, " who ", " but ", " with "
  const splits  = [' who ', ', who ', ' but ', ' with ', ' and ']
  for (const sp of splits) {
    const idx = rest.indexOf(sp)
    if (idx > 0) {
      return [prefix, rest.slice(0, idx), rest.slice(idx)]
    }
  }
  // No natural split — two chunks
  return [prefix, rest]
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 2)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Icons ─────────────────────────────────────────────────

function ArrowRightIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  )
}
