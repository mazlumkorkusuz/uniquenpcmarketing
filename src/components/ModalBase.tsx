'use client'

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
        backgroundColor: 'rgba(0,0,0,0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1a1a24',
          border: '1px solid #2a2a3a',
          borderRadius: '14px',
          padding: '28px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
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
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid #2a2a3a',
              borderRadius: '6px',
              color: '#64748b',
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
  backgroundColor: '#0d0d14',
  border: '1px solid #2a2a3a',
  borderRadius: '8px',
  padding: '10px 12px',
  color: '#f1f5f9',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
}

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#94a3b8',
  marginBottom: '6px',
}

export const fieldStyle: React.CSSProperties = { marginBottom: '16px' }

export function cancelBtnStyle(): React.CSSProperties {
  return {
    padding: '9px 18px',
    borderRadius: '8px',
    border: '1px solid #2a2a3a',
    background: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '14px',
  }
}

export function submitBtnStyle(color: string, loading: boolean): React.CSSProperties {
  return {
    padding: '9px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: color,
    color: '#fff',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    opacity: loading ? 0.7 : 1,
  }
}

export function addBtnStyle(color: string): React.CSSProperties {
  return {
    backgroundColor: color,
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    whiteSpace: 'nowrap',
  }
}
