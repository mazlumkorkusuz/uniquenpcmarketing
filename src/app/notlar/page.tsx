export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import Badge from '@/components/Badge'
import { FileText } from 'lucide-react'
import { NoteModal } from '@/components/NoteModal'

async function getData() {
  const { data: notes } = await supabase.from('notes').select('*').order('created_at', { ascending: false })
  return { notes: notes ?? [] }
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
  const { notes } = await getData()

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

  return (
    <div>
      <PageHeader
        title="Notlar"
        subtitle={`${notes.length} not`}
        icon={FileText}
        gradient="linear-gradient(135deg, #f59e0b, #ef4444)"
      >
        <NoteModal />
      </PageHeader>
      <div style={{ padding: '24px 32px' }}>
        <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Genel Notlar</span>
            <span style={{ marginLeft: 'auto', backgroundColor: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b40', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>
              {notes.length}
            </span>
          </div>
          <DataTable columns={generalCols} data={notes as Row[]} emptyMessage="Genel not bulunamadı" />
        </div>
      </div>
    </div>
  )
}
