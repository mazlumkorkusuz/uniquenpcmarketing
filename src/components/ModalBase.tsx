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
        backgroundColor: 'rgba(23,18,43,0.4)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: 'fade-in 200ms var(--ease-out)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="modal-surface"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          backgroundColor: 'var(--surface)',
          color: 'var(--ink)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--r-lg)',
          padding: '24px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px -16px rgba(23,18,43,0.28), 0 2px 6px rgba(23,18,43,0.06)',
          animation: 'pop-in 250ms var(--ease-out)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--ink)', margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="icon-btn"
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
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--line-2)',
  borderRadius: 'var(--r-sm)',
  padding: '10px 12px',
  color: 'var(--ink)',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
}

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--ink-2)',
  marginBottom: '6px',
}

export const fieldStyle: React.CSSProperties = { marginBottom: '16px' }

// MASTER secondary button: white, strong border, ink text
export function cancelBtnStyle(): React.CSSProperties {
  return {
    height: '40px',
    padding: '0 18px',
    borderRadius: 'var(--r-sm)',
    border: '1px solid var(--line-2)',
    background: 'var(--surface)',
    color: 'var(--ink)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  }
}

// MASTER primary button: signature gradient, white text. `color` is kept for API compatibility.
export function submitBtnStyle(color: string, loading: boolean): React.CSSProperties {
  return {
    height: '40px',
    padding: '0 20px',
    borderRadius: 'var(--r-sm)',
    border: 'none',
    background: buttonColor(color).background,
    color: buttonColor(color).text,
    cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    opacity: loading ? 0.6 : 1,
  }
}

export function addBtnStyle(color: string): React.CSSProperties {
  return {
    background: buttonColor(color).background,
    border: 'none',
    borderRadius: 'var(--r-sm)',
    height: '40px',
    padding: '0 16px',
    color: buttonColor(color).text,
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    whiteSpace: 'nowrap',
  }
}
