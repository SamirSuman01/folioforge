'use client';

import { useState } from 'react';
import { Sparkles, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { PortfolioData, SectionId } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ContentEditorProps {
  sectionId: SectionId;
  data: PortfolioData;
  onUpdate: <K extends keyof PortfolioData>(key: K, value: PortfolioData[K]) => void;
}

const inputClass = 'w-full px-3 py-2 text-[13px] text-white/80 bg-white/[0.03] border border-white/[0.06] rounded-[10px] focus:outline-none focus:ring-1 focus:ring-[#d4fb08]/20 focus:border-[#d4fb08]/20 transition-all duration-150 placeholder:text-white/15';
const labelClass = 'text-[11px] font-mono text-white/25 uppercase tracking-[0.08em] mb-2 block';

export default function ContentEditor({ sectionId, data, onUpdate }: ContentEditorProps) {
  const [regenerating, setRegenerating] = useState(false);

  const simulateRegenerate = (callback: () => void) => {
    setRegenerating(true);
    setTimeout(() => { callback(); setRegenerating(false); }, 800);
  };

  switch (sectionId) {
    case 'hero':
      return (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Name</label>
            <input className={inputClass} value={data.name} onChange={(e) => onUpdate('name', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Headline</label>
            <div className="relative">
              <input className={inputClass} value={data.headline} onChange={(e) => onUpdate('headline', e.target.value)} />
              <RewriteBtn loading={regenerating} onClick={() => simulateRegenerate(() => onUpdate('headline', 'Senior Engineer building the future of the web'))} />
            </div>
          </div>
        </div>
      );
    case 'about':
      return (
        <div>
          <label className={labelClass}>Bio</label>
          <div className="relative">
            <textarea className={cn(inputClass, 'min-h-[120px] resize-none')} value={data.about} onChange={(e) => onUpdate('about', e.target.value)} />
            <RewriteBtn loading={regenerating} onClick={() => simulateRegenerate(() => onUpdate('about', 'Engineer with deep expertise in distributed systems and frontend architecture. I thrive where performance meets user experience.'))} />
          </div>
        </div>
      );
    case 'skills':
      return (
        <div>
          <label className={labelClass}>Skills</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {data.skills.map((skill, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-white/[0.04] border border-white/[0.06] rounded-[8px] text-white/50 group">
                {skill}
                <button onClick={() => onUpdate('skills', data.skills.filter((_, j) => j !== i))} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-2.5 h-2.5 text-white/30 hover:text-red-400" />
                </button>
              </span>
            ))}
          </div>
          <button onClick={() => onUpdate('skills', [...data.skills, 'New Skill'])} className="flex items-center gap-1.5 text-[12px] font-medium text-[#d4fb08]/60 hover:text-[#d4fb08] transition-colors duration-150">
            <Plus className="w-3 h-3" />Add skill
          </button>
        </div>
      );
    case 'projects':
      return (
        <div className="space-y-3">
          {data.projects.map((project, i) => (
            <div key={i} className="p-3 border border-white/[0.05] rounded-[12px] space-y-2 bg-white/[0.01]">
              <input className={inputClass} value={project.title} onChange={(e) => { const u = [...data.projects]; u[i] = { ...u[i], title: e.target.value }; onUpdate('projects', u); }} placeholder="Project title" />
              <textarea className={cn(inputClass, 'min-h-[56px] resize-none')} value={project.description} onChange={(e) => { const u = [...data.projects]; u[i] = { ...u[i], description: e.target.value }; onUpdate('projects', u); }} placeholder="Description" />
            </div>
          ))}
        </div>
      );
    case 'experience':
      return (
        <div className="space-y-3">
          {data.experience.map((exp, i) => (
            <div key={i} className="p-3 border border-white/[0.05] rounded-[12px] space-y-2 bg-white/[0.01]">
              <div className="grid grid-cols-2 gap-2">
                <input className={inputClass} value={exp.role} onChange={(e) => { const u = [...data.experience]; u[i] = { ...u[i], role: e.target.value }; onUpdate('experience', u); }} placeholder="Role" />
                <input className={inputClass} value={exp.company} onChange={(e) => { const u = [...data.experience]; u[i] = { ...u[i], company: e.target.value }; onUpdate('experience', u); }} placeholder="Company" />
              </div>
              <input className={inputClass} value={exp.period} onChange={(e) => { const u = [...data.experience]; u[i] = { ...u[i], period: e.target.value }; onUpdate('experience', u); }} placeholder="Period" />
            </div>
          ))}
        </div>
      );
    case 'contact':
      return (
        <div className="space-y-3">
          {[
            { label: 'Email', key: 'email' as const, val: data.contact.email },
            { label: 'Website', key: 'website' as const, val: data.contact.website || '' },
            { label: 'GitHub', key: 'github' as const, val: data.contact.github || '' },
            { label: 'LinkedIn', key: 'linkedin' as const, val: data.contact.linkedin || '' },
          ].map((f) => (
            <div key={f.key}>
              <label className={labelClass}>{f.label}</label>
              <input className={inputClass} value={f.val} onChange={(e) => onUpdate('contact', { ...data.contact, [f.key]: e.target.value })} />
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

function RewriteBtn({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button onClick={onClick} disabled={loading} className="absolute right-2 top-2 p-1.5 rounded-[8px] bg-[#d4fb08]/[0.06] text-[#d4fb08]/60 hover:bg-[#d4fb08]/10 hover:text-[#d4fb08] transition-all duration-150 disabled:opacity-30" title="AI Rewrite">
      {loading ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
    </button>
  );
}
