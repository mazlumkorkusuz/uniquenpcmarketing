'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { Mail, Lock, AlertCircle, Clock, Eye, EyeOff } from 'lucide-react'

const MAX_ATTEMPTS = 3
const LOCKOUT_SECONDS = 60
const STORAGE_KEY = 'unpc_login_lockout'

interface LockoutState {
  attempts: number
  lockedUntil: number | null
}

function getLockout(): LockoutState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { attempts: 0, lockedUntil: null }
}

function saveLockout(state: LockoutState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function clearLockout() {
  localStorage.removeItem(STORAGE_KEY)
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [lockout, setLockout] = useState<LockoutState>({ attempts: 0, lockedUntil: null })
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load lockout state from localStorage on mount
  useEffect(() => {
    const state = getLockout()
    // Clear expired lockout
    if (state.lockedUntil && Date.now() >= state.lockedUntil) {
      clearLockout()
    } else {
      setLockout(state)
    }
  }, [])

  // Countdown timer when locked
  useEffect(() => {
    if (lockout.lockedUntil && Date.now() < lockout.lockedUntil) {
      const tick = () => {
        const remaining = Math.ceil((lockout.lockedUntil! - Date.now()) / 1000)
        if (remaining <= 0) {
          setCountdown(0)
          clearLockout()
          setLockout({ attempts: 0, lockedUntil: null })
          if (timerRef.current) clearInterval(timerRef.current)
        } else {
          setCountdown(remaining)
        }
      }
      tick()
      timerRef.current = setInterval(tick, 500)
      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    } else {
      setCountdown(0)
    }
  }, [lockout.lockedUntil])

  const isLocked = lockout.lockedUntil !== null && Date.now() < lockout.lockedUntil

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLocked || loading) return

    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (authError) {
      const current = getLockout()
      const newAttempts = current.attempts + 1
      let newState: LockoutState

      if (newAttempts >= MAX_ATTEMPTS) {
        newState = { attempts: newAttempts, lockedUntil: Date.now() + LOCKOUT_SECONDS * 1000 }
        setError(`${MAX_ATTEMPTS} başarısız deneme. Hesap 1 dakika kilitlendi.`)
      } else {
        newState = { attempts: newAttempts, lockedUntil: null }
        setError(`Hatalı e-posta veya şifre. (${newAttempts}/${MAX_ATTEMPTS} deneme)`)
      }

      saveLockout(newState)
      setLockout(newState)
    } else {
      clearLockout()
      router.push('/')
      router.refresh()
    }
  }

  const pct = isLocked ? (countdown / LOCKOUT_SECONDS) * 100 : 0

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              overflow: 'hidden',
              margin: '0 auto 16px',
              backgroundColor: 'white',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <Image
              src="/logo.png"
              alt="Unique NPC"
              width={80}
              height={80}
              style={{ display: 'block', width: '100%', height: '100%' }}
              priority
            />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f1f5f9', margin: '0 0 6px' }}>
            Unique NPC
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            Marketing Hub · Giriş Yap
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: '#13131a',
            border: '1px solid #2a2a3a',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}
        >
          {/* Lockout banner */}
          {isLocked && (
            <div
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Clock size={16} color="#f87171" />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#f87171' }}>
                  Hesap Geçici Olarak Kilitlendi
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 12px' }}>
                {MAX_ATTEMPTS} başarısız girişimden sonra hesabınız kilitlendi.
                <strong style={{ color: '#f1f5f9' }}> {countdown} saniye</strong> sonra tekrar deneyin.
              </p>
              {/* Countdown bar */}
              <div style={{ height: '4px', backgroundColor: '#2a2a3a', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    backgroundColor: '#ef4444',
                    borderRadius: '2px',
                    transition: 'width 0.5s linear',
                  }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && !isLocked && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={15} color="#f87171" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '13px', color: '#f87171' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '6px' }}>
                E-posta
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Mail size={15} color="#64748b" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@sirket.com"
                  disabled={isLocked || loading}
                  required
                  style={{
                    width: '100%',
                    backgroundColor: '#0a0a0f',
                    border: '1px solid #2a2a3a',
                    borderRadius: '8px',
                    padding: '11px 12px 11px 38px',
                    fontSize: '14px',
                    color: '#f1f5f9',
                    outline: 'none',
                    boxSizing: 'border-box',
                    opacity: isLocked ? 0.5 : 1,
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(124,58,237,0.6)' }}
                  onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = '#2a2a3a' }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '6px' }}>
                Şifre
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Lock size={15} color="#64748b" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLocked || loading}
                  required
                  style={{
                    width: '100%',
                    backgroundColor: '#0a0a0f',
                    border: '1px solid #2a2a3a',
                    borderRadius: '8px',
                    padding: '11px 40px 11px 38px',
                    fontSize: '14px',
                    color: '#f1f5f9',
                    outline: 'none',
                    boxSizing: 'border-box',
                    opacity: isLocked ? 0.5 : 1,
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(124,58,237,0.6)' }}
                  onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = '#2a2a3a' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Attempt dots */}
            {lockout.attempts > 0 && lockout.attempts < MAX_ATTEMPTS && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Deneme:</span>
                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: i < lockout.attempts ? '#f87171' : '#2a2a3a',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLocked || loading || !email || !password}
              style={{
                width: '100%',
                background: isLocked
                  ? '#1a1a24'
                  : 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                color: isLocked ? '#64748b' : 'white',
                border: isLocked ? '1px solid #2a2a3a' : 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: isLocked || loading || !email || !password ? 'not-allowed' : 'pointer',
                opacity: !email || !password ? 0.6 : 1,
                transition: 'opacity 0.15s',
                boxShadow: isLocked ? 'none' : '0 4px 16px rgba(124,58,237,0.3)',
              }}
            >
              {loading ? 'Giriş yapılıyor…' : isLocked ? `Kilitli · ${countdown}s` : 'Giriş Yap'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#475569', marginTop: '24px' }}>
          Bu sistem yalnızca yetkili kullanıcılara açıktır
        </p>
      </div>
    </div>
  )
}
