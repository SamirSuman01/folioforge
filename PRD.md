# FolioForge — Product Requirements Document
### Version 2.0 | March 2026

---

## 1. Executive Summary

**FolioForge** is a career visibility engine that transforms LinkedIn PDF exports into AI-generated portfolio websites in under 60 seconds — with real-time recruiter intelligence built in.

**The Problem:** Most recruiters Google candidates before calling them (industry surveys consistently estimate 70-90%, though exact figures vary by sector). Most students and early-career professionals have zero web presence. They're invisible to opportunity.

**The Solution:** Upload a LinkedIn PDF. Watch AI rewrite your career in real-time. Publish a portfolio optimized for Google discovery. Know when someone views it.

**What makes FolioForge different from every competitor:**

| | Zapfolio | VisePage | Vitaely | **FolioForge** |
|---|---|---|---|---|
| LinkedIn to portfolio | Yes | Yes | Yes | **Yes** |
| AI content rewriting | No | No | No | **Yes — streams live** |
| Field-adaptive AI | No | No | No | **Yes (CS/Design/Finance/Research/Marketing)** |
| Recruiter analytics | No | No | No | **Yes (WHO/WHEN/WHERE)** |
| Zero-signup to value | No | No | No | **Yes** |

> **Note on competitors:** These claims were assessed in early March 2026. Competitor features may change without notice — re-verify before public-facing use.
| SEO-optimized pages | Partial | Yes | No | **Yes + Schema.org** |

**Business model:** Free tier (portfolio + AI rewriting + 3 templates) → Pro ($3/mo or INR 99/mo) unlocks visitor analytics, all templates, badge removal, and multiple portfolios. Lifetime option at $39 / INR 1,499.

> **Lifetime plan caveat:** Lifetime plans create indefinite infrastructure obligations. Model LTV vs. hosting costs before offering. Consider capping lifetime sales or sunset-dating the offer.

---

## 2. Vision & North Star

> **Every person's name should return a portfolio on Google.**

FolioForge isn't a portfolio builder. It's a **career visibility engine**. The portfolio is the vehicle. The intelligence layer — knowing WHO viewed it, WHEN, and from WHERE — is the product.

### North Star Metric
**Portfolio views per week.** Not portfolios created. Not signups. Views — because that's the moment value is delivered.

> **Why not "recruiter views"?** IP-to-company lookup (ip-api.com) only identifies corporate/office IPs. Recruiters browsing from home WiFi, mobile data, or VPN are invisible — likely 60-80% of actual recruiter traffic. Tracking all views is honest and measurable. Company-identified views are a secondary metric, not the North Star.

**Secondary metric:** Portfolios shared per week (measurable via share button clicks + UTM tracking).

### Design Principles

1. **Value before identity.** Users see magic (AI rewriting their career) before we ask for a single piece of information.
2. **Intelligence, not display.** The portfolio is static. The analytics make it alive.
3. **Every portfolio recruits new users.** The sharing badge targets fellow candidates who see it (not recruiters — recruiters don't need portfolios). The viral loop is candidate → candidate, not recruiter → candidate.
4. **Field-aware, not generic.** A CS portfolio and a finance portfolio should feel like different products.

---

## 3. Target Users

### Primary: Students & Early-Career (18-28)
- CS students applying to tech companies
- Design students building creative portfolios
- Finance students targeting IB/consulting
- Research students showcasing publications
- Marketing students building personal brands

**Where they are:** LinkedIn, Twitter/X, Reddit (r/cscareerquestions, r/MBA), college WhatsApp groups, Product Hunt

### Secondary: Recruiters (passive but critical)
- View portfolios (generating analytics data — the core retention driver)
- Share portfolios internally
- They are NOT conversion targets for FolioForge accounts — the badge targets fellow candidates, not recruiters
- **Two-sided market reality:** The product is built FOR recruiters' viewing behavior, sold TO candidates. Recruiters have zero incentive to engage beyond viewing.

---

## 4. User Journey — The "60-Second Transformation"

### Step 1: The Wake-Up (Landing Page — 10 seconds)
User sees: *"Your name should open doors. Right now, it's just a PDF."*
Interactive element: Type your name → see a generic search bar (NOT simulating Google's UI — avoid trademark issues) showing the concept of low web visibility.
**Emotion: curiosity.** "Do I have a web presence?"

> **Design note:** Do NOT simulate Google's search UI, color scheme, or layout. Use a generic search bar concept. Showing "0 results" is misleading for users who DO have a web presence. Instead, frame it as: "What if a recruiter searches for you?" — aspirational, not deceptive.

### Step 2: The Promise (CTA — 2 seconds)
*"Upload your LinkedIn PDF — it's free"*
No signup. No login. No friction. Click → file picker opens.

### Step 3: The Magic (AI Streaming — 30-45 seconds)
This is the core product experience:

```
LEFT COLUMN (static):                RIGHT COLUMN (streaming live):
━━━━━━━━━━━━━━━━━━━━━━              ━━━━━━━━━━━━━━━━━━━━━━━━━━
Your LinkedIn (Before)               Your Portfolio (After)

Aditya Sharma                        Aditya Sharma
CS Student @ UMich                   Software Engineer · Full Stack

• Worked on backend services    →    "I ship reliable systems at
• Attended design reviews            scale — and I have the PRs
• Helped reduce latency              to prove it."

                                     (Stats section — only if
                                      metrics exist in PDF.
                                      Otherwise: "Add your stats"
                                      prompt in editor.)

                                     Google · SWE Intern
                                     → Cut API latency across
                                       core endpoints, deployed
                                       to production in week 8...
                                     ▊ (cursor blinking, streaming)
```

The user watches their LinkedIn bullets transform into impact-driven copy in real time.

> **CRITICAL: No fabricated metrics.** The AI must ONLY surface stats explicitly present in the LinkedIn PDF text. If the PDF says "reduced latency by 34%", the AI can use "34% Latency Reduced". If the PDF has no numbers, the stats section is left empty — the user can add their own stats in the editor. Never invent numbers like "12K GitHub Stars" or "98K MAU Served" when the source PDF doesn't contain them. This is a trust and ethics issue, not a UX decision.

**Emotion: awe.** "That's... actually me. But better."

### Step 4: Choose Your Identity (Template Selection — 15 seconds)
Two templates shown (Week 1), five total (Week 2):
- **System Dark** — Dark bg, cyan accents, dev-focused (CS/Tech)
- **Clean Light** — White bg, navy accents, corporate (Finance/Consulting)
- Split Editorial, Broadsheet, Warm Editorial (added Week 2)

### Step 5: Publish (5 seconds)
NOW we ask for signup (Google one-click or email).
Portfolio goes live at: `folioforge.vercel.app/p/aditya-sharma`

> **Tab-close risk:** The generated portfolio JSON must be cached in `sessionStorage` so that if the user accidentally closes or navigates away before signing up, they can recover it on return. Without this, users who spent 60 seconds watching the AI lose everything with one accidental close.

### Step 6: The Return Loop (Day 3+)
User receives notification: *"A recruiter from Goldman Sachs viewed your portfolio."*
Opens dashboard → sees WHO, WHEN, WHERE.
Upgrades to Pro for full analytics.

---

## 5. Feature Specifications

### 5.1 PDF Upload & Parsing

**Input:** LinkedIn PDF export (max 5MB)
**Process:**
1. Client-side validation (file type, size)
2. Upload to server (Supabase Storage)
3. Server-side text extraction using `pdf-parse`
4. Structured data extraction: name, headline, experience[], education[], skills[]
5. PDF deleted from storage within 60 seconds

**Output:** Raw structured text ready for AI processing

**Edge cases:**
- Non-English PDFs: extract and pass to AI (Gemini handles multilingual)
- Corrupted PDFs: show error with "Try re-exporting from LinkedIn"
- Empty sections: Left empty for the user to fill manually in the editor. AI must NOT invent experience, stats, or credentials the PDF doesn't contain. A student with no work experience should see an empty experience section with an "Add your experience" prompt — not fabricated entries.

### 5.2 AI Content Transformation (Streaming)

**Input:** Raw LinkedIn text + detected field (CS/Design/Finance/Research/Marketing)
**Process:**
1. Field detected from keywords in headline/experience
2. Field-specific system prompt selected
3. Text sent to Gemini 1.5 Flash (streaming mode)
4. Response streamed to frontend via Server-Sent Events (SSE)
5. Frontend renders character-by-character in real-time

**Field-Adaptive Prompts:**

| Field | Writing Style | Metrics Emphasis | Vocabulary |
|---|---|---|---|
| CS | Technical, direct | Latency, scale, PRs, users | "shipped", "deployed", "built" |
| Design | Thoughtful, human | Task time, adoption, NPS | "redesigned", "researched", "tested" |
| Finance | Precise, prestigious | Deal size, AUM, rankings | "modeled", "advised", "structured" |
| Research | Academic, impactful | Papers, citations, grants | "published", "discovered", "analyzed" |
| Marketing | Bold, results-driven | Reach, revenue, engagement | "launched", "grew", "drove" |

**Output JSON:**
```json
{
  "name": "Aditya Sharma",
  "role": "Software Engineer · Full Stack · Open Source",
  "tagline": "I ship reliable systems at scale — and I have the PRs to prove it.",
  "stats": [],  // Only populated with metrics EXPLICITLY found in PDF text. Empty array if none found. User can add manually in editor.
  "experience": [
    {
      "company": "Google",
      "title": "SWE Intern",
      "period": "Summer 2024",
      "bullets": [
        "Cut API latency 34% across 3 core endpoints — deployed to production in week 8."
      ]
    }
  ],
  "education": [
    {
      "institution": "University of Michigan",
      "degree": "B.S. Computer Science",
      "year": "2025"
    }
  ],
  "skills": ["Python", "TypeScript", "AWS", "React", "Docker"]
}
```

**AI Provider Architecture:**
- Default: Google Gemini 1.5 Flash (free up to rate limits: 15 RPM, 1M tokens/day — NOT unlimited. At scale this will incur costs.)
- Premium: Claude Sonnet (swappable via env var, ~$3/1K portfolios)
- Switching: Change `AI_PROVIDER=claude` in `.env.local`
- **Rate limit handling:** Must implement a queue system. At 15 RPM, only 15 simultaneous generations per minute. Queue excess requests with user-facing position indicator.

### 5.3 Portfolio Templates

**Design Principles (all templates):**
- Fully responsive (mobile-first)
- Print-friendly (Ctrl+P produces clean PDF)
- Sub-1-second load time
- Proper semantic HTML for SEO
- Accessibility: WCAG AA contrast, keyboard navigable, screen reader compatible

#### Template A: System Dark (Free)
- **Target:** CS, Engineering, Technical
- **Palette:** Dark (#07090F) + Cyan (#4CC9FF)
- **Typography:** JetBrains Mono (monospace) + Bricolage Grotesque (display)
- **Layout:** Full-width dark page, stats grid, experience timeline
- **Feel:** Terminal-inspired, developer credibility

#### Template B: Clean Light (Free)
- **Target:** Finance, Consulting, Corporate
- **Palette:** White (#FFFFFF) + Navy (#1565C0)
- **Typography:** Inter (body) + Playfair Display (headings)
- **Layout:** Centered, traditional, generous whitespace
- **Feel:** Goldman pitch book, institutional trust

#### Template C: Split Editorial (Free)
- **Target:** Finance, IB, Luxury/Prestige
- **Palette:** Split dark/light + Gold (#FFD700)
- **Typography:** Bricolage Grotesque + Instrument Serif
- **Layout:** Two-column — credentials left, experience right
- **Feel:** WSJ profile, old money prestige

#### Template D: Broadsheet (Pro — gated AFTER Stripe is live in Week 2)
- **Target:** Research, Academic, PhD
- **Palette:** Cream (#F5F1E8) + Black
- **Typography:** Playfair Display + JetBrains Mono
- **Layout:** Newspaper 3-column, masthead, publication-style
- **Feel:** Academic journal, intellectual authority

#### Template E: Warm Editorial (Pro — gated AFTER Stripe is live in Week 2)
- **Target:** Design, Marketing, Creative
- **Palette:** Warm tan/brown (#D4764E)
- **Typography:** Instrument Serif italic + Inter
- **Layout:** Magazine editorial, asymmetric, image-forward
- **Feel:** Kinfolk magazine, craft and warmth

### 5.4 Recruiter Analytics (Pro Feature)

**The differentiator.** This is why people upgrade and why they come back.

**Data captured on every portfolio visit:**

| Data Point | Source | Method |
|---|---|---|
| Visitor IP | Request headers | Server-side extraction |
| Organization (ISP/company) | IP → reverse lookup | Free ip-api.com (45 req/min limit — need rate limiting or caching) |
| City, Country | IP geolocation | Free ip-api.com |
| Referrer source | HTTP Referer header | "linkedin.com", "google.com", "direct" |
| User agent | Request headers | Device/browser identification |
| Timestamp | Server clock | UTC, displayed in user's timezone |
| Time on page | Client-side beacon | `visibilitychange` (primary) + `beforeunload` (fallback — unreliable on mobile) |

> **IP-to-company accuracy warning:** The "org" field from IP lookups returns the ISP or network owner, NOT the viewer's employer. A recruiter at home shows as "Jio Fiber" or "Comcast", not "Goldman Sachs". Only corporate office IPs resolve to company names. The dashboard MUST display this as "Organization" (not "Company") and include a tooltip: "Based on network provider — may show ISP name for home/mobile visitors."

> **Privacy & Compliance (REQUIRED):**
> - All portfolio pages must include a minimal cookie/tracking consent banner for EU visitors (GDPR) and Indian visitors (DPDP Act 2023)
> - A privacy policy page must exist at `/privacy` explaining what visitor data is collected
> - Signup modal must include "By creating an account, you agree to our Terms of Service and Privacy Policy" with links
> - Analytics data must be deletable on request (GDPR right to erasure)

**Dashboard Display:**

```
┌─────────────────────────────────────────────┐
│  PORTFOLIO ANALYTICS           Last 30 days │
│                                             │
│  Total Views: 147    Unique: 89             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━ (sparkline)     │
│                                             │
│  TOP SOURCES           TOP LOCATIONS        │
│  LinkedIn  62%         Mumbai     34%       │
│  Google    24%         New York   18%       │
│  Direct    14%         London     12%       │
│                                             │
│  RECENT VISITORS                            │
│  ┌───────────────────────────────────────┐  │
│  │ Goldman Sachs · New York              │  │
│  │ 2 hours ago · via LinkedIn            │  │
│  ├───────────────────────────────────────┤  │
│  │ Google · Mountain View                │  │
│  │ Yesterday · via Google Search         │  │
│  ├───────────────────────────────────────┤  │
│  │ McKinsey & Co · London                │  │
│  │ 3 days ago · via Direct link          │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 5.5 Portfolio Editor

Post-generation editing for users who want to refine:

- **Content Editor (left panel):** Edit name, role, tagline, stats, experience bullets, skills
- **Live Preview (right panel):** Real-time preview updates as user types
- **Template Switcher:** Toggle between available templates
- **Regenerate Button:** Re-run AI on original PDF text with different field selection
- **Publish Toggle:** Publish/unpublish with one click

### 5.6 Authentication

**Flow:** Value first, auth second.
1. User uploads PDF and sees AI result WITHOUT logging in
2. To save/publish, prompted to create account
3. Google One-Click (primary) or Email/Password
4. Email verification required before publishing (prevents impersonation — someone publishing a portfolio under another person's email). Initial save to draft is allowed without verification.
5. "Forgot password?" link in login modal → Supabase password reset email flow

**Provider:** Supabase Auth (Google OAuth + Email/Password)

### 5.7 Dashboard

- Portfolio grid: cards showing name, template preview thumbnail, published status, view count
- "Create New Portfolio" button → upload flow
- Analytics summary (Pro): total views this week, top visitor
- Upgrade banner (Free users): "See who's viewing your portfolio → Upgrade to Pro"
- Account settings: change password, manage plan

### 5.8 Payments (Stripe)

**Tiers:**

| Plan | INR | USD | Features |
|---|---|---|---|
| Free | ₹0 | $0 | 1 portfolio, AI rewriting, 3 templates, FolioForge badge |
| Pro Monthly | ₹99/mo | $3/mo | Visitor analytics, all 5 templates, remove badge, multiple portfolios |
| Pro Yearly | ₹799/yr | $29/yr | Same as monthly, save 33% |
| Lifetime | ₹1,499 | $39 | Everything in Pro, forever. Founding member badge |

**Currency detection:** Auto-detect via IP geolocation (same ip-api.com used for analytics — more accurate than timezone, which misclassifies Indian students abroad). Fallback to browser locale. User can toggle manually. Always show both currencies on pricing page.

**Payment flow:** Stripe Checkout (hosted page). No card details touch our servers.

### 5.9 Viral Sharing Badge

Every free portfolio includes a footer badge:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Built with FolioForge
  Create your own portfolio →
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

This badge:
- Links to FolioForge landing page with UTM tracking
- Is removed for Pro users
- Is an organic growth channel (but note: primary viewers are recruiters, who don't need portfolios — the viral loop works when fellow candidates see it)
- CTA should be clear: "Build your own portfolio" not "See who views YOUR profile" (the latter implies analytics for the viewer, which is confusing)

### 5.10 SEO (Portfolio Pages)

Every published portfolio includes:
- `<title>` tag: `{Name} — {Role} | Portfolio`
- `<meta description>`: AI-generated tagline
- Open Graph tags (og:title, og:description, og:image via `/api/og/[slug]` using `@vercel/og` — non-trivial: requires font subsetting and template-specific rendering)
- Twitter Card tags
- Schema.org `Person` structured data
- Clean canonical URL
- Server-side rendered (SSR) for search engine crawling

---

## 6. Non-Functional Requirements

### Performance
- Landing page: < 2s First Contentful Paint
- Portfolio page: < 1s FCP (SSR)
- AI generation: < 45s (streaming starts within 3s)
- Dashboard: < 1.5s load

### Security
- PDF file uploaded to server memory → text extracted in-memory → PDF buffer discarded immediately. No PDF stored in Supabase Storage (unnecessary round-trip — extract directly from the upload buffer).
- Raw extracted text IS stored in the database (`raw_linkedin_text` column) to enable "Regenerate with AI" feature. Users should be informed of this in the privacy policy.
- Supabase Row Level Security on all tables
- No card details stored (Stripe Checkout handles PCI compliance)
- HTTPS everywhere (Vercel provides SSL)
- Input sanitization on all user-editable fields (React JSX auto-escapes by default — avoid `dangerouslySetInnerHTML`)
- **API rate limiting required:** `/api/upload` and `/api/generate` must have per-IP rate limiting (e.g., `@upstash/ratelimit`) to prevent quota abuse. Vercel's DDoS protection is network-level only — it does NOT rate-limit API calls.
- **CORS:** Must explicitly set CORS headers on API routes. Next.js Route Handlers do NOT enforce same-origin by default.

### Scalability (Free Tier Limits)
- Supabase: 500MB database, 1GB storage, 50K MAU
- Vercel: 100GB bandwidth, serverless functions
- Gemini: 15 RPM, 1M tokens/day
- Stripe: No limits (pay-per-transaction)
- **Capacity:** ~200-500 active users before hitting Gemini rate limits (15 RPM is the real bottleneck — if 15 users generate simultaneously, #16 waits). Supabase and Vercel free tiers are more generous but will also cap eventually.

### Accessibility
- WCAG AA contrast ratios on all text
- Keyboard navigable (all interactive elements)
- Screen reader compatible (ARIA labels, semantic HTML)
- `prefers-reduced-motion` respected (disable animations)
- Focus trapping in modals

---

## 7. Success Metrics

| Metric | Target (Month 1) | Target (Month 3) |
|---|---|---|
| Portfolios created | 100 | 500 |
| Portfolio views (all) | 500 | 5,000 |
| Pro conversions | 5% of creators | 8% of creators |
| Viral badge click-through | 2% of portfolio views | 3% of portfolio views |
| DAU/MAU ratio | 5% (no daily use loop yet) | 15% (post-analytics notifications) |
| Time to first portfolio | < 90 seconds | < 60 seconds |

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Gemini free tier rate limited | Users can't generate | Queue system + retry logic. Cache generated portfolios. |
| Supabase free tier exceeded | Database goes read-only | Monitor usage. Upgrade when revenue supports it ($25/mo). |
| AI generates hallucinated metrics | Trust damage, ethical liability | **Hard constraint in prompt:** "ONLY use metrics explicitly stated in the input text. If no metrics found, return empty stats array. NEVER invent, estimate, or approximate numbers." Stats section left empty for user to fill manually. No "reasonable approximations" — that IS hallucination. |
| Analytics shows ISP names as companies | User makes wrong career decisions based on false data | Display as "Organization" not "Company". Add tooltip explaining IP lookup limitations. Show "Unknown" for residential IPs rather than ISP names. |
| GDPR/DPDP compliance gap | Legal liability | Cookie consent banner on portfolio pages. Privacy policy at `/privacy`. Data deletion API. Consent language at signup. |
| API quota abuse (no rate limiting) | Gemini quota drained, service down | Per-IP rate limiting on `/api/upload` and `/api/generate` using `@upstash/ratelimit`. |
| LinkedIn changes PDF format | Parser breaks | pdf-parse extracts raw text, not structured fields. Robust to format changes. |
| Competitor copies analytics feature | Reduced differentiation | Move fast. First-mover advantage + network effects (more portfolios = more data = better analytics). |

---

## 9. Release Plan

### Week 1: Core Experience (MVP)
- Zero-signup upload → AI streaming → 2 templates → publish
- Auth (Google + Email) → dashboard → editor
- Public portfolio pages with SEO

### Week 2: Differentiation + Business
- Visitor analytics (organization/location/time — framed honestly, not as "recruiter tracking")
- 3 additional templates
- Stripe payments (INR + USD)
- Viral sharing badge
- Privacy policy page + cookie consent

### Week 3: Polish + Launch
- Landing page migration from existing HTML to Next.js
- OG image generation (`/api/og/[slug]`)
- Deploy to production
- Mobile responsive pass + final QA

> **Timeline honesty:** The original Week 2 was 5-6 major features in 7 days. Analytics alone (tracking, geo-lookup, dashboard UI) is 3-4 days. Stripe integration with dual currency is 2-3 days. This realistically needs 3 weeks, not 2.

### Post-Launch (Month 1-2)
- Email notifications for recruiter views
- A/B testing different AI prompts
- Portfolio quality scoring
- GitHub import (alternative to LinkedIn PDF)
- Custom domain support (Pro)

---

## 10. Appendix: Competitive Landscape

### Direct Competitors
- **Zapfolio** (zapfolio.in) — LinkedIn URL → portfolio. Free. No AI. India-based. Low traction.
- **VisePage** (visepage.com) — LinkedIn → website. $3/mo. 10K users. Consulting-focused.
- **Vitaely** (vitaely.me) — LinkedIn → website. Free. Minimal features.

### Indirect Competitors
- **Polywork** — Personal brand sites. Broader focus.
- **Read.cv** — Professional profiles. Manual entry, no AI.
- **Notion + Super** — DIY portfolio from Notion. Technical barrier.
- **LinkedIn itself** — Improving profile features but no standalone portfolio.

### Why FolioForge Wins
1. AI REWRITES content (others just reorganize)
2. Recruiter analytics (nobody else has this)
3. Field-adaptive (not one-size-fits-all)
4. Zero friction (value before signup)
5. Streaming AI (the "wow" moment)
