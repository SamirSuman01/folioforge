'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const LINES = [
  'Parsing work history & extracting achievements',
  'Scoring across 5 signal dimensions',
  'Running ATS filter simulation',
  'Identifying keyword gaps vs target JD',
  'Mapping warm introduction paths',
]

export default function AnimatedLog() {
  const ref      = useRef<HTMLDivElement>(null)
  const [vis,      setVis]      = useState(false)
  const [revealed, setRevealed] = useState(0)
  const [done,     setDone]     = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVis(true) },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!vis) return
    if (revealed >= LINES.length) {
      const t = setTimeout(() => setDone(true), 500)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setRevealed(r => r + 1), 400)
    return () => clearTimeout(t)
  }, [vis, revealed])

  return (
    <div ref={ref} className="ll-cap-log">
      <div className="ll-log-label">Processing log</div>

      {LINES.map((text, i) => (
        <div
          key={text}
          className={`ll-log-row ll-log-row--anim${i < revealed ? ' ll-log-row--vis' : ''}`}
        >
          <span className="ll-log-n">{String(i + 1).padStart(2, '0')}</span>
          {/* ll-log-body wraps text + check together — no far-right ping-pong */}
          <span className="ll-log-body">
            <span className="ll-log-text">{text}</span>
            {i < revealed && <span className="ll-log-check">✓</span>}
          </span>
        </div>
      ))}

      {/* Step 06 — exit link, not a passive log entry */}
      <div className={`ll-log-row ll-log-row--anim${done ? ' ll-log-row--vis' : ''}`}>
        <span className="ll-log-n">06</span>
        {done
          ? <Link href="/p/demo" className="ll-log-exit">Portfolio ready →</Link>
          : <span className="ll-log-active">…</span>
        }
      </div>
    </div>
  )
}
