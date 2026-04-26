'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';

type InsightType = 'strength' | 'warning' | 'tip' | 'success';

interface InsightCardProps {
  type: InsightType;
  title: string;
  body: string;
  delay?: number;
}

const icons = {
  strength: TrendingUp,
  warning: AlertTriangle,
  tip: Lightbulb,
  success: CheckCircle2,
};

const styles = {
  strength: {
    icon: 'text-[#173f35]',
    bg: 'bg-[rgba(23,63,53,0.06)]',
    border: 'border-[rgba(23,63,53,0.12)]',
  },
  warning: {
    icon: 'text-[#9a5936]',
    bg: 'bg-[rgba(201,133,97,0.08)]',
    border: 'border-[rgba(201,133,97,0.14)]',
  },
  tip: {
    icon: 'text-[#2d7081]',
    bg: 'bg-[rgba(45,112,129,0.08)]',
    border: 'border-[rgba(45,112,129,0.14)]',
  },
  success: {
    icon: 'text-[#4a7b63]',
    bg: 'bg-[rgba(74,123,99,0.08)]',
    border: 'border-[rgba(74,123,99,0.14)]',
  },
};

export default function InsightCard({ type, title, body, delay = 0 }: InsightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const Icon = icons[type];
  const s = styles[type];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -14 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`flex gap-4 rounded-[24px] border bg-[rgba(255,255,255,0.72)] p-5 ${s.border}`}
    >
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${s.bg}`}>
        <Icon className={`h-4 w-4 ${s.icon}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#171210]">{title}</p>
        <p className="mt-2 text-[14px] leading-relaxed text-[#62584f]">{body}</p>
      </div>
    </motion.div>
  );
}
