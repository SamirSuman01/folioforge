'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

interface AppNavProps {
  userName?: string
  userInitial?: string
}

const intelligenceTools = [
  { href: '/dashboard/intelligence/mirror', label: 'Career Mirror',   desc: 'How recruiters read you'    },
  { href: '/dashboard/intelligence/ats',    label: 'ATS Filter',      desc: 'See what fails the scan'    },
  { href: '/dashboard/intelligence/ghost',  label: 'Ghost Detector',  desc: 'Is this job actually real?' },
  { href: '/dashboard/intelligence/offer',  label: 'Offer Analyzer',  desc: 'Is the salary fair?'        },
]

const topLinks = [
  { href: '/dashboard',              label: 'Home'      },
  { href: '/dashboard/applications', label: 'Pipeline'  },
  { href: '/dashboard/analytics',    label: 'Analytics' },
  { href: '/dashboard/score',        label: 'Timeline'  },
]

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export default function AppNav({ userInitial }: AppNavProps) {
  const router    = useRouter()
  const pathname  = usePathname()
  const supabase  = createClient()
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [intelOpen, setIntelOpen] = useState(false)
  const intelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (intelRef.current && !intelRef.current.contains(e.target as Node)) {
        setIntelOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isIntelActive = intelligenceTools.some(t => pathname.startsWith(t.href))

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6 lg:px-8">

        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <div className="h-7 w-7 rounded-md bg-accent flex items-center justify-center shrink-0">
            <span className="text-[11px] font-black text-white tracking-tight leading-none">FF</span>
          </div>
          <span className="text-[15px] font-semibold text-text-primary group-hover:text-accent transition-colors hidden sm:block">
            ForgeFolio
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {topLinks.map(link => {
            const active = link.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors',
                  active
                    ? 'text-text-primary bg-border-subtle'
                    : 'text-text-secondary hover:text-text-primary hover:bg-border-subtle/60'
                )}
              >
                {link.label}
              </Link>
            )
          })}

          {/* Intelligence dropdown */}
          <div ref={intelRef} className="relative">
            <button
              onClick={() => setIntelOpen(o => !o)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors',
                isIntelActive || intelOpen
                  ? 'text-text-primary bg-border-subtle'
                  : 'text-text-secondary hover:text-text-primary hover:bg-border-subtle/60'
              )}
            >
              Intelligence
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                className={cn('transition-transform duration-150 opacity-50', intelOpen && 'rotate-180')}
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {intelOpen && (
              <div className="absolute top-[calc(100%+6px)] left-0 w-60 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50">
                {intelligenceTools.map(tool => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setIntelOpen(false)}
                    className={cn(
                      'flex flex-col gap-0.5 px-4 py-3 hover:bg-border-subtle transition-colors',
                      'border-b border-border/50 last:border-0',
                      pathname.startsWith(tool.href) && 'bg-border-subtle'
                    )}
                  >
                    <span className="text-sm font-medium text-text-primary">{tool.label}</span>
                    <span className="text-xs text-text-disabled">{tool.desc}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSignOut}
            className="hidden md:block text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Sign out
          </button>

          <Link
            href="/dashboard/settings"
            className="h-7 w-7 rounded-full border border-border flex items-center justify-center text-xs font-bold text-text-secondary hover:border-accent hover:text-accent transition-colors"
            aria-label="Settings"
          >
            {userInitial ?? '?'}
          </Link>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden flex flex-col gap-1.5 items-center justify-center w-8 h-8 text-text-secondary hover:text-text-primary"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <span className={cn('block h-px w-5 bg-current transition-all duration-200', menuOpen && 'translate-y-[7px] rotate-45')} />
            <span className={cn('block h-px w-5 bg-current transition-all duration-200', menuOpen && 'opacity-0')} />
            <span className={cn('block h-px w-5 bg-current transition-all duration-200', menuOpen && '-translate-y-[7px] -rotate-45')} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="mx-auto max-w-5xl px-6 py-3 flex flex-col gap-0.5">
            {topLinks.map(link => {
              const active = link.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                    active
                      ? 'text-text-primary bg-border-subtle'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {link.label}
                </Link>
              )
            })}

            <div className="mt-2 pt-3 border-t border-border">
              <p className="px-3 mb-1 text-[10px] font-mono text-text-disabled uppercase tracking-widest">
                Intelligence
              </p>
              {intelligenceTools.map(tool => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'px-3 py-2.5 text-sm font-medium rounded-md transition-colors block',
                    pathname.startsWith(tool.href)
                      ? 'text-text-primary bg-border-subtle'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {tool.label}
                </Link>
              ))}
            </div>

            <div className="mt-2 pt-3 border-t border-border">
              <button
                onClick={handleSignOut}
                className="px-3 py-2.5 text-sm text-text-disabled hover:text-text-secondary transition-colors w-full text-left"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
