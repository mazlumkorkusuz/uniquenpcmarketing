'use client'
import { useState, useMemo } from 'react'
import { ExternalLink, Search } from 'lucide-react'
import { EditSocialAccountButton } from '@/components/SocialAccountModal'
import { DeleteButton } from '@/components/DeleteButton'

type Row = Record<string, unknown>

interface Props {
  accounts: Row[]
}

const TH: React.CSSProperties = {
  backgroundColor: '#13131a', color: '#64748b', fontSize: '11px', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.06em', padding: '11px 16px',
  textAlign: 'left', borderBottom: '1px solid #2a2a3a', whiteSpace: 'nowrap',
}
const TD: React.CSSProperties = { padding: '14px 16px', verticalAlign: 'middle' }

function ScoreBadge({ score }: { score: unknown }) {
  const n = Number(score)
  if (!score && score !== 0) return <span style={{ color: '#64748b' }}>—</span>
  const [bg, color] = n >= 90 ? ['rgba(34,197,94,0.15)', '#4ade80']
    : n >= 80 ? ['rgba(234,179,8,0.15)', '#fbbf24']
    : ['rgba(249,115,22,0.15)', '#fb923c']
  return (
    <span style={{ fontSize: '13px', fontWeight: 700, color, backgroundColor: bg, borderRadius: '6px', padding: '3px 9px', whiteSpace: 'nowrap' }}>
      {n}
    </span>
  )
}

function LangBadge({ lang }: { lang: unknown }) {
  if (!lang) return <span style={{ color: '#64748b' }}>—</span>
  return (
    <span style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '4px', padding: '2px 7px', letterSpacing: '0.05em' }}>
      {String(lang).toUpperCase()}
    </span>
  )
}

const selectStyle: React.CSSProperties = {
  backgroundColor: '#13131a', border: '1px solid #2a2a3a', borderRadius: '7px',
  padding: '7px 12px', fontSize: '13px', color: '#e2e8f0', cursor: 'pointer', outline: 'none',
}

export function TwitterAccountsTable({ accounts }: Props) {
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [langFilter, setLangFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const regions = useMemo(() => Array.from(new Set(accounts.map(a => String(a.region ?? '')).filter(Boolean))).sort(), [accounts])
  const langs = useMemo(() => Array.from(new Set(accounts.map(a => String(a.language ?? '')).filter(Boolean))).sort(), [accounts])

  const filtered = useMemo(() => accounts.filter(a => {
    if (search && !String(a.username ?? '').toLowerCase().includes(search.toLowerCase())) return false
    if (regionFilter && String(a.region ?? '') !== regionFilter) return false
    if (langFilter && String(a.language ?? '') !== langFilter) return false
    if (priorityFilter && String(a.priority ?? '') !== priorityFilter) return false
    return true
  }), [accounts, search, regionFilter, langFilter, priorityFilter])

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '14px 20px', borderBottom: '1px solid #2a2a3a', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Kullanıcı ara..."
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
        {(search || regionFilter || langFilter || priorityFilter) && (
          <button
            onClick={() => { setSearch(''); setRegionFilter(''); setLangFilter(''); setPriorityFilter('') }}
            style={{ fontSize: '12px', color: '#64748b', background: 'none', border: '1px solid #2a2a3a', borderRadius: '7px', padding: '7px 12px', cursor: 'pointer' }}
          >
            Temizle
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b' }}>{filtered.length} hesap</span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>Puan</th>
              <th style={TH}>Kullanıcı</th>
              <th style={TH}>Takipçi</th>
              <th style={TH}>Ort. Beğeni</th>
              <th style={TH}>Bölge</th>
              <th style={TH}>Dil</th>
              <th style={TH}>AI Yorum</th>
              <th style={{ ...TH, width: '80px' }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                  Hesap bulunamadı
                </td>
              </tr>
            ) : filtered.map((row, i) => (
              <tr key={String(row.id ?? i)} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(42,42,58,0.6)' : 'none', backgroundColor: i % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                <td style={TD}>
                  <ScoreBadge score={row.score} />
                </td>
                <td style={TD}>
                  <div>
                    {row.profile_url ? (
                      <a href={String(row.profile_url)} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, color: '#1d9bf0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                        @{String(row.username ?? '')}
                        <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span style={{ fontWeight: 700, color: '#1d9bf0', fontSize: '14px' }}>@{String(row.username ?? '')}</span>
                    )}
                    {row.display_name && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{String(row.display_name)}</div>
                    )}
                  </div>
                </td>
                <td style={TD}>
                  {row.followers ? (
                    <span style={{ color: '#4ade80', fontWeight: 600, fontSize: '13px' }}>
                      {Number(row.followers).toLocaleString('en-US')}
                    </span>
                  ) : <span style={{ color: '#64748b' }}>—</span>}
                </td>
                <td style={TD}>
                  {row.avg_likes ? (
                    <span style={{ color: '#fb923c', fontWeight: 600, fontSize: '13px' }}>
                      {Number(row.avg_likes).toLocaleString('en-US')}
                    </span>
                  ) : <span style={{ color: '#64748b' }}>—</span>}
                </td>
                <td style={TD}>
                  {row.region ? (
                    <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{String(row.region)}</span>
                  ) : <span style={{ color: '#64748b' }}>—</span>}
                </td>
                <td style={TD}>
                  <LangBadge lang={row.language} />
                </td>
                <td style={{ ...TD, maxWidth: '240px' }}>
                  {row.ai_comment ? (
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String(row.ai_comment)}>
                      {String(row.ai_comment).slice(0, 80)}{String(row.ai_comment).length > 80 ? '…' : ''}
                    </span>
                  ) : <span style={{ color: '#64748b' }}>—</span>}
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
  )
}
