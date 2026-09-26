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
        borderRadius: '8px',
        backgroundColor: 'transparent',
        border: '1px solid transparent',
        color: '#655F7D',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#EFF6FF'
        e.currentTarget.style.borderColor = '#D8D2E6'
        e.currentTarget.style.color = '#1D4ED8'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.borderColor = 'transparent'
        e.currentTarget.style.color = '#655F7D'
      }}
    >
      <Edit2 size={13} />
    </button>
  )
}
