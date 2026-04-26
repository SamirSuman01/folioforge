import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Size guard — reject oversized payloads before DB write
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 500_000) {
    return NextResponse.json({ error: 'Request body too large.' }, { status: 413 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { data: portfolioData, template, field, raw_linkedin_text, slug, score } = body;

  // Generate slug from name if not provided — guard against null/empty name
  const rawName = (portfolioData?.name ?? '').toString().trim() || 'portfolio'
  const finalSlug = slug || rawName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `portfolio-${Math.random().toString(36).slice(2, 8)}`

  const { data, error } = await supabase
    .from('portfolios')
    .insert({
      user_id: user.id,
      slug: finalSlug,
      template: template || 'system-dark',
      data: portfolioData,
      field: field || 'cs',
      raw_linkedin_text: (raw_linkedin_text || '').slice(0, 50_000),
      is_published: false,
      is_pro: false,
      score: typeof score === 'number' ? score : null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique slug conflict — append random suffix
      const retrySlug = `${finalSlug}-${Math.random().toString(36).slice(2, 6)}`;
      const { data: retryData, error: retryError } = await supabase
        .from('portfolios')
        .insert({
          user_id: user.id,
          slug: retrySlug,
          template: template || 'system-dark',
          data: portfolioData,
          field: field || 'cs',
          raw_linkedin_text: (raw_linkedin_text || '').slice(0, 50_000),
          is_published: false,
          is_pro: false,
          score: typeof score === 'number' ? score : null,
        })
        .select()
        .single();

      if (retryError) {
        return NextResponse.json({ error: retryError.message }, { status: 500 });
      }
      await seedScoreHistory(supabase, retryData.id, user.id, score)
      return NextResponse.json(retryData);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await seedScoreHistory(supabase, data.id, user.id, score)
  return NextResponse.json(data);
}

async function seedScoreHistory(
  supabase: ReturnType<typeof import('@/lib/supabase-server').createClient>,
  portfolioId: string,
  userId: string,
  score: unknown
) {
  if (typeof score !== 'number') return
  supabase.from('score_history').insert({
    portfolio_id: portfolioId,
    user_id:      userId,
    score,
    recorded_at:  new Date().toISOString(),
  }).then(({ error }) => {
    if (error) console.error('[score_history] insert failed:', error.message)
  })
}
