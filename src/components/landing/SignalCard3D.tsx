'use client'

import { useRef, useEffect } from 'react'

const DIMENSIONS = [
  { key: 'Impact',     score: 71, max: 100 },
  { key: 'Keywords',   score: 88, max: 100 },
  { key: 'Structure',  score: 90, max: 100 },
  { key: 'Projects',   score: 82, max: 100 },
  { key: 'Presence',   score: 55, max: 100 },
]

const FIXES = [
  { priority: 'P1', text: 'Quantify 3 impact bullets in "Experience"' },
  { priority: 'P2', text: 'Add GitHub URL — 41% of recruiters filter without it' },
  { priority: 'P3', text: 'Remove "responsible for" — replace with owned/shipped/drove' },
]

export default function SignalCard3D() {
  const cardRef   = useRef<HTMLDivElement>(null)
  const glowRef   = useRef<HTMLDivElement>(null)
  const scanRef   = useRef<HTMLDivElement>(null)
  const frameRef  = useRef<number>(0)

  useEffect(() => {
    const card = cardRef.current
    const glow = glowRef.current
    if (!card || !glow) return

    let targetRX = 0, targetRY = 0
    let curRX = 0, curRY = 0
    let glowX = 50, glowY = 50

    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const cx   = rect.left + rect.width  / 2
      const cy   = rect.top  + rect.height / 2
      const dx   = (e.clientX - cx) / rect.width
      const dy   = (e.clientY - cy) / rect.height
      targetRX   = -dy * 18
      targetRY   =  dx * 18
      glowX      = 50 + dx * 60
      glowY      = 50 + dy * 60
    }

    const onLeave = () => { targetRX = 0; targetRY = 0; glowX = 50; glowY = 50 }

    const animate = () => {
      curRX += (targetRX - curRX) * 0.08
      curRY += (targetRY - curRY) * 0.08

      card.style.transform = `perspective(900px) rotateX(${curRX}deg) rotateY(${curRY}deg) scale3d(1.02, 1.02, 1.02)`
      glow.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(27,79,216,0.22) 0%, transparent 65%)`

      frameRef.current = requestAnimationFrame(animate)
    }

    card.addEventListener('mousemove', onMove)
    card.addEventListener('mouseleave', onLeave)
    frameRef.current = requestAnimationFrame(animate)

    return () => {
      card.removeEventListener('mousemove', onMove)
      card.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(frameRef.current)
    }
  }, [])

  // Scan line animation via CSS
  useEffect(() => {
    const scan = scanRef.current
    if (!scan) return
    let pos = -10
    const move = () => {
      pos = pos > 110 ? -10 : pos + 0.4
      scan.style.top = `${pos}%`
      requestAnimationFrame(move)
    }
    const raf = requestAnimationFrame(move)
    return () => cancelAnimationFrame(raf)
  }, [])

  const TOTAL_SCORE = Math.round(DIMENSIONS.reduce((s, d) => s + d.score, 0) / DIMENSIONS.length)

  return (
    <div
      ref={cardRef}
      style={{
        position:        'relative',
        width:           '100%',
        maxWidth:        380,
        borderRadius:    20,
        padding:         '28px 24px',
        background:      '#0F0F1A',
        border:          '1px solid rgba(255,255,255,0.10)',
        boxShadow:       '0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06) inset',
        willChange:      'transform',
        cursor:          'default',
        overflow:        'hidden',
        userSelect:      'none',
      }}
    >
      {/* Glow overlay */}
      <div ref={glowRef} style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', transition: 'background 0.15s' }} />

      {/* Scan line */}
      <div
        ref={scanRef}
        style={{
          position:   'absolute',
          left:        0,
          right:       0,
          height:      2,
          background:  'linear-gradient(90deg, transparent, rgba(27,79,216,0.5), transparent)',
          pointerEvents: 'none',
          zIndex:       2,
          opacity:      0.7,
        }}
      />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, position: 'relative', zIndex: 3 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
            Signal Report
          </div>
          <div style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
            Arjun M. · B.Tech CSE · ARKA JAIN
          </div>
        </div>
        <div style={{
          display:        'flex',
          alignItems:     'baseline',
          gap:             4,
          padding:        '6px 12px',
          borderRadius:    8,
          background:      'rgba(27,79,216,0.18)',
          border:          '1px solid rgba(27,79,216,0.3)',
        }}>
          <span style={{ fontFamily: 'var(--font-bricolage, sans-serif)', fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{TOTAL_SCORE}</span>
          <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>/100</span>
        </div>
      </div>

      {/* Dimension bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, position: 'relative', zIndex: 3 }}>
        {DIMENSIONS.map(({ key, score }) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>{key}</span>
              <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, color: score < 65 ? '#EF4444' : score < 80 ? '#F59E0B' : '#22C55E' }}>{score}</span>
            </div>
            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
              <div style={{
                height: '100%', borderRadius: 2, width: `${score}%`,
                background: score < 65 ? '#EF4444' : score < 80 ? '#F59E0B' : '#22C55E',
                transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Fixes */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16, position: 'relative', zIndex: 3 }}>
        <div style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
          Top fixes
        </div>
        {FIXES.map(({ priority, text }) => (
          <div key={priority} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
            <span style={{
              fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 9,
              padding: '2px 5px', borderRadius: 3,
              background: priority === 'P1' ? 'rgba(239,68,68,0.18)' : priority === 'P2' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.07)',
              color: priority === 'P1' ? '#EF4444' : priority === 'P2' ? '#F59E0B' : 'rgba(255,255,255,0.35)',
              flexShrink: 0,
            }}>
              {priority}
            </span>
            <span style={{ fontFamily: 'var(--font-geist-sans, sans-serif)', fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Bottom watermark */}
      <div style={{ position: 'absolute', bottom: 14, right: 16, fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 9, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.08em', zIndex: 3 }}>
        FORGEFOLIO · VERIFIED
      </div>
    </div>
  )
}
