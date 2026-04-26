'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export default function StickyBar() {
  const [visible,   setVisible]   = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const dismissedRef = useRef(false)

  useEffect(() => {
    function onScroll() {
      if (dismissedRef.current) return
      const total = document.documentElement.scrollHeight - window.innerHeight
      if (total <= 0) return
      setVisible(window.scrollY / total > 0.55)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function dismiss() {
    dismissedRef.current = true
    setDismissed(true)
    setVisible(false)
  }

  if (dismissed) return null

  return (
    <div
      className={`ll-sticky-bar${visible ? ' ll-sticky-bar--vis' : ''}`}
      aria-hidden={!visible}
      role="complementary"
      aria-label="Quick score CTA"
    >
      <div className="ll-sticky-inner">
        <div className="ll-sticky-social">
          <span className="ll-status-dot" aria-hidden="true" />
          <span className="ll-sticky-count">18,000+ engineers scored</span>
        </div>

        <Link
          href="/onboarding"
          className="ll-sticky-cta"
          tabIndex={visible ? 0 : -1}
        >
          Score my resume free
          <span className="ll-sticky-arrow" aria-hidden="true">→</span>
        </Link>

        <div className="ll-sticky-right">
          <span className="ll-sticky-meta">Free · 60 seconds · No account</span>
          <button
            className="ll-sticky-dismiss"
            onClick={dismiss}
            aria-label="Dismiss bar"
            tabIndex={visible ? 0 : -1}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
