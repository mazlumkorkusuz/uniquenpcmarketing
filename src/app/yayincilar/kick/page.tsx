export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import DataTable from '@/components/DataTable'
import Badge, { statusBadge } from '@/components/Badge'
import StatCard from '@/components/StatCard'
import BarChart from '@/components/BarChart'
import PageHeader from '@/components/PageHeader'
import { Tv2, Users, Eye } from 'lucide-react'

type Row = Record<string, unknown>

async function getData() {
  const { data } = await supabase.from('kick_streamers').select('*').order('followers', { ascending: false })
  return (data ?? []) as Row[]
}

function numCell(v: unknown) {
  return v ? <span style={{ color: '#4ade80', fontWeight: 600 }}>{Number(v).toLocaleString('en-US')}</span> : <span style={{ color: '#64748b' }}>—</span>
}
function strCell(v: unknown) {
  return v ? <span style={{ color: '#cbd5e1' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span>
}

export default async function KickPage() {
  const rows = await getData()
  const total = rows.length
  const totalFollowers = rows.reduce((s, r) => s + (Number(r.followers) || 0), 0)
  const avgViewers = total > 0 ? Math.round(rows.reduce((s, r) => s + (Number(r.avg_viewers) || 0), 0) / total) : 0
  const chartData = rows.slice(0, 10).map((r) => ({ label: String(r.channel_name ?? r.username ?? '—'), value: Number(r.followers) || 0 }))

  const cols = [
    { key: 'username',      label: 'Kullanıcı Adı', render: (v: unknown) => <span style={{ fontWeight: 600, color: '#4ade80' }}>{String(v ?? '—')}</span> },
    { key: 'channel_name',  label: 'Kanal Adı',     render: strCell },
    { key: 'followers',     label: 'Takipçi',       render: numCell },
    { key: 'avg_viewers',   label: 'Ort. İzleyici', render: numCell },
    { key: 'language',      label: 'Dil',           render: (v: unknown) => v ? <Badge variant="blue">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'contact_email', label: 'E-posta',       render: (v: unknown) => v ? <span style={{ color: '#7c3aed', fontFamily: 'monospace', fontSize: '12px' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'status',        label: 'Durum',         render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
  ]

  return (
    <div>
      <PageHeader title="Kick Yayıncıları" subtitle={`${total} yayıncı takip ediliyor`} icon={Tv2} gradient="linear-gradient(135deg, #53fc18, #2ea80e)" />
      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <StatCard label="Toplam Yayıncı" value={total}                                  icon={Tv2}   iconColor="#4ade80" iconBg="rgba(34,197,94,0.12)" />
          <StatCard label="Toplam Takipçi" value={totalFollowers.toLocaleString('en-US')} icon={Users} iconColor="#86efac" iconBg="rgba(34,197,94,0.10)" />
          <StatCard label="Ort. İzleyici"  value={avgViewers.toLocaleString('en-US')}     icon={Eye}   iconColor="#60a5fa" iconBg="rgba(59,130,246,0.12)" />
        </div>

        {chartData.length > 0 && (
          <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '16px' }}>Takipçiye Göre Top 10</div>
            <BarChart data={chartData} color="#53fc18" height={140} maxBars={10} />
          </div>
        )}

        <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#53fc18' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Tüm Yayıncılar</span>
            <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(83,252,24,0.10)', color: '#4ade80', border: '1px solid rgba(83,252,24,0.25)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>{total}</span>
          </div>
          <DataTable columns={cols} data={rows} emptyMessage="Kick yayıncısı bulunamadı" />
        </div>
      </div>
    </div>
  )
}
