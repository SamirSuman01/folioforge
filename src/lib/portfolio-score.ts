import type { PortfolioData, Field } from './types';

export interface ScoreTip {
  category: string;
  message: string;    // what's wrong — specific, quotes real content
  fix?: string;       // step-by-step how to fix it
  impact: number;
}

export interface SubItem {
  label: string;
  earned: number;
  max: number;
  hint?: string; // shown when earned < max — tells user exactly what to add
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
  details: {
    completeness:   SubItem[];
    impactLanguage: SubItem[];
    depth:          SubItem[];
    fieldRelevance: SubItem[];
    presentation:   SubItem[];
  };
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
  business: ['financial modeling', 'excel', 'bloomberg', 'valuation', 'risk', 'compliance', 'audit', 'forecasting', 'budgeting', 'analysis', 'portfolio', 'trading', 'derivatives', 'equity', 'accounting', 'gaap', 'consulting', 'strategy'],
  marketing: ['seo', 'sem', 'analytics', 'campaign', 'content', 'social media', 'email', 'crm', 'hubspot', 'google ads', 'copywriting', 'branding', 'growth', 'conversion', 'funnel', 'a/b testing'],
  other: ['research', 'publication', 'analysis', 'methodology', 'statistics', 'data', 'peer review', 'hypothesis', 'experiment', 'survey', 'qualitative', 'quantitative', 'r', 'spss', 'matlab', 'thesis'],
};

function textSimilarity(a: string, b: string): number {
  const arrA = a.toLowerCase().split(/\s+/);
  const arrB = b.toLowerCase().split(/\s+/);
  const setB = new Set(arrB);
  const intersection = arrA.filter(w => setB.has(w)).length;
  const union = new Set(arrA.concat(arrB)).size;
  return union > 0 ? intersection / union : 0;
}

// Truncate a bullet for display in tips
function clip(s: string, max = 72): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

// Find which company a bullet belongs to
function bulletContext(bullet: string, experience: PortfolioData['experience']): string {
  for (const exp of experience) {
    const bullets = exp.bullets ?? exp.highlights ?? [];
    if (bullets.includes(bullet) && exp.company) return ` (${exp.company})`;
  }
  return '';
}

export function scorePortfolio(data: PortfolioData, field: Field): ScoreBreakdown {
  const tips: ScoreTip[] = [];
  let completeness = 0;
  let impactLanguage = 0;
  let depth = 0;
  let fieldRelevance = 0;
  let presentation = 0;

  const role = data.role ?? '';
  const tagline = data.tagline ?? '';
  const stats = data.stats ?? [];
  const education = data.education ?? [];
  const experience = data.experience ?? [];
  const skills = data.skills ?? [];

  const completenessItems: SubItem[] = [];
  const impactItems: SubItem[] = [];
  const depthItems: SubItem[] = [];
  const relevanceItems: SubItem[] = [];
  const presentationItems: SubItem[] = [];

  // ═══════════════════════════════════════════
  // COMPLETENESS (25 points)
  // ═══════════════════════════════════════════

  // Name (3 pts)
  const nameEarned = (data.name && data.name.length >= 2) ? 3 : 0;
  completeness += nameEarned;
  completenessItems.push({ label: 'Full name', earned: nameEarned, max: 3, hint: nameEarned < 3 ? 'Add your full name' : undefined });

  // Role (3 pts)
  const roleEarned = role.length >= 3 ? 3 : 0;
  completeness += roleEarned;
  completenessItems.push({ label: 'Job title', earned: roleEarned, max: 3, hint: roleEarned < 3 ? 'Add your current role (e.g. "Software Engineer")' : undefined });

  // Tagline (5 pts)
  const taglineEarned = tagline.length >= 30 ? 5 : tagline.length > 0 ? 2 : 0;
  completeness += taglineEarned;
  completenessItems.push({
    label: 'Tagline / headline',
    earned: taglineEarned,
    max: 5,
    hint: taglineEarned === 0
      ? 'Add a one-sentence summary — "Engineer who ships 0→1 products for B2B SaaS"'
      : taglineEarned < 5 ? `Expand "${clip(tagline, 40)}" to 50+ chars with a specific achievement` : undefined,
  });
  if (taglineEarned < 5) {
    tips.push({
      category: 'Completeness',
      message: taglineEarned === 0 ? 'No tagline found' : `Tagline too short: "${clip(tagline, 50)}"`,
      fix: 'Write one sentence: [Your role] who [what you do] for [who/what]. Include one metric if possible. E.g. "ML Engineer who built real-time detection systems deployed in 3 industries"',
      impact: 5 - taglineEarned,
    });
  }

  // Stats (4 pts)
  const statsCount = Math.min(stats.filter(s => s.value && s.label).length, 4);
  const statsEarned = Math.min(statsCount * 2, 4);
  completeness += statsEarned;
  completenessItems.push({
    label: `Key stats (${statsCount} of 2 needed)`,
    earned: statsEarned,
    max: 4,
    hint: statsCount < 2 ? `Add ${2 - statsCount} stat${statsCount === 0 ? 's' : ''} — e.g. "3 yrs exp", "8 projects", "10K+ users"` : undefined,
  });

  // Experience (5 pts)
  const expCount = experience.filter(e => e.company && (e.title || e.role)).length;
  const expEarned = Math.min(expCount * 2.5, 5);
  completeness += expEarned;
  completenessItems.push({
    label: `Work experience (${expCount} found, need 2+)`,
    earned: Math.round(expEarned),
    max: 5,
    hint: expCount < 2 ? `Add ${2 - expCount} more job entr${expCount === 0 ? 'ies' : 'y'} with company name and title. Each adds 2.5 pts` : undefined,
  });
  if (expCount < 2) {
    tips.push({
      category: 'Completeness',
      message: expCount === 0 ? 'No work experience detected' : 'Only 1 work experience found (need 2+)',
      fix: 'Add each role with: Company name · Job title · Date range · 2-3 bullet points. If you\'re a student, internships, freelance work, or project leadership all count.',
      impact: Math.round((2 - expCount) * 2.5),
    });
  }

  // Education (3 pts)
  const eduCount = education.filter(e => e.institution).length;
  const eduEarned = Math.min(eduCount * 3, 3);
  completeness += eduEarned;
  completenessItems.push({
    label: 'Education',
    earned: eduEarned,
    max: 3,
    hint: eduEarned < 3 ? 'Add your degree, institution, and graduation year' : undefined,
  });

  // Skills (2 pts)
  const skillCount = skills.filter(s => s.length > 0).length;
  const skillsEarned = skillCount >= 5 ? 2 : skillCount >= 3 ? 1 : 0;
  completeness += skillsEarned;
  completenessItems.push({
    label: `Skills (${skillCount} found, need 5+)`,
    earned: skillsEarned,
    max: 2,
    hint: skillCount < 5 ? `Add ${5 - skillCount} more — tools, languages, frameworks you actually use` : undefined,
  });

  // ═══════════════════════════════════════════
  // IMPACT LANGUAGE (25 points)
  // ═══════════════════════════════════════════

  const allBullets = experience.flatMap(e => e.bullets ?? e.highlights ?? []).filter(b => b && b.length > 0);

  if (allBullets.length > 0) {
    // Metrics (12 pts)
    const bulletsWithMetrics = allBullets.filter(b => REALISTIC_METRIC.test(b));
    const metricRatio = bulletsWithMetrics.length / allBullets.length;
    const metricPoints = Math.min(Math.round(metricRatio * 12), 12);
    impactLanguage += metricPoints;
    const weakMetricBullets = allBullets.filter(b => !REALISTIC_METRIC.test(b));
    impactItems.push({
      label: `Quantified bullets (${bulletsWithMetrics.length}/${allBullets.length} have numbers)`,
      earned: metricPoints,
      max: 12,
      hint: weakMetricBullets.length > 0 ? `Add metrics to: "${clip(weakMetricBullets[0], 55)}"` : undefined,
    });
    if (weakMetricBullets.length > 0) {
      const example = weakMetricBullets[0];
      const ctx = bulletContext(example, experience);
      tips.push({
        category: 'Impact',
        message: `No metric${ctx}: "${clip(example)}"`,
        fix: `Add a number to this bullet. Ask yourself: How many users? What % improvement? How fast? How large was the dataset/codebase/team? E.g. "…achieving 94% accuracy on a 10K-image dataset"`,
        impact: Math.min(weakMetricBullets.length * 2, 8),
      });
    }

    // Action verbs (8 pts)
    const bulletsWithVerbs = allBullets.filter(b => {
      const firstWord = b.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
      return ACTION_VERBS.includes(firstWord);
    });
    const verbRatio = bulletsWithVerbs.length / allBullets.length;
    const verbPoints = Math.min(Math.round(verbRatio * 8), 8);
    impactLanguage += verbPoints;
    const noVerbBullets = allBullets.filter(b => {
      const firstWord = b.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
      return !ACTION_VERBS.includes(firstWord);
    });
    impactItems.push({
      label: `Action-verb starts (${bulletsWithVerbs.length}/${allBullets.length} bullets)`,
      earned: verbPoints,
      max: 8,
      hint: noVerbBullets.length > 0 ? `"${clip(noVerbBullets[0], 45)}" — change first word to a verb` : undefined,
    });
    if (verbRatio < 0.5 && noVerbBullets.length > 0) {
      const firstWord = noVerbBullets[0].trim().split(/\s+/)[0];
      const ctx = bulletContext(noVerbBullets[0], experience);
      tips.push({
        category: 'Impact',
        message: `Passive start${ctx}: "${clip(noVerbBullets[0], 60)}"`,
        fix: `Replace "${firstWord}" with an action verb. Strong verbs: Built, Developed, Designed, Implemented, Deployed, Optimized, Reduced, Increased, Led, Automated. Pick the one that best describes what you actually did.`,
        impact: Math.min(4, 8 - verbPoints),
      });
    }

    // Dollar/business impact (5 pts)
    const hasDollarImpact = allBullets.some(b => /\$[\d,.]+[KMB]?|\d+[KMB]?\s*(?:revenue|savings|ARR|MRR)/i.test(b));
    impactLanguage += hasDollarImpact ? 5 : 0;
    impactItems.push({
      label: 'Business / dollar impact',
      earned: hasDollarImpact ? 5 : 0,
      max: 5,
      hint: !hasDollarImpact ? 'Add one bullet mentioning revenue, cost savings, or $ value' : undefined,
    });
    if (!hasDollarImpact) {
      const upgradeable = allBullets.find(b => /revenue|sale|cost|save|budget|fund|client|customer|deal|contract/i.test(b));
      tips.push({
        category: 'Impact',
        message: upgradeable ? `Near-miss: "${clip(upgradeable, 55)}" — just missing the dollar amount` : 'No bullet mentions business/dollar impact',
        fix: upgradeable
          ? `Add the $ figure to this bullet. Even an estimate counts: "…saving ~$5K/month in infrastructure costs" or "…used by clients with $2M+ in combined ARR"`
          : 'Add one new bullet that ties your work to business value. Template: "[Action] [what] that [saved/generated/reduced] [$X / X%] in [revenue/costs/time]"',
        impact: 5,
      });
    }
  } else {
    impactItems.push({ label: 'Quantified bullets', earned: 0, max: 12, hint: 'Add bullet points describing your work achievements' });
    impactItems.push({ label: 'Action-verb starts', earned: 0, max: 8, hint: 'Each bullet should start with a strong verb' });
    impactItems.push({ label: 'Business / dollar impact', earned: 0, max: 5, hint: 'At least one bullet should mention revenue, savings, or users' });
    tips.push({
      category: 'Impact',
      message: 'No experience bullets found',
      fix: 'For each job/project, add 2-3 bullets in this format: "[Action verb] [what you built/did] [using what tools] [achieving what result]". Example: "Built real-time PPE detection model using YOLOv8, achieving 91% mAP on 15K training images"',
      impact: 25,
    });
  }

  // ═══════════════════════════════════════════
  // DEPTH (20 points)
  // ═══════════════════════════════════════════

  // Bullets per experience (8 pts)
  const expWithBullets = experience.filter(e => (e.bullets ?? e.highlights ?? []).length > 0);
  let bulletsPerExpPoints = 0;
  if (expWithBullets.length > 0) {
    const avgBullets = expWithBullets.reduce((sum, e) => sum + (e.bullets ?? e.highlights ?? []).filter(b => b.length > 0).length, 0) / expWithBullets.length;
    bulletsPerExpPoints = avgBullets >= 3 ? 8 : avgBullets >= 2 ? 5 : 2;
    depth += bulletsPerExpPoints;
    const thinExp = expWithBullets.find(e => (e.bullets ?? e.highlights ?? []).filter(b => b.length > 0).length < 3);
    const thinCount = thinExp ? (thinExp.bullets ?? thinExp.highlights ?? []).filter(b => b.length > 0).length : 0;
    depthItems.push({
      label: `Avg ${avgBullets.toFixed(1)} bullets/job (need 3+)`,
      earned: bulletsPerExpPoints,
      max: 8,
      hint: thinExp ? `${thinExp.company || 'One job'} only has ${thinCount} bullet(s) — add ${3 - thinCount} more` : undefined,
    });
    if (avgBullets < 3 && thinExp) {
      tips.push({
        category: 'Depth',
        message: `${thinExp.company || 'One role'} only has ${thinCount} bullet(s)`,
        fix: `Add ${3 - thinCount} more bullets for ${thinExp.company || 'this role'}. Think about: What did you build/ship? What problem did it solve? What tech did you use? What was the outcome? Each answer = one bullet.`,
        impact: 3,
      });
    }
  } else {
    depthItems.push({ label: 'Bullets per experience', earned: 0, max: 8, hint: 'Add 3 bullets per job' });
  }

  // Tagline quality (4 pts)
  const tagLen = tagline.length;
  const tagDepthPoints = (tagLen >= 50 && tagLen <= 200) ? 4 : tagLen >= 30 ? 2 : 0;
  depth += tagDepthPoints;
  depthItems.push({
    label: 'Tagline quality (50–200 chars)',
    earned: tagDepthPoints,
    max: 4,
    hint: tagLen === 0 ? 'Add a headline sentence' : tagLen < 50 ? `"${clip(tagline, 40)}" is too short — expand with what makes you unique` : undefined,
  });

  // Stats completeness (4 pts)
  const completeStats = stats.filter(s => (s.value ?? '').length > 0 && (s.label ?? '').length > 0);
  const statsDepthPoints = Math.min(completeStats.length, 4);
  depth += statsDepthPoints;
  depthItems.push({
    label: `Complete stats (${completeStats.length}/4)`,
    earned: statsDepthPoints,
    max: 4,
    hint: completeStats.length < 4 ? 'Add up to 4 stats (each needs a label + value)' : undefined,
  });

  // Bullet length quality (4 pts)
  let bulletLenPoints = 0;
  if (allBullets.length > 0) {
    const idealBullets = allBullets.filter(b => b.length >= 80 && b.length <= 250);
    const idealRatio = idealBullets.length / allBullets.length;
    bulletLenPoints = Math.round(idealRatio * 4);
    depth += bulletLenPoints;
    const shortBullets = allBullets.filter(b => b.length < 50);
    depthItems.push({
      label: `Well-sized bullets (${idealBullets.length}/${allBullets.length} at 80–250 chars)`,
      earned: bulletLenPoints,
      max: 4,
      hint: shortBullets.length > 0 ? `"${clip(shortBullets[0], 40)}" is too short — expand it` : undefined,
    });
    if (shortBullets.length > 0) {
      const ctx = bulletContext(shortBullets[0], experience);
      tips.push({
        category: 'Depth',
        message: `Too brief${ctx}: "${clip(shortBullets[0])}"`,
        fix: 'Expand this bullet to include: what you built, the technology/approach used, and the outcome. Target 80–150 characters. E.g. "Built X using Y, resulting in Z"',
        impact: 2,
      });
    }
  } else {
    depthItems.push({ label: 'Bullet detail / length', earned: 0, max: 4, hint: 'Each bullet should be 80–200 chars (one complete thought)' });
  }

  // ═══════════════════════════════════════════
  // FIELD RELEVANCE (15 points)
  // ═══════════════════════════════════════════

  const fieldKeywords = FIELD_SKILLS[field] || [];
  const allText = [
    ...skills.map(s => s.toLowerCase()),
    ...allBullets.map(b => b.toLowerCase()),
    role.toLowerCase(),
    tagline.toLowerCase(),
  ].join(' ');

  const matchedKeywords = fieldKeywords.filter(kw => allText.includes(kw));
  const keywordRatio = fieldKeywords.length > 0 ? matchedKeywords.length / Math.min(fieldKeywords.length, 10) : 0;

  // Skill matches (8 pts)
  const skillMatches = skills.filter(s => fieldKeywords.some(kw => s.toLowerCase().includes(kw)));
  const skillMatchPoints = Math.min(skillMatches.length * 2, 8);
  fieldRelevance += skillMatchPoints;
  const missingSkillKws = fieldKeywords.filter(kw => !skills.some(s => s.toLowerCase().includes(kw))).slice(0, 4);
  relevanceItems.push({
    label: `Field skills in your list (${skillMatches.length} matched)`,
    earned: skillMatchPoints,
    max: 8,
    hint: skillMatchPoints < 8 ? `Add these to skills if you know them: ${missingSkillKws.join(', ')}` : undefined,
  });

  // Keyword density in experience (7 pts)
  const kwDensityPoints = Math.min(Math.round(keywordRatio * 7), 7);
  fieldRelevance += kwDensityPoints;
  const missingInText = fieldKeywords.filter(kw => !allText.includes(kw)).slice(0, 5);
  relevanceItems.push({
    label: `Field keywords in experience (${matchedKeywords.length} found)`,
    earned: kwDensityPoints,
    max: 7,
    hint: missingInText.length > 0 ? `Mention these in your bullets/bio: ${missingInText.slice(0, 3).join(', ')}` : undefined,
  });

  if (keywordRatio < 0.3) {
    tips.push({
      category: 'Relevance',
      message: `Low ${field} signal — only ${matchedKeywords.length} of the top keywords appear`,
      fix: `Add these to your skills list (if you actually know them): ${missingInText.join(', ')}. Then mention 2-3 of them naturally in your experience bullets.`,
      impact: 5,
    });
  }

  // ═══════════════════════════════════════════
  // PRESENTATION (15 points)
  // ═══════════════════════════════════════════

  // No empty fields (5 pts)
  const emptyChecks = [
    (data.name ?? '').length < 2,
    role.length < 3,
    experience.some(e => !e.company || !e.title),
    education.some(e => !e.institution),
    stats.some(s => (s.value && !s.label) || (!s.value && s.label)),
  ];
  const hasEmptyFields = emptyChecks.filter(Boolean).length;
  const completenessPresPoints = hasEmptyFields === 0 ? 5 : Math.max(0, 5 - hasEmptyFields * 2);
  presentation += completenessPresPoints;
  presentationItems.push({
    label: 'No missing/empty fields',
    earned: completenessPresPoints,
    max: 5,
    hint: hasEmptyFields > 0 ? `${hasEmptyFields} field(s) incomplete — check name, title, company, education` : undefined,
  });

  // No duplicate skills (3 pts)
  const uniqueSkills = new Set(skills.map(s => s.toLowerCase().trim()));
  const dupeCount = skills.length - uniqueSkills.size;
  const dupePoints = dupeCount === 0 ? 3 : 1;
  presentation += dupePoints;
  presentationItems.push({
    label: 'No duplicate skills',
    earned: dupePoints,
    max: 3,
    hint: dupeCount > 0 ? `Remove ${dupeCount} duplicate(s) from your skills list` : undefined,
  });
  if (dupeCount > 0) tips.push({ category: 'Presentation', message: `${dupeCount} duplicate skill(s)`, fix: 'Remove duplicates from your skills list.', impact: 2 });

  // No stub bullets (4 pts)
  const singleWordBullets = allBullets.filter(b => b.trim().split(/\s+/).length <= 3);
  const stubPoints = singleWordBullets.length === 0 ? 4 : Math.max(0, 4 - singleWordBullets.length);
  presentation += stubPoints;
  presentationItems.push({
    label: 'No stub/single-word bullets',
    earned: stubPoints,
    max: 4,
    hint: singleWordBullets.length > 0 ? `"${clip(singleWordBullets[0], 40)}" is too short` : undefined,
  });

  // Education completeness (3 pts)
  const completeEdu = education.filter(e => e.institution && e.degree && e.year);
  const eduPresPoints = completeEdu.length > 0 ? 3 : 0;
  presentation += eduPresPoints;
  const incompleteEdu = education.find(e => !e.degree || !e.year);
  presentationItems.push({
    label: 'Education has degree + year',
    earned: eduPresPoints,
    max: 3,
    hint: incompleteEdu ? `${incompleteEdu.institution}: add ${!incompleteEdu.degree ? 'degree name' : 'graduation year'}` : undefined,
  });
  if (education.length > 0 && completeEdu.length < education.length && incompleteEdu) {
    tips.push({
      category: 'Presentation',
      message: `${incompleteEdu.institution} is missing ${!incompleteEdu.degree ? 'degree' : 'graduation year'}`,
      fix: 'Fill in the missing field. Graduation year format: "2024" or "May 2024".',
      impact: 2,
    });
  }

  // Anti-gaming: too many skills penalty
  if (skillCount > 15) {
    const extra = skills.slice(12).slice(0, 3).join(', ');
    presentation -= 2;
    tips.push({ category: 'Presentation', message: `${skillCount} skills listed (too many)`, fix: `Trim to your top 8–12. Consider removing: ${extra}`, impact: 2 });
  }

  // Duplicate bullet detection
  for (let i = 0; i < allBullets.length; i++) {
    for (let j = i + 1; j < allBullets.length; j++) {
      if (textSimilarity(allBullets[i], allBullets[j]) > 0.7) {
        presentation -= 2;
        tips.push({
          category: 'Presentation',
          message: `Near-duplicate bullets detected`,
          fix: `"${clip(allBullets[i], 45)}" and "${clip(allBullets[j], 45)}" say the same thing. Remove one and replace it with a different achievement.`,
          impact: 2,
        });
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
    details: {
      completeness:   completenessItems,
      impactLanguage: impactItems,
      depth:          depthItems,
      fieldRelevance: relevanceItems,
      presentation:   presentationItems,
    },
  };
}
