'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'

interface Props {
  name:  string
  role:  string
  score: number
  grade: string
  slug:  string
}

// ─── Score color by grade ─────────────────────────────────
function scoreColor(grade: string): string {
  if (grade === 'A+' || grade === 'A') return '#34d399'   // emerald
  if (grade === 'B+' || grade === 'B') return '#60a5fa'   // blue
  if (grade === 'C+' || grade === 'C') return '#fbbf24'   // amber
  return '#f87171'                                         // red
}

function scoreVerdict(score: number): string {
  if (score >= 88) return 'Recruiter-ready signal'
  if (score >= 70) return 'Strong signal detected'
  if (score >= 50) return 'Signal needs tuning'
  return 'Weak signal'
}

export default function BadgeClient({ name, role, score, grade, slug }: Props) {
  const [copied, setCopied]    = useState(false)
  const copiedTimerRef         = useRef<ReturnType<typeof setTimeout> | null>(null)

  const badgeUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/badge/${slug}`
    : `/badge/${slug}`

  function handleCopy() {
    navigator.clipboard.writeText(badgeUrl).then(() => {
      setCopied(true)
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  const accent = scoreColor(grade)

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: '#0B1120' }}
    >
      {/* Badge card */}
      <div
        className="w-full max-w-sm relative overflow-hidden"
        style={{
          background:   '#111827',
          border:       '1px solid rgba(255,255,255,.07)',
          borderRadius: '16px',
          padding:      '40px 36px 32px',
          boxShadow:    '0 24px 64px rgba(0,0,0,.6), 0 4px 16px rgba(0,0,0,.4)',
        }}
      >
        {/* Ambient glow — color matches grade */}
        <div
          aria-hidden
          style={{
            position:   'absolute',
            top:        '-60px',
            right:      '-60px',
            width:      '200px',
            height:     '200px',
            background: `radial-gradient(circle, ${accent}28 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Verified mark */}
        <div className="flex items-center gap-2 mb-8">
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ background: accent }}
          />
          <span
            className="font-mono uppercase tracking-widest"
            style={{ fontSize: '10px', color: 'rgba(255,255,255,.3)' }}
          >
            ForgeFolio Verified
          </span>
        </div>

        {/* Score — dominant element */}
        <div className="mb-2">
          <span
            className="font-bold tabular-nums leading-none block"
            style={{
              fontSize:    'clamp(5rem, 22vw, 7rem)',
              color:       accent,
              letterSpacing: '-3px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {score}
          </span>
        </div>

        {/* Grade + out-of */}
        <div className="flex items-baseline gap-3 mb-6">
          <span
            className="font-mono font-semibold"
            style={{ fontSize: '18px', color: 'rgba(255,255,255,.7)' }}
          >
            {grade}
          </span>
          <span
            className="font-mono"
            style={{ fontSize: '11px', color: 'rgba(255,255,255,.25)', letterSpacing: '.06em' }}
          >
            / 100
          </span>
          <span
            className="font-mono"
            style={{ fontSize: '11px', color: 'rgba(255,255,255,.25)', letterSpacing: '.06em' }}
          >
            Signal Score
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,.06)', marginBottom: '20px' }} />

        {/* Name + role */}
        <div className="mb-1">
          <p
            className="font-semibold"
            style={{ fontSize: '15px', color: '#fff', letterSpacing: '-.01em' }}
          >
            {name}
          </p>
          {role && (
            <p
              className="font-mono mt-0.5"
              style={{ fontSize: '11px', color: 'rgba(255,255,255,.35)', letterSpacing: '.04em' }}
            >
              {role}
            </p>
          )}
        </div>

        {/* Verdict */}
        <p
          className="font-mono mt-3"
          style={{ fontSize: '10px', color: 'rgba(255,255,255,.2)', letterSpacing: '.08em', textTransform: 'uppercase' }}
        >
          {scoreVerdict(score)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 mt-6">
        <Link
          href={`/p/${slug}`}
          className="font-mono transition-colors"
          style={{ fontSize: '12px', color: 'rgba(255,255,255,.4)', letterSpacing: '.06em' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,.7)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.4)')}
        >
          View portfolio →
        </Link>

        <span style={{ color: 'rgba(255,255,255,.15)', fontSize: '12px' }}>·</span>

        <button
          onClick={handleCopy}
          className="font-mono transition-colors"
          style={{ fontSize: '12px', color: copied ? '#34d399' : 'rgba(255,255,255,.4)', letterSpacing: '.06em' }}
          onMouseEnter={e => { if (!copied) e.currentTarget.style.color = 'rgba(255,255,255,.7)' }}
          onMouseLeave={e => { if (!copied) e.currentTarget.style.color = 'rgba(255,255,255,.4)' }}
        >
          {copied ? 'Copied ✓' : 'Copy link'}
        </button>
      </div>

      {/* Powered by */}
      <p
        className="font-mono mt-8"
        style={{ fontSize: '9px', color: 'rgba(255,255,255,.12)', letterSpacing: '.14em', textTransform: 'uppercase' }}
      >
        forgefolio.in
      </p>
    </div>
  )
}
