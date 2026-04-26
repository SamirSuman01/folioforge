import * as React from 'react'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────
   PROGRESS — Two types for two purposes.

   ProgressBar    — linear progress (file upload, generation steps)
   ProgressSteps  — discrete step indicator (onboarding, wizard)

   Rules:
   - Use ProgressBar for continuous/unknown progress
   - Use ProgressSteps for known, countable steps
   - Never use a spinner for processes > 5 seconds — use ProgressBar
   - Always label progress for screen readers
   ───────────────────────────────────────────────────────── */


/* ─── Linear Progress Bar ─────────────────────────────── */

interface ProgressBarProps {
  // 0-100
  value: number
  // Optional label for context ("Generating your portfolio...")
  label?: string
  // Screen reader label
  ariaLabel?: string
  // Size: thin for subtle, default for standard, thick for featured
  size?: 'thin' | 'default' | 'thick'
  className?: string
}

function ProgressBar({
  value,
  label,
  ariaLabel,
  size = 'default',
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-small text-text-secondary">{label}</span>
          <span className="text-small font-medium text-text-primary tabular-nums">
            {Math.round(clamped)}%
          </span>
        </div>
      )}

      {/* Track */}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel ?? label ?? 'Progress'}
        className={cn(
          'w-full overflow-hidden rounded-full bg-border-subtle',
          size === 'thin'    && 'h-1',
          size === 'default' && 'h-1.5',
          size === 'thick'   && 'h-2.5',
        )}
      >
        {/* Fill — linear transition, not eased (constant progress = constant motion) */}
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-slow linear"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}


/* ─── Step Progress Indicator ─────────────────────────── */

interface Step {
  label: string
  description?: string
}

interface ProgressStepsProps {
  steps: Step[]
  // 0-indexed current step
  currentStep: number
  className?: string
}

function ProgressSteps({ steps, currentStep, className }: ProgressStepsProps) {
  return (
    <nav
      aria-label="Progress"
      className={cn('flex items-center gap-1', className)}
    >
      {steps.map((step, index) => {
        const isComplete = index < currentStep
        const isCurrent  = index === currentStep
        const isPending  = index > currentStep

        return (
          <React.Fragment key={step.label}>
            {/* Step node */}
            <div className="flex flex-col items-center gap-1">
              <div
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-micro font-semibold transition-colors',
                  isComplete && 'bg-accent text-text-inverse',
                  isCurrent  && 'bg-accent-subtle text-accent border-2 border-accent',
                  isPending  && 'bg-border-subtle text-text-disabled border border-border',
                )}
              >
                {isComplete ? (
                  // Checkmark for completed steps
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Step label — shown below node */}
              <span
                className={cn(
                  'text-micro hidden sm:block text-center max-w-[80px]',
                  isCurrent  && 'text-accent font-medium',
                  isComplete && 'text-text-secondary',
                  isPending  && 'text-text-disabled',
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line between steps */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-px mb-5 transition-colors',
                  index < currentStep ? 'bg-accent' : 'bg-border',
                )}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}


/* ─── Score Bar — for portfolio score display ─────────── */

interface ScoreBarProps {
  // 0-100
  score: number
  label?: string
  // compact mode — smaller display, no score number, just the bar + grade
  compact?: boolean
  className?: string
}

function ScoreBar({ score, label, compact = false, className }: ScoreBarProps) {
  const clamped = Math.min(100, Math.max(0, score))

  // Score color based on range
  const color =
    clamped >= 88 ? 'bg-success' :
    clamped >= 70 ? 'bg-accent' :
    clamped >= 50 ? 'bg-warning' :
    'bg-error'

  const grade =
    clamped >= 95 ? 'A+' :
    clamped >= 88 ? 'A'  :
    clamped >= 80 ? 'B+' :
    clamped >= 70 ? 'B'  :
    clamped >= 60 ? 'C+' :
    clamped >= 50 ? 'C'  : 'D'

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Portfolio score: ${Math.round(clamped)} out of 100`}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-subtle"
        >
          <div
            className={cn('h-full rounded-full', color)}
            style={{ width: `${clamped}%` }}
          />
        </div>
        <span className={cn(
          'text-micro font-semibold tabular-nums',
          clamped >= 88 ? 'text-success' :
          clamped >= 70 ? 'text-accent' :
          clamped >= 50 ? 'text-warning' :
          'text-error'
        )}>
          {grade}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Score display */}
      <div className="flex items-baseline justify-between">
        <span className="text-h2 font-bold text-text-primary tabular-nums">
          {Math.round(clamped)}
          <span className="text-small text-text-secondary font-normal">/100</span>
        </span>
        <span className={cn(
          'text-h3 font-bold',
          clamped >= 88 ? 'text-success' :
          clamped >= 70 ? 'text-accent' :
          clamped >= 50 ? 'text-warning' :
          'text-error'
        )}>
          {grade}
        </span>
      </div>

      {/* Bar */}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? `Portfolio score: ${Math.round(clamped)} out of 100`}
        className="h-2 w-full overflow-hidden rounded-full bg-border-subtle"
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-slow linear', color)}
          style={{ width: `${clamped}%` }}
        />
      </div>

      {label && (
        <p className="text-micro text-text-secondary">{label}</p>
      )}
    </div>
  )
}

export { ProgressBar, ProgressSteps, ScoreBar }
