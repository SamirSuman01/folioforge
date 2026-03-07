'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Portfolio, Template } from '@/lib/types';
import TemplateRenderer from '@/components/templates/TemplateRenderer';
import AppNav from '@/components/ui/AppNav';

export default function DashboardPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
      const res = await fetch('/api/portfolio');
      if (res.ok) setPortfolios(await res.json());
      setLoading(false);
    }
    load();
  }, [supabase.auth]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this portfolio? This cannot be undone.')) return;
    const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' });
    if (res.ok) setPortfolios((prev) => prev.filter((p) => p.id !== id));
  }

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`);
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-bg">
      <AppNav rightContent={
        <>
          <Link href="/dashboard" className="text-bone text-sm hover:text-accent transition-colors">Portfolios</Link>
          <button onClick={handleLogout} className="text-bone4 text-sm hover:text-bone3 transition-colors">Log out</button>
          <div className="w-7 h-7 rounded-full bg-accent/15 text-accent text-xs font-bold flex items-center justify-center">
            {userName?.[0]?.toUpperCase() || '?'}
          </div>
        </>
      } />

      <div className="max-w-4xl mx-auto px-5 lg:px-8 py-10 animate-[fadeInUp_0.4s_ease-out]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-bone font-display">
              {greeting()}{userName ? `, ${userName.split(' ')[0]}` : ''}
            </h1>
            <p className="text-bone4 text-sm mt-1">
              {portfolios.length === 0 ? 'Create your first portfolio' : `${portfolios.length} portfolio${portfolios.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <Link href="/?upload=true"
            className="px-4 py-2 bg-accent text-bg font-semibold text-sm rounded-lg hover:bg-accent2 transition-colors flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
            New
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-bg2 border border-white/[0.04] rounded-xl p-5 animate-pulse">
                <div className="h-32 bg-bg3/50 rounded-lg mb-3" />
                <div className="h-4 bg-bg3/50 rounded w-1/2 mb-2" />
                <div className="h-3 bg-bg3/50 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : portfolios.length === 0 ? (
          <div className="bg-bg2 border border-white/[0.04] rounded-xl p-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center mx-auto mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" />
                <path d="M14 2v6h6" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-bone mb-2 font-display">No portfolios yet</h2>
            <p className="text-bone3 text-sm mb-6 max-w-xs mx-auto">
              Upload your resume and AI will transform it into a portfolio in under a minute.
            </p>
            <Link href="/?upload=true"
              className="inline-block px-6 py-2.5 bg-accent text-bg font-semibold text-sm rounded-lg hover:bg-accent2 transition-colors">
              Upload resume
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolios.map((portfolio) => (
              <div key={portfolio.id}
                className="bg-bg2 border border-white/[0.04] rounded-xl overflow-hidden hover:border-white/[0.08] transition-all group">
                {/* Preview */}
                <div className="h-32 overflow-hidden relative bg-bg3/20">
                  <div className="transform scale-[0.22] origin-top-left w-[454%] pointer-events-none">
                    <TemplateRenderer template={portfolio.template as Template} data={portfolio.data} showBadge={false} />
                  </div>
                  <span className="absolute top-2 right-2 text-[9px] uppercase tracking-wider text-bone4 font-mono bg-bg/60 px-1.5 py-0.5 rounded">
                    {portfolio.template.replace('-', ' ')}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs">
                      {portfolio.is_published ? (
                        <span className="flex items-center gap-1.5 text-success">
                          <span className="w-1.5 h-1.5 rounded-full bg-success" />Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-bone4">
                          <span className="w-1.5 h-1.5 rounded-full bg-bone4" />Draft
                        </span>
                      )}
                    </div>
                    <span className="text-bone4 text-xs font-mono">{portfolio.view_count || 0} views</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/editor/${portfolio.id}`}
                      className="px-3.5 py-1.5 bg-accent text-bg text-xs font-medium rounded-md hover:bg-accent2 transition-colors">
                      Edit
                    </Link>
                    {portfolio.is_published && (
                      <>
                        <Link href={`/p/${portfolio.slug}`} target="_blank"
                          className="px-3.5 py-1.5 bg-bg3/50 text-bone3 text-xs rounded-md hover:bg-bg3 hover:text-bone transition-colors">
                          View
                        </Link>
                        <button onClick={() => copyLink(portfolio.slug)}
                          className="px-3.5 py-1.5 bg-bg3/50 text-bone3 text-xs rounded-md hover:bg-bg3 hover:text-bone transition-colors">
                          Copy
                        </button>
                        <Link href={`/dashboard/analytics?id=${portfolio.id}`}
                          className="px-3.5 py-1.5 bg-bg3/50 text-bone3 text-xs rounded-md hover:bg-bg3 hover:text-bone transition-colors">
                          Stats
                        </Link>
                      </>
                    )}
                    <button onClick={() => handleDelete(portfolio.id)}
                      className="ml-auto px-2 py-1.5 text-bone4 text-xs hover:text-error transition-colors" title="Delete">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
