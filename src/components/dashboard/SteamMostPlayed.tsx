'use client'

import s from '@/app/dashboard.module.css'
import { useWidgetData } from './useWidgetData'
import { Meter, Rank, RefreshButton, RowSkeletons, formatCompact } from './WidgetParts'

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
  const max = Math.max(0, ...(data ?? []).map((g) => g.players ?? 0))

  return (
    <section className={s.card} aria-labelledby="steam-played-title">
      <div className={s.cardHead}>
        <span className={s.logoBadge} style={{ background: 'var(--steam)' }} aria-hidden>
          <img src="/icons/steamlogo.png" alt="" />
        </span>
        <div className={s.cardHeadText}>
          <h3 id="steam-played-title" className={s.cardTitle}>Steam&apos;de şu an popüler</h3>
          <div className={s.cardSub}>Anlık oyuncu sayısına göre</div>
        </div>
        <RefreshButton onClick={reload} loading={loading} label="Popüler oyunları yenile" />
      </div>

      {loading && !data ? (
        <RowSkeletons count={10} dense />
      ) : error || !data?.length ? (
        <p className={s.errorNote}>Steam oyuncu verisi alınamadı. Birazdan yenilemeyi deneyin.</p>
      ) : (
        <ol className={`${s.rankList} ${s.rankListDense}`}>
          {data.map((g, i) => (
            <li key={g.appid}>
              <a className={s.rankRow} href={g.url} target="_blank" rel="noopener noreferrer">
                <Rank n={i + 1} />
                <img className={s.capsule} src={g.image} alt="" loading="lazy" />
                <span className={s.rowText}>
                  <span className={s.rowName} title={g.name}>{g.name}</span>
                  {g.players != null && <Meter value={g.players} max={max} row={i} />}
                  <span className={s.rowSub}>Bugünkü zirve {formatCompact(g.peakToday)}</span>
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
