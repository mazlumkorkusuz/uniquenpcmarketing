export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import Badge from '@/components/Badge'
import { Globe, ExternalLink, FileText, TrendingUp, Users, Target } from 'lucide-react'
import Link from 'next/link'
import { inkOf, tint } from '@/lib/theme'

async function getData() {
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .ilike('category', '%lurkit%')
    .order('created_at', { ascending: false })
  return { notes: notes ?? [] }
}

function dateCell(v: unknown) {
  if (!v) return <span style={{ color: 'var(--muted-foreground)' }}>—</span>
  return (
    <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
      {new Date(v as string).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
    </span>
  )
}

export default async function LurkitPage() {
  const { notes } = await getData()

  const noteCols = [
    { key: 'title', label: 'Başlık', render: (v: unknown) => <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{String(v ?? '—')}</span> },
    { key: 'content', label: 'İçerik', render: (v: unknown) => {
      const s = String(v ?? '')
      return <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{s.length > 80 ? s.slice(0, 80) + '…' : s || <span style={{ color: 'var(--muted-foreground)' }}>—</span>}</span>
    }},
    { key: 'tags', label: 'Etiketler', render: (v: unknown) => {
      if (!v) return <span style={{ color: 'var(--muted-foreground)' }}>—</span>
      return (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {String(v).split(',').map(t => t.trim()).filter(Boolean).map((t, i) => <Badge key={i} variant="orange">{t}</Badge>)}
        </div>
      )
    }},
    { key: 'created_at', label: 'Tarih', render: dateCell },
  ]

  const stats = [
    { label: 'Platform', value: 'Lurkit', color: 'var(--orange)', icon: Globe },
    { label: 'Odak', value: 'Influencer', color: 'var(--orange)', icon: Users },
    { label: 'Kapsam', value: 'Global', color: 'var(--success)', icon: Target },
    { label: 'Notlar', value: notes.length, color: 'var(--primary-ink)', icon: FileText },
  ]

  return (
    <div>
      <PageHeader
        title="Lurkit"
        subtitle="Oyun influencer ve kampanya yönetim platformu"
        icon={TrendingUp}
        gradient="linear-gradient(135deg, #f97316, #B91C1C)"
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
            backgroundColor: 'color-mix(in srgb, var(--orange) 15%, transparent)',
            border: '1px solid color-mix(in srgb, var(--orange) 35%, transparent)',
            color: 'var(--orange)',
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
                  border: '1px solid var(--border)',
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
                    backgroundColor: tint(s.color, 13),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color={s.color} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: 500, marginBottom: '4px' }}>{s.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: inkOf(s.color) }}>{s.value}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* About section */}
        <div
          style={{
            backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--orange)', boxShadow: '0 0 8px #f9731680', display: 'inline-block' }} />
                Lurkit Hakkında
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7, margin: 0 }}>
                Lurkit, oyun stüdyolarının influencer kampanyalarını yönetmesine yardımcı olan bir pazarlama platformudur.
                Twitch, YouTube ve diğer platformlardaki içerik üreticileriyle kampanya yönetimi, performans takibi ve raporlama
                araçları sunar.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: 500, marginBottom: '4px' }}>
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
                    backgroundColor: 'color-mix(in srgb, var(--orange) 8%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--orange) 20%, transparent)',
                    color: 'var(--orange)',
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
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--orange)' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>Notlar</span>
            <span
              style={{
                marginLeft: 'auto',
                backgroundColor: 'color-mix(in srgb, var(--orange) 12%, transparent)',
                color: 'var(--orange)',
                border: '1px solid color-mix(in srgb, var(--orange) 30%, transparent)',
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
              <FileText size={28} color="var(--muted-foreground)" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
                Henüz Lurkit notu yok.{' '}
                <Link href="/notlar" style={{ color: 'var(--orange)', textDecoration: 'none' }}>
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
