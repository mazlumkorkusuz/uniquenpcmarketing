'use client'

import s from '@/app/dashboard.module.css'
import { useWidgetData } from './useWidgetData'
import { Meter, Rank, RefreshButton, RowSkeletons, formatCompact } from './WidgetParts'

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
  const streams = data?.streams.slice(0, 10) ?? []
  const max = Math.max(0, ...streams.map((st) => st.viewer_count))

  return (
    <section className={s.card} aria-labelledby="twitch-live-title">
      <div className={s.cardHead}>
        <span className={s.logoBadge} style={{ background: '#F1E9FF' }} aria-hidden>
          <img src="/icons/twitch.png" alt="" />
        </span>
        <div className={s.cardHeadText}>
          <h3 id="twitch-live-title" className={s.cardTitle}>Twitch&apos;te canlı</h3>
          <div className={s.cardSub}>En çok izlenen yayınlar</div>
        </div>
        {data && !error && (
          <span className={s.liveBadge}>
            <span className={s.liveDot} aria-hidden />
            Canlı
          </span>
        )}
        <RefreshButton onClick={reload} loading={loading} label="Twitch verisini yenile" />
      </div>

      {loading && !data ? (
        <RowSkeletons count={10} art={false} />
      ) : error || !data ? (
        <p className={s.errorNote}>Twitch verisi alınamadı. TWITCH_CLIENT_ID ve TWITCH_CLIENT_SECRET ayarlarını kontrol edin.</p>
      ) : (
        <>
          <ol className={s.rankList}>
            {streams.map((st, i) => (
              <li key={st.user_login || st.user_name}>
                <a
                  className={`${s.rankRow} ${s.rankRowNoArt}`}
                  href={`https://www.twitch.tv/${st.user_login || st.user_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Rank n={i + 1} />
                  <span className={s.rowText}>
                    <span className={s.rowName}>{st.user_name}</span>
                    <Meter value={st.viewer_count} max={max} row={i} twitch />
                    <span className={s.rowSub}>{st.game_name || 'Kategori yok'}</span>
                  </span>
                  <span className={s.rowValue}>
                    {formatCompact(st.viewer_count)}
                    <span className="sr-only"> izleyici</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
          {data.categories.length > 0 && (
            <>
              <h4 className={s.subhead}>En çok izlenen kategoriler</h4>
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
        </>
      )}
    </section>
  )
}
