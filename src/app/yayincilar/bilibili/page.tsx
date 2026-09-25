'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import PageHeader from '@/components/PageHeader'
import { Search, X, ExternalLink, Mail, MessageCircle, Link2, ChevronLeft, ChevronRight, Users, Contact, TrendingUp } from 'lucide-react'

type Row = Record<string, unknown>
type SortKey = 'channel_name' | 'followers'
type SortDir = 'asc' | 'desc'
type AuxRow = {
  followers: number | null
  email: string | null
  wechat: string | null
  qq: string | null
  weibo: string | null
}

const PAGE_SIZE = 350
const BILIBILI_COLOR = '#00a1d6'
const CONTACT_FIELDS = ['email', 'wechat', 'qq', 'weibo'] as const
const CONTACT_FILTER = CONTACT_FIELDS.map(f => `${f}.not.is.null`).join(',')

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
function hasValue(v: unknown): boolean {
  const s = String(v ?? '').trim().toLowerCase()
  return !!s && s !== 'nan' && s !== 'null'
}
function sanitizeSearch(s: string): string {
  return s.replace(/[,()%]/g, ' ').trim()
}

const AVATAR_PALETTE = [BILIBILI_COLOR, '#fb7299', '#70B8FF', '#3DD68C', '#FFB224', '#FF8DCC', '#BAA7FF', '#FF8B3E']
function colorForName(name: unknown): string {
  const s = String(name ?? '')
  let hash = 0
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

// ── avatar (colored initials only, no profile photos) ──
function Avatar({ channelName, size }: { channelName: unknown; size: number }) {
  const color = colorForName(channelName)
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: color + '22', border: `1px solid ${color}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.32, color, flexShrink: 0 }}>
      {initials(channelName)}
    </div>
  )
}

// ── sortable column header ──────────────────────────────────────────────
function SortableTH({ label, sk, active, dir, onSort }: { label: string; sk: SortKey; active: boolean; dir: SortDir; onSort: (k: SortKey) => void }) {
  return (
    <th onClick={() => onSort(sk)} style={{ ...STH, cursor: 'pointer', userSelect: 'none', color: active ? BILIBILI_COLOR : '#8F8F8F' }}>
      {label} <span style={{ opacity: active ? 1 : 0.3 }}>{active ? (dir === 'desc' ? '↓' : '↑') : '↕'}</span>
    </th>
  )
}

const STH: React.CSSProperties = { backgroundColor: 'rgba(255,255,255,0.02)', color: '#8F8F8F', fontSize: '12.5px', fontWeight: 500, padding: '11px 14px', textAlign: 'left', borderBottom: '1px solid #262626', whiteSpace: 'nowrap' }
const TD: React.CSSProperties = { padding: '12px 14px', verticalAlign: 'middle' }
const SEL: React.CSSProperties = { backgroundColor: '#0A0A0A', border: '1px solid #262626', borderRadius: '7px', padding: '7px 11px', fontSize: '13px', color: '#EDEDED', cursor: 'pointer', outline: 'none' }

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
const statValueStyle: React.CSSProperties = { fontSize: '26px', fontWeight: 800, color: '#EDEDED', lineHeight: 1.15 }
const statSubStyle: React.CSSProperties = { fontSize: '12px', color: '#8F8F8F' }

function StatCardHeader({ icon, color, label }: { icon: React.ReactNode; color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: color + '22', border: `1px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#B4B4B4', }}>{label}</span>
    </div>
  )
}

function ContactRow({ href, icon, label, value }: { href?: string; icon: React.ReactNode; label: string; value: string }) {
  const content = (
    <>
      <span style={{ flexShrink: 0, display: 'flex', marginTop: '2px' }}>{icon}</span>
      <span style={{ minWidth: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
        <span style={{ color: '#8F8F8F' }}>{label}: </span>{value}
      </span>
    </>
  )
  const style: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', padding: '5px 0', lineHeight: 1.5 }
  if (!href) return <div style={{ ...style, color: '#B4B4B4' }}>{content}</div>
  return <a href={href} style={{ ...style, color: '#70B8FF', textDecoration: 'none' }}>{content}</a>
}

// ── detail drawer ────────────────────────────────────────────────────────
function DetailPanel({ row, onClose }: { row: Row; onClose: () => void }) {
  const name = String(row.channel_name ?? '—')

  type ContactItem = { href?: string; icon: React.ReactNode; label: string; value: string }
  const contacts: ContactItem[] = []
  if (hasValue(row.email)) contacts.push({ href: `mailto:${row.email}`, icon: <Mail size={13} />, label: 'Email', value: String(row.email) })
  if (hasValue(row.qq)) contacts.push({ icon: <MessageCircle size={13} />, label: 'QQ', value: String(row.qq) })
  if (hasValue(row.wechat)) contacts.push({ icon: <MessageCircle size={13} />, label: 'WeChat', value: String(row.wechat) })
  if (hasValue(row.weibo)) {
    const w = String(row.weibo)
    contacts.push({ href: w.startsWith('http') ? w : undefined, icon: <Link2 size={13} />, label: 'Weibo', value: w })
  }
  if (hasValue(row.other_links)) contacts.push({ icon: <ExternalLink size={13} />, label: 'Diğer', value: String(row.other_links) })

  return (
    <div style={{ width: '380px', backgroundColor: '#0A0A0A', borderLeft: '1px solid #262626', display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'fixed', top: 0, right: 0, height: '100vh', zIndex: 1000 }}>
      {/* Header */}
      <div style={{ padding: '18px', borderBottom: '1px solid #262626', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Avatar channelName={row.channel_name} size={64} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#EDEDED', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        </div>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', backgroundColor: 'transparent', border: '1px solid #262626', color: '#8F8F8F', cursor: 'pointer', flexShrink: 0 }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Stats */}
        <div style={{ backgroundColor: '#0A0A0A', border: '1px solid #262626', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '10px', color: '#8F8F8F', fontWeight: 600, marginBottom: '5px' }}>Takipçi</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#3DD68C' }}>{fmt(row.followers)}</div>
        </div>

        {/* Profile link */}
        {!!row.profile_url && (
          <a href={String(row.profile_url)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(0,161,214,0.08)', border: '1px solid rgba(0,161,214,0.3)', color: BILIBILI_COLOR, fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
            <ExternalLink size={14} /> Profile Git
          </a>
        )}

        {/* Bio */}
        {hasValue(row.bio_en) && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#8F8F8F', marginBottom: '8px' }}>Bio</div>
            <div style={{ fontSize: '13px', color: '#B4B4B4', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{String(row.bio_en)}</div>
          </div>
        )}

        {/* Contacts */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#8F8F8F', marginBottom: '8px' }}>İletişim</div>
          {contacts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {contacts.map((c, i) => <ContactRow key={i} {...c} />)}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: '#8F8F8F' }}>İletişim bilgisi yok</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────
export default function BilibiliPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Row | null>(null)
  const [page, setPage] = useState(1)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [emailOnly, setEmailOnly] = useState(false)
  const [contactOnly, setContactOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('followers')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // aux data (lightweight columns, whole table) — powers stats bar
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
          .from('bilibili_streamers')
          .select('followers, email, wechat, qq, weibo')
          .order('id')
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

  const filterSig = `${search}|${emailOnly}|${contactOnly}|${sortKey}|${sortDir}`
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
      let query = supabase.from('bilibili_streamers').select('*', { count: 'exact' })
      if (search) query = query.ilike('channel_name', `%${search}%`)
      if (emailOnly) query = query.not('email', 'is', null)
      if (contactOnly) query = query.or(CONTACT_FILTER)
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      query = query.order(sortKey, { ascending: sortDir === 'asc', nullsFirst: false }).order('id').range(from, to)
      const { data, count, error } = await query
      if (cancelled) return
      setRows(error || !data ? [] : (data as Row[]))
      setTotalCount(count ?? 0)
      setLoading(false)
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, emailOnly, contactOnly, sortKey, sortDir, page])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const stats = useMemo(() => {
    const totalAccounts = auxRows.length
    const emailCount = auxRows.filter(r => hasValue(r.email)).length
    const anyContactCount = auxRows.filter(r => CONTACT_FIELDS.some(f => hasValue(r[f]))).length
    const avgFollowers = totalAccounts > 0 ? auxRows.reduce((s, r) => s + (Number(r.followers) || 0), 0) / totalAccounts : 0
    return { totalAccounts, emailCount, anyContactCount, avgFollowers }
  }, [auxRows])

  const pct = (n: number) => (auxLoading || stats.totalAccounts === 0 ? '—' : `%${Math.round((n / stats.totalAccounts) * 100)} kapsam`)

  const hasFilters = !!(search || emailOnly || contactOnly)
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const from = (page - 1) * PAGE_SIZE
  const rangeStart = totalCount === 0 ? 0 : from + 1
  const rangeEnd = Math.min(from + PAGE_SIZE, totalCount)
  const rangeLabel = totalCount === 0 ? '0 hesap' : `${rangeStart.toLocaleString('tr-TR')} - ${rangeEnd.toLocaleString('tr-TR')} / ${totalCount.toLocaleString('tr-TR')} hesap`

  const pageNumbers = useMemo(() => {
    const windowSize = 5
    let start = Math.max(1, page - Math.floor(windowSize / 2))
    const end = Math.min(totalPages, start + windowSize - 1)
    start = Math.max(1, Math.min(start, end - windowSize + 1))
    const arr: number[] = []
    for (let i = start; i <= end; i++) arr.push(i)
    return arr
  }, [page, totalPages])

  const toggleStyle = (on: boolean, rgb: string, color: string): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: '7px', border: `1px solid ${on ? `rgba(${rgb},0.5)` : '#262626'}`, backgroundColor: on ? `rgba(${rgb},0.1)` : 'transparent', color: on ? color : '#8F8F8F', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
  })

  return (
    <div>
      <PageHeader title="BiliBili Yayıncıları" subtitle="Hesap takip ve analizi" imageSrc="/icons/bilibili.png" gradient="linear-gradient(135deg, #00a1d6, #fb7299)" />

      <div style={{ padding: '24px 32px' }}>
        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={statCardStyle(BILIBILI_COLOR)}>
            <StatCardHeader icon={<Users size={17} />} color={BILIBILI_COLOR} label="Toplam Hesap" />
            <div style={statValueStyle}>{auxLoading ? '…' : stats.totalAccounts.toLocaleString('tr-TR')}</div>
            <div style={statSubStyle}>Takip edilen hesap</div>
          </div>

          <div style={statCardStyle('#FFB224')}>
            <StatCardHeader icon={<Mail size={17} />} color="#FFB224" label="Email Olan" />
            <div style={statValueStyle}>{auxLoading ? '…' : stats.emailCount.toLocaleString('tr-TR')}</div>
            <div style={statSubStyle}>{pct(stats.emailCount)}</div>
          </div>

          <div style={statCardStyle('#BAA7FF')}>
            <StatCardHeader icon={<Contact size={17} />} color="#BAA7FF" label="En Az 1 İletişim Olan" />
            <div style={statValueStyle}>{auxLoading ? '…' : stats.anyContactCount.toLocaleString('tr-TR')}</div>
            <div style={statSubStyle}>{auxLoading ? '—' : `${pct(stats.anyContactCount)} · email/qq/wechat/weibo`}</div>
          </div>

          <div style={statCardStyle('#3DD68C')}>
            <StatCardHeader icon={<TrendingUp size={17} />} color="#3DD68C" label="Ortalama Takipçi" />
            <div style={statValueStyle}>{auxLoading ? '…' : fmt(stats.avgFollowers)}</div>
            <div style={statSubStyle}>Hesap başına ortalama</div>
          </div>
        </div>

        {/* Table card */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '12px 20px', borderBottom: '1px solid #262626', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#8F8F8F', pointerEvents: 'none' }} />
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Kanal adı ara..." style={{ ...SEL, paddingLeft: '30px', width: '100%', boxSizing: 'border-box' }} />
            </div>
            <button onClick={() => setEmailOnly(v => !v)} style={toggleStyle(emailOnly, '251,191,36', '#FFB224')}>
              📧 Email Var
            </button>
            <button onClick={() => setContactOnly(v => !v)} style={toggleStyle(contactOnly, '167,139,250', '#BAA7FF')}>
              💬 İletişim Var
            </button>
            {hasFilters && (
              <button onClick={() => { setSearchInput(''); setSearch(''); setEmailOnly(false); setContactOnly(false) }} style={{ fontSize: '12px', color: '#8F8F8F', background: 'none', border: '1px solid #262626', borderRadius: '7px', padding: '7px 12px', cursor: 'pointer' }}>
                Temizle
              </button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#8F8F8F', whiteSpace: 'nowrap' }}>{rangeLabel}</span>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...STH, width: '46px' }}></th>
                  <SortableTH label="Kanal" sk="channel_name" active={sortKey === 'channel_name'} dir={sortDir} onSort={handleSort} />
                  <SortableTH label="Takipçi" sk="followers" active={sortKey === 'followers'} dir={sortDir} onSort={handleSort} />
                  <th style={STH}>Email</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: '#8F8F8F', fontSize: '14px' }}>Yükleniyor...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: '#8F8F8F', fontSize: '14px' }}>{hasFilters ? 'Eşleşen hesap bulunamadı' : 'Henüz hesap eklenmemiş'}</td></tr>
                ) : rows.map((row, i) => {
                  const isActive = selected?.id === row.id
                  return (
                    <tr
                      key={String(row.id ?? i)}
                      onClick={() => setSelected(isActive ? null : row)}
                      style={{ borderBottom: i < rows.length - 1 ? '1px solid #1F1F1F' : 'none', backgroundColor: isActive ? 'rgba(0,161,214,0.06)' : i % 2 === 1 ? '#0E0E0E' : 'transparent', cursor: 'pointer' }}
                    >
                      <td style={{ ...TD, paddingRight: '8px' }}>
                        <Avatar channelName={row.channel_name} size={32} />
                      </td>
                      <td style={{ ...TD, maxWidth: '280px' }}>
                        <a
                          href={row.profile_url ? String(row.profile_url) : undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ fontWeight: 700, fontSize: '13px', color: BILIBILI_COLOR, textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {String(row.channel_name ?? '—')}
                        </a>
                      </td>
                      <td style={TD}><span style={{ color: '#3DD68C', fontWeight: 600, fontSize: '13px' }}>{fmt(row.followers)}</span></td>
                      <td style={{ ...TD, maxWidth: '200px' }} onClick={e => e.stopPropagation()}>
                        {hasValue(row.email)
                          ? <a href={`mailto:${row.email}`} style={{ color: '#70B8FF', fontSize: '12px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(row.email)}</a>
                          : <span style={{ color: '#8F8F8F' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #262626', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#8F8F8F' }}>{rangeLabel}</span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', border: '1px solid #262626', backgroundColor: 'transparent', color: page <= 1 ? '#333333' : '#B4B4B4', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={14} />
              </button>
              {pageNumbers[0] > 1 && <span style={{ color: '#8F8F8F', fontSize: '12px', padding: '0 4px' }}>…</span>}
              {pageNumbers.map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  style={{ minWidth: '30px', height: '30px', borderRadius: '7px', border: `1px solid ${n === page ? BILIBILI_COLOR : '#262626'}`, backgroundColor: n === page ? 'rgba(0,161,214,0.15)' : 'transparent', color: n === page ? BILIBILI_COLOR : '#B4B4B4', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '0 6px' }}
                >
                  {n}
                </button>
              ))}
              {pageNumbers[pageNumbers.length - 1] < totalPages && <span style={{ color: '#8F8F8F', fontSize: '12px', padding: '0 4px' }}>…</span>}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', border: '1px solid #262626', backgroundColor: 'transparent', color: page >= totalPages ? '#333333' : '#B4B4B4', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Overlay + drawer */}
        {selected && (
          <>
            <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 999 }} />
            <DetailPanel row={selected} onClose={() => setSelected(null)} />
          </>
        )}
      </div>
    </div>
  )
}
