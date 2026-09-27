'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Activity, Reply, RefreshCw } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { Toast } from '@/components/Toast'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { percent, type MailCampaign, type MailRecipient } from '@/lib/mail'
import RecipientDrawer from '../_components/RecipientDrawer'
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

// "az önce" / "12 dakika önce" / "3 saat önce" / "2 gün önce"
function timeAgo(iso: string, now: number): string {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return 'az önce'
  if (minutes < 60) return `${minutes} dakika önce`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} saat önce`
  return `${Math.floor(hours / 24)} gün önce`
}

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
  const [selected, setSelected] = useState<MailRecipient | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const fetchCampaigns = useCallback(async () => {
    const { data } = await supabase.from('mail_campaigns').select('*').order('created_at', { ascending: false })
    return (data ?? []) as MailCampaign[]
  }, [supabase])

  const loadCampaigns = () => fetchCampaigns().then(setCampaigns)

  useEffect(() => {
    fetchCampaigns().then(setCampaigns)
  }, [fetchCampaigns])

  // Latest inbox sync (button or the 15-minute cron); re-render the "X dakika önce" text every 30s
  const fetchLastSync = useCallback(async () => {
    const { data } = await supabase.from('mail_sync_runs').select('ran_at').order('ran_at', { ascending: false }).limit(1).maybeSingle()
    return data?.ran_at ?? null
  }, [supabase])

  useEffect(() => {
    fetchLastSync().then(setLastSync)
    const t = setInterval(() => {
      setNow(Date.now())
      fetchLastSync().then(setLastSync)
    }, 30_000)
    return () => clearInterval(t)
  }, [fetchLastSync])

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

  const closeDrawer = useCallback(() => setSelected(null), [])

  // Reads the accounts' inboxes over IMAP and marks recipients who wrote back
  const syncReplies = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/mail-imap-sync', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? `Senkronizasyon başarısız (${res.status})`)
      const failed = (data.accounts as { account: string; error?: string }[]).filter((a) => a.error)
      setLastSync(data.ran_at)
      setNow(Date.now())
      await Promise.all([load(), loadCampaigns()])
      const found = data.replies || data.bounces ? `${data.replies} yeni cevap, ${data.bounces} bounce` : 'Yeni cevap veya bounce yok'
      if (failed.length) {
        setToast({ message: `${found}. Bağlanılamayan hesap: ${failed.map((a) => `${a.account} (${a.error})`).join(', ')}`, type: 'error' })
      } else {
        setToast({ message: found, type: 'success' })
      }
    } catch (e) {
      setToast({ message: (e as Error).message, type: 'error' })
    } finally {
      setSyncing(false)
    }
  }

  // Manual override for replies the IMAP sync can't match (e.g. answered from a different address)
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
      <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 700, color }}>{value.toLocaleString('tr-TR')}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>{rate}</div>
    </div>
  )

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      {selected && (
        <RecipientDrawer recipient={selected} campaignName={campaignName[selected.campaign_id] ?? null} onClose={closeDrawer} />
      )}
      <PageHeader title="Tracking" subtitle="Açılma, yanıt ve bounce takibi" icon={Activity} gradient={MAIL_GRADIENT} />

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          {stat('Gönderilen', totals.sent, campaignId ? campaignName[campaignId] ?? '' : 'Tüm kampanyalar', 'var(--info)')}
          {stat('Açan', totals.opens, percent(totals.opens, totals.sent) + ' açılma', 'var(--teal)')}
          {stat('Yanıtlayan', totals.replies, percent(totals.replies, totals.sent) + ' yanıt', 'var(--success)')}
          {stat('Bounce', totals.bounces, percent(totals.bounces, totals.sent + totals.bounces) + ' bounce', 'var(--danger)')}
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select style={{ ...inputStyle, width: '260px' }} value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
            <option value="">Tüm kampanyalar</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input style={{ ...inputStyle, width: '240px' }} placeholder="Email veya isim ara…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }} title={lastSync ? new Date(lastSync).toLocaleString('tr-TR') : undefined}>
              Son senkronizasyon: {lastSync ? timeAgo(lastSync, now) : 'henüz yok'}
            </span>
            <button style={buttonStyle('primary', syncing)} disabled={syncing} onClick={syncReplies}>
              <RefreshCw size={14} className={syncing ? 'animate-spin' : undefined} /> {syncing ? 'Senkronize ediliyor…' : 'Şimdi Senkronize Et'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '4px', order: -1 }}>
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
            <p style={{ padding: '20px', margin: 0, fontSize: '13px', color: 'var(--muted-foreground)' }}>Yükleniyor…</p>
          ) : rows.length === 0 ? (
            <p style={{ padding: '20px', margin: 0, fontSize: '13px', color: 'var(--muted-foreground)' }}>Kayıt yok.</p>
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
                    <tr
                      key={r.id}
                      className="tracking-row"
                      tabIndex={0}
                      aria-label={`${r.name ?? r.email} detaylarını aç`}
                      onClick={() => setSelected(r)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(r) } }}
                      style={{ cursor: 'pointer', backgroundColor: selected?.id === r.id ? 'var(--muted)' : undefined }}
                    >
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{r.name ?? '—'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{r.email}{r.platform ? ` · ${r.platform}` : ''}</div>
                      </td>
                      {!campaignId && <td style={{ ...tdStyle, fontSize: '12px' }}>{campaignName[r.campaign_id] ?? '—'}</td>}
                      <td style={tdStyle}><RecipientStatusBadge status={r.status} /></td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--text-2)' }}>{formatDateTime(r.sent_at)}</td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--text-2)' }}>{formatDateTime(r.opened_at)}</td>
                      <td style={tdStyle}>{r.open_count > 0 ? `${r.open_count}×` : '—'}</td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--text-2)' }}>
                        {r.replied_at
                          ? formatDateTime(r.replied_at)
                          : r.bounced_at
                            ? <span style={{ color: 'var(--danger)' }}>{formatDateTime(r.bounced_at)} ({r.bounce_type})</span>
                            : '—'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        {!r.replied_at && r.status !== 'bounced' && r.status !== 'failed' && (
                          <button style={{ ...buttonStyle('secondary'), padding: '5px 10px', fontSize: '12px' }} onClick={(e) => { e.stopPropagation(); markReplied(r) }}>
                            <Reply size={12} /> Yanıtladı
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === ROW_LIMIT && (
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0, padding: '10px 16px' }}>İlk {ROW_LIMIT} kayıt gösteriliyor — daraltmak için kampanya seçin veya arayın.</p>
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
