'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import PageHeader from '@/components/PageHeader'
import { Search, X, ExternalLink, Mail, Globe, ChevronLeft, ChevronRight, Gamepad2, Users, Share2, Video, TrendingUp, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { inkOf, tint } from '@/lib/theme'
import SlideDrawer from '@/components/motion/SlideDrawer'

type Row = Record<string, unknown>
type SortKey = 'avg_viewers' | 'followers' | 'channel_name' | 'stream_count' | 'hours_per_stream'
type SortDir = 'asc' | 'desc'
type AuxRow = {
  followers: number | null
  avg_viewers: number | null
  email: string | null
  instagram: string | null
  youtube: string | null
  twitter: string | null
  tiktok: string | null
  discord: string | null
  facebook: string | null
  website: string | null
  game: string | null
  stream_count: number | null
}

const PAGE_SIZE = 350
const KICK_COLOR = '#53fc18'
const CONTACT_FIELDS = ['instagram', 'youtube', 'twitter', 'tiktok', 'discord', 'facebook', 'website'] as const

// ── helpers ──────────────────────────────────────────────────────────────
function fmt(n: unknown): string {
  const v = Number(n)
  if (!n && n !== 0) return '—'
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M'
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K'
  return v.toLocaleString('tr-TR')
}
function fmtHours(n: unknown): string {
  if (n === null || n === undefined || n === '') return '—'
  const v = Number(n)
  if (Number.isNaN(v)) return '—'
  return `${v.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} sa`
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

const AVATAR_PALETTE = ['#53fc18', 'var(--info)', 'var(--success)', 'var(--orange)', 'var(--rose)', 'var(--danger)', 'var(--teal)', 'var(--info)']
function colorForName(name: unknown): string {
  const s = String(name ?? '')
  let hash = 0
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

// ── avatar (profile_image_url from Supabase with colored-initials fallback) ─
function Avatar({ username, src, size }: { username: unknown; src?: string; size: number }) {
  const [broken, setBroken] = useState(false)
  const [lastSrc, setLastSrc] = useState(src)
  if (src !== lastSrc) {
    setLastSrc(src)
    setBroken(false)
  }
  const uname = String(username ?? '').trim()
  const color = colorForName(uname)
  if (!uname || !src || broken) {
    return (
      <div style={{ width: size, height: size, borderRadius: size / 3.5, backgroundColor: tint(color, 13), border: `1px solid ${tint(color, 40)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.32, color: inkOf(color), flexShrink: 0 }}>
        {initials(uname)}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={uname}
      onError={() => setBroken(true)}
      style={{ width: size, height: size, borderRadius: size / 3.5, objectFit: 'cover', flexShrink: 0, border: `1px solid ${tint(color, 40)}`, backgroundColor: 'var(--card)' }}
    />
  )
}

// ── sortable column header ──────────────────────────────────────────────
function SortableTH({ label, sk, active, dir, onSort, style }: { label: string; sk: SortKey; active: boolean; dir: SortDir; onSort: (k: SortKey) => void; style?: React.CSSProperties }) {
  return (
    <th onClick={() => onSort(sk)} style={{ ...STH, cursor: 'pointer', userSelect: 'none', color: active ? inkOf(KICK_COLOR) : 'var(--muted-foreground)', ...style }}>
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

function ContactRow({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--info)', textDecoration: 'none', padding: '5px 0', overflow: 'hidden' }}>
      <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </a>
  )
}

// ── detail drawer ────────────────────────────────────────────────────────
function DetailPanel({ row, onClose }: { row: Row; onClose: () => void }) {
  const avatarSrc = row.profile_image_url ? String(row.profile_image_url) : undefined
  const games = String(row.game ?? '').trim()
  const gameList = games ? games.split(/[,\n]/).map(g => g.trim()).filter(Boolean) : []
  const name = String(row.channel_name ?? row.username ?? '—')

  const contacts: { href: string; icon: React.ReactNode; label: string }[] = []
  if (hasEmail(row.email)) contacts.push({ href: `mailto:${row.email}`, icon: <Mail size={13} />, label: String(row.email) })
  if (row.instagram) contacts.push({ href: socialHref(row.instagram, 'https://instagram.com/'), icon: <Image src="/icons/instagram.png" alt="Instagram" width={13} height={13} />, label: String(row.instagram) })
  if (row.youtube) contacts.push({ href: socialHref(row.youtube, 'https://youtube.com/'), icon: <Image src="/icons/youtube.png" alt="YouTube" width={13} height={13} />, label: String(row.youtube) })
  if (row.twitter) contacts.push({ href: socialHref(row.twitter, 'https://twitter.com/'), icon: <Image src="/icons/x.png" alt="Twitter" width={13} height={13} />, label: String(row.twitter) })
  if (row.tiktok) contacts.push({ href: socialHref(row.tiktok, 'https://tiktok.com/@'), icon: <Image src="/icons/tiktok.png" alt="TikTok" width={13} height={13} />, label: String(row.tiktok) })
  if (row.discord) contacts.push({ href: socialHref(row.discord, 'https://discord.gg/'), icon: <Globe size={13} />, label: String(row.discord) })
  if (row.facebook) contacts.push({ href: socialHref(row.facebook, 'https://facebook.com/'), icon: <Globe size={13} />, label: String(row.facebook) })

  return (
    <div style={{ width: '380px', backgroundColor: 'var(--card)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'fixed', top: 0, right: 0, height: '100vh', zIndex: 1000 }}>
      {/* Header */}
      <div style={{ padding: '18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Avatar key={String(row.username)} username={row.username} src={avatarSrc} size={64} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '3px' }}>@{String(row.username ?? '—')}</div>
        </div>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', backgroundColor: 'transparent', border: '1px solid var(--border)', color: 'var(--muted-foreground)', cursor: 'pointer', flexShrink: 0 }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Ort. İzleyici', value: fmt(row.avg_viewers), color: KICK_COLOR },
            { label: 'Takipçi', value: fmt(row.followers), color: 'var(--success)' },
            { label: 'Yayın Sayısı', value: row.stream_count != null ? String(row.stream_count) : '—', color: 'var(--info)' },
            { label: 'Saat / Yayın', value: fmtHours(row.hours_per_stream), color: 'var(--primary-ink)' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: 600, marginBottom: '5px' }}>{s.label}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: inkOf(s.color) }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Channel link */}
        {!!row.channel_url && (
          <a href={String(row.channel_url)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(83,252,24,0.08)', border: '1px solid rgba(83,252,24,0.3)', color: inkOf(KICK_COLOR), fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
            <ExternalLink size={14} /> Kanala Git
          </a>
        )}

        {/* Bio */}
        {!!row.bio && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>Bio</div>
            <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{String(row.bio)}</div>
          </div>
        )}

        {/* Games / categories */}
        {gameList.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gamepad2 size={12} /> Oyunlar / Kategoriler
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {gameList.map((g, i) => (
                <div key={i} style={{ fontSize: '13px', color: 'var(--text-2)', padding: '5px 10px', backgroundColor: 'rgba(83,252,24,0.05)', border: '1px solid rgba(83,252,24,0.12)', borderRadius: '6px' }}>{g}</div>
              ))}
            </div>
          </div>
        )}

        {/* Contacts */}
        {contacts.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>İletişim &amp; Sosyal</div>
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
export default function KickPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Row | null>(null)
  const [page, setPage] = useState(1)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [emailOnly, setEmailOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('avg_viewers')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // aux data (lightweight columns, whole table) — powers stats bar
  const [auxRows, setAuxRows] = useState<AuxRow[]>([])
  const [auxLoading, setAuxLoading] = useState(true)

  // hover state for the "Popüler Kategoriler" stat card
  const [categoriesHovered, setCategoriesHovered] = useState(false)

  // admin: manual trigger for the fetch-kick-avatars edge function
  const [avatarSync, setAvatarSync] = useState<{ loading: boolean; message: string | null; isError: boolean }>({ loading: false, message: null, isError: false })

  const triggerAvatarSync = async () => {
    setAvatarSync({ loading: true, message: null, isError: false })
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!supabaseUrl || !anonKey) throw new Error('Supabase yapılandırması eksik')
      const res = await fetch(`${supabaseUrl}/functions/v1/fetch-kick-avatars`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${anonKey}`, apikey: anonKey, 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
      setAvatarSync({
        loading: false,
        isError: false,
        message: `${data.updated} güncellendi, ${data.failed} hata, ${data.remaining} kaldı`,
      })
    } catch (err) {
      setAvatarSync({ loading: false, isError: true, message: err instanceof Error ? err.message : 'Bilinmeyen hata' })
    }
  }

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
          .from('kick_streamers')
          .select('followers, avg_viewers, email, instagram, youtube, twitter, tiktok, discord, facebook, website, game, stream_count')
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
      let query = supabase.from('kick_streamers').select('*', { count: 'exact' })
      if (search) query = query.or(`channel_name.ilike.%${search}%,username.ilike.%${search}%`)
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
    const emailCount = auxRows.filter(r => hasEmail(r.email)).length
    const anyContactCount = auxRows.filter(r =>
      hasEmail(r.email) || CONTACT_FIELDS.some(f => !!String(r[f] ?? '').trim())
    ).length
    const totalFollowers = auxRows.reduce((s, r) => s + (Number(r.followers) || 0), 0)
    const streamCounts = auxRows.map(r => Number(r.stream_count) || 0).filter(n => n > 0)
    const avgStreamCount = streamCounts.length ? streamCounts.reduce((s, n) => s + n, 0) / streamCounts.length : 0
    return { totalStreamers: auxRows.length, emailCount, anyContactCount, totalFollowers, avgStreamCount }
  }, [auxRows])

  const categoryStats = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of auxRows) {
      const raw = (r.game ?? '').trim()
      if (!raw) continue
      const top = raw.split(',')[0].trim().replace(/\s*\([\d.]+\s*h?\)\s*$/i, '').trim()
      if (!top) continue
      counts.set(top, (counts.get(top) ?? 0) + 1)
    }
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  }, [auxRows])
  const topCategory = categoryStats[0]
  const top3Categories = categoryStats.slice(0, 3)

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
      <PageHeader title="Kick Yayıncıları" subtitle="Yayıncı takip ve analizi" imageSrc="/icons/kick.png" gradient="linear-gradient(135deg, #53fc18, #2ea80e)" />

      <div style={{ padding: '24px 32px' }}>
        {/* Admin */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', }}>Admin</span>
          <button
            onClick={triggerAvatarSync}
            disabled={avatarSync.loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '7px 14px', borderRadius: '7px', border: `1px solid ${tint(KICK_COLOR, 33)}`, backgroundColor: 'rgba(83,252,24,0.08)', color: inkOf(KICK_COLOR), fontSize: '13px', fontWeight: 600, cursor: avatarSync.loading ? 'not-allowed' : 'pointer', opacity: avatarSync.loading ? 0.6 : 1 }}
          >
            <RefreshCw size={13} style={{ animation: avatarSync.loading ? 'kickAvatarSpin 1s linear infinite' : 'none' }} />
            {avatarSync.loading ? 'Güncelleniyor...' : 'Profil Fotoğraflarını Güncelle (Kick API)'}
          </button>
          {avatarSync.message && (
            <span style={{ fontSize: '12px', color: avatarSync.isError ? 'var(--danger)' : 'var(--success)' }}>{avatarSync.message}</span>
          )}
          <style>{`@keyframes kickAvatarSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {/* Toplam Yayıncı */}
          <div style={statCardStyle(KICK_COLOR)}>
            <StatCardHeader icon={<Users size={17} />} color={KICK_COLOR} label="Toplam Yayıncı" />
            <div style={statValueStyle}>{auxLoading ? '…' : stats.totalStreamers.toLocaleString('tr-TR')}</div>
            <div style={statSubStyle}>Takip edilen kanal</div>
          </div>

          {/* Email Olan */}
          <div style={statCardStyle('var(--orange)')}>
            <StatCardHeader icon={<Mail size={17} />} color="var(--warning)" label="Email Olan" />
            <div style={statValueStyle}>{auxLoading ? '…' : stats.emailCount.toLocaleString('tr-TR')}</div>
            <div style={statSubStyle}>{auxLoading || stats.totalStreamers === 0 ? '—' : `%${Math.round((stats.emailCount / stats.totalStreamers) * 100)} kapsam`}</div>
          </div>

          {/* En az 1 iletişim/sosyal */}
          <div style={statCardStyle('var(--info)')}>
            <StatCardHeader icon={<Share2 size={17} />} color="var(--info)" label="İletişim / Sosyal Medya" />
            <div style={statValueStyle}>{auxLoading ? '…' : stats.anyContactCount.toLocaleString('tr-TR')}</div>
            <div style={statSubStyle}>{auxLoading || stats.totalStreamers === 0 ? '—' : `%${Math.round((stats.anyContactCount / stats.totalStreamers) * 100)} en az 1 kanal`}</div>
          </div>

          {/* Toplam Takipçi */}
          <div style={statCardStyle('var(--success)')}>
            <StatCardHeader icon={<TrendingUp size={17} />} color="var(--success)" label="Toplam Takipçi" />
            <div style={statValueStyle}>{auxLoading ? '…' : fmt(stats.totalFollowers)}</div>
            <div style={statSubStyle}>Tüm kanallar toplamı</div>
          </div>

          {/* Popüler Kategoriler (wide, hoverable) */}
          <div
            onMouseEnter={() => setCategoriesHovered(true)}
            onMouseLeave={() => setCategoriesHovered(false)}
            style={{ ...statCardStyle('var(--rose)'), gridColumn: 'span 2', position: 'relative' }}
          >
            <StatCardHeader icon={<Gamepad2 size={17} />} color="#BE185D" label="Popüler Kategoriler" />
            <div style={statValueStyle}>{auxLoading ? '…' : topCategory ? topCategory.name : '—'}</div>
            <div style={statSubStyle}>{auxLoading || !topCategory ? '—' : `${topCategory.count.toLocaleString('tr-TR')} yayıncının ana kategorisi · üzerine gelip ilk 3'ü gör`}</div>

            {categoriesHovered && top3Categories.length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '20px', right: '20px', zIndex: 10, backgroundColor: 'var(--card)', border: '1px solid color-mix(in srgb, var(--rose) 35%, transparent)', borderRadius: '12px', padding: '14px', boxShadow: '0 12px 28px rgba(0,0,0,0.12)', display: 'flex', gap: '10px' }}>
                {top3Categories.map((c, i) => (
                  <div key={c.name} style={{ flex: 1, backgroundColor: 'color-mix(in srgb, var(--rose) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--rose) 20%, transparent)', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--rose)', marginBottom: '4px' }}>#{i + 1}</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-2)', marginTop: '2px' }}>{c.count.toLocaleString('tr-TR')} yayıncı</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ortalama Yayın Sayısı (wide) */}
          <div style={{ ...statCardStyle('var(--primary-ink)'), gridColumn: 'span 2' }}>
            <StatCardHeader icon={<Video size={17} />} color="var(--primary-ink)" label="Ortalama Yayın Sayısı" />
            <div style={statValueStyle}>{auxLoading ? '…' : stats.avgStreamCount.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}</div>
            <div style={statSubStyle}>Kanal başına ortalama yayın sayısı</div>
          </div>
        </div>

        {/* Table card */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '12px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Kanal veya kullanıcı adı ara..." style={{ ...SEL, paddingLeft: '30px', width: '100%', boxSizing: 'border-box' }} />
            </div>
            <button
              onClick={() => setEmailOnly(v => !v)}
              style={{ padding: '7px 14px', borderRadius: '7px', border: `1px solid ${emailOnly ? 'color-mix(in srgb, var(--warning) 50%, transparent)' : 'var(--border)'}`, backgroundColor: emailOnly ? 'color-mix(in srgb, var(--warning) 10%, transparent)' : 'transparent', color: emailOnly ? 'var(--orange)' : 'var(--muted-foreground)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Mail size={14} aria-hidden /> Email Var
            </button>
            {hasFilters && (
              <button onClick={() => { setSearchInput(''); setSearch(''); setEmailOnly(false) }} style={{ fontSize: '12px', color: 'var(--muted-foreground)', background: 'none', border: '1px solid var(--border)', borderRadius: '7px', padding: '7px 12px', cursor: 'pointer' }}>
                Temizle
              </button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
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
                  <SortableTH label="Ort. İzleyici" sk="avg_viewers" active={sortKey === 'avg_viewers'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Takipçi" sk="followers" active={sortKey === 'followers'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Yayın Sayısı" sk="stream_count" active={sortKey === 'stream_count'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Saat / Yayın" sk="hours_per_stream" active={sortKey === 'hours_per_stream'} dir={sortDir} onSort={handleSort} />
                  <th style={STH}>Email</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '14px' }}>Yükleniyor...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '14px' }}>{hasFilters ? 'Eşleşen yayıncı bulunamadı' : 'Henüz yayıncı eklenmemiş'}</td></tr>
                ) : rows.map((row, i) => {
                  const isActive = selected?.id === row.id
                  return (
                    <tr
                      key={String(row.id ?? i)}
                      onClick={() => setSelected(isActive ? null : row)}
                      style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', backgroundColor: isActive ? 'rgba(83,252,24,0.06)' : i % 2 === 1 ? 'var(--row)' : 'transparent', cursor: 'pointer' }}
                    >
                      <td style={{ ...TD, paddingRight: '8px' }}>
                        <Avatar username={row.username} src={row.profile_image_url ? String(row.profile_image_url) : undefined} size={32} />
                      </td>
                      <td style={TD}>
                        <a
                          href={row.channel_url ? String(row.channel_url) : undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ fontWeight: 700, fontSize: '13px', color: inkOf(KICK_COLOR), textDecoration: 'none' }}
                        >
                          {String(row.channel_name ?? row.username ?? '—')}
                        </a>
                        {!!row.username && String(row.channel_name ?? '') !== String(row.username) && (
                          <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>@{String(row.username)}</div>
                        )}
                      </td>
                      <td style={TD}><span style={{ color: inkOf(KICK_COLOR), fontWeight: 600, fontSize: '13px' }}>{fmt(row.avg_viewers)}</span></td>
                      <td style={TD}><span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '13px' }}>{fmt(row.followers)}</span></td>
                      <td style={TD}><span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{row.stream_count != null ? String(row.stream_count) : <span style={{ color: 'var(--muted-foreground)' }}>—</span>}</span></td>
                      <td style={TD}><span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{fmtHours(row.hours_per_stream)}</span></td>
                      <td style={{ ...TD, maxWidth: '180px' }} onClick={e => e.stopPropagation()}>
                        {hasEmail(row.email)
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
            <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
              {totalCount === 0 ? '0 yayıncı' : `${rangeStart.toLocaleString('tr-TR')} - ${rangeEnd.toLocaleString('tr-TR')} / ${totalCount.toLocaleString('tr-TR')} yayıncı`}
            </span>
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
                  style={{ minWidth: '30px', height: '30px', borderRadius: '7px', border: `1px solid ${n === page ? KICK_COLOR : 'var(--border)'}`, backgroundColor: n === page ? 'rgba(83,252,24,0.15)' : 'transparent', color: n === page ? inkOf(KICK_COLOR) : 'var(--text-2)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '0 6px' }}
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
