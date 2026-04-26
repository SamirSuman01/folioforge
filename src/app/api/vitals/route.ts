import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  const start = Date.now()
  let db: 'ok' | 'error' = 'ok'

  try {
    const supabase = createClient()
    const { error } = await supabase.from('portfolios').select('id').limit(1)
    if (error) db = 'error'
  } catch {
    db = 'error'
  }

  return NextResponse.json({
    status: db === 'ok' ? 'ok' : 'degraded',
    db,
    latency_ms: Date.now() - start,
    ts: new Date().toISOString(),
    version: '1.0',
  }, { status: db === 'ok' ? 200 : 503 })
}
