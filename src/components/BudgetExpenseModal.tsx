'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ModalBase, inputStyle, labelStyle, fieldStyle, cancelBtnStyle, submitBtnStyle, addBtnStyle } from './ModalBase'
import { Toast } from './Toast'

interface ToastState { message: string; type: 'success' | 'error' }

export function BudgetExpenseModal({ accentColor = '#22c55e', buttonLabel = '+ Harcama Ekle' }: { accentColor?: string; buttonLabel?: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [form, setForm] = useState({ platform: '', title: '', amount: '', date: '', status: 'Beklemede' })
  const router = useRouter()

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.platform || !form.amount) return
    setLoading(true)
    try {
      const sb = createSupabaseBrowserClient()
      const { error } = await sb.from('budget_expenses').insert({
        platform: form.platform,
        title: form.title || null,
        amount: parseFloat(form.amount),
        date: form.date || null,
        status: form.status,
      })
      if (error) throw error
      setToast({ message: 'Harcama başarıyla eklendi.', type: 'success' })
      setForm({ platform: '', title: '', amount: '', date: '', status: 'Beklemede' })
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
      <button onClick={() => setOpen(true)} style={addBtnStyle(accentColor)}>{buttonLabel}</button>
      <ModalBase isOpen={open} onClose={() => setOpen(false)} title="Harcama Ekle">
        <form onSubmit={submit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Platform *</label>
            <input style={inputStyle} value={form.platform} onChange={e => set('platform', e.target.value)} placeholder="örn. Twitter, Google Ads" required />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Paket / Başlık</label>
            <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="örn. Promosyon Paketi" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Tutar *</label>
            <input style={inputStyle} type="number" step="0.01" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" required />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Vade Tarihi</label>
            <input style={{ ...inputStyle, colorScheme: 'dark' }} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Durum</label>
            <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="Beklemede">Beklemede</option>
              <option value="Ödendi">Ödendi</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={() => setOpen(false)} style={cancelBtnStyle()}>İptal</button>
            <button type="submit" disabled={loading} style={submitBtnStyle(accentColor, loading)}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </ModalBase>
    </>
  )
}
