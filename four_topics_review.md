prd review and findings:-
SECTION 1 — Executive Summary
"87% of recruiters Google candidates before calling them"
❌ No source cited. This stat is doing heavy lifting as the entire problem justification. If it's wrong or misrepresented, the whole premise weakens. Needs citation or needs to be framed as an assumption.
"Upload a LinkedIn PDF. Watch AI rewrite your career in real-time. Publish a portfolio that ranks on Google."
❌ "Ranks on Google" is a promise you cannot make. SEO is probabilistic and time-dependent. A fresh portfolio on a subdomain (folioforge.vercel.app/p/aditya-sharma) competing for a name like "Aditya Sharma" against LinkedIn, GitHub, and other established pages will almost certainly NOT rank — especially not quickly. This is a dangerous overpromise.
Competitor comparison table — "Zero-signup to value: No for all competitors"
⚠️ Have you actually verified this? Vitaely and Zapfolio are low-traction products. Their flows may have changed. Claiming a feature gap without recent verification is risky — a competitor can silently ship it and your entire pitch collapses.
"Free tier (genuinely useful)"
⚠️ Subjective. What makes it "genuinely useful"? 1 portfolio + no analytics is the free tier. The core value prop (knowing who viewed you) is paywalled. This tension isn't resolved.

SECTION 2 — Vision & North Star
North Star: "Portfolios viewed by recruiters per week"
❌ Critical flaw. You cannot reliably distinguish recruiter views from any other views. Your analytics use IP-to-company lookup via ip-api.com. Most recruiters browse from:

Home (residential IP → not identified as Goldman)
Mobile data (carrier IP → unidentifiable)
VPN
Coffee shops

So your North Star metric is largely unmeasurable with your proposed technical stack. The number will be wildly underreported and you won't know by how much.
Design Principle 1: "Value before identity"
✅ Solid. Consistent with the zero-signup flow.
Design Principle 3: "Every portfolio recruits new users"
⚠️ This only works if portfolio viewers are actually potential FolioForge users. Recruiters are not. The viral loop depends on candidates seeing other candidates' portfolios — which is a narrower scenario than implied.

SECTION 3 — Target Users
"Secondary: Recruiters (passive users) — Discover FolioForge through the badge"
❌ Recruiters are labeled "passive users" but the entire analytics feature is built around their behavior. They're actually your most important user type for retention — they just aren't customers. This asymmetry (product is built FOR recruiters, sold TO candidates) is a classic two-sided market problem that's completely unaddressed. Recruiters have zero incentive to engage meaningfully.
Where users are: "college WhatsApp groups"
⚠️ WhatsApp groups are dark social — completely untrackable and unpredictable as a channel. Listing it in a PRD without a concrete activation strategy is wishful thinking.

SECTION 4 — User Journey
"Type your name → see a simulated Google search returning 0 results"
❌ First-principles problem: What if the user actually HAS a web presence? Their name returns results on Google. The simulation showing "0 results" will feel dishonest and break trust immediately for users who have any online footprint. No handling for this case.
"Emotion: anxiety. I'm invisible."
⚠️ Anxiety is a risky emotional hook. Some users will feel it and convert. Others will feel manipulated and leave. This is a bet on a psychological response with no fallback if the emotion doesn't land.
Step 3 — AI Streaming example shows "12K GitHub Stars" and "98K MAU Served"
❌ This is the hallucination problem right in your own PRD example. The LinkedIn PDF will not contain "12K GitHub Stars" or "98K MAU Served" as stated numbers. The AI is fabricating metrics. Your own risk section acknowledges this but the UX demo normalizes it. There's a fundamental contradiction between "wow, that's me but better" and "the AI invented numbers about me."
"Step 5: NOW we ask for signup"
⚠️ What happens to the generated portfolio if the user closes the tab before signing up? Is it lost? Is it cached temporarily? If it's lost, the user who spent 60 seconds watching AI transform their career loses everything with one accidental close. This is a massive drop-off risk with no mitigation described.

SECTION 5.1 — PDF Upload & Parsing
"PDF deleted from storage within 60 seconds"
⚠️ Good intention. But what happens if the extraction job fails and needs a retry after 60 seconds? The PDF is gone. No retry strategy described. Also — who enforces this deletion? A cron job? What if it fails silently?
"Empty sections: AI fills with reasonable defaults based on available data"
❌ This is the hallucination problem framed as a feature. If someone has no work experience, the AI "fills with reasonable defaults" — meaning it invents experience. A student applying for their first job having fabricated experience on their portfolio is a serious trust and ethics issue.

SECTION 5.2 — AI Content Transformation
"Field detected from keywords in headline/experience"
⚠️ No fallback defined. What if detection fails or is ambiguous? A "CS + Finance" dual degree student, or a "UX Engineer" — which field wins? No tie-breaking logic specified.
"AI Provider Architecture: Default Gemini 1.5 Flash (free, $0)"
⚠️ Gemini 1.5 Flash is not free in production — it's free up to rate limits (15 RPM, 1M tokens/day per the NFR section). At scale this breaks. The "$0" label is misleading and will cause budget surprises.
Output JSON shows "stats" array with fabricated numbers
❌ Already flagged, but worth repeating: the structured output spec includes stats that don't come from the PDF. The prompt engineering requirement ("only use metrics from input") directly conflicts with the JSON schema that expects stats to always be populated.

SECTION 5.3 — Portfolio Templates
Templates D & E are "Pro" but Week 1 ships 2 templates, Week 2 ships 5
⚠️ At Week 1 launch, there's no paid tier yet (Stripe is Week 2). So what gates the Pro templates in Week 1? Nothing. This sequencing creates a logic gap — you can't enforce Pro-only templates before payments exist.
"Print-friendly (Ctrl+P produces clean PDF)"
⚠️ This is extremely hard to get right across browsers, especially for dark templates (System Dark will print as a dark page and destroy printer ink). Flagged as a requirement but no implementation detail. This will likely be quietly dropped.

SECTION 5.4 — Recruiter Analytics
IP → Company lookup via ip-api.com
❌ Major accuracy problem (already raised under North Star). But additionally: ip-api.com free tier has rate limits (45 req/min). If a portfolio goes viral or you have 100+ simultaneous visitors across all portfolios, you'll hit this. No mitigation listed.
"Time on page: visibilitychange + beforeunload events"
⚠️ beforeunload is notoriously unreliable on mobile — browsers often kill tabs without firing it. Time-on-page for mobile visitors (which will be significant) will be massively underreported.
Dashboard shows "Goldman Sachs · New York"
❌ This is genuinely misleading. The IP lookup tells you the company that owns the IP block, not the person's employer. A Goldman employee working from home shows up as their ISP. An ISP employee at Goldman's office shows up as Goldman. The dashboard will frequently be wrong, and users will make career decisions (following up, applying) based on false data. This is a liability issue, not just a UX issue.
No mention of GDPR/privacy compliance
❌ You are tracking visitor IPs, geolocations, companies, and behavior without consent. European visitors to any portfolio trigger GDPR obligations. Indian users trigger DPDP Act (2023) obligations. There is zero mention of privacy policy, cookie consent, or data processing agreements. This is a legal risk, not a minor oversight.

SECTION 5.6 — Authentication
"No email verification required for initial save (reduces friction)"
⚠️ This means anyone can create a portfolio under someone else's email address. No verification = impersonation risk. Someone could publish folioforge.vercel.app/p/real-persons-name with fake content using a victim's email.

SECTION 5.8 — Payments
INR/USD currency detection via "browser timezone/locale"
⚠️ An Indian student studying in the US (very common target user) will be shown USD pricing. A US recruiter briefly using Indian VPN gets INR. Timezone ≠ residence. This will cause edge cases and potential pricing complaints.
Lifetime plan at ₹1,499 / $39
⚠️ No analysis of LTV vs. CAC against this number. If your Pro monthly is ₹99, lifetime payback is 15 months. If your infrastructure costs grow, lifetime members are a cost liability with no revenue upside. Lifetime deals are dangerous without modeling.

SECTION 5.9 — Viral Sharing Badge
"Is the primary organic growth channel"
❌ The viral loop only works if portfolio viewers become portfolio creators. But your primary viewers are recruiters (per your own analytics pitch) — and recruiters don't need portfolios. The badge is shown to the wrong audience for virality. The actual viral loop (candidate sees candidate's portfolio and wants one) is a secondary scenario not optimized for.

SECTION 5.10 — SEO
"og:image" listed but no generation method specified
⚠️ Where does the Open Graph image come from? A screenshot of the portfolio? A generated card? This is a non-trivial engineering task (requires headless browser or image generation service) and it's listed as a one-liner requirement with zero implementation detail.

SECTION 6 — Non-Functional Requirements
"Capacity: ~500-1000 active users before hitting any free tier ceiling"
⚠️ This is suspiciously optimistic. Gemini's 15 RPM limit means if 15 users generate portfolios simultaneously, the 16th waits. At 100 signups/day (Month 1 target), you'll hit Gemini rate limits within days. The "queue system" mitigation is listed in risks but not designed anywhere.

SECTION 7 — Success Metrics
"Portfolios viewed by recruiters per week" — 500 in Month 1
❌ Already flagged: this metric is unmeasurable as defined. You'll be tracking "views from IPs that resolve to a company name" — which is a very different (and much smaller) number.
"DAU/MAU ratio: 15%"
⚠️ Why would anyone return daily to a portfolio builder? The product has no daily-use loop until someone gets a recruiter notification. This metric makes sense post-analytics launch but not for Week 1 MVP.

SECTION 8 — Risks
"AI generates hallucinated metrics → Prompt engineering: use reasonable approximations and mark them"
❌ "Mark them" is not defined anywhere in the UX. Where is this marking shown? The portfolio output JSON has no "approximate": true field. The portfolio templates have no visual indicator for approximated vs. real data. This mitigation exists only in the PRD, not in the product.

SECTION 9 — Release Plan
Week 2: "Full recruiter analytics + 3 additional templates + Stripe + viral badge + landing page migration + deploy to production"
❌ This is 5-6 major features in one week. Analytics alone (IP lookup, dashboard, beacon tracking, time-on-page) is a week of work. Stripe integration with INR+USD is 2-3 days. This is not a realistic plan — it's a wishlist compressed into a timeline.


product design review and findings:-

DESIGN PHILOSOPHY 
"Dark by default. The entire app uses the dark palette (#07090F). It's a design tool — designers and developers expect dark mode."
❌ First-principles problem. Your target users include Finance, Consulting, and Research students. Goldman Sachs and McKinsey applicants do NOT expect dark mode — they expect institutional trust. More critically: the portfolio output for Template B (Clean Light) and Template C (Split Editorial) is light-themed, but you're building the editor and dashboard in full dark. This creates a jarring disconnect when a finance student is editing a light-themed portfolio inside a dark UI. The "designers and developers expect dark mode" assumption only holds for one of your five target fields.

DESIGN SYSTEM
--bone3: #8A857E — WCAG AA compliant
⚠️ Let's check this claim. WCAG AA requires 4.5:1 contrast ratio for normal text. #8A857E on #07090F — the contrast ratio is approximately 5.1:1, which does pass AA. But this is listed as "Tertiary text (captions, hints)" — meaning it'll be used for small text. For text under 18px, you need 4.5:1 minimum. It passes, but barely, and any slight rendering variation (subpixel, OLED screens) could push it below threshold. Claiming compliance without actual tooling verification is risky.
--bone4: #5E5954 — Disabled/placeholder text
❌ #5E5954 on #07090F has a contrast ratio of approximately 3.2:1. This fails WCAG AA for normal text (needs 4.5:1). You list it for "placeholder text" — placeholder text IS subject to WCAG AA requirements per WCAG 1.4.3. Your accessibility checklist at the bottom says "All text meets WCAG AA" — this directly contradicts that claim.
Field Accents — Finance: #FFD700 (gold)
❌ #FFD700 on #07090F (dark bg) passes contrast. But #FFD700 on white (#FFFFFF) — which is where it appears in Template B (Clean Light, Finance) — has a contrast ratio of approximately 1.07:1. Gold on white is nearly invisible. The field accent system is designed for a dark UI and breaks catastrophically on light templates. No handling described.
--accent-bg: rgba(255,154,60,0.06)
⚠️ 6% opacity on a dark background is essentially invisible in many rendering contexts. This is so subtle it won't register as a tinted background on most screens. Either intentional (very subtle) or a typo (should be 0.12 or higher).

FEATURE 1: LANDING PAGE
"Preloader fades out (quick — 1.5 seconds max, not the current 8-22s)"
❌ Wait — "not the current 8-22s"? This is a design doc describing what the product should be, but this parenthetical reveals there's already a broken implementation with an 8-22 second preloader. This means the design doc is partially reacting to existing bad code, not defining the ideal experience. The parenthetical should be a bug ticket, not a design note. If a new designer reads this doc they'd be confused about what "current" means.
Step 1.3: "Left: Simulated Google search for a generic name → 0 results"
❌ Already flagged in PRD review, but the design doc doubles down with no fix. The word "simulated" is doing a lot of work here. You're showing a fake Google UI. This could violate Google's trademark guidelines (simulating the Google search interface). Even setting aside legal risk — if a user has actual Google results for their name and sees the simulation showing "0 results," the moment feels dishonest rather than insightful.
Step 1.5: "Profile switcher: Aditya·CS | Morgan·Design | Riya·Finance | James·Research"
⚠️ Four example personas, five fields (CS, Design, Finance, Research, Marketing). Marketing has no persona. Either add one or remove Marketing from the field list. Minor but it signals inconsistency in thinking.
Step 1.8: "3 testimonial cards with specific outcomes — 'Hired at Google' / 'Portfolio in under 2 minutes' / 'Return offer secured'"
❌ This is a pre-launch product. You don't have these testimonials. Fabricating launch testimonials is a dark pattern and a trust liability. When real users discover the testimonials were invented (and they will), it damages credibility. Either launch without testimonials, use beta tester quotes with permission, or label them clearly as "expected outcomes."
Step 1.9: "'Free gets you 90% there.'"
❌ This contradicts your own product. Free gets you a portfolio with no analytics — but you've positioned analytics as THE product differentiator (Section 2: "The intelligence layer is the product"). If analytics is the product, free gets you 50% there at most. This copy will reduce Pro conversion by underselling the paid tier.
"Scroll progress: 2px bar on left edge tracks page progress"
⚠️ Scroll progress bars are a UI pattern that most users either ignore or find distracting. On mobile (where your landing page will be heavily viewed), left-edge progress bars are often hidden behind the browser chrome or the user's thumb. Low-value interaction to implement.

FEATURE 2: UPLOAD MODAL
"Modal: centered, 480px max-width"
⚠️ On mobile (< 640px per your breakpoints), a 480px modal takes nearly the full viewport width with no breathing room. No mobile-specific modal sizing described. Will look crammed on most phones.
"User can cancel (modal close button always visible)"
⚠️ If the user cancels mid-processing (after upload, during PDF extraction), what happens? Does the uploaded PDF get deleted? Does the server-side job continue running? Does the generated result get discarded? Cancellation state during async processing is not designed.
"Don't have the PDF? Get it from LinkedIn →" opens inline instructions
⚠️ "Inline instructions" — inside the modal. The modal is 480px wide. Three steps with descriptions inside a 480px modal while also showing a drop zone is going to feel very cramped. No layout sketch for this state.

FEATURE 3: AI STREAMING EXPERIENCE
"Full-screen or large modal (breakout from 480px to full width)"
❌ "Or" is not a design decision. Either it breaks out to full width or it doesn't. Leaving this as "or" means the implementation will be inconsistent or developer-decided. A design doc should resolve this.
Step 3.2: Left column described as "White card on light background (mimicking LinkedIn style)"
❌ The entire app's design philosophy is "Dark by default. #07090F everywhere." But now the left column is white, mimicking LinkedIn — inside the dark app. This creates a jarring light island inside the dark UI. Not inherently wrong (contrast is the point), but it directly contradicts the stated design philosophy with no acknowledgment.
"Content appears character by character"
⚠️ Character-by-character streaming for a 400-word portfolio output at even 30 tokens/second means the user watches for 13-25 seconds of streaming. This can feel engaging for the first 10 seconds, then tedious. No mechanism described for users who want to skip ahead or see the result immediately. The "awe" emotion has a time limit.
Step 3.3: Streaming Stages — "Stats (next 3 seconds) — three impact numbers appear one by one"
❌ Revisiting the hallucination problem from PRD review. The design describes stats appearing confidently as real data. But stats are the most likely fabricated element. A user watching "34% Latency Reduced" stream in will believe this is their actual stat. The design has no visual treatment for approximated vs. real metrics — no asterisk, no "estimated" label, nothing. The design is actively making the hallucination problem worse.
Step 3.4: Completion state — bottom bar appears with template selection
⚠️ The bottom bar introduces TWO decisions simultaneously: template choice AND publish/save. Your own design principle #1 is "One primary action per screen." This violates it. The user should pick a template, then separately decide to publish.
"Step 3.6: Save & Publish — If not logged in: 'Create a free account to save' → auth modal opens"
❌ So now you have: a streaming result modal → auth modal opened on top of it. That's a modal on a modal (or a modal on a full-screen view). What's the z-index/focus management here? If the user dismisses the auth modal, do they return to the streaming result? Or lose it? This state transition is critical and completely unspecified.

FEATURE 4: AUTHENTICATION
"No email verification required for initial save (reduces friction)"
❌ Already flagged in PRD. The design doc repeats it without resolving the impersonation risk. Someone can claim aditya@gmail.com, publish a portfolio with harmful content under Aditya's name, and Aditya has no recourse because the email was never verified.
Step 4.6: "If came from streaming view: save portfolio + redirect to /p/[slug]"
⚠️ The redirect goes directly to the published portfolio — skipping the editor entirely. But the portfolio may contain hallucinated stats the user hasn't reviewed. Publishing unreviewed AI content directly to a live URL is a product risk. The user should be redirected to the editor first, with an explicit publish action.

FEATURE 5: DASHBOARD
"Free users: 1 portfolio max. If they try to create a second: 'Upgrade to Pro for multiple portfolios →'. No hard block — show the upgrade path, not an error wall."
⚠️ What if a free user deletes their first portfolio and tries to create a new one? Do they get a new slot? What if they create one, it goes to draft (never published), and they want to try a different PDF? The 1-portfolio limit for free users is not well-defined around draft vs. published state.
Dashboard sidebar navigation: "Upgrade (accent colored, pulsing dot if free)"
❌ A pulsing dot on "Upgrade" is a dark pattern — it creates artificial urgency/notification anxiety for something that isn't a notification. Users find persistent pulsing indicators annoying once they've seen them and chosen not to act. After the first session, this will irritate rather than convert.

FEATURE 6: PORTFOLIO EDITOR
"Every keystroke in left panel → right panel updates in real-time (debounced 150ms)"
⚠️ 150ms debounce on a full template re-render is aggressive. If the template is a React component with non-trivial layout, re-rendering 6-7 times per second during typing will cause visible jank on mid-range devices. This should be at least 300-500ms debounce, or use a controlled input pattern where preview only updates on blur/pause.
Stats: "Max 4"
⚠️ The AI output JSON (from PRD Section 5.2) shows 3 stats. The template designs show 3-stat grids. If a user adds a 4th stat, does the template layout support it? No template specification shows a 4-stat layout. This constraint exists in the editor but the templates aren't designed for it.
"Regenerate with AI — re-runs AI on original PDF text"
❌ Where is the original PDF text stored? The PRD says "PDF deleted within 60 seconds." The extracted text (not the PDF) would need to be stored in the database permanently to enable regeneration. The PRD's data model says "only extracted/AI-generated JSON" is stored — but regeneration requires the original extracted text, not just the JSON output. This is a data architecture contradiction.
Step 6.5: "On → Off: 'Are you sure? This will take your portfolio offline.' (confirmation)"
⚠️ If the portfolio is offline (unpublished), what happens to existing links to it? Anyone who bookmarked /p/aditya-sharma gets a 404? A "Portfolio is currently private" page? Not specified. This is important for users who share their URL on LinkedIn and then unpublish.

FEATURE 7: PUBLIC PORTFOLIO PAGE
"No loading spinner, no skeleton — fully rendered immediately"
✅ Correct for SSR. But this only works if the page is truly SSR. If there's any client-side hydration delay (React component mounting, analytics script loading), there will be a flash or layout shift. The claim of CLS: 0 requires that all fonts, images, and dynamic elements are accounted for in the server-rendered HTML. Fonts (JetBrains Mono, Bricolage Grotesque, Instrument Serif) loaded via Google Fonts will cause FOUT (Flash of Unstyled Text) unless preloaded correctly. Not addressed.
"Analytics tracker fires silently (invisible to visitor)"
❌ This is GDPR-relevant. Silently tracking visitors with no consent mechanism is illegal for EU visitors. The design doc describes deliberately hiding the tracking from visitors ("invisible to visitor") — this is not a neutral design choice, it's a compliance violation framed as a feature.
Performance: "Total page weight: < 100KB"
❌ You're loading: JetBrains Mono + Bricolage Grotesque + Instrument Serif + Playfair Display + Inter from Google Fonts. Font files alone will exceed 100KB. This target is unrealistic without subsetting and self-hosting fonts, which is not mentioned anywhere.
<meta property="og:image" content="/api/og/[slug]">
⚠️ Flagged in PRD too. The design doc lists this as a one-liner but generating OG images requires a headless browser (Puppeteer/Playwright) or an image generation service (Vercel's @vercel/og). On Vercel's free tier, @vercel/og is the realistic option, but it has constraints: only supports a subset of CSS, no external images, limited fonts. Building a visually accurate OG image that matches 5 different template styles within these constraints is a non-trivial design and engineering task. Not addressed at all.

FEATURE 8: RECRUITER ANALYTICS DASHBOARD
Free user blurred preview: "Real view count shown (not blurred) — gives enough value to create curiosity"
⚠️ Where does this real view count come from if analytics requires Pro? You're storing view data for all users (free and Pro) but only showing it to Pro users. This means you're tracking visitor data for free users who may not know their portfolio is being tracked — another consent/transparency issue.
"Analytics data refreshes on page load. No real-time websocket (overkill for v1)"
✅ Reasonable call. But "Last updated: 2 minutes ago" implies a polling or background refresh mechanism. If it's only on page load, "2 minutes ago" only makes sense if the user has been on the page for 2 minutes without refreshing. This label will show "0 seconds ago" on every page load, making it meaningless. Either implement polling or remove the "last updated" timestamp.
"Time on page" displayed as "3m 12s"
❌ Already flagged in PRD: beforeunload doesn't fire reliably on mobile. The design confidently shows time-on-page as a feature, but the underlying data will be unreliable for 40-60% of visits (mobile traffic). Showing "0m 00s" for mobile visitors (because the beacon never fired) will make the analytics look broken.

FEATURE 9: PAYMENTS
"Auto-detected based on timezone (Asia/Kolkata → INR, else USD)"
❌ Already flagged in PRD. The design doc adds no new thinking here. An Indian student at MIT (EST timezone) gets USD pricing. A US expat in India gets INR. Timezone is the wrong signal — IP geolocation (which you already have from analytics) would be more accurate.
"Monthly = test the waters. Lifetime = never think about it again."
⚠️ There's no mention of annual plan (₹799/yr) in the upgrade modal UI. The PRD lists three paid tiers (Monthly, Yearly, Lifetime) but the design only shows two (Monthly, Lifetime). Yearly is missing from the upgrade flow. This is a revenue-impacting gap.

FEATURE 10: SETTINGS
"Custom slug: aditya-sharma [Save]"
⚠️ Slug change is a breaking change for anyone who has the old URL bookmarked or shared on LinkedIn. No warning, no redirect described. If a user changes their slug from aditya-sharma to aditya-s, the old URL (/p/aditya-sharma) 404s. Anyone who put the old link in their LinkedIn bio or emailed it to a recruiter is now sending people to a dead page. Old slug should redirect to new slug, or slug changes should be warned/restricted.

GLOBAL PATTERNS
"Network errors: 'You're offline. Changes will save when you reconnect.'"
⚠️ This implies offline-first functionality with a sync queue. That's a non-trivial feature (service workers, IndexedDB, conflict resolution). Is this actually built? Or is it aspirational copy? If it's not built, this error state will never show and the actual behavior (silent data loss) is worse than the message implies.
prefers-color-scheme respected (optional — app is dark-first)
⚠️ Marking this as "optional" means it will never get built. Users who prefer light mode get no option. For Finance/Consulting users (your second-largest target segment) who likely use light mode professionally, this is a friction point.


technical implemantaion review and findings:_
SECTION 1 — ARCHITECTURE OVERVIEW
Request Flow: Step 2 "Store PDF temporarily → Supabase Storage" then Step 3 "Extract text (server-side, in-memory)"
❌ This is architecturally backwards. If you're doing in-memory extraction (Step 3 says "in-memory"), why are you uploading to Supabase Storage at all (Step 2)? You could receive the PDF buffer directly in the API route, extract text in memory, and discard the buffer — no storage needed. Uploading to Supabase Storage first, then extracting, then deleting adds: network round-trip to Supabase, storage write cost, storage delete operation, and a time window where the PDF exists on a third-party server. The "PDF deleted within 60 seconds" promise becomes harder to guarantee when it depends on a separate deletion operation succeeding. The architecture doesn't match the privacy promise.
Step 5 "Return extracted text" then Step 6 "POST /api/generate"
❌ The extracted LinkedIn text is sent back to the browser (Step 5) and then the browser sends it back to the server (Step 6). This means the full LinkedIn profile text — name, employment history, education, everything — travels: server → browser → server. This is unnecessary. The extracted text should stay server-side, or at minimum you should be aware this is a deliberate choice with a privacy tradeoff. A user's full LinkedIn data sitting in browser memory/network tab is not mentioned in security considerations.

SECTION 2 — TECHNOLOGY STACK
2.1 Next.js
javascriptexperimental: {
  serverActions: { bodySizeLimit: '6mb' },
}
⚠️ serverActions.bodySizeLimit controls Server Actions body size, not API route body size. PDF uploads go through a Route Handler (/api/upload), not a Server Action. This config does nothing for your upload. The actual limit for Route Handlers is controlled differently (and Vercel has a 4.5MB payload limit on serverless functions on the free tier). Your 5MB PDF limit may silently fail on Vercel free tier — the request gets truncated at 4.5MB before your validation even runs.
"Server Actions for form submissions" listed as a reason to use App Router
⚠️ The implementation never actually uses Server Actions — it uses fetch + API routes for everything. This is listed as a benefit but not used. Not a bug, just architectural inconsistency in the justification.
2.2 Supabase — Two Client Setup
javascript// lib/supabase-server.js
const cookieStore = cookies();
return createServerClient(..., {
  cookies: {
    set(name, value, options) { cookieStore.set({ name, value, ...options }); },
❌ In Next.js 14 App Router, cookies() from next/headers returns a read-only store in Server Components and Route Handlers. Calling .set() on it will throw a runtime error: "Cookies can only be set in a Server Action or Route Handler". The set and remove cookie methods in this pattern only work inside Route Handlers, not in Server Components. If this client is used in a Server Component (e.g., to check auth on a dashboard page), the cookie refresh will silently fail and sessions won't stay fresh. This is a well-known Supabase SSR gotcha that causes auth bugs.
2.3 AI Provider
detectField function — keyword scoring
javascriptcs: ['software', 'engineer', 'developer', ...].filter(k => lower.includes(k)).length,
⚠️ No tie-breaking for equal scores. If CS and Finance both score 3, Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] returns whichever came first in object iteration order — which in V8 is insertion order. So ties always resolve to cs (first defined). This is a hidden default, not a deliberate decision. A "Financial Software Engineer" would always be misclassified as CS because the tie quietly resolves to the first key.
detectField — zero score case
❌ If all scores are 0 (e.g., a non-English PDF, or a very sparse profile), the function still returns the first entry — cs — silently. No confidence threshold, no fallback to asking the user. The user never knows their field was guessed with zero evidence.
SYSTEM_PROMPTS — all five prompts end with "Return valid JSON only"
❌ But the generatePortfolioStream function streams the response character by character. JSON is only valid when complete. During streaming, the partial JSON is invalid. The frontend (StreamingRewrite.js) tries to JSON.parse(fullText) only at the end — which is correct. But the streaming display (setStreamedText(fullText)) shows raw partial JSON to the user during streaming. So the "character by character portfolio rewrite" experience is actually showing {"name": "Aditya Sh — raw JSON fragments — not the beautiful rendered portfolio described in the design doc. The streaming display and the JSON output format are fundamentally incompatible as implemented.
streamFromGemini — responseMimeType: 'application/json'
⚠️ Setting responseMimeType: 'application/json' in Gemini's generationConfig tells Gemini to return structured JSON. But this conflicts with streaming — Gemini may buffer the entire response before returning it when JSON mode is enabled, defeating the streaming UX entirely. The "character by character" experience may not work at all with JSON mode on.
streamFromClaude — model string
javascriptmodel: 'claude-sonnet-4-20250514',
⚠️ This is listed as a premium swappable option. The model string should be verified against current Anthropic API model names. Hardcoded model strings become stale. This should be an environment variable or constant, not inline.
No timeout on AI requests
❌ Neither streamFromGemini nor streamFromClaude has a timeout. If Gemini hangs (which it can, especially at rate limits), the fetch call waits indefinitely. Vercel serverless functions have a 10-second execution limit on the free tier (60 seconds on Pro). A hanging AI call will hit this limit and return a 504 with no useful error to the user. No AbortController with timeout is implemented.
2.4 PDF Parsing
javascriptimport pdf from 'pdf-parse';
export async function extractTextFromPDF(buffer) {
  const data = await pdf(buffer);
⚠️ pdf-parse has a known issue in Next.js environments — it tries to access the filesystem during initialization (looking for test files), which can cause errors in serverless/edge environments. The common fix is importing it as require('pdf-parse/lib/pdf-parse') directly. Using the default import in a Next.js API route may cause ENOENT errors in production on Vercel. No mention of this known issue or the fix.

SECTION 3 — DATABASE SCHEMA
sqlCREATE TABLE portfolios (
  ...
  raw_linkedin_text TEXT,   -- Original PDF text for re-generation
✅ This actually resolves the contradiction I flagged in the design doc review (regeneration requires original text, but PRD said only JSON is stored). The implementation stores the raw text. However — this directly contradicts PRD Section 6 (Security): "No PDF data stored permanently (only extracted/AI-generated JSON)". The schema stores raw_linkedin_text permanently. The PRD's security promise is broken by the implementation. Users are told their data isn't stored; it is.
plan_expires_at TIMESTAMPTZ — NULL for free/lifetime
⚠️ Using NULL to mean two different things (free = no expiry, lifetime = no expiry) means you can't distinguish between a free user and a lifetime user by plan_expires_at alone. You'd need to always check plan column too. Not a bug, but it's a subtle schema smell. A plan column check in every auth guard is easy to forget.
view_count INTEGER DEFAULT 0 on portfolios table
⚠️ You have both a view_count on the portfolios table AND an analytics table where every view is a row. These will drift out of sync. increment_view_count RPC is called in the track route, but if that RPC fails silently (or the analytics insert fails), they diverge. Which is the source of truth? The dashboard shows 47 views — from which table? Not specified.
RLS Policy:
sqlCREATE POLICY "Anyone can insert analytics"
  ON analytics FOR INSERT WITH CHECK (true);
❌ This allows anyone to insert arbitrary rows into the analytics table with any portfolio_id, any company name, any visitor_ip. A malicious actor could spam fake "Goldman Sachs viewed your portfolio" entries for any portfolio ID they know (and portfolio IDs are UUIDs but not secret — they're referenced in the public portfolio page). There's no rate limiting, no validation, no authentication check on analytics inserts. The analytics feature — your core differentiator — can be trivially poisoned.
No updated_at trigger
⚠️ The schema defines updated_at columns on profiles and portfolios but no trigger to auto-update them on row modification. They'll stay at their initial now() value forever unless the application explicitly sets them on every update. Easy to miss in application code.
payments table — user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
⚠️ If a user deletes their account, their payment records have user_id set to NULL. You lose the ability to audit who paid for what. For any refund dispute or financial audit, you can't tie the payment back to an account. Should be ON DELETE RESTRICT (prevent account deletion if payments exist) or at minimum keep a non-FK copy of the email at time of payment.

SECTION 4 — API ROUTES
4.1 POST /api/upload
javascriptexport const config = { api: { bodyParser: false } };
❌ This is the Pages Router API config syntax. In Next.js 14 App Router Route Handlers, this config object does nothing. Route Handlers don't use config.api.bodyParser — they parse the body manually (which the code does correctly with request.formData()). The dead config line is harmless but signals copy-paste from outdated examples, which raises questions about what other patterns in this codebase are similarly outdated.
No authentication check on /api/upload
⚠️ Anyone on the internet can POST a PDF to this endpoint and consume your Gemini quota. There's no auth check, no rate limiting per IP, no CAPTCHA. A single person can loop this endpoint and drain your 1M token/day Gemini limit in minutes. The security section mentions "Vercel's built-in DDoS protection" but that's for network-level attacks, not API-level quota abuse.
4.2 POST /api/generate
javascriptconst aiResponse = await generatePortfolioStream(text, field || 'cs');
// Transform AI stream → SSE stream for client
const stream = new ReadableStream({
  async start(controller) {
    const reader = aiResponse.body.getReader();
❌ generatePortfolioStream returns response from fetch(). If the fetch fails (network error, API down, rate limited), aiResponse will be a Response with a non-200 status. The code does aiResponse.body.getReader() without checking aiResponse.ok first. Reading the body of an error response will give you the error message JSON, not a stream — and it'll get forwarded to the client as if it were valid SSE data. No status check before reading the stream body.
No authentication on /api/generate
❌ Same issue as upload. Anyone can POST arbitrary text to this endpoint, triggering Gemini API calls at your expense. Combined with the upload endpoint, an attacker gets free AI text generation for any purpose by hitting your API.
4.4 POST /api/track
javascriptconst geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,org`);
❌ Three issues here:

http:// not https:// — unencrypted request containing a visitor's IP address sent to a third-party service. On Vercel (HTTPS everywhere), making an outbound HTTP request is a security smell and may be blocked.
No timeout on this fetch. If ip-api.com is slow or down, the entire /api/track request hangs, blocking the portfolio page load (since the tracker fires on page load).
The IP is passed directly into a URL string: http://ip-api.com/json/${ip}. If x-forwarded-for contains a maliciously crafted value like 8.8.8.8/../../admin, this is a path traversal in the URL. Should validate IP format before interpolating.

javascriptconst ip = request.headers.get('x-forwarded-for')?.split(',')[0]
⚠️ x-forwarded-for is user-controlled. A visitor can set X-Forwarded-For: 8.8.8.8 in their request and your system will attribute their visit to Google's IP. On Vercel, the actual client IP is more reliably available via x-real-ip or Vercel's x-vercel-forwarded-for. Using the first value of x-forwarded-for is trivially spoofable.
javascriptawait supabase.from('analytics').insert({...});
await supabase.rpc('increment_view_count', { portfolio_id: portfolioId });
⚠️ Two separate database operations with no transaction. If the insert succeeds but increment_view_count fails, view_count is wrong. If insert fails, the error is silently swallowed (no try/catch, just empty catch {} on the geo lookup). Failed analytics inserts are invisible.
navigator.sendBeacon('/api/track', JSON.stringify({...}))
❌ sendBeacon sends data as text/plain by default when passed a string, not application/json. Your server does await request.json() to parse it. Parsing text/plain as JSON will throw on the server. The duration tracking beacon will silently fail on every single page view. You'll have no time-on-page data.

SECTION 5 — FRONTEND COMPONENTS
5.1 StreamingRewrite
javascriptexport default function StreamingRewrite({ linkedinText, field }) {
  // ...
  return { streamedText, isStreaming, portfolioData, startStreaming };
}
❌ This is not a valid React component. A React component must return JSX (or null). This function returns a plain object { streamedText, isStreaming, portfolioData, startStreaming } — that's a custom hook pattern, not a component. It should either be named useStreamingRewrite and called with const { ... } = useStreamingRewrite(...), or it should return JSX. As written, using <StreamingRewrite /> in JSX will render nothing and the returned object will be discarded. This is a fundamental React error that will cause the entire streaming UI to not work.
javascripttry { setPortfolioData(JSON.parse(fullText)); } catch {}
⚠️ Silent catch — if the AI returns malformed JSON (which it will sometimes, especially for edge-case profiles), portfolioData stays null forever and the user sees no result with no error message. The catch {} swallows the failure completely.
javascriptconst lines = chunk.split('\n');
for (const line of lines) {
  if (line.startsWith('data: ')) {
    const data = line.slice(6);
    if (data === '[DONE]') { ... }
    try {
      const parsed = JSON.parse(data);
      const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
⚠️ SSE chunks are not guaranteed to arrive one-line-at-a-time. A single read() from the stream can contain multiple SSE events, or a single SSE event can be split across multiple read() calls. Splitting by \n and processing each line assumes chunk boundaries align with SSE event boundaries, which they don't. This will cause intermittent JSON parse failures and dropped chunks. Proper SSE parsing requires maintaining a buffer across reads.
5.2 Template Component
javascript<a href="https://folioforge.vercel.app?ref=badge"
❌ Hardcoded production URL in a component. During development and staging, the badge links to production. When the domain changes (custom domain post-launch), every deployed portfolio still links to the old URL. This should be ${process.env.NEXT_PUBLIC_APP_URL}?ref=badge.
javascript<div className="min-h-screen bg-[#07090F] text-[#F0EDE6] font-mono">
⚠️ font-mono applies the browser's default monospace font stack, not JetBrains Mono. For JetBrains Mono to apply, it needs to be loaded (Google Fonts link or self-hosted) AND configured in tailwind.config.js as a custom font family. Neither is shown in the implementation. The typography spec from the design doc will not render as designed.
5.3 AnalyticsTracker
javascriptdocument.addEventListener('visibilitychange', () => {
  if (document.hidden) trackDuration();
});
window.addEventListener('beforeunload', trackDuration);
return () => {
  window.removeEventListener('beforeunload', trackDuration);
};
❌ The cleanup function (React useEffect return) only removes the beforeunload listener — it doesn't remove the visibilitychange listener. If the component unmounts and remounts (e.g., during React Strict Mode double-invoke in development, or during navigation), visibilitychange listeners accumulate, firing trackDuration multiple times and recording duplicate duration entries. Also already flagged: sendBeacon with string data sends text/plain, breaking server-side request.json() parsing.

SECTION 6 — ENVIRONMENT VARIABLES
bashSUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Server-only, for admin operations
⚠️ The service role key is listed but never used in the implementation shown. All operations use the anon key with RLS. If it's not used, it shouldn't be in the env template (confused developers will wonder what it's for). If it IS used somewhere not shown (e.g., the Stripe webhook needs to bypass RLS to update a user's plan), that usage isn't documented.

SECTION 7 — BUILD SCHEDULE
Day 5: "Public portfolio pages: /p/[slug] with SSR, SEO meta tags, Schema.org"
⚠️ Day 5 also requires implementing /api/og/[slug] for OG image generation (referenced in design doc). This is not on the schedule at all. OG image generation with Vercel's @vercel/og requires its own route, its own font loading, and template-specific rendering logic. It's a half-day task minimum. It's listed as a meta tag in the design doc but absent from the build schedule.
Day 9: "Analytics: tracking pixel, geo-lookup, analytics dashboard UI"
⚠️ One day for: /api/track route + ip-api.com integration + Supabase insert + view count RPC + full analytics dashboard UI (sparkline chart, top sources, top locations, recent visitors list, free user blur teaser). This is 3-4 days of work compressed into one. The analytics dashboard alone (from the design doc) has significant UI complexity.
Day 12: "Landing page: migrate existing HTML to Next.js"
❌ "Existing HTML" — so there's a pre-existing landing page in plain HTML. Migrating it to Next.js on Day 12 (second-to-last day) means the entire Week 1 development happens against a different tech stack than the final landing page. Any Week 1 component built for the app won't share styles/components with the landing page until Day 12. This is a major integration risk compressed to one day.

SECTION 8 — DEPENDENCIES
json"pdf-parse": "^1.1.1",
⚠️ pdf-parse last published in 2019. It's unmaintained. The known Next.js filesystem issue mentioned earlier is unresolved upstream. For a production app, pdfjs-dist (Mozilla's actively maintained library) is more reliable in serverless environments.
No testing dependencies listed
❌ Zero testing libraries (jest, vitest, playwright, cypress). No testing at all — not unit, not integration, not e2e. For a product going to production in 14 days with payments, auth, and AI generation, this is a significant quality risk. The "Verification" column in the build schedule is all manual ("see rendered portfolio," "check analytics table") — no automated verification.
No error monitoring
❌ No @sentry/nextjs or equivalent. When the app breaks in production (and it will), there's no visibility into what broke or for whom. Silent failures (like the sendBeacon bug) will go undetected indefinitely.

SECTION 10 — SECURITY
"Input sanitization: All user-editable portfolio content sanitized before rendering (prevent XSS via dangerouslySetInnerHTML)"
❌ The template component shown in Section 5.2 renders all fields directly: {name}, {role}, {tagline}, {bullet} — as JSX expressions. JSX expressions are XSS-safe by default (React escapes them). But this means the security note about dangerouslySetInnerHTML is describing a problem that doesn't exist in the shown code, while potentially flagging a non-issue. If someone later adds rich text rendering (e.g., for taglines with italic formatting) using dangerouslySetInnerHTML, and they see this comment, they might think sanitization is already handled — when it isn't.
"CORS: API routes only accept requests from same origin"
❌ Next.js Route Handlers do NOT enforce same-origin by default. CORS headers must be explicitly set. No CORS configuration is shown anywhere in the implementation. The /api/track endpoint in particular should accept cross-origin requests (since it's called from the public portfolio page, which is the same domain — but if custom domains are ever supported for portfolios, this breaks). The CORS claim is stated but not implemented.
"Rate limiting: Vercel's built-in DDoS protection. Gemini has natural rate limit (15 RPM)"
❌ Vercel's DDoS protection is network-level (volumetric attacks). It does NOT rate-limit API-level abuse. There is no per-IP, per-user, or per-endpoint rate limiting implemented. The /api/generate endpoint can be called unlimited times by the same IP. At Gemini's 15 RPM limit, a single abuser hitting the endpoint 15 times a minute will starve all other users. This is application-level rate limiting and it's entirely absent.


wireframe review and findings:-
W1 — LANDING PAGE HERO
Mobile wireframe shows only 4 field pills: CS, Design, Finance, Research
❌ Marketing is missing. The PRD, design doc, and implementation all define 5 fields. The mobile hero drops one entirely with no explanation. On mobile is exactly where screen-real-estate decisions need to be deliberate — if Marketing is deprioritized, that's a product decision that should be documented, not an accidental omission.
"For CS students: upload your LinkedIn → AI builds a dev portfolio recruiters actually read."
⚠️ The subtitle is hardcoded to CS in the wireframe (CS pill is pre-selected). But when a Finance student lands on this page via a WhatsApp share link or Google, they see CS-specific copy before they interact. The field-switching is optional per the design doc ("Step 1.2: optional, 2 seconds"). A Finance student who doesn't click the Finance pill gets CS-framed copy the entire time. The default field selection is a conversion decision with no justification for why CS is the right default for all traffic.
Desktop nav: "How it works · Templates · Pricing · Log in · [Start free]"
⚠️ "Templates" as a nav item goes to a section of the landing page (scroll). "Log in" and "Start free" go to auth flows. These are fundamentally different interaction types (scroll anchor vs. modal/redirect) presented at the same nav level with no visual distinction. Users who click "Templates" expecting a new page will be surprised by a scroll jump.
No favicon, no page title shown
⚠️ Minor but real — the browser tab shows nothing in any wireframe. For a product whose pitch is "your name should rank on Google," their own brand page having a blank/default favicon is a detail that undermines the credibility signal.

W2 — GOOGLE MOMENT SECTION
"About 0 results (0.34 sec)"
❌ Already flagged across all three documents, but the wireframe makes it concrete and worse. The fake Google UI shows 0 results — this is a simulation of Google's interface which uses Google's visual design language (the colored dots, the search bar layout). This is a trademark/trade dress issue. Google's UI is distinctive and protected. Simulating it to make a marketing point, even without using the Google logo explicitly, is legally risky. The ◉ ○ ○ browser chrome mimicking Chrome's style compounds this.
Right panel shows aditya.folioforge.com
❌ This contradicts every other document. The PRD, design doc, and implementation all specify folioforge.vercel.app/p/aditya-sharma as the URL format. Custom domains are listed as a Post-Launch feature (Month 1-2) and a Pro feature. But the wireframe's hero marketing moment — the most visible part of the product — shows a custom subdomain format that doesn't exist at launch. A user who sees aditya.folioforge.com in the wireframe/marketing will expect that URL format and be confused when they get folioforge.vercel.app/p/aditya-sharma.
The two-panel comparison is the product's core marketing claim
⚠️ The right panel shows 34% Latency | 12K Stars as the portfolio's headline stats. These are fabricated (as established across all documents). The wireframe's marketing section is literally showing made-up numbers as proof of the product's value. When a real user uploads their PDF and gets different (or no) stats, the gap between wireframe expectation and product reality is maximum here — at exactly the moment you're trying to convert them.

W3 — HOW IT WORKS
Card 3 copy: "Goes live at yourname.folioforge.com"
❌ Same URL format contradiction as W2. Three places in the wireframe now show yourname.folioforge.com — which is not the product's actual URL structure. This will be built wrong by any developer following this wireframe literally.
Card 2: "Powered by AI · Each one is unique"
⚠️ "Each one is unique" is a promise the product can't reliably keep. Two CS students with similar internships at the same company will get very similar outputs from the same prompt + same field. The AI isn't generating unique creative content — it's applying a template transformation. This copy sets an expectation the product can't meet.
Card 1: "Never asks for password" — listed as a feature bullet
⚠️ This is technically false. The product asks for a password in the email/password signup flow (W8). This bullet only applies to the LinkedIn export step, not the overall product. As written in the card, it reads as "FolioForge never asks for your password" — which is misleading.

W4 — BEFORE/AFTER SECTION
Profile switcher: "[● Aditya·CS] [Morgan·Design] [Riya·Finance] [James·Research]"
❌ Marketing missing again (fourth time across all documents). Five fields defined, four personas shown. This is now a pattern of inconsistency that will cascade into implementation — a developer building the interactive switcher will build 4 states, not 5.
After panel shows "✦ AI-rewritten" as a label
⚠️ This is the only place across all four documents where fabricated stats are explicitly labeled as AI-generated. It's a small star symbol with no explanation. A user scanning the after panel will read 34% | 12K | 98K as real numbers — the ✦ AI-rewritten label is too subtle to register as a disclaimer. If this label is meant to address the hallucination problem, it doesn't — it's decorative at this size.
Before panel shows "→ How most candidates look to recruiters."
⚠️ This framing implies that having bullets like "Worked on backend services" makes you look bad to recruiters. But these ARE real accomplishments stated plainly. The product's value prop is enhancement, not rescue — framing honest LinkedIn text as embarrassing is condescending to users whose actual LinkedIn looks exactly like this. The "anxiety" emotional hook (from the design doc) is being applied to the before/after section where it could backfire.

W5 — PRICING SECTION
"[Start Pro — 7d free →]"
❌ A 7-day free trial for Pro is shown in the wireframe. This feature does not exist anywhere in the PRD, design doc, or implementation. It's not in the Stripe payment spec, not in the database schema (no trial_ends_at column), not in the webhook handling. The wireframe invented a feature that's unbuildable with the current implementation. If a developer implements this wireframe literally, they'll ship a "Start free trial" button with no backend to honor it.
Free tier shows "✓ Custom domain" crossed out with "→ Custom domain: Pro"
⚠️ Custom domain is listed as a Pro feature in the pricing card, but in the PRD it's a Post-Launch feature (Month 1-2). At Week 2 launch, Pro doesn't include custom domains yet. The pricing wireframe promises a Pro feature that won't exist at launch. Users who upgrade to Pro expecting custom domains will be disappointed.
"🎓 Student? Free gets you 90% there."
❌ Flagged in the design doc review. The wireframe confirms this exact copy. It directly contradicts the product positioning (analytics is the product). Now confirmed in three documents — PRD, design doc, wireframe — all with this same copy that undermines Pro conversion.
Annual plan (₹799/yr) shown inside the Pro card as secondary option
⚠️ In the upgrade modal (W14), annual plan is shown as a secondary line: "or ₹799/year (save 33%)". But it's unclear — is clicking "Start Pro" a monthly subscription or does the user choose monthly vs. annual before clicking? The wireframe shows both prices in one card with one button. The Stripe Checkout session needs to know which price ID to use. The single "Start Pro →" button can't simultaneously create a monthly AND an annual subscription. This selection is unresolved in both W5 and W14.

W6 — UPLOAD MODAL
Processing state shows a progress bar: "████████░░░░░░░░░░░░░░ 35%"
❌ The implementation has no mechanism for progress percentage. The upload is a single multipart POST — there's no streaming progress from the server during PDF extraction. pdf-parse runs synchronously on the buffer and either succeeds or fails. The progress bar is a fake animation (like a loading shimmer pretending to be progress). This is a dark pattern — showing a percentage that has no relationship to actual processing state. Users who watch "35% → 67% → 100%" will believe the bar reflects real progress.
"Don't have the PDF? Get it from LinkedIn →" — links to inline instructions
⚠️ The wireframe shows this link in the default state but the processing state (W6 third frame) removes all contextual elements. What happens if a user clicks "Get it from LinkedIn", reads the instructions, goes to LinkedIn, exports the PDF — and returns to find the modal has timed out or closed? No state persistence for the modal is designed.
✕ button visible in all three modal states
✅ Consistent. But — what happens to the uploaded PDF if the user ✕ closes during the processing state? The implementation uploads to Supabase Storage, then extracts, then deletes. If the user closes at step 2 (after upload, before extraction), the PDF sits in storage until the 60-second deletion job runs. The ✕ should trigger immediate deletion. Not designed.

W7 — AI STREAMING VIEW
Left column shows verbatim LinkedIn text including "| Google SWE Intern |"
⚠️ LinkedIn PDF exports include pipe characters and formatting artifacts. The wireframe shows this raw text (| Google SWE Intern |) as the "before" display. For a user whose LinkedIn export has malformed text, emoji, or encoding issues, the left column will look broken. No handling for display of raw extracted text that may contain artifacts.
Right column streams partial content: "→ Cut API latency 34% across 3 core endpoin▊"
❌ The wireframe shows the streaming experience as beautiful rendered content appearing word by word. But as established in the implementation review — the AI is returning JSON, and the streaming is of raw JSON text. What actually streams is {"name": "Aditya Sharma", "role": "Software Eng etc. The wireframe depicts an impossible UX given the current implementation. Either the implementation needs to change (stream prose, not JSON, then parse at end) or the wireframe needs to show what actually happens. The gap between this wireframe and reality is the largest single discrepancy across all four documents.
Completion state: two template thumbnails shown as "░░░ System Dark" and "▓▓▓ Clean Light"
⚠️ Template thumbnails are described throughout all documents but never specified as actual rendered images. Are these screenshots? Generated thumbnails? CSS previews? At the completion state, the user needs to make a template decision based on these thumbnails. If they're just placeholder ASCII art (as shown), they don't convey the actual template quality. The wireframe uses ░░░ and ▓▓▓ as stand-ins, but the actual thumbnails need to be designed, generated, and served — a non-trivial asset pipeline not mentioned anywhere.
"← Edit first" ghost link
⚠️ Clicking this goes to the editor (/editor/[id]). But at this point, the portfolio hasn't been saved yet (user hasn't authenticated). "Edit first" implies the portfolio exists as a saveable entity. But the unsaved generated JSON is only in browser state. Going to the editor requires saving first, which requires auth. The flow is: "Edit first" → needs to save → triggers auth → then opens editor. This three-step hidden flow is presented as a simple ghost link.

W8 — AUTH MODAL
Sign up and Log in modals are both shown — functionally complete
✅ Both states are clearly specified. One genuine issue:
"Already have an account? Log in" toggle at bottom
⚠️ There's no "Forgot password?" link in the log in modal. Password reset is a fundamental auth flow. Without it, users who forget their password are permanently locked out (unless they used Google OAuth). This is missing from the wireframe, the design doc, and the implementation spec entirely.
No terms of service or privacy policy link
❌ The signup modal collects name, email, and password with no reference to ToS or privacy policy. GDPR requires explicit consent language during account creation. Even outside GDPR, creating user accounts without surfacing privacy policy is a legal gap. Given that the product tracks visitor analytics (flagged repeatedly), the absence of consent at account creation is compounded.

W9 — DASHBOARD
Populated state: "● Published · 47 views" and "○ Draft · 0 views"
⚠️ "47 views" appears in the portfolio card AND in the upgrade banner ("47 people viewed your portfolio this week"). Are these the same number? One is all-time views, one is "this week." If they're different metrics showing the same number coincidentally, it's confusing. If they're meant to be the same metric, the labels should be consistent.
"[Edit] [View ↗] [⋯]" actions on card
⚠️ The ⋯ overflow menu is specified in the design doc as: Copy link, Duplicate, Change template, Delete. But the wireframe shows [Edit] [Publish] on the draft card — no ⋯ menu. Draft cards have a different action set than published cards, but the states aren't fully specified. What actions does a draft card's ⋯ menu have? Is there even a ⋯ on draft cards? Inconsistent.
Navigation: "Portfolios · Analytics · Settings"
⚠️ The design doc specifies "Upgrade (accent colored, pulsing dot if free)" as a fourth nav item for free users. The wireframe doesn't show this. Either the pulsing upgrade nav was dropped (a design decision) or it was forgotten. Given how much revenue depends on free→Pro conversion, omitting the upgrade nav from the wireframe is a meaningful gap.

W10 — PORTFOLIO EDITOR
Template switcher shows: "[● Dark] [Light] [Split] [🔒Broad] [🔒Warm]"
✅ Correctly shows Pro-locked templates. One issue:
Lock icon on Pro templates for free users — no tooltip or explanation
⚠️ A free user sees [🔒Broad] and [🔒Warm]. Clicking a locked template — what happens? The wireframe shows no state for "user clicks locked template." Does it open the upgrade modal? Show an inline tooltip? Do nothing? This is a conversion moment (user wants a Pro template = upgrade intent) with no designed response.
Stats editing: "┌──────┬──────┐ [+ Add]"
⚠️ The stats are shown as a two-column table (value | label). But in the actual template rendering (W12), stats appear as three separate boxes horizontally. If a user edits stat values in the two-column table format, is the live preview showing the correct three-box layout? The editor's data entry UI and the template's display format look like different visual models for the same data.
"Saved ✓" indicator location: bottom-right of the preview panel
⚠️ The "Saved" indicator is shown in the preview panel (right side) but it relates to left panel content. Contextually, auto-save feedback should be near where the user is working (left panel) not in the preview. A user editing the Name field on the left won't look to the bottom-right of the preview to see if it saved.
Pro template lock shown in editor but not in streaming completion state
❌ In W7 (streaming completion), two templates are shown: System Dark and Clean Light — both free, both available. But the editor (W10) shows all 5 templates including locked Pro ones. A user who completes streaming and sees 2 templates, then goes to the editor and sees 5 templates (3 locked), will be confused about why the template count changed between screens.

W11 — ANALYTICS DASHBOARD
"2m 34s avg time" stat card with "↑ 8%"
❌ Three separate bugs in this one number. (1) Time-on-page via beforeunload + visibilitychange is unreliable on mobile (established in implementation review) — the avg will be severely skewed downward. (2) "Average" time including bounces (0-second visits where beacon didn't fire) will show 0m 00s for a significant portion — the average is meaningless. (3) "↑ 8%" compared to what? Previous 30 days? Previous week? The wireframe shows the comparison period as "Last 30 days ▾" — so ↑8% is vs. the 30 days before that? The metric's comparison basis is shown but not labeled.
The sparkline chart shows continuous data: "Feb 1 → Mar 1"
⚠️ The chart implies daily resolution. At launch (Month 1 target: 100 portfolios created), a single portfolio will have very sparse data — maybe 2-3 views per day. The sparkline will be nearly flat with occasional single spikes. The wireframe shows a smooth curve across 28 days. Real data will look much more jagged and empty. Not a design flaw per se, but the wireframe creates an expectation of data richness that won't exist for months.
"Unknown organization · Mumbai, IN · via LinkedIn · Viewed for 0m 34s"
✅ Good — showing "Unknown organization" as a real state. But:
No state shown for "visitor from residential IP" where company = ISP name
❌ The most common real-world case: a recruiter browses from home. The IP lookup returns Jio Fiber or Comcast. The dashboard will show 🏢 Jio Fiber · Mumbai, IN · via LinkedIn. This is worse than "Unknown organization" — it's actively misleading (implies the company is Jio Fiber). No wireframe state for this extremely common case. The product will frequently show ISP names as "companies" with no indication that this is an ISP, not an employer.
Free user blurred teaser shows "Goldman Sachs · New York" visibly through the blur
❌ This is a deliberate design choice (show enough to create desire). But there's a deeper problem: the blurred teaser shows real data from the user's actual analytics, with company names visible through blur. You're showing a free user that Goldman Sachs viewed their portfolio — but you haven't validated that this data is accurate. Given IP lookup reliability issues, the teaser may be showing Goldman Sachs when it was actually a Goldman employee's home IP that happened to resolve to a Goldman subnet, or a false positive entirely. The teaser is the highest-stakes display of potentially inaccurate data.

W12/W13 — PUBLIC PORTFOLIO PAGES
W12 System Dark — stats shown: "34% Latency Reduced · 12K GitHub Stars · 98K MAU Served"
❌ Every portfolio in every wireframe uses these exact same fabricated stats. There are no wireframes showing what a portfolio looks like when: stats are empty (student with no metrics), stats are approximated by AI (marked or unmarked?), or the user has only 1 stat instead of 3. The 3-stat grid layout breaks with fewer stats — no handling shown.
W13 Clean Light — stats shown: "28% Task Time Reduced · 40+ HCI Citations · 0→1 Design Systems"
⚠️ "0→1" is shown as a stat value. In the stats grid layout, this renders as a number. But "0→1" is not a number — it's a categorical descriptor. The stats component needs to handle non-numeric values, which isn't specified in the JSON schema ("value": "0→1"). Will this right-align like a number? Left-align like text? The wireframe assumes flexible stat rendering that the implementation doesn't define.
Both portfolios show the viral badge at the bottom
⚠️ The badge reads: "Built with FolioForge · See who views YOUR profile →". The word "YOUR" is in caps for emphasis. But the CTA is ambiguous — does clicking this show the current visitor their own profile analytics? Or does it take them to create a FolioForge portfolio? For a first-time visitor (a recruiter, in most cases), "See who views YOUR profile" implies they'd be tracked, not that they can build a portfolio. The CTA messaging conflates two different actions. The actual destination is the FolioForge landing page — which is a portfolio builder, not an analytics viewer. This mismatch will cause confused click-throughs with poor conversion.

W14 — PAYMENT MODAL
Annual plan "or ₹799/year (save 33%)" shown as secondary text inside Pro card
❌ Confirmed: still only one "Start Pro →" button for both monthly and annual. The user has no way to select annual before clicking. Either the button triggers a plan selection step, or annual is only selectable on the Stripe Checkout page. If it's the latter, showing the annual price in the modal creates an expectation that's only fulfillable after leaving the modal. The pricing display and the purchase flow are decoupled.
Lifetime card: "✓ Early access features"
⚠️ "Early access features" is vague enough to mean anything. As a purchase justification it's weak — and more importantly, it creates an implied promise of future features without defining what they are. If a lifetime user expects early access to a feature that never ships, this becomes a customer service issue.
No mention of refund policy
⚠️ The upgrade modal has no refund policy link. For a product charging ₹1,499 one-time, the absence of any refund language (even "no refunds on lifetime plans") is a customer trust and potential chargeback risk.

W15 — SETTINGS PAGE
"folioforge.vercel.app/p/ [aditya-sharma] [Save]"
❌ Slug change with no redirect warning — flagged in design doc review and confirmed here. The wireframe shows a simple text input + Save. No warning message, no "existing links will break" notice, no automatic redirect from old slug. A user who has shared folioforge.vercel.app/p/aditya-sharma on their LinkedIn bio, changes slug to aditya-s, and then wonders why their LinkedIn visitors get 404s — this scenario is guaranteed to happen.
"Email: aditya@gmail.com (Google)"
⚠️ The (Google) label implies the email can't be changed (it's from OAuth). But what about users who signed up with email/password? Their email should be editable. The wireframe shows only the Google OAuth state. The email/password state (where email IS editable) isn't shown. This is a missing wireframe state for a significant portion of users.

W16 — MOBILE LAYOUTS
Mobile dashboard bottom tab bar: "[📄] [📊] [⚙]"
⚠️ Three icons: Portfolios, Analytics, Settings. The design doc specifies "Portfolios, Analytics, Settings, Upgrade" as four nav items. The upgrade nav (accent colored, pulsing for free users) is gone from mobile too. On mobile, where screen time is limited, removing the upgrade path from the persistent navigation significantly reduces upgrade conversion opportunities.
Mobile editor: template switcher shows "[●Dark] [Light] [Split]" — only 3 options
⚠️ Five templates exist (2 free, 3 — wait: actually 3 free, 2 Pro per PRD). On mobile, only 3 are shown. The 2 Pro templates ([🔒Broad] and [🔒Warm]) are omitted entirely from mobile editor. This means Pro users on mobile can't access Pro templates they paid for. Free users on mobile aren't shown the locked Pro templates that could convert them. Both are revenue-impacting omissions.

W17 — TOAST NOTIFICATIONS
Analytics alert toast: "🏢 Goldman Sachs viewed your portfolio!"
❌ This toast fires in real-time (implied by the notification language). But the implementation doc says "No real-time websocket (overkill for v1) — manual refresh." If there's no websocket and no polling, how does this toast fire? It can't. The wireframe shows a real-time notification feature that is explicitly not built. Either the toast only shows when the user opens the app (on load), in which case "2 hours ago" is the timing (not real-time), or this wireframe is depicting a feature that doesn't exist.

W18 — LOADING & ERROR STATES
"contact support@folioforge.com"
⚠️ This email address appears in the error state wireframe. Does this inbox exist? Is it monitored? For a 2-person/solo product launching in 2 weeks, a support email with no response SLA is a customer expectation mismatch. Better to link to a Notion FAQ or a Twitter/X account than promise email support that may go unanswered.

SCREEN INVENTORY GAPS
Screens that exist in the product but have no wireframe:

/p/[slug] — 404 / unpublished state — What does a visitor see when a portfolio is unpublished or the slug doesn't exist? No wireframe.
Password reset flow — Completely absent from the screen map and all wireframes.
Stripe success/cancel redirect pages — After Stripe Checkout, the user lands back on the app. What page? What state? No wireframe.
Email notification — PRD lists "email notifications for recruiter views" as post-launch. No wireframe even as a placeholder.
/api/og/[slug] — OG image output. Not a user-facing screen but a designed artifact. No mockup.
Pro template portfolio pages — W12 shows System Dark, W13 shows Clean Light. Split Editorial, Broadsheet, and Warm Editorial have no wireframes. Three of five templates are undesigned at wireframe level.


CROSS-DOCUMENT MASTER CONTRADICTION LIST
IssuePRDDesignImplementationWireframeURL format/p/slug on Vercel/p/slug on Vercel/p/slug on Vercelyourname.folioforge.com (W2, W3)Field count5 fields5 fields5 fields4 personas (W4), 4 mobile pills (W1)7-day Pro trialNot mentionedNot mentionedNot mentionedShown in W5 CTACustom domain timingPost-launch featurePost-launch featureNot implementedShown as Pro feature at launch (W5)Real-time notificationsNot builtShows toast conceptNo websocketW17 shows real-time toastTemplate count at streaming2 templates (Week 1)2 thumbnails2 templates2 shown (W7) ✅ — but editor shows 5 (W10) creating inconsistencyStats for empty profiles"AI fills defaults"No handlingNo handlingNo wireframe state


