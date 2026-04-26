'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

interface ScoreCardProps {
  label: string;
  score: number;
  maxScore?: number;
  color?: 'neon' | 'blue' | 'warm' | 'mint';
  description?: string;
  delay?: number;
}

export default function ScoreCard({
  label,
  score,
  maxScore = 100,
  color = 'neon',
  description,
  delay = 0,
}: ScoreCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const [animatedScore, setAnimatedScore] = useState(0);
  const pct = (score / maxScore) * 100;

  useEffect(() => {
    if (!inView) return;
    const duration = 1300;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.floor(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    const timer = setTimeout(() => requestAnimationFrame(animate), delay * 1000);
    return () => clearTimeout(timer);
  }, [inView, score, delay]);

  const colorMap = {
    neon: {
      value: 'text-[#173f35]',
      track: 'bg-[rgba(23,63,53,0.09)]',
      fill: 'linear-gradient(90deg, #173f35 0%, #3f7d6e 100%)',
    },
    blue: {
      value: 'text-[#1e6d84]',
      track: 'bg-[rgba(30,109,132,0.09)]',
      fill: 'linear-gradient(90deg, #1e6d84 0%, #67a9ba 100%)',
    },
    warm: {
      value: 'text-[#9a5936]',
      track: 'bg-[rgba(201,133,97,0.12)]',
      fill: 'linear-gradient(90deg, #c98561 0%, #dfa17d 100%)',
    },
    mint: {
      value: 'text-[#5f7768]',
      track: 'bg-[rgba(95,119,104,0.1)]',
      fill: 'linear-gradient(90deg, #5f7768 0%, #a4b9ae 100%)',
    },
  };

  const c = colorMap[color];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className="ff-panel p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#85786d]">{label}</p>
          {description && (
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-[#675c53]">{description}</p>
          )}
        </div>
        <span className={`text-[30px] font-display font-semibold tracking-[-0.04em] ${c.value}`}>
          {animatedScore}
        </span>
      </div>

      <div className={`h-2 rounded-full ${c.track}`}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: inView ? `${pct}%` : 0 }}
          transition={{ duration: 0.9, delay: delay + 0.05, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: c.fill }}
        />
      </div>
    </motion.div>
  );
}
