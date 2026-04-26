import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgefolio.com'
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/p/'],
        disallow: ['/dashboard/', '/editor/', '/api/', '/onboarding/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
