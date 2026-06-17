'use client'

import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'
import CaptchaModal from '@/components/CaptchaModal'

const CAPTCHA_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

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
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [lastVerified, setLastVerified] = useState<number>(Date.now())

  const supabase = createSupabaseBrowserClient()

  // Sync auth state from Supabase
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // 10-minute CAPTCHA timer (only for authenticated users on protected pages)
  useEffect(() => {
    if (isLoginPage) return

    const check = setInterval(() => {
      if (Date.now() - lastVerified >= CAPTCHA_INTERVAL_MS) {
        setShowCaptcha(true)
      }
    }, 5000)

    return () => clearInterval(check)
  }, [isLoginPage, lastVerified])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }, [supabase, router])

  const handleCaptchaSuccess = useCallback(() => {
    setShowCaptcha(false)
    setLastVerified(Date.now())
  }, [])

  const handleCaptchaExpire = useCallback(async () => {
    setShowCaptcha(false)
    await supabase.auth.signOut()
    router.push('/login')
  }, [supabase, router])

  // Login page — no sidebar, no captcha
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
        <Sidebar />
        <main
          style={{
            marginLeft: '260px',
            flex: 1,
            minHeight: '100vh',
            backgroundColor: '#0a0a0f',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </main>
      </div>
      {showCaptcha && (
        <CaptchaModal onSuccess={handleCaptchaSuccess} onExpire={handleCaptchaExpire} />
      )}
    </AuthContext.Provider>
  )
}
