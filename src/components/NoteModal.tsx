'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ModalBase, inputStyle, labelStyle, fieldStyle, cancelBtnStyle, submitBtnStyle, addBtnStyle } from './ModalBase'
import { Toast } from './Toast'
import { revalidateDashboard } from '@/app/actions'
import { EditButton } from './EditButton'

interface ToastState { message: string; type: 'success' | 'error' }

interface NoteData {
  id?: string | number
  title?: string
  content?: string
}

interface NoteModalProps {
  mode?: 'add' | 'edit'
  initialData?: NoteData
  open?: boolean
  onClose?: () => void
}

const DEFAULT_FORM = { title: '', content: '' }

function buildForm(data?: NoteData) {
  if (!data) return DEFAULT_FORM
  return {
    title: String(data.title ?? ''),
    content: String(data.content ?? ''),
  }
}

export function NoteModal({ mode = 'add', initialData, open: externalOpen, onClose: externalClose }: NoteModalProps) {
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
    if (!form.title) return
    setLoading(true)
    try {
      const sb = createSupabaseBrowserClient()
      if (mode === 'edit' && initialData?.id) {
        const { error } = await sb.from('notes').update({
          title: form.title,
          content: form.content || null,
        }).eq('id', initialData.id)
        if (error) throw error
        setToast({ message: 'Not başarıyla güncellendi.', type: 'success' })
      } else {
        const { error } = await sb.from('notes').insert({
          title: form.title,
          content: form.content || null,
        })
        if (error) throw error
        setToast({ message: 'Not başarıyla eklendi.', type: 'success' })
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
        <button onClick={() => setInternalOpen(true)} style={addBtnStyle('#f59e0b')}>+ Not Ekle</button>
      )}
      <ModalBase isOpen={open} onClose={closeModal} title={mode === 'edit' ? 'Notu Düzenle' : 'Not Ekle'}>
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
            <button type="button" onClick={closeModal} style={cancelBtnStyle()}>İptal</button>
            <button type="submit" disabled={loading} style={submitBtnStyle('#f59e0b', loading)}>
              {loading ? 'Kaydediliyor...' : mode === 'edit' ? 'Düzenle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </ModalBase>
    </>
  )
}

export function EditNoteButton({ row }: { row: Record<string, unknown> }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <EditButton onClick={() => setOpen(true)} />
      <NoteModal mode="edit" initialData={row as NoteData} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
