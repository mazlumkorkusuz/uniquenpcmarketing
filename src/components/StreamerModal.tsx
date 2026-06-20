'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ModalBase, inputStyle, labelStyle, fieldStyle, cancelBtnStyle, submitBtnStyle, addBtnStyle } from './ModalBase'
import { Toast } from './Toast'
import { revalidateDashboard } from '@/app/actions'
import { EditButton } from './EditButton'

interface ToastState { message: string; type: 'success' | 'error' }

interface StreamerData {
  id?: string | number
  channel_name?: string
  username?: string
  followers?: number | string
  language?: string
  status?: string
}

interface StreamerModalProps {
  table: string
  color: string
  mode?: 'add' | 'edit'
  initialData?: StreamerData
  open?: boolean
  onClose?: () => void
}

const DEFAULT_FORM = { channel_name: '', username: '', followers: '', language: '', status: 'Aktif' }

function buildForm(data?: StreamerData) {
  if (!data) return DEFAULT_FORM
  return {
    channel_name: String(data.channel_name ?? ''),
    username: String(data.username ?? ''),
    followers: data.followers != null ? String(data.followers) : '',
    language: String(data.language ?? ''),
    status: String(data.status ?? 'Aktif'),
  }
}

export function StreamerModal({ table, color, mode = 'add', initialData, open: externalOpen, onClose: externalClose }: StreamerModalProps) {
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
    if (!form.username && !form.channel_name) return
    setLoading(true)
    try {
      const sb = createSupabaseBrowserClient()
      if (mode === 'edit' && initialData?.id) {
        const { error } = await sb.from(table).update({
          channel_name: form.channel_name || null,
          username: form.username || null,
          followers: form.followers ? parseInt(form.followers) : null,
          language: form.language || null,
          status: form.status,
        }).eq('id', initialData.id)
        if (error) throw error
        setToast({ message: 'Yayıncı başarıyla güncellendi.', type: 'success' })
      } else {
        const { error } = await sb.from(table).insert({
          channel_name: form.channel_name || null,
          username: form.username || null,
          followers: form.followers ? parseInt(form.followers) : null,
          language: form.language || null,
          status: form.status,
        })
        if (error) throw error
        setToast({ message: 'Yayıncı başarıyla eklendi.', type: 'success' })
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
        <button onClick={() => setInternalOpen(true)} style={addBtnStyle(color)}>+ Yayıncı Ekle</button>
      )}
      <ModalBase isOpen={open} onClose={closeModal} title={mode === 'edit' ? 'Yayıncıyı Düzenle' : 'Yayıncı Ekle'}>
        <form onSubmit={submit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Kanal Adı</label>
            <input style={inputStyle} value={form.channel_name} onChange={e => set('channel_name', e.target.value)} placeholder="Kanal adı" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Kullanıcı Adı *</label>
            <input style={inputStyle} value={form.username} onChange={e => set('username', e.target.value)} placeholder="kullanici_adi" required />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Takipçi Sayısı</label>
            <input style={inputStyle} type="number" min="0" value={form.followers} onChange={e => set('followers', e.target.value)} placeholder="0" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Dil</label>
            <input style={inputStyle} value={form.language} onChange={e => set('language', e.target.value)} placeholder="örn. TR, EN, JP" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Durum</label>
            <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="Aktif">Aktif</option>
              <option value="İnaktif">İnaktif</option>
              <option value="Pasif">Pasif</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={closeModal} style={cancelBtnStyle()}>İptal</button>
            <button type="submit" disabled={loading} style={submitBtnStyle(color, loading)}>
              {loading ? 'Kaydediliyor...' : mode === 'edit' ? 'Düzenle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </ModalBase>
    </>
  )
}

export function EditStreamerButton({ row, table, color }: { row: Record<string, unknown>; table: string; color: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <EditButton onClick={() => setOpen(true)} />
      <StreamerModal mode="edit" initialData={row as StreamerData} table={table} color={color} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
