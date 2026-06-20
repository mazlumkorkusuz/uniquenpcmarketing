'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ModalBase, inputStyle, labelStyle, fieldStyle, cancelBtnStyle, submitBtnStyle, addBtnStyle } from './ModalBase'
import { Toast } from './Toast'
import { revalidateDashboard } from '@/app/actions'
import { EditButton } from './EditButton'

interface ToastState { message: string; type: 'success' | 'error' }

interface RedditAccountData {
  id?: string | number
  username?: string
  karma?: number | string
  comment_karma?: number | string
  post_count?: number | string
  niche?: string
  status?: string
}

interface RedditAccountModalProps {
  mode?: 'add' | 'edit'
  initialData?: RedditAccountData
  open?: boolean
  onClose?: () => void
}

const DEFAULT_FORM = { username: '', karma: '', comment_karma: '', post_count: '', niche: '', status: 'Aktif' }

function buildForm(data?: RedditAccountData) {
  if (!data) return DEFAULT_FORM
  return {
    username: String(data.username ?? ''),
    karma: data.karma != null ? String(data.karma) : '',
    comment_karma: data.comment_karma != null ? String(data.comment_karma) : '',
    post_count: data.post_count != null ? String(data.post_count) : '',
    niche: String(data.niche ?? ''),
    status: String(data.status ?? 'Aktif'),
  }
}

export function RedditAccountModal({ mode = 'add', initialData, open: externalOpen, onClose: externalClose }: RedditAccountModalProps) {
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
    if (!form.username) return
    setLoading(true)
    try {
      const sb = createSupabaseBrowserClient()
      if (mode === 'edit' && initialData?.id) {
        const { error } = await sb.from('reddit_accounts').update({
          username: form.username,
          karma: form.karma ? parseInt(form.karma) : null,
          comment_karma: form.comment_karma ? parseInt(form.comment_karma) : null,
          post_count: form.post_count ? parseInt(form.post_count) : null,
          niche: form.niche || null,
          status: form.status,
        }).eq('id', initialData.id)
        if (error) throw error
        setToast({ message: 'Hesap başarıyla güncellendi.', type: 'success' })
      } else {
        const { error } = await sb.from('reddit_accounts').insert({
          username: form.username,
          karma: form.karma ? parseInt(form.karma) : null,
          comment_karma: form.comment_karma ? parseInt(form.comment_karma) : null,
          post_count: form.post_count ? parseInt(form.post_count) : null,
          niche: form.niche || null,
          status: form.status,
        })
        if (error) throw error
        setToast({ message: 'Hesap başarıyla eklendi.', type: 'success' })
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
        <button onClick={() => setInternalOpen(true)} style={addBtnStyle('#ff4500')}>+ Hesap Ekle</button>
      )}
      <ModalBase isOpen={open} onClose={closeModal} title={mode === 'edit' ? 'Reddit Hesabını Düzenle' : 'Reddit Hesabı Ekle'}>
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
            <label style={labelStyle}>Yorum Karma</label>
            <input style={inputStyle} type="number" min="0" value={form.comment_karma} onChange={e => set('comment_karma', e.target.value)} placeholder="0" />
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
            <button type="button" onClick={closeModal} style={cancelBtnStyle()}>İptal</button>
            <button type="submit" disabled={loading} style={submitBtnStyle('#ff4500', loading)}>
              {loading ? 'Kaydediliyor...' : mode === 'edit' ? 'Düzenle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </ModalBase>
    </>
  )
}

export function EditRedditAccountButton({ row }: { row: Record<string, unknown> }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <EditButton onClick={() => setOpen(true)} />
      <RedditAccountModal mode="edit" initialData={row as RedditAccountData} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
