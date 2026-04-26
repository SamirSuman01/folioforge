'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { GeneratedSection, ExtractedData } from '@/store/onboarding'
import type { PortfolioData } from '@/lib/types'

/* ─────────────────────────────────────────────────────────
   /onboarding/save

   Landing page after signup from onboarding.
   Reads ff_onboarding from sessionStorage, converts
   sections → PortfolioData, POSTs to /api/portfolio,
   then redirects to /editor/[id].

   Shows a simple loading spinner — user never sees this
   for more than ~1 second.
   ───────────────────────────────────────────────────────── */

const TEMPLATE_BY_FIELD: Record<string, string> = {
  'software-engineering': 'system-dark',
  'product-design':       'split-editorial',
  'product-management':   'clean-light',
  'business-finance':     'broadsheet',
  'marketing':            'warm-editorial',
  'data-analytics':       'system-dark',
  'healthcare':           'clean-light',
  'education':            'warm-editorial',
  'creative':             'split-editorial',
  'other':                'clean-light',
}

const FIELD_MAP: Record<string, string> = {
  'software-engineering': 'cs',
  'product-design':       'design',
  'product-management':   'business',
  'business-finance':     'business',
  'marketing':            'marketing',
  'data-analytics':       'cs',
  'other':                'other',
}

type ExperienceEntry = { company: string; role: string; period: string; bullets: string[] }

function sectionsToPortfolioData(
  name: string,
  role: string,
  sections: GeneratedSection[],
  extracted: ExtractedData | null
): PortfolioData {
  const hero      = sections.find(s => s.type === 'hero')?.data as Record<string, string> | undefined
  const narrative = sections.find(s => s.type === 'narrative')?.data as { text?: string } | undefined
  const skillsSection = sections.find(s => s.type === 'list')?.data as { items?: string[] } | undefined
  const expSection = sections.find(s => s.type === 'experience')?.data as { entries?: ExperienceEntry[] } | undefined

  const experience = expSection?.entries?.length
    ? expSection.entries.map(e => ({
        company:     e.company ?? '',
        role:        e.role    ?? '',
        title:       e.role    ?? '',
        period:      e.period  ?? '',
        description: '',
        highlights:  e.bullets ?? [],
        bullets:     e.bullets ?? [],
      }))
    : (extracted?.companies ?? []).map(company => ({
        company,
        role:        '',
        title:       '',
        period:      '',
        description: '',
        highlights:  [],
        bullets:     [],
      }))

  return {
    name:     hero?.name     ?? name ?? '',
    role:     hero?.role     ?? role ?? '',
    headline: hero?.role     ?? role ?? '',
    tagline:  hero?.tagline  ?? '',
    about:    narrative?.text ?? '',
    skills:   skillsSection?.items ?? extracted?.skills ?? [],
    stats:    [],
    projects: [],
    experience,
    education: [],
    contact: { email: '' },
  }
}

export default function OnboardingSavePage() {
  const router = useRouter()
  const [saveError, setSaveError] = useState<string | null>(null)

  const save = useCallback(async () => {
    setSaveError(null)

    const raw = localStorage.getItem('ff_onboarding')

    if (!raw) {
      router.push('/dashboard')
      return
    }

    let parsed: {
      name:          string
      role:          string
      field:         string | null
      sections:      GeneratedSection[]
      score:         number
      extractedData: ExtractedData | null
    }

    try {
      parsed = JSON.parse(raw)
    } catch {
      router.push('/dashboard')
      return
    }

    const { name, role, field, sections, score, extractedData } = parsed
    const portfolioData = sectionsToPortfolioData(name, role, sections ?? [], extractedData ?? null)
    const template      = TEMPLATE_BY_FIELD[field ?? ''] ?? 'clean-light'
    const legacyField   = FIELD_MAP[field ?? ''] ?? 'other'

    try {
      const [profileRes, portfolioRes] = await Promise.all([
        fetch('/api/profile', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: name }),
        }),
        fetch('/api/portfolio', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portfolioData, template, field: legacyField, score }),
        }),
      ])

      if (!portfolioRes.ok) {
        const body = await portfolioRes.json().catch(() => ({}))
        throw new Error((body as { error?: string })?.error ?? 'Save failed — please try again.')
      }

      if (!profileRes.ok) console.warn('Profile creation failed — username may not be set')

      const portfolio = await portfolioRes.json()
      localStorage.removeItem('ff_onboarding')
      router.push(`/editor/${portfolio.id}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setSaveError(msg)
    }
  }, [router])

  useEffect(() => { save() }, [save])

  if (saveError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm w-full">
          <div className="h-12 w-12 rounded-full bg-error/10 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="9" stroke="#991B1B" strokeWidth="1.5"/>
              <path d="M11 7v5M11 15h.01" stroke="#991B1B" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-body font-medium text-text-primary mb-1">Couldn&apos;t save your portfolio</p>
            <p className="text-small text-text-secondary">{saveError}</p>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={save}
              className="w-full bg-accent text-white text-body font-medium px-4 py-3 rounded hover:bg-accent/90 transition-colors"
            >
              Try again
            </button>
            <Link
              href="/dashboard"
              className="text-small text-text-disabled hover:text-text-secondary transition-colors"
            >
              Go to dashboard without saving
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <p className="text-small text-text-secondary">Saving your portfolio…</p>
      </div>
    </div>
  )
}
