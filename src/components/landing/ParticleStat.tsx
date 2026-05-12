'use client'

import { useEffect, useRef } from 'react'

const TOTAL  = 1000
const PASSED = 250  // 25% reach a human

interface Particle {
  x: number; y: number
  tx: number; ty: number
  vx: number; vy: number
  alpha: number
  size: number
  live: boolean
}

export default function ParticleStat() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef  = useRef<'idle' | 'animating' | 'done'>('idle')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const dpr = window.devicePixelRatio || 1
    let W = 0, H = 0
    const particles: Particle[] = []
    let raf = 0
    let triggered = false

    function resize() {
      const rect = canvas!.getBoundingClientRect()
      W = rect.width;  H = rect.height
      canvas!.width  = W * dpr
      canvas!.height = H * dpr
      ctx.scale(dpr, dpr)
      buildParticles()
    }

    function buildParticles() {
      particles.length = 0
      const cols = Math.ceil(Math.sqrt(TOTAL * (W / H)))
      const rows = Math.ceil(TOTAL / cols)
      const cellW = W / cols
      const cellH = H / rows

      for (let i = 0; i < TOTAL; i++) {
        const col = i % cols
        const row = Math.floor(i / cols)
        const tx  = col * cellW + cellW / 2 + (Math.random() - 0.5) * cellW * 0.4
        const ty  = row * cellH + cellH / 2 + (Math.random() - 0.5) * cellH * 0.4
        particles.push({
          x: tx + (Math.random() - 0.5) * W * 0.5,
          y: ty + (Math.random() - 0.5) * H * 0.5,
          tx, ty,
          vx: 0, vy: 0,
          alpha: 0,
          size:  1.5 + Math.random() * 1,
          live:  i < PASSED,
        })
      }
    }

    function drawFrame(t: number) {
      ctx.clearRect(0, 0, W, H)

      let settled = 0
      for (const p of particles) {
        const dx = p.tx - p.x
        const dy = p.ty - p.y
        p.vx = p.vx * 0.8 + dx * 0.06
        p.vy = p.vy * 0.8 + dy * 0.06
        p.x += p.vx
        p.y += p.vy
        p.alpha = Math.min(1, p.alpha + 0.025)

        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) settled++

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)

        if (p.live) {
          // Pulsing blue — the ones that make it through
          const pulse = 0.7 + 0.3 * Math.sin(t * 0.002 + p.tx)
          ctx.fillStyle = `rgba(27,79,216,${p.alpha * pulse})`
        } else {
          ctx.fillStyle = `rgba(140,140,160,${p.alpha * 0.35})`
        }
        ctx.fill()
      }

      if (settled < TOTAL - 10) {
        raf = requestAnimationFrame(drawFrame)
      } else {
        stateRef.current = 'done'
      }
    }

    function trigger() {
      if (triggered) return
      triggered = true
      stateRef.current = 'animating'
      raf = requestAnimationFrame(drawFrame)
    }

    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) trigger() },
      { threshold: 0.3 }
    )

    resize()
    observer.observe(canvas)
    window.addEventListener('resize', resize)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: 180 }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        aria-hidden="true"
      />
      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 8, right: 0,
        display: 'flex', gap: 16, fontFamily: 'var(--font-geist-mono, monospace)',
        fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#8C8CA0' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(140,140,160,0.5)', display: 'inline-block' }} />
          Filtered (75%)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#1B4FD8' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1B4FD8', display: 'inline-block' }} />
          Reach human (25%)
        </span>
      </div>
    </div>
  )
}
