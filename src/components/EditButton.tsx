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
        color: '#8F8F8F',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.1)'
        e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'
        e.currentTarget.style.color = '#70B8FF'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.borderColor = 'transparent'
        e.currentTarget.style.color = '#8F8F8F'
      }}
    >
      <Edit2 size={13} />
    </button>
  )
}
