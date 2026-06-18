'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ModalBase, inputStyle, labelStyle, fieldStyle, cancelBtnStyle, submitBtnStyle, addBtnStyle } from './ModalBase'
import { Toast } from './Toast'

interface ToastState { message: string; type: 'success' | 'error' }

export function PlatformModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [form, setForm] = useState({ name: '', type: '', contact_name: '', contact_email: '', website: '', status: 'Aktif' })
  const router = useRouter()

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return
    setLoading(true)
    try {
      const sb = createSupabaseBrowserClient()
      const { error } = await sb.from('crm_platforms').insert({
        name: form.name,
        type: form.type || null,
        contact_name: form.contact_name || null,
        contact_email: form.contact_email || null,
        website: form.website || null,
        status: form.status,
      })
      if (error) throw error
      setToast({ message: 'Platform başarıyla eklendi.', type: 'success' })
      setForm({ name: '', type: '', contact_name: '', contact_email: '', website: '', status: 'Aktif' })
      setOpen(false)
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
      <button onClick={() => setOpen(true)} style={addBtnStyle('#3b82f6')}>+ Platform Ekle</button>
      <ModalBase isOpen={open} onClose={() => setOpen(false)} title="Platform Ekle">
        <form onSubmit={submit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Platform Adı *</label>
            <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="örn. Twitch, YouTube" required />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Tür</label>
            <input style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)} placeholder="örn. Yayın, Sosyal Medya" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>İletişim</label>
            <input style={inputStyle} value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="İletişim kişisi" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>E-posta</label>
            <input style={inputStyle} type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="ornek@mail.com" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Website</label>
            <input style={inputStyle} value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Durum</label>
            <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="Aktif">Aktif</option>
              <option value="İnaktif">İnaktif</option>
              <option value="Beklemede">Beklemede</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={() => setOpen(false)} style={cancelBtnStyle()}>İptal</button>
            <button type="submit" disabled={loading} style={submitBtnStyle('#3b82f6', loading)}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </ModalBase>
    </>
  )
}
