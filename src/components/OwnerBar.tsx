'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/funnel'

interface Props {
  portfolioId:     string
  portfolioUserId: string
  slug:            string
  viewCount:       number
}

export default function OwnerBar({ portfolioId, portfolioUserId, slug, viewCount }: Props) {
  const [isOwner, setIsOwner] = useState(false)
  const [copied,  setCopied]  = useState(false)
  const supabase       = createClient()
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id === portfolioUserId) {
        setIsOwner(true)
        track('portfolio_owner_view', { portfolio_id: portfolioId, view_count: viewCount })
      }
    }
    check()
  }, [portfolioUserId, supabase.auth])

  if (!isOwner) return null

  function handleCopy() {
    navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`).then(() => {
      setCopied(true)
      track('portfolio_owner_copy_link', { portfolio_id: portfolioId })
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 no-print animate-fade-in">
      <div className="flex items-center gap-1 px-3 py-2 bg-background/95 backdrop-blur-sm border border-border rounded-full">

        {/* View count */}
        <span className="text-micro text-text-disabled tabular-nums px-2">
          {viewCount === 0 ? 'No views yet' : viewCount === 1 ? '1 person viewed' : `${viewCount} people viewed`}
        </span>

        <div className="w-px h-3 bg-border mx-1" />

        {/* Edit */}
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/editor/${portfolioId}`} className="flex items-center gap-1">
            <PencilIcon />
            Edit
          </Link>
        </Button>

        {/* Analytics */}
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/analytics?id=${portfolioId}`} className="flex items-center gap-1">
            <BarChartIcon />
            Analytics
          </Link>
        </Button>

        {/* Copy link */}
        <Button variant="ghost" size="sm" onClick={handleCopy} className="flex items-center gap-1">
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? 'Copied!' : 'Copy link'}
        </Button>

        {/* Score badge */}
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/badge/${slug}`} target="_blank" rel="noopener" className="flex items-center gap-1">
            <BadgeIcon />
            Badge
          </Link>
        </Button>
      </div>
    </div>
  )
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M7.5 2l2.5 2.5-6 6H1.5V7L7.5 2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function BarChartIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="1" y="7" width="2.5" height="4" rx="0.5" fill="currentColor"/>
      <rect x="4.75" y="4" width="2.5" height="7" rx="0.5" fill="currentColor"/>
      <rect x="8.5" y="1" width="2.5" height="10" rx="0.5" fill="currentColor"/>
    </svg>
  )
}
function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M2 8H1.5A.5.5 0 0 1 1 7.5v-6A.5.5 0 0 1 1.5 1h6a.5.5 0 0 1 .5.5V2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function BadgeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4 6l1.5 1.5L8 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
