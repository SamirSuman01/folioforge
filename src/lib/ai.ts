import type { Field } from './types';

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

  finance: `You are an investment banking career copywriter.
Rewrite each bullet to show deal impact and analytical rigor.
Use verbs: modeled, structured, advised, analyzed, presented.
ONLY include stats (deal sizes, rankings, returns) that are EXPLICITLY stated in the input text. If no numeric metrics exist, return an empty stats array.
NEVER invent, estimate, or approximate numbers.
Create a memorable one-line tagline. Return valid JSON only.`,

  research: `You are an academic career copywriter.
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
    finance: ['finance', 'banking', 'investment', 'analyst', 'valuation', 'dcf', 'lbo', 'bloomberg', 'excel', 'modeling', 'deal', 'm&a'].filter(k => lower.includes(k)).length,
    research: ['research', 'phd', 'paper', 'published', 'citation', 'lab', 'thesis', 'neurips', 'journal', 'grant', 'fellow'].filter(k => lower.includes(k)).length,
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
