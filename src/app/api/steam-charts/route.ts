import { NextResponse } from 'next/server'

// Steam hardware/software appids to exclude from top sellers
// (Steam Deck, Steam Link, Steam Controller, SteamVR, Steam Frame, Steam Machine etc.)
const STEAM_OWN_APPIDS = new Set([
  1675200, // Steam Deck
  353370,  // Steam Controller
  353380,  // Steam Link
  323910,  // Steam Survey
  250820,  // SteamVR
  2590292, // Steam Frame
  2590291, // Steam Frame
  2590290, // Steam Frame
  2590289, // Steam Frame
  2590288, // Steam Frame
  2590287, // Steam Frame
  2590286, // Steam Frame
  2590285, // Steam Frame
  2590284, // Steam Frame
  2590283, // Steam Frame
  2590282, // Steam Frame
  2590281, // Steam Frame
  2590280, // Steam Frame
  // Generic filter: names starting with "Steam " handled in code too
])

interface SteamFeaturedItem {
  id: number
  name: string
  tiny_image?: string
  header_image?: string
  final_price?: number
  original_price?: number
  discount_percent?: number
  metascore?: string
  platforms?: { windows?: boolean; mac?: boolean; linux?: boolean }
}

interface SteamFeaturedSection {
  items?: SteamFeaturedItem[]
}

interface SteamSearchItem {
  id: number
  name: string
  tiny_image: string
  metascore: string
  price?: { final: number; initial: number; discount_percent: number }
  platforms?: { windows: boolean; mac: boolean; linux: boolean }
}

function mapItem(raw: SteamFeaturedItem) {
  return {
    id: raw.id,
    name: raw.name,
    tiny_image: raw.tiny_image ?? raw.header_image ?? `https://cdn.akamai.steamstatic.com/steam/apps/${raw.id}/capsule_sm_120.jpg`,
    price: raw.final_price != null
      ? { final: raw.final_price, initial: raw.original_price ?? raw.final_price, discount_percent: raw.discount_percent ?? 0 }
      : undefined,
    metascore: raw.metascore,
    platforms: raw.platforms,
  }
}

function isSteamOwn(item: { id: number; name: string }) {
  if (STEAM_OWN_APPIDS.has(item.id)) return true
  // Filter out "Steam Frame", "Steam Machine", "Steam ..." hardware listings
  if (/^steam (frame|machine|controller|link|deck)\b/i.test(item.name)) return true
  return false
}

// Fetch similar games via Steam store search filtered by tags
// Tags: Simulation(599), Co-op(9), Management(21978), Building(1696)
// Uses the storeapi endpoint which returns structured appid/name/tiny_image fields
async function fetchSimilarGames(): Promise<SteamSearchItem[]> {
  const tags = '599,9,21978,1696'
  // storeapi/appinfo endpoint returns appid directly — more reliable than search/results logo parsing
  const url = `https://store.steampowered.com/search/results/?tags=${tags}&filter=topsellers&json=1&count=20&cc=US&l=english&v=2`
  const res = await fetch(url, { next: { revalidate: 1800 } })
  if (!res.ok) return []

  let data: Record<string, unknown>
  try { data = await res.json() } catch { return [] }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawItems: any[] = Array.isArray(data.items) ? data.items : []

  const items: SteamSearchItem[] = rawItems.map((item: any) => {
    // Try direct appid field first, fall back to parsing logo URL
    const appid = item.appid
      ?? item.id
      ?? (item.logo ? Number(item.logo.match(/\/apps\/(\d+)\//)?.[1] ?? 0) : 0)
      ?? (item.tiny_image ? Number(item.tiny_image.match(/\/apps\/(\d+)\//)?.[1] ?? 0) : 0)

    const tinyImage = item.tiny_image
      ?? item.logo
      ?? (appid ? `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/capsule_sm_120.jpg` : '')

    return {
      id: Number(appid) || 0,
      name: item.name ?? '',
      tiny_image: tinyImage,
      metascore: String(item.metascore ?? ''),
      price: item.price != null ? {
        final: item.price.final ?? 0,
        initial: item.price.initial ?? item.price.final ?? 0,
        discount_percent: item.price.discount_percent ?? 0,
      } : undefined,
      platforms: item.platforms,
    }
  }).filter((i: SteamSearchItem) => i.id > 0 && i.name)

  return items
}

export async function GET() {
  try {
    const [featuredRes, similarGames] = await Promise.all([
      fetch(
        'https://store.steampowered.com/api/featuredcategories/?cc=US&l=english',
        { next: { revalidate: 600 } }
      ),
      fetchSimilarGames(),
    ])

    if (!featuredRes.ok) throw new Error(`Steam API ${featuredRes.status}`)
    const data = await featuredRes.json() as Record<string, SteamFeaturedSection>

    const topSellers = ((data.top_sellers as SteamFeaturedSection)?.items ?? [])
      .map(mapItem)
      .filter(item => !isSteamOwn(item))

    const specials = ((data.specials as SteamFeaturedSection)?.items ?? [])
      .map(mapItem)
      .filter(item => !isSteamOwn(item))

    // If Steam search API returned nothing, fall back to new_releases from featuredcategories
    const newReleases = similarGames.length > 0
      ? similarGames
      : ((data.new_releases as SteamFeaturedSection)?.items ?? [])
          .map(mapItem)
          .filter(item => !isSteamOwn(item))

    const newReleasesLabel = similarGames.length > 0
      ? '🏪 Benzer Oyunlar — Simülasyon & Co-op & Yönetim'
      : '🆕 Yeni Çıkanlar'

    return NextResponse.json({ topSellers, newReleases, specials, newReleasesLabel })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
