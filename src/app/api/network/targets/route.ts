import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import type { TargetCompany } from '@/lib/types'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('target_companies')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { company_name, target_role, priority, status, notes } = body as Partial<TargetCompany>

  if (!company_name?.trim()) return NextResponse.json({ error: 'company_name required' }, { status: 400 })

  const { data, error } = await supabase
    .from('target_companies')
    .insert({
      user_id:      user.id,
      company_name: company_name.trim(),
      target_role:  target_role?.trim()  ?? '',
      priority:     priority             ?? 'medium',
      status:       status               ?? 'researching',
      notes:        notes?.trim()        ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { id, ...rawUpdates } = body as Partial<TargetCompany> & { id: string }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const ALLOWED = new Set(['company_name', 'target_role', 'priority', 'status', 'notes'])
  const updates: Record<string, unknown> = {}
  for (const key of Object.keys(rawUpdates)) {
    if (ALLOWED.has(key)) updates[key] = rawUpdates[key as keyof typeof rawUpdates]
  }

  const { data, error } = await supabase
    .from('target_companies')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { id } = body as { id: string }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('target_companies')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
