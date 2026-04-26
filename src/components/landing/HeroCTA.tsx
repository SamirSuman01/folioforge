'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const LOADING_STEPS = [
  'Scanning for ATS keywords…',
  'Comparing against 500+ Job Descriptions…',
  'Quantifying impact metrics…',
  'Calculating your signal score…',
]

const FOMO_MESSAGES = [
  'Last report 3 min ago · Bengaluru · Free',
  'Last report 6 min ago · Mumbai · Free',
  'Last report 2 min ago · Hyderabad · Free',
  '18,000+ resumes scored · Free',
  '1,200+ students this week · Free',
]

export default function HeroCTA() {
  const router      = useRouter()
  const inflightRef = useRef(false)
  const [loading,     setLoading]     = useState(false)
  const [step,        setStep]        = useState(0)
  const [fomoIndex,   setFomoIndex]   = useState(0)
  const [fomoVisible, setFomoVisible] = useState(true)

  useEffect(() => {
    setFomoIndex(Math.floor(Math.random() * FOMO_MESSAGES.length))
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setFomoVisible(false)
      setTimeout(() => {
        setFomoIndex(i => (i + 1) % FOMO_MESSAGES.length)
        setFomoVisible(true)
      }, 350)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  function handleClick() {
    if (loading || inflightRef.current) return
    inflightRef.current = true
    setLoading(true)
    setStep(0)

    let current = 0
    const interval = setInterval(() => {
      current += 1
      if (current >= LOADING_STEPS.length - 1) {
        clearInterval(interval)
        setStep(LOADING_STEPS.length - 1)
      } else {
        setStep(current)
      }
    }, 480)

    setTimeout(() => {
      clearInterval(interval)
      inflightRef.current = false
      router.push('/onboarding')
      // Hard-navigation fallback: if Next.js router stalls (hydration error,
      // slow network), force a full page load after 4s rather than leaving
      // the user stuck on a loading button forever.
      setTimeout(() => {
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/onboarding')) {
          window.location.href = '/onboarding'
        }
      }, 4000)
    }, 2000)
  }

  return (
    <div>
      <button
        id="hero-cta-btn"
        onClick={handleClick}
        disabled={loading}
        aria-label={loading ? LOADING_STEPS[step] : 'Get your free signal score'}
        className={`ll-btn-primary${loading ? ' ll-btn-primary--loading' : ''}`}
      >
        {loading ? (
          <>
            <span className="ll-btn-spinner" aria-hidden="true" />
            <span className="ll-btn-loading-text">{LOADING_STEPS[step]}</span>
          </>
        ) : (
          <>
            Analyse my resume
            <span className="ll-btn-primary-arrow">→</span>
          </>
        )}
      </button>

      <div
        className={`ll-success-counter${fomoVisible ? '' : ' ll-success-counter--fade'}`}
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="ll-success-dot" aria-hidden="true" />
        {FOMO_MESSAGES[fomoIndex]}
      </div>
    </div>
  )
}
