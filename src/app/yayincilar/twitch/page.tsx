'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import PageHeader from '@/components/PageHeader'
import { Search, X, ExternalLink, Mail, Globe, ChevronLeft, ChevronRight, Gamepad2, Users, Share2, Languages, Radio } from 'lucide-react'
import Image from 'next/image'
import { inkOf } from '@/lib/theme'

type Row = Record<string, unknown>
type Region = 'global' | 'japan'
type SortKey = 'avg_viewers' | 'followers' | 'display_name' | 'language'
type SortDir = 'asc' | 'desc'
type AuxRow = {
  region: string | null
  language: string | null
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
}
type LiveStream = { user_name: string; game_name: string; viewer_count: number }
type LiveCategory = { name: string; id: string }

const PAGE_SIZE = 350
const CONTACT_FIELDS = ['instagram', 'youtube', 'twitter', 'tiktok', 'discord', 'facebook', 'website'] as const

const LANGUAGE_FLAGS: Record<string, string> = {
  'İngilizce': '🇬🇧', UK: '🇬🇧', Türkçe: '🇹🇷', Japonca: '🇯🇵', Korece: '🇰🇷',
  'İspanyolca': '🇪🇸', Fransızca: '🇫🇷', Almanca: '🇩🇪', Portekizce: '🇵🇹', Rusça: '🇷🇺',
  Çince: '🇨🇳', ZH_HK: '🇭🇰', 'İtalyanca': '🇮🇹', Arapça: '🇸🇦', Lehçe: '🇵🇱',
  Hollandaca: '🇳🇱', Tayca: '🇹🇭', Çekçe: '🇨🇿', Danca: '🇩🇰', 'İsveççe': '🇸🇪',
  Macarca: '🇭🇺', Fince: '🇫🇮', Hintçe: '🇮🇳', Yunanca: '🇬🇷', Rumence: '🇷🇴',
  Norveççe: '🇳🇴', Bulgarca: '🇧🇬', 'Amerikan İşaret Dili': '🤟',
}
function languageFlag(lang: string): string {
  return LANGUAGE_FLAGS[lang] ?? '🌐'
}

const AVATAR_PALETTE = ['#9146ff', '#1D4ED8', '#047857', '#B45309', '#BE185D', '#B91C1C', '#4CCCE6', '#4338CA']
function colorForName(name: unknown): string {
  const s = String(name ?? '')
  let hash = 0
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

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

// ── avatar (Twitch Helix profile image with colored-initials fallback) ──
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
      <div style={{ width: size, height: size, borderRadius: size / 3.5, backgroundColor: color + '22', border: `1px solid ${color}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.32, color: inkOf(color), flexShrink: 0 }}>
        {initials(uname)}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={uname}
      onError={() => setBroken(true)}
      style={{ width: size, height: size, borderRadius: size / 3.5, objectFit: 'cover', flexShrink: 0, border: `1px solid ${color}66`, backgroundColor: '#FFFFFF' }}
    />
  )
}

// ── sortable column header ──────────────────────────────────────────────
function SortableTH({ label, sk, active, dir, onSort, style }: { label: string; sk: SortKey; active: boolean; dir: SortDir; onSort: (k: SortKey) => void; style?: React.CSSProperties }) {
  return (
    <th onClick={() => onSort(sk)} style={{ ...STH, cursor: 'pointer', userSelect: 'none', color: active ? '#7539CF' : '#655F7D', ...style }}>
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

function ContactRow({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1D4ED8', textDecoration: 'none', padding: '5px 0', overflow: 'hidden' }}>
      <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </a>
  )
}

// ── detail drawer ────────────────────────────────────────────────────────
function DetailPanel({ row, profileSrc, onClose }: { row: Row; profileSrc?: string; onClose: () => void }) {
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
    <div style={{ width: '380px', backgroundColor: '#FFFFFF', borderLeft: '1px solid #E8E4F1', display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'fixed', top: 0, right: 0, height: '100vh', zIndex: 1000 }}>
      {/* Header */}
      <div style={{ padding: '18px', borderBottom: '1px solid #E8E4F1', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Avatar key={String(row.username)} username={row.username} src={profileSrc} size={64} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#17122B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#655F7D', marginTop: '3px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            @{String(row.username ?? '—')}
            {!!row.language && <span style={{ backgroundColor: 'rgba(145,70,255,0.12)', color: '#7539CF', borderRadius: '4px', padding: '1px 6px' }}>{String(row.language)}</span>}
          </div>
        </div>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', backgroundColor: 'transparent', border: '1px solid #E8E4F1', color: '#655F7D', cursor: 'pointer', flexShrink: 0 }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Ort. İzleyici', value: fmt(row.avg_viewers), color: '#9146FF' },
            { label: 'Takipçi', value: fmt(row.followers), color: '#046C4E' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E4F1', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '10px', color: '#655F7D', fontWeight: 600, marginBottom: '5px' }}>{s.label}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: inkOf(s.color) }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Channel link */}
        {!!row.channel_url && (
          <a href={String(row.channel_url)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(145,70,255,0.08)', border: '1px solid rgba(145,70,255,0.3)', color: '#7539CF', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
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

        {/* Games / categories */}
        {gameList.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#655F7D', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gamepad2 size={12} /> Oyunlar / Kategoriler
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {gameList.map((g, i) => (
                <div key={i} style={{ fontSize: '13px', color: '#4A4462', padding: '5px 10px', backgroundColor: 'rgba(145,70,255,0.06)', border: '1px solid rgba(145,70,255,0.12)', borderRadius: '6px' }}>{g}</div>
              ))}
            </div>
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

// ── "Twitch Canlı" live stats mini-card content ─────────────────────────
function TwitchLiveCard() {
  const [streams, setStreams] = useState<LiveStream[]>([])
  const [categories, setCategories] = useState<LiveCategory[]>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/twitch-live')
        if (!res.ok) throw new Error('failed')
        const data = await res.json()
        if (cancelled) return
        setStreams((data.streams ?? []).slice(0, 5))
        setCategories((data.categories ?? []).slice(0, 5))
        setError(false)
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 60_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B91C1C', flexShrink: 0 }}>
          <Radio size={17} />
        </div>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#4A4462', }}>Twitch Canlı</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginLeft: 'auto', fontSize: '10px', fontWeight: 700, color: '#046C4E' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#047857', boxShadow: '0 0 6px #047857', animation: 'twitchLivePulse 1.6s ease-in-out infinite' }} />
          CANLI
        </span>
      </div>

      {loading ? (
        <div style={{ fontSize: '12px', color: '#655F7D', padding: '8px 0' }}>Yükleniyor...</div>
      ) : error ? (
        <div style={{ fontSize: '12px', color: '#655F7D', padding: '8px 0' }}>Twitch verisi alınamadı</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#655F7D', marginBottom: '6px' }}>En Çok İzlenen</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {streams.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <span style={{ color: '#655F7D', width: '12px', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ color: '#17122B', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{s.user_name}</span>
                  <span style={{ color: '#B91C1C', fontWeight: 700, flexShrink: 0 }}>{fmt(s.viewer_count)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#655F7D', marginBottom: '6px' }}>Popüler Kategoriler</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {categories.map((c, i) => (
                <div key={c.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <span style={{ color: '#655F7D', width: '12px', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ color: '#17122B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes twitchLivePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </>
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

  // Twitch Helix profile images for the usernames currently on screen
  const [profileMap, setProfileMap] = useState<Record<string, string>>({})

  // hover state for the "Popüler Kategoriler" stat card
  const [categoriesHovered, setCategoriesHovered] = useState(false)

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
          .select('region, language, followers, avg_viewers, email, instagram, youtube, twitter, tiktok, discord, facebook, website, game')
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

  // fetch Twitch Helix profile images for the usernames on the current page
  useEffect(() => {
    const usernames = Array.from(new Set(rows.map(r => String(r.username ?? '').trim().toLowerCase()).filter(Boolean)))
      .filter(u => !(u in profileMap))
    if (usernames.length === 0) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/twitch-profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usernames }),
        })
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (cancelled) return
        setProfileMap(prev => ({ ...prev, ...(data.profiles ?? {}) }))
      } catch {
        // Twitch API unavailable — colored-initials fallback covers this
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const tabRows = useMemo(() => auxRows.filter(r => (r.region ?? '').toLowerCase() === activeTab), [auxRows, activeTab])
  const globalCount = useMemo(() => auxRows.filter(r => (r.region ?? '').toLowerCase() === 'global').length, [auxRows])
  const japanCount = useMemo(() => auxRows.filter(r => (r.region ?? '').toLowerCase() === 'japan').length, [auxRows])

  const stats = useMemo(() => {
    const emailCount = tabRows.filter(r => hasEmail(r.email)).length
    const anyContactCount = tabRows.filter(r =>
      hasEmail(r.email) || CONTACT_FIELDS.some(f => !!String(r[f] ?? '').trim())
    ).length
    return { totalStreamers: tabRows.length, emailCount, anyContactCount }
  }, [tabRows])

  const languageOptions = useMemo(
    () => Array.from(new Set(tabRows.map(r => (r.language ?? '').trim()).filter(Boolean))).sort(),
    [tabRows]
  )

  const languageStats = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of tabRows) {
      const lang = (r.language ?? '').trim()
      if (!lang) continue
      counts.set(lang, (counts.get(lang) ?? 0) + 1)
    }
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  }, [tabRows])
  const topLanguage = languageStats[0]

  const categoryStats = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of tabRows) {
      const raw = (r.game ?? '').trim()
      if (!raw) continue
      const top = raw.split(',')[0].trim().replace(/\s*\(\d+\)\s*$/, '').trim()
      if (!top) continue
      counts.set(top, (counts.get(top) ?? 0) + 1)
    }
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  }, [tabRows])
  const topCategory = categoryStats[0]
  const top3Categories = categoryStats.slice(0, 3)

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
              style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer', backgroundColor: activeTab === t.key ? '#F3EEFF' : 'transparent', color: activeTab === t.key ? '#6D28D9' : '#655F7D', transition: 'background-color 150ms var(--ease-out), color 150ms var(--ease-out)' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {/* Toplam Yayıncı */}
          <div style={statCardStyle('#9146ff')}>
            <StatCardHeader icon={<Users size={17} />} color="#9146ff" label="Toplam Yayıncı" />
            <div style={statValueStyle}>{auxLoading ? '…' : stats.totalStreamers.toLocaleString('tr-TR')}</div>
            <div style={statSubStyle}>Bu sekmede takip edilen kanal</div>
          </div>

          {/* Email Olan */}
          <div style={statCardStyle('#B45309')}>
            <StatCardHeader icon={<Mail size={17} />} color="#B45309" label="Email Olan" />
            <div style={statValueStyle}>{auxLoading ? '…' : stats.emailCount.toLocaleString('tr-TR')}</div>
            <div style={statSubStyle}>{auxLoading || stats.totalStreamers === 0 ? '—' : `%${Math.round((stats.emailCount / stats.totalStreamers) * 100)} kapsam`}</div>
          </div>

          {/* En az 1 iletişim/sosyal */}
          <div style={statCardStyle('#047857')}>
            <StatCardHeader icon={<Share2 size={17} />} color="#047857" label="İletişim / Sosyal Medya" />
            <div style={statValueStyle}>{auxLoading ? '…' : stats.anyContactCount.toLocaleString('tr-TR')}</div>
            <div style={statSubStyle}>{auxLoading || stats.totalStreamers === 0 ? '—' : `%${Math.round((stats.anyContactCount / stats.totalStreamers) * 100)} en az 1 kanal`}</div>
          </div>

          {/* Popüler Dil */}
          <div style={statCardStyle('#1D4ED8')}>
            <StatCardHeader icon={<Languages size={17} />} color="#1D4ED8" label="Popüler Dil" />
            <div style={statValueStyle}>{auxLoading ? '…' : topLanguage ? `${languageFlag(topLanguage.name)} ${topLanguage.name}` : '—'}</div>
            <div style={statSubStyle}>{auxLoading || !topLanguage ? '—' : `${topLanguage.count.toLocaleString('tr-TR')} yayıncı`}</div>
          </div>

          {/* Popüler Kategoriler (wide, hoverable) */}
          <div
            onMouseEnter={() => setCategoriesHovered(true)}
            onMouseLeave={() => setCategoriesHovered(false)}
            style={{ ...statCardStyle('#BE185D'), gridColumn: 'span 2', position: 'relative' }}
          >
            <StatCardHeader icon={<Gamepad2 size={17} />} color="#BE185D" label="Popüler Kategoriler" />
            <div style={statValueStyle}>{auxLoading ? '…' : topCategory ? topCategory.name : '—'}</div>
            <div style={statSubStyle}>{auxLoading || !topCategory ? '—' : `${topCategory.count.toLocaleString('tr-TR')} yayıncının ana kategorisi · üzerine gelip ilk 3'ü gör`}</div>

            {categoriesHovered && top3Categories.length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '20px', right: '20px', zIndex: 10, backgroundColor: '#FFFFFF', border: '1px solid rgba(244,114,182,0.35)', borderRadius: '12px', padding: '14px', boxShadow: '0 12px 28px rgba(0,0,0,0.12)', display: 'flex', gap: '10px' }}>
                {top3Categories.map((c, i) => (
                  <div key={c.name} style={{ flex: 1, backgroundColor: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.2)', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#BE185D', marginBottom: '4px' }}>#{i + 1}</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#17122B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ fontSize: '11px', color: '#4A4462', marginTop: '2px' }}>{c.count.toLocaleString('tr-TR')} yayıncı</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Twitch Canlı (wide) */}
          <div style={{ ...statCardStyle('#B91C1C'), gridColumn: 'span 2' }}>
            <TwitchLiveCard />
          </div>
        </div>

        {/* Table card */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '12px 20px', borderBottom: '1px solid #E8E4F1', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#655F7D', pointerEvents: 'none' }} />
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Kanal ara..." style={{ ...SEL, paddingLeft: '30px', width: '100%', boxSizing: 'border-box' }} />
            </div>
            <select value={languageFilter} onChange={e => setLanguageFilter(e.target.value)} style={SEL}>
              <option value="">Tüm Diller</option>
              {languageOptions.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button
              onClick={() => setEmailOnly(v => !v)}
              style={{ padding: '7px 14px', borderRadius: '7px', border: `1px solid ${emailOnly ? 'rgba(251,191,36,0.5)' : '#E8E4F1'}`, backgroundColor: emailOnly ? 'rgba(251,191,36,0.1)' : 'transparent', color: emailOnly ? '#A24B08' : '#655F7D', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Mail size={14} aria-hidden /> Email Var
            </button>
            {hasFilters && (
              <button onClick={() => { setSearchInput(''); setSearch(''); setLanguageFilter(''); setEmailOnly(false) }} style={{ fontSize: '12px', color: '#655F7D', background: 'none', border: '1px solid #E8E4F1', borderRadius: '7px', padding: '7px 12px', cursor: 'pointer' }}>
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
                  <SortableTH label="Kanal" sk="display_name" active={sortKey === 'display_name'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Ort. İzleyici" sk="avg_viewers" active={sortKey === 'avg_viewers'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Takipçi" sk="followers" active={sortKey === 'followers'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Dil" sk="language" active={sortKey === 'language'} dir={sortDir} onSort={handleSort} />
                  <th style={STH}>Email</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#655F7D', fontSize: '14px' }}>Yükleniyor...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#655F7D', fontSize: '14px' }}>{hasFilters ? 'Eşleşen yayıncı bulunamadı' : 'Henüz yayıncı eklenmemiş'}</td></tr>
                ) : rows.map((row, i) => {
                  const isActive = selected?.id === row.id
                  return (
                    <tr
                      key={String(row.id ?? i)}
                      onClick={() => setSelected(isActive ? null : row)}
                      style={{ borderBottom: i < rows.length - 1 ? '1px solid #E8E4F1' : 'none', backgroundColor: isActive ? 'rgba(145,70,255,0.07)' : i % 2 === 1 ? '#FAF9FD' : 'transparent', cursor: 'pointer' }}
                    >
                      <td style={{ ...TD, paddingRight: '8px' }}>
                        <Avatar username={row.username} src={profileMap[String(row.username ?? '').trim().toLowerCase()]} size={32} />
                      </td>
                      <td style={TD}>
                        <a
                          href={row.channel_url ? String(row.channel_url) : undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ fontWeight: 700, fontSize: '13px', color: '#7539CF', textDecoration: 'none' }}
                        >
                          {String(row.display_name ?? row.username ?? '—')}
                        </a>
                        {!!row.username && String(row.display_name ?? '') !== String(row.username) && (
                          <div style={{ fontSize: '11px', color: '#655F7D', marginTop: '2px' }}>@{String(row.username)}</div>
                        )}
                      </td>
                      <td style={TD}><span style={{ color: '#7539CF', fontWeight: 600, fontSize: '13px' }}>{fmt(row.avg_viewers)}</span></td>
                      <td style={TD}><span style={{ color: '#046C4E', fontWeight: 600, fontSize: '13px' }}>{fmt(row.followers)}</span></td>
                      <td style={TD}><span style={{ fontSize: '13px', color: '#4A4462' }}>{row.language ? String(row.language) : <span style={{ color: '#655F7D' }}>—</span>}</span></td>
                      <td style={{ ...TD, maxWidth: '180px' }} onClick={e => e.stopPropagation()}>
                        {hasEmail(row.email)
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
                  style={{ minWidth: '30px', height: '30px', borderRadius: '7px', border: `1px solid ${n === page ? '#9146ff' : '#E8E4F1'}`, backgroundColor: n === page ? 'rgba(145,70,255,0.15)' : 'transparent', color: n === page ? '#6D28D9' : '#4A4462', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '0 6px' }}
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
        {selected && (
          <>
            <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(23,18,43,0.35)', zIndex: 999 }} />
            <DetailPanel row={selected} profileSrc={profileMap[String(selected.username ?? '').trim().toLowerCase()]} onClose={() => setSelected(null)} />
          </>
        )}
      </div>
    </div>
  )
}
