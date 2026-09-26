'use client'
import { Edit2 } from 'lucide-react'

export function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        backgroundColor: 'transparent',
        border: '1px solid transparent',
        color: 'var(--muted-foreground)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--info) 10%, transparent)'
        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--info) 30%, transparent)'
        e.currentTarget.style.color = 'var(--info)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.borderColor = 'transparent'
        e.currentTarget.style.color = 'var(--muted-foreground)'
      }}
    >
      <Edit2 size={13} />
    </button>
  )
}
