import { create } from 'zustand';
import { PortfolioData, SectionConfig, TemplateId, DEFAULT_SECTIONS } from './types';
import { mockPortfolio } from './mock-data';

interface AppState {
  // Upload
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;

  // Portfolio data
  portfolio: PortfolioData;
  setPortfolio: (data: PortfolioData) => void;
  updatePortfolioField: <K extends keyof PortfolioData>(key: K, value: PortfolioData[K]) => void;

  // Sections
  sections: SectionConfig[];
  setSections: (sections: SectionConfig[]) => void;
  toggleSection: (id: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;

  // Template
  activeTemplate: TemplateId;
  setActiveTemplate: (template: TemplateId) => void;

  // Processing
  isProcessing: boolean;
  processingStep: number;
  setIsProcessing: (v: boolean) => void;
  setProcessingStep: (step: number) => void;

  // Published
  isPublished: boolean;
  publishedSlug: string;
  publish: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Upload
  uploadedFile: null,
  setUploadedFile: (file) => set({ uploadedFile: file }),

  // Portfolio
  portfolio: mockPortfolio,
  setPortfolio: (data) => set({ portfolio: data }),
  updatePortfolioField: (key, value) =>
    set((state) => ({ portfolio: { ...state.portfolio, [key]: value } })),

  // Sections
  sections: DEFAULT_SECTIONS,
  setSections: (sections) => set({ sections }),
  toggleSection: (id) =>
    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === id ? { ...s, visible: !s.visible } : s
      ),
    })),
  reorderSections: (fromIndex, toIndex) =>
    set((state) => {
      const updated = [...state.sections];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return { sections: updated };
    }),

  // Template
  activeTemplate: 'minimal',
  setActiveTemplate: (template) => set({ activeTemplate: template }),

  // Processing
  isProcessing: false,
  processingStep: 0,
  setIsProcessing: (v) => set({ isProcessing: v }),
  setProcessingStep: (step) => set({ processingStep: step }),

  // Published
  isPublished: false,
  publishedSlug: 'sarah-chen',
  publish: () => set({ isPublished: true }),
}));
