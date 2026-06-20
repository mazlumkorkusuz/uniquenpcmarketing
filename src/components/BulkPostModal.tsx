'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ModalBase, inputStyle, labelStyle, fieldStyle, cancelBtnStyle, submitBtnStyle } from './ModalBase'
import { Toast } from './Toast'
import { revalidateDashboard } from '@/app/actions'

interface ToastState { message: string; type: 'success' | 'error' }

const PLATFORMS = [
  { key: 'twitter',   label: 'Twitter',   color: '#1d9bf0', icon: '/icons/x.png' },
  { key: 'instagram', label: 'Instagram', color: '#e1306c', icon: '/icons/instagram.png' },
  { key: 'tiktok',    label: 'TikTok',    color: '#fe2c55', icon: '/icons/tiktok.png' },
  { key: 'linkedin',  label: 'LinkedIn',  color: '#0a66c2', icon: '/icons/linkedin.png' },
  { key: 'youtube',   label: 'YouTube',   color: '#ff4444', icon: '/icons/youtube.png' },
  { key: 'reddit',    label: 'Reddit',    color: '#ff4500', icon: '/icons/reddit.svg' },
  { key: 'ig',        label: 'IG',        color: '#c13584', icon: '/icons/instagram.png' },
]

const DEFAULT_FORM = { title: '', content: '', url: '', scheduled_date: '', scheduled_time: '', status: 'Taslak' }

export function BulkPostModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [form, setForm] = useState(DEFAULT_FORM)
  const router = useRouter()

  const togglePlatform = (key: string) =>
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const close = () => {
    setOpen(false)
    setForm(DEFAULT_FORM)
    setSelected([])
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selected.length === 0 || !form.title) return
    setLoading(true)
    try {
      const sb = createSupabaseBrowserClient()
      const rows = selected.map(platform => ({
        platform,
        title: form.title,
        content: form.content || null,
        url: form.url || null,
        scheduled_date: form.scheduled_date || null,
        scheduled_time: form.scheduled_time || null,
        status: form.status,
      }))
      const { error } = await sb.from('social_media_posts').insert(rows)
      if (error) throw error
      setToast({ message: `${selected.length} platform için gönderi başarıyla oluşturuldu.`, type: 'success' })
      close()
      await revalidateDashboard()
      router.refresh()
    } catch (err: unknown) {
      setToast({ message: (err as Error).message || 'Bir hata oluştu.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const dismiss = useCallback(() => setToast(null), [])
  const isDisabled = loading || selected.length === 0

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismiss} />}
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '9px 18px',
          borderRadius: '9px',
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          border: 'none',
          color: '#fff',
          fontWeight: 700,
          fontSize: '14px',
          cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(124,58,237,0.35)',
          whiteSpace: 'nowrap',
        }}
      >
        🚀 Toplu Gönderi Ekle
      </button>
      <ModalBase isOpen={open} onClose={close} title="Toplu Gönderi Ekle">
        <form onSubmit={submit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Platformlar *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
              {PLATFORMS.map(p => {
                const isSelected = selected.includes(p.key)
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => togglePlatform(p.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '7px',
                      border: `1px solid ${isSelected ? p.color : '#2a2a3a'}`,
                      backgroundColor: isSelected ? `${p.color}22` : '#13131a',
                      color: isSelected ? p.color : '#64748b',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <Image src={p.icon} alt={p.label} width={14} height={14} style={{ objectFit: 'contain', borderRadius: '2px', flexShrink: 0 }} />
                    {p.label}
                  </button>
                )
              })}
            </div>
            {selected.length > 0 && (
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                {selected.length} platform seçildi
              </div>
            )}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Başlık *</label>
            <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Gönderi başlığı" required />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Link (opsiyonel)</label>
            <input style={inputStyle} type="url" value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://..." />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>İçerik</label>
            <textarea
              style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
              value={form.content}
              onChange={e => set('content', e.target.value)}
              placeholder="Gönderi içeriği..."
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Planlanan Tarih</label>
              <input style={{ ...inputStyle, colorScheme: 'dark' }} type="date" value={form.scheduled_date} onChange={e => set('scheduled_date', e.target.value)} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Planlanan Saat</label>
              <input style={{ ...inputStyle, colorScheme: 'dark' }} type="time" value={form.scheduled_time} onChange={e => set('scheduled_time', e.target.value)} />
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Durum</label>
            <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="Taslak">Taslak</option>
              <option value="Planlandı">Planlandı</option>
              <option value="Yayınlandı">Yayınlandı</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={close} style={cancelBtnStyle()}>İptal</button>
            <button type="submit" disabled={isDisabled} style={submitBtnStyle('#7c3aed', isDisabled)}>
              {loading ? 'Oluşturuluyor...' : `${selected.length > 0 ? selected.length + ' Platform İçin ' : ''}Gönderi Oluştur`}
            </button>
          </div>
        </form>
      </ModalBase>
    </>
  )
}
