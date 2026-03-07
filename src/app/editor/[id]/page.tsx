'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TemplateRenderer from '@/components/templates/TemplateRenderer';
import ScoreReveal from '@/components/ScoreReveal';
import { scorePortfolio } from '@/lib/portfolio-score';
import type { PortfolioData, Template, Portfolio, Education, Field } from '@/lib/types';
import { TEMPLATES, FIELD_LABELS } from '@/lib/types';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [data, setData] = useState<PortfolioData | null>(null);
  const [template, setTemplate] = useState<Template>('system-dark');
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [showPublishCelebration, setShowPublishCelebration] = useState(false);
  const skillInputRef = useRef<HTMLInputElement>(null);
  const lastSavedRef = useRef<string>('');

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  }

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/portfolio/${params.id}`);
      if (!res.ok) { router.push('/dashboard'); return; }
      const p: Portfolio = await res.json();
      setPortfolio(p);
      setData(p.data);
      setTemplate(p.template as Template);
      setIsPublished(p.is_published);
      lastSavedRef.current = JSON.stringify(p.data);
      setLoading(false);
    }
    load();
  }, [params.id, router]);

  useEffect(() => {
    if (!data || loading) return;
    setHasUnsaved(JSON.stringify(data) !== lastSavedRef.current);
  }, [data, loading]);

  const save = useCallback(async (updates: Partial<Portfolio> = {}) => {
    if (!portfolio || !data) return;
    setSaving(true);
    const body: Record<string, unknown> = { ...updates };
    if (!updates.data) body.data = data;
    if (!updates.template) body.template = template;
    const res = await fetch(`/api/portfolio/${portfolio.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      lastSavedRef.current = JSON.stringify(data);
      setHasUnsaved(false);
      showToast('Saved');
    } else {
      showToast('Failed to save. Try again.');
    }
  }, [portfolio, data, template]);

  useEffect(() => {
    if (!data || loading || !hasUnsaved) return;
    const timer = setTimeout(() => { save(); }, 5000);
    return () => clearTimeout(timer);
  }, [data, save, loading, hasUnsaved]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsaved) save();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [save, hasUnsaved]);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasUnsaved) e.preventDefault();
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsaved]);

  async function handleRegenerate(newField?: Field) {
    if (!portfolio?.raw_linkedin_text) {
      showToast('No original LinkedIn text to regenerate from.');
      return;
    }
    setRegenerating(true);
    showToast('Regenerating with AI...');
    try {
      const field = newField || portfolio.field || 'cs';
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: portfolio.raw_linkedin_text, field }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') accumulated += line.slice(6);
        }
      }
      let cleaned = accumulated.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
      if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
      if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
      setData(JSON.parse(cleaned));
      showToast('Portfolio regenerated!');
    } catch {
      showToast('Regeneration failed. Try again.');
    }
    setRegenerating(false);
  }

  async function togglePublish() {
    const newPublished = !isPublished;
    setIsPublished(newPublished);
    await save({ is_published: newPublished });
    if (newPublished) setShowPublishCelebration(true);
    else showToast('Portfolio unpublished.');
  }

  function updateField<K extends keyof PortfolioData>(key: K, value: PortfolioData[K]) {
    if (!data) return;
    setData({ ...data, [key]: value });
  }

  function updateExperience(index: number, field: string, value: string | string[]) {
    if (!data) return;
    const updated = [...data.experience];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, experience: updated });
  }

  function updateEducation(index: number, field: keyof Education, value: string) {
    if (!data) return;
    const updated = [...data.education];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, education: updated });
  }

  function updateStat(index: number, field: 'value' | 'label', value: string) {
    if (!data) return;
    const updated = [...data.stats];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, stats: updated });
  }

  function addSkill() {
    if (!data || !newSkill.trim()) return;
    updateField('skills', [...data.skills, newSkill.trim()]);
    setNewSkill('');
    skillInputRef.current?.focus();
  }

  const score = useMemo(() => {
    if (!data) return null;
    return scorePortfolio(data, (portfolio?.field as Field) || 'cs');
  }, [data, portfolio?.field]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
          <span className="text-bone4 text-xs">Loading editor...</span>
        </div>
      </div>
    );
  }

  const inputClass = 'w-full px-3 py-2 bg-bg3/50 border border-white/[0.06] rounded-lg text-bone text-sm focus:border-accent/30 focus:outline-none transition-colors placeholder:text-bone4/30';

  const editorPanel = (
    <div className="space-y-5 p-4 lg:p-5">
      {/* Template selector */}
      <div>
        <label className="text-bone4 text-[10px] font-mono uppercase tracking-wider mb-2 block">Template</label>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATES.map((t) => {
            const swatch: Record<string, string> = {
              'system-dark': 'bg-[#4CC9FF]',
              'clean-light': 'bg-[#1E3A5F]',
              'split-editorial': 'bg-[#C77DFF]',
              'broadsheet': 'bg-[#4A4A5A]',
              'warm-editorial': 'bg-[#F59E0B]',
            };
            const locked = t.isPro && !portfolio?.is_pro;
            const fieldRec: Record<string, string> = { cs: 'system-dark', design: 'split-editorial', marketing: 'clean-light', finance: 'broadsheet', research: 'warm-editorial' };
            const isRec = portfolio?.field && fieldRec[portfolio.field] === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { if (!locked) setTemplate(t.id); }}
                className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
                  template === t.id
                    ? 'bg-accent text-bg font-medium'
                    : locked
                    ? 'bg-bg3/50 text-bone4/50 cursor-not-allowed'
                    : 'bg-bg3/50 text-bone4 hover:text-bone3'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${swatch[t.id] || 'bg-bone3'} ${template === t.id ? 'opacity-70' : ''}`} />
                {locked && <span className="text-[9px]">Pro</span>}
                {t.name}
                {isRec && <span className="text-[9px] text-accent/70">rec</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Field + Regenerate */}
      {portfolio?.raw_linkedin_text && (
        <div>
          <label className="text-bone4 text-[10px] font-mono uppercase tracking-wider mb-2 block">AI Field</label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(Object.entries(FIELD_LABELS) as [Field, string][]).map(([f, label]) => (
              <button
                key={f}
                onClick={() => handleRegenerate(f)}
                disabled={regenerating}
                className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-40 ${
                  portfolio?.field === f
                    ? 'bg-accent/10 text-accent border border-accent/15'
                    : 'bg-bg3/50 text-bone4 hover:text-bone3'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-bone4 text-[10px] mt-1.5">
            {regenerating ? 'Regenerating...' : 'Click a field to regenerate'}
          </p>
        </div>
      )}

      {/* Name + Role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-bone4 text-[10px] font-mono uppercase tracking-wider mb-1.5 block">Name</label>
          <input value={data.name} onChange={(e) => updateField('name', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-bone4 text-[10px] font-mono uppercase tracking-wider mb-1.5 block">Role</label>
          <input value={data.role} onChange={(e) => updateField('role', e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Tagline */}
      <div>
        <label className="text-bone4 text-[10px] font-mono uppercase tracking-wider mb-1.5 block">Tagline</label>
        <textarea value={data.tagline} onChange={(e) => updateField('tagline', e.target.value)} rows={2} className={`${inputClass} resize-none`} />
      </div>

      {/* Stats */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-bone4 text-[10px] font-mono uppercase tracking-wider">Stats</label>
          {data.stats.length < 4 && (
            <button onClick={() => updateField('stats', [...data.stats, { value: '', label: '' }])} className="text-[10px] text-accent hover:text-accent2 transition-colors">+ Add</button>
          )}
        </div>
        <div className="space-y-1.5">
          {data.stats.map((stat, i) => (
            <div key={i} className="flex gap-1.5">
              <input value={stat.value} onChange={(e) => updateStat(i, 'value', e.target.value)} placeholder="Value" className={`w-1/3 ${inputClass}`} />
              <input value={stat.label} onChange={(e) => updateStat(i, 'label', e.target.value)} placeholder="Label" className={`flex-1 ${inputClass}`} />
              <button onClick={() => updateField('stats', data.stats.filter((_, j) => j !== i))} className="text-bone4 hover:text-error text-xs px-1 transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-bone4 text-[10px] font-mono uppercase tracking-wider">Experience</label>
          <button onClick={() => updateField('experience', [...data.experience, { company: '', title: '', period: '', bullets: [''] }])} className="text-[10px] text-accent hover:text-accent2 transition-colors">+ Add</button>
        </div>
        <div className="space-y-2">
          {data.experience.map((exp, i) => (
            <details key={i} className="group bg-bg2 rounded-lg border border-white/[0.04]">
              <summary className="px-3 py-2.5 cursor-pointer text-bone text-sm flex items-center justify-between">
                <span className="truncate mr-2">{exp.company || 'New'} &middot; {exp.title || 'Position'}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={(e) => { e.preventDefault(); updateField('experience', data.experience.filter((_, j) => j !== i)); }} className="text-bone4 hover:text-error text-xs transition-colors">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-bone4 group-open:rotate-90 transition-transform"><path d="M9 18l6-6-6-6" /></svg>
                </div>
              </summary>
              <div className="px-3 pb-3 space-y-1.5">
                <input value={exp.company} onChange={(e) => updateExperience(i, 'company', e.target.value)} placeholder="Company" className={inputClass} />
                <input value={exp.title} onChange={(e) => updateExperience(i, 'title', e.target.value)} placeholder="Title" className={inputClass} />
                <input value={exp.period} onChange={(e) => updateExperience(i, 'period', e.target.value)} placeholder="Period" className={inputClass} />
                {exp.bullets.map((bullet, j) => (
                  <div key={j} className="flex gap-1">
                    <textarea value={bullet} onChange={(e) => { const b = [...exp.bullets]; b[j] = e.target.value; updateExperience(i, 'bullets', b); }} rows={2} className={`flex-1 ${inputClass} resize-none`} />
                    <button onClick={() => { const b = exp.bullets.filter((_, k) => k !== j); updateExperience(i, 'bullets', b.length ? b : ['']); }} className="text-bone4 hover:text-error text-xs px-1 self-start mt-2 transition-colors">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
                <button onClick={() => updateExperience(i, 'bullets', [...exp.bullets, ''])} className="text-[10px] text-accent hover:text-accent2 transition-colors">+ Add bullet</button>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Education */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-bone4 text-[10px] font-mono uppercase tracking-wider">Education</label>
          <button onClick={() => updateField('education', [...data.education, { institution: '', degree: '', year: '' }])} className="text-[10px] text-accent hover:text-accent2 transition-colors">+ Add</button>
        </div>
        <div className="space-y-2">
          {data.education.map((edu, i) => (
            <div key={i} className="bg-bg2 rounded-lg border border-white/[0.04] p-3 space-y-1.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-bone text-xs truncate">{edu.institution || 'New institution'}</span>
                <button onClick={() => updateField('education', data.education.filter((_, j) => j !== i))} className="text-bone4 hover:text-error text-xs transition-colors">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
              <input value={edu.institution} onChange={(e) => updateEducation(i, 'institution', e.target.value)} placeholder="Institution" className={inputClass} />
              <div className="grid grid-cols-2 gap-1.5">
                <input value={edu.degree} onChange={(e) => updateEducation(i, 'degree', e.target.value)} placeholder="Degree" className={inputClass} />
                <input value={edu.year} onChange={(e) => updateEducation(i, 'year', e.target.value)} placeholder="Year" className={inputClass} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className="text-bone4 text-[10px] font-mono uppercase tracking-wider mb-1.5 block">Skills</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {data.skills.map((skill, i) => (
            <span key={i} className="flex items-center gap-1 px-2 py-1 bg-bg2 border border-white/[0.04] rounded text-bone text-xs">
              {skill}
              <button onClick={() => updateField('skills', data.skills.filter((_, j) => j !== i))} className="text-bone4 hover:text-error ml-0.5 transition-colors">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input
            ref={skillInputRef}
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
            placeholder="Type a skill, press Enter"
            className={`flex-1 ${inputClass}`}
          />
          <button onClick={addSkill} className="px-3 py-2 bg-accent text-bg text-xs rounded-lg hover:bg-accent2 transition-colors shrink-0">Add</button>
        </div>
      </div>

      {/* Score toggle */}
      <button
        onClick={() => setShowScore(!showScore)}
        className="w-full py-2 bg-bg2 border border-white/[0.04] text-bone text-xs rounded-lg hover:border-white/[0.08] transition-colors flex items-center justify-center gap-2"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent"><path d="M12 20V10M6 20V4M18 20v-6" /></svg>
        {showScore ? 'Hide Score' : 'View Score'}
        {score && <span className="text-bone4 font-mono">{score.total}/100</span>}
      </button>

      {showScore && score && (
        <ScoreReveal score={score} onClose={() => setShowScore(false)} />
      )}

      {/* Actions */}
      <div className="space-y-2 pt-4 border-t border-white/[0.04]">
        <button
          onClick={() => save()}
          disabled={!hasUnsaved}
          className={`w-full py-2.5 text-sm font-semibold rounded-lg transition-colors ${
            hasUnsaved ? 'bg-accent text-bg hover:bg-accent2' : 'bg-bg2 text-bone4 cursor-default border border-white/[0.04]'
          }`}
        >
          {saving ? 'Saving...' : hasUnsaved ? 'Save Changes' : 'All saved'}
        </button>

        {isPublished && portfolio && (
          <>
            <button
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/p/${portfolio.slug}`); showToast('Link copied!'); }}
              className="w-full py-2 bg-bg2 border border-white/[0.04] text-bone text-xs rounded-lg hover:border-white/[0.08] transition-colors flex items-center justify-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
              Copy link
            </button>
            <Link href={`/dashboard/analytics?id=${portfolio.id}`} className="block w-full py-2 bg-bg2 border border-white/[0.04] text-bone text-xs rounded-lg hover:border-white/[0.08] transition-colors text-center">
              Analytics
            </Link>
          </>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => window.print()} className="py-2 bg-bg2 border border-white/[0.04] text-bone text-xs rounded-lg hover:border-white/[0.08] transition-colors flex items-center justify-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" /><path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3" /></svg>
            Export PDF
          </button>
          <button onClick={() => { sessionStorage.setItem('ff_roast_data', JSON.stringify(data)); window.open('/roast', '_blank'); }} className="py-2 bg-bg2 border border-white/[0.04] text-bone text-xs rounded-lg hover:border-white/[0.08] transition-colors flex items-center justify-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></svg>
            Roast
          </button>
        </div>
      </div>

      <p className="text-bone4 text-[10px] text-center">
        {typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent) ? 'Cmd' : 'Ctrl'}+S to save &middot; Auto-saves after 5s
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top bar */}
      <div className="border-b border-white/[0.04] px-4 lg:px-5 py-2.5 flex items-center justify-between shrink-0 no-print">
        <Link href="/dashboard" className="text-bone4 hover:text-bone3 text-sm transition-colors flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-bone text-sm truncate max-w-[180px]">{data.name}</span>
          {hasUnsaved && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" title="Unsaved" />}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saving && <span className="text-bone4 text-[10px] hidden sm:inline">Saving...</span>}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="lg:hidden px-2.5 py-1 bg-bg2 border border-white/[0.04] text-bone4 text-xs rounded-lg hover:text-bone3 transition-colors"
          >
            {showPreview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={togglePublish}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
              isPublished ? 'bg-success/10 text-success border border-success/15' : 'bg-bg2 border border-white/[0.04] text-bone4 hover:text-bone3'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-success' : 'bg-bone4'}`} />
            <span className="hidden sm:inline">{isPublished ? 'Live' : 'Draft'}</span>
          </button>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex flex-1 overflow-hidden">
        <div className={`${showPreview ? 'hidden' : 'block'} lg:block w-full lg:w-[400px] shrink-0 lg:border-r border-white/[0.04] overflow-y-auto`}>
          {editorPanel}
        </div>
        <div className={`${showPreview ? 'block' : 'hidden'} lg:block flex-1 overflow-y-auto`}>
          <div className="min-h-full">
            <TemplateRenderer template={template} data={data} showBadge={false} />
          </div>
        </div>
      </div>

      {/* Publish celebration */}
      {showPublishCelebration && portfolio && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-5 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-bg2 border border-white/[0.06] rounded-xl p-7 max-w-sm w-full text-center animate-[fadeInUp_0.25s_ease-out]">
            <div className="w-12 h-12 rounded-full bg-success/10 border border-success/15 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <h3 className="text-lg font-bold text-bone mb-1">Portfolio is live!</h3>
            <p className="text-bone4 text-sm mb-5">Share your link &mdash; we&apos;ll tell you who views it.</p>
            <div className="space-y-2">
              <button
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/p/${portfolio.slug}`); showToast('Link copied!'); }}
                className="w-full py-2.5 bg-accent text-bg text-sm font-semibold rounded-lg hover:bg-accent2 transition-colors flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                Copy Public Link
              </button>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}/p/${portfolio.slug}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="block w-full py-2.5 bg-bg3/50 border border-white/[0.04] text-bone text-sm rounded-lg hover:border-white/[0.08] transition-colors text-center"
              >
                Share on LinkedIn
              </a>
              <button onClick={() => setShowPublishCelebration(false)} className="w-full py-2 text-bone4 text-xs hover:text-bone3 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 px-3.5 py-2.5 bg-bg2 border border-white/[0.06] rounded-lg shadow-lg text-bone text-xs animate-[fadeInUp_0.2s_ease-out] flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success"><path d="M20 6L9 17l-5-5" /></svg>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
