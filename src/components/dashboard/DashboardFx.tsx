'use client'

import { useEffect } from 'react'

// Feeds the pointer position to the hovered card as --mx/--my for the CSS spotlight.
// One delegated listener for the whole dashboard; only fine pointers with hover.
export default function DashboardFx({ selector }: { selector: string }) {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let frame = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const card = (e.target as Element | null)?.closest?.<HTMLElement>(selector)
        if (!card) return
        const r = card.getBoundingClientRect()
        card.style.setProperty('--mx', `${e.clientX - r.left}px`)
        card.style.setProperty('--my', `${e.clientY - r.top}px`)
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
    }
  }, [selector])

  return null
}
