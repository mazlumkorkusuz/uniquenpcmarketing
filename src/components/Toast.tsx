'use client'
import { useEffect } from 'react'

export function Toast({
  message,
  type,
  onDismiss,
}: {
  message: string
  type: 'success' | 'error'
  onDismiss: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        padding: '12px 20px',
        borderRadius: '10px',
        backgroundColor: type === 'success' ? '#052e16' : '#450a0a',
        border: `1px solid ${type === 'success' ? '#16a34a' : '#dc2626'}`,
        color: type === 'success' ? '#4ade80' : '#f87171',
        fontSize: '14px',
        fontWeight: 500,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '260px',
        maxWidth: '420px',
      }}
    >
      <span style={{ fontSize: '16px', fontWeight: 700 }}>{type === 'success' ? '✓' : '✕'}</span>
      {message}
    </div>
  )
}
