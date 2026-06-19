import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export interface DemoItem {
  appid: number
  name: string
  image_url: string
}

const CACHE_FILE = path.join(process.cwd(), 'public', 'demo_cache.json')

function isTodayCache(): boolean {
  try {
    const stat = fs.statSync(CACHE_FILE)
    const d = new Date(stat.mtime)
    const now = new Date()
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth()    === now.getMonth()    &&
      d.getDate()     === now.getDate()
    )
  } catch { return false }
}

export async function GET() {
  // Serve from today's cache if fresh
  if (isTodayCache()) {
    try {
      const cached: DemoItem[] = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
      console.log('[steam-demos] cache hit:', cached.length)
      return NextResponse.json({ demos: cached })
    } catch (e) {
      console.warn('[steam-demos] cache read error:', e)
    }
  }

  // Fetch fresh data
  try {
    const url =
      'https://store.steampowered.com/search/results/?apptype=Demo&json=1&l=english&cc=US&count=20&start=0'
    console.log('[steam-demos] fetching:', url)

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Steam ${res.status}`)

    const json = await res.json()
    console.log('[steam-demos] keys:', Object.keys(json))

    const raw: Record<string, unknown>[] =
      json.items ?? json.results ?? json.apps ?? []

    console.log('[steam-demos] raw count:', raw.length)
    if (raw[0]) console.log('[steam-demos] first item:', JSON.stringify(raw[0]))

    const demos: DemoItem[] = raw
      .map(item => {
        // id may be direct, or embedded in the logo/tiny_image URL
        let appid = Number(item.appid ?? item.id ?? 0)
        if (!appid) {
          const logo = String(item.logo ?? item.tiny_image ?? '')
          const m = logo.match(/\/apps\/(\d+)\//)
          if (m) appid = Number(m[1])
        }
        return {
          appid,
          name: String(item.name ?? ''),
          image_url: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/capsule_231x87.jpg`,
        }
      })
      .filter(d => d.appid > 0 && d.name)

    console.log('[steam-demos] parsed:', demos.length)

    // Persist to daily cache
    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(demos), 'utf8')
    } catch (e) {
      console.warn('[steam-demos] cache write error:', e)
    }

    return NextResponse.json({ demos })
  } catch (e) {
    console.error('[steam-demos] fetch error:', e)
    // Fall back to stale cache rather than returning nothing
    try {
      const stale: DemoItem[] = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
      console.log('[steam-demos] serving stale cache:', stale.length)
      return NextResponse.json({ demos: stale })
    } catch {}
    return NextResponse.json({ demos: [] })
  }
}
