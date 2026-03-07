import { createClient } from '@supabase/supabase-js';

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

  const ip =
    request.headers.get('x-vercel-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  const ipRegex = /^[\d.]+$|^[\da-fA-F:]+$/;
  const safeIp = ipRegex.test(ip) ? ip : 'unknown';

  if (type === 'duration_update' && duration) {
    await supabase
      .from('analytics')
      .update({ duration_seconds: duration })
      .eq('portfolio_id', portfolioId)
      .eq('visitor_ip', safeIp)
      .order('visited_at', { ascending: false })
      .limit(1);
    return new Response('ok', { status: 200 });
  }

  let geo = { city: 'Unknown', country: 'Unknown', org: '' };
  if (safeIp !== 'unknown') {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const geoRes = await fetch(
        `https://ip-api.com/json/${safeIp}?fields=city,country,org`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      const geoData = await geoRes.json();
      geo = {
        city: geoData.city || 'Unknown',
        country: geoData.country || 'Unknown',
        org: geoData.org || '',
      };
    } catch {
      // Geo lookup failed — proceed with defaults
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
