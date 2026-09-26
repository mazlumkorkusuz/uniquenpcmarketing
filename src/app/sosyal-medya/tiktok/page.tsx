export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import DataTable from '@/components/DataTable'
import Badge, { statusBadge } from '@/components/Badge'
import StatCard from '@/components/StatCard'
import BarChart from '@/components/BarChart'
import PageHeader from '@/components/PageHeader'
import { Share2, Heart, MessageCircle, TrendingUp } from 'lucide-react'
import { SocialAccountModal } from '@/components/SocialAccountModal'
import { DeleteButton } from '@/components/DeleteButton'

type Row = Record<string, unknown>

async function getData() {
  const [{ data: posts }, { data: metrics }] = await Promise.all([
    supabase.from('social_posts').select('*').ilike('platform', '%tiktok%').order('created_at', { ascending: false }),
    supabase.from('marketing_data').select('*').ilike('platform', '%tiktok%').order('date', { ascending: false }),
  ])
  return {
    posts: (posts ?? []) as Row[],
    metrics: (metrics ?? []) as Row[],
  }
}

function numCell(v: unknown) {
  return v ? <span style={{ color: 'var(--success)', fontWeight: 600 }}>{Number(v).toLocaleString('en-US')}</span> : <span style={{ color: 'var(--muted-foreground)' }}>—</span>
}
function dateCell(v: unknown) {
  return v ? <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{new Date(v as string).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span style={{ color: 'var(--muted-foreground)' }}>—</span>
}

export default async function TikTokPage() {
  const { posts, metrics } = await getData()
  const totalLikes = posts.reduce((s, r) => s + (Number(r.likes) || 0), 0)
  const totalShares = posts.reduce((s, r) => s + (Number(r.shares) || 0), 0)

  const campaignCounts: Record<string, number> = {}
  for (const p of posts) {
    const c = String(p.campaign ?? 'Diğer')
    campaignCounts[c] = (campaignCounts[c] ?? 0) + 1
  }
  const chartData = Object.entries(campaignCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }))

  const postCols = [
    { key: 'content',   label: 'İçerik',    render: (v: unknown) => <span style={{ fontSize: '13px', color: 'var(--text-2)', maxWidth: '320px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(v ?? '—')}</span> },
    { key: 'status',    label: 'Durum',     render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: 'var(--muted-foreground)' }}>—</span> },
    { key: 'posted_at', label: 'Yayın',     render: dateCell },
    { key: 'likes',     label: 'Beğeni',    render: numCell },
    { key: 'shares',    label: 'Paylaşım',  render: numCell },
    { key: 'comments',  label: 'Yorum',     render: numCell },
    { key: 'campaign',  label: 'Kampanya',  render: (v: unknown) => v ? <Badge variant="red">{String(v)}</Badge> : <span style={{ color: 'var(--muted-foreground)' }}>—</span> },
    { key: 'id', label: '', width: '52px', render: (_: unknown, row: Row) => <DeleteButton table="social_posts" id={row.id as string} /> },
  ]

  const metricCols = [
    { key: 'metric_name',  label: 'Metrik',   render: (v: unknown) => <span style={{ fontWeight: 500, color: 'var(--foreground)' }}>{String(v ?? '—')}</span> },
    { key: 'metric_value', label: 'Değer',    render: numCell },
    { key: 'date',         label: 'Tarih',    render: dateCell },
    { key: 'campaign',     label: 'Kampanya', render: (v: unknown) => v ? <Badge variant="red">{String(v)}</Badge> : <span style={{ color: 'var(--muted-foreground)' }}>—</span> },
  ]

  return (
    <div>
      <PageHeader title="TikTok" subtitle="TikTok paylaşımları ve metrikler" imageSrc="/icons/tiktok.png" gradient="linear-gradient(135deg, #fe2c55, #010101)">
        <SocialAccountModal table="tiktok_accounts" color="#fe2c55" />
      </PageHeader>
      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <StatCard label="Toplam Video"   value={posts.length}                         icon={Share2}        iconColor="#fe2c55" iconBg="rgba(254,44,85,0.12)" />
          <StatCard label="Toplam Beğeni"  value={totalLikes.toLocaleString('en-US')}   icon={Heart}         iconColor="#BE185D" iconBg="rgba(244,114,182,0.12)" />
          <StatCard label="Toplam Paylaşım" value={totalShares.toLocaleString('en-US')} icon={TrendingUp}    iconColor="var(--success)" iconBg="rgba(34,197,94,0.12)" />
          <StatCard label="Metrik Kaydı"   value={metrics.length}                       icon={MessageCircle} iconColor="var(--primary-ink)" iconBg="rgba(124,58,237,0.12)" />
        </div>

        {chartData.length > 0 && (
          <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '16px' }}>Kampanyaya Göre Video Dağılımı</div>
            <BarChart data={chartData} color="#fe2c55" height={120} maxBars={10} />
          </div>
        )}

        <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fe2c55' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>Videolar</span>
            <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(254,44,85,0.12)', color: 'var(--danger)', border: '1px solid rgba(254,44,85,0.3)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>{posts.length}</span>
          </div>
          <DataTable columns={postCols} data={posts} emptyMessage="TikTok videosu bulunamadı" />
        </div>

        {metrics.length > 0 && (
          <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--warning)' }} />
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>Pazarlama Metrikleri</span>
              <span style={{ marginLeft: 'auto', backgroundColor: 'color-mix(in srgb, var(--warning) 12%, transparent)', color: 'var(--orange)', border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>{metrics.length}</span>
            </div>
            <DataTable columns={metricCols} data={metrics} emptyMessage="Metrik bulunamadı" />
          </div>
        )}
      </div>
    </div>
  )
}
