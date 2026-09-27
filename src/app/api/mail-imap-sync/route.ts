import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import Imap from 'imap'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase as serviceClient } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { isAccountActive, type MailAccount } from '@/lib/mail'

// Inbox sync: POST /api/mail-imap-sync
//
// Reads each active mail account's INBOX over IMAP (Hostinger: imap.hostinger.com:993, same login as
// SMTP — credentials come from mail_accounts, never from code) and:
//   - replies: a message from a recipient this account mailed → status 'replied' ("Cevap Verdi"),
//     replied_at = the reply's date
//   - bounces: "Undelivered Mail…" / delivery-failure reports naming a recipient → status 'bounced'
// Each run is recorded in mail_sync_runs (shown as "Son senkronizasyon" on the tracking page).
//
// Called by a signed-in user (tracking page button) or by the Railway cron service with
// `Authorization: Bearer $CRON_SECRET` (uses SUPABASE_SERVICE_ROLE_KEY, since there's no user session).

const IMAP_HOST = 'imap.hostinger.com'
const IMAP_PORT = 993
const MAX_LOOKBACK_DAYS = 90
const MAX_BOUNCE_BODY = 200_000
const EMAIL_RE = /[^\s<>"',;:()[\]]+@[^\s<>"',;:()[\]]+\.[a-z]{2,}/i
// Delivery-failure reports and other automated senders are never replies
const SYSTEM_SENDER_RE = /^(mailer-daemon|postmaster|no-?reply|donotreply)@/i
const BOUNCE_SUBJECTS = ['Undelivered Mail', 'Delivery Status Notification', 'Mail delivery failed']

type Trigger = 'manual' | 'cron'

interface InboxMessage {
  from: string
  date: Date
  subject: string
  body?: string
}

interface AccountResult {
  account: string
  scanned: number
  replies: number
  bounces: number
  error?: string
}

interface CandidateRecipient {
  id: string
  campaign_id: string
  email: string
  status: string
  sent_at: string | null
  account_id?: string | null
  mail_campaigns: { account_id: string | null } | null
}

// ── IMAP ────────────────────────────────────────────────────────────────────

function connect(account: MailAccount): Promise<Imap> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: account.smtp_user,
      password: account.smtp_pass ?? '',
      host: IMAP_HOST,
      port: IMAP_PORT,
      tls: true,
      connTimeout: 15_000,
      authTimeout: 15_000,
    })
    imap.once('ready', () => resolve(imap))
    imap.once('error', reject)
    imap.connect()
  })
}

function openInbox(imap: Imap): Promise<void> {
  return new Promise((resolve, reject) => imap.openBox('INBOX', true, (err) => (err ? reject(err) : resolve())))
}

function search(imap: Imap, criteria: unknown[]): Promise<number[]> {
  return new Promise((resolve, reject) => imap.search(criteria, (err, uids) => (err ? reject(err) : resolve(uids))))
}

// Fetches headers (and optionally the raw body) without marking anything as read
function fetchMessages(imap: Imap, uids: number[], withBody: boolean): Promise<InboxMessage[]> {
  if (uids.length === 0) return Promise.resolve([])
  return new Promise((resolve, reject) => {
    const messages: InboxMessage[] = []
    const bodies = withBody ? ['HEADER.FIELDS (FROM DATE SUBJECT)', 'TEXT'] : 'HEADER.FIELDS (FROM DATE SUBJECT)'
    const fetch = imap.fetch(uids, { bodies, struct: false })
    fetch.on('message', (msg) => {
      let header = ''
      let body = ''
      let internalDate: Date | null = null
      msg.on('body', (stream, info) => {
        stream.on('data', (chunk: Buffer) => {
          if (info.which === 'TEXT') { if (body.length < MAX_BOUNCE_BODY) body += chunk.toString('utf8') }
          else header += chunk.toString('utf8')
        })
      })
      msg.once('attributes', (attrs) => { internalDate = attrs.date })
      msg.once('end', () => {
        const h = Imap.parseHeader(header)
        const from = h.from?.[0]?.match(EMAIL_RE)?.[0]?.toLowerCase()
        const headerDate = h.date?.[0] ? new Date(h.date[0]) : null
        const date = headerDate && !Number.isNaN(headerDate.getTime()) ? headerDate : internalDate
        if (from && date) messages.push({ from, date, subject: h.subject?.[0] ?? '', body: withBody ? body : undefined })
      })
    })
    fetch.once('error', reject)
    fetch.once('end', () => resolve(messages))
  })
}

// IMAP OR takes exactly two keys, so nest them: OR a (OR b c)
function subjectAny(subjects: string[]): unknown[] {
  if (subjects.length === 1) return ['SUBJECT', subjects[0]]
  return ['OR', ['SUBJECT', subjects[0]], subjectAny(subjects.slice(1))]
}

// ── Parsing ─────────────────────────────────────────────────────────────────

// Earliest message per sender — that's when they first replied
function firstReplyBySender(messages: InboxMessage[]): Map<string, Date> {
  const bySender = new Map<string, Date>()
  for (const m of messages) {
    if (SYSTEM_SENDER_RE.test(m.from)) continue
    const prev = bySender.get(m.from)
    if (!prev || m.date < prev) bySender.set(m.from, m.date)
  }
  return bySender
}

// Failed addresses from a delivery report (RFC 3464 Final-Recipient, or Postfix "<addr>: host … said")
function bouncedAddresses(m: InboxMessage): Map<string, { date: Date; hard: boolean }> {
  const out = new Map<string, { date: Date; hard: boolean }>()
  const body = m.body ?? ''
  const hard = !/Status:\s*4\.\d+\.\d+/i.test(body)
  const add = (addr: string | undefined) => {
    const email = addr?.match(EMAIL_RE)?.[0]?.toLowerCase()
    if (email && !SYSTEM_SENDER_RE.test(email)) out.set(email, { date: m.date, hard })
  }
  for (const match of body.matchAll(/(?:Final|Original)-Recipient:\s*rfc822;\s*(\S+)/gi)) add(match[1])
  if (out.size === 0) for (const match of body.matchAll(/^<([^>\s]+@[^>\s]+)>:/gm)) add(match[1])
  return out
}

// ── Database ────────────────────────────────────────────────────────────────

// Recipients with these emails that this account mailed and that are still awaiting an outcome
async function candidates(db: SupabaseClient, account: MailAccount, emails: string[]): Promise<CandidateRecipient[]> {
  const out: CandidateRecipient[] = []
  for (let i = 0; i < emails.length; i += 200) {
    const { data, error } = await db
      .from('mail_recipients')
      .select('*, mail_campaigns(account_id)')
      .in('email', emails.slice(i, i + 200))
      .in('status', ['sent', 'opened'])
    if (error) throw new Error(error.message)
    for (const r of (data ?? []) as CandidateRecipient[]) {
      if ((r.account_id ?? r.mail_campaigns?.account_id) === account.id && r.sent_at) out.push(r)
    }
  }
  return out
}

async function bumpCampaign(db: SupabaseClient, campaignId: string, changes: { reply?: number; bounce?: number }) {
  const { data: c } = await db.from('mail_campaigns').select('sent_count, reply_count, bounce_count').eq('id', campaignId).maybeSingle()
  if (!c) return
  await db
    .from('mail_campaigns')
    .update({
      reply_count: (c.reply_count ?? 0) + (changes.reply ?? 0),
      bounce_count: (c.bounce_count ?? 0) + (changes.bounce ?? 0),
      // A late bounce was first counted as sent
      sent_count: Math.max(0, (c.sent_count ?? 0) - (changes.bounce ?? 0)),
    })
    .eq('id', campaignId)
}

async function syncAccount(db: SupabaseClient, account: MailAccount, since: Date): Promise<AccountResult> {
  let imap: Imap | null = null
  try {
    imap = await connect(account)
    await openInbox(imap)
    const all = await fetchMessages(imap, await search(imap, [['SINCE', since]]), false)
    const bounceReports = await fetchMessages(imap, await search(imap, [['SINCE', since], subjectAny(BOUNCE_SUBJECTS)]), true)

    const replies = firstReplyBySender(all)
    const bounces = new Map<string, { date: Date; hard: boolean }>()
    for (const report of bounceReports) for (const [email, b] of bouncedAddresses(report)) bounces.set(email, b)

    const perCampaign = new Map<string, { reply: number; bounce: number }>()
    const tally = (cid: string, key: 'reply' | 'bounce') => {
      const t = perCampaign.get(cid) ?? { reply: 0, bounce: 0 }
      t[key]++
      perCampaign.set(cid, t)
    }

    let replyCount = 0
    let bounceCount = 0
    for (const r of await candidates(db, account, [...new Set([...replies.keys(), ...bounces.keys()])])) {
      const sentAt = new Date(r.sent_at!)
      const bounce = bounces.get(r.email)
      const replyAt = replies.get(r.email)

      if (bounce && bounce.date >= sentAt) {
        const { error } = await db
          .from('mail_recipients')
          .update({ status: 'bounced', bounced_at: bounce.date.toISOString(), bounce_type: bounce.hard ? 'hard' : 'soft' })
          .eq('id', r.id)
          .in('status', ['sent', 'opened'])
        if (error) throw new Error(error.message)
        bounceCount++
        tally(r.campaign_id, 'bounce')
      } else if (replyAt && replyAt >= sentAt) {
        const { error } = await db
          .from('mail_recipients')
          .update({ status: 'replied', replied_at: replyAt.toISOString() })
          .eq('id', r.id)
          .is('replied_at', null)
        if (error) throw new Error(error.message)
        replyCount++
        tally(r.campaign_id, 'reply')
      }
    }

    for (const [cid, t] of perCampaign) await bumpCampaign(db, cid, t)
    return { account: account.email, scanned: all.length, replies: replyCount, bounces: bounceCount }
  } catch (e) {
    return { account: account.email, scanned: 0, replies: 0, bounces: 0, error: (e as Error).message }
  } finally {
    imap?.end()
  }
}

// ── Handler ─────────────────────────────────────────────────────────────────

function isCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  const header = request.headers.get('authorization') ?? ''
  if (!secret || !header.startsWith('Bearer ')) return false
  const given = Buffer.from(header.slice(7))
  const expected = Buffer.from(secret)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export async function POST(request: NextRequest) {
  let db: SupabaseClient
  let trigger: Trigger
  if (isCronRequest(request)) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY tanımlı değil' }, { status: 500 })
    }
    db = serviceClient
    trigger = 'cron'
  } else {
    const client = await createSupabaseServerClient()
    const { data: { user } } = await client.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    db = client
    trigger = 'manual'
  }

  const { data: accountRows, error: accountError } = await db.from('mail_accounts').select('*').order('created_at')
  if (accountError) return NextResponse.json({ error: accountError.message }, { status: 500 })
  const accounts = ((accountRows ?? []) as MailAccount[]).filter((a) => isAccountActive(a.status))
  if (accounts.length === 0) return NextResponse.json({ error: 'Aktif mail hesabı yok' }, { status: 400 })

  // Look back to the oldest mail still awaiting an outcome (capped)
  const { data: oldest } = await db
    .from('mail_recipients')
    .select('sent_at')
    .in('status', ['sent', 'opened'])
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  const floor = new Date(Date.now() - MAX_LOOKBACK_DAYS * 86_400_000)
  const since = oldest?.sent_at && new Date(oldest.sent_at) > floor ? new Date(oldest.sent_at) : floor

  const results: AccountResult[] = []
  for (const account of accounts) results.push(await syncAccount(db, account, since))

  const summary = {
    replies: results.reduce((s, r) => s + r.replies, 0),
    bounces: results.reduce((s, r) => s + r.bounces, 0),
    accounts: results,
  }

  // Best effort: the page shows the latest run as "Son senkronizasyon"
  const { data: run } = await db
    .from('mail_sync_runs')
    .insert({ trigger, replies: summary.replies, bounces: summary.bounces, details: results })
    .select('ran_at')
    .maybeSingle()

  return NextResponse.json({ ok: true, ...summary, since: since.toISOString(), ran_at: run?.ran_at ?? new Date().toISOString() })
}
