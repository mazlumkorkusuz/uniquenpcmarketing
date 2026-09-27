import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

// Open tracking, called by recipients' mail clients (public, no auth):
//
//   GET /api/mail-tracking?type=pixel&r=<recipient_id>&c=<campaign_id>&e=<email>
//     → 1×1 transparent PNG (also the default when `type` is missing, e.g. older mails with just ?r=)
//   GET /api/mail-tracking?type=logo&logo=<logo_url>&r=…&c=…&e=…
//     → the account's logo, proxied so loading it counts as an open
//
// Both log an 'open' row to mail_tracking_logs. Since the logo and pixel load together, the
// recipient/campaign open counters only move once per open (see OPEN_DEDUP_MS).
// Updating recipients/campaigns needs SUPABASE_SERVICE_ROLE_KEY; with only the anon key
// just the tracking log row is written and logos can't be verified (the pixel is returned instead).

const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const OPEN_DEDUP_MS = 60_000
const MAX_LOGO_BYTES = 2 * 1024 * 1024
const LOGO_CACHE_MS = 60 * 60 * 1000

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
}

// Logos are the same few images for every mail — keep fetched bytes in memory
const logoCache = new Map<string, { body: Buffer; type: string; at: number }>()

interface TrackedRecipient {
  id: string
  campaign_id: string
  email: string
  status: string
  opened_at: string | null
  open_count: number | null
  account_id?: string | null
}

function pixelResponse() {
  return new Response(PIXEL, {
    headers: { 'Content-Type': 'image/png', 'Content-Length': String(PIXEL.length), ...NO_CACHE },
  })
}

function hostOf(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.toLowerCase()
  } catch {
    return null
  }
}

async function loadRecipient(recipientId: string): Promise<TrackedRecipient | null> {
  const { data } = await supabase.from('mail_recipients').select('*').eq('id', recipientId).maybeSingle<TrackedRecipient>()
  return data ?? null
}

// A logo may only be proxied from the sending account's own domain or its saved logo_url host,
// so this endpoint can't be used to fetch arbitrary URLs.
async function allowedLogoHosts(recipient: TrackedRecipient): Promise<Set<string>> {
  let accountId = recipient.account_id ?? null
  if (!accountId) {
    const { data: campaign } = await supabase.from('mail_campaigns').select('account_id').eq('id', recipient.campaign_id).maybeSingle()
    accountId = campaign?.account_id ?? null
  }
  if (!accountId) return new Set()
  const { data: account } = await supabase.from('mail_accounts').select('domain, logo_url').eq('id', accountId).maybeSingle()
  return new Set([hostOf(account?.domain), hostOf(account?.logo_url)].filter((h): h is string => !!h))
}

async function fetchLogo(url: string): Promise<{ body: Buffer; type: string } | null> {
  const cached = logoCache.get(url)
  if (cached && Date.now() - cached.at < LOGO_CACHE_MS) return cached

  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(5000) })
  const type = res.headers.get('content-type') ?? ''
  if (!res.ok || !type.startsWith('image/')) return null
  const body = Buffer.from(await res.arrayBuffer())
  if (body.length > MAX_LOGO_BYTES) return null
  logoCache.set(url, { body, type, at: Date.now() })
  return { body, type }
}

async function recordOpen(request: NextRequest, recipientId: string | null, recipient: TrackedRecipient | null) {
  const params = request.nextUrl.searchParams
  const campaignParam = params.get('c')
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? request.headers.get('x-real-ip')

  const { data: logged } = await supabase
    .from('mail_tracking_logs')
    .insert({
      // Prefer the stored values; the query params are only a fallback when the lookup isn't possible
      campaign_id: recipient?.campaign_id ?? (campaignParam && UUID_RE.test(campaignParam) ? campaignParam : null),
      recipient_id: recipientId,
      email: recipient?.email ?? params.get('e')?.slice(0, 320) ?? null,
      event: 'open',
      ip,
      user_agent: request.headers.get('user-agent'),
    })
    .select('id')
    .maybeSingle()

  if (!recipient || !logged) return

  // Logo + pixel from the same open arrive together (possibly in parallel). Only the request whose
  // log row is the earliest 'open' in the window bumps the counters, so each open counts once.
  const { data: first } = await supabase
    .from('mail_tracking_logs')
    .select('id')
    .eq('recipient_id', recipient.id)
    .eq('event', 'open')
    .gte('created_at', new Date(Date.now() - OPEN_DEDUP_MS).toISOString())
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (first?.id !== logged.id) return

  const firstOpen = !recipient.opened_at
  await supabase
    .from('mail_recipients')
    .update({
      open_count: (recipient.open_count ?? 0) + 1,
      opened_at: recipient.opened_at ?? new Date().toISOString(),
      // Don't downgrade replied/bounced recipients
      ...(recipient.status === 'sent' ? { status: 'opened' } : {}),
    })
    .eq('id', recipient.id)

  // Campaign open_count counts unique opens
  if (firstOpen) await supabase.rpc('increment_campaign_opens', { cid: recipient.campaign_id })
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const type = params.get('type') === 'logo' ? 'logo' : 'pixel'
  const rawId = params.get('r')
  const recipientId = rawId && UUID_RE.test(rawId) ? rawId : null

  let recipient: TrackedRecipient | null = null
  try {
    if (recipientId) recipient = await loadRecipient(recipientId)
    if (recipientId) await recordOpen(request, recipientId, recipient)
  } catch {
    // Tracking must never break the image
  }

  if (type === 'pixel') return pixelResponse()

  try {
    const logoUrl = params.get('logo')
    const host = hostOf(logoUrl)
    if (!logoUrl || !/^https:\/\//i.test(logoUrl) || !host || !recipient) return pixelResponse()
    if (!(await allowedLogoHosts(recipient)).has(host)) return pixelResponse()

    const logo = await fetchLogo(logoUrl)
    if (!logo) return pixelResponse()
    return new Response(new Uint8Array(logo.body), {
      headers: { 'Content-Type': logo.type, 'Content-Length': String(logo.body.length), ...NO_CACHE },
    })
  } catch {
    return pixelResponse()
  }
}
