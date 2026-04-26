'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input }    from '@/components/ui/input'
import { Textarea } from '@/components/ui/input'
import { Button }   from '@/components/ui/button'
import type { ExtractedData } from '@/store/onboarding'
import { track } from '@/lib/funnel'
import { INPUT_KEY } from './constants'

export default function OnboardingPage() {
  const router = useRouter()

  const [name,  setName]  = useState('')
  const [text,  setText]  = useState('')
  const [phase, setPhase] = useState<'idle' | 'extracting' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  // Re-hydrate on back-navigation
  useEffect(() => {
    try {
      const raw = localStorage.getItem(INPUT_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as { name?: string; text?: string }
      if (saved.name) setName(saved.name)
      if (saved.text) setText(saved.text)
    } catch { /* ignore */ }
  }, [])

  const charCount = text.length
  const isReady   = charCount >= 100 && charCount <= 8000
  const canSubmit = name.trim().length > 0 && isReady

  const helperText =
    charCount === 0     ? undefined
    : charCount > 8000  ? `${charCount.toLocaleString()} chars — trim to your most recent 10 years`
    : isReady           ? `✓ Signal detected — ${charCount.toLocaleString()} chars`
    : `${charCount} / 100 minimum`

  const helperColor =
    charCount > 8000 ? 'text-warning'
    : isReady        ? 'text-success'
    : 'text-text-disabled'

  async function handleSubmit() {
    if (!canSubmit || phase === 'extracting') return
    setError(null)
    setPhase('extracting')
    track('onboarding_input_submit', { char_count: charCount })

    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 30_000)

    try {
      const res = await fetch('/api/upload', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type: 'text', text: text.trim() }),
        signal:  controller.signal,
      })
      clearTimeout(timeoutId)

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: { message?: string } }
        throw new Error(data?.error?.message ?? 'Extraction failed')
      }

      const data = await res.json() as { extracted: ExtractedData }
      const ext  = data.extracted

      track('onboarding_extraction_success', { confidence: ext.confidence, chars: charCount })

      localStorage.setItem(INPUT_KEY, JSON.stringify({
        name:      name.trim(),
        text:      text.trim(),
        extracted: ext,
      }))

      setPhase('done')
      setTimeout(() => router.push('/onboarding/generate'), 500)

    } catch (err) {
      clearTimeout(timeoutId)
      const msg = (err instanceof Error && err.name === 'AbortError')
        ? 'Took too long — please try again.'
        : err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      setPhase('idle')
      track('onboarding_extraction_error', { error: msg })
    }
  }

  function handleScratch() {
    if (!name.trim()) { setError('Add your name first'); return }
    track('onboarding_start_scratch')
    localStorage.setItem(INPUT_KEY, JSON.stringify({
      name:      name.trim(),
      text:      '',
      extracted: {
        name: name.trim(), currentRole: '', companies: [],
        skills: [], yearsExp: null, rawText: '', confidence: 'low',
      },
    }))
    router.push('/onboarding/generate')
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col gap-8 animate-slide-up">

        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold tracking-widest uppercase text-accent">FF</span>
          <span className="font-mono text-[11px] text-text-disabled">·</span>
          <span className="font-mono text-[11px] tracking-wide text-text-secondary">ForgeFolio</span>
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-h1 font-bold text-text-primary tracking-tight">
            Your resume, decoded.
          </h1>
          <p className="text-body text-text-secondary">
            Paste anything — CV, LinkedIn About, career summary.
            We&apos;ll handle the rest.
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          <Input
            label="Your name"
            placeholder="Priya Sharma"
            value={name}
            onChange={e => { setName(e.target.value); setError(null) }}
            autoComplete="name"
            autoFocus
            disabled={phase === 'extracting'}
          />

          <div className="flex flex-col gap-1.5">
            <Textarea
              label="Resume or career summary"
              placeholder={`Paste anything here — your resume, LinkedIn About section, or a rough summary.\n\nNo formatting required. The more detail, the better the result.`}
              value={text}
              onChange={e => { setText(e.target.value); setError(null) }}
              className="min-h-[180px]"
              disabled={phase === 'extracting'}
            />
            {helperText && (
              <p className={`text-micro font-mono ${helperColor} animate-fade-in`} aria-live="polite">
                {helperText}
              </p>
            )}
          </div>
        </div>

        {/* Extraction status */}
        {phase === 'extracting' && (
          <div className="flex items-center gap-3 animate-fade-in" role="status" aria-live="polite">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" aria-hidden="true" />
            <p className="text-small text-text-secondary">Reading your career history…</p>
          </div>
        )}

        {/* Extraction confirmation */}
        {phase === 'done' && (
          <div className="flex items-center gap-2 animate-fade-in" aria-live="polite">
            <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" aria-hidden="true" />
            <p className="text-micro font-mono text-success">Done — heading to your portfolio…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-small text-error animate-fade-in" role="alert">{error}</p>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            loading={phase === 'extracting'}
            disabled={!canSubmit || phase === 'extracting' || phase === 'done'}
          >
            Show me my score →
          </Button>

          {name.trim() && (
            <button
              type="button"
              onClick={handleScratch}
              disabled={phase === 'extracting'}
              className="text-small text-text-disabled text-center hover:text-text-secondary transition-colors animate-fade-in disabled:opacity-40"
            >
              No resume yet? Start from scratch →
            </button>
          )}

          <p className="text-center text-micro font-mono text-text-disabled">
            No account needed · 18k+ engineers scored
          </p>
        </div>

      </div>
    </div>
  )
}
