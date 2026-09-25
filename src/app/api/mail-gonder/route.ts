import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { renderTemplate, type MailAccount, type MailCampaign, type MailRecipient, type MailTemplate } from '@/lib/mail'

// Sends mail through the account's SMTP server (Hostinger: smtp.hostinger.com, 465/SSL).
//
// POST { recipient_id }            → sends one campaign mail to that recipient
// POST { test: true, account_id, to } → sends a test mail from that account
//
// The new-campaign page calls this once per recipient and waits delay_seconds between calls.

interface SmtpError extends Error {
  code?: string
  command?: string
  responseCode?: number
}

function createTransport(account: MailAccount) {
  return nodemailer.createTransport({
    host: account.smtp_host,
    port: account.smtp_port,
    secure: account.smtp_port === 465,
    auth: { user: account.smtp_user, pass: account.smtp_pass },
  })
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function publicBaseUrl(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/$/, '')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')
  return host ? `${proto}://${host}` : request.nextUrl.origin
}

function startOfToday(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

async function countSentToday(supabase: SupabaseClient, accountId: string): Promise<number> {
  const { count } = await supabase
    .from('mail_recipients')
    .select('id, mail_campaigns!inner(account_id)', { count: 'exact', head: true })
    .eq('mail_campaigns.account_id', accountId)
    .gte('sent_at', startOfToday())
  return count ?? 0
}

// Marks the campaign completed once no pending recipients remain; returns the pending count
async function finishIfDone(supabase: SupabaseClient, campaignId: string): Promise<number> {
  const { count } = await supabase
    .from('mail_recipients')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')
  const pending = count ?? 0
  if (pending === 0) {
    await supabase
      .from('mail_campaigns')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', campaignId)
  }
  return pending
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  let body: { recipient_id?: string; test?: boolean; account_id?: string; to?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }

  // ── Test mail ────────────────────────────────────────────────────────────
  if (body.test) {
    if (!body.account_id || !body.to) {
      return NextResponse.json({ error: 'account_id ve to gerekli' }, { status: 400 })
    }
    const { data: account } = await supabase.from('mail_accounts').select('*').eq('id', body.account_id).single<MailAccount>()
    if (!account) return NextResponse.json({ error: 'Hesap bulunamadı' }, { status: 404 })

    try {
      await createTransport(account).sendMail({
        from: `"${account.name}" <${account.email}>`,
        to: body.to,
        subject: 'Mail Servisi test maili',
        text: `Bu bir test mailidir. ${account.email} hesabının SMTP ayarları çalışıyor.`,
      })
      return NextResponse.json({ ok: true })
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 502 })
    }
  }

  // ── Campaign mail ────────────────────────────────────────────────────────
  if (!body.recipient_id) {
    return NextResponse.json({ error: 'recipient_id gerekli' }, { status: 400 })
  }

  const { data: recipient } = await supabase
    .from('mail_recipients')
    .select('*')
    .eq('id', body.recipient_id)
    .single<MailRecipient>()
  if (!recipient) return NextResponse.json({ error: 'Alıcı bulunamadı' }, { status: 404 })
  if (recipient.status !== 'pending') {
    return NextResponse.json({ ok: true, skipped: true, status: recipient.status })
  }

  const { data: campaign } = await supabase
    .from('mail_campaigns')
    .select('*')
    .eq('id', recipient.campaign_id)
    .single<MailCampaign>()
  if (!campaign?.template_id || !campaign.account_id) {
    return NextResponse.json({ error: 'Kampanyanın şablonu veya hesabı yok' }, { status: 400 })
  }

  const [{ data: template }, { data: account }] = await Promise.all([
    supabase.from('mail_templates').select('*').eq('id', campaign.template_id).single<MailTemplate>(),
    supabase.from('mail_accounts').select('*').eq('id', campaign.account_id).single<MailAccount>(),
  ])
  if (!template) return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 })
  if (!account) return NextResponse.json({ error: 'Hesap bulunamadı' }, { status: 404 })
  if (account.status !== 'active') {
    return NextResponse.json({ error: `${account.email} hesabı aktif değil` }, { status: 409 })
  }

  const sentToday = await countSentToday(supabase, account.id)
  if (sentToday >= account.daily_limit) {
    return NextResponse.json(
      { error: `Günlük limit doldu (${sentToday}/${account.daily_limit})`, limitReached: true },
      { status: 429 },
    )
  }

  if (!campaign.started_at || campaign.status !== 'sending') {
    await supabase
      .from('mail_campaigns')
      .update({ status: 'sending', started_at: campaign.started_at ?? new Date().toISOString() })
      .eq('id', campaign.id)
  }

  const vars = {
    name: recipient.name || recipient.email.split('@')[0],
    email: recipient.email,
    platform: recipient.platform,
    followers: recipient.followers?.toLocaleString('en-US'),
    language: recipient.language,
    sender_name: account.name,
    sender_email: account.email,
    domain: account.domain,
    logo_url: account.logo_url,
    banner_url: account.banner_url,
  }
  const subject = renderTemplate(template.subject, vars, true)
  const pixel = `<img src="${publicBaseUrl(request)}/api/mail-tracking?r=${recipient.id}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0" />`
  const bodyHtml = renderTemplate(template.html_content, vars)
  const html = /<\/body>/i.test(bodyHtml) ? bodyHtml.replace(/<\/body>/i, `${pixel}</body>`) : bodyHtml + pixel

  try {
    await createTransport(account).sendMail({
      from: `"${account.name}" <${account.email}>`,
      to: recipient.name ? `"${recipient.name.replace(/"/g, '')}" <${recipient.email}>` : recipient.email,
      subject,
      html,
      text: htmlToText(bodyHtml),
    })
  } catch (e) {
    const err = e as SmtpError
    // Rejected at RCPT TO → the address itself is bad (bounce). Anything else (auth, network)
    // is an account problem, so the recipient stays pending and can be retried.
    const isBounce = err.command === 'RCPT TO' || err.code === 'EENVELOPE'
    if (isBounce) {
      const hard = (err.responseCode ?? 550) >= 500
      await supabase
        .from('mail_recipients')
        .update({ status: 'bounced', bounced_at: new Date().toISOString(), bounce_type: hard ? 'hard' : 'soft' })
        .eq('id', recipient.id)
      await supabase
        .from('mail_campaigns')
        .update({ bounce_count: campaign.bounce_count + 1 })
        .eq('id', campaign.id)
      const pending = await finishIfDone(supabase, campaign.id)
      return NextResponse.json({ ok: false, bounced: true, error: err.message, pending })
    }
    return NextResponse.json({ error: err.message }, { status: 502 })
  }

  await supabase
    .from('mail_recipients')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', recipient.id)
  await supabase.rpc('increment_campaign_sent', { cid: campaign.id })
  await supabase.from('mail_accounts').update({ sent_today: sentToday + 1 }).eq('id', account.id)

  const pending = await finishIfDone(supabase, campaign.id)
  return NextResponse.json({ ok: true, pending })
}
