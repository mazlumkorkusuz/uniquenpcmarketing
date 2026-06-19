import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DemoItem {
  appid: number
  name: string
  fullgame_appid: number | null
  fullgame_name: string | null
  image_url: string
  release_date: string   // YYYY-MM-DD
}

interface CacheFile {
  date: string           // YYYY-MM-DD
  demos: DemoItem[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CACHE_FILE   = path.join(process.cwd(), 'public', 'demo_cache.json')
const DELAY_MS     = 1000   // between each appdetails call
const MAX_PAGES    = 10     // safety cap (10 × 100 = 1 000 listings max)
const RECENT_DAYS  = 90     // only demos released within this window

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

function readCache(): CacheFile | null {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) }
  catch { return null }
}

function isFresh(c: CacheFile | null): boolean {
  return c?.date === todayStr()
}

// ─── Steam helpers ────────────────────────────────────────────────────────────

/** Paginate through Steam's demo search and collect raw listings. */
async function fetchAllListings(): Promise<Array<{ appid: number; name: string }>> {
  const all: Array<{ appid: number; name: string }> = []
  const count = 100

  for (let page = 0; page < MAX_PAGES; page++) {
    const start = page * count
    const url =
      `https://store.steampowered.com/search/results/?apptype=Demo` +
      `&json=1&l=english&cc=US&count=${count}&start=${start}`

    console.log(`[steam-demos] listings page ${page} (start=${start})`)

    let json: Record<string, unknown>
    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) { console.warn('[steam-demos] listings fetch failed:', res.status); break }
      json = await res.json()
    } catch (e) {
      console.warn('[steam-demos] listings fetch error:', e)
      break
    }

    const items: Record<string, unknown>[] =
      (json.items ?? json.results ?? json.apps ?? []) as Record<string, unknown>[]

    if (page === 0 && items[0]) {
      console.log('[steam-demos] sample item:', JSON.stringify(items[0]))
    }

    for (const item of items) {
      // appid may be a direct field or embedded in logo/tiny_image URL
      let appid = Number(item.appid ?? item.id ?? 0)
      if (!appid) {
        const logo = String(item.logo ?? item.tiny_image ?? '')
        const m = logo.match(/\/apps\/(\d+)\//)
        if (m) appid = Number(m[1])
      }
      const name = String(item.name ?? '').trim()
      if (appid > 0 && name) all.push({ appid, name })
    }

    const hasMore = Boolean(json.possible_has_more)
    console.log(`[steam-demos] page ${page}: ${items.length} items, has_more=${hasMore}`)

    if (!hasMore || items.length < count) break
  }

  console.log('[steam-demos] total listings:', all.length)
  return all
}

interface AppDetails {
  isDemo: boolean
  fullgame_appid: number | null
  fullgame_name: string | null
  release_date: string | null   // YYYY-MM-DD or null
}

/** Call Steam appdetails for a single appid. */
async function fetchAppDetails(appid: number): Promise<AppDetails> {
  const empty: AppDetails = { isDemo: false, fullgame_appid: null, fullgame_name: null, release_date: null }
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appid}&l=english`,
      { cache: 'no-store' }
    )
    if (!res.ok) return empty

    const json = await res.json()
    const data = json?.[String(appid)]?.data
    if (!data) return empty

    const isDemo = data.type === 'demo'

    const fullgame_appid = data.fullgame?.appid
      ? Number(data.fullgame.appid) : null
    const fullgame_name  = data.fullgame?.name
      ? String(data.fullgame.name) : null

    let release_date: string | null = null
    if (!data.release_date?.coming_soon && data.release_date?.date) {
      const parsed = new Date(data.release_date.date)
      if (!isNaN(parsed.getTime())) {
        release_date = parsed.toISOString().slice(0, 10)
      }
    }

    return { isDemo, fullgame_appid, fullgame_name, release_date }
  } catch {
    return empty
  }
}

// ─── Cache builder ────────────────────────────────────────────────────────────

async function buildDemos(): Promise<DemoItem[]> {
  const listings = await fetchAllListings()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - RECENT_DAYS)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const demos: DemoItem[] = []

  for (let i = 0; i < listings.length; i++) {
    const { appid, name } = listings[i]

    const details = await fetchAppDetails(appid)
    console.log(`[steam-demos] ${i + 1}/${listings.length} appid=${appid} isDemo=${details.isDemo} date=${details.release_date}`)

    await sleep(DELAY_MS)

    if (!details.isDemo)          continue   // not actually a demo
    if (!details.release_date)    continue   // no release date
    if (details.release_date < cutoffStr) continue  // older than 90 days

    demos.push({
      appid,
      name,
      fullgame_appid: details.fullgame_appid,
      fullgame_name:  details.fullgame_name,
      image_url: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/capsule_231x87.jpg`,
      release_date: details.release_date,
    })
  }

  // Newest first
  demos.sort((a, b) => b.release_date.localeCompare(a.release_date))
  console.log('[steam-demos] filtered demos:', demos.length)
  return demos
}

function saveCache(demos: DemoItem[]) {
  try {
    const data: CacheFile = { date: todayStr(), demos }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8')
    console.log('[steam-demos] cache saved:', demos.length, 'demos')
  } catch (e) {
    console.warn('[steam-demos] cache write error:', e)
  }
}

// Background refresh — called after returning stale data.
// Node.js keeps the promise alive; the HTTP response is already sent.
async function backgroundRefresh() {
  console.log('[steam-demos] background refresh started')
  try {
    const demos = await buildDemos()
    saveCache(demos)
    console.log('[steam-demos] background refresh complete')
  } catch (e) {
    console.error('[steam-demos] background refresh error:', e)
  }
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function GET() {
  const cache = readCache()

  // 1. Fresh cache → instant return
  if (isFresh(cache)) {
    console.log('[steam-demos] fresh cache hit:', cache!.demos.length)
    return NextResponse.json({ demos: cache!.demos })
  }

  // 2. Stale cache → return stale immediately, refresh in background
  if (cache) {
    console.log('[steam-demos] stale cache, serving', cache.demos.length, 'demos; refreshing in background')
    // Fire-and-forget: Node.js event loop keeps this running after the response
    backgroundRefresh().catch(e => console.error('[steam-demos] bg refresh uncaught:', e))
    return NextResponse.json({ demos: cache.demos })
  }

  // 3. No cache → full blocking fetch (first-ever load)
  console.log('[steam-demos] no cache, blocking fetch (may take a while)…')
  try {
    const demos = await buildDemos()
    saveCache(demos)
    return NextResponse.json({ demos })
  } catch (e) {
    console.error('[steam-demos] blocking fetch failed:', e)
    return NextResponse.json({ demos: [] })
  }
}
