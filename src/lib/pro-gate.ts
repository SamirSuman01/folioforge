import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Returns a 403 NextResponse if the user has no Pro portfolio.
 * Returns null if the user IS pro (i.e. no gate needed).
 *
 * Usage:
 *   const gate = await proGate(supabase, user.id)
 *   if (gate) return gate
 */
export async function proGate(
  supabase: SupabaseClient,
  userId: string
): Promise<NextResponse | null> {
  const { data } = await supabase
    .from('portfolios')
    .select('id')
    .eq('user_id', userId)
    .eq('is_pro', true)
    .limit(1)

  if (!data?.length) {
    return NextResponse.json(
      { error: 'Pro subscription required', upgrade: true },
      { status: 403 }
    )
  }
  return null
}
