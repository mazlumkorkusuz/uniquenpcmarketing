'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ModalBase, inputStyle, labelStyle, fieldStyle, cancelBtnStyle, submitBtnStyle } from './ModalBase'
import { Toast } from './Toast'
import { revalidateDashboard } from '@/app/actions'

interface ToastState { message: string; type: 'success' | 'error' }

interface PostData {
  id?: string | number
  username?: string
  subreddit?: string
  title?: string
  url?: string
  status?: string
  posted_at?: string
  upvotes?: number | string
  comments?: number | string
  [key: string]: unknown
}

interface RedditPostModalProps {
  accounts: Array<{ id?: string | number; username?: unknown; [key: string]: unknown }>
  mode?: 'add' | 'edit'
  initialData?: PostData
  open: boolean
  onClose: () => void
}

const DEFAULT_FORM = { username: '', subreddit: '', title: '', url: '', status: 'Yayında', posted_at: '', upvotes: '', comments: '' }

function buildForm(data?: PostData) {
  if (!data) return DEFAULT_FORM
  return {
    username: String(data.username ?? ''),
    subreddit: String(data.subreddit ?? ''),
    title: String(data.title ?? ''),
    url: String(data.url ?? ''),
    status: String(data.status ?? 'Yayında'),
    posted_at: data.posted_at ? String(data.posted_at).slice(0, 10) : '',
    upvotes: data.upvotes != null ? String(data.upvotes) : '',
    comments: data.comments != null ? String(data.comments) : '',
  }
}

export function RedditPostModal({ accounts, mode = 'add', initialData, open, onClose }: RedditPostModalProps) {
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [form, setForm] = useState(() => buildForm(initialData))
  const router = useRouter()

  useEffect(() => {
    if (open) setForm(buildForm(initialData))
  }, [open])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const dismiss = useCallback(() => setToast(null), [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const sb = createSupabaseBrowserClient()
      const payload = {
        username: form.username || null,
        subreddit: form.subreddit || null,
        title: form.title || null,
        url: form.url || null,
        status: form.status,
        posted_at: form.posted_at || null,
        upvotes: form.upvotes ? parseInt(form.upvotes) : null,
        comments: form.comments ? parseInt(form.comments) : null,
      }
      if (mode === 'edit' && initialData?.id) {
        const { error } = await sb.from('reddit_posts').update(payload).eq('id', initialData.id)
        if (error) throw error
        setToast({ message: 'Post başarıyla güncellendi.', type: 'success' })
      } else {
        const { error } = await sb.from('reddit_posts').insert(payload)
        if (error) throw error
        setToast({ message: 'Post başarıyla eklendi.', type: 'success' })
        setForm(DEFAULT_FORM)
      }
      onClose()
      await revalidateDashboard()
      router.refresh()
    } catch (err: unknown) {
      setToast({ message: (err as Error).message || 'Bir hata oluştu.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismiss} />}
      <ModalBase isOpen={open} onClose={onClose} title={mode === 'edit' ? 'Postu Düzenle' : 'Post Ekle'}>
        <form onSubmit={submit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Hesap</label>
            <select style={inputStyle} value={form.username} onChange={e => set('username', e.target.value)}>
              <option value="">Seçiniz...</option>
              {accounts.map(a => (
                <option key={String(a.id)} value={String(a.username ?? '')}>u/{String(a.username ?? '')}</option>
              ))}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Subreddit</label>
            <input style={inputStyle} value={form.subreddit} onChange={e => set('subreddit', e.target.value)} placeholder="gaming" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Başlık</label>
            <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Post başlığı..." />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>URL</label>
            <input style={inputStyle} value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://reddit.com/r/..." />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Tarih</label>
            <input style={{ ...inputStyle, colorScheme: 'dark' }} type="date" value={form.posted_at} onChange={e => set('posted_at', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Upvote</label>
              <input style={inputStyle} type="number" min="0" value={form.upvotes} onChange={e => set('upvotes', e.target.value)} placeholder="0" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Yorum</label>
              <input style={inputStyle} type="number" min="0" value={form.comments} onChange={e => set('comments', e.target.value)} placeholder="0" />
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Durum</label>
            <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="Yayında">Yayında</option>
              <option value="Silindi">Silindi</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle()}>İptal</button>
            <button type="submit" disabled={loading} style={submitBtnStyle('#ff4500', loading)}>
              {loading ? 'Kaydediliyor...' : mode === 'edit' ? 'Düzenle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </ModalBase>
    </>
  )
}
