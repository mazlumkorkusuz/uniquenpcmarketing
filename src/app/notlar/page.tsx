export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import Badge from '@/components/Badge'
import { FileText } from 'lucide-react'
import { NoteModal, EditNoteButton } from '@/components/NoteModal'
import { DeleteButton } from '@/components/DeleteButton'

async function getData() {
  const { data: notes } = await supabase.from('notes').select('*').order('created_at', { ascending: false })
  return { notes: notes ?? [] }
}

type Row = Record<string, unknown>

function truncate(v: unknown, len = 80) {
  const s = String(v ?? '')
  return (
    <span style={{ fontSize: '12.5px', color: '#4A4462' }}>
      {s.length > len ? s.slice(0, len) + '…' : s || <span style={{ color: '#655F7D' }}>—</span>}
    </span>
  )
}

function dateCell(v: unknown) {
  return v ? (
    <span style={{ fontSize: '12px', color: '#655F7D' }}>
      {new Date(v as string).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
    </span>
  ) : <span style={{ color: '#655F7D' }}>—</span>
}

export default async function NotlarPage() {
  const { notes } = await getData()

  const generalCols = [
    { key: 'title', label: 'Başlık', render: (v: unknown) => <span style={{ fontWeight: 600, color: '#17122B' }}>{String(v ?? '—')}</span> },
    { key: 'content', label: 'İçerik', render: (v: unknown) => truncate(v) },
    { key: 'category', label: 'Kategori', render: (v: unknown) => v ? <Badge variant="orange">{String(v)}</Badge> : <span style={{ color: '#655F7D' }}>—</span> },
    { key: 'tags', label: 'Etiketler', render: (v: unknown) => {
      if (!v) return <span style={{ color: '#655F7D' }}>—</span>
      const tags = String(v).split(',').map(t => t.trim()).filter(Boolean)
      return (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {tags.map((t, i) => <Badge key={i} variant="gray">{t}</Badge>)}
        </div>
      )
    }},
    { key: 'author', label: 'Yazar', render: (v: unknown) => v ? <Badge variant="purple">{String(v)}</Badge> : <span style={{ color: '#655F7D' }}>—</span> },
    { key: 'created_at', label: 'Tarih', render: dateCell },
    { key: 'id', label: '', width: '80px', render: (_: unknown, row: Row) => (
      <div style={{ display: 'flex', gap: '4px' }}>
        <EditNoteButton row={row} />
        <DeleteButton table="notes" id={row.id as string} />
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader
        title="Notlar"
        subtitle={`${notes.length} not`}
        icon={FileText}
        gradient="linear-gradient(135deg, #7C3AED, #6D28D9)"
      >
        <NoteModal />
      </PageHeader>
      <div style={{ padding: '24px 32px' }}>
        <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E8E4F1', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#B45309' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', letterSpacing: '-0.01em', fontWeight: 600, color: '#17122B' }}>Genel Notlar</span>
            <span style={{ marginLeft: 'auto', backgroundColor: '#FFF7ED', color: '#C2410C', border: '1px solid #D8D2E6', borderRadius: '9999px', padding: '2px 10px', fontSize: '14px', fontWeight: 600 }}>
              {notes.length}
            </span>
          </div>
          <DataTable columns={generalCols} data={notes as Row[]} emptyMessage="Genel not bulunamadı" />
        </div>
      </div>
    </div>
  )
}
