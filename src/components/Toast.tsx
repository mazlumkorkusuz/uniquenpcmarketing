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
        backgroundColor: type === 'success' ? 'var(--success)' : 'var(--danger)',
        border: `1px solid ${type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
        color: type === 'success' ? 'var(--success)' : 'var(--danger)',
        fontSize: '14px',
        fontWeight: 500,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
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
