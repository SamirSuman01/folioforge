'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import TemplateRenderer from '@/components/templates/TemplateRenderer'
import { scorePortfolio, type ScoreBreakdown } from '@/lib/portfolio-score'
import type { PortfolioData, Template, Portfolio, Education, Field } from '@/lib/types'
import { TEMPLATES, FIELD_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase-client'
import { track } from '@/lib/funnel'

// ─── Bullet quality (client-side, no API) ──────────────────
const METRIC_RE = /\b\d[\d,.]*\s*[%$KMBx]|\$\s*\d[\d,.]*|\b\d+\+?\b(?:\s*(?:years?|months?|users?|clients?|projects?|people|team|members))/i
const VERB_LIST = ['led','built','shipped','designed','launched','grew','reduced','increased','created','developed','managed','implemented','architected','optimized','scaled','automated','delivered','improved','established','pioneered','spearheaded','orchestrated','transformed','negotiated','generated','secured','streamlined','drove','executed','mentored']
function bulletQuality(text: string): 'metric' | 'verb' | 'weak' | 'empty' {
  if (!text.trim()) return 'empty'
  if (METRIC_RE.test(text)) return 'metric'
  const first = text.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '')
  if (first && VERB_LIST.includes(first)) return 'verb'
  return 'weak'
}

// ─── Template palette dots ─────────────────────────────────
const TEMPLATE_PALETTES: Record<string, string[]> = {
  'system-dark':     ['#0F172A', '#1E3A8A', '#94A3B8'],
  'clean-light':     ['#F8F7F4', '#0F172A', '#2563EB'],
  'split-editorial': ['#F8F7F4', '#1E3A8A', '#475569'],
  'broadsheet':      ['#FDF6E3', '#2D1B00', '#8B6914'],
  'warm-editorial':  ['#FAF7F2', '#7C3D12', '#0F172A'],
}

// ─── Editor Page ───────────────────────────────────────────
export default function EditorPage() {
  const params = useParams()
  const router = useRouter()

  const [portfolio,    setPortfolio]    = useState<Portfolio | null>(null)
  const [data,         setData]         = useState<PortfolioData | null>(null)
  const [template,     setTemplate]     = useState<string>('system-dark')
  const [isPublished,  setIsPublished]  = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [hasUnsaved,   setHasUnsaved]   = useState(false)
  const [loading,      setLoading]      = useState(true)
  const [showPreview,  setShowPreview]  = useState(false)
  const [newSkill,     setNewSkill]     = useState('')
  const [toast,        setToast]        = useState<{ msg: string; type?: 'success' | 'error' } | null>(null)
  const [showPublished, setShowPublished] = useState(false)
  const [savedScore,   setSavedScore]   = useState<ScoreBreakdown | null>(null)
  const [scoreDelta,   setScoreDelta]   = useState<{ total: number; from: number; to: number; dims: { label: string; pts: number }[] } | null>(null)
  const [openExp,      setOpenExp]      = useState<boolean[]>([])
  const skillInputRef  = useRef<HTMLInputElement>(null)
  const lastSavedRef   = useRef<string>('')
  const savedScoreRef  = useRef<ScoreBreakdown | null>(null)
  const [rightTab,     setRightTab]     = useState<'preview' | 'score'>('preview')
  const [liveScore,    setLiveScore]    = useState<ScoreBreakdown | null>(null)
  const [scoreHistory, setScoreHistory] = useState<number[]>([])
  const editorPanelRef    = useRef<HTMLDivElement>(null)
  const liveScoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Load portfolio ──
  useEffect(() => {
    async function load() {
      try {
      const res = await fetch(`/api/portfolio/${params.id}`)
      if (!res.ok) { router.push('/dashboard'); return }
      const p: Portfolio = await res.json()
      setPortfolio(p)
      setData(p.data)
      setTemplate(p.template as Template)
      setIsPublished(p.is_published ?? false)
      lastSavedRef.current = JSON.stringify(p.data)
      const initial = scorePortfolio(p.data, (p.field as Field) || 'cs')
      savedScoreRef.current = initial
      setSavedScore(initial)
      setLiveScore(initial)

      // Load score history from Supabase — persists across refreshes
      const supabase = createClient()
      const { data: rows } = await supabase
        .from('score_history')
        .select('score, recorded_at')
        .eq('portfolio_id', p.id)
        .order('recorded_at', { ascending: true })
        .limit(50)
      const dbHist = (rows ?? []).map((r: { score: number }) => r.score)
      const hist = dbHist.length > 0 ? dbHist : [initial.total]
      setScoreHistory(hist)

      // Derive delta from last two persisted scores
      if (hist.length >= 2) {
        const from = hist[hist.length - 2]
        const to   = hist[hist.length - 1]
        if (from !== to) setScoreDelta({ total: to - from, from, to, dims: [] })
      }

      setOpenExp((p.data.experience ?? []).map((_, i) => i === 0))
      setLoading(false)
      track('editor_loaded', { score: initial.total, is_published: p.is_published ?? false })
      } catch {
        router.push('/dashboard')
      }
    }
    load()
  }, [params.id, router])

  // ── Track unsaved ──
  useEffect(() => {
    if (!data || loading) return
    setHasUnsaved(JSON.stringify(data) !== lastSavedRef.current)
  }, [data, loading])

  // ── Save fn ──
  const save = useCallback(async (updates: Partial<Portfolio> = {}) => {
    if (!portfolio || !data) return
    setSaving(true)
    try {
    const next = scorePortfolio(data, (portfolio.field as Field) || 'cs')
    const body: Record<string, unknown> = { ...updates }
    if (!updates.data)     body.data       = data
    if (!updates.template) body.template   = template
    body.score_total = next.total
    const res = await fetch(`/api/portfolio/${portfolio.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    if (res.ok) {
      lastSavedRef.current = JSON.stringify(data)
      setHasUnsaved(false)
      const prev = savedScoreRef.current
      savedScoreRef.current = next
      setSavedScore(next)
      if (prev) {
        const dims = [
          { label: 'Impact language',   pts: next.impactLanguage - prev.impactLanguage },
          { label: 'Completeness',       pts: next.completeness   - prev.completeness   },
          { label: 'Content depth',      pts: next.depth          - prev.depth          },
          { label: 'Field relevance',    pts: next.fieldRelevance - prev.fieldRelevance },
          { label: 'Presentation',       pts: next.presentation   - prev.presentation   },
        ].filter(d => d.pts !== 0).sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts)).slice(0, 2)
        const newDelta = { total: next.total - prev.total, from: prev.total, to: next.total, dims }
        setScoreDelta(newDelta)
      }
      setScoreHistory(h => [...h, next.total])
      showToast('Saved')
    } else {
      showToast('Couldn\'t save — check your connection', 'error')
    }
    } catch {
      showToast('Couldn\'t save — check your connection', 'error')
    } finally {
      setSaving(false)
    }
  }, [portfolio, data, template])

  // ── Auto-save 5s ──
  useEffect(() => {
    if (!data || loading || !hasUnsaved) return
    const t = setTimeout(() => save(), 5000)
    return () => clearTimeout(t)
  }, [data, save, loading, hasUnsaved])

  // ── Cmd/Ctrl + S ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (hasUnsaved) save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [save, hasUnsaved])

  // ── Warn on close with unsaved ──
  useEffect(() => {
    function onUnload(e: BeforeUnloadEvent) { if (hasUnsaved) e.preventDefault() }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [hasUnsaved])

  // ── Live score (800ms debounce after each keystroke) ──
  useEffect(() => {
    if (!data || !portfolio || loading) return
    if (liveScoreTimerRef.current) clearTimeout(liveScoreTimerRef.current)
    liveScoreTimerRef.current = setTimeout(() => {
      setLiveScore(scorePortfolio(data, (portfolio.field as Field) || 'cs'))
    }, 800)
    return () => { if (liveScoreTimerRef.current) clearTimeout(liveScoreTimerRef.current) }
  }, [data, portfolio, loading])

  // ── Scroll editor panel to a labelled section ──
  const scrollToSection = useCallback((sectionKey: string) => {
    const panel = editorPanelRef.current
    if (!panel) return
    const target = panel.querySelector(`[data-section="${sectionKey}"]`) as HTMLElement | null
    if (!target) return
    panel.scrollTop += target.getBoundingClientRect().top - panel.getBoundingClientRect().top - 16
  }, [])

  // ── Helpers ──
  function updateField<K extends keyof PortfolioData>(key: K, value: PortfolioData[K]) {
    if (!data) return
    setData({ ...data, [key]: value })
  }

  function updateExperience(idx: number, field: string, value: string | string[]) {
    if (!data) return
    const next = [...data.experience]
    next[idx] = { ...next[idx], [field]: value }
    setData({ ...data, experience: next })
  }

  function updateEducation(idx: number, field: keyof Education, value: string) {
    if (!data?.education) return
    const next = [...data.education]
    next[idx] = { ...next[idx], [field]: value }
    setData({ ...data, education: next })
  }

  function updateStat(idx: number, field: 'value' | 'label', value: string) {
    if (!data?.stats) return
    const next = [...data.stats]
    next[idx] = { ...next[idx], [field]: value }
    setData({ ...data, stats: next })
  }

  function addSkill() {
    if (!data || !newSkill.trim()) return
    updateField('skills', [...data.skills, newSkill.trim()])
    setNewSkill('')
    skillInputRef.current?.focus()
  }

  async function togglePublish() {
    const next = !isPublished
    setIsPublished(next)
    await save({ is_published: next })
    if (next) {
      setShowPublished(true)
      track('editor_published', { score: liveScore?.total ?? savedScore?.total ?? 0 })
    } else {
      track('editor_unpublished', {})
    }
  }

  // ── Loading ──
  if (loading || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-text-disabled animate-pulse-slow"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
          <span className="text-micro font-mono text-text-disabled">Loading your portfolio</span>
        </div>
      </div>
    )
  }

  const inputCls = 'w-full px-3 py-2 bg-background border border-border rounded text-small text-text-primary focus:border-accent focus:outline-none transition-colors placeholder:text-text-disabled'

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0 no-print">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-small text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeftIcon />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-small text-text-primary font-medium truncate max-w-[140px]">
            {data.name || 'Untitled'}
          </span>
          {portfolio?.field && (
            <span className="hidden sm:inline border border-border rounded-sm px-1.5 py-0.5 text-micro font-mono text-text-disabled uppercase tracking-wider">
              {FIELD_LABELS[portfolio.field as Field] ?? portfolio.field}
            </span>
          )}
          {hasUnsaved && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent" title="Unsaved work — changes not yet locked in" />
          )}
          {saving && (
            <span className="text-micro text-text-disabled">Saving…</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile: toggle edit/preview */}
          <Button
            variant="secondary"
            size="sm"
            className="lg:hidden"
            onClick={() => setShowPreview(v => !v)}
          >
            {showPreview ? 'Edit' : 'Preview'}
          </Button>

          {/* Save */}
          <Button
            size="sm"
            variant={hasUnsaved ? 'primary' : 'secondary'}
            onClick={() => save()}
            disabled={!hasUnsaved || saving}
          >
            {saving ? 'Saving…' : hasUnsaved ? 'Save' : 'Saved'}
          </Button>

          {/* Publish toggle */}
          <button
            onClick={togglePublish}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-small transition-colors',
              isPublished
                ? 'bg-success-subtle border border-success/20 text-success'
                : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
            )}
          >
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              isPublished ? 'bg-success' : 'bg-text-disabled'
            )} />
            {isPublished ? 'Live' : 'Publish'}
          </button>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Editor panel */}
        <div
          ref={editorPanelRef}
          className={cn(
            'w-full lg:w-[380px] xl:w-[420px] shrink-0 lg:border-r border-border overflow-y-auto',
            showPreview && 'hidden lg:block'
          )}
        >
          <div className="p-5 space-y-7">

            {/* Template selector */}
            <Section label="Template">
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATES.map(t => {
                  const locked = t.isPro && !portfolio?.is_pro
                  const palette = TEMPLATE_PALETTES[t.id] ?? []
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (locked) {
                          track('editor_upgrade_from_template', { template: t.id })
                          router.push('/dashboard/upgrade')
                          return
                        }
                        setTemplate(t.id)
                        setHasUnsaved(true)
                        track('editor_template_changed', { template: t.id })
                      }}
                      className={cn(
                        'px-2.5 py-1.5 rounded text-small transition-colors flex items-center gap-1.5',
                        template === t.id
                          ? 'bg-accent text-text-inverse font-medium'
                          : locked
                          ? 'bg-surface text-text-disabled cursor-not-allowed border border-border'
                          : 'bg-surface text-text-secondary hover:text-text-primary border border-border hover:border-border-subtle'
                      )}
                    >
                      {locked ? <LockIcon /> : (
                        <span className="flex gap-0.5 shrink-0">
                          {palette.map((c, ci) => (
                            <span key={ci} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                          ))}
                        </span>
                      )}
                      {t.name}
                    </button>
                  )
                })}
              </div>
            </Section>

            {/* Name + Role */}
            <Section label="Identity" sectionKey="identity">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-micro text-text-secondary">Name</label>
                  <input
                    value={data.name ?? ''}
                    onChange={e => updateField('name', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-micro text-text-secondary">Role</label>
                  <input
                    value={data.role ?? ''}
                    onChange={e => updateField('role', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1 mt-2">
                <label className="text-micro text-text-secondary">Tagline</label>
                <textarea
                  value={data.tagline ?? ''}
                  onChange={e => updateField('tagline', e.target.value)}
                  rows={2}
                  className={cn(inputCls, 'resize-none')}
                />
              </div>
            </Section>

            {/* Stats */}
            <Section
              label="Stats"
              sectionKey="stats"
              action={
                (data.stats?.length ?? 0) < 4
                  ? <InlineAddButton onClick={() => updateField('stats', [...(data.stats ?? []), { value: '', label: '' }])} />
                  : undefined
              }
            >
              <div className="space-y-1.5">
                {(data.stats ?? []).map((stat, i) => (
                  <div key={i} className="flex gap-1.5 items-center">
                    <input
                      value={stat.value}
                      onChange={e => updateStat(i, 'value', e.target.value)}
                      placeholder="42%"
                      className={cn(inputCls, 'w-1/3')}
                    />
                    <input
                      value={stat.label}
                      onChange={e => updateStat(i, 'label', e.target.value)}
                      placeholder="Metric name"
                      className={cn(inputCls, 'flex-1')}
                    />
                    <InlineRemoveButton onClick={() => updateField('stats', (data.stats ?? []).filter((_, j) => j !== i))} />
                  </div>
                ))}
                {(data.stats?.length ?? 0) === 0 && (
                  <p className="text-micro text-text-disabled">No stats — numbers make recruiters stop scrolling</p>
                )}
              </div>
            </Section>

            {/* Experience */}
            <Section
              label="Experience"
              sectionKey="experience"
              action={<InlineAddButton onClick={() => {
              updateField('experience', [...data.experience, { company: '', role: '', period: '', description: '', highlights: [], title: '', bullets: [''] }])
              setOpenExp(prev => [...prev, true])
            }} />}
            >
              <div className="divide-y divide-border">
                {data.experience.map((exp, i) => {
                  const isOpen = openExp[i] ?? false
                  return (
                    <div key={i}>
                      {/* ── Accordion header ── */}
                      <div className="py-2.5 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setOpenExp(prev => prev.map((v, j) => j === i ? !v : v))}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left"
                        >
                          <ChevronRightIcon className={cn('text-text-disabled shrink-0 transition-transform duration-150', isOpen && 'rotate-90')} />
                          <span className="text-small text-text-primary truncate">
                            {exp.company || 'New'} · {exp.title || 'Position'}
                          </span>
                        </button>
                        <InlineRemoveButton onClick={() => {
                          updateField('experience', data.experience.filter((_, j) => j !== i))
                          setOpenExp(prev => prev.filter((_, j) => j !== i))
                        }} />
                      </div>

                      {/* ── Accordion body ── */}
                      {isOpen && (
                        <div className="pb-3 space-y-1.5">
                          <div className="space-y-1.5">
                            <input value={exp.company ?? ''} onChange={e => updateExperience(i, 'company', e.target.value)} placeholder="Company" className={inputCls} />
                            <input value={exp.title ?? ''} onChange={e => updateExperience(i, 'title', e.target.value)} placeholder="Title" className={inputCls} />
                            <input value={exp.period ?? ''} onChange={e => updateExperience(i, 'period', e.target.value)} placeholder="2022 – Present" className={inputCls} />
                          </div>
                          <div className="space-y-1.5 pt-0.5">
                            {(exp.bullets ?? []).map((bullet: string, j: number) => {
                              const q = bulletQuality(bullet)
                              return (
                                <div key={j} className="flex gap-1.5 items-start">
                                  {/* Quality dot */}
                                  <span className={cn(
                                    'mt-[11px] w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-200',
                                    q === 'metric' ? 'bg-success' : q === 'verb' ? 'bg-accent' : q === 'weak' ? 'bg-warning' : 'bg-border'
                                  )} title={q === 'metric' ? 'Has metric ✓' : q === 'verb' ? 'Action verb ✓' : q === 'weak' ? 'Add a metric or start with an action verb' : ''} />
                                  <textarea
                                    value={bullet}
                                    onChange={e => {
                                      const b = [...(exp.bullets ?? [])]
                                      b[j] = e.target.value
                                      updateExperience(i, 'bullets', b)
                                    }}
                                    rows={2}
                                    placeholder="Led / Built / Grew — add a metric"
                                    className={cn(inputCls, 'flex-1 resize-none')}
                                  />
                                  <InlineRemoveButton onClick={() => {
                                    const b = (exp.bullets ?? []).filter((_: string, k: number) => k !== j)
                                    updateExperience(i, 'bullets', b.length ? b : [''])
                                  }} />
                                </div>
                              )
                            })}
                            <button
                              onClick={() => updateExperience(i, 'bullets', [...(exp.bullets ?? []), ''])}
                              className="text-micro text-accent hover:text-accent/80 transition-colors"
                            >
                              + Add bullet
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                {data.experience.length === 0 && (
                  <p className="text-micro text-text-disabled">No experience — this section drives your score most</p>
                )}
              </div>
            </Section>

            {/* Education */}
            <Section
              label="Education"
              sectionKey="education"
              action={<InlineAddButton onClick={() => updateField('education', [...(data.education ?? []), { school: '', degree: '', period: '', institution: '', year: '' }])} />}
            >
              <div className="divide-y divide-border">
                {(data.education ?? []).map((edu: Education, i: number) => (
                  <div key={i} className="py-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-small text-text-primary truncate">
                        {edu.institution || edu.school || 'Institution'}
                      </span>
                      <InlineRemoveButton onClick={() => updateField('education', (data.education ?? []).filter((_: Education, j: number) => j !== i))} />
                    </div>
                    <input value={edu.institution ?? ''} onChange={e => updateEducation(i, 'institution', e.target.value)} placeholder="University name" className={inputCls} />
                    <div className="grid grid-cols-2 gap-1.5">
                      <input value={edu.degree ?? ''} onChange={e => updateEducation(i, 'degree', e.target.value)} placeholder="Degree" className={inputCls} />
                      <input value={edu.year ?? ''} onChange={e => updateEducation(i, 'year', e.target.value)} placeholder="2023" className={inputCls} />
                    </div>
                  </div>
                ))}
                {(data.education ?? []).length === 0 && (
                  <p className="text-micro text-text-disabled">No education — incomplete profiles score below 70</p>
                )}
              </div>
            </Section>

            {/* Skills */}
            <Section label="Skills" sectionKey="skills">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {data.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 border border-border rounded-sm px-2 py-0.5 text-small text-text-primary"
                  >
                    {skill}
                    <button
                      onClick={() => updateField('skills', data.skills.filter((_, j) => j !== i))}
                      className="text-text-disabled hover:text-error transition-colors"
                      aria-label={`Remove ${skill}`}
                    >
                      <XSmallIcon />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input
                  ref={skillInputRef}
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                  placeholder="Add a skill"
                  className={cn(inputCls, 'flex-1')}
                />
                <Button size="sm" variant="secondary" onClick={addSkill} disabled={!newSkill.trim()}>
                  Add
                </Button>
              </div>
            </Section>

            {/* Links when published */}
            {isPublished && portfolio && (
              <Section label="Share">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/p/${portfolio.slug}`}
                      className={cn(inputCls, 'flex-1 text-text-secondary select-all cursor-pointer')}
                      onClick={e => (e.target as HTMLInputElement).select()}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/p/${portfolio.slug}`)
                        showToast('Link copied!')
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <Link
                    href={`/dashboard/analytics?id=${portfolio.id}`}
                    className="block text-small text-center text-accent hover:underline"
                  >
                    View analytics →
                  </Link>
                </div>
              </Section>
            )}

            {/* Export + misc */}
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="secondary" className="flex-1" onClick={() => window.print()}>
                Export PDF
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  try {
                    sessionStorage.setItem('ff_roast_data', JSON.stringify(data))
                  } catch { /* sessionStorage unavailable */ }
                  window.open('/roast', '_blank')
                }}
              >
                Roast it
              </Button>
            </div>

            <p className="text-micro text-text-disabled text-center pb-4">
              Auto-saves every 5s · Cmd+S to save now
            </p>
          </div>
        </div>

        {/* Center: preview + Score tab on lg */}
        <div className={cn(
          'flex-1 flex flex-col overflow-hidden',
          !showPreview && 'hidden lg:flex'
        )}>
          {/* Tab bar: lg only (xl has dedicated right panel) */}
          <div className="hidden lg:flex xl:hidden h-9 border-b border-border items-center gap-5 px-4 shrink-0">
            {(['preview', 'score'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={cn(
                  'text-micro font-mono uppercase tracking-widest transition-colors',
                  rightTab === tab ? 'text-text-primary' : 'text-text-disabled hover:text-text-secondary'
                )}
              >
                {tab === 'score'
                  ? `Score${(liveScore || savedScore) ? ` · ${(liveScore || savedScore)!.total}` : ''}`
                  : 'Preview'}
              </button>
            ))}
          </div>

          {/* Preview — always on xl; on lg only when rightTab === 'preview' */}
          <div className={cn(
            'flex-1 overflow-y-auto bg-border-subtle',
            rightTab !== 'preview' && 'hidden xl:block'
          )}>
            <TemplateRenderer template={template as Template} data={data} showBadge={false} />
          </div>

          {/* Score in center — lg only when Score tab active */}
          {rightTab === 'score' && (
            <div className="flex-1 overflow-y-auto xl:hidden">
              <ScorePanel
                score={savedScore}
                liveScore={liveScore}
                delta={scoreDelta}
                field={(portfolio?.field as Field) || 'cs'}
                scoreHistory={scoreHistory}
                onScrollToSection={scrollToSection}
                portfolioId={portfolio?.id ?? ''}
              />
            </div>
          )}
        </div>

        {/* Right: Score panel — xl always-on, deferred until data loads */}
        <aside className="hidden xl:flex flex-col w-[260px] shrink-0 border-l border-border overflow-y-auto">
          {!loading && savedScore && (
            <ScorePanel
              score={savedScore}
              liveScore={liveScore}
              delta={scoreDelta}
              field={(portfolio?.field as Field) || 'cs'}
              scoreHistory={scoreHistory}
              onScrollToSection={scrollToSection}
              portfolioId={portfolio?.id ?? ''}
            />
          )}
        </aside>
      </div>

      {/* ── Publish celebration modal ── */}
      {showPublished && portfolio && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-5 animate-fade-in">
          <div className="bg-background rounded-md border border-border shadow-lg max-w-sm w-full p-7 text-center animate-slide-up">
            <div className="w-12 h-12 rounded-full bg-success-subtle border border-success/20 flex items-center justify-center mx-auto mb-4">
              <CheckIcon />
            </div>
            <h3 className="text-h3 font-bold text-text-primary mb-1">You&apos;re live.</h3>
            <p className="text-small text-text-secondary mb-5">
              Share it with one person today — even a single view is a signal.
            </p>
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/p/${portfolio.slug}`)
                  showToast('Link copied!')
                  setShowPublished(false)
                  track('editor_celebration_copy', { portfolio_id: portfolio.id })
                }}
              >
                Copy link
              </Button>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}/p/${portfolio.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('editor_celebration_linkedin', { portfolio_id: portfolio.id })}
                className="block w-full py-2.5 bg-surface border border-border text-small text-text-secondary rounded hover:text-text-primary transition-colors text-center"
              >
                Share on LinkedIn
              </a>
              <button
                onClick={() => setShowPublished(false)}
                className="w-full py-2 text-small text-text-disabled hover:text-text-secondary transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={cn(
          'fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded border shadow-sm text-small animate-slide-up',
          toast.type === 'error'
            ? 'bg-error-subtle border-error-border text-error'
            : 'bg-surface border-border text-text-primary'
        )}>
          {toast.type === 'error' ? <AlertIcon /> : <CheckIcon />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ─── Section wrapper ────────────────────────────────────────
function Section({ label, children, action, sectionKey }: {
  label: string
  children: React.ReactNode
  action?: React.ReactNode
  sectionKey?: string
}) {
  return (
    <div className="flex flex-col gap-2" data-section={sectionKey}>
      <div className="flex items-center justify-between">
        <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">{label}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

function InlineAddButton({ onClick }: { onClick: (e?: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      onClick={e => onClick(e)}
      className="text-micro text-accent hover:text-accent/80 transition-colors"
    >
      + Add
    </button>
  )
}

function InlineRemoveButton({ onClick }: { onClick: (e?: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      onClick={e => onClick(e)}
      className="p-1 text-text-disabled hover:text-error transition-colors"
      aria-label="Remove"
    >
      <XSmallIcon />
    </button>
  )
}

// ─── Inline SVG icons ───────────────────────────────────────
function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className}>
      <path d="M4 10l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function XSmallIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 4.5v3M7 9.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function LockIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <rect x="1.5" y="4.5" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M3 4.5V3a2 2 0 0 1 4 0v1.5" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  )
}

// ─── Score Panel helpers ─────────────────────────────────────
function weaknessTail(msg: string): string {
  if (msg.includes('lack metrics') || msg.includes('metric'))        return 'lacks quantified outcomes.'
  if (msg.includes('action verb') || msg.includes('Start more'))     return 'relies on passive bullet language.'
  if (msg.includes('dollar') || msg.includes('revenue'))             return 'lacks a revenue signal.'
  if (msg.includes('bullet') && msg.includes('experience'))          return 'missing achievement bullets.'
  if (msg.includes('tagline'))                                        return 'tagline is too thin.'
  if (msg.includes('full name') || msg.includes('current role'))     return 'identity fields are incomplete.'
  if (msg.includes('stat'))                                           return 'no supporting stats.'
  if (msg.includes('education'))                                      return 'education is incomplete.'
  if (msg.includes('under 50') || msg.includes('3 bullets per'))     return 'bullets lack depth.'
  if (msg.includes('Too many skills') || msg.includes('15+'))        return 'skills list is oversaturated.'
  if (msg.includes('field') || msg.includes('expertise'))            return 'weak field signal.'
  return 'top dimension is underscored.'
}

function scoreVerdict(score: ScoreBreakdown): string {
  const tail = score.tips.length ? weaknessTail(score.tips[0].message) : null
  const t = score.total
  if (t >= 90) return tail
    ? `Exceptional signal — competitive at senior level, but ${tail}`
    : 'Exceptional signal — likely to generate inbound interest.'
  if (t >= 80) return tail
    ? `Strong signal — competitive for interviews, but ${tail}`
    : 'Strong signal — competitive for target-role interviews.'
  if (t >= 70) return tail
    ? `Credible signal — passes first filter, but ${tail}`
    : 'Credible signal — passes first filter, undifferentiated.'
  if (t >= 60) return tail
    ? `Borderline signal — likely filtered early, and ${tail}`
    : 'Borderline signal — likely filtered early at most targets.'
  if (t >= 50) return tail
    ? `Below benchmark — ${tail}`
    : 'Below benchmark — one focused session can close this gap.'
  return tail
    ? `Not there yet — ${tail}`
    : 'Not there yet — start with your top issue below.'
}

function scoreDiagnosis(score: ScoreBreakdown): string {
  if (!score.tips.length) return 'Signal is optimized — publish and start sharing.'
  const top     = score.tips[0]
  const potential = Math.min(100, score.total + top.impact)
  const next    = [60, 70, 75, 80, 85, 90, 95].find(t => t > score.total)
  if (next && potential >= next)
    return `Addressing your top issue could bring your score to ${next}+.`
  return `Top issue costs −${top.impact} pts. Resolving it puts your signal at ~${potential}.`
}

function tipLabel(msg: string, field = 'cs'): string {
  if (msg.includes('lack metrics') || msg.includes('metric'))          return 'Unquantified outcomes'
  if (msg.includes('action verb') || msg.includes('Start more'))       return 'Passive bullet language'
  if (msg.includes('dollar') || msg.includes('revenue')) {
    if (field === 'design')    return 'No business impact signal'
    if (field === 'finance')   return 'No deal / performance signal'
    if (field === 'marketing') return 'No pipeline / ROI signal'
    return 'No revenue signal'
  }
  if (msg.includes('bullet') && msg.includes('experience'))            return 'No achievement bullets'
  if (msg.includes('Expand your tagline'))                              return 'Tagline too brief'
  if (msg.includes('tagline'))                                          return 'Missing tagline'
  if (msg.includes('full name'))                                        return 'Missing name'
  if (msg.includes('current role'))                                     return 'Missing role title'
  if (msg.includes('stat') && msg.includes('Add'))                     return 'Insufficient stats'
  if (msg.includes('2 work experience'))                                return 'Insufficient experience'
  if (msg.includes('education'))                                        return 'Incomplete education'
  if (msg.includes('5 more skill'))                                     return 'Low skill count'
  if (msg.includes('under 50'))                                         return 'Bullets too brief'
  if (msg.includes('3 bullets per'))                                    return 'Low bullets per role'
  if (msg.includes('duplicate') || msg.includes('similar bullet'))     return 'Duplicate bullets'
  if (msg.includes('Too many skills') || msg.includes('15+'))          return 'Oversaturated skills'
  if (msg.includes('field') || msg.includes('expertise')) {
    if (field === 'design')    return 'Weak design craft signal'
    if (field === 'business')  return 'Weak domain expertise signal'
    if (field === 'finance')   return 'Weak technical finance signal'
    if (field === 'marketing') return 'Weak channel / martech signal'
    return 'Weak field signal'
  }
  return msg.split('.')[0].slice(0, 42)
}

function tipAction(msg: string, field = 'cs'): string {
  if (msg.includes('lack metrics') || msg.includes('metric')) {
    if (field === 'design')    return 'Add user metrics: conversion rate, task completion, NPS improvement'
    if (field === 'business')  return 'Add outcomes: revenue impact, cost reduction, process efficiency'
    if (field === 'finance')   return 'Add deal / portfolio metrics: deal size, returns, AUM, savings'
    if (field === 'marketing') return 'Add campaign metrics: conversion rate, CAC, MQL volume, ROI'
    return 'Add measurable results to at least 2 roles'
  }
  if (msg.includes('action verb') || msg.includes('Start more')) {
    if (field === 'design')    return 'Rewrite openings: Designed, Shipped, Improved, Reduced'
    if (field === 'business')  return 'Rewrite openings: Led, Drove, Streamlined, Negotiated'
    if (field === 'finance')   return 'Rewrite openings: Managed, Analyzed, Structured, Executed'
    if (field === 'marketing') return 'Rewrite openings: Grew, Launched, Drove, Converted'
    return 'Rewrite openings: Led, Built, Shipped, Grew'
  }
  if (msg.includes('dollar') || msg.includes('revenue')) {
    if (field === 'design')    return 'Link one design to a business outcome (conversion, retention, revenue)'
    if (field === 'business')  return 'Add one bullet with a P&L or cost / revenue impact figure'
    if (field === 'finance')   return 'Add one bullet: deal size, fund performance, or cost savings'
    if (field === 'marketing') return 'Add one bullet: pipeline generated, revenue influenced, or ROI'
    return 'Add one bullet with a dollar or revenue figure'
  }
  if (msg.includes('bullet') && msg.includes('experience'))            return 'Add achievement bullets to experience entries'
  if (msg.includes('Expand your tagline'))                              return 'Expand to 50+ chars with a specific result'
  if (msg.includes('tagline'))                                          return 'Write one sentence summarising your impact'
  if (msg.includes('full name'))                                        return 'Add your full name to the identity section'
  if (msg.includes('current role'))                                     return 'Add your current or target role title'
  if (msg.includes('stat') && msg.includes('Add'))                     return 'Add 2+ stats with numeric values and labels'
  if (msg.includes('2 work experience'))                                return 'Add a second work experience entry'
  if (msg.includes('education'))                                        return 'Complete institution, degree, and year fields'
  if (msg.includes('5 more skill'))                                     return 'Add skills until you reach at least 5'
  if (msg.includes('under 50'))                                         return 'Expand short bullets with context and outcome'
  if (msg.includes('3 bullets per'))                                    return 'Add a third bullet to each experience role'
  if (msg.includes('duplicate') || msg.includes('similar bullet'))     return 'Replace duplicates with distinct achievements'
  if (msg.includes('Too many skills') || msg.includes('15+'))          return 'Trim to your 8–12 strongest skills'
  if (msg.includes('field') || msg.includes('expertise')) {
    if (field === 'design')    return 'Add tools (Figma, Sketch), methods (design systems, A/B testing, user research)'
    if (field === 'business')  return 'Add domain expertise: industry knowledge, frameworks (OKRs, Six Sigma), tools'
    if (field === 'finance')   return 'Add technical skills: modelling, Bloomberg, sector expertise, deal types'
    if (field === 'marketing') return 'Add martech stack, channels (SEO, paid, email), and analytics tools'
    return 'Add field-specific skills and terminology'
  }
  return ''
}

function detectionCue(dims: { label: string; pts: number }[]): string {
  if (!dims.length) return 'Detected signal change'
  const { label, pts } = dims[0]
  const dir = pts > 0 ? 'improvement' : 'decline'
  if (label === 'Impact language') return `Detected ${dir} in impact signals`
  if (label === 'Completeness')    return `Detected ${dir} in profile completeness`
  if (label === 'Content depth')   return `Detected ${dir} in content depth`
  if (label === 'Field relevance') return `Detected ${dir} in field alignment`
  if (label === 'Presentation')    return `Detected ${dir} in presentation`
  return `Detected signal ${dir}`
}

function dimActionLabel(label: string, pts: number): string {
  const up = pts > 0
  if (label === 'Impact language') return up ? 'Added measurable outcomes'        : 'Impact signals weakened'
  if (label === 'Completeness')    return up ? 'Filled missing profile fields'    : 'Profile completeness reduced'
  if (label === 'Content depth')   return up ? 'Added depth to experience'        : 'Experience depth reduced'
  if (label === 'Field relevance') return up ? 'Strengthened field alignment'     : 'Field alignment weakened'
  if (label === 'Presentation')    return up ? 'Improved presentation quality'    : 'Presentation quality reduced'
  return label
}

function reinforcementLine(total: number, topLabel: string, topPts: number): string {
  if (total >= 8)  return 'You strengthened your signal significantly.'
  if (total >= 4)  return topLabel === 'Impact language' && topPts > 0
    ? 'Your impact signals are now stronger.'
    : 'You improved your signal meaningfully.'
  if (total > 0)   return 'Small improvement — keep going.'
  if (total <= -4) return 'Signal weakened — review recent changes.'
  if (total < 0)   return 'Small signal reduction detected.'
  return 'No net change in signal strength.'
}

function progressionContext(from: number, to: number): string | null {
  if (to >= 90 && from < 90) return 'Now in exceptional range (90+).'
  if (to >= 80 && from < 80) return 'Now within strong range (80+).'
  if (to >= 70 && from < 70) return 'Signal entered credible range (70+).'
  if (to >= 60 && from < 60) return 'Passed minimum threshold (60+).'
  if (to > from) {
    const next = [60, 70, 75, 80, 85, 90].find(t => t > to)
    if (next) return `${next - to} pts from ${next}+ range.`
  }
  return null
}

function marketVersion(score: ScoreBreakdown): string {
  const { total, impactLanguage, depth, fieldRelevance } = score
  const level    = (total >= 82 && depth >= 15) ? 'senior-level' : (total >= 68 || depth >= 12) ? 'mid-level' : 'junior-level'
  const focus    = impactLanguage / 25 >= 0.7 ? 'impact-driven' : 'execution-focused'
  const position = total >= 85 ? 'competitive for top-tier roles'
    : total >= 75 ? 'at benchmark for most target roles'
    : total >= 65 ? 'below benchmark for top-tier roles'
    : 'below benchmark for most target roles'
  const weakest  = [
    { name: 'impact signals',       r: impactLanguage / 25 },
    { name: 'field alignment',      r: fieldRelevance / 15 },
    { name: 'content depth',        r: depth / 20 },
    { name: 'presentation quality', r: score.presentation / 15 },
  ].sort((a, b) => a.r - b.r)[0]
  const dueTo = total < 85 ? ` due to weak ${weakest.name}` : ''
  return `Reads as a ${level} ${focus} candidate, ${position}${dueTo}.`
}

interface RejectionResult { stage: string; verdict: 'Pass' | 'Borderline' | 'Reject'; reason: string }
function rejectionScenarios(score: ScoreBreakdown): RejectionResult[] {
  const { total, impactLanguage, depth, fieldRelevance, completeness } = score

  // Stage 1 — surface: what's visible in a 12-second scan
  let resume: RejectionResult
  if (completeness < 15)       resume = { stage: 'Resume screen',    verdict: 'Reject',    reason: 'profile incomplete — filtered automatically'               }
  else if (impactLanguage < 8) resume = { stage: 'Resume screen',    verdict: 'Reject',    reason: 'no visible impact signal — passed over in first scan'      }
  else if (total < 65)         resume = { stage: 'Resume screen',    verdict: 'Borderline', reason: 'signal present but thin — outcome depends on applicant volume' }
  else                         resume = { stage: 'Resume screen',    verdict: 'Pass',      reason: 'clear signal — reaches reviewer queue'                     }

  // Stage 2 — structural: ownership, depth, pattern quality
  let hm: RejectionResult
  if (depth < 10)              hm = { stage: 'Hiring manager',    verdict: 'Reject',    reason: 'experience pattern too thin for the target level'          }
  else if (impactLanguage < 13) hm = { stage: 'Hiring manager',   verdict: 'Reject',    reason: 'responsibilities listed, outcomes absent — not compelling' }
  else if (total < 75)          hm = { stage: 'Hiring manager',   verdict: 'Borderline', reason: 'readable — not differentiated from the candidate pool'    }
  else                          hm = { stage: 'Hiring manager',   verdict: 'Pass',      reason: 'ownership and outcomes clearly demonstrated'               }

  // Stage 3 — differentiation: competitive standing against others at this stage
  let interview: RejectionResult
  if (fieldRelevance < 8)      interview = { stage: 'Interview filter', verdict: 'Reject',    reason: 'insufficient domain depth — outcompeted at technical bar'    }
  else if (total < 70)         interview = { stage: 'Interview filter', verdict: 'Borderline', reason: 'unlikely to reach this stage at current signal level'        }
  else if (total >= 80)        interview = { stage: 'Interview filter', verdict: 'Pass',      reason: 'domain signal strong enough to advance to offer stage'       }
  else                         interview = { stage: 'Interview filter', verdict: 'Borderline', reason: 'would proceed — lacks the edge to stand out at this stage'   }

  return [resume, hm, interview]
}

function confidenceSignal(score: ScoreBreakdown): string {
  const weak = [score.completeness / 25, score.impactLanguage / 25, score.depth / 20, score.fieldRelevance / 15, score.presentation / 15]
    .filter(r => r < 0.6).length
  if (weak >= 2) return 'Confidence: high — pattern consistent across scoring dimensions'
  if (weak === 1) return 'Confidence: moderate — gap concentrated in one dimension'
  return 'Confidence: high — no critical gaps detected'
}

function highestImpactFix(score: ScoreBreakdown, field = 'cs'): { action: string; context: string; urgency: string; pts: number } | null {
  if (!score.tips.length) return null
  const top    = score.tips[0]
  const action = tipAction(top.message, field)
  if (!action) return null
  const context = top.category === 'Impact'       ? 'Impact is the largest scoring gap in your breakdown.'
    : top.category === 'Completeness' ? 'Completeness is limiting your baseline signal.'
    : top.category === 'Depth'        ? 'Content depth is below the competitive threshold.'
    : top.category === 'Relevance'    ? 'Field relevance is your weakest dimension.'
    : 'Presentation gaps are reducing your overall score.'
  const urgency = score.total < 75
    ? 'Without this, your profile remains below threshold for most target roles.'
    : score.total < 80
    ? 'Without this, your signal lacks the edge needed for top-tier roles.'
    : ''
  return { action, context, urgency, pts: top.impact }
}

function tipSection(msg: string): string | null {
  if (msg.includes('metric') || msg.includes('action verb') || msg.includes('Start more') || msg.includes('bullet') || msg.includes('revenue')) return 'experience'
  if (msg.includes('full name') || msg.includes('current role') || msg.includes('tagline')) return 'identity'
  if (msg.includes('stat')) return 'stats'
  if (msg.includes('education')) return 'education'
  if (msg.includes('skill') || msg.includes('field') || msg.includes('expertise')) return 'skills'
  return null
}

// ─── Sparkline ────────────────────────────────────────────────
function Sparkline({ points }: { points: number[] }) {
  if (points.length < 3) return null
  const MIN = Math.min(...points) - 2
  const MAX = Math.max(...points) + 2
  const range = MAX - MIN || 1
  const W = 200, H = 32
  const xs = points.map((_, i) => (i / (points.length - 1)) * W)
  const ys = points.map(p => H - ((p - MIN) / range) * H)
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ')
  const last = points[points.length - 1], prev = points[points.length - 2]
  const color = last > prev ? '#166534' : last < prev ? '#991B1B' : '#94A3B8'
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-8" preserveAspectRatio="none" aria-hidden="true">
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="2.5" fill={color} />
    </svg>
  )
}

// ─── Field archetype benchmarks (non-CS fields) ───────────────
const FIELD_ARCHETYPES: Record<string, { name: string; bars: { i: number; d: number; f: number; c: number; p: number } }[]> = {
  design: [
    { name: 'Senior IC bar',      bars: { i: 0.70, d: 0.68, f: 0.70, c: 0.55, p: 0.72 } },
    { name: 'Product design bar', bars: { i: 0.65, d: 0.62, f: 0.72, c: 0.55, p: 0.68 } },
    { name: 'Agency bar',         bars: { i: 0.58, d: 0.60, f: 0.60, c: 0.50, p: 0.65 } },
  ],
  business: [
    { name: 'Top-tier consulting', bars: { i: 0.80, d: 0.75, f: 0.65, c: 0.60, p: 0.65 } },
    { name: 'Ops lead bar',        bars: { i: 0.65, d: 0.70, f: 0.60, c: 0.55, p: 0.58 } },
    { name: 'Series B bar',        bars: { i: 0.62, d: 0.65, f: 0.58, c: 0.55, p: 0.55 } },
  ],
  finance: [
    { name: 'Bulge bracket bar', bars: { i: 0.75, d: 0.72, f: 0.70, c: 0.60, p: 0.62 } },
    { name: 'PE / VC bar',       bars: { i: 0.78, d: 0.75, f: 0.72, c: 0.60, p: 0.60 } },
    { name: 'Big 4 bar',         bars: { i: 0.60, d: 0.65, f: 0.62, c: 0.58, p: 0.58 } },
  ],
  marketing: [
    { name: 'Growth lead bar',    bars: { i: 0.70, d: 0.65, f: 0.68, c: 0.58, p: 0.60 } },
    { name: 'Brand director bar', bars: { i: 0.65, d: 0.62, f: 0.65, c: 0.55, p: 0.68 } },
    { name: 'Content / SEO bar',  bars: { i: 0.55, d: 0.58, f: 0.60, c: 0.50, p: 0.58 } },
  ],
}

function companySignals(score: ScoreBreakdown, field: string = 'cs') {
  type Opp = 'High' | 'Medium' | 'Low'
  const CS_COS = [
    { name: 'Stripe',  bars: { i: 0.72, d: 0.65, f: 0.60, c: 0.55, p: 0.55 } },
    { name: 'Linear',  bars: { i: 0.65, d: 0.72, f: 0.55, c: 0.55, p: 0.55 } },
    { name: 'Figma',   bars: { i: 0.60, d: 0.60, f: 0.65, c: 0.55, p: 0.65 } },
    { name: 'Vercel',  bars: { i: 0.62, d: 0.68, f: 0.68, c: 0.50, p: 0.52 } },
    { name: 'Notion',  bars: { i: 0.55, d: 0.55, f: 0.52, c: 0.55, p: 0.58 } },
    { name: 'Shopify', bars: { i: 0.58, d: 0.60, f: 0.56, c: 0.55, p: 0.52 } },
  ]
  const COS = field === 'cs' ? CS_COS : (FIELD_ARCHETYPES[field] ?? FIELD_ARCHETYPES['business'])
  const u = { i: score.impactLanguage/25, d: score.depth/20, f: score.fieldRelevance/15, c: score.completeness/25, p: score.presentation/15 }
  const W = { i: 3, d: 2, f: 2, c: 1, p: 1 } as const
  const KEYS = ['i','d','f','c','p'] as const
  const WEAK_PHRASE: Record<string,string> = { i:'lack of quantified outcomes', d:'thin experience depth', f:'field signal gaps', c:'incomplete profile sections', p:'presentation gaps' }
  const ACTION:      Record<string,string> = { i:'Add quantified outcomes to roles', d:'Deepen experience entries to meet bar', f:'Strengthen field-specific terminology', c:'Complete missing profile fields', p:'Improve presentation quality' }

  const sorted = COS.map(co => {
    let ws = 0, tw = 0
    for (const k of KEYS) { ws += Math.min(1, u[k] / co.bars[k]) * W[k]; tw += W[k] }
    const fit  = Math.round((ws / tw) * 100)
    const opp: Opp = fit >= 75 ? 'High' : fit >= 52 ? 'Medium' : 'Low'
    const gaps = KEYS.map(k => ({ k, gap: u[k] - co.bars[k] })).sort((a,b) => b.gap - a.gap)
    const bestKey  = gaps[0].k,  bestGap  = gaps[0].gap
    const worstKey = gaps[gaps.length-1].k, worstGap = gaps[gaps.length-1].gap
    const reason = fit >= 80
      ? `Aligned with current signal profile — meets ${co.name} bar`
      : worstGap < -0.12
      ? `${bestGap > 0.05 ? `Strong ${WEAK_PHRASE[bestKey]?.split(' ')[0] ?? 'execution'}` : 'Partial alignment'} — ${WEAK_PHRASE[worstKey]} reduces competitiveness at ${co.name}`
      : `${WEAK_PHRASE[worstKey].charAt(0).toUpperCase()+WEAK_PHRASE[worstKey].slice(1)} slightly below ${co.name} bar`
    const action = fit < 80 ? ACTION[worstKey] : ''
    return { name: co.name, fit, opp, reason, action }
  }).sort((a,b) => b.fit - a.fit).slice(0, 3)

  return sorted.map((s, i) => ({ ...s, isTop: i === 0 }))
}

// ─── Score Panel ─────────────────────────────────────────────
function ScorePanel({ score, liveScore, delta, field, scoreHistory, onScrollToSection, portfolioId }: {
  score: ScoreBreakdown | null
  liveScore: ScoreBreakdown | null
  delta: { total: number; from: number; to: number; dims: { label: string; pts: number }[] } | null
  field: string
  scoreHistory: number[]
  onScrollToSection: (sectionKey: string) => void
  portfolioId: string
}) {
  type ATSOverlay    = { failing: { criterion: string; fix: string | null }[]; quickWins: string[]; verdict: string }
  type MirrorOverlay = { archetype: string; topFix: string; moves: { action: string; location: string }[] }
  const [atsOverlay,    setAtsOverlay]    = useState<ATSOverlay | null>(null)
  const [mirrorOverlay, setMirrorOverlay] = useState<MirrorOverlay | null>(null)

  useEffect(() => {
    if (!portfolioId) return
    try {
      const ats = sessionStorage.getItem('ff_ats_overlay')
      if (ats) {
        const parsed = JSON.parse(ats)
        if (parsed.portfolioId === portfolioId) setAtsOverlay(parsed)
      }
      const mirror = sessionStorage.getItem('ff_mirror_overlay')
      if (mirror) {
        const parsed = JSON.parse(mirror)
        if (parsed.portfolioId === portfolioId) setMirrorOverlay(parsed)
      }
    } catch {}
  }, [portfolioId])

  // Primary display: live score if available, else saved score
  const display = liveScore ?? score
  const isLive  = !!(liveScore && score && liveScore.total !== score.total)

  const CATEGORIES = display ? [
    { label: 'Completeness',  value: display.completeness,  max: 25 },
    { label: 'Impact',        value: display.impactLanguage, max: 25 },
    { label: 'Depth',         value: display.depth,          max: 20 },
    { label: 'Relevance',     value: display.fieldRelevance, max: 15 },
    { label: 'Presentation',  value: display.presentation,   max: 15 },
  ] : []

  const benchmarkLabel = field === 'cs' ? 'Company Signals' : 'Role Benchmarks'

  return (
    <div className="p-5 pb-8">

      {/* ATS overlay — from ATS Autopsy "Fix in editor" */}
      {atsOverlay && (
        <div className="mb-5 border border-warning/30 bg-warning/5 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-micro font-mono text-warning uppercase tracking-widest">ATS · {atsOverlay.verdict}</span>
            <button onClick={() => { setAtsOverlay(null); sessionStorage.removeItem('ff_ats_overlay') }} className="text-micro text-text-disabled hover:text-text-primary">✕</button>
          </div>
          {atsOverlay.failing.slice(0, 3).map((f, i) => (
            <div key={i} className="py-1.5 border-t border-border/50 first:border-0">
              <p className="text-micro font-mono text-text-primary">{f.criterion}</p>
              {f.fix && <p className="text-micro text-text-disabled mt-0.5 leading-relaxed">{f.fix}</p>}
            </div>
          ))}
          {atsOverlay.failing.length > 3 && (
            <p className="text-micro font-mono text-text-disabled mt-1.5">+{atsOverlay.failing.length - 3} more failing</p>
          )}
        </div>
      )}

      {/* Mirror overlay — from Career Mirror "Apply changes" */}
      {mirrorOverlay && (
        <div className="mb-5 border border-accent/20 bg-accent/5 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-micro font-mono text-accent uppercase tracking-widest">Mirror · {mirrorOverlay.archetype}</span>
            <button onClick={() => { setMirrorOverlay(null); sessionStorage.removeItem('ff_mirror_overlay') }} className="text-micro text-text-disabled hover:text-text-primary">✕</button>
          </div>
          <p className="text-micro text-text-secondary leading-relaxed mb-2">{mirrorOverlay.topFix}</p>
          {mirrorOverlay.moves.slice(0, 2).map((m, i) => (
            <div key={i} className="py-1.5 border-t border-border/50">
              <p className="text-micro font-mono text-text-disabled">{m.location}</p>
              <p className="text-micro text-text-secondary mt-0.5">{m.action}</p>
            </div>
          ))}
        </div>
      )}

      {/* Terminal header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-slow shrink-0" />
        <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">
          Signal Analysis // Active
        </span>
        {isLive && (
          <span className="ml-auto text-micro font-mono text-accent uppercase tracking-widest">Live</span>
        )}
      </div>

      {display ? (
        <>
          {/* Score + grade */}
          <div className="flex items-end justify-between animate-slide-up-1">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[5rem] leading-none font-bold text-text-primary tabular-nums">
                {display.total}
              </span>
              {isLive && score && (
                <span className={cn(
                  'text-small font-mono font-bold tabular-nums mb-1',
                  display.total > score.total ? 'text-success' : 'text-error'
                )}>
                  {display.total > score.total ? `+${display.total - score.total}` : display.total - score.total}
                </span>
              )}
              <span className="text-small text-text-disabled mb-1">/100</span>
            </div>
            <span className="font-mono text-[1.5rem] font-bold text-text-primary border border-border px-2.5 py-1 rounded-sm mb-1">
              {display.grade}
            </span>
          </div>

          {/* Verdict */}
          <p className="text-small text-text-secondary mt-2 leading-relaxed animate-slide-up-2">
            {scoreVerdict(display)}
          </p>

          {/* Session sparkline */}
          {scoreHistory.length >= 3 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-micro font-mono text-text-disabled">Your progress this session</span>
                <span className="text-micro font-mono text-text-disabled tabular-nums">
                  {scoreHistory[0]} → {scoreHistory[scoreHistory.length - 1]}
                </span>
              </div>
              <Sparkline points={scoreHistory} />
            </div>
          )}

          {/* Delta */}
          {delta && delta.total !== 0 && (
            <div className={cn(
              'mt-4 rounded border px-4 py-3 flex flex-col gap-2 animate-slide-up-3',
              delta.total > 0
                ? 'bg-success/5 border-success/20'
                : 'bg-error/5 border-error/20'
            )}>
              <div className="flex items-baseline justify-between">
                <span className={cn(
                  'font-mono text-[2rem] leading-none font-bold tabular-nums',
                  delta.total > 0 ? 'text-success' : 'text-error'
                )}>
                  {delta.total > 0 ? `+${delta.total}` : delta.total}
                </span>
                <span className="text-micro font-mono text-text-disabled tabular-nums">
                  {delta.from} → {delta.to}
                </span>
              </div>
              <span className="text-micro font-mono text-text-disabled">{detectionCue(delta.dims)}</span>
              {delta.dims.map(d => (
                <div key={d.label} className="flex items-center justify-between gap-2">
                  <span className="text-micro text-text-secondary">{dimActionLabel(d.label, d.pts)}</span>
                  <span className={cn('text-micro font-mono shrink-0', d.pts > 0 ? 'text-success' : 'text-error')}>
                    {d.pts > 0 ? `+${d.pts}` : d.pts}
                  </span>
                </div>
              ))}
              {delta.dims[0] && (
                <p className="text-micro text-text-secondary border-t border-border/50 pt-2 mt-0.5">
                  {reinforcementLine(delta.total, delta.dims[0].label, delta.dims[0].pts)}
                </p>
              )}
              {progressionContext(delta.from, delta.to) && (
                <p className="text-micro font-mono text-accent">
                  {progressionContext(delta.from, delta.to)}
                </p>
              )}
            </div>
          )}

          {/* Bar */}
          <div className="mt-3 mb-2 h-1 w-full bg-border-subtle rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                display.total >= 80 ? 'bg-success' : display.total >= 60 ? 'bg-accent' : 'bg-warning'
              )}
              style={{ width: `${display.total}%` }}
            />
          </div>

          {/* Diagnosis */}
          <p className="text-micro text-text-secondary mt-3 leading-relaxed">
            {scoreDiagnosis(display)}
          </p>

          {/* ── Breakdown ── */}
          <div className="border-t border-border mt-5 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Breakdown</span>
              <span className="text-micro font-mono text-text-disabled">5 dimensions</span>
            </div>
            <div className="space-y-2">
              {CATEGORIES.map(({ label, value, max }) => {
                const ratio = value / max
                const bar = ratio < 0.5 ? 'bg-warning/70' : ratio < 0.75 ? 'bg-accent/60' : 'bg-success/70'
                return (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-micro font-mono text-text-secondary w-[90px] shrink-0">{label}</span>
                    <div className="flex-1 h-1 bg-border-subtle rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', bar)} style={{ width: `${ratio * 100}%` }} />
                    </div>
                    <span className="text-micro font-mono text-text-disabled tabular-nums w-8 text-right">
                      {value}/{max}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Primary weaknesses ── */}
          {display.tips.length > 0 && (
            <div className="border-t border-border mt-5 pt-4">
              <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-3">Fix These First</span>
              <div className="space-y-4">
                {display.tips.slice(0, 3).map((tip, i) => {
                  const action  = tipAction(tip.message, field)
                  const section = tipSection(tip.message)
                  return (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {i === 0 && (
                            <span className="text-micro font-mono text-accent uppercase tracking-wider shrink-0">↑ ·</span>
                          )}
                          <span className="text-micro text-text-primary">{tipLabel(tip.message, field)}</span>
                        </div>
                        <span className="text-micro font-mono text-error shrink-0">−{tip.impact} pts</span>
                      </div>
                      {action && (
                        <button
                          onClick={() => section && onScrollToSection(section)}
                          className={cn(
                            'text-micro text-left transition-colors',
                            section ? 'text-accent hover:text-accent/80 cursor-pointer' : 'text-text-disabled cursor-default'
                          )}
                        >
                          → {action}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Career Mirror CTA ── */}
          <div className="border-t border-border mt-5 pt-4">
            <Link
              href="/dashboard/intelligence/mirror"
              className="flex items-center justify-between group"
            >
              <div>
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-0.5">Career Mirror</span>
                <span className="text-micro text-text-secondary group-hover:text-text-primary transition-colors">
                  See how a hiring manager reads you →
                </span>
              </div>
              <ChevronRightIcon className="text-text-disabled group-hover:text-text-secondary transition-colors shrink-0" />
            </Link>
          </div>

          {/* ── Rejection simulation ── */}
          <div className="border-t border-border mt-5 pt-4">
            <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-3">Rejection Simulation</span>
            <div className="space-y-2.5">
              {rejectionScenarios(display).map(({ stage, verdict, reason }) => (
                <div key={stage} className="flex flex-col gap-0.5">
                  <span className="text-micro font-mono text-text-disabled">{stage}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className={cn(
                      'text-micro font-mono font-medium shrink-0',
                      verdict === 'Pass' ? 'text-success' : verdict === 'Reject' ? 'text-error' : 'text-warning'
                    )}>
                      {verdict === 'Pass' ? 'Would pass' : verdict === 'Reject' ? 'Rejected' : 'Borderline'}
                    </span>
                    <span className="text-micro text-text-disabled">— {reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Market signal ── */}
          <div className="border-t border-border mt-5 pt-4">
            <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-2">Market Signal</span>
            <p className="text-micro text-text-secondary leading-relaxed">{marketVersion(display)}</p>
          </div>

          {/* ── Highest impact fix ── */}
          {(() => {
            const fix = highestImpactFix(display, field)
            return fix ? (
              <div className="border-t border-border mt-5 pt-4">
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-2">Highest Impact Fix</span>
                <p className="text-micro text-text-secondary leading-relaxed">{fix.action}</p>
                <p className="text-micro text-text-disabled mt-1">{fix.context}</p>
                <p className="text-micro font-mono text-accent mt-1.5">→ expected +{fix.pts} pts</p>
                {fix.urgency && (
                  <p className="text-micro text-text-secondary mt-2">{fix.urgency}</p>
                )}
                <p className="text-micro font-mono text-text-disabled mt-3">{confidenceSignal(display)}</p>
              </div>
            ) : null
          })()}

          {/* ── Company / archetype signals ── */}
          <div className="border-t border-border mt-5 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">{benchmarkLabel}</span>
              <span className="text-micro font-mono text-text-disabled border border-border rounded-sm px-1.5 py-px">Pattern</span>
            </div>
            <div className="space-y-3.5">
              {companySignals(display, field).map(({ name, fit, opp, reason, action, isTop }) => (
                <div key={name} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isTop && <span className="text-micro font-mono text-accent">↑</span>}
                      <span className="text-micro font-mono text-text-primary">{name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-micro font-mono text-text-disabled tabular-nums">{fit}/100</span>
                      <span className={cn(
                        'text-micro font-mono',
                        opp === 'High' ? 'text-success' : opp === 'Medium' ? 'text-warning' : 'text-error'
                      )}>{opp}</span>
                    </div>
                  </div>
                  <span className="text-micro text-text-disabled leading-relaxed">{reason}</span>
                  {action && <span className="text-micro text-text-disabled">→ {action}</span>}
                </div>
              ))}
            </div>
            <p className="text-micro font-mono text-text-disabled mt-3 opacity-60">Pattern model — not live data</p>
          </div>

          {/* Status line */}
          <div className="border-t border-border mt-5 pt-3">
            <span className="text-micro font-mono text-text-disabled">
              {isLive ? 'Live · save to lock in your progress' : '✓ Synced'}
            </span>
          </div>
        </>
      ) : (
        <div className="mt-4 space-y-2">
          {[60, 40, 80, 50].map((w, i) => (
            <div key={i} className={`h-2 rounded-full bg-border-subtle skeleton-bg`} style={{ width: `${w}%` }} />
          ))}
        </div>
      )}
    </div>
  )
}
