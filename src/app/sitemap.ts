import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase-server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgefolio.com'

  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base,                   lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/auth/login`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/auth/signup`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  // Published portfolios — public pages only
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('portfolios')
      .select('slug, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(5000)

    const portfolioRoutes: MetadataRoute.Sitemap = (data ?? []).map((p) => ({
      url:              `${base}/p/${p.slug}`,
      lastModified:     p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency:  'weekly' as const,
      priority:         0.8,
    }))

    return [...staticRoutes, ...portfolioRoutes]
  } catch {
    return staticRoutes
  }
}
