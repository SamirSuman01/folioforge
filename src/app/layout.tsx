import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Cormorant_Garamond, IBM_Plex_Mono, IBM_Plex_Sans, Syne, Bricolage_Grotesque } from 'next/font/google'

const GeistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  display: 'swap',
})

const GeistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  display: 'swap',
})
import { ToastProvider } from '@/components/ui/Toast'
import Providers from './providers'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const ibmMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-ibm-mono',
  display: 'swap',
})

const ibmSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-ibm-sans',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-bricolage',
  display: 'swap',
})

/* ─────────────────────────────────────────────────────────
   ROOT LAYOUT — Foundation for every page.

   Responsibilities:
   - Font loading (Geist Sans + Mono via CSS variables)
   - Global providers (Toast, TanStack Query)
   - Metadata defaults (overridden per-page)
   - Viewport settings
   - Skip-to-main link (accessibility)
   ───────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: {
    default:  'ForgeFolio — Career Transition OS',
    template: '%s | ForgeFolio',
  },
  description:
    'From where you are to where you want to be — professionally. Build your career identity, track opportunities, and get hired.',
  keywords: ['portfolio', 'resume', 'career', 'job search', 'AI portfolio builder'],
  authors: [{ name: 'ForgeFolio' }],
  creator: 'ForgeFolio',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgefolio.com'
  ),
  openGraph: {
    type:        'website',
    siteName:    'ForgeFolio',
    title:       'ForgeFolio — Career Transition OS',
    description: 'From where you are to where you want to be — professionally.',
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
  },
  twitter: {
    card:  'summary_large_image',
    title: 'ForgeFolio — Career Transition OS',
    description: 'From where you are to where you want to be — professionally.',
  },
  robots: {
    index:  true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor:    '#FAFAF9',
  width:         'device-width',
  initialScale:  1,
  maximumScale:  5, // Allow zoom for accessibility
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${cormorant.variable} ${ibmMono.variable} ${ibmSans.variable} ${syne.variable} ${bricolage.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-background text-text-primary font-sans antialiased">
        {/* Skip to main content — accessibility, appears on first Tab */}
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>

        <Providers>
          <ToastProvider>
            {children}
          </ToastProvider>
        </Providers>
      </body>
    </html>
  )
}
