'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import TemplateRenderer from '@/components/templates/TemplateRenderer'
import { scorePortfolio } from '@/lib/portfolio-score'
import { cn } from '@/lib/utils'
import type { Field, PortfolioData, Template } from '@/lib/types'

// Local template list using correct Template values
const TEMPLATES: { id: Template; name: string }[] = [
  { id: 'system-dark',      name: 'Dark'       },
  { id: 'clean-light',      name: 'Light'      },
  { id: 'split-editorial',  name: 'Split'      },
  { id: 'broadsheet',       name: 'Broadsheet' },
  { id: 'warm-editorial',   name: 'Warm'       },
]

// ─── Persona data ─────────────────────────────────────────
const PERSONAS: { label: string; field: Field; defaultTemplate: Template; data: PortfolioData }[] = [
  {
    label: 'Engineer',
    field: 'cs',
    defaultTemplate: 'system-dark',
    data: {
      name: 'Alex Chen',
      headline: 'Senior Full-Stack Engineer',
      about: 'I turn ambitious product ideas into shipped software that scales — 8 years building for startups and Fortune 500s alike.',
      role: 'Senior Full-Stack Engineer',
      tagline: 'I turn ambitious product ideas into shipped software that scales — 8 years building for startups and Fortune 500s alike.',
      stats: [
        { label: 'Years of Experience', value: '8+' },
        { label: 'Products Shipped', value: '23' },
        { label: 'Users Impacted', value: '2.4M' },
      ],
      projects: [
        { title: 'Fraud Detection Pipeline', description: 'Real-time fraud detection processing 12M transactions/day', tech: ['Go', 'Kafka', 'Redis'], link: '' },
        { title: 'Merchant Onboarding', description: 'Rebuilt onboarding flow cutting drop-off from 23% to 9%', tech: ['React', 'TypeScript', 'Node.js'], link: '' },
      ],
      experience: [
        {
          company: 'Stripe', role: 'Senior Software Engineer', period: '2021 – Present',
          description: 'Building payment infrastructure at scale.',
          highlights: [
            'Architected a real-time fraud detection pipeline processing 12M transactions/day, reducing chargebacks by 34% ($18M annual savings)',
            'Led a cross-functional team of 6 to rebuild the merchant onboarding flow, cutting drop-off rate from 23% to 9%',
            'Designed and shipped Stripe Tax auto-calculation API used by 40K+ businesses across 30 countries',
          ],
          title: 'Senior Software Engineer',
          bullets: [
            'Architected a real-time fraud detection pipeline processing 12M transactions/day, reducing chargebacks by 34% ($18M annual savings)',
            'Led a cross-functional team of 6 to rebuild the merchant onboarding flow, cutting drop-off rate from 23% to 9%',
            'Designed and shipped Stripe Tax auto-calculation API used by 40K+ businesses across 30 countries',
          ],
        },
        {
          company: 'Figma', role: 'Software Engineer', period: '2019 – 2021',
          description: 'Built real-time collaboration features.',
          highlights: [
            'Built the real-time multiplayer cursor system handling 500K+ concurrent sessions with sub-50ms latency',
            'Optimized canvas rendering engine, improving frame rate by 40% on complex files with 10K+ layers',
            'Created the plugin API sandbox architecture that enabled 5,000+ community plugins',
          ],
          title: 'Software Engineer',
          bullets: [
            'Built the real-time multiplayer cursor system handling 500K+ concurrent sessions with sub-50ms latency',
            'Optimized canvas rendering engine, improving frame rate by 40% on complex files with 10K+ layers',
            'Created the plugin API sandbox architecture that enabled 5,000+ community plugins',
          ],
        },
        {
          company: 'Shopify', role: 'Junior Developer', period: '2017 – 2019',
          description: 'Worked on inventory and checkout systems.',
          highlights: [
            'Developed inventory sync system processing 2M SKU updates daily across 800K+ stores',
            'Reduced checkout page load time by 1.8s through lazy-loading and edge caching optimizations',
          ],
          title: 'Junior Developer',
          bullets: [
            'Developed inventory sync system processing 2M SKU updates daily across 800K+ stores',
            'Reduced checkout page load time by 1.8s through lazy-loading and edge caching optimizations',
          ],
        },
      ],
      education: [{ school: 'University of Waterloo', degree: 'B.S. Computer Science, Honours Co-op', period: '2017', institution: 'University of Waterloo', year: '2017' }],
      skills: ['TypeScript', 'React', 'Node.js', 'Go', 'PostgreSQL', 'Redis', 'AWS', 'Kubernetes', 'GraphQL', 'System Design'],
      contact: { email: 'alex@example.com', github: 'github.com/alexchen', linkedin: 'linkedin.com/in/alexchen' },
    },
  },
  {
    label: 'Designer',
    field: 'design',
    defaultTemplate: 'split-editorial',
    data: {
      name: 'Maya Rodriguez',
      headline: 'Senior Product Designer',
      about: 'Designing interfaces that feel inevitable — 6 years crafting products used by millions across fintech, health, and e-commerce.',
      role: 'Senior Product Designer',
      tagline: 'Designing interfaces that feel inevitable — 6 years crafting products used by millions across fintech, health, and e-commerce.',
      stats: [
        { label: 'Products Designed', value: '15+' },
        { label: 'Design Systems Built', value: '4' },
        { label: 'User Satisfaction', value: '94%' },
      ],
      projects: [
        { title: 'Square Merchant Dashboard', description: 'Redesigned dashboard serving 2M+ businesses, +28% daily active usage', tech: ['Figma', 'React', 'Design Systems'], link: '' },
        { title: 'Headspace Sleep', description: 'Sleep experience used by 800K+ users nightly, driving 15% subscription growth', tech: ['Prototyping', 'Motion Design'], link: '' },
      ],
      experience: [
        {
          company: 'Square', role: 'Senior Product Designer', period: '2022 – Present',
          description: 'Leading design for merchant-facing products.',
          highlights: [
            'Redesigned the merchant dashboard serving 2M+ businesses, increasing daily active usage by 28%',
            'Built and maintained a design system with 200+ components used across 8 product teams',
            'Led user research program interviewing 120+ merchants, directly shaping 3 major product pivots',
          ],
          title: 'Senior Product Designer',
          bullets: [
            'Redesigned the merchant dashboard serving 2M+ businesses, increasing daily active usage by 28%',
            'Built and maintained a design system with 200+ components used across 8 product teams',
            'Led user research program interviewing 120+ merchants, directly shaping 3 major product pivots',
          ],
        },
        {
          company: 'Headspace', role: 'Product Designer', period: '2020 – 2022',
          description: 'Designed wellness and mindfulness experiences.',
          highlights: [
            'Designed the onboarding flow that increased 7-day retention from 34% to 52% for new users',
            'Created the sleep experience feature used by 800K+ users nightly, driving 15% subscription growth',
          ],
          title: 'Product Designer',
          bullets: [
            'Designed the onboarding flow that increased 7-day retention from 34% to 52% for new users',
            'Created the sleep experience feature used by 800K+ users nightly, driving 15% subscription growth',
          ],
        },
      ],
      education: [{ school: 'RISD', degree: 'BFA Graphic Design', period: '2018', institution: 'RISD', year: '2018' }],
      skills: ['Figma', 'Prototyping', 'Design Systems', 'User Research', 'UI/UX', 'Motion Design', 'Accessibility', 'Typography'],
      contact: { email: 'maya@example.com', website: 'mayarodriguez.design', linkedin: 'linkedin.com/in/mayarodriguez' },
    },
  },
  {
    label: 'Builder',
    field: 'cs',
    defaultTemplate: 'warm-editorial',
    data: {
      name: 'Rohan Mehta',
      headline: 'Software Engineer — Payments & Fintech',
      about: 'Built transaction systems at Razorpay and CRED that process crores daily — 4 years turning complex money problems into reliable infrastructure.',
      role: 'Software Engineer — Payments & Fintech',
      tagline: 'Built transaction systems at Razorpay and CRED that process crores daily — 4 years turning complex money problems into reliable infrastructure.',
      stats: [
        { label: 'Transactions / Day', value: '40Cr+' },
        { label: 'Systems Shipped', value: '12' },
        { label: 'Uptime SLA', value: '99.98%' },
      ],
      projects: [
        { title: 'UPI Reconciliation Engine', description: 'Rebuilt failed-transaction reconciliation reducing dispute resolution from 3 days to 4 hours', tech: ['Java', 'Kafka', 'PostgreSQL'], link: '' },
        { title: 'CRED Rewards Ledger', description: 'Designed the double-entry ledger for 7M+ active reward accounts with zero inconsistency', tech: ['Go', 'Redis', 'gRPC'], link: '' },
      ],
      experience: [
        {
          company: 'CRED', role: 'Software Engineer', period: '2022 – Present',
          description: 'Building financial infrastructure for premium credit card users.',
          highlights: [
            'Designed the rewards ledger system handling 7M+ active accounts with zero balance inconsistency across 3 years',
            'Reduced P99 API latency on the bill payment flow from 1.8s to 220ms through query optimization and Redis caching',
            'Led migration of 3 legacy microservices to gRPC, cutting inter-service communication overhead by 60%',
          ],
          title: 'Software Engineer',
          bullets: [
            'Designed the rewards ledger system handling 7M+ active accounts with zero balance inconsistency across 3 years',
            'Reduced P99 API latency on the bill payment flow from 1.8s to 220ms through query optimization and Redis caching',
            'Led migration of 3 legacy microservices to gRPC, cutting inter-service communication overhead by 60%',
          ],
        },
        {
          company: 'Razorpay', role: 'Junior Engineer', period: '2020 – 2022',
          description: 'Worked on core payment processing and reconciliation.',
          highlights: [
            'Built the UPI failed-transaction reconciliation engine, reducing average dispute resolution from 72 hours to 4 hours',
            'Implemented idempotency keys across 8 payment APIs, eliminating 2,000+ duplicate charge incidents per month',
          ],
          title: 'Junior Engineer',
          bullets: [
            'Built the UPI failed-transaction reconciliation engine, reducing average dispute resolution from 72 hours to 4 hours',
            'Implemented idempotency keys across 8 payment APIs, eliminating 2,000+ duplicate charge incidents per month',
          ],
        },
      ],
      education: [{ school: 'VIT Vellore', degree: 'B.Tech Computer Science', period: '2020', institution: 'VIT Vellore', year: '2020' }],
      skills: ['Java', 'Go', 'PostgreSQL', 'Kafka', 'Redis', 'gRPC', 'System Design', 'AWS', 'Docker', 'Kubernetes'],
      contact: { email: 'rohan@example.com', github: 'github.com/rohanmehta', linkedin: 'linkedin.com/in/rohanmehta' },
    },
  },
]

// Default template per persona field
const DEFAULT_TEMPLATE: Record<Field, Template> = {
  cs:        'system-dark',
  design:    'split-editorial',
  marketing: 'warm-editorial',
  business:  'broadsheet',
  other:     'clean-light',
}

// ─── Helpers ──────────────────────────────────────────────
function scoreGrade(s: number) {
  if (s >= 95) return 'A+'
  if (s >= 88) return 'A'
  if (s >= 80) return 'B+'
  if (s >= 70) return 'B'
  if (s >= 60) return 'C+'
  if (s >= 50) return 'C'
  return 'D'
}

function scoreColor(s: number) {
  if (s >= 80) return 'text-success'
  if (s >= 60) return 'text-warning'
  return 'text-error'
}

// ─── Page ─────────────────────────────────────────────────
export default function DemoPortfolioPage() {
  const [personaIdx, setPersonaIdx] = useState(0)
  const [template,   setTemplate]   = useState<Template>(PERSONAS[0].defaultTemplate)

  const persona = PERSONAS[personaIdx]
  const score   = useMemo(() => scorePortfolio(persona.data, persona.field), [persona])

  function handlePersonaSwitch(i: number) {
    setPersonaIdx(i)
    setTemplate(PERSONAS[i].defaultTemplate)
  }

  return (
    <div className="relative">

      {/* ── Portfolio fills the entire screen ───────────────── */}
      <TemplateRenderer
        template={template}
        data={persona.data}
        showBadge={false}
      />

      {/* ── Floating logo — top left ─────────────────────────── */}
      <div className="fixed top-5 left-5 z-50 no-print">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-mono text-text-primary hover:text-accent transition-colors px-3 py-1.5 bg-background/90 backdrop-blur-sm border border-border"
        >
          <span className="text-accent font-bold tracking-widest uppercase">FF</span>
          <span className="text-text-disabled">·</span>
          <span>ForgeFolio</span>
        </Link>
      </div>

      {/* ── Floating control bar — bottom center ─────────────── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 no-print">
        <div className="flex items-center gap-5 px-5 py-3 bg-background/95 backdrop-blur-md border border-border">

          {/* Persona */}
          <div className="flex items-center gap-4">
            {PERSONAS.map((p, i) => (
              <button
                key={i}
                onClick={() => handlePersonaSwitch(i)}
                className={cn(
                  'text-xs font-mono uppercase tracking-wide whitespace-nowrap transition-colors',
                  personaIdx === i
                    ? 'text-text-primary font-semibold'
                    : 'text-text-disabled hover:text-text-secondary'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="h-3 w-px bg-border" />

          {/* Template */}
          <div className="flex items-center gap-4">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={cn(
                  'text-xs font-mono uppercase tracking-wide whitespace-nowrap transition-colors',
                  template === t.id
                    ? 'text-accent font-semibold'
                    : 'text-text-disabled hover:text-text-secondary'
                )}
              >
                {t.name}
              </button>
            ))}
          </div>

          <div className="h-3 w-px bg-border" />

          {/* Score */}
          <span className={cn('text-xs font-bold font-mono tabular-nums shrink-0', scoreColor(score.total))}>
            {score.total}/100
          </span>

          <div className="h-3 w-px bg-border" />

          {/* CTA */}
          <Link
            href="/onboarding"
            className="shrink-0 text-xs font-medium text-white bg-accent px-3 py-1 hover:bg-accent-hover transition-colors"
          >
            Score mine →
          </Link>
        </div>
      </div>
    </div>
  )
}
