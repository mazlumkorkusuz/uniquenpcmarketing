import { NextResponse } from 'next/server'
import { steamApi, getStoreItems, steamCapsuleUrl, steamStoreUrl } from '@/lib/steam'

async function currentPlayers(appid: number): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appid}`,
      { next: { revalidate: 300 } },
    )
    if (!res.ok) return null
    const json = await res.json()
    return typeof json?.response?.player_count === 'number' ? json.response.player_count : null
  } catch {
    return null
  }
}

// Steam's most played games, re-ranked by players online right now, top 10
export async function GET() {
  try {
    const charts = await steamApi<{ ranks?: { rank: number; appid: number; peak_in_game: number }[] }>(
      'ISteamChartsService/GetMostPlayedGames/v1/',
      {},
      300,
    )
    // Take a few extra so re-ranking by live players still yields 10
    const top = (charts.ranks ?? []).slice(0, 15)
    const appids = top.map((r) => r.appid)

    const [items, players] = await Promise.all([
      getStoreItems(appids, 3600),
      Promise.all(appids.map(currentPlayers)),
    ])

    const games = top
      .map((r, i) => {
        const item = items.get(r.appid) ?? { appid: r.appid }
        return {
          appid: r.appid,
          name: item.name ?? `App ${r.appid}`,
          players: players[i],
          peakToday: r.peak_in_game,
          image: steamCapsuleUrl(item),
          url: steamStoreUrl(item),
        }
      })
      .sort((a, b) => (b.players ?? b.peakToday) - (a.players ?? a.peakToday))
      .slice(0, 10)

    return NextResponse.json({ games })
  } catch {
    return NextResponse.json({ error: 'Steam charts unavailable' }, { status: 502 })
  }
}
