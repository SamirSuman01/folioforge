'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

// ─── Nav structure ─────────────────────────────────────────
const mainNav = [
  { href: '/dashboard',              label: 'Home',      exact: true, icon: HomeIcon     },
  { href: '/dashboard/applications', label: 'Pipeline',  exact: false, icon: PipelineIcon },
  { href: '/dashboard/analytics',    label: 'Analytics', exact: false, icon: AnalyticsIcon},
  { href: '/dashboard/score',        label: 'Timeline',  exact: false, icon: TimelineIcon },
]

const intelNav = [
  { href: '/dashboard/intelligence/mirror', label: 'Career Mirror',  icon: MirrorIcon },
  { href: '/dashboard/intelligence/ats',    label: 'ATS Filter',     icon: FilterIcon },
  { href: '/dashboard/intelligence/ghost',  label: 'Ghost Detector', icon: GhostIcon  },
  { href: '/dashboard/intelligence/offer',  label: 'Offer Analyzer', icon: OfferIcon  },
]

function cn(...c: (string | boolean | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

// ─── Component ────────────────────────────────────────────
export default function DashboardSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [userName,    setUserName]    = useState('')
  const [userInitial, setUserInitial] = useState('?')
  const [mobileOpen,  setMobileOpen]  = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const full = (user.user_metadata?.full_name as string) ?? ''
      const name = full || user.email?.split('@')[0] || 'User'
      setUserName(name)
      setUserInitial(name[0]?.toUpperCase() ?? '?')
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function NavLink({ href, label, exact, icon: Icon }: { href: string; label: string; exact: boolean; icon: () => JSX.Element }) {
    const active = exact ? pathname === href : pathname.startsWith(href)
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
          active
            ? 'bg-white/10 text-white font-medium'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        )}
      >
        <span className={cn('shrink-0', active ? 'text-white' : 'text-slate-500')}>
          <Icon />
        </span>
        {label}
      </Link>
    )
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/8 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={() => setMobileOpen(false)}>
          <div className="h-8 w-8 rounded-lg bg-[#1E3A8A] flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-xs font-black text-white tracking-tight leading-none">FF</span>
          </div>
          <span className="text-sm font-semibold text-white group-hover:text-slate-300 transition-colors">
            ForgeFolio
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {mainNav.map(item => (
          <NavLink key={item.href} {...item} />
        ))}

        {/* Intelligence group */}
        <div className="pt-4">
          <p className="px-3 pb-1.5 text-[10px] font-mono text-slate-600 uppercase tracking-widest">
            Intelligence
          </p>
          {intelNav.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                  active
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <span className={cn('shrink-0', active ? 'text-white' : 'text-slate-500')}>
                  <Icon />
                </span>
                {label}
              </Link>
            )
          })}
        </div>

        {/* Settings */}
        <div className="pt-4">
          {(() => {
            const active = pathname === '/dashboard/settings'
            return (
              <Link
                href="/dashboard/settings"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                  active
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <span className={cn('shrink-0', active ? 'text-white' : 'text-slate-500')}>
                  <SettingsIcon />
                </span>
                Settings
              </Link>
            )
          })()}
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-white/8 p-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName || '—'}</p>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors p-1 rounded"
          >
            <SignOutIcon />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar — fixed */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-56 flex-col bg-[#0F172A] z-40">
        {sidebarContent}
      </aside>

      {/* Mobile: top bar + drawer */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-[#0F172A] flex items-center justify-between px-4 border-b border-white/8">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-[#1E3A8A] flex items-center justify-center">
            <span className="text-[10px] font-black text-white">FF</span>
          </div>
          <span className="text-sm font-semibold text-white">ForgeFolio</span>
        </Link>
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="flex flex-col gap-1.5 items-center justify-center w-8 h-8 text-slate-400 hover:text-white"
          aria-label="Toggle menu"
        >
          <span className={cn('block h-px w-5 bg-current transition-all duration-200', mobileOpen && 'translate-y-[7px] rotate-45')} />
          <span className={cn('block h-px w-5 bg-current transition-all duration-200', mobileOpen && 'opacity-0')} />
          <span className={cn('block h-px w-5 bg-current transition-all duration-200', mobileOpen && '-translate-y-[7px] -rotate-45')} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <div className="w-56 bg-[#0F172A] flex flex-col pt-14">
            {sidebarContent}
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  )
}

// ─── Icons (16×16) ────────────────────────────────────────
function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M6 15V9h4v6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  )
}
function PipelineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="3" width="14" height="2.5" rx="1.25" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="1" y="7" width="10" height="2.5" rx="1.25" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="1" y="11" width="6" height="2.5" rx="1.25" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  )
}
function AnalyticsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 12L5.5 8l3 3L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="13" cy="4" r="1.5" fill="currentColor"/>
    </svg>
  )
}
function TimelineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function MirrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M3 14c0-2.2 2.2-4 5-4s5 1.8 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}
function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}
function GhostIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 8.5V7a4 4 0 0 1 8 0v7l-2-1.5-2 1.5-2-1.5-2 1.5V8.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <circle cx="6.5" cy="8" r="0.8" fill="currentColor"/>
      <circle cx="9.5" cy="8" r="0.8" fill="currentColor"/>
    </svg>
  )
}
function OfferIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 11.5l4-4 3 3 5-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.5 3.5H14v2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}
function SignOutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M6 2H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3M10 11l3-3.5L10 4M13 7.5H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
