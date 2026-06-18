import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import StatCard from '@/components/StatCard'
import { ContentCalendar } from '@/components/ContentCalendar'
import type { CalPost } from '@/components/ContentCalendar'
import { PostModal } from '@/components/PostModal'
import { DeleteButton } from '@/components/DeleteButton'
import { Calendar, CheckCircle, Clock, FileText } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

type Row = Record<string, unknown>

interface PlatformPageProps {
  platform: string
  label: string
  color: string
  gradient: string
  icon?: LucideIcon
  imageSrc?: string
}

function dateCell(v: unknown) {
  if (!v) return <span style={{ color: '#64748b' }}>—</span>
  return <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(v as string).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
}

function statusBadge(status: string | null) {
  if (!status) return <span style={{ color: '#64748b' }}>—</span>
  const map: Record<string, [string, string]> = {
    'Taslak':     ['rgba(100,116,139,0.15)', '#94a3b8'],
    'Planlandı':  ['rgba(59,130,246,0.15)',  '#60a5fa'],
    'Yayınlandı': ['rgba(34,197,94,0.15)',   '#4ade80'],
  }
  const [bg, text] = map[status] ?? ['rgba(100,116,139,0.15)', '#94a3b8']
  return <span style={{ fontSize: '12px', fontWeight: 600, color: text, backgroundColor: bg, borderRadius: '5px', padding: '2px 8px' }}>{status}</span>
}

export async function PlatformPage({ platform, label, color, gradient, icon, imageSrc }: PlatformPageProps) {
  const { data } = await supabase
    .from('social_media_posts')
    .select('*')
    .eq('platform', platform)
    .order('scheduled_date', { ascending: true })

  const rows = (data ?? []) as Row[]
  const calPosts: CalPost[] = rows.map(r => ({
    id: String(r.id ?? ''),
    platform,
    title: r.title as string | null,
    scheduled_date: r.scheduled_date as string | null,
    status: r.status as string | null,
  }))

  const total = rows.length
  const planned = rows.filter(r => r.status === 'Planlandı').length
  const published = rows.filter(r => r.status === 'Yayınlandı').length
  const drafts = rows.filter(r => r.status === 'Taslak').length

  const cols = [
    {
      key: 'title',
      label: 'Başlık',
      render: (v: unknown) => v
        ? <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{String(v)}</span>
        : <span style={{ color: '#64748b', fontStyle: 'italic' }}>Başlıksız</span>,
    },
    {
      key: 'content',
      label: 'İçerik',
      render: (v: unknown) => v
        ? <span style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '300px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(v)}</span>
        : <span style={{ color: '#64748b' }}>—</span>,
    },
    { key: 'scheduled_date', label: 'Tarih', render: dateCell },
    {
      key: 'scheduled_time',
      label: 'Saat',
      render: (v: unknown) => v
        ? <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{String(v).slice(0, 5)}</span>
        : <span style={{ color: '#64748b' }}>—</span>,
    },
    { key: 'status', label: 'Durum', render: (v: unknown) => statusBadge(v as string | null) },
    { key: 'id', label: '', width: '52px', render: (_: unknown, row: Row) => <DeleteButton table="social_media_posts" id={row.id as string} /> },
  ]

  return (
    <div>
      <PageHeader title={label} subtitle={`${label} içerik planlaması`} icon={icon} imageSrc={imageSrc} gradient={gradient}>
        <PostModal platform={platform} platformColor={color} />
      </PageHeader>

      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <StatCard label="Toplam Gönderi" value={total}     icon={FileText}    iconColor={color}    iconBg={color + '20'} />
          <StatCard label="Planlandı"      value={planned}   icon={Calendar}    iconColor="#60a5fa"  iconBg="rgba(59,130,246,0.12)" />
          <StatCard label="Yayınlandı"     value={published} icon={CheckCircle} iconColor="#4ade80"  iconBg="rgba(34,197,94,0.12)" />
          <StatCard label="Taslak"         value={drafts}    icon={Clock}       iconColor="#94a3b8"  iconBg="rgba(100,116,139,0.12)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', marginBottom: '28px', alignItems: 'start' }}>
          <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Gönderiler</span>
              <span style={{ marginLeft: 'auto', backgroundColor: color + '20', color, border: `1px solid ${color}44`, borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>{total}</span>
            </div>
            <DataTable columns={cols} data={rows} emptyMessage="Henüz gönderi eklenmedi" />
          </div>

          <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Takvim
            </div>
            <ContentCalendar posts={calPosts} singleColor={color} compact={true} />
          </div>
        </div>
      </div>
    </div>
  )
}
