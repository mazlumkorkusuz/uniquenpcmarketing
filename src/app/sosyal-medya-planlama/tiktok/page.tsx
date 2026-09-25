export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import StatCard from '@/components/StatCard'
import Badge from '@/components/Badge'
import { TrendingUp, Calendar, CheckCircle, Clock } from 'lucide-react'

type Row = Record<string, unknown>

const COLOR = '#fe2c55'
const PLATFORM = 'tiktok'

async function getData() {
  const { data } = await supabase
    .from('social_media_plans')
    .select('*')
    .eq('platform', PLATFORM)
    .order('scheduled_date', { ascending: true })
  return (data ?? []) as Row[]
}

function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function planStatus(v: unknown) {
  const s = String(v ?? '').toLowerCase()
  const variant =
    s === 'published' || s === 'yayınlandı' ? 'green'
    : s === 'scheduled' || s === 'planlandı' ? 'blue'
    : s === 'draft' || s === 'taslak' ? 'gray'
    : s === 'cancelled' || s === 'iptal' ? 'red'
    : 'gray'
  return <Badge variant={variant}>{String(v ?? '—')}</Badge>
}

export default async function TikTokPlanlama() {
  const rows = await getData()
  const total = rows.length
  const scheduledCount = rows.filter((r) => {
    const s = String(r.status ?? '').toLowerCase()
    return s === 'scheduled' || s === 'planlandı'
  }).length
  const publishedCount = rows.filter((r) => {
    const s = String(r.status ?? '').toLowerCase()
    return s === 'published' || s === 'yayınlandı'
  }).length

  const cols = [
    { key: 'title',          label: 'Başlık',           render: (v: unknown) => <span style={{ fontWeight: 600, color: COLOR }}>{String(v ?? '—')}</span> },
    { key: 'content',        label: 'İçerik',            render: (v: unknown) => <span style={{ color: '#444444', fontSize: '12px', display: 'block', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(v ?? '—')}</span> },
    { key: 'scheduled_date', label: 'Planlanan Tarih',   render: (v: unknown) => <span style={{ color: '#2563EB' }}>{formatDate(v as string)}</span> },
    { key: 'status',         label: 'Durum',             render: planStatus },
  ]

  return (
    <div>
      <PageHeader
        title="TikTok Planlaması"
        subtitle={`${total} gönderi planlandı`}
        icon={TrendingUp}
        gradient={`linear-gradient(135deg, ${COLOR}, #9f1239)`}
      />
      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <StatCard label="Toplam Gönderi"  value={total}          icon={TrendingUp}  iconColor={COLOR}     iconBg={`${COLOR}20`} />
          <StatCard label="Planlandı"        value={scheduledCount} icon={Clock}       iconColor="#2563EB"  iconBg="rgba(59,130,246,0.12)" />
          <StatCard label="Yayınlandı"       value={publishedCount} icon={CheckCircle} iconColor="#16A34A"  iconBg="rgba(34,197,94,0.12)" />
        </div>

        {/* Calendar placeholder */}
        <div style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)', border: '1px solid #E0E0E0', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Calendar size={15} color={COLOR} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111111' }}>Takvim Görünümü</span>
          </div>
          <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px dashed #E0E0E0' }}>
            <span style={{ fontSize: '13px', color: '#8A8A8A' }}>Takvim görünümü yakında</span>
          </div>
        </div>

        {/* Posts table */}
        <div style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)', border: '1px solid #E0E0E0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLOR }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#111111' }}>Planlanan Gönderiler</span>
            <span style={{ marginLeft: 'auto', backgroundColor: `${COLOR}20`, color: COLOR, border: `1px solid ${COLOR}40`, borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>{total}</span>
          </div>
          <DataTable columns={cols} data={rows} emptyMessage="Henüz TikTok gönderisi planlanmamış" />
        </div>
      </div>
    </div>
  )
}
