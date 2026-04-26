'use client';

import { useState, useEffect } from 'react';
import type { ScoreBreakdown } from '@/lib/portfolio-score';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  score: ScoreBreakdown;
  onClose?: () => void;
}

function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value, duration]);

  return <>{display}</>;
}

function ScoreBar({ label, value, max, color, delay }: { label: string; value: number; max: number; color: string; delay: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const pct = max > 0 ? (value / max) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-micro mb-1">
        <span className="text-text-disabled">{label}</span>
        <span className="text-text-disabled font-mono">{value}/{max}</span>
      </div>
      <div className="h-1 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: animated ? `${pct}%` : '0%', backgroundColor: color }}
        />
      </div>
    </div>
  );
}

const GRADE_COLORS: Record<string, string> = {
  'A+': '#22C55E', 'A': '#22C55E',
  'B+': '#0EA5E9', 'B': '#0EA5E9',
  'C+': '#F59E0B', 'C': '#F59E0B',
  'D': '#EF4444',
};

export default function ScoreReveal({ score, onClose }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const [showShare,   setShowShare]   = useState(false);
  const gradeColor = GRADE_COLORS[score.grade] || '#0EA5E9';

  useEffect(() => {
    const t1 = setTimeout(() => setShowDetails(true), 600);
    const t2 = setTimeout(() => setShowShare(true),   1700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <Card className="animate-fade-in-up">
      <CardContent className="p-5 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-text-primary text-small font-medium">Portfolio Score</h3>
          {onClose && (
            <button onClick={onClose} className="text-text-disabled hover:text-text-primary text-micro transition-colors">Dismiss</button>
          )}
        </div>

        {/* Score + Grade */}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative shrink-0">
            <svg width="80" height="80" viewBox="0 0 100 100" className="transform -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(0.91 0.005 260)" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={gradeColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - score.total / 100)}`}
                className="transition-all duration-[1500ms] ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-h3 font-bold text-text-primary font-mono">
                <AnimatedNumber value={score.total} />
              </span>
            </div>
          </div>
          <div>
            <div className="text-h1 font-bold font-mono" style={{ color: gradeColor }}>
              {score.grade}
            </div>
            <p className="text-text-disabled text-micro mt-0.5">
              {score.total >= 80 ? 'Strong portfolio' : score.total >= 60 ? 'Good foundation' : 'Needs work'}
            </p>
          </div>
        </div>

        {/* Category bars */}
        <div className={`space-y-3 transition-all duration-500 ${showDetails ? 'opacity-100' : 'opacity-0'}`}>
          <ScoreBar label="Completeness" value={score.completeness} max={25} color="#0EA5E9" delay={200} />
          <ScoreBar label="Impact Language" value={score.impactLanguage} max={25} color="#A855F7" delay={400} />
          <ScoreBar label="Depth" value={score.depth} max={20} color="#F59E0B" delay={600} />
          <ScoreBar label="Field Relevance" value={score.fieldRelevance} max={15} color="#22C55E" delay={800} />
          <ScoreBar label="Presentation" value={score.presentation} max={15} color="#EF4444" delay={1000} />
        </div>

        {/* Tips */}
        {score.tips.length > 0 && (
          <div className={`mt-5 pt-5 border-t border-border transition-all duration-500 delay-500 ${showDetails ? 'opacity-100' : 'opacity-0'}`}>
            <h4 className="text-text-disabled text-micro font-mono uppercase tracking-wider mb-3">Top improvements</h4>
            <div className="space-y-2.5">
              {score.tips.slice(0, 3).map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 text-micro">
                  <span className="text-accent font-mono shrink-0">+{tip.impact}</span>
                  <span className="text-text-disabled">{tip.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share / ego-stroke — revealed after counter finishes */}
        <div className={`mt-5 pt-5 border-t border-border transition-all duration-500 ${showShare ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <p className="text-text-disabled text-micro font-mono uppercase tracking-wider mb-3">
            {score.total >= 75 ? 'Nice score — show it off' : 'Track your progress'}
          </p>
          <div className="flex gap-2 flex-wrap">
            <a
              href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgefolio.com')}&title=${encodeURIComponent(`I scored ${score.total}/100 on ForgeFolio`)}&summary=${encodeURIComponent(`Signal-grade portfolio analysis — free at ${(process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgefolio.com').replace(/^https?:\/\//, '')}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-micro font-medium px-3 py-1.5 rounded-md bg-[#0A66C2] text-white hover:opacity-90 transition-opacity"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Share on LinkedIn
            </a>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-micro font-medium px-3 py-1.5 rounded-md border border-border text-text-disabled hover:text-text-primary hover:border-border-strong transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
              Save as PDF
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
