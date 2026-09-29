import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Steam hardware/software appids to exclude from top sellers
const STEAM_OWN_APPIDS = new Set([
  1675200, 353370, 353380, 323910, 250820,
  2590292, 2590291, 2590290, 2590289, 2590288,
  2590287, 2590286, 2590285, 2590284, 2590283,
  2590282, 2590281, 2590280,
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
  metascore?: string
  price?: { final: number; initial: number; discount_percent: number }
  platforms?: { windows: boolean; mac: boolean; linux: boolean }
}

function mapItem(raw: SteamFeaturedItem): SteamSearchItem {
  return {
    id: raw.id,
    name: raw.name,
    tiny_image:
      raw.tiny_image ??
      raw.header_image ??
      `https://cdn.akamai.steamstatic.com/steam/apps/${raw.id}/capsule_sm_120.jpg`,
    price:
      raw.final_price != null
        ? {
            final: raw.final_price,
            initial: raw.original_price ?? raw.final_price,
            discount_percent: raw.discount_percent ?? 0,
          }
        : undefined,
    metascore: raw.metascore,
    platforms: raw.platforms as SteamSearchItem['platforms'],
  }
}

function isSteamOwn(item: { id: number; name: string }) {
  if (STEAM_OWN_APPIDS.has(item.id)) return true
  if (/^steam (frame|machine|controller|link|deck)\b/i.test(item.name)) return true
  return false
}

// ─── Supabase'den co-op oyunlarını çek ───────────────────────────────────────

async function fetchCoopGamesFromDB(): Promise<SteamSearchItem[]> {
  const cutoffIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const { data, error } = await supabase
    .from('steam_coop_games')
    .select('appid, name, tiny_image, price_final, price_initial, discount_percent')
    .eq('is_coop', true)
    .gte('release_date_iso', cutoffIso)
    .order('release_date_iso', { ascending: false })

  if (error) {
    console.error('[steam-charts] Supabase sorgu hatası:', error.message)
    return []
  }

  return (data ?? []).map(
    (g: {
      appid: string
      name: string
      tiny_image: string
      price_final: number | null
      price_initial: number | null
      discount_percent: number | null
    }) => ({
      id: Number(g.appid),
      name: g.name,
      tiny_image: g.tiny_image,
      metascore: undefined,
      price:
        g.price_final != null
          ? {
              final: g.price_final,
              initial: g.price_initial ?? g.price_final,
              discount_percent: g.discount_percent ?? 0,
            }
          : undefined,
      platforms: undefined,
    })
  )
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const [featuredRes, coopGames] = await Promise.all([
      fetch('https://store.steampowered.com/api/featuredcategories/?cc=US&l=english', {
        next: { revalidate: 600 },
      }),
      fetchCoopGamesFromDB(),
    ])

    if (!featuredRes.ok) throw new Error(`Steam API ${featuredRes.status}`)
    const data = (await featuredRes.json()) as Record<string, SteamFeaturedSection>

    const topSellers = ((data.top_sellers as SteamFeaturedSection)?.items ?? [])
      .map(mapItem)
      .filter(item => !isSteamOwn(item))

    const specials = ((data.specials as SteamFeaturedSection)?.items ?? [])
      .map(mapItem)
      .filter(item => !isSteamOwn(item))

    // co-op oyunlar varsa onları göster, yoksa Steam'in kendi new_releases'ına düş
    const newReleases =
      coopGames.length > 0
        ? coopGames
        : ((data.new_releases as SteamFeaturedSection)?.items ?? [])
            .map(mapItem)
            .filter(item => !isSteamOwn(item))

    const newReleasesLabel =
      coopGames.length > 0 ? '🎮 Bu Hafta Çıkan Co-op Oyunlar' : '🆕 Yeni Çıkanlar'

    return NextResponse.json({ topSellers, newReleases, specials, newReleasesLabel })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
