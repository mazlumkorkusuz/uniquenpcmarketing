import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const appId = req.nextUrl.searchParams.get('appId')?.trim()
  if (!appId) return NextResponse.json({ error: 'appId required' }, { status: 400 })

  const apiKey = process.env.GAMALYTIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const res = await fetch(`https://api.gamalytic.com/game/${appId}`, {
    headers: { 'api-key': apiKey },
    next: { revalidate: 300 },
  })

  if (!res.ok) return NextResponse.json({ error: 'Gamalytic API error', status: res.status }, { status: 502 })

  const data = await res.json()
  return NextResponse.json(data)
}
