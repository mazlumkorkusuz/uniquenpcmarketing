export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import BarChart from '@/components/BarChart'
import { Tv2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { inkOf } from '@/lib/theme'

type Row = Record<string, unknown>

const PLATFORMS = [
  { key: 'twitch',   label: 'Twitch',   color: '#9146ff', href: '/yayincilar/twitch' },
  { key: 'kick',     label: 'Kick',     color: '#53fc18', href: '/yayincilar/kick' },
  { key: 'soop',     label: 'SOOP',     color: '#1D4ED8', href: '/yayincilar/soop' },
  { key: 'youtube',  label: 'YouTube',  color: '#FF0000', href: '/yayincilar/youtube' },
  { key: 'chzzk',    label: 'Chzzk',    color: '#00ffa3', href: '/yayincilar/chzzk' },
  { key: 'bilibili', label: 'BiliBili', color: '#00a1d6', href: '/yayincilar/bilibili' },
  { key: 'douyin',   label: 'Douyin',   color: '#fe2c55', href: '/yayincilar/douyin' },
]

async function getAllRecords(table: string): Promise<Record<string, unknown>[]> {
  let allData: Record<string, unknown>[] = []
  let from = 0
  const batchSize = 1000
  while (true) {
    const { data } = await supabase
      .from(table)
      .select('*')
      .range(from, from + batchSize - 1)
    if (!data || data.length === 0) break
    allData = [...allData, ...(data as Record<string, unknown>[])]
    if (data.length < batchSize) break
    from += batchSize
  }
  return allData
}

async function getSummary(table: string) {
  const [{ count }, { data }] = await Promise.all([
    supabase.from(table).select('*', { count: 'exact', head: true }),
    supabase.from(table).select('channel_name, followers').order('followers', { ascending: false, nullsFirst: false }).limit(8),
  ])
  return { count: count ?? 0, top: (data ?? []) as unknown as Record<string, unknown>[] }
}

async function getData() {
  const [twitch, kick, soop, youtube, chzzk, bilibili, douyin] = await Promise.all([
    getAllRecords('twitch_streamers'),
    getAllRecords('kick_streamers'),
    getAllRecords('soop_streamers'),
    getSummary('youtube_streamers'),
    getAllRecords('chzzk_streamers'),
    getSummary('bilibili_streamers'),
    getSummary('douyin_streamers'),
  ])
  return { twitch, kick, soop, youtube, chzzk, bilibili, douyin }
}

export default async function YayincilarPage() {
  const { twitch, kick, soop, youtube, chzzk, bilibili, douyin } = await getData()

  const counts: Record<string, number> = {
    twitch:   twitch.length,
    kick:     kick.length,
    soop:     soop.length,
    youtube:  youtube.count,
    chzzk:    chzzk.length,
    bilibili: bilibili.count,
    douyin:   douyin.count,
  }

  const chartData: Record<string, { label: string; value: number }[]> = {
    twitch:   twitch.slice(0, 8).map((r) => ({ label: String(r.display_name ?? r.username ?? '—'), value: Number(r.followers) || 0 })),
    kick:     kick.slice(0, 8).map((r) => ({ label: String(r.channel_name ?? r.username ?? '—'), value: Number(r.followers) || 0 })),
    soop:     soop.slice(0, 8).map((r) => ({ label: String(r.channel_name ?? r.username ?? '—'), value: Number(r.followers) || 0 })),
    youtube:  youtube.top.map((r) => ({ label: String(r.channel_name ?? '—'), value: Number(r.followers) || 0 })),
    chzzk:    chzzk.slice(0, 8).map((r) => ({ label: String(r.channel_name ?? '—'), value: Number(r.followers) || 0 })),
    bilibili: bilibili.top.map((r) => ({ label: String(r.channel_name ?? '—'), value: Number(r.followers) || 0 })),
    douyin:   douyin.top.map((r) => ({ label: String(r.channel_name ?? '—'), value: Number(r.followers) || 0 })),
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const platformBar = PLATFORMS.map((p) => ({ label: p.label, value: counts[p.key] }))

  return (
    <div>
      <PageHeader
        title="Yayıncılar"
        subtitle={`${total} toplam yayıncı · ${PLATFORMS.length} platform`}
        icon={Tv2}
        gradient="linear-gradient(135deg, #7C3AED, #6D28D9)"
      />
      <div style={{ padding: '24px 32px' }}>

        {/* Platform comparison bar chart */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#17122B', marginBottom: '4px' }}>Platform Karşılaştırması</div>
          <div style={{ fontSize: '12px', color: '#655F7D', marginBottom: '16px' }}>Platforma göre takip edilen yayıncı sayısı</div>
          <BarChart data={platformBar} color="#1D4ED8" height={100} />
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
                  backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)',
                  border: '1px solid #E8E4F1',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Card header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8E4F1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: platform.color,
                          boxShadow: 'none',
                        }}
                      />
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', letterSpacing: '-0.01em', fontWeight: 600, color: '#17122B' }}>{platform.label}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', fontWeight: 600, color: count > 0 ? inkOf(platform.color) : '#655F7D' }}>
                      {count}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#655F7D', marginTop: '4px' }}>
                    {count > 0 ? 'yayıncı takip ediliyor' : 'henüz veri yok'}
                  </div>
                </div>

                {/* Mini bar chart */}
                <div style={{ padding: '14px 20px', flex: 1 }}>
                  {bars.length > 0 ? (
                    <>
                      <div style={{ fontSize: '12px', color: '#655F7D', marginBottom: '10px', fontWeight: 500, }}>
                        Takipçiye göre top yayıncılar
                      </div>
                      <BarChart data={bars} color={platform.color} height={80} maxBars={8} />
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px' }}>
                      <span style={{ fontSize: '12px', color: '#655F7D' }}>Veri bekleniyor…</span>
                    </div>
                  )}
                </div>

                {/* Footer link */}
                <div style={{ padding: '12px 20px', borderTop: '1px solid #E8E4F1' }}>
                  <Link
                    href={platform.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: inkOf(platform.color),
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
