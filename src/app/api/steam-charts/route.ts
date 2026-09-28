import { NextResponse } from 'next/server'

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

export async function GET() {
  try {
    const res = await fetch(
      'https://store.steampowered.com/api/featuredcategories/?cc=US&l=english',
      { next: { revalidate: 600 } }
    )
    if (!res.ok) throw new Error(`Steam API ${res.status}`)
    const data = await res.json() as Record<string, SteamFeaturedSection>

    const topSellers  = ((data.top_sellers  as SteamFeaturedSection)?.items ?? []).map(mapItem)
    const newReleases = ((data.new_releases  as SteamFeaturedSection)?.items ?? []).map(mapItem)
    const specials    = ((data.specials      as SteamFeaturedSection)?.items ?? []).map(mapItem)

    return NextResponse.json({ topSellers, newReleases, specials })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
