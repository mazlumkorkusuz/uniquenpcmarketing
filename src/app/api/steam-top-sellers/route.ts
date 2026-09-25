import { NextResponse } from 'next/server'
import { steamApi, steamCapsuleUrl, steamStoreUrl, STEAM_CONTEXT, type SteamStoreItem } from '@/lib/steam'

// Steam's weekly global top sellers (by revenue), top 10
export async function GET() {
  try {
    const res = await steamApi<{ ranks?: { rank: number; appid: number; item?: SteamStoreItem }[] }>(
      'IStoreTopSellersService/GetWeeklyTopSellers/v1/',
      { country_code: 'US', context: STEAM_CONTEXT, data_request: { include_assets: true }, page_count: 10 },
      3600,
    )

    const games = (res.ranks ?? []).slice(0, 10).map((r) => {
      const item = r.item ?? { appid: r.appid }
      const price = item.best_purchase_option
      return {
        rank: r.rank,
        appid: r.appid,
        name: item.name ?? `App ${r.appid}`,
        isFree: !!item.is_free,
        price: price?.formatted_final_price ?? null,
        originalPrice: price?.formatted_original_price ?? null,
        discountPct: price?.discount_pct ?? 0,
        image: steamCapsuleUrl(item),
        url: steamStoreUrl(item),
      }
    })

    return NextResponse.json({ games })
  } catch {
    return NextResponse.json({ error: 'Steam top sellers unavailable' }, { status: 502 })
  }
}
