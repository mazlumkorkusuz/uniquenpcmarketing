'use client'

import { useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'

const EASE_OUT = [0.22, 1, 0.36, 1] as const

/**
 * Detail drawer that slides in from the right over a fading scrim.
 * Pages pass the selected item (or null); the last item stays rendered while the panel slides
 * out, so closing animates instead of vanishing. The panel components keep their own
 * `position: fixed` styles: the moving layer is itself a full-viewport fixed box.
 */
export default function SlideDrawer<T>({
  item,
  onClose,
  children,
}: {
  item: T | null
  onClose: () => void
  children: (item: T) => React.ReactNode
}) {
  const [shown, setShown] = useState<T | null>(item)
  if (item !== null && item !== shown) setShown(item)

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence onExitComplete={() => setShown(null)}>
        {item !== null && [
          <motion.div
            key="scrim"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.24, ease: EASE_OUT } }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--scrim)', zIndex: 999 }}
          />,
          <motion.div
            key="panel"
            className="drawer-layer"
            initial={{ x: 420 }}
            animate={{ x: 0, transition: { duration: 0.36, ease: EASE_OUT } }}
            exit={{ x: 420, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none' }}
          >
            {shown !== null && children(shown)}
          </motion.div>,
        ]}
      </AnimatePresence>
    </MotionConfig>
  )
}
