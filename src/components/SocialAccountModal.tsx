'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ModalBase, inputStyle, labelStyle, fieldStyle, cancelBtnStyle, submitBtnStyle, addBtnStyle } from './ModalBase'
import { Toast } from './Toast'
import { revalidateDashboard } from '@/app/actions'

interface ToastState { message: string; type: 'success' | 'error' }

interface SocialAccountModalProps {
  table: string
  color: string
  usernameField?: string
  followersField?: string
  followingField?: string
  postsField?: string
}

export function SocialAccountModal({
  table,
  color,
  usernameField = 'username',
  followersField = 'followers',
  followingField = 'following',
  postsField = 'post_count',
}: SocialAccountModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [form, setForm] = useState({ username: '', followers: '', following: '', posts: '', status: 'Aktif' })
  const router = useRouter()

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username) return
    setLoading(true)
    try {
      const sb = createSupabaseBrowserClient()
      const row: Record<string, unknown> = {
        [usernameField]: form.username,
        [followersField]: form.followers ? parseInt(form.followers) : null,
        [followingField]: form.following ? parseInt(form.following) : null,
        [postsField]: form.posts ? parseInt(form.posts) : null,
        status: form.status,
      }
      const { error } = await sb.from(table).insert(row)
      if (error) throw error
      setToast({ message: 'Hesap başarıyla eklendi.', type: 'success' })
      setForm({ username: '', followers: '', following: '', posts: '', status: 'Aktif' })
      setOpen(false)
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
      <button onClick={() => setOpen(true)} style={addBtnStyle(color)}>+ Hesap Ekle</button>
      <ModalBase isOpen={open} onClose={() => setOpen(false)} title="Hesap Ekle">
        <form onSubmit={submit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Kullanıcı Adı *</label>
            <input style={inputStyle} value={form.username} onChange={e => set('username', e.target.value)} placeholder="kullanici_adi" required />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Takipçi Sayısı</label>
            <input style={inputStyle} type="number" min="0" value={form.followers} onChange={e => set('followers', e.target.value)} placeholder="0" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Takip Edilen</label>
            <input style={inputStyle} type="number" min="0" value={form.following} onChange={e => set('following', e.target.value)} placeholder="0" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Gönderi Sayısı</label>
            <input style={inputStyle} type="number" min="0" value={form.posts} onChange={e => set('posts', e.target.value)} placeholder="0" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Durum</label>
            <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="Aktif">Aktif</option>
              <option value="İnaktif">İnaktif</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={() => setOpen(false)} style={cancelBtnStyle()}>İptal</button>
            <button type="submit" disabled={loading} style={submitBtnStyle(color, loading)}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </ModalBase>
    </>
  )
}
