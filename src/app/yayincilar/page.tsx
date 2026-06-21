export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import BarChart from '@/components/BarChart'
import { Tv2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

type Row = Record<string, unknown>

const PLATFORMS = [
  { key: 'twitch',   label: 'Twitch',   color: '#9146ff', href: '/yayincilar/twitch' },
  { key: 'kick',     label: 'Kick',     color: '#53fc18', href: '/yayincilar/kick' },
  { key: 'soop',     label: 'SOOP',     color: '#3b82f6', href: '/yayincilar/soop' },
  { key: 'youtube',  label: 'YouTube',  color: '#ff4444', href: '/yayincilar/youtube' },
  { key: 'niconico', label: 'NicoNico', color: '#e8e8e8', href: '/yayincilar/niconico' },
  { key: 'chzzk',    label: 'Chzzk',    color: '#00ffa3', href: '/yayincilar/chzzk' },
  { key: 'bilibili', label: 'BiliBili', color: '#00a1d6', href: '/yayincilar/bilibili' },
  { key: 'douyin',   label: 'Douyin',   color: '#fe2c55', href: '/yayincilar/douyin' },
]

async function getAllRecords(table: string, columns: string): Promise<Row[]> {
  let allData: Row[] = []
  let from = 0
  const batchSize = 1000
  while (true) {
    const { data } = await supabase.from(table).select(columns).range(from, from + batchSize - 1)
    if (!data || data.length === 0) break
    allData = [...allData, ...data as Row[]]
    if (data.length < batchSize) break
    from += batchSize
  }
  return allData
}

async function getData() {
  const [twitch, kick, soop, youtube] = await Promise.all([
    getAllRecords('twitch_streamers', 'username, display_name, followers'),
    getAllRecords('kick_streamers',   'username, channel_name, followers'),
    getAllRecords('soop_streamers',   'username, channel_name, followers'),
    getAllRecords('youtube_channels', 'channel_name, subscribers'),
  ])
  return { twitch, kick, soop, youtube }
}

export default async function YayincilarPage() {
  const { twitch, kick, soop, youtube } = await getData()

  const counts: Record<string, number> = {
    twitch:   twitch.length,
    kick:     kick.length,
    soop:     soop.length,
    youtube:  youtube.length,
    niconico: 0,
    chzzk:    0,
    bilibili: 0,
    douyin:   0,
  }

  const chartData: Record<string, { label: string; value: number }[]> = {
    twitch:   twitch.slice(0, 8).map((r) => ({ label: String(r.display_name ?? r.username ?? '—'), value: Number(r.followers) || 0 })),
    kick:     kick.slice(0, 8).map((r) => ({ label: String(r.channel_name ?? r.username ?? '—'), value: Number(r.followers) || 0 })),
    soop:     soop.slice(0, 8).map((r) => ({ label: String(r.channel_name ?? r.username ?? '—'), value: Number(r.followers) || 0 })),
    youtube:  youtube.slice(0, 8).map((r) => ({ label: String(r.channel_name ?? '—'), value: Number(r.subscribers) || 0 })),
    niconico: [],
    chzzk:    [],
    bilibili: [],
    douyin:   [],
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const platformBar = PLATFORMS.map((p) => ({ label: p.label, value: counts[p.key] }))

  return (
    <div>
      <PageHeader
        title="Yayıncılar"
        subtitle={`${total} toplam yayıncı · 8 platform`}
        icon={Tv2}
        gradient="linear-gradient(135deg, #3b82f6, #14b8a6)"
      />
      <div style={{ padding: '24px 32px' }}>

        {/* Platform comparison bar chart */}
        <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '4px' }}>Platform Karşılaştırması</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>Platforma göre takip edilen yayıncı sayısı</div>
          <BarChart data={platformBar} color="#3b82f6" height={100} />
        </div>

        {/* Platform cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {PLATFORMS.map((platform) => {
            const count = counts[platform.key]
            const bars = chartData[platform.key]
            return (
              <div
                key={platform.key}
                style={{
                  backgroundColor: '#1a1a24',
                  border: '1px solid #2a2a3a',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Card header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a2a3a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: platform.color,
                          boxShadow: `0 0 8px ${platform.color}60`,
                        }}
                      />
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>{platform.label}</span>
                    </div>
                    <span style={{ fontSize: '26px', fontWeight: 800, color: count > 0 ? platform.color : '#475569' }}>
                      {count}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    {count > 0 ? 'yayıncı takip ediliyor' : 'henüz veri yok'}
                  </div>
                </div>

                {/* Mini bar chart */}
                <div style={{ padding: '14px 20px', flex: 1 }}>
                  {bars.length > 0 ? (
                    <>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Takipçiye göre top yayıncılar
                      </div>
                      <BarChart data={bars} color={platform.color} height={80} maxBars={8} />
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px' }}>
                      <span style={{ fontSize: '12px', color: '#475569' }}>Veri bekleniyor…</span>
                    </div>
                  )}
                </div>

                {/* Footer link */}
                <div style={{ padding: '12px 20px', borderTop: '1px solid #2a2a3a' }}>
                  <Link
                    href={platform.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: platform.color,
                      textDecoration: 'none',
                    }}
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
