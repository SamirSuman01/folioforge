import { createClient } from '@supabase/supabase-js'
import { notFound }     from 'next/navigation'
import type { Metadata } from 'next'
import type { PortfolioData } from '@/lib/types'
import BadgeClient from './BadgeClient'

// ─── Supabase (server, anon) ──────────────────────────────
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

interface PageProps {
  params: Promise<{ slug: string }>
}

// ─── Grade helper ─────────────────────────────────────────
function scoreGrade(s: number) {
  if (s >= 95) return 'A+'
  if (s >= 88) return 'A'
  if (s >= 80) return 'B+'
  if (s >= 70) return 'B'
  if (s >= 60) return 'C+'
  if (s >= 50) return 'C'
  return 'D'
}

// ─── OG metadata ─────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase  = getSupabase()

  const { data } = await supabase
    .from('portfolios')
    .select('data, score')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!data) return { title: 'ForgeFolio Badge' }

  const d     = data.data as PortfolioData
  const score = data.score ?? 0
  const grade = scoreGrade(score)
  const title = `${d.name} — Signal Score ${score} (${grade})`
  const desc  = `${d.name} has a ForgeFolio Signal Score of ${score}/100 (${grade}). Verified by ForgeFolio.`
  const url   = `${process.env.NEXT_PUBLIC_APP_URL}/badge/${slug}`

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type:        'profile',
      url,
    },
    twitter: {
      card:        'summary',
      title,
      description: desc,
    },
  }
}

// ─── Page ─────────────────────────────────────────────────
export default async function BadgePage({ params }: PageProps) {
  const { slug } = await params
  const supabase  = getSupabase()

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('data, score, slug, updated_at')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!portfolio) notFound()

  const d     = portfolio.data as PortfolioData
  const score = portfolio.score ?? 0
  const grade = scoreGrade(score)

  return (
    <BadgeClient
      name={d.name}
      role={d.role ?? d.headline ?? ''}
      score={score}
      grade={grade}
      slug={slug}
    />
  )
}
