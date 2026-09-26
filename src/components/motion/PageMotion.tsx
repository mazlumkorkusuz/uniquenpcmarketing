'use client'

import { useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const EASE = 'power3.out'
const MAX_BLOCKS = 16
const MAX_STAGGER_TOTAL = 0.3 // seconds: the last block starts no later than this

// A wrapper that only groups content (no surface of its own) is expanded into its children,
// so a stat grid staggers card by card instead of arriving as one slab.
function isWrapper(el: Element): boolean {
  if (el.children.length < 2) return false
  if (/^(TABLE|THEAD|TBODY|UL|OL|FORM|SVG|NAV|HEADER|H[1-6]|P|A|BUTTON)$/.test(el.tagName)) return false
  const cs = getComputedStyle(el)
  const transparent = cs.backgroundColor === 'rgba(0, 0, 0, 0)' && cs.backgroundImage === 'none'
  return transparent && cs.boxShadow === 'none' && parseFloat(cs.borderTopWidth) === 0
}

function collectBlocks(root: Element): HTMLElement[] {
  const out: HTMLElement[] = []
  const walk = (el: Element, depth: number) => {
    for (const child of Array.from(el.children)) {
      if (!(child instanceof HTMLElement) || child.tagName === 'STYLE' || child.tagName === 'SCRIPT') continue
      const r = child.getBoundingClientRect()
      if (!r.width || !r.height) continue
      if (depth < 2 && isWrapper(child)) walk(child, depth + 1)
      else out.push(child)
    }
  }
  walk(root, 0)
  return out
}

/**
 * Page choreography, one per view:
 * - blocks in the first viewport rise in with a capped stagger (skipped when the page runs its
 *   own CSS entrance, marked `data-css-entrance`, as the dashboard bento does);
 * - blocks below the fold reveal once as they scroll into view (GSAP ScrollTrigger).
 * Content is visible by default: nothing is hidden unless this effect runs.
 * Reduced motion: no movement, only a short opacity fade for the first viewport.
 */
export default function PageMotion({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useLayoutEffect(() => {
    const host = ref.current
    if (!host) return
    const scope = host.querySelector('[data-reveal-root]') ?? host.firstElementChild ?? host
    const cssEntrance = !!host.querySelector('[data-css-entrance]')
    const blocks = collectBlocks(scope)
    const fold = window.innerHeight
    const above = blocks.filter((b) => b.getBoundingClientRect().top < fold).slice(0, MAX_BLOCKS)
    const below = blocks.filter((b) => b.getBoundingClientRect().top >= fold)

    // A page opened in a background tab has nobody watching its entrance: show it as-is
    const skipEntrance = cssEntrance || document.visibilityState === 'hidden'

    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      if (!skipEntrance && above.length) {
        gsap.from(above, {
          opacity: 0,
          y: 14,
          duration: 0.42,
          ease: EASE,
          stagger: Math.min(0.05, MAX_STAGGER_TOTAL / above.length),
          clearProps: 'opacity,transform',
        })
      }
      if (below.length) {
        // A CSS entrance would already have played off-screen; the scroll reveal replaces it
        below.forEach((b) => { b.style.animation = 'none' })
        gsap.set(below, { opacity: 0, y: 28 })
        ScrollTrigger.batch(below, {
          start: 'top 92%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, ease: EASE, stagger: 0.06, clearProps: 'opacity,transform' }),
        })
      }
    })

    mm.add('(prefers-reduced-motion: reduce)', () => {
      if (!skipEntrance && above.length) gsap.from(above, { opacity: 0, duration: 0.2, clearProps: 'opacity' })
    })

    // Data arrives after first paint and pushes sections down: keep trigger positions honest
    let frame = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    })
    ro.observe(scope)

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      mm.revert()
    }
  }, [pathname])

  return (
    <div ref={ref} style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {children}
    </div>
  )
}
