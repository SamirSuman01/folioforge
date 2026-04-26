import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { analyzeWarmPaths } from '@/lib/ai'
import type { Connection, TargetCompany } from '@/lib/types'

export async function POST(req: Request) {
  try {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { portfolioId } = body as { portfolioId?: string }

  // Load connections + targets in parallel
  const [{ data: conns }, { data: targets }] = await Promise.all([
    supabase.from('connections').select('*').eq('user_id', user.id),
    supabase.from('target_companies').select('*').eq('user_id', user.id),
  ])

  const connections = (conns ?? []) as Connection[]
  const targetList  = (targets ?? []) as TargetCompany[]

  if (!connections.length || !targetList.length) {
    return NextResponse.json([])
  }

  let userRole = 'Professional'
  if (portfolioId) {
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('data, headline')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single()

    if (portfolio) {
      userRole = (portfolio.data as { role?: string })?.role ?? portfolio.headline ?? 'Professional'
    }
  }

  const paths = await analyzeWarmPaths(connections, targetList, userRole)
  return NextResponse.json(paths)
  } catch (err) {
    console.error('[warm-paths]', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
