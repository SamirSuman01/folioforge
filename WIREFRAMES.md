# FolioForge — Complete Wireframes
### Every Screen, Every State | March 2026

---

## Screen Map

```
                           ┌─────────┐
                           │ Landing  │
                           │  Page    │
                           │   (/)    │
                           └────┬────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
              ┌──────────┐ ┌────────┐ ┌──────────┐
              │ Upload   │ │ Auth   │ │ Pricing  │
              │ Modal    │ │ Modal  │ │ Section  │
              └────┬─────┘ └───┬────┘ └────┬─────┘
                   │           │           │
                   ▼           │           │
              ┌──────────┐    │           │
              │ AI       │    │           │
              │ Streaming│    │           │
              │ View     │    │           │
              └────┬─────┘    │           │
                   │          │           │
                   ▼          ▼           ▼
              ┌────────────────────────────────┐
              │         DASHBOARD              │
              │    /dashboard                  │
              └──┬──────────┬────────────┬─────┘
                 │          │            │
                 ▼          ▼            ▼
           ┌─────────┐ ┌─────────┐ ┌──────────┐
           │ Editor  │ │Analytics│ │ Settings │
           │/editor/ │ │(in dash)│ │/settings │
           │ [id]    │ │         │ │          │
           └────┬────┘ └─────────┘ └──────────┘
                │
                ▼
           ┌──────────┐
           │ Public   │
           │ Portfolio│
           │ /p/[slug]│
           └──────────┘
```

---

## W1. Landing Page — Hero Section

### Desktop (> 900px)
```
┌──────────────────────────────────────────────────────────────────────┐
│ ● FolioForge          How it works   Templates   Pricing    Log in  │
│                                                         [Start free]│
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                                                                      │
│   ┌──────┐ ┌──────────┐ ┌──────┐ ┌──────┐ ┌────────┐              │
│   │● CS  │ │  Design  │ │Mktng │ │ Fin  │ │Research│              │
│   └──────┘ └──────────┘ └──────┘ └──────┘ └────────┘              │
│                                                                      │
│                                                                      │
│   Your name should                                                   │
│   open doors.                                                        │
│                                                                      │
│   Right now, it's just a PDF.                                        │
│                                                                      │
│   For CS students: upload your LinkedIn → AI builds                  │
│   a dev portfolio recruiters actually read.                          │
│                                                                      │
│                                                                      │
│   ┌─────────────────────────────┐                                   │
│   │ ↑  Upload your LinkedIn PDF │   See how it works →              │
│   └─────────────────────────────┘                                   │
│                                                                      │
│   🔒 No login needed. PDF deleted within 60 seconds.                │
│                                                                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Mobile (< 640px)
```
┌────────────────────────────┐
│ ● FolioForge          ☰   │
├────────────────────────────┤
│                            │
│ ┌───┐┌───┐┌───┐┌───┐┌───┐│
│ │●CS││Des││Mkt││Fin││Res││
│ └───┘└───┘└───┘└───┘└───┘│
│                            │
│ Your name                  │
│ should open                │
│ doors.                     │
│                            │
│ Right now, it's            │
│ just a PDF.                │
│                            │
│ For CS students:           │
│ upload your LinkedIn →     │
│ AI builds a dev portfolio  │
│ recruiters actually read.  │
│                            │
│ ┌────────────────────────┐ │
│ │ ↑ Upload LinkedIn PDF  │ │
│ └────────────────────────┘ │
│                            │
│ 🔒 No login needed.       │
│                            │
└────────────────────────────┘
```

---

## W2. Landing Page — Google Moment Section

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  01 · The recruiter's reality                                        │
│                                                                      │
│  They Google every candidate.                                        │
│  Every name. Every time.                                             │
│                                                                      │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐  │
│  │                             │  │                             │  │
│  │ 🔍 aditya sharma           │  │  folioforge.vercel.app     │  │
│  │    software engineer        │  │  /p/aditya-sharma          │  │
│  │                             │  │                             │  │
│  │                             │  │  Aditya Sharma             │  │
│  │   What do recruiters find   │  │  Software Engineer          │  │
│  │   when they search for you? │  │  Full Stack · Open Source   │  │
│  │                             │  │                             │  │
│  │                             │  │  "I ship reliable systems   │  │
│  │                             │  │   at scale."               │  │
│  │                             │  │                             │  │
│  │                             │  │  (stats from actual PDF)   │  │
│  │                             │  │                             │  │
│  │ ↑ Without a portfolio       │  │  ↑ With FolioForge         │  │
│  └─────────────────────────────┘  └─────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## W3. Landing Page — How It Works

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  02 · Three steps                                                    │
│                                                                      │
│  Upload. Transform. Publish.                                         │
│                                                                      │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐    │
│  │                  │ │                  │ │                  │    │
│  │  📄              │ │  🤖              │ │  🚀              │    │
│  │                  │ │                  │ │                  │    │
│  │  01              │ │  02              │ │  03              │    │
│  │  Export from     │ │  AI does the     │ │  Pick, edit,     │    │
│  │  LinkedIn        │ │  writing         │ │  publish         │    │
│  │                  │ │                  │ │                  │    │
│  │  Get your PDF in │ │  ~30 seconds of  │ │  Live in under   │    │
│  │  30 seconds.     │ │  transformation. │ │  2 minutes.      │    │
│  │                  │ │                  │ │                  │    │
│  │  • Profile →     │ │  • Every bullet  │ │  • Choose your   │    │
│  │    More → Save   │ │    rewritten     │ │    template      │    │
│  │  • No LinkedIn   │ │  • Powered by AI │ │  • Edit anything │    │
│  │    password needed│ │  • Tailored to   │ │  • Goes live at  │    │
│  │  • PDF deleted   │ │    your field    │ │    folioforge.   │    │
│  │    in 60 sec     │ │                  │ │    vercel.app/p/ │    │
│  │                  │ │                  │ │    your-name     │    │
│  │                  │ │                  │ │  • Pro: recruiter│    │
│  │                  │ │                  │ │    analytics     │    │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## W4. Landing Page — Before/After Section

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  03 · The transformation                                             │
│                                                                      │
│  Same person. Different story.                                       │
│                                                                      │
│  [● Aditya·CS] [Morgan·Design] [Riya·Finance] [James·Research] [Priya·Mktng] │
│                                                                      │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐    │
│  │ BEFORE · LinkedIn        │  │ AFTER · FolioForge           │    │
│  │ ┌──────────────────────┐ │  │ ┌────────────────────────┐   │    │
│  │ │                      │ │  │ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│   │    │
│  │ │ (AS) Aditya Sharma   │ │  │ │                        │   │    │
│  │ │ CS Student @ UMich   │ │  │ │ Aditya Sharma          │   │    │
│  │ │ Google SWE Intern    │ │  │ │ Software Engineer       │   │    │
│  │ │                      │ │  │ │ Full Stack · OSS        │   │    │
│  │ │ Experience           │ │  │ │                        │   │    │
│  │ │ Google               │ │  │ │ "I ship reliable       │   │    │
│  │ │ SWE Intern           │ │  │ │  systems at scale."    │   │    │
│  │ │ • Worked on backend  │ │  │ │                        │   │    │
│  │ │ • Attended design    │ │  │ │ 34%    12K    98K      │   │    │
│  │ │   reviews            │ │  │ │ Lat.   Stars  MAU      │   │    │
│  │ │ • Helped reduce      │ │  │ │                        │   │    │
│  │ │   latency            │ │  │ │ ✦ AI-rewritten         │   │    │
│  │ │                      │ │  │ │ Google · SWE Intern    │   │    │
│  │ │ Skills               │ │  │ │ → Cut API latency 34%  │   │    │
│  │ │ [Py] [JS] [Java]    │ │  │ │   across 3 core        │   │    │
│  │ │                      │ │  │ │   endpoints            │   │    │
│  │ └──────────────────────┘ │  │ │                        │   │    │
│  │ ↑ How most candidates    │  │ │ ↗ folioforge.vercel   │   │    │
│  │   look to recruiters.    │  │ └────────────────────────┘   │    │
│  └──────────────────────────┘  └──────────────────────────────┘    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## W5. Landing Page — Pricing Section

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  07 · Pricing                                                        │
│                                                                      │
│  Free means free.                                                    │
│                                                                      │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐    │
│  │                  │ │ MOST POPULAR     │ │ BEST VALUE       │    │
│  │ Free — Forever   │ │                  │ │                  │    │
│  │                  │ │ Pro              │ │ Lifetime         │    │
│  │     ₹0           │ │                  │ │                  │    │
│  │                  │ │    ₹99/mo        │ │    ₹1,499        │    │
│  │  No card.        │ │                  │ │                  │    │
│  │  No expiry.      │ │  or ₹799/year   │ │  Pay once.       │    │
│  │                  │ │  (save 33%)      │ │  Own forever.    │    │
│  │ ─────────────    │ │                  │ │                  │    │
│  │                  │ │ ─────────────    │ │ ─────────────    │    │
│  │ ✓ 1 portfolio    │ │                  │ │                  │    │
│  │ ✓ AI rewriting   │ │ ✓ Everything in  │ │ ✓ Everything in  │    │
│  │ ✓ 3 templates    │ │   Free           │ │   Pro            │    │
│  │ ✓ Update anytime │ │ ✓ Analytics      │ │ ✓ No recurring   │    │
│  │ ✓ FolioForge     │ │ ✓ All 5 templates│ │ ✓ Founding       │    │
│  │   badge          │ │ ✓ Remove badge   │ │   member badge   │    │
│  │                  │ │ ✓ Multi-folio    │ │                  │    │
│  │ → Analytics:     │ │ → Custom domain  │ │                  │    │
│  │   Pro            │ │   (coming soon)  │ │                  │    │
│  │                  │ │                  │ │                  │    │
│  │[Get started free]│ │[Start Pro →     ]│ │[Get Lifetime   ] │    │
│  │                  │ │                  │ │[Access →       ] │    │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘    │
│                                                                      │
│  🎓 Free gives you a portfolio. Pro tells you who's looking.        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## W6. Upload Modal

### Default State
```
┌──────────────────────────────────────────────┐
│                                        ✕     │
│                                              │
│  Upload your LinkedIn PDF                    │
│  We'll transform it in under 60 seconds.     │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │              ↑                         │  │
│  │                                        │  │
│  │     Drag your PDF here                 │  │
│  │     or click to browse                 │  │
│  │                                        │  │
│  │     PDF only · Max 5MB                 │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Don't have the PDF? Get it from LinkedIn →  │
│                                              │
│  🔒 Your PDF is processed securely and       │
│     deleted within 60 seconds.               │
│                                              │
└──────────────────────────────────────────────┘
```

### File Selected State
```
┌──────────────────────────────────────────────┐
│                                        ✕     │
│                                              │
│  Upload your LinkedIn PDF                    │
│  We'll transform it in under 60 seconds.     │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  📄 Profile_LinkedIn.pdf         ✕    │  │
│  │     247KB · PDF                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │       Generate my portfolio →          │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  🔒 Your PDF is processed securely and       │
│     deleted within 60 seconds.               │
│                                              │
└──────────────────────────────────────────────┘
```

### Processing State
```
┌──────────────────────────────────────────────┐
│                                        ✕     │
│                                              │
│             ◐ ◓ ◑ ◒                          │
│                                              │
│     Reading your PDF...                      │
│                                              │
│     (indeterminate spinner — no fake %)      │
│                                              │
│                                              │
└──────────────────────────────────────────────┘
```

---

## W7. AI Streaming View

### Desktop — Split Screen
```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Back                        Your portfolio is being written...    │
├─────────────────────────────────┬────────────────────────────────────┤
│                                 │                                    │
│  YOUR LINKEDIN                  │  YOUR PORTFOLIO                    │
│                                 │                                    │
│  ┌───────────────────────────┐  │  ┌──────────────────────────────┐ │
│  │                           │  │  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ │
│  │ (AS)                      │  │  │                              │ │
│  │ Aditya Sharma             │  │  │  Aditya Sharma               │ │
│  │ Computer Science Student  │  │  │  Software Engineer ·         │ │
│  │ @ University of Michigan  │  │  │  Full Stack · Open Source    │ │
│  │ | Google SWE Intern |     │  │  │                              │ │
│  │ Open Source               │  │  │  "I ship reliable systems    │ │
│  │                           │  │  │   at scale — and I have the  │ │
│  │ Experience                │  │  │   PRs to prove it."          │ │
│  │                           │  │  │                              │ │
│  │ Google                    │  │  │  ┌────┐ ┌────┐ ┌────┐      │ │
│  │ Software Engineering      │  │  │  │34% │ │12K │ │98K │      │ │
│  │ Intern                    │  │  │  │Lat.│ │Star│ │MAU │      │ │
│  │ May 2024 – Aug 2024      │  │  │  └────┘ └────┘ └────┘      │ │
│  │                           │  │  │                              │ │
│  │ • Worked on backend       │  │  │  Google · SWE Intern         │ │
│  │   services                │  │  │  Summer 2024                 │ │
│  │ • Attended design reviews │  │  │  → Cut API latency 34%      │ │
│  │ • Helped reduce latency   │  │  │    across 3 core endpoin▊   │ │
│  │                           │  │  │                              │ │
│  │ Student Developer Club    │  │  │                              │ │
│  │ Member · 2022–Present     │  │  │                              │ │
│  │ • Participated in         │  │  │                              │ │
│  │   hackathons              │  │  │                              │ │
│  │ • Built some projects     │  │  │                              │ │
│  │                           │  │  │                              │ │
│  │ Skills                    │  │  │                              │ │
│  │ [Py][JS][Java][Git]      │  │  │                              │ │
│  │                           │  │  │                              │ │
│  └───────────────────────────┘  │  └──────────────────────────────┘ │
│                                 │                                    │
│  ↑ Your LinkedIn export         │  ↑ Writing... (streaming)         │
│                                 │                                    │
└─────────────────────────────────┴────────────────────────────────────┘
```

> **Implementation note:** The wireframe shows beautifully rendered text streaming character by character. The actual AI returns JSON. To achieve this UX, the frontend must progressively parse the JSON stream and render completed fields into the template in real-time (e.g., once `"name": "Aditya Sharma"` is complete, render it immediately). Raw JSON should NEVER be shown to the user.

### Completion State
```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Back                              ✓ Your portfolio is ready!      │
├─────────────────────────────────┬────────────────────────────────────┤
│                                 │                                    │
│  [Same left column]             │  [Completed right column with     │
│                                 │   all content rendered]            │
│                                 │                                    │
│                                 │                                    │
├─────────────────────────────────┴────────────────────────────────────┤
│                                                                      │
│  Choose template:                                                    │
│  ┌─────────────────┐  ┌─────────────────┐                          │
│  │ ░░░░░░░░░░░░░░░ │  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │                          │
│  │ ░ System Dark ░ │  │ ▓ Clean Light ▓ │                          │
│  │ ░░░ ● selected ░│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │                          │
│  └─────────────────┘  └─────────────────┘                          │
│                                                                      │
│            ┌────────────────────────────┐                           │
│            │   Review & Edit →          │                           │
│            └────────────────────────────┘                           │
│          (goes to editor — user reviews before publishing)          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## W8. Auth Modal

### Sign Up
```
┌──────────────────────────────────────────────┐
│                                        ✕     │
│                                              │
│  Create your account                         │
│  Save your portfolio. It's free.             │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  G   Continue with Google              │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ──────────── or ────────────                │
│                                              │
│  Full name                                   │
│  ┌────────────────────────────────────────┐  │
│  │ Aditya Sharma                         │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Email                                       │
│  ┌────────────────────────────────────────┐  │
│  │ aditya@gmail.com                      │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Password                                    │
│  ┌────────────────────────────────────────┐  │
│  │ ••••••••••                            │  │
│  └────────────────────────────────────────┘  │
│  Min 8 characters                            │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │          Create account →              │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  By signing up, you agree to our Terms of    │
│  Service and Privacy Policy.                 │
│                                              │
│  Already have an account? Log in             │
│                                              │
└──────────────────────────────────────────────┘
```

### Log In
```
┌──────────────────────────────────────────────┐
│                                        ✕     │
│                                              │
│  Welcome back                                │
│  Log in to manage your portfolios.           │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  G   Continue with Google              │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ──────────── or ────────────                │
│                                              │
│  Email                                       │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Password                                    │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Forgot password? →                          │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │              Log in →                  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Don't have an account? Sign up free         │
│                                              │
└──────────────────────────────────────────────┘
```

---

## W9. Dashboard

### Empty State
```
┌──────────────────────────────────────────────────────────────────────┐
│ ● FolioForge          Portfolios   Analytics   Settings    (AS) ▾   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  My Portfolios                                                       │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │                                                                │  │
│  │                  📄                                            │  │
│  │                                                                │  │
│  │         You don't have any portfolios yet.                     │  │
│  │                                                                │  │
│  │         ┌──────────────────────────────┐                      │  │
│  │         │  Upload LinkedIn PDF →       │                      │  │
│  │         └──────────────────────────────┘                      │  │
│  │                                                                │  │
│  │         Takes 60 seconds. Seriously.                           │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Populated State
```
┌──────────────────────────────────────────────────────────────────────┐
│ ● FolioForge          Portfolios   Analytics   Settings    (AS) ▾   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  My Portfolios                                  [+ New Portfolio]    │
│                                                                      │
│  ┌───────────────────────────┐  ┌───────────────────────────┐      │
│  │                           │  │                           │      │
│  │  ┌─────────────────────┐  │  │  ┌─────────────────────┐  │      │
│  │  │ ░░░░░░░░░░░░░░░░░░ │  │  │  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  │      │
│  │  │ ░  System Dark    ░ │  │  │  │ ▓  Clean Light    ▓ │  │      │
│  │  │ ░  template       ░ │  │  │  │ ▓  template       ▓ │  │      │
│  │  │ ░  preview        ░ │  │  │  │ ▓  preview        ▓ │  │      │
│  │  │ ░░░░░░░░░░░░░░░░░░ │  │  │  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  │      │
│  │  └─────────────────────┘  │  │  └─────────────────────┘  │      │
│  │                           │  │                           │      │
│  │  Aditya Sharma            │  │  CS Resume v2             │      │
│  │  System Dark              │  │  Clean Light              │      │
│  │                           │  │                           │      │
│  │  ● Published  ·  47 views │  │  ○ Draft  ·  0 views      │      │
│  │                           │  │                           │      │
│  │  [Edit]  [View ↗]  [⋯]   │  │  [Edit]  [Publish]        │      │
│  └───────────────────────────┘  └───────────────────────────┘      │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  📊 47 people viewed your portfolio this week.                 │  │
│  │  See who they are — Upgrade to Pro →                          │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## W10. Portfolio Editor

### Desktop
```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Dashboard            Aditya Sharma            Publish [● ON ]    │
├────────────────────────────────┬─────────────────────────────────────┤
│                                │                                     │
│  TEMPLATE                      │  LIVE PREVIEW                       │
│  [● Dark] [Light] [Split]     │                                     │
│  [🔒Broad] [🔒Warm]           │  ┌───────────────────────────────┐  │
│                                │  │                               │  │
│  ────────────────────          │  │  Aditya Sharma                │  │
│                                │  │  Software Engineer ·          │  │
│  Name                          │  │  Full Stack · Open Source     │  │
│  ┌──────────────────────────┐  │  │                               │  │
│  │ Aditya Sharma            │  │  │  "I ship reliable systems     │  │
│  └──────────────────────────┘  │  │   at scale — and I have the   │  │
│                                │  │   PRs to prove it."           │  │
│  Role                          │  │                               │  │
│  ┌──────────────────────────┐  │  │  ┌────┐ ┌────┐ ┌────┐       │  │
│  │ Software Eng · Full Stack│  │  │  │34% │ │12K │ │98K │       │  │
│  └──────────────────────────┘  │  │  │Lat.│ │Star│ │MAU │       │  │
│                                │  │  └────┘ └────┘ └────┘       │  │
│  Tagline                       │  │                               │  │
│  ┌──────────────────────────┐  │  │  Experience                   │  │
│  │ "I ship reliable systems │  │  │                               │  │
│  │  at scale — and I have   │  │  │  Google · SWE Intern          │  │
│  │  the PRs to prove it."   │  │  │  Summer 2024                  │  │
│  └──────────────────────────┘  │  │  → Cut API latency 34%       │  │
│                                │  │    across 3 core endpoints    │  │
│  Stats                         │  │                               │  │
│  ┌──────┬──────┐ [+ Add]      │  │  Open Source · Contributor    │  │
│  │ 34%  │Latency│              │  │  2023–Present                 │  │
│  ├──────┼──────┤              │  │  → Merged 47 PRs. 12K stars   │  │
│  │ 12K  │Stars │              │  │                               │  │
│  ├──────┼──────┤              │  │  Skills                       │  │
│  │ 98K  │MAU   │              │  │  [Py][TS][AWS][React][Docker] │  │
│  └──────┴──────┘              │  │                               │  │
│                                │  └───────────────────────────────┘  │
│  Experience                    │                                     │
│  ▼ Google · SWE Intern         │  ┌───────────────────────────────┐  │
│    Company: [Google         ]  │  │  🔄 Regenerate with AI        │  │
│    Title:   [SWE Intern     ]  │  └───────────────────────────────┘  │
│    Period:  [Summer 2024    ]  │  ┌───────────────────────────────┐  │
│    Bullets:                    │  │  🔗 Copy public link           │  │
│    ┌────────────────────────┐  │  └───────────────────────────────┘  │
│    │ Cut API latency 34%   │  │                                     │
│    │ across 3 core         │  │  Saved ✓                            │
│    │ endpoints              │  │                                     │
│    └────────────────────────┘  │                                     │
│                                │                                     │
│  ▶ Open Source · Contributor   │                                     │
│                                │                                     │
│  Skills                        │                                     │
│  [Py ✕][TS ✕][AWS ✕][+ Add]   │                                     │
│                                │                                     │
└────────────────────────────────┴─────────────────────────────────────┘
```

---

## W11. Analytics Dashboard (Pro)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ● FolioForge          Portfolios   Analytics   Settings    (AS) ▾   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Analytics · Aditya Sharma Portfolio          Last 30 days ▾        │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │     147      │  │      89      │  │   2m 34s     │              │
│  │    views     │  │    unique    │  │  avg time    │              │
│  │    ↑ 23%     │  │    ↑ 15%     │  │   ↑ 8%      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  Views over time                                               │  │
│  │                                                                │  │
│  │  12│                                              ╭─╮          │  │
│  │  10│                               ╭──╮      ╭───╯ │          │  │
│  │   8│              ╭──╮        ╭───╯  ╰──╮  │     ╰──╮       │  │
│  │   6│         ╭───╯  ╰───╮  │          ╰──╯           │       │  │
│  │   4│    ╭───╯           ╰──╯                          ╰───   │  │
│  │   2│───╯                                                      │  │
│  │   0└──────────────────────────────────────────────────────     │  │
│  │    Feb 1        Feb 8       Feb 15       Feb 22      Mar 1    │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────┐  ┌────────────────────────────┐    │
│  │  TOP SOURCES               │  │  TOP LOCATIONS              │    │
│  │                            │  │                             │    │
│  │  ████████████  LinkedIn 62%│  │  ████████████  Mumbai   34% │    │
│  │  ████████      Google   24%│  │  ████████      New York 18% │    │
│  │  █████         Direct   14%│  │  ██████        London   12% │    │
│  │                            │  │  ████          SF        8% │    │
│  └────────────────────────────┘  └────────────────────────────┘    │
│                                                                      │
│  RECENT VISITORS                                                     │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  🏢  Goldman Sachs                                             │  │
│  │      New York, US  ·  via LinkedIn  ·  2 hours ago            │  │
│  │      Viewed for 3m 12s                                        │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │  🏢  Google LLC                                                │  │
│  │      Mountain View, US  ·  via Google Search  ·  Yesterday    │  │
│  │      Viewed for 1m 45s                                        │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │  🏢  McKinsey & Company                                       │  │
│  │      London, UK  ·  via Direct link  ·  3 days ago            │  │
│  │      Viewed for 4m 02s                                        │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │  🌐  Unknown organization                                     │  │
│  │      Mumbai, IN  ·  via LinkedIn  ·  5 days ago               │  │
│  │      Viewed for 0m 34s                                        │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Showing 1-10 of 89  ·  [Load more]                                 │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Analytics — Free User (Blurred Teaser)
```
┌──────────────────────────────────────────────────────────────────────┐
│ ● FolioForge          Portfolios   Analytics   Settings    (AS) ▾   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Analytics                                                           │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  │
│  │  ░░░░  147 views  ░░░░  89 unique  ░░░░  2m 34s  ░░░░░░░░  │  │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  │
│  │  ░░░░  Goldman Sachs · New York  ░░░░░░░░░░░░░░░░░░░░░░░░░  │  │
│  │  ░░░░  Google LLC · Mountain View  ░░░░░░░░░░░░░░░░░░░░░░░  │  │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  │
│  │                                                                │  │
│  │           47 people viewed your portfolio.                     │  │
│  │           See who they are.                                    │  │
│  │                                                                │  │
│  │           ┌────────────────────────────────┐                  │  │
│  │           │   Upgrade to Pro — ₹99/mo →    │                  │  │
│  │           └────────────────────────────────┘                  │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## W12. Public Portfolio — System Dark Template

```
┌──────────────────────────────────────────────────────────────────────┐
│  (dark background, no navigation — clean standalone page)            │
│                                                                      │
│                                                                      │
│            Aditya                                                    │
│            Sharma                                                    │
│                                                                      │
│            Software Engineer · Full Stack · Open Source               │
│                                                                      │
│            "I ship reliable systems at scale — and I                 │
│             have the PRs to prove it."                               │
│                                                                      │
│                                                                      │
│        ┌──────────────┬──────────────┬──────────────┐               │
│        │     34%      │     12K      │     98K      │               │
│        │  Latency     │   GitHub     │    MAU       │               │
│        │  Reduced     │   Stars      │   Served     │               │
│        └──────────────┴──────────────┴──────────────┘               │
│                                                                      │
│                                                                      │
│        EXPERIENCE                                                    │
│        ─────────                                                     │
│                                                                      │
│        │  Google                                                     │
│        │  SWE Intern · Summer 2024                                   │
│        │                                                             │
│        │  Cut API latency 34% across 3 core endpoints —             │
│        │  deployed to production in week 8.                          │
│        │                                                             │
│        │  Open Source — React Library                                │
│        │  Core Contributor · 2023–Present                            │
│        │                                                             │
│        │  Merged 47 PRs. Library hit 12K GitHub stars,              │
│        │  80K weekly downloads.                                      │
│                                                                      │
│                                                                      │
│        EDUCATION                                                     │
│        ─────────                                                     │
│                                                                      │
│        University of Michigan                                        │
│        B.S. Computer Science · 2025                                  │
│                                                                      │
│                                                                      │
│        SKILLS                                                        │
│        ─────────                                                     │
│                                                                      │
│        [Python] [TypeScript] [AWS] [React] [Docker]                  │
│                                                                      │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────── │
│  Built with FolioForge · Create your own portfolio →                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## W13. Public Portfolio — Clean Light Template

```
┌──────────────────────────────────────────────────────────────────────┐
│  (white background, navy accents, corporate feel)                    │
│                                                                      │
│                                                                      │
│                    Morgan Li                                          │
│                    ─────────                                         │
│                    Product Designer · UX Research · Systems           │
│                                                                      │
│                    "I redesign the moments where users               │
│                     almost give up."                                  │
│                                                                      │
│                                                                      │
│                    28%           40+          0→1                     │
│                    Task Time     HCI          Design                  │
│                    Reduced       Citations    Systems                 │
│                                                                      │
│                    ─────────────────────────────────                  │
│                                                                      │
│                    Experience                                         │
│                                                                      │
│                    Figma                                              │
│                    Product Design Intern · Summer 2024                │
│                    Redesigned collaboration panel — task              │
│                    completion time fell 28% in user testing.          │
│                                                                      │
│                    University UX Lab                                  │
│                    Lead Researcher · 2022–2024                        │
│                    Published longitudinal study on mobile             │
│                    nav. Cited 40+ times in HCI literature.            │
│                                                                      │
│                    ─────────────────────────────────                  │
│                                                                      │
│                    Skills                                             │
│                    [Figma] [Framer] [User Research] [WCAG]           │
│                                                                      │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────── │
│  Built with FolioForge · Create your own portfolio →                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## W14. Payment / Upgrade Modal

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                               ✕      │
│                                                                      │
│  Upgrade to Pro                                                      │
│  See who's viewing your portfolio.                                   │
│                                                                      │
│  ┌───────────────────────────┐  ┌───────────────────────────┐      │
│  │                           │  │                           │      │
│  │  PRO                      │  │  LIFETIME                 │      │
│  │                           │  │                           │      │
│  │  [Monthly|Yearly] toggle  │  │        ₹1,499             │      │
│  │   ₹99/mo  │  ₹799/yr     │  │       one-time            │      │
│  │            │  (save 33%)  │  │                           │      │
│  │                           │  │  Pay once. Own forever.   │      │
│  │                           │  │                           │      │
│  │  ✓ Recruiter analytics    │  │  ✓ Everything in Pro      │      │
│  │  ✓ All 5 templates        │  │  ✓ No recurring charges   │      │
│  │  ✓ Remove badge           │  │  ✓ Early access features  │      │
│  │  ✓ Multiple portfolios    │  │  ✓ Founding member badge  │      │
│  │                           │  │                           │      │
│  │  ┌─────────────────────┐  │  │  ┌─────────────────────┐  │      │
│  │  │   Start Pro →       │  │  │  │  Get Lifetime →     │  │      │
│  │  └─────────────────────┘  │  │  └─────────────────────┘  │      │
│  │                           │  │                           │      │
│  └───────────────────────────┘  └───────────────────────────┘      │
│                                                                      │
│  Currency: [₹ INR ▾]                                                │
│                                                                      │
│  💡 Monthly = test the waters.                                       │
│     Lifetime = never think about it again.                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## W15. Settings Page

```
┌──────────────────────────────────────────────────────────────────────┐
│ ● FolioForge          Portfolios   Analytics   Settings    (AS) ▾   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Settings                                                            │
│                                                                      │
│  ACCOUNT                                                             │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  Name       Aditya Sharma                           [Edit]    │  │
│  │  Email      aditya@gmail.com                        (Google)  │  │
│  │  Plan       Free                          [Upgrade to Pro →]  │  │
│  │  Joined     March 2026                                        │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  PORTFOLIO URL                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  Your portfolio URL:                                           │  │
│  │  folioforge.vercel.app/p/ ┌──────────────────┐  [Save]       │  │
│  │                           │ aditya-sharma     │               │  │
│  │                           └──────────────────┘               │  │
│  │  ⚠ Changing slug breaks existing links.                       │  │
│  │    Old URL redirects for 30 days.                             │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  DANGER ZONE                                                         │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  ┌──────────────────────┐                                     │  │
│  │  │  Delete my account   │  This permanently deletes all      │  │
│  │  └──────────────────────┘  your portfolios and analytics.    │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## W16. Mobile Layouts

### Mobile Nav (Hamburger Open)
```
┌────────────────────────────┐
│ ● FolioForge          ✕   │
├────────────────────────────┤
│                            │
│  How it works              │
│  Templates                 │
│  Pricing                   │
│                            │
│  Log in                    │
│                            │
│  ┌────────────────────────┐│
│  │    Start free →        ││
│  └────────────────────────┘│
│                            │
├────────────────────────────┤
│  (page content below)      │
└────────────────────────────┘
```

### Mobile Dashboard
```
┌────────────────────────────┐
│ ● FolioForge        (AS)  │
├────────────────────────────┤
│                            │
│ My Portfolios  [+ New]     │
│                            │
│ ┌────────────────────────┐ │
│ │ ┌────────────────────┐ │ │
│ │ │  System Dark       │ │ │
│ │ │  template preview  │ │ │
│ │ └────────────────────┘ │ │
│ │                        │ │
│ │ Aditya Sharma          │ │
│ │ ● Published · 47 views │ │
│ │                        │ │
│ │ [Edit]  [View ↗]  [⋯] │ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │ 📊 47 views this week  │ │
│ │ Upgrade to Pro →       │ │
│ └────────────────────────┘ │
│                            │
├────────────────────────────┤
│ [📄] [📊] [⚙]  (tab bar) │
└────────────────────────────┘
```

### Mobile Editor (Tab Toggle)
```
┌────────────────────────────┐
│ ← Back          [Publish●] │
├────────────────────────────┤
│ [  Edit  ] [ Preview ]     │
├────────────────────────────┤
│                            │
│ Template                   │
│ [●Dark][Light][Split]     │
│ [🔒Broad][🔒Warm]        │
│                            │
│ Name                       │
│ ┌────────────────────────┐ │
│ │ Aditya Sharma          │ │
│ └────────────────────────┘ │
│                            │
│ Role                       │
│ ┌────────────────────────┐ │
│ │ Software Eng · Full S. │ │
│ └────────────────────────┘ │
│                            │
│ Tagline                    │
│ ┌────────────────────────┐ │
│ │ "I ship reliable       │ │
│ │  systems at scale"     │ │
│ └────────────────────────┘ │
│                            │
│ Stats                      │
│ [34%|Latency] [12K|Stars] │
│ [98K|MAU] [+ Add]         │
│                            │
│ Experience                 │
│ ▼ Google · SWE Intern      │
│   [edit fields...]         │
│ ▶ Open Source              │
│                            │
│ Skills                     │
│ [Py ✕][TS ✕][AWS ✕][+]   │
│                            │
│ [🔄 Regenerate with AI]   │
│ [🔗 Copy public link]     │
│                            │
└────────────────────────────┘
```

---

## W17. Toast Notifications

### Success Toast
```
                    ┌──────────────────────────────┐
                    │ ▌ ✓  Portfolio published!     │
                    │ ▌    Live at /p/aditya-sharma │
                    │ ▌                     [View ↗]│
                    └──────────────────────────────┘
                    (fixed bottom-right, green left border)
```

### Error Toast
```
                    ┌──────────────────────────────┐
                    │ ▌ ✕  Upload failed            │
                    │ ▌    Could not read PDF.      │
                    │ ▌    Try re-exporting.  [Retry]│
                    └──────────────────────────────┘
                    (fixed bottom-right, red left border)
```

### Analytics Summary Toast (on dashboard load — NOT real-time)
```
                    ┌──────────────────────────────┐
                    │ ▌ 📊 3 new views since your  │
                    │ ▌    last visit               │
                    │ ▌                  [See details]│
                    └──────────────────────────────┘
                    (fixed bottom-right, accent left border)
```
> **Note:** No real-time websocket in v1. This toast shows on dashboard load, summarizing activity since last visit. NOT a live push notification.

---

## W18. Loading & Empty States

### Skeleton Loading (Dashboard)
```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  My Portfolios                                                       │
│                                                                      │
│  ┌───────────────────────────┐  ┌───────────────────────────┐      │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░░░░░░░░░░ │      │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░░░░░░░░░░ │      │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░░░░░░░░░░ │      │
│  │                           │  │                           │      │
│  │ ░░░░░░░░░░░░░             │  │ ░░░░░░░░░░░░░             │      │
│  │ ░░░░░░░░░                 │  │ ░░░░░░░░░                 │      │
│  │ ░░░░░░░░░░░░░░            │  │ ░░░░░░░░░░░░░░            │      │
│  └───────────────────────────┘  └───────────────────────────┘      │
│                                                                      │
│  (shimmer animation: bg2 → bg3 pulse, 1.5s infinite)                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Page-Level Error
```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                                                                      │
│                          ⚠                                           │
│                                                                      │
│              Something went wrong.                                   │
│              We couldn't load this page.                             │
│                                                                      │
│              ┌──────────────────────┐                               │
│              │     Try again →      │                               │
│              └──────────────────────┘                               │
│                                                                      │
│              If this keeps happening,                                │
│              File a bug at github.com/folioforge                     │
│                                                                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Screen Inventory Summary

| # | Screen | States | Mobile Variant |
|---|---|---|---|
| W1 | Landing — Hero | Default, field-switched (×5) | Yes |
| W2 | Landing — Google Moment | Default | Stacked |
| W3 | Landing — How It Works | Default | Stacked |
| W4 | Landing — Before/After | 5 profiles (CS, Design, Finance, Research, Marketing) | Stacked |
| W5 | Landing — Pricing | Default, USD/INR toggle | Stacked cards |
| W6 | Upload Modal | Empty, file selected, processing, error | Same (full-screen) |
| W7 | AI Streaming | Streaming, complete | Stacked |
| W8 | Auth Modal | Sign up, log in, error, success | Same |
| W9 | Dashboard | Empty, populated, with analytics | Single column |
| W10 | Editor | Editing, saving, regenerating | Tab toggle |
| W11 | Analytics | Pro view, free (blurred) | Stacked charts |
| W12 | Portfolio — System Dark | Published | Responsive |
| W13 | Portfolio — Clean Light | Published | Responsive |
| W14 | Payment Modal | Plan selection, currency toggle | Stacked cards |
| W15 | Settings | Default, editing | Single column |
| W16 | Mobile layouts | Nav, dashboard, editor | N/A |
| W17 | Toast notifications | Success, error, analytics alert | Same |
| W18 | Loading & error states | Skeleton, error page | Same |

**Total: 18 wireframe screens covering 40+ states**

---

## Missing Screens (TODO for next wireframe pass)

The following screens exist in the product but have no wireframe yet:

| Screen | Why It's Needed |
|---|---|
| `/p/[slug]` — unpublished/404 state | What does a visitor see when a portfolio is private or slug doesn't exist? Show "This portfolio is currently private" page. |
| Password reset flow | "Forgot password?" → email input → confirmation → new password. Fundamental auth flow. |
| Stripe success/cancel redirect pages | After Stripe Checkout, where does the user land? What toast/message do they see? |
| Email verification prompt | "Check your email to verify your account before publishing." |
| Split Editorial, Broadsheet, Warm Editorial templates | 3 of 5 templates have no wireframe. Developers can't build them. |
| Portfolio with empty stats | What does the template look like when the stats section is empty (no metrics in PDF)? |
| Locked template click state | Free user clicks a locked Pro template — what happens? Upgrade modal? Inline tooltip? |
| Cookie consent banner | Required for GDPR. Small banner at bottom of portfolio pages. |
| Privacy policy page (`/privacy`) | Full page with data handling disclosures. |
