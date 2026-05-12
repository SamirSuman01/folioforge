import { NextResponse }        from 'next/server'
import { createClient }        from '@/lib/supabase-server'
import { generateATSReport }   from '@/lib/ai'
import { rateLimit }           from '@/lib/rate-limit'
import type { PortfolioData }  from '@/lib/types'

export async function POST(req: Request) {
  try {
    const body = await req.json() as { portfolioId?: string; jd?: string }
    const { portfolioId, jd } = body

    if (!jd?.trim()) {
      return NextResponse.json({ error: 'Job description required' }, { status: 400 })
    }
    if (jd.trim().length < 200) {
      return NextResponse.json(
        { error: 'Job description too short — need at least 200 characters for accurate analysis' },
        { status: 422 },
      )
    }
    if (!portfolioId) {
      return NextResponse.json({ error: 'Portfolio ID required' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = rateLimit(user.id, 'ats', 15, 60 * 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before running another analysis.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetMs - Date.now()) / 1000)) } }
      )
    }

    // Fetch portfolio — verify ownership in the same query
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('data')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single()

    if (!portfolio?.data) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    const report = await generateATSReport(jd.trim(), portfolio.data as PortfolioData)
    return NextResponse.json(report)
  } catch (err) {
    console.error('[ats]', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
