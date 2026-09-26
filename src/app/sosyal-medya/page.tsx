export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import BarChart from '@/components/BarChart'
import { Share2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { inkOf } from '@/lib/theme'

type Row = Record<string, unknown>

const PLATFORMS = [
  { key: 'twitter',   label: 'Twitter',   color: '#1d9bf0', href: '/sosyal-medya/twitter',   followersLabel: 'Takipçi' },
  { key: 'instagram', label: 'Instagram', color: '#e1306c', href: '/sosyal-medya/instagram', followersLabel: 'Takipçi' },
  { key: 'tiktok',    label: 'TikTok',    color: '#fe2c55', href: '/sosyal-medya/tiktok',    followersLabel: 'Takipçi' },
  { key: 'youtube',   label: 'YouTube',   color: '#FF0000', href: '/sosyal-medya/youtube',   followersLabel: 'Abone' },
]

async function getData() {
  const [{ data: posts }, { data: twitterAccounts }, { data: ytChannels }] = await Promise.all([
    supabase.from('social_posts').select('platform'),
    supabase.from('twitter_accounts').select('followers'),
    supabase.from('youtube_channels').select('subscribers'),
  ])
  return {
    posts: (posts ?? []) as Row[],
    twitterAccounts: (twitterAccounts ?? []) as Row[],
    ytChannels: (ytChannels ?? []) as Row[],
  }
}

function fmtNum(n: number) {
  if (n === 0) return '—'
  return n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(0) + 'k' : String(n)
}

export default async function SosyalMedyaPage() {
  const { posts, twitterAccounts, ytChannels } = await getData()

  const postCounts: Record<string, number> = { twitter: 0, instagram: 0, tiktok: 0, youtube: 0 }
  for (const p of posts) {
    const pl = String(p.platform ?? '').toLowerCase()
    if (pl.includes('twitter') || pl.includes('/x')) postCounts.twitter++
    else if (pl.includes('instagram')) postCounts.instagram++
    else if (pl.includes('tiktok')) postCounts.tiktok++
    else if (pl.includes('youtube')) postCounts.youtube++
  }

  const followerCounts: Record<string, number> = {
    twitter:   twitterAccounts.reduce((s, r) => s + (Number(r.followers) || 0), 0),
    instagram: 0,
    tiktok:    0,
    youtube:   ytChannels.reduce((s, r) => s + (Number(r.subscribers) || 0), 0),
  }

  const platformBar = PLATFORMS.map((p) => ({ label: p.label, value: postCounts[p.key] }))
  const totalPosts = Object.values(postCounts).reduce((a, b) => a + b, 0)

  return (
    <div>
      <PageHeader
        title="Sosyal Medya"
        subtitle={`${totalPosts} gönderi · 4 platform`}
        icon={Share2}
        gradient="linear-gradient(135deg, #7C3AED, #6D28D9)"
      />
      <div style={{ padding: '24px 32px' }}>

        {/* Platform comparison chart */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#17122B', marginBottom: '4px' }}>Platform Karşılaştırması</div>
          <div style={{ fontSize: '12px', color: '#655F7D', marginBottom: '16px' }}>Platforma göre toplam gönderi sayısı</div>
          <BarChart data={platformBar} color="#BE123C" height={100} />
        </div>

        {/* Platform cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {PLATFORMS.map((platform) => {
            const pCount = postCounts[platform.key]
            const fCount = followerCounts[platform.key]
            return (
              <div
                key={platform.key}
                style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ padding: '20px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: platform.color, boxShadow: 'none' }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', letterSpacing: '-0.01em', fontWeight: 600, color: '#17122B' }}>{platform.label}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#655F7D', marginBottom: '6px' }}>Gönderi</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', fontWeight: 600, color: pCount > 0 ? inkOf(platform.color) : '#655F7D' }}>{pCount}</div>
                    </div>
                    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#655F7D', marginBottom: '6px' }}>{platform.followersLabel}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', fontWeight: 600, color: fCount > 0 ? '#047857' : '#655F7D' }}>{fmtNum(fCount)}</div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '12px 20px', borderTop: '1px solid #E8E4F1' }}>
                  <Link
                    href={platform.href}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 500, color: inkOf(platform.color), textDecoration: 'none' }}
                  >
                    Detayları Görüntüle
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
