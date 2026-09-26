export const dynamic = 'force-dynamic'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { Space_Grotesk, DM_Sans } from 'next/font/google'
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
  ArrowUpRight,
  ArrowRight,
  NotebookPen,
  CalendarPlus,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PLATFORM_COLORS } from '@/lib/theme'
import AISearchBar from '@/components/AISearchBar'
import QuickLinkCard, { type Tone } from '@/components/QuickLinkCard'
import SteamTopSellers from '@/components/dashboard/SteamTopSellers'
import SteamMostPlayed from '@/components/dashboard/SteamMostPlayed'
import TwitchLivePanel from '@/components/dashboard/TwitchLivePanel'
import LatestNews from '@/components/dashboard/LatestNews'
import GamalyticWishlist from '@/components/dashboard/GamalyticWishlist'
import CountUp from '@/components/dashboard/CountUp'
import DashboardFx from '@/components/dashboard/DashboardFx'
import { getStoreItems, steamHeaderUrl, TOT_APPID } from '@/lib/steam'
import s from './dashboard.module.css'
import { Beam } from '@/components/effects/Effects'

// Dashboard type (design-system/uniquenpc/MASTER.md): Space Grotesk display, DM Sans body
const display = Space_Grotesk({ variable: '--font-dash-display', subsets: ['latin', 'latin-ext'] })
const body = DM_Sans({ variable: '--font-dash-body', subsets: ['latin', 'latin-ext'] })

const TZ = 'Europe/Istanbul'

const ROSTER = [
  { key: 'twitch', label: 'Twitch', table: 'twitch_streamers', icon: '/icons/twitch.png' },
  { key: 'youtube', label: 'YouTube', table: 'youtube_streamers', icon: '/icons/youtube.png' },
  { key: 'kick', label: 'Kick', table: 'kick_streamers', icon: '/icons/kick.png' },
  { key: 'soop', label: 'SOOP', table: 'soop_streamers', icon: '/icons/soop.jpeg' },
  { key: 'chzzk', label: 'Chzzk', table: 'chzzk_streamers', icon: '/icons/chzzk.png' },
  { key: 'bilibili', label: 'BiliBili', table: 'bilibili_streamers', icon: '/icons/bilibili.png' },
  { key: 'douyin', label: 'Douyin', table: 'douyin_streamers', icon: '/icons/douyin.png' },
] as const

const TONE_CLASS: Record<Tone, string> = {
  violet: s.toneViolet,
  rose: s.toneRose,
  blue: s.toneBlue,
  green: s.toneGreen,
  amber: s.toneAmber,
  red: s.toneRed,
  neutral: s.toneNeutral,
}

const MEETING_STATUS: Record<string, Tone> = {
  'Planlandı': 'blue',
  'Devam Ediyor': 'amber',
  'Tamamlandı': 'green',
  'İptal': 'neutral',
}

const QUICK_LINKS: { href: string; label: string; tone: Tone; icon?: typeof Globe; imageSrc?: string }[] = [
  { href: '/platformlar', label: 'Platformlar & Partnerler', tone: 'blue', icon: Globe },
  { href: '/yayincilar', label: 'Yayıncılar', tone: 'violet', icon: Tv2 },
  { href: '/toplantilar', label: 'Toplantılar', tone: 'amber', icon: Calendar },
  { href: '/notlar', label: 'Notlar', tone: 'green', icon: FileText },
  { href: '/sosyal-medya', label: 'Sosyal Medya', tone: 'blue', icon: Share2 },
  { href: '/reddit', label: 'Reddit', tone: 'rose', imageSrc: '/icons/reddit.svg' },
  { href: '/butce', label: 'Bütçe', tone: 'green', icon: Wallet },
  { href: '/icerik-planlama', label: 'İçerik Planlaması', tone: 'violet', icon: CalendarCheck },
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

function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: TZ }).format(new Date()))
  if (hour >= 5 && hour < 12) return 'Günaydın'
  if (hour >= 12 && hour < 18) return 'İyi günler'
  if (hour >= 18 && hour < 23) return 'İyi akşamlar'
  return 'İyi geceler'
}

// Staggered entrance index for a bento tile
const tile = (i: number) => ({ '--i': i }) as CSSProperties

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

function BudgetRing({ percent, tone }: { percent: number; tone: string }) {
  const r = 26
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.min(percent, 100) / 100)
  return (
    <div className={s.ringWrap}>
      <svg className={s.ring} viewBox="0 0 64 64" aria-hidden>
        <circle className={s.ringTrack} cx="32" cy="32" r={r} />
        <circle
          className={s.ringFill}
          cx="32"
          cy="32"
          r={r}
          stroke={tone}
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ '--c': c } as CSSProperties}
        />
      </svg>
      <span className={s.ringLabel} aria-hidden>%{percent}</span>
    </div>
  )
}

export default async function DashboardPage() {
  const [d, totCover] = await Promise.all([getDashboardData(), getTotCover()])

  const todayLabel = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ,
  })
  const budgetTone = d.budgetPercent >= 100 ? 'var(--danger)' : d.budgetPercent >= 80 ? 'var(--orange)' : 'var(--primary-ink)'
  const activeRoster = d.roster.filter((p) => p.count > 0)
  const pastMeetings = Math.max(d.meetingCount - d.upcomingCount, 0)

  return (
    <div className={`${s.root} ${display.variable} ${body.variable}`}>
      <DashboardFx selector={`.${s.card}`} />
      <div className={s.ambient} aria-hidden>
        <div className={s.grain} />
      </div>

      <div className={s.container}>
        <div className={s.bento} data-reveal-root data-css-entrance>
          {/* ---------- Hero ---------- */}
          <div className={`${s.tile} ${s.hero}`} style={tile(0)}>
            <section className={`${s.card} ${s.heroCard}`} aria-labelledby="dash-title">
              <Beam delay={0} />
              <div className={s.heroTop}>
                <span className={s.eyebrow}>
                  <span className={s.eyebrowDot} aria-hidden />
                  {greeting()}, Unique NPC
                </span>
                <span className={s.today}>{todayLabel}</span>
              </div>
              <h1 id="dash-title" className={s.display}>
                Oyunlarınızın <span className={s.gradientText}>pazar nabzı</span>, tek ekranda
              </h1>
              <p className={s.lede}>
                Yayıncılar, partnerler, Steam listeleri ve Twitch yayınları. Ne arıyorsanız sorun.
              </p>
              <AISearchBar />
            </section>
          </div>

          {/* ---------- Featured game ---------- */}
          <div className={`${s.tile} ${s.feature}`} style={tile(1)}>
            <GamalyticWishlist coverUrl={totCover} />
          </div>

          {/* ---------- KPIs ---------- */}
          <div className={`${s.tile} ${s.kpi}`} style={tile(2)}>
            <Link href="/yayincilar" className={`${s.card} ${s.interactive} ${s.kpiCard}`}>
              <div className={s.kpiHead}>
                <span className={s.kpiLabel}>
                  <span className={`${s.kpiIcon} ${s.toneViolet}`}><Tv2 size={16} aria-hidden /></span>
                  Toplam yayıncı
                </span>
                <ArrowUpRight size={18} className={s.kpiArrow} aria-hidden />
              </div>
              <div className={s.kpiValue}><CountUp value={d.totalStreamers} /></div>
              {d.totalStreamers > 0 ? (
                <>
                  <div className={s.segBar} role="img" aria-label={activeRoster.map((p) => `${p.label} ${p.count}`).join(', ')}>
                    {activeRoster.map((p) => (
                      <span key={p.key} style={{ flexGrow: p.count, backgroundColor: p.color }} />
                    ))}
                  </div>
                  <ul className={s.legend} aria-hidden>
                    {activeRoster.slice(0, 4).map((p) => (
                      <li key={p.key}>
                        <span className={s.legendSwatch} style={{ backgroundColor: p.color }} />
                        {p.label} {num(p.count)}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className={s.kpiNote}>Henüz yayıncı eklenmedi</div>
              )}
            </Link>
          </div>

          <div className={`${s.tile} ${s.kpi}`} style={tile(3)}>
            <Link href="/yayincilar" className={`${s.card} ${s.interactive} ${s.kpiCard}`}>
              <div className={s.kpiHead}>
                <span className={s.kpiLabel}>
                  <span className={`${s.kpiIcon} ${s.toneBlue}`}><Layers size={16} aria-hidden /></span>
                  Aktif platform
                </span>
                <ArrowUpRight size={18} className={s.kpiArrow} aria-hidden />
              </div>
              <div className={s.kpiValue}>
                <CountUp value={d.activePlatforms} />
                <span className={s.kpiValueSmall}> / {ROSTER.length}</span>
              </div>
              <div
                className={s.platforms}
                role="img"
                aria-label={`Yayıncısı olan platformlar: ${activeRoster.map((p) => p.label).join(', ') || 'yok'}`}
              >
                {d.roster.map((p) => (
                  <span
                    key={p.key}
                    className={`${s.platform} ${p.count > 0 ? '' : s.platformOff}`}
                    title={`${p.label}: ${num(p.count)}`}
                  >
                    <img src={p.icon} alt="" />
                  </span>
                ))}
              </div>
            </Link>
          </div>

          <div className={`${s.tile} ${s.kpi}`} style={tile(4)}>
            <Link href="/toplantilar" className={`${s.card} ${s.interactive} ${s.kpiCard}`}>
              <div className={s.kpiHead}>
                <span className={s.kpiLabel}>
                  <span className={`${s.kpiIcon} ${s.toneAmber}`}><CalendarDays size={16} aria-hidden /></span>
                  Toplantılar
                </span>
                <ArrowUpRight size={18} className={s.kpiArrow} aria-hidden />
              </div>
              <div className={s.kpiValue}><CountUp value={d.meetingCount} /></div>
              <div className={s.split}>
                <div className={s.splitItem}>
                  <div className={s.splitValue}>{num(d.upcomingCount)}</div>
                  <div className={s.splitLabel}>Yaklaşan</div>
                </div>
                <div className={s.splitItem}>
                  <div className={s.splitValue}>{num(pastMeetings)}</div>
                  <div className={s.splitLabel}>Geçmiş</div>
                </div>
              </div>
            </Link>
          </div>

          <div className={`${s.tile} ${s.kpi}`} style={tile(5)}>
            <Link href="/butce" className={`${s.card} ${s.interactive} ${s.kpiCard}`}>
              <div className={s.kpiHead}>
                <span className={s.kpiLabel}>
                  <span className={`${s.kpiIcon} ${s.toneGreen}`}><Wallet size={16} aria-hidden /></span>
                  Bütçe kullanımı
                </span>
                <ArrowUpRight size={18} className={s.kpiArrow} aria-hidden />
              </div>
              {d.monthlyBudget > 0 ? (
                <>
                  <div className={s.kpiBody}>
                    <div className={s.kpiValue}>
                      <CountUp value={d.totalExpenses} format="usd" />
                      <div className={s.kpiValueSmall} style={{ marginTop: 6 }}>/ {usd(d.monthlyBudget)}</div>
                    </div>
                    <div role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(d.budgetPercent, 100)} aria-label="Bütçe kullanımı">
                      <BudgetRing percent={d.budgetPercent} tone={budgetTone} />
                    </div>
                  </div>
                  <div className={s.kpiNote} style={{ color: d.budgetPercent >= 80 ? budgetTone : undefined }}>
                    {d.budgetPercent < 100
                      ? `${usd(d.monthlyBudget - d.totalExpenses)} kaldı`
                      : `Bütçe ${usd(d.totalExpenses - d.monthlyBudget)} aşıldı`}
                  </div>
                </>
              ) : (
                <>
                  <div className={s.kpiValue}><CountUp value={d.totalExpenses} format="usd" /></div>
                  <div className={s.kpiNote}>Aylık bütçe tanımlanmadı</div>
                </>
              )}
            </Link>
          </div>

          {/* ---------- Team agenda ---------- */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}><span className={s.sectionIndex}>01</span>Ekibin gündemi</h2>
            <span className={s.sectionNote}>Son toplantılar ve notlar</span>
          </div>

          <div className={`${s.tile} ${s.wMeet}`} style={tile(6)}>
            <section className={s.card} aria-labelledby="meetings-title">
              <div className={s.cardHead}>
                <span className={`${s.logoBadge} ${s.toneAmber}`} aria-hidden><Calendar size={17} /></span>
                <div className={s.cardHeadText}>
                  <h3 id="meetings-title" className={s.cardTitle}>Son toplantılar</h3>
                  <div className={s.cardSub}>{num(d.upcomingCount)} yaklaşan toplantı</div>
                </div>
                <Link href="/toplantilar" className={s.cardLink}>Tümü<ArrowRight size={14} aria-hidden /></Link>
              </div>
              {d.recentMeetings.length === 0 ? (
                <p className={s.empty}>
                  <span className={s.emptyIcon}><CalendarPlus size={20} aria-hidden /></span>
                  Henüz toplantı yok.
                  <Link href="/toplantilar">İlk toplantıyı planlayın</Link>
                </p>
              ) : (
                <ul className={s.list}>
                  {d.recentMeetings.map((m) => {
                    const status = m.status ? String(m.status) : ''
                    const tone = TONE_CLASS[MEETING_STATUS[status] ?? 'neutral']
                    const meta = [m.time ? String(m.time).slice(0, 5) : '', m.attendees ? String(m.attendees) : '']
                      .filter(Boolean)
                      .join(' · ')
                    return (
                      <li key={String(m.id)} className={s.listItem}>
                        <DateChip value={m.date} />
                        <div style={{ minWidth: 0 }}>
                          <div className={s.itemTitle}>{String(m.title ?? 'Başlıksız toplantı')}</div>
                          {meta && <div className={s.itemMeta}>{meta}</div>}
                        </div>
                        {status && (
                          <span className={`${s.tag} ${tone}`}><span className={s.tagDot} aria-hidden />{status}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>

          <div className={`${s.tile} ${s.wNotes}`} style={tile(7)}>
            <section className={s.card} aria-labelledby="notes-title">
              <div className={s.cardHead}>
                <span className={`${s.logoBadge} ${s.toneGreen}`} aria-hidden><FileText size={17} /></span>
                <div className={s.cardHeadText}>
                  <h3 id="notes-title" className={s.cardTitle}>Son notlar</h3>
                  <div className={s.cardSub}>Ekibin en son eklediği</div>
                </div>
                <Link href="/notlar" className={s.cardLink}>Tümü<ArrowRight size={14} aria-hidden /></Link>
              </div>
              {d.recentNotes.length === 0 ? (
                <p className={s.empty}>
                  <span className={s.emptyIcon}><NotebookPen size={20} aria-hidden /></span>
                  Henüz not yok.
                  <Link href="/notlar">İlk notu ekleyin</Link>
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
                      {n.category ? <span className={`${s.tag} ${s.toneViolet}`}>{String(n.category)}</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className={`${s.tile} ${s.wQuick}`} style={tile(8)}>
            <section className={s.card} aria-labelledby="quick-title">
              <div className={s.cardHead}>
                <div className={s.cardHeadText}>
                  <h3 id="quick-title" className={s.cardTitle}>Hızlı erişim</h3>
                  <div className={s.cardSub}>Sık kullanılan modüller</div>
                </div>
              </div>
              <nav className={s.quick} aria-labelledby="quick-title">
                {QUICK_LINKS.map((q) => (
                  <QuickLinkCard key={q.href} {...q} toneClass={TONE_CLASS[q.tone]} />
                ))}
              </nav>
            </section>
          </div>

          {/* ---------- Market pulse ---------- */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}><span className={s.sectionIndex}>02</span>Pazar nabzı</h2>
            <span className={s.sectionNote}>Steam ve Twitch, canlı veri</span>
          </div>

          <div className={`${s.tile} ${s.wMarket}`} style={tile(9)}>
            <TwitchLivePanel />
          </div>
          <div className={`${s.tile} ${s.wMarket}`} style={tile(10)}>
            <SteamTopSellers />
          </div>
          <div className={`${s.tile} ${s.wMarket} ${s.wMarketWide}`} style={tile(11)}>
            <SteamMostPlayed />
          </div>

          {/* ---------- News ---------- */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}><span className={s.sectionIndex}>03</span>Sektörden haberler</h2>
            <span className={s.sectionNote}>PC Gamer</span>
          </div>

          <div className={`${s.tile} ${s.wNews}`} style={tile(12)}>
            <LatestNews />
          </div>
        </div>
      </div>
    </div>
  )
}
