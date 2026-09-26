'use client'

import { useReducedMotion } from 'framer-motion'
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { BorderBeam } from '@/components/ui/border-beam'
import { GlowingEffect } from '@/components/ui/glowing-effect'
import BlurText from '@/components/BlurText'

// Thin wrappers that switch each effect off under prefers-reduced-motion.

// Magic UI animated grid: a faint grid with a few gold squares breathing in and out, masked to
// the top of the content area so it never sits behind dense tables.
export function AmbientGrid() {
  const reduced = useReducedMotion()
  if (reduced) return null
  return (
    <div className="ambient-grid" aria-hidden>
      <AnimatedGridPattern
        numSquares={22}
        maxOpacity={0.14}
        duration={5}
        repeatDelay={1.5}
        width={44}
        height={44}
        className="fill-transparent stroke-border/60"
        style={{ color: 'var(--primary)' }}
      />
    </div>
  )
}

// Magic UI border beam in the Caravan golds, for the one or two cards that matter most.
export function Beam({ delay = 0 }: { delay?: number }) {
  const reduced = useReducedMotion()
  if (reduced) return null
  return (
    <div className="beam-slot" aria-hidden>
      <BorderBeam size={90} duration={9} delay={delay} colorFrom="var(--primary)" colorTo="var(--teal)" borderWidth={1.5} />
    </div>
  )
}

// Aceternity glowing border that follows the pointer (hover glow).
export function HoverGlow() {
  const reduced = useReducedMotion()
  return <GlowingEffect disabled={!!reduced} glow spread={36} proximity={48} inactiveZone={0.2} borderWidth={1.5} movementDuration={1.2} />
}

// React Bits blur-in for page titles; plain text under reduced motion.
export function TitleReveal({ text }: { text: string }) {
  const reduced = useReducedMotion()
  if (reduced) return <>{text}</>
  return <BlurText text={text} delay={70} animateBy="words" direction="top" stepDuration={0.3} />
}
