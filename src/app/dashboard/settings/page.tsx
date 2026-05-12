'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Tab = 'profile' | 'security' | 'account'

export default function SettingsPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [tab,             setTab]             = useState<Tab>('profile')
  const [fullName,        setFullName]        = useState('')
  const [college,         setCollege]         = useState('')
  const [email,           setEmail]           = useState('')
  const [userInitial,     setUserInitial]     = useState('?')
  const [profileUsername, setProfileUsername] = useState<string | null>(null)
  const [saving,          setSaving]          = useState(false)
  const [toast,           setToast]           = useState<string | null>(null)
  const [deleteInput,     setDeleteInput]     = useState('')
  const [deleting,        setDeleting]        = useState(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(msg)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current) }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/auth/login'); return }
        const name = user.user_metadata?.full_name as string ?? ''
        setFullName(name)
        setCollege(user.user_metadata?.college as string ?? '')
        setEmail(user.email ?? '')
        setUserInitial((name || user.email || '?')[0].toUpperCase())
        const res = await fetch('/api/profile')
        if (res.ok) {
          const profile = await res.json()
          if (profile.username) setProfileUsername(profile.username)
        }
      } catch {
        // Network failure on load — page still renders with empty fields
        console.error('[settings] Failed to load user data')
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveProfile() {
    setSaving(true)
    try {
      const [{ error }, profileRes] = await Promise.all([
        supabase.auth.updateUser({
          data: { full_name: fullName, college: college.trim() || null },
        }),
        fetch('/api/profile', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ full_name: fullName, college: college.trim() || null }),
        }),
      ])
      if (error) {
        showToast('Failed to save: ' + error.message)
      } else {
        if (profileRes.ok) {
          const p = await profileRes.json()
          if (p.username) setProfileUsername(p.username)
        }
        showToast('Profile updated')
      }
    } catch {
      showToast('Failed to save — check your connection.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteInput !== 'DELETE') return
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        showToast(body.error ?? 'Deletion failed — please try again or contact support.')
        setDeleting(false)
        return
      }
      // Server deleted the auth user; sign out locally and redirect
      await supabase.auth.signOut()
      router.push('/?deleted=true')
    } catch {
      showToast('Network error — please try again.')
      setDeleting(false)
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'profile',  label: 'Profile'  },
    { id: 'security', label: 'Security' },
    { id: 'account',  label: 'Account'  },
  ]

  return (
    <div className="min-h-screen bg-background">

      <main className="mx-auto max-w-3xl px-5 py-10 lg:px-8">

        {/* Header */}
        <div className="mb-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-micro font-mono text-text-disabled hover:text-text-secondary transition-colors mb-8"
          >
            ← Dashboard
          </Link>
          <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-1">Account</span>
          <h1 className="text-h3 font-bold text-text-primary tracking-tight">Settings</h1>
        </div>

        {/* Tab nav */}
        <div className="flex items-center gap-6 border-b border-border mb-10">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'pb-3 text-micro font-mono uppercase tracking-widest transition-colors border-b-2 -mb-px',
                tab === t.id
                  ? 'border-accent text-text-primary'
                  : 'border-transparent text-text-disabled hover:text-text-secondary'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Profile tab ── */}
        {tab === 'profile' && (
          <div className="flex flex-col gap-8 max-w-sm animate-slide-up-1">
            <div className="flex flex-col gap-6 divide-y divide-border">
              <div className="flex flex-col gap-4">
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Display name</span>
                <Input
                  label="Full name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your name"
                />
                <p className="text-micro text-text-disabled">Shown on your portfolio and public pages.</p>
              </div>

              <div className="pt-6 flex flex-col gap-4">
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">College / University</span>
                <Input
                  label="Institution"
                  value={college}
                  onChange={e => setCollege(e.target.value)}
                  placeholder="VIT Vellore, KIIT, SRM, NIT Trichy, IIT Bombay…"
                />
                <p className="text-micro text-text-disabled">
                  Used to compare your score against your cohort.
                </p>
              </div>

              <div className="pt-6 flex flex-col gap-1.5">
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-2">Email address</span>
                <p className="text-small text-text-primary font-mono">{email}</p>
                <p className="text-micro text-text-disabled">
                  To change your email, contact{' '}
                  <a href="mailto:support@forgefolio.com" className="text-accent hover:underline">support@forgefolio.com</a>
                </p>
              </div>

              <div className="pt-6 flex flex-col gap-1.5">
                <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-2">Profile URL</span>
                {profileUsername ? (
                  <>
                    <p className="text-small text-text-primary font-mono">
                      {(process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgefolio.com').replace(/^https?:\/\//, '')}/u/{profileUsername}
                    </p>
                    <p className="text-micro text-text-disabled">
                      Permanent — stays the same even if you swap portfolios.
                    </p>
                  </>
                ) : (
                  <p className="text-micro text-text-disabled">
                    Save your name above to claim your profile URL.
                  </p>
                )}
              </div>
            </div>

            <Button
              size="md"
              onClick={saveProfile}
              loading={saving}
              disabled={!fullName.trim()}
              className="self-start"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        )}

        {/* ── Security tab ── */}
        {tab === 'security' && (
          <div className="flex flex-col divide-y divide-border max-w-sm animate-slide-up-1">
            <div className="pb-8 flex flex-col gap-4">
              <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Password</span>
              <p className="text-small text-text-secondary">
                Send a reset link to your email to set a new password.
              </p>
              <div>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (!user?.email) return
                    await supabase.auth.resetPasswordForEmail(user.email, {
                      redirectTo: `${window.location.origin}/auth/update-password`,
                    })
                    showToast('Reset link sent — check your inbox')
                  }}
                >
                  Send password reset link
                </Button>
              </div>
            </div>

            <div className="pt-8 flex flex-col gap-4">
              <span className="text-micro font-mono text-text-disabled uppercase tracking-widest">Sessions</span>
              <p className="text-small text-text-secondary">
                Sign out of all active sessions on all devices.
              </p>
              <div>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={async () => {
                    await supabase.auth.signOut({ scope: 'global' })
                    router.push('/auth/login')
                  }}
                >
                  Sign out everywhere
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Account tab ── */}
        {tab === 'account' && (
          <div className="flex flex-col divide-y divide-border max-w-sm animate-slide-up-1">
            <div className="pb-8 flex flex-col gap-2">
              <span className="text-micro font-mono text-text-disabled uppercase tracking-widest block mb-2">Data export</span>
              <p className="text-small text-text-secondary">
                Export portfolios as PDF from the editor. Full data export coming soon.
              </p>
            </div>

            <div className="pt-8 flex flex-col gap-4">
              <div>
                <span className="text-micro font-mono text-error uppercase tracking-widest block mb-2">Danger zone</span>
                <p className="text-small text-text-secondary">
                  Permanently deletes your account and all portfolios. This cannot be undone.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Input
                  placeholder='Type "DELETE" to confirm'
                  value={deleteInput}
                  onChange={e => setDeleteInput(e.target.value)}
                />
                <Button
                  variant="destructive"
                  size="md"
                  disabled={deleteInput !== 'DELETE' || deleting}
                  loading={deleting}
                  onClick={handleDeleteAccount}
                >
                  Delete my account
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2.5 border border-border bg-background text-micro font-mono text-text-primary animate-slide-up-1">
          <CheckIcon />
          {toast}
        </div>
      )}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
