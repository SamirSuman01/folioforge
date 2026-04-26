'use client'
import { useEffect, useRef } from 'react'

export default function Cursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0
    let raf: number

    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY }
    document.addEventListener('mousemove', onMove)

    const animate = () => {
      rx += (mx - rx) * 0.17
      ry += (my - ry) * 0.17
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mx - 4.5}px, ${my - 4.5}px, 0)`
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx - 17}px, ${ry - 17}px, 0)`
      }
      raf = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div ref={dotRef}  className="ld-cursor" />
      <div ref={ringRef} className="ld-cursor-ring" />
    </>
  )
}
