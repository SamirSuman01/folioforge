import { create } from 'zustand'

/* ─────────────────────────────────────────────────────────
   ONBOARDING STORE — UI state for the 5-step flow.
   This is pure UI state — not persisted, not synced.
   On refresh, user starts over (intentional — keeps it simple).
   ───────────────────────────────────────────────────────── */

export type OnboardingField =
  | 'software-engineering'
  | 'product-design'
  | 'product-management'
  | 'business-finance'
  | 'marketing'
  | 'data-analytics'
  | 'healthcare'
  | 'education'
  | 'creative'
  | 'other'

export type OnboardingInputMethod = 'linkedin' | 'paste' | 'manual'

export interface OnboardingState {
  // Step 1 — Curiosity
  name:       string
  role:       string

  // Step 2 — Target
  field:      OnboardingField | null
  targetCos:  string[]        // up to 3 company names

  // Step 3 — Input
  inputMethod:   OnboardingInputMethod | null
  linkedinUrl:   string
  pastedText:    string

  // Step 4 — Validation (extracted data)
  extractedData: ExtractedData | null
  isExtracting:  boolean
  extractError:  string | null

  // Step 5 — Generation
  generatedSections: GeneratedSection[]
  isGenerating:  boolean
  generateError: string | null

  // Actions
  setName:            (name: string) => void
  setRole:            (role: string) => void
  setField:           (field: OnboardingField) => void
  setTargetCos:       (cos: string[]) => void
  setInputMethod:     (method: OnboardingInputMethod) => void
  setLinkedinUrl:     (url: string) => void
  setPastedText:      (text: string) => void
  setExtractedData:   (data: ExtractedData) => void
  setIsExtracting:    (v: boolean) => void
  setExtractError:    (e: string | null) => void
  setGeneratedSections: (sections: GeneratedSection[]) => void
  setIsGenerating:    (v: boolean) => void
  setGenerateError:   (e: string | null) => void
  reset:              () => void
}

export interface ExtractedData {
  name:         string
  currentRole:  string
  companies:    string[]
  skills:       string[]
  yearsExp:     number | null
  rawText:      string
  confidence:   'high' | 'medium' | 'low'
}

export interface GeneratedSection {
  type:  string
  label: string
  data:  Record<string, unknown>
}

const initialState = {
  name:              '',
  role:              '',
  field:             null,
  targetCos:         [],
  inputMethod:       null,
  linkedinUrl:       '',
  pastedText:        '',
  extractedData:     null,
  isExtracting:      false,
  extractError:      null,
  generatedSections: [],
  isGenerating:      false,
  generateError:     null,
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  setName:          (name)    => set({ name }),
  setRole:          (role)    => set({ role }),
  setField:         (field)   => set({ field }),
  setTargetCos:     (cos)     => set({ targetCos: cos }),
  setInputMethod:   (method)  => set({ inputMethod: method }),
  setLinkedinUrl:   (url)     => set({ linkedinUrl: url }),
  setPastedText:    (text)    => set({ pastedText: text }),
  setExtractedData: (data)    => set({ extractedData: data }),
  setIsExtracting:  (v)       => set({ isExtracting: v }),
  setExtractError:  (e)       => set({ extractError: e }),
  setGeneratedSections: (s)   => set({ generatedSections: s }),
  setIsGenerating:  (v)       => set({ isGenerating: v }),
  setGenerateError: (e)       => set({ generateError: e }),
  reset:            ()        => set(initialState),
}))
