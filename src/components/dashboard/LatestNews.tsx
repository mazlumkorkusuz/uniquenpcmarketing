'use client'

import Link from 'next/link'
import { ArrowRight, Newspaper } from 'lucide-react'
import s from '@/app/dashboard.module.css'
import { useWidgetData } from './useWidgetData'

interface Article {
  title: string
  link: string
  image: string
  date: string
}

const pick = (json: unknown) => ((json as { articles?: Article[] }).articles ?? []).slice(0, 4)

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
}

export default function LatestNews() {
  const { data, loading, error } = useWidgetData('/api/news', pick)

  return (
    <section className={s.card} aria-labelledby="news-title">
      <div className={s.cardHead}>
        <span className={`${s.logoBadge} ${s.toneRose}`} aria-hidden><Newspaper size={17} /></span>
        <div className={s.cardHeadText}>
          <h3 id="news-title" className={s.cardTitle}>Son haberler</h3>
          <div className={s.cardSub}>PC Gamer, son 4 haber</div>
        </div>
        <Link href="/news" className={s.cardLink}>Tümü<ArrowRight size={14} aria-hidden /></Link>
      </div>

      {loading && !data ? (
        <div className={s.newsGrid} aria-hidden>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={s.newsCard}>
              <span className={`${s.newsThumb} ${s.skeleton}`} />
              <span className={s.skeleton} style={{ height: 13, marginTop: 14 }} />
              <span className={s.skeleton} style={{ height: 13, width: '70%', marginTop: 6 }} />
              <span className={s.skeleton} style={{ height: 10, width: '35%', marginTop: 10 }} />
            </div>
          ))}
        </div>
      ) : error || !data?.length ? (
        <p className={s.errorNote}>
          Haberler şu an yüklenemedi. <Link href="/news">Haberler sayfasını açın</Link>
        </p>
      ) : (
        <div className={s.newsGrid}>
          {data.map((a) => (
            <a key={a.link} className={s.newsCard} href={a.link} target="_blank" rel="noopener noreferrer">
              <span className={s.newsMedia}>
                {a.image ? <img className={s.newsThumb} src={a.image} alt="" loading="lazy" /> : <span className={s.newsThumb} />}
              </span>
              <span className={s.newsTitle}>{a.title}</span>
              <span className={s.newsDate}>{formatDate(a.date)}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
