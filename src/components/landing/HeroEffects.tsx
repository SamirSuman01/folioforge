'use client'

import { useEffect } from 'react'

export default function HeroEffects() {
  // Magnetic CTA + 3D card tilt — desktop only
  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return

    const btn  = document.getElementById('hero-cta-btn') as HTMLElement | null
    const card = document.querySelector('.ll-signal-card')  as HTMLElement | null

    // Jitter buffer — only engage magnetic effect after 40ms of intentional hover,
    // prevents UI flicker when cursor sweeps past the button
    let magnetTimer:   ReturnType<typeof setTimeout> | null = null
    let magnetEngaged  = false

    function onMouseMove(e: MouseEvent) {
      // ── Magnetic CTA ──────────────────────────────────
      if (btn) {
        const r  = btn.getBoundingClientRect()
        const cx = r.left + r.width  / 2
        const cy = r.top  + r.height / 2
        const dx = e.clientX - cx
        const dy = e.clientY - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        const radius = 80

        if (dist < radius) {
          // Start the intentional-pause timer once when cursor enters zone
          if (!magnetEngaged && !magnetTimer) {
            magnetTimer = setTimeout(() => {
              magnetEngaged = true
              magnetTimer   = null
            }, 40)
          }
          if (magnetEngaged) {
            const pull = 1 - dist / radius
            btn.style.transform = `translate(${dx * pull * 0.22}px, ${dy * pull * 0.22}px) scale(1.02)`
          }
        } else {
          // Cursor left zone — cancel pending timer and reset state
          if (magnetTimer) { clearTimeout(magnetTimer); magnetTimer = null }
          magnetEngaged       = false
          btn.style.transform = ''
        }
      }

      // ── 3D card tilt ──────────────────────────────────
      if (card) {
        const r      = card.getBoundingClientRect()
        const margin = 140
        const inZone =
          e.clientX > r.left  - margin &&
          e.clientX < r.right + margin &&
          e.clientY > r.top   - margin &&
          e.clientY < r.bottom + margin

        if (inZone) {
          const dx = (e.clientX - (r.left + r.width  / 2)) / (r.width  / 2)
          const dy = (e.clientY - (r.top  + r.height / 2)) / (r.height / 2)
          card.style.transform = `perspective(900px) rotateX(${-dy * 4}deg) rotateY(${dx * 6}deg)`
        } else {
          card.style.transform = ''
        }
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    return () => document.removeEventListener('mousemove', onMouseMove)
  }, [])

  // Mobile scroll-triggered card entrance
  useEffect(() => {
    if (!window.matchMedia('(max-width: 768px)').matches) return

    const heroRight = document.querySelector('.ll-hero-right') as HTMLElement | null
    if (!heroRight) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          heroRight.classList.add('ll-mobile-visible')
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(heroRight)
    return () => observer.disconnect()
  }, [])

  return null
}
