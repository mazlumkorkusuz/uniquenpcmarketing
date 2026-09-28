'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { buttonStyle } from './ui'

// Permanently deletes a campaign and its recipients/logs. Only shown for completed/cancelled campaigns.
const DELETABLE_STATUSES = ['completed', 'iptal', 'draft']

export default function DeleteCampaignButton({ campaignId, campaignName, status }: {
  campaignId: string
  campaignName: string
  status: string
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!DELETABLE_STATUSES.includes(status)) return null

  const del = async () => {
    if (!confirm(`"${campaignName}" kampanyası kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`)) return
    setBusy(true)
    setError(null)
    // Recipients cascade-delete via FK, but reply logs and tracking logs need explicit delete
    await supabase.from('mail_reply_logs').delete().eq('campaign_id', campaignId)
    await supabase.from('mail_tracking_logs').delete().eq('campaign_id', campaignId)
    await supabase.from('mail_recipients').delete().eq('campaign_id', campaignId)
    const { error: err } = await supabase.from('mail_campaigns').delete().eq('id', campaignId)
    setBusy(false)
    if (err) setError(err.message)
    else router.refresh()
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
      <button
        style={{ ...buttonStyle('danger', busy), padding: '6px 10px', fontSize: '12px' }}
        disabled={busy}
        onClick={del}
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Sil
      </button>
      {error && <span role="alert" style={{ fontSize: '11px', color: 'var(--danger)' }}>{error}</span>}
    </span>
  )
}
