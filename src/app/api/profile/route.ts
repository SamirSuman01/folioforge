import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// Slugify full name → "Samir Suman" → "samir-suman"
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
}

// POST — upsert profile for authenticated user
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
  const { full_name, college } = body as { full_name?: string; college?: string }
  const name = (full_name ?? user.user_metadata?.full_name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'full_name required' }, { status: 400 })

  const base = slugify(name)

  // Check if this user already has a profile (keep their username stable)
  const { data: existing } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  let username = existing?.username ?? base

  // If new profile, check for collisions and dedupe
  if (!existing) {
    let attempt = base
    let suffix  = 2
    while (true) {
      const { data: collision } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', attempt)
        .single()
      if (!collision) { username = attempt; break }
      attempt = `${base}-${suffix++}`
    }
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id:         user.id,
      username,
      full_name:  name,
      college:    college ?? user.user_metadata?.college ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ username })
}

// GET — return current user's profile
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('profiles')
    .select('username, full_name, college')
    .eq('id', user.id)
    .single()

  return NextResponse.json(data ?? { username: null })
}
