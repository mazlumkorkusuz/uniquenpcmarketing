'use client'

import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import Image from 'next/image'
import { Menu } from 'lucide-react'
import Sidebar from '@/components/Sidebar'

interface AuthContextValue {
  user: User | null
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({ user: null, logout: async () => {} })

export function useAuth() {
  return useContext(AuthContext)
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === '/login'

  const [user, setUser] = useState<User | null>(null)
  // Mobile drawer: remembers which path it was opened on, so navigating closes it
  const [navOpenOn, setNavOpenOn] = useState<string | null>(null)
  const navOpen = navOpenOn === pathname

  useEffect(() => {
    if (!navOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setNavOpenOn(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }, [supabase, router])

  if (isLoginPage) {
    return (
      <AuthContext.Provider value={{ user, logout }}>
        {children}
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar open={navOpen} />
        {navOpen && <div className="app-scrim" onClick={() => setNavOpenOn(null)} aria-hidden />}
        <main
          className="app-main"
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: '100vh',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'hidden',
          }}
        >
          <div className="app-topbar">
            <button
              type="button"
              onClick={() => setNavOpenOn(pathname)}
              aria-label="Menüyü aç"
              aria-expanded={navOpen}
              aria-controls="app-sidebar"
              style={{ width: 44, height: 44, display: 'grid', placeItems: 'center', background: 'none', border: 0, borderRadius: 8, cursor: 'pointer', color: '#111111' }}
            >
              <Menu size={22} />
            </button>
            <Image src="/uniqlogo.png" alt="" width={28} height={28} style={{ borderRadius: 6 }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111111' }}>Unique NPC Marketing</span>
          </div>
          {children}
        </main>
      </div>
    </AuthContext.Provider>
  )
}
