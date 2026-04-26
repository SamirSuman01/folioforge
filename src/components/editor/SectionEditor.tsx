'use client';

import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Eye, EyeOff, GripVertical } from 'lucide-react';
import { SectionConfig } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SectionEditorProps {
  sections: SectionConfig[];
  onToggle: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  activeSection: string | null;
  onSelectSection: (id: string | null) => void;
}

export default function SectionEditor({ sections, onToggle, onReorder, activeSection, onSelectSection }: SectionEditorProps) {
  return (
    <div className="space-y-0.5">
      <div className="px-1 mb-3">
        <h3 className="text-[11px] font-mono text-white/25 uppercase tracking-[0.1em]">Sections</h3>
      </div>
      {sections.map((section, index) => (
        <motion.div
          key={section.id}
          layout
          className={cn(
            'group flex items-center gap-2 px-3 py-2.5 rounded-[12px] cursor-pointer transition-all duration-150',
            activeSection === section.id
              ? 'bg-[#d4fb08]/[0.05] border border-[#d4fb08]/10'
              : 'hover:bg-white/[0.03] border border-transparent'
          )}
          onClick={() => onSelectSection(activeSection === section.id ? null : section.id)}
        >
          <GripVertical className="w-3.5 h-3.5 text-white/15 flex-shrink-0 cursor-grab" />
          <span className={cn('flex-1 text-[13px] font-medium', section.visible ? 'text-white/70' : 'text-white/20 line-through')}>
            {section.label}
          </span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {index > 0 && (
              <button onClick={(e) => { e.stopPropagation(); onReorder(index, index - 1); }} className="p-1 rounded-[8px] hover:bg-white/[0.06] transition-colors duration-150">
                <ChevronUp className="w-3.5 h-3.5 text-white/30" />
              </button>
            )}
            {index < sections.length - 1 && (
              <button onClick={(e) => { e.stopPropagation(); onReorder(index, index + 1); }} className="p-1 rounded-[8px] hover:bg-white/[0.06] transition-colors duration-150">
                <ChevronDown className="w-3.5 h-3.5 text-white/30" />
              </button>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(section.id); }}
            className={cn('p-1 rounded-[8px] transition-colors duration-150', section.visible ? 'text-white/25 hover:text-white/50 hover:bg-white/[0.06]' : 'text-white/10 hover:text-white/25 hover:bg-white/[0.04]')}
          >
            {section.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </motion.div>
      ))}
    </div>
  );
}
