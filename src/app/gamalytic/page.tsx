'use client'

import { useState, useRef, useCallback } from 'react'
import {
  BarChart2,
  Search,
  X,
  Star,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  Heart,
  ChevronLeft,
  Tag,
  Globe,
  Calendar,
  MessageCircle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SteamItem {
  id: number
  name: string
  tiny_image: string
  price?: { final: number; initial: number; discount_percent: number }
  metascore?: string
  platforms?: { windows: boolean; mac: boolean; linux: boolean }
}

interface GamalyticData {
  name?: string
  steamId?: number
  headerImage?: string
  description?: string
  releaseDate?: string
  price?: number
  reviewScore?: number
  reviewCount?: number
  followerCount?: number
  avgPlaytime?: number
  copiesSold?: number
  revenue?: number
  peakPlayers?: number
  wishlists?: number
  tags?: string[]
  countryData?: Record<string, number>
  prediction1Month?: number
  prediction1Year?: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n?: number | null) {
  if (n == null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

function fmtUSD(n?: number | null) {
  if (n == null) return '—'
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'k'
  return '$' + n.toFixed(2)
}

function scoreColor(score?: number | null) {
  if (!score) return '#64748b'
  if (score >= 80) return '#4ade80'
  if (score >= 60) return '#fbbf24'
  return '#f87171'
}

const TAG_COLORS: [string, string][] = [
  ['rgba(124,58,237,0.15)', '#a78bfa'],
  ['rgba(59,130,246,0.15)', '#60a5fa'],
  ['rgba(20,184,166,0.15)', '#2dd4bf'],
  ['rgba(249,115,22,0.15)', '#fb923c'],
  ['rgba(239,68,68,0.15)', '#f87171'],
  ['rgba(34,197,94,0.15)', '#4ade80'],
  ['rgba(245,158,11,0.15)', '#fbbf24'],
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function MiniStatCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>
  iconColor: string
  iconBg: string
  label: string
  value: string
}) {
  return (
    <div
      style={{
        backgroundColor: '#1a1a24',
        border: '1px solid #2a2a3a',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '9px',
          backgroundColor: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={17} color={iconColor} />
      </div>
      <div>
        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
          {label}
        </div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  )
}

function CountryBar({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  const max = Math.max(...entries.map(([, v]) => v), 1)
  if (entries.length === 0) return <div style={{ color: '#475569', fontSize: '13px' }}>Veri yok</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {entries.map(([country, pct]) => (
        <div key={country} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '80px', fontSize: '12px', color: '#94a3b8', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {country}
          </div>
          <div style={{ flex: 1, height: '8px', backgroundColor: '#2a2a3a', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${(pct / max) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
                borderRadius: '4px',
              }}
            />
          </div>
          <div style={{ width: '40px', fontSize: '11px', color: '#64748b', textAlign: 'right', flexShrink: 0 }}>
            {pct <= 1 ? `${(pct * 100).toFixed(1)}%` : `${pct.toFixed(1)}%`}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function GamalyticPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SteamItem[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<SteamItem | null>(null)
  const [gameData, setGameData] = useState<GamalyticData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/steam-search?q=${encodeURIComponent(value)}`)
        const data = await res.json()
        setResults(data.items ?? [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
  }, [])

  const handleSelectGame = useCallback(async (item: SteamItem) => {
    setSelected(item)
    setResults([])
    setQuery('')
    setGameData(null)
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/gamalytic?appId=${item.id}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setGameData(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Veri alınamadı')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleBack = useCallback(() => {
    setSelected(null)
    setGameData(null)
    setError(null)
  }, [])

  // ── Detail panel ──────────────────────────────────────────────────────────

  if (selected) {
    const d = gameData
    const headerImg = d?.headerImage ?? `https://cdn.akamai.steamstatic.com/steam/apps/${selected.id}/header.jpg`

    return (
      <div>
        {/* Top bar */}
        <div style={{ padding: '20px 32px', borderBottom: '1px solid #2a2a3a', backgroundColor: '#13131a', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleBack}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid #2a2a3a', borderRadius: '8px', color: '#94a3b8', fontSize: '13px', padding: '6px 12px', cursor: 'pointer' }}
          >
            <ChevronLeft size={15} /> Geri
          </button>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>{selected.name}</div>
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#475569' }}>Steam ID: {selected.id}</div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #2a2a3a', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ color: '#64748b', fontSize: '14px' }}>Gamalytic verisi yükleniyor…</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : error ? (
          <div style={{ padding: '48px 32px', textAlign: 'center', color: '#f87171', fontSize: '14px' }}>{error}</div>
        ) : (
          <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Header image + info */}
            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'flex-start' }}>
              <img
                src={headerImg}
                alt={selected.name}
                style={{ width: '100%', borderRadius: '12px', border: '1px solid #2a2a3a', objectFit: 'cover' }}
              />
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f1f5f9', margin: '0 0 8px' }}>{d?.name ?? selected.name}</h1>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {d?.releaseDate && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#94a3b8' }}>
                      <Calendar size={13} /> {d.releaseDate}
                    </span>
                  )}
                  {d?.price != null && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#4ade80', fontWeight: 600 }}>
                      <DollarSign size={13} /> {fmtUSD(d.price)}
                    </span>
                  )}
                  {d?.reviewScore != null && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: scoreColor(d.reviewScore), fontWeight: 600 }}>
                      <Star size={13} /> {d.reviewScore}%
                    </span>
                  )}
                </div>
                {d?.description && (
                  <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                    {d.description.length > 400 ? d.description.slice(0, 400) + '…' : d.description}
                  </p>
                )}
              </div>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
              <MiniStatCard icon={MessageCircle} iconColor="#a78bfa" iconBg="rgba(124,58,237,0.12)" label="Değerlendirme" value={fmt(d?.reviewCount)} />
              <MiniStatCard icon={Star} iconColor="#fbbf24" iconBg="rgba(245,158,11,0.12)" label="Puan" value={d?.reviewScore != null ? `${d.reviewScore}%` : '—'} />
              <MiniStatCard icon={Heart} iconColor="#f87171" iconBg="rgba(239,68,68,0.12)" label="Takipçi" value={fmt(d?.followerCount)} />
              <MiniStatCard icon={Clock} iconColor="#2dd4bf" iconBg="rgba(20,184,166,0.12)" label="Ort. Süre" value={d?.avgPlaytime != null ? `${d.avgPlaytime}h` : '—'} />
              <MiniStatCard icon={Globe} iconColor="#60a5fa" iconBg="rgba(59,130,246,0.12)" label="Kopya Satışı" value={fmt(d?.copiesSold)} />
              <MiniStatCard icon={DollarSign} iconColor="#4ade80" iconBg="rgba(34,197,94,0.12)" label="Gelir" value={fmtUSD(d?.revenue)} />
              <MiniStatCard icon={Users} iconColor="#fb923c" iconBg="rgba(249,115,22,0.12)" label="Oyuncu" value={fmt(d?.peakPlayers)} />
              <MiniStatCard icon={Heart} iconColor="#f472b6" iconBg="rgba(236,72,153,0.12)" label="İstek Listesi" value={fmt(d?.wishlists)} />
            </div>

            {/* Country distribution */}
            {d?.countryData && Object.keys(d.countryData).length > 0 && (
              <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={15} color="#60a5fa" /> Ülke Dağılımı (Top 10)
                </div>
                <CountryBar data={d.countryData} />
              </div>
            )}

            {/* Sales predictions */}
            {(d?.prediction1Month != null || d?.prediction1Year != null) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {d?.prediction1Month != null && (
                  <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingUp size={13} color="#4ade80" /> 1 Aylık Satış Tahmini
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#4ade80' }}>{fmt(d.prediction1Month)}</div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>kopya</div>
                  </div>
                )}
                {d?.prediction1Year != null && (
                  <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingUp size={13} color="#a78bfa" /> 1 Yıllık Satış Tahmini
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#a78bfa' }}>{fmt(d.prediction1Year)}</div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>kopya</div>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {d?.tags && d.tags.length > 0 && (
              <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={15} color="#fbbf24" /> Etiketler
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {d.tags.map((tag, i) => {
                    const [bg, color] = TAG_COLORS[i % TAG_COLORS.length]
                    return (
                      <span
                        key={tag}
                        style={{
                          backgroundColor: bg,
                          color,
                          border: `1px solid ${color}44`,
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        {tag}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    )
  }

  // ── Search view ───────────────────────────────────────────────────────────

  return (
    <div>
      {/* Page header */}
      <div style={{ padding: '28px 32px 24px', borderBottom: '1px solid #2a2a3a', backgroundColor: '#13131a', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(124,58,237,0.3)', flexShrink: 0 }}>
          <BarChart2 size={22} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Gamalytic</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0' }}>Steam oyunu arayın, detaylı satış ve analitik verilerini görün</p>
        </div>
      </div>

      <div style={{ padding: '32px' }}>
        {/* Search bar */}
        <div style={{ maxWidth: '600px', margin: '0 auto 32px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <Search size={17} color="#64748b" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Oyun adı yazın… (ör. Counter-Strike, Elden Ring)"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              backgroundColor: '#1a1a24',
              border: '1px solid #2a2a3a',
              borderRadius: '12px',
              padding: '13px 42px 13px 44px',
              fontSize: '15px',
              color: '#f1f5f9',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#7c3aed' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a3a' }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]) }}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search results */}
        {searching ? (
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', padding: '40px 0' }}>Aranıyor…</div>
        ) : results.length > 0 ? (
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>{results.length} sonuç bulundu</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {results.map((item) => {
                const discounted = item.price?.discount_percent && item.price.discount_percent > 0
                const finalPrice = item.price ? (item.price.final / 100).toFixed(2) : null
                const origPrice = item.price ? (item.price.initial / 100).toFixed(2) : null

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectGame(item)}
                    style={{
                      background: 'none',
                      border: '1px solid #2a2a3a',
                      borderRadius: '12px',
                      padding: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                      overflow: 'hidden',
                      backgroundColor: '#1a1a24',
                      transition: 'border-color 0.2s, transform 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#7c3aed'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#2a2a3a'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <img
                      src={item.tiny_image}
                      alt={item.name}
                      style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block', borderBottom: '1px solid #2a2a3a' }}
                    />
                    <div style={{ padding: '12px 14px 14px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginBottom: '8px', lineHeight: 1.35 }}>{item.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                        {/* Price */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {discounted && (
                            <span style={{ backgroundColor: '#22c55e', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px' }}>
                              -{item.price!.discount_percent}%
                            </span>
                          )}
                          {finalPrice != null && (
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#4ade80' }}>${finalPrice}</span>
                          )}
                          {discounted && origPrice && (
                            <span style={{ fontSize: '11px', color: '#64748b', textDecoration: 'line-through' }}>${origPrice}</span>
                          )}
                          {!finalPrice && <span style={{ fontSize: '12px', color: '#64748b' }}>Ücretsiz</span>}
                        </div>
                        {/* Metascore */}
                        {item.metascore && (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '5px', padding: '2px 6px' }}>
                            MC {item.metascore}
                          </span>
                        )}
                      </div>
                      {/* Platforms */}
                      {item.platforms && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                          {item.platforms.windows && <span style={{ fontSize: '10px', color: '#60a5fa', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: '4px', padding: '1px 6px' }}>Win</span>}
                          {item.platforms.mac && <span style={{ fontSize: '10px', color: '#94a3b8', backgroundColor: 'rgba(148,163,184,0.1)', borderRadius: '4px', padding: '1px 6px' }}>Mac</span>}
                          {item.platforms.linux && <span style={{ fontSize: '10px', color: '#fbbf24', backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: '4px', padding: '1px 6px' }}>Linux</span>}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : query && !searching ? (
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', padding: '40px 0' }}>
            &ldquo;{query}&rdquo; için sonuç bulunamadı
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #7c3aed22, #4f46e522)', border: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <BarChart2 size={28} color="#7c3aed" />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#f1f5f9', marginBottom: '6px' }}>Oyun Analitikleri</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Aramak istediğiniz Steam oyununun adını yazın</div>
          </div>
        )}
      </div>
    </div>
  )
}
