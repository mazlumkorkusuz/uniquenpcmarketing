import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ items: [] })

  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=english&cc=US`
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) return NextResponse.json({ error: 'Steam API error' }, { status: 502 })

  const data = await res.json()
  return NextResponse.json(data)
}
