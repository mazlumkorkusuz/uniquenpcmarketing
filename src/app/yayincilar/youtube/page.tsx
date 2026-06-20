export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import DataTable from '@/components/DataTable'
import Badge, { statusBadge } from '@/components/Badge'
import StatCard from '@/components/StatCard'
import BarChart from '@/components/BarChart'
import PageHeader from '@/components/PageHeader'
import { Tv2, Users, Eye } from 'lucide-react'
import { StreamerModal, EditStreamerButton } from '@/components/StreamerModal'
import { DeleteButton } from '@/components/DeleteButton'

type Row = Record<string, unknown>

async function getData() {
  const [{ data: channels }, { data: notes }] = await Promise.all([
    supabase.from('youtube_channels').select('*').order('subscribers', { ascending: false }),
    supabase.from('youtube_notes').select('*').order('created_at', { ascending: false }),
  ])
  return { channels: (channels ?? []) as Row[], notes: (notes ?? []) as Row[] }
}

function numCell(v: unknown) {
  return v ? <span style={{ color: '#4ade80', fontWeight: 600 }}>{Number(v).toLocaleString('en-US')}</span> : <span style={{ color: '#64748b' }}>—</span>
}
function strCell(v: unknown) {
  return v ? <span style={{ color: '#cbd5e1' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span>
}

export default async function YouTubePage() {
  const { channels, notes } = await getData()
  const total = channels.length
  const totalSubs = channels.reduce((s, r) => s + (Number(r.subscribers) || 0), 0)
  const avgViews = total > 0 ? Math.round(channels.reduce((s, r) => s + (Number(r.avg_views) || 0), 0) / total) : 0
  const chartData = channels.slice(0, 10).map((r) => ({ label: String(r.channel_name ?? '—'), value: Number(r.subscribers) || 0 }))

  const channelCols = [
    { key: 'channel_name',  label: 'Kanal',         render: (v: unknown) => <span style={{ fontWeight: 600, color: '#f87171' }}>{String(v ?? '—')}</span> },
    { key: 'subscribers',   label: 'Abone',         render: numCell },
    { key: 'avg_views',     label: 'Ort. İzlenme',  render: numCell },
    { key: 'language',      label: 'Dil',           render: (v: unknown) => v ? <Badge variant="blue">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'genre',         label: 'İçerik',        render: (v: unknown) => v ? <Badge variant="orange">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'contact_email', label: 'E-posta',       render: (v: unknown) => v ? <span style={{ color: '#7c3aed', fontFamily: 'monospace', fontSize: '12px' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'status',        label: 'Durum',         render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
    { key: 'id', label: '', width: '80px', render: (_: unknown, row: Row) => (
      <div style={{ display: 'flex', gap: '4px' }}>
        <EditStreamerButton row={row} table="youtube_channels" color="#ff4444" />
        <DeleteButton table="youtube_channels" id={row.id as string} />
      </div>
    )},
  ]

  const notesCols = [
    { key: 'channel_name', label: 'Kanal',   render: (v: unknown) => <span style={{ fontWeight: 600, color: '#f87171' }}>{String(v ?? '—')}</span> },
    { key: 'note',         label: 'Not',     render: strCell },
    { key: 'created_at',   label: 'Tarih',   render: (v: unknown) => v ? <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(v as string).toLocaleDateString('tr-TR')}</span> : <span style={{ color: '#64748b' }}>—</span> },
  ]

  return (
    <div>
      <PageHeader title="YouTube Kanalları" subtitle={`${total} kanal takip ediliyor`} imageSrc="/icons/youtube.png" gradient="linear-gradient(135deg, #ff4444, #cc0000)">
        <StreamerModal table="youtube_channels" color="#ff4444" />
      </PageHeader>
      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <StatCard label="Toplam Kanal"   value={total}                              icon={Tv2}   iconColor="#f87171" iconBg="rgba(239,68,68,0.12)" />
          <StatCard label="Toplam Abone"   value={totalSubs.toLocaleString('en-US')} icon={Users} iconColor="#4ade80" iconBg="rgba(34,197,94,0.12)" />
          <StatCard label="Ort. İzlenme"   value={avgViews.toLocaleString('en-US')}  icon={Eye}   iconColor="#60a5fa" iconBg="rgba(59,130,246,0.12)" />
        </div>

        {chartData.length > 0 && (
          <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '16px' }}>Aboneye Göre Top 10</div>
            <BarChart data={chartData} color="#ff4444" height={140} maxBars={10} />
          </div>
        )}

        <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff4444' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Tüm Kanallar</span>
            <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>{total}</span>
          </div>
          <DataTable columns={channelCols} data={channels} emptyMessage="YouTube kanalı bulunamadı" />
        </div>

        {notes.length > 0 && (
          <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Notlar</span>
              <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>{notes.length}</span>
            </div>
            <DataTable columns={notesCols} data={notes} emptyMessage="Not bulunamadı" />
          </div>
        )}
      </div>
    </div>
  )
}
