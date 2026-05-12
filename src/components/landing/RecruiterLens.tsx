'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import ParticleStat from './ParticleStat'

/* ─── Resume mock content ─────────────────────────────────────────────── */
const RESUME_SECTIONS = [
  {
    label: 'headline',
    title: 'Arjun Mehta',
    sub:   'Full Stack Developer · B.Tech CSE · ARKA JAIN University · 2026',
    recruiterNote: 'No signal. Every fresher says this. Next.',
    severity: 'crit' as const,
  },
  {
    label: 'contact',
    title: 'Contact',
    sub:   'arjun.mehta@gmail.com · +91 98765 43210 · Ranchi, Jharkhand',
    recruiterNote: 'No LinkedIn. No GitHub. Instant doubt.',
    severity: 'warn' as const,
  },
  {
    label: 'skills',
    title: 'Skills',
    sub:   'Java, Python, C++, HTML, CSS, JavaScript, MySQL, Git',
    recruiterNote: '2 of 6 keywords matched for SDE-1. Missing: Node.js, React, System Design.',
    severity: 'warn' as const,
  },
  {
    label: 'projects',
    title: 'Projects',
    sub:   'E-Commerce Platform · Task Manager CLI · Weather App · Portfolio Website',
    recruiterNote: 'Shipped 4 projects — all have GitHub links. Strong for a fresher.',
    severity: 'ok' as const,
  },
  {
    label: 'education',
    title: 'Education',
    sub:   'B.Tech CSE · ARKA JAIN University · 7.8 CGPA · 2022–2026',
    recruiterNote: 'Tier-2. Moving on unless projects are exceptional.',
    severity: 'crit' as const,
  },
]

const SEVERITY = {
  crit: { bg: '#FEF2F2', border: '#FECACA', badge: '#EF4444', text: '#B91C1C' },
  warn: { bg: '#FFFBEB', border: '#FDE68A', badge: '#F59E0B', text: '#92400E' },
  ok:   { bg: '#F0FDF4', border: '#BBF7D0', badge: '#22C55E', text: '#15803D' },
}

const SEVERITY_LABEL = { crit: 'Red flag', warn: 'Weak', ok: 'Strong' }

export default function RecruiterLens() {
  const containerRef    = useRef<HTMLDivElement>(null)
  const [split, setSplit]       = useState(50)    // % divider position
  const [dragging, setDragging] = useState(false)
  const [hoverSection, setHoverSection] = useState<string | null>(null)

  /* ─── Drag logic ─── */
  const startDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  useEffect(() => {
    if (!dragging) return

    const move = (e: MouseEvent | TouchEvent) => {
      const container = containerRef.current
      if (!container) return
      const rect    = container.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const pct     = ((clientX - rect.left) / rect.width) * 100
      setSplit(Math.max(20, Math.min(80, pct)))
    }

    const end = () => setDragging(false)

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup',   end)
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend',  end)

    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup',   end)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend',  end)
    }
  }, [dragging])

  const activeSection = hoverSection
    ? RESUME_SECTIONS.find(s => s.label === hoverSection)
    : null

  return (
    <section style={{ width: '100%', maxWidth: 960, margin: '0 auto', paddingInline: 24, paddingBottom: 80 }}>

      {/* Section label */}
      <div style={{ marginBottom: 32 }}>
        <div className="ll-section-label">
          <div className="ll-section-label-line" />
          The 75% problem
        </div>
        <h2 style={{
          fontFamily: 'var(--font-bricolage, sans-serif)',
          fontSize:   'clamp(26px, 4vw, 40px)',
          fontWeight: 800,
          color:      'var(--ll-text)',
          margin:     '10px 0 8px',
          lineHeight: 1.1,
        }}>
          This is what a recruiter<br />sees in your resume.
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ll-text-secondary)', margin: 0 }}>
          Drag the divider. Hover each section to see the annotation.
        </p>
      </div>

      {/* Split container */}
      <div
        ref={containerRef}
        style={{
          position:      'relative',
          height:         440,
          borderRadius:   20,
          overflow:       'hidden',
          border:         '1px solid rgba(0,0,0,0.08)',
          boxShadow:      '0 24px 80px rgba(0,0,0,0.1)',
          cursor:         dragging ? 'col-resize' : 'default',
          userSelect:     'none',
        }}
      >
        {/* LEFT — "What you see" (clean view) */}
        <div
          style={{
            position:       'absolute',
            inset:           0,
            background:     '#fff',
            overflow:       'hidden',
          }}
        >
          {/* Label */}
          <div style={{
            position:    'absolute', top: 16, left: 16, zIndex: 2,
            fontFamily:  'var(--font-geist-mono, monospace)',
            fontSize:    10, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding:     '4px 10px', borderRadius: 6,
            background:  'rgba(0,0,0,0.06)', color: '#0F172A',
          }}>
            You see
          </div>

          <div style={{ padding: '52px 32px 24px', height: '100%', overflowY: 'auto' }}>
            {RESUME_SECTIONS.map(s => (
              <div
                key={s.label}
                data-rl={s.label}
                onMouseEnter={() => setHoverSection(s.label)}
                onMouseLeave={() => setHoverSection(null)}
                style={{
                  marginBottom:  16,
                  padding:       '12px 14px',
                  borderRadius:   10,
                  background:    hoverSection === s.label ? '#F8FAFF' : 'transparent',
                  border:        `1px solid ${hoverSection === s.label ? 'rgba(27,79,216,0.12)' : 'transparent'}`,
                  transition:    'all 0.15s ease',
                  cursor:        'pointer',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — "What recruiter sees" (annotated) */}
        <div
          style={{
            position:   'absolute',
            top:         0,
            right:       0,
            bottom:      0,
            left:        `${split}%`,
            background:  '#FAFAFA',
            overflow:   'hidden',
            borderLeft:  '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <div style={{
            position:    'absolute', top: 16, right: 16, zIndex: 2,
            fontFamily:  'var(--font-geist-mono, monospace)',
            fontSize:    10, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding:     '4px 10px', borderRadius: 6,
            background:  'rgba(239,68,68,0.1)', color: '#B91C1C',
          }}>
            Recruiter sees
          </div>

          <div style={{ padding: '52px 20px 24px', height: '100%', overflowY: 'auto' }}>
            {RESUME_SECTIONS.map(s => {
              const sev = SEVERITY[s.severity]
              const isHover = hoverSection === s.label
              return (
                <div
                  key={s.label}
                  onMouseEnter={() => setHoverSection(s.label)}
                  onMouseLeave={() => setHoverSection(null)}
                  style={{
                    marginBottom: 12,
                    padding:      '10px 12px',
                    borderRadius:  10,
                    background:   isHover ? sev.bg : '#F4F4F5',
                    border:       `1px solid ${isHover ? sev.border : 'transparent'}`,
                    transition:   'all 0.15s ease',
                    cursor:       'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isHover ? 8 : 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: '#334155' }}>{s.title}</div>
                    <span style={{
                      padding:     '2px 7px', borderRadius: 4,
                      background:   sev.badge, color: '#fff',
                      fontSize:     9, fontFamily: 'var(--font-geist-mono)',
                      fontWeight:   700, letterSpacing: '0.05em',
                    }}>
                      {SEVERITY_LABEL[s.severity]}
                    </span>
                  </div>
                  {isHover && (
                    <div style={{
                      fontSize:   11, color: sev.text,
                      fontFamily: 'var(--font-geist-sans)',
                      lineHeight: 1.5,
                      borderTop:  `1px solid ${sev.border}`,
                      paddingTop: 6,
                      marginTop:  2,
                    }}>
                      &ldquo;{s.recruiterNote}&rdquo;
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          style={{
            position:        'absolute',
            top:              0,
            bottom:           0,
            left:             `${split}%`,
            transform:        'translateX(-50%)',
            width:             32,
            cursor:           'col-resize',
            zIndex:            10,
            display:          'flex',
            alignItems:       'center',
            justifyContent:   'center',
          }}
        >
          <div style={{
            width:       3,
            height:      '100%',
            background:  dragging ? '#1B4FD8' : 'rgba(27,79,216,0.4)',
            transition:  'background 0.15s ease',
          }} />
          {/* Pill handle */}
          <div style={{
            position:        'absolute',
            width:            32,
            height:           32,
            borderRadius:    '50%',
            background:       '#1B4FD8',
            display:          'flex',
            alignItems:       'center',
            justifyContent:   'center',
            boxShadow:        '0 4px 16px rgba(27,79,216,0.4)',
            color:            '#fff',
            fontSize:         14,
            fontWeight:       700,
            userSelect:       'none',
          }}>
            ⇔
          </div>
        </div>
      </div>

      {/* Particle stat below */}
      <div style={{ marginTop: 40 }}>
        <div style={{
          display:     'flex',
          alignItems:  'center',
          gap:          12,
          marginBottom: 16,
        }}>
          <span style={{
            fontFamily:  'var(--font-bricolage, sans-serif)',
            fontSize:    52,
            fontWeight:  800,
            color:       '#B45309',
            lineHeight:  1,
          }}>75%</span>
          <span style={{ fontSize: 14, color: 'var(--ll-text-secondary)', maxWidth: 280 }}>
            of resumes never reach a human. Each dot below is one application.
          </span>
        </div>
        <ParticleStat />
      </div>

      {/* CTA */}
      <div style={{ marginTop: 32, display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link
          href="/onboarding"
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            height:          44,
            padding:         '0 24px',
            borderRadius:    10,
            background:      '#1B4FD8',
            color:           '#fff',
            fontSize:        14,
            fontWeight:      600,
            textDecoration:  'none',
            transition:      'opacity 0.15s',
          }}
        >
          Score my resume free →
        </Link>
        <span style={{ fontSize: 12, color: 'var(--ll-text-secondary)', fontFamily: 'var(--font-geist-mono)' }}>
          No account needed · 60 seconds
        </span>
      </div>

    </section>
  )
}
