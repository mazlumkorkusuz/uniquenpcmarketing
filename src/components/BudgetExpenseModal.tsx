'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ModalBase, inputStyle, labelStyle, fieldStyle, cancelBtnStyle, submitBtnStyle, addBtnStyle } from './ModalBase'
import { Toast } from './Toast'
import { revalidateDashboard } from '@/app/actions'
import { EditButton } from './EditButton'

interface ToastState { message: string; type: 'success' | 'error' }

interface ExpenseData {
  id?: string | number
  platform?: string
  title?: string
  amount?: number | string
  date?: string
  status?: string
}

interface BudgetExpenseModalProps {
  accentColor?: string
  buttonLabel?: string
  mode?: 'add' | 'edit'
  initialData?: ExpenseData
  open?: boolean
  onClose?: () => void
}

const DEFAULT_FORM = { platform: '', title: '', amount: '', date: '', status: 'Beklemede' }

function buildForm(data?: ExpenseData) {
  if (!data) return DEFAULT_FORM
  return {
    platform: String(data.platform ?? ''),
    title: String(data.title ?? ''),
    amount: data.amount != null ? String(data.amount) : '',
    date: String(data.date ?? ''),
    status: String(data.status ?? 'Beklemede'),
  }
}

export function BudgetExpenseModal({
  accentColor = '#22c55e',
  buttonLabel = '+ Harcama Ekle',
  mode = 'add',
  initialData,
  open: externalOpen,
  onClose: externalClose,
}: BudgetExpenseModalProps) {
  const isControlled = externalOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? externalOpen! : internalOpen
  const closeModal = isControlled ? (externalClose ?? (() => {})) : () => setInternalOpen(false)

  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [form, setForm] = useState(() => buildForm(initialData))
  const router = useRouter()

  useEffect(() => {
    if (open) setForm(buildForm(initialData))
  }, [open])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.platform || !form.amount) return
    setLoading(true)
    try {
      const sb = createSupabaseBrowserClient()
      if (mode === 'edit' && initialData?.id) {
        const { error } = await sb.from('budget_expenses').update({
          platform: form.platform,
          title: form.title || null,
          amount: parseFloat(form.amount),
          date: form.date || null,
          status: form.status,
        }).eq('id', initialData.id)
        if (error) throw error
        setToast({ message: 'Harcama başarıyla güncellendi.', type: 'success' })
      } else {
        const { error } = await sb.from('budget_expenses').insert({
          platform: form.platform,
          title: form.title || null,
          amount: parseFloat(form.amount),
          date: form.date || null,
          status: form.status,
        })
        if (error) throw error
        setToast({ message: 'Harcama başarıyla eklendi.', type: 'success' })
        setForm(DEFAULT_FORM)
      }
      closeModal()
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
      {!isControlled && (
        <button onClick={() => setInternalOpen(true)} style={addBtnStyle(accentColor)}>{buttonLabel}</button>
      )}
      <ModalBase isOpen={open} onClose={closeModal} title={mode === 'edit' ? 'Harcamayı Düzenle' : 'Harcama Ekle'}>
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
            <button type="button" onClick={closeModal} style={cancelBtnStyle()}>İptal</button>
            <button type="submit" disabled={loading} style={submitBtnStyle(accentColor, loading)}>
              {loading ? 'Kaydediliyor...' : mode === 'edit' ? 'Düzenle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </ModalBase>
    </>
  )
}

export function EditBudgetExpenseButton({ row, accentColor = '#22c55e' }: { row: Record<string, unknown>; accentColor?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <EditButton onClick={() => setOpen(true)} />
      <BudgetExpenseModal mode="edit" initialData={row as ExpenseData} accentColor={accentColor} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
