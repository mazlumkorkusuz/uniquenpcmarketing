'use client'
import { useState, useEffect, useMemo } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import PageHeader from '@/components/PageHeader'
import { CuratorModal, EditCuratorButton } from '@/components/CuratorModal'
import { DeleteButton } from '@/components/DeleteButton'
import { Search, ExternalLink } from 'lucide-react'

type Row = Record<string, unknown>
type SortKey = 'followers' | 'score' | 'recommendation_rate' | 'total_reviews'
type SortDir = 'asc' | 'desc'

// ── helpers ───────────────────────────────────────────────────────────────
function fmt(n: unknown): string {
  const v = Number(n)
  if (!n && n !== 0) return '—'
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M'
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K'
  return v.toLocaleString('en-US')
}

function initials(name: unknown): string {
  return String(name ?? '').trim().slice(0, 2).toUpperCase() || '??'
}

function groupColor(group: unknown): string {
  const g = String(group ?? '').toLowerCase()
  if (g.includes('büyük')) return '#f87171'
  if (g.includes('orta')) return '#fbbf24'
  if (g.includes('küçük')) return '#4ade80'
  return '#94a3b8'
}

function parseRate(v: unknown): number {
  return parseFloat(String(v ?? '0').replace('%', '')) || 0
}

// ── sub-components ────────────────────────────────────────────────────────
function GroupBadge({ group }: { group: unknown }) {
  if (!group) return null
  const color = groupColor(group)
  return (
    <span style={{ fontSize: '10px', fontWeight: 700, color, backgroundColor: color + '18', border: `1px solid ${color}40`, borderRadius: '4px', padding: '1px 6px', whiteSpace: 'nowrap' }}>
      {String(group)}
    </span>
  )
}

function ScoreBadge({ score }: { score: unknown }) {
  const n = Number(score)
  if (!score && score !== 0) return <span style={{ color: '#64748b' }}>—</span>
  const [bg, fg] = n >= 8 ? ['rgba(34,197,94,0.15)', '#4ade80']
    : n >= 6 ? ['rgba(234,179,8,0.15)', '#fbbf24']
    : ['rgba(249,115,22,0.15)', '#fb923c']
  return <span style={{ fontSize: '13px', fontWeight: 700, color: fg, backgroundColor: bg, borderRadius: '6px', padding: '3px 9px', whiteSpace: 'nowrap' }}>{n}</span>
}

function SortableTH({ label, sk, active, dir, onSort }: { label: string; sk: SortKey; active: boolean; dir: SortDir; onSort: (k: SortKey) => void }) {
  return (
    <th onClick={() => onSort(sk)} style={{ backgroundColor: '#13131a', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', padding: '11px 14px', textAlign: 'left' as const, borderBottom: '1px solid #2a2a3a', whiteSpace: 'nowrap' as const, cursor: 'pointer', userSelect: 'none' as const, color: active ? '#14b8a6' : '#64748b' }}>
      {label} <span style={{ opacity: active ? 1 : 0.3 }}>{active ? (dir === 'desc' ? '↓' : '↑') : '↕'}</span>
    </th>
  )
}

const STH: React.CSSProperties = { backgroundColor: '#13131a', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '11px 14px', textAlign: 'left', borderBottom: '1px solid #2a2a3a', whiteSpace: 'nowrap' }
const TD: React.CSSProperties = { padding: '13px 14px', verticalAlign: 'middle' }
const SEL: React.CSSProperties = { backgroundColor: '#13131a', border: '1px solid #2a2a3a', borderRadius: '7px', padding: '7px 11px', fontSize: '13px', color: '#e2e8f0', cursor: 'pointer', outline: 'none' }

// ── page ──────────────────────────────────────────────────────────────────
export default function SteamKuratorleriPage() {
  const [curators, setCurators] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [emailFilter, setEmailFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    createSupabaseBrowserClient()
      .from('curators')
      .select('*')
      .then(({ data }) => { setCurators((data ?? []) as Row[]); setLoading(false) })
  }, [])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = useMemo(() => {
    let data = curators
    if (search) data = data.filter(c => String(c.name ?? '').toLowerCase().includes(search.toLowerCase()))
    if (groupFilter) data = data.filter(c => String(c.group_size ?? '').toLowerCase().includes(groupFilter.toLowerCase()))
    if (emailFilter === 'steam') data = data.filter(c => String(c.email ?? '').toLowerCase().includes('steam curator connect'))
    if (emailFilter === 'direct') data = data.filter(c => !!c.email && !String(c.email).toLowerCase().includes('steam curator connect'))
    return [...data].sort((a, b) => {
      const av = sortKey === 'recommendation_rate' ? parseRate(a[sortKey]) : Number(a[sortKey] ?? 0)
      const bv = sortKey === 'recommendation_rate' ? parseRate(b[sortKey]) : Number(b[sortKey] ?? 0)
      return sortDir === 'desc' ? bv - av : av - bv
    })
  }, [curators, search, groupFilter, emailFilter, sortKey, sortDir])

  // Stats
  const totalFollowers = curators.reduce((s, r) => s + (Number(r.followers) || 0), 0)
  const avgRate = curators.length
    ? (curators.reduce((s, r) => s + parseRate(r.recommendation_rate), 0) / curators.length).toFixed(1)
    : '0'
  const bigCount = curators.filter(r => String(r.group_size ?? '').toLowerCase().includes('büyük')).length
  const hasFilters = !!(search || groupFilter || emailFilter)

  return (
    <div>
      <PageHeader
        title="Steam Küratörleri"
        subtitle="Küratör takip ve analizi"
        imageSrc="/icons/steamlogo.png"
        gradient="linear-gradient(135deg, #14b8a6, #0891b2)"
      >
        <a
          href="https://docs.google.com/spreadsheets/d/1o-1cowOKi9wCoSlCXjwdkCkbQtfYv3LN/edit?gid=1554606637#gid=1554606637"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80', fontWeight: 600, fontSize: '13px', textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          📊 Tam Liste
        </a>
        <CuratorModal />
      </PageHeader>

      <div style={{ padding: '24px 32px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Toplam Küratör', value: curators.length, color: '#14b8a6' },
            { label: 'Toplam Takipçi', value: fmt(totalFollowers), color: '#4ade80' },
            { label: 'Ort. Tavsiye Oranı', value: avgRate + '%', color: '#fbbf24' },
            { label: 'Büyük Küratör', value: bigCount, color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '18px 20px' }}>
              <div style={{ fontSize: '26px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '7px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#14b8a6', boxShadow: '0 0 6px rgba(20,184,166,0.5)' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Küratör Listesi</span>
            <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(20,184,166,0.12)', color: '#14b8a6', border: '1px solid rgba(20,184,166,0.3)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>
              {sorted.length}{hasFilters ? ` / ${curators.length}` : ''}
            </span>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '12px 20px', borderBottom: '1px solid #2a2a3a', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Küratör ara..." style={{ ...SEL, paddingLeft: '30px', width: '100%', boxSizing: 'border-box' }} />
            </div>
            <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} style={SEL}>
              <option value="">Tüm Gruplar</option>
              <option value="büyük">Büyük</option>
              <option value="orta">Orta</option>
              <option value="küçük">Küçük</option>
            </select>
            <select value={emailFilter} onChange={e => setEmailFilter(e.target.value)} style={SEL}>
              <option value="">Tüm Email</option>
              <option value="steam">Steam Curator Connect</option>
              <option value="direct">Direkt Email</option>
            </select>
            {hasFilters && (
              <button onClick={() => { setSearch(''); setGroupFilter(''); setEmailFilter('') }} style={{ fontSize: '12px', color: '#64748b', background: 'none', border: '1px solid #2a2a3a', borderRadius: '7px', padding: '7px 12px', cursor: 'pointer' }}>
                Temizle
              </button>
            )}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...STH, width: '40px' }}></th>
                  <th style={STH}>Küratör Adı</th>
                  <SortableTH label="Takipçi"      sk="followers"          active={sortKey === 'followers'}          dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Toplam İnceleme" sk="total_reviews"   active={sortKey === 'total_reviews'}      dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Tavsiye Oranı" sk="recommendation_rate" active={sortKey === 'recommendation_rate'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="AI Puanı"     sk="score"              active={sortKey === 'score'}              dir={sortDir} onSort={handleSort} />
                  <th style={STH}>Email</th>
                  <th style={STH}>Steam</th>
                  <th style={{ ...STH, width: '80px' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>Yükleniyor...</td></tr>
                ) : sorted.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>{hasFilters ? 'Eşleşen küratör bulunamadı' : 'Henüz küratör eklenmemiş'}</td></tr>
                ) : sorted.map((row, i) => {
                  const color = groupColor(row.group_size)
                  const isSteamCC = String(row.email ?? '').toLowerCase().includes('steam curator connect')
                  return (
                    <tr key={String(row.id ?? i)} style={{ borderBottom: i < sorted.length - 1 ? '1px solid rgba(42,42,58,0.6)' : 'none', backgroundColor: i % 2 === 1 ? 'rgba(255,255,255,0.012)' : 'transparent' }}>
                      <td style={{ ...TD, paddingRight: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: color + '22', border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color, flexShrink: 0 }}>
                          {initials(row.name)}
                        </div>
                      </td>
                      <td style={TD}>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#f1f5f9', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(row.name ?? '—')}</div>
                        <div style={{ marginTop: '4px' }}><GroupBadge group={row.group_size} /></div>
                      </td>
                      <td style={TD}>
                        <span style={{ color: '#4ade80', fontWeight: 600, fontSize: '13px' }}>{fmt(row.followers)}</span>
                      </td>
                      <td style={TD}>
                        <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '13px' }}>{fmt(row.total_reviews)}</span>
                      </td>
                      <td style={TD}>
                        {row.recommendation_rate
                          ? <span style={{ color: '#4ade80', fontWeight: 600, fontSize: '13px' }}>{String(row.recommendation_rate)}</span>
                          : <span style={{ color: '#64748b' }}>—</span>}
                      </td>
                      <td style={TD}><ScoreBadge score={row.score} /></td>
                      <td style={TD}>
                        {isSteamCC ? (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#60a5fa', backgroundColor: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '4px', padding: '2px 8px', whiteSpace: 'nowrap' }}>Steam CC</span>
                        ) : row.email ? (
                          <span style={{ color: '#7c3aed', fontFamily: 'monospace', fontSize: '11px', maxWidth: '160px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(row.email)}</span>
                        ) : (
                          <span style={{ color: '#64748b' }}>—</span>
                        )}
                      </td>
                      <td style={TD}>
                        {!!row.steam_link ? (
                          <a href={String(row.steam_link)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#14b8a6', backgroundColor: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)', borderRadius: '5px', padding: '4px 8px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                            <ExternalLink size={10} /> Steam
                          </a>
                        ) : <span style={{ color: '#64748b' }}>—</span>}
                      </td>
                      <td style={TD}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <EditCuratorButton row={row} />
                          <DeleteButton table="curators" id={row.id as string} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
