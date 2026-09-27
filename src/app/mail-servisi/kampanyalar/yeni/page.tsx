'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Send, Upload, Square, Play, Loader2 } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { Toast } from '@/components/Toast'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { MAIL_ACCOUNT_PUBLIC_COLUMNS, renderTemplate, type MailAccount, type MailCampaign, type MailTemplate } from '@/lib/mail'
import { Card, Field, ProgressBar, MAIL_GRADIENT, buttonStyle, inputStyle, thStyle, tdStyle } from '../../_components/ui'

interface Recipient {
  email: string
  name: string | null
  platform: string | null
  followers: number | null
  language: string | null
}

interface PlatformStreamer extends Recipient {
  key: string
}

interface LogLine {
  email: string
  ok: boolean
  message: string
}

type RecipientTab = 'platform' | 'csv'

interface PlatformDef {
  key: string
  label: string
  table: string
  icon: string
  nameColumns: string[]
  followersColumn: string
}

const PLATFORMS: PlatformDef[] = [
  { key: 'twitch',   label: 'Twitch',   table: 'twitch_streamers',   icon: '/icons/twitch.png',   nameColumns: ['display_name', 'username'], followersColumn: 'followers' },
  { key: 'kick',     label: 'Kick',     table: 'kick_streamers',     icon: '/icons/kick.png',     nameColumns: ['channel_name', 'username'], followersColumn: 'followers' },
  { key: 'soop',     label: 'SOOP',     table: 'soop_streamers',     icon: '/icons/soop.jpeg',    nameColumns: ['channel_name', 'username'], followersColumn: 'followers' },
  { key: 'youtube',  label: 'YouTube',  table: 'youtube_channels',   icon: '/icons/youtube.png',  nameColumns: ['channel_name'],             followersColumn: 'subscribers' },
  { key: 'chzzk',    label: 'Chzzk',    table: 'chzzk_streamers',    icon: '/icons/chzzk.png',    nameColumns: ['channel_name', 'username'], followersColumn: 'followers' },
  { key: 'bilibili', label: 'BiliBili', table: 'bilibili_streamers', icon: '/icons/bilibili.png', nameColumns: ['channel_name', 'username'], followersColumn: 'followers' },
  { key: 'douyin',   label: 'Douyin',   table: 'douyin_streamers',   icon: '/icons/douyin.png',   nameColumns: ['channel_name', 'username'], followersColumn: 'followers' },
]

// Streamer tables store the contact address in the `email` column
const EMAIL_COLUMN = 'email'
const PAGE_SIZE = 1000

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const HEADER_ALIASES: Record<keyof Recipient, string[]> = {
  email: ['email', 'e-mail', 'mail', 'eposta', 'e-posta', 'contact_email'],
  name: ['name', 'isim', 'ad', 'username', 'display_name', 'channel', 'channel_name', 'kanal'],
  platform: ['platform'],
  followers: ['followers', 'takipçi', 'takipci', 'subscribers', 'abone'],
  language: ['language', 'dil', 'lang'],
}

// Minimal CSV parser: handles quoted fields, escaped quotes and ; or , delimiters
function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ','
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === delim) { row.push(field); field = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some((f) => f.trim())) rows.push(row)
      row = []
    } else field += ch
  }
  row.push(field)
  if (row.some((f) => f.trim())) rows.push(row)
  return rows
}

function parseFollowers(v: string | undefined): number | null {
  if (!v) return null
  const m = v.trim().toLowerCase().replace(/,/g, '.').match(/^([\d.]+)\s*([km])?$/)
  if (!m) {
    const digits = v.replace(/\D/g, '')
    return digits ? Number(digits) : null
  }
  const n = parseFloat(m[1])
  return Math.round(m[2] === 'm' ? n * 1_000_000 : m[2] === 'k' ? n * 1_000 : n)
}

function toRecipients(rows: string[][]): { valid: Recipient[]; invalid: number; duplicates: number } {
  if (rows.length < 2) return { valid: [], invalid: 0, duplicates: 0 }
  const header = rows[0].map((h) => h.trim().toLowerCase())
  const col = (key: keyof Recipient) => header.findIndex((h) => HEADER_ALIASES[key].includes(h))
  const idx = { email: col('email'), name: col('name'), platform: col('platform'), followers: col('followers'), language: col('language') }
  if (idx.email === -1) throw new Error('CSV\'de "email" sütunu bulunamadı')

  const seen = new Set<string>()
  const valid: Recipient[] = []
  let invalid = 0
  let duplicates = 0
  for (const r of rows.slice(1)) {
    const email = (r[idx.email] ?? '').trim().toLowerCase()
    if (!EMAIL_RE.test(email)) { invalid++; continue }
    if (seen.has(email)) { duplicates++; continue }
    seen.add(email)
    const get = (i: number) => (i === -1 ? null : r[i]?.trim() || null)
    valid.push({
      email,
      name: get(idx.name),
      platform: get(idx.platform),
      followers: idx.followers === -1 ? null : parseFollowers(r[idx.followers]),
      language: get(idx.language),
    })
  }
  return { valid, invalid, duplicates }
}

// A DB email cell may hold several addresses ("a@x.com, b@y.com") — take the first valid one
function firstValidEmail(v: unknown): string | null {
  if (typeof v !== 'string') return null
  return v.split(/[\s,;/]+/).map((s) => s.trim().toLowerCase()).find((s) => EMAIL_RE.test(s)) ?? null
}

function YeniKampanya() {
  const router = useRouter()
  const resumeId = useSearchParams().get('resume')
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [accounts, setAccounts] = useState<MailAccount[]>([])
  const [templates, setTemplates] = useState<MailTemplate[]>([])
  const [name, setName] = useState('')
  const [accountId, setAccountId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [delay, setDelay] = useState(30)

  const [recipientTab, setRecipientTab] = useState<RecipientTab>('platform')

  // Platform tab
  const [platformKey, setPlatformKey] = useState<string | null>(null)
  const [streamerCache, setStreamerCache] = useState<Record<string, PlatformStreamer[]>>({})
  const [loadingPlatform, setLoadingPlatform] = useState(false)
  const [platformError, setPlatformError] = useState<string | null>(null)
  // Selected streamers across all platforms, keyed by PlatformStreamer.key
  const [selected, setSelected] = useState<Map<string, PlatformStreamer>>(new Map())

  // CSV tab
  const [fileName, setFileName] = useState('')
  const [csvRecipients, setCsvRecipients] = useState<Recipient[]>([])
  const [csvStats, setCsvStats] = useState<{ invalid: number; duplicates: number } | null>(null)

  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [countdown, setCountdown] = useState(0)
  const [log, setLog] = useState<LogLine[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const stopRef = useRef(false)

  useEffect(() => {
    Promise.all([
      supabase.from('mail_accounts').select(MAIL_ACCOUNT_PUBLIC_COLUMNS).eq('status', 'active').order('created_at'),
      supabase.from('mail_templates').select('*').order('created_at', { ascending: false }),
    ]).then(([a, t]) => {
      setAccounts((a.data ?? []) as unknown as MailAccount[])
      setTemplates((t.data ?? []) as MailTemplate[])
    })
  }, [supabase])

  // Resuming an unfinished campaign: load its settings and pending count
  useEffect(() => {
    if (!resumeId) return
    ;(async () => {
      const { data: c } = await supabase.from('mail_campaigns').select('*').eq('id', resumeId).single<MailCampaign>()
      if (!c) return
      setCampaignId(c.id)
      setName(c.name)
      setAccountId(c.account_id ?? '')
      setTemplateId(c.template_id ?? '')
      setDelay(c.delay_seconds)
      setProgress({ done: c.sent_count + c.bounce_count, total: c.total_recipients })
    })()
  }, [resumeId, supabase])

  // Warn before closing the tab mid-send
  useEffect(() => {
    if (!sending) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [sending])

  const loadPlatform = useCallback(async (p: PlatformDef) => {
    setPlatformKey(p.key)
    setPlatformError(null)
    if (streamerCache[p.key]) return
    setLoadingPlatform(true)
    try {
      const rows: Record<string, unknown>[] = []
      for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await supabase
          .from(p.table)
          .select('*')
          .not(EMAIL_COLUMN, 'is', null)
          .neq(EMAIL_COLUMN, '')
          .order(p.followersColumn, { ascending: false, nullsFirst: false })
          .range(from, from + PAGE_SIZE - 1)
        if (error) throw new Error(error.message)
        rows.push(...(data ?? []))
        if (!data || data.length < PAGE_SIZE) break
      }

      const seen = new Set<string>()
      const streamers: PlatformStreamer[] = []
      for (const row of rows) {
        const email = firstValidEmail(row[EMAIL_COLUMN])
        if (!email || seen.has(email)) continue
        seen.add(email)
        const displayName = p.nameColumns.map((c) => row[c]).find((v) => typeof v === 'string' && v.trim())
        const followers = Number(row[p.followersColumn])
        streamers.push({
          key: `${p.key}:${String(row.id)}`,
          email,
          name: (displayName as string | undefined)?.trim() ?? null,
          platform: p.label,
          followers: Number.isFinite(followers) ? followers : null,
          language: typeof row.language === 'string' ? row.language : null,
        })
      }
      setStreamerCache((c) => ({ ...c, [p.key]: streamers }))
    } catch (e) {
      setPlatformError(`${p.label} yayıncıları yüklenemedi: ${(e as Error).message}`)
    } finally {
      setLoadingPlatform(false)
    }
  }, [supabase, streamerCache])

  const currentStreamers = platformKey ? streamerCache[platformKey] ?? [] : []

  const toggleStreamer = (s: PlatformStreamer) => {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(s.key)) next.delete(s.key)
      else next.set(s.key, s)
      return next
    })
  }

  const selectAll = () => {
    setSelected((prev) => {
      const next = new Map(prev)
      for (const s of currentStreamers) next.set(s.key, s)
      return next
    })
  }

  const deselectAll = () => {
    setSelected((prev) => {
      const next = new Map(prev)
      for (const s of currentStreamers) next.delete(s.key)
      return next
    })
  }

  const selectedInCurrent = currentStreamers.filter((s) => selected.has(s.key)).length

  // Final recipient list: platform selections + CSV rows, deduplicated by email
  const recipients = useMemo<Recipient[]>(() => {
    const seen = new Set<string>()
    const out: Recipient[] = []
    for (const r of [...selected.values(), ...csvRecipients]) {
      if (seen.has(r.email)) continue
      seen.add(r.email)
      out.push({ email: r.email, name: r.name, platform: r.platform, followers: r.followers, language: r.language })
    }
    return out
  }, [selected, csvRecipients])

  const selectedTemplate = templates.find((t) => t.id === templateId)
  const selectedAccount = accounts.find((a) => a.id === accountId)

  const previewHtml = useMemo(() => {
    if (!selectedTemplate) return ''
    const r = recipients[0]
    return renderTemplate(selectedTemplate.html_content, {
      name: r?.name ?? 'Yayıncı Adı',
      email: r?.email ?? 'ornek@mail.com',
      platform: r?.platform ?? 'Twitch',
      followers: (r?.followers ?? 25000).toLocaleString('en-US'),
      language: r?.language,
      sender_name: selectedAccount?.name,
      sender_email: selectedAccount?.email,
      domain: selectedAccount?.domain,
      logo_url: selectedAccount?.logo_url,
      banner_url: selectedAccount?.banner_url,
    })
  }, [selectedTemplate, selectedAccount, recipients])

  const handleFile = async (file: File) => {
    setFileName(file.name)
    try {
      const { valid, invalid, duplicates } = toRecipients(parseCsv(await file.text()))
      setCsvRecipients(valid)
      setCsvStats({ invalid, duplicates })
      if (!name) setName(file.name.replace(/\.csv$/i, ''))
    } catch (e) {
      setCsvRecipients([])
      setCsvStats(null)
      setToast({ message: (e as Error).message, type: 'error' })
    }
  }

  const sleepWithCountdown = async (seconds: number) => {
    for (let s = seconds; s > 0; s--) {
      if (stopRef.current) break
      setCountdown(s)
      await new Promise((r) => setTimeout(r, 1000))
    }
    setCountdown(0)
  }

  const runSending = useCallback(async (cid: string, delaySeconds: number) => {
    stopRef.current = false
    setSending(true)

    const { data: pending } = await supabase
      .from('mail_recipients')
      .select('id, email')
      .eq('campaign_id', cid)
      .eq('status', 'pending')
      .order('created_at')
    const queue = pending ?? []

    let stoppedReason: string | null = null
    for (let i = 0; i < queue.length; i++) {
      if (stopRef.current) { stoppedReason = 'Gönderim durduruldu'; break }
      const r = queue[i]
      const res = await fetch('/api/mail-gonder', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ recipient_id: r.id }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok && data.ok) {
        setLog((l) => [{ email: r.email, ok: true, message: 'Gönderildi' }, ...l])
        setProgress((p) => ({ ...p, done: p.done + 1 }))
      } else if (data.bounced) {
        setLog((l) => [{ email: r.email, ok: false, message: `Bounce: ${data.error}` }, ...l])
        setProgress((p) => ({ ...p, done: p.done + 1 }))
      } else if (data.skipped) {
        continue
      } else {
        // Limit reached or account/SMTP problem — stop and let the user resume later
        stoppedReason = data.error ?? `Hata (${res.status})`
        setLog((l) => [{ email: r.email, ok: false, message: stoppedReason! }, ...l])
        break
      }

      if (i < queue.length - 1) await sleepWithCountdown(delaySeconds)
    }

    if (stoppedReason) {
      await supabase.from('mail_campaigns').update({ status: 'paused' }).eq('id', cid)
      setToast({ message: `${stoppedReason}. Kampanyalar sayfasından devam edebilirsiniz.`, type: 'error' })
    } else {
      setToast({ message: 'Kampanya tamamlandı', type: 'success' })
    }
    setSending(false)
    router.refresh()
  }, [supabase, router])

  const createAndSend = async () => {
    if (!name.trim() || !accountId || !templateId || recipients.length === 0) {
      setToast({ message: 'Kampanya adı, hesap, şablon ve en az bir alıcı gerekli', type: 'error' })
      return
    }
    if (!confirm(`${recipients.length} kişiye ${delay} sn aralıkla mail gönderilecek. Devam edilsin mi?`)) return

    const { data: campaign, error } = await supabase
      .from('mail_campaigns')
      .insert({
        name: name.trim(),
        account_id: accountId,
        template_id: templateId,
        status: 'draft',
        total_recipients: recipients.length,
        delay_seconds: delay,
      })
      .select()
      .single<MailCampaign>()
    if (error || !campaign) {
      setToast({ message: error?.message ?? 'Kampanya oluşturulamadı', type: 'error' })
      return
    }

    for (let i = 0; i < recipients.length; i += 500) {
      const chunk = recipients.slice(i, i + 500).map((r) => ({ ...r, campaign_id: campaign.id }))
      const { error: insertError } = await supabase.from('mail_recipients').insert(chunk)
      if (insertError) {
        setToast({ message: `Alıcılar eklenemedi: ${insertError.message}`, type: 'error' })
        return
      }
    }

    setCampaignId(campaign.id)
    setProgress({ done: 0, total: recipients.length })
    await runSending(campaign.id, delay)
  }

  const isResume = !!resumeId && !!campaignId
  const locked = sending || !!campaignId

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: 600,
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: active ? 'var(--card)' : 'transparent',
    color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
  })

  const platformButtonStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 600,
    borderRadius: '999px',
    border: `1px solid ${active ? 'var(--foreground)' : 'var(--border)'}`,
    backgroundColor: active ? 'var(--foreground)' : 'transparent',
    color: active ? 'var(--background)' : 'var(--text-2)',
    cursor: locked ? 'not-allowed' : 'pointer',
  })

  const activePlatform = PLATFORMS.find((p) => p.key === platformKey)

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <PageHeader
        title={isResume ? 'Kampanyaya Devam Et' : 'Yeni Kampanya'}
        subtitle={isResume ? name : 'Alıcıları seç, şablon seç, gönder'}
        icon={Send}
        gradient={MAIL_GRADIENT}
      />

      <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card title="Kampanya Ayarları">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Field label="Kampanya Adı">
                <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} disabled={isResume || sending} />
              </Field>
              <Field label="Gönderen Hesap">
                <select style={inputStyle} value={accountId} onChange={(e) => setAccountId(e.target.value)} disabled={isResume || sending}>
                  <option value="">Seçin…</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} — {a.email} ({a.sent_today}/{a.daily_limit})</option>
                  ))}
                </select>
                {accounts.length === 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '6px 0 0' }}>
                    Aktif hesap yok. <Link href="/mail-servisi/ayarlar" style={{ color: 'var(--foreground)', fontWeight: 600 }}>Hesap ekle</Link>
                  </p>
                )}
              </Field>
              <Field label="Şablon">
                <select style={inputStyle} value={templateId} onChange={(e) => setTemplateId(e.target.value)} disabled={isResume || sending}>
                  <option value="">Seçin…</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}{[t.platform, t.tier, t.language].filter(Boolean).length ? ` (${[t.platform, t.tier, t.language].filter(Boolean).join(' · ')})` : ''}
                    </option>
                  ))}
                </select>
                {templates.length === 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '6px 0 0' }}>
                    Şablon yok. <Link href="/mail-servisi/sablonlar" style={{ color: 'var(--foreground)', fontWeight: 600 }}>Şablon oluştur</Link>
                  </p>
                )}
              </Field>
              <Field label="Mailler arası bekleme (saniye)">
                <input
                  type="number"
                  min={5}
                  style={inputStyle}
                  value={delay}
                  onChange={(e) => setDelay(Math.max(5, Number(e.target.value) || 5))}
                  disabled={isResume || sending}
                />
              </Field>
            </div>
          </Card>

          {!isResume && (
            <Card title="Alıcılar">
              <div style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '10px', backgroundColor: 'var(--muted)', marginBottom: '16px' }}>
                <button style={tabStyle(recipientTab === 'platform')} onClick={() => setRecipientTab('platform')}>Platform</button>
                <button style={tabStyle(recipientTab === 'csv')} onClick={() => setRecipientTab('csv')}>CSV Upload</button>
              </div>

              {recipientTab === 'platform' ? (
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.key}
                        style={platformButtonStyle(p.key === platformKey)}
                        disabled={locked || loadingPlatform}
                        onClick={() => loadPlatform(p)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.icon} alt="" width={16} height={16} style={{ borderRadius: '4px', objectFit: 'cover' }} />
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {platformError && (
                    <p style={{ fontSize: '13px', color: 'var(--danger)', margin: '14px 0 0' }}>{platformError}</p>
                  )}

                  {loadingPlatform && (
                    <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--muted-foreground)', margin: '14px 0 0' }}>
                      <Loader2 size={14} className="animate-spin" /> Yayıncılar yükleniyor…
                    </p>
                  )}

                  {!platformKey && !loadingPlatform && (
                    <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: '14px 0 0' }}>
                      Email adresi olan yayıncıları listelemek için bir platform seçin.
                    </p>
                  )}

                  {activePlatform && !loadingPlatform && !platformError && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 0 8px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                          {activePlatform.label}: <strong>{currentStreamers.length}</strong> yayıncı
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button style={buttonStyle('secondary', locked || currentStreamers.length === 0)} disabled={locked || currentStreamers.length === 0} onClick={selectAll}>
                            Tümünü Seç
                          </button>
                          <button style={buttonStyle('secondary', locked || selectedInCurrent === 0)} disabled={locked || selectedInCurrent === 0} onClick={deselectAll}>
                            Seçimi Kaldır
                          </button>
                        </div>
                      </div>

                      {currentStreamers.length === 0 ? (
                        <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>Bu platformda email adresi olan yayıncı yok.</p>
                      ) : (
                        <div style={{ maxHeight: '360px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                          {currentStreamers.map((s) => (
                            <label
                              key={s.key}
                              style={{
                                display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', alignItems: 'center', gap: '10px',
                                padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: '13px',
                                cursor: locked ? 'not-allowed' : 'pointer',
                                backgroundColor: selected.has(s.key) ? 'var(--muted)' : 'transparent',
                              }}
                            >
                              <input type="checkbox" checked={selected.has(s.key)} disabled={locked} onChange={() => toggleStreamer(s)} />
                              <span style={{ minWidth: 0 }}>
                                <span style={{ display: 'block', fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {s.name ?? '—'}
                                </span>
                                <span style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {s.email}
                                </span>
                              </span>
                              <span style={{ color: 'var(--success)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                                {s.followers?.toLocaleString('tr-TR') ?? '—'}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: '12px 0 0' }}>
                    <strong style={{ color: 'var(--success)' }}>{selected.size}</strong> yayıncı seçildi
                    {platformKey && selected.size !== selectedInCurrent && <> ({selectedInCurrent} bu platformdan)</>}
                  </p>
                </div>
              ) : (
                <div>
                  <label
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                      padding: '24px', border: '1px dashed var(--input)', borderRadius: '10px',
                      cursor: locked ? 'not-allowed' : 'pointer', color: 'var(--text-2)', fontSize: '13px',
                    }}
                  >
                    <Upload size={20} />
                    {fileName || 'CSV dosyası seçin'}
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      style={{ display: 'none' }}
                      disabled={locked}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
                    />
                  </label>
                  <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '10px 0 0' }}>
                    Sütunlar: <code>email</code> (zorunlu), <code>name</code>, <code>platform</code>, <code>followers</code>
                  </p>
                  {csvStats && (
                    <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: '12px 0 0' }}>
                      <strong style={{ color: 'var(--success)' }}>{csvRecipients.length}</strong> geçerli alıcı
                      {csvStats.invalid > 0 && <> · <span style={{ color: 'var(--danger)' }}>{csvStats.invalid} geçersiz</span></>}
                      {csvStats.duplicates > 0 && <> · <span style={{ color: 'var(--orange)' }}>{csvStats.duplicates} tekrar</span></>}
                    </p>
                  )}
                  {csvRecipients.length > 0 && (
                    <div style={{ overflowX: 'auto', marginTop: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={thStyle}>Email</th>
                            <th style={thStyle}>İsim</th>
                            <th style={thStyle}>Platform</th>
                            <th style={thStyle}>Takipçi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvRecipients.slice(0, 8).map((r) => (
                            <tr key={r.email}>
                              <td style={tdStyle}>{r.email}</td>
                              <td style={tdStyle}>{r.name ?? '—'}</td>
                              <td style={tdStyle}>{r.platform ?? '—'}</td>
                              <td style={tdStyle}>{r.followers?.toLocaleString('tr-TR') ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {csvRecipients.length > 8 && (
                        <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0, padding: '8px 16px' }}>+{csvRecipients.length - 8} kişi daha</p>
                      )}
                    </div>
                  )}
                  {csvRecipients.length > 0 && !locked && (
                    <button
                      style={{ ...buttonStyle('secondary'), marginTop: '12px' }}
                      onClick={() => { setCsvRecipients([]); setCsvStats(null); setFileName('') }}
                    >
                      CSV&apos;yi Temizle
                    </button>
                  )}
                </div>
              )}
            </Card>
          )}

          <Card title="Gönderim">
            {!isResume && (
              <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: '0 0 14px' }}>
                Toplam <strong style={{ color: 'var(--foreground)' }}>{recipients.length}</strong> alıcı
                {selected.size > 0 && csvRecipients.length > 0 && (
                  <span style={{ color: 'var(--muted-foreground)' }}> ({selected.size} platform + {csvRecipients.length} CSV, tekrarlar çıkarıldı)</span>
                )}
              </p>
            )}
            {(sending || progress.total > 0) && (
              <div style={{ marginBottom: '14px' }}>
                <ProgressBar value={progress.done} total={progress.total} />
                {countdown > 0 && <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '8px 0 0' }}>Sonraki mail {countdown} sn içinde…</p>}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              {sending ? (
                <button style={buttonStyle('danger')} onClick={() => { stopRef.current = true }}>
                  <Square size={14} /> Durdur
                </button>
              ) : isResume ? (
                <button style={buttonStyle('primary')} onClick={() => runSending(campaignId!, delay)}>
                  <Play size={14} /> Kalan Alıcılara Gönder
                </button>
              ) : (
                <button
                  style={buttonStyle('primary', !name || !accountId || !templateId || recipients.length === 0 || !!campaignId)}
                  disabled={!name || !accountId || !templateId || recipients.length === 0 || !!campaignId}
                  onClick={createAndSend}
                >
                  <Send size={14} /> Kampanyayı Oluştur ve Gönder
                </button>
              )}
            </div>
            {sending && (
              <p style={{ fontSize: '12px', color: 'var(--orange)', margin: '10px 0 0' }}>
                Gönderim bu sekmede çalışıyor — sekmeyi kapatmayın. Kapatırsanız Kampanyalar sayfasından devam edebilirsiniz.
              </p>
            )}
            {log.length > 0 && (
              <div style={{ marginTop: '14px', maxHeight: '220px', overflowY: 'auto', fontSize: '12px', fontFamily: 'monospace' }}>
                {log.map((l, i) => (
                  <div key={i} style={{ color: l.ok ? 'var(--success)' : 'var(--danger)', padding: '2px 0' }}>
                    {l.ok ? '✓' : '✗'} {l.email} — {l.message}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card title="Önizleme">
          {selectedTemplate ? (
            <>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '10px' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Konu:</span>{' '}
                <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>
                  {renderTemplate(selectedTemplate.subject, { name: recipients[0]?.name ?? 'Yayıncı Adı' }, true)}
                </span>
              </div>
              <iframe
                title="Mail önizleme"
                sandbox=""
                srcDoc={previewHtml}
                style={{ width: '100%', height: '560px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--card)' }}
              />
            </>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>Önizleme için bir şablon seçin.</p>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function YeniKampanyaPage() {
  return (
    <Suspense>
      <YeniKampanya />
    </Suspense>
  )
}
