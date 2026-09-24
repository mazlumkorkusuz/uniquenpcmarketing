'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import PageHeader from '@/components/PageHeader'
import { Search, X, ExternalLink, Globe, ChevronLeft, ChevronRight, Users, Contact, Flag, TrendingUp } from 'lucide-react'

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

const AVATAR_PALETTE = [YT_COLOR, '#60a5fa', '#4ade80', '#fbbf24', '#f472b6', '#a78bfa', '#22d3ee', '#fb923c']
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
      <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: color + '22', border: `1px solid ${color}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.32, color, flexShrink: 0 }}>
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
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `1px solid ${color}66`, backgroundColor: '#1a1a24' }}
    />
  )
}

// ── sortable column header ──────────────────────────────────────────────
function SortableTH({ label, sk, active, dir, onSort }: { label: string; sk: SortKey; active: boolean; dir: SortDir; onSort: (k: SortKey) => void }) {
  return (
    <th onClick={() => onSort(sk)} style={{ ...STH, cursor: 'pointer', userSelect: 'none', color: active ? YT_COLOR : '#64748b' }}>
      {label} <span style={{ opacity: active ? 1 : 0.3 }}>{active ? (dir === 'desc' ? '↓' : '↑') : '↕'}</span>
    </th>
  )
}

const STH: React.CSSProperties = { backgroundColor: '#13131a', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '11px 14px', textAlign: 'left', borderBottom: '1px solid #2a2a3a', whiteSpace: 'nowrap' }
const TD: React.CSSProperties = { padding: '12px 14px', verticalAlign: 'middle' }
const SEL: React.CSSProperties = { backgroundColor: '#13131a', border: '1px solid #2a2a3a', borderRadius: '7px', padding: '7px 11px', fontSize: '13px', color: '#e2e8f0', cursor: 'pointer', outline: 'none' }

// ── stats bar card styling ───────────────────────────────────────────────
function statCardStyle(color: string): React.CSSProperties {
  return {
    backgroundColor: '#1a1a24',
    backgroundImage: `linear-gradient(135deg, ${color}1c, transparent 65%)`,
    border: `1px solid ${color}33`,
    borderRadius: '14px',
    padding: '22px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minHeight: '132px',
  }
}
const statValueStyle: React.CSSProperties = { fontSize: '26px', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.15 }
const statSubStyle: React.CSSProperties = { fontSize: '12px', color: '#64748b' }

function StatCardHeader({ icon, color, label }: { icon: React.ReactNode; color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: color + '22', border: `1px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{children}</div>
}

// ── detail drawer ────────────────────────────────────────────────────────
function DetailPanel({ row, onClose }: { row: Row; onClose: () => void }) {
  const name = String(row.channel_name ?? '—')
  const avatarSrc = row.profile_image_url ? String(row.profile_image_url) : undefined
  const country = hasValue(row.country) ? String(row.country) : ''
  const links = SOCIAL_LINKS.filter(l => hasValue(row[l.field])).map(l => ({ ...l, value: String(row[l.field]) }))

  const videoStats = [
    { label: 'Uzun Video', value: row.long_video_count != null ? Number(row.long_video_count).toLocaleString('tr-TR') : '—', color: '#f1f5f9' },
    { label: 'Uzun Video Ort.', value: fmt(row.long_video_avg_views), color: YT_COLOR },
    { label: 'Shorts', value: row.shorts_count != null ? Number(row.shorts_count).toLocaleString('tr-TR') : '—', color: '#f1f5f9' },
    { label: 'Shorts Ort.', value: fmt(row.shorts_avg_views), color: '#f472b6' },
    { label: 'Canlı Yayın', value: row.live_count != null ? Number(row.live_count).toLocaleString('tr-TR') : '—', color: '#f1f5f9' },
    { label: 'Canlı Ort.', value: fmt(row.live_avg_views), color: '#a78bfa' },
  ]

  return (
    <div style={{ width: '400px', backgroundColor: '#13131a', borderLeft: '1px solid #2a2a3a', display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'fixed', top: 0, right: 0, height: '100vh', zIndex: 1000 }}>
      {/* Header */}
      <div style={{ padding: '18px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Avatar key={String(row.id)} channelName={row.channel_name} src={avatarSrc} size={72} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          {country && <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{flag(country)} {countryName(country)}</div>}
        </div>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', backgroundColor: 'transparent', border: '1px solid #2a2a3a', color: '#64748b', cursor: 'pointer', flexShrink: 0 }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Top stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Abone', value: fmt(row.followers), color: '#4ade80' },
            { label: 'Toplam İzlenme', value: fmt(row.total_views), color: '#60a5fa' },
            { label: 'Toplam Video', value: row.total_videos != null ? Number(row.total_videos).toLocaleString('tr-TR') : '—', color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>{s.label}</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Channel link */}
        {!!row.channel_url && (
          <a href={String(row.channel_url)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.3)', color: YT_COLOR, fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
            <ExternalLink size={14} /> Kanala Git
          </a>
        )}

        {/* Video stats */}
        <div>
          <SectionLabel>Video İstatistikleri</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {videoStats.map(s => (
              <div key={s.label} style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bio */}
        {hasValue(row.bio) && (
          <div>
            <SectionLabel>Bio</SectionLabel>
            <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{String(row.bio)}</div>
          </div>
        )}

        {/* Social links */}
        <div>
          <SectionLabel>Sosyal Medya</SectionLabel>
          {links.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {links.map(l => (
                <a key={l.field} href={toHref(l.value)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#60a5fa', textDecoration: 'none', padding: '5px 0', overflow: 'hidden' }}>
                  <Globe size={13} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: '#64748b' }}>{l.label}: </span>{l.value}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: '#64748b' }}>Sosyal medya bilgisi yok</div>
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
  const [selected, setSelected] = useState<Row | null>(null)
  const [page, setPage] = useState(1)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [socialOnly, setSocialOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('followers')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // aux data (lightweight columns, whole table) — powers stats bar + country list
  const [auxRows, setAuxRows] = useState<AuxRow[]>([])
  const [contactCount, setContactCount] = useState(0)
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
      const [{ count }, contact] = await Promise.all([
        supabase.from(TABLE).select('*', { count: 'exact', head: true }),
        supabase.from(TABLE).select('*', { count: 'exact', head: true }).or(CONTACT_FILTER),
      ])
      const batchSize = 1000
      const batches = Array.from({ length: Math.ceil((count ?? 0) / batchSize) }, (_, i) =>
        supabase.from(TABLE).select('followers, country').order('id').range(i * batchSize, (i + 1) * batchSize - 1)
      )
      const results = await Promise.all(batches)
      if (cancelled) return
      setAuxRows(results.flatMap(r => (r.data ?? []) as AuxRow[]))
      setContactCount(contact.count ?? 0)
      setAuxLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  const filterSig = `${search}|${country}|${socialOnly}|${sortKey}|${sortDir}`
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
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      query = query.order(sortKey, { ascending: sortDir === 'asc', nullsFirst: false }).order('id').range(from, to)
      const { data, count, error } = await query
      if (cancelled) return
      setRows(error || !data ? [] : (data as Row[]))
      setTotalCount(count ?? 0)
      setLoading(false)
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, country, socialOnly, sortKey, sortDir, page])

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

  const hasFilters = !!(search || country || socialOnly)
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
        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={statCardStyle(YT_COLOR)}>
            <StatCardHeader icon={<Users size={17} />} color={YT_COLOR} label="Toplam Kanal" />
            <div style={statValueStyle}>{auxLoading ? '…' : stats.totalChannels.toLocaleString('tr-TR')}</div>
            <div style={statSubStyle}>Takip edilen kanal</div>
          </div>

          <div style={statCardStyle('#f472b6')}>
            <StatCardHeader icon={<Contact size={17} />} color="#f472b6" label="En Az 1 İletişim Olan" />
            <div style={statValueStyle}>{auxLoading ? '…' : contactCount.toLocaleString('tr-TR')}</div>
            <div style={statSubStyle}>{pct(contactCount)}</div>
          </div>

          <div style={statCardStyle('#60a5fa')}>
            <StatCardHeader icon={<Flag size={17} />} color="#60a5fa" label="Ülke Sayısı" />
            <div style={statValueStyle}>{auxLoading ? '…' : countryOptions.length.toLocaleString('tr-TR')}</div>
            <div style={statSubStyle}>Farklı ülke</div>
          </div>

          <div style={statCardStyle('#4ade80')}>
            <StatCardHeader icon={<TrendingUp size={17} />} color="#4ade80" label="Toplam Abone" />
            <div style={statValueStyle}>{auxLoading ? '…' : fmt(stats.totalFollowers)}</div>
            <div style={statSubStyle}>Tüm kanallar toplamı</div>
          </div>
        </div>

        {/* Table card */}
        <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '12px 20px', borderBottom: '1px solid #2a2a3a', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Kanal adı ara..." style={{ ...SEL, paddingLeft: '30px', width: '100%', boxSizing: 'border-box' }} />
            </div>
            <select value={country} onChange={e => setCountry(e.target.value)} style={SEL}>
              <option value="">🌍 Tüm Ülkeler</option>
              {countryOptions.map(([code, n]) => (
                <option key={code} value={code}>{flag(code)} {countryName(code)} ({n.toLocaleString('tr-TR')})</option>
              ))}
            </select>
            <button
              onClick={() => setSocialOnly(v => !v)}
              style={{ padding: '7px 14px', borderRadius: '7px', border: `1px solid ${socialOnly ? 'rgba(244,114,182,0.5)' : '#2a2a3a'}`, backgroundColor: socialOnly ? 'rgba(244,114,182,0.1)' : 'transparent', color: socialOnly ? '#f472b6' : '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              🔗 Sosyal Medya Var
            </button>
            {hasFilters && (
              <button onClick={() => { setSearchInput(''); setSearch(''); setCountry(''); setSocialOnly(false) }} style={{ fontSize: '12px', color: '#64748b', background: 'none', border: '1px solid #2a2a3a', borderRadius: '7px', padding: '7px 12px', cursor: 'pointer' }}>
                Temizle
              </button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>{rangeLabel}</span>
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
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>Yükleniyor...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>{hasFilters ? 'Eşleşen kanal bulunamadı' : 'Henüz kanal eklenmemiş'}</td></tr>
                ) : rows.map((row, i) => {
                  const isActive = selected?.id === row.id
                  const c = hasValue(row.country) ? String(row.country) : ''
                  return (
                    <tr
                      key={String(row.id ?? i)}
                      onClick={() => setSelected(isActive ? null : row)}
                      style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(42,42,58,0.6)' : 'none', backgroundColor: isActive ? 'rgba(255,68,68,0.06)' : i % 2 === 1 ? 'rgba(255,255,255,0.012)' : 'transparent', cursor: 'pointer' }}
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
                          style={{ fontWeight: 700, fontSize: '13px', color: YT_COLOR, textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {String(row.channel_name ?? '—')}
                        </a>
                      </td>
                      <td style={TD}><span style={{ color: '#4ade80', fontWeight: 600, fontSize: '13px' }}>{fmt(row.followers)}</span></td>
                      <td style={TD}>
                        {c
                          ? <span style={{ fontSize: '13px', color: '#cbd5e1', whiteSpace: 'nowrap' }} title={countryName(c)}>{flag(c)} {c}</span>
                          : <span style={{ color: '#64748b' }}>—</span>}
                      </td>
                      <td style={TD}><span style={{ color: '#60a5fa', fontWeight: 600, fontSize: '13px' }}>{fmt(row.total_views)}</span></td>
                      <td style={TD}><span style={{ color: YT_COLOR, fontWeight: 600, fontSize: '13px' }}>{fmt(row.long_video_avg_views)}</span></td>
                      <td style={TD}><span style={{ color: '#f472b6', fontWeight: 600, fontSize: '13px' }}>{fmt(row.shorts_avg_views)}</span></td>
                      <td style={TD}><span style={{ color: '#a78bfa', fontWeight: 600, fontSize: '13px' }}>{fmt(row.live_avg_views)}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #2a2a3a', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>{rangeLabel}</span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', border: '1px solid #2a2a3a', backgroundColor: 'transparent', color: page <= 1 ? '#3a3a4a' : '#94a3b8', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={14} />
              </button>
              {pageNumbers[0] > 1 && <span style={{ color: '#64748b', fontSize: '12px', padding: '0 4px' }}>…</span>}
              {pageNumbers.map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  style={{ minWidth: '30px', height: '30px', borderRadius: '7px', border: `1px solid ${n === page ? YT_COLOR : '#2a2a3a'}`, backgroundColor: n === page ? 'rgba(255,68,68,0.15)' : 'transparent', color: n === page ? YT_COLOR : '#94a3b8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '0 6px' }}
                >
                  {n}
                </button>
              ))}
              {pageNumbers[pageNumbers.length - 1] < totalPages && <span style={{ color: '#64748b', fontSize: '12px', padding: '0 4px' }}>…</span>}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', border: '1px solid #2a2a3a', backgroundColor: 'transparent', color: page >= totalPages ? '#3a3a4a' : '#94a3b8', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Overlay + drawer */}
        {selected && (
          <>
            <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }} />
            <DetailPanel row={selected} onClose={() => setSelected(null)} />
          </>
        )}
      </div>
    </div>
  )
}
