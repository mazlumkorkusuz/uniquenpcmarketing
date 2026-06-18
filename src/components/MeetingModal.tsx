'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ModalBase, inputStyle, labelStyle, fieldStyle, cancelBtnStyle, submitBtnStyle, addBtnStyle } from './ModalBase'
import { Toast } from './Toast'

interface ToastState { message: string; type: 'success' | 'error' }

export function MeetingModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [form, setForm] = useState({ title: '', date: '', time: '', attendees: '', notes: '', status: 'Planlandı' })
  const router = useRouter()

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.date) return
    setLoading(true)
    try {
      const sb = createSupabaseBrowserClient()
      const { error } = await sb.from('meetings').insert({
        title: form.title,
        date: form.date,
        time: form.time || null,
        attendees: form.attendees || null,
        notes: form.notes || null,
        status: form.status,
      })
      if (error) throw error
      setToast({ message: 'Toplantı başarıyla eklendi.', type: 'success' })
      setForm({ title: '', date: '', time: '', attendees: '', notes: '', status: 'Planlandı' })
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
      <button onClick={() => setOpen(true)} style={addBtnStyle('#14b8a6')}>+ Toplantı Ekle</button>
      <ModalBase isOpen={open} onClose={() => setOpen(false)} title="Toplantı Ekle">
        <form onSubmit={submit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Başlık *</label>
            <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Toplantı başlığı" required />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Tarih *</label>
            <input style={{ ...inputStyle, colorScheme: 'dark' }} type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Saat</label>
            <input style={{ ...inputStyle, colorScheme: 'dark' }} type="time" value={form.time} onChange={e => set('time', e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Katılımcılar</label>
            <input style={inputStyle} value={form.attendees} onChange={e => set('attendees', e.target.value)} placeholder="Ad, Ad, Ad..." />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Notlar</label>
            <textarea
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Toplantı notları..."
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Durum</label>
            <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="Planlandı">Planlandı</option>
              <option value="Devam Ediyor">Devam Ediyor</option>
              <option value="Tamamlandı">Tamamlandı</option>
              <option value="İptal">İptal</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={() => setOpen(false)} style={cancelBtnStyle()}>İptal</button>
            <button type="submit" disabled={loading} style={submitBtnStyle('#14b8a6', loading)}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </ModalBase>
    </>
  )
}
