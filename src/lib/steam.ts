// Helpers for Steam's public (keyless) store web APIs

// Tales of the Trade — the studio's own game on Steam
export const TOT_APPID = 4416430

const STEAM_API = 'https://api.steampowered.com'
const ASSET_BASE = 'https://shared.akamai.steamstatic.com/store_item_assets/'
const CONTEXT = { language: 'english', country_code: 'US' }

export interface SteamStoreItem {
  appid: number
  name?: string
  is_free?: boolean
  store_url_path?: string
  assets?: { asset_url_format?: string; small_capsule?: string; header?: string }
  best_purchase_option?: {
    formatted_final_price?: string
    formatted_original_price?: string
    discount_pct?: number
  }
}

export function steamCapsuleUrl(item: SteamStoreItem): string {
  const fmt = item.assets?.asset_url_format
  const file = item.assets?.small_capsule
  if (!fmt || !file) return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.appid}/capsule_231x87.jpg`
  return ASSET_BASE + fmt.replace('${FILENAME}', file)
}

export function steamHeaderUrl(item: SteamStoreItem): string | null {
  const fmt = item.assets?.asset_url_format
  const file = item.assets?.header
  return fmt && file ? ASSET_BASE + fmt.replace('${FILENAME}', file) : null
}

export function steamStoreUrl(item: SteamStoreItem): string {
  return `https://store.steampowered.com/${item.store_url_path ?? `app/${item.appid}`}`
}

export async function steamApi<T>(path: string, input: object, revalidate: number): Promise<T> {
  const url = `${STEAM_API}/${path}?input_json=${encodeURIComponent(JSON.stringify(input))}`
  const res = await fetch(url, { next: { revalidate } })
  if (!res.ok) throw new Error(`Steam ${path} ${res.status}`)
  const json = await res.json()
  return json.response as T
}

export async function getStoreItems(appids: number[], revalidate: number): Promise<Map<number, SteamStoreItem>> {
  const res = await steamApi<{ store_items?: SteamStoreItem[] }>(
    'IStoreBrowseService/GetItems/v1/',
    { ids: appids.map((appid) => ({ appid })), context: CONTEXT, data_request: { include_assets: true } },
    revalidate,
  )
  return new Map((res.store_items ?? []).map((it) => [it.appid, it]))
}

export { CONTEXT as STEAM_CONTEXT }
