import type { PortfolioData, Field } from './types';

export interface ScoreTip {
  category: string;
  message: string;
  impact: number; // how many points they'd gain
}

export interface ScoreBreakdown {
  completeness: number;    // /25
  impactLanguage: number;  // /25
  depth: number;           // /20
  fieldRelevance: number;  // /15
  presentation: number;    // /15
  total: number;           // /100
  grade: string;           // A+, A, B+, B, C+, C, D
  tips: ScoreTip[];
}

// Action verbs that signal strong bullet writing
const ACTION_VERBS = [
  'led', 'built', 'shipped', 'designed', 'launched', 'grew', 'reduced',
  'increased', 'created', 'developed', 'managed', 'implemented', 'architected',
  'optimized', 'scaled', 'automated', 'delivered', 'improved', 'established',
  'pioneered', 'spearheaded', 'orchestrated', 'transformed', 'negotiated',
  'generated', 'secured', 'streamlined', 'drove', 'executed', 'mentored',
];

// Metrics pattern: numbers with optional suffixes (%, $, K, M, B, x)
const METRIC_PATTERN = /\b\d[\d,.]*\s*[%$KMBx]|\$\s*\d[\d,.]*|\b\d+\+?\b(?:\s*(?:years?|months?|users?|clients?|projects?|people|team|members))/i;

// Realistic metric values (not gaming with "999999%")
const REALISTIC_METRIC = /\b(?:\d{1,3}(?:,\d{3})*|\d{1,4})\s*[%$KMBx]|\$\s*(?:\d{1,3}(?:,\d{3})*|\d{1,4}[KMB]?)/i;

// Field-specific skill keywords
const FIELD_SKILLS: Record<Field, string[]> = {
  cs: ['react', 'python', 'javascript', 'typescript', 'aws', 'docker', 'kubernetes', 'node', 'sql', 'git', 'api', 'cloud', 'devops', 'machine learning', 'golang', 'go', 'rust', 'java', 'c++', 'graphql', 'redis', 'postgresql', 'mongodb'],
  design: ['figma', 'sketch', 'adobe', 'ui', 'ux', 'prototyping', 'wireframe', 'typography', 'branding', 'illustration', 'motion', 'design system', 'user research', 'accessibility', 'photoshop', 'after effects'],
  finance: ['financial modeling', 'excel', 'bloomberg', 'valuation', 'risk', 'compliance', 'audit', 'forecasting', 'budgeting', 'analysis', 'portfolio', 'trading', 'derivatives', 'equity', 'accounting', 'gaap'],
  marketing: ['seo', 'sem', 'analytics', 'campaign', 'content', 'social media', 'email', 'crm', 'hubspot', 'google ads', 'copywriting', 'branding', 'growth', 'conversion', 'funnel', 'a/b testing'],
  research: ['research', 'publication', 'analysis', 'methodology', 'statistics', 'data', 'peer review', 'hypothesis', 'experiment', 'survey', 'qualitative', 'quantitative', 'r', 'spss', 'matlab', 'thesis'],
};

function textSimilarity(a: string, b: string): number {
  const arrA = a.toLowerCase().split(/\s+/);
  const arrB = b.toLowerCase().split(/\s+/);
  const setB = new Set(arrB);
  const intersection = arrA.filter(w => setB.has(w)).length;
  const union = new Set(arrA.concat(arrB)).size;
  return union > 0 ? intersection / union : 0;
}

export function scorePortfolio(data: PortfolioData, field: Field): ScoreBreakdown {
  const tips: ScoreTip[] = [];
  let completeness = 0;
  let impactLanguage = 0;
  let depth = 0;
  let fieldRelevance = 0;
  let presentation = 0;

  // ═══════════════════════════════════════════
  // COMPLETENESS (25 points)
  // ═══════════════════════════════════════════

  if (data.name && data.name.length >= 2) completeness += 3;
  else tips.push({ category: 'Completeness', message: 'Add your full name', impact: 3 });

  if (data.role && data.role.length >= 3) completeness += 3;
  else tips.push({ category: 'Completeness', message: 'Add your current role/title', impact: 3 });

  if (data.tagline && data.tagline.length >= 30) completeness += 5;
  else if (data.tagline && data.tagline.length > 0) {
    completeness += 2;
    tips.push({ category: 'Completeness', message: 'Expand your tagline — aim for 50+ characters with a specific accomplishment', impact: 3 });
  } else {
    tips.push({ category: 'Completeness', message: 'Add a tagline that summarizes your impact in one sentence', impact: 5 });
  }

  const statsCount = Math.min(data.stats.filter(s => s.value && s.label).length, 4);
  completeness += Math.min(statsCount * 2, 4);
  if (statsCount < 2) tips.push({ category: 'Completeness', message: `Add ${2 - statsCount} more stat(s) — numbers grab attention in the first 3 seconds`, impact: (2 - statsCount) * 2 });

  const expCount = data.experience.filter(e => e.company && e.title).length;
  completeness += Math.min(expCount * 2.5, 5);
  if (expCount < 2) tips.push({ category: 'Completeness', message: 'Add at least 2 work experiences to show career progression', impact: (2 - expCount) * 2.5 });

  const eduCount = data.education.filter(e => e.institution).length;
  completeness += Math.min(eduCount * 3, 3);
  if (eduCount === 0) tips.push({ category: 'Completeness', message: 'Add your education — even one entry adds credibility', impact: 3 });

  const skillCount = data.skills.filter(s => s.length > 0).length;
  completeness += Math.min(skillCount >= 5 ? 2 : skillCount >= 3 ? 1 : 0, 2);
  if (skillCount < 5) tips.push({ category: 'Completeness', message: `Add ${5 - skillCount} more skills to reach the recommended minimum of 5`, impact: 1 });

  // ═══════════════════════════════════════════
  // IMPACT LANGUAGE (25 points)
  // ═══════════════════════════════════════════

  const allBullets = data.experience.flatMap(e => e.bullets).filter(b => b.length > 0);

  if (allBullets.length > 0) {
    // Metric usage: how many bullets contain quantified results
    const bulletsWithMetrics = allBullets.filter(b => REALISTIC_METRIC.test(b));
    const metricRatio = bulletsWithMetrics.length / allBullets.length;
    const metricPoints = Math.min(Math.round(metricRatio * 12), 12);
    impactLanguage += metricPoints;

    const bulletsWithoutMetrics = allBullets.length - bulletsWithMetrics.length;
    if (bulletsWithoutMetrics > 0) {
      tips.push({
        category: 'Impact',
        message: `${bulletsWithoutMetrics} of your ${allBullets.length} bullet${allBullets.length > 1 ? 's' : ''} lack metrics. Add numbers (%, $, users) to show real impact`,
        impact: Math.min(bulletsWithoutMetrics * 2, 8),
      });
    }

    // Action verbs at start of bullets
    const bulletsWithVerbs = allBullets.filter(b => {
      const firstWord = b.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
      return ACTION_VERBS.includes(firstWord);
    });
    const verbRatio = bulletsWithVerbs.length / allBullets.length;
    const verbPoints = Math.min(Math.round(verbRatio * 8), 8);
    impactLanguage += verbPoints;

    if (verbRatio < 0.5) {
      tips.push({
        category: 'Impact',
        message: 'Start more bullets with action verbs (Led, Built, Shipped, Grew) instead of passive phrases',
        impact: Math.min(4, 8 - verbPoints),
      });
    }

    // Dollar amounts or revenue impact
    const hasDollarImpact = allBullets.some(b => /\$[\d,.]+[KMB]?|\d+[KMB]?\s*(?:revenue|savings|ARR|MRR)/i.test(b));
    impactLanguage += hasDollarImpact ? 5 : 0;
    if (!hasDollarImpact) {
      tips.push({ category: 'Impact', message: 'Include at least one bullet with dollar impact ($X revenue, $X savings) — this is what recruiters look for', impact: 5 });
    }
  } else {
    tips.push({ category: 'Impact', message: 'Add bullet points to your experience entries describing your achievements', impact: 15 });
  }

  // ═══════════════════════════════════════════
  // DEPTH (20 points)
  // ═══════════════════════════════════════════

  // Average bullets per experience (target: 3+)
  const expWithBullets = data.experience.filter(e => e.bullets.length > 0);
  if (expWithBullets.length > 0) {
    const avgBullets = expWithBullets.reduce((sum, e) => sum + e.bullets.filter(b => b.length > 0).length, 0) / expWithBullets.length;
    depth += avgBullets >= 3 ? 8 : avgBullets >= 2 ? 5 : 2;
    if (avgBullets < 3) tips.push({ category: 'Depth', message: 'Aim for 3 bullets per experience — enough to show breadth without overwhelming', impact: 3 });
  }

  // Tagline quality (sweet spot: 50-200 chars)
  const tagLen = data.tagline?.length || 0;
  if (tagLen >= 50 && tagLen <= 200) depth += 4;
  else if (tagLen >= 30) depth += 2;

  // Stats have both label AND value filled
  const completeStats = data.stats.filter(s => s.value.length > 0 && s.label.length > 0);
  depth += Math.min(completeStats.length, 4);

  // Bullet length sweet spot (80-200 chars = ideal)
  if (allBullets.length > 0) {
    const idealBullets = allBullets.filter(b => b.length >= 80 && b.length <= 250);
    const idealRatio = idealBullets.length / allBullets.length;
    depth += Math.round(idealRatio * 4);
    const shortBullets = allBullets.filter(b => b.length < 50);
    if (shortBullets.length > 0) {
      tips.push({ category: 'Depth', message: `${shortBullets.length} bullet(s) are too short (under 50 chars). Add context: what you did, how, and the result`, impact: 2 });
    }
  }

  // ═══════════════════════════════════════════
  // FIELD RELEVANCE (15 points)
  // ═══════════════════════════════════════════

  const fieldKeywords = FIELD_SKILLS[field] || [];
  const allText = [
    ...data.skills.map(s => s.toLowerCase()),
    ...allBullets.map(b => b.toLowerCase()),
    data.role.toLowerCase(),
    data.tagline?.toLowerCase() || '',
  ].join(' ');

  const matchedKeywords = fieldKeywords.filter(kw => allText.includes(kw));
  const keywordRatio = fieldKeywords.length > 0 ? matchedKeywords.length / Math.min(fieldKeywords.length, 10) : 0;

  // Skills matching field
  const skillMatches = data.skills.filter(s => fieldKeywords.some(kw => s.toLowerCase().includes(kw)));
  fieldRelevance += Math.min(skillMatches.length * 2, 8);

  // Experience titles/bullets matching field
  fieldRelevance += Math.min(Math.round(keywordRatio * 7), 7);

  if (keywordRatio < 0.3) {
    tips.push({
      category: 'Relevance',
      message: `Your portfolio doesn't strongly signal "${field}" expertise. Add field-specific skills and terminology`,
      impact: 5,
    });
  }

  // ═══════════════════════════════════════════
  // PRESENTATION (15 points)
  // ═══════════════════════════════════════════

  // No empty/shell fields
  const hasEmptyFields = [
    data.name.length < 2,
    data.role.length < 3,
    data.experience.some(e => !e.company || !e.title),
    data.education.some(e => !e.institution),
    data.stats.some(s => (s.value && !s.label) || (!s.value && s.label)),
  ].filter(Boolean).length;
  presentation += hasEmptyFields === 0 ? 5 : Math.max(0, 5 - hasEmptyFields * 2);

  // No duplicate skills
  const uniqueSkills = new Set(data.skills.map(s => s.toLowerCase().trim()));
  const dupeCount = data.skills.length - uniqueSkills.size;
  presentation += dupeCount === 0 ? 3 : 1;
  if (dupeCount > 0) tips.push({ category: 'Presentation', message: `Remove ${dupeCount} duplicate skill(s) — duplicates look careless`, impact: 2 });

  // No single-word bullets
  const singleWordBullets = allBullets.filter(b => b.trim().split(/\s+/).length <= 3);
  presentation += singleWordBullets.length === 0 ? 4 : Math.max(0, 4 - singleWordBullets.length);

  // Education has degree and year
  const completeEdu = data.education.filter(e => e.institution && e.degree && e.year);
  presentation += completeEdu.length > 0 ? 3 : 0;
  if (data.education.length > 0 && completeEdu.length < data.education.length) {
    tips.push({ category: 'Presentation', message: 'Complete all education entries with institution, degree, and year', impact: 2 });
  }

  // Anti-gaming: too many skills penalty
  if (skillCount > 15) {
    presentation -= 2;
    tips.push({ category: 'Presentation', message: 'Too many skills (15+) dilutes focus. Keep your top 8-12 strongest skills', impact: 2 });
  }

  // Duplicate bullet detection
  for (let i = 0; i < allBullets.length; i++) {
    for (let j = i + 1; j < allBullets.length; j++) {
      if (textSimilarity(allBullets[i], allBullets[j]) > 0.7) {
        presentation -= 2;
        tips.push({ category: 'Presentation', message: 'You have very similar bullets — diversify your achievements', impact: 2 });
        break;
      }
    }
    if (presentation < 0) break;
  }

  // Clamp all categories
  completeness = Math.max(0, Math.min(25, Math.round(completeness)));
  impactLanguage = Math.max(0, Math.min(25, Math.round(impactLanguage)));
  depth = Math.max(0, Math.min(20, Math.round(depth)));
  fieldRelevance = Math.max(0, Math.min(15, Math.round(fieldRelevance)));
  presentation = Math.max(0, Math.min(15, Math.round(presentation)));

  const total = completeness + impactLanguage + depth + fieldRelevance + presentation;

  // Grade assignment
  let grade: string;
  if (total >= 95) grade = 'A+';
  else if (total >= 88) grade = 'A';
  else if (total >= 80) grade = 'B+';
  else if (total >= 70) grade = 'B';
  else if (total >= 60) grade = 'C+';
  else if (total >= 50) grade = 'C';
  else grade = 'D';

  // Sort tips by impact (highest first), limit to 5
  tips.sort((a, b) => b.impact - a.impact);

  return {
    completeness,
    impactLanguage,
    depth,
    fieldRelevance,
    presentation,
    total,
    grade,
    tips: tips.slice(0, 5),
  };
}
