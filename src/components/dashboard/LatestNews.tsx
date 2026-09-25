'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import s from '@/app/dashboard.module.css'

interface Article {
  title: string
  link: string
  image: string
  date: string
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
}

export default function LatestNews() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/news')
      .then((res) => (res.ok ? res.json() : { articles: [] }))
      .then((data) => setArticles((data.articles ?? []).slice(0, 4)))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className={s.news} aria-busy>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className={`${s.articleImage} ${s.skeleton}`} />
            <div className={s.skeleton} style={{ height: 12, width: '30%', marginTop: 12 }} />
            <div className={s.skeleton} style={{ height: 16, marginTop: 8 }} />
            <div className={s.skeleton} style={{ height: 16, width: '75%', marginTop: 6 }} />
          </div>
        ))}
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <p className={`${s.panel} ${s.empty}`} style={{ marginBottom: 28 }}>
        Haberler şu an yüklenemedi. <Link href="/news">Haberler sayfasını açın</Link>
      </p>
    )
  }

  return (
    <div className={s.news}>
      {articles.map((a) => (
        <a key={a.link} className={s.article} href={a.link} target="_blank" rel="noopener noreferrer">
          <div className={s.articleImage}>{a.image && <img src={a.image} alt="" loading="lazy" />}</div>
          <div className={s.articleDate}>{formatDate(a.date)}</div>
          <h3 className={s.articleTitle}>{a.title}</h3>
        </a>
      ))}
    </div>
  )
}
