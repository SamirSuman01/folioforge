# FolioForge — Product Design Document
### Feature-by-Feature UX Design | March 2026

---

## Design Philosophy

> "Remove every step that doesn't deliver value. If the user hasn't said 'wow' in 30 seconds, you've already lost them."

**Four rules every screen follows:**

1. **One primary action per screen.** Never present two equally weighted choices.
2. **Progressive disclosure.** Show complexity only when the user asks for it.
3. **Feedback is instant.** Every click, every hover, every state change has visible response < 100ms.
4. **Dark by default.** The app UI (editor, dashboard) uses the dark palette (bg: #07090F). Note: portfolio templates themselves may be light (Clean Light, Split Editorial) — the dark editor containing a light template preview is a deliberate contrast, similar to Figma/VS Code. Target users span CS, Design, Finance, Research, and Marketing — not all expect dark mode. Consider adding a light mode toggle post-launch for Finance/Consulting users who prefer institutional aesthetics.

---

## Design System

### Color Tokens

```
Background Stack:
--bg:    #07090F     Base (deepest)
--bg2:   #0D1120     Elevated (sections, cards)
--bg3:   #141B2E     Raised (hover states, inputs)
--bg4:   #1B2440     Highest (modals, dropdowns)

Text Stack:
--bone:  #F0EDE6     Primary text (headings, body)
--bone2: #B8B3AA     Secondary text (descriptions, labels)
--bone3: #8A857E     Tertiary text (captions, hints) — WCAG AA: ~5.1:1 on #07090F (passes, but barely — verify with tooling)
--bone4: #5E5954     Disabled/placeholder text — WCAG AA: ~3.2:1 on #07090F (FAILS AA for normal text. Placeholder text IS subject to WCAG 1.4.3. Use #8A857E or lighter for placeholder text.)

Accent Stack (field-adaptive — changes with user's field):
--accent:        #FF9A3C    Default (orange)
--accent2:       #FFBA7A    Hover state
--accent-bg:     rgba(255,154,60,0.12)    Tinted backgrounds (was 0.06 — too subtle to register on most screens)
--accent-border: rgba(255,154,60,0.2)     Subtle borders
--accent-glow:   rgba(255,154,60,0.15)    Glow effects

Field Accents:
CS:        #4CC9FF (cyan)
Design:    #C77DFF (purple)
Marketing: #FF9A3C (orange — default)
Finance:   #FFD700 (gold) — CAUTION: Gold on white (#FFFFFF) has ~1.07:1 contrast (invisible). Use #B8860B (dark goldenrod) for Finance accent on light templates.
Research:  #4CFFB5 (mint)

Semantic:
--success: #4CFFB5
--error:   #FF6B6B
--warning: #FFD700
```

### Typography

```
Display:  Bricolage Grotesque — 800 weight — headings, hero text
          Sizes: 64px (hero), 40px (h1), 28px (h2), 20px (h3)

Serif:    Instrument Serif — italic — taglines, quotes, emphasis
          Sizes: 16px (inline), 14px (captions)

Mono:     JetBrains Mono — 300/400/500 — body, data, code
          Sizes: 15px (body), 13px (labels), 12px (captions)

Line Heights:
  Display: 1.0 (tight)
  Body:    1.6 (readable)
  Labels:  1.3 (compact)

Letter Spacing:
  Display: -0.03em (tight)
  Labels:  0.06em (wide, uppercase)
  Body:    0.01em (natural)
```

### Spacing Scale

```
4px   — icon padding, tight gaps
8px   — inline spacing, pill padding
12px  — small card padding
16px  — standard gap
24px  — section padding (mobile)
32px  — section gap
48px  — section padding (desktop)
64px  — major section separation
96px  — hero padding
```

### Component Library

```
Buttons:
  Primary:   bg: accent, text: bg, px: 24, py: 12, uppercase, tracking-wide
  Secondary: bg: transparent, border: bone4, text: bone2, same sizing
  Ghost:     bg: transparent, text: bone3, underline on hover
  Danger:    bg: transparent, border: #FF6B6B, text: #FF6B6B

Inputs:
  bg: bg3, border: 1px bone4, text: bone, placeholder: bone4
  Focus: border-color: accent, glow: accent-glow
  Height: 44px (touch-friendly)

Cards:
  bg: bg2, border: 1px rgba(240,237,230,0.05), border-radius: 0 (sharp)
  Hover: border-color: accent-border, subtle translateY(-2px)

Modals:
  Backdrop: rgba(7,9,15,0.85) with blur(16px)
  Content: bg: bg2, max-width: 480px, padding: 32px
  Animation: fade + translateY(20px → 0) over 280ms

Badges:
  Free:     border: bone4, text: bone3
  Pro:      bg: accent-bg, border: accent-border, text: accent
  Lifetime: bg: accent, text: bg

Toast/Notifications:
  Fixed bottom-right, bg: bg3, border-left: 3px accent
  Auto-dismiss after 5 seconds
  Slide-in from right, 280ms ease
```

---

## Feature 1: Landing Page

### Purpose
Convert visitor → uploader. Create urgency ("You're invisible") and show transformation ("Here's what's possible").

### User Journey
```
Land → Feel anxiety → See solution → Upload PDF → Experience magic
```

### Step-by-Step UX Flow

**Step 1.1: First Impression (0-3 seconds)**
- Preloader fades out (max 1.5 seconds). If the existing HTML version has a longer preloader (8-22s), that's a bug to fix during migration — not a design spec.
- Hero visible immediately:
  - Field pills at top (CS selected by default)
  - Headline: "Your name should open doors."
  - Subtitle adapts to selected field
  - Primary CTA: "Upload your LinkedIn PDF" (opens upload modal directly)
  - Trust line: "No login needed. PDF deleted within 60 seconds."

**Step 1.2: Field Selection (optional, 2 seconds)**
- User clicks a field pill (Design, Finance, etc.)
- Entire page accent color transitions (300ms ease)
- Hero subtitle updates with field-specific copy
- Before/After section below auto-switches to matching persona
- This shows the user: "We understand YOUR field"

**Step 1.3: The Visibility Moment — Pain Point (scroll)**
- Left: Generic search bar (NOT simulating Google's UI — avoid trademark risk) showing the concept of low web visibility
- Right: Same name with FolioForge portfolio → professional web presence
- Copy: "When they search for you, what do they find?"
- Purpose: Create curiosity, not anxiety. Avoid showing "0 results" (dishonest for users who DO have web presence).

**Step 1.4: How It Works (scroll)**
- 3-card grid: Export PDF → AI Rewrites → Pick & Publish
- Each card: icon + headline + 3 bullet points
- Key detail on Card 2: "Powered by AI. Every bullet rewritten for impact."
- Key detail on Card 3: "Pro users see who views their portfolio."

**Step 1.5: Before/After Transformation (scroll)**
- Profile switcher: Aditya·CS | Morgan·Design | Riya·Finance | James·Research | Priya·Marketing
- Side-by-side comparison:
  - Left (white card): LinkedIn export with boring bullets
  - Right (dark card): AI-rewritten portfolio with stats, impact language
- This is the most powerful conversion element — show, don't tell.

**Step 1.6: Recruiter Analytics Preview (scroll)**
- WHO / WHEN / WHERE grid
- Goldman Sachs example: "A Goldman recruiter viewed your portfolio at 9pm Sunday"
- This plants the seed for Pro upgrade

**Step 1.7: Templates (scroll)**
- Horizontally scrolling carousel (drag on desktop, swipe on mobile)
- 5 template previews with real data
- Each shows: template name + Free/Pro badge
- No "click to use" — just visual proof of quality

**Step 1.8: Social Proof (scroll)**
- At launch: skip testimonials entirely (fabricating them is a dark pattern that damages trust when discovered)
- Post-launch: collect real beta tester quotes with permission. Display with real names/initials.
- Alternative for launch: show aggregate stats ("50 portfolios created this week") or a live feed of recent portfolios (anonymized).

**Step 1.9: Pricing (scroll)**
- 3 columns: Free / Pro / Lifetime
- Free column emphasizes: "genuinely good"
- Pro column has "Most Popular" badge
- Student note at bottom: "Free gives you a portfolio. Pro tells you who's looking." (Honest framing that sells the Pro upgrade instead of undermining it.)

**Step 1.10: Final CTA (scroll)**
- "Be the one they actually remember."
- Upload button (large, centered)
- "No credit card. No login. Live in under 2 minutes."

### Interactions & Micro-animations
- Field pill click: color transition across entire page (300ms)
- Scroll reveal: elements fade up 18px with staggered delays (60ms intervals)
- Before/After switch: 280ms crossfade
- Template carousel: momentum-based drag scrolling
- CTA hover: translateY(-1px) + accent2 color shift
- ~~Scroll progress bar~~ — Removed. Low-value UI element that most users ignore and that's hidden by browser chrome on mobile.

### Error States
- None on landing page (no inputs to validate)

### Responsive Breakpoints
- Desktop: > 900px (2-column layouts, horizontal template scroll)
- Mobile: < 900px (single column, stacked sections, hamburger nav)

---

## Feature 2: Upload Modal

### Purpose
Get the PDF into the system with zero friction. No login required.

### Step-by-Step UX Flow

**Step 2.1: Modal Opens**
- Trigger: Any "Upload your LinkedIn PDF" CTA
- Backdrop: blurred dark overlay
- Modal: centered, 480px max-width
- Title: "Upload your LinkedIn PDF"
- Subtitle: "We'll transform it in under 60 seconds."

**Step 2.2: Drop Zone (default state)**
```
┌─────────────────────────────────────┐
│                                     │
│         ↑  (upload icon)            │
│                                     │
│    Drag your PDF here               │
│    or click to browse               │
│                                     │
│    PDF only · Max 5MB               │
│                                     │
└─────────────────────────────────────┘
  Don't have the PDF? Get it from LinkedIn →
```
- Drag-over state: border becomes accent, bg becomes accent-bg
- File input hidden, triggered on click

**Step 2.3: File Selected**
- Drop zone replaced by file info card:
```
┌─────────────────────────────────────┐
│  📄 Profile_LinkedIn.pdf     ✕      │
│     247KB · PDF                     │
└─────────────────────────────────────┘

  [ Generate my portfolio → ]  (primary button appears)
```
- ✕ removes file, returns to drop zone
- Primary button appears with slide-down animation

**Step 2.4: Processing (after click "Generate")**
- File info card fades out
- Streaming view appears (see Feature 3)
- Progress indicators:
  - "Reading your PDF..." (1-2s)
  - "Extracting work history..." (1-2s)
  - Then AI streaming begins
- User can cancel (modal close button always visible)

**Step 2.5: LinkedIn Help Link**
- "Don't have the PDF?" opens inline instructions:
  - Step 1: Go to LinkedIn profile
  - Step 2: Click "More" button
  - Step 3: Select "Save to PDF"
  - Takes ~30 seconds

### Validation
- Wrong file type: "Please upload a PDF file." (inline error, red text below drop zone)
- File too large: "File too large. Maximum 5MB." (inline error)
- Corrupted/empty PDF: "Couldn't extract text from this PDF. Try re-exporting from LinkedIn." (after server processing)

### Accessibility
- Drop zone focusable and activatable via Enter/Space
- File info announced by screen reader
- Progress messages in aria-live region
- Escape closes modal, focus returns to trigger button

---

## Feature 3: AI Streaming Experience

### Purpose
The "Holy Shit" moment. User watches their career being rewritten in real-time.

### Step-by-Step UX Flow

**Step 3.1: Transition from Upload**
- Upload modal content fades out (200ms)
- Streaming view fades in (200ms)
- Full-width view (breakout from 480px upload modal to full viewport width — this IS the product's hero moment, not a modal)

**Step 3.2: Split-Screen Layout**
```
┌──────────────────┬──────────────────┐
│   YOUR LINKEDIN  │  YOUR PORTFOLIO  │
│     (Before)     │    (After)       │
│                  │                  │
│  Aditya Sharma   │  Aditya Sharma   │
│  CS Student @    │  Software Eng·   │
│  UMich           │  Full Stack      │
│                  │                  │
│  • Worked on     │  "I ship reliable│
│    backend       │   systems at     │
│    services      │   scale—"        │
│  • Attended      │                  │
│    design        │  34% Latency ▊   │
│    reviews       │  (streaming...)  │
│  • Helped        │                  │
│    reduce        │                  │
│    latency       │                  │
│                  │                  │
│  ↑ LinkedIn      │  ↑ FolioForge    │
└──────────────────┴──────────────────┘
```

**Left column (static):** User's actual LinkedIn data extracted from PDF
- Light card (not mimicking LinkedIn specifically — use a neutral light bg to contrast with the dark right column)
- Shows: name, headline, experience bullets (verbatim), skills
- Label: "Your LinkedIn export"

**Right column (streaming):** AI-generated portfolio appearing live
- Dark card matching the FolioForge aesthetic
- Content appears character by character
- Cursor (▊) blinks at the end of streaming text
- Label: "Your portfolio — writing..."

**Step 3.3: Streaming Stages**
1. **Name + Role** (first 2 seconds) — appears quickly, gives user confidence
2. **Tagline** (next 3 seconds) — the memorable one-liner, italic serif
3. **Stats** (next 3 seconds) — impact numbers appear IF found in PDF text. If none found, this section is skipped (user can add stats later in editor).
4. **Experience** (next 15-25 seconds) — each bullet streams individually
5. **Skills** (last 2 seconds) — appear as pills

Each section has a subtle fade-in + slide-up animation as it begins streaming.

**Step 3.4: Completion State**
- Cursor stops blinking
- Subtle success pulse on the right card (green border flash)
- "Your portfolio — ready!" label replaces "writing..."
- Bottom bar appears (one primary action per screen — Design Principle #1):
```
┌─────────────────────────────────────────────────┐
│  Choose template:  [System Dark]  [Clean Light] │
│                                                 │
│          [ Review & Edit → ]   (primary)        │
│                                                 │
│  Goes to editor where user can review, edit,    │
│  and then explicitly publish.                   │
└─────────────────────────────────────────────────┘
```

> **Design change:** No direct "Save & Publish" from streaming view. The AI output may contain errors or unwanted content — the user should review in the editor first, then explicitly publish. This prevents publishing unreviewed AI content to a live URL.

**Step 3.5: Template Quick-Select**
- Two template thumbnails side by side (Week 1), five (Week 2)
- Clicking a template live-swaps the right column styling
- Currently selected template has accent border

**Step 3.6: Save & Continue to Editor**
- If not logged in: "Create a free account to save" → auth modal opens over the streaming view (z-index above, streaming view visible behind as motivation). On auth modal dismiss, user returns to streaming view (portfolio data preserved in state).
- If logged in: saves to draft → redirects to editor (`/editor/[id]`)
- Generated portfolio JSON also cached in `sessionStorage` as backup against accidental tab close.

### Mobile Experience
- Stacked vertically: Before card on top, After card below
- After card takes 60% of viewport height
- User scrolls between before/after naturally

### Error Handling
- AI timeout (> 60s): "Generation is taking longer than usual. Retry?" with retry button
- API error: "Something went wrong. Your PDF is safe — try again." with retry
- Rate limited: "High demand right now. Queued — you're #3." (only if Gemini 15 RPM hit)

---

## Feature 4: Authentication

### Purpose
Gate saving/publishing behind auth. Make it fast (Google one-click) or simple (email).

### Step-by-Step UX Flow

**Step 4.1: Auth Trigger**
- Triggered when user clicks "Save & Publish" without being logged in
- Modal opens over the streaming/result view (don't lose context)
- User can see their generated portfolio behind the modal (motivation to save)

**Step 4.2: Sign Up Modal**
```
┌─────────────────────────────────────┐
│                                     │
│  Create your account                │
│  Save your portfolio. It's free.    │
│                                     │
│  [ G  Continue with Google ]        │
│                                     │
│  ── or ──                           │
│                                     │
│  Full name                          │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  └─────────────────────────────┘    │
│  Email                              │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  └─────────────────────────────┘    │
│  Password (min 8 characters)        │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  [ Create account → ]               │
│                                     │
│  Already have an account? Log in    │
│                                     │
└─────────────────────────────────────┘
```

**Step 4.3: Google OAuth (primary path)**
- Click "Continue with Google" → Supabase opens Google consent
- User selects account → redirected back → auto-logged in
- Portfolio auto-saved → redirect to published portfolio
- Total time: ~5 seconds

**Step 4.4: Email/Password (secondary path)**
- Fill name, email, password
- Client-side validation (inline errors below each field)
- Submit → account created → portfolio saved as DRAFT → redirect to editor
- Email verification required before publishing (prevents impersonation — someone could publish a portfolio under another person's email with harmful content)
- Verification email sent immediately. User can use the editor while waiting for verification.

**Step 4.4b: Terms & Privacy**
- Below the "Create account" button: "By creating an account, you agree to our [Terms of Service] and [Privacy Policy]."
- Links open in new tab. Required for GDPR compliance.

**Step 4.5: Login Mode**
- Toggle: "Already have an account? Log in"
- Name field hides, title changes to "Welcome back"
- Same Google + Email/Password options
- **"Forgot password?" link** below password field → triggers Supabase password reset email

**Step 4.6: Post-Auth Redirect**
- If came from streaming view: save portfolio as draft + redirect to /editor/[id] (user reviews before publishing)
- If came from dashboard: redirect to /dashboard
- If came from pricing: redirect to payment flow

### Nav State Change
- Before auth: "Log in" + "Start free" buttons in nav
- After auth: Avatar circle (from Google, or initials) + "Dashboard" link
- Click avatar: dropdown with Dashboard, Settings, Log out

---

## Feature 5: Dashboard

### Purpose
Home base. Manage portfolios, see analytics overview, upgrade path.

### Step-by-Step UX Flow

**Step 5.1: First Visit (empty state)**
```
┌─────────────────────────────────────────────────┐
│  Dashboard                                      │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │                                           │  │
│  │      You don't have any portfolios yet.   │  │
│  │                                           │  │
│  │      [ Upload LinkedIn PDF → ]            │  │
│  │                                           │  │
│  │      Takes 60 seconds. Seriously.         │  │
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Step 5.2: With Portfolios (populated state)**
```
┌─────────────────────────────────────────────────┐
│  Dashboard                    [ + New Portfolio ]│
│                                                 │
│  ┌─────────────────┐  ┌─────────────────┐      │
│  │ ┌─────────────┐ │  │ ┌─────────────┐ │      │
│  │ │  Template    │ │  │ │  Template    │ │      │
│  │ │  Preview     │ │  │ │  Preview     │ │      │
│  │ │  Thumbnail   │ │  │ │  Thumbnail   │ │      │
│  │ └─────────────┘ │  │ └─────────────┘ │      │
│  │                  │  │                  │      │
│  │ Aditya Sharma    │  │ CS Resume        │      │
│  │ System Dark      │  │ Clean Light      │      │
│  │                  │  │                  │      │
│  │ ● Published      │  │ ○ Draft          │      │
│  │ 47 views         │  │ 0 views          │      │
│  │                  │  │                  │      │
│  │ [Edit] [View] [⋯]│  │ [Edit] [Publish] │      │
│  └─────────────────┘  └─────────────────┘      │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  📊 See who's viewing your portfolio      │  │
│  │  Upgrade to Pro for full analytics →      │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Step 5.3: Portfolio Card Actions**
- **Edit**: Opens editor (`/editor/[id]`)
- **View**: Opens public portfolio in new tab (`/p/[slug]`)
- **⋯ Menu**: Copy link, Duplicate, Change template, Delete
- **Publish/Unpublish**: Toggle with confirmation for unpublish

**Step 5.4: Analytics Summary (Pro users)**
- Replaces the upgrade banner
- Shows: total views (7d), top referrer, most recent visitor
- "View full analytics →" link to detailed analytics page

**Step 5.5: Free Tier Limits**
- Free users: 1 portfolio max
- If they try to create a second: "Upgrade to Pro for multiple portfolios →"
- No hard block — show the upgrade path, not an error wall

### Navigation
- Sidebar (desktop) or bottom tab bar (mobile):
  - Portfolios (active)
  - Analytics (Pro badge if free)
  - Settings
  - Upgrade (accent colored — no pulsing dot, which creates artificial urgency and annoys users after first session)

---

## Feature 6: Portfolio Editor

### Purpose
Refine AI-generated content. Change template. Publish/unpublish.

### Step-by-Step UX Flow

**Step 6.1: Editor Layout**
```
┌──────────────────────────────────────────────────────────┐
│  ← Back to Dashboard     Aditya Sharma     [Publish ●]  │
├──────────────────────┬───────────────────────────────────┤
│                      │                                   │
│  EDIT CONTENT        │  LIVE PREVIEW                     │
│                      │                                   │
│  Template            │  ┌─────────────────────────────┐  │
│  [Dark] [Light] ...  │  │                             │  │
│                      │  │    (rendered template        │  │
│  Name                │  │     updates in real-time     │  │
│  ┌────────────────┐  │  │     as user edits left       │  │
│  │ Aditya Sharma  │  │  │     panel)                  │  │
│  └────────────────┘  │  │                             │  │
│                      │  │                             │  │
│  Role                │  │                             │  │
│  ┌────────────────┐  │  │                             │  │
│  │ Software Eng.  │  │  │                             │  │
│  └────────────────┘  │  │                             │  │
│                      │  │                             │  │
│  Tagline             │  │                             │  │
│  ┌────────────────┐  │  │                             │  │
│  │ "I ship..."    │  │  │                             │  │
│  └────────────────┘  │  │                             │  │
│                      │  │                             │  │
│  Stats               │  │                             │  │
│  [34%|Latency] [+]   │  │                             │  │
│                      │  │                             │  │
│  Experience          │  │                             │  │
│  ▼ Google · SWE      │  │                             │  │
│    [edit bullets]     │  │                             │  │
│  ▼ OSS · Contributor │  └─────────────────────────────┘  │
│    [edit bullets]     │                                   │
│                      │  [ 🔄 Regenerate with AI ]         │
│  Skills              │  [ 🔗 Copy public link ]           │
│  [Py] [TS] [AWS] [+] │                                   │
│                      │                                   │
└──────────────────────┴───────────────────────────────────┘
```

**Step 6.2: Live Preview Updates**
- Every keystroke in left panel → right panel updates in real-time (debounced 300ms — 150ms is too aggressive and causes jank on mid-range devices during template re-renders)
- Template switcher at top of left panel — clicking a template instantly re-renders preview
- Pro templates (Broadsheet, Warm Editorial) show lock icon for free users

**Step 6.3: Content Editing**

Editable fields:
- **Name**: Single text input
- **Role**: Single text input (e.g., "Software Engineer · Full Stack")
- **Tagline**: Textarea, italic preview
- **Stats**: Array of {value, label} pairs. + button to add, ✕ to remove. Max 4.
- **Experience**: Collapsible sections per job
  - Company: text input
  - Title: text input
  - Period: text input
  - Bullets: textarea (one bullet per line). Each line becomes a bullet point.
- **Education**: Same collapsible pattern (institution, degree, year)
- **Skills**: Tag input. Type + Enter to add. Click ✕ to remove.

**Step 6.4: Regenerate with AI**
- "Regenerate with AI" button at bottom of preview
- Opens confirmation: "This will overwrite your edits. Continue?"
- If yes: re-runs AI on original PDF text → streams new result into editor
- User can cancel mid-stream

**Step 6.5: Publish Toggle**
- Top-right corner: toggle switch with label
- Off → On: "Your portfolio is now live at /p/aditya-sharma" (toast notification)
- On → Off: "Are you sure? This will take your portfolio offline. Anyone with the link will see 'This portfolio is currently private.'" (confirmation). Note: show a "Portfolio is private" page at the URL, not a 404 — the user may re-publish later.
- Published portfolios show green dot, drafts show gray dot

**Step 6.6: Auto-Save**
- Changes auto-save every 5 seconds (debounced)
- "Saved" indicator appears briefly after auto-save
- "Unsaved changes" indicator if pending

### Mobile Experience
- Stacked: Edit panel on top, preview below
- Tab toggle: "Edit" | "Preview" (only one visible at a time)
- Publish toggle accessible in both tabs

---

## Feature 7: Public Portfolio Page (/p/[slug])

### Purpose
The deliverable. What recruiters see. Must be fast, beautiful, SEO-optimized.

### Step-by-Step UX Flow

**Step 7.1: Page Load**
- Server-side rendered (SSR) — content in HTML on first paint
- No loading spinner, no skeleton — fully rendered immediately
- Template CSS loaded inline (no layout shift)
- Analytics tracker fires after consent (minimal cookie banner required for EU visitors per GDPR). Tracking must not be described as "invisible to visitor" — that's a compliance violation, not a feature.

**Step 7.2: Content Rendered (Template-Specific)**
- Full portfolio content as designed in template
- No FolioForge navigation or chrome
- Clean, standalone page — looks like a personal website

**Step 7.3: Viral Badge (Free Users)**
- Fixed at bottom of page (not sticky — at the end of content)
- Subtle, doesn't distract from portfolio:
```
─────────────────────────────────────────
  Built with FolioForge
  Create your own portfolio →
─────────────────────────────────────────
```
- Links to landing page with ?ref=badge UTM parameter
- Removed for Pro users

**Step 7.4: SEO Meta Tags**
```html
<title>Aditya Sharma — Software Engineer | Portfolio</title>
<meta name="description" content="I ship reliable systems at scale — and I have the PRs to prove it.">
<meta property="og:title" content="Aditya Sharma — Software Engineer">
<meta property="og:description" content="I ship reliable systems at scale...">
<meta property="og:image" content="/api/og/[slug]"> <!-- Auto-generated OG image -->
<meta property="og:url" content="https://folioforge.vercel.app/p/aditya-sharma">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Aditya Sharma",
  "jobTitle": "Software Engineer",
  "url": "https://folioforge.vercel.app/p/aditya-sharma"
}
</script>
```

**Step 7.5: Share Experience**
- When someone shares the URL on LinkedIn/Twitter, OG tags render a rich preview
- Preview shows: name, role, tagline — like a professional card

### Performance Targets
- FCP (First Contentful Paint): < 800ms
- LCP (Largest Contentful Paint): < 1.2s
- CLS (Cumulative Layout Shift): 0
- TTI (Time to Interactive): < 1s
- Total page weight: < 250KB (was 100KB — unrealistic with 4+ Google Fonts. Requires subsetting and self-hosting fonts to hit 100KB. 250KB is achievable and still fast.)

---

## Feature 8: Recruiter Analytics Dashboard

### Purpose
The retention hook. Shows WHO viewed your portfolio, WHEN, and WHERE from.

### Step-by-Step UX Flow

**Step 8.1: Access**
- Dashboard sidebar → "Analytics" tab
- Free users see: blurred preview + "Upgrade to Pro to see who's viewing"
- Pro users see: full analytics dashboard

**Step 8.2: Analytics Overview**
```
┌─────────────────────────────────────────────────┐
│  Analytics · Aditya Sharma Portfolio             │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │   147    │  │    89    │  │  2m 34s  │      │
│  │  views   │  │  unique  │  │ avg time │      │
│  │  +23%    │  │  +15%    │  │  +8%     │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ Views over time (30 days)                 │  │
│  │                                           │  │
│  │  ▂▃▅▇█▇▅▃▂▁▂▃▅▆▇█▇▅▃▃▄▅▆▇█▇▅▃▂▂       │  │
│  │  Feb 1                        Mar 1       │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ┌─────────────────┐  ┌─────────────────┐      │
│  │ TOP SOURCES     │  │ TOP LOCATIONS   │      │
│  │                 │  │                 │      │
│  │ ██████ LinkedIn │  │ ██████ Mumbai   │      │
│  │ ████   Google   │  │ ████   New York │      │
│  │ ██     Direct   │  │ ███    London   │      │
│  │ █      Twitter  │  │ ██     SF       │      │
│  └─────────────────┘  └─────────────────┘      │
└─────────────────────────────────────────────────┘
```

> **IP accuracy disclaimer:** The "Organization" column shows the ISP/network owner, NOT the visitor's employer. A recruiter at home shows as their ISP (e.g., "Jio Fiber"), not their company. Only corporate office IPs resolve to company names. The dashboard should include a small info icon with this explanation. Never label this column "Company" — use "Organization" or "Network".

**Step 8.3: Recent Visitors List**
```
┌─────────────────────────────────────────────────┐
│  RECENT VISITORS                                 │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ 🏢 Goldman Sachs                          │  │
│  │    New York, US · via LinkedIn             │  │
│  │    2 hours ago · viewed for 3m 12s         │  │
│  ├───────────────────────────────────────────┤  │
│  │ 🏢 Google LLC                              │  │
│  │    Mountain View, US · via Google Search   │  │
│  │    Yesterday · viewed for 1m 45s           │  │
│  ├───────────────────────────────────────────┤  │
│  │ 🏢 McKinsey & Company                     │  │
│  │    London, UK · via Direct link            │  │
│  │    3 days ago · viewed for 4m 02s          │  │
│  ├───────────────────────────────────────────┤  │
│  │ 🌐 Unknown organization                   │  │
│  │    Mumbai, IN · via LinkedIn               │  │
│  │    5 days ago · viewed for 0m 34s          │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  Showing 1-10 of 89 visitors    [Load more]      │
└─────────────────────────────────────────────────┘
```

**Step 8.4: Data Refresh**
- Analytics data refreshes on page load
- Data loads fresh on each page visit. No "Last updated" timestamp (it would always show "0 seconds ago" on load, which is meaningless without polling).
- No real-time websocket (overkill for v1) — refresh button to reload data.

### Free User View (Blurred Teaser)
```
┌─────────────────────────────────────────────────┐
│  Analytics                                       │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │ ░░░  147 views  ░░  89 unique  ░░░░░░░░░ │  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │ ░░░ Goldman Sachs · New York ░░░░░░░░░░░ │  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │                                           │  │
│  │     47 people viewed your portfolio       │  │
│  │     See who they are.                     │  │
│  │                                           │  │
│  │     [ Upgrade to Pro — ₹99/mo → ]         │  │
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```
- Real view count shown (not blurred) — gives enough value to create curiosity
- Company names and details blurred — creates desire to upgrade
- The CTA is inside the blurred area — natural eye path leads to it

---

## Feature 9: Payments / Upgrade Flow

### Purpose
Convert free users to Pro. Stripe Checkout for zero PCI overhead.

### Step-by-Step UX Flow

**Step 9.1: Upgrade Triggers (multiple entry points)**
- Dashboard: "Upgrade to Pro" banner
- Analytics: blurred data + "See who's viewing" CTA
- Editor: locked Pro templates + "Unlock with Pro"
- Badge: "Remove this badge with Pro"
- Pricing page on landing site

**Step 9.2: Plan Selection**
```
┌─────────────────────────────────────────────────┐
│  Upgrade to Pro                                  │
│                                                  │
│  ┌─────────────────┐  ┌─────────────────┐      │
│  │    PRO           │  │   LIFETIME      │      │
│  │                  │  │                  │      │
│  │  [Monthly|Yearly]│  │  ₹1,499         │      │
│  │  ₹99/mo │ ₹799/yr│  │  one-time        │      │
│  │  (toggle to pick) │  │                  │      │
│  │                  │  │                  │      │
│  │  ✓ Analytics     │  │  ✓ Everything    │      │
│  │  ✓ All templates │  │  ✓ Forever       │      │
│  │  ✓ No badge      │  │  ✓ Founding      │      │
│  │  ✓ Multi-folio   │  │    member badge  │      │
│  │                  │  │                  │      │
│  │  [Start Pro →]   │  │  [Get Lifetime→] │      │
│  └─────────────────┘  └─────────────────┘      │
│                                                  │
│  💡 Monthly = test the waters. Lifetime = never  │
│     think about it again.                        │
│                                                  │
│  Currency: [₹ INR ▾]                             │
└─────────────────────────────────────────────────┘
```

**Step 9.3: Currency Toggle**
- Auto-detected based on IP geolocation (more accurate than timezone — an Indian student at MIT should still see INR).
- Manual toggle: "₹ INR" ↔ "$ USD" dropdown
- Prices update instantly

**Step 9.4: Stripe Checkout**
- Click plan → redirected to Stripe Checkout (hosted page)
- Stripe handles all card/UPI/payment method details
- On success: redirected back to dashboard with "Pro activated!" toast
- On cancel: redirected back to plan selection

**Step 9.5: Post-Payment**
- Profile.plan updated to 'pro' or 'lifetime'
- All Pro features unlock immediately
- Analytics data visible (no longer blurred)
- Pro templates selectable in editor
- Badge removed from published portfolios
- "Pro" badge appears on user avatar in nav

---

## Feature 10: Settings Page

### Purpose
Account management. Minimal — don't over-build.

### Layout
```
┌─────────────────────────────────────────────────┐
│  Settings                                        │
│                                                  │
│  ACCOUNT                                         │
│  ┌───────────────────────────────────────────┐  │
│  │ Name:    Aditya Sharma        [Edit]      │  │
│  │ Email:   aditya@gmail.com     (Google)    │  │
│  │ Plan:    Free         [Upgrade to Pro →]  │  │
│  │ Member since: March 2026                  │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  PORTFOLIO                                       │
│  ┌───────────────────────────────────────────┐  │
│  │ Default slug: aditya-sharma               │  │
│  │ Custom slug:  ┌──────────────────┐        │  │
│  │               │ aditya-sharma    │ [Save] │  │
│  │               └──────────────────┘        │  │
│  │ ⚠ Changing your slug will break existing  │  │
│  │   links. Old URL will redirect for 30 days.│  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  DANGER ZONE                                     │
│  ┌───────────────────────────────────────────┐  │
│  │ [ Delete my account ]                     │  │
│  │ This will permanently delete all your     │  │
│  │ portfolios and analytics data.            │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Interaction States — Global Patterns

### Loading States
- **Page navigation**: Thin accent-colored progress bar at top (NProgress style)
- **Button loading**: Text replaced by spinner, button disabled, width preserved
- **Content loading**: Skeleton shimmer (bg2 → bg3 pulse)
- **AI streaming**: Blinking cursor (▊) at stream end

### Empty States
- Friendly illustration (or just a clean icon) + descriptive text + primary CTA
- Never just "No data" — always guide the user to the next action

### Error States
- Inline errors: red text below the input field
- Toast errors: bottom-right toast with red left-border
- Full-page errors: centered message with retry button and support contact
- Network errors: "You're offline. Please check your connection and try again." (Do NOT promise offline sync — that requires service workers and IndexedDB, which are not built.)

### Success States
- Toast notifications: bottom-right, green left-border, auto-dismiss 5s
- Inline success: green checkmark appears next to saved field
- Page-level: redirect + toast (e.g., after publish)

### Hover States
- Buttons: accent2 color + translateY(-1px)
- Cards: border-color transition to accent-border + subtle shadow
- Links: color transition to bone + underline appearance
- All transitions: 150ms ease

### Focus States
- All interactive elements: 2px accent outline with 2px offset
- Focus-visible only (not on click, only keyboard navigation)
- Modals: focus trapped inside, tab cycles through focusable elements
- On modal close: focus returns to trigger element

---

## Responsive Design Strategy

### Breakpoints
```
Mobile:     < 640px    (single column, stacked, touch-first)
Tablet:     640-900px  (slightly wider columns, same layout as mobile)
Desktop:    > 900px    (multi-column layouts, hover states active)
Wide:       > 1200px   (max-width containers, generous whitespace)
```

### Key Layout Changes

| Component | Mobile | Desktop |
|---|---|---|
| Nav | Hamburger menu + mobile dropdown | Full horizontal nav |
| Hero | Stacked, smaller text | Side-by-side potential, large text |
| Before/After | Stacked (before top, after bottom) | Side-by-side columns |
| Templates | Horizontal swipe carousel | Same, wider cards |
| Pricing | Stacked cards (vertical) | 3-column grid |
| Editor | Tab toggle (Edit / Preview) | Side-by-side panels |
| Dashboard | Single column card list | 2-3 column card grid |
| Analytics | Stacked charts | Side-by-side charts |

### Touch Targets
- Minimum: 44px × 44px (Apple HIG)
- Buttons: min-height 44px
- Input fields: min-height 44px
- Close buttons (✕): 44px × 44px hit area (even if icon is 16px)
- Spacing between targets: minimum 8px

---

## Accessibility Checklist (every feature)

- [ ] All text meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text) — NOTE: --bone4 (#5E5954) FAILS AA on --bg (#07090F). Fix placeholder/disabled text colors.
- [ ] All interactive elements keyboard accessible (tab, enter, space, escape)
- [ ] All images have alt text (or aria-hidden if decorative)
- [ ] All form inputs have associated labels
- [ ] All modals trap focus and restore it on close
- [ ] All dynamic content announced via aria-live regions
- [ ] All custom controls have appropriate ARIA roles and states
- [ ] `prefers-reduced-motion` disables all animations
- [ ] `prefers-color-scheme` respected (post-launch — app is dark-first, but Finance/Consulting users may prefer light mode)
- [ ] Screen reader tested: NVDA on Windows, VoiceOver on Mac
