'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, X, Edit2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { revalidateDashboard } from '@/app/actions'
import { EditButton } from './EditButton'

interface PostData {
  id?: string | number
  title?: string
  content?: string
  url?: string
  scheduled_date?: string
  scheduled_time?: string
  status?: string
}

interface PostModalProps {
  platform: string
  platformColor: string
  mode?: 'add' | 'edit'
  initialData?: PostData
  open?: boolean
  onClose?: () => void
}

const STATUS_OPTIONS = ['Taslak', 'Planlandı', 'Yayınlandı']
const DEFAULT_FORM = { title: '', content: '', url: '', scheduled_date: '', scheduled_time: '', status: 'Taslak' }

function buildForm(data?: PostData) {
  if (!data) return DEFAULT_FORM
  return {
    title: String(data.title ?? ''),
    content: String(data.content ?? ''),
    url: String(data.url ?? ''),
    scheduled_date: String(data.scheduled_date ?? ''),
    scheduled_time: String(data.scheduled_time ?? ''),
    status: String(data.status ?? 'Taslak'),
  }
}

export function PostModal({ platform, platformColor, mode = 'add', initialData, open: externalOpen, onClose: externalClose }: PostModalProps) {
  const isControlled = externalOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? externalOpen! : internalOpen
  const closeModal = isControlled ? (externalClose ?? (() => {})) : () => { reset(); setInternalOpen(false) }

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const [form, setForm] = useState(() => buildForm(initialData))

  useEffect(() => {
    if (open) {
      setForm(buildForm(initialData))
      setError('')
    }
  }, [open])

  const reset = () => {
    setForm(DEFAULT_FORM)
    setError('')
  }

  const close = () => {
    if (!isControlled) reset()
    closeModal()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const sb = createSupabaseBrowserClient()
      if (mode === 'edit' && initialData?.id) {
        const { error: err } = await sb.from('social_media_posts').update({
          title: form.title || null,
          content: form.content || null,
          url: form.url || null,
          scheduled_date: form.scheduled_date || null,
          scheduled_time: form.scheduled_time || null,
          status: form.status,
        }).eq('id', initialData.id)
        if (err) throw err
      } else {
        const { error: err } = await sb.from('social_media_posts').insert({
          platform,
          title: form.title || null,
          content: form.content || null,
          url: form.url || null,
          scheduled_date: form.scheduled_date || null,
          scheduled_time: form.scheduled_time || null,
          status: form.status,
        })
        if (err) throw err
      }
      await revalidateDashboard()
      router.refresh()
      close()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(23,18,43,0.35)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
  }
  const modal: React.CSSProperties = {
    backgroundColor: '#FFFFFF', border: '1px solid #E8E4F1', borderRadius: '14px',
    width: '100%', maxWidth: '480px', padding: '28px', position: 'relative',
    boxShadow: '0 25px 60px rgba(0,0,0,0.12)',
  }
  const label: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A4462', marginBottom: '6px', }
  const input: React.CSSProperties = { width: '100%', backgroundColor: '#FFFFFF', border: '1px solid #E8E4F1', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#17122B', outline: 'none', boxSizing: 'border-box' }

  const TitleIcon = mode === 'edit' ? Edit2 : PlusCircle

  return (
    <>
      {!isControlled && (
        <button
          onClick={() => setInternalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '40px', padding: '0 16px', borderRadius: 'var(--r-sm)', background: 'var(--gradient)', border: 'none', color: '#FFFFFF', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        >
          <PlusCircle size={15} />
          Gönderi Ekle
        </button>
      )}

      {open && (
        <div style={overlay} onClick={(e) => e.target === e.currentTarget && close()}>
          <div style={modal}>
            <button onClick={close} style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', color: '#655F7D', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}>
              <X size={18} />
            </button>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: platformColor + '25', border: `1px solid ${platformColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <TitleIcon size={18} color={platformColor} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#17122B', margin: 0, marginBottom: '4px' }}>
                {mode === 'edit' ? 'Gönderiyi Düzenle' : 'Gönderi Ekle'}
              </h2>
              <p style={{ fontSize: '13px', color: '#655F7D', margin: 0 }}>{platform.charAt(0).toUpperCase() + platform.slice(1)} için içerik {mode === 'edit' ? 'düzenle' : 'planla'}</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={label}>Başlık</label>
                <input
                  type="text"
                  placeholder="Gönderi başlığı..."
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  style={input}
                />
              </div>

              <div>
                <label style={label}>İçerik</label>
                <textarea
                  placeholder="Gönderi içeriği..."
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={4}
                  style={{ ...input, resize: 'vertical', minHeight: '90px', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={label}>Link (opsiyonel)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  style={input}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={label}>Planlanan Tarih</label>
                  <input
                    type="date"
                    value={form.scheduled_date}
                    onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
                    style={{ ...input, colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label style={label}>Planlanan Saat</label>
                  <input
                    type="time"
                    value={form.scheduled_time}
                    onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))}
                    style={{ ...input, colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div>
                <label style={label}>Durum</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  style={{ ...input, cursor: 'pointer', appearance: 'none' }}
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s} style={{ backgroundColor: '#FFFFFF' }}>{s}</option>)}
                </select>
              </div>

              {error && (
                <div style={{ padding: '10px 12px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '13px', color: '#B91C1C' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button type="button" onClick={close} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #E8E4F1', backgroundColor: 'transparent', color: '#655F7D', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ flex: 2, height: '40px', padding: '0 16px', borderRadius: 'var(--r-sm)', border: 'none', background: 'var(--gradient)', color: '#FFFFFF', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? 'Kaydediliyor...' : mode === 'edit' ? 'Düzenle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export function EditPostButton({ row, platform, platformColor }: { row: Record<string, unknown>; platform: string; platformColor: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <EditButton onClick={() => setOpen(true)} />
      <PostModal mode="edit" initialData={row as PostData} platform={platform} platformColor={platformColor} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
