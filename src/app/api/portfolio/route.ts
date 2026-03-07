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

  const body = await request.json();
  const { data: portfolioData, template, field, raw_linkedin_text, slug } = body;

  // Generate slug from name if not provided
  const finalSlug = slug || portfolioData.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const { data, error } = await supabase
    .from('portfolios')
    .insert({
      user_id: user.id,
      slug: finalSlug,
      template: template || 'system-dark',
      data: portfolioData,
      field: field || 'cs',
      raw_linkedin_text: raw_linkedin_text || '',
      is_published: false,
      is_pro: false,
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
          raw_linkedin_text: raw_linkedin_text || '',
          is_published: false,
          is_pro: false,
        })
        .select()
        .single();

      if (retryError) {
        return NextResponse.json({ error: retryError.message }, { status: 500 });
      }
      return NextResponse.json(retryData);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
