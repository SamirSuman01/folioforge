'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button }      from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress'
import { ScoreBar }    from '@/components/ui/progress'
import type { ExtractedData, GeneratedSection } from '@/store/onboarding'
import { track } from '@/lib/funnel'
import { INPUT_KEY } from '../constants'

const STAGES = [
  { label: 'Analysing your experience',    weight: 0.15 },
  { label: 'Identifying key achievements',  weight: 0.15 },
  { label: 'Writing your headline',         weight: 0.10 },
  { label: 'Building experience bullets',   weight: 0.25 },
  { label: 'Crafting your skills profile',  weight: 0.15 },
  { label: 'Finalising your portfolio',     weight: 0.20 },
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

type Phase = 'generating' | 'done' | 'error'

export default function GeneratePage() {
  const router = useRouter()

  const [phase,      setPhase]      = useState<Phase>('generating')
  const [stageIndex, setStageIndex] = useState(0)
  const [progress,   setProgress]   = useState(0)
  const [score,      setScore]      = useState(0)
  const [sections,   setSections]   = useState<GeneratedSection[]>([])
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null)
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
    } catch { /* ignore — generate with empty data */ }

    // Stage progression while real request runs
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

      setSections(finalSections)
      setScore(finalScore)
      setProgress(100)
      setStageIndex(STAGES.length - 1)

      // Write full ff_onboarding payload for /onboarding/save
      const field = extracted ? inferField(extracted) : 'other'
      localStorage.setItem('ff_onboarding', JSON.stringify({
        name,
        role:          extracted?.currentRole ?? '',
        field,
        sections:      finalSections,
        score:         finalScore,
        extractedData: extracted,
      }))

      setTimeout(() => {
        setPhase('done')
        track('onboarding_generation_success', { score: finalScore, sections: finalSections.length })
      }, 400)

    } catch (err) {
      clearTimeout(timeoutId)
      timers.forEach(clearTimeout)
      const msg = (err instanceof Error && err.name === 'AbortError')
        ? 'Generation timed out. Please try again — it usually works the second time.'
        : err instanceof Error ? err.message : 'Something went wrong'
      setErrorMsg(msg)
      setPhase('error')
      track('onboarding_generation_error', { error: msg })
    }
  }

  // ── Generating ────────────────────────────────────────
  if (phase === 'generating') {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md flex flex-col items-center gap-10 animate-fade-in text-center">
          <div className="flex flex-col gap-2">
            <h1 className="text-h1 font-bold text-text-primary">Building your portfolio…</h1>
            <p className="text-body text-text-secondary">
              10–15 seconds — then you&apos;ll see your score.
            </p>
          </div>

          <div className="w-full flex flex-col gap-2">
            {STAGES.map((stage, i) => (
              <div key={stage.label} className="flex items-center gap-3 text-left">
                <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                  {i < stageIndex ? (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
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
            <ProgressBar value={progress} size="thick" ariaLabel="Portfolio generation progress" />
          </div>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md flex flex-col items-center gap-6 text-center animate-slide-up">
          <div className="h-14 w-14 rounded-full bg-error/10 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="#991B1B" strokeWidth="1.5"/>
              <path d="M12 8v5M12 16h.01" stroke="#991B1B" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h2 className="text-h2 font-bold text-text-primary mb-1">Something went wrong</h2>
            <p className="text-body text-text-secondary">
              {errorMsg ?? 'Generation timed out. Please try again — it usually works the second time.'}
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <Button variant="ghost" size="lg" onClick={() => router.push('/onboarding')}>
              ← Back
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={() => { hasFired.current = false; generate() }}
            >
              Try again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Done ──────────────────────────────────────────────
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col gap-8 animate-slide-up">

        {/* Score */}
        <div className="rounded-md border border-border bg-surface p-5">
          <p className="text-micro font-mono text-text-disabled uppercase tracking-widest mb-3">
            Your signal score
          </p>
          <ScoreBar score={score} />
          <p className="text-small text-text-secondary mt-2">
            {score >= 80
              ? 'Strong start — a few quick improvements will push it past 90.'
              : 'Good start — add metrics and a bio to push past 80.'}
          </p>
        </div>

        {/* Sections built */}
        <div className="flex flex-col gap-3">
          <p className="text-small font-medium text-text-primary">
            {sections.length} sections built for you
          </p>
          {sections.map(s => (
            <div
              key={s.type}
              className="flex items-center gap-3 rounded border border-border bg-surface px-4 py-3"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="6" fill="#2D6A4F" fillOpacity="0.15"/>
                <path d="M4 7l2 2 4-4" stroke="#2D6A4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-small text-text-primary">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Signup gate */}
        <div className="rounded-md border-2 border-accent bg-accent-subtle p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-h3 font-bold text-text-primary">It&apos;s yours — save it.</h2>
            <p className="text-small text-text-secondary mt-1">Free forever. No credit card required.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                track('onboarding_signup_click', { score, sections_count: sections.length })
                router.push('/auth/signup?redirect=/onboarding/save&from=onboarding')
              }}
            >
              Save my portfolio →
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => router.push('/auth/login?redirect=/onboarding/save&from=onboarding')}
            >
              I already have an account
            </Button>
          </div>
        </div>

        <p className="text-small text-text-disabled text-center">
          This disappears if you leave without saving.
        </p>
      </div>
    </div>
  )
}
