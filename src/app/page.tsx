export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { Fira_Sans } from 'next/font/google'
import {
  Tv2,
  Globe,
  Calendar,
  FileText,
  Share2,
  Wallet,
  Mail,
  CalendarDays,
  Handshake,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PLATFORM_COLORS } from '@/lib/theme'
import AISearchBar from '@/components/AISearchBar'
import QuickLinkCard from '@/components/QuickLinkCard'
import TwitchLivePanel from '@/components/dashboard/TwitchLivePanel'
import LatestNews from '@/components/dashboard/LatestNews'
import s from './dashboard.module.css'

const fira = Fira_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fira',
})

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

const MEETING_STATUS: Record<string, { fg: string; bg: string }> = {
  'Planlandı': { fg: '#1D4ED8', bg: '#EFF6FF' },
  'Devam Ediyor': { fg: '#B45309', bg: '#FFFBEB' },
  'Tamamlandı': { fg: '#15803D', bg: '#F0FDF4' },
  'İptal': { fg: '#64748B', bg: '#F1F5F9' },
}

type Row = Record<string, unknown>

async function getDashboardData() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: TZ }) // YYYY-MM-DD

  const [
    rosterCounts,
    { count: platformCount },
    { count: meetingCount },
    { count: upcomingCount },
    { data: budgetData },
    { data: expenseData },
    { data: recentMeetings },
    { data: recentNotes },
  ] = await Promise.all([
    Promise.all(
      ROSTER.map((p) => supabase.from(p.table).select('*', { count: 'exact', head: true })),
    ),
    supabase.from('crm_platforms').select('*', { count: 'exact', head: true }),
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
  const totalStreamers = roster.reduce((sum, p) => sum + p.count, 0)

  const monthlyBudget = Number(budgetData?.[0]?.monthly_budget ?? 0)
  const totalExpenses = (expenseData ?? []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

  return {
    roster,
    totalStreamers,
    platformCount: platformCount ?? 0,
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

const QUICK_LINKS = [
  { href: '/platformlar', label: 'Platformlar & Partnerler', desc: 'CRM, ajanslar ve partner kayıtları', color: '#2563EB', icon: Globe },
  { href: '/yayincilar', label: 'Yayıncılar', desc: 'Twitch, YouTube, Kick, SOOP ve daha fazlası', color: '#9146FF', icon: Tv2 },
  { href: '/toplantilar', label: 'Toplantılar', desc: 'Planlanan ve geçmiş görüşmeler', color: '#0F766E', icon: Calendar },
  { href: '/notlar', label: 'Notlar', desc: 'Ekip notları ve kayıtlar', color: '#C2410C', icon: FileText },
  { href: '/sosyal-medya', label: 'Sosyal Medya', desc: 'X, Instagram ve TikTok hesapları', color: '#1D9BF0', icon: Share2 },
  { href: '/reddit', label: 'Reddit', desc: 'Hesaplar ve gönderiler', color: '#FF4500', imageSrc: '/icons/reddit.svg' },
  { href: '/butce', label: 'Bütçe', desc: 'Harcamalar ve aylık limit', color: '#15803D', icon: Wallet },
  { href: '/gamalytic', label: 'Gamalytic', desc: 'Steam oyun analitiği', color: '#4F46E5', imageSrc: '/icons/gamalytic-logo.svg' },
  { href: '/mail-servisi', label: 'Mail Servisi', desc: 'Kampanyalar, şablonlar ve takip', color: '#0F172A', icon: Mail },
]

export default async function DashboardPage() {
  const d = await getDashboardData()

  const todayLabel = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  })

  const budgetColor = d.budgetPercent >= 100 ? 'var(--danger)' : d.budgetPercent >= 80 ? 'var(--warn)' : 'var(--ok)'

  return (
    <div className={`${fira.variable} ${s.root}`}>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>Pazarlama paneli</h1>
          <p className={s.subtitle}>Yayıncılar, partnerler ve kampanyalar tek bakışta</p>
        </div>
        <div className={s.today}>{todayLabel}</div>
      </header>

      <AISearchBar />

      {/* Stats strip */}
      <div className={s.stats}>
        <Link href="/yayincilar" className={s.stat}>
          <div className={s.statLabel}><Tv2 size={15} aria-hidden /> Toplam yayıncı</div>
          <div className={s.statValue}>{num(d.totalStreamers)}</div>
          {d.totalStreamers > 0 && (
            <>
              <div className={s.roster} role="img" aria-label="Platforma göre yayıncı dağılımı">
                {d.roster.filter((p) => p.count > 0).map((p) => (
                  <span key={p.key} style={{ flexGrow: p.count, backgroundColor: p.color }} title={`${p.label}: ${p.count}`} />
                ))}
              </div>
              <div className={s.rosterLegend}>
                {d.roster.filter((p) => p.count > 0).map((p) => (
                  <span key={p.key} className={s.rosterItem}>
                    <span className={s.rosterSwatch} style={{ backgroundColor: p.color }} aria-hidden />
                    {p.label} {num(p.count)}
                  </span>
                ))}
              </div>
            </>
          )}
        </Link>

        <Link href="/platformlar" className={s.stat}>
          <div className={s.statLabel}><Handshake size={15} aria-hidden /> Platform ve partner</div>
          <div className={s.statValue}>{num(d.platformCount)}</div>
          <div className={s.statNote}>CRM&apos;deki aktif kayıtlar</div>
        </Link>

        <Link href="/toplantilar" className={s.stat}>
          <div className={s.statLabel}><CalendarDays size={15} aria-hidden /> Toplantı</div>
          <div className={s.statValue}>{num(d.meetingCount)}</div>
          <div className={s.statNote}>
            {d.upcomingCount > 0 ? `${num(d.upcomingCount)} tanesi bugün veya sonrasında` : 'Yaklaşan toplantı yok'}
          </div>
        </Link>

        <Link href="/butce" className={s.stat}>
          <div className={s.statLabel}><Wallet size={15} aria-hidden /> Bütçe kullanımı</div>
          <div className={s.statValue}>
            {usd(d.totalExpenses)}
            {d.monthlyBudget > 0 && <span className={s.statValueSmall}> / {usd(d.monthlyBudget)}</span>}
          </div>
          {d.monthlyBudget > 0 ? (
            <>
              <div
                className={s.meter}
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(d.budgetPercent, 100)}
                aria-label="Bütçe kullanımı"
              >
                <div className={s.meterFill} style={{ width: `${Math.min(d.budgetPercent, 100)}%`, backgroundColor: budgetColor }} />
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

      <TwitchLivePanel />

      <section aria-labelledby="news-title">
        <div className={s.sectionHead}>
          <h2 id="news-title" className={s.sectionTitle}>Sektörden son haberler</h2>
          <Link href="/news" className={s.panelLink}>Tüm haberler</Link>
        </div>
        <LatestNews />
      </section>

      <div className={s.row2}>
        <section className={s.panel} aria-labelledby="meetings-title">
          <div className={s.panelHead}>
            <h2 id="meetings-title" className={s.panelTitle}>Son toplantılar</h2>
            <Link href="/toplantilar" className={s.panelLink}>Tümünü gör</Link>
          </div>
          {d.recentMeetings.length === 0 ? (
            <p className={s.empty}>
              Henüz toplantı yok. <Link href="/toplantilar">İlk toplantıyı planlayın</Link>
            </p>
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
                      <span className={s.tag} style={{ color: tone.fg, backgroundColor: tone.bg }}>{status}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className={s.panel} aria-labelledby="notes-title">
          <div className={s.panelHead}>
            <h2 id="notes-title" className={s.panelTitle}>Son notlar</h2>
            <Link href="/notlar" className={s.panelLink}>Tümünü gör</Link>
          </div>
          {d.recentNotes.length === 0 ? (
            <p className={s.empty}>
              Henüz not yok. <Link href="/notlar">İlk notu ekleyin</Link>
            </p>
          ) : (
            <ul className={s.list}>
              {d.recentNotes.map((n) => (
                <li key={String(n.id)} className={s.listItem}>
                  <DateChip value={n.created_at} />
                  <div style={{ minWidth: 0 }}>
                    <div className={s.itemTitle}>{String(n.title ?? 'Başlıksız not')}</div>
                    {n.content ? <div className={s.itemMeta}>{String(n.content)}</div> : null}
                  </div>
                  {n.category ? (
                    <span className={s.tag} style={{ color: 'var(--ink-2)', borderColor: 'var(--line)' }}>
                      {String(n.category)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="quick-title">
        <div className={s.sectionHead}>
          <h2 id="quick-title" className={s.sectionTitle}>Hızlı erişim</h2>
        </div>
        <div className={s.quick}>
          {QUICK_LINKS.map((q) => (
            <QuickLinkCard key={q.href} {...q} />
          ))}
        </div>
      </section>
    </div>
  )
}
