import { NextResponse } from 'next/server'

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

async function getTwitchToken(clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: 'POST' }
  )
  if (!res.ok) throw new Error('Failed to get Twitch token')
  const data = await res.json()
  return data.access_token as string
}

export async function GET() {
  const clientId = process.env.TWITCH_CLIENT_ID
  const clientSecret = process.env.TWITCH_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Twitch credentials not configured' }, { status: 500 })
  }

  let token: string
  try {
    token = await getTwitchToken(clientId, clientSecret)
  } catch {
    return NextResponse.json({ error: 'Failed to authenticate with Twitch' }, { status: 502 })
  }

  const headers = {
    'Client-ID': clientId,
    Authorization: `Bearer ${token}`,
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
