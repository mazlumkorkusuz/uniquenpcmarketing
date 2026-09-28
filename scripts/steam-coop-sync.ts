#!/usr/bin/env npx tsx
/**
 * Steam Co-op Sync Script
 * Scans Steam new releases (last 7 days), filters co-op games,
 * saves to Supabase steam_coop_games table.
 * Old records are deleted before inserting fresh ones.
 *
 * Usage: npx tsx scripts/steam-coop-sync.ts
 * Scheduled: nightly at 02:00 via cron/Railway
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const STEAM_SYNC_SECRET = process.env.STEAM_SYNC_SECRET // not required for direct script run

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Co-op category IDs on Steam
const COOP_CATEGORY_IDS = new Set([9, 3871, 3841]) // Co-op, Online Co-op, Local Co-op
const MAX_GAMES = 200
const BATCH_SIZE = 5
const DAYS_BACK = 7

interface RawSearchItem {
  appid?: number
  id?: number
  logo?: string
  tiny_image?: string
  name?: string
  price?: { final: number; initial: number; discount_percent: number }
  metascore?: string | number
  platforms?: { windows?: boolean; mac?: boolean; linux?: boolean }
  release_date?: string
}

interface GameRow {
  appid: number
  name: string
  tiny_image: string
  price_final: number | null
  price_initial: number | null
  discount_percent: number
  metascore: string | null
  fetched_at: string
}

async function hasCoopCategory(appid: number): Promise<boolean> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appid}&filters=categories&cc=US&l=english`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return false
    const data = await res.json() as Record<string, { success: boolean; data?: { categories?: { id: number }[] } }>
    const categories = data[String(appid)]?.data?.categories ?? []
    return categories.some((c) => COOP_CATEGORY_IDS.has(c.id))
  } catch {
    return false
  }
}

async function fetchNewReleases(): Promise<{ appid: number; name: string; tiny_image: string; price?: { final: number; initial: number; discount_percent: number }; metascore?: string }[]> {
  const url = `https://store.steampowered.com/search/results/?filter=released&sort_by=Released_DESC&json=1&count=${MAX_GAMES}&cc=US&l=english&v=2`
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`Steam search returned ${res.status}`)
  const data = await res.json() as { items?: RawSearchItem[] }

  const cutoff = Date.now() - DAYS_BACK * 24 * 60 * 60 * 1000

  return (data.items ?? []).map((item) => {
    const appid = item.appid ?? item.id
      ?? (item.logo ? Number(item.logo.match(/\/apps\/(\d+)\//)?.[1] ?? 0) : 0)
      ?? (item.tiny_image ? Number(item.tiny_image.match(/\/apps\/(\d+)\//)?.[1] ?? 0) : 0)

    const releaseTs = item.release_date ? new Date(item.release_date).getTime() : cutoff

    return {
      appid: Number(appid) || 0,
      name: item.name ?? '',
      tiny_image: item.tiny_image ?? item.logo
        ?? (appid ? `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/capsule_sm_120.jpg` : ''),
      price: item.price,
      metascore: item.metascore ? String(item.metascore) : undefined,
      _releaseTs: releaseTs,
    }
  }).filter((i) => i.appid > 0 && i.name && i._releaseTs >= cutoff)
}

async function main() {
  console.log(`🎮  Steam Co-op Sync — ${new Date().toISOString()}`)
  console.log(`📅  Scanning games released in the last ${DAYS_BACK} days...`)

  const allNew = await fetchNewReleases()
  console.log(`🔍  Found ${allNew.length} new releases, checking for co-op...`)

  const coopGames: typeof allNew = []

  for (let i = 0; i < allNew.length; i += BATCH_SIZE) {
    const batch = allNew.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(batch.map((g) => hasCoopCategory(g.appid)))
    batch.forEach((g, idx) => {
      if (results[idx]) {
        coopGames.push(g)
        console.log(`  ✅  ${g.name} (${g.appid})`)
      }
    })
    // Small delay to avoid rate limiting
    if (i + BATCH_SIZE < allNew.length) {
      await new Promise((r) => setTimeout(r, 300))
    }
  }

  console.log(`\n🗑️   Deleting old records from steam_coop_games...`)
  const { error: deleteError } = await supabase
    .from('steam_coop_games')
    .delete()
    .neq('appid', 0)

  if (deleteError) {
    console.error('❌  Delete failed:', deleteError.message)
    process.exit(1)
  }

  if (coopGames.length === 0) {
    console.log('⚠️   No co-op games found this week. Table cleared.')
    process.exit(0)
  }

  const rows: GameRow[] = coopGames.map((g) => ({
    appid: g.appid,
    name: g.name,
    tiny_image: g.tiny_image,
    price_final: g.price?.final ?? null,
    price_initial: g.price?.initial ?? null,
    discount_percent: g.price?.discount_percent ?? 0,
    metascore: g.metascore ?? null,
    fetched_at: new Date().toISOString(),
  }))

  console.log(`💾  Inserting ${rows.length} co-op games...`)
  const { error: insertError } = await supabase
    .from('steam_coop_games')
    .insert(rows)

  if (insertError) {
    console.error('❌  Insert failed:', insertError.message)
    process.exit(1)
  }

  console.log(`✅  Done! Inserted ${rows.length} co-op games into steam_coop_games.`)
}

main().catch((e) => {
  console.error('❌  Unhandled error:', e)
  process.exit(1)
})
