'use client'

import s from '@/app/dashboard.module.css'
import { useWidgetData } from './useWidgetData'
import { Rank, RefreshButton, RowSkeletons } from './WidgetParts'

interface Game {
  rank: number
  appid: number
  name: string
  isFree: boolean
  price: string | null
  originalPrice: string | null
  discountPct: number
  image: string
  url: string
}

const pick = (json: unknown) => ((json as { games?: Game[] }).games ?? [])

export default function SteamTopSellers() {
  const { data, loading, error, reload } = useWidgetData('/api/steam-top-sellers', pick)

  return (
    <section className={s.card} aria-labelledby="steam-top-title">
      <div className={s.cardHead}>
        <span className={s.logoBadge} style={{ background: 'var(--steam)' }} aria-hidden>
          <img src="/icons/steamlogo.png" alt="" />
        </span>
        <div className={s.cardHeadText}>
          <h3 id="steam-top-title" className={s.cardTitle}>Steam çok satanlar</h3>
          <div className={s.cardSub}>Bu hafta, küresel gelir sıralaması</div>
        </div>
        <RefreshButton onClick={reload} loading={loading} label="Çok satanları yenile" />
      </div>

      {loading && !data ? (
        <RowSkeletons count={10} dense />
      ) : error || !data?.length ? (
        <p className={s.errorNote}>Steam listesi alınamadı. Birazdan yenilemeyi deneyin.</p>
      ) : (
        <ol className={`${s.rankList} ${s.rankListDense}`}>
          {data.map((g) => (
            <li key={g.appid}>
              <a className={s.rankRow} href={g.url} target="_blank" rel="noopener noreferrer">
                <Rank n={g.rank} />
                <img className={s.capsule} src={g.image} alt="" loading="lazy" />
                <span className={s.rowName} title={g.name}>{g.name}</span>
                <span className={s.rowValue}>
                  {g.isFree ? (
                    <span className={s.free}>Ücretsiz</span>
                  ) : g.discountPct > 0 ? (
                    <>
                      {g.originalPrice && <span className={s.strike}>{g.originalPrice}</span>}
                      <span className={s.discount}>-%{g.discountPct}</span>
                      {g.price}
                    </>
                  ) : (
                    g.price ?? '—'
                  )}
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
