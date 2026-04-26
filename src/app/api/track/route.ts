import { createClient } from '@supabase/supabase-js'
import { anonymizeIp } from '@/lib/rate-limit'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const supabase = getSupabase();
  let body: Record<string, unknown>;
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    body = await request.json();
  } else {
    const text = await request.text();
    try {
      body = JSON.parse(text);
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }
  }

  const { portfolioId, referrer, duration, type } = body as {
    portfolioId: string;
    referrer?: string;
    duration?: number;
    type?: string;
  };

  if (!portfolioId) {
    return new Response('Missing portfolioId', { status: 400 });
  }

  const rawIp =
    request.headers.get('x-vercel-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'

  // Anonymize to /24 (IPv4) or /48 (IPv6) for GDPR compliance — we never store exact IPs
  const safeIp = anonymizeIp(rawIp)

  if (type === 'duration_update' && duration) {
    // PostgREST doesn't support order/limit on updates — fetch the latest row ID first
    const { data: latest } = await supabase
      .from('analytics')
      .select('id')
      .eq('portfolio_id', portfolioId)
      .eq('visitor_ip', safeIp)
      .order('visited_at', { ascending: false })
      .limit(1)
      .single();

    if (latest?.id) {
      await supabase
        .from('analytics')
        .update({ duration_seconds: duration })
        .eq('id', latest.id);
    }
    return new Response('ok', { status: 200 });
  }

  let geo = { city: 'Unknown', country: 'Unknown', org: '' }
  // Use the full (non-anonymized) IP for geo lookup only — the IP is not stored
  const lookupIp = rawIp !== 'unknown' ? rawIp : null
  if (lookupIp) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      const geoRes = await fetch(
        `https://ip-api.com/json/${lookupIp}?fields=city,country,org`,
        { signal: controller.signal }
      )
      clearTimeout(timeout)
      if (geoRes.ok) {
        const geoData = await geoRes.json()
        if (geoData.status !== 'fail') {
          geo = {
            city:    geoData.city    || 'Unknown',
            country: geoData.country || 'Unknown',
            org:     geoData.org     || '',
          }
        }
      }
      // 429 from ip-api (rate limited) — silently proceed with defaults
    } catch {
      // Network error or timeout — proceed with defaults
    }
  }

  const { error: insertError } = await supabase.from('analytics').insert({
    portfolio_id: portfolioId,
    visitor_ip: safeIp,
    company: geo.org,
    city: geo.city,
    country: geo.country,
    referrer: referrer || 'direct',
    user_agent: request.headers.get('user-agent') || '',
    duration_seconds: null,
  });

  if (!insertError) {
    await supabase.rpc('increment_view_count', { p_portfolio_id: portfolioId });
  }

  return new Response('ok', { status: 200 });
}
