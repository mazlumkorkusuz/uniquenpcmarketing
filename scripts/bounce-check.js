/* eslint-disable @typescript-eslint/no-require-imports */
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = require('ws')
}

// Bounce checker — run by .github/workflows/send-campaign.yml BEFORE the mail sender.
//
// For every campaign marked 'ready_to_send', loads its pending recipients and verifies
// each email address via DNS MX lookup + raw SMTP RCPT TO on port 25.
//
// Status codes:
//   OK        → 250   keep in list
//   BOUNCE    → 5xx   mark as 'Bounce' in mail_recipients (won't be sent)
//   BELIRSIZ  → timeout / 4xx / connect error  → keep (uncertain)
//   YOK       → invalid format / no MX record  → keep (format already validated at upload)
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY
// No extra npm deps — uses built-in Node.js `dns` and `net` modules.

const dns = require('dns').promises
const net = require('net')
const { createClient } = require('@supabase/supabase-js')

const BOUNCE_CODES = new Set([550, 551, 552, 553, 554])
const SMTP_TIMEOUT_MS = 10_000
const CONCURRENCY = 5
const HELO_DOMAIN = 'korkusuzz.com'
const FROM_ADDRESS = 'check@korkusuzz.com'

// ── Supabase ──────────────────────────────────────────────────────────────

function requireEnv(name) {
  const v = process.env[name]
  if (!v) { console.error(`${name} is not set`); process.exit(1) }
  return v
}

const supabase = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_KEY'), {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── DNS + SMTP check ──────────────────────────────────────────────────────

async function getMxHost(domain) {
  try {
    const records = await dns.resolveMx(domain)
    if (!records || records.length === 0) return null
    records.sort((a, b) => a.priority - b.priority)
    return records[0].exchange.replace(/\.$/, '')
  } catch {
    return null
  }
}

function smtpCheck(mxHost, email) {
  return new Promise((resolve) => {
    let buf = ''
    let stage = 'connect'
    let settled = false

    const done = (code, message) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      socket.destroy()
      resolve({ code, message })
    }

    const timer = setTimeout(() => done(0, 'Timeout'), SMTP_TIMEOUT_MS)
    const socket = new net.Socket()
    socket.setTimeout(SMTP_TIMEOUT_MS)
    socket.connect(25, mxHost)

    socket.on('data', (chunk) => {
      buf += chunk.toString()
      if (!buf.endsWith('\r\n') && !buf.endsWith('\n')) return
      const lines = buf.trim().split(/\r?\n/)
      const last = lines[lines.length - 1]
      const m = last.match(/^(\d{3})[ -]/)
      if (!m) return
      const code = parseInt(m[1], 10)
      buf = ''
      try {
        if (stage === 'connect') {
          if (code !== 220) { done(code, `Greeting: ${last}`); return }
          stage = 'helo'
          socket.write(`HELO ${HELO_DOMAIN}\r\n`)
        } else if (stage === 'helo') {
          if (code !== 250) { done(code, `HELO: ${last}`); return }
          stage = 'mail'
          socket.write(`MAIL FROM:<${FROM_ADDRESS}>\r\n`)
        } else if (stage === 'mail') {
          if (code !== 250) { done(code, `MAIL FROM: ${last}`); return }
          stage = 'rcpt'
          socket.write(`RCPT TO:<${email}>\r\n`)
        } else if (stage === 'rcpt') {
          socket.write('QUIT\r\n')
          done(code, last)
        }
      } catch (err) {
        done(0, `Write error: ${String(err).slice(0, 80)}`)
      }
    })

    socket.on('timeout', () => done(0, 'Timeout'))
    socket.on('error', (err) => done(0, err.message.slice(0, 80)))
    socket.on('close', () => { if (!settled) done(0, 'Connection closed') })
  })
}

async function checkEmail(email) {
  email = email.trim().toLowerCase()

  // Basic format check
  if (!email || email.includes('..') || (email.match(/@/g) ?? []).length !== 1) {
    return { email, status: 'YOK', reason: 'Geçersiz format', code: 0 }
  }

  const domain = email.split('@')[1]
  const mxHost = await getMxHost(domain)
  if (!mxHost) {
    return { email, status: 'YOK', reason: 'MX kaydı yok', code: 0 }
  }

  try {
    const { code, message } = await smtpCheck(mxHost, email)
    if (code === 250) return { email, status: 'OK', reason: 'Hesap var', code }
    if (BOUNCE_CODES.has(code)) return { email, status: 'BOUNCE', reason: `Hesap yok (${code})`, code }
    return { email, status: 'BELIRSIZ', reason: message.slice(0, 80), code }
  } catch (err) {
    return { email, status: 'BELIRSIZ', reason: String(err).slice(0, 80), code: 0 }
  }
}

// Run array of async tasks with max `limit` concurrent
async function pLimit(tasks, limit) {
  const results = []
  for (let i = 0; i < tasks.length; i += limit) {
    const batch = tasks.slice(i, i + limit)
    results.push(...await Promise.all(batch.map((fn) => fn())))
  }
  return results
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Bounce Check ===')

  // Load all campaigns that are ready to send
  const { data: campaigns, error: cErr } = await supabase
    .from('mail_campaigns')
    .select('id, name')
    .eq('status', 'ready_to_send')

  if (cErr) { console.error('Kampanya yüklenemedi:', cErr.message); process.exit(1) }
  if (!campaigns || campaigns.length === 0) {
    console.log('Gönderilecek kampanya yok — bounce check atlandı.')
    return
  }

  for (const campaign of campaigns) {
    console.log(`\nKampanya: ${campaign.id} — ${campaign.name}`)

    // Load pending recipients for this campaign
    const { data: recipients, error: rErr } = await supabase
      .from('mail_recipients')
      .select('id, email')
      .eq('campaign_id', campaign.id)
      .eq('status', 'pending')

    if (rErr) { console.error('Alıcılar yüklenemedi:', rErr.message); continue }
    if (!recipients || recipients.length === 0) {
      console.log('  Bekleyen alıcı yok.')
      continue
    }

    console.log(`  ${recipients.length} alıcı kontrol edilecek (${CONCURRENCY} eşzamanlı)`)

    let ok = 0, bounce = 0, belirsiz = 0, yok = 0
    const bounceIds = []

    const tasks = recipients.map((r) => async () => {
      const result = await checkEmail(r.email)
      // Log only id + status to keep logs clean (repo is public)
      console.log(`  [${result.status.padEnd(8)}] id:${r.id.slice(0, 8)}… ${result.reason}`)
      if (result.status === 'BOUNCE') { bounce++; bounceIds.push(r.id) }
      else if (result.status === 'OK') ok++
      else if (result.status === 'YOK') yok++
      else belirsiz++
    })

    await pLimit(tasks, CONCURRENCY)

    console.log(`\n  Sonuç: OK=${ok}  BOUNCE=${bounce}  BELİRSİZ=${belirsiz}  YOK=${yok}`)

    // Mark bounces in Supabase — they will be skipped by send-campaign.js
    if (bounceIds.length > 0) {
      // Process in chunks to avoid URL length limits
      for (let i = 0; i < bounceIds.length; i += 100) {
        const chunk = bounceIds.slice(i, i + 100)
        const { error: uErr } = await supabase
          .from('mail_recipients')
          .update({ status: 'Bounce', smtp_sonuc: 'Bounce check: hesap yok' })
          .in('id', chunk)
        if (uErr) console.error('  Bounce güncelleme hatası:', uErr.message)
      }

      // Update campaign bounce_count
      const { error: bErr } = await supabase
        .from('mail_campaigns')
        .update({ bounce_count: supabase.rpc('increment_campaign_bounces', { cid: campaign.id }) })
        .eq('id', campaign.id)

      // Simpler: just do a raw count update
      const { data: cur } = await supabase
        .from('mail_campaigns')
        .select('bounce_count')
        .eq('id', campaign.id)
        .single()

      if (cur) {
        await supabase
          .from('mail_campaigns')
          .update({ bounce_count: (cur.bounce_count ?? 0) + bounceIds.length })
          .eq('id', campaign.id)
      }
      void bErr

      console.log(`  ✓ ${bounceIds.length} bounce işaretlendi, gönderimden çıkarıldı.`)
    } else {
      console.log('  ✓ Bounce bulunamadı — tüm alıcılar temiz.')
    }
  }

  console.log('\n=== Bounce Check Tamamlandı ===\n')
}

main().catch((err) => {
  console.error('Bounce check hatası:', err)
  process.exit(1)
})
