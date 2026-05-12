import { NextResponse }       from 'next/server'
import { createClient }       from '@/lib/supabase-server'
import { generateOfferReport } from '@/lib/ai'
import { rateLimit }          from '@/lib/rate-limit'
import type { OfferInput }    from '@/lib/types'

export async function POST(req: Request) {
  try {
    const body = await req.json() as Partial<OfferInput>

    if (!body.company?.trim())       return NextResponse.json({ error: 'Company name required' }, { status: 400 })
    if (!body.role?.trim())          return NextResponse.json({ error: 'Role required' }, { status: 400 })
    if (!body.location?.trim())      return NextResponse.json({ error: 'Location required' }, { status: 400 })
    if (!body.seniority)             return NextResponse.json({ error: 'Seniority required' }, { status: 400 })
    if (typeof body.is_public !== 'boolean') return NextResponse.json({ error: 'Company type required' }, { status: 400 })
    if (!body.base_salary || body.base_salary <= 0)
      return NextResponse.json({ error: 'Valid base salary required' }, { status: 400 })

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rl = rateLimit(user.id, 'offer', 10, 60 * 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before running another analysis.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetMs - Date.now()) / 1000)) } }
      )
    }

    const input: OfferInput = {
      company:          body.company.trim(),
      is_public:        body.is_public,
      role:             body.role.trim(),
      seniority:        body.seniority,
      location:         body.location.trim(),
      base_salary:      body.base_salary,
      equity_annual:    body.equity_annual    ?? null,
      competing_offer:  body.competing_offer  ?? null,
      current_comp:     body.current_comp     ?? null,
      other_comp:       body.other_comp       ?? null,
    }

    const report = await generateOfferReport(input)
    return NextResponse.json(report)
  } catch (err) {
    console.error('[offer]', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
