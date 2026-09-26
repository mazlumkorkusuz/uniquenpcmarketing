export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import Badge from '@/components/Badge'
import { Star, ExternalLink, FileText, Users, Target, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { inkOf, tint } from '@/lib/theme'

async function getData() {
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .ilike('category', '%mythic%')
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

export default async function MythicTalentPage() {
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
          {String(v).split(',').map(t => t.trim()).filter(Boolean).map((t, i) => <Badge key={i} variant="purple">{t}</Badge>)}
        </div>
      )
    }},
    { key: 'created_at', label: 'Tarih', render: dateCell },
  ]

  const stats = [
    { label: 'Platform', value: 'Mythic Talent', color: 'var(--primary-ink)', icon: Star },
    { label: 'Odak', value: 'Talent Ajansı', color: 'var(--rose)', icon: Sparkles },
    { label: 'Kapsam', value: 'Global', color: 'var(--success)', icon: Target },
    { label: 'Notlar', value: notes.length, color: 'var(--primary-ink)', icon: FileText },
  ]

  return (
    <div>
      <PageHeader
        title="Mythic Talent"
        subtitle="Oyun içerik üreticileri için talent yönetim ajansı"
        icon={Users}
        gradient="linear-gradient(135deg, #8b5cf6, #ec4899)"
      >
        <a
          href="https://mythictalent.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)',
            color: 'var(--primary-ink)',
            fontWeight: 600,
            fontSize: '13px',
            textDecoration: 'none',
          }}
        >
          <ExternalLink size={14} />
          mythictalent.com
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
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', boxShadow: '0 0 8px #8b5cf680', display: 'inline-block' }} />
                Mythic Talent Hakkında
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7, margin: 0 }}>
                Mythic Talent, oyun dünyasındaki içerik üreticileri ve yayıncıları için uzmanlaşmış bir talent yönetim ajansıdır.
                Marka ortaklıkları, sponsorluklar ve kariyer gelişimi konularında içerik üreticilerine rehberlik ederek
                oyun şirketleri ile yaratıcılar arasında köprü kurar.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: 500, marginBottom: '4px' }}>
                Hızlı Erişim
              </div>
              {[
                { label: 'Ana Sayfa', url: 'https://mythictalent.com' },
                { label: 'Talent Roster', url: 'https://mythictalent.com/talent' },
                { label: 'İletişim', url: 'https://mythictalent.com/contact' },
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
                    backgroundColor: 'color-mix(in srgb, var(--primary) 8%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
                    color: 'var(--primary-ink)',
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
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>Notlar</span>
            <span
              style={{
                marginLeft: 'auto',
                backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                color: 'var(--primary-ink)',
                border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
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
                Henüz Mythic Talent notu yok.{' '}
                <Link href="/notlar" style={{ color: 'var(--primary-ink)', textDecoration: 'none' }}>
                  Notlar sayfasından
                </Link>
                {' '}kategori "Mythic Talent" ile not ekleyin.
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
