export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import DataTable from '@/components/DataTable'
import Badge, { statusBadge } from '@/components/Badge'
import StatCard from '@/components/StatCard'
import BarChart from '@/components/BarChart'
import PageHeader from '@/components/PageHeader'
import { Share2, Users, Eye, TrendingUp } from 'lucide-react'
import { SocialAccountModal } from '@/components/SocialAccountModal'
import { DeleteButton } from '@/components/DeleteButton'

type Row = Record<string, unknown>

async function getData() {
  const [{ data: channels }, { data: posts }, { data: notes }, { data: metrics }] = await Promise.all([
    supabase.from('youtube_channels').select('*').order('subscribers', { ascending: false }),
    supabase.from('social_posts').select('*').ilike('platform', '%youtube%').order('created_at', { ascending: false }),
    supabase.from('youtube_notes').select('*').order('created_at', { ascending: false }),
    supabase.from('marketing_data').select('*').ilike('platform', '%youtube%').order('date', { ascending: false }),
  ])
  return {
    channels: (channels ?? []) as Row[],
    posts: (posts ?? []) as Row[],
    notes: (notes ?? []) as Row[],
    metrics: (metrics ?? []) as Row[],
  }
}

function numCell(v: unknown) {
  return v ? <span style={{ color: '#4ade80', fontWeight: 600 }}>{Number(v).toLocaleString('en-US')}</span> : <span style={{ color: '#64748b' }}>—</span>
}
function strCell(v: unknown) {
  return v ? <span style={{ color: '#cbd5e1' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span>
}
function dateCell(v: unknown) {
  return v ? <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(v as string).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span style={{ color: '#64748b' }}>—</span>
}

export default async function YouTubeSocialPage() {
  const { channels, posts, notes, metrics } = await getData()
  const totalSubs = channels.reduce((s, r) => s + (Number(r.subscribers) || 0), 0)
  const totalViews = channels.reduce((s, r) => s + (Number(r.avg_views) || 0), 0)
  const chartData = channels.slice(0, 10).map((r) => ({ label: String(r.channel_name ?? '—'), value: Number(r.subscribers) || 0 }))

  const channelCols = [
    { key: 'channel_name',  label: 'Kanal',       render: (v: unknown) => <span style={{ fontWeight: 600, color: '#f87171' }}>{String(v ?? '—')}</span> },
    { key: 'subscribers',   label: 'Abone',       render: numCell },
    { key: 'avg_views',     label: 'Ort. İzlenme', render: numCell },
    { key: 'language',      label: 'Dil',         render: (v: unknown) => v ? <Badge variant="blue">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'genre',         label: 'İçerik',      render: (v: unknown) => v ? <Badge variant="orange">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'contact_email', label: 'E-posta',     render: (v: unknown) => v ? <span style={{ color: '#7c3aed', fontFamily: 'monospace', fontSize: '12px' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'status',        label: 'Durum',       render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
    { key: 'id', label: '', width: '52px', render: (_: unknown, row: Row) => <DeleteButton table="youtube_channels" id={row.id as string} /> },
  ]

  const postCols = [
    { key: 'content',   label: 'İçerik',    render: (v: unknown) => <span style={{ fontSize: '13px', color: '#cbd5e1', maxWidth: '320px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(v ?? '—')}</span> },
    { key: 'status',    label: 'Durum',     render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
    { key: 'posted_at', label: 'Yayın',     render: dateCell },
    { key: 'likes',     label: 'Beğeni',    render: numCell },
    { key: 'shares',    label: 'Paylaşım',  render: numCell },
    { key: 'comments',  label: 'Yorum',     render: numCell },
    { key: 'campaign',  label: 'Kampanya',  render: (v: unknown) => v ? <Badge variant="red">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
  ]

  const notesCols = [
    { key: 'channel_name', label: 'Kanal', render: (v: unknown) => <span style={{ fontWeight: 600, color: '#f87171' }}>{String(v ?? '—')}</span> },
    { key: 'note',         label: 'Not',   render: strCell },
    { key: 'created_at',   label: 'Tarih', render: dateCell },
  ]

  const metricCols = [
    { key: 'metric_name',  label: 'Metrik',   render: (v: unknown) => <span style={{ fontWeight: 500, color: '#e2e8f0' }}>{String(v ?? '—')}</span> },
    { key: 'metric_value', label: 'Değer',    render: numCell },
    { key: 'date',         label: 'Tarih',    render: dateCell },
    { key: 'campaign',     label: 'Kampanya', render: (v: unknown) => v ? <Badge variant="red">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
  ]

  return (
    <div>
      <PageHeader title="YouTube" subtitle="YouTube kanalları ve pazarlama verileri" imageSrc="/icons/youtube.png" gradient="linear-gradient(135deg, #ff4444, #cc0000)">
        <SocialAccountModal table="youtube_channels" color="#ff4444" usernameField="channel_name" followersField="subscribers" followingField="following" postsField="video_count" />
      </PageHeader>
      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <StatCard label="Toplam Kanal"    value={channels.length}                        icon={Share2}    iconColor="#f87171" iconBg="rgba(239,68,68,0.12)" />
          <StatCard label="Toplam Abone"    value={totalSubs.toLocaleString('en-US')}      icon={Users}     iconColor="#4ade80" iconBg="rgba(34,197,94,0.12)" />
          <StatCard label="Ort. İzlenme"    value={totalViews.toLocaleString('en-US')}     icon={Eye}       iconColor="#60a5fa" iconBg="rgba(59,130,246,0.12)" />
          <StatCard label="Paylaşım"        value={posts.length}                           icon={TrendingUp} iconColor="#a78bfa" iconBg="rgba(124,58,237,0.12)" />
        </div>

        {chartData.length > 0 && (
          <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '16px' }}>Aboneye Göre Top Kanallar</div>
            <BarChart data={chartData} color="#ff4444" height={140} maxBars={10} />
          </div>
        )}

        <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff4444' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Kanallar</span>
            <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>{channels.length}</span>
          </div>
          <DataTable columns={channelCols} data={channels} emptyMessage="Kanal bulunamadı" />
        </div>

        {posts.length > 0 && (
          <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a78bfa' }} />
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Paylaşımlar</span>
              <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>{posts.length}</span>
            </div>
            <DataTable columns={postCols} data={posts} emptyMessage="Paylaşım bulunamadı" />
          </div>
        )}

        {notes.length > 0 && (
          <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Notlar</span>
              <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>{notes.length}</span>
            </div>
            <DataTable columns={notesCols} data={notes} emptyMessage="Not bulunamadı" />
          </div>
        )}

        {metrics.length > 0 && (
          <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#14b8a6' }} />
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Pazarlama Metrikleri</span>
              <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(20,184,166,0.12)', color: '#2dd4bf', border: '1px solid rgba(20,184,166,0.3)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>{metrics.length}</span>
            </div>
            <DataTable columns={metricCols} data={metrics} emptyMessage="Metrik bulunamadı" />
          </div>
        )}
      </div>
    </div>
  )
}
