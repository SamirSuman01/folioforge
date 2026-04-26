'use client';

import { useEffect, useState, useMemo } from 'react';
import { useStreamingRewrite } from '@/hooks/useStreamingRewrite';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import TemplateRenderer from '@/components/templates/TemplateRenderer';
import ScoreReveal from '@/components/ScoreReveal';
import { scorePortfolio } from '@/lib/portfolio-score';
import { Button } from '@/components/ui/button';
import type { Field, Template, PortfolioData } from '@/lib/types';
import { FIELD_LABELS, TEMPLATES } from '@/lib/types';
import { ArrowLeft, Check } from 'lucide-react';

interface Props {
  linkedinText: string;
  detectedField: Field | null;
  onBack: () => void;
}

const STREAMING_STEPS = [
  'Reading your experience',
  'Analyzing career impact',
  'Rewriting for maximum impact',
  'Building your portfolio',
];

export default function StreamingView({ linkedinText, detectedField, onBack }: Props) {
  const FIELD_TEMPLATE_REC: Record<Field, Template> = {
    cs: 'system-dark',
    design: 'split-editorial',
    marketing: 'clean-light',
    business: 'broadsheet',
    other: 'warm-editorial',
  };

  const [field, setField] = useState<Field>(detectedField || 'cs');
  const [showFieldPicker, setShowFieldPicker] = useState(!detectedField);
  const [template, setTemplate] = useState<Template>(FIELD_TEMPLATE_REC[detectedField || 'cs']);
  const [mobileTab, setMobileTab] = useState<'preview' | 'score'>('preview');
  const { streamedText, isStreaming, portfolioData, error, startStreaming } = useStreamingRewrite();
  const [saving, setSaving] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [streamStep, setStreamStep] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!isStreaming) return;
    const intervals = [0, 2000, 5000, 8000];
    const timers = intervals.map((delay, i) =>
      setTimeout(() => setStreamStep(i), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [isStreaming]);

  useEffect(() => {
    if (!showFieldPicker) {
      startStreaming(linkedinText, field);
    }
  }, [field, showFieldPicker]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (portfolioData) {
      try {
        sessionStorage.setItem('ff_portfolio_data', JSON.stringify(portfolioData));
        sessionStorage.setItem('ff_linkedin_text', linkedinText);
        sessionStorage.setItem('ff_field', field);
      } catch { /* private/incognito mode — non-fatal, save flow still works */ }
      const t = setTimeout(() => setShowScore(true), 800);
      return () => clearTimeout(t);
    }
  }, [portfolioData, linkedinText, field]);

  const score = useMemo(() => {
    if (!portfolioData) return null;
    return scorePortfolio(portfolioData, field);
  }, [portfolioData, field]);

  async function handleSave() {
    if (!portfolioData) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/signup?redirect=/dashboard'); return; }
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: portfolioData, template, field, raw_linkedin_text: linkedinText }),
    });
    if (res.ok) {
      const saved = await res.json();
      router.push(`/editor/${saved.id}`);
    } else {
      setSaving(false);
    }
  }

  function parsePartialData(): PortfolioData | null {
    if (portfolioData) return portfolioData;
    if (!streamedText) return null;
    try {
      let cleaned = streamedText.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
      if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
      let attempt = cleaned;
      const openBraces = (attempt.match(/{/g) || []).length;
      const closeBraces = (attempt.match(/}/g) || []).length;
      const openBrackets = (attempt.match(/\[/g) || []).length;
      const closeBrackets = (attempt.match(/]/g) || []).length;
      for (let i = 0; i < openBrackets - closeBrackets; i++) attempt += ']';
      for (let i = 0; i < openBraces - closeBraces; i++) attempt += '}';
      return JSON.parse(attempt);
    } catch {
      return null;
    }
  }

  // Field picker
  if (showFieldPicker) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center px-5">
        <div className="max-w-md text-center animate-[fadeInUp_0.4s_ease-out]">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center mx-auto mb-5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent"><path d="M12 20V10M6 20V4M18 20v-6" /></svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1.5">What&apos;s your field?</h2>
          <p className="text-muted-foreground text-sm mb-7">This helps our AI write for your specific industry.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {(Object.entries(FIELD_LABELS) as [Field, string][]).map(([f, label]) => (
              <button
                key={f}
                onClick={() => { setField(f); setTemplate(FIELD_TEMPLATE_REC[f]); setShowFieldPicker(false); }}
                className="px-5 py-2.5 bg-secondary border border-border rounded-xl text-foreground text-sm hover:border-accent/30 hover:text-accent transition-all"
              >
                {label}
              </button>
            ))}
          </div>
          <button onClick={onBack} className="mt-7 text-muted-foreground text-sm hover:text-foreground transition-colors flex items-center gap-1.5 mx-auto">
            <ArrowLeft className="size-3.5" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  const previewData = parsePartialData();
  const isDone = portfolioData && !isStreaming;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border px-4 lg:px-5 py-2.5 flex items-center justify-between shrink-0">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm transition-colors flex items-center gap-1.5">
          <ArrowLeft className="size-3.5" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="flex items-center gap-2">
          {isStreaming ? (
            <>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
              <span className="text-muted-foreground text-xs hidden sm:block">{STREAMING_STEPS[streamStep]}...</span>
            </>
          ) : isDone ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-green-500 text-xs">Ready</span>
            </>
          ) : null}
        </div>

        {isDone ? (
          <div className="flex lg:hidden gap-1">
            <button onClick={() => setMobileTab('preview')} className={`px-2.5 py-1 rounded text-xs transition-colors ${mobileTab === 'preview' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}>Preview</button>
            <button onClick={() => setMobileTab('score')} className={`px-2.5 py-1 rounded text-xs transition-colors ${mobileTab === 'score' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}>Score</button>
          </div>
        ) : <div className="w-16" />}
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Preview */}
        <div className={`${isDone && mobileTab !== 'preview' ? 'hidden' : 'block'} lg:block ${isDone && showScore ? 'lg:w-[60%]' : 'w-full'} overflow-y-auto transition-all`}>
          {error ? (
            <div className="flex items-center justify-center h-full px-8">
              <div className="text-center animate-[fadeInUp_0.4s_ease-out]">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/15 flex items-center justify-center mx-auto mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-destructive"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
                </div>
                <p className="text-destructive text-sm mb-1.5 font-medium">Generation failed</p>
                <p className="text-muted-foreground text-xs mb-5">{error}</p>
                <Button onClick={() => startStreaming(linkedinText, field)} size="sm">
                  Try again
                </Button>
              </div>
            </div>
          ) : previewData ? (
            <TemplateRenderer template={template} data={previewData} showBadge={false} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center animate-[fadeInUp_0.4s_ease-out]">
                <div className="space-y-3.5 mb-6">
                  {STREAMING_STEPS.map((step, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 transition-all duration-500 ${
                        i <= streamStep ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        i < streamStep ? 'bg-green-500/10' : i === streamStep ? 'bg-accent/10' : 'bg-secondary'
                      }`}>
                        {i < streamStep ? (
                          <Check className="size-2.5 text-green-500" strokeWidth={3} />
                        ) : i === streamStep ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                        )}
                      </div>
                      <span className={`text-sm ${i === streamStep ? 'text-foreground' : i < streamStep ? 'text-foreground/70' : 'text-muted-foreground'}`}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground text-[10px]">Usually takes 15-30 seconds</p>
              </div>
            </div>
          )}
        </div>

        {/* Score panel */}
        {isDone && showScore && score && (
          <div className={`${mobileTab !== 'score' ? 'hidden' : 'block'} lg:block lg:w-[40%] border-l border-border overflow-y-auto p-4 lg:p-5`}>
            <ScoreReveal score={score} />
          </div>
        )}
      </div>

      {/* Bottom bar */}
      {isDone && (
        <div className="border-t border-border px-4 lg:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-card/80 backdrop-blur-sm animate-[fadeInUp_0.3s_ease-out]">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide">
            <span className="text-muted-foreground text-xs shrink-0">Template:</span>
            {TEMPLATES.filter(t => !t.isPro).map((t) => {
              const isRec = FIELD_TEMPLATE_REC[field] === (t.id as string);
              return (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id as unknown as Template)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0 transition-colors ${
                    (template as string) === (t.id as string) ? 'bg-accent text-white font-medium' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.name}{isRec && <span className="ml-1 text-[9px] opacity-60">*</span>}
                </button>
              );
            })}
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save & Edit'}
          </Button>
        </div>
      )}
    </div>
  );
}
