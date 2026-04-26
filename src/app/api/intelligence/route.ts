import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { generateIntelligenceReport } from '@/lib/ai'
import { proGate } from '@/lib/pro-gate'
import type { Portfolio } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const { portfolioId } = await req.json() as { portfolioId: string }
    if (!portfolioId) {
      return NextResponse.json({ error: 'portfolioId required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const gate = await proGate(supabase, user.id)
    if (gate) return gate

    // Fetch portfolio
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
    const role     = p.data?.role ?? p.data?.headline ?? 'Professional'
    const field    = p.field ?? 'other'
    const skills   = p.data?.skills ?? []
    const yearsExp = (p.data?.experience?.length ?? 0) * 2  // rough estimate
    const score    = p.score ?? 60

    const report = await generateIntelligenceReport(
      portfolioId,
      role,
      field,
      skills,
      yearsExp,
      score,
    )

    return NextResponse.json(report)
  } catch (err) {
    console.error('[intelligence]', err)
    return NextResponse.json({ error: 'Failed to generate intelligence' }, { status: 500 })
  }
}
