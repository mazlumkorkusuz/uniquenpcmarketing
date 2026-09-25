export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import Badge from '@/components/Badge'
import { Globe, ExternalLink, FileText, TrendingUp, Users, Target } from 'lucide-react'
import Link from 'next/link'

async function getData() {
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .ilike('category', '%lurkit%')
    .order('created_at', { ascending: false })
  return { notes: notes ?? [] }
}

function dateCell(v: unknown) {
  if (!v) return <span style={{ color: '#8F8F8F' }}>—</span>
  return (
    <span style={{ fontSize: '12px', color: '#8F8F8F' }}>
      {new Date(v as string).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
    </span>
  )
}

export default async function LurkitPage() {
  const { notes } = await getData()

  const noteCols = [
    { key: 'title', label: 'Başlık', render: (v: unknown) => <span style={{ fontWeight: 600, color: '#EDEDED' }}>{String(v ?? '—')}</span> },
    { key: 'content', label: 'İçerik', render: (v: unknown) => {
      const s = String(v ?? '')
      return <span style={{ fontSize: '13px', color: '#B4B4B4' }}>{s.length > 80 ? s.slice(0, 80) + '…' : s || <span style={{ color: '#8F8F8F' }}>—</span>}</span>
    }},
    { key: 'tags', label: 'Etiketler', render: (v: unknown) => {
      if (!v) return <span style={{ color: '#8F8F8F' }}>—</span>
      return (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {String(v).split(',').map(t => t.trim()).filter(Boolean).map((t, i) => <Badge key={i} variant="orange">{t}</Badge>)}
        </div>
      )
    }},
    { key: 'created_at', label: 'Tarih', render: dateCell },
  ]

  const stats = [
    { label: 'Platform', value: 'Lurkit', color: '#f97316', icon: Globe },
    { label: 'Odak', value: 'Influencer', color: '#f59e0b', icon: Users },
    { label: 'Kapsam', value: 'Global', color: '#3DD68C', icon: Target },
    { label: 'Notlar', value: notes.length, color: '#BAA7FF', icon: FileText },
  ]

  return (
    <div>
      <PageHeader
        title="Lurkit"
        subtitle="Oyun influencer ve kampanya yönetim platformu"
        icon={TrendingUp}
        gradient="linear-gradient(135deg, #f97316, #FF6369)"
      >
        <a
          href="https://lurkit.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(249,115,22,0.15)',
            border: '1px solid rgba(249,115,22,0.35)',
            color: '#f97316',
            fontWeight: 600,
            fontSize: '13px',
            textDecoration: 'none',
          }}
        >
          <ExternalLink size={14} />
          lurkit.com
        </a>
      </PageHeader>

      <div style={{ padding: '24px 32px' }}>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.label}
                style={{
                  backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)',
                  border: '1px solid #262626',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: s.color + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color={s.color} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#8F8F8F', fontWeight: 500, marginBottom: '4px' }}>{s.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* About section */}
        <div
          style={{
            backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)',
            border: '1px solid #262626',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#EDEDED', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f97316', boxShadow: '0 0 8px #f9731680', display: 'inline-block' }} />
                Lurkit Hakkında
              </div>
              <p style={{ fontSize: '14px', color: '#B4B4B4', lineHeight: 1.7, margin: 0 }}>
                Lurkit, oyun stüdyolarının influencer kampanyalarını yönetmesine yardımcı olan bir pazarlama platformudur.
                Twitch, YouTube ve diğer platformlardaki içerik üreticileriyle kampanya yönetimi, performans takibi ve raporlama
                araçları sunar.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
              <div style={{ fontSize: '12px', color: '#8F8F8F', fontWeight: 500, marginBottom: '4px' }}>
                Hızlı Erişim
              </div>
              {[
                { label: 'Dashboard', url: 'https://lurkit.com/dashboard' },
                { label: 'Kampanyalar', url: 'https://lurkit.com/campaigns' },
                { label: 'Raporlar', url: 'https://lurkit.com/reports' },
              ].map((l) => (
                <a
                  key={l.label}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 12px',
                    borderRadius: '7px',
                    backgroundColor: 'rgba(249,115,22,0.08)',
                    border: '1px solid rgba(249,115,22,0.2)',
                    color: '#f97316',
                    fontSize: '13px',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  <ExternalLink size={12} />
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #262626', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f97316' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#EDEDED' }}>Notlar</span>
            <span
              style={{
                marginLeft: 'auto',
                backgroundColor: 'rgba(249,115,22,0.12)',
                color: '#f97316',
                border: '1px solid rgba(249,115,22,0.3)',
                borderRadius: '9999px',
                padding: '2px 10px',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {notes.length}
            </span>
          </div>
          {notes.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <FileText size={28} color="#262626" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '14px', color: '#8F8F8F' }}>
                Henüz Lurkit notu yok.{' '}
                <Link href="/notlar" style={{ color: '#f97316', textDecoration: 'none' }}>
                  Notlar sayfasından
                </Link>
                {' '}kategori "Lurkit" ile not ekleyin.
              </div>
            </div>
          ) : (
            <DataTable columns={noteCols} data={notes} emptyMessage="Not bulunamadı" />
          )}
        </div>
      </div>
    </div>
  )
}
