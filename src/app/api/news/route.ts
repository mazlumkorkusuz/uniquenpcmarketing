import { NextResponse } from 'next/server'

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

export async function GET() {
  const rssRes = await fetch('https://www.pcgamer.com/rss/', {
    next: { revalidate: 300 },
  })

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
      const image = extractEnclosure(item) || extractMediaContent(item)

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
                content: `Bu haber başlığı ve açıklaması için 2 cümlelik Türkçe özet yaz: Title: ${title} Description: ${description}`,
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

      return {
        title,
        summary,
        link,
        image,
        date: pubDate,
      }
    })
  )

  return NextResponse.json({ articles })
}
