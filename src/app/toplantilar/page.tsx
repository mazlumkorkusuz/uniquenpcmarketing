export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import Badge, { statusBadge } from '@/components/Badge'
import { Calendar } from 'lucide-react'
import { MeetingModal, EditMeetingButton } from '@/components/MeetingModal'
import { DeleteButton } from '@/components/DeleteButton'

async function getData() {
  const [{ data: meetings }, { data: notes }] = await Promise.all([
    supabase.from('meetings').select('*').order('date', { ascending: false }),
    supabase.from('meeting_notes').select('*').order('created_at', { ascending: false }),
  ])
  return { meetings: meetings ?? [], notes: notes ?? [] }
}

type Row = Record<string, unknown>

function formatDate(v: unknown) {
  if (!v) return <span style={{ color: '#8F8F8F' }}>—</span>
  return (
    <span style={{ fontSize: '13px', color: '#B4B4B4', whiteSpace: 'nowrap' }}>
      {new Date(v as string).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
    </span>
  )
}

export default async function ToplantilarPage() {
  const { meetings, notes } = await getData()

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const upcoming = meetings.filter((m) => {
    if (m.status === 'iptal' || m.status === 'cancelled') return false
    if (m.status === 'tamamlandı' || m.status === 'completed') return false
    const meetingDate = new Date(m.date)
    meetingDate.setHours(0, 0, 0, 0)
    return meetingDate >= now
  })
  const past = meetings.filter((m) => {
    if (m.status === 'tamamlandı' || m.status === 'completed') return true
    const meetingDate = new Date(m.date)
    meetingDate.setHours(0, 0, 0, 0)
    return meetingDate < now
  })

  const meetingCols = [
    { key: 'title', label: 'Toplantı Başlığı', width: '220px', render: (v: unknown) => <span style={{ fontWeight: 600, color: '#EDEDED' }}>{String(v ?? '—')}</span> },
    { key: 'date', label: 'Tarih', render: formatDate },
    { key: 'time', label: 'Saat', render: (v: unknown) => v ? <span style={{ fontFamily: 'monospace', color: '#B4B4B4' }}>{String(v)}</span> : <span style={{ color: '#8F8F8F' }}>—</span> },
    { key: 'platform', label: 'Platform', render: (v: unknown) => v ? <Badge variant="blue">{String(v)}</Badge> : <span style={{ color: '#8F8F8F' }}>—</span> },
    { key: 'attendees', label: 'Katılımcılar', render: (v: unknown) => v ? <span style={{ fontSize: '12px', color: '#B4B4B4', maxWidth: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(v)}</span> : <span style={{ color: '#8F8F8F' }}>—</span> },
    { key: 'status', label: 'Durum', render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#8F8F8F' }}>—</span> },
    { key: 'id', label: '', width: '80px', render: (_: unknown, row: Row) => (
      <div style={{ display: 'flex', gap: '4px' }}>
        <EditMeetingButton row={row} />
        <DeleteButton table="meetings" id={row.id as string} />
      </div>
    )},
  ]

  const notesCols = [
    { key: 'meeting_id', label: 'Toplantı', render: (v: unknown) => {
      const meeting = meetings.find(m => String(m.id) === String(v))
      return <span style={{ fontWeight: 600, color: '#EDEDED' }}>{meeting ? String(meeting.title ?? '—') : <span style={{ color: '#8F8F8F' }}>—</span>}</span>
    }},
    { key: 'content', label: 'Not İçeriği', render: (v: unknown) => (
      <span style={{ fontSize: '13px', color: '#B4B4B4', display: 'block', whiteSpace: 'pre-wrap' }}>
        {String(v ?? '—')}
      </span>
    )},
    { key: 'author', label: 'Yazan', render: (v: unknown) => v ? <Badge variant="gray">{String(v)}</Badge> : <span style={{ color: '#8F8F8F' }}>—</span> },
    {
      key: 'created_at',
      label: 'Tarih',
      render: (v: unknown) =>
        v ? (
          <span style={{ fontSize: '12px', color: '#8F8F8F' }}>
            {new Date(v as string).toLocaleDateString('tr-TR')}
          </span>
        ) : (
          <span style={{ color: '#8F8F8F' }}>—</span>
        ),
    },
  ]

  const summaryCards = [
    { label: 'Toplam', value: meetings.length, color: '#9E8CFC' },
    { label: 'Yaklaşan', value: upcoming.length, color: '#3b82f6' },
    { label: 'Tamamlanan', value: past.length, color: '#22c55e' },
    { label: 'Notlar', value: notes.length, color: '#f59e0b' },
  ]

  return (
    <div>
      <PageHeader
        title="Toplantılar"
        subtitle="Toplantı takvimi ve notlar"
        icon={Calendar}
        gradient="linear-gradient(135deg, #14b8a6, #3b82f6)"
      >
        <MeetingModal />
      </PageHeader>
      <div style={{ padding: '24px 32px' }}>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {summaryCards.map((c) => (
            <div
              key={c.label}
              style={{
                backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)',
                border: '1px solid #262626',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: '13px', color: '#8F8F8F', marginTop: '6px' }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Upcoming */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #262626', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.6)' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#EDEDED' }}>Yaklaşan Toplantılar</span>
            <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(34,197,94,0.12)', color: '#3DD68C', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>
              {upcoming.length}
            </span>
          </div>
          <DataTable columns={meetingCols} data={upcoming as Row[]} emptyMessage="Yaklaşan toplantı yok" />
        </div>

        {/* Past */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #262626', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8F8F8F' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#EDEDED' }}>Geçmiş Toplantılar</span>
            <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(100,116,139,0.12)', color: '#B4B4B4', border: '1px solid rgba(100,116,139,0.3)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>
              {past.length}
            </span>
          </div>
          <DataTable columns={meetingCols} data={past as Row[]} emptyMessage="Geçmiş toplantı yok" />
        </div>

        {/* Meeting notes */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #262626', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#EDEDED' }}>Toplantı Notları</span>
            <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(245,158,11,0.12)', color: '#FFB224', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>
              {notes.length}
            </span>
          </div>
          <DataTable columns={notesCols} data={notes as Row[]} emptyMessage="Toplantı notu bulunamadı" />
        </div>
      </div>
    </div>
  )
}
