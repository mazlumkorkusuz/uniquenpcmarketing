'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { revalidateDashboard } from '@/app/actions'

interface Props {
  table: string
  id: string | number
}

export function DeleteButton({ table, id }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const sb = createSupabaseBrowserClient()
      const { error } = await sb.from(table).delete().eq('id', id)
      if (error) throw error
      await revalidateDashboard()
      router.refresh()
    } catch {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '2px 0' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
          Bu kaydı silmek istediğinizden emin misiniz?
        </span>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            onClick={handleDelete}
            disabled={loading}
            style={{
              padding: '3px 10px',
              borderRadius: '5px',
              backgroundColor: 'rgba(239,68,68,0.18)',
              border: '1px solid rgba(239,68,68,0.45)',
              color: '#f87171',
              fontSize: '11px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? '...' : 'Evet, Sil'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            style={{
              padding: '3px 8px',
              borderRadius: '5px',
              backgroundColor: 'transparent',
              border: '1px solid #2a2a3a',
              color: '#64748b',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            İptal
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        backgroundColor: 'transparent',
        border: '1px solid transparent',
        color: '#475569',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'
        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'
        e.currentTarget.style.color = '#f87171'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.borderColor = 'transparent'
        e.currentTarget.style.color = '#475569'
      }}
    >
      <Trash2 size={13} />
    </button>
  )
}
