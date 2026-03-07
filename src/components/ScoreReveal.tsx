'use client';

import { useState, useEffect } from 'react';
import type { ScoreBreakdown } from '@/lib/portfolio-score';

interface Props {
  score: ScoreBreakdown;
  onClose?: () => void;
}

function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
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
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-bone3">{label}</span>
        <span className="text-bone4 font-mono">{value}/{max}</span>
      </div>
      <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
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
  'B+': '#4CC9FF', 'B': '#4CC9FF',
  'C+': '#F59E0B', 'C': '#F59E0B',
  'D': '#EF4444',
};

export default function ScoreReveal({ score, onClose }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const gradeColor = GRADE_COLORS[score.grade] || '#4CC9FF';

  useEffect(() => {
    const t = setTimeout(() => setShowDetails(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="bg-bg2 border border-white/[0.04] rounded-xl p-5 lg:p-6 animate-[fadeInUp_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-bone text-sm font-medium">Portfolio Score</h3>
        {onClose && (
          <button onClick={onClose} className="text-bone4 hover:text-bone3 text-xs transition-colors">Dismiss</button>
        )}
      </div>

      {/* Score + Grade */}
      <div className="flex items-center gap-5 mb-6">
        <div className="relative shrink-0">
          <svg width="80" height="80" viewBox="0 0 100 100" className="transform -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
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
            <span className="text-xl font-bold text-bone font-mono">
              <AnimatedNumber value={score.total} />
            </span>
          </div>
        </div>
        <div>
          <div className="text-3xl font-bold font-mono" style={{ color: gradeColor }}>
            {score.grade}
          </div>
          <p className="text-bone4 text-xs mt-0.5">
            {score.total >= 80 ? 'Strong portfolio' : score.total >= 60 ? 'Good foundation' : 'Needs work'}
          </p>
        </div>
      </div>

      {/* Category bars */}
      <div className={`space-y-3 transition-all duration-500 ${showDetails ? 'opacity-100' : 'opacity-0'}`}>
        <ScoreBar label="Completeness" value={score.completeness} max={25} color="#4CC9FF" delay={200} />
        <ScoreBar label="Impact Language" value={score.impactLanguage} max={25} color="#C77DFF" delay={400} />
        <ScoreBar label="Depth" value={score.depth} max={20} color="#F59E0B" delay={600} />
        <ScoreBar label="Field Relevance" value={score.fieldRelevance} max={15} color="#22C55E" delay={800} />
        <ScoreBar label="Presentation" value={score.presentation} max={15} color="#FF6B6B" delay={1000} />
      </div>

      {/* Tips */}
      {score.tips.length > 0 && (
        <div className={`mt-5 pt-5 border-t border-white/[0.04] transition-all duration-500 delay-500 ${showDetails ? 'opacity-100' : 'opacity-0'}`}>
          <h4 className="text-bone4 text-[10px] font-mono uppercase tracking-wider mb-3">Top improvements</h4>
          <div className="space-y-2.5">
            {score.tips.slice(0, 3).map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs">
                <span className="text-accent font-mono shrink-0">+{tip.impact}</span>
                <span className="text-bone3">{tip.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
