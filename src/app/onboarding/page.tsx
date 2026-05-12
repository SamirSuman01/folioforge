'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Textarea } from '@/components/ui/input'
import { Button }   from '@/components/ui/button'
import type { ExtractedData } from '@/store/onboarding'
import { track } from '@/lib/funnel'
import { INPUT_KEY } from './constants'

export default function OnboardingPage() {
  const router = useRouter()

  const [text,  setText]  = useState('')
  const [phase, setPhase] = useState<'idle' | 'extracting' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(INPUT_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as { text?: string }
      if (saved.text) setText(saved.text)
    } catch { /* ignore */ }
  }, [])

  const charCount = text.length
  const isReady   = charCount >= 100 && charCount <= 8000
  const canSubmit = isReady

  const helperText =
    charCount === 0    ? undefined
    : charCount > 8000 ? `Too long — trim to your most recent 10 years`
    : isReady          ? `✓ Ready`
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

      localStorage.setItem(INPUT_KEY, JSON.stringify({
        name:      ext.name ?? '',
        text:      text.trim(),
        extracted: ext,
      }))

      setPhase('done')
      setTimeout(() => router.push('/onboarding/generate'), 300)

    } catch (err) {
      clearTimeout(timeoutId)
      const msg = (err instanceof Error && err.name === 'AbortError')
        ? 'Took too long — please try again.'
        : err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      setPhase('idle')
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg flex flex-col gap-8 animate-slide-up">

        {/* Headline */}
        <div className="flex flex-col gap-2">
          <h1 className="text-h1 font-bold text-text-primary tracking-tight">
            Paste your resume.
          </h1>
          <p className="text-body text-text-secondary">
            We&apos;ll score it in 60 seconds. No account needed.
          </p>
        </div>

        {/* Textarea */}
        <div className="flex flex-col gap-1.5">
          <Textarea
            label=""
            placeholder={`Paste anything — your resume, LinkedIn About, or a rough career summary.\n\nNo formatting needed. The more detail, the better your score.`}
            value={text}
            onChange={e => { setText(e.target.value); setError(null) }}
            className="min-h-[220px]"
            disabled={phase === 'extracting'}
          />
          {helperText && (
            <p className={`text-micro font-mono ${helperColor}`} aria-live="polite">
              {helperText}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-small text-error" role="alert">{error}</p>
        )}

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            loading={phase === 'extracting'}
            disabled={!canSubmit || phase === 'extracting' || phase === 'done'}
          >
            {phase === 'extracting' ? 'Reading your resume…' : 'Score my resume →'}
          </Button>

          <p className="text-center text-micro font-mono text-text-disabled">
            Free · No account needed · 18k+ engineers scored
          </p>
        </div>

      </div>
    </div>
  )
}
