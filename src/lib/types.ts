// ─── Portfolio Data Types ───

export interface PortfolioProject {
  title: string;
  description: string;
  tech: string[];
  link?: string;
}

export interface PortfolioExperience {
  company: string;
  role: string;
  period: string;
  description: string;
  highlights: string[];
  title?: string;
  bullets?: string[];
}

export interface PortfolioStat {
  value: string;
  label: string;
}

export interface PortfolioData {
  name: string;
  headline: string;
  about: string;
  avatarUrl?: string;
  skills: string[];
  projects: PortfolioProject[];
  experience: PortfolioExperience[];
  contact: {
    email: string;
    website?: string;
    github?: string;
    linkedin?: string;
  };
  role?: string;
  tagline?: string;
  stats?: PortfolioStat[];
  education?: Education[];
}

// ─── Section Visibility & Ordering ───

export type SectionId = 'hero' | 'about' | 'projects' | 'experience' | 'skills' | 'contact';

export interface SectionConfig {
  id: SectionId;
  label: string;
  visible: boolean;
}

// ─── Templates ───

export type TemplateId = 'minimal' | 'developer';

export interface TemplateInfo {
  id: TemplateId;
  name: string;
  description: string;
  isPro?: boolean;
}

export const TEMPLATES: TemplateInfo[] = [
  { id: 'minimal', name: 'Minimal', description: 'Clean whitespace, elegant typography, understated confidence.' },
  { id: 'developer', name: 'Developer', description: 'Dark theme, monospace accents, built for engineers.' },
];

// ─── Processing Steps ───

export interface ProcessingStep {
  id: string;
  label: string;
  duration: number; // ms
}

export const PROCESSING_STEPS: ProcessingStep[] = [
  { id: 'read', label: 'Reading Resume', duration: 800 },
  { id: 'extract', label: 'Extracting Projects', duration: 1200 },
  { id: 'analyze', label: 'Analyzing Experience', duration: 1000 },
  { id: 'generate', label: 'Generating Portfolio', duration: 1500 },
];

// ─── Default Sections ───

export const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'hero', label: 'Hero', visible: true },
  { id: 'about', label: 'About', visible: true },
  { id: 'projects', label: 'Projects', visible: true },
  { id: 'experience', label: 'Experience', visible: true },
  { id: 'skills', label: 'Skills', visible: true },
  { id: 'contact', label: 'Contact', visible: true },
];

// ─── Legacy Exports (backward compat with existing routes/pages) ───

export type Field = 'cs' | 'design' | 'marketing' | 'business' | 'other';

export const FIELD_LABELS: Record<Field, string> = {
  cs: 'Computer Science',
  design: 'Design',
  marketing: 'Marketing',
  business: 'Business',
  other: 'Other',
};

export type Template = 'system-dark' | 'clean-light' | 'split-editorial' | 'broadsheet' | 'warm-editorial';

export interface Education {
  school: string;
  degree: string;
  period: string;
  institution?: string;
  year?: string;
}

export interface Portfolio {
  id: string;
  slug: string;
  field: Field;
  template: Template;
  data: PortfolioData;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  is_published?: boolean;
  score?: number;
  view_count?: number;
  raw_linkedin_text?: string;
  is_pro?: boolean;
}

export type PortfolioRecord = Portfolio;

// ─── Layer 2: Intelligence Types ───────────────────────────

export type SkillGapLevel = 'critical' | 'important' | 'nice-to-have';
export type DemandTrend   = 'rising' | 'stable' | 'declining';

export interface SkillGap {
  skill:       string;
  level:       SkillGapLevel;   // how critical is this gap
  reason:      string;          // why it matters for their target role
  learningPath: string;         // specific resource/approach to close it
  timeToLearn: string;          // e.g. "2–3 weeks"
}

export interface SalaryRange {
  low:      number;
  median:   number;
  high:     number;
  currency: string;
}

export interface MarketSignal {
  demandScore:    number;       // 0–100
  trend:          DemandTrend;
  trendLabel:     string;       // e.g. "+18% YoY demand"
  salaryRange:    SalaryRange;
  topLocations:   string[];
  remotePercent:  number;       // 0–100
  insight:        string;       // 1-sentence market summary
  topSkillsInDemand: string[];
}

export type CompanySignalType = 'hiring-surge' | 'funding' | 'expansion' | 'product-launch';

export interface CompanySignal {
  name:        string;
  signal:      CompanySignalType;
  signalLabel: string;          // human-readable signal description
  openRoles:   number;
  fitScore:    number;          // 0–100, how well they match the user's profile
  why:         string;          // why this company is a good fit right now
  urgency:     'high' | 'medium' | 'low';
}

export interface ReadinessScore {
  overall:    number;           // 0–100
  breakdown: {
    portfolio:  number;
    skills:     number;
    experience: number;
    market:     number;
  };
  topWin:     string;           // "Your strongest signal right now"
  topGap:     string;           // "Your biggest gap right now"
}

export interface IntelligenceReport {
  portfolioId:  string;
  generatedAt:  string;         // ISO timestamp
  targetRole:   string;
  field:        string;
  readiness:    ReadinessScore;
  skillGaps:    SkillGap[];
  market:       MarketSignal;
  companies:    CompanySignal[];
}

// ─── Layer 3: Network / Relationships Types ─────────────────

export type RelationshipType = 'colleague' | 'classmate' | 'friend' | 'acquaintance' | 'mentor';
export type ConnectionStrength = 'strong' | 'medium' | 'weak';
export type TargetStatus = 'researching' | 'warm-path' | 'applied' | 'interviewing' | 'offer';
export type TargetPriority = 'high' | 'medium' | 'low';

export interface Connection {
  id:           string;
  user_id:      string;
  name:         string;
  role:         string;
  company:      string;
  relationship: RelationshipType;
  strength:     ConnectionStrength;
  notes?:       string;
  created_at:   string;
}

export interface TargetCompany {
  id:           string;
  user_id:      string;
  company_name: string;
  target_role:  string;
  priority:     TargetPriority;
  status:       TargetStatus;
  notes?:       string;
  created_at:   string;
}

export interface WarmPath {
  target:      TargetCompany;
  connections: Connection[];   // connections at or near this company
  approach:    string;         // AI-suggested approach
  confidence:  number;         // 0–100
}

export interface OutreachMessage {
  subject:     string;
  body:        string;
  tone:        'warm' | 'professional' | 'casual';
  connection:  Connection;
  targetRole:  string;
  company:     string;
}

// ─── Layer 3: Career Mirror Types ───────────────────────────

export type ArchetypeLabel =
  | 'The Implementer'    // executes well, never initiates
  | 'The Support Player' // contributes reliably, no ownership language
  | 'The Builder'        // self-originated work, built from scratch
  | 'The Strategist'     // direction-setting and decisions above execution
  | 'The Specialist'     // deep domain, unclear scope
  | 'The Leader'         // team/org-level scope evidenced

export type EvidenceType = 'weakness' | 'strength' | 'missing'

export type GapSize = 'structural' | 'framing' | 'surgical'
// structural = target role requires experience not demonstrated at all
// framing    = experience exists but presented wrong — gap is in language
// surgical   = small specific edits would shift the read significantly

export interface MirrorEvidence {
  type:    EvidenceType
  finding: string         // one specific observation
  quote?:  string | null  // exact words from portfolio if applicable
  section: 'headline' | 'about' | 'experience' | 'projects' | 'skills'
  impact:  string         // what this signals to a hiring manager
}

export interface MirrorMove {
  location: string   // specific section/role — not generic
  action:   string   // what to change, referencing actual content
  reason:   string   // why this shifts the cold read
}

export interface CareerMirrorReport {
  portfolioId:    string
  generatedAt:    string
  targetRole:     string
  targetCompany?: string
  coldRead: {
    archetype:      ArchetypeLabel
    verdict:        string         // "The market reads you as..." — the key sentence
    firstImpression: string        // what stands out in the first 5 seconds
    evidenceCount:  number         // how many signals found (replaces confidence %)
  }
  evidence:       MirrorEvidence[]  // 4–8 items
  perceptionGap: {
    yourWordsSignal:    string   // what their portfolio text is actually communicating
    hiringManagerReads: string   // what the cold read concludes
    gapSize:            GapSize
  }
  topMoves:       MirrorMove[]   // exactly 3
  archetypePath: {
    summary: string              // "Professionals with this archetype who reached [level] did X"
    moves:   string[]            // 3 concrete moves others made
  }
  diagnosis:  string             // AI-generated 2-sentence conclusion — not hardcoded
  topFix:     string             // single highest-leverage specific action
}

// ─── Screen 17: ATS Autopsy ──────────────────────────────────

export type ATSVerdict      = 'Strong Pass' | 'Marginal' | 'Likely Filtered'
export type CriterionWeight = 'knockout' | 'high' | 'medium'

export interface ATSCriterion {
  criterion: string
  type:      'keyword' | 'experience' | 'education' | 'cert'
  weight:    CriterionWeight
  present:   boolean
  found_at:  string | null   // exact quote from portfolio; null = not found or free user
  fix:       string | null   // exact text to add; null when present = true
}

export interface ATSReport {
  job_title:         string
  pass_rate:         number        // 0–100, server-recalculated with weighting
  verdict:           ATSVerdict
  has_knockout_fail: boolean       // pre-computed: any knockout criterion failed
  required:          ATSCriterion[]
  preferred:         ATSCriterion[]
  quick_wins:        string[]      // max 3, specific fixes under 10 min
}

// ─── Screen 18: Offer Analyzer ───────────────────────────────

export type OfferSeniority      = 'junior' | 'mid' | 'senior' | 'staff' | 'principal' | 'director'
export type NegotiationLeverage = 'High' | 'Medium' | 'Low'

export interface CompAnalysis {
  market_low:    number
  market_median: number
  market_high:   number
  percentile:    number          // 0–100, where the current offer sits
  verdict:       'Above Market' | 'At Market' | 'Below Market'
  gap:           number          // offer minus median (negative = underpaid)
  insight:       string          // 1-sentence specific observation
}

export interface EquityAnalysis {
  annual_value: number | null    // dollar value of equity per year
  exit_1_5x:   number | null     // value at 1.5x exit
  exit_3x:     number | null
  exit_10x:    number | null
  risk_level:  'High' | 'Medium' | 'Low'
  verdict:     string            // 1-sentence plain-English assessment
  has_equity:  boolean
}

export interface NegotiationScript {
  leverage:         NegotiationLeverage
  leverage_reason:  string        // why leverage is this level
  counter_base:     number        // recommended counter salary
  counter_equity?:  number | null
  counter_signing?: number | null
  script:           string        // exact words — teleprompter block
  talking_points:   string[]      // 2–3 specific leverage points
  walk_away_line:   string        // exact words for the counter-counter
  walk_away_floor:  number        // minimum acceptable number
}

export interface OfferReport {
  comp:        CompAnalysis
  equity:      EquityAnalysis
  negotiation: NegotiationScript
}

export interface OfferInput {
  company:          string
  is_public:        boolean
  role:             string
  seniority:        OfferSeniority
  location:         string
  base_salary:      number
  equity_annual?:   number | null
  competing_offer?: number | null
  current_comp?:    number | null
  other_comp?:      number | null
}

// ─── Screen 16: Ghost Job Detector ──────────────────────────

export type GhostVerdict = 'Likely Active' | 'Uncertain' | 'Likely Ghost'

export interface GhostSignal {
  name:     string
  detected: boolean
  evidence: string | null   // AI's description of what it found (not a verbatim quote)
  weight:   'high' | 'medium' | 'low'
}

export interface GhostReport {
  signals:            GhostSignal[]
  hiring_confidence:  number          // 0–100, higher = more likely real
  verdict:            GhostVerdict
  top_concern:        string          // single sentence main reason for verdict
  seniority_level:    'entry' | 'mid' | 'senior' | 'staff'
}
