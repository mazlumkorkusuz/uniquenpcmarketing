'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ModalBase, inputStyle, labelStyle, fieldStyle, cancelBtnStyle, submitBtnStyle, addBtnStyle } from './ModalBase'
import { Toast } from './Toast'
import { revalidateDashboard } from '@/app/actions'
import { EditButton } from './EditButton'

interface ToastState { message: string; type: 'success' | 'error' }

interface PlatformData {
  id?: string | number
  name?: string
  type?: string
  contact_name?: string
  contact_email?: string
  website?: string
  status?: string
}

interface PlatformModalProps {
  mode?: 'add' | 'edit'
  initialData?: PlatformData
  open?: boolean
  onClose?: () => void
}

const DEFAULT_FORM = { name: '', type: '', contact_name: '', contact_email: '', website: '', status: 'Aktif' }

function buildForm(data?: PlatformData) {
  if (!data) return DEFAULT_FORM
  return {
    name: String(data.name ?? ''),
    type: String(data.type ?? ''),
    contact_name: String(data.contact_name ?? ''),
    contact_email: String(data.contact_email ?? ''),
    website: String(data.website ?? ''),
    status: String(data.status ?? 'Aktif'),
  }
}

export function PlatformModal({ mode = 'add', initialData, open: externalOpen, onClose: externalClose }: PlatformModalProps) {
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
        const { error } = await sb.from('crm_platforms').update({
          name: form.name,
          type: form.type || null,
          contact_name: form.contact_name || null,
          contact_email: form.contact_email || null,
          website: form.website || null,
          status: form.status,
        }).eq('id', initialData.id)
        if (error) throw error
        setToast({ message: 'Platform başarıyla güncellendi.', type: 'success' })
      } else {
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
        <button onClick={() => setInternalOpen(true)} style={addBtnStyle('#3b82f6')}>+ Platform Ekle</button>
      )}
      <ModalBase isOpen={open} onClose={closeModal} title={mode === 'edit' ? 'Platformu Düzenle' : 'Platform Ekle'}>
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
            <button type="button" onClick={closeModal} style={cancelBtnStyle()}>İptal</button>
            <button type="submit" disabled={loading} style={submitBtnStyle('#3b82f6', loading)}>
              {loading ? 'Kaydediliyor...' : mode === 'edit' ? 'Düzenle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </ModalBase>
    </>
  )
}

export function EditPlatformButton({ row }: { row: Record<string, unknown> }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <EditButton onClick={() => setOpen(true)} />
      <PlatformModal mode="edit" initialData={row as PlatformData} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
