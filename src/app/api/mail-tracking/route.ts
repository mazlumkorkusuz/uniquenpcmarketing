import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

// Open-tracking pixel: GET /api/mail-tracking?r=<recipient_id>
// Public (called by recipients' mail clients). Always answers with a 1×1 transparent GIF.
// Updating recipients/campaigns needs SUPABASE_SERVICE_ROLE_KEY; with only the anon key
// just the tracking log row is written.

const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function pixelResponse() {
  return new Response(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(PIXEL.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
    },
  })
}

export async function GET(request: NextRequest) {
  const recipientId = request.nextUrl.searchParams.get('r')
  if (!recipientId || !UUID_RE.test(recipientId)) return pixelResponse()

  try {
    const { data: recipient } = await supabase
      .from('mail_recipients')
      .select('id, campaign_id, email, status, opened_at, open_count')
      .eq('id', recipientId)
      .maybeSingle()

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? request.headers.get('x-real-ip')
    await supabase.from('mail_tracking_logs').insert({
      campaign_id: recipient?.campaign_id ?? null,
      recipient_id: recipientId,
      email: recipient?.email ?? null,
      event: 'open',
      ip,
      user_agent: request.headers.get('user-agent'),
    })

    if (recipient) {
      const firstOpen = !recipient.opened_at
      await supabase
        .from('mail_recipients')
        .update({
          open_count: (recipient.open_count ?? 0) + 1,
          opened_at: recipient.opened_at ?? new Date().toISOString(),
          // Don't downgrade replied/bounced recipients
          ...(recipient.status === 'sent' ? { status: 'opened' } : {}),
        })
        .eq('id', recipientId)

      // Campaign open_count counts unique opens
      if (firstOpen) await supabase.rpc('increment_campaign_opens', { cid: recipient.campaign_id })
    }
  } catch {
    // Never fail the pixel
  }

  return pixelResponse()
}
