'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'

interface DockItem {
  label:   string
  href:    string
  icon:    React.ReactNode
  active?: boolean
}

const ITEMS: DockItem[] = [
  {
    label: 'Home',
    href:  '/',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    label: 'Score',
    href:  '/onboarding',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    label: 'Portfolio',
    href:  '/p/demo',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6M9 13h4"/>
      </svg>
    ),
  },
  {
    label: 'Dashboard',
    href:  '/dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    label: 'Pro',
    href:  '#pricing',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
]

export default function BottomDock() {
  const containerRef  = useRef<HTMLDivElement>(null)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [visible, setVisible]   = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1200)
    return () => clearTimeout(timer)
  }, [])

  function getScale(i: number) {
    if (hoverIdx === null) return 1
    const dist = Math.abs(i - hoverIdx)
    if (dist === 0) return 1.55
    if (dist === 1) return 1.25
    if (dist === 2) return 1.08
    return 1
  }

  function getTranslate(i: number) {
    if (hoverIdx === null) return 0
    const dist = Math.abs(i - hoverIdx)
    if (dist === 0) return -10
    if (dist === 1) return -5
    return 0
  }

  return (
    <div
      style={{
        position:      'fixed',
        bottom:         24,
        left:           '50%',
        transform:      'translateX(-50%)',
        zIndex:         9990,
        opacity:        visible ? 1 : 0,
        transition:     'opacity 0.5s ease',
        pointerEvents:  visible ? 'auto' : 'none',
      }}
    >
      <div
        ref={containerRef}
        style={{
          display:         'flex',
          alignItems:      'flex-end',
          gap:              6,
          padding:          '10px 16px',
          borderRadius:     20,
          background:       'rgba(255,255,255,0.88)',
          backdropFilter:   'blur(24px) saturate(1.6)',
          border:           '1px solid rgba(0,0,0,0.1)',
          boxShadow:        '0 16px 48px rgba(0,0,0,0.16), 0 0 0 1px rgba(255,255,255,0.9) inset',
        }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {ITEMS.map((item, i) => {
          const scale     = getScale(i)
          const translateY = getTranslate(i)

          return (
            <Link
              key={item.label}
              href={item.href}
              title={item.label}
              onMouseEnter={() => setHoverIdx(i)}
              style={{
                display:          'flex',
                flexDirection:    'column',
                alignItems:       'center',
                gap:               4,
                textDecoration:   'none',
                transition:       'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform:        `scale(${scale}) translateY(${translateY}px)`,
                transformOrigin:  'bottom center',
              }}
            >
              <div
                style={{
                  width:           46,
                  height:          46,
                  borderRadius:    13,
                  background:      i === 4 ? '#1B4FD8' : '#F1F5F9',
                  color:           i === 4 ? '#fff' : '#334155',
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  boxShadow:       hoverIdx === i ? '0 8px 20px rgba(0,0,0,0.14)' : '0 2px 6px rgba(0,0,0,0.07)',
                  transition:      'box-shadow 0.15s ease, background 0.15s ease',
                }}
              >
                {item.icon}
              </div>
              {hoverIdx === i && (
                <div style={{
                  position:      'absolute',
                  bottom:         '100%',
                  marginBottom:   6,
                  padding:        '4px 8px',
                  borderRadius:   6,
                  background:     '#0F172A',
                  color:          '#fff',
                  fontSize:       10,
                  fontFamily:     'var(--font-geist-mono, monospace)',
                  whiteSpace:     'nowrap',
                  pointerEvents:  'none',
                  animation:      'fadeIn 0.1s ease',
                }}>
                  {item.label}
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
