'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import PageHeader from '@/components/PageHeader'
import { StreamerModal } from '@/components/StreamerModal'
import { Search, X, ExternalLink, Mail, Globe, Trash2 } from 'lucide-react'
import Image from 'next/image'

type Row = Record<string, unknown>
type SortKey = 'followers' | 'avg_viewers'
type SortDir = 'asc' | 'desc'
type PriorityFilter = 'all' | 'high' | 'medium' | 'low'

const KICK_COLOR = '#53fc18'

async function getAllData(): Promise<Row[]> {
  const supabase = createSupabaseBrowserClient()
  let allData: Row[] = []
  let from = 0
  const batchSize = 1000
  while (true) {
    const { data } = await supabase
      .from('kick_streamers')
      .select('*')
      .range(from, from + batchSize - 1)
    if (!data || data.length === 0) break
    allData = [...allData, ...(data as Row[])]
    if (data.length < batchSize) break
    from += batchSize
  }
  return allData
}

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
function hasEmail(row: Row): boolean {
  const e = String(row.email ?? '').trim().toLowerCase()
  return !!e && e !== 'nan' && e !== 'null' && e !== ''
}
function socialHref(val: unknown, prefix: string): string {
  const s = String(val ?? '')
  return s.startsWith('http') ? s : `${prefix}${s}`
}

function SortableTH({ label, sk, active, dir, onSort }: { label: string; sk: SortKey; active: boolean; dir: SortDir; onSort: (k: SortKey) => void }) {
  return (
    <th onClick={() => onSort(sk)} style={{ backgroundColor: '#13131a', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', padding: '11px 14px', textAlign: 'left' as const, borderBottom: '1px solid #2a2a3a', whiteSpace: 'nowrap' as const, cursor: 'pointer', userSelect: 'none' as const, color: active ? KICK_COLOR : '#64748b' }}>
      {label} <span style={{ opacity: active ? 1 : 0.3 }}>{active ? (dir === 'desc' ? '↓' : '↑') : '↕'}</span>
    </th>
  )
}

const STH: React.CSSProperties = { backgroundColor: '#13131a', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '11px 14px', textAlign: 'left', borderBottom: '1px solid #2a2a3a', whiteSpace: 'nowrap' }
const TD: React.CSSProperties = { padding: '13px 14px', verticalAlign: 'middle' }
const SEL: React.CSSProperties = { backgroundColor: '#13131a', border: '1px solid #2a2a3a', borderRadius: '7px', padding: '7px 11px', fontSize: '13px', color: '#e2e8f0', cursor: 'pointer', outline: 'none' }

function ContactRow({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#60a5fa', textDecoration: 'none', padding: '5px 0', overflow: 'hidden' }}>
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </a>
  )
}

function DetailPanel({ row, onClose, onDelete }: { row: Row; onClose: () => void; onDelete: (id: unknown) => void }) {
  const games = String(row.simulator_games ?? row.games ?? '').trim()
  const gameList = games ? games.split(/[,\n]/).map(g => g.trim()).filter(Boolean) : []

  const contacts: { href: string; icon: React.ReactNode; label: string }[] = []
  if (hasEmail(row)) contacts.push({ href: `mailto:${row.email}`, icon: <Mail size={13} />, label: String(row.email) })
  if (row.instagram) contacts.push({ href: socialHref(row.instagram, 'https://instagram.com/'), icon: <Image src="/icons/instagram.png" alt="Instagram" width={13} height={13} />, label: String(row.instagram) })
  if (row.twitter) contacts.push({ href: socialHref(row.twitter, 'https://twitter.com/'), icon: <Image src="/icons/x.png" alt="Twitter" width={13} height={13} />, label: String(row.twitter) })
  if (row.youtube) contacts.push({ href: socialHref(row.youtube, 'https://youtube.com/'), icon: <Image src="/icons/youtube.png" alt="YouTube" width={13} height={13} />, label: String(row.youtube) })
  if (row.tiktok) contacts.push({ href: socialHref(row.tiktok, 'https://tiktok.com/@'), icon: <Image src="/icons/tiktok.png" alt="TikTok" width={13} height={13} />, label: String(row.tiktok) })
  if (row.discord) contacts.push({ href: String(row.discord), icon: <Globe size={13} />, label: String(row.discord) })
  if (row.facebook) contacts.push({ href: socialHref(row.facebook, 'https://facebook.com/'), icon: <Globe size={13} />, label: String(row.facebook) })

  return (
    <div style={{ width: '360px', backgroundColor: '#13131a', borderLeft: '1px solid #2a2a3a', display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'fixed', top: 0, right: 0, height: '100vh', zIndex: 1000 }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(83,252,24,0.12)', border: '2px solid rgba(83,252,24,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', color: KICK_COLOR, flexShrink: 0 }}>
          {initials(row.username)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(row.username ?? '—')}</div>
          {!!row.channel_name && String(row.channel_name) !== String(row.username) && (
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{String(row.channel_name)}</div>
          )}
        </div>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', backgroundColor: 'transparent', border: '1px solid #2a2a3a', color: '#64748b', cursor: 'pointer', flexShrink: 0 }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Ort. İzleyici', value: fmt(row.avg_viewers), color: '#60a5fa' },
            { label: 'Takipçi',       value: fmt(row.followers),   color: '#4ade80' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>{s.label}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {gameList.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Simülatör Oyunları</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {gameList.map((g, i) => (
                <div key={i} style={{ fontSize: '13px', color: '#cbd5e1', padding: '5px 10px', backgroundColor: 'rgba(83,252,24,0.05)', border: '1px solid rgba(83,252,24,0.12)', borderRadius: '6px' }}>{g}</div>
              ))}
            </div>
          </div>
        )}

        {contacts.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>İletişim</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {contacts.map((c, i) => <ContactRow key={i} {...c} />)}
            </div>
          </div>
        )}

        {!!row.sheets_url && (
          <a href={String(row.sheets_url)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
            <ExternalLink size={14} /> Google Sheets
          </a>
        )}

        <button
          onClick={() => { if (confirm('Bu yayıncıyı silmek istediğinizden emin misiniz?')) onDelete(row.id) }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
        >
          <Trash2 size={13} /> Yayıncıyı Sil
        </button>
      </div>
    </div>
  )
}

export default function KickPage() {
  const [streamers, setStreamers] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Row | null>(null)
  const [search, setSearch] = useState('')
  const [emailOnly, setEmailOnly] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('followers')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    getAllData().then(data => { setStreamers(data); setLoading(false) })
  }, [])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const deleteStreamer = useCallback(async (id: unknown) => {
    await createSupabaseBrowserClient().from('kick_streamers').delete().eq('id', id)
    setStreamers(prev => prev.filter(r => r.id !== id))
    setSelected(prev => prev?.id === id ? null : prev)
  }, [])

  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }

  const sorted = useMemo(() => {
    let data = streamers
    if (search) data = data.filter(r => String(r.username ?? '').toLowerCase().includes(search.toLowerCase()))
    if (emailOnly) data = data.filter(r => hasEmail(r))
    if (priorityFilter !== 'all') data = data.filter(r => String(r.priority ?? '').toLowerCase() === priorityFilter)
    return [...data].sort((a, b) => {
      const ap = priorityOrder[String(a.priority ?? '').toLowerCase()] ?? 99
      const bp = priorityOrder[String(b.priority ?? '').toLowerCase()] ?? 99
      if (ap !== bp) return ap - bp
      const av = Number(a[sortKey] ?? 0), bv = Number(b[sortKey] ?? 0)
      return sortDir === 'desc' ? bv - av : av - bv
    })
  }, [streamers, search, emailOnly, priorityFilter, sortKey, sortDir])

  const totalFollowers  = streamers.reduce((s, r) => s + (Number(r.followers) || 0), 0)
  const totalAvgViewers = streamers.reduce((s, r) => s + (Number(r.avg_viewers) || 0), 0)
  const emailCount      = streamers.filter(r => hasEmail(r)).length
  const hasFilters      = !!(search || emailOnly || priorityFilter !== 'all')

  return (
    <div>
      <PageHeader title="Kick Yayıncıları" subtitle="Yayıncı takip ve analizi" imageSrc="/icons/kick.png" gradient="linear-gradient(135deg, #53fc18, #2ea80e)">
        <StreamerModal table="kick_streamers" color={KICK_COLOR} />
      </PageHeader>

      <div style={{ padding: '24px 32px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Toplam Yayıncı',      value: streamers.length,   color: KICK_COLOR },
            { label: 'Toplam Takipçi',       value: fmt(totalFollowers),  color: '#4ade80' },
            { label: 'Toplam Ort. İzleyici', value: fmt(totalAvgViewers), color: '#60a5fa' },
            { label: 'Email Var',            value: emailCount,           color: '#fbbf24' },
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
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: KICK_COLOR, boxShadow: `0 0 6px rgba(83,252,24,0.5)` }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Tüm Yayıncılar</span>
            <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(83,252,24,0.10)', color: '#4ade80', border: '1px solid rgba(83,252,24,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>
              {sorted.length}{hasFilters ? ` / ${streamers.length}` : ''}
            </span>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '12px 20px', borderBottom: '1px solid #2a2a3a', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Yayıncı ara..." style={{ ...SEL, paddingLeft: '30px', width: '100%', boxSizing: 'border-box' }} />
            </div>
            <button
              onClick={() => setEmailOnly(v => !v)}
              style={{ padding: '7px 14px', borderRadius: '7px', border: `1px solid ${emailOnly ? 'rgba(251,191,36,0.5)' : '#2a2a3a'}`, backgroundColor: emailOnly ? 'rgba(251,191,36,0.1)' : 'transparent', color: emailOnly ? '#fbbf24' : '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              📧 Email Var
            </button>
            {(['all', 'high', 'medium', 'low'] as PriorityFilter[]).map(p => {
              const labels: Record<PriorityFilter, string> = { all: 'Tümü', high: '🟢 High', medium: '🟡 Medium', low: '🔴 Low' }
              const colors: Record<PriorityFilter, string> = { all: '#64748b', high: '#4ade80', medium: '#fbbf24', low: '#f87171' }
              const active = priorityFilter === p
              return (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  style={{ padding: '7px 14px', borderRadius: '7px', border: `1px solid ${active ? colors[p] + '80' : '#2a2a3a'}`, backgroundColor: active ? colors[p] + '18' : 'transparent', color: active ? colors[p] : '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {labels[p]}
                </button>
              )
            })}
            {hasFilters && (
              <button onClick={() => { setSearch(''); setEmailOnly(false); setPriorityFilter('all') }} style={{ fontSize: '12px', color: '#64748b', background: 'none', border: '1px solid #2a2a3a', borderRadius: '7px', padding: '7px 12px', cursor: 'pointer' }}>
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
                  <th style={STH}>Yayıncı</th>
                  <SortableTH label="Ort. İzleyici" sk="avg_viewers" active={sortKey === 'avg_viewers'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Takipçi"       sk="followers"   active={sortKey === 'followers'}   dir={sortDir} onSort={handleSort} />
                  <th style={STH}>Email</th>
                  <th style={STH}>Simülatör Oyunları</th>
                  <th style={{ ...STH, width: '100px' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>Yükleniyor...</td></tr>
                ) : sorted.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>{hasFilters ? 'Eşleşen yayıncı bulunamadı' : 'Henüz yayıncı eklenmemiş'}</td></tr>
                ) : sorted.map((row, i) => {
                  const isActive = selected?.id === row.id
                  const games = String(row.simulator_games ?? row.games ?? '').trim()
                  const priority = String(row.priority ?? '').toLowerCase()
                  const priorityBorder = priority === 'high' ? '3px solid #4ade80' : priority === 'medium' ? '3px solid #fbbf24' : priority === 'low' ? '3px solid #f87171' : undefined
                  return (
                    <tr
                      key={String(row.id ?? i)}
                      onClick={() => setSelected(isActive ? null : row)}
                      style={{ borderBottom: i < sorted.length - 1 ? '1px solid rgba(42,42,58,0.6)' : 'none', backgroundColor: isActive ? 'rgba(83,252,24,0.05)' : i % 2 === 1 ? 'rgba(255,255,255,0.012)' : 'transparent', cursor: 'pointer', borderLeft: priorityBorder }}
                    >
                      <td style={{ ...TD, paddingRight: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(83,252,24,0.12)', border: '1px solid rgba(83,252,24,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: KICK_COLOR }}>
                          {initials(row.username)}
                        </div>
                      </td>
                      <td style={TD}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: KICK_COLOR }}>{String(row.username ?? '—')}</div>
                        {!!row.channel_name && String(row.channel_name) !== String(row.username) && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{String(row.channel_name)}</div>
                        )}
                      </td>
                      <td style={TD}>
                        <span style={{ color: '#60a5fa', fontWeight: 600, fontSize: '13px' }}>{fmt(row.avg_viewers)}</span>
                      </td>
                      <td style={TD}>
                        <span style={{ color: '#4ade80', fontWeight: 600, fontSize: '13px' }}>{fmt(row.followers)}</span>
                      </td>
                      <td style={{ ...TD, maxWidth: '160px' }}>
                        {hasEmail(row)
                          ? <span style={{ color: '#7c3aed', fontFamily: 'monospace', fontSize: '11px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(row.email)}</span>
                          : <span style={{ color: '#64748b' }}>—</span>}
                      </td>
                      <td style={{ ...TD, maxWidth: '200px' }}>
                        {games
                          ? <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={games}>{games.slice(0, 50)}{games.length > 50 ? '…' : ''}</span>
                          : <span style={{ color: '#64748b' }}>—</span>}
                      </td>
                      <td style={TD} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {!!row.sheets_url && (
                            <a href={String(row.sheets_url)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#4ade80', backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '5px', padding: '4px 8px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                              <ExternalLink size={10} /> Sheets
                            </a>
                          )}
                          <button onClick={() => { if (confirm('Silmek istediğinizden emin misiniz?')) deleteStreamer(row.id) }} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#64748b', backgroundColor: 'transparent', border: '1px solid #2a2a3a', borderRadius: '5px', padding: '4px 8px', cursor: 'pointer' }}>
                            <Trash2 size={10} /> Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <>
            <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }} />
            <DetailPanel row={selected} onClose={() => setSelected(null)} onDelete={deleteStreamer} />
          </>
        )}
      </div>
    </div>
  )
}
