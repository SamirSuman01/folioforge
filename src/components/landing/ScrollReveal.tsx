'use client'
import { useEffect, useRef } from 'react'

interface Props {
  className?: string
  children:   React.ReactNode
  threshold?: number
}

/* Adds `.vis` to each direct child when it enters the viewport */
export default function ScrollReveal({ className, children, threshold = 0.15 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const targets = Array.from(el.children) as HTMLElement[]
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('vis')
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold }
    )

    targets.forEach(t => obs.observe(t))
    return () => obs.disconnect()
  }, [threshold])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
