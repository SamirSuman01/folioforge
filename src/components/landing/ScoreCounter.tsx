'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  value:     number
  duration?: number
  delay?:    number
  className?: string
}

/* Counts from 0 → value with a cubic ease-out curve,
   triggered once when the element scrolls into view. */
export default function ScoreCounter({ value, duration = 1500, delay = 0, className }: Props) {
  const [display, setDisplay] = useState(0)
  const spanRef = useRef<HTMLSpanElement>(null)
  const hasRun  = useRef(false)

  useEffect(() => {
    const el = spanRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasRun.current) return
        hasRun.current = true
        observer.disconnect()

        setTimeout(() => {
          const start = performance.now()
          function tick(now: number) {
            const p     = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - p, 3)
            setDisplay(Math.round(eased * value))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }, delay)
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [value, duration, delay])

  return <span ref={spanRef} className={className}>{display}</span>
}
