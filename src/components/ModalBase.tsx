'use client'

import { buttonColor } from '@/lib/theme'

export function ModalBase({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: 'fade-in 200ms var(--ease-out-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0A0A0A',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 24px 80px rgba(0,0,0,0.8)',
          animation: 'pop-in 250ms var(--ease-out-soft)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 500, color: '#F0F0F0', margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Kapat"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: '#A1A4A5',
              cursor: 'pointer',
              fontSize: '13px',
              width: '28px',
              height: '28px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export const inputStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  padding: '9px 12px',
  color: '#F0F0F0',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
}

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#A1A4A5',
  marginBottom: '6px',
}

export const fieldStyle: React.CSSProperties = { marginBottom: '16px' }

export function cancelBtnStyle(): React.CSSProperties {
  return {
    padding: '9px 18px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent',
    color: '#F0F0F0',
    cursor: 'pointer',
    fontSize: '14px',
  }
}

export function submitBtnStyle(color: string, loading: boolean): React.CSSProperties {
  return {
    padding: '9px 20px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: buttonColor(color).background,
    color: buttonColor(color).text,
    cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    opacity: loading ? 0.7 : 1,
  }
}

export function addBtnStyle(color: string): React.CSSProperties {
  return {
    backgroundColor: buttonColor(color).background,
    border: 'none',
    borderRadius: '12px',
    padding: '8px 14px',
    color: buttonColor(color).text,
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    whiteSpace: 'nowrap',
  }
}
