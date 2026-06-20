'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ModalBase, inputStyle, labelStyle, fieldStyle, cancelBtnStyle, submitBtnStyle, addBtnStyle } from './ModalBase'
import { Toast } from './Toast'
import { revalidateDashboard } from '@/app/actions'
import { EditButton } from './EditButton'

interface ToastState { message: string; type: 'success' | 'error' }

interface MeetingData {
  id?: string | number
  title?: string
  date?: string
  time?: string
  attendees?: string
  notes?: string
  status?: string
}

interface MeetingModalProps {
  mode?: 'add' | 'edit'
  initialData?: MeetingData
  open?: boolean
  onClose?: () => void
}

const DEFAULT_FORM = { title: '', date: '', time: '', attendees: '', notes: '', status: 'Planlandı' }

function buildForm(data?: MeetingData) {
  if (!data) return DEFAULT_FORM
  return {
    title: String(data.title ?? ''),
    date: String(data.date ?? ''),
    time: String(data.time ?? ''),
    attendees: String(data.attendees ?? ''),
    notes: String(data.notes ?? ''),
    status: String(data.status ?? 'Planlandı'),
  }
}

export function MeetingModal({ mode = 'add', initialData, open: externalOpen, onClose: externalClose }: MeetingModalProps) {
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
    if (!form.title || !form.date) return
    setLoading(true)
    try {
      const sb = createSupabaseBrowserClient()
      const { data: { user } } = await sb.auth.getUser()
      const authorEmail = user?.email ?? null
      if (mode === 'edit' && initialData?.id) {
        const { error } = await sb.from('meetings').update({
          title: form.title,
          date: form.date,
          time: form.time || null,
          attendees: form.attendees || null,
          notes: form.notes || null,
          status: form.status,
        }).eq('id', initialData.id)
        if (error) throw error
        if (form.notes) {
          const { error: noteErr } = await sb.from('meeting_notes').insert({
            meeting_id: initialData.id,
            content: form.notes,
            author: authorEmail,
          })
          if (noteErr) throw noteErr
        }
        setToast({ message: 'Toplantı başarıyla güncellendi.', type: 'success' })
      } else {
        const { data: inserted, error } = await sb.from('meetings').insert({
          title: form.title,
          date: form.date,
          time: form.time || null,
          attendees: form.attendees || null,
          notes: form.notes || null,
          status: form.status,
        }).select('id').single()
        if (error) throw error
        if (form.notes && inserted?.id) {
          const { error: noteErr } = await sb.from('meeting_notes').insert({
            meeting_id: inserted.id,
            content: form.notes,
            author: authorEmail,
          })
          if (noteErr) throw noteErr
        }
        setToast({ message: 'Toplantı başarıyla eklendi.', type: 'success' })
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
        <button onClick={() => setInternalOpen(true)} style={addBtnStyle('#14b8a6')}>+ Toplantı Ekle</button>
      )}
      <ModalBase isOpen={open} onClose={closeModal} title={mode === 'edit' ? 'Toplantıyı Düzenle' : 'Toplantı Ekle'}>
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
            <button type="button" onClick={closeModal} style={cancelBtnStyle()}>İptal</button>
            <button type="submit" disabled={loading} style={submitBtnStyle('#14b8a6', loading)}>
              {loading ? 'Kaydediliyor...' : mode === 'edit' ? 'Düzenle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </ModalBase>
    </>
  )
}

export function EditMeetingButton({ row }: { row: Record<string, unknown> }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <EditButton onClick={() => setOpen(true)} />
      <MeetingModal mode="edit" initialData={row as MeetingData} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
