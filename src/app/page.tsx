export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import StatCard from '@/components/StatCard'
import {
  Tv2,
  Globe,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  MessageCircle,
  FileText,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import QuickLinkCard from '@/components/QuickLinkCard'
import AISearchBar from '@/components/AISearchBar'
import BudgetDonutChart from '@/components/BudgetDonutChart'
import { BudgetExpenseModal } from '@/components/BudgetExpenseModal'

async function getDashboardStats() {
  const [
    { count: twitchCount },
    { count: kickCount },
    { count: soopCount },
    { count: ytCount },
    { count: chzzkCount },
    { count: bilibiliCount },
    { count: douyinCount },
    { count: platformCount },
    { count: meetingCount },
    { count: noteCount },
    { count: redditCount },
    { data: budgetData },
    { data: expenseData },
    { data: recentMeetings },
    { data: recentNotes },
  ] = await Promise.all([
    supabase.from('twitch_streamers').select('*', { count: 'exact', head: true }),
    supabase.from('kick_streamers').select('*', { count: 'exact', head: true }),
    supabase.from('soop_streamers').select('*', { count: 'exact', head: true }),
    supabase.from('youtube_streamers').select('*', { count: 'exact', head: true }),
    supabase.from('chzzk_streamers').select('*', { count: 'exact', head: true }),
    supabase.from('bilibili_streamers').select('*', { count: 'exact', head: true }),
    supabase.from('douyin_streamers').select('*', { count: 'exact', head: true }),
    supabase.from('crm_platforms').select('*', { count: 'exact', head: true }),
    supabase.from('meetings').select('*', { count: 'exact', head: true }),
    supabase.from('notes').select('*', { count: 'exact', head: true }),
    supabase.from('reddit_accounts').select('*', { count: 'exact', head: true }),
    supabase.from('budget_settings').select('monthly_budget').order('created_at', { ascending: false }).limit(1),
    supabase.from('budget_expenses').select('amount, platform, category'),
    supabase.from('meetings').select('id, title, date, status').order('date', { ascending: false }).limit(5),
    supabase.from('notes').select('id, title, created_at, category').order('created_at', { ascending: false }).limit(5),
  ])

  const totalStreamers = (twitchCount ?? 0) + (kickCount ?? 0) + (soopCount ?? 0) + (ytCount ?? 0) + (chzzkCount ?? 0) + (bilibiliCount ?? 0) + (douyinCount ?? 0)
  const monthlyBudget = budgetData?.[0]?.monthly_budget ?? 0
  const totalExpenses = expenseData?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) ?? 0

  type ExpRow = Record<string, unknown>
  const grouped: Record<string, number> = {}
  for (const e of (expenseData ?? []) as ExpRow[]) {
    const key = String(e.platform ?? e.category ?? 'Diğer')
    grouped[key] = (grouped[key] ?? 0) + (Number(e.amount) || 0)
  }
  const budgetChartData = Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  return {
    totalStreamers,
    platformCount: platformCount ?? 0,
    meetingCount: meetingCount ?? 0,
    noteCount: noteCount ?? 0,
    redditCount: redditCount ?? 0,
    monthlyBudget,
    totalExpenses,
    budgetPercent: monthlyBudget > 0 ? Math.round((totalExpenses / monthlyBudget) * 100) : 0,
    budgetChartData,
    recentMeetings: recentMeetings ?? [],
    recentNotes: recentNotes ?? [],
    twitchCount: twitchCount ?? 0,
    kickCount: kickCount ?? 0,
    soopCount: soopCount ?? 0,
    ytCount: ytCount ?? 0,
    chzzkCount: chzzkCount ?? 0,
    bilibiliCount: bilibiliCount ?? 0,
    douyinCount: douyinCount ?? 0,
  }
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatCurrency(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0 })
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const quickLinks = [
    { href: '/platformlar', label: 'Platformlar & Partnerler', desc: 'CRM, yayıncılar, küratörler', color: '#7c3aed' },
    { href: '/yayincilar', label: 'Yayıncılar', desc: 'Twitch, Kick, SOOP, YouTube, Bilibili, Douyin, Chzzk', color: '#3b82f6' },
    { href: '/toplantilar', label: 'Toplantılar', desc: 'Planlama ve notlar', color: '#14b8a6' },
    { href: '/notlar', label: 'Notlar', desc: 'Tüm notlar ve kayıtlar', color: '#EA580C' },
    { href: '/sosyal-medya', label: 'Sosyal Medya', desc: 'Twitter, Instagram, TikTok, YouTube', color: '#f59e0b' },
    { href: '/reddit', label: 'Reddit', desc: 'Hesaplar ve gönderiler', color: '#ef4444' },
    { href: '/butce', label: 'Bütçe Yönetimi', desc: 'Harcamalar ve planlama', color: '#22c55e' },
    { href: '/gamalytic', label: 'Gamalytic', desc: 'Oyun analitik platformu', color: '#4f46e5' },
    { href: '/news', label: 'News', desc: 'Oyun sektörü haberleri', color: '#d97706' },
  ]

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          padding: '28px 32px 24px',
          borderBottom: '1px solid #E0E0E0',
          backgroundColor: '#FFFFFF',
        }}
      >
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#111111', margin: 0 }}>
          Marketing Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '4px 0 0 0' }}>
          Tüm pazarlama faaliyetlerinize genel bakış
        </p>
      </div>

      <div style={{ padding: '28px 32px' }}>

        <AISearchBar />

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <StatCard
            label="Toplam Yayıncı"
            value={stats.totalStreamers}
            icon={Tv2}
            iconColor="#6D28D9"
            iconBg="rgba(124,58,237,0.12)"
          />
          <StatCard
            label="Platform / Partner"
            value={stats.platformCount}
            icon={Globe}
            iconColor="#2563EB"
            iconBg="rgba(59,130,246,0.12)"
          />
          <StatCard
            label="Toplantılar"
            value={stats.meetingCount}
            icon={Calendar}
            iconColor="#0D9488"
            iconBg="rgba(20,184,166,0.12)"
          />
          <StatCard
            label="Notlar"
            value={stats.noteCount}
            icon={FileText}
            iconColor="#EA580C"
            iconBg="rgba(249,115,22,0.12)"
          />
          <StatCard
            label="Reddit Hesabı"
            value={stats.redditCount}
            icon={MessageCircle}
            iconColor="#DC2626"
            iconBg="rgba(239,68,68,0.12)"
          />
          <StatCard
            label="Bütçe Kullanımı"
            value={`$${stats.totalExpenses.toLocaleString('en-US')}`}
            icon={DollarSign}
            iconColor="#16A34A"
            iconBg="rgba(34,197,94,0.12)"
            trend={`${formatCurrency(stats.totalExpenses)} / ${formatCurrency(stats.monthlyBudget)}`}
            trendUp={stats.budgetPercent < 80}
          />
        </div>

        {/* Budget progress bar */}
        {stats.monthlyBudget > 0 && (
          <div
            style={{
              backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '28px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#111111', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} color="#16A34A" />
                Aylık Bütçe Kullanımı
              </div>
              <div style={{ fontSize: '13px', color: '#444444' }}>
                <span style={{ color: stats.budgetPercent > 80 ? '#DC2626' : '#16A34A', fontWeight: 600 }}>
                  {formatCurrency(stats.totalExpenses)}
                </span>
                {' / '}
                {formatCurrency(stats.monthlyBudget)}
              </div>
            </div>
            <div
              style={{
                height: '8px',
                backgroundColor: '#E0E0E0',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(stats.budgetPercent, 100)}%`,
                  background: stats.budgetPercent > 80
                    ? 'linear-gradient(90deg, #ef4444, #DC2626)'
                    : 'linear-gradient(90deg, #22c55e, #16A34A)',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <div style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '6px' }}>
              %{stats.budgetPercent} kullanıldı
            </div>
          </div>
        )}

        {/* Budget distribution donut chart */}
        <div style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)', border: '1px solid #E0E0E0', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#111111', marginBottom: '2px' }}>Bütçe Dağılımı</div>
              <div style={{ fontSize: '12px', color: '#6B6B6B' }}>Platforma göre harcama dağılımı</div>
            </div>
            <BudgetExpenseModal accentColor="#22c55e" buttonLabel="+ Bütçe Ekle" />
          </div>
          <BudgetDonutChart data={stats.budgetChartData} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>

          {/* Recent meetings */}
          <div
            style={{
              backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E0E0E0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#111111', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={15} color="#0D9488" />
                Son Toplantılar
              </div>
              <Link
                href="/toplantilar"
                style={{ fontSize: '12px', color: '#111111', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Tümü <ArrowRight size={12} />
              </Link>
            </div>
            <div>
              {stats.recentMeetings.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#6B6B6B', fontSize: '13px' }}>
                  Henüz toplantı yok
                </div>
              ) : (
                stats.recentMeetings.map((m: Record<string, unknown>) => (
                  <div
                    key={String(m.id)}
                    style={{
                      padding: '12px 20px',
                      borderBottom: '1px solid #E5E5E5',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>{String(m.title ?? '—')}</div>
                      <div style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '2px' }}>{formatDate(m.date as string)}</div>
                    </div>
                    {m.status ? (
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(59,130,246,0.12)',
                          color: '#2563EB',
                          border: '1px solid rgba(59,130,246,0.25)',
                        }}
                      >
                        {String(m.status)}
                      </span>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent notes */}
          <div
            style={{
              backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E0E0E0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#111111', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={15} color="#EA580C" />
                Son Notlar
              </div>
              <Link
                href="/notlar"
                style={{ fontSize: '12px', color: '#111111', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Tümü <ArrowRight size={12} />
              </Link>
            </div>
            <div>
              {stats.recentNotes.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#6B6B6B', fontSize: '13px' }}>
                  Henüz not yok
                </div>
              ) : (
                stats.recentNotes.map((n: Record<string, unknown>) => (
                  <div
                    key={String(n.id)}
                    style={{
                      padding: '12px 20px',
                      borderBottom: '1px solid #E5E5E5',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>{String(n.title ?? '—')}</div>
                      <div style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '2px' }}>{formatDate(n.created_at as string)}</div>
                    </div>
                    {n.category ? (
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(249,115,22,0.12)',
                          color: '#EA580C',
                          border: '1px solid rgba(249,115,22,0.25)',
                        }}
                      >
                        {String(n.category)}
                      </span>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#444444', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={15} />
            Hızlı Erişim
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {quickLinks.map((ql) => (
              <QuickLinkCard
                key={ql.href}
                href={ql.href}
                label={ql.label}
                desc={ql.desc}
                color={ql.color}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
