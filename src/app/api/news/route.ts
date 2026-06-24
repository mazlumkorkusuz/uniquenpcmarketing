import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface Article {
  title: string
  summary: string
  link: string
  image: string
  date: string
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? (match[1] ?? match[2] ?? '').trim() : ''
}

function extractEnclosure(xml: string): string {
  const match = xml.match(/<enclosure[^>]+url="([^"]+)"[^>]*\/?>/i)
  return match ? match[1] : ''
}

function extractMediaContent(xml: string): string {
  const match = xml.match(/<media:content[^>]+url="([^"]+)"[^>]*\/?>/i)
  return match ? match[1] : ''
}

function extractMediaThumbnail(xml: string): string {
  const match = xml.match(/<media:thumbnail[^>]+url="([^"]+)"[^>]*\/?>/i)
  return match ? match[1] : ''
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  const { data: cached, error: cacheError } = await supabase
    .from('news_cache')
    .select('*')
    .eq('source', 'pcgamer')
    .gt('updated_at', thirtyMinAgo)
    .order('created_at', { ascending: false })

  if (!cacheError && cached && cached.length > 0) {
    const articles: Article[] = (cached as Array<Record<string, string>>).map((row) => ({
      title: row.title,
      summary: row.summary,
      link: row.link,
      image: row.image ?? '',
      date: row.date,
    }))
    return NextResponse.json({ articles, cached: true })
  }

  const rssRes = await fetch('https://www.pcgamer.com/rss/')
  if (!rssRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch RSS' }, { status: 502 })
  }

  const xml = await rssRes.text()
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) ?? []
  const top8 = itemMatches.slice(0, 8)

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
  }

  const articles: Article[] = await Promise.all(
    top8.map(async (item) => {
      const title = extractTag(item, 'title')
      const description = extractTag(item, 'description').replace(/<[^>]+>/g, '').slice(0, 500)
      const link = extractTag(item, 'link') || (item.match(/<link>([^<]+)<\/link>/i)?.[1] ?? '')
      const pubDate = extractTag(item, 'pubDate')
      const image = extractEnclosure(item) || extractMediaContent(item) || extractMediaThumbnail(item)

      let summary = ''
      try {
        const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: `Bu oyun haberini 2 cümleyle Türkçe özetle. Başlık: ${title}. Açıklama: ${description}`,
              },
            ],
            max_tokens: 150,
            temperature: 0.7,
          }),
        })
        if (oaiRes.ok) {
          const oaiData = await oaiRes.json()
          summary = oaiData.choices?.[0]?.message?.content?.trim() ?? ''
        }
      } catch {
        summary = description.slice(0, 200)
      }

      return { title, summary, link, image, date: pubDate }
    })
  )

  await supabase.from('news_cache').delete().eq('source', 'pcgamer')

  if (articles.length > 0) {
    await supabase.from('news_cache').insert(
      articles.map((a) => ({
        title: a.title,
        summary: a.summary,
        link: a.link,
        image: a.image,
        date: a.date,
        source: 'pcgamer',
        updated_at: new Date().toISOString(),
      }))
    )
  }

  return NextResponse.json({ articles })
}
