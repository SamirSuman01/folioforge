import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createClient()
    const since    = new Date(Date.now() - 86_400_000).toISOString()

    const [{ count }, { data: recent }] = await Promise.all([
      supabase
        .from('portfolios')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since),
      supabase
        .from('score_history')
        .select('score')
        .order('recorded_at', { ascending: false })
        .limit(1),
    ])

    return NextResponse.json(
      { today: count ?? 0, latestScore: recent?.[0]?.score ?? null },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
    )
  } catch {
    return NextResponse.json({ today: 0, latestScore: null })
  }
}
