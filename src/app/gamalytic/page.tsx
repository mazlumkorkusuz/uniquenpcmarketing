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
import { inkOf, tint } from '@/lib/theme'
import PageHeader from '@/components/PageHeader'

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
  ['color-mix(in srgb, var(--primary) 15%, transparent)', 'var(--primary-ink)'], ['color-mix(in srgb, var(--info) 15%, transparent)', 'var(--info)'],
  ['color-mix(in srgb, var(--teal) 15%, transparent)', 'var(--teal)'], ['color-mix(in srgb, var(--orange) 15%, transparent)', 'var(--orange)'],
  ['color-mix(in srgb, var(--danger) 15%, transparent)', 'var(--danger)'],  ['color-mix(in srgb, var(--success) 15%, transparent)', 'var(--success)'],
  ['color-mix(in srgb, var(--warning) 15%, transparent)', 'var(--orange)'],
]

const CARD_STYLE = { backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '20px', padding: '20px' }
const SECTION_TITLE: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600, color: 'var(--text-2)',
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
  if (!s) return 'var(--muted-foreground)'
  return s >= 80 ? 'var(--success)' : s >= 60 ? 'var(--orange)' : 'var(--danger)'
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
        <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: 600, marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.1 }}>{value}</div>
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
            <div style={{ width: '96px', fontSize: '12px', color: 'var(--text-2)', flexShrink: 0 }}>{countryName(code)}</div>
            <div style={{ flex: 1, height: '7px', backgroundColor: 'var(--muted)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(barW, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #6D28D9, #4338CA)', borderRadius: '4px' }} />
            </div>
            <div style={{ width: '38px', fontSize: '11px', color: 'var(--muted-foreground)', textAlign: 'right', flexShrink: 0 }}>{pct.toFixed(1)}%</div>
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
    <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: 'var(--foreground)' }}>
      <div style={{ color: 'var(--text-2)', marginBottom: '4px' }}>{label}</div>
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
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: '13px' }}>
      {mounted ? 'Veri yok' : ''}
    </div>
  )
  const step = Math.max(1, Math.floor(data.length / 12))
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E4F1" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#655F7D' }} tickLine={false} axisLine={false} interval={step - 1} />
        <YAxis tick={{ fontSize: 10, fill: '#655F7D' }} tickLine={false} axisLine={false} tickFormatter={fmtTick} width={40} />
        <Tooltip content={<ChartTooltip />} />
        <Line type="monotone" dataKey="sales" stroke="#6D28D9" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#6D28D9' }} />
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
        <span style={{ ...SECTION_TITLE, marginBottom: 0 }}><Icon size={13} color="#4A4462" /> {title}</span>
        {open ? <ChevronUp size={15} color="#655F7D" /> : <ChevronDown size={15} color="#655F7D" />}
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
        <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--card)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-2)', fontSize: '12px', padding: '5px 11px', cursor: 'pointer' }}>
            <ChevronLeft size={14} /> Geri
          </button>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)' }}>{selected.name}</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--muted-foreground)' }}>Steam ID: {selected.id}</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '34px', height: '34px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ color: 'var(--muted-foreground)', fontSize: '13px' }}>Yükleniyor…</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : error ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--danger)', fontSize: '14px' }}>{error}</div>
        ) : (
          <div style={{ display: 'flex', gap: '20px', padding: '24px 28px', alignItems: 'flex-start' }}>
            {/* LEFT COLUMN */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '460/215', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={headerImg} alt={selected.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 8px' }}>{d?.name ?? selected.name}</h1>
                {(s?.shortDescription || d?.description) && (
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
                    {s?.shortDescription ?? (d!.description!.length > 300 ? d!.description!.slice(0, 300) + '…' : d!.description)}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                {s?.isFree ? (
                  <span style={{ backgroundColor: 'color-mix(in srgb, var(--success) 15%, transparent)', color: 'var(--success)', border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)', borderRadius: '8px', padding: '6px 14px', fontSize: '14px', fontWeight: 700 }}>Ücretsiz</span>
                ) : s?.priceOverview ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {s.priceOverview.discountPercent > 0 && <span style={{ backgroundColor: 'var(--success)', color: 'var(--foreground)', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: 700 }}>-{s.priceOverview.discountPercent}%</span>}
                    <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)' }}>{s.priceOverview.finalFormatted}</span>
                    {s.priceOverview.discountPercent > 0 && <span style={{ fontSize: '13px', color: 'var(--muted-foreground)', textDecoration: 'line-through' }}>{s.priceOverview.initialFormatted}</span>}
                  </div>
                ) : d?.releaseDate ? <span style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>{d.releaseDate}</span> : null}
                {s?.metacritic && (
                  <a href={s.metacritic.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '7px', textDecoration: 'none', backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--warning) 25%, transparent)', borderRadius: '8px', padding: '6px 12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1 }}>{s.metacritic.score}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--orange)', fontWeight: 600, letterSpacing: '0.04em' }}>METACRİTİC</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-2)' }}>İncele</div>
                    </div>
                    <ExternalLink size={12} color="#655F7D" />
                  </a>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '10px' }}>
                <StatCard icon={DollarSign} iconColor="#047857"  iconBg="rgba(34,197,94,0.12)"   label="Tahmini Gelir"  value={fmtUSD(d?.revenue)} />
                <StatCard icon={Globe}      iconColor="#1D4ED8"  iconBg="rgba(59,130,246,0.12)"  label="Satılan Kopya"  value={fmt(d?.copiesSold)} />
                <StatCard icon={Star}       iconColor="#B45309"  iconBg="rgba(245,158,11,0.12)"  label="İnceleme Skoru" value={d?.reviewScore != null ? `${d.reviewScore}/100` : '—'} />
                <StatCard icon={Heart}      iconColor="#B91C1C"  iconBg="rgba(239,68,68,0.12)"   label="Takipçi"        value={fmt(d?.followers)} />
                <StatCard icon={Users}      iconColor="#C2410C"  iconBg="rgba(249,115,22,0.12)"  label="Toplam Oyuncu"  value={fmt(d?.players)} />
                <StatCard icon={TrendingUp} iconColor="#6D28D9"  iconBg="rgba(124,58,237,0.12)"  label="İstek Listesi"  value={fmt(d?.wishlists)} />
                <StatCard icon={Clock}      iconColor="#0F766E"  iconBg="rgba(20,184,166,0.12)"  label="Ort. Oynama"    value={d?.avgPlaytime != null ? `${Number(d.avgPlaytime).toFixed(1)} saat` : '—'} />
              </div>
              {d?.history && d.history.length > 1 && (
                <div style={CARD_STYLE}>
                  <div style={SECTION_TITLE}><TrendingUp size={13} color="#4A4462" /> Satış Geçmişi</div>
                  <SalesHistoryChart history={d.history} />
                </div>
              )}
              {d?.countryData && Object.keys(d.countryData).length > 0 && (
                <div style={CARD_STYLE}>
                  <div style={SECTION_TITLE}><Globe size={13} color="#4A4462" /> Ülke Dağılımı (Top 10)</div>
                  <CountryDistribution data={d.countryData} />
                </div>
              )}
              {s?.pcRequirements && (s.pcRequirements.minimum || s.pcRequirements.recommended) && (
                <Collapsible title="Sistem Gereksinimleri" icon={Cpu}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {s.pcRequirements.minimum && <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--danger)', marginBottom: '6px', }}>Minimum</div>
                      <pre style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{s.pcRequirements.minimum}</pre>
                    </div>}
                    {s.pcRequirements.recommended && <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)', marginBottom: '6px', }}>Önerilen</div>
                      <pre style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{s.pcRequirements.recommended}</pre>
                    </div>}
                  </div>
                </Collapsible>
              )}
              {s?.dlc && s.dlc.length > 0 && (
                <div style={CARD_STYLE}>
                  <div style={SECTION_TITLE}><Gamepad2 size={13} color="#4A4462" /> DLC ({s.dlc.length})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {s.dlc.slice(0, 20).map(id => (
                      <a key={id} href={`https://store.steampowered.com/app/${id}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '11px', color: 'var(--info)', backgroundColor: 'color-mix(in srgb, var(--info) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--info) 20%, transparent)', borderRadius: '5px', padding: '3px 8px', textDecoration: 'none' }}>
                        #{id}
                      </a>
                    ))}
                    {s.dlc.length > 20 && <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>+{s.dlc.length - 20} daha</span>}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '14px', position: 'sticky', top: '16px' }}>
              {d?.tags && d.tags.length > 0 && (
                <div style={CARD_STYLE}>
                  <div style={SECTION_TITLE}><Tag size={13} color="#4A4462" /> Etiketler</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                    {d.tags.map((tag, i) => {
                      const [bg, color] = TAG_COLORS[i % TAG_COLORS.length]
                      return <span key={tag} style={{ backgroundColor: bg, color: inkOf(color), border: `1px solid ${tint(color, 27)}`, borderRadius: '5px', padding: '3px 8px', fontSize: '11px', fontWeight: 500 }}>{tag}</span>
                    })}
                  </div>
                </div>
              )}
              {(d?.prediction1Month != null || d?.prediction1Year != null) && (
                <div style={CARD_STYLE}>
                  <div style={SECTION_TITLE}><TrendingUp size={13} color="#4A4462" /> Satış Tahminleri</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {d?.prediction1Month != null && <div style={{ backgroundColor: 'var(--card)', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: 600, marginBottom: '4px' }}>1 Aylık Tahmin</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--success)', lineHeight: 1 }}>{fmt(d.prediction1Month)}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>kopya</div>
                    </div>}
                    {d?.prediction1Year != null && <div style={{ backgroundColor: 'var(--card)', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: 600, marginBottom: '4px' }}>1 Yıllık Tahmin</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary-ink)', lineHeight: 1 }}>{fmt(d.prediction1Year)}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>kopya</div>
                    </div>}
                  </div>
                </div>
              )}
              {d?.reviewScore != null && (
                <div style={{ ...CARD_STYLE, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '12px', backgroundColor: `${tint(scoreColor(d.reviewScore), 13)}`, border: `2px solid ${tint(scoreColor(d.reviewScore), 33)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: scoreColor(d.reviewScore) }}>{d.reviewScore}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: 600, }}>İnceleme Skoru</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '2px' }}>{d.reviewScore >= 80 ? 'Çok Olumlu' : d.reviewScore >= 60 ? 'Olumlu' : 'Karışık'}</div>
                    {d.reviewCount != null && <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '1px' }}>{fmt(d.reviewCount)} değerlendirme</div>}
                  </div>
                </div>
              )}
              {(genres.length > 0 || features.length > 0) && (
                <div style={CARD_STYLE}>
                  {genres.length > 0 && <>
                    <div style={SECTION_TITLE}><BarChart2 size={13} color="#4A4462" /> Türler</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: features.length ? '12px' : 0 }}>
                      {genres.map(g => <span key={g} style={{ fontSize: '11px', color: 'var(--primary-ink)', backgroundColor: 'color-mix(in srgb, var(--primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)', borderRadius: '5px', padding: '3px 8px' }}>{g}</span>)}
                    </div>
                  </>}
                  {features.length > 0 && <>
                    <div style={{ ...SECTION_TITLE, marginTop: genres.length ? '4px' : 0 }}><Star size={13} color="#4A4462" /> Özellikler</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {features.slice(0, 12).map(f => (
                        <div key={f} style={{ fontSize: '12px', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--info)', flexShrink: 0 }} />
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
                    {devs.map(d => <div key={d} style={{ fontSize: '12px', color: 'var(--foreground)', fontWeight: 500 }}>{d}</div>)}
                  </div>}
                  {pubs.length > 0 && <div>
                    <div style={SECTION_TITLE}>Yayıncı</div>
                    {pubs.map(p => <div key={p} style={{ fontSize: '12px', color: 'var(--foreground)', fontWeight: 500 }}>{p}</div>)}
                  </div>}
                </div>
              )}
              {s?.supportedLanguages && (
                <Collapsible title="Dil Desteği" icon={Globe}>
                  <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
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
        .tot-btn:hover      { border-color: var(--primary-ink) !important; }
        .search-input:focus { border-color: var(--primary-ink) !important; }
        .history-card:hover { border-color: var(--primary-ink) !important; }
        .result-card:hover  { border-color: var(--primary-ink) !important; transform: translateY(-2px); }
      `}</style>

      <PageHeader
        title="Gamalytic"
        subtitle="Steam oyunu arayın, detaylı satış ve analitik verilerini görün"
        imageSrc="/icons/gamalytic-logo.svg"
        gradient="linear-gradient(135deg, #7C3AED, #E11D48)"
      />

      <div style={{ padding: '28px 32px' }}>

        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: '10px' }}>
            <Gamepad2 size={14} aria-hidden /> Demo Vitrini
          </div>
          <DemoCarousel onSelect={handleSelectGame} />
        </div>

        {/* ── Search bar + Tales of the Trade button ── */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
          <div style={{ flex: 1, maxWidth: '560px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <Search size={17} color="#655F7D" />
            </div>
            <input
              className="search-input"
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', padding: '13px 42px 13px 44px', fontSize: '15px', color: 'var(--foreground)', outline: 'none', transition: 'border-color 0.15s' }}
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]) }}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', display: 'flex', padding: 0 }}>
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
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>Tales of the Trade</span>
          </button>
        </div>

        {/* ── Son Aramalar ── */}
        {searchHistory.length > 0 && !query && !results.length && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '10px' }}>
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
                    <div style={{ position: 'relative', width: '100%', height: '50px', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--card)' }}>
                      <Image src={item.imageUrl} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="140px" />
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: '2px' }}>
                      {item.name}
                    </div>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); removeFromHistory(item.appid) }}
                    style={{ position: 'absolute', top: '2px', right: '2px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'var(--muted)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 0 }}
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
          <div style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '14px', padding: '40px 0' }}>Aranıyor…</div>
        ) : results.length > 0 ? (
          <div>
            <div style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '14px' }}>{results.length} sonuç bulundu</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {results.map(item => {
                const disc = item.price?.discount_percent && item.price.discount_percent > 0
                const fin  = item.price ? (item.price.final   / 100).toFixed(2) : null
                const orig = item.price ? (item.price.initial / 100).toFixed(2) : null
                return (
                  <button key={item.id} className="result-card" onClick={() => handleSelectGame(item)}
                    style={{ background: 'none', border: '1px solid var(--color-border-card)', borderRadius: '12px', padding: 0, cursor: 'pointer', textAlign: 'left', overflow: 'hidden', backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', transition: 'border-color 0.2s, transform 0.15s' }}>
                    <div style={{ position: 'relative', width: '100%', height: '120px', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.tiny_image} alt={item.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '12px 14px 14px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px', lineHeight: 1.35 }}>{item.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {disc && <span style={{ backgroundColor: 'var(--success)', color: 'var(--foreground)', fontSize: '10px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px' }}>-{item.price!.discount_percent}%</span>}
                          {fin != null && <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>${fin}</span>}
                          {disc && orig && <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', textDecoration: 'line-through' }}>${orig}</span>}
                          {!fin && <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Ücretsiz</span>}
                        </div>
                        {item.metascore && <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--orange)', backgroundColor: 'color-mix(in srgb, var(--warning) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--warning) 25%, transparent)', borderRadius: '5px', padding: '2px 6px' }}>MC {item.metascore}</span>}
                      </div>
                      {item.platforms && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                          {item.platforms.windows && <span style={{ fontSize: '10px', color: 'var(--info)', backgroundColor: 'color-mix(in srgb, var(--info) 10%, transparent)', borderRadius: '4px', padding: '1px 6px' }}>Win</span>}
                          {item.platforms.mac     && <span style={{ fontSize: '10px', color: 'var(--text-2)', backgroundColor: 'color-mix(in srgb, var(--info) 10%, transparent)', borderRadius: '4px', padding: '1px 6px' }}>Mac</span>}
                          {item.platforms.linux   && <span style={{ fontSize: '10px', color: 'var(--orange)', backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)', borderRadius: '4px', padding: '1px 6px' }}>Linux</span>}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : query && !searching ? (
          <div style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '14px', padding: '40px 0' }}>&ldquo;{query}&rdquo; için sonuç bulunamadı</div>
        ) : !searchHistory.length ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #7c3aed22, #4f46e522)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <BarChart2 size={28} color="#6D28D9" />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>Oyun Analitikleri</div>
            <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>Aramak istediğiniz Steam oyununun adını yazın</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
