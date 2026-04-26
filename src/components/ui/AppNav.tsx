'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

interface AppNavProps {
  userName?: string
  userInitial?: string
}

export default function AppNav({ userName, userInitial }: AppNavProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navLinks = [
    { href: '/dashboard',                         label: 'Portfolios'   },
    { href: '/dashboard/applications',            label: 'Pipeline'     },
    { href: '/dashboard/intelligence/mirror',     label: 'Mirror'       },
    { href: '/dashboard/intelligence/ghost',      label: 'Ghost'        },
    { href: '/dashboard/intelligence/ats',        label: 'ATS'          },
    { href: '/dashboard/intelligence/offer',      label: 'Offer'        },
    { href: '/dashboard/analytics',               label: 'Analytics'    },
    { href: '/dashboard/score',                   label: 'Timeline'     },
  ]

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background">
      {/* Main bar */}
      <div className="mx-auto flex h-12 max-w-4xl items-center justify-between px-6 lg:px-8">

        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-text-primary hover:text-accent transition-colors duration-fast shrink-0"
        >
          <span className="text-micro font-mono font-semibold tracking-widest uppercase text-accent">FF</span>
          <span className="text-micro font-mono text-text-disabled">·</span>
          <span className="text-small font-medium">ForgeFolio</span>
        </Link>

        {/* Desktop nav links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map(link => {
            const active = pathname === link.href ||
              (link.href !== '/dashboard' && link.href !== '/dashboard/intelligence' && pathname.startsWith(link.href + '/'))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-1.5 text-micro font-mono transition-colors duration-fast rounded-sm',
                  active
                    ? 'text-text-primary bg-border-subtle'
                    : 'text-text-disabled hover:text-text-secondary'
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Sign out — desktop only */}
          <button
            onClick={handleSignOut}
            className="hidden md:block text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors duration-fast"
          >
            Sign out
          </button>

          {/* Avatar / settings */}
          <Link
            href="/dashboard/settings"
            className="h-6 w-6 rounded-full border border-border flex items-center justify-center text-micro font-mono text-text-secondary hover:border-accent hover:text-accent transition-colors duration-fast"
            aria-label="Settings"
            title="Settings"
          >
            {userInitial ?? '?'}
          </Link>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden flex flex-col gap-[4px] items-center justify-center w-7 h-7 text-text-secondary hover:text-text-primary transition-colors"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className={cn('block h-px w-5 bg-current transition-all duration-200', menuOpen && 'translate-y-[5px] rotate-45')} />
            <span className={cn('block h-px w-5 bg-current transition-all duration-200', menuOpen && 'opacity-0')} />
            <span className={cn('block h-px w-5 bg-current transition-all duration-200', menuOpen && '-translate-y-[5px] -rotate-45')} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="mx-auto max-w-4xl px-6 py-3 flex flex-col gap-0.5">
            {navLinks.map(link => {
              const active = pathname === link.href ||
                (link.href !== '/dashboard' && link.href !== '/dashboard/intelligence' && pathname.startsWith(link.href + '/'))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'px-3 py-2.5 text-small font-mono transition-colors duration-fast rounded-sm',
                    active
                      ? 'text-text-primary bg-border-subtle'
                      : 'text-text-disabled hover:text-text-secondary'
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
            <div className="mt-2 pt-2 border-t border-border">
              <button
                onClick={handleSignOut}
                className="px-3 py-2.5 text-small font-mono text-text-disabled hover:text-text-secondary transition-colors w-full text-left"
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

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
