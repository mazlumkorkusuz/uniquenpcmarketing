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
        backgroundColor: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E0E0E0',
          borderRadius: '14px',
          padding: '28px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0,0,0,0.12)',
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
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#111111', margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid #E0E0E0',
              borderRadius: '6px',
              color: '#6B6B6B',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '3px 8px',
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
  backgroundColor: '#FFFFFF',
  border: '1px solid #E0E0E0',
  borderRadius: '8px',
  padding: '10px 12px',
  color: '#111111',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
}

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#444444',
  marginBottom: '6px',
}

export const fieldStyle: React.CSSProperties = { marginBottom: '16px' }

export function cancelBtnStyle(): React.CSSProperties {
  return {
    padding: '9px 18px',
    borderRadius: '8px',
    border: '1px solid #111111',
    background: '#FFFFFF',
    color: '#111111',
    cursor: 'pointer',
    fontSize: '14px',
  }
}

export function submitBtnStyle(color: string, loading: boolean): React.CSSProperties {
  return {
    padding: '9px 20px',
    borderRadius: '8px',
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
    borderRadius: '8px',
    padding: '8px 16px',
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
