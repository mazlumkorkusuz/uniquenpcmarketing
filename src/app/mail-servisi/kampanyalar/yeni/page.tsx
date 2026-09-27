'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Send, Upload, Square, Play, Loader2, X, Search, Users } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { Toast } from '@/components/Toast'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ACTIVE_ACCOUNT_STATUSES, MAIL_ACCOUNT_PUBLIC_COLUMNS, renderTemplate, type MailAccount, type MailCampaign, type MailRecipient, type MailTemplate } from '@/lib/mail'
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
  avgViewers: number | null
  country: string | null
}

type SortKey = 'followers_desc' | 'followers_asc' | 'avg_viewers_desc' | 'name_asc'

const SORT_OPTIONS: { value: SortKey; label: string; needsAvgViewers?: boolean }[] = [
  { value: 'followers_desc', label: 'Takipçi: Yüksekten düşüğe' },
  { value: 'followers_asc', label: 'Takipçi: Düşükten yükseğe' },
  { value: 'avg_viewers_desc', label: 'Ort. izleyici: Yüksekten düşüğe', needsAvgViewers: true },
  { value: 'name_asc', label: 'İsim: A → Z' },
]

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
  hasAvgViewers?: boolean
  hasCountry?: boolean
}

const PLATFORMS: PlatformDef[] = [
  { key: 'twitch',   label: 'Twitch',   table: 'twitch_streamers',   icon: '/icons/twitch.png',   nameColumns: ['display_name', 'username'], followersColumn: 'followers', hasAvgViewers: true },
  { key: 'kick',     label: 'Kick',     table: 'kick_streamers',     icon: '/icons/kick.png',     nameColumns: ['channel_name', 'username'], followersColumn: 'followers', hasAvgViewers: true },
  { key: 'soop',     label: 'SOOP',     table: 'soop_streamers',     icon: '/icons/soop.jpeg',    nameColumns: ['channel_name', 'username'], followersColumn: 'followers', hasAvgViewers: true },
  { key: 'youtube',  label: 'YouTube',  table: 'youtube_streamers',  icon: '/icons/youtube.png',  nameColumns: ['channel_name', 'username'], followersColumn: 'followers', hasCountry: true },
  { key: 'chzzk',    label: 'Chzzk',    table: 'chzzk_streamers',    icon: '/icons/chzzk.png',    nameColumns: ['channel_name', 'username'], followersColumn: 'followers', hasAvgViewers: true },
  { key: 'bilibili', label: 'BiliBili', table: 'bilibili_streamers', icon: '/icons/bilibili.png', nameColumns: ['channel_name', 'username'], followersColumn: 'followers' },
  { key: 'douyin',   label: 'Douyin',   table: 'douyin_streamers',   icon: '/icons/douyin.png',   nameColumns: ['channel_name', 'username'], followersColumn: 'followers' },
]

// Tables are expected to expose contact_email; the current streamer tables still use `email`,
// so fall back to it when contact_email doesn't exist (Postgres error 42703).
const EMAIL_COLUMNS = ['contact_email', 'email']
const PAGE_SIZE = 1000
const UNKNOWN_VALUE = '__unknown__'

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

function textOrNull(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

function numberOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// Empty input → no bound
function parseBound(v: string): number | null {
  const n = parseFollowers(v)
  return n === null || Number.isNaN(n) ? null : n
}

// Unique values with counts, most common first; missing values grouped as UNKNOWN_VALUE
function countValues<T>(items: T[], pick: (item: T) => string | null): [string, number][] {
  const counts = new Map<string, number>()
  for (const it of items) {
    const k = pick(it) ?? UNKNOWN_VALUE
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

// Interleaves the queue by account so consecutive mails go out from different accounts
function interleaveByAccount<T extends { account_id?: string | null }>(items: T[]): T[] {
  const groups = new Map<string, T[]>()
  for (const it of items) {
    const k = it.account_id ?? ''
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(it)
  }
  const lists = [...groups.values()]
  const out: T[] = []
  for (let i = 0; out.length < items.length; i++) {
    for (const l of lists) if (i < l.length) out.push(l[i])
  }
  return out
}

function StreamerDrawer({
  platform,
  onClose,
  onAdd,
  addedKeys,
}: {
  platform: PlatformDef
  onClose: () => void
  onAdd: (streamers: PlatformStreamer[]) => void
  addedKeys: Set<string>
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [visible, setVisible] = useState(false)
  const [streamers, setStreamers] = useState<PlatformStreamer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState('')
  const [country, setCountry] = useState('')
  const [minFollowers, setMinFollowers] = useState('')
  const [maxFollowers, setMaxFollowers] = useState('')
  const [minAvgViewers, setMinAvgViewers] = useState('')
  const [sort, setSort] = useState<SortKey>('followers_desc')
  const [picked, setPicked] = useState<Set<string>>(new Set())

  // Slide in on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const close = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 220)
  }, [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        let rows: Record<string, unknown>[] = []
        let emailColumn: string | null = null
        for (const col of EMAIL_COLUMNS) {
          rows = []
          let missingColumn = false
          for (let from = 0; ; from += PAGE_SIZE) {
            const { data, error } = await supabase
              .from(platform.table)
              .select('*')
              .not(col, 'is', null)
              .neq(col, '')
              .order(platform.followersColumn, { ascending: false, nullsFirst: false })
              .range(from, from + PAGE_SIZE - 1)
            if (error) {
              if (error.code === '42703') { missingColumn = true; break }
              throw new Error(error.message)
            }
            rows.push(...(data ?? []))
            if (!data || data.length < PAGE_SIZE) break
          }
          if (!missingColumn) { emailColumn = col; break }
        }
        if (!emailColumn) throw new Error('contact_email sütunu bulunamadı')

        const seen = new Set<string>()
        const list: PlatformStreamer[] = []
        for (const row of rows) {
          const email = firstValidEmail(row[emailColumn])
          if (!email || seen.has(email)) continue
          seen.add(email)
          const displayName = platform.nameColumns.map((c) => row[c]).find((v) => typeof v === 'string' && v.trim())
          const followers = Number(row[platform.followersColumn])
          list.push({
            key: `${platform.key}:${String(row.id)}`,
            email,
            name: (displayName as string | undefined)?.trim() ?? null,
            platform: platform.label,
            followers: Number.isFinite(followers) ? followers : null,
            language: textOrNull(row.language),
            avgViewers: platform.hasAvgViewers ? numberOrNull(row.avg_viewers) : null,
            country: platform.hasCountry ? textOrNull(row.country) : null,
          })
        }
        if (!cancelled) setStreamers(list)
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [supabase, platform])

  const languages = useMemo(() => countValues(streamers, (s) => s.language), [streamers])
  const countries = useMemo(() => countValues(streamers, (s) => s.country), [streamers])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const minF = parseBound(minFollowers)
    const maxF = parseBound(maxFollowers)
    const minAvg = platform.hasAvgViewers ? parseBound(minAvgViewers) : null
    const list = streamers.filter((s) => {
      if (language && (s.language ?? UNKNOWN_VALUE) !== language) return false
      if (country && (s.country ?? UNKNOWN_VALUE) !== country) return false
      if (minF !== null && (s.followers ?? 0) < minF) return false
      if (maxF !== null && (s.followers ?? 0) > maxF) return false
      if (minAvg !== null && (s.avgViewers ?? 0) < minAvg) return false
      if (q && !s.email.includes(q) && !(s.name ?? '').toLowerCase().includes(q)) return false
      return true
    })
    const num = (v: number | null) => v ?? -1
    switch (sort) {
      case 'followers_asc': return list.sort((a, b) => num(a.followers) - num(b.followers))
      case 'avg_viewers_desc': return list.sort((a, b) => num(b.avgViewers) - num(a.avgViewers))
      case 'name_asc': return list.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'tr'))
      default: return list.sort((a, b) => num(b.followers) - num(a.followers))
    }
  }, [streamers, search, language, country, minFollowers, maxFollowers, minAvgViewers, sort, platform.hasAvgViewers])

  const hasFilters = !!(language || country || minFollowers || maxFollowers || minAvgViewers)
  const resetFilters = () => {
    setLanguage(''); setCountry(''); setMinFollowers(''); setMaxFollowers(''); setMinAvgViewers('')
  }

  const toggle = (key: string) => {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectAll = () => {
    setPicked((prev) => {
      const next = new Set(prev)
      for (const s of filtered) if (!addedKeys.has(s.key)) next.add(s.key)
      return next
    })
  }

  const add = () => {
    onAdd(streamers.filter((s) => picked.has(s.key)))
    close()
  }

  const filterLabel: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', minWidth: 0 }
  const compactInput: React.CSSProperties = { ...inputStyle, padding: '6px 8px', fontSize: '13px' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} role="dialog" aria-modal="true" aria-label={`${platform.label} yayıncıları`}>
      <div
        onClick={close}
        style={{
          position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
          opacity: visible ? 1 : 0, transition: 'opacity 200ms ease',
        }}
      />
      <aside
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(520px, 100vw)',
          display: 'flex', flexDirection: 'column',
          backgroundColor: 'var(--card)', borderLeft: '1px solid var(--border)', boxShadow: '-12px 0 32px rgba(0,0,0,0.2)',
          transform: visible ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={platform.icon} alt="" width={22} height={22} style={{ borderRadius: '5px', objectFit: 'cover' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)' }}>{platform.label} Yayıncıları</div>
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
              {loading ? 'Yükleniyor…' : `${streamers.length} yayıncı · email adresi olanlar`}
            </div>
          </div>
          <button onClick={close} aria-label="Kapat" style={{ ...buttonStyle('secondary'), padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input
              style={{ ...inputStyle, paddingLeft: '30px' }}
              placeholder="İsim veya email ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
            <label style={filterLabel}>
              Min takipçi
              <input style={compactInput} inputMode="numeric" placeholder="örn. 10k" value={minFollowers} onChange={(e) => setMinFollowers(e.target.value)} />
            </label>
            <label style={filterLabel}>
              Max takipçi
              <input style={compactInput} inputMode="numeric" placeholder="örn. 1m" value={maxFollowers} onChange={(e) => setMaxFollowers(e.target.value)} />
            </label>
            {platform.hasAvgViewers && (
              <label style={filterLabel}>
                Min ort. izleyici
                <input style={compactInput} inputMode="numeric" placeholder="örn. 100" value={minAvgViewers} onChange={(e) => setMinAvgViewers(e.target.value)} />
              </label>
            )}
            <label style={filterLabel}>
              Dil
              <select style={compactInput} value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="">Tümü</option>
                {languages.map(([lang, count]) => (
                  <option key={lang} value={lang}>{lang === UNKNOWN_VALUE ? 'Bilinmiyor' : lang} ({count})</option>
                ))}
              </select>
            </label>
            {platform.hasCountry && (
              <label style={filterLabel}>
                Ülke
                <select style={compactInput} value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="">Tümü</option>
                  {countries.map(([c, count]) => (
                    <option key={c} value={c}>{c === UNKNOWN_VALUE ? 'Bilinmiyor' : c} ({count})</option>
                  ))}
                </select>
              </label>
            )}
            <label style={filterLabel}>
              Sıralama
              <select style={compactInput} value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                {SORT_OPTIONS.filter((o) => !o.needsAvgViewers || platform.hasAvgViewers).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
              {filtered.length} sonuç
              {hasFilters && (
                <button onClick={resetFilters} style={{ marginLeft: '8px', padding: 0, border: 'none', background: 'none', color: 'var(--foreground)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                  Filtreleri sıfırla
                </button>
              )}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button style={buttonStyle('secondary', filtered.length === 0)} disabled={filtered.length === 0} onClick={selectAll}>Tümünü Seç</button>
              <button style={buttonStyle('secondary', picked.size === 0)} disabled={picked.size === 0} onClick={() => setPicked(new Set())}>Temizle</button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--muted-foreground)', padding: '20px', margin: 0 }}>
              <Loader2 size={14} className="animate-spin" /> Yayıncılar yükleniyor…
            </p>
          ) : error ? (
            <p style={{ fontSize: '13px', color: 'var(--danger)', padding: '20px', margin: 0 }}>{platform.label} yayıncıları yüklenemedi: {error}</p>
          ) : filtered.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', padding: '20px', margin: 0 }}>
              {streamers.length === 0 ? 'Bu platformda email adresi olan yayıncı yok.' : 'Aramaya uyan yayıncı yok.'}
            </p>
          ) : (
            filtered.map((s) => {
              const added = addedKeys.has(s.key)
              const checked = added || picked.has(s.key)
              return (
                <label
                  key={s.key}
                  style={{
                    display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', alignItems: 'center', gap: '10px',
                    padding: '9px 20px', borderBottom: '1px solid var(--border)', fontSize: '13px',
                    cursor: added ? 'default' : 'pointer', opacity: added ? 0.55 : 1,
                    backgroundColor: picked.has(s.key) ? 'var(--muted)' : 'transparent',
                  }}
                >
                  <input type="checkbox" checked={checked} disabled={added} onChange={() => toggle(s.key)} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name ?? '—'}{added && <span style={{ fontWeight: 500, color: 'var(--muted-foreground)' }}> · eklendi</span>}
                    </span>
                    <span style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.email}
                    </span>
                  </span>
                  <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ display: 'block', color: 'var(--success)', fontWeight: 600 }}>
                      {s.followers?.toLocaleString('tr-TR') ?? '—'}
                    </span>
                    {platform.hasAvgViewers && (
                      <span style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: '11px' }}>
                        {s.avgViewers !== null ? `${s.avgViewers.toLocaleString('tr-TR')} ort. izleyici` : '—'}
                      </span>
                    )}
                    {platform.hasCountry && s.country && (
                      <span style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: '11px' }}>{s.country}</span>
                    )}
                  </span>
                </label>
              )
            })
          )}
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
          <button
            style={{ ...buttonStyle('primary', picked.size === 0), width: '100%', justifyContent: 'center' }}
            disabled={picked.size === 0}
            onClick={add}
          >
            {picked.size} Seçileni Ekle
          </button>
        </div>
      </aside>
    </div>
  )
}

function YeniKampanya() {
  const router = useRouter()
  const resumeId = useSearchParams().get('resume')
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [accounts, setAccounts] = useState<MailAccount[]>([])
  const [templates, setTemplates] = useState<MailTemplate[]>([])
  const [name, setName] = useState('')
  const [accountIds, setAccountIds] = useState<string[]>([])
  const [templateId, setTemplateId] = useState('')
  const [delay, setDelay] = useState(30)

  const [recipientTab, setRecipientTab] = useState<RecipientTab>('platform')
  const [drawerPlatform, setDrawerPlatform] = useState<PlatformDef | null>(null)
  // Streamers added from platform drawers, keyed by PlatformStreamer.key
  const [platformRecipients, setPlatformRecipients] = useState<Map<string, PlatformStreamer>>(new Map())

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
      supabase.from('mail_accounts').select(MAIL_ACCOUNT_PUBLIC_COLUMNS).in('status', ACTIVE_ACCOUNT_STATUSES).order('created_at'),
      supabase.from('mail_templates').select('*').order('created_at', { ascending: false }),
    ]).then(([a, t]) => {
      setAccounts((a.data ?? []) as unknown as MailAccount[])
      setTemplates((t.data ?? []) as MailTemplate[])
    })
  }, [supabase])

  // Resuming an unfinished campaign: load its settings, pending count and the accounts in use
  useEffect(() => {
    if (!resumeId) return
    ;(async () => {
      const { data: c } = await supabase.from('mail_campaigns').select('*').eq('id', resumeId).single<MailCampaign>()
      if (!c) return
      const { data: pending } = await supabase.from('mail_recipients').select('*').eq('campaign_id', c.id).eq('status', 'pending')
      const ids = new Set<string>()
      for (const r of (pending ?? []) as MailRecipient[]) {
        const id = r.account_id ?? c.account_id
        if (id) ids.add(id)
      }
      if (ids.size === 0 && c.account_id) ids.add(c.account_id)
      setCampaignId(c.id)
      setName(c.name)
      setAccountIds([...ids])
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

  // Final recipient list: platform picks + CSV rows, deduplicated by email
  const recipients = useMemo<Recipient[]>(() => {
    const seen = new Set<string>()
    const out: Recipient[] = []
    for (const r of [...platformRecipients.values(), ...csvRecipients]) {
      if (seen.has(r.email)) continue
      seen.add(r.email)
      out.push({ email: r.email, name: r.name, platform: r.platform, followers: r.followers, language: r.language })
    }
    return out
  }, [platformRecipients, csvRecipients])

  const addedKeys = useMemo(() => new Set(platformRecipients.keys()), [platformRecipients])

  const platformCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of platformRecipients.values()) counts.set(r.platform ?? '', (counts.get(r.platform ?? '') ?? 0) + 1)
    return counts
  }, [platformRecipients])

  const addStreamers = (streamers: PlatformStreamer[]) => {
    setPlatformRecipients((prev) => {
      const next = new Map(prev)
      for (const s of streamers) next.set(s.key, s)
      return next
    })
  }

  const clearRecipients = () => {
    setPlatformRecipients(new Map())
    setCsvRecipients([])
    setCsvStats(null)
    setFileName('')
  }

  const toggleAccount = (id: string) => {
    setAccountIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const selectedTemplate = templates.find((t) => t.id === templateId)
  const selectedAccounts = accounts.filter((a) => accountIds.includes(a.id))
  const previewAccount = selectedAccounts[0]

  const previewHtml = useMemo(() => {
    if (!selectedTemplate) return ''
    const r = recipients[0]
    return renderTemplate(selectedTemplate.html_content, {
      name: r?.name ?? 'Yayıncı Adı',
      email: r?.email ?? 'ornek@mail.com',
      platform: r?.platform ?? 'Twitch',
      followers: (r?.followers ?? 25000).toLocaleString('en-US'),
      language: r?.language,
      sender_name: previewAccount?.name,
      sender_email: previewAccount?.email,
      domain: previewAccount?.domain,
      logo_url: previewAccount?.logo_url,
      banner_url: previewAccount?.banner_url,
    })
  }, [selectedTemplate, previewAccount, recipients])

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
      .select('*')
      .eq('campaign_id', cid)
      .eq('status', 'pending')
      .order('created_at')
    const queue = interleaveByAccount((pending ?? []) as MailRecipient[])

    // Accounts that hit their daily limit or became inactive; their recipients stay pending
    const unavailable = new Set<string>()
    let stoppedReason: string | null = null
    let sentAny = false
    for (let i = 0; i < queue.length; i++) {
      if (stopRef.current) { stoppedReason = 'Gönderim durduruldu'; break }
      const r = queue[i]
      if (r.account_id && unavailable.has(r.account_id)) continue
      if (sentAny) await sleepWithCountdown(delaySeconds)
      if (stopRef.current) { stoppedReason = 'Gönderim durduruldu'; break }

      const res = await fetch('/api/mail-gonder', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ recipient_id: r.id }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok && data.ok) {
        sentAny = true
        setLog((l) => [{ email: r.email, ok: true, message: 'Gönderildi' }, ...l])
        setProgress((p) => ({ ...p, done: p.done + 1 }))
      } else if (data.bounced) {
        sentAny = true
        setLog((l) => [{ email: r.email, ok: false, message: `Bounce: ${data.error}` }, ...l])
        setProgress((p) => ({ ...p, done: p.done + 1 }))
      } else if (data.skipped) {
        continue
      } else if (data.accountUnavailable && r.account_id) {
        // Only this account is blocked — keep sending from the others
        unavailable.add(r.account_id)
        stoppedReason = data.error
        setLog((l) => [{ email: r.email, ok: false, message: data.error }, ...l])
      } else {
        // Account/SMTP problem — stop and let the user resume later
        stoppedReason = data.error ?? `Hata (${res.status})`
        setLog((l) => [{ email: r.email, ok: false, message: stoppedReason! }, ...l])
        break
      }
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
    if (!name.trim() || accountIds.length === 0 || !templateId || recipients.length === 0) {
      setToast({ message: 'Kampanya adı, en az bir hesap, şablon ve alıcı gerekli', type: 'error' })
      return
    }
    const accountsNote = accountIds.length > 1 ? ` (${accountIds.length} hesap sırayla)` : ''
    if (!confirm(`${recipients.length} kişiye ${delay} sn aralıkla mail gönderilecek${accountsNote}. Devam edilsin mi?`)) return

    const { data: campaign, error } = await supabase
      .from('mail_campaigns')
      .insert({
        name: name.trim(),
        account_id: accountIds[0],
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

    // With several accounts each recipient gets one round-robin; a single account stays on the campaign
    const multi = accountIds.length > 1
    for (let i = 0; i < recipients.length; i += 500) {
      const chunk = recipients.slice(i, i + 500).map((r, j) => ({
        ...r,
        campaign_id: campaign.id,
        ...(multi ? { account_id: accountIds[(i + j) % accountIds.length] } : {}),
      }))
      const { error: insertError } = await supabase.from('mail_recipients').insert(chunk)
      if (insertError) {
        const hint = multi && /account_id/.test(insertError.message)
          ? ' — mail_recipients.account_id migration\'ı uygulanmamış'
          : ''
        setToast({ message: `Alıcılar eklenemedi: ${insertError.message}${hint}`, type: 'error' })
        await supabase.from('mail_campaigns').delete().eq('id', campaign.id)
        return
      }
    }

    setCampaignId(campaign.id)
    setProgress({ done: 0, total: recipients.length })
    await runSending(campaign.id, delay)
  }

  const isResume = !!resumeId && !!campaignId
  const locked = sending || !!campaignId
  const canSend = !!name && accountIds.length > 0 && !!templateId && recipients.length > 0 && !campaignId

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

  const platformButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 600,
    borderRadius: '999px',
    border: '1px solid var(--border)',
    backgroundColor: 'transparent',
    color: 'var(--text-2)',
    cursor: locked ? 'not-allowed' : 'pointer',
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      {drawerPlatform && (
        <StreamerDrawer
          key={drawerPlatform.key}
          platform={drawerPlatform}
          addedKeys={addedKeys}
          onAdd={addStreamers}
          onClose={() => setDrawerPlatform(null)}
        />
      )}
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
              <Field label="Gönderen Hesaplar">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {accounts.map((a) => {
                    const checked = accountIds.includes(a.id)
                    const disabled = isResume || sending
                    return (
                      <label
                        key={a.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', fontSize: '13px',
                          border: `1px solid ${checked ? 'var(--foreground)' : 'var(--border)'}`, borderRadius: '8px',
                          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled && !checked ? 0.5 : 1,
                        }}
                      >
                        <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleAccount(a.id)} />
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <strong style={{ color: 'var(--foreground)' }}>{a.name}</strong>{' '}
                          <span style={{ color: 'var(--muted-foreground)' }}>{a.email}</span>
                        </span>
                        <span style={{ color: 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums' }}>{a.sent_today}/{a.daily_limit}</span>
                      </label>
                    )
                  })}
                </div>
                {accounts.length === 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '6px 0 0' }}>
                    Aktif hesap yok. <Link href="/mail-servisi/ayarlar" style={{ color: 'var(--foreground)', fontWeight: 600 }}>Hesap ekle</Link>
                  </p>
                )}
                {accountIds.length > 1 && (
                  <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '6px 0 0' }}>
                    Mailler seçili hesaplar arasında sırayla gönderilir.
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
            <Card
              title="Alıcılar"
              action={
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 4px 3px 10px',
                    borderRadius: '999px', fontSize: '12px', fontWeight: 700,
                    backgroundColor: recipients.length ? 'var(--foreground)' : 'var(--muted)',
                    color: recipients.length ? 'var(--background)' : 'var(--muted-foreground)',
                  }}
                >
                  <Users size={12} /> {recipients.length} alıcı
                  {recipients.length > 0 && !locked ? (
                    <button
                      onClick={clearRecipients}
                      aria-label="Tüm alıcıları temizle"
                      title="Tüm alıcıları temizle"
                      style={{ display: 'inline-flex', padding: '2px', border: 'none', borderRadius: '999px', background: 'transparent', color: 'inherit', cursor: 'pointer' }}
                    >
                      <X size={12} />
                    </button>
                  ) : <span style={{ width: '4px' }} />}
                </span>
              }
            >
              <div style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '10px', backgroundColor: 'var(--muted)', marginBottom: '16px' }}>
                <button style={tabStyle(recipientTab === 'platform')} onClick={() => setRecipientTab('platform')}>Platform</button>
                <button style={tabStyle(recipientTab === 'csv')} onClick={() => setRecipientTab('csv')}>CSV Upload</button>
              </div>

              {recipientTab === 'platform' ? (
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {PLATFORMS.map((p) => {
                      const count = platformCounts.get(p.label) ?? 0
                      return (
                        <button key={p.key} style={platformButtonStyle} disabled={locked} onClick={() => setDrawerPlatform(p)}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.icon} alt="" width={16} height={16} style={{ borderRadius: '4px', objectFit: 'cover' }} />
                          {p.label}
                          {count > 0 && <span style={{ color: 'var(--success)', fontWeight: 700 }}>{count}</span>}
                        </button>
                      )
                    })}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '12px 0 0' }}>
                    Platforma tıklayarak email adresi olan yayıncıları seçin.
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
                </div>
              )}

              {platformRecipients.size > 0 && csvRecipients.length > 0 && (
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '12px 0 0' }}>
                  {platformRecipients.size} platform + {csvRecipients.length} CSV, tekrarlar çıkarıldı
                </p>
              )}
            </Card>
          )}

          <Card title="Gönderim">
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
                <button style={buttonStyle('primary', !canSend)} disabled={!canSend} onClick={createAndSend}>
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
