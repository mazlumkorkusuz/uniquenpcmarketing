'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ModalBase, inputStyle, labelStyle, fieldStyle, cancelBtnStyle, submitBtnStyle, addBtnStyle } from './ModalBase'
import { Toast } from './Toast'
import { revalidateDashboard } from '@/app/actions'

interface ToastState { message: string; type: 'success' | 'error' }

export function RedditAccountModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [form, setForm] = useState({ username: '', karma: '', post_count: '', niche: '', status: 'Aktif' })
  const router = useRouter()

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username) return
    setLoading(true)
    try {
      const sb = createSupabaseBrowserClient()
      const { error } = await sb.from('reddit_accounts').insert({
        username: form.username,
        karma: form.karma ? parseInt(form.karma) : null,
        post_count: form.post_count ? parseInt(form.post_count) : null,
        niche: form.niche || null,
        status: form.status,
      })
      if (error) throw error
      setToast({ message: 'Hesap başarıyla eklendi.', type: 'success' })
      setForm({ username: '', karma: '', post_count: '', niche: '', status: 'Aktif' })
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
      <button onClick={() => setOpen(true)} style={addBtnStyle('#ff4500')}>+ Hesap Ekle</button>
      <ModalBase isOpen={open} onClose={() => setOpen(false)} title="Reddit Hesabı Ekle">
        <form onSubmit={submit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Kullanıcı Adı *</label>
            <input style={inputStyle} value={form.username} onChange={e => set('username', e.target.value)} placeholder="kullanici_adi" required />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Karma</label>
            <input style={inputStyle} type="number" min="0" value={form.karma} onChange={e => set('karma', e.target.value)} placeholder="0" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Toplam Paylaşım</label>
            <input style={inputStyle} type="number" min="0" value={form.post_count} onChange={e => set('post_count', e.target.value)} placeholder="0" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Niş</label>
            <input style={inputStyle} value={form.niche} onChange={e => set('niche', e.target.value)} placeholder="örn. Oyun, Teknoloji" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Durum</label>
            <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="Aktif">Aktif</option>
              <option value="İnaktif">İnaktif</option>
              <option value="Askıya Alındı">Askıya Alındı</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={() => setOpen(false)} style={cancelBtnStyle()}>İptal</button>
            <button type="submit" disabled={loading} style={submitBtnStyle('#ff4500', loading)}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </ModalBase>
    </>
  )
}
