export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import Badge, { statusBadge } from '@/components/Badge'
import { Share2 } from 'lucide-react'

async function getData() {
  const [{ data: posts }, { data: twitterAccounts }, { data: marketingData }] = await Promise.all([
    supabase.from('social_posts').select('*').order('created_at', { ascending: false }),
    supabase.from('twitter_accounts').select('*').order('followers', { ascending: false }),
    supabase.from('marketing_data').select('*').order('date', { ascending: false }).limit(100),
  ])
  return { posts: posts ?? [], twitterAccounts: twitterAccounts ?? [], marketingData: marketingData ?? [] }
}

type Row = Record<string, unknown>

function numCell(v: unknown) {
  return v ? <span style={{ color: '#4ade80', fontWeight: 600 }}>{Number(v).toLocaleString('tr-TR')}</span> : <span style={{ color: '#64748b' }}>—</span>
}

function platformBadge(v: unknown) {
  if (!v) return <span style={{ color: '#64748b' }}>—</span>
  const p = String(v).toLowerCase()
  const variant =
    p.includes('twitter') || p.includes('x') ? 'blue'
    : p.includes('instagram') ? 'orange'
    : p.includes('facebook') ? 'blue'
    : p.includes('tiktok') ? 'red'
    : p.includes('youtube') ? 'red'
    : 'gray'
  return <Badge variant={variant as 'blue' | 'orange' | 'red' | 'gray'}>{String(v)}</Badge>
}

function dateCell(v: unknown) {
  if (!v) return <span style={{ color: '#64748b' }}>—</span>
  return <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(v as string).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
}

export default async function SosyalMedyaPage() {
  const { posts, twitterAccounts, marketingData } = await getData()

  const postsByPlatform: Record<string, number> = {}
  for (const p of posts) {
    const platform = String((p as Row).platform ?? 'Diğer')
    postsByPlatform[platform] = (postsByPlatform[platform] ?? 0) + 1
  }

  const postCols = [
    { key: 'platform', label: 'Platform', render: platformBadge },
    { key: 'content', label: 'İçerik', render: (v: unknown) => (
      <span style={{ fontSize: '13px', color: '#cbd5e1', maxWidth: '320px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {String(v ?? '—')}
      </span>
    )},
    { key: 'status', label: 'Durum', render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
    { key: 'scheduled_at', label: 'Planlanan', render: dateCell },
    { key: 'posted_at', label: 'Yayınlandı', render: dateCell },
    { key: 'likes', label: '❤️', render: numCell },
    { key: 'shares', label: '🔄', render: numCell },
    { key: 'comments', label: '💬', render: numCell },
    { key: 'campaign', label: 'Kampanya', render: (v: unknown) => v ? <Badge variant="purple">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
  ]

  const twitterCols = [
    { key: 'username', label: 'Kullanıcı Adı', render: (v: unknown) => <span style={{ fontWeight: 600, color: '#1d9bf0' }}>@{String(v ?? '')}</span> },
    { key: 'display_name', label: 'Görünen Ad', render: (v: unknown) => v ? String(v) : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'followers', label: 'Takipçi', render: numCell },
    { key: 'following', label: 'Takip', render: numCell },
    { key: 'tweets', label: 'Tweet', render: numCell },
    { key: 'status', label: 'Durum', render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
  ]

  const marketingCols = [
    { key: 'platform', label: 'Platform', render: platformBadge },
    { key: 'metric_name', label: 'Metrik', render: (v: unknown) => <span style={{ fontWeight: 500, color: '#e2e8f0' }}>{String(v ?? '—')}</span> },
    { key: 'metric_value', label: 'Değer', render: numCell },
    { key: 'date', label: 'Tarih', render: dateCell },
    { key: 'campaign', label: 'Kampanya', render: (v: unknown) => v ? <Badge variant="purple">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
  ]

  const Section = ({ title, color, count, children }: { title: string; color: string; count: number; children: React.ReactNode }) => (
    <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>{title}</span>
        <span style={{ marginLeft: 'auto', backgroundColor: color + '20', color, border: `1px solid ${color}40`, borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>
          {count}
        </span>
      </div>
      {children}
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Sosyal Medya"
        subtitle="Paylaşımlar, Twitter hesapları ve pazarlama verileri"
        icon={Share2}
        gradient="linear-gradient(135deg, #f59e0b, #ec4899)"
      />
      <div style={{ padding: '24px 32px' }}>

        {/* Platform breakdown */}
        {Object.keys(postsByPlatform).length > 0 && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
            {Object.entries(postsByPlatform).map(([platform, count]) => (
              <div
                key={platform}
                style={{
                  backgroundColor: '#1a1a24',
                  border: '1px solid #2a2a3a',
                  borderRadius: '10px',
                  padding: '14px 20px',
                  textAlign: 'center',
                  minWidth: '120px',
                }}
              >
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#f1f5f9' }}>{count}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{platform}</div>
              </div>
            ))}
          </div>
        )}

        <Section title="Sosyal Medya Paylaşımları" color="#ec4899" count={posts.length}>
          <DataTable columns={postCols} data={posts as Row[]} emptyMessage="Paylaşım bulunamadı" />
        </Section>
        <Section title="Twitter / X Hesapları" color="#1d9bf0" count={twitterAccounts.length}>
          <DataTable columns={twitterCols} data={twitterAccounts as Row[]} emptyMessage="Twitter hesabı bulunamadı" />
        </Section>
        <Section title="Pazarlama Verileri" color="#7c3aed" count={marketingData.length}>
          <DataTable columns={marketingCols} data={marketingData as Row[]} emptyMessage="Pazarlama verisi bulunamadı" />
        </Section>
      </div>
    </div>
  )
}
