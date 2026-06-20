'use client'
import { useState, useEffect, useMemo } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import { SocialAccountModal, EditSocialAccountButton } from '@/components/SocialAccountModal'
import { DeleteButton } from '@/components/DeleteButton'
import { Users, TrendingUp, Zap, Star, Search, ExternalLink } from 'lucide-react'

type Row = Record<string, unknown>
type SortKey = 'score' | 'followers' | 'avg_likes'
type SortDir = 'asc' | 'desc'

const TD: React.CSSProperties = { padding: '14px 16px', verticalAlign: 'top' }
const selectStyle: React.CSSProperties = {
  backgroundColor: '#13131a', border: '1px solid #2a2a3a', borderRadius: '7px',
  padding: '7px 12px', fontSize: '13px', color: '#e2e8f0', cursor: 'pointer', outline: 'none',
}

function ScoreBadge({ score }: { score: unknown }) {
  const n = Number(score)
  if (!score && score !== 0) return <span style={{ color: '#64748b' }}>—</span>
  const [bg, fg] = n >= 90 ? ['rgba(34,197,94,0.15)', '#4ade80']
    : n >= 80 ? ['rgba(234,179,8,0.15)', '#fbbf24']
    : n >= 70 ? ['rgba(249,115,22,0.15)', '#fb923c']
    : ['rgba(100,116,139,0.15)', '#94a3b8']
  return <span style={{ fontSize: '13px', fontWeight: 700, color: fg, backgroundColor: bg, borderRadius: '6px', padding: '3px 9px', whiteSpace: 'nowrap' }}>{n}</span>
}

function LangBadge({ lang }: { lang: unknown }) {
  if (!lang) return <span style={{ color: '#64748b' }}>—</span>
  return (
    <span style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '4px', padding: '2px 7px', letterSpacing: '0.05em' }}>
      {String(lang).toUpperCase()}
    </span>
  )
}

function SortableTH({ label, sortKey, active, dir, onSort }: { label: string; sortKey: SortKey; active: boolean; dir: SortDir; onSort: (k: SortKey) => void }) {
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{
        backgroundColor: '#13131a', fontSize: '11px', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.06em', padding: '11px 16px',
        textAlign: 'left', borderBottom: '1px solid #2a2a3a', whiteSpace: 'nowrap',
        cursor: 'pointer', userSelect: 'none',
        color: active ? '#1d9bf0' : '#64748b',
      }}
    >
      {label} <span style={{ opacity: active ? 1 : 0.35 }}>{active ? (dir === 'desc' ? '↓' : '↑') : '↕'}</span>
    </th>
  )
}

const STATIC_TH: React.CSSProperties = {
  backgroundColor: '#13131a', color: '#64748b', fontSize: '11px', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.06em', padding: '11px 16px',
  textAlign: 'left', borderBottom: '1px solid #2a2a3a', whiteSpace: 'nowrap',
}

export default function TwitterPage() {
  const [accounts, setAccounts] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [langFilter, setLangFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    createSupabaseBrowserClient()
      .from('twitter_accounts')
      .select('*')
      .then(({ data }) => { setAccounts((data ?? []) as Row[]); setLoading(false) })
  }, [])

  const regions = useMemo(() => Array.from(new Set(accounts.map(a => String(a.region ?? '')).filter(Boolean))).sort(), [accounts])
  const langs   = useMemo(() => Array.from(new Set(accounts.map(a => String(a.language ?? '')).filter(Boolean))).sort(), [accounts])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = useMemo(() => {
    const filtered = accounts.filter(a => {
      const q = search.toLowerCase()
      if (q && !String(a.username ?? '').toLowerCase().includes(q) && !String(a.display_name ?? '').toLowerCase().includes(q)) return false
      if (regionFilter && String(a.region ?? '') !== regionFilter) return false
      if (langFilter && String(a.language ?? '') !== langFilter) return false
      if (priorityFilter && String(a.priority ?? '') !== priorityFilter) return false
      return true
    })
    return [...filtered].sort((a, b) => {
      const av = Number(a[sortKey] ?? 0)
      const bv = Number(b[sortKey] ?? 0)
      return sortDir === 'desc' ? bv - av : av - bv
    })
  }, [accounts, search, regionFilter, langFilter, priorityFilter, sortKey, sortDir])

  const totalFollowers = accounts.reduce((s, r) => s + (Number(r.followers) || 0), 0)
  const highPriority   = accounts.filter(r => String(r.priority ?? '') === 'high').length
  const avgScore       = accounts.length ? Math.round(accounts.reduce((s, r) => s + (Number(r.score) || 0), 0) / accounts.length) : 0
  const hasFilters     = !!(search || regionFilter || langFilter || priorityFilter)

  return (
    <div>
      <PageHeader title="Twitter / X" subtitle="Influencer takip ve analizi" imageSrc="/icons/x.png" gradient="linear-gradient(135deg, #1d9bf0, #0c6fa8)">
        <a
          href="https://docs.google.com/spreadsheets/d/1cawscn0JAZwLBlkMPwNM9-cSfcUVebaPFLLt7pMtCPc/edit?gid=1920292925#gid=1920292925"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80', fontWeight: 600, fontSize: '13px', textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          📊 Tam Liste
        </a>
        <SocialAccountModal table="twitter_accounts" color="#1d9bf0" postsField="tweets" />
      </PageHeader>

      <div style={{ padding: '24px 32px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <StatCard label="Toplam Hesap"   value={accounts.length}                        icon={Users}      iconColor="#1d9bf0" iconBg="rgba(29,155,240,0.12)" />
          <StatCard label="Toplam Takipçi" value={totalFollowers.toLocaleString('en-US')} icon={TrendingUp} iconColor="#4ade80" iconBg="rgba(34,197,94,0.12)" />
          <StatCard label="Yüksek Öncelik" value={highPriority}                           icon={Zap}        iconColor="#f87171" iconBg="rgba(239,68,68,0.12)" />
          <StatCard label="Ort. Puan"      value={avgScore}                               icon={Star}       iconColor="#fbbf24" iconBg="rgba(234,179,8,0.12)" />
        </div>

        {/* Table card */}
        <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1d9bf0', boxShadow: '0 0 6px rgba(29,155,240,0.5)' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Twitter Hesapları</span>
            <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(29,155,240,0.12)', color: '#1d9bf0', border: '1px solid rgba(29,155,240,0.3)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>
              {sorted.length}{hasFilters ? ` / ${accounts.length}` : ''}
            </span>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '12px 20px', borderBottom: '1px solid #2a2a3a', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Kullanıcı veya isim ara..."
                style={{ ...selectStyle, paddingLeft: '30px', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={selectStyle}>
              <option value="">Tüm Bölgeler</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={langFilter} onChange={e => setLangFilter(e.target.value)} style={selectStyle}>
              <option value="">Tüm Diller</option>
              {langs.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={selectStyle}>
              <option value="">Tüm Öncelikler</option>
              <option value="high">Yüksek</option>
              <option value="medium">Orta</option>
            </select>
            {hasFilters && (
              <button
                onClick={() => { setSearch(''); setRegionFilter(''); setLangFilter(''); setPriorityFilter('') }}
                style={{ fontSize: '12px', color: '#64748b', background: 'none', border: '1px solid #2a2a3a', borderRadius: '7px', padding: '7px 12px', cursor: 'pointer' }}
              >
                Temizle
              </button>
            )}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <SortableTH label="Puan"       sortKey="score"     active={sortKey === 'score'}     dir={sortDir} onSort={handleSort} />
                  <th style={STATIC_TH}>Kullanıcı</th>
                  <SortableTH label="Takipçi"    sortKey="followers" active={sortKey === 'followers'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Ort. Beğeni" sortKey="avg_likes" active={sortKey === 'avg_likes'} dir={sortDir} onSort={handleSort} />
                  <th style={STATIC_TH}>Bölge</th>
                  <th style={STATIC_TH}>Dil</th>
                  <th style={STATIC_TH}>AI Yorum</th>
                  <th style={{ ...STATIC_TH, width: '80px' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>Yükleniyor...</td></tr>
                ) : sorted.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                    {hasFilters ? 'Filtreyle eşleşen hesap bulunamadı' : 'Henüz hesap eklenmemiş'}
                  </td></tr>
                ) : sorted.map((row, i) => (
                  <tr key={String(row.id ?? i)} style={{
                    borderBottom: i < sorted.length - 1 ? '1px solid rgba(42,42,58,0.6)' : 'none',
                    backgroundColor: i % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent',
                  }}>
                    <td style={TD}><ScoreBadge score={row.score} /></td>
                    <td style={TD}>
                      {row.profile_url ? (
                        <a href={String(row.profile_url)} target="_blank" rel="noopener noreferrer"
                          style={{ fontWeight: 700, color: '#1d9bf0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                          @{String(row.username ?? '')} <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span style={{ fontWeight: 700, color: '#1d9bf0', fontSize: '14px' }}>@{String(row.username ?? '')}</span>
                      )}
                      {!!row.display_name && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{String(row.display_name)}</div>}
                    </td>
                    <td style={TD}>
                      {row.followers
                        ? <span style={{ color: '#4ade80', fontWeight: 600, fontSize: '13px' }}>{Number(row.followers).toLocaleString('en-US')}</span>
                        : <span style={{ color: '#64748b' }}>—</span>}
                    </td>
                    <td style={TD}>
                      {row.avg_likes
                        ? <span style={{ color: '#fb923c', fontWeight: 600, fontSize: '13px' }}>{Number(row.avg_likes).toLocaleString('en-US')}</span>
                        : <span style={{ color: '#64748b' }}>—</span>}
                    </td>
                    <td style={TD}>
                      {row.region ? <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{String(row.region)}</span> : <span style={{ color: '#64748b' }}>—</span>}
                    </td>
                    <td style={TD}><LangBadge lang={row.language} /></td>
                    <td style={{ ...TD, maxWidth: '300px' }}>
                      {row.ai_comment
                        ? <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'normal', lineHeight: 1.5 }}>{String(row.ai_comment)}</span>
                        : <span style={{ color: '#64748b' }}>—</span>}
                    </td>
                    <td style={TD}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <EditSocialAccountButton row={row} table="twitter_accounts" color="#1d9bf0" postsField="tweets" />
                        <DeleteButton table="twitter_accounts" id={row.id as string} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
