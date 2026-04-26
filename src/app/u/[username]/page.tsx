import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { PortfolioData } from '@/lib/types'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function scoreGrade(s: number) {
  if (s >= 95) return 'A+'
  if (s >= 88) return 'A'
  if (s >= 80) return 'B+'
  if (s >= 70) return 'B'
  if (s >= 60) return 'C+'
  if (s >= 50) return 'C'
  return 'D'
}

interface PageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  const supabase = getSupabase()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, college')
    .eq('username', username)
    .single()

  if (!profile) return { title: 'Profile not found' }

  const title = `${profile.full_name} — ForgeFolio`
  const description = profile.college
    ? `${profile.full_name} · ${profile.college}`
    : `${profile.full_name}'s career profile on ForgeFolio`

  return {
    title,
    description,
    openGraph: { title, description, type: 'profile' },
    twitter:   { card: 'summary', title, description },
  }
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params
  const supabase = getSupabase()

  // Resolve profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, college')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  // Get their best published portfolio (highest score)
  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('id, slug, data, score, template, view_count')
    .eq('user_id', profile.id)
    .eq('is_published', true)
    .order('score', { ascending: false })
    .limit(3)

  const best = portfolios?.[0] ?? null
  const portfolioData = best?.data as PortfolioData | null
  const role    = portfolioData?.role ?? portfolioData?.headline ?? null
  const tagline = portfolioData?.tagline ?? null
  const score   = best?.score as number | null
  const grade   = score != null ? scoreGrade(score) : null

  const skills  = (portfolioData?.skills ?? []).slice(0, 6)

  return (
    <div className="min-h-screen bg-background">

      {/* Nav */}
      <nav className="sticky top-0 z-40 h-12 border-b border-border bg-background">
        <div className="mx-auto flex h-full max-w-3xl items-center justify-between px-6">
          <Link href="/" className="text-micro font-mono text-text-primary hover:text-accent transition-colors">
            FF · ForgeFolio
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-14">

        {/* Identity block */}
        <div className="mb-12">
          <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-3">
            Career profile
          </span>
          <h1 className="text-h1 font-bold text-text-primary tracking-tight leading-tight mb-2">
            {profile.full_name}
          </h1>
          {role && (
            <p className="text-body text-text-secondary mb-1">{role}</p>
          )}
          {profile.college && (
            <p className="text-small font-mono text-text-disabled">{profile.college}</p>
          )}
        </div>

        {/* Signal score + portfolio CTA */}
        {best ? (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-8 border-t border-border pt-10 mb-12">

            {/* Score */}
            {score != null && (
              <div>
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-3">Signal score</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-[3.5rem] font-bold font-mono text-text-primary tabular-nums leading-none">
                    {score}
                  </span>
                  <div className="flex flex-col gap-0.5 pb-1">
                    <span className="text-small font-mono text-text-disabled">/100</span>
                    <span className="text-small font-mono text-text-disabled">Grade {grade}</span>
                  </div>
                </div>
                {tagline && (
                  <p className="text-small text-text-secondary mt-3 max-w-sm leading-relaxed">
                    {tagline}
                  </p>
                )}
              </div>
            )}

            {/* Portfolio link */}
            <div className="flex flex-col gap-3 sm:items-end justify-start pt-1">
              <Link
                href={`/p/${best.slug}`}
                className="inline-flex items-center gap-2 border border-border px-4 py-2.5 text-small text-text-primary hover:border-accent hover:text-accent transition-colors"
              >
                View portfolio →
              </Link>
              {score != null && (
                <Link
                  href={`/badge/${best.slug}`}
                  className="text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors"
                >
                  View score badge
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="border-t border-border pt-10 mb-12">
            <p className="text-small text-text-disabled">No published portfolio yet.</p>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-12">
            <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-4">Skills</span>
            <div className="flex flex-wrap gap-2">
              {skills.map(s => (
                <span
                  key={s}
                  className="border border-border px-2.5 py-1 text-small text-text-secondary font-mono"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border pt-6 flex items-center justify-between">
          <p className="text-micro font-mono text-text-disabled">
            {(process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgefolio.com').replace(/^https?:\/\//, '')}/u/{username}
          </p>
          <Link
            href="/"
            className="text-micro font-mono text-text-disabled hover:text-accent transition-colors"
          >
            Build yours →
          </Link>
        </div>
      </main>
    </div>
  )
}
