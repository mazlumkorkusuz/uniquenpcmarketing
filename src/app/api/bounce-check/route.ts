import { NextRequest, NextResponse } from 'next/server'
import * as dns from 'dns'
import * as net from 'net'

// ============================================================
// Bounce Check API  –  Node.js port of bounce_filter.py
//
// POST /api/bounce-check
//   Body: { emails: string[] }
//   Response: { results: BounceResult[] }
//
// Each email is checked:
//  1. MX record lookup via dns.promises.resolveMx
//  2. SMTP RCPT TO on port 25 (raw TCP, no TLS)
//
// Returns per-email status:
//   OK        → 250 response  (deliverable)
//   BOUNCE    → 5xx response  (550/551/552/553/554 = user does not exist)
//   BELIRSIZ  → connect error / timeout / 4xx (uncertain – keep in list)
//   YOK       → invalid format / no MX record
//
// ⚠️  Railway may block outbound port 25.
//     In that case all results come back as BELIRSIZ and are kept in the clean list.
// ============================================================

export interface BounceResult {
  email: string
  status: 'OK' | 'BOUNCE' | 'BELIRSIZ' | 'YOK'
  reason: string
  code: number
}

const BOUNCE_CODES = new Set([550, 551, 552, 553, 554])
const SMTP_TIMEOUT_MS = 10_000
const HELO_DOMAIN = 'korkusuzz.com'
const FROM_ADDRESS = 'check@korkusuzz.com'

function validateEmailFormat(email: string): boolean {
  if (!email || email.includes('..') || (email.match(/@/g) ?? []).length !== 1) return false
  const [local, domain] = email.split('@')
  return !!(local && domain && domain.includes('.'))
}

async function getMxHost(domain: string): Promise<string | null> {
  try {
    const records = await dns.promises.resolveMx(domain)
    if (!records || records.length === 0) return null
    records.sort((a, b) => a.priority - b.priority)
    return records[0].exchange.replace(/\.$/, '')
  } catch {
    return null
  }
}

function smtpCheck(mxHost: string, email: string): Promise<{ code: number; message: string }> {
  return new Promise((resolve) => {
    let response = ''
    let stage = 'connect'
    let settled = false

    const done = (code: number, message: string) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      socket.destroy()
      resolve({ code, message })
    }

    const timer = setTimeout(() => done(0, 'Timeout'), SMTP_TIMEOUT_MS)

    const socket = new net.Socket()
    socket.setTimeout(SMTP_TIMEOUT_MS)

    socket.connect(25, mxHost, () => {
      // Wait for server greeting (220)
    })

    socket.on('data', (chunk) => {
      response += chunk.toString()
      // Wait for a complete response (ends with \r\n)
      if (!response.endsWith('\r\n') && !response.endsWith('\n')) return

      const lines = response.trim().split(/\r?\n/)
      const last = lines[lines.length - 1]
      const codeMatch = last.match(/^(\d{3})[ -]/)
      if (!codeMatch) return

      const code = parseInt(codeMatch[1], 10)
      response = ''

      try {
        if (stage === 'connect') {
          if (code !== 220) { done(code, `Greeting failed: ${last}`); return }
          stage = 'helo'
          socket.write(`HELO ${HELO_DOMAIN}\r\n`)
        } else if (stage === 'helo') {
          if (code !== 250) { done(code, `HELO failed: ${last}`); return }
          stage = 'mail'
          socket.write(`MAIL FROM:<${FROM_ADDRESS}>\r\n`)
        } else if (stage === 'mail') {
          if (code !== 250) { done(code, `MAIL FROM failed: ${last}`); return }
          stage = 'rcpt'
          socket.write(`RCPT TO:<${email}>\r\n`)
        } else if (stage === 'rcpt') {
          socket.write(`QUIT\r\n`)
          done(code, last)
        }
      } catch (err) {
        done(0, `Write error: ${String(err).slice(0, 80)}`)
      }
    })

    socket.on('timeout', () => done(0, 'Socket timeout'))
    socket.on('error', (err) => done(0, `Socket error: ${err.message.slice(0, 80)}`))
    socket.on('close', () => {
      if (!settled) done(0, 'Connection closed unexpectedly')
    })
  })
}

async function checkEmail(email: string): Promise<BounceResult> {
  email = email.trim().toLowerCase()

  if (!validateEmailFormat(email)) {
    return { email, status: 'YOK', reason: 'Geçersiz format', code: 0 }
  }

  const domain = email.split('@')[1]

  const mxHost = await getMxHost(domain)
  if (!mxHost) {
    return { email, status: 'YOK', reason: 'MX kaydı yok', code: 0 }
  }

  try {
    const { code, message } = await smtpCheck(mxHost, email)

    if (code === 250) {
      return { email, status: 'OK', reason: 'Hesap var', code }
    } else if (BOUNCE_CODES.has(code)) {
      return { email, status: 'BOUNCE', reason: `Hesap yok (kod: ${code})`, code }
    } else if (code === 0) {
      // Network error or timeout — treat as uncertain (keep in list)
      return { email, status: 'BELIRSIZ', reason: message, code }
    } else {
      return { email, status: 'BELIRSIZ', reason: `Kod: ${code} – ${message.slice(0, 80)}`, code }
    }
  } catch (err) {
    return { email, status: 'BELIRSIZ', reason: `SMTP hatası: ${String(err).slice(0, 80)}`, code: 0 }
  }
}

// Process emails with limited concurrency to avoid hammering the network
async function checkEmailsBatch(emails: string[], concurrency = 5): Promise<BounceResult[]> {
  const results: BounceResult[] = []
  for (let i = 0; i < emails.length; i += concurrency) {
    const batch = emails.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(checkEmail))
    results.push(...batchResults)
  }
  return results
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const emails: string[] = body.emails

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'emails dizisi gerekli' }, { status: 400 })
    }

    if (emails.length > 500) {
      return NextResponse.json({ error: 'Tek istekte en fazla 500 email kontrol edilebilir' }, { status: 400 })
    }

    const results = await checkEmailsBatch(emails)

    const stats = {
      total: results.length,
      ok: results.filter((r) => r.status === 'OK').length,
      bounce: results.filter((r) => r.status === 'BOUNCE').length,
      belirsiz: results.filter((r) => r.status === 'BELIRSIZ').length,
      yok: results.filter((r) => r.status === 'YOK').length,
    }

    return NextResponse.json({ results, stats })
  } catch (err) {
    console.error('[bounce-check] error:', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
