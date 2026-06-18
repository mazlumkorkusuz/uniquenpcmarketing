'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ModalBase, inputStyle, labelStyle, fieldStyle, cancelBtnStyle, submitBtnStyle, addBtnStyle } from './ModalBase'
import { Toast } from './Toast'
import { revalidateDashboard } from '@/app/actions'

interface ToastState { message: string; type: 'success' | 'error' }

interface StreamerModalProps {
  table: string
  color: string
}

export function StreamerModal({ table, color }: StreamerModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [form, setForm] = useState({ channel_name: '', username: '', followers: '', language: '', status: 'Aktif' })
  const router = useRouter()

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username && !form.channel_name) return
    setLoading(true)
    try {
      const sb = createSupabaseBrowserClient()
      const { error } = await sb.from(table).insert({
        channel_name: form.channel_name || null,
        username: form.username || null,
        followers: form.followers ? parseInt(form.followers) : null,
        language: form.language || null,
        status: form.status,
      })
      if (error) throw error
      setToast({ message: 'Yayıncı başarıyla eklendi.', type: 'success' })
      setForm({ channel_name: '', username: '', followers: '', language: '', status: 'Aktif' })
      setOpen(false)
      await revalidateDashboard()
      router.refresh()
    } catch (err: unknown) {
      setToast({ message: (err as Error).message || 'Bir hata oluştu.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const dismiss = useCallback(() => setToast(null), [])

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismiss} />}
      <button onClick={() => setOpen(true)} style={addBtnStyle(color)}>+ Yayıncı Ekle</button>
      <ModalBase isOpen={open} onClose={() => setOpen(false)} title="Yayıncı Ekle">
        <form onSubmit={submit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Kanal Adı</label>
            <input style={inputStyle} value={form.channel_name} onChange={e => set('channel_name', e.target.value)} placeholder="Kanal adı" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Kullanıcı Adı *</label>
            <input style={inputStyle} value={form.username} onChange={e => set('username', e.target.value)} placeholder="kullanici_adi" required />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Takipçi Sayısı</label>
            <input style={inputStyle} type="number" min="0" value={form.followers} onChange={e => set('followers', e.target.value)} placeholder="0" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Dil</label>
            <input style={inputStyle} value={form.language} onChange={e => set('language', e.target.value)} placeholder="örn. TR, EN, JP" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Durum</label>
            <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="Aktif">Aktif</option>
              <option value="İnaktif">İnaktif</option>
              <option value="Pasif">Pasif</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={() => setOpen(false)} style={cancelBtnStyle()}>İptal</button>
            <button type="submit" disabled={loading} style={submitBtnStyle(color, loading)}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </ModalBase>
    </>
  )
}
