export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import Badge, { statusBadge } from '@/components/Badge'
import { MessageCircle } from 'lucide-react'

async function getData() {
  const [{ data: accounts }, { data: posts }, { data: stats }, { data: shared }] = await Promise.all([
    supabase.from('reddit_accounts').select('*').order('karma', { ascending: false }),
    supabase.from('reddit_posts').select('*').order('posted_at', { ascending: false }),
    supabase.from('reddit_account_stats').select('*').order('date', { ascending: false }).limit(100),
    supabase.from('reddit_shared_posts').select('*').order('created_at', { ascending: false }),
  ])
  return { accounts: accounts ?? [], posts: posts ?? [], stats: stats ?? [], shared: shared ?? [] }
}

type Row = Record<string, unknown>

function numCell(v: unknown) {
  if (v === null || v === undefined) return <span style={{ color: '#64748b' }}>—</span>
  return <span style={{ color: '#4ade80', fontWeight: 600 }}>{Number(v).toLocaleString('tr-TR')}</span>
}

function dateCell(v: unknown) {
  if (!v) return <span style={{ color: '#64748b' }}>—</span>
  return <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(v as string).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
}

export default async function RedditPage() {
  const { accounts, posts, stats, shared } = await getData()

  const totalKarma = accounts.reduce((sum, a) => sum + (Number((a as Row).karma) || 0), 0)
  const totalPosts = posts.length
  const totalUpvotes = posts.reduce((sum, p) => sum + (Number((p as Row).upvotes) || 0), 0)

  const accountCols = [
    { key: 'username', label: 'Kullanıcı Adı', render: (v: unknown) => <span style={{ fontWeight: 600, color: '#ff4500' }}>u/{String(v ?? '')}</span> },
    { key: 'karma', label: 'Karma', render: numCell },
    { key: 'subreddits', label: 'Subredditler', render: (v: unknown) => {
      if (!v) return <span style={{ color: '#64748b' }}>—</span>
      const subs = String(v).split(',').map(s => s.trim()).filter(Boolean)
      return (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {subs.slice(0, 4).map((s, i) => <Badge key={i} variant="orange">r/{s}</Badge>)}
          {subs.length > 4 && <Badge variant="gray">+{subs.length - 4}</Badge>}
        </div>
      )
    }},
    { key: 'status', label: 'Durum', render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
    { key: 'created', label: 'Oluşturulma', render: dateCell },
  ]

  const postCols = [
    { key: 'title', label: 'Başlık', render: (v: unknown) => (
      <span style={{ fontWeight: 500, color: '#e2e8f0', maxWidth: '280px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px' }}>
        {String(v ?? '—')}
      </span>
    )},
    { key: 'subreddit', label: 'Subreddit', render: (v: unknown) => v ? <Badge variant="orange">r/{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'upvotes', label: '↑ Upvote', render: numCell },
    { key: 'comments', label: '💬 Yorum', render: numCell },
    { key: 'status', label: 'Durum', render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
    { key: 'posted_at', label: 'Tarih', render: dateCell },
    { key: 'url', label: 'URL', render: (v: unknown) => v ? (
      <span style={{ fontSize: '11px', color: '#ff4500', fontFamily: 'monospace', maxWidth: '180px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {String(v)}
      </span>
    ) : <span style={{ color: '#64748b' }}>—</span> },
  ]

  const statsCols = [
    { key: 'account_id', label: 'Hesap', render: (v: unknown) => <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#94a3b8' }}>{String(v ?? '—')}</span> },
    { key: 'karma', label: 'Karma', render: numCell },
    { key: 'post_karma', label: 'Post Karma', render: numCell },
    { key: 'comment_karma', label: 'Yorum Karma', render: numCell },
    { key: 'followers', label: 'Takipçi', render: numCell },
    { key: 'date', label: 'Tarih', render: dateCell },
  ]

  const sharedCols = [
    { key: 'post_id', label: 'Post', render: (v: unknown) => v ? <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#94a3b8' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'platform', label: 'Platform', render: (v: unknown) => v ? <Badge variant="blue">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'engagement', label: 'Etkileşim', render: numCell },
    { key: 'shared_at', label: 'Paylaşım Tarihi', render: dateCell },
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
        title="Reddit"
        subtitle="Hesaplar, gönderiler ve istatistikler"
        icon={MessageCircle}
        gradient="linear-gradient(135deg, #ff4500, #ff6534)"
      />
      <div style={{ padding: '24px 32px' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Toplam Hesap', value: accounts.length, color: '#ff4500' },
            { label: 'Toplam Karma', value: totalKarma.toLocaleString('tr-TR'), color: '#ff6534' },
            { label: 'Toplam Gönderi', value: totalPosts, color: '#f59e0b' },
          ].map((s) => (
            <div key={s.label} style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {totalUpvotes > 0 && (
          <div style={{ backgroundColor: 'rgba(255,69,0,0.08)', border: '1px solid rgba(255,69,0,0.2)', borderRadius: '10px', padding: '14px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⬆️</span>
            <span style={{ fontSize: '14px', color: '#cbd5e1' }}>
              Tüm gönderilerin toplam upvote sayısı: <strong style={{ color: '#ff4500' }}>{totalUpvotes.toLocaleString('tr-TR')}</strong>
            </span>
          </div>
        )}

        <Section title="Reddit Hesapları" color="#ff4500" count={accounts.length}>
          <DataTable columns={accountCols} data={accounts as Row[]} emptyMessage="Reddit hesabı bulunamadı" />
        </Section>
        <Section title="Gönderiler" color="#f59e0b" count={posts.length}>
          <DataTable columns={postCols} data={posts as Row[]} emptyMessage="Gönderi bulunamadı" />
        </Section>
        <Section title="Hesap İstatistikleri" color="#14b8a6" count={stats.length}>
          <DataTable columns={statsCols} data={stats as Row[]} emptyMessage="İstatistik bulunamadı" />
        </Section>
        <Section title="Paylaşılan Gönderiler" color="#7c3aed" count={shared.length}>
          <DataTable columns={sharedCols} data={shared as Row[]} emptyMessage="Paylaşılan gönderi bulunamadı" />
        </Section>
      </div>
    </div>
  )
}
