'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

/* ── Types ───────────────────────────────────────────── */
type LineType = 'cmd'|'out'|'section'|'warn'|'success'|'bar'|'divider'|'result'|'cursor'

interface TLine {
  id:     number
  type:   LineType
  text?:  string
  label?: string
  value?: number
}

/* ── Terminal script ──────────────────────────────────── */
const SCRIPT: Array<{
  type: LineType; text?: string; label?: string; value?: number; delay: number
}> = [
  { type: 'cmd',     text: '$ forgefolio scan --input="resume.pdf"',         delay: 300  },
  { type: 'out',     text: 'Parsing 612 words...',                            delay: 700  },
  { type: 'out',     text: 'Extracting signals from 3 work experiences',      delay: 1000 },
  { type: 'divider',                                                            delay: 1300 },
  { type: 'section', text: '// SIGNAL ANALYSIS',                              delay: 1400 },
  { type: 'bar',     label: 'Impact',     value: 58,                           delay: 1600 },
  { type: 'bar',     label: 'Clarity',    value: 64,                           delay: 1900 },
  { type: 'bar',     label: 'Relevance',  value: 72,                           delay: 2200 },
  { type: 'bar',     label: 'Depth',      value: 48,                           delay: 2500 },
  { type: 'divider',                                                            delay: 2800 },
  { type: 'section', text: '// GAP DETECTION',                                delay: 2900 },
  { type: 'warn',    text: '⚠  Missing: Metrics in all 4 work bullets',       delay: 3100 },
  { type: 'warn',    text: '⚠  Missing: SDE-1 keywords (Redis, Docker)',      delay: 3350 },
  { type: 'divider',                                                            delay: 3650 },
  { type: 'section', text: '// WARM PATHS',                                   delay: 3750 },
  { type: 'success', text: '✦  Razorpay Engineering  —  1 alumni connection', delay: 3950 },
  { type: 'success', text: '✦  Zepto Tech  —  1 mutual contact found',        delay: 4200 },
  { type: 'divider',                                                            delay: 4500 },
  { type: 'result',  text: 'Signal score: 61/100  ·  2 gaps  ·  2 paths',    delay: 4700 },
  { type: 'cursor',                                                             delay: 5100 },
]

/* ── Count-up hook ────────────────────────────────────── */
function useCountUp(target: number, duration: number, active: boolean): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return
    const start = Date.now()
    let raf: number
    const tick = () => {
      const elapsed  = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, target, duration])
  return value
}

/* ── Component ────────────────────────────────────────── */
export default function HeroSection() {
  const [lines,       setLines]       = useState<TLine[]>([])
  const [filledBars,  setFilledBars]  = useState<Set<number>>(new Set())
  const [statsActive, setStatsActive] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const nextId  = useRef(0)

  const scoreVal = useCountUp(61, 1200, statsActive)
  const gapsVal  = useCountUp(2,   700, statsActive)
  const pathsVal = useCountUp(2,   700, statsActive)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    SCRIPT.forEach(({ type, text, label, value, delay }) => {
      const id = nextId.current++
      timers.push(setTimeout(() => {
        setLines(prev => [...prev, { id, type, text, label, value }])

        if (type === 'bar') {
          timers.push(setTimeout(() => {
            setFilledBars(prev => new Set(Array.from(prev).concat(id)))
          }, 80))
        }
        if (type === 'result') {
          timers.push(setTimeout(() => setStatsActive(true), 300))
        }

        requestAnimationFrame(() => {
          if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
        })
      }, delay))
    })

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <section className="ld-hero">

      {/* Grid background */}
      <div className="ld-hero-grid-bg" />

      {/* ══ LEFT ══ */}
      <div className="ld-hero-left">

        <div className="ld-eyebrow">
          <div className="ld-eyebrow-line" />
          System v2.4 · Active
        </div>

        <h1 className="ld-h1">
          Your career<br />
          is not a{' '}
          <em className="ld-h1-em">document.</em>
          <br />
          Run it like<br />
          <em className="ld-h1-em">a system.</em>
        </h1>

        <p className="ld-sub">
          ForgeFolio converts your raw experience into a live intelligence
          layer — signal-scored portfolio, gap analysis, market targeting,
          warm path mapping.
        </p>

        <div className="ld-ctas">
          <Link href="/onboarding" className="ld-btn-hero">
            Upload your resume →
          </Link>
          <Link href="/p/demo" className="ld-btn-ghost">
            See live demo →
          </Link>
        </div>

        <div className="ld-proof">
          <span>Signal score · ATS autopsy · Offer analyzer · Ghost job detector</span>
        </div>
      </div>

      {/* ══ RIGHT — TERMINAL ══ */}
      <div className="ld-hero-right-panel">
        <div className="ld-terminal">

          <div className="ld-scan-line" />

          <div className="ld-terminal-header">
            <div className="ld-terminal-dots">
              <div className="ld-terminal-dot active" />
              <div className="ld-terminal-dot" />
              <div className="ld-terminal-dot" />
            </div>
            <span className="ld-terminal-title">forgefolio · signal-scan</span>
            <div className="ld-terminal-live">
              <div className="ld-live-dot" />
              LIVE
            </div>
          </div>

          <div
            ref={bodyRef}
            className="ld-terminal-body"
            style={{ padding: '20px 18px 18px', minHeight: 300, maxHeight: 380, overflowY: 'auto' }}
          >
            {lines.map(line => (
              <TermLine key={line.id} line={line} filledBars={filledBars} />
            ))}
          </div>

          <div className="ld-terminal-footer">
            {[
              { label: 'Signal Score', val: statsActive ? `${scoreVal}/100` : '—', green: true  },
              { label: 'Gaps Found',   val: statsActive ? String(gapsVal)   : '—', green: false },
              { label: 'Warm Paths',   val: statsActive ? String(pathsVal)  : '—', green: false },
            ].map(({ label, val, green }) => (
              <div key={label} className="ld-stat-cell">
                <div className="ld-stat-label">{label}</div>
                <div className={`ld-stat-val${green ? ' green' : ''}`}>{val}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

    </section>
  )
}

/* ── Terminal line renderer ───────────────────────────── */
function TermLine({ line, filledBars }: { line: TLine; filledBars: Set<number> }) {
  switch (line.type) {

    case 'cmd':
      return (
        <div className="ld-term-line" style={{ display: 'flex', gap: 10 }}>
          <span style={{ color: '#BCFF4F', flexShrink: 0 }}>$</span>
          <span style={{ color: '#F2EDE4' }}>{line.text?.slice(2)}</span>
        </div>
      )

    case 'out':
      return (
        <div className="ld-term-line" style={{ display: 'flex' }}>
          <span style={{ color: '#C4BDB0', paddingLeft: 22 }}>{line.text}</span>
        </div>
      )

    case 'section':
      return (
        <div className="ld-term-line" style={{
          color: 'rgba(242,237,228,0.22)', fontSize: 9.5,
          letterSpacing: '0.18em', paddingTop: 6, paddingBottom: 2,
        }}>
          {line.text}
        </div>
      )

    case 'warn':
      return (
        <div className="ld-term-line" style={{ display: 'flex' }}>
          <span style={{ color: '#FFB347', paddingLeft: 22 }}>{line.text}</span>
        </div>
      )

    case 'success':
      return (
        <div className="ld-term-line" style={{ display: 'flex' }}>
          <span style={{ color: '#BCFF4F', paddingLeft: 22 }}>{line.text}</span>
        </div>
      )

    case 'bar':
      return (
        <div className="ld-term-line" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          paddingLeft: 22, marginBottom: 3,
        }}>
          <span style={{
            fontFamily: "var(--font-ibm-mono,'IBM Plex Mono',monospace)",
            fontSize: 10.5, color: '#7A756D', minWidth: 72,
          }}>
            {line.label}
          </span>
          <div style={{ flex: 1, height: 2, background: 'rgba(242,237,228,0.07)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: '#BCFF4F',
              width: filledBars.has(line.id) ? `${line.value}%` : '0%',
              transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
          <span style={{
            fontFamily: "var(--font-ibm-mono,'IBM Plex Mono',monospace)",
            fontSize: 10.5, color: '#BCFF4F', minWidth: 28, textAlign: 'right',
          }}>
            {line.value}
          </span>
        </div>
      )

    case 'divider':
      return (
        <div className="ld-term-divider" style={{
          height: 1, background: 'rgba(242,237,228,0.07)', margin: '10px 0',
        }} />
      )

    case 'result':
      return (
        <div className="ld-term-line" style={{ display: 'flex' }}>
          <span style={{ color: '#F2EDE4', fontWeight: 500, paddingLeft: 22 }}>{line.text}</span>
        </div>
      )

    case 'cursor':
      return (
        <div className="ld-term-line" style={{ display: 'flex', gap: 10 }}>
          <span style={{ color: '#BCFF4F', flexShrink: 0 }}>$</span>
          <span className="ld-cursor-blink" />
        </div>
      )

    default:
      return null
  }
}
