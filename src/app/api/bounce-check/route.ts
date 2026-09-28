import { NextRequest, NextResponse } from 'next/server'

export interface BounceResult {
  email: string
  status: 'OK' | 'BOUNCE' | 'BELIRSIZ' | 'YOK'
  reason: string
  code: number
}

const MAIL_SERVICE_URL = process.env.MAIL_SERVICE_URL || 'https://uniquenpc-mail.fly.dev'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!Array.isArray(body.emails) || body.emails.length === 0) {
      return NextResponse.json({ error: 'emails dizisi gerekli' }, { status: 400 })
    }
    const res = await fetch(`${MAIL_SERVICE_URL}/bounce-check`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ emails: body.emails }),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[bounce-check] Fly.io bağlantı hatası:', err)
    return NextResponse.json({ error: 'Mail servisi bağlantı hatası' }, { status: 502 })
  }
}
