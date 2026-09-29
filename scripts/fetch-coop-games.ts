/**
 * Steam Co-op New Releases Fetcher — Supabase entegrasyonlu
 *
 * Çalıştırma:
 *   npx tsx scripts/fetch-coop-games.ts
 *
 * Ortam değişkenleri (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   ← service role key (RLS bypass için)
 *
 * Ne yapar:
 *   1. Steam'den son 7 günde çıkan oyunları çeker (HTML scraping)
 *   2. Supabase'de zaten kayıtlı olanları atlar (daha önce kontrol edilmiş)
 *   3. Yeni oyunlar için Steam appdetails API → co-op kontrolü
 *   4. Sonucu Supabase'e kaydeder (co-op olsun olmasın — tekrar kontrol etmemek için)
 *   5. 7 günden eski kayıtları Supabase'den siler
 */

import * as cheerio from 'cheerio'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// .env.local dosyasını yükle
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// Co-op kategori ID'leri
const COOP_IDS = new Set([
  9,    // Co-op
  3871, // Online Co-op
  3841, // Local Co-op
])

// ─── Supabase client ──────────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ─── Tipler ───────────────────────────────────────────────────────────────────

interface RawGame {
  appid: string
  name: string
  date: string        // Ham Steam string: "23 Sep, 2026"
  dateIso: string     // ISO: "2026-09-23"
}

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

/**
 * Steam tarih formatlarını parse eder.
 * "23 Sep, 2026" veya "Sep 23, 2026" → { date: Date, iso: "2026-09-23" }
 * "Coming Soon", "Q4 2026" vb. → null
 */
function parseReleaseDate(raw: string): { date: Date; iso: string } | null {
  const str = raw.trim()
  if (!str) return null

  let parsed: Date | null = null

  // "Sep 23, 2026" formatı (JS native)
  const d1 = new Date(str)
  if (!isNaN(d1.getTime())) parsed = d1

  // "23 Sep, 2026" formatı
  if (!parsed) {
    const m = str.match(/^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})$/)
    if (m) {
      const d2 = new Date(`${m[2]} ${m[1]}, ${m[3]}`)
      if (!isNaN(d2.getTime())) parsed = d2
    }
  }

  if (!parsed) return null

  const iso = parsed.toISOString().slice(0, 10) // "2026-09-23"
  return { date: parsed, iso }
}

// ─── Adım 1: Steam'den yeni oyunları çek ─────────────────────────────────────

async function fetchNewReleases(): Promise<RawGame[]> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)

  const games: RawGame[] = []

  // Steam session çerezi
  await fetch('https://store.steampowered.com/', { headers: { 'User-Agent': UA } })
    .catch(() => {})

  for (let start = 0; start < 250; start += 50) {
    const params = new URLSearchParams({
      sort_by:   'Released_DESC',
      filter:    'newreleases',
      start:     String(start),
      count:     '50',
      category1: '998',
    })

    let res: Response
    try {
      res = await fetch(`https://store.steampowered.com/search/?${params}`, {
        headers: { 'User-Agent': UA },
      })
    } catch (e) {
      console.error(`  [search] Network hatası start=${start}:`, e)
      break
    }

    if (!res.ok) {
      console.error(`  [search] HTTP ${res.status} start=${start}`)
      break
    }

    const html = await res.text()
    const $ = cheerio.load(html)
    let shouldStop = false

    $('a.search_result_row').each((_, el) => {
      if (shouldStop) return false as unknown as void

      const href    = $(el).attr('href') ?? ''
      const appid   = href.split('/').find(p => /^\d{5,}$/.test(p))
      const name    = $(el).find('span.title').text().trim()
      const dateStr = $(el).find('div.search_released').text().trim()

      if (!appid || !name) return

      const parsed = parseReleaseDate(dateStr)
      if (!parsed) return

      if (parsed.date < cutoff) {
        shouldStop = true
        return false as unknown as void
      }

      games.push({ appid, name, date: dateStr, dateIso: parsed.iso })
    })

    console.log(`  start=${start}: ${games.length} oyun toplandı`)
    if (shouldStop) break

    await sleep(500)
  }

  return games
}

// ─── Adım 2: Supabase'de zaten kayıtlı olanları filtrele ─────────────────────

async function filterUnchecked(games: RawGame[]): Promise<RawGame[]> {
  if (games.length === 0) return []

  const appids = games.map(g => g.appid)

  const { data, error } = await supabase
    .from('steam_coop_games')
    .select('appid')
    .in('appid', appids)

  if (error) {
    console.error('  [supabase] Kayıt sorgusu hatası:', error.message)
    return games // Hata varsa hepsini kontrol et (güvenli taraf)
  }

  const checkedSet = new Set((data ?? []).map((r: { appid: string }) => r.appid))
  const unchecked = games.filter(g => !checkedSet.has(g.appid))

  console.log(`  ${checkedSet.size} zaten kayıtlı, ${unchecked.length} yeni oyun kontrol edilecek`)
  return unchecked
}

// ─── Adım 3: Co-op kontrolü ve Supabase'e kayıt ──────────────────────────────

async function checkAndSave(games: RawGame[]): Promise<number> {
  let savedCoop = 0

  for (let i = 0; i < games.length; i++) {
    const { appid, name, date, dateIso } = games[i]

    try {
      const res = await fetch(
        `https://store.steampowered.com/api/appdetails?appids=${appid}&filters=categories,price_overview&l=english`,
        { headers: { 'User-Agent': UA } }
      )

      if (!res.ok) {
        console.log(`  [${i + 1}/${games.length}] ${name} → HTTP ${res.status}, atlandı`)
        await sleep(150)
        continue
      }

      type AppDetailsResponse = Record<string, {
        success: boolean
        data?: {
          categories?: Array<{ id: number; description: string }>
          price_overview?: { final: number; initial: number; discount_percent: number }
        }
      }>

      const json = (await res.json()) as AppDetailsResponse
      const appData = json?.[appid]?.data ?? {}
      const cats = appData.categories ?? []
      const coopTypes = cats.filter(c => COOP_IDS.has(c.id)).map(c => c.description)
      const isCoop = coopTypes.length > 0
      const priceData = appData.price_overview

      const status = isCoop ? `✓ CO-OP: ${coopTypes.join(', ')}` : '✗'
      console.log(`  [${i + 1}/${games.length}] ${name} → ${status}`)

      // Supabase'e kaydet (co-op olsun olmasın — tekrar kontrol etmemek için)
      const { error } = await supabase
        .from('steam_coop_games')
        .upsert({
          appid,
          name,
          release_date:     date,
          release_date_iso: dateIso,
          tiny_image:       `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/capsule_sm_120.jpg`,
          price_final:      priceData?.final ?? null,
          price_initial:    priceData?.initial ?? null,
          discount_percent: priceData?.discount_percent ?? null,
          coop_types:       coopTypes,
          is_coop:          isCoop,
          checked_at:       new Date().toISOString(),
        }, { onConflict: 'appid' })

      if (error) {
        console.error(`  [supabase] Kayıt hatası ${appid}:`, error.message)
      } else if (isCoop) {
        savedCoop++
      }
    } catch (e) {
      console.error(`  [${i + 1}/${games.length}] ${name} → ERR:`, e)
    }

    await sleep(150)
  }

  return savedCoop
}

// ─── Adım 4: 7 günden eski kayıtları sil ─────────────────────────────────────

async function deleteOldGames(): Promise<number> {
  const cutoffIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const { data, error } = await supabase
    .from('steam_coop_games')
    .delete()
    .lt('release_date_iso', cutoffIso)
    .select('appid')

  if (error) {
    console.error('  [supabase] Silme hatası:', error.message)
    return 0
  }

  return (data ?? []).length
}

// ─── Ana fonksiyon ────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Steam Co-op New Releases Fetcher ===\n')
  const startTime = Date.now()

  // 1. Steam'den son 7 günün oyunlarını çek
  console.log('[1/4] Son 7 günün yeni oyunları çekiliyor...')
  const allGames = await fetchNewReleases()
  console.log(`→ ${allGames.length} oyun bulundu\n`)

  if (allGames.length === 0) {
    console.warn('Hiç oyun bulunamadı. Steam HTML yapısı değişmiş olabilir.')
    process.exit(1)
  }

  // 2. Daha önce kontrol edilenleri filtrele
  console.log('[2/4] Supabase\'de zaten kayıtlı olanlar filtreleniyor...')
  const newGames = await filterUnchecked(allGames)
  console.log(`→ ${newGames.length} yeni oyun kontrol edilecek\n`)

  // 3. Yeni oyunlar için co-op kontrolü yap ve kaydet
  if (newGames.length > 0) {
    console.log(`[3/4] ${newGames.length} oyun için co-op kontrolü yapılıyor...`)
    const savedCoop = await checkAndSave(newGames)
    console.log(`→ ${savedCoop} co-op oyun kaydedildi\n`)
  } else {
    console.log('[3/4] Kontrol edilecek yeni oyun yok, atlanıyor\n')
  }

  // 4. 7 günden eski kayıtları sil
  console.log('[4/4] 7 günden eski kayıtlar siliniyor...')
  const deletedCount = await deleteOldGames()
  console.log(`→ ${deletedCount} eski kayıt silindi\n`)

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
  console.log(`✓ Tamamlandı — ${elapsed} dakika`)
}

main().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
