export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import { MessageCircle } from 'lucide-react'
import { RedditAccountModal } from '@/components/RedditAccountModal'
import { RedditAccountCard } from '@/components/RedditAccountCard'
import { RedditPostsSection } from '@/components/RedditPostsSection'
import { inkOf } from '@/lib/theme'

async function getData() {
  const [{ data: accounts }, { data: posts }] = await Promise.all([
    supabase.from('reddit_accounts').select('*').order('karma', { ascending: false }),
    supabase.from('reddit_posts').select('*').order('posted_at', { ascending: false }),
  ])
  return { accounts: accounts ?? [], posts: posts ?? [] }
}

type Row = Record<string, unknown>

export default async function RedditPage() {
  const { accounts, posts } = await getData()

  const totalKarma = accounts.reduce((sum, a) => sum + (Number((a as Row).karma) || 0), 0)
  const totalComments = accounts.reduce((sum, a) => sum + (Number((a as Row).comment_karma) || 0), 0)

  const stats = [
    { label: 'Toplam Hesap', value: accounts.length, color: '#ff4500' },
    { label: 'Toplam Karma', value: totalKarma.toLocaleString('tr-TR'), color: 'var(--orange)' },
    { label: 'Toplam Yorum', value: totalComments.toLocaleString('tr-TR'), color: 'var(--success)' },
    { label: 'Toplam Post', value: posts.length, color: 'var(--info)' },
  ]

  return (
    <div>
      <PageHeader
        title="Reddit"
        subtitle="Hesaplar ve gönderiler"
        imageSrc="/icons/reddit.svg"
        gradient="linear-gradient(135deg, #ff4500, #ff6534)"
      >
        <RedditAccountModal />
      </PageHeader>

      <div style={{ padding: '24px 32px' }}>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {stats.map(s => (
            <div key={s.label} style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '30px', fontWeight: 800, color: inkOf(s.color), lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '8px', }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Accounts section */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff4500', boxShadow: '0 0 6px rgba(255,69,0,0.6)' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>Reddit Hesapları</span>
            <span style={{ backgroundColor: 'rgba(255,69,0,0.12)', color: 'var(--orange)', border: '1px solid rgba(255,69,0,0.3)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>
              {accounts.length}
            </span>
          </div>

          {accounts.length === 0 ? (
            <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', padding: '48px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '14px' }}>
              Henüz hesap eklenmemiş
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {(accounts as Row[]).map(account => (
                <RedditAccountCard key={String(account.id)} account={account} />
              ))}
            </div>
          )}
        </div>

        {/* Posts section */}
        <RedditPostsSection posts={posts as Row[]} accounts={accounts as Row[]} />

      </div>
    </div>
  )
}
