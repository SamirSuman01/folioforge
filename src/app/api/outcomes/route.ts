import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// POST — snapshot portfolio state at moment of offer acceptance.
// Writes to offer_outcomes table (create if not exists via migration).
// Fire-and-forget from client — fails gracefully if table missing.
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { application_id, company, role } = body as {
    application_id: string
    company:        string
    role:           string
  }

  if (!application_id || !company || !role) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Get the user's best published portfolio at this moment
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('id, score')
    .eq('user_id', user.id)
    .eq('is_published', true)
    .order('score', { ascending: false })
    .limit(1)
    .single()

  const { error } = await supabase
    .from('offer_outcomes')
    .upsert({
      user_id:        user.id,
      application_id,
      company,
      role,
      portfolio_id:   portfolio?.id   ?? null,
      portfolio_score: portfolio?.score ?? null,
      accepted_at:    new Date().toISOString(),
    }, { onConflict: 'application_id' })

  // If table doesn't exist yet (pre-migration), fail silently
  if (error && error.code === '42P01') {
    return NextResponse.json({ ok: false, reason: 'table_missing' })
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, portfolio_score: portfolio?.score ?? null })
}
