export const dynamic = 'force-dynamic'
import Link from 'next/link'
import {
  Tv2,
  Globe,
  Calendar,
  FileText,
  Share2,
  Wallet,
  CalendarCheck,
  Layers,
  CalendarDays,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PLATFORM_COLORS } from '@/lib/theme'
import AISearchBar from '@/components/AISearchBar'
import QuickLinkCard from '@/components/QuickLinkCard'
import SteamTopSellers from '@/components/dashboard/SteamTopSellers'
import SteamMostPlayed from '@/components/dashboard/SteamMostPlayed'
import TwitchLivePanel from '@/components/dashboard/TwitchLivePanel'
import LatestNews from '@/components/dashboard/LatestNews'
import GamalyticWishlist from '@/components/dashboard/GamalyticWishlist'
import { getStoreItems, steamHeaderUrl, TOT_APPID } from '@/lib/steam'
import s from './dashboard.module.css'

const TZ = 'Europe/Istanbul'

const ROSTER = [
  { key: 'twitch', label: 'Twitch', table: 'twitch_streamers' },
  { key: 'youtube', label: 'YouTube', table: 'youtube_streamers' },
  { key: 'kick', label: 'Kick', table: 'kick_streamers' },
  { key: 'soop', label: 'SOOP', table: 'soop_streamers' },
  { key: 'chzzk', label: 'Chzzk', table: 'chzzk_streamers' },
  { key: 'bilibili', label: 'BiliBili', table: 'bilibili_streamers' },
  { key: 'douyin', label: 'Douyin', table: 'douyin_streamers' },
] as const

const MEETING_STATUS: Record<string, { fg: string; bg: string; line: string }> = {
  'Planlandı': { fg: '#70B8FF', bg: '#0D1826', line: '#1B3350' },
  'Devam Ediyor': { fg: '#FFB224', bg: '#1F1A0B', line: '#3D3113' },
  'Tamamlandı': { fg: '#3DD68C', bg: '#0F1F16', line: '#1B3D2A' },
  'İptal': { fg: '#B4B4B4', bg: '#0A0A0A', line: '#262626' },
}

const QUICK_LINKS = [
  { href: '/platformlar', label: 'Platformlar & Partnerler', color: '#70B8FF', icon: Globe },
  { href: '/yayincilar', label: 'Yayıncılar', color: '#9146FF', icon: Tv2 },
  { href: '/toplantilar', label: 'Toplantılar', color: '#70B8FF', icon: Calendar },
  { href: '/notlar', label: 'Notlar', color: '#70B8FF', icon: FileText },
  { href: '/sosyal-medya', label: 'Sosyal Medya', color: '#1D9BF0', icon: Share2 },
  { href: '/reddit', label: 'Reddit', color: '#FF4500', imageSrc: '/icons/reddit.svg' },
  { href: '/butce', label: 'Bütçe', color: '#70B8FF', icon: Wallet },
  { href: '/icerik-planlama', label: 'İçerik Planlaması', color: '#70B8FF', icon: CalendarCheck },
]

type Row = Record<string, unknown>

async function getTotCover(): Promise<string | null> {
  try {
    const item = (await getStoreItems([TOT_APPID], 86400)).get(TOT_APPID)
    return item ? steamHeaderUrl(item) : null
  } catch {
    return null
  }
}

async function getDashboardData() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: TZ }) // YYYY-MM-DD

  const [
    rosterCounts,
    { count: meetingCount },
    { count: upcomingCount },
    { data: budgetData },
    { data: expenseData },
    { data: recentMeetings },
    { data: recentNotes },
  ] = await Promise.all([
    Promise.all(ROSTER.map((p) => supabase.from(p.table).select('*', { count: 'exact', head: true }))),
    supabase.from('meetings').select('*', { count: 'exact', head: true }),
    supabase.from('meetings').select('*', { count: 'exact', head: true }).gte('date', today),
    supabase.from('budget_settings').select('monthly_budget').order('created_at', { ascending: false }).limit(1),
    supabase.from('budget_expenses').select('amount'),
    supabase.from('meetings').select('id, title, date, time, attendees, status').order('date', { ascending: false }).limit(5),
    supabase.from('notes').select('id, title, content, created_at, category').order('created_at', { ascending: false }).limit(5),
  ])

  const roster = ROSTER.map((p, i) => ({
    ...p,
    color: PLATFORM_COLORS[p.key],
    count: rosterCounts[i].count ?? 0,
  }))
  const monthlyBudget = Number(budgetData?.[0]?.monthly_budget ?? 0)
  const totalExpenses = (expenseData ?? []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

  return {
    roster,
    totalStreamers: roster.reduce((sum, p) => sum + p.count, 0),
    activePlatforms: roster.filter((p) => p.count > 0).length,
    meetingCount: meetingCount ?? 0,
    upcomingCount: upcomingCount ?? 0,
    monthlyBudget,
    totalExpenses,
    budgetPercent: monthlyBudget > 0 ? Math.round((totalExpenses / monthlyBudget) * 100) : 0,
    recentMeetings: (recentMeetings ?? []) as Row[],
    recentNotes: (recentNotes ?? []) as Row[],
  }
}

const num = (n: number) => n.toLocaleString('tr-TR')
const usd = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })

function DateChip({ value }: { value: unknown }) {
  const d = value ? new Date(String(value)) : null
  if (!d || Number.isNaN(d.getTime())) {
    return <div className={s.dateChip} aria-hidden><div className={s.dateDay}>–</div></div>
  }
  return (
    <div className={s.dateChip}>
      <div className={s.dateDay}>{d.toLocaleDateString('tr-TR', { day: 'numeric', timeZone: TZ })}</div>
      <div className={s.dateMonth}>{d.toLocaleDateString('tr-TR', { month: 'short', timeZone: TZ })}</div>
    </div>
  )
}

export default async function DashboardPage() {
  const [d, totCover] = await Promise.all([getDashboardData(), getTotCover()])

  const todayLabel = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ,
  })
  const budgetColor = d.budgetPercent >= 100 ? 'var(--danger)' : d.budgetPercent >= 80 ? 'var(--warn)' : 'var(--ok)'
  const activeRoster = d.roster.filter((p) => p.count > 0)

  return (
    <div className={s.root}>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>Pazarlama paneli</h1>
          <p className={s.subtitle}>Yayıncılar, partnerler, Steam ve Twitch tek bakışta</p>
        </div>
        <div className={s.today}>{todayLabel}</div>
      </header>

      <AISearchBar />

      {/* Row 1: stats */}
      <div className={s.stats}>
        <Link href="/yayincilar" className={`${s.card} ${s.stat}`}>
          <div className={s.statLabel}>
            <span className={s.statIcon} style={{ color: 'var(--twitch)' }}><Tv2 size={16} aria-hidden /></span>
            Toplam yayıncı
          </div>
          <div className={s.statValue}>{num(d.totalStreamers)}</div>
          {d.totalStreamers > 0 ? (
            <div className={s.bar} role="img" aria-label={activeRoster.map((p) => `${p.label} ${p.count}`).join(', ')}>
              {activeRoster.map((p) => (
                <span key={p.key} style={{ flexGrow: p.count, backgroundColor: p.color }} title={`${p.label}: ${num(p.count)}`} />
              ))}
            </div>
          ) : (
            <div className={s.statNote}>Henüz yayıncı eklenmedi</div>
          )}
        </Link>

        <Link href="/yayincilar" className={`${s.card} ${s.stat}`}>
          <div className={s.statLabel}>
            <span className={s.statIcon}><Layers size={16} aria-hidden /></span>
            Aktif platform
          </div>
          <div className={s.statValue}>
            {d.activePlatforms}
            <span className={s.statValueSmall}> / {ROSTER.length}</span>
          </div>
          <div className={s.dots} role="img" aria-label={`Yayıncısı olan platformlar: ${activeRoster.map((p) => p.label).join(', ') || 'yok'}`}>
            {d.roster.map((p) => (
              <span key={p.key} className={s.dot} style={p.count > 0 ? { backgroundColor: p.color } : undefined} title={`${p.label}: ${num(p.count)}`} />
            ))}
          </div>
        </Link>

        <Link href="/toplantilar" className={`${s.card} ${s.stat}`}>
          <div className={s.statLabel}>
            <span className={s.statIcon}><CalendarDays size={16} aria-hidden /></span>
            Toplantılar
          </div>
          <div className={s.statValue}>{num(d.meetingCount)}</div>
          <div className={s.statNote}>
            {d.upcomingCount > 0 ? `${num(d.upcomingCount)} tanesi bugün veya sonrasında` : 'Yaklaşan toplantı yok'}
          </div>
        </Link>

        <Link href="/butce" className={`${s.card} ${s.stat}`}>
          <div className={s.statLabel}>
            <span className={s.statIcon}><Wallet size={16} aria-hidden /></span>
            Bütçe kullanımı
          </div>
          <div className={s.statValue}>
            {usd(d.totalExpenses)}
            {d.monthlyBudget > 0 && <span className={s.statValueSmall}> / {usd(d.monthlyBudget)}</span>}
          </div>
          {d.monthlyBudget > 0 ? (
            <>
              <div
                className={s.bar}
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(d.budgetPercent, 100)}
                aria-label="Bütçe kullanımı"
              >
                <span className={s.barFill} style={{ width: `${Math.min(d.budgetPercent, 100)}%`, backgroundColor: budgetColor }} />
              </div>
              <div className={s.statNote} style={{ color: d.budgetPercent >= 80 ? budgetColor : undefined }}>
                %{d.budgetPercent} kullanıldı
                {d.budgetPercent < 100 && `, ${usd(d.monthlyBudget - d.totalExpenses)} kaldı`}
              </div>
            </>
          ) : (
            <div className={s.statNote}>Aylık bütçe tanımlanmadı</div>
          )}
        </Link>
      </div>

      {/* Row 2: meetings, notes, quick access */}
      <div className={s.row2}>
        <section className={s.card} aria-labelledby="meetings-title">
          <div className={s.cardHead}>
            <h2 id="meetings-title" className={s.cardTitle}>Son toplantılar</h2>
            <Link href="/toplantilar" className={s.cardLink}>Tümü</Link>
          </div>
          {d.recentMeetings.length === 0 ? (
            <p className={s.empty}>Henüz toplantı yok. <Link href="/toplantilar">İlk toplantıyı planlayın</Link></p>
          ) : (
            <ul className={s.list}>
              {d.recentMeetings.map((m) => {
                const status = m.status ? String(m.status) : ''
                const tone = MEETING_STATUS[status] ?? MEETING_STATUS['İptal']
                const meta = [m.time ? String(m.time).slice(0, 5) : '', m.attendees ? String(m.attendees) : '']
                  .filter(Boolean)
                  .join(', ')
                return (
                  <li key={String(m.id)} className={s.listItem}>
                    <DateChip value={m.date} />
                    <div style={{ minWidth: 0 }}>
                      <div className={s.itemTitle}>{String(m.title ?? 'Başlıksız toplantı')}</div>
                      {meta && <div className={s.itemMeta}>{meta}</div>}
                    </div>
                    {status && (
                      <span className={s.tag} style={{ color: tone.fg, backgroundColor: tone.bg, borderColor: tone.line }}>{status}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className={s.card} aria-labelledby="notes-title">
          <div className={s.cardHead}>
            <h2 id="notes-title" className={s.cardTitle}>Son notlar</h2>
            <Link href="/notlar" className={s.cardLink}>Tümü</Link>
          </div>
          {d.recentNotes.length === 0 ? (
            <p className={s.empty}>Henüz not yok. <Link href="/notlar">İlk notu ekleyin</Link></p>
          ) : (
            <ul className={s.list}>
              {d.recentNotes.map((n) => (
                <li key={String(n.id)} className={s.listItem}>
                  <DateChip value={n.created_at} />
                  <div style={{ minWidth: 0 }}>
                    <div className={s.itemTitle}>{String(n.title ?? 'Başlıksız not')}</div>
                    {n.content ? <div className={s.itemMeta}>{String(n.content)}</div> : null}
                  </div>
                  {n.category ? <span className={s.tag}>{String(n.category)}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={s.card} aria-labelledby="quick-title">
          <div className={s.cardHead}>
            <h2 id="quick-title" className={s.cardTitle}>Hızlı erişim</h2>
          </div>
          <nav className={s.quick} aria-labelledby="quick-title">
            {QUICK_LINKS.map((q) => (
              <QuickLinkCard key={q.href} {...q} />
            ))}
          </nav>
        </section>
      </div>

      {/* Row 3: Steam, Twitch, news */}
      <div className={s.row3}>
        <SteamTopSellers />
        <SteamMostPlayed />
        <TwitchLivePanel />
        <LatestNews />
      </div>

      {/* Row 4: Gamalytic */}
      <GamalyticWishlist coverUrl={totCover} />
    </div>
  )
}
