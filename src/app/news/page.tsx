'use client'

import { useState, useEffect } from 'react'
import { Newspaper, Rss, Plus, Trash2, ExternalLink } from 'lucide-react'

const STORAGE_KEY = 'news_rss_feeds'

export default function NewsPage() {
  const [feeds, setFeeds] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setFeeds(JSON.parse(stored))
    } catch {}
  }, [])

  const persist = (next: string[]) => {
    setFeeds(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const addFeed = () => {
    const url = inputValue.trim()
    if (!url) return
    try { new URL(url) } catch {
      setError('Geçerli bir URL girin (örn: https://example.com/feed.xml)')
      return
    }
    if (feeds.includes(url)) { setError('Bu URL zaten ekli.'); return }
    persist([...feeds, url])
    setInputValue('')
    setError('')
  }

  return (
    <div>
      <div style={{ padding: '24px 32px', borderBottom: '1px solid #2a2a3a', backgroundColor: '#13131a', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Newspaper size={22} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>News</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>Oyun sektörü haber akışları</p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* RSS manager */}
        <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Rss size={18} color="#f59e0b" />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>RSS Kaynakları</span>
            {feeds.length > 0 && (
              <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '12px', fontWeight: 600 }}>
                {feeds.length}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="url"
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') addFeed() }}
              placeholder="RSS feed URL'si ekle (örn: https://example.com/feed.xml)"
              style={{ flex: 1, backgroundColor: '#0a0a0f', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#f1f5f9', outline: 'none' }}
              onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(245,158,11,0.6)' }}
              onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = '#2a2a3a' }}
            />
            <button
              onClick={addFeed}
              style={{ padding: '10px 16px', borderRadius: '8px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              Ekle
            </button>
          </div>

          {error && (
            <p style={{ fontSize: '12px', color: '#f87171', margin: '8px 0 0' }}>{error}</p>
          )}

          {feeds.length > 0 && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {feeds.map((url) => (
                <div
                  key={url}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: '#0a0a0f', border: '1px solid #2a2a3a', borderRadius: '8px' }}
                >
                  <Rss size={13} color="#f59e0b" style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '13px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {url}
                  </span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#475569', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'color 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#94a3b8' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#475569' }}
                  >
                    <ExternalLink size={13} />
                  </a>
                  <button
                    onClick={() => persist(feeds.filter((f) => f !== url))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '2px', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'color 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#475569' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Placeholder feed area */}
        <div style={{ backgroundColor: '#1a1a24', border: '1px dashed #2a2a3a', borderRadius: '12px', padding: '56px 32px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.15))', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Newspaper size={28} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>
            Haber kaynakları yakında eklenecek
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', margin: '0 auto' }}>
            RSS feed&apos;lerinizi ekledikten sonra oyun sektörü haberleri burada görüntülenecektir.
          </div>
        </div>
      </div>
    </div>
  )
}
