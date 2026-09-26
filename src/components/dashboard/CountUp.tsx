'use client'

import { useEffect, useRef } from 'react'

type Format = 'number' | 'usd'

function formatValue(n: number, format: Format): string {
  const rounded = Math.round(n)
  return format === 'usd'
    ? '$' + rounded.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : rounded.toLocaleString('tr-TR')
}

// Counts up from 0 to `value` once on mount. The final value is rendered on the server, so
// there is no layout shift, and it stays static under prefers-reduced-motion.
export default function CountUp({
  value,
  format = 'number',
  duration = 900,
  delay = 250,
}: {
  value: number
  format?: Format
  duration?: number
  delay?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || value <= 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    let start = 0
    el.textContent = formatValue(0, format)

    const tick = (t: number) => {
      if (!start) start = t
      const p = Math.min((t - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 4) // easeOutQuart
      el.textContent = formatValue(value * eased, format)
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    const timer = window.setTimeout(() => {
      frame = requestAnimationFrame(tick)
    }, delay)

    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(frame)
      el.textContent = formatValue(value, format)
    }
  }, [value, format, duration, delay])

  return (
    <>
      <span ref={ref} aria-hidden>{formatValue(value, format)}</span>
      <span className="sr-only">{formatValue(value, format)}</span>
    </>
  )
}
