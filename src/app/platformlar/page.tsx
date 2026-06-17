export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import Badge, { statusBadge } from '@/components/Badge'
import { Globe, Building2, Music } from 'lucide-react'

async function getData() {
  const [
    { data: platforms },
    { data: publishers },
    { data: curators },
  ] = await Promise.all([
    supabase.from('crm_platforms').select('*').order('created_at', { ascending: false }),
    supabase.from('publishers').select('*').order('created_at', { ascending: false }),
    supabase.from('curators').select('*').order('created_at', { ascending: false }),
  ])
  return { platforms: platforms ?? [], publishers: publishers ?? [], curators: curators ?? [] }
}

type Row = Record<string, unknown>

export default async function PlatformlarPage() {
  const { platforms, publishers, curators } = await getData()

  const platformColumns = [
    { key: 'name', label: 'Platform Adı', width: '200px' },
    { key: 'type', label: 'Tür', render: (v: unknown) => v ? <Badge variant="blue">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'contact_name', label: 'İletişim', render: (v: unknown) => v ? <span style={{ color: '#e2e8f0' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'contact_email', label: 'E-posta', render: (v: unknown) => v ? <span style={{ color: '#7c3aed', fontFamily: 'monospace', fontSize: '12px' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'website', label: 'Website', render: (v: unknown) => v ? <span style={{ color: '#3b82f6', fontSize: '12px' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'status', label: 'Durum', render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
  ]

  const publisherColumns = [
    { key: 'name', label: 'Yayıncı Adı', width: '200px' },
    { key: 'genre', label: 'Tür', render: (v: unknown) => v ? <Badge variant="purple">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'region', label: 'Bölge', render: (v: unknown) => v ? <Badge variant="teal">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'contact_name', label: 'İletişim' },
    { key: 'contact_email', label: 'E-posta', render: (v: unknown) => v ? <span style={{ color: '#7c3aed', fontFamily: 'monospace', fontSize: '12px' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'deal_type', label: 'Anlaşma', render: (v: unknown) => v ? <Badge variant="orange">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'status', label: 'Durum', render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
  ]

  const curatorColumns = [
    { key: 'name', label: 'Küratör Adı', width: '200px' },
    { key: 'platform', label: 'Platform', render: (v: unknown) => v ? <Badge variant="blue">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'genre', label: 'Tür', render: (v: unknown) => v ? <Badge variant="purple">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'followers', label: 'Takipçi', render: (v: unknown) => v ? <span style={{ color: '#4ade80', fontWeight: 600 }}>{Number(v).toLocaleString('tr-TR')}</span> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'email', label: 'E-posta', render: (v: unknown) => v ? <span style={{ color: '#7c3aed', fontFamily: 'monospace', fontSize: '12px' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'status', label: 'Durum', render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
  ]

  const Section = ({
    title,
    subtitle,
    icon: Icon,
    iconColor,
    count,
    children,
  }: {
    title: string
    subtitle: string
    icon: typeof Globe
    iconColor: string
    count: number
    children: React.ReactNode
  }) => (
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
            backgroundColor: iconColor + '20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={16} color={iconColor} />
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>{title}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>{subtitle}</div>
        </div>
        <div
          style={{
            marginLeft: 'auto',
            backgroundColor: iconColor + '20',
            color: iconColor,
            border: `1px solid ${iconColor}40`,
            borderRadius: '9999px',
            padding: '2px 12px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {count}
        </div>
      </div>
      {children}
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Platformlar & Partnerler"
        subtitle="CRM platformları, yayıncılar ve küratörler"
        icon={Globe}
        gradient="linear-gradient(135deg, #7c3aed, #3b82f6)"
      />
      <div style={{ padding: '24px 32px' }}>
        <Section title="CRM Platformları" subtitle="İş ortağı platformlar" icon={Globe} iconColor="#3b82f6" count={platforms.length}>
          <DataTable columns={platformColumns} data={platforms as Row[]} emptyMessage="Henüz platform eklenmemiş" />
        </Section>
        <Section title="Yayıncı Şirketler" subtitle="Oyun yayıncıları ve dağıtıcılar" icon={Building2} iconColor="#7c3aed" count={publishers.length}>
          <DataTable columns={publisherColumns} data={publishers as Row[]} emptyMessage="Henüz yayıncı eklenmemiş" />
        </Section>
        <Section title="Küratörler" subtitle="Müzik ve içerik küratörleri" icon={Music} iconColor="#14b8a6" count={curators.length}>
          <DataTable columns={curatorColumns} data={curators as Row[]} emptyMessage="Henüz küratör eklenmemiş" />
        </Section>
      </div>
    </div>
  )
}
