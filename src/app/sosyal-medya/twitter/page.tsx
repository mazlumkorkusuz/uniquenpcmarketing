export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import DataTable from '@/components/DataTable'
import StatCard from '@/components/StatCard'
import PageHeader from '@/components/PageHeader'
import { Users, Star, TrendingUp, Zap } from 'lucide-react'
import { SocialAccountModal } from '@/components/SocialAccountModal'
import { TwitterAccountsTable } from './TwitterAccountsTable'

type Row = Record<string, unknown>

async function getData() {
  const [{ data: accounts }, { data: notes }] = await Promise.all([
    supabase.from('twitter_accounts').select('*').order('score', { ascending: false }),
    supabase.from('twitter_notes').select('*').order('created_at', { ascending: false }),
  ])
  return {
    accounts: (accounts ?? []) as Row[],
    notes: (notes ?? []) as Row[],
  }
}

function strCell(v: unknown) {
  return v ? <span style={{ color: '#cbd5e1' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span>
}
function dateCell(v: unknown) {
  return v ? <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(v as string).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span style={{ color: '#64748b' }}>—</span>
}

export default async function TwitterPage() {
  const { accounts, notes } = await getData()

  const totalFollowers = accounts.reduce((s, r) => s + (Number(r.followers) || 0), 0)
  const avgScore = accounts.length
    ? Math.round(accounts.reduce((s, r) => s + (Number(r.score) || 0), 0) / accounts.length)
    : 0
  const highPriority = accounts.filter(r => String(r.priority ?? '') === 'high').length

  const notesCols = [
    { key: 'username', label: 'Hesap', render: (v: unknown) => v ? <span style={{ fontWeight: 600, color: '#1d9bf0' }}>@{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'note',     label: 'Not',   render: strCell },
    { key: 'created_at', label: 'Tarih', render: dateCell },
  ]

  return (
    <div>
      <PageHeader title="Twitter / X" subtitle="Twitter hesapları ve içerik analizi" imageSrc="/icons/x.png" gradient="linear-gradient(135deg, #1d9bf0, #0c6fa8)">
        <SocialAccountModal table="twitter_accounts" color="#1d9bf0" postsField="tweets" />
      </PageHeader>
      <div style={{ padding: '24px 32px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <StatCard label="Hesap Sayısı"     value={accounts.length}                        icon={Users}       iconColor="#1d9bf0" iconBg="rgba(29,155,240,0.12)" />
          <StatCard label="Toplam Takipçi"   value={totalFollowers.toLocaleString('en-US')} icon={TrendingUp}  iconColor="#4ade80" iconBg="rgba(34,197,94,0.12)" />
          <StatCard label="Ortalama Puan"    value={avgScore}                               icon={Star}        iconColor="#fbbf24" iconBg="rgba(234,179,8,0.12)" />
          <StatCard label="Yüksek Öncelik"   value={highPriority}                           icon={Zap}         iconColor="#f87171" iconBg="rgba(239,68,68,0.12)" />
        </div>

        {/* Accounts table with filters */}
        <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1d9bf0', boxShadow: '0 0 6px rgba(29,155,240,0.5)' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Twitter Hesapları</span>
            <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(29,155,240,0.12)', color: '#1d9bf0', border: '1px solid rgba(29,155,240,0.3)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>
              {accounts.length}
            </span>
          </div>
          <TwitterAccountsTable accounts={accounts} />
        </div>

        {/* Notes */}
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
