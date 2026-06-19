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
    const url =
      'https://store.steampowered.com/search/results/?apptype=Demo&json=1&l=english&cc=US&count=20&start=0'
    console.log('[steam-demos] Fetching:', url)

    const searchRes = await fetch(url, { next: { revalidate: 3600 } })
    console.log('[steam-demos] Status:', searchRes.status)

    if (!searchRes.ok) {
      console.error('[steam-demos] Fetch failed:', searchRes.status)
      return NextResponse.json({ demos: [], error: `Steam returned ${searchRes.status}` })
    }

    const searchJson = await searchRes.json()
    console.log('[steam-demos] Response keys:', Object.keys(searchJson))

    // Steam returns { items: [{ name, logo }] }
    // items may also carry appid/id directly in other API versions
    const raw: Record<string, unknown>[] =
      searchJson.items ?? searchJson.results ?? searchJson.apps ?? []

    console.log('[steam-demos] Raw items:', raw.length)
    if (raw.length > 0) {
      console.log('[steam-demos] First item:', JSON.stringify(raw[0]))
    }

    const demos: DemoItem[] = raw
      .slice(0, 15)
      .map(item => {
        // Try direct id fields first; fall back to extracting from the logo/tiny_image URL
        let id = Number(item.appid ?? item.id ?? 0)
        if (!id) {
          const logoUrl = String(item.logo ?? item.tiny_image ?? '')
          const m = logoUrl.match(/\/apps\/(\d+)\//)
          if (m) id = Number(m[1])
        }
        const name = String(item.name ?? '')
        return {
          appid: id,
          name,
          capsuleImage: `https://cdn.akamai.steamstatic.com/steam/apps/${id}/capsule_231x87.jpg`,
        }
      })
      .filter(d => d.appid > 0 && d.name)

    console.log('[steam-demos] Parsed demos:', demos.map(d => `${d.appid}:${d.name}`))

    // Resolve full-game appids in parallel (1-hour cache per app)
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
            console.log(`[steam-demos] ${demo.appid} → fullgame ${d.fullgame.appid}`)
            return {
              ...demo,
              fullGameAppId: Number(d.fullgame.appid),
              fullGameName: String(d.fullgame.name ?? demo.name),
            }
          }
        } catch (e) {
          console.error('[steam-demos] appdetails error for', demo.appid, e)
        }
        return demo
      })
    )

    console.log('[steam-demos] Done. With fullgame:', resolved.filter(d => d.fullGameAppId).length)
    return NextResponse.json({ demos: resolved })
  } catch (e) {
    console.error('[steam-demos] Unexpected error:', e)
    return NextResponse.json({ demos: [], error: 'Failed to fetch demos' })
  }
}
