import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How ForgeFolio collects, uses, and protects your data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="h-12 flex items-center px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <span className="text-micro font-mono font-semibold tracking-widest uppercase text-accent">FF</span>
          <span className="text-micro font-mono text-text-disabled">·</span>
          <span className="text-small font-medium text-text-primary">ForgeFolio</span>
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-16">
        <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-2">Legal</span>
        <h1 className="text-h2 font-bold text-text-primary tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-small font-mono text-text-disabled mb-12">Last updated: April 2026</p>

        <div className="prose-ff space-y-10 text-body text-text-secondary leading-relaxed">

          <section>
            <h2 className="text-h4 font-semibold text-text-primary mb-3">What we collect</h2>
            <p>When you create an account, we collect your name, email address, and the portfolio content you enter. When visitors view your published portfolio, we record anonymised visit data (city, country, referrer, duration) to power your analytics dashboard. We do not collect passwords in plain text — they are hashed by Supabase Auth.</p>
          </section>

          <section>
            <h2 className="text-h4 font-semibold text-text-primary mb-3">How we use it</h2>
            <p>We use your data to operate the ForgeFolio service: generate your portfolio, run AI analysis, show you analytics, and send transactional emails (account confirmation, password reset). We do not sell your data to third parties.</p>
          </section>

          <section>
            <h2 className="text-h4 font-semibold text-text-primary mb-3">Third-party services</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-text-primary">Supabase</strong> — database, authentication, file storage</li>
              <li><strong className="text-text-primary">Google Gemini / Anthropic Claude</strong> — AI generation (portfolio content sent to API; not stored by provider beyond the request)</li>
              <li><strong className="text-text-primary">Stripe</strong> — payment processing (we never see your card number)</li>
              <li><strong className="text-text-primary">Vercel</strong> — hosting and edge functions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h4 font-semibold text-text-primary mb-3">Data retention</h2>
            <p>We store your data for as long as your account exists. You can delete your account at any time from <Link href="/dashboard/settings" className="text-accent hover:underline">Settings → Account</Link>, which permanently removes all your portfolios, analytics, and personal data.</p>
          </section>

          <section>
            <h2 className="text-h4 font-semibold text-text-primary mb-3">Cookies</h2>
            <p>We use a single authentication cookie (set by Supabase) to keep you signed in. No advertising or tracking cookies are used.</p>
          </section>

          <section>
            <h2 className="text-h4 font-semibold text-text-primary mb-3">Contact</h2>
            <p>Questions about your data? Email us at <a href="mailto:privacy@forgefolio.com" className="text-accent hover:underline">privacy@forgefolio.com</a>.</p>
          </section>
        </div>

        <div className="mt-16 pt-6 border-t border-border flex items-center gap-6">
          <Link href="/terms" className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors">Terms of Service</Link>
          <Link href="/" className="text-micro font-mono text-text-disabled hover:text-accent transition-colors">← Back to ForgeFolio</Link>
        </div>
      </main>
    </div>
  )
}
