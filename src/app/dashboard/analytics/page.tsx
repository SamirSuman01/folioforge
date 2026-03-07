'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppNav from '@/components/ui/AppNav';

interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  avgDuration: number;
  topCompanies: { name: string; count: number }[];
  topCities: { name: string; count: number }[];
  topReferrers: { name: string; count: number }[];
  recentVisitors: {
    company: string;
    city: string;
    country: string;
    referrer: string;
    duration: number | null;
    visitedAt: string;
  }[];
  isPro: boolean;
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <AnalyticsContent />
    </Suspense>
  );
}

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const portfolioId = searchParams.get('id');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!portfolioId) { setError('No portfolio selected.'); setLoading(false); return; }
    async function load() {
      const res = await fetch(`/api/analytics?portfolioId=${portfolioId}`);
      if (!res.ok) { setError('Failed to load analytics.'); setLoading(false); return; }
      setData(await res.json());
      setLoading(false);
    }
    load();
  }, [portfolioId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <AppNav rightContent={<Link href="/dashboard" className="text-bone4 text-sm hover:text-bone3 transition-colors">Dashboard</Link>} />
        <div className="max-w-4xl mx-auto px-5 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg2 border border-white/[0.04] rounded-xl p-5 animate-pulse">
                <div className="h-7 bg-bg3/50 rounded w-14 mb-2" />
                <div className="h-3 bg-bg3/50 rounded w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-bg">
        <AppNav rightContent={<Link href="/dashboard" className="text-bone4 text-sm hover:text-bone3 transition-colors">Dashboard</Link>} />
        <div className="max-w-4xl mx-auto px-5 lg:px-8 py-10 text-center">
          <p className="text-error mb-4">{error || 'Something went wrong.'}</p>
          <Link href="/dashboard" className="text-accent text-sm hover:text-accent2">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <AppNav rightContent={<Link href="/dashboard" className="text-bone4 text-sm hover:text-bone3 transition-colors">Dashboard</Link>} />

      <div className="max-w-4xl mx-auto px-5 lg:px-8 py-10 animate-[fadeInUp_0.4s_ease-out]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-bone4 text-xs hover:text-bone3 transition-colors">Dashboard</Link>
            <h1 className="text-xl font-bold text-bone mt-1 font-display">Analytics</h1>
          </div>
          {!data.isPro && (
            <Link href={`/dashboard/upgrade?from=analytics&id=${portfolioId}`}
              className="px-4 py-2 bg-accent text-bg text-xs font-semibold rounded-lg hover:bg-accent2 transition-colors">
              Upgrade for full analytics
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <StatCard label="Total Views" value={data.totalViews.toString()} />
          <StatCard label="Unique Visitors" value={data.uniqueVisitors.toString()} />
          <StatCard label="Avg. Duration" value={data.avgDuration ? `${data.avgDuration}s` : '--'} />
        </div>

        {/* Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <BreakdownCard title="Companies" items={data.topCompanies} total={data.totalViews} isPro={data.isPro} portfolioId={portfolioId} />
          <BreakdownCard title="Locations" items={data.topCities} total={data.totalViews} isPro={data.isPro} portfolioId={portfolioId} />
          <BreakdownCard title="Referrers" items={data.topReferrers} total={data.totalViews} isPro={data.isPro} portfolioId={portfolioId} />
        </div>

        {/* Recent visitors */}
        <div className="bg-bg2 border border-white/[0.04] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.04]">
            <h3 className="text-bone text-sm font-medium">Recent Visitors</h3>
          </div>
          {data.recentVisitors.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-bone4 text-sm">No visitors yet. Share your portfolio link to start tracking.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {(data.isPro ? data.recentVisitors : data.recentVisitors.slice(0, 3)).map((v, i) => {
                let referrerDisplay = 'Direct';
                if (v.referrer && v.referrer !== 'direct') {
                  try { referrerDisplay = new URL(v.referrer).hostname; } catch { referrerDisplay = v.referrer; }
                }
                return (
                  <div key={i} className="px-5 py-3.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-bone text-sm">{v.company || 'Unknown'}</span>
                      <span className="text-bone4 text-[11px] font-mono">{timeAgo(v.visitedAt)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-bone4">
                      <span>{v.city}{v.country ? `, ${v.country}` : ''}</span>
                      <span>via {referrerDisplay}</span>
                      {v.duration && <span>{v.duration}s</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!data.isPro && data.recentVisitors.length > 3 && (
            <div className="px-5 py-4 border-t border-white/[0.04] text-center">
              <p className="text-bone4 text-xs mb-1">+{data.recentVisitors.length - 3} more visitors</p>
              <Link href={`/dashboard/upgrade?from=analytics&id=${portfolioId}`}
                className="text-accent text-xs hover:text-accent2 transition-colors">
                Unlock full visitor details
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg2 border border-white/[0.04] rounded-xl p-5">
      <div className="text-2xl font-bold text-accent font-mono">{value}</div>
      <div className="text-bone4 text-xs mt-1">{label}</div>
    </div>
  );
}

function BreakdownCard({ title, items, total, isPro, portfolioId }: {
  title: string; items: { name: string; count: number }[]; total: number; isPro: boolean; portfolioId: string | null;
}) {
  if (items.length === 0) {
    return (
      <div className="bg-bg2 border border-white/[0.04] rounded-xl p-5">
        <h3 className="text-bone text-sm font-medium mb-3">{title}</h3>
        <p className="text-bone4 text-xs">No data yet.</p>
      </div>
    );
  }

  const visible = isPro ? items : items.slice(0, 2);
  const maxCount = items[0]?.count || 1;

  return (
    <div className="bg-bg2 border border-white/[0.04] rounded-xl p-5">
      <h3 className="text-bone text-sm font-medium mb-4">{title}</h3>
      <div className="space-y-3">
        {visible.map((item, i) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const barWidth = Math.round((item.count / maxCount) * 100);
          return (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-bone2 truncate mr-2">{item.name}</span>
                <span className="text-bone4 shrink-0">{pct}%</span>
              </div>
              <div className="w-full h-1 bg-bg3/50 rounded-full overflow-hidden">
                <div className="h-full bg-accent/60 rounded-full" style={{ width: `${barWidth}%` }} />
              </div>
            </div>
          );
        })}
        {!isPro && items.length > 2 && (
          <Link href={`/dashboard/upgrade?from=analytics&id=${portfolioId}`}
            className="block text-accent text-[11px] hover:text-accent2 transition-colors pt-1">
            +{items.length - 2} more
          </Link>
        )}
      </div>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
