# ForgeFolio — Career Signal OS

> The first product that gives job seekers the same intelligence companies have always had.

ForgeFolio is a full-stack AI-powered career platform built for Indian engineering students and early-career professionals. Upload your resume, get a scored signal report, generate a shareable portfolio, and access intelligence tools that help you compete in a post-AI job market.

---

## Live Demo

[https://folioforge.vercel.app](https://folioforge.vercel.app)

---

## Features

- **Resume Scoring** — AI-driven score across 5 dimensions with specific, copy-pasteable fixes
- **Portfolio Generator** — 5 visual templates, public URL, shareable in one click
- **Portfolio Analytics** — See who viewed your profile, from where, and for how long
- **Roast Mode** — Brutal, specific AI critique of your resume calibrated to Indian hiring
- **Ghost Job Detector** — Identifies fake job postings before you waste time applying
- **Career Mirror** — Shows how a hiring manager at your target company reads your profile
- **Offer Analyser** — Benchmarks your offer against public salary data with sources
- **ATS Analysis** — Checks formatting and keyword gaps against real job descriptions
- **Applications Tracker** — Track every application with status and outcomes
- **Network Intelligence** — Connections, outreach, and warm path finder
- **Quarter Wrapped** — Shareable quarterly career review card
- **Score Badge** — Verified signal score badge for LinkedIn and email signatures
- **Payments** — Razorpay-based freemium subscription with webhook verification

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (Email + Google OAuth) |
| AI — Scoring | Google Gemini 1.5 Flash |
| AI — Roast Mode | DeepSeek R1 |
| Payments | Razorpay |
| Deployment | Vercel |
| PDF Parsing | pdf-parse |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/SamirSuman01/folioforge.git
cd folioforge
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

Required variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

### 4. Set up the database

Run the SQL migrations in your Supabase project:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/20260330_applications.sql
supabase/migrations/20260330_score_history.sql
supabase/migrations/20260404_profiles_username_outcomes.sql
supabase/migrations/20260406_view_count_rpc.sql
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes (upload, portfolio, analytics, payments, intelligence)
│   ├── auth/         # Authentication pages
│   ├── dashboard/    # Dashboard, analytics, intelligence, network, applications
│   ├── editor/       # Portfolio editor
│   ├── onboarding/   # Upload and onboarding flow
│   ├── p/            # Public portfolio pages
│   ├── badge/        # Shareable score badge
│   └── roast/        # Roast Mode
├── components/
│   ├── templates/    # 5 portfolio templates
│   ├── landing/      # Landing page components
│   ├── editor/       # Editor components
│   └── ui/           # Shared UI components
└── lib/              # AI, scoring, roast engine, Supabase clients, utilities
```

---

## Team

Built by **Samir Suman** as a B.Tech Major Project  
ARKA JAIN University — Computer Science & Engineering, 2025

---

## License

MIT
