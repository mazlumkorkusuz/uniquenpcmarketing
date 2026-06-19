import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Force Node.js runtime — route uses fs/path which are unavailable on Edge
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

const CACHE_FILE  = path.join(process.cwd(), 'public', 'demo_cache.json')
const DELAY_MS    = 1000   // between each appdetails call
const MAX_PAGES   = 10     // safety cap (10 × 100 = 1 000 listings max)
const RECENT_DAYS = 90     // only demos released within this window

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

/** Read and validate cache — returns null if missing, unreadable, or wrong format. */
function readCache(): CacheFile | null {
  try {
    const raw  = fs.readFileSync(CACHE_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    // Guard against old array format written by a previous version
    if (!parsed || Array.isArray(parsed) || typeof parsed.date !== 'string') return null
    if (!Array.isArray(parsed.demos)) return null
    return parsed as CacheFile
  } catch { return null }
}

function isFresh(c: CacheFile | null): boolean {
  return c?.date === todayStr()
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

// ─── Steam helpers ────────────────────────────────────────────────────────────

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
      if (!res.ok) { console.warn('[steam-demos] listings status:', res.status); break }
      json = await res.json()
    } catch (e) {
      console.warn('[steam-demos] listings error:', e); break
    }

    const items = (json.items ?? json.results ?? json.apps ?? []) as Record<string, unknown>[]
    if (page === 0 && items[0]) console.log('[steam-demos] sample:', JSON.stringify(items[0]))

    for (const item of items) {
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
  release_date: string | null
}

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

    const fullgame_appid = data.fullgame?.appid ? Number(data.fullgame.appid) : null
    const fullgame_name  = data.fullgame?.name  ? String(data.fullgame.name)  : null

    let release_date: string | null = null
    if (!data.release_date?.coming_soon && data.release_date?.date) {
      const parsed = new Date(data.release_date.date)
      if (!isNaN(parsed.getTime())) release_date = parsed.toISOString().slice(0, 10)
    }

    return { isDemo: data.type === 'demo', fullgame_appid, fullgame_name, release_date }
  } catch { return empty }
}

// ─── Cache builder (runs in background) ──────────────────────────────────────

async function buildAndSave(): Promise<DemoItem[]> {
  const listings = await fetchAllListings()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - RECENT_DAYS)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const demos: DemoItem[] = []

  for (let i = 0; i < listings.length; i++) {
    const { appid, name } = listings[i]
    const details = await fetchAppDetails(appid)
    console.log(`[steam-demos] ${i + 1}/${listings.length} ${appid} isDemo=${details.isDemo} date=${details.release_date}`)
    await sleep(DELAY_MS)

    if (!details.isDemo)                  continue
    if (!details.release_date)            continue
    if (details.release_date < cutoffStr) continue

    demos.push({
      appid,
      name,
      fullgame_appid: details.fullgame_appid,
      fullgame_name:  details.fullgame_name,
      image_url: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/capsule_231x87.jpg`,
      release_date: details.release_date,
    })
  }

  demos.sort((a, b) => b.release_date.localeCompare(a.release_date))
  console.log('[steam-demos] filtered demos:', demos.length)
  saveCache(demos)
  return demos
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET() {
  const cache = readCache()

  // 1. Fresh today's cache — instant return
  if (isFresh(cache)) {
    console.log('[steam-demos] fresh cache hit:', cache!.demos.length)
    return NextResponse.json({ demos: cache!.demos })
  }

  // 2. Stale or no cache — return whatever we have NOW, refresh in background.
  //    This means the response is always instant. The Node.js event loop keeps
  //    the background promise alive after the HTTP response is sent.
  const immediate = cache?.demos ?? []
  console.log('[steam-demos] returning', immediate.length, 'stale/empty demos; refreshing in background')

  buildAndSave()
    .catch(e => console.error('[steam-demos] background build error:', e))

  return NextResponse.json({ demos: immediate })
}
