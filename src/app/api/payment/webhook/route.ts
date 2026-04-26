import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig  = request.headers.get('x-razorpay-signature')
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!sig || !secret) {
    return new Response('Missing signature or webhook secret', { status: 400 })
  }

  const expected = createHmac('sha256', secret).update(body).digest('hex')
  if (expected !== sig) {
    return new Response('Invalid signature', { status: 400 })
  }

  let event: { event: string; payload: Record<string, unknown> }
  try {
    event = JSON.parse(body)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const supabase = getSupabase()

  // subscription.activated → grant Pro
  if (event.event === 'subscription.activated' || event.event === 'payment.captured') {
    const notes = (
      (event.payload?.subscription as { entity?: { notes?: { userId?: string } } })?.entity?.notes ??
      (event.payload?.payment     as { entity?: { notes?: { userId?: string } } })?.entity?.notes
    ) as { userId?: string } | undefined

    const userId = notes?.userId
    if (userId) {
      await supabase.from('profiles').update({ is_pro: true }).eq('id', userId)
      await supabase.from('portfolios').update({ is_pro: true }).eq('user_id', userId)
    }
  }

  // subscription.cancelled / subscription.halted → revoke Pro
  if (event.event === 'subscription.cancelled' || event.event === 'subscription.halted') {
    const notes = (
      event.payload?.subscription as { entity?: { notes?: { userId?: string } } }
    )?.entity?.notes as { userId?: string } | undefined

    const userId = notes?.userId
    if (userId) {
      await supabase.from('profiles').update({ is_pro: false }).eq('id', userId)
      await supabase.from('portfolios').update({ is_pro: false }).eq('user_id', userId)
    }
  }

  return new Response('ok', { status: 200 })
}
