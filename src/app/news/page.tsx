'use client'

import { useEffect, useState, useCallback } from 'react'

interface Article {
  title: string
  summary: string
  link: string
  image: string
  date: string
}

interface TwitchStream {
  user_name: string
  game_name: string
  viewer_count: number
  thumbnail_url: string
  title: string
}

interface TwitchCategory {
  name: string
  id: string
}

interface KickStream {
  slug: string
  user: { username: string }
  category: { name: string } | null
  viewers: number
  session_title?: string
}

interface KickTag {
  tag: string
}

function formatViewers(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function SkeletonCard() {
  return (
    <div style={{ background: '#1e293b', borderRadius: 12, overflow: 'hidden', border: '1px solid #334155' }}>
      <div style={{ height: 160, background: '#334155', animation: 'pulse 1.5s infinite' }} />
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ height: 16, background: '#334155', borderRadius: 4, marginBottom: 10, animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 12, background: '#334155', borderRadius: 4, marginBottom: 6, animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 12, background: '#334155', borderRadius: 4, width: '70%', animation: 'pulse 1.5s infinite' }} />
      </div>
    </div>
  )
}

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [newsLoading, setNewsLoading] = useState(true)

  const [twitchStreams, setTwitchStreams] = useState<TwitchStream[]>([])
  const [twitchCategories, setTwitchCategories] = useState<TwitchCategory[]>([])
  const [twitchLoading, setTwitchLoading] = useState(true)
  const [twitchUpdated, setTwitchUpdated] = useState<Date | null>(null)

  const [kickStreams, setKickStreams] = useState<KickStream[]>([])
  const [kickTags, setKickTags] = useState<KickTag[]>([])
  const [kickLoading, setKickLoading] = useState(true)
  const [kickUpdated, setKickUpdated] = useState<Date | null>(null)

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('/api/news')
      if (res.ok) {
        const data = await res.json()
        setArticles(data.articles ?? [])
      }
    } finally {
      setNewsLoading(false)
    }
  }, [])

  const fetchTwitch = useCallback(async () => {
    setTwitchLoading(true)
    try {
      const res = await fetch('/api/twitch-live')
      if (res.ok) {
        const data = await res.json()
        setTwitchStreams(data.streams ?? [])
        setTwitchCategories(data.categories ?? [])
        setTwitchUpdated(new Date())
      }
    } finally {
      setTwitchLoading(false)
    }
  }, [])

  const fetchKick = useCallback(async () => {
    setKickLoading(true)
    try {
      const [featuredRes, tagsRes] = await Promise.all([
        fetch('https://web.kick.com/api/v1/livestreams/featured?language=tr'),
        fetch('https://kick.com/api/v2/tags/trending?limit=10'),
      ])
      if (featuredRes.ok) {
        const data = await featuredRes.json()
        const list: KickStream[] = Array.isArray(data) ? data : (data.data ?? data.livestreams ?? [])
        setKickStreams(list.slice(0, 10))
      }
      if (tagsRes.ok) {
        const tagData = await tagsRes.json()
        const tags: KickTag[] = Array.isArray(tagData) ? tagData : (tagData.data ?? tagData.tags ?? [])
        setKickTags(tags.slice(0, 10))
      }
      setKickUpdated(new Date())
    } finally {
      setKickLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNews()
    fetchTwitch()
    fetchKick()

    const newsInterval = setInterval(fetchNews, 5 * 60 * 1000)
    const twitchInterval = setInterval(fetchTwitch, 10 * 60 * 1000)
    const kickInterval = setInterval(fetchKick, 10 * 60 * 1000)

    return () => {
      clearInterval(newsInterval)
      clearInterval(twitchInterval)
      clearInterval(kickInterval)
    }
  }, [fetchNews, fetchTwitch, fetchKick])

  const lastUpdatedLabel = (d: Date | null) =>
    d ? `Son güncelleme: ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : ''

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', color: '#f1f5f9' }}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        .news-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        .news-card { transition: transform 0.2s, box-shadow 0.2s; }
        .stream-row:hover { background: rgba(255,255,255,0.05) !important; }
      `}</style>

      {/* Header */}
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 28px', color: '#f1f5f9' }}>
        📰 News & Live
      </h1>

      {/* TOP: PC Gamer News Grid */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8', marginBottom: 18, textTransform: 'uppercase', letterSpacing: 1 }}>
          PC Gamer Haberleri
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          {newsLoading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : articles.map((article, i) => (
                <div
                  key={i}
                  className="news-card"
                  style={{ background: '#1e293b', borderRadius: 12, overflow: 'hidden', border: '1px solid #334155', display: 'flex', flexDirection: 'column' }}
                >
                  {article.image && (
                    <img
                      src={article.image}
                      alt={article.title}
                      style={{ width: '100%', height: 160, objectFit: 'cover' }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9', margin: 0, lineHeight: 1.4 }}>
                      {article.title}
                    </p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.5, flex: 1 }}>
                      {article.summary}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{formatDate(article.date)}</span>
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}
                      >
                        Haberi Oku →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </section>

      {/* BOTTOM: Twitch + Kick side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* TWITCH */}
        <section style={{ background: '#1e293b', borderRadius: 16, border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(145,71,255,0.1)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#9147ff">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
            </svg>
            <div>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#c4b5fd' }}>Twitch Canlı</span>
              {twitchUpdated && <div style={{ fontSize: 11, color: '#64748b' }}>{lastUpdatedLabel(twitchUpdated)}</div>}
            </div>
          </div>

          <div style={{ padding: '12px 20px' }}>
            {twitchLoading ? (
              <div style={{ color: '#64748b', fontSize: 13, padding: '20px 0' }}>Yükleniyor...</div>
            ) : (
              <>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  Top 10 Yayıncı
                </p>
                {twitchStreams.map((s, i) => (
                  <div
                    key={i}
                    className="stream-row"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 8, cursor: 'default' }}
                  >
                    <span style={{ fontSize: 12, color: '#64748b', width: 22, textAlign: 'right', flexShrink: 0 }}>#{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.user_name}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.game_name}
                      </p>
                    </div>
                    <span style={{ background: '#7c3aed', color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {formatViewers(s.viewer_count)}
                    </span>
                  </div>
                ))}

                <p style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 1, margin: '14px 0 8px' }}>
                  Top 5 Kategori
                </p>
                {twitchCategories.map((c, i) => (
                  <div
                    key={i}
                    className="stream-row"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 8 }}
                  >
                    <span style={{ fontSize: 12, color: '#64748b', width: 22, textAlign: 'right', flexShrink: 0 }}>#{i + 1}</span>
                    <span style={{ fontSize: 13, color: '#c4b5fd', flex: 1 }}>{c.name}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        {/* KICK */}
        <section style={{ background: '#1e293b', borderRadius: 16, border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(83,228,62,0.08)' }}>
            <svg width="22" height="22" viewBox="0 0 50 50" fill="#53e43e">
              <path d="M10 5 L10 45 L20 45 L20 30 L28 38 L40 38 L26 24 L40 10 L28 10 L20 18 L20 5 Z"/>
            </svg>
            <div>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#86efac' }}>Kick Canlı</span>
              {kickUpdated && <div style={{ fontSize: 11, color: '#64748b' }}>{lastUpdatedLabel(kickUpdated)}</div>}
            </div>
          </div>

          <div style={{ padding: '12px 20px' }}>
            {kickLoading ? (
              <div style={{ color: '#64748b', fontSize: 13, padding: '20px 0' }}>Yükleniyor...</div>
            ) : kickStreams.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: 13, padding: '20px 0' }}>
                Türkçe yayın bulunamadı veya API erişilemedi.
              </div>
            ) : (
              <>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  Top 10 Yayıncı
                </p>
                {kickStreams.map((s, i) => (
                  <div
                    key={i}
                    className="stream-row"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 8, cursor: 'default' }}
                  >
                    <span style={{ fontSize: 12, color: '#64748b', width: 22, textAlign: 'right', flexShrink: 0 }}>#{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.user?.username ?? s.slug}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.category?.name ?? '—'}
                      </p>
                    </div>
                    <span style={{ background: '#16a34a', color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {formatViewers(s.viewers)}
                    </span>
                  </div>
                ))}

                {kickTags.length > 0 && (
                  <>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: 1, margin: '14px 0 8px' }}>
                      Trend Etiketler
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {kickTags.map((t, i) => (
                        <span key={i} style={{ background: 'rgba(83,228,62,0.12)', color: '#86efac', borderRadius: 20, padding: '3px 10px', fontSize: 12, border: '1px solid rgba(83,228,62,0.25)' }}>
                          {t.tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
