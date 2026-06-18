export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import DataTable from '@/components/DataTable'
import Badge, { statusBadge } from '@/components/Badge'
import StatCard from '@/components/StatCard'
import BarChart from '@/components/BarChart'
import PageHeader from '@/components/PageHeader'
import { Share2, Users, MessageCircle } from 'lucide-react'
import { SocialAccountModal } from '@/components/SocialAccountModal'
import { DeleteButton } from '@/components/DeleteButton'

type Row = Record<string, unknown>

async function getData() {
  const [{ data: accounts }, { data: posts }, { data: notes }] = await Promise.all([
    supabase.from('twitter_accounts').select('*').order('followers', { ascending: false }),
    supabase.from('social_posts').select('*').ilike('platform', '%twitter%').order('created_at', { ascending: false }),
    supabase.from('twitter_notes').select('*').order('created_at', { ascending: false }),
  ])
  return {
    accounts: (accounts ?? []) as Row[],
    posts: (posts ?? []) as Row[],
    notes: (notes ?? []) as Row[],
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

export default async function TwitterPage() {
  const { accounts, posts, notes } = await getData()
  const totalFollowers = accounts.reduce((s, r) => s + (Number(r.followers) || 0), 0)
  const totalPosts = posts.length
  const chartData = accounts.slice(0, 10).map((r) => ({ label: String(r.username ?? '—'), value: Number(r.followers) || 0 }))

  const accountCols = [
    { key: 'username',     label: 'Kullanıcı',   render: (v: unknown) => <span style={{ fontWeight: 600, color: '#1d9bf0' }}>@{String(v ?? '')}</span> },
    { key: 'display_name', label: 'Görünen Ad',  render: strCell },
    { key: 'followers',    label: 'Takipçi',     render: numCell },
    { key: 'following',    label: 'Takip',       render: numCell },
    { key: 'tweets',       label: 'Tweet',       render: numCell },
    { key: 'status',       label: 'Durum',       render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
    { key: 'id', label: '', width: '52px', render: (_: unknown, row: Row) => <DeleteButton table="twitter_accounts" id={row.id as string} /> },
  ]

  const postCols = [
    { key: 'content',      label: 'İçerik',    render: (v: unknown) => <span style={{ fontSize: '13px', color: '#cbd5e1', maxWidth: '320px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(v ?? '—')}</span> },
    { key: 'status',       label: 'Durum',     render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
    { key: 'posted_at',    label: 'Yayın',     render: dateCell },
    { key: 'likes',        label: 'Beğeni',    render: numCell },
    { key: 'shares',       label: 'RT',        render: numCell },
    { key: 'comments',     label: 'Yanıt',     render: numCell },
    { key: 'campaign',     label: 'Kampanya',  render: (v: unknown) => v ? <Badge variant="purple">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
  ]

  const notesCols = [
    { key: 'username', label: 'Hesap', render: (v: unknown) => v ? <span style={{ fontWeight: 600, color: '#1d9bf0' }}>@{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'note',     label: 'Not',   render: strCell },
    { key: 'created_at', label: 'Tarih', render: dateCell },
  ]

  return (
    <div>
      <PageHeader title="Twitter / X" subtitle="Twitter hesapları ve paylaşımları" icon={Share2} gradient="linear-gradient(135deg, #1d9bf0, #0c6fa8)">
        <SocialAccountModal table="twitter_accounts" color="#1d9bf0" postsField="tweets" />
      </PageHeader>
      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <StatCard label="Hesap Sayısı"     value={accounts.length}                          icon={Users}         iconColor="#1d9bf0" iconBg="rgba(29,155,240,0.12)" />
          <StatCard label="Toplam Takipçi"   value={totalFollowers.toLocaleString('en-US')}   icon={Users}         iconColor="#4ade80" iconBg="rgba(34,197,94,0.12)" />
          <StatCard label="Toplam Paylaşım"  value={totalPosts}                               icon={MessageCircle} iconColor="#a78bfa" iconBg="rgba(124,58,237,0.12)" />
        </div>

        {chartData.length > 0 && (
          <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '16px' }}>Takipçiye Göre Hesaplar</div>
            <BarChart data={chartData} color="#1d9bf0" height={140} maxBars={10} />
          </div>
        )}

        <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1d9bf0' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Twitter Hesapları</span>
            <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(29,155,240,0.12)', color: '#1d9bf0', border: '1px solid rgba(29,155,240,0.3)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>{accounts.length}</span>
          </div>
          <DataTable columns={accountCols} data={accounts} emptyMessage="Twitter hesabı bulunamadı" />
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
          <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Notlar</span>
              <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>{notes.length}</span>
            </div>
            <DataTable columns={notesCols} data={notes} emptyMessage="Not bulunamadı" />
          </div>
        )}
      </div>
    </div>
  )
}
