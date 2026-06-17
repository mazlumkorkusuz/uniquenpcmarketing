export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import Badge, { statusBadge } from '@/components/Badge'
import { Tv2 } from 'lucide-react'

async function getData() {
  const [
    { data: twitch },
    { data: kick },
    { data: soop },
    { data: youtube },
    { data: tracking },
    { data: favorites },
  ] = await Promise.all([
    supabase.from('twitch_streamers').select('*').order('followers', { ascending: false }),
    supabase.from('kick_streamers').select('*').order('followers', { ascending: false }),
    supabase.from('soop_streamers').select('*').order('followers', { ascending: false }),
    supabase.from('youtube_channels').select('*').order('subscribers', { ascending: false }),
    supabase.from('streamer_tracking').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('streamer_favorites').select('*').order('created_at', { ascending: false }),
  ])
  return {
    twitch: twitch ?? [],
    kick: kick ?? [],
    soop: soop ?? [],
    youtube: youtube ?? [],
    tracking: tracking ?? [],
    favorites: favorites ?? [],
  }
}

type Row = Record<string, unknown>

function numCell(v: unknown) {
  return v
    ? <span style={{ color: '#4ade80', fontWeight: 600 }}>{Number(v).toLocaleString('tr-TR')}</span>
    : <span style={{ color: '#64748b' }}>—</span>
}

function emailCell(v: unknown) {
  return v
    ? <span style={{ color: '#7c3aed', fontFamily: 'monospace', fontSize: '12px' }}>{String(v)}</span>
    : <span style={{ color: '#64748b' }}>—</span>
}

function strCell(v: unknown) {
  return v ? String(v) : <span style={{ color: '#64748b' }}>—</span>
}

export default async function YayincilarPage() {
  const { twitch, kick, soop, youtube, tracking, favorites } = await getData()

  const twitchCols = [
    { key: 'username', label: 'Kullanıcı Adı', render: (v: unknown) => <span style={{ fontWeight: 600, color: '#a78bfa' }}>{String(v)}</span> },
    { key: 'display_name', label: 'Görünen Ad', render: strCell },
    { key: 'followers', label: 'Takipçi', render: numCell },
    { key: 'avg_viewers', label: 'Ort. İzleyici', render: numCell },
    { key: 'language', label: 'Dil', render: (v: unknown) => v ? <Badge variant="blue">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'game', label: 'Oyun', render: strCell },
    { key: 'contact_email', label: 'E-posta', render: emailCell },
    { key: 'status', label: 'Durum', render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
  ]

  const kickCols = [
    { key: 'username', label: 'Kullanıcı Adı', render: (v: unknown) => <span style={{ fontWeight: 600, color: '#4ade80' }}>{String(v)}</span> },
    { key: 'channel_name', label: 'Kanal Adı', render: strCell },
    { key: 'followers', label: 'Takipçi', render: numCell },
    { key: 'avg_viewers', label: 'Ort. İzleyici', render: numCell },
    { key: 'language', label: 'Dil', render: (v: unknown) => v ? <Badge variant="blue">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'contact_email', label: 'E-posta', render: emailCell },
    { key: 'status', label: 'Durum', render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
  ]

  const soopCols = [
    { key: 'username', label: 'Kullanıcı Adı', render: (v: unknown) => <span style={{ fontWeight: 600, color: '#60a5fa' }}>{String(v)}</span> },
    { key: 'channel_name', label: 'Kanal Adı', render: strCell },
    { key: 'followers', label: 'Takipçi', render: numCell },
    { key: 'avg_viewers', label: 'Ort. İzleyici', render: numCell },
    { key: 'language', label: 'Dil', render: (v: unknown) => v ? <Badge variant="blue">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'contact_email', label: 'E-posta', render: emailCell },
    { key: 'status', label: 'Durum', render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
  ]

  const ytCols = [
    { key: 'channel_name', label: 'Kanal', render: (v: unknown) => <span style={{ fontWeight: 600, color: '#f87171' }}>{String(v)}</span> },
    { key: 'subscribers', label: 'Abone', render: numCell },
    { key: 'avg_views', label: 'Ort. İzlenme', render: numCell },
    { key: 'language', label: 'Dil', render: (v: unknown) => v ? <Badge variant="blue">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'genre', label: 'İçerik', render: (v: unknown) => v ? <Badge variant="orange">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'contact_email', label: 'E-posta', render: emailCell },
    { key: 'status', label: 'Durum', render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
  ]

  const trackingCols = [
    { key: 'streamer_id', label: 'Yayıncı ID', render: (v: unknown) => <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#94a3b8' }}>{String(v)}</span> },
    { key: 'streamer_type', label: 'Platform', render: (v: unknown) => v ? <Badge variant="purple">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'status', label: 'Durum', render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
    { key: 'priority', label: 'Öncelik', render: (v: unknown) => {
      if (!v) return <span style={{ color: '#64748b' }}>—</span>
      const s = String(v).toLowerCase()
      return <Badge variant={s === 'high' || s === 'yüksek' ? 'red' : s === 'medium' || s === 'orta' ? 'orange' : 'gray'}>{String(v)}</Badge>
    }},
    { key: 'assigned_to', label: 'Sorumlu', render: strCell },
    { key: 'last_contact', label: 'Son İletişim', render: (v: unknown) => v ? <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(v as string).toLocaleDateString('tr-TR')}</span> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'next_action', label: 'Sonraki Adım', render: strCell },
  ]

  const PlatformSection = ({
    title,
    color,
    count,
    children,
  }: { title: string; color: string; count: number; children: React.ReactNode }) => (
    <div
      style={{
        backgroundColor: '#1a1a24',
        border: '1px solid #2a2a3a',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '24px',
      }}
    >
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }} />
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>{title}</span>
        <span
          style={{
            marginLeft: 'auto',
            backgroundColor: color + '20',
            color,
            border: `1px solid ${color}40`,
            borderRadius: '9999px',
            padding: '2px 10px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {count}
        </span>
      </div>
      {children}
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Yayıncılar"
        subtitle={`${twitch.length + kick.length + soop.length + youtube.length} yayıncı · Twitch, Kick, SOOP, YouTube`}
        icon={Tv2}
        gradient="linear-gradient(135deg, #3b82f6, #14b8a6)"
      />
      <div style={{ padding: '24px 32px' }}>
        <PlatformSection title="Twitch Yayıncıları" color="#9146ff" count={twitch.length}>
          <DataTable columns={twitchCols} data={twitch as Row[]} emptyMessage="Twitch yayıncısı bulunamadı" />
        </PlatformSection>
        <PlatformSection title="Kick Yayıncıları" color="#53fc18" count={kick.length}>
          <DataTable columns={kickCols} data={kick as Row[]} emptyMessage="Kick yayıncısı bulunamadı" />
        </PlatformSection>
        <PlatformSection title="SOOP Yayıncıları" color="#3b82f6" count={soop.length}>
          <DataTable columns={soopCols} data={soop as Row[]} emptyMessage="SOOP yayıncısı bulunamadı" />
        </PlatformSection>
        <PlatformSection title="YouTube Kanalları" color="#ff0000" count={youtube.length}>
          <DataTable columns={ytCols} data={youtube as Row[]} emptyMessage="YouTube kanalı bulunamadı" />
        </PlatformSection>
        <PlatformSection title="Takip Listesi" color="#f59e0b" count={tracking.length}>
          <DataTable columns={trackingCols} data={tracking as Row[]} emptyMessage="Takip listesi boş" />
        </PlatformSection>
        <PlatformSection title="Favoriler" color="#ec4899" count={favorites.length}>
          <DataTable
            columns={[
              { key: 'streamer_id', label: 'Yayıncı ID', render: (v: unknown) => <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#94a3b8' }}>{String(v)}</span> },
              { key: 'streamer_type', label: 'Platform', render: (v: unknown) => v ? <Badge variant="purple">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
              { key: 'added_by', label: 'Ekleyen', render: strCell },
              { key: 'notes', label: 'Not', render: strCell },
            ]}
            data={favorites as Row[]}
            emptyMessage="Favori listesi boş"
          />
        </PlatformSection>
      </div>
    </div>
  )
}
