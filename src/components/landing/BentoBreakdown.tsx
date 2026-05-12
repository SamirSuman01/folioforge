'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

interface CompanyData {
  name: string
  color: string
  role: string
  salary: string
  skills: string[]
  alumni: string
  jds: number
}

const COMPANIES: CompanyData[] = [
  {
    name:    'Razorpay',
    color:   '#0D6EFD',
    role:    'SDE-1',
    salary:  '₹18–26 LPA',
    skills:  ['Node.js', 'PostgreSQL', 'System Design', 'Go', 'Redis'],
    alumni:  '3 alumni · 1 warm path',
    jds:     12,
  },
  {
    name:    'Zepto',
    color:   '#8B5CF6',
    role:    'SDE-1',
    salary:  '₹16–22 LPA',
    skills:  ['React', 'TypeScript', 'GraphQL', 'MongoDB'],
    alumni:  '1 alumni · 2 hops away',
    jds:     8,
  },
  {
    name:    'PhonePe',
    color:   '#7C3AED',
    role:    'Backend Engineer',
    salary:  '₹20–30 LPA',
    skills:  ['Java', 'Spring Boot', 'Kafka', 'MySQL', 'AWS'],
    alumni:  '2 alumni · direct path',
    jds:     19,
  },
  {
    name:    'CRED',
    color:   '#1E1B4B',
    role:    'SDE-1',
    salary:  '₹22–32 LPA',
    skills:  ['Kotlin', 'Android', 'MVVM', 'Retrofit'],
    alumni:  'No alumni · cold apply',
    jds:     5,
  },
  {
    name:    'Swiggy',
    color:   '#EA580C',
    role:    'SDE-1',
    salary:  '₹18–25 LPA',
    skills:  ['Python', 'Django', 'Redis', 'Kubernetes'],
    alumni:  '1 alumni · 1 hop',
    jds:     14,
  },
  {
    name:    'Google',
    color:   '#1A73E8',
    role:    'L3 SWE',
    salary:  '₹35–55 LPA',
    skills:  ['Algorithms', 'System Design', 'C++', 'Distributed Systems'],
    alumni:  '0 alumni · prep required',
    jds:     22,
  },
]

export default function BentoBreakdown() {
  const [active, setActive] = useState<CompanyData | null>(null)
  const detailRef = useRef<HTMLDivElement>(null)

  function select(c: CompanyData) {
    setActive(prev => prev?.name === c.name ? null : c)
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
  }

  return (
    <section
      className="ll-bento-section"
      style={{
        padding:   '80px 0',
        maxWidth:  900,
        margin:    '0 auto',
        width:     '100%',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 40, paddingInline: 24 }}>
        <div className="ll-section-label" style={{ marginBottom: 12 }}>
          <div className="ll-section-label-line" />
          Target Intelligence
        </div>
        <h2 style={{
          fontFamily: 'var(--font-bricolage, sans-serif)',
          fontSize:   'clamp(26px, 4vw, 38px)',
          fontWeight: 800,
          color:      'var(--ll-text)',
          margin:     0,
          lineHeight: 1.1,
        }}>
          Click a company.<br />See your path in.
        </h2>
        <p style={{ marginTop: 12, fontSize: 14, color: 'var(--ll-text-secondary)', maxWidth: 480 }}>
          ForgeFolio maps required skills, real salary data, and alumni warm paths for every company you target.
        </p>
      </div>

      {/* Bento grid */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap:                 12,
        paddingInline:       24,
      }}>
        {COMPANIES.map((c) => {
          const isActive = active?.name === c.name
          return (
            <button
              key={c.name}
              onClick={() => select(c)}
              style={{
                display:         'flex',
                flexDirection:   'column',
                alignItems:      'flex-start',
                padding:         '18px 20px',
                borderRadius:    14,
                border:          `1.5px solid ${isActive ? c.color : 'rgba(0,0,0,0.07)'}`,
                background:      isActive ? `${c.color}08` : 'rgba(255,255,255,0.6)',
                cursor:          'pointer',
                textAlign:       'left',
                transition:      'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                transform:       isActive ? 'scale(1.02)' : 'scale(1)',
                boxShadow:       isActive ? `0 8px 32px ${c.color}22` : '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{
                width:        36,
                height:       36,
                borderRadius: 10,
                background:   c.color,
                marginBottom: 12,
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                fontSize:     12,
                fontWeight:   800,
                color:        '#fff',
                fontFamily:   'var(--font-geist-mono, monospace)',
              }}>
                {c.name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 2 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'var(--font-geist-mono, monospace)' }}>{c.role}</div>
              <div style={{
                marginTop:    8,
                fontSize:     10,
                fontFamily:   'var(--font-geist-mono, monospace)',
                fontWeight:   600,
                color:        c.color,
                background:   `${c.color}12`,
                padding:      '2px 7px',
                borderRadius: 4,
              }}>
                {c.salary}
              </div>
            </button>
          )
        })}
      </div>

      {/* Detail panel */}
      {active && (
        <div
          ref={detailRef}
          style={{
            margin:        '20px 24px 0',
            padding:       '24px',
            borderRadius:  16,
            background:    '#fff',
            border:        `1.5px solid ${active.color}30`,
            boxShadow:     `0 16px 48px ${active.color}14`,
            animation:     'slideDown 0.25s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>

            {/* Skills */}
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 10 }}>
                Required skills · {active.jds} JDs analysed
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {active.skills.map(s => (
                  <span key={s} style={{
                    padding:      '4px 9px',
                    borderRadius:  6,
                    background:   '#F1F5F9',
                    fontSize:     11,
                    fontFamily:   'var(--font-geist-mono)',
                    color:        '#334155',
                    fontWeight:   500,
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Salary */}
            <div style={{ minWidth: 140 }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 10 }}>
                Salary range
              </div>
              <div style={{ fontFamily: 'var(--font-bricolage)', fontSize: 24, fontWeight: 800, color: '#0F172A' }}>
                {active.salary}
              </div>
              <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'var(--font-geist-mono)', marginTop: 4 }}>
                Verified against live JDs
              </div>
            </div>

            {/* Warm path */}
            <div style={{ minWidth: 160 }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 10 }}>
                Network path
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                {active.alumni}
              </div>
              <Link
                href="/onboarding"
                style={{
                  display:       'inline-block',
                  marginTop:     10,
                  padding:       '7px 14px',
                  borderRadius:   8,
                  background:    active.color,
                  color:         '#fff',
                  fontSize:      11,
                  fontWeight:    600,
                  textDecoration: 'none',
                  fontFamily:    'var(--font-geist-sans)',
                }}
              >
                See full path →
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
