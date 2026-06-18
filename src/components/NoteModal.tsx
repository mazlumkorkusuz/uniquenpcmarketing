'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ModalBase, inputStyle, labelStyle, fieldStyle, cancelBtnStyle, submitBtnStyle, addBtnStyle } from './ModalBase'
import { Toast } from './Toast'

interface ToastState { message: string; type: 'success' | 'error' }

export function NoteModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [form, setForm] = useState({ title: '', content: '' })
  const router = useRouter()

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title) return
    setLoading(true)
    try {
      const sb = createSupabaseBrowserClient()
      const { error } = await sb.from('notes').insert({
        title: form.title,
        content: form.content || null,
      })
      if (error) throw error
      setToast({ message: 'Not başarıyla eklendi.', type: 'success' })
      setForm({ title: '', content: '' })
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
      <button onClick={() => setOpen(true)} style={addBtnStyle('#f59e0b')}>+ Not Ekle</button>
      <ModalBase isOpen={open} onClose={() => setOpen(false)} title="Not Ekle">
        <form onSubmit={submit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Başlık *</label>
            <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Not başlığı" required />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>İçerik</label>
            <textarea
              style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
              value={form.content}
              onChange={e => set('content', e.target.value)}
              placeholder="Not içeriği..."
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={() => setOpen(false)} style={cancelBtnStyle()}>İptal</button>
            <button type="submit" disabled={loading} style={submitBtnStyle('#f59e0b', loading)}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </ModalBase>
    </>
  )
}
