import { NextResponse } from 'next/server'

export interface DemoItem {
  appid: number
  name: string
  capsuleImage: string
  fullGameAppId?: number
  fullGameName?: string
}

export async function GET() {
  try {
    const searchRes = await fetch(
      'https://store.steampowered.com/search/results/?apptype=Demo&json=1&l=english&cc=US&count=20&start=0',
      { next: { revalidate: 3600 } }
    )
    if (!searchRes.ok) return NextResponse.json({ demos: [] })

    const searchJson = await searchRes.json()
    // Steam may return items under different keys depending on version
    const raw: Record<string, unknown>[] = searchJson.items ?? searchJson.results ?? searchJson.apps ?? []

    const demos: DemoItem[] = raw
      .slice(0, 15)
      .map(item => {
        const id = Number(item.appid ?? item.id ?? 0)
        return {
          appid: id,
          name: String(item.name ?? ''),
          capsuleImage: `https://cdn.akamai.steamstatic.com/steam/apps/${id}/capsule_231x87.jpg`,
        }
      })
      .filter(d => d.appid > 0 && d.name)

    // Resolve full-game appids in parallel (cached per-appid for 1 hour)
    const resolved = await Promise.all(
      demos.map(async demo => {
        try {
          const r = await fetch(
            `https://store.steampowered.com/api/appdetails?appids=${demo.appid}&l=english`,
            { next: { revalidate: 3600 } }
          )
          if (!r.ok) return demo
          const json = await r.json()
          const d = json?.[String(demo.appid)]?.data
          if (d?.fullgame?.appid) {
            return {
              ...demo,
              fullGameAppId: Number(d.fullgame.appid),
              fullGameName: String(d.fullgame.name ?? demo.name),
            }
          }
        } catch {}
        return demo
      })
    )

    return NextResponse.json({ demos: resolved })
  } catch {
    return NextResponse.json({ demos: [] })
  }
}
