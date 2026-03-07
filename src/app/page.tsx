'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import StreamingView from '@/components/landing/StreamingView';
import TemplateRenderer from '@/components/templates/TemplateRenderer';
import type { Field, PortfolioData } from '@/lib/types';
import { TEMPLATES } from '@/lib/types';

// ── Demo data for template previews ──
const DEMO_DATA: PortfolioData = {
  name: 'Alex Chen',
  role: 'Senior Full-Stack Engineer',
  tagline: 'I turn ambitious product ideas into shipped software that scales — 8 years building for startups and Fortune 500s alike.',
  stats: [
    { label: 'Years of Experience', value: '8+' },
    { label: 'Products Shipped', value: '23' },
    { label: 'Users Impacted', value: '2.4M' },
  ],
  experience: [
    {
      company: 'Stripe',
      title: 'Senior Software Engineer',
      period: '2021 – Present',
      bullets: [
        'Architected a real-time fraud detection pipeline processing 12M transactions/day, reducing chargebacks by 34% ($18M annual savings)',
        'Led a cross-functional team of 6 to rebuild the merchant onboarding flow, cutting drop-off rate from 23% to 9%',
      ],
    },
    {
      company: 'Figma',
      title: 'Software Engineer',
      period: '2019 – 2021',
      bullets: [
        'Built the real-time multiplayer cursor system handling 500K+ concurrent sessions with sub-50ms latency',
        'Created the plugin API sandbox architecture that enabled 5,000+ community plugins',
      ],
    },
  ],
  education: [{ institution: 'University of Waterloo', degree: 'B.S. Computer Science', year: '2017' }],
  skills: ['TypeScript', 'React', 'Node.js', 'Go', 'PostgreSQL', 'Redis', 'AWS', 'Kubernetes', 'GraphQL'],
};

// ── Sample resume for zero-friction demo ──
const SAMPLE_RESUME_TEXT = `Alex Chen
Senior Full-Stack Engineer

EXPERIENCE

Stripe — Senior Software Engineer (2021 – Present)
- Worked on fraud detection systems that process millions of transactions
- Part of team that handled merchant onboarding improvements
- Maintained internal tools and dashboards for payment operations

Figma — Software Engineer (2019 – 2021)
- Helped with real-time multiplayer features for the design tool
- Worked on the plugin system and developer API
- Fixed bugs and improved performance across the frontend

EDUCATION

University of Waterloo — B.S. Computer Science (2017)

SKILLS

TypeScript, React, Node.js, Go, PostgreSQL, Redis, AWS, Kubernetes, GraphQL`;

// ── Before/After pairs ──
const TRANSFORM_PAIRS = [
  { before: 'Worked on fraud detection systems that process millions of transactions', after: 'Architected fraud detection pipeline processing 12M txns/day — $18M saved annually' },
  { before: 'Part of team that handled merchant onboarding improvements', after: 'Led team of 6 to rebuild onboarding, cutting drop-off from 23% to 9%' },
  { before: 'Helped with real-time multiplayer features for the design tool', after: 'Built multiplayer cursor system handling 500K concurrent sessions, sub-50ms latency' },
  { before: 'Worked on the plugin system and developer API', after: 'Created plugin sandbox architecture enabling 5,000+ community plugins' },
];

// ── Hooks ──
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ── Typewriter Before/After Demo ──
function TypewriterDemo({ pairs, visible }: { pairs: typeof TRANSFORM_PAIRS; visible: boolean }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<'before' | 'typing' | 'done'>('before');

  useEffect(() => {
    if (!visible) return;
    setPhase('before');
    setTyped('');
    const timer = setTimeout(() => setPhase('typing'), 800);
    return () => clearTimeout(timer);
  }, [visible, activeIdx]);

  useEffect(() => {
    if (phase !== 'typing') return;
    const target = pairs[activeIdx].after;
    if (typed.length >= target.length) {
      setPhase('done');
      const next = setTimeout(() => {
        setActiveIdx((prev) => (prev + 1) % pairs.length);
      }, 4000);
      return () => clearTimeout(next);
    }
    const speed = 16 + Math.random() * 12;
    const timer = setTimeout(() => setTyped(target.slice(0, typed.length + 1)), speed);
    return () => clearTimeout(timer);
  }, [phase, typed, activeIdx, pairs]);

  const pair = pairs[activeIdx];

  return (
    <div className="space-y-4">
      <div className="bg-bg2/80 border border-white/[0.04] rounded-xl p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-error/60" />
          <span className="text-bone4 text-[10px] font-mono uppercase tracking-[0.15em]">Resume bullet</span>
        </div>
        <p className="text-bone3 text-sm font-mono leading-relaxed">{pair.before}</p>
      </div>

      <div className="flex justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent/40">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </div>

      <div className="bg-bg2/80 border border-accent/[0.08] rounded-xl p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-success pulse-dot" />
          <span className="text-bone4 text-[10px] font-mono uppercase tracking-[0.15em]">AI rewrite</span>
        </div>
        <p className="text-bone text-sm font-mono leading-relaxed min-h-[2.5rem]">
          {phase === 'before' ? '' : typed}
          {phase === 'typing' && <span className="typewriter-cursor" />}
        </p>
      </div>

      <div className="flex items-center justify-center gap-1.5 pt-2">
        {pairs.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === activeIdx ? 'bg-accent w-5' : 'bg-bone4/20 w-1 hover:bg-bone4/40'
            }`}
            aria-label={`Example ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ── FAQ ──
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.04]" data-reveal-child>
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-5 flex items-center justify-between text-left group"
      >
        <span className="text-bone text-[15px] pr-8 group-hover:text-accent transition-colors duration-200">{q}</span>
        <span className={`text-bone4 text-lg shrink-0 transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'max-h-40 pb-5' : 'max-h-0'}`}>
        <p className="text-bone3 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

// ── Template Carousel ──
function TemplateCarousel() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % TEMPLATES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative">
      <div className="rounded-xl overflow-hidden border border-white/[0.04] shadow-2xl shadow-black/40 max-h-[420px] lg:max-h-[500px] overflow-y-hidden relative bg-bg2/50">
        {TEMPLATES.map((t, i) => (
          <div
            key={t.id}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{ opacity: i === activeIdx ? 1 : 0, zIndex: i === activeIdx ? 1 : 0 }}
          >
            <div className="transform scale-[0.42] md:scale-[0.48] origin-top-left w-[238%] md:w-[208%]">
              <TemplateRenderer template={t.id} data={DEMO_DATA} showBadge={false} />
            </div>
          </div>
        ))}
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-bg to-transparent pointer-events-none z-10" />
        <div className="invisible">
          <div className="transform scale-[0.42] md:scale-[0.48] origin-top-left w-[238%] md:w-[208%]">
            <TemplateRenderer template={TEMPLATES[0].id} data={DEMO_DATA} showBadge={false} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 px-1">
        <span className="text-bone3 text-xs font-mono">{TEMPLATES[activeIdx].name}</span>
        <div className="flex items-center gap-1">
          {TEMPLATES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === activeIdx ? 'bg-accent w-4' : 'bg-bone4/20 w-1 hover:bg-bone4/40'
              }`}
              aria-label={`Template ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──
function HomeInner() {
  const [streamingData, setStreamingData] = useState<{ text: string; field: Field | null } | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchParams = useSearchParams();

  const transform = useReveal();
  const templatesSec = useReveal();
  const pricing = useReveal();
  const faq = useReveal();

  useEffect(() => {
    if (searchParams.get('upload') === 'true') {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [searchParams]);

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are supported.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setUploadError('Max file size is 4MB.');
      return;
    }
    setUploading(true);
    setUploadError('');
    const formData = new FormData();
    formData.append('pdf', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUploading(false);
      setStreamingData({ text: data.text, field: data.field });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
      setUploading(false);
    }
  }

  function handleGenerate() {
    if (!resumeText.trim() || uploading) return;
    setStreamingData({ text: resumeText, field: null });
  }

  function handleTrySample() {
    setResumeText(SAMPLE_RESUME_TEXT);
    setTimeout(() => {
      setStreamingData({ text: SAMPLE_RESUME_TEXT, field: 'cs' });
    }, 400);
  }

  if (streamingData) {
    return (
      <StreamingView
        linkedinText={streamingData.text}
        detectedField={streamingData.field}
        onBack={() => setStreamingData(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg">

      {/* ═══ NAV ═══ */}
      <nav className="fixed top-0 inset-x-0 z-40 glass border-b border-white/[0.03]">
        <div className="max-w-[1100px] mx-auto px-5 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-bone font-semibold tracking-tight">
            <span className="w-2 h-2 rounded-full bg-accent" />
            FolioForge
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/p/demo" className="text-bone4 text-sm hover:text-bone3 transition-colors hidden sm:block">Demo</Link>
            <Link href="/roast" className="text-bone4 text-sm hover:text-bone3 transition-colors hidden sm:block">Feedback</Link>
            <Link href="#pricing" className="text-bone4 text-sm hover:text-bone3 transition-colors hidden sm:block">Pricing</Link>
            <Link href="/auth/login" className="text-bone3 text-sm hover:text-bone transition-colors">Log in</Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="min-h-[100svh] flex flex-col justify-center pt-20 pb-12 px-5 lg:px-8">
        <div className="max-w-[1100px] mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: headline + input */}
            <div>
              <h1 className="hero-reveal hero-reveal-1 text-[clamp(2rem,5vw,3.5rem)] font-bold text-bone leading-[1.1] tracking-[-0.03em] font-display mb-3">
                Paste your resume.
                <br />
                <span className="text-bone3">Get a portfolio.</span>
              </h1>
              <p className="hero-reveal hero-reveal-2 text-bone4 text-sm mb-8 max-w-md">
                AI rewrites your experience with real metrics and builds a live portfolio. Takes 60 seconds. Free.
              </p>

              {/* The input */}
              <div
                className={`hero-reveal hero-reveal-3 resume-input-wrap ${dragging ? 'dragging' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFile(f);
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={resumeText}
                  onChange={(e) => { setResumeText(e.target.value); setUploadError(''); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  rows={7}
                  placeholder={`Alex Chen\nSenior Full-Stack Engineer\n\nStripe — Senior Engineer (2021–Present)\n- Worked on fraud detection systems...\n- Handled merchant onboarding...\n\nSkills: TypeScript, React, Node.js, Go`}
                />
                <div className="resume-input-bar">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 text-bone4 text-xs hover:text-bone3 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-60">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                      </svg>
                      Upload PDF
                    </button>
                    <span className="text-white/[0.08]">|</span>
                    <button
                      onClick={handleTrySample}
                      className="text-accent/70 text-xs hover:text-accent transition-colors"
                    >
                      Try a sample
                    </button>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={!resumeText.trim() || uploading}
                    className="px-4 py-1.5 bg-accent text-bg text-xs font-semibold rounded-md hover:bg-accent2 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Reading PDF...' : 'Generate'}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </div>

              {uploadError && <p className="text-error text-xs mt-2.5">{uploadError}</p>}

              <div className="hero-reveal hero-reveal-4 flex items-center gap-3 mt-5 text-bone4/50 text-[11px]">
                <span className="flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success/50"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  Deleted after processing
                </span>
                <span>·</span>
                <span>No signup</span>
                <span>·</span>
                <span>Free forever</span>
              </div>
            </div>

            {/* Right: template preview */}
            <div className="hero-reveal hero-reveal-3 hidden lg:block">
              <TemplateCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MOBILE TEMPLATE PREVIEW ═══ */}
      <section className="lg:hidden pb-16 px-5">
        <div className="max-w-[500px] mx-auto">
          <p className="text-bone4 text-[10px] font-mono uppercase tracking-[0.2em] mb-4 text-center">Output preview</p>
          <TemplateCarousel />
        </div>
      </section>

      {/* ═══ BEFORE → AFTER ═══ */}
      <section ref={transform.ref} className="py-24 lg:py-32 border-t border-white/[0.03]">
        <div className={`max-w-[680px] mx-auto px-5 lg:px-8 section-reveal ${transform.visible ? 'visible' : ''}`}>
          <div className="text-center mb-12" data-reveal-child>
            <p className="text-bone4 text-[10px] font-mono uppercase tracking-[0.2em] mb-4">How the AI works</p>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold text-bone tracking-tight font-display">
              Vague bullets become <span className="text-gradient">recruiter magnets.</span>
            </h2>
          </div>
          <div data-reveal-child>
            <TypewriterDemo pairs={TRANSFORM_PAIRS} visible={transform.visible} />
          </div>
        </div>
      </section>

      {/* ═══ TEMPLATES ═══ */}
      <section ref={templatesSec.ref} className="py-24 lg:py-32 border-t border-white/[0.03]">
        <div className={`max-w-[1100px] mx-auto px-5 lg:px-8 section-reveal ${templatesSec.visible ? 'visible' : ''}`}>
          <div className="text-center mb-12" data-reveal-child>
            <p className="text-bone4 text-[10px] font-mono uppercase tracking-[0.2em] mb-4">Templates</p>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold text-bone tracking-tight font-display">
              One resume. Five styles.
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3" data-reveal-child>
            {TEMPLATES.map((t) => (
              <div key={t.id} className="group">
                <div className="rounded-lg overflow-hidden border border-white/[0.04] bg-bg2/50 h-48 relative hover:border-white/[0.08] transition-colors">
                  <div className="transform scale-[0.2] origin-top-left w-[500%]">
                    <TemplateRenderer template={t.id} data={DEMO_DATA} showBadge={false} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 px-0.5">
                  <span className="text-bone3 text-[11px] font-mono">{t.name}</span>
                  {t.isPro && <span className="text-accent/50 text-[9px] font-mono uppercase">Pro</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section ref={pricing.ref} id="pricing" className="py-24 lg:py-32 border-t border-white/[0.03]">
        <div className={`max-w-[720px] mx-auto px-5 lg:px-8 section-reveal ${pricing.visible ? 'visible' : ''}`}>
          <div className="text-center mb-12" data-reveal-child>
            <p className="text-bone4 text-[10px] font-mono uppercase tracking-[0.2em] mb-4">Pricing</p>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold text-bone tracking-tight font-display">
              Free to start. Pro when you need it.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-reveal-child>
            <div className="bg-bg2/60 border border-white/[0.04] rounded-xl p-7">
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-3xl font-bold text-bone font-display">$0</span>
                <span className="text-bone4 text-xs font-mono">forever</span>
              </div>
              <p className="text-bone4 text-xs mb-6">Everything you need to get hired.</p>
              <ul className="space-y-2.5 text-sm mb-8">
                {['AI-rewritten portfolio', '3 templates', 'Portfolio score + tips', 'AI feedback tool', 'Shareable link', 'PDF resume export'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-bone2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success/60 shrink-0"><path d="M20 6L9 17l-5-5" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => textareaRef.current?.focus(), 500); }}
                className="w-full py-2.5 border border-white/[0.06] text-bone text-sm rounded-lg hover:border-white/[0.12] transition-colors"
              >
                Start free
              </button>
            </div>

            <div className="bg-bg2/60 border border-accent/10 rounded-xl p-7 relative">
              <div className="absolute -top-2.5 right-5 bg-accent text-bg text-[9px] font-bold px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider">
                Popular
              </div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-3xl font-bold text-accent font-display">$8</span>
                <span className="text-bone4 text-xs font-mono">/month</span>
              </div>
              <p className="text-bone4 text-xs mb-6">$72/year — save 25%</p>
              <ul className="space-y-2.5 text-sm mb-8">
                {['Everything in Free', 'All 5 premium templates', 'Company visitor tracking', 'City + country analytics', 'Referrer tracking', 'No FolioForge badge'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-bone2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent/60 shrink-0"><path d="M20 6L9 17l-5-5" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => textareaRef.current?.focus(), 500); }}
                className="w-full py-2.5 bg-accent text-bg text-sm font-semibold rounded-lg hover:bg-accent2 transition-colors"
              >
                Start free, upgrade later
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section ref={faq.ref} className="py-24 lg:py-32 border-t border-white/[0.03]">
        <div className={`max-w-[620px] mx-auto px-5 lg:px-8 section-reveal ${faq.visible ? 'visible' : ''}`}>
          <div className="text-center mb-10" data-reveal-child>
            <p className="text-bone4 text-[10px] font-mono uppercase tracking-[0.2em] mb-4">FAQ</p>
            <h2 className="text-2xl font-bold text-bone font-display">Common questions</h2>
          </div>
          <div>
            {[
              { q: 'What kind of PDF can I upload?', a: "Any resume PDF — LinkedIn export, your own resume, or any career document. We extract text from any format." },
              { q: 'Is it actually free?', a: 'Yes. Free includes AI rewriting, 3 templates, scoring, feedback, PDF export, and a shareable link. No card needed. Pro adds analytics and premium templates.' },
              { q: 'What happens to my file?', a: 'Your PDF is processed in memory to extract text, then immediately deleted. We never store your original file.' },
              { q: 'How does recruiter tracking work?', a: 'Pro feature. When someone visits your portfolio, we log their ISP/organization, city, country, referrer, and time spent on each section.' },
              { q: 'Can I use my own domain?', a: 'Not yet — on our roadmap. Currently your portfolio lives at folioforge.com/p/your-slug.' },
              { q: 'What AI model powers this?', a: 'Google Gemini 2.5 Flash with field-specific prompts. The AI never invents metrics — it transforms numbers from your actual resume.' },
            ].map((item, i) => (
              <FAQ key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/[0.03] py-8">
        <div className="max-w-[1100px] mx-auto px-5 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-bone font-semibold tracking-tight">
            <span className="w-2 h-2 rounded-full bg-accent" />
            FolioForge
          </Link>
          <div className="flex items-center gap-6 text-bone4 text-sm">
            <Link href="/p/demo" className="hover:text-bone3 transition-colors">Demo</Link>
            <Link href="/roast" className="hover:text-bone3 transition-colors">Feedback</Link>
            <Link href="/auth/login" className="hover:text-bone3 transition-colors">Log in</Link>
          </div>
          <p className="text-bone4/50 text-xs font-mono">&copy; {new Date().getFullYear()} FolioForge</p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <HomeInner />
    </Suspense>
  );
}
