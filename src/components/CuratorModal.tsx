'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ModalBase, inputStyle, labelStyle, fieldStyle, cancelBtnStyle, submitBtnStyle, addBtnStyle } from './ModalBase'
import { Toast } from './Toast'
import { revalidateDashboard } from '@/app/actions'
import { EditButton } from './EditButton'

interface ToastState { message: string; type: 'success' | 'error' }

interface CuratorData {
  id?: string | number
  name?: string
  platform?: string
  genre?: string
  followers?: number | string
  email?: string
  status?: string
}

interface CuratorModalProps {
  mode?: 'add' | 'edit'
  initialData?: CuratorData
  open?: boolean
  onClose?: () => void
}

const DEFAULT_FORM = { name: '', platform: '', genre: '', followers: '', email: '', status: 'Aktif' }

function buildForm(data?: CuratorData) {
  if (!data) return DEFAULT_FORM
  return {
    name: String(data.name ?? ''),
    platform: String(data.platform ?? ''),
    genre: String(data.genre ?? ''),
    followers: data.followers != null ? String(data.followers) : '',
    email: String(data.email ?? ''),
    status: String(data.status ?? 'Aktif'),
  }
}

export function CuratorModal({ mode = 'add', initialData, open: externalOpen, onClose: externalClose }: CuratorModalProps) {
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
    if (!form.name) return
    setLoading(true)
    try {
      const sb = createSupabaseBrowserClient()
      if (mode === 'edit' && initialData?.id) {
        const { error } = await sb.from('curators').update({
          name: form.name,
          platform: form.platform || null,
          genre: form.genre || null,
          followers: form.followers ? parseInt(form.followers) : null,
          email: form.email || null,
          status: form.status,
        }).eq('id', initialData.id)
        if (error) throw error
        setToast({ message: 'Küratör başarıyla güncellendi.', type: 'success' })
      } else {
        const { error } = await sb.from('curators').insert({
          name: form.name,
          platform: form.platform || null,
          genre: form.genre || null,
          followers: form.followers ? parseInt(form.followers) : null,
          email: form.email || null,
          status: form.status,
        })
        if (error) throw error
        setToast({ message: 'Küratör başarıyla eklendi.', type: 'success' })
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
        <button onClick={() => setInternalOpen(true)} style={addBtnStyle('#14b8a6')}>+ Küratör Ekle</button>
      )}
      <ModalBase isOpen={open} onClose={closeModal} title={mode === 'edit' ? 'Küratörü Düzenle' : 'Küratör Ekle'}>
        <form onSubmit={submit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Küratör Adı *</label>
            <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Küratör adı" required />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Platform</label>
            <input style={inputStyle} value={form.platform} onChange={e => set('platform', e.target.value)} placeholder="örn. Steam" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Tür</label>
            <input style={inputStyle} value={form.genre} onChange={e => set('genre', e.target.value)} placeholder="örn. RPG, Action, Indie" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Takipçi Sayısı</label>
            <input style={inputStyle} type="number" min="0" value={form.followers} onChange={e => set('followers', e.target.value)} placeholder="0" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>E-posta</label>
            <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="ornek@mail.com" />
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

export function EditCuratorButton({ row }: { row: Record<string, unknown> }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <EditButton onClick={() => setOpen(true)} />
      <CuratorModal mode="edit" initialData={row as CuratorData} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
