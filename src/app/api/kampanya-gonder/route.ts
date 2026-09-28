import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// Queues a campaign for sending by GitHub Actions (.github/workflows/send-campaign.yml):
// POST { campaign_id } → status 'ready_to_send' + repository_dispatch "send_campaign".
// Needs MAIL_SENDER_PAT: a GitHub token allowed to dispatch workflows on the repo.

const REPO = 'mazlumkorkusuz/uniquenpcmarketing'
// Campaigns that may be (re)queued; 'sending'/'completed' are left alone
const QUEUEABLE = ['draft', 'paused', 'ready_to_send']

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  let body: { campaign_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }
  if (!body.campaign_id) return NextResponse.json({ error: 'campaign_id gerekli' }, { status: 400 })

  const token = process.env.MAIL_SENDER_PAT
  if (!token) return NextResponse.json({ error: 'MAIL_SENDER_PAT tanımlı değil' }, { status: 500 })

  const { data: campaign, error } = await supabase
    .from('mail_campaigns')
    .update({ status: 'ready_to_send' })
    .eq('id', body.campaign_id)
    .in('status', QUEUEABLE)
    .select('id, status')
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!campaign) {
    return NextResponse.json({ error: 'Kampanya bulunamadı veya zaten gönderiliyor/tamamlandı' }, { status: 409 })
  }

  const res = await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'content-type': 'application/json',
      'x-github-api-version': '2022-11-28',
    },
    body: JSON.stringify({ event_type: 'send_campaign', client_payload: { campaign_id: campaign.id } }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    // The campaign stays 'ready_to_send', so the next successful trigger still picks it up
    return NextResponse.json({ error: `GitHub Actions tetiklenemedi (HTTP ${res.status}) ${detail.slice(0, 200)}` }, { status: 502 })
  }

  return NextResponse.json({ ok: true, campaign_id: campaign.id, status: 'ready_to_send' })
}
