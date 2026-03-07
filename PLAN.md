# FolioForge — Premium Frontend Overhaul Plan

The goal: transform every user-facing page from "functional MVP" to "this is worth $1,000 and I'd download it instantly." We focus on what users SEE — landing page, templates, demo, editor, dashboard, auth.

---

## 1. Landing Page — Complete Redesign (`src/app/page.tsx`)

Current state: basic hero + 3-card how-it-works + barebones pricing + 1-line footer.

### Changes:
- **Animated hero**: Gradient text glow on the accent words, subtle fade-in-up on load for headline/subtitle/CTA
- **Live template showcase strip** below hero — horizontal scroll showing all 5 template thumbnails rendered with real demo data (the same "Alex Chen" data). Click a thumbnail → smooth scroll to demo section
- **"Before → After" section** — split view showing messy LinkedIn text on left and polished portfolio on right, with a draggable slider divider
- **Template gallery section** — full-width cards for each template with a name, description, and mini-preview. Free templates marked, Pro marked with subtle lock
- **Social proof / stats bar** — "5 templates · 60-second setup · Zero coding" with animated counting numbers
- **FAQ accordion** — 5-6 questions (How to export LinkedIn PDF, Is it free, Can I use custom domain, etc.)
- **Polished footer** — FolioForge logo, links to Demo/Login/Signup, "Built with Next.js", copyright
- **?upload=true auto-open** — read searchParams on mount and auto-trigger upload modal
- **Smooth scroll animations** — sections fade in on scroll via IntersectionObserver
- **Mobile hamburger nav** — responsive nav with slide-out menu

## 2. Fonts — Load All Declared Fonts (`src/app/layout.tsx`)

Current: only Inter loaded. Tailwind config references JetBrains Mono, Instrument Serif, Bricolage Grotesque but they fall back to system.

### Changes:
- Load JetBrains Mono, Instrument Serif, and Bricolage Grotesque via `next/font/google`
- Pass CSS variables for each font to `<body>`
- Templates will now render with the correct fonts

## 3. Global CSS Enhancements (`globals.css`)

### Changes:
- Add reusable keyframe animations: fadeInUp, fadeIn, slideInRight, scaleIn, shimmer
- Add `scrollbar-hide` utility class (used in demo page)
- Add smooth gradient background shimmer for loading states
- Add `.glass` utility (backdrop-blur + semi-transparent bg)

## 4. Demo Page — Interactive Showcase (`src/app/p/demo/page.tsx`)

Current: floating bar + template switcher + static render. Functional but not impressive.

### Changes:
- Add animated transition when switching templates (fade-out/fade-in)
- Add a second demo persona toggle (Alex Chen / Maya Patel) so visitors see variety
- Add a floating "Create yours in 60s" pill that pulses gently
- Show the template name + description in a tooltip/label below the switcher

## 5. Upload Modal — Polish (`src/components/landing/UploadModal.tsx`)

### Changes:
- Add Escape key to close
- Add focus trap (prevent tabbing outside modal)
- Add a file icon SVG instead of the plain "↑" text
- Add a pulsing glow ring on the dropzone when dragging
- Add step indicator during upload: "Reading PDF... → Detecting field... → Ready"
- Add backdrop click-to-close

## 6. Streaming View — Premium Feel (`src/components/landing/StreamingView.tsx`)

### Changes:
- Add a typing cursor effect on the preview side (blinking caret at the end of streamed text)
- Add a progress bar at the top that fills as text streams
- Add field picker with icons (briefcase for finance, code for CS, etc.) instead of plain text buttons
- Add error state with a friendly illustration
- Fix: show error toast if save fails, reset saving state

## 7. Editor — Professional-Grade (`src/app/editor/[id]/page.tsx`)

### Changes:
- Use the global `useToast` hook instead of local toast state
- Add section collapse/expand with smooth animation
- Add character count on tagline (with subtle warning at 200+)
- Add drag handle visual (⋮⋮) on experience items (visual only for now, shows it's a real editor)
- Add unsaved changes indicator (dot on the tab/title)
- Add keyboard shortcut: Cmd+S to manual save
- Improve template selector with mini color-coded preview dots instead of plain text buttons
- Fix: whitelist allowed PATCH fields in the save function (data, template, is_published only)

## 8. Dashboard — Polished Grid (`src/app/dashboard/page.tsx`)

### Changes:
- Template preview cards with correct background colors for all 5 templates (not just 2)
- Add a gradient overlay on the preview card for visual depth
- Add "Copy link" quick action button directly on the card
- Add a subtle greeting: "Good morning, {name}. You have {n} portfolio(s)."
- Add a Pro upsell banner for free users at top
- Fix: add error state if fetch fails
- Fix: `?upload=true` link from "New Portfolio" button

## 9. Auth Pages — Premium Feel (`src/app/auth/`)

### Changes (login + signup):
- Add FolioForge logo and tagline at the top of auth cards
- Add subtle gradient border on the auth card
- Add show/hide password toggle
- Add a "What you get" sidebar on desktop (split view: left = benefits, right = form)

## 10. Analytics Dashboard — Visual Upgrade (`src/app/dashboard/analytics/page.tsx`)

### Changes:
- Add sparkline mini-charts in stat cards (trending up icon for now)
- Add color-coded icons for companies/cities/referrers headers
- Add "No data yet" state with illustration when there are 0 views
- Add export button placeholder (disabled for free, says "Pro feature")

## 11. Upgrade Page — Conversion-Optimized (`src/app/dashboard/upgrade/page.tsx`)

### Changes:
- Replace `alert()` with toast on error
- Add comparison table (Free vs Pro) instead of just a feature list
- Add a "Most Popular" badge on yearly
- Add a money-back guarantee badge

## 12. All Templates — Visual Consistency Pass

### Changes across all 5:
- Add subtle entrance animations (fade-in sections as you scroll)
- Add hover effects on skill pills
- Ensure responsive grid for stats (2-col on mobile, 3 on desktop)
- Add "Skills" label heading in SplitEditorial (currently missing)
- Add proper print styles (@media print) — hide badge, clean margins

---

## Implementation Order:
1. Fonts + CSS foundations (layout.tsx, globals.css, tailwind.config.ts)
2. Landing page complete redesign
3. Demo page upgrade
4. Upload modal + streaming view polish
5. Editor improvements
6. Dashboard polish
7. Auth pages
8. Template visual pass
9. Analytics + upgrade pages
10. Final build verification

Total: ~10 files to create/edit, 0 new dependencies needed (pure CSS animations, IntersectionObserver).
