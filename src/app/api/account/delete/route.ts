import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// POST /api/account/delete
// Permanently deletes the authenticated user's account and all their data.
// Requires the user to have an active session.
export async function POST() {
  // Verify the caller is authenticated
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 503 })
  }

  // Service role client — required to delete from auth.users
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  )

  // Delete all user data from public tables first (RLS bypass via service role)
  // Order matters: child tables before parent tables
  const userId = user.id

  try {
    // Fetch portfolio IDs first — needed to delete analytics (portfolio_id FK)
    const { data: portfolios } = await admin.from('portfolios').select('id').eq('user_id', userId)
    const portfolioIds = (portfolios ?? []).map((p: { id: string }) => p.id)

    await Promise.all([
      portfolioIds.length > 0
        ? admin.from('analytics').delete().in('portfolio_id', portfolioIds)
        : Promise.resolve(),
      admin.from('score_history').delete().eq('user_id', userId),
      admin.from('applications').delete().eq('user_id', userId),
      admin.from('connections').delete().eq('user_id', userId),
      admin.from('target_companies').delete().eq('user_id', userId),
      admin.from('outreach_messages').delete().eq('user_id', userId),
    ])

    await admin.from('portfolios').delete().eq('user_id', userId)
    await admin.from('profiles').delete().eq('id', userId)

    // Delete the auth user — this is irreversible
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) {
      console.error('[account/delete] auth.admin.deleteUser failed:', error.message)
      return NextResponse.json({ error: 'Failed to delete account. Please contact support.' }, { status: 500 })
    }
  } catch (err) {
    console.error('[account/delete] Unexpected error:', err)
    return NextResponse.json({ error: 'Deletion failed — please contact support.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
