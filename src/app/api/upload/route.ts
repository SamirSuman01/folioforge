import { NextResponse } from 'next/server'
import { extractDataFromText } from '@/lib/ai'
import { rateLimit, getClientId } from '@/lib/rate-limit'

// POST /api/upload
// Body: { type: 'text', text: string } | { type: 'linkedin', url: string }
// Returns: { extracted: ExtractedData }
// No auth required — called from onboarding before signup. Pure AI extraction, no DB writes.
export async function POST(request: Request) {
  // Rate limit by IP: 15 extractions per hour (unauthenticated endpoint)
  const clientId = getClientId(request)
  const rl = rateLimit(clientId, 'upload', 15, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: { message: 'Too many requests. Please wait before trying again.' } },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetMs - Date.now()) / 1000)) } }
    )
  }

  try {
    const body = await request.json()
    const { type, text } = body

    if (type === 'linkedin') {
      // We can't scrape LinkedIn directly (bot protection + ToS).
      // Return a helpful error directing the user to paste their text.
      return NextResponse.json(
        {
          error: {
            message:
              'LinkedIn URL import is not yet supported. Please use "Paste your resume" instead — just copy from your LinkedIn profile page.',
          },
        },
        { status: 422 }
      )
    }

    if (type === 'text') {
      if (!text || typeof text !== 'string' || text.trim().length < 50) {
        return NextResponse.json(
          { error: { message: 'Please add at least a few sentences about your experience.' } },
          { status: 400 }
        )
      }

      // Cap at 50KB — large resumes don't add accuracy, just cost
      const capped = text.trim().slice(0, 50_000)
      const extracted = await extractDataFromText(capped)
      return NextResponse.json({ extracted })
    }

    // Legacy: PDF via FormData (kept for backward compat)
    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: { message: 'Use the JSON API: { type: "text", text: "..." }' } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { message: 'Invalid request. Use type: "text" or "linkedin".' } },
      { status: 400 }
    )
  } catch {
    return NextResponse.json(
      { error: { message: 'Extraction failed. Please try again.' } },
      { status: 500 }
    )
  }
}
