export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import { ContentCalendar } from '@/components/ContentCalendar'
import type { CalPost } from '@/components/ContentCalendar'
import { CalendarCheck } from 'lucide-react'

const PLATFORM_COLORS: Record<string, string> = {
  twitter:   '#1d9bf0',
  instagram: '#e1306c',
  tiktok:    '#fe2c55',
  linkedin:  '#0a66c2',
  youtube:   '#ff4444',
  reddit:    '#ff4500',
  ig:        '#c13584',
}

const PLATFORMS = [
  { key: 'twitter',   label: 'Twitter',   color: '#1d9bf0', icon: '/icons/x.png' },
  { key: 'instagram', label: 'Instagram', color: '#e1306c', icon: '/icons/instagram.png' },
  { key: 'tiktok',    label: 'TikTok',    color: '#fe2c55', icon: '/icons/tiktok.png' },
  { key: 'linkedin',  label: 'LinkedIn',  color: '#0a66c2', icon: '/icons/linkedin.png' },
  { key: 'youtube',   label: 'YouTube',   color: '#ff4444', icon: '/icons/youtube.png' },
  { key: 'reddit',    label: 'Reddit',    color: '#ff4500', icon: '/icons/reddit.svg' },
  { key: 'ig',        label: 'IG',        color: '#c13584', icon: '/icons/instagram.png' },
]

async function getData() {
  const { data } = await supabase
    .from('social_media_posts')
    .select('id, platform, title, scheduled_date, status')
    .order('scheduled_date', { ascending: true })
  return (data ?? []) as CalPost[]
}

export default async function IcerikPlanlamaPage() {
  const posts = await getData()

  const totalByPlatform: Record<string, number> = {}
  for (const p of posts) {
    const key = p.platform?.toLowerCase?.() ?? 'other'
    totalByPlatform[key] = (totalByPlatform[key] ?? 0) + 1
  }

  const upcoming = posts.filter(p => {
    if (!p.scheduled_date) return false
    return new Date(p.scheduled_date) >= new Date(new Date().toDateString())
  }).length

  return (
    <div>
      <PageHeader
        title="İçerik Planlaması"
        subtitle="Tüm platformlardaki planlanmış gönderiler"
        icon={CalendarCheck}
        gradient="linear-gradient(135deg, #7c3aed, #4f46e5)"
      />

      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', marginBottom: '28px' }}>
          {PLATFORMS.map(p => (
            <a key={p.key} href={`/icerik-planlama/${p.key}`} style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: '#1a1a24',
                border: `1px solid ${p.color}33`,
                borderRadius: '10px',
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <img src={p.icon} alt={p.label} style={{ width: '18px', height: '18px', objectFit: 'contain', borderRadius: '3px', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>{p.label}</span>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: p.color }}>
                  {totalByPlatform[p.key] ?? 0}
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>gönderi</div>
              </div>
            </a>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '24px', alignItems: 'start', marginBottom: '28px' }}>
          <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Takvim</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Tüm platformlar</span>
            </div>
            <ContentCalendar posts={posts} platformColors={PLATFORM_COLORS} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Toplam</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#f1f5f9' }}>{posts.length}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>planlı gönderi</div>
            </div>
            <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Yaklaşan</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#4ade80' }}>{upcoming}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>bu tarihten sonra</div>
            </div>

            <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Renk Kodu</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {PLATFORMS.map(p => (
                  <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={p.icon} alt={p.label} style={{ width: '14px', height: '14px', objectFit: 'contain', borderRadius: '2px', flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{p.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
