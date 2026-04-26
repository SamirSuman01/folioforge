'use client'

import { useEffect } from 'react'

export default function NavScroll() {
  useEffect(() => {
    const nav = document.querySelector('.ll-nav')
    if (!nav) return

    function onScroll() {
      nav!.classList.toggle('ll-nav-scrolled', window.scrollY > 48)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return null
}
