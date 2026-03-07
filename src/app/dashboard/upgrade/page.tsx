'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppNav from '@/components/ui/AppNav';

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <UpgradeContent />
    </Suspense>
  );
}

function UpgradeContent() {
  const searchParams = useSearchParams();
  const portfolioId = searchParams.get('id') || '';
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    const res = await fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portfolioId, interval }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
      alert(data.error || 'Failed to create checkout session.');
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <AppNav rightContent={
        <Link href="/dashboard" className="text-bone4 text-sm hover:text-bone3 transition-colors">Dashboard</Link>
      } />

      <div className="max-w-2xl mx-auto px-5 lg:px-8 py-14 text-center animate-[fadeInUp_0.4s_ease-out]">
        <h1 className="text-2xl font-bold text-bone mb-2 font-display">Upgrade to Pro</h1>
        <p className="text-bone3 text-sm mb-8">
          See who views your portfolio. Unlock all templates. Remove the badge.
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center gap-0.5 bg-bg2 border border-white/[0.04] rounded-full p-0.5 mb-10">
          <button onClick={() => setInterval('monthly')}
            className={`px-5 py-2 rounded-full text-sm transition-all ${interval === 'monthly' ? 'bg-accent text-bg font-semibold' : 'text-bone4 hover:text-bone3'}`}>
            Monthly
          </button>
          <button onClick={() => setInterval('yearly')}
            className={`px-5 py-2 rounded-full text-sm transition-all ${interval === 'yearly' ? 'bg-accent text-bg font-semibold' : 'text-bone4 hover:text-bone3'}`}>
            Yearly <span className="text-[10px] opacity-70">-25%</span>
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-8">
          {/* Free */}
          <div className="bg-bg2 border border-white/[0.04] rounded-xl p-6">
            <p className="text-bone4 text-[10px] font-mono uppercase tracking-wider mb-2">Free</p>
            <div className="text-2xl font-bold text-bone mb-1">$0</div>
            <p className="text-bone4 text-xs mb-5">forever</p>
            <ul className="space-y-2.5">
              {[
                { text: '3 free templates', ok: true },
                { text: 'AI portfolio generation', ok: true },
                { text: 'Basic view count', ok: true },
                { text: 'Visitor tracking', ok: false },
                { text: 'Premium templates', ok: false },
                { text: 'No badge', ok: false },
              ].map((f, i) => (
                <li key={i} className={`flex items-center gap-2 text-sm ${f.ok ? 'text-bone2' : 'text-bone4/50 line-through'}`}>
                  <span className={f.ok ? 'text-success/60' : 'text-bone4/30'}>{f.ok ? '+' : '-'}</span>
                  {f.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="bg-bg2 border border-accent/10 rounded-xl p-6 relative">
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-accent text-bg text-[9px] font-bold rounded-full font-mono uppercase tracking-wider">
              Popular
            </span>
            <p className="text-accent text-[10px] font-mono uppercase tracking-wider mb-2">Pro</p>
            <div className="text-2xl font-bold text-accent mb-1">
              {interval === 'monthly' ? '$8' : '$6'}
              <span className="text-bone4 text-sm font-normal">/mo</span>
            </div>
            <p className="text-bone4 text-xs mb-5">
              {interval === 'yearly' ? 'billed $72/year' : 'billed monthly'}
            </p>
            <ul className="space-y-2.5 mb-6">
              {['Company visitor tracking', 'Referrer analytics', 'All 5 templates', 'No FolioForge badge', 'Priority AI rewrites', 'Export CSV'].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-bone2 text-sm">
                  <span className="text-success/60">+</span>
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={handleUpgrade} disabled={loading}
              className="w-full py-2.5 bg-accent text-bg text-sm font-bold rounded-lg hover:bg-accent2 transition-colors disabled:opacity-50">
              {loading ? 'Redirecting...' : `Upgrade — ${interval === 'monthly' ? '$8/mo' : '$72/yr'}`}
            </button>
            <p className="text-bone4 text-[10px] mt-2.5 text-center">Cancel anytime. Powered by Stripe.</p>
          </div>
        </div>

        <Link href="/dashboard" className="text-bone4 text-sm hover:text-bone3 transition-colors">Maybe later</Link>
      </div>
    </div>
  );
}
