'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/funnel'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <UpgradeContent />
    </Suspense>
  )
}

function UpgradeContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const source       = searchParams.get('from')

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    track('upgrade_page_view', { source: source ?? 'direct' })
    // Load Razorpay checkout.js
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpgrade() {
    track('upgrade_checkout_click', { source: source ?? 'direct' })
    setLoading(true)
    setError(null)

    try {
      const res  = await fetch('/api/payment/create', { method: 'POST' })
      const data = await res.json()

      if (!res.ok || !data.subscriptionId) {
        setError(data.error ?? 'Could not start checkout.')
        setLoading(false)
        return
      }

      const options = {
        key:             data.keyId,
        subscription_id: data.subscriptionId,
        name:            'ForgeFolio',
        description:     'Pro Plan — ₹299/month',
        image:           '/icon.png',
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_subscription_id: string
          razorpay_signature: string
        }) => {
          track('upgrade_payment_success')
          router.push('/dashboard?upgraded=true')
        },
        modal: {
          ondismiss: () => {
            track('upgrade_checkout_dismissed')
            setLoading(false)
          },
        },
        theme: { color: '#2D6A4F' },
      }

      new window.Razorpay(options).open()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const COMPARISON = [
    { label: 'Portfolio generation',   free: 'Free forever',    pro: 'Free forever'     },
    { label: 'Signal Score',           free: '100-pt analysis', pro: '100-pt analysis'  },
    { label: 'AI improvements / day',  free: '3',               pro: 'Unlimited'        },
    { label: 'Portfolios',             free: '1',               pro: 'Unlimited'        },
    { label: 'Analytics',              free: '7 days',          pro: 'Full history'     },
    { label: 'Company identification', free: 'Count only',      pro: 'Company names'    },
    { label: 'JD filter check',        free: '—',               pro: '+'                },
    { label: 'Skill gap analysis',     free: '—',               pro: '+'                },
    { label: 'Market intel',           free: '—',               pro: '+'                },
    { label: 'ForgeFolio badge',       free: 'Shown',           pro: 'Removed'          },
  ]

  return (
    <div className="min-h-screen bg-background">

      <main className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors mb-10"
        >
          ← Dashboard
        </Link>

        <div className="grid gap-16 lg:grid-cols-[1fr_300px] lg:items-start">

          {/* ── Left ── */}
          <div className="flex flex-col gap-12 animate-slide-up-1">

            <div>
              <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-2">Pro plan</span>
              <h1 className="text-h2 font-bold text-text-primary tracking-tight leading-tight">
                {source === 'analytics'
                  ? <>Companies viewed you.<br />See who.</>
                  : <>Know who&apos;s viewing<br />your portfolio.</>}
              </h1>
              <p className="text-small text-text-secondary mt-3 max-w-md">
                {source === 'analytics'
                  ? 'You came here because companies viewed you — you just can\'t see who yet. Pro unlocks that signal.'
                  : 'See company names behind every view, remove the badge, and unlock the full intelligence suite.'}
              </p>
            </div>

            {/* Free vs Pro comparison */}
            <div className="animate-slide-up-2">
              <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">Free vs Pro</span>
              <div className="border border-border">
                <div className="grid grid-cols-[1.5fr_1fr_1fr] border-b border-border px-4 py-2.5">
                  <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Feature</span>
                  <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Free</span>
                  <span className="text-micro font-mono text-accent uppercase tracking-widest">Pro</span>
                </div>
                {COMPARISON.map((row, i) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-[1.5fr_1fr_1fr] px-4 py-3${i > 0 ? ' border-t border-border' : ''}`}
                  >
                    <span className="text-small text-text-primary">{row.label}</span>
                    <span className="text-small font-mono text-text-disabled">{row.free}</span>
                    <span className="text-small font-mono text-accent">{row.pro}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-border p-5 animate-slide-up-3">
              <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-2">A note from the builder</span>
              <p className="text-small text-text-secondary leading-relaxed">
                This started as a college project. Pricing covers AI costs — not VC targets.
                If something breaks, email us and we fix it. Beta pricing is locked in for life.
              </p>
            </div>
          </div>

          {/* ── Right: pricing panel ── */}
          <div className="lg:sticky lg:top-6 border border-border animate-slide-up-2">

            {/* Most popular badge */}
            <div className="bg-accent px-4 py-2 flex items-center justify-center">
              <span className="text-micro font-mono text-white uppercase tracking-widest">Most popular</span>
            </div>

            {/* Price */}
            <div className="p-6 border-b border-border">
              <div className="flex items-baseline gap-1">
                <span className="text-micro font-mono text-text-disabled">₹</span>
                <span className="text-[2.5rem] font-bold font-mono text-text-primary leading-none tabular-nums">299</span>
                <span className="text-small text-text-disabled">/ mo</span>
              </div>
              <p className="text-micro font-mono text-text-disabled mt-1.5">billed monthly · cancel anytime</p>
              <p className="text-micro font-mono text-accent mt-1">Beta pricing · locked in for life</p>
              <p className="text-micro font-mono text-text-disabled mt-2 opacity-60">Less than one month of Naukri Premium</p>
            </div>

            {/* Key features */}
            <div className="divide-y divide-border">
              {[
                'JD filter check — without it, you apply blind',
                'Skill gap analysis + market intel + warm paths',
                'Unlimited portfolios · unlimited AI improvements',
                'Full analytics with company identification',
                'No ForgeFolio badge on public pages',
                'Priority AI rewrites',
                'CSV analytics export',
              ].map(f => (
                <div key={f} className="px-5 py-3 flex items-start gap-3">
                  <span className="text-micro font-mono text-accent shrink-0 mt-0.5">+</span>
                  <span className="text-small text-text-primary">{f}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="p-5 flex flex-col gap-3 border-t border-border">
              {error && (
                <p className="text-micro font-mono text-error border-l-2 border-error pl-3 py-0.5">{error}</p>
              )}
              <Button size="lg" className="w-full" loading={loading} onClick={handleUpgrade}>
                {loading ? 'Opening checkout…' : 'Start 7-day free trial →'}
              </Button>
              <p className="text-micro font-mono text-text-disabled text-center">Razorpay secure checkout · cancel anytime</p>
              <p className="text-micro font-mono text-text-disabled text-center opacity-60">
                Most engineers upgrade after their first rejected application
              </p>
              <Link
                href="/dashboard"
                className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors text-center"
              >
                Not now — I&apos;ll miss the company signals
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
