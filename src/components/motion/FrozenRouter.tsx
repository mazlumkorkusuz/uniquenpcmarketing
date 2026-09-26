'use client'

import { useContext, useState } from 'react'
import { LayoutRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'

// Snapshots the App Router's layout context when a page mounts, so a page that is fading out
// under AnimatePresence keeps rendering its own content instead of the next route's.
// LayoutRouterContext is a Next.js internal: if an upgrade moves it, this import is what to fix.
export default function FrozenRouter({ children }: { children: React.ReactNode }) {
  const context = useContext(LayoutRouterContext)
  const [frozen] = useState(context)
  return <LayoutRouterContext.Provider value={frozen}>{children}</LayoutRouterContext.Provider>
}
