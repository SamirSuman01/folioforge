import { NextResponse }         from 'next/server'
import { createClient }         from '@/lib/supabase-server'
import { generateGhostReport }  from '@/lib/ai'
import { proGate }              from '@/lib/pro-gate'
import { rateLimit }            from '@/lib/rate-limit'

type PostingAge = '< 2 weeks' | '2–4 weeks' | '1–2 months' | '2+ months' | null

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      jd:          string
      postingAge?: PostingAge
    }

    const { jd, postingAge = null } = body

    if (!jd?.trim()) {
      return NextResponse.json({ error: 'Job description required' }, { status: 400 })
    }
    if (jd.trim().length < 150) {
      return NextResponse.json(
        { error: 'Job description too short — need at least 150 characters for accurate analysis' },
        { status: 422 }
      )
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = rateLimit(user.id, 'ghost', 20, 60 * 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before running another analysis.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetMs - Date.now()) / 1000)) } }
      )
    }

    const gate = await proGate(supabase, user.id)
    if (gate) return gate

    const report = await generateGhostReport(jd.trim(), postingAge)
    return NextResponse.json(report)
  } catch (err) {
    console.error('[ghost]', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
