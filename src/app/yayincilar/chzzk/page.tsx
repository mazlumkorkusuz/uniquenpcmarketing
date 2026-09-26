'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import PageHeader from '@/components/PageHeader'
import { Search, X, ExternalLink, Mail, Globe, ChevronLeft, ChevronRight, Users, Share2, TrendingUp, Radio } from 'lucide-react'
import { inkOf } from '@/lib/theme'
import SlideDrawer from '@/components/motion/SlideDrawer'

type Row = Record<string, unknown>
type SortKey = 'channel_name' | 'followers' | 'avg_viewers' | 'live_avg_viewers' | 'stream_count_30d'
type SortDir = 'asc' | 'desc'
type AuxRow = {
  followers: number | null
  email: string | null
  youtube: string | null
  instagram: string | null
  twitter: string | null
  discord: string | null
  facebook: string | null
  naver: string | null
}

const PAGE_SIZE = 350
const CHZZK_COLOR = '#00d4aa'
const SOCIAL_FIELDS = ['youtube', 'instagram', 'twitter', 'discord', 'facebook', 'naver'] as const

// ── helpers ──────────────────────────────────────────────────────────────
function fmt(n: unknown): string {
  const v = Number(n)
  if (!n && n !== 0) return '—'
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
function splitLinks(val: unknown): string[] {
  return String(val ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}
function toHref(val: string, prefix: string): string {
  return val.startsWith('http') ? val : `${prefix}${val}`
}

const AVATAR_PALETTE = [CHZZK_COLOR, '#1D4ED8', '#047857', '#B45309', '#BE185D', '#B91C1C', '#4CCCE6', '#4338CA']
function colorForName(name: unknown): string {
  const s = String(name ?? '')
  let hash = 0
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

// ── avatar (DB profile_image_url only, colored-initials fallback) ───────
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
      <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: color + '22', border: `1px solid ${color}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.32, color: inkOf(color), flexShrink: 0 }}>
        {initials(channelName)}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={String(channelName ?? '')}
      onError={() => setBroken(true)}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `1px solid ${color}66`, backgroundColor: '#FFFFFF' }}
    />
  )
}

// ── sortable column header ──────────────────────────────────────────────
function SortableTH({ label, sk, active, dir, onSort }: { label: string; sk: SortKey; active: boolean; dir: SortDir; onSort: (k: SortKey) => void }) {
  return (
    <th onClick={() => onSort(sk)} style={{ ...STH, cursor: 'pointer', userSelect: 'none', color: active ? inkOf(CHZZK_COLOR) : '#655F7D' }}>
      {label} <span style={{ opacity: active ? 1 : 0.3 }}>{active ? (dir === 'desc' ? '↓' : '↑') : '↕'}</span>
    </th>
  )
}

const STH: React.CSSProperties = { backgroundColor: 'rgba(23,18,43,0.02)', color: '#655F7D', fontSize: '12.5px', fontWeight: 500, padding: '11px 14px', textAlign: 'left', borderBottom: '1px solid #E8E4F1', whiteSpace: 'nowrap' }
const TD: React.CSSProperties = { padding: '12px 14px', verticalAlign: 'middle' }
const SEL: React.CSSProperties = { backgroundColor: '#FFFFFF', border: '1px solid #E8E4F1', borderRadius: '7px', padding: '7px 11px', fontSize: '13px', color: '#17122B', cursor: 'pointer', outline: 'none' }

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
const statValueStyle: React.CSSProperties = { fontSize: '26px', fontWeight: 800, color: '#17122B', lineHeight: 1.15 }
const statSubStyle: React.CSSProperties = { fontSize: '12px', color: '#655F7D' }

function StatCardHeader({ icon, color, label }: { icon: React.ReactNode; color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: color + '22', border: `1px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: inkOf(color), flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#4A4462', }}>{label}</span>
    </div>
  )
}

function ContactRow({ href, icon, label }: { href?: string; icon: React.ReactNode; label: string }) {
  const content = (
    <>
      <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </>
  )
  if (!href) {
    return <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#4A4462', padding: '5px 0', overflow: 'hidden' }}>{content}</div>
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1D4ED8', textDecoration: 'none', padding: '5px 0', overflow: 'hidden' }}>
      {content}
    </a>
  )
}

// ── detail drawer ────────────────────────────────────────────────────────
function DetailPanel({ row, onClose }: { row: Row; onClose: () => void }) {
  const name = String(row.channel_name ?? '—')
  const avatarSrc = row.profile_image_url ? String(row.profile_image_url) : undefined

  type Contact = { href?: string; icon: React.ReactNode; label: string }
  const contacts: Contact[] = []
  if (hasValue(row.email)) contacts.push({ href: `mailto:${row.email}`, icon: <Mail size={13} />, label: String(row.email) })

  const socialMeta: Record<(typeof SOCIAL_FIELDS)[number], { prefix: string; label: string }> = {
    youtube: { prefix: 'https://youtube.com/', label: 'YouTube' },
    instagram: { prefix: 'https://instagram.com/', label: 'Instagram' },
    twitter: { prefix: 'https://twitter.com/', label: 'Twitter' },
    discord: { prefix: '', label: 'Discord' },
    facebook: { prefix: 'https://facebook.com/', label: 'Facebook' },
    naver: { prefix: '', label: 'Naver' },
  }
  for (const field of SOCIAL_FIELDS) {
    if (!hasValue(row[field])) continue
    const { prefix, label } = socialMeta[field]
    for (const val of splitLinks(row[field])) {
      const href = val.startsWith('http') ? val : prefix ? toHref(val, prefix) : undefined
      contacts.push({ href, icon: <Globe size={13} />, label: `${label}: ${val}` })
    }
  }
  if (hasValue(row.other_links)) {
    for (const val of splitLinks(row.other_links)) {
      contacts.push({ href: val.startsWith('http') ? val : undefined, icon: <ExternalLink size={13} />, label: val })
    }
  }

  return (
    <div style={{ width: '380px', backgroundColor: '#FFFFFF', borderLeft: '1px solid #E8E4F1', display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'fixed', top: 0, right: 0, height: '100vh', zIndex: 1000 }}>
      {/* Header */}
      <div style={{ padding: '18px', borderBottom: '1px solid #E8E4F1', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Avatar key={String(row.id)} channelName={row.channel_name} src={avatarSrc} size={64} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#17122B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        </div>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', backgroundColor: 'transparent', border: '1px solid #E8E4F1', color: '#655F7D', cursor: 'pointer', flexShrink: 0 }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Takipçi', value: fmt(row.followers), color: '#046C4E' },
            { label: 'Ort. İzleyici', value: fmt(row.avg_viewers), color: CHZZK_COLOR },
            { label: 'Canlı Ort. İzleyici', value: fmt(row.live_avg_viewers), color: '#6D28D9' },
            { label: '30g Yayın Sayısı', value: row.stream_count_30d != null ? String(row.stream_count_30d) : '—', color: '#A24B08' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E4F1', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '10px', color: '#655F7D', fontWeight: 600, marginBottom: '5px' }}>{s.label}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: inkOf(s.color) }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Channel link */}
        {!!row.channel_url && (
          <a href={String(row.channel_url)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.3)', color: inkOf(CHZZK_COLOR), fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
            <ExternalLink size={14} /> Kanala Git
          </a>
        )}

        {/* Bio */}
        {!!row.bio && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#655F7D', marginBottom: '8px' }}>Bio</div>
            <div style={{ fontSize: '13px', color: '#4A4462', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{String(row.bio)}</div>
          </div>
        )}

        {/* Contacts */}
        {contacts.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#655F7D', marginBottom: '8px' }}>İletişim &amp; Sosyal</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {contacts.map((c, i) => <ContactRow key={i} {...c} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────
export default function ChzzkPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Row | null>(null)
  const [page, setPage] = useState(1)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [emailOnly, setEmailOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('followers')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // aux data (lightweight columns, whole table) — powers stats bar
  const [auxRows, setAuxRows] = useState<AuxRow[]>([])
  const [auxLoading, setAuxLoading] = useState(true)

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearch(sanitizeSearch(searchInput)), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    async function loadAux() {
      const supabase = createSupabaseBrowserClient()
      let all: AuxRow[] = []
      let from = 0
      const batchSize = 1000
      while (true) {
        const { data, error } = await supabase
          .from('chzzk_streamers')
          .select('followers, email, youtube, instagram, twitter, discord, facebook, naver')
          .range(from, from + batchSize - 1)
        if (error || !data || data.length === 0) break
        all = [...all, ...(data as AuxRow[])]
        if (data.length < batchSize) break
        from += batchSize
      }
      if (!cancelled) { setAuxRows(all); setAuxLoading(false) }
    }
    loadAux()
    return () => { cancelled = true }
  }, [])

  const filterSig = `${search}|${emailOnly}|${sortKey}|${sortDir}`
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
      let query = supabase.from('chzzk_streamers').select('*', { count: 'exact' })
      if (search) query = query.ilike('channel_name', `%${search}%`)
      if (emailOnly) query = query.not('email', 'is', null)
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      query = query.order(sortKey, { ascending: sortDir === 'asc', nullsFirst: false }).range(from, to)
      const { data, count, error } = await query
      if (cancelled) return
      setRows(error || !data ? [] : (data as Row[]))
      setTotalCount(count ?? 0)
      setLoading(false)
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, emailOnly, sortKey, sortDir, page])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const stats = useMemo(() => {
    const totalStreamers = auxRows.length
    const totalFollowers = auxRows.reduce((s, r) => s + (Number(r.followers) || 0), 0)
    const emailCount = auxRows.filter(r => hasValue(r.email)).length
    const anySocialCount = auxRows.filter(r => SOCIAL_FIELDS.some(f => hasValue(r[f]))).length
    const avgFollowers = totalStreamers > 0 ? totalFollowers / totalStreamers : 0
    return { totalStreamers, totalFollowers, emailCount, anySocialCount, avgFollowers }
  }, [auxRows])

  const hasFilters = !!(search || emailOnly)
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const from = (page - 1) * PAGE_SIZE
  const rangeStart = totalCount === 0 ? 0 : from + 1
  const rangeEnd = Math.min(from + PAGE_SIZE, totalCount)

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
      <PageHeader title="Chzzk Yayıncıları" subtitle="Yayıncı takip ve analizi" imageSrc="/icons/chzzk.png" gradient="linear-gradient(135deg, #00d4aa, #009975)" />

      <div style={{ padding: '24px 32px' }}>
        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={statCardStyle(CHZZK_COLOR)}>
            <StatCardHeader icon={<Users size={17} />} color={CHZZK_COLOR} label="Toplam Yayıncı" />
            <div style={statValueStyle}>{auxLoading ? '…' : stats.totalStreamers.toLocaleString('tr-TR')}</div>
            <div style={statSubStyle}>Takip edilen kanal</div>
          </div>

          <div style={statCardStyle('#047857')}>
            <StatCardHeader icon={<TrendingUp size={17} />} color="#047857" label="Toplam Takipçi" />
            <div style={statValueStyle}>{auxLoading ? '…' : fmt(stats.totalFollowers)}</div>
            <div style={statSubStyle}>Tüm kanallar toplamı</div>
          </div>

          <div style={statCardStyle('#B45309')}>
            <StatCardHeader icon={<Mail size={17} />} color="#B45309" label="Email Olan" />
            <div style={statValueStyle}>{auxLoading ? '…' : stats.emailCount.toLocaleString('tr-TR')}</div>
            <div style={statSubStyle}>{auxLoading || stats.totalStreamers === 0 ? '—' : `%${Math.round((stats.emailCount / stats.totalStreamers) * 100)} kapsam`}</div>
          </div>

          <div style={statCardStyle('#BE185D')}>
            <StatCardHeader icon={<Share2 size={17} />} color="#BE185D" label="En Az 1 Sosyal Medya Olan" />
            <div style={statValueStyle}>{auxLoading ? '…' : stats.anySocialCount.toLocaleString('tr-TR')}</div>
            <div style={statSubStyle}>{auxLoading || stats.totalStreamers === 0 ? '—' : `%${Math.round((stats.anySocialCount / stats.totalStreamers) * 100)} en az 1 kanal`}</div>
          </div>

          <div style={statCardStyle('#4338CA')}>
            <StatCardHeader icon={<Radio size={17} />} color="#4338CA" label="Ortalama Takipçi" />
            <div style={statValueStyle}>{auxLoading ? '…' : fmt(stats.avgFollowers)}</div>
            <div style={statSubStyle}>Kanal başına ortalama</div>
          </div>
        </div>

        {/* Table card */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '12px 20px', borderBottom: '1px solid #E8E4F1', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#655F7D', pointerEvents: 'none' }} />
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Kanal adı ara..." style={{ ...SEL, paddingLeft: '30px', width: '100%', boxSizing: 'border-box' }} />
            </div>
            <button
              onClick={() => setEmailOnly(v => !v)}
              style={{ padding: '7px 14px', borderRadius: '7px', border: `1px solid ${emailOnly ? 'rgba(251,191,36,0.5)' : '#E8E4F1'}`, backgroundColor: emailOnly ? 'rgba(251,191,36,0.1)' : 'transparent', color: emailOnly ? '#A24B08' : '#655F7D', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Mail size={14} aria-hidden /> Email Var
            </button>
            {hasFilters && (
              <button onClick={() => { setSearchInput(''); setSearch(''); setEmailOnly(false) }} style={{ fontSize: '12px', color: '#655F7D', background: 'none', border: '1px solid #E8E4F1', borderRadius: '7px', padding: '7px 12px', cursor: 'pointer' }}>
                Temizle
              </button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#655F7D', whiteSpace: 'nowrap' }}>
              {totalCount === 0 ? '0 yayıncı' : `${rangeStart.toLocaleString('tr-TR')} - ${rangeEnd.toLocaleString('tr-TR')} / ${totalCount.toLocaleString('tr-TR')} yayıncı`}
            </span>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...STH, width: '46px' }}></th>
                  <SortableTH label="Kanal" sk="channel_name" active={sortKey === 'channel_name'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Takipçi" sk="followers" active={sortKey === 'followers'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Ort. İzleyici" sk="avg_viewers" active={sortKey === 'avg_viewers'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Canlı Ort. İzleyici" sk="live_avg_viewers" active={sortKey === 'live_avg_viewers'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="30g Yayın Sayısı" sk="stream_count_30d" active={sortKey === 'stream_count_30d'} dir={sortDir} onSort={handleSort} />
                  <th style={STH}>Email</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#655F7D', fontSize: '14px' }}>Yükleniyor...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#655F7D', fontSize: '14px' }}>{hasFilters ? 'Eşleşen yayıncı bulunamadı' : 'Henüz yayıncı eklenmemiş'}</td></tr>
                ) : rows.map((row, i) => {
                  const isActive = selected?.id === row.id
                  return (
                    <tr
                      key={String(row.id ?? i)}
                      onClick={() => setSelected(isActive ? null : row)}
                      style={{ borderBottom: i < rows.length - 1 ? '1px solid #E8E4F1' : 'none', backgroundColor: isActive ? 'rgba(0,212,170,0.06)' : i % 2 === 1 ? '#FAF9FD' : 'transparent', cursor: 'pointer' }}
                    >
                      <td style={{ ...TD, paddingRight: '8px' }}>
                        <Avatar channelName={row.channel_name} src={row.profile_image_url ? String(row.profile_image_url) : undefined} size={32} />
                      </td>
                      <td style={TD}>
                        <a
                          href={row.channel_url ? String(row.channel_url) : undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ fontWeight: 700, fontSize: '13px', color: inkOf(CHZZK_COLOR), textDecoration: 'none' }}
                        >
                          {String(row.channel_name ?? '—')}
                        </a>
                      </td>
                      <td style={TD}><span style={{ color: '#046C4E', fontWeight: 600, fontSize: '13px' }}>{fmt(row.followers)}</span></td>
                      <td style={TD}><span style={{ color: inkOf(CHZZK_COLOR), fontWeight: 600, fontSize: '13px' }}>{fmt(row.avg_viewers)}</span></td>
                      <td style={TD}><span style={{ color: '#6D28D9', fontWeight: 600, fontSize: '13px' }}>{fmt(row.live_avg_viewers)}</span></td>
                      <td style={TD}><span style={{ fontSize: '13px', color: '#4A4462' }}>{row.stream_count_30d != null ? String(row.stream_count_30d) : <span style={{ color: '#655F7D' }}>—</span>}</span></td>
                      <td style={{ ...TD, maxWidth: '180px' }} onClick={e => e.stopPropagation()}>
                        {hasValue(row.email)
                          ? <a href={`mailto:${row.email}`} style={{ color: '#1D4ED8', fontSize: '12px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(row.email)}</a>
                          : <span style={{ color: '#655F7D' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #E8E4F1', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#655F7D' }}>
              {totalCount === 0 ? '0 yayıncı' : `${rangeStart.toLocaleString('tr-TR')} - ${rangeEnd.toLocaleString('tr-TR')} / ${totalCount.toLocaleString('tr-TR')} yayıncı`}
            </span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', border: '1px solid #E8E4F1', backgroundColor: 'transparent', color: page <= 1 ? '#655F7D' : '#4A4462', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={14} />
              </button>
              {pageNumbers[0] > 1 && <span style={{ color: '#655F7D', fontSize: '12px', padding: '0 4px' }}>…</span>}
              {pageNumbers.map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  style={{ minWidth: '30px', height: '30px', borderRadius: '7px', border: `1px solid ${n === page ? CHZZK_COLOR : '#E8E4F1'}`, backgroundColor: n === page ? 'rgba(0,212,170,0.15)' : 'transparent', color: n === page ? inkOf(CHZZK_COLOR) : '#4A4462', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '0 6px' }}
                >
                  {n}
                </button>
              ))}
              {pageNumbers[pageNumbers.length - 1] < totalPages && <span style={{ color: '#655F7D', fontSize: '12px', padding: '0 4px' }}>…</span>}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', border: '1px solid #E8E4F1', backgroundColor: 'transparent', color: page >= totalPages ? '#655F7D' : '#4A4462', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
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
