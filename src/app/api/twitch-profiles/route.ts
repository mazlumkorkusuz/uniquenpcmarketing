import { NextResponse } from 'next/server'
import { twitchHeaders } from '@/lib/twitch'

export async function POST(request: Request) {
  let usernames: string[]
  try {
    const body = await request.json()
    usernames = Array.isArray(body?.usernames)
      ? body.usernames.filter((u: unknown): u is string => typeof u === 'string' && u.trim().length > 0)
      : []
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (usernames.length === 0) return NextResponse.json({ profiles: {} })

  let headers: Record<string, string>
  try {
    headers = await twitchHeaders()
  } catch {
    return NextResponse.json({ error: 'Twitch credentials not configured' }, { status: 500 })
  }

  const unique = Array.from(new Set(usernames.map(u => u.trim().toLowerCase()))).slice(0, 500)
  const chunks: string[][] = []
  for (let i = 0; i < unique.length; i += 100) chunks.push(unique.slice(i, i + 100))

  const profiles: Record<string, string> = {}
  try {
    await Promise.all(
      chunks.map(async chunk => {
        const params = chunk.map(u => `login=${encodeURIComponent(u)}`).join('&')
        const res = await fetch(`https://api.twitch.tv/helix/users?${params}`, { headers })
        if (!res.ok) return
        const data = await res.json()
        for (const u of data.data ?? []) {
          if (u.login && u.profile_image_url) profiles[String(u.login).toLowerCase()] = String(u.profile_image_url)
        }
      })
    )
  } catch {
    return NextResponse.json({ error: 'Failed to fetch Twitch profiles' }, { status: 502 })
  }

  return NextResponse.json({ profiles })
}
