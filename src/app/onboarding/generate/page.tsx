'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { ProgressBar } from '@/components/ui/progress'
import { scorePortfolio } from '@/lib/portfolio-score'
import type { SubItem, ScoreTip } from '@/lib/portfolio-score'
import type { PortfolioData } from '@/lib/types'
import type { ExtractedData, GeneratedSection } from '@/store/onboarding'
import { track } from '@/lib/funnel'
import { INPUT_KEY } from '../constants'

// Parse bullet lines from raw resume text (fallback when AI sections have no bullets)
function extractBulletsFromRawText(rawText: string): { company: string; bullets: string[] }[] {
  if (!rawText) return []
  const lines = rawText.split('\n')
  const result: { company: string; bullets: string[] }[] = []
  let currentCompany = ''
  let currentBullets: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Detect company header lines (ALL CAPS, or lines with company-like patterns)
    const isHeader = /^[A-Z][A-Z\s&,.|]+$/.test(trimmed) && trimmed.length > 3 && trimmed.length < 60
      || /\b(Inc|Ltd|Corp|LLC|Technologies|Solutions|Services|Systems|Group|Company|Co\.)/.test(trimmed)

    if (isHeader && trimmed.length < 80) {
      if (currentCompany && currentBullets.length > 0) {
        result.push({ company: currentCompany, bullets: currentBullets })
      }
      currentCompany = trimmed.replace(/\s*[|•·–-].*/, '').trim()
      currentBullets = []
      continue
    }

    // Bullet lines: start with •, -, *, or are medium-length action sentences
    const isBullet = /^[•\-\*►▸▹●◦]\s/.test(trimmed)
    const content = isBullet ? trimmed.replace(/^[•\-\*►▸▹●◦]\s*/, '').trim() : trimmed

    if (content.length >= 25 && content.length <= 350) {
      const firstWord = content.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '')
      const ACTION = ['led','built','shipped','designed','launched','grew','reduced','increased','created',
        'developed','managed','implemented','architected','optimized','scaled','automated','delivered',
        'improved','established','drove','executed','mentored','analyzed','built','deployed','integrated',
        'maintained','migrated','refactored','tested','wrote','worked','responsible','collaborated']
      if (isBullet || ACTION.includes(firstWord)) {
        currentBullets.push(content)
      }
    }
  }

  if (currentCompany && currentBullets.length > 0) {
    result.push({ company: currentCompany, bullets: currentBullets })
  }

  // If no company headers found but we have bullets, group under "Experience"
  if (result.length === 0) {
    const allBullets: string[] = []
    for (const line of lines) {
      const trimmed = line.trim()
      const isBullet = /^[•\-\*►▸▹●◦]\s/.test(trimmed)
      if (isBullet) {
        const content = trimmed.replace(/^[•\-\*►▸▹●◦]\s*/, '').trim()
        if (content.length >= 25 && content.length <= 350) allBullets.push(content)
      }
    }
    if (allBullets.length > 0) result.push({ company: '', bullets: allBullets.slice(0, 15) })
  }

  return result
}

function sectionsToPortfolioData(sections: GeneratedSection[], extracted: ExtractedData | null): PortfolioData {
  const hero    = sections.find(s => s.type === 'hero')?.data    as Record<string, string> | undefined
  const about   = sections.find(s => s.type === 'narrative')?.data as { text?: string } | undefined
  const skills  = sections.find(s => s.type === 'list')?.data    as { items?: string[] } | undefined
  // AI may use 'entries', 'items', or 'experiences' as the array key
  const expSection = sections.find(s => s.type === 'experience')?.data as Record<string, unknown> | undefined
  const rawEntries = ((expSection?.entries ?? expSection?.items ?? expSection?.experiences ?? []) as {
    company?: string; role?: string; title?: string; period?: string;
    bullets?: string[]; highlights?: string[];
  }[]).filter(e => e.company)

  // Build experience array from AI sections
  const aiExperience = rawEntries.map(e => ({
    company:     e.company ?? '',
    role:        e.role ?? e.title ?? '',
    title:       e.role ?? e.title ?? '',
    period:      e.period ?? '',
    description: '',
    highlights:  (e.bullets ?? e.highlights ?? []).filter((b): b is string => typeof b === 'string' && b.length > 5),
    bullets:     (e.bullets ?? e.highlights ?? []).filter((b): b is string => typeof b === 'string' && b.length > 5),
  }))

  // If AI sections have no bullets, fall back to parsing raw text
  const aiHasBullets = aiExperience.some(e => e.bullets.length > 0)
  const experience = aiHasBullets
    ? aiExperience
    : (() => {
        const rawBullets = extractBulletsFromRawText(extracted?.rawText ?? '')
        if (rawBullets.length > 0) return rawBullets.map(rb => ({
          company: rb.company, role: '', title: '', period: '',
          description: '', highlights: rb.bullets, bullets: rb.bullets,
        }))
        // Last resort: put all AI experience entries as-is even with no bullets
        return aiExperience
      })()

  return {
    name:       hero?.name     ?? extracted?.name ?? '',
    role:       hero?.role     ?? extracted?.currentRole ?? '',
    headline:   hero?.role     ?? '',
    tagline:    hero?.tagline  ?? '',
    about:      about?.text    ?? '',
    skills:     skills?.items  ?? extracted?.skills ?? [],
    stats:      [],
    projects:   [],
    experience,
    education:  [],
    contact:    { email: '' },
  }
}

const STAGES = [
  { label: 'Reading your experience',       weight: 0.15 },
  { label: 'Identifying key achievements',  weight: 0.15 },
  { label: 'Writing your headline',         weight: 0.10 },
  { label: 'Building experience bullets',   weight: 0.25 },
  { label: 'Crafting your skills profile',  weight: 0.15 },
  { label: 'Finalising your score',         weight: 0.20 },
]

function inferField(ext: ExtractedData): string {
  const t = ((ext.currentRole ?? '') + ' ' + (ext.skills ?? []).join(' ')).toLowerCase()
  if (/design|ux\b|ui\b|figma|sketch/.test(t))        return 'product-design'
  if (/product manager|\bpm\b|\bapm\b/.test(t))        return 'product-management'
  if (/\bdata\b|analytics|machine learn|mlops/.test(t)) return 'data-analytics'
  if (/marketing|growth|seo|brand|content/.test(t))    return 'marketing'
  if (/financ|banking|accounti|invest/.test(t))        return 'business-finance'
  return 'software-engineering'
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

const DIMENSIONS = [
  { key: 'completeness',   label: 'Completeness',    max: 25 },
  { key: 'impactLanguage', label: 'Impact Language', max: 25 },
  { key: 'depth',          label: 'Depth',           max: 20 },
  { key: 'fieldRelevance', label: 'Relevance',       max: 15 },
  { key: 'presentation',   label: 'Presentation',    max: 15 },
]

type Phase = 'generating' | 'done' | 'error'

export default function GeneratePage() {
  const router   = useRouter()
  const supabase = createClient()

  const [phase,      setPhase]      = useState<Phase>('generating')
  const [stageIndex, setStageIndex] = useState(0)
  const [progress,   setProgress]   = useState(0)
  const [score,      setScore]      = useState(0)
  const [sections,   setSections]   = useState<GeneratedSection[]>([])
  const [breakdown,  setBreakdown]  = useState<Record<string, number>>({})
  const [details,    setDetails]    = useState<Record<string, SubItem[]>>({})
  const [tips,       setTips]       = useState<ScoreTip[]>([])
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [ringScore,  setRingScore]  = useState(0)
  const [openDim,    setOpenDim]    = useState<string | null>(null)
  const hasFired = useRef(false)

  useEffect(() => {
    if (hasFired.current) return
    hasFired.current = true
    generate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function generate() {
    setPhase('generating')
    setErrorMsg(null)

    let name = ''
    let extracted: ExtractedData | null = null

    try {
      const raw = localStorage.getItem(INPUT_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as { name?: string; extracted?: ExtractedData }
        name      = saved.name ?? ''
        extracted = saved.extracted ?? null
      }
    } catch { /* ignore */ }

    let accumulated = 0
    const timers: ReturnType<typeof setTimeout>[] = []
    STAGES.forEach((stage, i) => {
      const delay = accumulated * 1000
      accumulated += stage.weight * 12
      timers.push(setTimeout(() => {
        setStageIndex(i)
        setProgress(Math.round(STAGES.slice(0, i + 1).reduce((s, st) => s + st.weight, 0) * 100))
      }, delay))
    })

    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 30_000)

    try {
      const res = await fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extractedData: extracted ?? {
            name, currentRole: '', companies: [], skills: [],
            yearsExp: null, rawText: '', confidence: 'low',
          },
          field: extracted ? inferField(extracted) : 'other',
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      timers.forEach(clearTimeout)

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: { message?: string } }
        throw new Error(data?.error?.message ?? 'Generation failed')
      }

      const data          = await res.json() as { sections?: GeneratedSection[]; score?: number }
      const finalSections = data.sections ?? []
      const finalScore    = data.score    ?? 72

      // Compute real breakdown client-side
      const portfolioData = sectionsToPortfolioData(finalSections, extracted)
      const fieldKey = (extracted ? inferField(extracted) : 'other').replace('software-engineering','cs').replace('product-design','design').replace('business-finance','business').replace('data-analytics','cs').replace('product-management','business').replace('marketing','marketing') as 'cs' | 'design' | 'business' | 'marketing' | 'other'
      const scored = scorePortfolio(portfolioData, ['cs','design','business','marketing','other'].includes(fieldKey) ? fieldKey : 'other')

      setSections(finalSections)
      setScore(scored.total)
      setBreakdown({
        completeness:   scored.completeness,
        impactLanguage: scored.impactLanguage,
        depth:          scored.depth,
        fieldRelevance: scored.fieldRelevance,
        presentation:   scored.presentation,
      })
      setDetails(scored.details as Record<string, SubItem[]>)
      setTips(scored.tips.slice(0, 3))
      setProgress(100)
      setStageIndex(STAGES.length - 1)

      const field = extracted ? inferField(extracted) : 'other'
      localStorage.setItem('ff_onboarding', JSON.stringify({
        name,
        role:          extracted?.currentRole ?? '',
        field,
        sections:      finalSections,
        score:         scored.total,
        extractedData: extracted,
      }))

      setTimeout(() => {
        setPhase('done')
        track('onboarding_generation_success', { score: finalScore })
        // Animate ring from 0 to final score after the SVG mounts
        setTimeout(() => setRingScore(scored.total), 80)
      }, 400)

    } catch (err) {
      clearTimeout(timeoutId)
      timers.forEach(clearTimeout)
      const msg = (err instanceof Error && err.name === 'AbortError')
        ? 'Took too long — please try again.'
        : err instanceof Error ? err.message : 'Something went wrong'
      setErrorMsg(msg)
      setPhase('error')
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    track('onboarding_google_signup', { score })
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding/save` },
    })
    if (error) {
      setGoogleLoading(false)
    }
  }

  // ── Generating ──────────────────────────────────────────
  if (phase === 'generating') {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md flex flex-col items-center gap-10 animate-fade-in text-center">
          <div className="flex flex-col gap-2">
            <h1 className="text-h1 font-bold text-text-primary">Scoring your resume…</h1>
            <p className="text-body text-text-secondary">Usually 10–15 seconds.</p>
          </div>

          <div className="w-full flex flex-col gap-2">
            {STAGES.map((stage, i) => (
              <div key={stage.label} className="flex items-center gap-3 text-left">
                <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                  {i < stageIndex ? (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="9" r="8" fill="#2D6A4F" fillOpacity="0.15"/>
                      <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="#2D6A4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : i === stageIndex ? (
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-border" />
                  )}
                </div>
                <span className={
                  i < stageIndex   ? 'text-small text-text-secondary line-through' :
                  i === stageIndex ? 'text-small text-text-primary font-medium' :
                                     'text-small text-text-disabled'
                }>
                  {stage.label}
                </span>
              </div>
            ))}
          </div>

          <div className="w-full">
            <ProgressBar value={progress} size="thick" ariaLabel="Scoring progress" />
          </div>
        </div>
      </div>
    )
  }

  // ── Error ───────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md flex flex-col items-center gap-6 text-center animate-slide-up">
          <h2 className="text-h2 font-bold text-text-primary">Something went wrong</h2>
          <p className="text-body text-text-secondary">
            {errorMsg ?? 'Generation timed out. Please try again.'}
          </p>
          <div className="flex gap-3 w-full">
            <button onClick={() => router.push('/onboarding')} className="flex-1 h-11 rounded border border-border text-small text-text-secondary hover:bg-border/30 transition-colors">
              ← Back
            </button>
            <button
              onClick={() => { hasFired.current = false; generate() }}
              className="flex-1 h-11 rounded bg-accent text-white text-small font-medium hover:bg-accent/90 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Done ────────────────────────────────────────────────
  const MILESTONES = [
    { grade: 'D',  pts: 0  },
    { grade: 'C',  pts: 50 },
    { grade: 'C+', pts: 60 },
    { grade: 'B',  pts: 70 },
    { grade: 'B+', pts: 80 },
    { grade: 'A',  pts: 88 },
    { grade: 'A+', pts: 95 },
  ]

  const grade     = scoreGrade(score)
  const isGood    = score >= 80
  const isMid     = score >= 60 && score < 80
  const accentHex = isGood ? '#166534' : isMid ? '#92400E' : '#991B1B'
  const subtleHex = isGood ? '#F0FDF4' : isMid ? '#FFFBEB' : '#FEF2F2'
  const borderHex = isGood ? '#bbf7d0' : isMid ? '#fde68a' : '#fecaca'

  const nextMile  = MILESTONES.find(m => m.pts > score)
  const ptsToNext = nextMile ? nextMile.pts - score : 0
  const totalGain = tips.reduce((s, t) => s + t.impact, 0)

  // SVG ring — ringScore starts at 0 and is set to score 80ms after mount
  const R = 52, CX = 60, CY = 60
  const circ       = 2 * Math.PI * R
  const ringOffset = circ * (1 - ringScore / 100)

  const DIM_LABELS: Record<string, string> = {
    completeness:   'Profile completeness',
    impactLanguage: 'Impact language',
    depth:          'Content depth',
    fieldRelevance: 'Field relevance',
    presentation:   'Presentation',
  }

  return (
    <div className="w-full min-h-screen bg-background flex justify-center px-5 py-12">
      <div className="w-full max-w-[520px] flex flex-col gap-10 animate-slide-up">

        {/* ── Back nav ── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/onboarding')}
            className="flex items-center gap-1.5 text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Edit resume
          </button>
          <button
            onClick={() => { hasFired.current = false; setRingScore(0); generate() }}
            className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors"
          >
            Re-score ↺
          </button>
        </div>

        {/* ── 1. Score hero ── */}
        <div className="flex flex-col items-center gap-5 text-center">
          {/* Ring */}
          <div
            className="rounded-full p-1"
            style={{ background: subtleHex, border: `2px solid ${borderHex}` }}
          >
            <svg width="140" height="140" viewBox="0 0 120 120">
              <circle cx={CX} cy={CY} r={R} fill="none" stroke={borderHex} strokeWidth="6" />
              <circle
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke={accentHex}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={ringOffset}
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)' }}
              />
              <text
                x={CX} y={CY - 5}
                textAnchor="middle"
                fill={accentHex}
                fontSize="26" fontWeight="800"
                fontFamily="var(--font-geist-mono, monospace)"
              >{score}</text>
              <text
                x={CX} y={CY + 12}
                textAnchor="middle"
                fill="#94A3B8"
                fontSize="10"
                fontFamily="var(--font-geist-mono, monospace)"
              >/ 100</text>
            </svg>
          </div>

          {/* Grade + next target */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-center gap-2">
              <span
                className="font-black tabular-nums leading-none"
                style={{ fontSize: 56, color: accentHex, fontFamily: 'var(--font-bricolage, sans-serif)' }}
              >
                {grade}
              </span>
            </div>
            <p className="text-body text-text-secondary">
              {nextMile
                ? <><span className="font-semibold text-text-primary">{ptsToNext} pts</span> to reach {nextMile.grade}{totalGain > 0 ? <span className="text-text-disabled"> · fixes below can add +{totalGain}</span> : null}</>
                : <span className="font-semibold" style={{ color: accentHex }}>Top grade — you&apos;re standing out.</span>}
            </p>
          </div>

          {/* Milestone track */}
          <div className="flex items-end gap-3">
            {MILESTONES.map((m, mi) => {
              const passed  = score >= m.pts
              const current = mi === Math.max(0, MILESTONES.findIndex(x => x.pts > score) - 1)
                || (score >= 95 && mi === MILESTONES.length - 1)
              return (
                <div key={m.grade} className="flex flex-col items-center gap-1">
                  <div
                    className="rounded-full transition-all duration-300"
                    style={{
                      width:         current ? 10 : 6,
                      height:        current ? 10 : 6,
                      background:    passed ? accentHex : borderHex,
                      outline:       current ? `3px solid ${accentHex}30` : 'none',
                      outlineOffset: 2,
                    }}
                  />
                  <span
                    className="text-[9px] font-mono font-medium"
                    style={{ color: current ? accentHex : passed ? accentHex + 'aa' : '#CBD5E1' }}
                  >{m.grade}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 2. Breakdown ── */}
        <div className="flex flex-col gap-3">
          <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Breakdown</span>
          <div className="flex flex-col gap-0 border border-border rounded-xl overflow-hidden bg-white">
            {DIMENSIONS.map(({ key, max }, di) => {
              const val      = breakdown[key] ?? 0
              const pct      = Math.round((val / max) * 100)
              const col      = pct >= 80 ? '#166534' : pct >= 55 ? '#92400E' : '#991B1B'
              const lbl      = DIM_LABELS[key] ?? key
              const subItems = details[key] ?? []
              const isOpen   = openDim === key
              const last     = di === DIMENSIONS.length - 1
              const hasDetail = subItems.length > 0
              return (
                <div
                  key={key}
                  className={!last ? 'border-b border-border' : ''}
                >
                  {/* Header row — clickable */}
                  <button
                    onClick={() => hasDetail && setOpenDim(isOpen ? null : key)}
                    className={`w-full px-5 py-4 text-left ${hasDetail ? 'cursor-pointer hover:bg-background/60' : 'cursor-default'} transition-colors`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-small font-medium text-text-primary">{lbl}</span>
                        {hasDetail && (
                          <svg
                            width="12" height="12" viewBox="0 0 12 12" fill="none"
                            className="transition-transform duration-200"
                            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: '#94A3B8' }}
                          >
                            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span className="text-small font-mono tabular-nums" style={{ color: col }}>
                        {val}<span className="text-text-disabled text-micro">/{max}</span>
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-border">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: col, transition: 'width 1.1s cubic-bezier(0.16,1,0.3,1)' }}
                      />
                    </div>
                  </button>

                  {/* Expanded sub-items */}
                  {isOpen && subItems.length > 0 && (
                    <div className="px-5 pb-4 flex flex-col gap-0 border-t border-border">
                      {subItems.map((item, si) => {
                        const itemPct  = item.max > 0 ? Math.round((item.earned / item.max) * 100) : 0
                        const itemCol  = itemPct >= 80 ? '#166534' : itemPct >= 50 ? '#92400E' : '#991B1B'
                        const passing  = item.earned >= item.max
                        return (
                          <div
                            key={si}
                            className={`py-3 flex flex-col gap-1.5 ${si < subItems.length - 1 ? 'border-b border-border' : ''}`}
                          >
                            {/* Item label + score */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                {/* Pass/fail dot */}
                                <span
                                  className="shrink-0 w-1.5 h-1.5 rounded-full"
                                  style={{ background: passing ? '#166534' : item.earned > 0 ? '#92400E' : '#991B1B' }}
                                />
                                <span className="text-small text-text-primary truncate">{item.label}</span>
                              </div>
                              <span
                                className="shrink-0 text-micro font-mono tabular-nums"
                                style={{ color: itemCol }}
                              >
                                {item.earned}/{item.max}
                              </span>
                            </div>
                            {/* Hint — only when not full marks */}
                            {item.hint && item.earned < item.max && (
                              <p
                                className="text-small text-text-secondary leading-relaxed pl-3.5"
                              >
                                {item.hint}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 3. Fixes ── */}
        {tips.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">
                Top fixes
              </span>
              <span className="text-micro font-mono text-text-disabled">+{totalGain} pts available</span>
            </div>

            <div className="flex flex-col gap-3">
              {tips.slice(0, 3).map((tip, i) => (
                <div key={i} className="flex gap-4 p-5 bg-white border border-border rounded-xl">
                  {/* Index */}
                  <span
                    className="shrink-0 text-micro font-mono font-bold tabular-nums mt-0.5"
                    style={{ color: borderHex, fontSize: 13 }}
                  >
                    0{i + 1}
                  </span>

                  {/* Body */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    {/* Category + pts */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-small font-semibold text-text-primary">{tip.category}</span>
                      <span
                        className="text-micro font-mono font-bold px-1.5 py-0.5 rounded-md"
                        style={{ background: subtleHex, color: accentHex, border: `1px solid ${borderHex}` }}
                      >
                        +{tip.impact} pts
                      </span>
                    </div>
                    {/* Problem */}
                    <p className="text-small text-text-secondary leading-relaxed">{tip.message}</p>
                    {/* Fix */}
                    {tip.fix && (
                      <p
                        className="text-small text-text-secondary leading-relaxed pl-3"
                        style={{ borderLeft: `2px solid ${borderHex}` }}
                      >
                        {tip.fix}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 4. CTA ── */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full h-12 rounded-xl flex items-center justify-center gap-3 text-small font-semibold transition-opacity disabled:opacity-50"
            style={{ background: accentHex, color: '#fff' }}
          >
            {googleLoading ? (
              'Opening Google…'
            ) : (
              <>
                <GoogleIcon />
                Save report &amp; build your portfolio
              </>
            )}
          </button>
          <p className="text-center text-micro text-text-disabled">
            Free · No card needed ·{' '}
            <button
              onClick={() => router.push('/auth/login?redirect=/onboarding/save&from=onboarding')}
              className="text-accent hover:underline"
            >
              sign in instead →
            </button>
          </p>
        </div>

      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
