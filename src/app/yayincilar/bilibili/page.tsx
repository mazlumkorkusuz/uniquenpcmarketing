export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import DataTable from '@/components/DataTable'
import Badge, { statusBadge } from '@/components/Badge'
import StatCard from '@/components/StatCard'
import PageHeader from '@/components/PageHeader'
import { Tv2, Users } from 'lucide-react'
import { StreamerModal } from '@/components/StreamerModal'
import { DeleteButton } from '@/components/DeleteButton'

type Row = Record<string, unknown>

async function getData() {
  const { data } = await supabase.from('bilibili_streamers').select('*').order('followers', { ascending: false })
  return (data ?? []) as Row[]
}

function numCell(v: unknown) {
  return v ? <span style={{ color: '#4ade80', fontWeight: 600 }}>{Number(v).toLocaleString('en-US')}</span> : <span style={{ color: '#64748b' }}>—</span>
}
function strCell(v: unknown) {
  return v ? <span style={{ color: '#cbd5e1' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span>
}

export default async function BiliBiliPage() {
  const rows = await getData()
  const total = rows.length
  const totalFollowers = rows.reduce((s, r) => s + (Number(r.followers) || 0), 0)

  const cols = [
    { key: 'username',     label: 'Kullanıcı Adı', render: (v: unknown) => <span style={{ fontWeight: 600, color: '#f472b6' }}>{String(v ?? '—')}</span> },
    { key: 'channel_name', label: 'Kanal Adı',     render: strCell },
    { key: 'followers',    label: 'Takipçi',       render: numCell },
    { key: 'language',     label: 'Dil',           render: (v: unknown) => v ? <Badge variant="purple">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'status',       label: 'Durum',         render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
    { key: 'id', label: '', width: '52px', render: (_: unknown, row: Row) => <DeleteButton table="bilibili_streamers" id={row.id as string} /> },
  ]

  return (
    <div>
      <PageHeader title="BiliBili Yayıncıları" subtitle={`${total} yayıncı takip ediliyor`} imageSrc="/icons/bilibili.png" gradient="linear-gradient(135deg, #f472b6, #a855f7)">
        <StreamerModal table="bilibili_streamers" color="#f472b6" />
      </PageHeader>
      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <StatCard label="Toplam Yayıncı" value={total}                                  icon={Tv2}   iconColor="#f472b6" iconBg="rgba(244,114,182,0.12)" />
          <StatCard label="Toplam Takipçi" value={totalFollowers.toLocaleString('en-US')} icon={Users} iconColor="#4ade80" iconBg="rgba(34,197,94,0.12)" />
        </div>
        <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f472b6' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Tüm Yayıncılar</span>
            <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(244,114,182,0.12)', color: '#f472b6', border: '1px solid rgba(244,114,182,0.3)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>{total}</span>
          </div>
          <DataTable columns={cols} data={rows} emptyMessage="BiliBili yayıncısı bulunamadı" />
        </div>
      </div>
    </div>
  )
}
