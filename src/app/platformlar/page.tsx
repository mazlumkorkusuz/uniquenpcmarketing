export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import Badge, { statusBadge } from '@/components/Badge'
import { Globe } from 'lucide-react'
import { PlatformModal } from '@/components/PlatformModal'

async function getData() {
  const { data: platforms } = await supabase
    .from('crm_platforms')
    .select('*')
    .order('created_at', { ascending: false })
  return { platforms: platforms ?? [] }
}

type Row = Record<string, unknown>

export default async function PlatformlarPage() {
  const { platforms } = await getData()

  const platformColumns = [
    { key: 'name', label: 'Platform Adı', width: '200px' },
    { key: 'type', label: 'Tür', render: (v: unknown) => v ? <Badge variant="blue">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'contact_name', label: 'İletişim', render: (v: unknown) => v ? <span style={{ color: '#e2e8f0' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'contact_email', label: 'E-posta', render: (v: unknown) => v ? <span style={{ color: '#7c3aed', fontFamily: 'monospace', fontSize: '12px' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'website', label: 'Website', render: (v: unknown) => v ? <span style={{ color: '#3b82f6', fontSize: '12px' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'status', label: 'Durum', render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
  ]

  return (
    <div>
      <PageHeader
        title="Platformlar & Partnerler"
        subtitle="CRM platformları ve iş ortakları"
        icon={Globe}
        gradient="linear-gradient(135deg, #7c3aed, #3b82f6)"
      />
      <div style={{ padding: '24px 32px' }}>
        <div
          style={{
            backgroundColor: '#1a1a24',
            border: '1px solid #2a2a3a',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '24px',
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
                backgroundColor: '#3b82f620',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Globe size={16} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>CRM Platformları</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>İş ortağı platformlar</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  backgroundColor: '#3b82f620',
                  color: '#3b82f6',
                  border: '1px solid #3b82f640',
                  borderRadius: '9999px',
                  padding: '2px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                {platforms.length}
              </div>
              <PlatformModal />
            </div>
          </div>
          <DataTable columns={platformColumns} data={platforms as Row[]} emptyMessage="Henüz platform eklenmemiş" />
        </div>
      </div>
    </div>
  )
}
