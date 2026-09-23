import { NextResponse } from 'next/server'
import { twitchHeaders } from '@/lib/twitch'

interface Stream {
  user_name: string
  game_name: string
  viewer_count: number
  thumbnail_url: string
  title: string
}

interface Category {
  name: string
  id: string
}

export async function GET() {
  let headers: Record<string, string>
  try {
    headers = await twitchHeaders()
  } catch {
    return NextResponse.json({ error: 'Twitch credentials not configured' }, { status: 500 })
  }

  const [streamsRes, categoriesRes] = await Promise.all([
    fetch('https://api.twitch.tv/helix/streams?first=10', { headers }),
    fetch('https://api.twitch.tv/helix/games/top?first=10', { headers }),
  ])

  if (!streamsRes.ok || !categoriesRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch Twitch data' }, { status: 502 })
  }

  const streamsData = await streamsRes.json()
  const categoriesData = await categoriesRes.json()

  const streams: Stream[] = (streamsData.data ?? []).map((s: Record<string, unknown>) => ({
    user_name: s.user_name,
    game_name: s.game_name,
    viewer_count: s.viewer_count,
    thumbnail_url: (s.thumbnail_url as string)?.replace('{width}', '320').replace('{height}', '180') ?? '',
    title: s.title,
  }))

  const categories: Category[] = (categoriesData.data ?? []).map((g: Record<string, unknown>) => ({
    name: g.name,
    id: g.id,
  }))

  return NextResponse.json({ streams, categories })
}
