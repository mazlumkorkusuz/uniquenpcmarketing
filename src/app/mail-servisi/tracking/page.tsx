'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Activity, Reply } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { Toast } from '@/components/Toast'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { percent, type MailCampaign, type MailRecipient } from '@/lib/mail'
import { Card, RecipientStatusBadge, MAIL_GRADIENT, buttonStyle, inputStyle, formatDateTime, thStyle, tdStyle } from '../_components/ui'

type Filter = 'all' | 'opened' | 'unopened' | 'replied' | 'bounced'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'opened', label: 'Açanlar' },
  { key: 'unopened', label: 'Açmayanlar' },
  { key: 'replied', label: 'Yanıtlayanlar' },
  { key: 'bounced', label: 'Bounce' },
]

const ROW_LIMIT = 1000

function Tracking() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const initialCampaign = useSearchParams().get('campaign') ?? ''

  const [campaigns, setCampaigns] = useState<MailCampaign[]>([])
  const [campaignId, setCampaignId] = useState(initialCampaign)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<MailRecipient[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    supabase.from('mail_campaigns').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setCampaigns((data ?? []) as MailCampaign[])
    })
  }, [supabase])

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('mail_recipients').select('*').neq('status', 'pending')
    if (campaignId) q = q.eq('campaign_id', campaignId)
    if (filter === 'opened') q = q.not('opened_at', 'is', null)
    if (filter === 'unopened') q = q.is('opened_at', null).in('status', ['sent'])
    if (filter === 'replied') q = q.not('replied_at', 'is', null)
    if (filter === 'bounced') q = q.eq('status', 'bounced')
    // Strip characters that have meaning in PostgREST filter syntax
    const term = search.trim().replace(/[,()%*\\]/g, '')
    if (term) q = q.or(`email.ilike.%${term}%,name.ilike.%${term}%`)
    const { data } = await q.order('sent_at', { ascending: false, nullsFirst: false }).limit(ROW_LIMIT)
    setRows((data ?? []) as MailRecipient[])
    setLoading(false)
  }, [supabase, campaignId, filter, search])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const campaignName = useMemo(() => Object.fromEntries(campaigns.map((c) => [c.id, c.name])), [campaigns])

  const totals = useMemo(() => {
    const list = campaignId ? campaigns.filter((c) => c.id === campaignId) : campaigns
    return list.reduce(
      (t, c) => ({ sent: t.sent + c.sent_count, opens: t.opens + c.open_count, replies: t.replies + c.reply_count, bounces: t.bounces + c.bounce_count }),
      { sent: 0, opens: 0, replies: 0, bounces: 0 },
    )
  }, [campaigns, campaignId])

  // Replies aren't detected automatically (no inbox access) — mark them by hand
  const markReplied = async (r: MailRecipient) => {
    const { error } = await supabase
      .from('mail_recipients')
      .update({ status: 'replied', replied_at: new Date().toISOString() })
      .eq('id', r.id)
    if (error) {
      setToast({ message: error.message, type: 'error' })
      return
    }
    const campaign = campaigns.find((c) => c.id === r.campaign_id)
    if (campaign) {
      await supabase.from('mail_campaigns').update({ reply_count: campaign.reply_count + 1 }).eq('id', campaign.id)
      setCampaigns((cs) => cs.map((c) => (c.id === campaign.id ? { ...c, reply_count: c.reply_count + 1 } : c)))
    }
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, status: 'replied', replied_at: new Date().toISOString() } : x)))
    setToast({ message: `${r.email} yanıtladı olarak işaretlendi`, type: 'success' })
  }

  const stat = (label: string, value: number, rate: string, color: string) => (
    <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', padding: '16px 20px' }}>
      <div style={{ fontSize: '12px', color: '#655F7D', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 700, color }}>{value.toLocaleString('tr-TR')}</div>
      <div style={{ fontSize: '12px', color: '#4A4462' }}>{rate}</div>
    </div>
  )

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <PageHeader title="Tracking" subtitle="Açılma, yanıt ve bounce takibi" icon={Activity} gradient={MAIL_GRADIENT} />

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          {stat('Gönderilen', totals.sent, campaignId ? campaignName[campaignId] ?? '' : 'Tüm kampanyalar', '#1D4ED8')}
          {stat('Açan', totals.opens, percent(totals.opens, totals.sent) + ' açılma', '#0F766E')}
          {stat('Yanıtlayan', totals.replies, percent(totals.replies, totals.sent) + ' yanıt', '#047857')}
          {stat('Bounce', totals.bounces, percent(totals.bounces, totals.sent + totals.bounces) + ' bounce', '#B91C1C')}
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select style={{ ...inputStyle, width: '260px' }} value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
            <option value="">Tüm kampanyalar</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input style={{ ...inputStyle, width: '240px' }} placeholder="Email veya isim ara…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div style={{ display: 'flex', gap: '4px' }}>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{ ...buttonStyle(filter === f.key ? 'primary' : 'secondary'), padding: '7px 12px', fontSize: '12px' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <Card padded={false}>
          {loading ? (
            <p style={{ padding: '20px', margin: 0, fontSize: '13px', color: '#655F7D' }}>Yükleniyor…</p>
          ) : rows.length === 0 ? (
            <p style={{ padding: '20px', margin: 0, fontSize: '13px', color: '#655F7D' }}>Kayıt yok.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Alıcı</th>
                    {!campaignId && <th style={thStyle}>Kampanya</th>}
                    <th style={thStyle}>Durum</th>
                    <th style={thStyle}>Gönderim</th>
                    <th style={thStyle}>İlk Açılma</th>
                    <th style={thStyle}>Açılma</th>
                    <th style={thStyle}>Yanıt / Bounce</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: '#17122B' }}>{r.name ?? '—'}</div>
                        <div style={{ fontSize: '12px', color: '#655F7D' }}>{r.email}{r.platform ? ` · ${r.platform}` : ''}</div>
                      </td>
                      {!campaignId && <td style={{ ...tdStyle, fontSize: '12px' }}>{campaignName[r.campaign_id] ?? '—'}</td>}
                      <td style={tdStyle}><RecipientStatusBadge status={r.status} /></td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: '#4A4462' }}>{formatDateTime(r.sent_at)}</td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: '#4A4462' }}>{formatDateTime(r.opened_at)}</td>
                      <td style={tdStyle}>{r.open_count > 0 ? `${r.open_count}×` : '—'}</td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: '#4A4462' }}>
                        {r.replied_at
                          ? formatDateTime(r.replied_at)
                          : r.bounced_at
                            ? <span style={{ color: '#B91C1C' }}>{formatDateTime(r.bounced_at)} ({r.bounce_type})</span>
                            : '—'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        {!r.replied_at && r.status !== 'bounced' && r.status !== 'failed' && (
                          <button style={{ ...buttonStyle('secondary'), padding: '5px 10px', fontSize: '12px' }} onClick={() => markReplied(r)}>
                            <Reply size={12} /> Yanıtladı
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === ROW_LIMIT && (
                <p style={{ fontSize: '12px', color: '#655F7D', margin: 0, padding: '10px 16px' }}>İlk {ROW_LIMIT} kayıt gösteriliyor — daraltmak için kampanya seçin veya arayın.</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function TrackingPage() {
  return (
    <Suspense>
      <Tracking />
    </Suspense>
  )
}
