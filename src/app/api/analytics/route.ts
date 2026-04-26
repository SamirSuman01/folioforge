import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const portfolioId = searchParams.get('portfolioId');

  if (!portfolioId) {
    return NextResponse.json({ error: 'Missing portfolioId' }, { status: 400 });
  }

  // Verify user owns this portfolio
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('id, is_pro, data, slug')
    .eq('id', portfolioId)
    .eq('user_id', user.id)
    .single();

  if (!portfolio) {
    return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
  }

  // Get analytics data
  const { data: analytics, error } = await supabase
    .from('analytics')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .order('visited_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aggregate stats
  const totalViews = analytics?.length || 0;
  const uniqueIps = new Set(analytics?.map((a) => a.visitor_ip)).size;
  const durRows = (analytics ?? []).filter((a) => a.duration_seconds && a.duration_seconds > 0)
  const avgDuration = durRows.length
    ? Math.round(durRows.reduce((sum, a) => sum + a.duration_seconds, 0) / durRows.length)
    : 0;

  // Company breakdown (top 10)
  const companyMap = new Map<string, number>();
  analytics?.forEach((a) => {
    if (a.company && a.company !== '' && a.company !== 'Unknown') {
      companyMap.set(a.company, (companyMap.get(a.company) || 0) + 1);
    }
  });
  const topCompanies = Array.from(companyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // City breakdown (top 10)
  const cityMap = new Map<string, number>();
  analytics?.forEach((a) => {
    if (a.city && a.city !== 'Unknown') {
      const label = `${a.city}, ${a.country}`;
      cityMap.set(label, (cityMap.get(label) || 0) + 1);
    }
  });
  const topCities = Array.from(cityMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Referrer breakdown
  const referrerMap = new Map<string, number>();
  analytics?.forEach((a) => {
    const ref = a.referrer || 'direct';
    referrerMap.set(ref, (referrerMap.get(ref) || 0) + 1);
  });
  const topReferrers = Array.from(referrerMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Recent visitors (last 20)
  const recentVisitors = (analytics || []).slice(0, 20).map((a) => ({
    company: a.company || 'Unknown',
    city: a.city || 'Unknown',
    country: a.country || 'Unknown',
    referrer: a.referrer || 'direct',
    duration: a.duration_seconds,
    visitedAt: a.visited_at,
  }));

  const portfolioData = portfolio.data as { name?: string } | null
  const portfolioName = portfolioData?.name ?? 'Your portfolio'

  // Count identified company visits for pro gate banner
  const identifiedCompanyCount = new Set(
    (analytics || [])
      .map((a) => a.company)
      .filter((c) => c && c !== '' && c !== 'Unknown')
  ).size

  return NextResponse.json({
    totalViews,
    uniqueVisitors: uniqueIps,
    avgDuration,
    topCompanies,
    topCities,
    topReferrers,
    recentVisitors,
    isPro: portfolio.is_pro,
    portfolioName,
    identifiedCompanyCount,
  });
}
