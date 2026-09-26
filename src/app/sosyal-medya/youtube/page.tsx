'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import PageHeader from '@/components/PageHeader'
import { Search, X, ExternalLink, Mail, Globe, Trash2, BarChart3 } from 'lucide-react'
import Image from 'next/image'
import { inkOf } from '@/lib/theme'

type Row = Record<string, unknown>
type SortKey = 'subscribers' | 'avg_long_views' | 'avg_shorts_views' | 'game_count' | 'score'
type SortDir = 'asc' | 'desc'

// ── helpers ──────────────────────────────────────────────────────────────
function fmt(n: unknown): string {
  const v = Number(n)
  if (!n && n !== 0) return '—'
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M'
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K'
  return String(v)
}
function initials(name: unknown): string {
  const s = String(name ?? '').trim()
  return s.slice(0, 2).toUpperCase() || '??'
}
function regionColor(region: unknown): string {
  const r = String(region ?? '').toLowerCase()
  if (r === 'japonya') return '#B91C1C'
  if (r === 'global' || r === 'dünya') return '#1D4ED8'
  return '#6D28D9'
}
function isJaponya(region: unknown) {
  return String(region ?? '').toLowerCase() === 'japonya'
}

// ── sub-components ────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: unknown }) {
  const p = String(priority ?? '').toLowerCase()
  if (p === 'high') return <span style={{ fontSize: '12px', fontWeight: 700, color: '#B91C1C', backgroundColor: '#FEF2F2', border: '1px solid #D8D2E6', borderRadius: '8px', padding: '1px 6px', letterSpacing: '0.04em' }}>HIGH</span>
  if (p === 'medium') return <span style={{ fontSize: '12px', fontWeight: 700, color: '#C2410C', backgroundColor: '#FFFBEB', border: '1px solid #D8D2E6', borderRadius: '8px', padding: '1px 6px', letterSpacing: '0.04em' }}>MED</span>
  return null
}

function ChannelTypeBadge({ type }: { type: unknown }) {
  if (!type) return <span style={{ color: '#655F7D' }}>—</span>
  const colors: Record<string, [string, string]> = {
    gaming: ['#F3EEFF', '#6D28D9'],
    vlog: ['#EFF6FF', '#1D4ED8'],
    review: ['#FFF7ED', '#C2410C'],
    esports: ['#FEF2F2', '#B91C1C'],
    educational: ['#ECFDF5', '#047857'],
  }
  const key = String(type).toLowerCase()
  const [bg, fg] = colors[key] ?? ['#F4F2F9', '#4A4462']
  return <span style={{ fontSize: '12px', fontWeight: 600, color: fg, backgroundColor: bg, borderRadius: '8px', padding: '2px 7px', whiteSpace: 'nowrap' }}>{String(type)}</span>
}

function SortableTH({ label, sk, active, dir, onSort }: { label: string; sk: SortKey; active: boolean; dir: SortDir; onSort: (k: SortKey) => void }) {
  return (
    <th onClick={() => onSort(sk)} style={{ backgroundColor: '#F3EEFF', fontSize: '12.5px', fontWeight: 500, padding: '11px 14px', textAlign: 'left' as const, borderBottom: '1px solid #E8E4F1', whiteSpace: 'nowrap' as const, cursor: 'pointer', userSelect: 'none' as const, color: active ? '#B91C1C' : '#655F7D' }}>
      {label} <span style={{ opacity: active ? 1 : 0.3 }}>{active ? (dir === 'desc' ? '↓' : '↑') : '↕'}</span>
    </th>
  )
}

const STH: React.CSSProperties = { backgroundColor: '#F3EEFF', color: '#655F7D', fontSize: '12.5px', fontWeight: 500, padding: '11px 14px', textAlign: 'left', borderBottom: '1px solid #E8E4F1', whiteSpace: 'nowrap' }
const TD: React.CSSProperties = { padding: '12px 14px', verticalAlign: 'middle' }
const SEL: React.CSSProperties = { backgroundColor: '#FFFFFF', border: '1px solid #E8E4F1', borderRadius: '8px', padding: '7px 11px', fontSize: '14px', color: '#17122B', cursor: 'pointer', outline: 'none' }

// ── contact link helper ───────────────────────────────────────────────────
function ContactLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#1D4ED8', textDecoration: 'none', padding: '5px 0' }}>
      {icon} <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>{label}</span>
    </a>
  )
}

// ── detail panel ─────────────────────────────────────────────────────────
function DetailPanel({ row, onClose, onDelete, onNoteSave }: { row: Row; onClose: () => void; onDelete: (id: unknown) => void; onNoteSave: (id: unknown, note: string) => void }) {
  const [noteText, setNoteText] = useState(String(row.notes ?? ''))
  const [saving, setSaving] = useState(false)

  const color = regionColor(row.region)
  const ini = initials(row.channel_name)

  const saveNote = async () => {
    setSaving(true)
    await onNoteSave(row.id, noteText)
    setSaving(false)
  }

  const stats = [
    { label: 'Abone', value: fmt(row.subscribers) },
    { label: 'Puan', value: row.score != null ? String(row.score) : '—' },
    { label: 'Uzun İzl.', value: fmt(row.avg_long_views) },
    { label: 'Shorts İzl.', value: fmt(row.avg_shorts_views) },
    { label: 'S30 Uzun', value: String(row.last_30_long_videos ?? '—') },
    { label: 'S30 Shorts', value: String(row.last_30_shorts ?? '—') },
    { label: 'Oyun Sayısı', value: String(row.game_count ?? '—') },
    { label: 'Son Video', value: row.last_video_date ? new Date(String(row.last_video_date)).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
  ]

  const contacts: { href: string; icon: React.ReactNode; label: string }[] = []
  if (row.email) contacts.push({ href: `mailto:${row.email}`, icon: <Mail size={13} />, label: String(row.email) })
  if (row.website) contacts.push({ href: String(row.website), icon: <Globe size={13} />, label: String(row.website) })
  if (row.twitter) contacts.push({ href: String(row.twitter).startsWith('http') ? String(row.twitter) : `https://twitter.com/${row.twitter}`, icon: <Image src="/icons/x.png" alt="Twitter" width={13} height={13} />, label: String(row.twitter) })
  if (row.instagram) contacts.push({ href: String(row.instagram).startsWith('http') ? String(row.instagram) : `https://instagram.com/${row.instagram}`, icon: <Image src="/icons/instagram.png" alt="Instagram" width={13} height={13} />, label: String(row.instagram) })
  if (row.tiktok) contacts.push({ href: String(row.tiktok).startsWith('http') ? String(row.tiktok) : `https://tiktok.com/@${row.tiktok}`, icon: <Image src="/icons/tiktok.png" alt="TikTok" width={13} height={13} />, label: String(row.tiktok) })
  if (row.discord) contacts.push({ href: String(row.discord), icon: <Image src="/icons/discord.png" alt="Discord" width={13} height={13} onError={() => {}} />, label: String(row.discord) })

  return (
    <div style={{ width: '380px', backgroundColor: '#FFFFFF', borderLeft: '1px solid #E8E4F1', display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'fixed', top: 0, right: 0, height: '100vh', zIndex: 1000 }}>
      {/* Panel header */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid #E8E4F1', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: color + '22', border: `2px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: '15px', letterSpacing: '-0.01em', color: inkOf(color), flexShrink: 0 }}>
          {ini}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#17122B', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(row.channel_name ?? '—')}</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <PriorityBadge priority={row.priority} />
            {!!row.region && <span style={{ fontSize: '12px', color: inkOf(color), backgroundColor: color + '18', borderRadius: '8px', padding: '1px 6px' }}>{String(row.region)}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {!!row.channel_url && (
            <a href={String(row.channel_url)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #E8E4F1', color: '#B91C1C', textDecoration: 'none' }}>
              <ExternalLink size={13} />
            </a>
          )}
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'transparent', border: '1px solid #E8E4F1', color: '#655F7D', cursor: 'pointer' }}>
            <X size={13} />
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {stats.map(s => (
            <div key={s.label} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E4F1', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ fontSize: '12px', color: '#655F7D', fontWeight: 600, marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', letterSpacing: '-0.01em', fontWeight: 600, color: '#17122B' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Oyunlar */}
        {!!row.games && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#655F7D', marginBottom: '8px' }}>Oyunlar</div>
            <div style={{ fontSize: '12.5px', color: '#4A4462', lineHeight: 1.6, backgroundColor: '#FFFFFF', border: '1px solid #E8E4F1', borderRadius: '8px', padding: '10px 12px' }}>{String(row.games)}</div>
          </div>
        )}

        {/* Bio */}
        {!!row.bio && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#655F7D', marginBottom: '8px' }}>Bio</div>
            <div style={{ fontSize: '12.5px', color: '#4A4462', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{String(row.bio)}</div>
          </div>
        )}

        {/* AI Açıklama */}
        {!!row.ai_description && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#655F7D', marginBottom: '8px' }}>AI Açıklama</div>
            <div style={{ fontSize: '12.5px', color: '#4A4462', lineHeight: 1.6, whiteSpace: 'pre-wrap', backgroundColor: '#F3EEFF', border: '1px solid #E8E4F1', borderRadius: '8px', padding: '10px 12px' }}>{String(row.ai_description)}</div>
          </div>
        )}

        {/* İletişim */}
        {contacts.length > 0 && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#655F7D', marginBottom: '8px' }}>İletişim</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {contacts.map((c, i) => <ContactLink key={i} {...c} />)}
            </div>
          </div>
        )}

        {/* Notlar */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#655F7D', marginBottom: '8px' }}>Notlar</div>
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Notunuzu buraya yazın..."
            style={{ width: '100%', backgroundColor: '#FFFFFF', border: '1px solid #E8E4F1', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#17122B', outline: 'none', resize: 'vertical', minHeight: '90px', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.55 }}
          />
          <button onClick={saveNote} disabled={saving} style={{ marginTop: '8px', width: '100%', padding: '8px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #D8D2E6', color: '#B91C1C', fontWeight: 600, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Kaydediliyor...' : 'Notu Kaydet'}
          </button>
        </div>

        {/* Delete */}
        <button
          onClick={() => { if (confirm('Bu kanalı silmek istediğinizden emin misiniz?')) onDelete(row.id) }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #E8E4F1', color: '#B91C1C', fontWeight: 600, fontSize: '14px', cursor: 'pointer', marginTop: '4px' }}
        >
          <Trash2 size={13} /> Kanalı Sil
        </button>
      </div>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────
export default function YouTubePage() {
  const [channels, setChannels] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Row | null>(null)
  const [tab, setTab] = useState<'all' | 'global' | 'japonya'>('all')
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    async function fetchAll() {
      const sb = createSupabaseBrowserClient()
      let all: Row[] = []
      let from = 0
      const batchSize = 1000
      while (true) {
        const { data, error } = await sb
          .from('youtube_channels')
          .select('*')
          .order('score', { ascending: false })
          .range(from, from + batchSize - 1)
        if (error || !data || data.length === 0) break
        all = [...all, ...(data as Row[])]
        if (data.length < batchSize) break
        from += batchSize
      }
      setChannels(all)
      setLoading(false)
    }
    fetchAll()
  }, [])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const deleteChannel = useCallback(async (id: unknown) => {
    await createSupabaseBrowserClient().from('youtube_channels').delete().eq('id', id)
    setChannels(prev => prev.filter(c => c.id !== id))
    setSelected(prev => (prev?.id === id ? null : prev))
  }, [])

  const saveNote = useCallback(async (id: unknown, note: string) => {
    await createSupabaseBrowserClient().from('youtube_channels').update({ notes: note }).eq('id', id)
    setChannels(prev => prev.map(c => c.id === id ? { ...c, notes: note } : c))
    setSelected(prev => (prev?.id === id ? { ...prev, notes: note } : prev))
  }, [])

  const regions = useMemo(() => Array.from(new Set(channels.map(c => String(c.region ?? '')).filter(Boolean))).sort(), [channels])
  const types   = useMemo(() => Array.from(new Set(channels.map(c => String(c.channel_type ?? '')).filter(Boolean))).sort(), [channels])

  const sorted = useMemo(() => {
    let data = channels
    if (tab === 'global')  data = data.filter(c => !isJaponya(c.region))
    if (tab === 'japonya') data = data.filter(c => isJaponya(c.region))
    if (search) data = data.filter(c => String(c.channel_name ?? '').toLowerCase().includes(search.toLowerCase()))
    if (regionFilter) data = data.filter(c => String(c.region ?? '') === regionFilter)
    if (typeFilter)   data = data.filter(c => String(c.channel_type ?? '') === typeFilter)
    if (priorityFilter) data = data.filter(c => String(c.priority ?? '') === priorityFilter)
    return [...data].sort((a, b) => {
      const av = Number(a[sortKey] ?? 0), bv = Number(b[sortKey] ?? 0)
      return sortDir === 'desc' ? bv - av : av - bv
    })
  }, [channels, tab, search, regionFilter, typeFilter, priorityFilter, sortKey, sortDir])

  const totalCount   = channels.length
  const globalCount  = channels.filter(c => !isJaponya(c.region)).length
  const japonyaCount = channels.filter(c => isJaponya(c.region)).length
  const hasFilters   = !!(search || regionFilter || typeFilter || priorityFilter)

  const TABS = [
    { key: 'all',     label: `Tümü (${totalCount})` },
    { key: 'global',  label: `Global (${globalCount})` },
    { key: 'japonya', label: `Japonya (${japonyaCount})` },
  ] as const

  return (
    <div>
      <PageHeader title="YouTube" subtitle="Influencer kanal takibi ve analizi" imageSrc="/icons/youtube.png" gradient="linear-gradient(135deg, #FF0000, #cc0000)">
        <a
          href="https://docs.google.com/spreadsheets/d/148n9k7zHQyBrgGxrnAuFZ4pMIXqrTVCUPd59nrEkcDg/edit?gid=1299085038#gid=1920292925"
          target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', backgroundColor: '#ECFDF5', border: '1px solid #D8D2E6', color: '#047857', fontWeight: 600, fontSize: '14px', textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          <BarChart3 size={15} aria-hidden /> Tam Liste
        </a>
      </PageHeader>

      <div style={{ padding: '24px 32px' }}>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { label: 'Toplam Kanal', value: totalCount, color: '#FF0000' },
            { label: 'Global', value: globalCount, color: '#1D4ED8' },
            { label: 'Japonya', value: japonyaCount, color: '#B91C1C' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', padding: '16px 22px', minWidth: '140px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', fontWeight: 600, color: inkOf(s.color), lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#655F7D', marginTop: '6px', }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer', backgroundColor: tab === t.key ? '#F3EEFF' : 'transparent', color: tab === t.key ? '#6D28D9' : '#655F7D', transition: 'background-color 150ms var(--ease-out), color 150ms var(--ease-out)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Table card */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '12px 16px', borderBottom: '1px solid #E8E4F1', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
                <Search size={12} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#655F7D', pointerEvents: 'none' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Kanal ara..." style={{ ...SEL, paddingLeft: '28px', width: '100%', boxSizing: 'border-box' }} />
              </div>
              <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={SEL}>
                <option value="">Tüm Bölgeler</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={SEL}>
                <option value="">Tüm Türler</option>
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={SEL}>
                <option value="">Tüm Öncelikler</option>
                <option value="high">Yüksek</option>
                <option value="medium">Orta</option>
              </select>
              {hasFilters && (
                <button onClick={() => { setSearch(''); setRegionFilter(''); setTypeFilter(''); setPriorityFilter('') }} style={{ fontSize: '12px', color: '#655F7D', background: 'none', border: '1px solid #E8E4F1', borderRadius: '8px', padding: '7px 11px', cursor: 'pointer' }}>
                  Temizle
                </button>
              )}
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#655F7D', whiteSpace: 'nowrap' }}>{sorted.length}{hasFilters ? ` / ${channels.length}` : ''} kanal</span>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...STH, width: '40px' }}></th>
                    <th style={STH}>Kanal</th>
                    <SortableTH label="Abone"      sk="subscribers"     active={sortKey === 'subscribers'}     dir={sortDir} onSort={handleSort} />
                    <SortableTH label="Uzun İzl."  sk="avg_long_views"  active={sortKey === 'avg_long_views'}  dir={sortDir} onSort={handleSort} />
                    <SortableTH label="Shorts İzl." sk="avg_shorts_views" active={sortKey === 'avg_shorts_views'} dir={sortDir} onSort={handleSort} />
                    <SortableTH label="Oyun Sayısı" sk="game_count"      active={sortKey === 'game_count'}      dir={sortDir} onSort={handleSort} />
                    <th style={STH}>İçerik Türü</th>
                    <SortableTH label="Puan"       sk="score"           active={sortKey === 'score'}           dir={sortDir} onSort={handleSort} />
                    <th style={{ ...STH, width: '90px' }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#655F7D', fontSize: '14px' }}>Yükleniyor...</td></tr>
                  ) : sorted.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#655F7D', fontSize: '14px' }}>{hasFilters ? 'Eşleşen kanal bulunamadı' : 'Henüz kanal eklenmemiş'}</td></tr>
                  ) : sorted.map((row, i) => {
                    const isActive = selected?.id === row.id
                    const color = regionColor(row.region)
                    return (
                      <tr
                        key={String(row.id ?? i)}
                        onClick={() => setSelected(isActive ? null : row)}
                        style={{ borderBottom: i < sorted.length - 1 ? '1px solid #E8E4F1' : 'none', backgroundColor: isActive ? '#FEF2F2' : i % 2 === 1 ? '#FAF9FD' : 'transparent', cursor: 'pointer', transition: 'background-color 0.1s' }}
                      >
                        <td style={{ ...TD, paddingRight: '8px' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: color + '22', border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: inkOf(color), flexShrink: 0 }}>
                            {initials(row.channel_name)}
                          </div>
                        </td>
                        <td style={TD}>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: '#17122B', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(row.channel_name ?? '—')}</div>
                          {!!row.region && <div style={{ fontSize: '12px', color: inkOf(color), marginTop: '2px' }}>{String(row.region)}</div>}
                        </td>
                        <td style={TD}><span style={{ color: '#047857', fontWeight: 600, fontSize: '14px' }}>{fmt(row.subscribers)}</span></td>
                        <td style={TD}><span style={{ color: '#1D4ED8', fontWeight: 600, fontSize: '14px' }}>{fmt(row.avg_long_views)}</span></td>
                        <td style={TD}><span style={{ color: '#6D28D9', fontWeight: 600, fontSize: '14px' }}>{fmt(row.avg_shorts_views)}</span></td>
                        <td style={TD}><span style={{ color: '#C2410C', fontWeight: 600, fontSize: '14px' }}>{row.game_count != null ? String(row.game_count) : '—'}</span></td>
                        <td style={TD}><ChannelTypeBadge type={row.channel_type} /></td>
                        <td style={TD}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {row.score != null && <span style={{ fontWeight: 700, fontSize: '14px', color: '#17122B' }}>{String(row.score)}</span>}
                            <PriorityBadge priority={row.priority} />
                          </div>
                        </td>
                        <td style={TD} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {!!row.channel_url && (
                              <a href={String(row.channel_url)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#B91C1C', backgroundColor: '#FEF2F2', border: '1px solid #E8E4F1', borderRadius: '8px', padding: '4px 8px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                                <ExternalLink size={10} /> Kanal
                              </a>
                            )}
                            <button onClick={() => { if (confirm('Silmek istediğinizden emin misiniz?')) deleteChannel(row.id) }} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#655F7D', backgroundColor: 'transparent', border: '1px solid #E8E4F1', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
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

        {/* Overlay + detail panel */}
        {selected && (
          <>
            <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, backgroundColor: '#6D28D9', zIndex: 999 }} />
            <DetailPanel
              row={selected}
              onClose={() => setSelected(null)}
              onDelete={deleteChannel}
              onNoteSave={saveNote}
            />
          </>
        )}
      </div>
    </div>
  )
}
