export type Field = 'cs' | 'design' | 'finance' | 'research' | 'marketing';

export interface PortfolioStat {
  label: string;
  value: string;
}

export interface Experience {
  company: string;
  title: string;
  period: string;
  bullets: string[];
}

export interface Education {
  institution: string;
  degree: string;
  year: string;
}

export interface PortfolioData {
  name: string;
  role: string;
  tagline: string;
  stats: PortfolioStat[];
  experience: Experience[];
  education: Education[];
  skills: string[];
}

export interface Portfolio {
  id: string;
  user_id: string;
  slug: string;
  template: string;
  data: PortfolioData;
  raw_linkedin_text: string;
  field: Field;
  is_published: boolean;
  is_pro: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEntry {
  id: string;
  portfolio_id: string;
  visitor_ip: string;
  company: string;
  city: string;
  country: string;
  referrer: string;
  user_agent: string;
  duration_seconds: number | null;
  visited_at: string;
}

export type Template = 'system-dark' | 'clean-light' | 'split-editorial' | 'broadsheet' | 'warm-editorial';

export const FIELD_COLORS: Record<Field, string> = {
  cs: '#4CC9FF',
  design: '#C77DFF',
  marketing: '#FF9A3C',
  finance: '#FFD700',
  research: '#4CFFB5',
};

export const FIELD_LABELS: Record<Field, string> = {
  cs: 'CS',
  design: 'Design',
  marketing: 'Marketing',
  finance: 'Finance',
  research: 'Research',
};

export const TEMPLATES: { id: Template; name: string; isPro: boolean }[] = [
  { id: 'system-dark', name: 'System Dark', isPro: false },
  { id: 'clean-light', name: 'Clean Light', isPro: false },
  { id: 'split-editorial', name: 'Split Editorial', isPro: false },
  { id: 'broadsheet', name: 'Broadsheet', isPro: true },
  { id: 'warm-editorial', name: 'Warm Editorial', isPro: true },
];
