'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import AppNav from '@/components/ui/AppNav'

// ─── Types ────────────────────────────────────────────────
interface ScorePoint {
  score:       number
  recorded_at: string
  portfolio_id: string
}

interface Portfolio {
  id:    string
  title: string
  score: number | null
}

// ─── Helpers ──────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function scoreGrade(s: number) {
  if (s >= 95) return 'A+'
  if (s >= 88) return 'A'
  if (s >= 80) return 'B+'
  if (s >= 70) return 'B'
  if (s >= 60) return 'C+'
  if (s >= 50) return 'C'
  return 'D'
}

function scoreDeltaLabel(first: number, last: number) {
  const d = last - first
  if (d > 0) return `+${d}`
  if (d < 0) return `${d}`
  return '±0'
}

function cn(...c: (string | boolean | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

// ─── SVG Sparkline ────────────────────────────────────────
function TimelineChart({ points }: { points: ScorePoint[] }) {
  const W = 640, H = 200, PAD = { top: 16, right: 16, bottom: 32, left: 40 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top  - PAD.bottom

  if (points.length < 2) return null

  const scores = points.map(p => p.score)
  const min    = Math.max(0,   Math.min(...scores) - 8)
  const max    = Math.min(100, Math.max(...scores) + 8)

  const xScale = (i: number) => PAD.left + (i / (points.length - 1)) * innerW
  const yScale = (s: number) => PAD.top + innerH - ((s - min) / (max - min)) * innerH

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(p.score)}`).join(' ')
  const areaPath = [
    `M ${xScale(0)} ${H - PAD.bottom}`,
    ...points.map((p, i) => `L ${xScale(i)} ${yScale(p.score)}`),
    `L ${xScale(points.length - 1)} ${H - PAD.bottom}`,
    'Z',
  ].join(' ')

  // Y-axis ticks
  const ticks = [min, (min + max) / 2, max].map(Math.round)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      aria-label="Score timeline chart"
      role="img"
    >
      <defs>
        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1E3A8A" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.00" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {ticks.map(t => (
        <line
          key={t}
          x1={PAD.left} y1={yScale(t)}
          x2={W - PAD.right} y2={yScale(t)}
          stroke="currentColor" className="text-border" strokeWidth="1"
        />
      ))}

      {/* Y-axis labels */}
      {ticks.map(t => (
        <text
          key={`label-${t}`}
          x={PAD.left - 8} y={yScale(t) + 4}
          textAnchor="end"
          fontSize="10" fontFamily="monospace"
          fill="#94A3B8"
        >
          {t}
        </text>
      ))}

      {/* X-axis date labels — every ~5 points or first/last */}
      {points.map((p, i) => {
        const show = i === 0 || i === points.length - 1 || (points.length > 8 && i % Math.ceil(points.length / 5) === 0)
        if (!show) return null
        return (
          <text
            key={`date-${i}`}
            x={xScale(i)} y={H - 8}
            textAnchor="middle"
            fontSize="9" fontFamily="monospace"
            fill="#94A3B8"
          >
            {formatDate(p.recorded_at)}
          </text>
        )
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#area-grad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#1E3A8A" strokeWidth="1.5" strokeLinejoin="round" />

      {/* Data points — only first, last, and min/max */}
      {points.map((p, i) => {
        const isFirst = i === 0
        const isLast  = i === points.length - 1
        const isMin   = p.score === Math.min(...scores)
        const isMax   = p.score === Math.max(...scores)
        if (!isFirst && !isLast && !isMin && !isMax) return null
        return (
          <g key={`pt-${i}`}>
            <circle cx={xScale(i)} cy={yScale(p.score)} r="3.5" fill="#fff" stroke="#1E3A8A" strokeWidth="1.5" />
            {(isFirst || isLast) && (
              <text
                x={xScale(i)} y={yScale(p.score) - 8}
                textAnchor="middle"
                fontSize="10" fontFamily="monospace" fontWeight="600"
                fill="#0F172A"
              >
                {p.score}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────
export default function ScoreTimelinePage() {
  const router    = useRouter()
  const supabase  = createClient()

  const [portfolios,   setPortfolios]   = useState<Portfolio[]>([])
  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [history,      setHistory]      = useState<ScorePoint[]>([])
  const [loading,      setLoading]      = useState(true)
  const [fetchError,   setFetchError]   = useState(false)
  const [userName,     setUserName]     = useState('')
  const [userInitial,  setUserInitial]  = useState('?')

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/auth/login'); return }

        const name = user.user_metadata?.full_name as string ?? ''
        setUserName(name || user.email?.split('@')[0] || '')
        setUserInitial((name || user.email || '?')[0].toUpperCase())

        // Load portfolios
        const { data: pData, error: pErr } = await supabase
          .from('portfolios')
          .select('id, data, score')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })

        if (pErr) { setFetchError(true); return }

        if (pData && pData.length > 0) {
          const mapped: Portfolio[] = pData.map(p => ({
            id:    p.id,
            title: (p.data as { name?: string })?.name ?? 'Untitled',
            score: p.score ?? null,
          }))
          setPortfolios(mapped)
          setSelectedId(mapped[0].id)
        }
      } catch {
        setFetchError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load history whenever selected portfolio changes
  useEffect(() => {
    if (!selectedId) return
    async function loadHistory() {
      const { data } = await supabase
        .from('score_history')
        .select('score, recorded_at, portfolio_id')
        .eq('portfolio_id', selectedId)
        .order('recorded_at', { ascending: true })
        .limit(90)

      setHistory((data as ScorePoint[]) ?? [])
    }
    loadHistory()
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedPortfolio = portfolios.find(p => p.id === selectedId)
  const first = history[0]?.score ?? null
  const last  = history[history.length - 1]?.score ?? null
  const peak  = history.length ? Math.max(...history.map(h => h.score)) : null
  const delta = first !== null && last !== null ? last - first : null

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav userName={userName} userInitial={userInitial} />
        <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
          <div className="h-px w-full bg-border animate-pulse" />
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav userName={userName} userInitial={userInitial} />
        <main className="mx-auto max-w-4xl px-6 py-20 lg:px-8 text-center">
          <p className="text-micro font-mono text-error uppercase tracking-widest mb-3">Error</p>
          <h2 className="text-h2 font-bold text-text-primary mb-2">Couldn't load portfolios</h2>
          <p className="text-body text-text-secondary mb-8">Check your connection and try again.</p>
          <Link href="/dashboard" className="text-small font-mono text-accent hover:text-accent/80 transition-colors">← Dashboard</Link>
        </main>
      </div>
    )
  }

  if (!portfolios.length) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav userName={userName} userInitial={userInitial} />
        <main className="mx-auto max-w-4xl px-6 py-20 lg:px-8 text-center">
          <p className="text-micro font-mono text-text-disabled uppercase tracking-widest mb-3">Score · Timeline</p>
          <h2 className="text-h2 font-bold text-text-primary mb-2">No portfolios yet</h2>
          <p className="text-body text-text-secondary mb-8">Create a portfolio to start tracking your career score over time.</p>
          <Link href="/dashboard" className="text-small font-mono text-accent hover:text-accent/80 transition-colors">← Dashboard</Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav userName={userName} userInitial={userInitial} />

      <main className="mx-auto max-w-4xl px-6 py-10 lg:px-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-8 animate-slide-up-1">
          <div>
            <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-1">
              Career score · Timeline
            </span>
            <h1 className="text-h2 font-bold text-text-primary tracking-tight">Signal score · history</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/wrapped"
              className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors shrink-0 mt-1"
            >
              Quarter Wrapped →
            </Link>
            <Link
              href="/dashboard"
              className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors shrink-0 mt-1"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        <>
            {/* Portfolio selector — only show if more than one */}
            {portfolios.length > 1 && (
              <div className="flex items-center gap-0 border-b border-border mb-8 animate-slide-up-1">
                {portfolios.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={cn(
                      'pb-2.5 mr-5 text-micro font-mono uppercase tracking-widest transition-colors border-b-2 -mb-px',
                      selectedId === p.id
                        ? 'border-accent text-text-primary'
                        : 'border-transparent text-text-disabled hover:text-text-secondary',
                    )}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            )}

            {/* Current score + delta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border border-border mb-8 animate-slide-up-2">
              {[
                {
                  label: 'Current score',
                  value: selectedPortfolio?.score !== null && selectedPortfolio?.score !== undefined
                    ? `${selectedPortfolio.score}`
                    : '—',
                  note: selectedPortfolio?.score !== null && selectedPortfolio?.score !== undefined
                    ? `Grade ${scoreGrade(selectedPortfolio.score)}`
                    : 'Not scored yet',
                },
                {
                  label: 'Change',
                  value: delta !== null ? scoreDeltaLabel(first!, last!) : '—',
                  note: history.length > 1
                    ? `Over ${history.length} saves`
                    : 'Not enough saves',
                },
                {
                  label: 'Peak',
                  value: peak !== null ? `${peak}` : '—',
                  note: peak !== null ? `Grade ${scoreGrade(peak)}` : 'No history',
                },
                {
                  label: 'Saves',
                  value: history.length.toString(),
                  note: history.length > 0 ? `Since ${formatDate(history[0].recorded_at)}` : 'No saves yet',
                },
              ].map(({ label, value, note }, i) => (
                <div key={label} className={cn('p-5', i < 3 && 'border-r border-border')}>
                  <p className={cn(
                    'font-bold font-mono tabular-nums leading-none mb-2',
                    label === 'Current score' ? 'text-[2.25rem]' : 'text-[1.75rem]',
                    label === 'Change' && delta !== null
                      ? delta > 0 ? 'text-success' : delta < 0 ? 'text-error' : 'text-text-primary'
                      : 'text-text-primary'
                  )}>
                    {value}
                  </p>
                  <p className="text-micro font-mono text-text-primary mb-0.5">{label}</p>
                  <p className="text-micro text-text-disabled">{note}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="border border-border p-6 mb-8 animate-slide-up-3">
              {history.length < 2 ? (
                <div className="py-12 text-center">
                  <p className="text-micro font-mono text-text-disabled uppercase tracking-widest mb-2">
                    {history.length === 0 ? 'No saves yet' : 'Need at least 2 saves'}
                  </p>
                  <p className="text-small text-text-secondary">
                    Save your portfolio a few times after making edits — the trend line will appear here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline justify-end mb-4">
                    <span className="text-micro font-mono text-text-disabled">
                      {formatDate(history[0].recorded_at)} – {formatDate(history[history.length - 1].recorded_at)}
                    </span>
                  </div>
                  <TimelineChart points={history} />
                </>
              )}
            </div>

            {/* History log — last 10 saves */}
            {history.length > 0 && (
              <div className="animate-slide-up-4">
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">
                  Save history
                </span>
                <div className="divide-y divide-border border-t border-border">
                  {[...history].reverse().slice(0, 10).map((h, i) => {
                    const prev  = [...history].reverse()[i + 1]
                    const diff  = prev ? h.score - prev.score : null
                    return (
                      <div key={h.recorded_at} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-small font-bold font-mono text-text-primary tabular-nums w-8">
                            {h.score}
                          </span>
                          <span className="text-micro font-mono text-text-disabled">
                            Grade {scoreGrade(h.score)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          {diff !== null && (
                            <span className={cn(
                              'text-micro font-mono tabular-nums',
                              diff > 0 ? 'text-success' : diff < 0 ? 'text-error' : 'text-text-disabled',
                            )}>
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          )}
                          <span className="text-micro font-mono text-text-disabled tabular-nums">
                            {formatDate(h.recorded_at)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
        </>
      </main>
    </div>
  )
}
