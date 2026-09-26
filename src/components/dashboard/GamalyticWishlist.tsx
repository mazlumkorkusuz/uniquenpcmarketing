'use client'

import Link from 'next/link'
import { Heart, BarChart2, Star } from 'lucide-react'
import s from '@/app/dashboard.module.css'
import { TOT_APPID } from '@/lib/steam'
import { useWidgetData } from './useWidgetData'
import CountUp from './CountUp'

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
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function GamalyticWishlist({ coverUrl }: { coverUrl?: string | null }) {
  const { data, loading, error } = useWidgetData(`/api/gamalytic?appId=${TOT_APPID}`, pick)
  const image = data?.headerImageUrl ?? coverUrl
  const release = formatRelease(data?.releaseDate)
  const name = data?.name ?? 'Tales of the Trade'

  const facts = data && !error
    ? [
        data.followers != null && { label: 'Takipçi', value: data.followers.toLocaleString('tr-TR') },
        data.reviewCount != null && data.reviewCount > 0 && { label: 'İnceleme', value: data.reviewCount.toLocaleString('tr-TR') },
        release && { label: 'Çıkış', value: release },
      ].filter((f): f is { label: string; value: string } => Boolean(f))
    : []

  return (
    <section className={`${s.card} ${s.featureCard}`} aria-labelledby="gama-title">
      <div className={s.featureMedia}>
        {image && <img src={image} alt={`${name} kapak görseli`} />}
        <span className={s.featurePill}>
          <Star size={13} aria-hidden style={{ color: 'var(--primary)' }} />
          Öne çıkan oyun
        </span>
        <h2 id="gama-title" className={s.featureName}>{name}</h2>
      </div>

      <div className={s.featureBody}>
        <div>
          <div className={s.featureLabel}>
            <img src="/icons/gamalytic-logo.svg" alt="" width={14} height={14} />
            Gamalytic istek listesi
          </div>
          {loading && !data ? (
            <div className={s.skeleton} style={{ height: 40, width: 170, marginTop: 6 }} aria-hidden />
          ) : error || data?.wishlists == null ? (
            <p className={s.errorNote} style={{ padding: '8px 0 0' }}>
              İstek listesi verisi alınamadı. GAMALYTIC_API_KEY ayarını kontrol edin.
            </p>
          ) : (
            <div className={s.featureValue}>
              <Heart size={28} aria-hidden className={s.heart} fill="currentColor" />
              <CountUp value={data.wishlists} duration={1200} delay={100} />
            </div>
          )}
        </div>

        {facts.length > 0 && (
          <dl className={s.facts}>
            {facts.map((f) => (
              <div key={f.label} className={s.fact}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className={s.featureActions}>
          <Link href="/gamalytic" className={s.btnSecondary}>
            <BarChart2 size={16} aria-hidden />
            Gamalytic&apos;te aç
          </Link>
        </div>
      </div>
    </section>
  )
}
