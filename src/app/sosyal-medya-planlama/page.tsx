export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import BarChart from '@/components/BarChart'
import { CalendarCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'

type Row = Record<string, unknown>

const PLATFORMS = [
  { key: 'tiktok',    label: 'TikTok',    color: '#fe2c55', href: '/sosyal-medya-planlama/tiktok' },
  { key: 'instagram', label: 'Instagram', color: '#e1306c', href: '/sosyal-medya-planlama/instagram' },
  { key: 'twitter',   label: 'Twitter',   color: '#1d9bf0', href: '/sosyal-medya-planlama/twitter' },
  { key: 'linkedin',  label: 'LinkedIn',  color: '#0a66c2', href: '/sosyal-medya-planlama/linkedin' },
  { key: 'youtube',   label: 'YouTube',   color: '#ff4444', href: '/sosyal-medya-planlama/youtube' },
  { key: 'reddit',    label: 'Reddit',    color: '#ff4500', href: '/sosyal-medya-planlama/reddit' },
  { key: 'ig',        label: 'IG',        color: '#c13584', href: '/sosyal-medya-planlama/ig' },
]

async function getData() {
  const { data } = await supabase
    .from('social_media_plans')
    .select('platform, status')
  return (data ?? []) as Row[]
}

export default async function SosyalMedyaPlanlama() {
  const rows = await getData()

  const counts: Record<string, number> = {}
  const scheduled: Record<string, number> = {}
  for (const p of PLATFORMS) {
    counts[p.key] = 0
    scheduled[p.key] = 0
  }
  for (const r of rows) {
    const pl = String(r.platform ?? '').toLowerCase()
    if (pl in counts) {
      counts[pl]++
      const st = String(r.status ?? '').toLowerCase()
      if (st === 'scheduled' || st === 'planlandı') scheduled[pl]++
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const platformBar = PLATFORMS.map((p) => ({ label: p.label, value: counts[p.key] }))

  return (
    <div>
      <PageHeader
        title="Sosyal Medya Planlaması"
        subtitle={`${total} gönderi · 7 platform`}
        icon={CalendarCheck}
        gradient="linear-gradient(135deg, #7c3aed, #ec4899)"
      />
      <div style={{ padding: '24px 32px' }}>

        {/* Platform comparison */}
        <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '4px' }}>Platform Karşılaştırması</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>Platforma göre toplam planlanan gönderi sayısı</div>
          <BarChart data={platformBar} color="#7c3aed" height={100} />
        </div>

        {/* Platform cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {PLATFORMS.map((platform) => {
            const count = counts[platform.key]
            const sched = scheduled[platform.key]
            return (
              <div
                key={platform.key}
                style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a2a3a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: platform.color, boxShadow: `0 0 8px ${platform.color}60` }} />
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>{platform.label}</span>
                    </div>
                    <span style={{ fontSize: '26px', fontWeight: 800, color: count > 0 ? platform.color : '#475569' }}>{count}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    {count > 0 ? 'toplam gönderi' : 'henüz gönderi yok'}
                  </div>
                </div>

                <div style={{ padding: '14px 20px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#60a5fa' }}>{sched}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Planlandı</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#4ade80' }}>{count - sched}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Diğer</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: platform.color }}>{count}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Toplam</div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '12px 20px', borderTop: '1px solid #2a2a3a' }}>
                  <Link
                    href={platform.href}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: platform.color, textDecoration: 'none' }}
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
