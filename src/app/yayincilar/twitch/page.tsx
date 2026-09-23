'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import PageHeader from '@/components/PageHeader'
import { Search, X, ExternalLink, Mail, Globe, ChevronLeft, ChevronRight, Gamepad2 } from 'lucide-react'
import Image from 'next/image'

type Row = Record<string, unknown>
type Region = 'global' | 'japan'
type SortKey = 'avg_viewers' | 'followers' | 'display_name' | 'language'
type SortDir = 'asc' | 'desc'
type AuxRow = { region: string | null; language: string | null; followers: number | null; avg_viewers: number | null; email: string | null }

const PAGE_SIZE = 350

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
function hasEmail(v: unknown): boolean {
  const e = String(v ?? '').trim().toLowerCase()
  return !!e && e !== 'nan' && e !== 'null'
}
function socialHref(val: unknown, prefix: string): string {
  const s = String(val ?? '').trim()
  return s.startsWith('http') ? s : `${prefix}${s}`
}
function sanitizeSearch(s: string): string {
  return s.replace(/[,()%]/g, ' ').trim()
}

// ── avatar (unavatar.io with initials fallback) ─────────────────────────
function Avatar({ username, size }: { username: unknown; size: number }) {
  const [broken, setBroken] = useState(false)
  const uname = String(username ?? '').trim()
  const fallbackStyle: React.CSSProperties = { width: size, height: size, borderRadius: size / 3.5, backgroundColor: 'rgba(145,70,255,0.18)', border: '1px solid rgba(145,70,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.32, color: '#a78bfa', flexShrink: 0 }
  if (!uname || broken) return <div style={fallbackStyle}>{initials(uname)}</div>
  return (
    <img
      src={`https://unavatar.io/twitch/${encodeURIComponent(uname)}`}
      alt={uname}
      onError={() => setBroken(true)}
      style={{ width: size, height: size, borderRadius: size / 3.5, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(145,70,255,0.35)', backgroundColor: '#1a1a24' }}
    />
  )
}

// ── sortable column header ──────────────────────────────────────────────
function SortableTH({ label, sk, active, dir, onSort, style }: { label: string; sk: SortKey; active: boolean; dir: SortDir; onSort: (k: SortKey) => void; style?: React.CSSProperties }) {
  return (
    <th onClick={() => onSort(sk)} style={{ ...STH, cursor: 'pointer', userSelect: 'none', color: active ? '#9146ff' : '#64748b', ...style }}>
      {label} <span style={{ opacity: active ? 1 : 0.3 }}>{active ? (dir === 'desc' ? '↓' : '↑') : '↕'}</span>
    </th>
  )
}

const STH: React.CSSProperties = { backgroundColor: '#13131a', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '11px 14px', textAlign: 'left', borderBottom: '1px solid #2a2a3a', whiteSpace: 'nowrap' }
const TD: React.CSSProperties = { padding: '12px 14px', verticalAlign: 'middle' }
const SEL: React.CSSProperties = { backgroundColor: '#13131a', border: '1px solid #2a2a3a', borderRadius: '7px', padding: '7px 11px', fontSize: '13px', color: '#e2e8f0', cursor: 'pointer', outline: 'none' }

function ContactRow({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#60a5fa', textDecoration: 'none', padding: '5px 0', overflow: 'hidden' }}>
      <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </a>
  )
}

// ── detail drawer ────────────────────────────────────────────────────────
function DetailPanel({ row, onClose }: { row: Row; onClose: () => void }) {
  const games = String(row.game ?? '').trim()
  const gameList = games ? games.split(/[,\n]/).map(g => g.trim()).filter(Boolean) : []
  const name = String(row.display_name ?? row.username ?? '—')

  const contacts: { href: string; icon: React.ReactNode; label: string }[] = []
  if (hasEmail(row.email)) contacts.push({ href: `mailto:${row.email}`, icon: <Mail size={13} />, label: String(row.email) })
  if (row.website) contacts.push({ href: socialHref(row.website, 'https://'), icon: <Globe size={13} />, label: String(row.website) })
  if (row.instagram) contacts.push({ href: socialHref(row.instagram, 'https://instagram.com/'), icon: <Image src="/icons/instagram.png" alt="Instagram" width={13} height={13} />, label: String(row.instagram) })
  if (row.youtube) contacts.push({ href: socialHref(row.youtube, 'https://youtube.com/'), icon: <Image src="/icons/youtube.png" alt="YouTube" width={13} height={13} />, label: String(row.youtube) })
  if (row.twitter) contacts.push({ href: socialHref(row.twitter, 'https://twitter.com/'), icon: <Image src="/icons/x.png" alt="Twitter" width={13} height={13} />, label: String(row.twitter) })
  if (row.tiktok) contacts.push({ href: socialHref(row.tiktok, 'https://tiktok.com/@'), icon: <Image src="/icons/tiktok.png" alt="TikTok" width={13} height={13} />, label: String(row.tiktok) })
  if (row.discord) contacts.push({ href: socialHref(row.discord, 'https://discord.gg/'), icon: <Globe size={13} />, label: String(row.discord) })
  if (row.facebook) contacts.push({ href: socialHref(row.facebook, 'https://facebook.com/'), icon: <Globe size={13} />, label: String(row.facebook) })

  return (
    <div style={{ width: '380px', backgroundColor: '#13131a', borderLeft: '1px solid #2a2a3a', display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'fixed', top: 0, right: 0, height: '100vh', zIndex: 1000 }}>
      {/* Header */}
      <div style={{ padding: '18px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Avatar key={String(row.username)} username={row.username} size={64} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            @{String(row.username ?? '—')}
            {!!row.language && <span style={{ backgroundColor: 'rgba(145,70,255,0.12)', color: '#a78bfa', borderRadius: '4px', padding: '1px 6px' }}>{String(row.language)}</span>}
          </div>
        </div>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', backgroundColor: 'transparent', border: '1px solid #2a2a3a', color: '#64748b', cursor: 'pointer', flexShrink: 0 }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Ort. İzleyici', value: fmt(row.avg_viewers), color: '#a78bfa' },
            { label: 'Takipçi', value: fmt(row.followers), color: '#4ade80' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>{s.label}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Channel link */}
        {!!row.channel_url && (
          <a href={String(row.channel_url)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(145,70,255,0.08)', border: '1px solid rgba(145,70,255,0.3)', color: '#a78bfa', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
            <ExternalLink size={14} /> Kanala Git
          </a>
        )}

        {/* Bio */}
        {!!row.bio && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Bio</div>
            <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{String(row.bio)}</div>
          </div>
        )}

        {/* Games / categories */}
        {gameList.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gamepad2 size={12} /> Oyunlar / Kategoriler
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {gameList.map((g, i) => (
                <div key={i} style={{ fontSize: '13px', color: '#cbd5e1', padding: '5px 10px', backgroundColor: 'rgba(145,70,255,0.06)', border: '1px solid rgba(145,70,255,0.12)', borderRadius: '6px' }}>{g}</div>
              ))}
            </div>
          </div>
        )}

        {/* Contacts */}
        {contacts.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>İletişim &amp; Sosyal</div>
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
export default function TwitchPage() {
  const [activeTab, setActiveTab] = useState<Region>('global')
  const [rows, setRows] = useState<Row[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Row | null>(null)
  const [page, setPage] = useState(1)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [languageFilter, setLanguageFilter] = useState('')
  const [emailOnly, setEmailOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('avg_viewers')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // aux data (lightweight columns, whole table) — powers tab counts, stats bar, language dropdown
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
          .from('twitch_streamers')
          .select('region, language, followers, avg_viewers, email')
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

  const filterSig = `${activeTab}|${search}|${languageFilter}|${emailOnly}|${sortKey}|${sortDir}`
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
      let query = supabase.from('twitch_streamers').select('*', { count: 'exact' }).eq('region', activeTab)
      if (search) query = query.or(`display_name.ilike.%${search}%,username.ilike.%${search}%`)
      if (languageFilter) query = query.eq('language', languageFilter)
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
  }, [activeTab, search, languageFilter, emailOnly, sortKey, sortDir, page])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const tabRows = useMemo(() => auxRows.filter(r => (r.region ?? '').toLowerCase() === activeTab), [auxRows, activeTab])
  const globalCount = useMemo(() => auxRows.filter(r => (r.region ?? '').toLowerCase() === 'global').length, [auxRows])
  const japanCount = useMemo(() => auxRows.filter(r => (r.region ?? '').toLowerCase() === 'japan').length, [auxRows])

  const stats = useMemo(() => ({
    totalStreamers: tabRows.length,
    totalFollowers: tabRows.reduce((s, r) => s + (Number(r.followers) || 0), 0),
    totalAvgViewers: tabRows.reduce((s, r) => s + (Number(r.avg_viewers) || 0), 0),
    emailCount: tabRows.filter(r => hasEmail(r.email)).length,
  }), [tabRows])

  const languageOptions = useMemo(
    () => Array.from(new Set(tabRows.map(r => (r.language ?? '').trim()).filter(Boolean))).sort(),
    [tabRows]
  )

  const hasFilters = !!(search || languageFilter || emailOnly)
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

  const switchTab = (t: Region) => {
    setActiveTab(t)
    setLanguageFilter('')
  }

  return (
    <div>
      <PageHeader title="Twitch Yayıncıları" subtitle="Yayıncı takip ve analizi" imageSrc="/icons/twitch.png" gradient="linear-gradient(135deg, #9146ff, #6441a5)" />

      <div style={{ padding: '24px 32px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
          {([
            { key: 'global' as Region, label: `Global (${auxLoading ? '…' : globalCount.toLocaleString('tr-TR')})` },
            { key: 'japan' as Region, label: `Japonya (${auxLoading ? '…' : japanCount.toLocaleString('tr-TR')})` },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer', backgroundColor: activeTab === t.key ? '#9146ff' : 'transparent', color: activeTab === t.key ? '#fff' : '#64748b', transition: 'all 0.15s' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Toplam Yayıncı', value: auxLoading ? '…' : stats.totalStreamers.toLocaleString('tr-TR'), color: '#a78bfa' },
            { label: 'Toplam Takipçi', value: auxLoading ? '…' : fmt(stats.totalFollowers), color: '#4ade80' },
            { label: 'Toplam Ort. İzleyici', value: auxLoading ? '…' : fmt(stats.totalAvgViewers), color: '#60a5fa' },
            { label: 'Email Olan', value: auxLoading ? '…' : stats.emailCount.toLocaleString('tr-TR'), color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '18px 20px' }}>
              <div style={{ fontSize: '26px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '7px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '12px 20px', borderBottom: '1px solid #2a2a3a', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Kanal ara..." style={{ ...SEL, paddingLeft: '30px', width: '100%', boxSizing: 'border-box' }} />
            </div>
            <select value={languageFilter} onChange={e => setLanguageFilter(e.target.value)} style={SEL}>
              <option value="">Tüm Diller</option>
              {languageOptions.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button
              onClick={() => setEmailOnly(v => !v)}
              style={{ padding: '7px 14px', borderRadius: '7px', border: `1px solid ${emailOnly ? 'rgba(251,191,36,0.5)' : '#2a2a3a'}`, backgroundColor: emailOnly ? 'rgba(251,191,36,0.1)' : 'transparent', color: emailOnly ? '#fbbf24' : '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              📧 Email Var
            </button>
            {hasFilters && (
              <button onClick={() => { setSearchInput(''); setSearch(''); setLanguageFilter(''); setEmailOnly(false) }} style={{ fontSize: '12px', color: '#64748b', background: 'none', border: '1px solid #2a2a3a', borderRadius: '7px', padding: '7px 12px', cursor: 'pointer' }}>
                Temizle
              </button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
              {totalCount === 0 ? '0 yayıncı' : `${rangeStart.toLocaleString('tr-TR')} - ${rangeEnd.toLocaleString('tr-TR')} / ${totalCount.toLocaleString('tr-TR')} yayıncı`}
            </span>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...STH, width: '46px' }}></th>
                  <SortableTH label="Kanal" sk="display_name" active={sortKey === 'display_name'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Ort. İzleyici" sk="avg_viewers" active={sortKey === 'avg_viewers'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Takipçi" sk="followers" active={sortKey === 'followers'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Dil" sk="language" active={sortKey === 'language'} dir={sortDir} onSort={handleSort} />
                  <th style={STH}>Email</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>Yükleniyor...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>{hasFilters ? 'Eşleşen yayıncı bulunamadı' : 'Henüz yayıncı eklenmemiş'}</td></tr>
                ) : rows.map((row, i) => {
                  const isActive = selected?.id === row.id
                  return (
                    <tr
                      key={String(row.id ?? i)}
                      onClick={() => setSelected(isActive ? null : row)}
                      style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(42,42,58,0.6)' : 'none', backgroundColor: isActive ? 'rgba(145,70,255,0.07)' : i % 2 === 1 ? 'rgba(255,255,255,0.012)' : 'transparent', cursor: 'pointer' }}
                    >
                      <td style={{ ...TD, paddingRight: '8px' }}>
                        <Avatar username={row.username} size={32} />
                      </td>
                      <td style={TD}>
                        <a
                          href={row.channel_url ? String(row.channel_url) : undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ fontWeight: 700, fontSize: '13px', color: '#a78bfa', textDecoration: 'none' }}
                        >
                          {String(row.display_name ?? row.username ?? '—')}
                        </a>
                        {!!row.username && String(row.display_name ?? '') !== String(row.username) && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>@{String(row.username)}</div>
                        )}
                      </td>
                      <td style={TD}><span style={{ color: '#a78bfa', fontWeight: 600, fontSize: '13px' }}>{fmt(row.avg_viewers)}</span></td>
                      <td style={TD}><span style={{ color: '#4ade80', fontWeight: 600, fontSize: '13px' }}>{fmt(row.followers)}</span></td>
                      <td style={TD}><span style={{ fontSize: '13px', color: '#cbd5e1' }}>{row.language ? String(row.language) : <span style={{ color: '#64748b' }}>—</span>}</span></td>
                      <td style={{ ...TD, maxWidth: '180px' }} onClick={e => e.stopPropagation()}>
                        {hasEmail(row.email)
                          ? <a href={`mailto:${row.email}`} style={{ color: '#60a5fa', fontSize: '12px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(row.email)}</a>
                          : <span style={{ color: '#64748b' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #2a2a3a', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {totalCount === 0 ? '0 yayıncı' : `${rangeStart.toLocaleString('tr-TR')} - ${rangeEnd.toLocaleString('tr-TR')} / ${totalCount.toLocaleString('tr-TR')} yayıncı`}
            </span>
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
                  style={{ minWidth: '30px', height: '30px', borderRadius: '7px', border: `1px solid ${n === page ? '#9146ff' : '#2a2a3a'}`, backgroundColor: n === page ? 'rgba(145,70,255,0.15)' : 'transparent', color: n === page ? '#a78bfa' : '#94a3b8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '0 6px' }}
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
