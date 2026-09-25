'use client'

import s from '@/app/dashboard.module.css'
import { useWidgetData } from './useWidgetData'
import { RefreshButton, RowSkeletons, formatCompact } from './WidgetParts'

interface Stream {
  user_name: string
  user_login: string
  game_name: string
  viewer_count: number
}

interface Category {
  id: string
  name: string
}

const pick = (json: unknown) => {
  const j = json as { streams?: Stream[]; categories?: Category[] }
  return { streams: j.streams ?? [], categories: j.categories ?? [] }
}

// Twitch category slugs: "Grand Theft Auto V" -> "grand-theft-auto-v"
function categorySlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function TwitchLivePanel() {
  const { data, loading, error, reload } = useWidgetData('/api/twitch-live', pick)

  return (
    <section className={`${s.card} ${s.accent}`} style={{ borderTopColor: 'var(--twitch)' }} aria-labelledby="twitch-live-title">
      <div className={s.cardHead}>
        <div style={{ minWidth: 0 }}>
          <h2 id="twitch-live-title" className={s.cardTitle}>
            <img src="/icons/twitch.png" alt="" width={18} height={18} />
            Twitch&apos;te canlı
          </h2>
          <div className={s.cardSub}>En çok izlenen yayınlar</div>
        </div>
        <RefreshButton onClick={reload} loading={loading} label="Twitch verisini yenile" />
      </div>

      {loading && !data ? (
        <RowSkeletons count={10} art={false} />
      ) : error || !data ? (
        <p className={s.errorNote}>Twitch verisi alınamadı. TWITCH_CLIENT_ID ve TWITCH_CLIENT_SECRET ayarlarını kontrol edin.</p>
      ) : (
        <>
          <ol className={s.rankList}>
            {data.streams.slice(0, 10).map((st, i) => (
              <li key={st.user_login || st.user_name}>
                <a
                  className={`${s.rankRow} ${s.rankRowNoArt}`}
                  href={`https://www.twitch.tv/${st.user_login || st.user_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className={s.rank}>{i + 1}</span>
                  <span style={{ minWidth: 0 }}>
                    <span className={s.rowName} style={{ display: 'block' }}>{st.user_name}</span>
                    <span className={`${s.rowSub} ${s.rowSubTwitch}`} style={{ display: 'block' }}>{st.game_name || 'Kategori yok'}</span>
                  </span>
                  <span className={s.rowValue}>
                    <span className={s.liveDot} aria-hidden />
                    {formatCompact(st.viewer_count)}
                    <span className="sr-only"> izleyici</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
          <h3 className={s.subhead}>En çok izlenen kategoriler</h3>
          <div className={s.chips}>
            {data.categories.slice(0, 5).map((c) => (
              <a
                key={c.id}
                className={s.chip}
                href={`https://www.twitch.tv/directory/category/${categorySlug(c.name)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.name}
              </a>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
