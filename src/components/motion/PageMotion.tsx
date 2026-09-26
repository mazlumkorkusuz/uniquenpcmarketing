'use client'

import { useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { animate } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const EASE_OUT = [0.22, 1, 0.36, 1] as const
const STEP = 0.1 // seconds between blocks
const MAX_STEPS = 8 // blocks after the 8th share its delay, so long pages never hold content back

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

// ---------- Count-up for stat numbers ----------

const NUMERIC = /^([^\d-]*?)(-?\d[\d.,]*)(\s*[KMB%]?)$/

type Parsed = { value: number; format: (n: number) => string }

// Reads "1.234", "12.3K", "$1,234.56", "%45" and returns a formatter that writes numbers back in
// the same shape, so the count ends on exactly the string React rendered.
function parseNumber(text: string): Parsed | null {
  const m = text.trim().match(NUMERIC)
  if (!m) return null
  const [, prefix, raw, suffix] = m
  const lastDot = raw.lastIndexOf('.')
  const lastComma = raw.lastIndexOf(',')
  let decimalSep: string | null = null
  if (lastDot > -1 && lastComma > -1) decimalSep = lastDot > lastComma ? '.' : ','
  else if (lastDot > -1 || lastComma > -1) {
    const sep = lastDot > -1 ? '.' : ','
    const tail = raw.length - raw.lastIndexOf(sep) - 1
    decimalSep = /[KMB]/.test(suffix) || tail !== 3 ? sep : null
  }
  const groupSep = decimalSep === '.' ? ',' : decimalSep === ',' ? '.' : raw.includes('.') ? '.' : ','
  const decimals = decimalSep ? raw.length - raw.lastIndexOf(decimalSep) - 1 : 0
  const value = Number(raw.split(groupSep).join('').replace(decimalSep ?? '#', '.'))
  if (!Number.isFinite(value) || value === 0) return null
  const locale = groupSep === '.' || decimalSep === ',' ? 'tr-TR' : 'en-US'
  const nf = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: raw.includes(groupSep),
  })
  return { value, format: (n) => prefix + nf.format(n) + suffix }
}

// Counts the element's single text node from 0 to its value. Stops the moment React writes a
// different value, so a live update is never overwritten by a stale frame.
function countUp(el: HTMLElement): (() => void) | null {
  const node = el.firstChild as Text
  const final = node.data
  const parsed = parseNumber(final)
  if (!parsed) return null
  let written = final
  const controls = animate(0, parsed.value, {
    duration: 0.9,
    ease: EASE_OUT,
    onUpdate: (v) => {
      if (node.data !== written) return controls.stop()
      written = parsed.format(v)
      node.data = written
    },
    onComplete: () => {
      if (node.data === written) node.data = final
    },
  })
  return () => {
    controls.stop()
    if (node.data === written) node.data = final
  }
}

function isStatNumber(el: Element): el is HTMLElement {
  if (!(el instanceof HTMLElement) || el.childNodes.length !== 1 || el.firstChild?.nodeType !== Node.TEXT_NODE) return false
  if (el.closest('table, nav, [role="dialog"], .drawer-layer, button, a')) return false
  const text = (el.firstChild as Text).data.trim()
  if (text.length > 16 || !NUMERIC.test(text)) return false
  const cs = getComputedStyle(el)
  return parseFloat(cs.fontSize) >= 18 && Number(cs.fontWeight) >= 600
}

/**
 * Page choreography, one per view:
 * - blocks in the first viewport fade in and slide up, 0.1s apart (framer-motion); pages with
 *   their own CSS entrance (`data-css-entrance`, the dashboard bento) keep theirs;
 * - blocks below the fold reveal once as they scroll into view (GSAP ScrollTrigger), 0.1s apart;
 * - large stat numbers count up once when they first appear (data often arrives after mount;
 *   the dashboard KPIs run their own CountUp component).
 * Content is visible by default: nothing is hidden unless this effect runs.
 * Reduced motion: no movement and no counting, only a short opacity fade for the first viewport.
 */
export default function PageMotion({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useLayoutEffect(() => {
    const host = ref.current
    if (!host) return
    const scope = host.querySelector('[data-reveal-root]') ?? host.firstElementChild ?? host
    const cssEntrance = !!host.querySelector('[data-css-entrance]')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // A page opened in a background tab has nobody watching its entrance: show it as-is
    const skipEntrance = cssEntrance || document.visibilityState === 'hidden'
    const blocks = collectBlocks(scope)
    const fold = window.innerHeight
    const above = blocks.filter((b) => b.getBoundingClientRect().top < fold)
    const below = blocks.filter((b) => b.getBoundingClientRect().top >= fold)
    const cleanups: Array<() => void> = []

    // ---- Load entrance (framer-motion) ----
    if (!skipEntrance && above.length) {
      const clear = () => above.forEach((b) => { b.style.opacity = ''; b.style.transform = '' })
      above.forEach((b) => {
        b.style.opacity = '0'
        if (!reduced) b.style.transform = 'translateY(16px)'
      })
      const controls = animate(
        above,
        reduced ? { opacity: [0, 1] } : { opacity: [0, 1], transform: ['translateY(16px)', 'translateY(0px)'] },
        { duration: reduced ? 0.2 : 0.45, ease: EASE_OUT, delay: reduced ? 0 : (i: number) => Math.min(i, MAX_STEPS) * STEP },
      )
      // Hand transform/opacity back to CSS so hover lifts keep working
      controls.then(clear)
      cleanups.push(() => { controls.stop(); clear() })
    }

    // ---- Scroll reveals below the fold (GSAP) ----
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      if (!below.length) return
      // A CSS entrance would already have played off-screen; the scroll reveal replaces it
      below.forEach((b) => { b.style.animation = 'none' })
      gsap.set(below, { opacity: 0, y: 28 })
      ScrollTrigger.batch(below, {
        start: 'top 92%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: STEP, clearProps: 'opacity,transform' }),
      })
    })
    cleanups.push(() => mm.revert())

    // ---- Count-up ----
    if (!reduced && !cssEntrance) {
      const counted = new WeakSet<Element>()
      let scanFrame = 0
      const scan = () => {
        cancelAnimationFrame(scanFrame)
        scanFrame = requestAnimationFrame(() => {
          for (const el of scope.querySelectorAll('div, span, strong, b, p')) {
            if (counted.has(el) || !isStatNumber(el)) continue
            counted.add(el)
            const stop = countUp(el)
            if (stop) cleanups.push(stop)
          }
        })
      }
      scan()
      // Numbers usually arrive with the data after mount: watch for a few seconds, then stop
      const observer = new MutationObserver(scan)
      observer.observe(scope, { childList: true, subtree: true, characterData: true })
      const stopWatching = window.setTimeout(() => observer.disconnect(), 6000)
      cleanups.push(() => {
        cancelAnimationFrame(scanFrame)
        clearTimeout(stopWatching)
        observer.disconnect()
      })
    }

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
      cleanups.forEach((c) => c())
    }
  }, [pathname])

  return (
    <div ref={ref} style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {children}
    </div>
  )
}
