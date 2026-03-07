# FolioForge — Technical Implementation Plan
### Version 2.0 | March 2026

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        VERCEL (Free Tier)                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Next.js 14 (App Router)                 │   │
│  │                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │   │
│  │  │ Landing  │  │Dashboard │  │  Public Portfolio │  │   │
│  │  │ Page (/) │  │/dashboard│  │  /p/[slug] (SSR)  │  │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │   │
│  │                                                      │   │
│  │  ┌──────────────── API Routes ──────────────────┐   │   │
│  │  │ /api/upload    → PDF parse                    │   │   │
│  │  │ /api/generate  → AI streaming (SSE)           │   │   │
│  │  │ /api/portfolio → CRUD                         │   │   │
│  │  │ /api/track     → Analytics ingestion          │   │   │
│  │  │ /api/payment/* → Stripe checkout + webhook    │   │   │
│  │  └───────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
              ┌─────────────┼──────────────┐
              ▼             ▼              ▼
     ┌──────────────┐ ┌─────────┐  ┌───────────┐
     │   Supabase   │ │ Gemini  │  │  Stripe   │
     │  (Free Tier) │ │  Flash  │  │           │
     │              │ │ (Free)  │  │ Checkout  │
     │ • PostgreSQL │ │         │  │ + Webhook │
     │ • Auth       │ │ OR      │  └───────────┘
     │ • Storage    │ │         │
     │ • RLS        │ │ Claude  │
     └──────────────┘ │ (Paid)  │
                      └─────────┘
```

### Request Flow: PDF Upload → AI Streaming → Portfolio

```
Browser                    Server (API Route)           External Services
  │                              │                            │
  │  1. Upload PDF (multipart)   │                            │
  │─────────────────────────────>│                            │
  │                              │  2. Extract text in-memory │
  │                              │     (pdf-parse on buffer)  │
  │                              │     PDF buffer discarded   │
  │                              │     immediately after      │
  │                              │                            │
  │  3. Return extracted text    │                            │
  │     + detected field         │                            │
  │<─────────────────────────────│                            │
  │                              │                            │
  │  4. POST /api/generate       │                            │
  │     (SSE streaming request)  │                            │
  │─────────────────────────────>│                            │
  │                              │  5. Stream to Gemini/Claude│
  │                              │───────────────────────────>│ AI Provider
  │                              │                            │
  │  6. SSE chunks streaming     │  7. Streaming response     │
  │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
  │                              │                            │
  │  8. User sees live rewrite   │                            │
  │  9. User clicks "Save"       │                            │
  │─────────────────────────────>│                            │
  │                              │  10. Save to portfolios    │
  │                              │───────────────────────────>│ Supabase DB
  │                              │                            │
  │  11. Redirect to /p/[slug]   │                            │
  │<─────────────────────────────│                            │
```

> **Architecture change from v1:** PDF is NO longer uploaded to Supabase Storage. Text is extracted in-memory directly from the upload buffer and the buffer is discarded. This eliminates: a network round-trip to Supabase, storage costs, a deletion operation, and the privacy risk of a PDF sitting on a third-party server.
>
> **Privacy note:** The extracted text IS sent back to the browser (step 3) and then sent again to the server (step 4). This means full LinkedIn profile text is in the browser's memory/network tab. This is a deliberate tradeoff for the before/after UX — the browser needs the text to show the "before" column.

---

## 2. Technology Stack — Detailed

### 2.1 Next.js 14 (App Router)

**Why App Router over Pages Router:**
- Server Components by default (faster page loads, smaller JS bundles)
- Streaming support built-in (critical for AI streaming UX)
- Route handlers replace API routes (cleaner file structure)
- Layouts and loading states (better UX)
- Server Actions for form submissions

**Configuration:**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'], // Google OAuth avatars
  },
  // Note: serverActions.bodySizeLimit controls Server Actions, NOT Route Handlers.
  // PDF uploads go through a Route Handler (/api/upload), not a Server Action.
  // Vercel free tier has a 4.5MB serverless function payload limit.
  // Our 5MB PDF limit should be reduced to 4MB to stay within Vercel's limit.
};
module.exports = nextConfig;
```

### 2.2 Supabase

**Services used:**
1. **Auth** — Google OAuth + Email/Password
2. **PostgreSQL** — All application data
3. **Row Level Security** — Per-user data isolation
*(Storage no longer used — PDFs extracted in-memory, not uploaded to Supabase)*

**Client setup (two clients needed):**

```javascript
// lib/supabase-client.js — Browser (client components)
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
```

```javascript
// lib/supabase-server.js — Server (API routes, server components)
// IMPORTANT: cookies() from next/headers is READ-ONLY in Server Components.
// set() and remove() only work in Route Handlers and Server Actions.
// If used in a Server Component, cookie refresh silently fails and
// sessions won't stay fresh. This is a known Supabase SSR gotcha.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) {
          try { cookieStore.set({ name, value, ...options }); } catch {
            // Silently fail in Server Components (read-only context)
          }
        },
        remove(name, options) {
          try { cookieStore.set({ name, value: '', ...options }); } catch {
            // Silently fail in Server Components (read-only context)
          }
        },
      },
    }
  );
}
```

### 2.3 AI Provider — Swappable Architecture

```javascript
// lib/ai.js
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent';

const SYSTEM_PROMPTS = {
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

// Detect field from LinkedIn text
export function detectField(text) {
  const lower = text.toLowerCase();
  const scores = {
    cs: ['software', 'engineer', 'developer', 'python', 'javascript', 'api', 'github', 'deploy', 'backend', 'frontend', 'full stack', 'aws', 'docker', 'react'].filter(k => lower.includes(k)).length,
    design: ['design', 'ux', 'ui', 'figma', 'sketch', 'user research', 'prototype', 'wireframe', 'accessibility', 'hci'].filter(k => lower.includes(k)).length,
    finance: ['finance', 'banking', 'investment', 'analyst', 'valuation', 'dcf', 'lbo', 'bloomberg', 'excel', 'modeling', 'deal', 'm&a'].filter(k => lower.includes(k)).length,
    research: ['research', 'phd', 'paper', 'published', 'citation', 'lab', 'thesis', 'neurips', 'journal', 'grant', 'fellow'].filter(k => lower.includes(k)).length,
    marketing: ['marketing', 'brand', 'campaign', 'social media', 'content', 'growth', 'seo', 'analytics', 'engagement', 'hubspot'].filter(k => lower.includes(k)).length,
  };

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topScore = sorted[0][1];

  // If no keywords matched at all, return null — let the user choose
  if (topScore === 0) return null;

  // If there's a tie between top scores, return null — let the user choose
  const ties = sorted.filter(([, score]) => score === topScore);
  if (ties.length > 1) return null;

  return sorted[0][0];
}

// When detectField returns null, show a field picker in the UI:
// "We couldn't auto-detect your field. Please select: [CS] [Design] [Finance] [Research] [Marketing]"

// Generate portfolio with streaming
export async function generatePortfolioStream(linkedinText, field) {
  const provider = process.env.AI_PROVIDER || 'gemini';
  const systemPrompt = SYSTEM_PROMPTS[field] || SYSTEM_PROMPTS.cs;

  const userPrompt = `Transform this LinkedIn profile into a portfolio. Return JSON only.

OUTPUT FORMAT:
{
  "name": "First Last",
  "role": "Role · Specialty",
  "tagline": "One memorable line in quotes",
  "stats": [{"label": "...", "value": "..."}],
  "experience": [{"company": "...", "title": "...", "period": "...", "bullets": ["..."]}],
  "education": [{"institution": "...", "degree": "...", "year": "..."}],
  "skills": ["..."]
}

LINKEDIN PROFILE:
${linkedinText}`;

  if (provider === 'claude') {
    return streamFromClaude(systemPrompt, userPrompt);
  }
  return streamFromGemini(systemPrompt, userPrompt);
}

// Gemini streaming
async function streamFromGemini(systemPrompt, userPrompt) {
  // IMPORTANT: Do NOT set responseMimeType: 'application/json' with streaming.
  // JSON mode may cause Gemini to buffer the entire response before returning,
  // defeating the streaming UX. Instead, instruct JSON-only in the prompt.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout

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
            // No responseMimeType — rely on prompt for JSON output
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

// Claude streaming (premium option)
async function streamFromClaude(systemPrompt, userPrompt) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6', // Use env var, don't hardcode
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
```

### 2.4 PDF Parsing

```javascript
// lib/pdf-parser.js
// IMPORTANT: pdf-parse has a known Next.js issue — default import tries to access
// the filesystem during initialization (looking for test files), causing ENOENT
// errors in serverless/edge environments. Use the direct path import.
// Consider migrating to pdfjs-dist (actively maintained by Mozilla) for production.
const pdf = require('pdf-parse/lib/pdf-parse');

export async function extractTextFromPDF(buffer) {
  const data = await pdf(buffer);
  return {
    text: data.text,
    pages: data.numpages,
    info: data.info, // title, author, etc.
  };
}
```

---

## 3. Database Schema (Complete SQL)

```sql
-- Run in Supabase SQL Editor

-- ═══════════════════════════════════════
-- TABLE: profiles (extends auth.users)
-- ═══════════════════════════════════════
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'lifetime')),
  plan_expires_at TIMESTAMPTZ,        -- NULL for free/lifetime
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════
-- TABLE: portfolios
-- ═══════════════════════════════════════
CREATE TABLE portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  template TEXT DEFAULT 'system-dark'
    CHECK (template IN ('system-dark', 'clean-light', 'split-editorial', 'broadsheet', 'warm-editorial')),
  data JSONB NOT NULL DEFAULT '{}',
  raw_linkedin_text TEXT,               -- Original PDF text for re-generation
  detected_field TEXT DEFAULT 'cs'
    CHECK (detected_field IN ('cs', 'design', 'finance', 'research', 'marketing')),
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_portfolios_slug ON portfolios(slug);
CREATE INDEX idx_portfolios_user ON portfolios(user_id);

-- ═══════════════════════════════════════
-- TABLE: analytics
-- ═══════════════════════════════════════
CREATE TABLE analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  visitor_ip TEXT,
  company TEXT,                         -- Reverse IP lookup result
  city TEXT,
  country TEXT,
  referrer TEXT,                        -- 'linkedin.com', 'google.com', 'direct', etc.
  user_agent TEXT,
  duration_seconds INTEGER,             -- Time spent on page
  visited_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_analytics_portfolio ON analytics(portfolio_id);
CREATE INDEX idx_analytics_visited ON analytics(visited_at DESC);

-- ═══════════════════════════════════════
-- TABLE: payments
-- ═══════════════════════════════════════
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT, -- Prevent account deletion if payments exist (for audit trail)
  user_email TEXT, -- Snapshot of email at payment time for refund disputes
  plan TEXT NOT NULL CHECK (plan IN ('pro_monthly', 'pro_yearly', 'lifetime')),
  amount INTEGER NOT NULL,              -- Smallest unit (paise/cents)
  currency TEXT DEFAULT 'inr' CHECK (currency IN ('inr', 'usd')),
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Portfolios
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own portfolios"
  ON portfolios FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public view published portfolios"
  ON portfolios FOR SELECT USING (is_published = true);

-- Analytics
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own analytics"
  ON analytics FOR SELECT USING (
    portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid())
  );

-- REMOVED: "Anyone can insert analytics" WITH CHECK (true)
-- This was a critical security flaw — anyone could inject fake analytics records
-- (e.g., fake "Goldman Sachs" views) for any portfolio_id.
-- Analytics inserts now go ONLY through /api/track route using the service role key.
-- No client-side analytics inserts allowed.

-- Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments"
  ON payments FOR SELECT USING (auth.uid() = user_id);

-- ═══════════════════════════════════════
-- AUTO-UPDATE updated_at TRIGGER
-- ═══════════════════════════════════════
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_portfolios_modtime
  BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ═══════════════════════════════════════
-- STORAGE BUCKET — NO LONGER NEEDED
-- ═══════════════════════════════════════
-- PDFs are now extracted in-memory and never stored.
-- No Supabase Storage bucket required for PDFs.
-- If profile images are added later, create a bucket then.
```

---

## 4. API Routes — Detailed Specifications

### 4.1 POST /api/upload

**Purpose:** Accept PDF, extract text, return structured data.

```javascript
// src/app/api/upload/route.js
import { NextResponse } from 'next/server';
import { extractTextFromPDF } from '@/lib/pdf-parser';
import { detectField } from '@/lib/ai';

export async function POST(request) {
  // TODO: Add rate limiting here (e.g., @upstash/ratelimit, 10 req/min per IP)
  // Without rate limiting, anyone can drain Gemini quota by looping this endpoint.

  const formData = await request.formData();
  const file = formData.get('pdf');

  // Validate
  if (!file || file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'PDF file required' }, { status: 400 });
  }
  if (file.size > 4 * 1024 * 1024) { // 4MB — Vercel free tier limits payload to 4.5MB
    return NextResponse.json({ error: 'File too large (max 4MB)' }, { status: 400 });
  }

  // Extract text in-memory — PDF buffer is discarded after this
  const buffer = Buffer.from(await file.arrayBuffer());
  const { text } = await extractTextFromPDF(buffer);
  // buffer is now eligible for GC — no storage, no persistence

  if (!text || text.trim().length < 50) {
    return NextResponse.json({ error: 'Could not extract text from PDF' }, { status: 422 });
  }

  // Detect field (may return null if ambiguous)
  const field = detectField(text);

  return NextResponse.json({ text, field });
}

// Note: No `export const config = { api: { bodyParser: false } }` needed.
// That's Pages Router syntax. App Router Route Handlers parse body manually.
```

### 4.2 POST /api/generate (Streaming)

**Purpose:** Send extracted text to AI, stream response back.

```javascript
// src/app/api/generate/route.js
import { generatePortfolioStream } from '@/lib/ai';

export async function POST(request) {
  // TODO: Add rate limiting here (e.g., @upstash/ratelimit, 5 req/min per IP)

  const { text, field } = await request.json();

  if (!text) {
    return new Response('Missing text', { status: 400 });
  }

  let aiResponse;
  try {
    aiResponse = await generatePortfolioStream(text, field || 'cs');
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if AI response is OK before reading body
  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    return new Response(JSON.stringify({ error: `AI provider error: ${aiResponse.status}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Transform AI stream → SSE stream for client
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = aiResponse.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // Forward chunk as SSE event
          controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        controller.enqueue(encoder.encode(`data: {"error": "${error.message}"}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 4.3 POST/GET/PUT/DELETE /api/portfolio

**Purpose:** CRUD operations for portfolios.

```
POST   /api/portfolio          → Create new portfolio
GET    /api/portfolio          → List user's portfolios
PUT    /api/portfolio/[id]     → Update portfolio data/template/publish status
DELETE /api/portfolio/[id]     → Delete portfolio
```

### 4.4 POST /api/track

**Purpose:** Record visitor analytics for a portfolio view.

```javascript
// src/app/api/track/route.js
import { createClient } from '@supabase/supabase-js';

// Use service role key — RLS blocks client-side analytics inserts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  // Parse body — sendBeacon sends text/plain by default, so handle both
  let body;
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await request.json();
  } else {
    // sendBeacon with string sends text/plain
    const text = await request.text();
    try { body = JSON.parse(text); } catch {
      return new Response('Invalid JSON', { status: 400 });
    }
  }

  const { portfolioId, referrer, duration, type } = body;

  if (!portfolioId) {
    return new Response('Missing portfolioId', { status: 400 });
  }

  // Get visitor IP — prefer x-vercel-forwarded-for (not spoofable on Vercel)
  const ip = request.headers.get('x-vercel-forwarded-for')
    || request.headers.get('x-real-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';

  // Validate IP format before using in URL
  const ipRegex = /^[\d.]+$|^[\da-fA-F:]+$/;
  const safeIp = ipRegex.test(ip) ? ip : 'unknown';

  // If this is a duration update, just update the existing record
  if (type === 'duration_update' && duration) {
    await supabase
      .from('analytics')
      .update({ duration_seconds: duration })
      .eq('portfolio_id', portfolioId)
      .eq('visitor_ip', safeIp)
      .order('visited_at', { ascending: false })
      .limit(1);
    return new Response('ok', { status: 200 });
  }

  // Geo lookup (free API) — use HTTPS, add timeout
  let geo = { city: 'Unknown', country: 'Unknown', org: '' };
  if (safeIp !== 'unknown') {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout
      const geoRes = await fetch(
        `https://ip-api.com/json/${safeIp}?fields=city,country,org`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      const geoData = await geoRes.json();
      geo = {
        city: geoData.city || 'Unknown',
        country: geoData.country || 'Unknown',
        org: geoData.org || '',  // Note: This is ISP/network owner, NOT employer
      };
    } catch {
      // Geo lookup failed — proceed with defaults
    }
  }

  // Insert analytics + increment view count in sequence
  const { error: insertError } = await supabase.from('analytics').insert({
    portfolio_id: portfolioId,
    visitor_ip: safeIp,
    company: geo.org,
    city: geo.city,
    country: geo.country,
    referrer: referrer || 'direct',
    user_agent: request.headers.get('user-agent') || '',
    duration_seconds: duration || null,
  });

  if (!insertError) {
    await supabase.rpc('increment_view_count', { portfolio_id: portfolioId });
  }

  return new Response('ok', { status: 200 });
}
```

### 4.5 Stripe Payment Routes

```
POST /api/payment/create  → Create Stripe Checkout session, return URL
POST /api/payment/verify  → Stripe webhook: verify payment, upgrade user plan
```

---

## 5. Frontend Components — Detailed

### 5.1 AI Streaming Hook

```javascript
// hooks/useStreamingRewrite.js
// NOTE: This is a custom HOOK, not a component. It returns state, not JSX.
// Usage: const { streamedText, isStreaming, portfolioData, startStreaming } = useStreamingRewrite();
'use client';
import { useState, useCallback, useRef } from 'react';

export function useStreamingRewrite() {
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [portfolioData, setPortfolioData] = useState(null);
  const [error, setError] = useState(null);
  const bufferRef = useRef(''); // SSE buffer for proper parsing

  const startStreaming = useCallback(async (linkedinText, field) => {
    setIsStreaming(true);
    setStreamedText('');
    setPortfolioData(null);
    setError(null);
    bufferRef.current = '';

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: linkedinText, field }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Proper SSE parsing: maintain buffer across chunks
        // (chunks don't align with SSE event boundaries)
        bufferRef.current += decoder.decode(value, { stream: true });
        const events = bufferRef.current.split('\n\n');
        bufferRef.current = events.pop() || ''; // Keep incomplete event in buffer

        for (const event of events) {
          for (const line of event.split('\n')) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setIsStreaming(false);
                try {
                  setPortfolioData(JSON.parse(fullText));
                } catch (parseErr) {
                  setError('AI returned invalid data. Please try again.');
                }
                return;
              }
              try {
                const parsed = JSON.parse(data);
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                fullText += text;
                setStreamedText(fullText);
              } catch {
                fullText += data;
                setStreamedText(fullText);
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Generation failed. Please try again.');
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { streamedText, isStreaming, portfolioData, error, startStreaming };
}
```

> **Streaming UX Reality Check:** Since the AI returns JSON, what actually streams on screen is raw JSON text like `{"name": "Aditya`. The beautiful rendered portfolio shown in the wireframes requires either: (a) progressive JSON parsing that extracts fields as they complete and renders them into the template in real-time, or (b) streaming prose first, then parsing the final JSON. Option (a) is the correct approach — parse partial JSON, extract completed fields, render them into the template progressively.

### 5.2 Template Components (Pattern)

Each template is a React component with self-contained styles:

```javascript
// components/templates/SystemDark.js
export default function SystemDark({ data }) {
  const { name, role, tagline, stats, experience, education, skills } = data;

  return (
    // Note: font-mono uses browser default monospace, NOT JetBrains Mono.
    // JetBrains Mono must be loaded via Google Fonts AND configured in tailwind.config.js.
    <div className="min-h-screen bg-[#07090F] text-[#F0EDE6] font-mono">
      {/* Header */}
      <header className="max-w-3xl mx-auto px-6 pt-20 pb-12">
        <h1 className="text-5xl font-extrabold tracking-tight font-display">
          {name}
        </h1>
        <p className="text-[#4CC9FF] text-lg mt-2 tracking-wide">{role}</p>
        <p className="text-[#B8B3AA] italic font-serif mt-4 text-lg">{tagline}</p>
      </header>

      {/* Stats Grid */}
      <div className="max-w-3xl mx-auto px-6 grid grid-cols-3 gap-px bg-white/5">
        {stats?.map((stat, i) => (
          <div key={i} className="bg-[#07090F] p-6 text-center">
            <div className="text-3xl font-bold text-[#4CC9FF]">{stat.value}</div>
            <div className="text-xs uppercase tracking-widest text-[#8A857E] mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Experience */}
      <section className="max-w-3xl mx-auto px-6 py-12">
        <h2 className="text-xs uppercase tracking-widest text-[#8A857E] mb-8">
          Experience
        </h2>
        {experience?.map((exp, i) => (
          <div key={i} className="mb-8 border-l-2 border-[#4CC9FF]/20 pl-6">
            <div className="text-[#F0EDE6] font-medium">{exp.company}</div>
            <div className="text-[#8A857E] text-sm">{exp.title} · {exp.period}</div>
            {exp.bullets?.map((bullet, j) => (
              <p key={j} className="text-[#B8B3AA] mt-2 leading-relaxed">
                {bullet}
              </p>
            ))}
          </div>
        ))}
      </section>

      {/* Skills */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-xs uppercase tracking-widest text-[#8A857E] mb-4">
          Skills
        </h2>
        <div className="flex flex-wrap gap-2">
          {skills?.map((skill, i) => (
            <span key={i} className="px-3 py-1 text-sm border border-[#4CC9FF]/20 text-[#B8B3AA]">
              {skill}
            </span>
          ))}
        </div>
      </section>

      {/* Viral Badge (Free users only) */}
      <footer className="text-center py-8 border-t border-white/5">
        <a href={`${process.env.NEXT_PUBLIC_APP_URL}?ref=badge`}
           className="text-xs text-[#5E5954] hover:text-[#8A857E] transition-colors">
          Built with FolioForge · Create your own portfolio →
        </a>
      </footer>
    </div>
  );
}
```

### 5.3 Analytics Tracker (Client Component on Portfolio Pages)

```javascript
// components/AnalyticsTracker.js
'use client';
import { useEffect } from 'react';

export default function AnalyticsTracker({ portfolioId }) {
  useEffect(() => {
    const startTime = Date.now();

    // Track visit
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        portfolioId,
        referrer: document.referrer || 'direct',
      }),
    });

    // Track duration on leave
    // IMPORTANT: sendBeacon with string sends text/plain, not JSON.
    // Use Blob with explicit content-type to send JSON.
    const trackDuration = () => {
      const duration = Math.round((Date.now() - startTime) / 1000);
      if (duration < 2) return; // Skip accidental/bot visits
      const blob = new Blob(
        [JSON.stringify({ portfolioId, duration, type: 'duration_update' })],
        { type: 'application/json' }
      );
      navigator.sendBeacon('/api/track', blob);
    };

    // visibilitychange is the PRIMARY tracker (works on mobile)
    // beforeunload is FALLBACK only (unreliable on mobile)
    const handleVisibilityChange = () => {
      if (document.hidden) trackDuration();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', trackDuration);

    // IMPORTANT: Clean up BOTH listeners to prevent accumulation
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', trackDuration);
    };
  }, [portfolioId]);

  return null; // Invisible component
}
```

---

## 6. Environment Variables

```bash
# .env.local (NEVER commit this file)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...      # Server-only — used by /api/track to insert analytics (bypasses RLS)

# AI Provider
AI_PROVIDER=gemini                         # 'gemini' (free) or 'claude' (paid)
GEMINI_API_KEY=AIzaSy...                   # Get from ai.google.dev
ANTHROPIC_API_KEY=sk-ant-...               # Only if AI_PROVIDER=claude

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000   # Change to production URL on deploy
```

---

## 7. Build Schedule — Revised (World-Class Approach)

### Week 1: The "Holy Shit" Experience

| Day | Task | Files Created | Verification |
|---|---|---|---|
| **1** | Project setup: `npx create-next-app`, install deps, Supabase project, DB schema, env vars | `package.json`, `next.config.js`, `tailwind.config.js`, `.env.local`, `lib/*` | `npm run dev` shows Next.js welcome page |
| **2** | Upload flow: PDF drop zone + server-side parsing. No auth required. | `api/upload/route.js`, `components/UploadModal.js`, `lib/pdf-parser.js` | Upload real LinkedIn PDF → see extracted text in console |
| **3** | AI streaming: Gemini integration, SSE endpoint, streaming UI component | `api/generate/route.js`, `lib/ai.js`, `components/StreamingRewrite.js` | Upload PDF → watch AI rewrite stream live on screen |
| **4** | 2 templates: System Dark + Clean Light as full React components | `components/templates/SystemDark.js`, `CleanLight.js` | Both templates render portfolio data beautifully |
| **5** | Public portfolio pages: `/p/[slug]` with SSR, SEO meta tags, Schema.org | `app/p/[slug]/page.js` | Visit `/p/test` → see rendered portfolio, check OG tags |
| **6** | Auth: Supabase Google + Email, protected routes, profile creation | `app/auth/*`, `middleware.js`, SQL trigger | Sign up → login → redirect to dashboard |
| **7** | Dashboard shell + save flow: save generated portfolio, list on dashboard | `app/dashboard/page.js`, `api/portfolio/route.js` | Generate → save → see in dashboard → click → view public page |

### Week 2: Intelligence + Business

| Day | Task | Files Created | Verification |
|---|---|---|---|
| **8** | Editor: content editing, template switcher, live preview, publish toggle | `app/editor/[id]/page.js`, `components/editor/*` | Edit name → see live update in preview → save → public page updated |
| **9** | Analytics tracking: /api/track route, geo-lookup, sendBeacon integration | `api/track/route.js`, `components/AnalyticsTracker.js` | Visit portfolio → check analytics table → see visitor data |
| **10** | Analytics dashboard UI: stats cards, sparkline, visitor list, free user blur | `components/dashboard/AnalyticsPanel.js` | Pro user sees full analytics, free user sees blurred teaser |
| **11** | 3 templates: Split Editorial, Broadsheet, Warm Editorial | `components/templates/Split*.js`, `Broadsheet.js`, `WarmEditorial.js` | All 5 templates render correctly, switch in editor |
| **12** | Payments: Stripe Checkout, webhook, plan upgrade logic, currency toggle | `api/payment/*`, Stripe configuration | Test mode payment → plan upgraded → Pro features unlock |
| **13** | Privacy: cookie consent banner, privacy policy page, ToS page | `app/privacy/page.js`, consent component | Consent shown on portfolio pages, links in signup modal |
| **14** | Viral badge + API rate limiting setup (Upstash) | Badge component, ratelimit middleware | Badge links work with UTM, API endpoints rate-limited |

### Week 3: Polish + Launch

| Day | Task | Files Created | Verification |
|---|---|---|---|
| **15** | Landing page: migrate existing HTML to Next.js, fix all CTAs | `app/page.js`, `globals.css` | Landing page matches design, CTAs open upload modal |
| **16** | OG image generation (/api/og/[slug]) + font loading + meta tags | `api/og/[slug]/route.js` | Share portfolio URL on Twitter → see rich preview |
| **17** | Mobile responsive pass across all pages | All files | Test on iPhone SE, iPhone 14, Android — all pages work |
| **18** | Bug fixes, error states, loading states, edge cases | All files | All error states handled gracefully |
| **19** | Basic test suite: auth flow, portfolio CRUD, analytics insert | `__tests__/*` | `npm test` passes |
| **20** | Deploy to Vercel, production env vars, final QA | `vercel.json` | Live at folioforge.vercel.app, full flow works in production |
| **21** | Client handoff: documentation, access transfer | `README.md` | GitHub, Supabase, Stripe access transferred |

---

## 8. Dependencies (package.json)

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "pdf-parse": "^1.1.1",
    "stripe": "^16.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "@upstash/ratelimit": "^2.0.0",
    "@upstash/redis": "^1.34.0"
  },
  "devDependencies": {
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.2.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0"
  }
}
```

> **Notable additions from v1:**
> - `@upstash/ratelimit` + `@upstash/redis` — API rate limiting (critical for preventing Gemini quota abuse)
> - `vitest` + `@testing-library/react` — Basic testing (no tests = no quality confidence for a product with payments and auth)
>
> **Notable consideration:** `pdf-parse` was last published in 2019 and is unmaintained. Consider migrating to `pdfjs-dist` (Mozilla, actively maintained) for production reliability.

---

## 9. Deployment Checklist

### Pre-Deploy
- [ ] All `.env.local` values set in Vercel Environment Variables
- [ ] Supabase project URL and keys confirmed
- [ ] Gemini API key tested
- [ ] Stripe webhook endpoint configured to production URL
- [ ] Supabase Storage bucket `pdfs` created with correct policies
- [ ] All SQL migrations run in Supabase

### Post-Deploy
- [ ] Landing page loads at folioforge.vercel.app
- [ ] Google OAuth works (callback URL added in Google Cloud Console + Supabase)
- [ ] PDF upload + AI generation works end-to-end
- [ ] Portfolio publishes and is accessible at /p/[slug]
- [ ] Analytics tracking fires on portfolio visit
- [ ] Stripe test payment completes successfully
- [ ] OG tags render correctly when sharing link on social
- [ ] Mobile responsive on iPhone SE, iPhone 14, Android

### Client Handoff
- [ ] GitHub repo access transferred
- [ ] Supabase project: add client as admin
- [ ] Stripe account: connected or transfer ownership
- [ ] Gemini API key: documented (client creates their own)
- [ ] Custom domain: instructions provided
- [ ] README.md: setup, env vars, architecture explained

---

## 10. Security Measures

1. **PDF handling:** Extracted in-memory directly from upload buffer. PDF buffer discarded immediately after text extraction. No Supabase Storage involved. Raw extracted text IS stored in DB for regeneration — disclosed in privacy policy.
2. **Row Level Security:** Every table has RLS enabled. Users can only access their own data. Published portfolios are publicly readable. Analytics inserts go through service role key only (client inserts blocked).
3. **Input sanitization:** React JSX auto-escapes by default. NEVER use `dangerouslySetInnerHTML`. If rich text is needed later, use a sanitizer library (DOMPurify).
4. **Payment security:** Stripe Checkout handles all card details. No payment data touches our servers. Webhook signature verified.
5. **Auth tokens:** Managed by Supabase via HTTP-only cookies. No localStorage tokens.
6. **Rate limiting:** Per-IP rate limiting via `@upstash/ratelimit` on `/api/upload` (10/min), `/api/generate` (5/min), and `/api/track` (30/min). Vercel's DDoS protection is network-level only — it does NOT rate-limit API calls.
7. **CORS:** Explicitly set CORS headers on API routes. Next.js Route Handlers do NOT enforce same-origin by default — headers must be configured manually.
8. **Environment variables:** All secrets server-side only (no `NEXT_PUBLIC_` prefix). `SUPABASE_SERVICE_ROLE_KEY` used only in `/api/track` for analytics inserts.
9. **IP handling:** Validate IP format before using in external API URLs (prevent path traversal). Prefer `x-vercel-forwarded-for` over `x-forwarded-for` (less spoofable on Vercel).
10. **Privacy compliance:** Cookie consent banner on portfolio pages. Privacy policy at `/privacy`. GDPR data deletion endpoint. Consent language at signup.
