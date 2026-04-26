import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

function razorpayAuth() {
  const id  = process.env.RAZORPAY_KEY_ID!
  const sec = process.env.RAZORPAY_KEY_SECRET!
  return 'Basic ' + Buffer.from(`${id}:${sec}`).toString('base64')
}

async function getOrCreatePlan(auth: string): Promise<string> {
  // Return cached plan ID if set
  if (process.env.RAZORPAY_PLAN_ID) return process.env.RAZORPAY_PLAN_ID

  // List existing plans and reuse if found
  const listRes = await fetch('https://api.razorpay.com/v1/plans?count=10', {
    headers: { Authorization: auth },
  })
  const list = await listRes.json()
  const existing = (list.items ?? []).find(
    (p: { item?: { amount?: number }; period?: string }) =>
      p.item?.amount === 29900 && p.period === 'monthly'
  )
  if (existing?.id) return existing.id as string

  // Create the plan
  const createRes = await fetch('https://api.razorpay.com/v1/plans', {
    method:  'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      period:   'monthly',
      interval: 1,
      item: { name: 'ForgeFolio Pro', amount: 29900, currency: 'INR', unit: 'month' },
      notes: { product: 'forgefolio_pro' },
    }),
  })
  const plan = await createRes.json()
  if (!plan.id) throw new Error('Failed to create Razorpay plan')
  return plan.id as string
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
  }

  const auth = razorpayAuth()

  try {
    const planId = await getOrCreatePlan(auth)

    // Trial: start_at 7 days from now (Unix timestamp)
    const startAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60

    const subRes = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method:  'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id:         planId,
        total_count:     120, // 10 years max
        quantity:        1,
        start_at:        startAt,
        customer_notify: 1,
        notes: { userId: user.id, email: user.email },
      }),
    })

    const sub = await subRes.json()
    if (!sub.id) throw new Error(sub.error?.description ?? 'Failed to create subscription')

    return NextResponse.json({
      subscriptionId: sub.id,
      keyId:          process.env.RAZORPAY_KEY_ID,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create payment'
    console.error('[payment/create]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
