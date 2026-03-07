'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import AppNav from '@/components/ui/AppNav';
import { roastPortfolio, type RoastResult } from '@/lib/roast-engine';
import { scorePortfolio, type ScoreBreakdown } from '@/lib/portfolio-score';
import type { PortfolioData, Field } from '@/lib/types';

const SAMPLES: { label: string; tag: string; tagColor: string; data: PortfolioData }[] = [
  {
    label: 'Junior Dev — Vague',
    tag: 'Weak',
    tagColor: 'text-error bg-error/10',
    data: {
      name: 'John Smith', role: 'Software Developer',
      tagline: 'Passionate and driven software developer', stats: [],
      experience: [
        { company: 'TechCorp', title: 'Developer', period: '', bullets: ['Worked on various projects', 'Helped with the backend'] },
        { company: 'StartupXYZ', title: 'Intern', period: '2022', bullets: ['Assisted team with tasks'] },
      ],
      education: [], skills: ['JavaScript', 'Python'],
    },
  },
  {
    label: 'Designer — No Metrics',
    tag: 'Weak',
    tagColor: 'text-error bg-error/10',
    data: {
      name: 'Sarah Lee', role: 'UI/UX Designer',
      tagline: 'Creative designer who loves making beautiful interfaces', stats: [],
      experience: [
        { company: 'DesignStudio', title: 'UI Designer', period: '2021 – 2023', bullets: ['Designed mobile apps', 'Created wireframes and prototypes', 'Worked closely with developers'] },
      ],
      education: [{ institution: 'Art Institute', degree: 'BFA Design', year: '2021' }],
      skills: ['Figma', 'Sketch', 'Adobe XD', 'CSS'],
    },
  },
  {
    label: 'Marketer — Buzzwords',
    tag: 'Medium',
    tagColor: 'text-warning bg-warning/10',
    data: {
      name: 'Chris Taylor', role: 'Digital Marketing Manager',
      tagline: 'Results-driven marketing professional with a passion for growth',
      stats: [{ label: 'Campaigns', value: '50+' }],
      experience: [
        {
          company: 'GrowthCo', title: 'Marketing Manager', period: '2020 – Present',
          bullets: [
            'Spearheaded innovative digital marketing campaigns across multiple channels',
            'Leveraged cutting-edge analytics to optimize funnel performance',
            'Synergized cross-functional teams to deliver best-in-class brand experiences',
          ],
        },
      ],
      education: [{ institution: 'State University', degree: 'BA Marketing', year: '2019' }],
      skills: ['SEO', 'Google Ads', 'Social Media', 'Content Strategy', 'Email Marketing'],
    },
  },
  {
    label: 'Senior Eng — Strong',
    tag: 'Strong',
    tagColor: 'text-success bg-success/10',
    data: {
      name: 'Alex Chen', role: 'Senior Full-Stack Engineer',
      tagline: 'I turn ambitious product ideas into shipped software that scales — 8 years building for startups and Fortune 500s alike.',
      stats: [
        { label: 'Years of Experience', value: '8+' },
        { label: 'Products Shipped', value: '23' },
        { label: 'Users Impacted', value: '2.4M' },
      ],
      experience: [
        {
          company: 'Stripe', title: 'Senior Software Engineer', period: '2021 – Present',
          bullets: [
            'Architected a real-time fraud detection pipeline processing 12M transactions/day, reducing chargebacks by 34% ($18M annual savings)',
            'Led a cross-functional team of 6 to rebuild the merchant onboarding flow, cutting drop-off rate from 23% to 9%',
          ],
        },
      ],
      education: [{ institution: 'University of Waterloo', degree: 'B.S. Computer Science', year: '2017' }],
      skills: ['TypeScript', 'React', 'Node.js', 'Go', 'PostgreSQL', 'Redis', 'AWS', 'Kubernetes', 'GraphQL'],
    },
  },
];

function RoastInner() {
  const searchParams = useSearchParams();
  const [source, setSource] = useState<'sample' | 'own' | 'paste'>('sample');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [ownData, setOwnData] = useState<PortfolioData | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [revealedRoasts, setRevealedRoasts] = useState(0);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    const portfolioParam = searchParams.get('data');
    if (portfolioParam) {
      try { setOwnData(JSON.parse(decodeURIComponent(portfolioParam))); setSource('own'); } catch { /* ignore */ }
      return;
    }
    const stored = sessionStorage.getItem('ff_roast_data');
    if (stored) {
      try { setOwnData(JSON.parse(stored)); setSource('own'); } catch { /* ignore */ }
    }
  }, [searchParams]);

  const pasteData: PortfolioData | null = useMemo(() => {
    if (!pasteText.trim()) return null;
    const lines = pasteText.trim().split('\n').filter(l => l.trim());
    return {
      name: lines[0] || 'Your Name', role: lines[1] || 'Professional', tagline: '', stats: [],
      experience: [{ company: '', title: '', period: '', bullets: lines.slice(2).map(l => l.replace(/^[-*]\s*/, '')) }],
      education: [], skills: [],
    };
  }, [pasteText]);

  const portfolioData = source === 'own' && ownData ? ownData : source === 'paste' && pasteData ? pasteData : SAMPLES[selectedIdx].data;
  const roast: RoastResult = useMemo(() => roastPortfolio(portfolioData), [portfolioData]);
  const score: ScoreBreakdown = useMemo(() => scorePortfolio(portfolioData, 'cs' as Field), [portfolioData]);

  const savageryConfig = {
    mild: { emoji: '', label: 'Mild', color: 'text-success', bg: 'bg-success/10' },
    medium: { emoji: '', label: 'Medium', color: 'text-warning', bg: 'bg-warning/10' },
    brutal: { emoji: '', label: 'Brutal', color: 'text-error', bg: 'bg-error/10' },
  };
  const savagery = savageryConfig[roast.savageryLevel];

  function handleRoast() {
    setShowResults(true);
    setRevealedRoasts(0);
    setShareUrl('');
    const batchSize = Math.min(roast.roasts.length, 3);
    // Reveal first 3 immediately, rest in quick succession
    setRevealedRoasts(batchSize);
    roast.roasts.slice(batchSize).forEach((_, i) => {
      setTimeout(() => setRevealedRoasts(batchSize + i + 1), (i + 1) * 200);
    });
  }

  function handleShare() {
    const text = `My portfolio got roasted!\nSavagery: ${savagery.label}\nScore: ${score.total}/100 (${score.grade})\n${roast.roasts.length} issues found\n\nRoast yours free at ${window.location.origin}/roast`;
    if (navigator.share) {
      navigator.share({ title: 'Roast My Portfolio', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setShareUrl('Copied!');
      setTimeout(() => setShareUrl(''), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <AppNav rightContent={
        <>
          <Link href="/p/demo" className="text-bone4 text-sm hover:text-bone3 transition-colors">Demo</Link>
          <Link href="/auth/login" className="text-bone4 text-sm hover:text-bone3 transition-colors">Log in</Link>
        </>
      } />

      <div className="max-w-xl mx-auto px-5 py-10 animate-[fadeInUp_0.4s_ease-out]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-bone font-display mb-2">AI Portfolio Feedback</h1>
          <p className="text-bone3 text-sm">Honest analysis with actionable fixes.</p>
        </div>

        {!showResults ? (
          <>
            {/* Source tabs */}
            <div className="flex gap-2 justify-center mb-6">
              {[
                { key: 'sample' as const, label: 'Samples' },
                ...(ownData ? [{ key: 'own' as const, label: 'My Portfolio' }] : []),
                { key: 'paste' as const, label: 'Paste' },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setSource(key)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    source === key ? 'bg-accent/10 border border-accent/15 text-accent' : 'bg-bg2 border border-white/[0.04] text-bone4 hover:text-bone3'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {source === 'sample' && (
              <div className="grid grid-cols-2 gap-2 mb-6">
                {SAMPLES.map((s, i) => (
                  <button key={i} onClick={() => setSelectedIdx(i)}
                    className={`text-left px-4 py-3 rounded-lg text-sm transition-all ${
                      selectedIdx === i ? 'bg-bg3/50 border border-accent/15' : 'bg-bg2 border border-white/[0.04] hover:border-white/[0.08]'
                    }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-bone text-[13px]">{s.label}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${s.tagColor}`}>{s.tag}</span>
                    </div>
                    <span className="text-bone4 text-[11px]">{s.data.role}</span>
                  </button>
                ))}
              </div>
            )}

            {source === 'paste' && (
              <div className="mb-6">
                <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)}
                  placeholder={"Your Name\nYour Role\n- Built the checkout flow...\n- Reduced page load by 40%..."}
                  className="w-full h-36 bg-bg2 border border-white/[0.04] rounded-xl p-4 text-bone text-sm font-mono leading-relaxed resize-none focus:border-accent/20 focus:outline-none placeholder:text-bone4/30" />
                <p className="text-bone4 text-[10px] mt-1.5 text-center">Line 1 = name, line 2 = role, rest = bullets</p>
              </div>
            )}

            {/* Preview */}
            <div className="bg-bg2 border border-white/[0.04] rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-bone text-sm font-medium">{portfolioData.name}</p>
                  <p className="text-bone4 text-xs">{portfolioData.role}</p>
                </div>
                <span className="text-bone4 text-[10px] font-mono">{portfolioData.experience.length} exp</span>
              </div>
            </div>

            <div className="text-center">
              <button onClick={handleRoast} disabled={source === 'paste' && !pasteData}
                className="px-8 py-3 bg-accent text-bg font-semibold rounded-lg hover:bg-accent2 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                Analyze
              </button>
              <p className="text-bone4 text-[10px] mt-2">Client-side. Instant results.</p>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {/* Savagery + Score */}
            <div className={`${savagery.bg} rounded-xl p-5 text-center`}>
              <p className={`${savagery.color} font-semibold`}>Savagery: {savagery.label}</p>
              <p className="text-bone3 text-sm mt-1">Score: {score.total}/100 ({score.grade})</p>
            </div>

            {/* Overall */}
            <div className="bg-bg2 border border-white/[0.04] rounded-xl p-5">
              <p className="text-bone text-sm leading-relaxed italic">&ldquo;{roast.overallRoast}&rdquo;</p>
            </div>

            {/* Individual roasts */}
            {roast.roasts.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-bone4 text-[10px] font-mono uppercase tracking-wider">The breakdown</h3>
                {roast.roasts.map((r, i) => (
                  <div key={i} className={`bg-bg2 border border-white/[0.04] rounded-xl p-4 transition-all duration-300 ${
                    i < revealedRoasts ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                  }`}>
                    <p className="text-bone text-sm mb-2.5">{r.line}</p>
                    <div className="flex items-start gap-2 text-xs bg-accent/5 border border-accent/[0.06] rounded-lg p-2.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent shrink-0 mt-0.5"><path d="M12 20V10M6 20V4M18 20v-6" /></svg>
                      <span className="text-bone3">{r.tip}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-success/10 rounded-xl p-5 text-center">
                <p className="text-success text-sm">No issues found — solid portfolio!</p>
              </div>
            )}

            {/* Score breakdown */}
            <div className="bg-bg2 border border-white/[0.04] rounded-xl p-5">
              <h3 className="text-bone4 text-[10px] font-mono uppercase tracking-wider mb-4">Score Breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: 'Completeness', value: score.completeness, max: 25 },
                  { label: 'Impact Language', value: score.impactLanguage, max: 25 },
                  { label: 'Depth', value: score.depth, max: 20 },
                  { label: 'Field Relevance', value: score.fieldRelevance, max: 15 },
                  { label: 'Presentation', value: score.presentation, max: 15 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-bone3">{item.label}</span>
                      <span className="text-bone4 font-mono">{item.value}/{item.max}</span>
                    </div>
                    <div className="h-1 bg-bg3/50 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-accent/60 transition-all duration-700" style={{ width: `${(item.value / item.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button onClick={() => { setShowResults(false); setRevealedRoasts(0); }}
                className="w-full sm:w-auto px-5 py-2.5 bg-bg3/50 text-bone text-sm rounded-lg hover:bg-bg3 transition-colors">
                Try another
              </button>
              <button onClick={handleShare}
                className="w-full sm:w-auto px-5 py-2.5 bg-bg3/50 text-bone text-sm rounded-lg hover:bg-bg3 transition-colors">
                {shareUrl || 'Share results'}
              </button>
              <Link href="/?upload=true"
                className="w-full sm:w-auto px-5 py-2.5 bg-accent text-bg text-sm font-semibold rounded-lg hover:bg-accent2 transition-colors text-center">
                Build your portfolio
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoastPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <RoastInner />
    </Suspense>
  );
}
