import { NextResponse }          from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { generateCareerMirror }  from '@/lib/ai'
import { rateLimit }             from '@/lib/rate-limit'
import type { Portfolio, PortfolioExperience } from '@/lib/types'

// Builds a structured text from the portfolio that gives the AI
// a hiring-manager's view — not a raw resume dump.
function buildPortfolioText(p: Portfolio): string {
  const d = p.data
  const lines: string[] = []

  if (d?.headline) lines.push(`Headline: ${d.headline}`)
  if (d?.about)    lines.push(`\nAbout:\n${d.about}`)

  if (d?.experience?.length) {
    lines.push('\nExperience:')
    d.experience.forEach((exp: PortfolioExperience) => {
      const header = [exp.company, exp.role ?? exp.title, exp.period].filter(Boolean).join(' — ')
      lines.push(header)
      const bullets = exp.bullets ?? exp.highlights ?? []
      bullets.forEach((b: string) => lines.push(`  • ${b}`))
      if (exp.description) lines.push(`  ${exp.description}`)
    })
  }

  if (d?.projects?.length) {
    lines.push('\nProjects:')
    d.projects.forEach(proj => {
      lines.push(`  ${proj.title}: ${proj.description}`)
      if (proj.tech?.length) lines.push(`  Tech: ${proj.tech.join(', ')}`)
    })
  }

  if (d?.skills?.length) {
    lines.push(`\nSkills: ${d.skills.join(', ')}`)
  }

  // Include raw resume/LinkedIn text as fallback for extra context
  if (p.raw_linkedin_text) {
    lines.push('\n--- Additional context from original resume ---')
    lines.push(p.raw_linkedin_text.slice(0, 3000))  // cap to avoid token overflow
  }

  return lines.join('\n')
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      portfolioId:   string
      targetRole:    string
      targetCompany?: string
    }

    const { portfolioId, targetRole, targetCompany } = body

    if (!portfolioId) {
      return NextResponse.json({ error: 'portfolioId required' }, { status: 400 })
    }
    if (!targetRole?.trim()) {
      return NextResponse.json({ error: 'targetRole required' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = rateLimit(user.id, 'mirror', 10, 60 * 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before running another analysis.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetMs - Date.now()) / 1000)) } }
      )
    }

    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single()

    if (error || !portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    const p = portfolio as Portfolio
    const portfolioText = buildPortfolioText(p)

    if (portfolioText.trim().length < 100) {
      return NextResponse.json(
        { error: 'Portfolio has too little content to analyze. Add experience and about sections first.' },
        { status: 422 }
      )
    }

    const report = await generateCareerMirror(portfolioText, targetRole.trim(), targetCompany?.trim())
    report.portfolioId = portfolioId

    return NextResponse.json(report)
  } catch (err) {
    console.error('[mirror]', err)
    return NextResponse.json({ error: 'Failed to generate Career Mirror' }, { status: 500 })
  }
}
