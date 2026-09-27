// Railway cron entry point (see railway.cron.json): triggers the inbox sync on the web service
// and exits. Needs CRON_SECRET (same value as the web service); SYNC_URL defaults to production.
const url = process.env.SYNC_URL ?? 'https://uniquenpcmarketing.com/api/mail-imap-sync'
const secret = process.env.CRON_SECRET

if (!secret) {
  console.error('CRON_SECRET is not set')
  process.exit(1)
}

try {
  const res = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(5 * 60_000),
  })
  const body = await res.json().catch(() => ({}))
  console.log(`[imap-sync] HTTP ${res.status}`, JSON.stringify(body))
  process.exit(res.ok ? 0 : 1)
} catch (e) {
  console.error('[imap-sync] request failed:', e)
  process.exit(1)
}
