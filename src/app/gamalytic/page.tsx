'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import DemoCarousel from '@/components/DemoCarousel'
import {
  BarChart2, Search, X, Star, Clock, Users, DollarSign,
  TrendingUp, Heart, ChevronLeft, Tag, Globe,
  ChevronDown, ChevronUp, ExternalLink, Gamepad2, Cpu,
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SteamItem {
  id: number
  name: string
  tiny_image: string
  price?: { final: number; initial: number; discount_percent: number }
  metascore?: string
  platforms?: { windows: boolean; mac: boolean; linux: boolean }
}

interface HistoryItem {
  appid: number
  name: string
  imageUrl: string
}

interface SteamDetails {
  shortDescription?: string
  isFree?: boolean
  priceOverview?: { initialFormatted: string; finalFormatted: string; discountPercent: number } | null
  metacritic?: { score: number; url: string } | null
  pcRequirements?: { minimum: string; recommended: string } | null
  dlc?: number[]
  supportedLanguages?: string
  developers?: string[]
  publishers?: string[]
  categories?: string[]
  steamGenres?: string[]
}

interface HistoryPoint {
  timeStamp: number; sales: number
  revenue?: number; players?: number; score?: number; followers?: number
}

interface GameData {
  name?: string; steamId?: number; headerImageUrl?: string; description?: string
  releaseDate?: string; reviewScore?: number; reviewCount?: number
  followers?: number; avgPlaytime?: number; copiesSold?: number
  revenue?: number; players?: number; wishlists?: number
  tags?: string[]; countryData?: Record<string, number>
  prediction1Month?: number; prediction1Year?: number
  history?: HistoryPoint[]; genres?: string[]; features?: string[]
  developers?: string[]; publishers?: string[]
  steam?: SteamDetails | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HISTORY_KEY = 'gamalytic_search_history'
const MAX_HISTORY = 25
const TOT_APPID   = 4416430
const TOT_NAME    = 'Tales of the Trade'

const COUNTRY_NAMES: Record<string, string> = {
  cn: 'Çin', us: 'ABD', ru: 'Rusya', de: 'Almanya', gb: 'İngiltere',
  fr: 'Fransa', br: 'Brezilya', kr: 'Güney Kore', tr: 'Türkiye',
  jp: 'Japonya', pl: 'Polonya', ca: 'Kanada', au: 'Avustralya',
  it: 'İtalya', es: 'İspanya', nl: 'Hollanda', mx: 'Meksika', ar: 'Arjantin',
}

const TAG_COLORS: [string, string][] = [
  ['rgba(124,58,237,0.15)', '#BAA7FF'], ['rgba(59,130,246,0.15)', '#70B8FF'],
  ['rgba(20,184,166,0.15)', '#0BD8B6'], ['rgba(249,115,22,0.15)', '#FF8B3E'],
  ['rgba(239,68,68,0.15)', '#FF6369'],  ['rgba(34,197,94,0.15)', '#3DD68C'],
  ['rgba(245,158,11,0.15)', '#FFB224'],
]

const CARD_STYLE = { backgroundColor: '#0A0A0A', border: '1px solid #262626', borderRadius: '12px', padding: '20px' }
const SECTION_TITLE: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600, color: '#B4B4B4',
  marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '7px',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n?: number | null) {
  if (n == null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return n.toLocaleString('en-US')
}
function fmtUSD(n?: number | null) {
  if (n == null) return '—'
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'k'
  return '$' + n.toFixed(2)
}
function scoreColor(s?: number | null) {
  if (!s) return '#8F8F8F'
  return s >= 80 ? '#3DD68C' : s >= 60 ? '#FFB224' : '#FF6369'
}
function countryName(code: string) { return COUNTRY_NAMES[code.toLowerCase()] ?? code.toUpperCase() }

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, iconColor, iconBg, label, value }: {
  icon: React.ComponentType<{ size?: number; color?: string }>
  iconColor: string; iconBg: string; label: string; value: string
}) {
  return (
    <div style={{ ...CARD_STYLE, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color={iconColor} />
      </div>
      <div>
        <div style={{ fontSize: '10px', color: '#8F8F8F', fontWeight: 600, marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '17px', fontWeight: 700, color: '#EDEDED', lineHeight: 1.1 }}>{value}</div>
      </div>
    </div>
  )
}

function CountryDistribution({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const max = Math.max(...entries.map(([, v]) => v), 1)
  if (!entries.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
      {entries.map(([code, val]) => {
        const pct = val <= 1 ? val * 100 : val
        const barW = (pct / (max <= 1 ? max * 100 : max)) * 100
        return (
          <div key={code} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '96px', fontSize: '12px', color: '#B4B4B4', flexShrink: 0 }}>{countryName(code)}</div>
            <div style={{ flex: 1, height: '7px', backgroundColor: '#262626', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(barW, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #9E8CFC, #9EB1FF)', borderRadius: '4px' }} />
            </div>
            <div style={{ width: '38px', fontSize: '11px', color: '#8F8F8F', textAlign: 'right', flexShrink: 0 }}>{pct.toFixed(1)}%</div>
          </div>
        )
      })}
    </div>
  )
}

function fmtTick(v: number) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M'
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'k'
  return String(v)
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#EDEDED' }}>
      <div style={{ color: '#B4B4B4', marginBottom: '4px' }}>{label}</div>
      <div>Satış: <strong>{fmtTick(payload[0].value)}</strong></div>
    </div>
  )
}

function SalesHistoryChart({ history }: { history: HistoryPoint[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const data = history.map(p => ({
    date: new Date(p.timeStamp).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: '2-digit' }),
    sales: p.sales,
  }))
  if (!mounted || !data.length) return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8F8F8F', fontSize: '13px' }}>
      {mounted ? 'Veri yok' : ''}
    </div>
  )
  const step = Math.max(1, Math.floor(data.length / 12))
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8F8F8F' }} tickLine={false} axisLine={false} interval={step - 1} />
        <YAxis tick={{ fontSize: 10, fill: '#8F8F8F' }} tickLine={false} axisLine={false} tickFormatter={fmtTick} width={40} />
        <Tooltip content={<ChartTooltip />} />
        <Line type="monotone" dataKey="sales" stroke="#9E8CFC" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#BAA7FF' }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function Collapsible({ title, icon: Icon, children }: {
  title: string; icon: React.ComponentType<{ size?: number; color?: string }>; children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={CARD_STYLE}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0 }}>
        <span style={{ ...SECTION_TITLE, marginBottom: 0 }}><Icon size={13} color="#B4B4B4" /> {title}</span>
        {open ? <ChevronUp size={15} color="#8F8F8F" /> : <ChevronDown size={15} color="#8F8F8F" />}
      </button>
      {open && <div style={{ marginTop: '14px' }}>{children}</div>}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function GamalyticPage() {
  // Search state
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<SteamItem[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Game detail state
  const [selected, setSelected]   = useState<SteamItem | null>(null)
  const [gameData, setGameData]   = useState<GameData | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // Search history
  const [searchHistory, setSearchHistory] = useState<HistoryItem[]>([])

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) setSearchHistory(JSON.parse(raw))
    } catch {}
  }, [])

  // ── Actions ───────────────────────────────────────────────────────────────────

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/steam-search?q=${encodeURIComponent(value)}`)
        setResults((await res.json()).items ?? [])
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 350)
  }, [])

  const handleSelectGame = useCallback(async (item: SteamItem) => {
    setSearchHistory(prev => {
      const entry: HistoryItem = { appid: item.id, name: item.name, imageUrl: item.tiny_image }
      const next = [entry, ...prev.filter(h => h.appid !== item.id)].slice(0, MAX_HISTORY)
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)) } catch {}
      return next
    })
    setSelected(item); setResults([]); setQuery('')
    setGameData(null); setError(null); setLoading(true)
    try {
      const res  = await fetch(`/api/gamalytic?appId=${item.id}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setGameData(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Veri alınamadı')
    } finally { setLoading(false) }
  }, [])

  const handleBack = useCallback(() => { setSelected(null); setGameData(null); setError(null) }, [])

  const removeFromHistory = useCallback((appid: number) => {
    setSearchHistory(prev => {
      const next = prev.filter(h => h.appid !== appid)
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const loadTalesOfTheTrade = useCallback(() => {
    handleSelectGame({
      id: TOT_APPID,
      name: TOT_NAME,
      tiny_image: `https://cdn.akamai.steamstatic.com/steam/apps/${TOT_APPID}/header.jpg`,
    })
  }, [handleSelectGame])

  // ── Detail view ───────────────────────────────────────────────────────────────

  if (selected) {
    const d = gameData
    const s = d?.steam
    const headerImg = d?.headerImageUrl ?? selected.tiny_image
    const devs    = s?.developers?.length ? s.developers : d?.developers ?? []
    const pubs    = s?.publishers?.length ? s.publishers : d?.publishers ?? []
    const genres  = [...(d?.genres ?? []), ...(s?.steamGenres ?? [])].filter((v, i, a) => a.indexOf(v) === i)
    const features = [...(d?.features ?? []), ...(s?.categories ?? [])].filter((v, i, a) => a.indexOf(v) === i)

    return (
      <div style={{ overflowX: 'hidden', maxWidth: '100%' }}>
        <div style={{ padding: '16px 28px', borderBottom: '1px solid #262626', backgroundColor: '#0A0A0A', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid #262626', borderRadius: '8px', color: '#B4B4B4', fontSize: '12px', padding: '5px 11px', cursor: 'pointer' }}>
            <ChevronLeft size={14} /> Geri
          </button>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#EDEDED' }}>{selected.name}</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#8F8F8F' }}>Steam ID: {selected.id}</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '34px', height: '34px', border: '3px solid #262626', borderTopColor: '#9E8CFC', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ color: '#8F8F8F', fontSize: '13px' }}>Yükleniyor…</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : error ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#FF6369', fontSize: '14px' }}>{error}</div>
        ) : (
          <div style={{ display: 'flex', gap: '20px', padding: '24px 28px', alignItems: 'flex-start' }}>
            {/* LEFT COLUMN */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '460/215', borderRadius: '12px', overflow: 'hidden', border: '1px solid #262626' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={headerImg} alt={selected.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#EDEDED', margin: '0 0 8px' }}>{d?.name ?? selected.name}</h1>
                {(s?.shortDescription || d?.description) && (
                  <p style={{ fontSize: '13px', color: '#B4B4B4', lineHeight: 1.65, margin: 0 }}>
                    {s?.shortDescription ?? (d!.description!.length > 300 ? d!.description!.slice(0, 300) + '…' : d!.description)}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                {s?.isFree ? (
                  <span style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#3DD68C', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '6px 14px', fontSize: '14px', fontWeight: 700 }}>Ücretsiz</span>
                ) : s?.priceOverview ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {s.priceOverview.discountPercent > 0 && <span style={{ backgroundColor: '#22c55e', color: '#0A0A0A', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: 700 }}>-{s.priceOverview.discountPercent}%</span>}
                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#3DD68C' }}>{s.priceOverview.finalFormatted}</span>
                    {s.priceOverview.discountPercent > 0 && <span style={{ fontSize: '13px', color: '#8F8F8F', textDecoration: 'line-through' }}>{s.priceOverview.initialFormatted}</span>}
                  </div>
                ) : d?.releaseDate ? <span style={{ fontSize: '13px', color: '#8F8F8F' }}>{d.releaseDate}</span> : null}
                {s?.metacritic && (
                  <a href={s.metacritic.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '7px', textDecoration: 'none', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '8px', padding: '6px 12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#66cc33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#0A0A0A', lineHeight: 1 }}>{s.metacritic.score}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#FFB224', fontWeight: 600, letterSpacing: '0.04em' }}>METACRİTİC</div>
                      <div style={{ fontSize: '11px', color: '#B4B4B4' }}>İncele</div>
                    </div>
                    <ExternalLink size={12} color="#8F8F8F" />
                  </a>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '10px' }}>
                <StatCard icon={DollarSign} iconColor="#3DD68C"  iconBg="rgba(34,197,94,0.12)"   label="Tahmini Gelir"  value={fmtUSD(d?.revenue)} />
                <StatCard icon={Globe}      iconColor="#70B8FF"  iconBg="rgba(59,130,246,0.12)"  label="Satılan Kopya"  value={fmt(d?.copiesSold)} />
                <StatCard icon={Star}       iconColor="#FFB224"  iconBg="rgba(245,158,11,0.12)"  label="İnceleme Skoru" value={d?.reviewScore != null ? `${d.reviewScore}/100` : '—'} />
                <StatCard icon={Heart}      iconColor="#FF6369"  iconBg="rgba(239,68,68,0.12)"   label="Takipçi"        value={fmt(d?.followers)} />
                <StatCard icon={Users}      iconColor="#FF8B3E"  iconBg="rgba(249,115,22,0.12)"  label="Toplam Oyuncu"  value={fmt(d?.players)} />
                <StatCard icon={TrendingUp} iconColor="#BAA7FF"  iconBg="rgba(124,58,237,0.12)"  label="İstek Listesi"  value={fmt(d?.wishlists)} />
                <StatCard icon={Clock}      iconColor="#0BD8B6"  iconBg="rgba(20,184,166,0.12)"  label="Ort. Oynama"    value={d?.avgPlaytime != null ? `${Number(d.avgPlaytime).toFixed(1)} saat` : '—'} />
              </div>
              {d?.history && d.history.length > 1 && (
                <div style={CARD_STYLE}>
                  <div style={SECTION_TITLE}><TrendingUp size={13} color="#B4B4B4" /> Satış Geçmişi</div>
                  <SalesHistoryChart history={d.history} />
                </div>
              )}
              {d?.countryData && Object.keys(d.countryData).length > 0 && (
                <div style={CARD_STYLE}>
                  <div style={SECTION_TITLE}><Globe size={13} color="#B4B4B4" /> Ülke Dağılımı (Top 10)</div>
                  <CountryDistribution data={d.countryData} />
                </div>
              )}
              {s?.pcRequirements && (s.pcRequirements.minimum || s.pcRequirements.recommended) && (
                <Collapsible title="Sistem Gereksinimleri" icon={Cpu}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {s.pcRequirements.minimum && <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#FF6369', marginBottom: '6px', }}>Minimum</div>
                      <pre style={{ fontSize: '12px', color: '#B4B4B4', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{s.pcRequirements.minimum}</pre>
                    </div>}
                    {s.pcRequirements.recommended && <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#3DD68C', marginBottom: '6px', }}>Önerilen</div>
                      <pre style={{ fontSize: '12px', color: '#B4B4B4', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{s.pcRequirements.recommended}</pre>
                    </div>}
                  </div>
                </Collapsible>
              )}
              {s?.dlc && s.dlc.length > 0 && (
                <div style={CARD_STYLE}>
                  <div style={SECTION_TITLE}><Gamepad2 size={13} color="#B4B4B4" /> DLC ({s.dlc.length})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {s.dlc.slice(0, 20).map(id => (
                      <a key={id} href={`https://store.steampowered.com/app/${id}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '11px', color: '#70B8FF', backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '5px', padding: '3px 8px', textDecoration: 'none' }}>
                        #{id}
                      </a>
                    ))}
                    {s.dlc.length > 20 && <span style={{ fontSize: '11px', color: '#8F8F8F' }}>+{s.dlc.length - 20} daha</span>}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '14px', position: 'sticky', top: '16px' }}>
              {d?.tags && d.tags.length > 0 && (
                <div style={CARD_STYLE}>
                  <div style={SECTION_TITLE}><Tag size={13} color="#B4B4B4" /> Etiketler</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                    {d.tags.map((tag, i) => {
                      const [bg, color] = TAG_COLORS[i % TAG_COLORS.length]
                      return <span key={tag} style={{ backgroundColor: bg, color, border: `1px solid ${color}44`, borderRadius: '5px', padding: '3px 8px', fontSize: '11px', fontWeight: 500 }}>{tag}</span>
                    })}
                  </div>
                </div>
              )}
              {(d?.prediction1Month != null || d?.prediction1Year != null) && (
                <div style={CARD_STYLE}>
                  <div style={SECTION_TITLE}><TrendingUp size={13} color="#B4B4B4" /> Satış Tahminleri</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {d?.prediction1Month != null && <div style={{ backgroundColor: '#0A0A0A', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontSize: '10px', color: '#8F8F8F', fontWeight: 600, marginBottom: '4px' }}>1 Aylık Tahmin</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#3DD68C', lineHeight: 1 }}>{fmt(d.prediction1Month)}</div>
                      <div style={{ fontSize: '11px', color: '#8F8F8F', marginTop: '2px' }}>kopya</div>
                    </div>}
                    {d?.prediction1Year != null && <div style={{ backgroundColor: '#0A0A0A', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontSize: '10px', color: '#8F8F8F', fontWeight: 600, marginBottom: '4px' }}>1 Yıllık Tahmin</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#BAA7FF', lineHeight: 1 }}>{fmt(d.prediction1Year)}</div>
                      <div style={{ fontSize: '11px', color: '#8F8F8F', marginTop: '2px' }}>kopya</div>
                    </div>}
                  </div>
                </div>
              )}
              {d?.reviewScore != null && (
                <div style={{ ...CARD_STYLE, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '12px', backgroundColor: `${scoreColor(d.reviewScore)}22`, border: `2px solid ${scoreColor(d.reviewScore)}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: scoreColor(d.reviewScore) }}>{d.reviewScore}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#8F8F8F', fontWeight: 600, }}>İnceleme Skoru</div>
                    <div style={{ fontSize: '13px', color: '#B4B4B4', marginTop: '2px' }}>{d.reviewScore >= 80 ? 'Çok Olumlu' : d.reviewScore >= 60 ? 'Olumlu' : 'Karışık'}</div>
                    {d.reviewCount != null && <div style={{ fontSize: '11px', color: '#8F8F8F', marginTop: '1px' }}>{fmt(d.reviewCount)} değerlendirme</div>}
                  </div>
                </div>
              )}
              {(genres.length > 0 || features.length > 0) && (
                <div style={CARD_STYLE}>
                  {genres.length > 0 && <>
                    <div style={SECTION_TITLE}><BarChart2 size={13} color="#B4B4B4" /> Türler</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: features.length ? '12px' : 0 }}>
                      {genres.map(g => <span key={g} style={{ fontSize: '11px', color: '#BAA7FF', backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '5px', padding: '3px 8px' }}>{g}</span>)}
                    </div>
                  </>}
                  {features.length > 0 && <>
                    <div style={{ ...SECTION_TITLE, marginTop: genres.length ? '4px' : 0 }}><Star size={13} color="#B4B4B4" /> Özellikler</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {features.slice(0, 12).map(f => (
                        <div key={f} style={{ fontSize: '12px', color: '#B4B4B4', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#9EB1FF', flexShrink: 0 }} />
                          {f}
                        </div>
                      ))}
                    </div>
                  </>}
                </div>
              )}
              {(devs.length > 0 || pubs.length > 0) && (
                <div style={CARD_STYLE}>
                  {devs.length > 0 && <div style={{ marginBottom: pubs.length ? '12px' : 0 }}>
                    <div style={SECTION_TITLE}>Geliştirici</div>
                    {devs.map(d => <div key={d} style={{ fontSize: '12px', color: '#EDEDED', fontWeight: 500 }}>{d}</div>)}
                  </div>}
                  {pubs.length > 0 && <div>
                    <div style={SECTION_TITLE}>Yayıncı</div>
                    {pubs.map(p => <div key={p} style={{ fontSize: '12px', color: '#EDEDED', fontWeight: 500 }}>{p}</div>)}
                  </div>}
                </div>
              )}
              {s?.supportedLanguages && (
                <Collapsible title="Dil Desteği" icon={Globe}>
                  <p style={{ fontSize: '12px', color: '#B4B4B4', lineHeight: 1.65, margin: 0 }}>
                    {s.supportedLanguages.replace(/<[^>]+>/g, '').replace(/\*/g, '').trim()}
                  </p>
                </Collapsible>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Search view ────────────────────────────────────────────────────────────────

  return (
    <div style={{ overflowX: 'hidden', maxWidth: '100%' }}>
      <style>{`
        .gama-scroll::-webkit-scrollbar { display: none; }
        .tot-btn:hover      { border-color: #9E8CFC !important; }
        .search-input:focus { border-color: #9E8CFC !important; }
        .history-card:hover { border-color: #9E8CFC !important; }
        .result-card:hover  { border-color: #9E8CFC !important; transform: translateY(-2px); }
      `}</style>

      {/* Page header */}
      <div style={{ padding: '28px 32px 24px', borderBottom: '1px solid #262626', backgroundColor: '#0A0A0A', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', flexShrink: 0, padding: '6px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://gamalytic.com/gamalytic_logo.svg" alt="Gamalytic" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#EDEDED', margin: 0 }}>Gamalytic</h1>
          <p style={{ fontSize: '13px', color: '#8F8F8F', margin: '2px 0 0' }}>Steam oyunu arayın, detaylı satış ve analitik verilerini görün</p>
        </div>
      </div>

      <div style={{ padding: '28px 32px' }}>

        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#8F8F8F', marginBottom: '10px' }}>
            🎮 Demo Vitrini
          </div>
          <DemoCarousel onSelect={handleSelectGame} />
        </div>

        {/* ── Search bar + Tales of the Trade button ── */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
          <div style={{ flex: 1, maxWidth: '560px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <Search size={17} color="#8F8F8F" />
            </div>
            <input
              className="search-input"
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', padding: '13px 42px 13px 44px', fontSize: '15px', color: '#EDEDED', outline: 'none', transition: 'border-color 0.15s' }}
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]) }}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8F8F8F', display: 'flex', padding: 0 }}>
                <X size={16} />
              </button>
            )}
          </div>

          <button
            className="tot-btn"
            onClick={loadTalesOfTheTrade}
            title="Tales of the Trade verilerini yükle"
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', padding: '10px 16px', cursor: 'pointer', transition: 'border-color 0.15s' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/uniqlogo.png" alt="Unique NPC" style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '4px' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#B4B4B4', whiteSpace: 'nowrap' }}>Tales of the Trade</span>
          </button>
        </div>

        {/* ── Son Aramalar ── */}
        {searchHistory.length > 0 && !query && !results.length && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#8F8F8F', marginBottom: '10px' }}>
              Son Aramalar
            </div>
            <div className="gama-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
              {searchHistory.map(item => (
                <div key={item.appid} style={{ flexShrink: 0, position: 'relative' }}>
                  <button
                    className="history-card"
                    onClick={() => handleSelectGame({ id: item.appid, name: item.name, tiny_image: item.imageUrl })}
                    style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '10px', padding: '6px 6px 8px', cursor: 'pointer', width: '140px', transition: 'border-color 0.15s', textAlign: 'left' }}
                  >
                    <div style={{ position: 'relative', width: '100%', height: '50px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#0A0A0A' }}>
                      <Image src={item.imageUrl} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="140px" />
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: '#B4B4B4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: '2px' }}>
                      {item.name}
                    </div>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); removeFromHistory(item.appid) }}
                    style={{ position: 'absolute', top: '2px', right: '2px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#262626', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#8F8F8F', padding: 0 }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Results / empty state ── */}
        {searching ? (
          <div style={{ textAlign: 'center', color: '#8F8F8F', fontSize: '14px', padding: '40px 0' }}>Aranıyor…</div>
        ) : results.length > 0 ? (
          <div>
            <div style={{ fontSize: '13px', color: '#8F8F8F', marginBottom: '14px' }}>{results.length} sonuç bulundu</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {results.map(item => {
                const disc = item.price?.discount_percent && item.price.discount_percent > 0
                const fin  = item.price ? (item.price.final   / 100).toFixed(2) : null
                const orig = item.price ? (item.price.initial / 100).toFixed(2) : null
                return (
                  <button key={item.id} className="result-card" onClick={() => handleSelectGame(item)}
                    style={{ background: 'none', border: '1px solid var(--color-border-card)', borderRadius: '12px', padding: 0, cursor: 'pointer', textAlign: 'left', overflow: 'hidden', backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', transition: 'border-color 0.2s, transform 0.15s' }}>
                    <div style={{ position: 'relative', width: '100%', height: '120px', overflow: 'hidden', borderBottom: '1px solid #262626' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.tiny_image} alt={item.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '12px 14px 14px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#EDEDED', marginBottom: '8px', lineHeight: 1.35 }}>{item.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {disc && <span style={{ backgroundColor: '#22c55e', color: '#0A0A0A', fontSize: '10px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px' }}>-{item.price!.discount_percent}%</span>}
                          {fin != null && <span style={{ fontSize: '13px', fontWeight: 700, color: '#3DD68C' }}>${fin}</span>}
                          {disc && orig && <span style={{ fontSize: '11px', color: '#8F8F8F', textDecoration: 'line-through' }}>${orig}</span>}
                          {!fin && <span style={{ fontSize: '12px', color: '#8F8F8F' }}>Ücretsiz</span>}
                        </div>
                        {item.metascore && <span style={{ fontSize: '11px', fontWeight: 700, color: '#FFB224', backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '5px', padding: '2px 6px' }}>MC {item.metascore}</span>}
                      </div>
                      {item.platforms && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                          {item.platforms.windows && <span style={{ fontSize: '10px', color: '#70B8FF', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: '4px', padding: '1px 6px' }}>Win</span>}
                          {item.platforms.mac     && <span style={{ fontSize: '10px', color: '#B4B4B4', backgroundColor: 'rgba(148,163,184,0.1)', borderRadius: '4px', padding: '1px 6px' }}>Mac</span>}
                          {item.platforms.linux   && <span style={{ fontSize: '10px', color: '#FFB224', backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: '4px', padding: '1px 6px' }}>Linux</span>}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : query && !searching ? (
          <div style={{ textAlign: 'center', color: '#8F8F8F', fontSize: '14px', padding: '40px 0' }}>&ldquo;{query}&rdquo; için sonuç bulunamadı</div>
        ) : !searchHistory.length ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #7c3aed22, #4f46e522)', border: '1px solid #262626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <BarChart2 size={28} color="#9E8CFC" />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#EDEDED', marginBottom: '6px' }}>Oyun Analitikleri</div>
            <div style={{ fontSize: '13px', color: '#8F8F8F' }}>Aramak istediğiniz Steam oyununun adını yazın</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
