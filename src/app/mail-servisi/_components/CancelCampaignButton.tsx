'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, Loader2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { CANCELLABLE_CAMPAIGN_STATUSES } from '@/lib/mail'
import { buttonStyle } from './ui'

// Sets a queued or sending campaign to 'iptal'. The GitHub Actions sender checks the status before
// every mail, so a running send stops at the next recipient.
export default function CancelCampaignButton({ campaignId, campaignName, status }: {
  campaignId: string
  campaignName: string
  status: string
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!CANCELLABLE_CAMPAIGN_STATUSES.includes(status)) return null

  const cancel = async () => {
    if (!confirm(`"${campaignName}" kampanyası iptal edilsin mi? Henüz gönderilmemiş mailler gönderilmeyecek.`)) return
    setBusy(true)
    setError(null)
    const { error: err } = await supabase
      .from('mail_campaigns')
      .update({ status: 'iptal' })
      .eq('id', campaignId)
      .in('status', CANCELLABLE_CAMPAIGN_STATUSES)
    setBusy(false)
    if (err) setError(err.message)
    else router.refresh()
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
      <button
        style={{ ...buttonStyle('danger', busy), padding: '6px 10px', fontSize: '12px' }}
        disabled={busy}
        onClick={cancel}
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />} İptal Et
      </button>
      {error && <span role="alert" style={{ fontSize: '11px', color: 'var(--danger)' }}>{error}</span>}
    </span>
  )
}
