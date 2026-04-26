'use client';

import { TEMPLATES, TemplateId } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TemplateSwitcherProps {
  activeTemplate: TemplateId;
  onSwitch: (id: TemplateId) => void;
}

export default function TemplateSwitcher({ activeTemplate, onSwitch }: TemplateSwitcherProps) {
  return (
    <div className="space-y-1">
      <div className="px-1 mb-3">
        <h3 className="text-[11px] font-mono text-white/25 uppercase tracking-[0.1em]">Template</h3>
      </div>
      {TEMPLATES.map((tmpl) => (
        <button
          key={tmpl.id}
          onClick={() => onSwitch(tmpl.id)}
          className={cn(
            'w-full text-left px-3 py-3 rounded-[12px] transition-all duration-150',
            activeTemplate === tmpl.id
              ? 'bg-[#d4fb08]/[0.05] border border-[#d4fb08]/10'
              : 'hover:bg-white/[0.03] border border-transparent'
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-7 rounded-[8px] border flex items-center justify-center text-[10px] font-mono',
              tmpl.id === 'developer'
                ? 'bg-[#0a0a0f] border-white/[0.08] text-[#d4fb08]'
                : 'bg-white/[0.06] border-white/[0.08] text-white/50'
            )}>
              {tmpl.id === 'developer' ? '>' : 'Aa'}
            </div>
            <div>
              <p className="text-[13px] font-medium text-white/75">{tmpl.name}</p>
              <p className="text-[11px] text-white/25 mt-0.5 leading-relaxed">{tmpl.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
