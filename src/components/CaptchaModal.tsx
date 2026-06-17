'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react'

interface CaptchaModalProps {
  onSuccess: () => void
  onExpire: () => void
}

function generateQuestion() {
  const a = Math.floor(Math.random() * 9) + 1
  const b = Math.floor(Math.random() * 9) + 1
  const ops = ['+', '-', '×'] as const
  const op = ops[Math.floor(Math.random() * ops.length)]
  let answer: number
  if (op === '+') answer = a + b
  else if (op === '-') answer = Math.abs(a - b)
  else answer = a * b
  const displayA = op === '-' ? Math.max(a, b) : a
  const displayB = op === '-' ? Math.min(a, b) : b
  return { question: `${displayA} ${op} ${displayB}`, answer }
}

const TIMEOUT = 30

export default function CaptchaModal({ onSuccess, onExpire }: CaptchaModalProps) {
  const [{ question, answer }, setQA] = useState(generateQuestion)
  const [input, setInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(TIMEOUT)
  const [status, setStatus] = useState<'idle' | 'wrong'>('idle')
  const [wrongCount, setWrongCount] = useState(0)

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire()
      return
    }
    const t = setTimeout(() => setTimeLeft((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, onExpire])

  const handleSubmit = useCallback(() => {
    const val = parseInt(input.trim(), 10)
    if (val === answer) {
      onSuccess()
    } else {
      const next = wrongCount + 1
      setWrongCount(next)
      setStatus('wrong')
      setInput('')
      if (next >= 3) {
        setTimeout(onExpire, 800)
      } else {
        setTimeout(() => {
          setStatus('idle')
          setQA(generateQuestion())
        }, 700)
      }
    }
  }, [input, answer, wrongCount, onSuccess, onExpire])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const pct = (timeLeft / TIMEOUT) * 100
  const barColor = timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f59e0b' : '#7c3aed'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: '#13131a',
          border: '1px solid #2a2a3a',
          borderRadius: '16px',
          padding: '32px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
              Güvenlik Doğrulaması
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Oturumunuz 10 dakikadır aktif
            </div>
          </div>
        </div>

        {/* Question */}
        <div
          style={{
            backgroundColor: '#1a1a24',
            border: `1px solid ${status === 'wrong' ? 'rgba(239,68,68,0.4)' : '#2a2a3a'}`,
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>
            Sonucu hesaplayın
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '2px' }}>
            {question} = ?
          </div>
        </div>

        {/* Input */}
        <input
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Cevabınızı girin"
          autoFocus
          style={{
            width: '100%',
            backgroundColor: '#0a0a0f',
            border: `1px solid ${status === 'wrong' ? 'rgba(239,68,68,0.6)' : 'rgba(124,58,237,0.4)'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '16px',
            color: '#f1f5f9',
            outline: 'none',
            textAlign: 'center',
            marginBottom: '12px',
            boxSizing: 'border-box',
          }}
        />

        {/* Status */}
        {status === 'wrong' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#f87171',
              fontSize: '13px',
              marginBottom: '12px',
            }}
          >
            <XCircle size={14} />
            Yanlış cevap. {3 - wrongCount} deneme hakkınız kaldı.
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <CheckCircle size={16} />
          Doğrula
        </button>

        {/* Timer */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Kalan süre</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: timeLeft <= 10 ? '#f87171' : '#94a3b8' }}>
              {timeLeft}s
            </span>
          </div>
          <div style={{ height: '4px', backgroundColor: '#2a2a3a', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                backgroundColor: barColor,
                borderRadius: '2px',
                transition: 'width 1s linear, background-color 0.3s',
              }}
            />
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', textAlign: 'center' }}>
            Süre dolunca oturumunuz kapatılacak
          </div>
        </div>
      </div>
    </div>
  )
}
