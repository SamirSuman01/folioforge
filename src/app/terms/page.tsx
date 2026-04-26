import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'ForgeFolio terms of service and acceptable use policy.',
}

export default function TermsPage() {
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
        <h1 className="text-h2 font-bold text-text-primary tracking-tight mb-2">Terms of Service</h1>
        <p className="text-small font-mono text-text-disabled mb-12">Last updated: April 2026</p>

        <div className="space-y-10 text-body text-text-secondary leading-relaxed">

          <section>
            <h2 className="text-h4 font-semibold text-text-primary mb-3">Acceptance</h2>
            <p>By creating an account or using ForgeFolio, you agree to these terms. If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h2 className="text-h4 font-semibold text-text-primary mb-3">Your account</h2>
            <p>You are responsible for keeping your password secure and for all activity under your account. You must be at least 13 years old to use ForgeFolio.</p>
          </section>

          <section>
            <h2 className="text-h4 font-semibold text-text-primary mb-3">Your content</h2>
            <p>You own the content you create on ForgeFolio. By publishing a portfolio you grant ForgeFolio a limited licence to display and serve that content to portfolio visitors. You may unpublish or delete your content at any time.</p>
          </section>

          <section>
            <h2 className="text-h4 font-semibold text-text-primary mb-3">Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Post false, misleading, or fraudulent content</li>
              <li>Attempt to circumvent rate limits or abuse the AI generation features</li>
              <li>Use the platform to spam, harvest data, or harm other users</li>
              <li>Reverse-engineer or resell any part of the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h4 font-semibold text-text-primary mb-3">Free vs Pro</h2>
            <p>Free accounts include portfolio creation, AI generation, and basic analytics. Pro features (company identification, advanced analysis) require an active paid subscription. Subscriptions auto-renew and can be cancelled any time from Settings. No refunds for partial billing periods.</p>
          </section>

          <section>
            <h2 className="text-h4 font-semibold text-text-primary mb-3">Disclaimer</h2>
            <p>ForgeFolio is provided &ldquo;as is&rdquo;. AI-generated content is for informational purposes only and does not constitute professional career or legal advice. We are not responsible for hiring outcomes.</p>
          </section>

          <section>
            <h2 className="text-h4 font-semibold text-text-primary mb-3">Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time from <Link href="/dashboard/settings" className="text-accent hover:underline">Settings</Link>.</p>
          </section>

          <section>
            <h2 className="text-h4 font-semibold text-text-primary mb-3">Changes</h2>
            <p>We may update these terms. Continued use of the service after changes constitutes acceptance. Material changes will be communicated by email.</p>
          </section>

          <section>
            <h2 className="text-h4 font-semibold text-text-primary mb-3">Contact</h2>
            <p>Questions? Email <a href="mailto:support@forgefolio.com" className="text-accent hover:underline">support@forgefolio.com</a>.</p>
          </section>
        </div>

        <div className="mt-16 pt-6 border-t border-border flex items-center gap-6">
          <Link href="/privacy" className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors">Privacy Policy</Link>
          <Link href="/" className="text-micro font-mono text-text-disabled hover:text-accent transition-colors">← Back to ForgeFolio</Link>
        </div>
      </main>
    </div>
  )
}
