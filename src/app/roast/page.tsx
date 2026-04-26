'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { roastPortfolio, type RoastResult } from '@/lib/roast-engine'
import { scorePortfolio, type ScoreBreakdown } from '@/lib/portfolio-score'
import type { Field, PortfolioData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { track } from '@/lib/funnel'

// ─── Sample portfolios ─────────────────────────────────────
const SAMPLES: { label: string; tag: string; tagStyle: string; data: PortfolioData }[] = [
  {
    label:    'Junior dev — vague',
    tag:      'Needs detail',
    tagStyle: 'text-error',
    data: {
      name: 'John Smith', headline: 'Software Developer', about: '',
      role: 'Software Developer', tagline: 'Passionate and driven software developer',
      stats: [],
      experience: [
        { company: 'TechCorp', role: 'Developer', title: 'Developer', period: '', description: '', highlights: ['Worked on various projects', 'Helped with the backend'], bullets: ['Worked on various projects', 'Helped with the backend'] },
        { company: 'StartupXYZ', role: 'Intern', title: 'Intern', period: '2022', description: '', highlights: ['Assisted team with tasks'], bullets: ['Assisted team with tasks'] },
      ],
      projects: [], education: [],
      skills: ['JavaScript', 'Python'],
      contact: { email: '' },
    },
  },
  {
    label:    'Designer — no metrics',
    tag:      'Missing proof',
    tagStyle: 'text-error',
    data: {
      name: 'Sarah Lee', headline: 'UI/UX Designer', about: '',
      role: 'UI/UX Designer', tagline: 'Creative designer who loves making beautiful interfaces',
      stats: [],
      experience: [
        { company: 'DesignStudio', role: 'UI Designer', title: 'UI Designer', period: '2021-2023', description: '', highlights: ['Designed mobile apps', 'Created wireframes', 'Worked with developers'], bullets: ['Designed mobile apps', 'Created wireframes', 'Worked with developers'] },
      ],
      projects: [],
      education: [{ school: 'Art Institute', degree: 'BFA Design', period: '2021', institution: 'Art Institute', year: '2021' }],
      skills: ['Figma', 'Sketch', 'Adobe XD', 'CSS'],
      contact: { email: '' },
    },
  },
  {
    label:    'Marketer — buzzwords',
    tag:      'Overwritten',
    tagStyle: 'text-warning',
    data: {
      name: 'Chris Taylor', headline: 'Digital Marketing Manager', about: '',
      role: 'Digital Marketing Manager', tagline: 'Results-driven marketing professional with a passion for growth',
      stats: [{ label: 'Campaigns', value: '50+' }],
      experience: [
        { company: 'GrowthCo', role: 'Marketing Manager', title: 'Marketing Manager', period: '2020-Present', description: '', highlights: ['Spearheaded innovative digital marketing campaigns across multiple channels', 'Leveraged cutting-edge analytics to optimize funnel performance', 'Synergized cross-functional teams to deliver best-in-class brand experiences'], bullets: ['Spearheaded innovative digital marketing campaigns across multiple channels', 'Leveraged cutting-edge analytics to optimize funnel performance', 'Synergized cross-functional teams to deliver best-in-class brand experiences'] },
      ],
      projects: [],
      education: [{ school: 'State University', degree: 'BA Marketing', period: '2019', institution: 'State University', year: '2019' }],
      skills: ['SEO', 'Google Ads', 'Social Media', 'Content Strategy'],
      contact: { email: '' },
    },
  },
  {
    label:    'Senior engineer — strong',
    tag:      'Well-supported',
    tagStyle: 'text-success',
    data: {
      name: 'Alex Chen', headline: 'Senior Full-Stack Engineer', about: '',
      role: 'Senior Full-Stack Engineer', tagline: 'I turn ambitious product ideas into shipped software that scales — 8 years building for startups and Fortune 500s alike.',
      stats: [{ label: 'Years of Experience', value: '8+' }, { label: 'Products Shipped', value: '23' }, { label: 'Users Impacted', value: '2.4M' }],
      experience: [
        { company: 'Stripe', role: 'Senior Software Engineer', title: 'Senior Software Engineer', period: '2021-Present', description: '', highlights: ['Architected a real-time fraud detection pipeline processing 12M transactions per day, reducing chargebacks by 34% and saving $18M annually', 'Led a cross-functional team of 6 to rebuild merchant onboarding, cutting drop-off from 23% to 9%'], bullets: ['Architected a real-time fraud detection pipeline processing 12M transactions per day, reducing chargebacks by 34% and saving $18M annually', 'Led a cross-functional team of 6 to rebuild merchant onboarding, cutting drop-off from 23% to 9%'] },
      ],
      projects: [],
      education: [{ school: 'University of Waterloo', degree: 'B.S. Computer Science', period: '2017', institution: 'University of Waterloo', year: '2017' }],
      skills: ['TypeScript', 'React', 'Node.js', 'Go', 'PostgreSQL', 'Redis', 'AWS', 'Kubernetes', 'GraphQL'],
      contact: { email: '' },
    },
  },
]

const REVIEW_CHECKS = ['Completeness', 'Impact language', 'Depth of evidence', 'Field relevance', 'Presentation']

function getPreviewBullets(data: PortfolioData) {
  return data.experience.flatMap(e => e.bullets ?? e.highlights ?? []).filter(Boolean).slice(0, 2)
}

// ─── Page ──────────────────────────────────────────────────
export default function RoastPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <RoastInner />
    </Suspense>
  )
}

function RoastInner() {
  const searchParams = useSearchParams()

  const [source,        setSource]        = useState<'sample' | 'own' | 'paste'>('sample')
  const [selectedIdx,   setSelectedIdx]   = useState(0)
  const [ownData,       setOwnData]       = useState<PortfolioData | null>(null)
  const [pasteText,     setPasteText]     = useState('')
  const [showResults,   setShowResults]   = useState(false)
  const [revealedCount, setRevealedCount] = useState(0)
  const [shareCopied,   setShareCopied]   = useState(false)
  const [displayScore,  setDisplayScore]  = useState(0)
  const revealTimers       = useRef<ReturnType<typeof setTimeout>[]>([])
  const shareCopiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const analysisCycleRef   = useRef(0)

  useEffect(() => {
    track('roast_page_view', {})
  }, [])

  useEffect(() => {
    const param = searchParams.get('data')
    if (param) {
      try { setOwnData(JSON.parse(decodeURIComponent(param))); setSource('own') } catch {}
      return
    }
    const stored = sessionStorage.getItem('ff_roast_data')
    if (stored) {
      try { setOwnData(JSON.parse(stored)); setSource('own') } catch {}
    }
  }, [searchParams])

  const pasteData: PortfolioData | null = useMemo(() => {
    if (!pasteText.trim()) return null
    const lines = pasteText.trim().split('\n').map(l => l.trim()).filter(Boolean)

    // Heuristic: first short line = name, second short line = role
    const name     = lines[0]?.length < 50  ? (lines[0]  ?? 'Your Name')    : 'Your Name'
    const roleHint = lines[1]?.length < 80  ? (lines[1]  ?? 'Professional') : 'Professional'

    // Bullets: any line ≥ 10 chars that isn't a section header (ALL CAPS short lines)
    const HEADER_RE = /^[A-Z\s&/]{3,30}:?\s*$/
    const bullets = lines
      .slice(name !== 'Your Name' ? 2 : 0)
      .filter(l => l.length >= 10 && !HEADER_RE.test(l))
      .map(l => l.replace(/^[-*•·]\s*/, '').replace(/^\d+\.\s*/, ''))

    return {
      name, headline: roleHint, about: '', role: roleHint, tagline: '', stats: [],
      experience: [{ company: '', role: roleHint, title: roleHint, period: '', description: '', highlights: bullets, bullets }],
      projects: [], education: [], skills: [], contact: { email: '' },
    }
  }, [pasteText])

  const portfolioData =
    source === 'own'   && ownData   ? ownData   :
    source === 'paste' && pasteData ? pasteData :
    SAMPLES[selectedIdx].data

  const roast: RoastResult    = useMemo(() => roastPortfolio(portfolioData), [portfolioData])
  const score: ScoreBreakdown = useMemo(() => scorePortfolio(portfolioData, 'cs' as Field), [portfolioData])

  // Score count-up — the number should feel earned, not just appear
  useEffect(() => {
    if (!showResults) return
    const target  = score.total
    const cycle   = ++analysisCycleRef.current
    const steps   = 28
    const delay   = 600 / steps
    let   current = 0
    const timer = setInterval(() => {
      if (analysisCycleRef.current !== cycle) { clearInterval(timer); return }
      current = Math.min(current + target / steps, target)
      setDisplayScore(Math.round(current))
      if (current >= target) clearInterval(timer)
    }, delay)
    return () => clearInterval(timer)
  }, [showResults, score.total]) // eslint-disable-line react-hooks/exhaustive-deps

  const expCount   = portfolioData.experience?.length ?? 0
  const skillCount = portfolioData.skills?.length ?? 0
  const statCount  = portfolioData.stats?.length ?? 0

  const toneLabel = { mild: 'Gentle', medium: 'Direct', brutal: 'Sharp' }[roast.savageryLevel]
  const toneStyle = roast.savageryLevel === 'mild' ? 'text-success' : roast.savageryLevel === 'medium' ? 'text-warning' : 'text-error'

  function handleRoast() {
    revealTimers.current.forEach(clearTimeout)
    revealTimers.current = []
    setDisplayScore(0)
    setShowResults(true)
    setRevealedCount(0)
    track('roast_analyze_clicked', { source, issues_count: roast.roasts.length, score: score.total })
    const batch = Math.min(roast.roasts.length, 3)
    setRevealedCount(batch)
    roast.roasts.slice(batch).forEach((_, i) => {
      const id = setTimeout(() => setRevealedCount(batch + i + 1), (i + 1) * 200)
      revealTimers.current.push(id)
    })
    setTimeout(() => track('roast_results_viewed', { score: score.total, grade: score.grade, issues: roast.roasts.length }), 1200)
  }

  function handleShare() {
    track('roast_share_clicked', { score: score.total })
    const text = `My portfolio review:\nTone: ${toneLabel} — Score: ${score.total}/100 (${score.grade})\n${roast.roasts.length} issue${roast.roasts.length === 1 ? '' : 's'} found\n\nRun yours at ${window.location.origin}/roast`
    function copyText() {
      navigator.clipboard.writeText(text).then(() => {
        setShareCopied(true)
        if (shareCopiedTimerRef.current) clearTimeout(shareCopiedTimerRef.current)
        shareCopiedTimerRef.current = setTimeout(() => setShareCopied(false), 2000)
      }).catch(() => {})
    }
    if (navigator.share) {
      navigator.share({ title: 'Portfolio feedback', text }).catch((e: unknown) => {
        if ((e as { name?: string })?.name === 'AbortError') return
        copyText()
      })
      return
    }
    copyText()
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Nav */}
      <nav className="sticky top-0 z-40 h-12 border-b border-border bg-background">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="text-micro font-mono text-text-primary hover:text-accent transition-colors">
            FF · ForgeFolio
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/p/demo" className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors">Demo</Link>
            <Button size="sm" asChild><Link href="/auth/login">Sign in</Link></Button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-12 lg:px-8">

        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors mb-8 block">
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-10 animate-slide-up-1">
          <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-2">Portfolio review</span>
          <h1 className="text-h2 font-bold text-text-primary tracking-tight">One weak line is all a recruiter needs to move on.</h1>
          <p className="text-small text-text-secondary mt-2 max-w-lg">
            See exactly what gets flagged — before you send it. No account needed.
          </p>
        </div>

        {!showResults ? (
          <div className="grid gap-12 lg:grid-cols-[1fr_260px] animate-slide-up-2">

            {/* Setup */}
            <div className="flex flex-col gap-8">

              {/* Source selector */}
              <div>
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-3">Source</span>
                <div className="flex items-center gap-1 border-b border-border">
                  {[
                    { key: 'sample' as const, label: 'Samples' },
                    ...(ownData ? [{ key: 'own' as const, label: 'My portfolio' }] : []),
                    { key: 'paste' as const, label: 'Paste text' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => { setSource(key); track('roast_source_changed', { source: key }) }}
                      className={cn(
                        'pb-2.5 mr-4 text-micro font-mono uppercase tracking-widest transition-colors border-b-2 -mb-px',
                        source === key
                          ? 'border-accent text-text-primary'
                          : 'border-transparent text-text-disabled hover:text-text-secondary'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sample picker */}
              {source === 'sample' && (
                <div className="divide-y divide-border border-t border-border">
                  {SAMPLES.map((s, i) => (
                    <button
                      key={s.label}
                      onClick={() => setSelectedIdx(i)}
                      className={cn(
                        'w-full py-3 text-left grid grid-cols-[1fr_auto] gap-4 items-baseline transition-colors',
                        selectedIdx === i ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
                      )}
                    >
                      <div>
                        <p className="text-small">{s.label}</p>
                        <p className="text-micro text-text-disabled mt-0.5">{s.data.role}</p>
                      </div>
                      <span className={`text-micro font-mono uppercase tracking-widest shrink-0 ${s.tagStyle}`}>
                        {s.tag}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Own portfolio note */}
              {source === 'own' && ownData && (
                <div className="border-l-2 border-accent pl-3 py-1">
                  <p className="text-small text-text-primary">Loaded from your current draft</p>
                  <p className="text-micro text-text-disabled mt-0.5">Pulled from session — check before further edits.</p>
                </div>
              )}

              {/* Paste input */}
              {source === 'paste' && (
                <div className="flex flex-col gap-1.5">
                  <textarea
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    placeholder={"Paste your resume, LinkedIn About, or a few career highlights.\n\nNo formatting required — just paste and go."}
                    className="w-full h-44 px-3 py-2.5 bg-background border border-border text-small text-text-primary resize-none focus:border-accent focus:outline-none transition-colors placeholder:text-text-disabled"
                  />
                  {pasteText.length > 0 && (
                    <p className="text-micro font-mono text-text-disabled">{pasteText.length} characters</p>
                  )}
                </div>
              )}

              {/* Preview */}
              <div className="border-t border-border pt-6">
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">Preview</span>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-small text-text-primary">{portfolioData.name || 'Name'}</p>
                    <p className="text-micro text-text-disabled">{portfolioData.role || portfolioData.headline || 'Role'}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {[
                      `${expCount} role${expCount !== 1 ? 's' : ''}`,
                      `${skillCount} skill${skillCount !== 1 ? 's' : ''}`,
                      `${statCount} stat${statCount !== 1 ? 's' : ''}`,
                    ].map(label => (
                      <span key={label} className="text-micro font-mono text-text-disabled border border-border px-2 py-0.5">{label}</span>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {getPreviewBullets(portfolioData).map(b => (
                    <p key={b} className="text-small text-text-secondary border-l border-border pl-3 py-0.5">{b}</p>
                  ))}
                  {getPreviewBullets(portfolioData).length === 0 && (
                    <p className="text-small text-text-disabled">No bullets found — review will focus on completeness.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-micro text-text-disabled">No account needed. Results appear instantly.</p>
                <Button onClick={handleRoast} disabled={source === 'paste' && !pasteData}>
                  Get my score →
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-8">

              {/* How it works */}
              <div>
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">How it works</span>
                <div className="divide-y divide-border border-t border-border">
                  {[
                    { title: 'Choose a draft', body: 'Use a sample, your portfolio, or paste a few lines.' },
                    { title: 'Get your score',  body: 'See exactly where your signal is strong and where it\'s leaking.' },
                    { title: 'Fix what\'s weak', body: 'Rewrite flagged lines before any recruiter sees them.' },
                  ].map((s, i) => (
                    <div key={s.title} className="py-3.5">
                      <p className="text-micro font-mono text-text-disabled mb-0.5">0{i + 1}</p>
                      <p className="text-small text-text-primary">{s.title}</p>
                      <p className="text-micro text-text-disabled mt-0.5">{s.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* What it checks */}
              <div>
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">Checks</span>
                <div className="divide-y divide-border border-t border-border">
                  {REVIEW_CHECKS.map(c => (
                    <div key={c} className="py-2.5 flex items-center gap-2.5">
                      <span className="text-micro font-mono text-success">✓</span>
                      <span className="text-small text-text-secondary">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        ) : (
          <div className="grid gap-12 lg:grid-cols-[1fr_260px] animate-slide-up-1">

            {/* Results */}
            <div className="flex flex-col gap-10">

              {/* Score banner */}
              <div className="border-b border-border pb-8">
                {/* Score first — it's the diagnosis */}
                <div className="flex items-end justify-between gap-4 mb-5">
                  <div className="flex items-baseline gap-3">
                    <span className="text-[4.5rem] font-bold font-mono text-text-primary tabular-nums leading-none">{displayScore}</span>
                    <div className="flex flex-col gap-0.5 pb-1">
                      <span className="text-small font-mono text-text-disabled">/100</span>
                      <span className="text-small font-mono text-text-disabled">Grade {score.grade}</span>
                    </div>
                  </div>
                  <span className="text-micro font-mono text-text-disabled pb-1">
                    {roast.roasts.length} issue{roast.roasts.length !== 1 ? 's' : ''} flagged
                  </span>
                </div>

                {/* Verdict below the score */}
                <p className="text-body text-text-secondary leading-relaxed max-w-xl">
                  {roast.overallRoast}
                </p>
              </div>

              {/* Issue list */}
              {roast.roasts.length > 0 ? (
                <div>
                  <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">What to fix</span>
                  <div className="divide-y divide-border border-t border-border">
                    {roast.roasts.map((entry, i) => (
                      <div
                        key={`${entry.line}-${i}`}
                        className={cn(
                          'py-4 transition-all duration-300',
                          i < revealedCount ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                        )}
                      >
                        {/* Before — the flagged line */}
                        <div className="flex items-start gap-2.5 mb-3">
                          <span className="text-micro font-mono text-error mt-0.5 shrink-0">✕</span>
                          <p className="text-small text-text-disabled leading-relaxed line-through decoration-error/40">
                            {entry.line}
                          </p>
                        </div>
                        {/* After — the fix */}
                        <div className="flex items-start gap-2.5">
                          <span className="text-micro font-mono text-accent mt-0.5 shrink-0">→</span>
                          <p className="text-small text-text-secondary leading-relaxed">{entry.tip}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-10">
                  <span className="text-micro font-mono text-success uppercase tracking-widest block mb-2">Strong signal</span>
                  <p className="text-small text-text-secondary max-w-sm">
                    Structure and evidence are solid. Keep it sharp — one weak line is all a recruiter needs to move on.
                  </p>
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="flex flex-col gap-8">

              {/* Score breakdown */}
              <div>
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">Score breakdown</span>
                <div className="divide-y divide-border border-t border-border">
                  {[
                    { label: 'Completeness',   value: score.completeness,   max: 25 },
                    { label: 'Impact language', value: score.impactLanguage, max: 25 },
                    { label: 'Depth',           value: score.depth,          max: 20 },
                    { label: 'Field relevance', value: score.fieldRelevance, max: 15 },
                    { label: 'Presentation',    value: score.presentation,   max: 15 },
                  ].map(item => (
                    <div key={item.label} className="py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-small text-text-secondary">{item.label}</span>
                        <span className="text-micro font-mono text-text-disabled tabular-nums">{item.value}/{item.max}</span>
                      </div>
                      <div className="h-px w-full bg-border relative">
                        <div
                          className="absolute top-[-0.5px] left-0 h-[2px] bg-accent/50 transition-[width] duration-700"
                          style={{ width: `${(item.value / item.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button className="w-full" asChild>
                  <Link href="/onboarding" onClick={() => track('roast_cta_clicked', { score: score.total })}>
                    Build a portfolio that passes this →
                  </Link>
                </Button>
                <p className="text-micro font-mono text-text-disabled text-center">Free · No account needed · 2 minutes</p>
                <div className="flex items-center justify-center gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => { revealTimers.current.forEach(clearTimeout); revealTimers.current = []; setShowResults(false); setRevealedCount(0) }}
                    className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors"
                  >
                    Try another →
                  </button>
                  <span className="text-text-disabled text-micro">·</span>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors"
                  >
                    {shareCopied ? 'Copied!' : 'Share →'}
                  </button>
                </div>
              </div>

              {/* Tip */}
              <div className="border-l-2 border-border pl-3">
                <p className="text-small text-text-secondary leading-relaxed">
                  Keep the good parts. Rewrite weak lines to be specific, plain, and believable.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
