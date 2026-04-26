import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { score_total, ...portfolioBody } = body

  // Whitelist allowed update fields — prevents mass-assignment of user_id, is_pro, etc.
  const ALLOWED = new Set(['data', 'template', 'is_published', 'slug'])
  const safeBody: Record<string, unknown> = {}
  for (const key of Object.keys(portfolioBody)) {
    if (ALLOWED.has(key)) safeBody[key] = portfolioBody[key]
  }
  if (score_total !== undefined) safeBody.score = score_total

  const { data, error } = await supabase
    .from('portfolios')
    .update({ ...safeBody, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Persist score snapshot for timeline
  if (score_total !== undefined) {
    supabase.from('score_history').insert({
      portfolio_id: id,
      user_id:      user.id,
      score:        score_total,
      recorded_at:  new Date().toISOString(),
    }).then(({ error }) => {
      if (error) console.error('[score_history] insert failed:', error.message)
    })
  }

  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('portfolios')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
