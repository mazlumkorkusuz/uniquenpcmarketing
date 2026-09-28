/* eslint-disable @typescript-eslint/no-require-imports -- plain Node CommonJS script run by GitHub Actions */
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = require('ws');
}

// Campaign sender, run by .github/workflows/send-campaign.yml (GitHub Actions).
//
// Sends every campaign with status 'ready_to_send': each pending recipient gets the rendered
// template through Hostinger SMTP (465/SSL), with the tracked logo and hidden pixel pointing at
// https://uniquenpcmarketing.com/api/mail-tracking. Mails go out 90 seconds apart.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, SMTP_PASS (optional; falls back to the account's
// saved password), MAIL_SENDER_PAT (to continue in a new run near the time limit).
// Dependencies live in scripts/package.json (installed with `npm ci` in scripts/).
//
// The repository is public, so its Actions logs are too: never log email addresses or message
// content here — only ids and counts.
//
// Mirrors the per-mail logic of src/app/api/mail-gonder/route.ts (rendering, tracking, bounces,
// daily limits); keep the two in sync.

const nodemailer = require('nodemailer')
const { createClient } = require('@supabase/supabase-js')

const SMTP_HOST = 'smtp.hostinger.com'
const SMTP_PORT = 465
const TRACKING_URL = 'https://uniquenpcmarketing.com/api/mail-tracking'
const DELAY_MS = 90_000
// GitHub kills jobs after 6h (workflow sets 350 min); stop well before and hand over to a new run
const RUN_BUDGET_MS = 5.5 * 60 * 60 * 1000
const ACTIVE_ACCOUNT_STATUSES = ['active', 'Aktif']
const REPO = 'mazlumkorkusuz/uniquenpcmarketing'

const startedAt = Date.now()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function requireEnv(name) {
  const v = process.env[name]
  if (!v) {
    console.error(`${name} is not set`)
    process.exit(1)
  }
  return v
}

const supabase = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_KEY'), {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Rendering (same as src/lib/mail.ts renderTemplate) ─────────────────────

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function renderTemplate(text, vars, raw = false) {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const v = vars[key]
    if (v === null || v === undefined) return ''
    return raw ? String(v) : escapeHtml(String(v))
  })
}

function htmlToText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Tracked logo (the template's own logo, or one added at the top) + hidden pixel at the bottom
function withTracking(bodyHtml, { account, campaign, recipient }) {
  const tracking = (type, extra = {}) =>
    `${TRACKING_URL}?` +
    new URLSearchParams({ type, ...extra, e: recipient.email, c: campaign.id, r: recipient.id }).toString().replace(/&/g, '&amp;')
  const pixel = `<img src="${tracking('pixel')}" width="1" height="1" alt="" style="display:none;" />`

  const isLogoSrc = (src) => src === account.logo_url || /\/images\/Logo\d+\.(jpe?g|png|webp)$/i.test(src)
  let trackedLogo = false
  let html = bodyHtml.replace(/(<img\b[^>]*?\bsrc=")([^"]+)(")/gi, (match, pre, src, post) => {
    if (trackedLogo || !/^https:\/\//i.test(src) || !isLogoSrc(src)) return match
    trackedLogo = true
    return pre + tracking('logo', { logo: src }) + post
  })
  if (!trackedLogo && account.logo_url) {
    const logo = `<div style="text-align:center;padding:16px 0"><img src="${tracking('logo', { logo: account.logo_url })}" alt="" height="56" style="display:inline-block;height:56px;width:auto;border:0" /></div>`
    html = /<body[^>]*>/i.test(html) ? html.replace(/<body[^>]*>/i, (tag) => tag + logo) : logo + html
  }
  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${pixel}</body>`) : html + pixel
}

// ── Database helpers ────────────────────────────────────────────────────────

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

// Mails sent today from an account (same rule as mail-gonder's countSentToday)
async function countSentToday(accountId) {
  const since = startOfToday()
  const own = await supabase.from('mail_recipients').select('id', { count: 'exact', head: true }).eq('account_id', accountId).gte('sent_at', since)
  const viaCampaign = supabase
    .from('mail_recipients')
    .select('id, mail_campaigns!inner(account_id)', { count: 'exact', head: true })
    .eq('mail_campaigns.account_id', accountId)
    .gte('sent_at', since)
  if (own.error) return (await viaCampaign).count ?? 0
  const { count: legacy } = await viaCampaign.is('account_id', null)
  return (own.count ?? 0) + (legacy ?? 0)
}

// Consecutive mails alternate between accounts when a campaign uses several
function interleaveByAccount(items) {
  const groups = new Map()
  for (const it of items) {
    const k = it.account_id ?? ''
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k).push(it)
  }
  const lists = [...groups.values()]
  const out = []
  for (let i = 0; out.length < items.length; i++) for (const l of lists) if (i < l.length) out.push(l[i])
  return out
}

const accountCache = new Map()
async function getAccount(id) {
  if (!accountCache.has(id)) {
    const { data } = await supabase.from('mail_accounts').select('*').eq('id', id).maybeSingle()
    accountCache.set(id, data ?? null)
  }
  return accountCache.get(id)
}

const transports = new Map()
function transportFor(account) {
  if (!transports.has(account.id)) {
    transports.set(
      account.id,
      nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: true,
        auth: { user: account.smtp_user, pass: process.env.SMTP_PASS || account.smtp_pass },
      }),
    )
  }
  return transports.get(account.id)
}

// Cancelled from the campaigns page ('iptal') — checked before every mail so a send stops promptly
async function isCancelled(campaignId) {
  const { data } = await supabase.from('mail_campaigns').select('status').eq('id', campaignId).maybeSingle()
  return !data || data.status === 'iptal'
}

// Best effort: the error_message column may not be migrated yet, and a failure here must never
// affect the recipient's status update
async function setErrorMessage(recipientId, message) {
  await supabase.from('mail_recipients').update({ error_message: message ? String(message).slice(0, 500) : null }).eq('id', recipientId)
}

// Starts a fresh workflow run to carry on where this one stopped
async function continueInNewRun() {
  const token = process.env.MAIL_SENDER_PAT
  if (!token) {
    console.log('Time budget reached; MAIL_SENDER_PAT is not set — trigger the campaign again to resume.')
    return
  }
  const res = await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'content-type': 'application/json' },
    body: JSON.stringify({ event_type: 'send_campaign', client_payload: { continuation: true } }),
  })
  console.log(res.ok ? 'Time budget reached; continuing in a new run.' : `Time budget reached; re-dispatch failed (HTTP ${res.status}).`)
}

// ── Sending ─────────────────────────────────────────────────────────────────

let sentAny = false
async function waitBetweenMails() {
  if (sentAny) await sleep(DELAY_MS)
}

// Returns 'done' | 'paused' | 'out_of_time' | 'cancelled'
async function sendCampaign(campaign) {
  const { data: template } = await supabase.from('mail_templates').select('*').eq('id', campaign.template_id).maybeSingle()
  if (!template) {
    console.log(`Campaign ${campaign.id}: template missing — paused.`)
    return 'paused'
  }

  // Only claim it if it's still queued (it may have been cancelled since it was loaded)
  const { data: claimed } = await supabase
    .from('mail_campaigns')
    .update({ status: 'sending', started_at: campaign.started_at ?? new Date().toISOString() })
    .eq('id', campaign.id)
    .eq('status', 'ready_to_send')
    .select('id')
  if (!claimed?.length) return 'cancelled'

  const { data: pending, error } = await supabase
    .from('mail_recipients')
    .select('*')
    .eq('campaign_id', campaign.id)
    .eq('status', 'pending')
    .order('created_at')
  if (error) throw new Error(`Loading recipients failed: ${error.message}`)
  const queue = interleaveByAccount(pending ?? [])
  console.log(`Campaign ${campaign.id}: ${queue.length} pending recipient(s).`)

  const blocked = new Set() // accounts that hit their daily limit, are inactive or failed to log in
  let sent = 0
  let bounced = 0

  for (const recipient of queue) {
    if (await isCancelled(campaign.id)) return 'cancelled'
    if (Date.now() - startedAt > RUN_BUDGET_MS - DELAY_MS - 60_000) return 'out_of_time'

    const accountId = recipient.account_id ?? campaign.account_id
    if (!accountId || blocked.has(accountId)) continue
    const account = await getAccount(accountId)
    if (!account || !ACTIVE_ACCOUNT_STATUSES.includes(account.status)) {
      console.log(`Account ${accountId}: missing or inactive — its recipients stay pending.`)
      blocked.add(accountId)
      continue
    }
    const sentToday = await countSentToday(account.id)
    if (sentToday >= account.daily_limit) {
      console.log(`Account ${account.id}: daily limit reached (${sentToday}/${account.daily_limit}).`)
      blocked.add(account.id)
      continue
    }

    const vars = {
      name: recipient.name || recipient.email.split('@')[0],
      email: recipient.email,
      platform: recipient.platform,
      followers: recipient.followers != null ? recipient.followers.toLocaleString('en-US') : null,
      language: recipient.language,
      sender_name: account.name,
      sender_email: account.email,
      domain: account.domain,
      logo_url: account.logo_url,
      banner_url: account.banner_url,
    }
    const bodyHtml = renderTemplate(template.html_content, vars)

    await waitBetweenMails()
    // The 90 s wait is when a cancel is most likely to arrive
    if (await isCancelled(campaign.id)) return 'cancelled'
    try {
      await transportFor(account).sendMail({
        from: `"${account.name}" <${account.email}>`,
        to: recipient.name ? `"${recipient.name.replace(/"/g, '')}" <${recipient.email}>` : recipient.email,
        subject: renderTemplate(template.subject, vars, true),
        html: withTracking(bodyHtml, { account, campaign, recipient }),
        text: htmlToText(bodyHtml),
      })
    } catch (e) {
      sentAny = true
      // Rejected at RCPT TO → the address is bad (bounce). Anything else is an account/SMTP problem.
      if (e.command === 'RCPT TO' || e.code === 'EENVELOPE') {
        await supabase
          .from('mail_recipients')
          .update({ status: 'bounced', bounced_at: new Date().toISOString(), bounce_type: (e.responseCode ?? 550) >= 500 ? 'hard' : 'soft' })
          .eq('id', recipient.id)
        await setErrorMessage(recipient.id, `Bounce: ${e.response ?? e.message}`)
        bounced++
        continue
      }
      await setErrorMessage(recipient.id, `SMTP hatası (${e.code ?? e.responseCode ?? 'bilinmiyor'}): ${e.response ?? e.message}`)
      console.log(`Account ${account.id}: SMTP error (${e.code ?? e.responseCode ?? 'unknown'}) — its recipients stay pending.`)
      blocked.add(account.id)
      continue
    }

    sentAny = true
    sent++
    await supabase.from('mail_recipients').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', recipient.id)
    if (recipient.error_message) await setErrorMessage(recipient.id, null)
    await supabase.rpc('increment_campaign_sent', { cid: campaign.id })
    await supabase.from('mail_accounts').update({ sent_today: sentToday + 1 }).eq('id', account.id)
  }

  if (bounced) {
    const { data: c } = await supabase.from('mail_campaigns').select('bounce_count').eq('id', campaign.id).maybeSingle()
    await supabase.from('mail_campaigns').update({ bounce_count: (c?.bounce_count ?? 0) + bounced }).eq('id', campaign.id)
  }
  console.log(`Campaign ${campaign.id}: sent ${sent}, bounced ${bounced}.`)

  const { count: left } = await supabase
    .from('mail_recipients')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaign.id)
    .eq('status', 'pending')
  return (left ?? 0) === 0 ? 'done' : 'paused'
}

async function main() {
  const { data: campaigns, error } = await supabase
    .from('mail_campaigns')
    .select('*')
    .eq('status', 'ready_to_send')
    .order('created_at')
  if (error) throw new Error(`Loading campaigns failed: ${error.message}`)
  if (!campaigns?.length) {
    console.log('No campaigns ready to send.')
    return
  }

  for (const campaign of campaigns) {
    const result = await sendCampaign(campaign)
    if (result === 'cancelled') {
      console.log(`Campaign ${campaign.id}: cancelled — stopped.`)
      continue
    }
    // Status changes below only apply while the campaign is still ours ('sending'), so they never
    // overwrite a cancellation that arrived in the meantime
    if (result === 'out_of_time') {
      // Put it back in the queue so the next run picks it up
      await supabase.from('mail_campaigns').update({ status: 'ready_to_send' }).eq('id', campaign.id).eq('status', 'sending')
      await continueInNewRun()
      return
    }
    if (result === 'done') {
      await supabase
        .from('mail_campaigns')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', campaign.id)
        .in('status', ['sending', 'ready_to_send'])
      console.log(`Campaign ${campaign.id}: completed.`)
    } else {
      // Recipients left but every usable account is blocked (daily limit / inactive / SMTP error)
      await supabase.from('mail_campaigns').update({ status: 'paused' }).eq('id', campaign.id).in('status', ['sending', 'ready_to_send'])
      console.log(`Campaign ${campaign.id}: paused with recipients still pending.`)
    }
  }
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
