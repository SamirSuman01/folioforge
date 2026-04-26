import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { generatePortfolioSections } from '@/lib/ai'
import { rateLimit, getClientId } from '@/lib/rate-limit'
import type { ExtractedData } from '@/store/onboarding'

// POST /api/generate
// Body: { extractedData: ExtractedData, field: string }
// Returns: { sections: GeneratedSection[], score: number }
// Auth optional: unauthenticated calls are allowed for the onboarding flow
// (user sees portfolio before signing up). Rate limits differ:
//   authenticated  → 20/hour by user ID
//   unauthenticated → 5/hour by IP (stricter — no account to blame)
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Authenticated path — generous limit
    const rl = rateLimit(user.id, 'generate', 20, 60 * 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: { message: 'Too many requests. Please wait before generating again.' } },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetMs - Date.now()) / 1000)) } }
      )
    }
  } else {
    // Unauthenticated path — onboarding flow. Strict IP-based limit.
    const clientId = getClientId(request)
    const rl = rateLimit(clientId, 'generate-anon', 5, 60 * 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: { message: 'Too many requests. Please wait before generating again.' } },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetMs - Date.now()) / 1000)) } }
      )
    }
  }

  try {
    // Size guard — prevent giant payloads from being embedded in prompts
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 100_000) {
      return NextResponse.json(
        { error: { message: 'Request body too large.' } },
        { status: 413 }
      )
    }

    const body = await request.json()
    const { extractedData, field } = body as {
      extractedData: ExtractedData
      field: string
    }

    if (!extractedData) {
      return NextResponse.json(
        { error: { message: 'Missing extractedData' } },
        { status: 400 }
      )
    }

    const result = await generatePortfolioSections(extractedData, field || 'other')
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    return NextResponse.json(
      { error: { message } },
      { status: 500 }
    )
  }
}
