'use client';

import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { PROCESSING_STEPS } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ProcessingStepsProps {
  currentStep: number;
  isComplete: boolean;
}

export default function ProcessingSteps({ currentStep, isComplete }: ProcessingStepsProps) {
  return (
    <div className="mx-auto w-full max-w-lg space-y-3">
      {PROCESSING_STEPS.map((step, index) => {
        const isActive = index === currentStep && !isComplete;
        const isDone = index < currentStep || isComplete;

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
            className={cn(
              'flex items-center gap-4 rounded-[22px] border px-4 py-4 transition-all duration-500',
              isActive
                ? 'border-[rgba(23,63,53,0.18)] bg-white shadow-[0_18px_50px_rgba(67,49,31,0.08)]'
                : 'border-[rgba(124,105,89,0.14)] bg-[rgba(255,255,255,0.6)]',
              isDone && 'opacity-70'
            )}
          >
            <div
              className={cn(
                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border text-sm font-medium transition-all duration-500',
                isDone
                  ? 'border-[rgba(23,63,53,0.18)] bg-[rgba(23,63,53,0.08)] text-[#173f35]'
                  : isActive
                    ? 'border-[rgba(201,133,97,0.22)] bg-[rgba(201,133,97,0.1)] text-[#8b5336]'
                    : 'border-[rgba(124,105,89,0.12)] bg-white/70 text-[#8a7e72]'
              )}
            >
              {isDone ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                  <Check className="h-4 w-4" />
                </motion.div>
              ) : isActive ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="font-mono text-[12px]">{index + 1}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium text-[#171210]">{step.label}</p>
              <p className="mt-1 text-[12px] text-[#7f7368]">
                {index === 0 && 'Reading the PDF and checking the text quality.'}
                {index === 1 && 'Pulling out projects, experience, and core skills.'}
                {index === 2 && 'Preparing the content structure for the portfolio draft.'}
                {index === 3 && 'Turning the resume into a page you can review and edit.'}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
