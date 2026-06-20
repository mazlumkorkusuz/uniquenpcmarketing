export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import Badge, { statusBadge } from '@/components/Badge'
import { Star } from 'lucide-react'
import { CuratorModal, EditCuratorButton } from '@/components/CuratorModal'
import { DeleteButton } from '@/components/DeleteButton'

async function getData() {
  const { data: curators } = await supabase
    .from('curators')
    .select('*')
    .order('created_at', { ascending: false })
  return { curators: curators ?? [] }
}

type Row = Record<string, unknown>

export default async function SteamKuratorleriPage() {
  const { curators } = await getData()

  const curatorColumns = [
    { key: 'name', label: 'Küratör Adı', width: '200px' },
    { key: 'platform', label: 'Platform', render: (v: unknown) => v ? <Badge variant="blue">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'genre', label: 'Tür', render: (v: unknown) => v ? <Badge variant="purple">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'followers', label: 'Takipçi', render: (v: unknown) => v ? <span style={{ color: '#4ade80', fontWeight: 600 }}>{Number(v).toLocaleString('en-US')}</span> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'email', label: 'E-posta', render: (v: unknown) => v ? <span style={{ color: '#7c3aed', fontFamily: 'monospace', fontSize: '12px' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'status', label: 'Durum', render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
    { key: 'id', label: '', width: '80px', render: (_: unknown, row: Row) => (
      <div style={{ display: 'flex', gap: '4px' }}>
        <EditCuratorButton row={row} />
        <DeleteButton table="curators" id={row.id as string} />
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader
        title="Steam Küratörleri"
        subtitle={`${curators.length} küratör`}
        icon={Star}
        gradient="linear-gradient(135deg, #14b8a6, #0891b2)"
      >
        <CuratorModal />
      </PageHeader>
      <div style={{ padding: '24px 32px' }}>
        <div
          style={{
            backgroundColor: '#1a1a24',
            border: '1px solid #2a2a3a',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #2a2a3a',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#14b8a620',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Star size={16} color="#14b8a6" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Küratör Listesi</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Steam ve içerik küratörleri</div>
            </div>
            <div
              style={{
                marginLeft: 'auto',
                backgroundColor: '#14b8a620',
                color: '#14b8a6',
                border: '1px solid #14b8a640',
                borderRadius: '9999px',
                padding: '2px 12px',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {curators.length}
            </div>
          </div>
          <DataTable columns={curatorColumns} data={curators as Row[]} emptyMessage="Henüz küratör eklenmemiş" />
        </div>
      </div>
    </div>
  )
}
