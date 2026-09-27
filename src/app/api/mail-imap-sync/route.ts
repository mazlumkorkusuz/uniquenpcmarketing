import { NextResponse } from 'next/server'
import Imap from 'imap'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { isAccountActive, type MailAccount } from '@/lib/mail'

// Reply sync: POST /api/mail-imap-sync
// Reads each active mail account's INBOX over IMAP (Hostinger: imap.hostinger.com:993, same login
// as SMTP), and marks campaign recipients who wrote back as replied (status 'replied', replied_at =
// the reply's date). Only recipients this account mailed, before the reply arrived, are matched.

const IMAP_HOST = 'imap.hostinger.com'
const IMAP_PORT = 993
const MAX_LOOKBACK_DAYS = 90
const EMAIL_RE = /[^\s<>"',;]+@[^\s<>"',;]+\.[^\s<>"',;]+/
// Auto-replies from mail servers are bounces, not replies
const SYSTEM_SENDER_RE = /^(mailer-daemon|postmaster|no-?reply|donotreply)@/i

interface InboxMessage {
  from: string
  date: Date
}

interface AccountResult {
  account: string
  scanned: number
  matched: number
  error?: string
}

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

// Sender address + date of every INBOX message since `since` (headers only, nothing marked as read)
function readInbox(imap: Imap, since: Date): Promise<InboxMessage[]> {
  return new Promise((resolve, reject) => {
    imap.openBox('INBOX', true, (openErr) => {
      if (openErr) return reject(openErr)
      imap.search([['SINCE', since]], (searchErr, uids) => {
        if (searchErr) return reject(searchErr)
        if (uids.length === 0) return resolve([])

        const messages: InboxMessage[] = []
        const fetch = imap.fetch(uids, { bodies: 'HEADER.FIELDS (FROM DATE)', struct: false })
        fetch.on('message', (msg) => {
          let raw = ''
          let internalDate: Date | null = null
          msg.on('body', (stream) => {
            stream.on('data', (chunk: Buffer) => { raw += chunk.toString('utf8') })
          })
          msg.once('attributes', (attrs) => { internalDate = attrs.date })
          msg.once('end', () => {
            const headers = Imap.parseHeader(raw)
            const from = headers.from?.[0]?.match(EMAIL_RE)?.[0]?.toLowerCase()
            const headerDate = headers.date?.[0] ? new Date(headers.date[0]) : null
            const date = headerDate && !Number.isNaN(headerDate.getTime()) ? headerDate : internalDate
            if (from && date) messages.push({ from, date })
          })
        })
        fetch.once('error', reject)
        fetch.once('end', () => resolve(messages))
      })
    })
  })
}

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

interface CandidateRecipient {
  id: string
  campaign_id: string
  email: string
  sent_at: string | null
  account_id?: string | null
  mail_campaigns: { account_id: string | null } | null
}

async function markReplies(
  supabase: SupabaseClient,
  account: MailAccount,
  replies: Map<string, Date>,
): Promise<{ matched: number; perCampaign: Map<string, number> }> {
  const perCampaign = new Map<string, number>()
  let matched = 0
  const senders = [...replies.keys()]

  for (let i = 0; i < senders.length; i += 200) {
    const { data, error } = await supabase
      .from('mail_recipients')
      .select('*, mail_campaigns(account_id)')
      .in('email', senders.slice(i, i + 200))
      .in('status', ['sent', 'opened'])
      .is('replied_at', null)
    if (error) throw new Error(error.message)

    for (const r of (data ?? []) as CandidateRecipient[]) {
      // Only recipients mailed from this account, and only replies that came after the mail
      const sentFrom = r.account_id ?? r.mail_campaigns?.account_id
      const replyAt = replies.get(r.email)
      if (sentFrom !== account.id || !replyAt || !r.sent_at || replyAt < new Date(r.sent_at)) continue

      const { error: updateError } = await supabase
        .from('mail_recipients')
        .update({ status: 'replied', replied_at: replyAt.toISOString() })
        .eq('id', r.id)
        .is('replied_at', null)
      if (updateError) throw new Error(updateError.message)
      matched++
      perCampaign.set(r.campaign_id, (perCampaign.get(r.campaign_id) ?? 0) + 1)
    }
  }
  return { matched, perCampaign }
}

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: accountRows, error: accountError } = await supabase.from('mail_accounts').select('*').order('created_at')
  if (accountError) return NextResponse.json({ error: accountError.message }, { status: 500 })
  const accounts = ((accountRows ?? []) as MailAccount[]).filter((a) => isAccountActive(a.status))
  if (accounts.length === 0) return NextResponse.json({ error: 'Aktif mail hesabı yok' }, { status: 400 })

  // Look back to the oldest mail still waiting for a reply (capped)
  const { data: oldest } = await supabase
    .from('mail_recipients')
    .select('sent_at')
    .in('status', ['sent', 'opened'])
    .is('replied_at', null)
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  const floor = new Date(Date.now() - MAX_LOOKBACK_DAYS * 86_400_000)
  const since = oldest?.sent_at && new Date(oldest.sent_at) > floor ? new Date(oldest.sent_at) : floor

  const results: AccountResult[] = []
  const repliesPerCampaign = new Map<string, number>()

  for (const account of accounts) {
    let imap: Imap | null = null
    try {
      imap = await connect(account)
      const messages = await readInbox(imap, since)
      const { matched, perCampaign } = await markReplies(supabase, account, firstReplyBySender(messages))
      for (const [cid, n] of perCampaign) repliesPerCampaign.set(cid, (repliesPerCampaign.get(cid) ?? 0) + n)
      results.push({ account: account.email, scanned: messages.length, matched })
    } catch (e) {
      results.push({ account: account.email, scanned: 0, matched: 0, error: (e as Error).message })
    } finally {
      imap?.end()
    }
  }

  // Keep the campaign reply counters in step with the newly marked recipients
  for (const [cid, n] of repliesPerCampaign) {
    const { data: c } = await supabase.from('mail_campaigns').select('reply_count').eq('id', cid).maybeSingle()
    if (c) await supabase.from('mail_campaigns').update({ reply_count: (c.reply_count ?? 0) + n }).eq('id', cid)
  }

  const updated = results.reduce((s, r) => s + r.matched, 0)
  return NextResponse.json({ ok: true, updated, since: since.toISOString(), accounts: results })
}
