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
  const [isPigeonLooking, setIsPigeonLooking] = useState(false)

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
    <>
    <style>{`@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-14px); } }`}</style>
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        backgroundImage: "url('/banner.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Dark overlay with a soft top light, like resend.com */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(50rem 28rem at 50% -10%, rgba(255,255,255,0.08), transparent 70%), rgba(0,0,0,0.82)',
          backdropFilter: 'blur(6px)',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Pigeon mascot */}
        <img
          src={isPigeonLooking ? '/pigeon-look.png' : '/pigeon.png'}
          alt=""
          style={{
            position: 'absolute',
            bottom: '30px',
            left: '-320px',
            width: '380px',
            height: 'auto',
            pointerEvents: 'none',
            animation: isPigeonLooking ? 'none' : 'float 3s ease-in-out infinite',
            transition: 'all 0.3s ease',
          }}
        />
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px', animation: 'pop-in 500ms var(--ease-out-soft)' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              overflow: 'hidden',
              margin: '0 auto 20px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.12), 0 8px 32px rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              src="/uniqlogo.png"
              alt="Unique NPC Games"
              width={56}
              height={56}
              style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
              priority
            />
          </div>
          <h1 className="text-gradient" style={{ fontSize: '32px', fontWeight: 500, letterSpacing: '-0.035em', margin: '0 0 8px' }}>
            Unique NPC&apos;ye giriş yap
          </h1>
          <p style={{ fontSize: '14px', color: '#A1A4A5', margin: 0 }}>
            Marketing Hub · Giriş Yap
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: 'rgba(10,10,10,0.8)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 24px 80px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(20px)',
            animation: 'pop-in 600ms var(--ease-out-soft) 80ms both',
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
                <Clock size={16} color="#FF6369" />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#FF6369' }}>
                  Hesap Geçici Olarak Kilitlendi
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#B4B4B4', margin: '0 0 12px' }}>
                {MAX_ATTEMPTS} başarısız girişimden sonra hesabınız kilitlendi.
                <strong style={{ color: '#EDEDED' }}> {countdown} saniye</strong> sonra tekrar deneyin.
              </p>
              {/* Countdown bar */}
              <div style={{ height: '4px', backgroundColor: '#262626', borderRadius: '2px', overflow: 'hidden' }}>
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
              <AlertCircle size={15} color="#FF6369" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '13px', color: '#FF6369' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#B4B4B4', marginBottom: '6px' }}>
                E-posta
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Mail size={15} color="#8F8F8F" />
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
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid #262626',
                    borderRadius: '10px',
                    padding: '11px 12px 11px 38px',
                    fontSize: '14px',
                    color: '#EDEDED',
                    outline: 'none',
                    boxSizing: 'border-box',
                    opacity: isLocked ? 0.5 : 1,
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.24)' }}
                  onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = '#262626' }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#B4B4B4', marginBottom: '6px' }}>
                Şifre
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Lock size={15} color="#8F8F8F" />
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
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid #262626',
                    borderRadius: '10px',
                    padding: '11px 40px 11px 38px',
                    fontSize: '14px',
                    color: '#EDEDED',
                    outline: 'none',
                    boxSizing: 'border-box',
                    opacity: isLocked ? 0.5 : 1,
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.24)'; setIsPigeonLooking(true) }}
                  onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = '#262626'; setIsPigeonLooking(false) }}
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
                    color: '#8F8F8F',
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
                <span style={{ fontSize: '12px', color: '#8F8F8F' }}>Deneme:</span>
                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: i < lockout.attempts ? '#FF6369' : '#262626',
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
                  ? '#0A0A0A'
                  : '#EDEDED',
                color: isLocked ? '#8F8F8F' : '#000000',
                border: isLocked ? '1px solid #262626' : 'none',
                borderRadius: '12px',
                padding: '11px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isLocked || loading || !email || !password ? 'not-allowed' : 'pointer',
                opacity: !email || !password ? 0.6 : 1,
                transition: 'opacity 0.2s, box-shadow 0.2s, background-color 0.2s',
                boxShadow: 'none',
              }}
            >
              {loading ? 'Giriş yapılıyor…' : isLocked ? `Kilitli · ${countdown}s` : 'Giriş Yap'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#B4B4B4', marginTop: '24px' }}>
          Bu sistem yalnızca yetkili kullanıcılara açıktır
        </p>
      </div>
    </div>
    </>
  )
}
