'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Send, Upload, Square, Play } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { Toast } from '@/components/Toast'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { MAIL_ACCOUNT_PUBLIC_COLUMNS, renderTemplate, type MailAccount, type MailCampaign, type MailTemplate } from '@/lib/mail'
import { Card, Field, ProgressBar, MAIL_GRADIENT, buttonStyle, inputStyle, thStyle, tdStyle } from '../../_components/ui'

interface CsvRecipient {
  email: string
  name: string | null
  platform: string | null
  followers: number | null
  language: string | null
}

interface LogLine {
  email: string
  ok: boolean
  message: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const HEADER_ALIASES: Record<keyof CsvRecipient, string[]> = {
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

function toRecipients(rows: string[][]): { valid: CsvRecipient[]; invalid: number; duplicates: number } {
  if (rows.length < 2) return { valid: [], invalid: 0, duplicates: 0 }
  const header = rows[0].map((h) => h.trim().toLowerCase())
  const col = (key: keyof CsvRecipient) => header.findIndex((h) => HEADER_ALIASES[key].includes(h))
  const idx = { email: col('email'), name: col('name'), platform: col('platform'), followers: col('followers'), language: col('language') }
  if (idx.email === -1) throw new Error('CSV\'de "email" sütunu bulunamadı')

  const seen = new Set<string>()
  const valid: CsvRecipient[] = []
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
  const [fileName, setFileName] = useState('')
  const [recipients, setRecipients] = useState<CsvRecipient[]>([])
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
      setRecipients(valid)
      setCsvStats({ invalid, duplicates })
      if (!name) setName(file.name.replace(/\.csv$/i, ''))
    } catch (e) {
      setRecipients([])
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
      setToast({ message: 'Kampanya adı, hesap, şablon ve CSV gerekli', type: 'error' })
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

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <PageHeader
        title={isResume ? 'Kampanyaya Devam Et' : 'Yeni Kampanya'}
        subtitle={isResume ? name : 'CSV yükle, şablon seç, gönder'}
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
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0' }}>
                    Aktif hesap yok. <Link href="/mail-servisi/ayarlar" style={{ color: '#a78bfa' }}>Hesap ekle</Link>
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
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0' }}>
                    Şablon yok. <Link href="/mail-servisi/sablonlar" style={{ color: '#a78bfa' }}>Şablon oluştur</Link>
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
            <Card title="Alıcı Listesi (CSV)">
              <label
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  padding: '24px', border: '1px dashed #3a3a4a', borderRadius: '10px',
                  cursor: sending ? 'not-allowed' : 'pointer', color: '#94a3b8', fontSize: '13px',
                }}
              >
                <Upload size={20} />
                {fileName || 'CSV dosyası seçin'}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  style={{ display: 'none' }}
                  disabled={sending}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
              </label>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '10px 0 0' }}>
                Sütunlar: <code>email</code> (zorunlu), <code>name</code>, <code>platform</code>, <code>followers</code>, <code>language</code>
              </p>
              {csvStats && (
                <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '12px 0 0' }}>
                  <strong style={{ color: '#4ade80' }}>{recipients.length}</strong> geçerli alıcı
                  {csvStats.invalid > 0 && <> · <span style={{ color: '#f87171' }}>{csvStats.invalid} geçersiz</span></>}
                  {csvStats.duplicates > 0 && <> · <span style={{ color: '#fb923c' }}>{csvStats.duplicates} tekrar</span></>}
                </p>
              )}
              {recipients.length > 0 && (
                <div style={{ overflowX: 'auto', marginTop: '12px', border: '1px solid #2a2a3a', borderRadius: '8px' }}>
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
                      {recipients.slice(0, 8).map((r) => (
                        <tr key={r.email}>
                          <td style={tdStyle}>{r.email}</td>
                          <td style={tdStyle}>{r.name ?? '—'}</td>
                          <td style={tdStyle}>{r.platform ?? '—'}</td>
                          <td style={tdStyle}>{r.followers?.toLocaleString('tr-TR') ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {recipients.length > 8 && (
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0, padding: '8px 16px' }}>+{recipients.length - 8} kişi daha</p>
                  )}
                </div>
              )}
            </Card>
          )}

          <Card title="Gönderim">
            {(sending || progress.total > 0) && (
              <div style={{ marginBottom: '14px' }}>
                <ProgressBar value={progress.done} total={progress.total} />
                {countdown > 0 && <p style={{ fontSize: '12px', color: '#64748b', margin: '8px 0 0' }}>Sonraki mail {countdown} sn içinde…</p>}
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
              <p style={{ fontSize: '12px', color: '#fb923c', margin: '10px 0 0' }}>
                Gönderim bu sekmede çalışıyor — sekmeyi kapatmayın. Kapatırsanız Kampanyalar sayfasından devam edebilirsiniz.
              </p>
            )}
            {log.length > 0 && (
              <div style={{ marginTop: '14px', maxHeight: '220px', overflowY: 'auto', fontSize: '12px', fontFamily: 'monospace' }}>
                {log.map((l, i) => (
                  <div key={i} style={{ color: l.ok ? '#4ade80' : '#f87171', padding: '2px 0' }}>
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
              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px' }}>
                <span style={{ color: '#64748b' }}>Konu:</span>{' '}
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
                  {renderTemplate(selectedTemplate.subject, { name: recipients[0]?.name ?? 'Yayıncı Adı' }, true)}
                </span>
              </div>
              <iframe
                title="Mail önizleme"
                sandbox=""
                srcDoc={previewHtml}
                style={{ width: '100%', height: '560px', border: '1px solid #2a2a3a', borderRadius: '8px', backgroundColor: '#fff' }}
              />
            </>
          ) : (
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Önizleme için bir şablon seçin.</p>
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
