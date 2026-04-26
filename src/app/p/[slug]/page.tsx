import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import TemplateRenderer from '@/components/templates/TemplateRenderer'
import AnalyticsTracker from '@/components/AnalyticsTracker'
import OwnerBar from '@/components/OwnerBar'
import type { Template, PortfolioData } from '@/lib/types'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = getSupabase()

  const { data } = await supabase
    .from('portfolios')
    .select('data, slug, score')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!data) return { title: 'Portfolio Not Found' }

  const d = data.data as PortfolioData
  const title       = `${d.name} — ${d.role}`
  const description = d.tagline ?? d.about ?? ''
  const baseUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgefolio.com'
  const url         = `${baseUrl}/p/${data.slug}`
  const scoreParam  = data.score ? `&score=${data.score}` : ''
  const ogImage     = `${baseUrl}/api/og?title=${encodeURIComponent(d.name)}&sub=${encodeURIComponent(d.role ?? d.headline ?? '')}${scoreParam}`

  return {
    title,
    description,
    openGraph: {
      title, description, type: 'profile', url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card:  'summary_large_image',
      title, description,
      images: [ogImage],
    },
  }
}

export default async function PortfolioPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = getSupabase()

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!portfolio) notFound()

  return (
    <>
      <TemplateRenderer
        template={portfolio.template as Template}
        data={portfolio.data as PortfolioData}
        showBadge={!portfolio.is_pro}
      />
      <AnalyticsTracker portfolioId={portfolio.id} />
      <OwnerBar
        portfolioId={portfolio.id}
        portfolioUserId={portfolio.user_id}
        slug={portfolio.slug}
        viewCount={portfolio.view_count ?? 0}
      />
    </>
  )
}
