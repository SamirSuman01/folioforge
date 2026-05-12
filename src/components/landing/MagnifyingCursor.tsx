'use client'

import { useEffect, useRef, useState } from 'react'

const RECRUITER_NOTES: { selector: string; note: string; severity: 'warn' | 'ok' | 'crit' }[] = [
  { selector: '[data-rl="headline"]',  note: 'No quantified impact. Generic.',        severity: 'crit' },
  { selector: '[data-rl="skills"]',    note: 'Matches 2 of 6 required keywords.',     severity: 'warn' },
  { selector: '[data-rl="projects"]',  note: 'Strong — 3 shipped projects with URLs.', severity: 'ok'   },
  { selector: '[data-rl="education"]', note: 'Tier-2 college — moving on.',            severity: 'crit' },
  { selector: '[data-rl="contact"]',   note: 'No LinkedIn / GitHub visible.',          severity: 'warn' },
]

const SEVERITY_COLOR = {
  crit: '#EF4444',
  warn: '#F59E0B',
  ok:   '#22C55E',
}

export default function MagnifyingCursor() {
  const lensRef    = useRef<HTMLDivElement>(null)
  const noteRef    = useRef<HTMLDivElement>(null)
  const posRef     = useRef({ x: -200, y: -200 })
  const rafRef     = useRef<number>(0)
  const [note, setNote] = useState<{ text: string; severity: 'warn' | 'ok' | 'crit' } | null>(null)

  useEffect(() => {
    let targetX = -200, targetY = -200
    let curX = -200, curY = -200

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX
      targetY = e.clientY

      // Check if hovering over a tagged recruiter-lens element
      const el = e.target as HTMLElement
      const tagged = el.closest('[data-rl]') as HTMLElement | null
      if (tagged) {
        const attr = tagged.getAttribute('data-rl')
        const found = RECRUITER_NOTES.find(n => n.selector === `[data-rl="${attr}"]`)
        setNote(found ? { text: found.note, severity: found.severity } : null)
      } else {
        setNote(null)
      }
    }

    const animate = () => {
      curX += (targetX - curX) * 0.14
      curY += (targetY - curY) * 0.14
      posRef.current = { x: curX, y: curY }

      if (lensRef.current) {
        lensRef.current.style.transform = `translate(${curX}px, ${curY}px)`
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <>
      {/* Magnifying glass cursor */}
      <div
        ref={lensRef}
        style={{
          position:        'fixed',
          top:             0,
          left:            0,
          width:           40,
          height:          40,
          marginLeft:      -20,
          marginTop:       -20,
          borderRadius:    '50%',
          border:          '2px solid rgba(27,79,216,0.7)',
          backdropFilter:  'blur(1px)',
          pointerEvents:   'none',
          zIndex:          9999,
          mixBlendMode:    'normal',
          willChange:      'transform',
          transition:      'width 0.2s, height 0.2s',
          background:      'rgba(27,79,216,0.04)',
        }}
      />

      {/* Note tooltip */}
      {note && (
        <div
          ref={noteRef}
          style={{
            position:        'fixed',
            top:             posRef.current.y - 60,
            left:            posRef.current.x + 24,
            padding:         '6px 10px',
            borderRadius:    6,
            fontSize:        11,
            fontFamily:      'var(--font-geist-mono, monospace)',
            fontWeight:      500,
            letterSpacing:   '0.01em',
            color:           '#fff',
            background:      SEVERITY_COLOR[note.severity],
            pointerEvents:   'none',
            zIndex:          10000,
            whiteSpace:      'nowrap',
            boxShadow:       '0 4px 12px rgba(0,0,0,0.3)',
            animation:       'fadeIn 0.15s ease',
          }}
        >
          {note.text}
        </div>
      )}
    </>
  )
}
