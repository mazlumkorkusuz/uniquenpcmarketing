'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import PageHeader from '@/components/PageHeader'
import { Search, X, ExternalLink, Globe, Mail, ChevronLeft, ChevronRight, Users, Contact, Flag, TrendingUp, Link2 } from 'lucide-react'
import { inkOf, tint } from '@/lib/theme'
import SlideDrawer from '@/components/motion/SlideDrawer'

type Row = Record<string, unknown>
type SortKey = 'channel_name' | 'followers' | 'country' | 'total_views' | 'long_video_avg_views' | 'shorts_avg_views' | 'live_avg_views'
type SortDir = 'asc' | 'desc'
type AuxRow = { followers: number | null; country: string | null }

const PAGE_SIZE = 350
const YT_COLOR = '#ff4444'
const TABLE = 'youtube_streamers'
// fields that count toward "En Az 1 Sosyal Medya Olan" / "Sosyal Medya Var"
const SOCIAL_STAT_FIELDS = ['instagram', 'tiktok', 'twitter', 'discord', 'facebook', 'telegram', 'website'] as const
const SOCIAL_FILTER = SOCIAL_STAT_FIELDS.map(f => `${f}.not.is.null`).join(',')
// fields that count toward "En Az 1 İletişim Olan"
const CONTACT_FIELDS = [...SOCIAL_STAT_FIELDS, 'vk', 'linktree'] as const
const CONTACT_FILTER = CONTACT_FIELDS.map(f => `${f}.not.is.null`).join(',')
// all links shown in the drawer
const SOCIAL_LINKS: { field: string; label: string }[] = [
  { field: 'instagram', label: 'Instagram' },
  { field: 'tiktok', label: 'TikTok' },
  { field: 'twitter', label: 'Twitter' },
  { field: 'discord', label: 'Discord' },
  { field: 'twitch', label: 'Twitch' },
  { field: 'facebook', label: 'Facebook' },
  { field: 'telegram', label: 'Telegram' },
  { field: 'website', label: 'Website' },
  { field: 'vk', label: 'VK' },
  { field: 'linktree', label: 'Linktree' },
]

// ── helpers ──────────────────────────────────────────────────────────────
function fmt(n: unknown): string {
  const v = Number(n)
  if (!n && n !== 0) return '—'
  if (v >= 1_000_000_000_000) return (v / 1_000_000_000_000).toFixed(1) + 'T'
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + 'B'
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M'
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K'
  return v.toLocaleString('tr-TR')
}
function initials(name: unknown): string {
  return String(name ?? '').trim().slice(0, 2).toUpperCase() || '??'
}
function hasValue(v: unknown): boolean {
  const s = String(v ?? '').trim().toLowerCase()
  return !!s && s !== 'nan' && s !== 'null'
}
function sanitizeSearch(s: string): string {
  return s.replace(/[,()%]/g, ' ').trim()
}
function toHref(val: string): string {
  return /^https?:\/\//i.test(val) ? val : `https://${val}`
}
function flag(code: unknown): string {
  const c = String(code ?? '').toUpperCase()
  if (!/^[A-Z]{2}$/.test(c)) return ''
  return String.fromCodePoint(...[...c].map(ch => 0x1f1e6 + ch.charCodeAt(0) - 65))
}
const regionNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['tr'], { type: 'region' }) : null
function countryName(code: string): string {
  try { return regionNames?.of(code.toUpperCase()) ?? code } catch { return code }
}

const AVATAR_PALETTE = [YT_COLOR, 'var(--info)', 'var(--success)', 'var(--orange)', 'var(--rose)', 'var(--primary-ink)', 'var(--teal)', 'var(--orange)']
function colorForName(name: unknown): string {
  const s = String(name ?? '')
  let hash = 0
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

// ── avatar (DB profile_image_url, colored-initials fallback) ────────────
function Avatar({ channelName, src, size }: { channelName: unknown; src?: string; size: number }) {
  const [broken, setBroken] = useState(false)
  const [lastSrc, setLastSrc] = useState(src)
  if (src !== lastSrc) {
    setLastSrc(src)
    setBroken(false)
  }
  const color = colorForName(channelName)
  if (!src || broken) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: tint(color, 13), border: `1px solid ${tint(color, 40)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.32, color: inkOf(color), flexShrink: 0 }}>
        {initials(channelName)}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={String(channelName ?? '')}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `1px solid ${tint(color, 40)}`, backgroundColor: 'var(--card)' }}
    />
  )
}

// ── sortable column header ──────────────────────────────────────────────
function SortableTH({ label, sk, active, dir, onSort }: { label: string; sk: SortKey; active: boolean; dir: SortDir; onSort: (k: SortKey) => void }) {
  return (
    <th onClick={() => onSort(sk)} style={{ ...STH, cursor: 'pointer', userSelect: 'none', color: active ? inkOf(YT_COLOR) : 'var(--muted-foreground)' }}>
      {label} <span style={{ opacity: active ? 1 : 0.3 }}>{active ? (dir === 'desc' ? '↓' : '↑') : '↕'}</span>
    </th>
  )
}

const STH: React.CSSProperties = { backgroundColor: 'color-mix(in srgb, var(--foreground) 2%, transparent)', color: 'var(--muted-foreground)', fontSize: '12.5px', fontWeight: 500, padding: '11px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }
const TD: React.CSSProperties = { padding: '12px 14px', verticalAlign: 'middle' }
const SEL: React.CSSProperties = { backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '7px', padding: '7px 11px', fontSize: '13px', color: 'var(--foreground)', cursor: 'pointer', outline: 'none' }

// ── stats bar card styling ───────────────────────────────────────────────
function statCardStyle(color: string): React.CSSProperties {
  return {
    backgroundColor: 'var(--color-bg-card)',
    boxShadow: 'var(--shadow-card)',
    border: '1px solid var(--color-border-card)',
    borderRadius: '14px',
    padding: '22px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minHeight: '132px',
  }
}
const statValueStyle: React.CSSProperties = { fontSize: '26px', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.15 }
const statSubStyle: React.CSSProperties = { fontSize: '12px', color: 'var(--muted-foreground)' }

function StatCardHeader({ icon, color, label }: { icon: React.ReactNode; color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: tint(color, 13), border: `1px solid ${tint(color, 33)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: inkOf(color), flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', }}>{label}</span>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>{children}</div>
}

// ── detail drawer ────────────────────────────────────────────────────────
function DetailPanel({ row, onClose }: { row: Row; onClose: () => void }) {
  const name = String(row.channel_name ?? '—')
  const avatarSrc = row.profile_image_url ? String(row.profile_image_url) : undefined
  const country = hasValue(row.country) ? String(row.country) : ''
  const links = SOCIAL_LINKS.filter(l => hasValue(row[l.field])).map(l => ({ ...l, value: String(row[l.field]) }))

  const videoStats = [
    { label: 'Uzun Video', value: row.long_video_count != null ? Number(row.long_video_count).toLocaleString('tr-TR') : '—', color: 'var(--foreground)' },
    { label: 'Uzun Video Ort.', value: fmt(row.long_video_avg_views), color: YT_COLOR },
    { label: 'Shorts', value: row.shorts_count != null ? Number(row.shorts_count).toLocaleString('tr-TR') : '—', color: 'var(--foreground)' },
    { label: 'Shorts Ort.', value: fmt(row.shorts_avg_views), color: 'var(--rose)' },
    { label: 'Canlı Yayın', value: row.live_count != null ? Number(row.live_count).toLocaleString('tr-TR') : '—', color: 'var(--foreground)' },
    { label: 'Canlı Ort.', value: fmt(row.live_avg_views), color: 'var(--primary-ink)' },
  ]

  return (
    <div style={{ width: '400px', backgroundColor: 'var(--card)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'fixed', top: 0, right: 0, height: '100vh', zIndex: 1000 }}>
      {/* Header */}
      <div style={{ padding: '18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Avatar key={String(row.id)} channelName={row.channel_name} src={avatarSrc} size={72} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          {country && <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>{flag(country)} {countryName(country)}</div>}
        </div>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', backgroundColor: 'transparent', border: '1px solid var(--border)', color: 'var(--muted-foreground)', cursor: 'pointer', flexShrink: 0 }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Top stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Abone', value: fmt(row.followers), color: 'var(--success)' },
            { label: 'Toplam İzlenme', value: fmt(row.total_views), color: 'var(--info)' },
            { label: 'Toplam Video', value: row.total_videos != null ? Number(row.total_videos).toLocaleString('tr-TR') : '—', color: 'var(--orange)' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: 600, marginBottom: '5px' }}>{s.label}</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: inkOf(s.color) }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Channel link */}
        {!!row.channel_url && (
          <a href={String(row.channel_url)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.3)', color: inkOf(YT_COLOR), fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
            <ExternalLink size={14} /> Kanala Git
          </a>
        )}

        {/* Video stats */}
        <div>
          <SectionLabel>Video İstatistikleri</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {videoStats.map(s => (
              <div key={s.label} style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: 600, marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: inkOf(s.color) }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bio */}
        {hasValue(row.bio) && (
          <div>
            <SectionLabel>Bio</SectionLabel>
            <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{String(row.bio)}</div>
          </div>
        )}

        {/* Email */}
        <div>
          <SectionLabel>Email</SectionLabel>
          {hasValue(row.email) ? (
            <a href={`mailto:${row.email}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--info)', textDecoration: 'none', wordBreak: 'break-all' }}>
              <Mail size={13} style={{ flexShrink: 0 }} /> {String(row.email)}
            </a>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>Email yok</div>
          )}
        </div>

        {/* Social links */}
        <div>
          <SectionLabel>Sosyal Medya</SectionLabel>
          {links.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {links.map(l => (
                <a key={l.field} href={toHref(l.value)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--info)', textDecoration: 'none', padding: '5px 0', overflow: 'hidden' }}>
                  <Globe size={13} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: 'var(--muted-foreground)' }}>{l.label}: </span>{l.value}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>Sosyal medya bilgisi yok</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────
export default function YouTubePage() {
  const [rows, setRows] = useState<Row[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Row | null>(null)
  const [page, setPage] = useState(1)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [socialOnly, setSocialOnly] = useState(false)
  const [emailOnly, setEmailOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('followers')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // aux data (lightweight columns, whole table) — powers stats bar + country list
  const [auxRows, setAuxRows] = useState<AuxRow[]>([])
  const [contactCount, setContactCount] = useState(0)
  const [emailCount, setEmailCount] = useState(0)
  const [auxError, setAuxError] = useState<string | null>(null)
  const [auxLoading, setAuxLoading] = useState(true)

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearch(sanitizeSearch(searchInput)), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createSupabaseBrowserClient()
      const [total, contact, email] = await Promise.all([
        supabase.from(TABLE).select('*', { count: 'exact', head: true }),
        supabase.from(TABLE).select('*', { count: 'exact', head: true }).or(CONTACT_FILTER),
        supabase.from(TABLE).select('*', { count: 'exact', head: true }).not('email', 'is', null),
      ])
      const count = total.count
      const batchSize = 1000
      const batches = Array.from({ length: Math.ceil((count ?? 0) / batchSize) }, (_, i) =>
        supabase.from(TABLE).select('followers, country').order('id').range(i * batchSize, (i + 1) * batchSize - 1)
      )
      const results = await Promise.all(batches)
      if (cancelled) return
      const firstError = [total, contact, email, ...results].find(r => r.error)?.error
      setAuxError(firstError ? firstError.message : null)
      setAuxRows(results.flatMap(r => (r.data ?? []) as AuxRow[]))
      setContactCount(contact.count ?? 0)
      setEmailCount(email.count ?? 0)
      setAuxLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  const filterSig = `${search}|${country}|${socialOnly}|${emailOnly}|${sortKey}|${sortDir}`
  const prevSigRef = useRef(filterSig)

  useEffect(() => {
    const sigChanged = prevSigRef.current !== filterSig
    if (sigChanged && page !== 1) {
      prevSigRef.current = filterSig
      setPage(1)
      return
    }
    prevSigRef.current = filterSig

    let cancelled = false
    setLoading(true)
    ;(async () => {
      const supabase = createSupabaseBrowserClient()
      let query = supabase.from(TABLE).select('*', { count: 'exact' })
      if (search) query = query.ilike('channel_name', `%${search}%`)
      if (country) query = query.eq('country', country)
      if (socialOnly) query = query.or(SOCIAL_FILTER)
      if (emailOnly) query = query.not('email', 'is', null)
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      query = query.order(sortKey, { ascending: sortDir === 'asc', nullsFirst: false }).order('id').range(from, to)
      const { data, count, error } = await query
      if (cancelled) return
      setLoadError(error ? error.message : null)
      setRows(error || !data ? [] : (data as Row[]))
      setTotalCount(count ?? 0)
      setLoading(false)
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, country, socialOnly, emailOnly, sortKey, sortDir, page])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const stats = useMemo(() => {
    const totalFollowers = auxRows.reduce((s, r) => s + (Number(r.followers) || 0), 0)
    return { totalChannels: auxRows.length, totalFollowers }
  }, [auxRows])

  // countries sorted by channel count
  const countryOptions = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of auxRows) {
      if (!hasValue(r.country)) continue
      const c = String(r.country)
      counts.set(c, (counts.get(c) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [auxRows])

  const pct = (n: number) => (auxLoading || stats.totalChannels === 0 ? '—' : `%${Math.round((n / stats.totalChannels) * 100)} kapsam`)

  const hasFilters = !!(search || country || socialOnly || emailOnly)
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const from = (page - 1) * PAGE_SIZE
  const rangeStart = totalCount === 0 ? 0 : from + 1
  const rangeEnd = Math.min(from + PAGE_SIZE, totalCount)
  const rangeLabel = totalCount === 0 ? '0 kanal' : `${rangeStart.toLocaleString('tr-TR')} - ${rangeEnd.toLocaleString('tr-TR')} / ${totalCount.toLocaleString('tr-TR')} kanal`

  const pageNumbers = useMemo(() => {
    const windowSize = 5
    let start = Math.max(1, page - Math.floor(windowSize / 2))
    const end = Math.min(totalPages, start + windowSize - 1)
    start = Math.max(1, Math.min(start, end - windowSize + 1))
    const arr: number[] = []
    for (let i = start; i <= end; i++) arr.push(i)
    return arr
  }, [page, totalPages])

  return (
    <div>
      <PageHeader title="YouTube Kanalları" subtitle={auxLoading ? '…' : `${stats.totalChannels.toLocaleString('tr-TR')} kanal takip ediliyor`} imageSrc="/icons/youtube.png" gradient="linear-gradient(135deg, #ff4444, #cc0000)" />

      <div style={{ padding: '24px 32px' }}>
        {auxError && (
          <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', border: '1px solid color-mix(in srgb, var(--danger) 40%, transparent)', backgroundColor: 'color-mix(in srgb, var(--danger) 8%, transparent)', color: 'var(--danger)', fontSize: '13px' }}>
            İstatistikler yüklenemedi: {auxError}
          </div>
        )}
        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={statCardStyle(YT_COLOR)}>
            <StatCardHeader icon={<Users size={17} />} color={YT_COLOR} label="Toplam Kanal" />
            <div style={statValueStyle}>{auxLoading ? '…' : stats.totalChannels.toLocaleString('tr-TR')}</div>
            <div style={statSubStyle}>Takip edilen kanal</div>
          </div>

          <div style={statCardStyle('var(--orange)')}>
            <StatCardHeader icon={<Mail size={17} />} color="var(--warning)" label="Email Olan" />
            <div style={statValueStyle}>{auxLoading ? '…' : emailCount.toLocaleString('tr-TR')}</div>
            <div style={statSubStyle}>{pct(emailCount)}</div>
          </div>

          <div style={statCardStyle('var(--rose)')}>
            <StatCardHeader icon={<Contact size={17} />} color="#BE185D" label="En Az 1 İletişim Olan" />
            <div style={statValueStyle}>{auxLoading ? '…' : contactCount.toLocaleString('tr-TR')}</div>
            <div style={statSubStyle}>{pct(contactCount)}</div>
          </div>

          <div style={statCardStyle('var(--info)')}>
            <StatCardHeader icon={<Flag size={17} />} color="var(--info)" label="Ülke Sayısı" />
            <div style={statValueStyle}>{auxLoading ? '…' : countryOptions.length.toLocaleString('tr-TR')}</div>
            <div style={statSubStyle}>Farklı ülke</div>
          </div>

          <div style={statCardStyle('var(--success)')}>
            <StatCardHeader icon={<TrendingUp size={17} />} color="var(--success)" label="Toplam Abone" />
            <div style={statValueStyle}>{auxLoading ? '…' : fmt(stats.totalFollowers)}</div>
            <div style={statSubStyle}>Tüm kanallar toplamı</div>
          </div>
        </div>

        {/* Table card */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '12px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Kanal adı ara..." style={{ ...SEL, paddingLeft: '30px', width: '100%', boxSizing: 'border-box' }} />
            </div>
            <select value={country} onChange={e => setCountry(e.target.value)} style={SEL}>
              <option value="">Tüm Ülkeler</option>
              {countryOptions.map(([code, n]) => (
                <option key={code} value={code}>{flag(code)} {countryName(code)} ({n.toLocaleString('tr-TR')})</option>
              ))}
            </select>
            <button
              onClick={() => setSocialOnly(v => !v)}
              style={{ padding: '7px 14px', borderRadius: '7px', border: `1px solid ${socialOnly ? 'color-mix(in srgb, var(--rose) 50%, transparent)' : 'var(--border)'}`, backgroundColor: socialOnly ? 'color-mix(in srgb, var(--rose) 10%, transparent)' : 'transparent', color: socialOnly ? 'var(--rose)' : 'var(--muted-foreground)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Link2 size={14} aria-hidden /> Sosyal Medya Var
            </button>
            <button
              onClick={() => setEmailOnly(v => !v)}
              style={{ padding: '7px 14px', borderRadius: '7px', border: `1px solid ${emailOnly ? 'color-mix(in srgb, var(--warning) 50%, transparent)' : 'var(--border)'}`, backgroundColor: emailOnly ? 'color-mix(in srgb, var(--warning) 10%, transparent)' : 'transparent', color: emailOnly ? 'var(--orange)' : 'var(--muted-foreground)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Mail size={14} aria-hidden /> Email Var
            </button>
            {hasFilters && (
              <button onClick={() => { setSearchInput(''); setSearch(''); setCountry(''); setSocialOnly(false); setEmailOnly(false) }} style={{ fontSize: '12px', color: 'var(--muted-foreground)', background: 'none', border: '1px solid var(--border)', borderRadius: '7px', padding: '7px 12px', cursor: 'pointer' }}>
                Temizle
              </button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{rangeLabel}</span>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...STH, width: '46px' }}></th>
                  <SortableTH label="Kanal" sk="channel_name" active={sortKey === 'channel_name'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Abone" sk="followers" active={sortKey === 'followers'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Ülke" sk="country" active={sortKey === 'country'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Toplam İzlenme" sk="total_views" active={sortKey === 'total_views'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Uzun Video Ort. İzlenme" sk="long_video_avg_views" active={sortKey === 'long_video_avg_views'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Shorts Ort. İzlenme" sk="shorts_avg_views" active={sortKey === 'shorts_avg_views'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Canlı Yayın Ort. İzlenme" sk="live_avg_views" active={sortKey === 'live_avg_views'} dir={sortDir} onSort={handleSort} />
                  <th style={STH}>Email</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '14px' }}>Yükleniyor...</td></tr>
                ) : loadError ? (
                  <tr><td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: 'var(--danger)', fontSize: '14px' }}>Veri yüklenemedi: {loadError}</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '14px' }}>{hasFilters ? 'Eşleşen kanal bulunamadı' : 'Henüz kanal eklenmemiş'}</td></tr>
                ) : rows.map((row, i) => {
                  const isActive = selected?.id === row.id
                  const c = hasValue(row.country) ? String(row.country) : ''
                  return (
                    <tr
                      key={String(row.id ?? i)}
                      onClick={() => setSelected(isActive ? null : row)}
                      style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', backgroundColor: isActive ? 'rgba(255,68,68,0.06)' : i % 2 === 1 ? 'var(--row)' : 'transparent', cursor: 'pointer' }}
                    >
                      <td style={{ ...TD, paddingRight: '8px' }}>
                        <Avatar channelName={row.channel_name} src={row.profile_image_url ? String(row.profile_image_url) : undefined} size={32} />
                      </td>
                      <td style={{ ...TD, maxWidth: '300px' }}>
                        <a
                          href={row.channel_url ? String(row.channel_url) : undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ fontWeight: 700, fontSize: '13px', color: inkOf(YT_COLOR), textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {String(row.channel_name ?? '—')}
                        </a>
                      </td>
                      <td style={TD}><span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '13px' }}>{fmt(row.followers)}</span></td>
                      <td style={TD}>
                        {c
                          ? <span style={{ fontSize: '13px', color: 'var(--text-2)', whiteSpace: 'nowrap' }} title={countryName(c)}>{flag(c)} {c}</span>
                          : <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                      </td>
                      <td style={TD}><span style={{ color: 'var(--info)', fontWeight: 600, fontSize: '13px' }}>{fmt(row.total_views)}</span></td>
                      <td style={TD}><span style={{ color: inkOf(YT_COLOR), fontWeight: 600, fontSize: '13px' }}>{fmt(row.long_video_avg_views)}</span></td>
                      <td style={TD}><span style={{ color: 'var(--rose)', fontWeight: 600, fontSize: '13px' }}>{fmt(row.shorts_avg_views)}</span></td>
                      <td style={TD}><span style={{ color: 'var(--primary-ink)', fontWeight: 600, fontSize: '13px' }}>{fmt(row.live_avg_views)}</span></td>
                      <td style={{ ...TD, maxWidth: '200px' }} onClick={e => e.stopPropagation()}>
                        {hasValue(row.email)
                          ? <a href={`mailto:${row.email}`} style={{ color: 'var(--info)', fontSize: '12px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(row.email)}</a>
                          : <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--border)', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{rangeLabel}</span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: page <= 1 ? 'var(--muted-foreground)' : 'var(--text-2)', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={14} />
              </button>
              {pageNumbers[0] > 1 && <span style={{ color: 'var(--muted-foreground)', fontSize: '12px', padding: '0 4px' }}>…</span>}
              {pageNumbers.map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  style={{ minWidth: '30px', height: '30px', borderRadius: '7px', border: `1px solid ${n === page ? YT_COLOR : 'var(--border)'}`, backgroundColor: n === page ? 'rgba(255,68,68,0.15)' : 'transparent', color: n === page ? inkOf(YT_COLOR) : 'var(--text-2)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '0 6px' }}
                >
                  {n}
                </button>
              ))}
              {pageNumbers[pageNumbers.length - 1] < totalPages && <span style={{ color: 'var(--muted-foreground)', fontSize: '12px', padding: '0 4px' }}>…</span>}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: page >= totalPages ? 'var(--muted-foreground)' : 'var(--text-2)', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Overlay + drawer */}
        <SlideDrawer item={selected} onClose={() => setSelected(null)}>
          {(row) => <DetailPanel row={row} onClose={() => setSelected(null)} />}
        </SlideDrawer>
      </div>
    </div>
  )
}
