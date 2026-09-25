'use client'

import Link from 'next/link'
import { Heart, BarChart2 } from 'lucide-react'
import s from '@/app/dashboard.module.css'
import { TOT_APPID } from '@/lib/steam'
import { useWidgetData } from './useWidgetData'

interface GameData {
  name?: string
  headerImageUrl?: string
  wishlists?: number
  followers?: number
  releaseDate?: string | number
  reviewCount?: number
}

const pick = (json: unknown) => json as GameData

function formatRelease(v: GameData['releaseDate']): string | null {
  if (v == null || v === '') return null
  const d = new Date(typeof v === 'number' ? v : String(v))
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function GamalyticWishlist({ coverUrl }: { coverUrl?: string | null }) {
  const { data, loading, error } = useWidgetData(`/api/gamalytic?appId=${TOT_APPID}`, pick)
  const image = data?.headerImageUrl ?? coverUrl
  const release = formatRelease(data?.releaseDate)

  return (
    <section className={s.card} aria-labelledby="gama-title">
      <div className={s.gama}>
        {image ? (
          <img className={s.gamaImage} src={image} alt="Tales of the Trade kapak görseli" />
        ) : (
          <span className={s.gamaImage} aria-hidden />
        )}
        <div style={{ minWidth: 0 }}>
          <h2 id="gama-title" className={s.gamaLabel} style={{ margin: 0 }}>
            <img src="/icons/gamalytic-logo.svg" alt="" width={16} height={16} />
            {data?.name ?? 'Tales of the Trade'}, Gamalytic istek listesi
          </h2>
          {loading && !data ? (
            <div className={s.skeleton} style={{ height: 44, width: 180, marginTop: 8 }} aria-hidden />
          ) : error || data?.wishlists == null ? (
            <p className={s.errorNote} style={{ padding: '8px 0 0' }}>
              İstek listesi verisi alınamadı. GAMALYTIC_API_KEY ayarını kontrol edin.
            </p>
          ) : (
            <div className={s.gamaValue}>
              <Heart size={28} aria-hidden style={{ color: '#FF5C7A', marginRight: 10, verticalAlign: -2 }} />
              {data.wishlists.toLocaleString('tr-TR')}
            </div>
          )}
          {data && !error && (
            <div className={s.gamaFacts}>
              {data.followers != null && <span>Takipçi <strong>{data.followers.toLocaleString('tr-TR')}</strong></span>}
              {data.reviewCount != null && data.reviewCount > 0 && <span>İnceleme <strong>{data.reviewCount.toLocaleString('tr-TR')}</strong></span>}
              {release && <span>Çıkış <strong>{release}</strong></span>}
            </div>
          )}
        </div>
        <Link href="/gamalytic" className={s.btnSecondary}>
          <BarChart2 size={16} aria-hidden />
          Gamalytic&apos;te aç
        </Link>
      </div>
    </section>
  )
}
