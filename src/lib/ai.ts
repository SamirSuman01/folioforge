import type { Field, IntelligenceReport, Connection, TargetCompany, WarmPath, OutreachMessage, CareerMirrorReport, MirrorEvidence, ArchetypeLabel, GhostReport, GhostSignal, ATSReport, ATSCriterion, ATSVerdict, CriterionWeight, PortfolioData, OfferReport, OfferInput, CompAnalysis, EquityAnalysis, NegotiationScript, NegotiationLeverage } from './types'
import type { ExtractedData, GeneratedSection } from '@/store/onboarding'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent';

const SYSTEM_PROMPTS: Record<Field, string> = {
  cs: `You are a technical career copywriter specializing in software engineering.
Rewrite each bullet to lead with IMPACT and specific metrics.
Use verbs: shipped, deployed, built, cut, reduced, scaled.
ONLY include stats that are EXPLICITLY stated in the input text. If no numeric metrics exist, return an empty stats array.
NEVER invent, estimate, or approximate numbers.
Create a memorable one-line tagline.
Return valid JSON only.`,

  design: `You are a design career copywriter.
Rewrite each bullet to show user impact and design thinking.
Use verbs: redesigned, researched, tested, improved, launched.
ONLY include stats that are EXPLICITLY stated in the input text. If no numeric metrics exist, return an empty stats array.
NEVER invent, estimate, or approximate numbers.
Create a memorable one-line tagline.
Return valid JSON only.`,

  business: `You are an investment banking career copywriter.
Rewrite each bullet to show deal impact and analytical rigor.
Use verbs: modeled, structured, advised, analyzed, presented.
ONLY include stats (deal sizes, rankings, returns) that are EXPLICITLY stated in the input text. If no numeric metrics exist, return an empty stats array.
NEVER invent, estimate, or approximate numbers.
Create a memorable one-line tagline. Return valid JSON only.`,

  other: `You are an academic career copywriter.
Rewrite each bullet to show research impact and intellectual contribution.
Use verbs: published, discovered, analyzed, developed, presented.
ONLY include stats (papers, citations, grants) that are EXPLICITLY stated in the input text. If no numeric metrics exist, return an empty stats array.
NEVER invent, estimate, or approximate numbers.
Create a memorable one-line tagline. Return valid JSON only.`,

  marketing: `You are a brand/marketing career copywriter.
Rewrite each bullet to show growth impact and strategic thinking.
Use verbs: launched, grew, drove, scaled, optimized.
ONLY include stats (reach, revenue, engagement) that are EXPLICITLY stated in the input text. If no numeric metrics exist, return an empty stats array.
NEVER invent, estimate, or approximate numbers.
Create a memorable one-line tagline. Return valid JSON only.`,
};

export function detectField(text: string): Field | null {
  const lower = text.toLowerCase();
  const scores: Record<Field, number> = {
    cs: ['software', 'engineer', 'developer', 'python', 'javascript', 'api', 'github', 'deploy', 'backend', 'frontend', 'full stack', 'aws', 'docker', 'react'].filter(k => lower.includes(k)).length,
    design: ['design', 'ux', 'ui', 'figma', 'sketch', 'user research', 'prototype', 'wireframe', 'accessibility', 'hci'].filter(k => lower.includes(k)).length,
    business: ['finance', 'banking', 'investment', 'analyst', 'valuation', 'dcf', 'lbo', 'bloomberg', 'excel', 'modeling', 'deal', 'm&a', 'business', 'consulting', 'strategy'].filter(k => lower.includes(k)).length,
    other: ['research', 'phd', 'paper', 'published', 'citation', 'lab', 'thesis', 'neurips', 'journal', 'grant', 'fellow'].filter(k => lower.includes(k)).length,
    marketing: ['marketing', 'brand', 'campaign', 'social media', 'content', 'growth', 'seo', 'analytics', 'engagement', 'hubspot'].filter(k => lower.includes(k)).length,
  };

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]) as [Field, number][];
  const topScore = sorted[0][1];

  if (topScore === 0) return null;

  const ties = sorted.filter(([, score]) => score === topScore);
  if (ties.length > 1) return null;

  return sorted[0][0];
}

const OUTPUT_FORMAT = `{
  "name": "Full Name",
  "role": "Professional Title",
  "tagline": "One memorable line",
  "stats": [{"label": "Metric Label", "value": "Number"}],
  "experience": [{"company": "...", "title": "...", "period": "...", "bullets": ["impact-driven bullet"]}],
  "education": [{"institution": "...", "degree": "...", "year": "..."}],
  "skills": ["Skill1", "Skill2"]
}`;

export async function generatePortfolioStream(linkedinText: string, field: Field): Promise<Response> {
  const provider = process.env.AI_PROVIDER || 'gemini';
  const systemPrompt = SYSTEM_PROMPTS[field] || SYSTEM_PROMPTS.cs;

  const userPrompt = `Transform this LinkedIn profile into a portfolio. Return JSON only.

OUTPUT FORMAT:
${OUTPUT_FORMAT}

LINKEDIN TEXT:
${linkedinText}`;

  if (provider === 'claude') {
    return streamFromClaude(systemPrompt, userPrompt);
  }
  return streamFromGemini(systemPrompt, userPrompt);
}

async function streamFromGemini(systemPrompt: string, userPrompt: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(
      `${GEMINI_API_URL}?alt=sse&key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function streamFromClaude(systemPrompt: string, userPrompt: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
        max_tokens: 2048,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errorText}`);
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}


// ─── Shared non-streaming helper ─────────────────────────

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const provider = process.env.AI_PROVIDER || 'gemini'

  if (provider === 'claude') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })
    if (!res.ok) throw new Error(`Claude error ${res.status}`)
    const data = await res.json()
    return data.content[0].text as string
  }

  // Default: Gemini
  const GEMINI_JSON_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
  const res = await fetch(`${GEMINI_JSON_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
    }),
  })
  if (!res.ok) throw new Error(`Gemini error ${res.status}`)
  const data = await res.json()
  return data.candidates[0].content.parts[0].text as string
}

// ─── Pro model caller (Gemini 2.5 Pro / Claude Sonnet) ───
// Used for Career Mirror — needs deep reasoning, not flash speed

async function callAIPro(systemPrompt: string, userPrompt: string): Promise<string> {
  const provider = process.env.AI_PROVIDER || 'gemini'

  if (provider === 'claude') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })
    if (!res.ok) throw new Error(`Claude Sonnet error ${res.status}`)
    const data = await res.json()
    return data.content[0].text as string
  }

  // Gemini 2.5 Pro — 50 free calls/day, deep reasoning
  const GEMINI_PRO_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent'
  const res = await fetch(`${GEMINI_PRO_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 3000 },
    }),
  })
  if (!res.ok) {
    // Fallback to Flash if Pro quota exceeded
    return callAI(systemPrompt, userPrompt)
  }
  const data = await res.json()
  return data.candidates[0].content.parts[0].text as string
}


// ─── Career Mirror — two-prompt chain ────────────────────
// Prompt 1: cold read as hiring manager (no context about user's goals)
// Prompt 2: gap analysis comparing cold read vs target role

export async function generateCareerMirror(
  portfolioText: string,   // structured text built from portfolio data
  targetRole: string,
  targetCompany?: string,
): Promise<CareerMirrorReport> {

  // ── Prompt 1 — Cold Read ──────────────────────────────
  const coldReadSystem = `You are a senior hiring manager with 10+ years reviewing candidates for competitive roles. You have just received this portfolio with zero briefing — you don't know what this person is targeting or what they think their strengths are.

You have 30 seconds.

Form an honest first impression. Not cruel — precise. You've seen thousands of profiles. You know exactly what patterns signal what.

Return ONLY valid JSON. No commentary outside the JSON.`

  const coldReadUser = `Read this portfolio as a hiring manager. Return your cold impression.

PORTFOLIO:
${portfolioText}

RETURN THIS EXACT JSON:
{
  "archetype": "The Implementer" | "The Support Player" | "The Builder" | "The Strategist" | "The Specialist" | "The Leader",
  "verdict": "One complete sentence starting with 'The market reads you as...' — specific to what you found, not generic",
  "firstImpression": "One sentence on what immediately stands out — positive or negative — in the first 5 seconds",
  "evidence": [
    {
      "type": "weakness" | "strength" | "missing",
      "finding": "One specific observation — reference actual patterns, not generic categories",
      "quote": "Exact words from the portfolio if this finding is based on specific language — null if not",
      "section": "headline" | "about" | "experience" | "projects" | "skills",
      "impact": "What this signals to a hiring manager in one precise sentence"
    }
  ]
}

ARCHETYPE DEFINITIONS:
- The Implementer: Executes tasks well. Zero evidence of initiating, owning, or driving direction.
- The Support Player: Contributes reliably. Language signals assistance, not ownership.
- The Builder: Shows self-originated work. Built things from scratch or near-scratch.
- The Strategist: Demonstrates direction-setting and decision-making above execution.
- The Specialist: Deep domain expertise. Scope and leadership are unclear.
- The Leader: Team or org-level scope is clearly evidenced.

evidence: Return 4–8 items. When a finding is based on specific language in the portfolio, quote it exactly. Reference actual role names, actual bullet patterns, actual words. Generic observations ("lacks quantification") are wrong — specific ones ("all 6 bullets in the Acme role begin with 'Helped' or 'Assisted'") are right.`

  const coldReadRaw  = await callAIPro(coldReadSystem, coldReadUser)
  const coldReadData = parseJsonFromAI(coldReadRaw) as {
    archetype:       ArchetypeLabel
    verdict:         string
    firstImpression: string
    evidence:        MirrorEvidence[]
  }

  // ── Prompt 2 — Gap Analysis ───────────────────────────
  const gapSystem = `You are analyzing the gap between how a hiring manager currently perceives someone and what they need to change to close that gap for their target. Your job is surgical: find specific, evidence-based changes. Generic advice ("quantify your impact") is wrong. Specific observations ("in your Acme role, changing 'Helped deploy' to 'Led deployment of X serving Y users' shifts you from support to driver") are right.

Return ONLY valid JSON.`

  const gapUser = `COLD READ RESULT:
${JSON.stringify(coldReadData, null, 2)}

WHAT THEY'RE TARGETING:
Role: ${targetRole}${targetCompany ? `\nCompany: ${targetCompany}` : ''}

Find the gap and what to do. Return JSON:
{
  "perceptionGap": {
    "yourWordsSignal": "What their portfolio text is actually communicating — based on the patterns found, specific",
    "hiringManagerReads": "What a hiring manager concludes — specific to this profile",
    "gapSize": "structural" | "framing" | "surgical"
  },
  "topMoves": [
    {
      "location": "Specific section or role — not 'your experience section' but 'your [Company] role (years)'",
      "action": "Specific change — reference actual language found in the portfolio where possible",
      "reason": "Exactly why this specific change shifts the cold read"
    }
  ],
  "archetypePath": {
    "summary": "One sentence: professionals with this archetype who reached the target level did X",
    "moves": ["Most common move 1", "Move 2", "Move 3"]
  },
  "diagnosis": "2 sentences. Honest — not always 'you are misread.' Sometimes the gap is real. Sometimes it is framing. Be accurate to what you found.",
  "topFix": "The single highest-leverage specific action — reference their actual portfolio content"
}

gapSize:
- structural: target role requires experience this person hasn't demonstrated
- framing: experience exists but presented wrong — gap is entirely in language
- surgical: small specific edits would shift the read significantly

topMoves: exactly 3. Each must be specific to this person's portfolio. Reference actual content from the cold read evidence.`

  const gapRaw  = await callAIPro(gapSystem, gapUser)
  const gapData = parseJsonFromAI(gapRaw) as {
    perceptionGap: CareerMirrorReport['perceptionGap']
    topMoves:      CareerMirrorReport['topMoves']
    archetypePath: CareerMirrorReport['archetypePath']
    diagnosis:     string
    topFix:        string
  }

  return {
    portfolioId:   '',   // caller sets this
    generatedAt:   new Date().toISOString(),
    targetRole,
    targetCompany,
    coldRead: {
      archetype:       coldReadData.archetype      ?? 'The Implementer',
      verdict:         coldReadData.verdict         ?? 'The market reads you as a capable professional.',
      firstImpression: coldReadData.firstImpression ?? '',
      evidenceCount:   (coldReadData.evidence ?? []).length,
    },
    evidence:      coldReadData.evidence      ?? [],
    perceptionGap: gapData.perceptionGap,
    topMoves:      (gapData.topMoves ?? []).slice(0, 3),
    archetypePath: gapData.archetypePath ?? { summary: '', moves: [] },
    diagnosis:     gapData.diagnosis ?? '',
    topFix:        gapData.topFix    ?? '',
  }
}


function parseJsonFromAI(raw: string): unknown {
  let s = raw.trim()
  if (s.startsWith('```json')) s = s.slice(7)
  if (s.startsWith('```'))     s = s.slice(3)
  if (s.endsWith('```'))       s = s.slice(0, -3)
  return JSON.parse(s.trim())
}


// ─── Extract structured data from resume text ────────────

export async function extractDataFromText(text: string): Promise<ExtractedData> {
  const system = `You are a resume parser. Extract structured information from the given text.
Return ONLY valid JSON matching the schema below. Do not add commentary.

SCHEMA:
{
  "name": "Full Name",
  "currentRole": "Most recent job title",
  "companies": ["Company1", "Company2"],
  "skills": ["Skill1", "Skill2"],
  "yearsExp": 5,
  "confidence": "high"
}

confidence: "high" if name+role+2+ companies found, "medium" if partial, "low" if minimal data.`

  const user = `Extract from this text:\n\n${text.slice(0, 8000)}`

  try {
    const raw = await callAI(system, user)
    const parsed = parseJsonFromAI(raw) as ExtractedData
    return { ...parsed, rawText: text }
  } catch {
    return {
      name:        '',
      currentRole: '',
      companies:   [],
      skills:      [],
      yearsExp:    null,
      rawText:     text,
      confidence:  'low',
    }
  }
}


// ─── Generate portfolio sections from extracted data ─────

export async function generatePortfolioSections(
  data: ExtractedData,
  field: string
): Promise<{ sections: GeneratedSection[]; score: number }> {

  const fieldPrompts: Record<string, string> = {
    'software-engineering': 'software engineer career copywriter. Use verbs: shipped, deployed, built, scaled.',
    'product-design':       'product design career copywriter. Use verbs: designed, researched, tested, launched.',
    'product-management':   'product manager career copywriter. Use verbs: drove, launched, aligned, shipped.',
    'business-finance':     'finance career copywriter. Use verbs: modeled, analyzed, structured, advised.',
    'marketing':            'marketing career copywriter. Use verbs: grew, launched, scaled, optimized.',
    'data-analytics':       'data analyst career copywriter. Use verbs: analyzed, built, discovered, automated.',
    'healthcare':           'healthcare career copywriter. Focus on patient outcomes and clinical impact.',
    'education':            'education career copywriter. Focus on student outcomes and curriculum design.',
    'creative':             'creative career copywriter. Focus on visual storytelling and brand impact.',
    'other':                'professional career copywriter. Focus on measurable impact and results.',
  }

  const fieldPrompt = fieldPrompts[field] ?? fieldPrompts.other

  const system = `You are a ${fieldPrompt}
Write compelling, honest portfolio sections from extracted career data.
NEVER invent numbers or companies not in the input.
Return ONLY valid JSON.`

  const rawSnippet = data.rawText ? data.rawText.slice(0, 2500) : ''

  const user = `Generate portfolio sections from this career data:

Name: ${data.name || 'Not provided'}
Role: ${data.currentRole || 'Not provided'}
Companies: ${data.companies.join(', ') || 'Not provided'}
Skills: ${data.skills.join(', ') || 'Not provided'}
Years of experience: ${data.yearsExp ?? 'Unknown'}
${rawSnippet ? `\nResume excerpt:\n${rawSnippet}` : ''}

Return JSON with this exact structure:
{
  "sections": [
    { "type": "hero", "label": "Hero", "data": { "name": "...", "role": "...", "tagline": "One memorable line summarizing value" } },
    { "type": "narrative", "label": "About", "data": { "text": "2-3 sentence professional narrative" } },
    { "type": "list", "label": "Skills", "data": { "items": ["skill1", "skill2"] } },
    { "type": "experience", "label": "Experience", "data": { "entries": [
      { "company": "...", "role": "...", "period": "...", "bullets": ["achievement with metric", "achievement with metric"] }
    ]}}
  ],
  "score": 72
}

For each company listed, create one experience entry. Use dates and bullets from the resume excerpt if available; otherwise infer reasonable bullets from context. Each bullet must start with an action verb and include a metric where possible.
score: start at 50. +10 if name found. +10 if role found. +10 if 2+ companies. +10 if 5+ skills. +10 if yearsExp known. Max 100.`

  try {
    const raw = await callAI(system, user)
    const parsed = parseJsonFromAI(raw) as { sections: GeneratedSection[]; score: number }
    return {
      sections: parsed.sections ?? [],
      score:    Math.min(100, Math.max(0, parsed.score ?? 60)),
    }
  } catch {
    return {
      sections: [
        {
          type:  'hero',
          label: 'Hero',
          data:  { name: data.name || 'Your Name', role: data.currentRole || 'Professional', tagline: 'Building what matters.' },
        },
        {
          type:  'list',
          label: 'Skills',
          data:  { items: data.skills.slice(0, 10) },
        },
      ],
      score: 50,
    }
  }
}


// ─── Generate Layer 2 Intelligence Report ────────────────

export async function generateIntelligenceReport(
  portfolioId: string,
  role: string,
  field: string,
  skills: string[],
  yearsExp: number,
  score: number,
): Promise<IntelligenceReport> {

  const system = `You are a career intelligence analyst with deep knowledge of the job market.
You analyze a professional's profile and return a realistic intelligence report.
Return ONLY valid JSON. Never add commentary outside the JSON.
Base salary ranges and demand data on real 2024–2025 market data for the given field/role.`

  const user = `Analyze this professional profile and return a full intelligence report:

Role: ${role}
Field: ${field}
Skills: ${skills.join(', ')}
Years of experience: ${yearsExp}
Portfolio score: ${score}/100

Return JSON matching this EXACT schema:
{
  "readiness": {
    "overall": 72,
    "breakdown": { "portfolio": 80, "skills": 65, "experience": 75, "market": 68 },
    "topWin": "One sentence about their strongest signal",
    "topGap": "One sentence about their most critical gap"
  },
  "skillGaps": [
    {
      "skill": "Skill name",
      "level": "critical" | "important" | "nice-to-have",
      "reason": "Why this skill matters for their target role",
      "learningPath": "Specific resource or approach to learn this",
      "timeToLearn": "X–Y weeks"
    }
  ],
  "market": {
    "demandScore": 78,
    "trend": "rising" | "stable" | "declining",
    "trendLabel": "+18% YoY demand",
    "salaryRange": { "low": 95000, "median": 130000, "high": 175000, "currency": "USD" },
    "topLocations": ["San Francisco", "New York", "Remote"],
    "remotePercent": 65,
    "insight": "One sentence market summary for this role",
    "topSkillsInDemand": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5"]
  },
  "companies": [
    {
      "name": "Company name",
      "signal": "hiring-surge" | "funding" | "expansion" | "product-launch",
      "signalLabel": "Human-readable description of the signal",
      "openRoles": 12,
      "fitScore": 85,
      "why": "One sentence on why this company fits this profile right now",
      "urgency": "high" | "medium" | "low"
    }
  ]
}

Rules:
- skillGaps: return 4–6 gaps ordered by criticality
- companies: return exactly 5 companies realistic for this field/role
- salaryRange: use realistic 2024-2025 US market data
- demandScore: 0–100 based on real market conditions
- fitScore: based on how well their skills/experience match each company's known stack/needs`

  try {
    const raw    = await callAI(system, user)
    const parsed = parseJsonFromAI(raw) as Omit<IntelligenceReport, 'portfolioId' | 'generatedAt' | 'targetRole' | 'field'>
    return {
      portfolioId,
      generatedAt: new Date().toISOString(),
      targetRole:  role,
      field,
      readiness:   parsed.readiness,
      skillGaps:   parsed.skillGaps  ?? [],
      market:      parsed.market,
      companies:   parsed.companies  ?? [],
    }
  } catch {
    // Fallback — basic structure so the UI never crashes
    return {
      portfolioId,
      generatedAt: new Date().toISOString(),
      targetRole:  role,
      field,
      readiness: {
        overall: score,
        breakdown: { portfolio: score, skills: 50, experience: 50, market: 50 },
        topWin: 'Your portfolio score is a strong foundation.',
        topGap: 'Add more measurable impact to your experience bullets.',
      },
      skillGaps: [],
      market: {
        demandScore:       70,
        trend:             'stable',
        trendLabel:        'Stable demand',
        salaryRange:       { low: 80000, median: 110000, high: 150000, currency: 'USD' },
        topLocations:      ['Remote', 'San Francisco', 'New York'],
        remotePercent:     55,
        insight:           'Demand is steady for this role across major markets.',
        topSkillsInDemand: skills.slice(0, 5),
      },
      companies: [],
    }
  }
}


// ─── Layer 3: Generate warm-path analysis ────────────────

export async function analyzeWarmPaths(
  connections: Connection[],
  targets: TargetCompany[],
  userRole: string,
): Promise<WarmPath[]> {
  if (!connections.length || !targets.length) return []

  const system = `You are a career network strategist.
Given a person's connections and target companies, identify warm paths and suggest the best approach.
Return ONLY valid JSON.`

  const user = `The user is a ${userRole}. Analyze their network to find warm paths to target companies.

CONNECTIONS:
${connections.map(c => `- ${c.name} (${c.role} at ${c.company}, ${c.relationship}, ${c.strength} connection)`).join('\n')}

TARGET COMPANIES:
${targets.map(t => `- ${t.company_name} — role: ${t.target_role}, priority: ${t.priority}`).join('\n')}

For each target company, find matching connections (same company OR adjacent/similar companies).
Return JSON array:
[
  {
    "targetId": "target company id from the list",
    "matchedConnectionNames": ["Name1"],
    "approach": "One concrete sentence on how to approach this connection for this target",
    "confidence": 80
  }
]

Only include targets where at least one connection can help. If no match, skip.
confidence: 0–100. Higher if direct company match + strong relationship.`

  try {
    const raw    = await callAI(system, user)
    const parsed = parseJsonFromAI(raw) as Array<{
      targetId: string
      matchedConnectionNames: string[]
      approach: string
      confidence: number
    }>

    return parsed.map(p => {
      const target      = targets.find(t => t.id === p.targetId || t.company_name === p.targetId)
      const matchedCons = connections.filter(c => p.matchedConnectionNames.includes(c.name))
      if (!target) return null
      return {
        target,
        connections: matchedCons,
        approach:    p.approach,
        confidence:  Math.min(100, Math.max(0, p.confidence)),
      } satisfies WarmPath
    }).filter((p): p is WarmPath => p !== null)
  } catch {
    return []
  }
}


// ─── Layer 3: Generate outreach message ──────────────────

export async function generateOutreachMessage(
  connection: Connection,
  targetRole: string,
  targetCompany: string,
  userRole: string,
  userSkills: string[],
): Promise<OutreachMessage> {
  const toneMap: Record<Connection['strength'], OutreachMessage['tone']> = {
    strong: 'warm',
    medium: 'professional',
    weak:   'professional',
  }

  const system = `You are a career coach writing highly personalized, non-cringe outreach messages.
The message should feel human, specific, and short — NOT a generic template.
Return ONLY valid JSON.`

  const user = `Write a LinkedIn/email outreach message for this situation:

Sender: ${userRole} with skills in ${userSkills.slice(0, 5).join(', ')}
Recipient: ${connection.name}, ${connection.role} at ${connection.company}
Relationship: ${connection.relationship} (${connection.strength} connection)
Goal: Get a referral or informational intro for a ${targetRole} role at ${targetCompany}
${connection.notes ? `Notes about this person: ${connection.notes}` : ''}

Return JSON:
{
  "subject": "Short, specific subject line (for email)",
  "body": "The full message — 3–4 short paragraphs. Reference the relationship naturally. Ask one specific thing. End with an easy out so they don't feel pressured."
}

Rules:
- Never start with 'I hope this message finds you well'
- Never say 'I wanted to reach out'
- Keep body under 150 words
- Be direct but warm
- One clear ask per message`

  try {
    const raw    = await callAI(system, user)
    const parsed = parseJsonFromAI(raw) as { subject: string; body: string }
    return {
      subject:    parsed.subject,
      body:       parsed.body,
      tone:       toneMap[connection.strength],
      connection,
      targetRole,
      company:    targetCompany,
    }
  } catch {
    return {
      subject:    `Quick question about ${targetCompany}`,
      body:       `Hi ${connection.name.split(' ')[0]},\n\nHope you're doing well! I'm currently exploring ${targetRole} opportunities and ${targetCompany} is at the top of my list.\n\nWould you be open to a 15-minute chat about your experience there? Totally understand if you're busy.\n\nThanks either way!`,
      tone:       toneMap[connection.strength],
      connection,
      targetRole,
      company:    targetCompany,
    }
  }
}

// ─── Ghost Job Detector ──────────────────────────────────────

type PostingAge = '< 2 weeks' | '2–4 weeks' | '1–2 months' | '2+ months' | null

function buildGhostPrompt(jd: string, postingAge: PostingAge): string {
  const ageSignal = postingAge
    ? `\nThe user reports this posting has been live for: ${postingAge}.`
    : ''

  const urgencySignalNote = postingAge
    ? `Signal 4 (Missing Urgency): Since posting age is provided, assess based on age rather than language alone. Posting age 1–2 months = detected (medium, -12). 2+ months = detected (high, -20). < 2 weeks or 2–4 weeks = clear.`
    : `Signal 4 (Missing Urgency): No start date, interview timeline, or deadline language present = detected (medium, -12).`

  return `You are a job market analyst who has reviewed 100,000 job postings and specialises in identifying ghost jobs — postings left active with no real hiring intent.

Analyse the job description against exactly 6 signals. For each, determine DETECTED or CLEAR. Be strict — err on the side of flagging.

SIGNALS AND WEIGHTS:
1. Vague Requirements (high, -20): Generic language like "modern technologies", "relevant experience", "preferred skills" with no specific tools or technologies named
2. Seniority Mismatch (high, -20): "Entry level" or "junior" combined with 3+ years required, OR stated level contradicts requirements
3. Legal Compliance Gap (medium, -12): Posting in a salary-disclosure state (CA, NY, CO, WA, IL) with no salary range listed
4. ${urgencySignalNote}
5. Stack Non-Specificity (medium, -12): Technical role with no named tools, frameworks, languages, or versions — only generic category terms
6. Generic Benefits (low, -5): Benefits described only as "competitive compensation", "great culture", "excellent benefits" with zero specifics

Start confidence at 100. Deduct for each DETECTED signal by its weight. Final value is hiring_confidence.
Also determine the seniority level implied by the role requirements.${ageSignal}

Output ONLY valid JSON — no markdown, no explanation:
{
  "signals": [
    { "name": "Vague Requirements",      "detected": boolean, "evidence": "specific text found or null", "weight": "high"   },
    { "name": "Seniority Mismatch",      "detected": boolean, "evidence": "specific text found or null", "weight": "high"   },
    { "name": "Legal Compliance Gap",    "detected": boolean, "evidence": "specific text found or null", "weight": "medium" },
    { "name": "Missing Urgency",         "detected": boolean, "evidence": "specific text found or null", "weight": "medium" },
    { "name": "Stack Non-Specificity",   "detected": boolean, "evidence": "specific text found or null", "weight": "medium" },
    { "name": "Generic Benefits",        "detected": boolean, "evidence": "specific text found or null", "weight": "low"    }
  ],
  "hiring_confidence": <0-100 integer>,
  "verdict": "Likely Active" | "Uncertain" | "Likely Ghost",
  "top_concern": "<single sentence main reason for this verdict>",
  "seniority_level": "entry" | "mid" | "senior" | "staff"
}

Job description:
${jd.slice(0, 4000)}`
}

function validateGhostReport(raw: unknown): GhostReport {
  const r = raw as Record<string, unknown>
  if (typeof r.hiring_confidence !== 'number') throw new Error('missing hiring_confidence')
  if (!['Likely Active', 'Uncertain', 'Likely Ghost'].includes(r.verdict as string)) throw new Error('invalid verdict')
  if (!Array.isArray(r.signals) || r.signals.length !== 6) throw new Error('signals must be array of 6')
  const signals: GhostSignal[] = (r.signals as Record<string, unknown>[]).map(s => ({
    name:     String(s.name ?? ''),
    detected: Boolean(s.detected),
    evidence: s.evidence != null ? String(s.evidence) : null,
    weight:   (['high', 'medium', 'low'].includes(s.weight as string) ? s.weight : 'medium') as GhostSignal['weight'],
  }))
  // Recalculate confidence from signals to prevent hallucinated values
  const deductions: Record<string, number> = { high: 20, medium: 12, low: 5 }
  const calculated = signals.reduce((acc, s) => acc - (s.detected ? (deductions[s.weight] ?? 0) : 0), 100)
  return {
    signals,
    hiring_confidence: Math.max(0, Math.min(100, calculated)),
    verdict:           r.verdict as GhostReport['verdict'],
    top_concern:       String(r.top_concern ?? ''),
    seniority_level:   (['entry', 'mid', 'senior', 'staff'].includes(r.seniority_level as string)
      ? r.seniority_level : 'mid') as GhostReport['seniority_level'],
  }
}

export async function generateGhostReport(jd: string, postingAge: PostingAge = null): Promise<GhostReport> {
  const GEMINI_FLASH = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY ?? ''
  const prompt = buildGhostPrompt(jd, postingAge)

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${GEMINI_FLASH}?key=${key}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents:         [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
        }),
      })
      if (!res.ok) throw new Error(`Gemini ${res.status}`)
      const json = await res.json()
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
      return validateGhostReport(parsed)
    } catch (e) {
      if (attempt === 2) throw e
    }
  }
  throw new Error('Ghost analysis failed after 3 attempts')
}

// ─── ATS Autopsy ─────────────────────────────────────────────

type RawCriterion = {
  criterion:    string
  type:         ATSCriterion['type']
  weight:       CriterionWeight
  exact_phrase: string
}

type RawCriteriaStep = {
  required:  RawCriterion[]
  preferred: RawCriterion[]
}

type RawMappingResult = {
  criterion: string
  present:   boolean
  found_at:  string | null
  fix:       string | null
}

type RawMappingStep = {
  job_title:         string
  required_results:  RawMappingResult[]
  preferred_results: RawMappingResult[]
  quick_wins:        string[]
}

function serializePortfolio(data: PortfolioData): string {
  const lines: string[] = []
  if (data.name)     lines.push(`Name: ${data.name}`)
  if (data.headline) lines.push(`Headline: ${data.headline}`)
  if (data.about)    lines.push(`About: ${data.about}`)
  if (data.skills?.length) lines.push(`Skills: ${data.skills.join(', ')}`)
  if (data.experience?.length) {
    lines.push('Experience:')
    data.experience.forEach(exp => {
      lines.push(`  ${exp.role ?? exp.title ?? ''} at ${exp.company} (${exp.period})`)
      const bullets = exp.bullets ?? exp.highlights ?? []
      bullets.slice(0, 5).forEach(b => lines.push(`  - ${b}`))
    })
  }
  if (data.projects?.length) {
    lines.push('Projects:')
    data.projects.forEach(p => {
      lines.push(`  ${p.title}: ${p.description}`)
      if (p.tech?.length) lines.push(`  Tech: ${p.tech.join(', ')}`)
    })
  }
  if (data.education?.length) {
    lines.push('Education:')
    data.education.forEach(ed => {
      const school = ed.school ?? ed.institution ?? ''
      lines.push(`  ${ed.degree} at ${school}${ed.period ? ` (${ed.period})` : ''}`)
    })
  }
  return lines.join('\n').slice(0, 3000)
}

function buildATSCriteriaPrompt(jd: string): string {
  return `You are an ATS (Applicant Tracking System) expert who has analysed 50,000 job descriptions.
Extract the hard screening criteria from this job description.

Rules:
- Maximum 8 required criteria, 4 preferred criteria
- Focus ONLY on what ATS systems filter on: specific skills/tools, years of experience, education level, certifications
- IGNORE: soft skills ("team player"), vague language ("strong communication"), culture fit, personality traits
- weight "knockout": hard disqualifiers — degree requirements, work authorisation, minimum years thresholds
- weight "high": primary technical skills and domain experience that are core to the role
- weight "medium": secondary or supporting skills, preferred tools
- type "keyword": specific skill, tool, technology, or methodology
- type "experience": years of experience in a domain or role
- type "education": degree level or field of study
- type "cert": certification or licence
- exact_phrase: quote the exact words from the JD establishing this criterion

Output ONLY valid JSON, nothing else:
{
  "required": [
    { "criterion": "string", "type": "keyword|experience|education|cert", "weight": "knockout|high|medium", "exact_phrase": "quoted text" }
  ],
  "preferred": [
    { "criterion": "string", "type": "keyword|experience|education|cert", "weight": "medium", "exact_phrase": "quoted text" }
  ]
}

Job description:
${jd.slice(0, 4000)}`
}

function buildATSMappingPrompt(criteria: RawCriteriaStep, portfolioText: string): string {
  return `You are an ATS system evaluating whether a candidate's portfolio satisfies job criteria.

Rules:
- "present": true ONLY if you can find explicit evidence in the portfolio text
- "found_at": verbatim quote from the portfolio proving this criterion is met — null if failed
- "fix": if failed, the EXACT text to add — specify section name and precise phrasing
- "fix" must be null when present is true
- Do NOT infer or assume. If not explicitly stated in the portfolio text, it is not there.
- quick_wins: up to 3 failing criteria fixable in under 10 minutes. Format: "Add '[exact phrase]' to your [Skills/Experience/Projects] section"

Output ONLY valid JSON, nothing else:
{
  "job_title": "job title inferred from the criteria",
  "required_results": [
    { "criterion": "string", "present": boolean, "found_at": "verbatim quote or null", "fix": "exact fix text or null" }
  ],
  "preferred_results": [
    { "criterion": "string", "present": boolean, "found_at": "verbatim quote or null", "fix": "exact fix text or null" }
  ],
  "quick_wins": ["specific fix 1", "specific fix 2", "specific fix 3"]
}

JOB CRITERIA:
${JSON.stringify(criteria, null, 2)}

CANDIDATE PORTFOLIO:
${portfolioText}`
}

function validateATSReport(
  criteriaStep: RawCriteriaStep,
  mappingStep:  RawMappingStep,
): ATSReport {
  const mergeResults = (
    metas:   RawCriterion[],
    results: RawMappingResult[],
    isPreferred: boolean,
  ): ATSCriterion[] =>
    metas.slice(0, results.length).map((meta, i) => {
      const result  = results[i]
      // found_at enforcement: can't claim present without quoting evidence
      const present = result.present === true && !!result.found_at
      return {
        criterion: meta.criterion,
        type:      (['keyword','experience','education','cert'].includes(meta.type)
          ? meta.type : 'keyword') as ATSCriterion['type'],
        weight:    (['knockout','high','medium'].includes(meta.weight)
          ? meta.weight : (isPreferred ? 'medium' : 'high')) as CriterionWeight,
        present,
        found_at:  present ? (result.found_at ?? null) : null,
        fix:       present ? null : (result.fix ?? null),
      }
    })

  const required  = mergeResults(criteriaStep.required.slice(0, 8),  mappingStep.required_results,  false)
  const preferred = mergeResults(criteriaStep.preferred.slice(0, 4), mappingStep.preferred_results, true)

  // Weighted pass_rate: knockout=3, high=2, medium=1, preferred=0.5
  const w = (c: ATSCriterion, pref: boolean) =>
    pref ? 0.5 : (c.weight === 'knockout' ? 3 : c.weight === 'high' ? 2 : 1)

  const totalWeight  = [...required.map(c => w(c, false)), ...preferred.map(c => w(c, true))].reduce((a, b) => a + b, 0)
  const earnedWeight = [
    ...required.filter(c => c.present).map(c => w(c, false)),
    ...preferred.filter(c => c.present).map(c => w(c, true)),
  ].reduce((a, b) => a + b, 0)

  const pass_rate        = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0
  const has_knockout_fail = required.some(c => c.weight === 'knockout' && !c.present)
  const verdict: ATSVerdict = pass_rate >= 75 ? 'Strong Pass' : pass_rate >= 50 ? 'Marginal' : 'Likely Filtered'

  return {
    job_title:         String(mappingStep.job_title ?? 'Role'),
    pass_rate,
    verdict,
    has_knockout_fail,
    required,
    preferred,
    quick_wins:        (mappingStep.quick_wins ?? []).slice(0, 3).map(String),
  }
}

export async function generateATSReport(jd: string, portfolioData: PortfolioData): Promise<ATSReport> {
  const GEMINI_FLASH = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
  const key          = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY ?? ''
  const portfolioText = serializePortfolio(portfolioData)

  // ── Step 1: Extract criteria ────────────────────────────────
  let criteriaStep: RawCriteriaStep | null = null

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${GEMINI_FLASH}?key=${key}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          contents:         [{ parts: [{ text: buildATSCriteriaPrompt(jd) }] }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
        }),
      })
      if (!res.ok) throw new Error(`Gemini ${res.status}`)
      const json   = await res.json()
      const text   = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
      if (!Array.isArray(parsed.required)) throw new Error('invalid criteria step')
      criteriaStep = parsed as RawCriteriaStep
      break
    } catch (e) {
      if (attempt === 2) throw e
    }
  }

  if (!criteriaStep) throw new Error('ATS criteria extraction failed')

  // ── Step 2: Map portfolio against criteria ──────────────────
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${GEMINI_FLASH}?key=${key}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          contents:         [{ parts: [{ text: buildATSMappingPrompt(criteriaStep, portfolioText) }] }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
        }),
      })
      if (!res.ok) throw new Error(`Gemini ${res.status}`)
      const json   = await res.json()
      const text   = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
      if (!Array.isArray(parsed.required_results)) throw new Error('invalid mapping step')
      return validateATSReport(criteriaStep, parsed as RawMappingStep)
    } catch (e) {
      if (attempt === 2) throw e
    }
  }

  throw new Error('ATS mapping failed after 3 attempts')
}


// ─── Offer Analyzer ───────────────────────────────────────────

function formatSalary(n: number): string {
  return `$${n.toLocaleString('en-US')}`
}

function buildOfferCompPrompt(input: OfferInput): string {
  const companyType = input.is_public ? 'publicly traded company' : 'private company'
  const competingLine = input.competing_offer
    ? `\nThe candidate has a competing offer of ${formatSalary(input.competing_offer)}.`
    : ''
  const currentLine = input.current_comp
    ? `\nTheir current compensation is ${formatSalary(input.current_comp)}.`
    : ''

  return `You are a compensation analyst with access to 2024–2025 salary benchmark data.

Analyse this job offer against current market rates.

OFFER DETAILS:
- Company: ${input.company} (${companyType})
- Role: ${input.role}
- Seniority: ${input.seniority}
- Location: ${input.location}
- Base salary offered: ${formatSalary(input.base_salary)}${competingLine}${currentLine}

Return ONLY valid JSON, nothing else:
{
  "market_low":    <integer — 10th percentile market base for this role/level/location>,
  "market_median": <integer — 50th percentile>,
  "market_high":   <integer — 90th percentile>,
  "percentile":    <0–100 integer — where the offered base salary sits>,
  "verdict":       "Above Market" | "At Market" | "Below Market",
  "gap":           <integer — offered base minus market_median, negative if underpaid>,
  "insight":       "<one specific sentence explaining the market context — e.g. SF premium, remote discount, hot market>"
}

Rules:
- Use realistic 2024–2025 ranges. Do not fabricate inflated numbers.
- "At Market" = within 10% of median. "Above" = >10% above. "Below" = >10% below.
- insight must reference the specific location and role, not be generic.`
}

function buildOfferEquityPrompt(input: OfferInput, comp: CompAnalysis): string {
  if (!input.equity_annual) {
    return `Return this JSON exactly:
{"annual_value":null,"exit_1_5x":null,"exit_3x":null,"exit_10x":null,"risk_level":"High","verdict":"No equity data provided — analysis based on base compensation only.","has_equity":false}`
  }

  const equityType = input.is_public ? 'RSUs (publicly traded, known market price)' : 'pre-IPO equity (speculative valuation)'

  return `You are a startup equity analyst.

Evaluate the equity component of this job offer.

EQUITY DETAILS:
- Company: ${input.company} (${input.is_public ? 'public' : 'private'})
- Equity type: ${equityType}
- Annual equity value (candidate-provided): ${formatSalary(input.equity_annual)}
- Role: ${input.role} at ${input.seniority} level
- Market context: base is at ${comp.percentile}th percentile (${comp.verdict})

Return ONLY valid JSON, nothing else:
{
  "annual_value": ${input.equity_annual},
  "exit_1_5x":   <integer — annual equity value at a 1.5x outcome>,
  "exit_3x":     <integer — annual equity value at a 3x outcome>,
  "exit_10x":    <integer — annual equity value at a 10x outcome>,
  "risk_level":  "High" | "Medium" | "Low",
  "verdict":     "<one plain-English sentence assessing the equity — be specific about risk>",
  "has_equity":  true
}

Rules:
- For public companies: 1.5x/3x/10x apply to current stock price trajectory
- For private companies: these are exit multiples — most private companies exit below 3x
- risk_level: public = Low/Medium; pre-IPO seed = High; pre-IPO series B+ = Medium
- verdict must be honest about risk, not promotional`
}

function buildOfferNegotiationPrompt(
  input:  OfferInput,
  comp:   CompAnalysis,
  equity: EquityAnalysis,
): string {
  const hasCompeting   = !!input.competing_offer
  const isPayCut       = !!input.current_comp && input.current_comp > input.base_salary
  const compGap        = comp.gap              // negative = underpaid
  const companyType    = input.is_public ? 'public' : 'private'

  const contextLines = [
    `- Offered base: ${formatSalary(input.base_salary)}`,
    `- Market median: ${formatSalary(comp.market_median)} (offer is at ${comp.percentile}th percentile — ${comp.verdict})`,
    `- Market gap: ${compGap >= 0 ? '+' : ''}${formatSalary(compGap)} vs median`,
    hasCompeting ? `- Competing offer: ${formatSalary(input.competing_offer!)} (USE THIS AS PRIMARY LEVERAGE)` : null,
    input.current_comp ? `- Current compensation: ${formatSalary(input.current_comp)}${isPayCut ? ' (this offer is a pay cut — script must address this)' : ''}` : null,
    input.equity_annual ? `- Annual equity: ${formatSalary(input.equity_annual)} (${equity.verdict})` : null,
    input.other_comp ? `- Other comp (signing/bonus): ${formatSalary(input.other_comp)}` : null,
  ].filter(Boolean).join('\n')

  return `You are a senior career negotiation coach who has helped 10,000 people negotiate job offers.

Write a precise, non-cringe negotiation strategy for this exact situation.

OFFER CONTEXT:
- Company: ${input.company} (${companyType})
- Role: ${input.role} at ${input.seniority} level
- Location: ${input.location}
${contextLines}

RULES:
- counter_base must be > ${input.base_salary} and realistic (typically 5–15% above offer, up to 30% with strong competing leverage)
- walk_away_floor must be between ${comp.market_low} and counter_base
- script: the EXACT words they say on the phone or in an email. Natural, specific, non-cringe. 2–4 sentences. No filler phrases.
- walk_away_line: shorter — 1–2 sentences. What to say if the company counters below their floor.
- talking_points: specific to THIS offer — not generic ("I have a competing offer at $X" or "market median for this role in ${input.location} is $Y")
- leverage_reason: one sentence explaining why their leverage is High/Medium/Low
${isPayCut ? '- The script must acknowledge the pay cut directly — do not pretend it is not happening' : ''}
${hasCompeting ? '- The script must reference the competing offer by amount — vague hints are weaker than specific numbers' : ''}

Return ONLY valid JSON, nothing else:
{
  "leverage":         "High" | "Medium" | "Low",
  "leverage_reason":  "<one sentence>",
  "counter_base":     <integer>,
  "counter_equity":   <integer or null>,
  "counter_signing":  <integer or null>,
  "script":           "<exact words to say — quoted, natural, specific>",
  "talking_points":   ["<specific point 1>", "<specific point 2>"],
  "walk_away_line":   "<exact words for counter-counter>",
  "walk_away_floor":  <integer>
}`
}

function validateOfferReport(
  rawComp:   unknown,
  rawEquity: unknown,
  rawNeg:    unknown,
  input:     OfferInput,
): OfferReport {
  const comp   = rawComp   as CompAnalysis
  const equity = rawEquity as EquityAnalysis
  const neg    = rawNeg    as NegotiationScript

  // Sanity-check counter_base
  if (typeof neg.counter_base !== 'number' || neg.counter_base <= input.base_salary) {
    neg.counter_base = Math.round(input.base_salary * 1.1)
  }
  if (neg.counter_base > input.base_salary * 1.5) {
    // Don't cap — but clamp absurdity (e.g. AI suggests $2M on $100k offer)
    neg.counter_base = Math.round(input.base_salary * 1.5)
  }

  // Sanity-check walk_away_floor
  const floorMin = comp.market_low ?? Math.round(input.base_salary * 0.95)
  const floorMax = neg.counter_base - 1
  if (typeof neg.walk_away_floor !== 'number' || neg.walk_away_floor < floorMin || neg.walk_away_floor >= neg.counter_base) {
    neg.walk_away_floor = Math.round((floorMin + neg.counter_base) / 2)
  }
  neg.walk_away_floor = Math.min(neg.walk_away_floor, floorMax)

  // Ensure talking_points is an array
  if (!Array.isArray(neg.talking_points)) neg.talking_points = []
  neg.talking_points = neg.talking_points.slice(0, 3).map(String)

  // Validate leverage value
  if (!['High', 'Medium', 'Low'].includes(neg.leverage as string)) {
    neg.leverage = 'Medium' as NegotiationLeverage
  }

  return { comp, equity, negotiation: neg }
}

export async function generateOfferReport(input: OfferInput): Promise<OfferReport> {
  const GEMINI_FLASH  = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
  const DEEPSEEK_URL  = 'https://api.deepseek.com/v1/chat/completions'
  const geminiKey     = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY ?? ''
  const deepseekKey   = process.env.DEEPSEEK_API_KEY ?? ''

  async function callGemini(prompt: string): Promise<unknown> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`${GEMINI_FLASH}?key=${geminiKey}`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents:         [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
          }),
        })
        if (!res.ok) throw new Error(`Gemini ${res.status}`)
        const json = await res.json()
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
      } catch (e) {
        if (attempt === 2) throw e
      }
    }
    throw new Error('Gemini call failed')
  }

  async function callDeepSeek(prompt: string): Promise<unknown> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(DEEPSEEK_URL, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${deepseekKey}` },
          body: JSON.stringify({
            model:       'deepseek-chat',
            messages:    [{ role: 'user', content: prompt }],
            temperature: 0.2,
          }),
        })
        if (!res.ok) throw new Error(`DeepSeek ${res.status}`)
        const json    = await res.json()
        const content = json?.choices?.[0]?.message?.content ?? ''
        return JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim())
      } catch (e) {
        if (attempt === 2) throw e
      }
    }
    throw new Error('DeepSeek call failed')
  }

  // ── Step 1: Comp analysis ──────────────────────────────────
  const rawComp = await callGemini(buildOfferCompPrompt(input))

  // ── Step 2: Equity analysis ────────────────────────────────
  const rawEquity = await callGemini(buildOfferEquityPrompt(input, rawComp as CompAnalysis))

  // ── Step 3: Negotiation script (DeepSeek → Gemini fallback)
  let rawNeg: unknown
  if (deepseekKey) {
    try {
      rawNeg = await callDeepSeek(buildOfferNegotiationPrompt(input, rawComp as CompAnalysis, rawEquity as EquityAnalysis))
    } catch {
      rawNeg = await callGemini(buildOfferNegotiationPrompt(input, rawComp as CompAnalysis, rawEquity as EquityAnalysis))
    }
  } else {
    rawNeg = await callGemini(buildOfferNegotiationPrompt(input, rawComp as CompAnalysis, rawEquity as EquityAnalysis))
  }

  return validateOfferReport(rawComp, rawEquity, rawNeg, input)
}
