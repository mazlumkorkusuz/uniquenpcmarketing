'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import s from '@/app/dashboard.module.css'

interface Stream {
  user_name: string
  user_login: string
  game_name: string
  viewer_count: number
  thumbnail_url: string
  title: string
}

interface Category {
  id: string
  name: string
  box_art_url: string
}

function formatViewers(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 100_000 ? 0 : 1) + 'K'
  return String(n)
}

// Twitch category slugs: "Grand Theft Auto V" -> "grand-theft-auto-v"
function categorySlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

async function fetchTwitchLive(): Promise<{ streams: Stream[]; categories: Category[] }> {
  const res = await fetch('/api/twitch-live', { cache: 'no-store' })
  if (!res.ok) throw new Error(`twitch-live ${res.status}`)
  const data = await res.json()
  return { streams: data.streams ?? [], categories: data.categories ?? [] }
}

export default function TwitchLivePanel() {
  const [streams, setStreams] = useState<Stream[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const load = useCallback(() => {
    return fetchTwitchLive().then(
      (data) => {
        setStreams(data.streams)
        setCategories(data.categories)
        setUpdatedAt(new Date())
        setError(false)
        setLoading(false)
      },
      () => {
        setError(true)
        setLoading(false)
      },
    )
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function refresh() {
    setLoading(true)
    load()
  }

  return (
    <section className={`${s.panel} ${s.live}`} aria-labelledby="twitch-live-title">
      <div className={s.panelHead}>
        <h2 id="twitch-live-title" className={s.panelTitle}>
          <img src="/icons/twitch.png" alt="" width={18} height={18} />
          Twitch&apos;te şu an canlı
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {updatedAt && (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatTime(updatedAt)} itibarıyla</span>
          )}
          <button type="button" className={s.iconButton} onClick={refresh} disabled={loading}>
            <RefreshCw size={14} aria-hidden />
            Yenile
          </button>
        </div>
      </div>

      {error && !loading ? (
        <p className={s.empty}>
          Twitch verisi alınamadı. TWITCH_CLIENT_ID ve TWITCH_CLIENT_SECRET ayarlarını kontrol edip yenileyin.
        </p>
      ) : (
        <div className={s.liveBody}>
          <div className={s.streams} aria-busy={loading}>
            {loading && streams.length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i}>
                    <div className={`${s.thumb} ${s.skeleton}`} />
                    <div className={s.skeleton} style={{ height: 14, width: '70%', marginTop: 10 }} />
                    <div className={s.skeleton} style={{ height: 12, width: '45%', marginTop: 6 }} />
                  </div>
                ))
              : streams.slice(0, 8).map((st) => (
                  <a
                    key={st.user_login || st.user_name}
                    className={s.stream}
                    href={`https://www.twitch.tv/${st.user_login || st.user_name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={st.title}
                  >
                    <div className={s.thumb}>
                      {st.thumbnail_url && <img src={st.thumbnail_url} alt="" loading="lazy" />}
                      <span className={s.viewers}>
                        <span className={s.liveDot} aria-hidden />
                        {formatViewers(st.viewer_count)}
                        <span className="sr-only"> izleyici</span>
                      </span>
                    </div>
                    <div className={s.streamName}>{st.user_name}</div>
                    <div className={s.streamGame}>{st.game_name || 'Kategori yok'}</div>
                  </a>
                ))}
          </div>

          <div className={s.categories}>
            <h3 id="twitch-categories-title" className={s.categoriesTitle}>
              En çok izlenen kategoriler
            </h3>
            <ol className={s.categoryList} aria-labelledby="twitch-categories-title">
            {loading && categories.length === 0
              ? Array.from({ length: 10 }).map((_, i) => (
                  <li key={i} className={s.category}>
                    <span className={s.rank}>{i + 1}</span>
                    <span className={`${s.boxArt} ${s.skeleton}`} />
                    <span className={s.skeleton} style={{ height: 12, width: '60%' }} />
                  </li>
                ))
              : categories.map((c, i) => (
                  <li key={c.id}>
                    <a
                      className={s.category}
                      href={`https://www.twitch.tv/directory/category/${categorySlug(c.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className={s.rank}>{i + 1}</span>
                      {c.box_art_url ? (
                        <img className={s.boxArt} src={c.box_art_url} alt="" loading="lazy" />
                      ) : (
                        <span className={s.boxArt} />
                      )}
                      <span className={s.categoryName}>{c.name}</span>
                    </a>
                  </li>
                ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  )
}
