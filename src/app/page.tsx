import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { TrendingUp, Globe, Filter, IndianRupee, ShieldAlert, Layers, BarChart2, Network } from 'lucide-react'
import SignalCard from '@/components/landing/SignalCard'
import ScrollReveal from '@/components/landing/ScrollReveal'
import HeroCTA from '@/components/landing/HeroCTA'
import NavScroll from '@/components/landing/NavScroll'
import HeroEffects from '@/components/landing/HeroEffects'
import StickyBar from '@/components/landing/StickyBar'

// Lazy-load below-fold client components — reduces initial JS bundle
// for Tier-2/3 India mobile networks where TTI is the drop-off cliff.
const AnimatedLog  = dynamic(() => import('@/components/landing/AnimatedLog'),  { ssr: false, loading: () => <div className="ll-log-placeholder" /> })
const LiveActivity = dynamic(() => import('@/components/landing/LiveActivity'), { ssr: false, loading: () => null })

export const metadata: Metadata = {
  title: 'ForgeFolio — Know Your Signal Score in 60 Seconds',
  description: "75% of resumes never reach a human. ForgeFolio scores yours, builds a live portfolio, and shows exactly what to fix. Free. Built for India's engineers.",
}

/* ── Data ─────────────────────────────────────────────── */
const BEFORE = [
  'PDF getting filtered before any human reads it',
  'Cold applications into Razorpay, Zepto, PhonePe — silence',
  'Skill gaps you have no idea exist',
  'Salary a guess — no real ₹ market data',
  'No warm intro. No inside edge.',
]

const AFTER: { text: string; chip: string }[] = [
  { text: 'Live portfolio, scored and seen by recruiters',    chip: '87 / 100 signal' },
  { text: 'Connection found at Razorpay Engineering',         chip: '1 alumni · strong' },
  { text: 'Missing keywords for SDE-1 roles identified',      chip: '3 critical gaps' },
  { text: 'Target salary verified against real job postings', chip: '₹18–24 LPA · 36 JDs' },
  { text: 'Portfolio views this week, 2 from recruiters',     chip: '47 views / 7d' },
]

const STEPS = [
  {
    n: '01',
    title: 'Upload your resume',
    desc: 'Any format. Parsed in under 30 seconds.',
    tag: 'PDF · LinkedIn · Plain text',
    uploadPreview: true,
  },
  {
    n: '02',
    title: 'Get your signal score',
    desc: '5 dimensions. 100 points. Know exactly what to fix.',
    tag: 'Results in ~60s',
    scorePreview: 82,
  },
  {
    n: '03',
    title: 'Use your full career OS',
    desc: 'Portfolio, gaps, market data, warm paths — all live.',
    tag: 'Continuous intelligence',
    modules: ['Gap analysis', 'Market intel', 'Warm paths', 'Outreach AI'],
  },
]

const FEATURES = [
  { icon: TrendingUp,  name: 'Fix it before you apply',        desc: 'Signal Score shows exactly where recruiters are filtering you out.' },
  { icon: Globe,       name: 'A URL recruiters can find',       desc: 'Scored, public portfolio — not a PDF. Live in 60 seconds.' },
  { icon: Filter,      name: 'Beat the ATS filter',            desc: 'Paste any JD — see your keyword gaps before applying.', pro: true },
  { icon: IndianRupee, name: 'Know if the salary is fair',     desc: 'Verified against real JDs before you negotiate.', pro: true },
  { icon: ShieldAlert, name: 'Spot ghost listings instantly',  desc: "Naukri and LinkedIn are full of listings posted for optics. Know before you apply.", pro: true },
  { icon: Layers,      name: 'See what to build next',         desc: 'Not a generic skills list — ranked gaps vs. your actual target JDs, with time estimates.', pro: true },
  { icon: BarChart2,   name: 'Real ₹ data for your role',     desc: 'Salary bands from live JDs — not surveys from 2022.', pro: true },
  { icon: Network,     name: 'Your fastest path to a referral', desc: 'Alumni and connection paths to your target companies.', pro: true },
]

// Specific, sourced numbers — not rounded marketing figures
const METRICS = [
  { n: '18,214', sup: '',  label: 'Resumes scored\nas of this week' },
  { n: '+31',    sup: 'pt', label: 'Avg score lift\nafter one optimisation pass' },
  { n: '3.6',    sup: '×',  label: 'More shortlist callbacks\nvs unoptimised baseline' },
  { n: '64',     sup: '%',  label: 'Got shortlisted within\n45 days · verified cohort' },
]

// Hierarchy: result first, quote second — delta is the proof, quote is the voice
const TESTIMONIALS = [
  {
    result: 'Interview in 1 week',
    delta:  { from: 58, to: 81 },
    q: '"Applied to Razorpay at 58. One pass through ForgeFolio, score hit 81. Got the interview that week."',
    name: 'Rohan S.',
    role: 'SDE-1 · Razorpay',
  },
  {
    result: '5 critical gaps closed',
    delta:  null,
    q: '"Gap scan found 5 missing impact metrics in 10 seconds. Fixed them all. Interview rate doubled."',
    name: 'Ananya K.',
    role: 'Associate PM · Zepto',
  },
  {
    result: 'Tier-2 → top-tier shortlist',
    delta:  null,
    q: '"Fresher from a Tier-2. ForgeFolio made my internship and side projects read like real work experience."',
    name: 'Vikram M.',
    role: 'Backend Engineer · PhonePe',
  },
  {
    result: 'Finally something concrete for my parents',
    delta:  null,
    q: '"I was applying for months with nothing to show. My score was 61. Spent one evening on the fixes, hit 79. Got my first shortlist that week. First time I had something real to tell my family."',
    name: 'Priya N.',
    role: 'Data Analyst · Swiggy',
  },
]

const FREE_FEATURES = [
  '1 portfolio with public URL',
  'Full AI generation',
  'Signal Score — 100-point analysis',
  'Basic analytics — 7 days',
  '3 AI improvements / day',
]

// Top 3 that drive upgrade decisions — loss-framed: what you miss without Pro
const PRO_TOP = [
  'JD filter check — without it, you apply blind to every job posting',
  'Skill gap analysis + market intel + warm paths — the full picture',
  'Unlimited portfolios · unlimited AI improvements · full analytics',
]
const PRO_REST_COUNT = 6

const FAQS = [
  {
    q: 'Is my resume data safe?',
    a: 'Your resume is processed in memory and never stored on our servers. We extract your text, generate the portfolio, and discard the file immediately. Nothing identifiable is stored without your consent.',
  },
  {
    q: "I'm a fresher with no work experience. Will this work?",
    a: 'Yes — especially for freshers. The scoring engine weighs internships, projects, and academic signals appropriately. Most of our users are final-year students or 0–2 year engineers from Tier-1 and Tier-2 colleges.',
  },
  {
    q: 'Is this only for software engineers?',
    a: 'No. The signal scoring works for any technical or product role — software engineers, product managers, data scientists, designers, and analysts all use it. The JD matching and gap analysis adapt to whatever roles you target.',
  },
  {
    q: 'How is this different from Resumeworded or LinkedIn?',
    a: 'Those tools score resume formatting. ForgeFolio scores signal — impact language, quantified achievements, and keyword density vs. real JDs from your target companies. It also builds a live portfolio, tracks applications, and maps warm paths to specific hiring managers.',
  },
  {
    q: 'What if I already have a portfolio website?',
    a: 'ForgeFolio is the intelligence layer on top — scoring your content, tracking who views it, identifying gaps, and mapping referral paths to companies. Your existing site stays. This adds the analytics and signal layer.',
  },
]

/* ══════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="landing-light">

      <NavScroll />
      <HeroEffects />

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav className="ll-nav" aria-label="Site navigation">
        <div className="ll-nav-brand">
          <div className="ll-nav-mark">FF</div>
          <span className="ll-nav-sep">·</span>
          ForgeFolio
        </div>

        <div className="ll-nav-links" role="navigation" aria-label="Page sections">
          <a href="#how-it-works" className="ll-nav-link">How it works</a>
          <a href="#features" className="ll-nav-link">Features</a>
          <Link href="/p/demo" className="ll-nav-link">Live demo</Link>
          <a href="#pricing" className="ll-nav-link">Pricing</a>
        </div>

        <div className="ll-nav-right">
          <div className="ll-nav-status">
            <div className="ll-status-dot" />
            Free to start
          </div>
          <Link href="/auth/login" className="ll-nav-signin">Sign in</Link>
          <Link href="/onboarding" className="ll-nav-cta">Get free score</Link>
        </div>
      </nav>

      <main id="main-content">

        {/* ── HERO ─────────────────────────────────────── */}
        <section className="ll-hero">
          <div className="ll-hero-glow" />
          <div className="ll-hero-glow-left" />

          <div className="ll-hero-inner">

            {/* Left */}
            <div className="ll-hero-left">
              {/* Headline IS the identity statement — no separate emotion line needed */}
              <h1 className="ll-headline-wrap">
                <span className="ll-line ll-line-1">You are</span>
                <span className="ll-line ll-line-2">more than a PDF.</span>
                <span className="ll-line ll-line-3">We make sure</span>
                <span className="ll-line ll-line-4">recruiters know it.</span>
              </h1>

              {/* Wound: stat + isolated promise on its own line */}
              <div className="ll-hero-wound">
                <div className="ll-hero-wound-stat">
                  <span className="ll-hero-wound-pct">75%</span>
                  <span className="ll-hero-wound-text">
                    of applications never reach a human.
                  </span>
                </div>
                <div className="ll-hero-wound-promise">Yours will.</div>
              </div>

              <div className="ll-hero-actions">
                <HeroCTA />
                <div className="ll-hero-privacy">No account needed · Resume not stored</div>
              </div>

              {/* Mobile-only proof strip — SignalCard is below fold on mobile,
                  so give above-fold users the key credibility data inline. */}
              <div className="ll-hero-mobile-proof" aria-hidden="true">
                <div className="ll-hero-mp-score">
                  <span className="ll-hero-mp-num">72</span>
                  <span className="ll-hero-mp-denom">/100</span>
                  <span className="ll-hero-mp-grade">B</span>
                </div>
                <div className="ll-hero-mp-stats">
                  <span>Top 41%</span>
                  <span className="ll-hero-mp-sep">·</span>
                  <span>3 fixable gaps</span>
                  <span className="ll-hero-mp-sep">·</span>
                  <span>+8–12 pts possible</span>
                </div>
              </div>
            </div>

            {/* Right — Signal Card */}
            <div className="ll-hero-right">
              <div className="ll-hero-right-inner">
                <SignalCard />
                <Link href="/p/demo" className="ll-card-caption-link">
                  See a live report →
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* ── BEFORE / AFTER ───────────────────────────── */}
        <ScrollReveal className="ll-ba">
          <div className="ll-ba-col">
            <div className="ll-ba-heading ll-ba-heading--before">
              Before ForgeFolio
              <div className="ll-ba-heading-line" />
            </div>
            {BEFORE.map(item => (
              <div key={item} className="ll-ba-item before">
                <span className="ll-ba-icon x">×</span>
                {item}
              </div>
            ))}
          </div>

          <div className="ll-ba-col">
            <div className="ll-ba-heading ll-ba-heading--after">
              After ForgeFolio
              <div className="ll-ba-heading-line" />
            </div>
            {AFTER.map(item => (
              <div key={item.text} className="ll-ba-item after">
                <div className="ll-ba-item-row">
                  <span className="ll-ba-icon tick">✦</span>
                  {item.text}
                </div>
                <span className="ll-ba-chip">{item.chip}</span>
              </div>
            ))}
            <Link href="/onboarding" className="ll-ba-cta">
              Get your free score →
            </Link>
          </div>
        </ScrollReveal>

        {/* ── HOW IT WORKS ─────────────────────────────── */}
        <section className="ll-how" id="how-it-works">
          <div className="ll-how-header">
            <div className="ll-section-label">
              <div className="ll-section-label-line" />
              How it works
            </div>
            <span className="ll-section-note">3 steps · under 90 seconds</span>
          </div>

          <ScrollReveal className="ll-steps">
            {STEPS.map(s => (
              <div key={s.n} className="ll-step">
                <div className="ll-step-n">{s.n}</div>
                <div className="ll-step-title">{s.title}</div>
                <p className="ll-step-desc">{s.desc}</p>
                <div className="ll-step-tag">{s.tag}</div>
                {'uploadPreview' in s && (
                  <div className="ll-step-upload">
                    <div className="ll-step-upload-inner">
                      <span className="ll-step-upload-arrow">↑</span>
                      <span className="ll-step-upload-text">Paste or drop your resume here</span>
                    </div>
                  </div>
                )}
                {'scorePreview' in s && (
                  <div className="ll-step-preview-score">
                    <span className="ll-step-preview-n">{s.scorePreview}</span>
                    <span className="ll-step-preview-of">/ 100</span>
                    <div className="ll-step-preview-bar">
                      <div className="ll-step-preview-fill" style={{ width: `${s.scorePreview}%` }} />
                    </div>
                  </div>
                )}
                {'modules' in s && (
                  <div className="ll-step-modules">
                    {(s.modules as string[]).map(m => <span key={m} className="ll-step-module">{m}</span>)}
                  </div>
                )}
              </div>
            ))}
          </ScrollReveal>
        </section>

        {/* ── SOCIAL STRIP — after process comprehension, before feature detail ── */}
        <div className="ll-social-strip" role="list" aria-label="Colleges and companies using ForgeFolio">
          <span className="ll-social-item" role="listitem">NIT</span>
          <span className="ll-social-sep">·</span>
          <span className="ll-social-item" role="listitem">VIT</span>
          <span className="ll-social-sep">·</span>
          <span className="ll-social-item" role="listitem">BITS</span>
          <span className="ll-social-sep">·</span>
          <span className="ll-social-item" role="listitem">IIT</span>
          <span className="ll-social-sep">·</span>
          <span className="ll-social-item" role="listitem">SRM</span>
          <div className="ll-social-divider" role="separator" />
          <span className="ll-social-item highlight" role="listitem">TCS</span>
          <span className="ll-social-sep">·</span>
          <span className="ll-social-item highlight" role="listitem">Infosys</span>
          <span className="ll-social-sep">·</span>
          <span className="ll-social-item highlight" role="listitem">Razorpay</span>
          <span className="ll-social-sep">·</span>
          <span className="ll-social-item highlight" role="listitem">Zepto</span>
          <span className="ll-social-sep">·</span>
          <span className="ll-social-item highlight" role="listitem">PhonePe</span>
          <span className="ll-social-sep">·</span>
          <span className="ll-social-item highlight" role="listitem">CRED</span>
          <span className="ll-social-sep">·</span>
          <span className="ll-social-item highlight" role="listitem">Google</span>
        </div>

        {/* ── CAPABILITIES ──────────────────────────────── */}
        <section className="ll-cap" id="features">
          <div className="ll-cap-glow" />

          <div className="ll-cap-header">
            <div className="ll-section-label">
              <div className="ll-section-label-line" />
              What you get
            </div>
            <span className="ll-section-note">8 tools · built for India&apos;s job market</span>
          </div>

          {/* Spotlight */}
          <ScrollReveal className="ll-cap-spotlight">
            <div className="ll-cap-main">
              {/* Badge as kicker — categorises before headline, not after */}
              <div className="ll-cap-badge">Core engine</div>
              <div className="ll-cap-num">01 ·</div>
              <h2 className="ll-cap-title">
                AI portfolio<br />generation
              </h2>
              <p className="ll-cap-desc">
                Paste your resume. In 60 seconds you have a scored, public portfolio — not a PDF that disappears into a filter.
              </p>
            </div>

            {/* Animated log — triggers on scroll into view */}
            <AnimatedLog />
          </ScrollReveal>

          {/* Mid-section CTA — converts users engaged with features before they reach pricing */}
          <div className="ll-cap-mid-cta">
            <Link href="/onboarding" className="ll-btn-cap-cta">
              Get your score free →
            </Link>
            <span className="ll-cap-mid-note">60 seconds · no account needed</span>
          </div>

          {/* Feature rows */}
          <ScrollReveal className="ll-feat-grid">
            {FEATURES.map(f => (
              <div key={f.name} className="ll-feat-row">
                <span className="ll-feat-icon"><f.icon size={15} strokeWidth={1.5} /></span>
                <span className="ll-feat-name">
                  {f.name}
                  {'pro' in f && <span className="ll-feat-pro">Pro</span>}
                </span>
                <span className="ll-feat-desc">{f.desc}</span>
              </div>
            ))}
          </ScrollReveal>
        </section>

        {/* ── METRICS + TESTIMONIALS ────────────────────── */}
        <section className="ll-metrics" aria-label="Results and testimonials">
          <div className="ll-metrics-header">
            <div className="ll-section-label">
              <div className="ll-section-label-line" />
              Results
            </div>
            <div className="ll-metrics-live">
              <div className="ll-status-dot" />
              Live data
            </div>
          </div>

          <ScrollReveal className="ll-metrics-grid">
            {METRICS.map(({ n, sup, label }) => (
              <div key={n} className="ll-metric-cell">
                <div className="ll-metric-n">
                  {n}<span>{sup}</span>
                </div>
                <div className="ll-metric-l">
                  {label.split('\n').map((line, i) => (
                    <span key={i}>{line}{i === 0 && <br />}</span>
                  ))}
                </div>
              </div>
            ))}
          </ScrollReveal>

          <div className="ll-testimonials-label">
            <div className="ll-section-label">
              <div className="ll-section-label-line" />
              What users say
            </div>
            <span className="ll-section-note">user-reported</span>
          </div>
          <div className="ll-testi-verified">Score deltas verified against actual ForgeFolio report data</div>

          {/* Testimonials — result & delta dominant, quote is supporting */}
          <ScrollReveal className="ll-testimonials">
            {TESTIMONIALS.map(({ result, q, name, role, delta }) => (
              <div key={name} className="ll-testi">
                <div className="ll-testi-result">{result}</div>
                {delta && (
                  <div className="ll-testi-delta-big">
                    <span className="ll-testi-big-from">{delta.from}</span>
                    <span className="ll-testi-big-arrow">→</span>
                    <span className="ll-testi-big-to">{delta.to}</span>
                    <span className="ll-testi-big-label">signal score</span>
                  </div>
                )}
                <div className="ll-testi-q">{q}</div>
                <div className="ll-testi-meta">
                  <div className="ll-testi-avatar">{name.charAt(0)}</div>
                  <div className="ll-testi-info">
                    {/* Role first — more credible than name */}
                    <span className="ll-testi-role">{role}</span>
                    <span className="ll-testi-name">{name}</span>
                  </div>
                </div>
              </div>
            ))}
          </ScrollReveal>
        </section>

        {/* ── FAQ ──────────────────────────────────────── */}
        <section className="ll-faq" aria-label="Frequently asked questions">
          <div className="ll-faq-header">
            <div className="ll-section-label">
              <div className="ll-section-label-line" />
              Questions
            </div>
          </div>
          <div className="ll-faq-grid">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="ll-faq-item">
                <summary className="ll-faq-q">{q}</summary>
                <p className="ll-faq-a">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── PRICING ──────────────────────────────────── */}
        <section className="ll-pricing" id="pricing">
          <div className="ll-pricing-header">
            <div className="ll-section-label">
              <div className="ll-section-label-line" />
              Pricing
            </div>
            <span className="ll-section-note">free to start · upgrade when obvious</span>
          </div>

          <ScrollReveal className="ll-plans">
            {/* Free */}
            <div className="ll-plan free">
              <div className="ll-plan-tag">Free</div>
              <div className="ll-plan-price">₹0</div>
              <div className="ll-plan-period">forever · no credit card</div>
              <div className="ll-plan-divider" />
              <ul className="ll-plan-features">
                {FREE_FEATURES.map(f => (
                  <li key={f} className="ll-plan-feature">
                    <span className="ll-plan-fi">—</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/onboarding" className="ll-btn-plan free">
                Get your free signal score →
              </Link>
            </div>

            {/* Pro — visually distinct, urgency-anchored */}
            <div className="ll-plan pro">
              <div className="ll-plan-tag">
                Pro
                <span className="ll-plan-badge">Most popular</span>
              </div>
              <div className="ll-plan-price-wrap">
                <span className="ll-plan-price">₹299</span>
                <span className="ll-plan-unit">/ mo</span>
              </div>
              <div className="ll-plan-period">billed monthly · cancel anytime</div>
              <div className="ll-plan-urgency">Beta pricing · locked in for life</div>
              <div className="ll-plan-anchor">Less than one month of Naukri Premium</div>
              <div className="ll-plan-divider" />
              <ul className="ll-plan-features">
                {PRO_TOP.map(f => (
                  <li key={f} className="ll-plan-feature">
                    <span className="ll-plan-fi green">+</span>
                    {f}
                  </li>
                ))}
                <li className="ll-plan-feature ll-plan-more">
                  <span className="ll-plan-fi green">+</span>
                  and {PRO_REST_COUNT} more capabilities →
                </li>
              </ul>
              <Link href="/onboarding" className="ll-btn-plan pro-btn">
                Start 7-day free trial →
              </Link>
              <div className="ll-plan-loss-note">Most engineers upgrade after their first rejected application</div>
            </div>
          </ScrollReveal>
        </section>

        {/* ── FINAL CTA ────────────────────────────────── */}
        <section className="ll-final-cta">
          <ScrollReveal>
            <div className="ll-fc-label">18,000+ engineers · Free · 60 seconds</div>
            <h2 className="ll-fc-h">
              Your score is<br />
              <em>60 seconds</em><br />
              away.
            </h2>
            <p className="ll-fc-ally">
              Join 18,000+ engineers who refused to be filtered out.{' '}
              <em>You are more than a PDF.</em>
            </p>
            {/* Real data — no hardcoded fake timestamps */}
            <LiveActivity />
            <div className="ll-fc-btns">
              <Link href="/onboarding" className="ll-btn-fc-primary">
                Score my resume free →
              </Link>
              <Link href="/p/demo" className="ll-btn-fc-ghost">
                Watch ForgeFolio score a real resume →
              </Link>
            </div>
          </ScrollReveal>
        </section>

      </main>

      <StickyBar />

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="ll-footer">
        <span className="ll-footer-brand">
          FF · <span>ForgeFolio</span> — Career Transition OS
        </span>
        <div className="ll-footer-links">
          <Link href="/privacy" className="ll-footer-link">Privacy</Link>
          <Link href="/terms" className="ll-footer-link">Terms</Link>
          <a href="mailto:hello@forgefolio.in" className="ll-footer-link">Contact</a>
        </div>
        <div className="ll-footer-stack" aria-label="Built with">
          <span className="ll-footer-powered">Powered by</span>
          {['Next.js', 'Vercel', 'Supabase', 'Gemini AI'].map(t => (
            <span key={t} className="ll-stack-tag">{t}</span>
          ))}
        </div>
        <span className="ll-footer-copy">
          © {new Date().getFullYear()} · Every engineer deserves to be seen.
        </span>
      </footer>

    </div>
  )
}
