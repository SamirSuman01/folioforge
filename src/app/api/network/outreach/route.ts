import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { generateOutreachMessage } from '@/lib/ai'
import type { Connection } from '@/lib/types'

export async function POST(req: Request) {
  try {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { connection, targetRole, targetCompany, portfolioId } = body as {
    connection:    Connection
    targetRole:    string
    targetCompany: string
    portfolioId?:  string
  }

  if (!connection || !targetRole || !targetCompany) {
    return NextResponse.json({ error: 'connection, targetRole, targetCompany required' }, { status: 400 })
  }

  // Fetch user's skills from portfolio if provided
  let userRole   = 'Professional'
  let userSkills: string[] = []

  if (portfolioId) {
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('data, headline')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single()

    if (portfolio) {
      userRole   = (portfolio.data as { role?: string })?.role ?? portfolio.headline ?? 'Professional'
      userSkills = (portfolio.data as { skills?: string[] })?.skills ?? []
    }
  }

  const message = await generateOutreachMessage(
    connection,
    targetRole,
    targetCompany,
    userRole,
    userSkills,
  )

  return NextResponse.json(message)
  } catch (err) {
    console.error('[outreach]', err)
    return NextResponse.json({ error: 'Failed to generate message' }, { status: 500 })
  }
}
