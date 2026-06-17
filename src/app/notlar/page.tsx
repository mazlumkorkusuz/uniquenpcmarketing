export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import Badge from '@/components/Badge'
import { FileText } from 'lucide-react'

async function getData() {
  const [{ data: notes }, { data: twitterNotes }, { data: youtubeNotes }] = await Promise.all([
    supabase.from('notes').select('*').order('created_at', { ascending: false }),
    supabase.from('twitter_notes').select('*').order('created_at', { ascending: false }),
    supabase.from('youtube_notes').select('*').order('created_at', { ascending: false }),
  ])
  return { notes: notes ?? [], twitterNotes: twitterNotes ?? [], youtubeNotes: youtubeNotes ?? [] }
}

type Row = Record<string, unknown>

function truncate(v: unknown, len = 80) {
  const s = String(v ?? '')
  return (
    <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
      {s.length > len ? s.slice(0, len) + '…' : s || <span style={{ color: '#64748b' }}>—</span>}
    </span>
  )
}

function dateCell(v: unknown) {
  return v ? (
    <span style={{ fontSize: '12px', color: '#64748b' }}>
      {new Date(v as string).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
    </span>
  ) : <span style={{ color: '#64748b' }}>—</span>
}

export default async function NotlarPage() {
  const { notes, twitterNotes, youtubeNotes } = await getData()

  const generalCols = [
    { key: 'title', label: 'Başlık', render: (v: unknown) => <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{String(v ?? '—')}</span> },
    { key: 'content', label: 'İçerik', render: (v: unknown) => truncate(v) },
    { key: 'category', label: 'Kategori', render: (v: unknown) => v ? <Badge variant="orange">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'tags', label: 'Etiketler', render: (v: unknown) => {
      if (!v) return <span style={{ color: '#64748b' }}>—</span>
      const tags = String(v).split(',').map(t => t.trim()).filter(Boolean)
      return (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {tags.map((t, i) => <Badge key={i} variant="gray">{t}</Badge>)}
        </div>
      )
    }},
    { key: 'author', label: 'Yazar', render: (v: unknown) => v ? <Badge variant="purple">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'created_at', label: 'Tarih', render: dateCell },
  ]

  const twitterCols = [
    { key: 'account_id', label: 'Hesap', render: (v: unknown) => v ? <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#94a3b8' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'content', label: 'Not', render: (v: unknown) => truncate(v) },
    { key: 'tags', label: 'Etiketler', render: (v: unknown) => {
      if (!v) return <span style={{ color: '#64748b' }}>—</span>
      const tags = String(v).split(',').map(t => t.trim()).filter(Boolean)
      return (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {tags.map((t, i) => <Badge key={i} variant="blue">{t}</Badge>)}
        </div>
      )
    }},
    { key: 'author', label: 'Yazar', render: (v: unknown) => v ? <Badge variant="gray">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'created_at', label: 'Tarih', render: dateCell },
  ]

  const ytCols = [
    { key: 'channel_id', label: 'Kanal', render: (v: unknown) => v ? <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#94a3b8' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'content', label: 'Not', render: (v: unknown) => truncate(v) },
    { key: 'tags', label: 'Etiketler', render: (v: unknown) => {
      if (!v) return <span style={{ color: '#64748b' }}>—</span>
      const tags = String(v).split(',').map(t => t.trim()).filter(Boolean)
      return (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {tags.map((t, i) => <Badge key={i} variant="red">{t}</Badge>)}
        </div>
      )
    }},
    { key: 'author', label: 'Yazar', render: (v: unknown) => v ? <Badge variant="gray">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'created_at', label: 'Tarih', render: dateCell },
  ]

  const NoteSection = ({
    title,
    count,
    color,
    children,
  }: { title: string; count: number; color: string; children: React.ReactNode }) => (
    <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>{title}</span>
        <span style={{ marginLeft: 'auto', backgroundColor: color + '20', color, border: `1px solid ${color}40`, borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>
          {count}
        </span>
      </div>
      {children}
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Notlar"
        subtitle={`${notes.length + twitterNotes.length + youtubeNotes.length} not · Genel, Twitter, YouTube`}
        icon={FileText}
        gradient="linear-gradient(135deg, #f59e0b, #ef4444)"
      />
      <div style={{ padding: '24px 32px' }}>
        <NoteSection title="Genel Notlar" count={notes.length} color="#f59e0b">
          <DataTable columns={generalCols} data={notes as Row[]} emptyMessage="Genel not bulunamadı" />
        </NoteSection>
        <NoteSection title="Twitter Notları" count={twitterNotes.length} color="#1d9bf0">
          <DataTable columns={twitterCols} data={twitterNotes as Row[]} emptyMessage="Twitter notu bulunamadı" />
        </NoteSection>
        <NoteSection title="YouTube Notları" count={youtubeNotes.length} color="#ff0000">
          <DataTable columns={ytCols} data={youtubeNotes as Row[]} emptyMessage="YouTube notu bulunamadı" />
        </NoteSection>
      </div>
    </div>
  )
}
