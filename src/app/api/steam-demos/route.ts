import { NextResponse } from 'next/server'

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

// ─── In-memory cache (module-level, survives across requests in same process) ─

let memoryCache: { date: string; demos: DemoItem[] } = { date: '', demos: [] }
let refreshing = false

// ─── Constants ────────────────────────────────────────────────────────────────

const DELAY_MS    = 1000
const MAX_PAGES   = 10
const RECENT_DAYS = 90

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

function isFresh(): boolean {
  return memoryCache.date === todayStr() && memoryCache.demos.length > 0
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

// ─── Background builder ───────────────────────────────────────────────────────

async function buildAndCache(): Promise<void> {
  if (refreshing) return   // prevent concurrent rebuilds
  refreshing = true
  console.log('[steam-demos] background build started')

  try {
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
    memoryCache = { date: todayStr(), demos }
    console.log('[steam-demos] cache updated:', demos.length, 'demos')
  } catch (e) {
    console.error('[steam-demos] build error:', e)
  } finally {
    refreshing = false
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET() {
  if (isFresh()) {
    console.log('[steam-demos] memory cache hit:', memoryCache.demos.length)
    return NextResponse.json({ demos: memoryCache.demos })
  }

  // Return whatever is in memory now (empty on first load, stale on day rollover)
  // and kick off a background refresh
  console.log('[steam-demos] cache miss (date=%s demos=%d), refreshing in background', memoryCache.date, memoryCache.demos.length)
  buildAndCache().catch(e => console.error('[steam-demos] uncaught build error:', e))

  return NextResponse.json({ demos: memoryCache.demos })
}
