import Link from 'next/link'

/* ─────────────────────────────────────────────────────────
   MARKETING NAV — OS Aesthetic (Linear/Stripe DNA)
   Breadcrumb-style nav + system status indicator
   Sticky with backdrop-blur(12px)
   ───────────────────────────────────────────────────────── */

export default function MarketingNav() {
  return (
    <header
      className="sticky top-0 z-20 h-12 border-b border-border"
      style={{
        background: 'rgba(251, 251, 254, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="mx-auto h-full flex items-center justify-between gap-4 px-6 lg:px-10"
        style={{ maxWidth: '1280px' }}
      >

        {/* Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-70 transition-opacity shrink-0"
        >
          <span
            className="text-micro font-mono font-bold tracking-widest uppercase"
            style={{ color: '#2563EB' }}
          >
            FF
          </span>
          <span className="text-micro font-mono text-text-disabled">·</span>
          <span className="text-small font-semibold text-text-primary">ForgeFolio</span>
        </Link>

        {/* Breadcrumb nav */}
        <nav className="hidden md:flex items-center gap-5" aria-label="Main navigation">
          {([
            { num: '01', label: 'PRICING',   href: '/pricing' },
            { num: '02', label: 'DEMO_MODE', href: '/p/demo'  },
          ] as const).map(({ num, label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors"
            >
              <span className="opacity-40">[ {num} ]</span>
              {' '}
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Right: status + auth + CTA */}
        <div className="flex items-center gap-5 shrink-0">

          {/* System status */}
          <div className="hidden lg:flex items-center gap-1.5">
            <span className="hero-status-dot" aria-hidden="true" />
            <span className="text-micro font-mono text-text-disabled whitespace-nowrap">
              SYSTEM: ACTIVE // STABLE
            </span>
          </div>

          <Link
            href="/auth/login"
            className="hidden sm:block text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors"
          >
            Sign in
          </Link>

          <Link
            href="/onboarding"
            className="text-micro font-mono text-white"
            style={{
              background: '#2563EB',
              padding: '6px 14px',
              borderRadius: '4px',
              fontWeight: 600,
            }}
          >
            Get started
          </Link>
        </div>

      </div>
    </header>
  )
}
