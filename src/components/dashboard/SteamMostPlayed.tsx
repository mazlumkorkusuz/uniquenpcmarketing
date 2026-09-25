'use client'

import s from '@/app/dashboard.module.css'
import { useWidgetData } from './useWidgetData'
import { RefreshButton, RowSkeletons, formatCompact } from './WidgetParts'

interface Game {
  appid: number
  name: string
  players: number | null
  peakToday: number
  image: string
  url: string
}

const pick = (json: unknown) => ((json as { games?: Game[] }).games ?? [])

export default function SteamMostPlayed() {
  const { data, loading, error, reload } = useWidgetData('/api/steam-most-played', pick)

  return (
    <section className={`${s.card} ${s.accent}`} style={{ borderTopColor: 'var(--steam)' }} aria-labelledby="steam-played-title">
      <div className={s.cardHead}>
        <div style={{ minWidth: 0 }}>
          <h2 id="steam-played-title" className={s.cardTitle}>
            <img src="/icons/steamlogo.png" alt="" width={18} height={18} style={{ background: 'var(--steam)', padding: 2 }} />
            Steam&apos;de şu an popüler
          </h2>
          <div className={s.cardSub}>Anlık oyuncu sayısına göre</div>
        </div>
        <RefreshButton onClick={reload} loading={loading} label="Popüler oyunları yenile" />
      </div>

      {loading && !data ? (
        <RowSkeletons count={10} />
      ) : error || !data?.length ? (
        <p className={s.errorNote}>Steam oyuncu verisi alınamadı. Birazdan yenilemeyi deneyin.</p>
      ) : (
        <ol className={s.rankList}>
          {data.map((g, i) => (
            <li key={g.appid}>
              <a className={s.rankRow} href={g.url} target="_blank" rel="noopener noreferrer">
                <span className={s.rank}>{i + 1}</span>
                <img className={s.capsule} src={g.image} alt="" loading="lazy" />
                <span style={{ minWidth: 0 }}>
                  <span className={s.rowName} style={{ display: 'block' }} title={g.name}>{g.name}</span>
                  <span className={s.rowSub} style={{ display: 'block' }}>Bugünkü zirve {formatCompact(g.peakToday)}</span>
                </span>
                <span className={s.rowValue} title={g.players != null ? `${g.players.toLocaleString('tr-TR')} oyuncu` : undefined}>
                  {g.players != null ? formatCompact(g.players) : '—'}
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
