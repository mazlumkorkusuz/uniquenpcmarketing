'use client'

import Link from 'next/link'
import { Newspaper } from 'lucide-react'
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
        <div style={{ minWidth: 0 }}>
          <h2 id="news-title" className={s.cardTitle}>
            <Newspaper size={17} aria-hidden />
            Sektörden haberler
          </h2>
          <div className={s.cardSub}>PC Gamer, son 4 haber</div>
        </div>
        <Link href="/news" className={s.cardLink}>Tümü</Link>
      </div>

      {loading && !data ? (
        <div style={{ padding: '0 8px 8px' }} aria-hidden>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={s.newsRow}>
              <span className={`${s.newsThumb} ${s.skeleton}`} />
              <span>
                <span className={s.skeleton} style={{ display: 'block', height: 12 }} />
                <span className={s.skeleton} style={{ display: 'block', height: 12, width: '60%', marginTop: 6 }} />
              </span>
            </div>
          ))}
        </div>
      ) : error || !data?.length ? (
        <p className={s.errorNote}>
          Haberler şu an yüklenemedi. <Link href="/news">Haberler sayfasını açın</Link>
        </p>
      ) : (
        <div style={{ padding: '0 8px 8px' }}>
          {data.map((a) => (
            <a key={a.link} className={s.newsRow} href={a.link} target="_blank" rel="noopener noreferrer">
              {a.image ? <img className={s.newsThumb} src={a.image} alt="" loading="lazy" /> : <span className={s.newsThumb} />}
              <span style={{ minWidth: 0 }}>
                <span className={s.newsTitle}>{a.title}</span>
                <span className={s.newsDate} style={{ display: 'block' }}>{formatDate(a.date)}</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
