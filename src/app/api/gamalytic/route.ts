import { NextRequest, NextResponse } from 'next/server'

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<strong[^>]*>/gi, '').replace(/<\/strong>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

type SteamReqs = { minimum?: string; recommended?: string }

export async function GET(req: NextRequest) {
  const appId = req.nextUrl.searchParams.get('appId')?.trim()
  if (!appId) return NextResponse.json({ error: 'appId required' }, { status: 400 })

  const apiKey = process.env.GAMALYTIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const [gamaRes, steamRes] = await Promise.all([
    fetch(`https://api.gamalytic.com/game/${appId}`, {
      headers: { 'api-key': apiKey },
      next: { revalidate: 300 },
    }),
    fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=english&cc=US`, {
      next: { revalidate: 300 },
    }),
  ])

  if (!gamaRes.ok) {
    return NextResponse.json({ error: 'Gamalytic API error', status: gamaRes.status }, { status: 502 })
  }

  const gamaData = await gamaRes.json()

  let steam = null
  if (steamRes.ok) {
    try {
      const steamJson = await steamRes.json()
      const sd = steamJson?.[appId]?.data
      if (sd) {
        const reqs = sd.pc_requirements as SteamReqs | unknown[]
        const hasReqs = reqs && !Array.isArray(reqs) && typeof reqs === 'object'
        steam = {
          shortDescription:   sd.short_description as string | undefined,
          isFree:             sd.is_free as boolean | undefined,
          priceOverview:      sd.price_overview ? {
            initialFormatted: sd.price_overview.initial_formatted as string,
            finalFormatted:   sd.price_overview.final_formatted as string,
            discountPercent:  sd.price_overview.discount_percent as number,
          } : null,
          metacritic:         sd.metacritic
            ? { score: sd.metacritic.score as number, url: sd.metacritic.url as string }
            : null,
          pcRequirements:     hasReqs ? {
            minimum:     stripHtml((reqs as SteamReqs).minimum ?? ''),
            recommended: stripHtml((reqs as SteamReqs).recommended ?? ''),
          } : null,
          dlc:                (sd.dlc as number[] | undefined) ?? [],
          supportedLanguages: sd.supported_languages as string | undefined,
          developers:         (sd.developers as string[] | undefined) ?? [],
          publishers:         (sd.publishers as string[] | undefined) ?? [],
          categories:         ((sd.categories as { description: string }[] | undefined) ?? []).map(c => c.description),
          steamGenres:        ((sd.genres    as { description: string }[] | undefined) ?? []).map(g => g.description),
        }
      }
    } catch {
      // Steam failure is non-fatal — return Gamalytic data alone
    }
  }

  return NextResponse.json({ ...gamaData, steam })
}
