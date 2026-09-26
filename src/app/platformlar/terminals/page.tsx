export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import Badge from '@/components/Badge'
import { Globe, ExternalLink, FileText, Zap, Users, Target } from 'lucide-react'
import Link from 'next/link'
import { inkOf } from '@/lib/theme'

async function getData() {
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .ilike('category', '%terminals%')
    .order('created_at', { ascending: false })
  return { notes: notes ?? [] }
}

function dateCell(v: unknown) {
  if (!v) return <span style={{ color: '#655F7D' }}>—</span>
  return (
    <span style={{ fontSize: '12px', color: '#655F7D' }}>
      {new Date(v as string).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
    </span>
  )
}

export default async function TerminalsPage() {
  const { notes } = await getData()

  const noteCols = [
    { key: 'title', label: 'Başlık', render: (v: unknown) => <span style={{ fontWeight: 600, color: '#17122B' }}>{String(v ?? '—')}</span> },
    { key: 'content', label: 'İçerik', render: (v: unknown) => {
      const s = String(v ?? '')
      return <span style={{ fontSize: '12.5px', color: '#4A4462' }}>{s.length > 80 ? s.slice(0, 80) + '…' : s || <span style={{ color: '#655F7D' }}>—</span>}</span>
    }},
    { key: 'tags', label: 'Etiketler', render: (v: unknown) => {
      if (!v) return <span style={{ color: '#655F7D' }}>—</span>
      return (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {String(v).split(',').map(t => t.trim()).filter(Boolean).map((t, i) => <Badge key={i} variant="teal">{t}</Badge>)}
        </div>
      )
    }},
    { key: 'created_at', label: 'Tarih', render: dateCell },
  ]

  const stats = [
    { label: 'Platform', value: 'Terminals.io', color: '#1D4ED8', icon: Globe },
    { label: 'Odak', value: 'Yayıncı', color: '#1D4ED8', icon: Users },
    { label: 'Kapsam', value: 'Global', color: '#047857', icon: Target },
    { label: 'Notlar', value: notes.length, color: '#6D28D9', icon: FileText },
  ]

  return (
    <div>
      <PageHeader
        title="Terminals.io"
        subtitle="Oyun yayıncıları ve içerik üreticileri için büyüme platformu"
        icon={Zap}
        gradient="linear-gradient(135deg, #7C3AED, #6D28D9)"
      >
        <a
          href="https://terminals.io"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: '#F0FDFA',
            border: '1px solid #D8D2E6',
            color: '#1D4ED8',
            fontWeight: 600,
            fontSize: '14px',
            textDecoration: 'none',
          }}
        >
          <ExternalLink size={14} />
          terminals.io
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
                  border: '1px solid #E8E4F1',
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
                    borderRadius: '12px',
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
                  <div style={{ fontSize: '12px', color: '#655F7D', fontWeight: 500, marginBottom: '4px' }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em', fontWeight: 600, color: inkOf(s.color) }}>{s.value}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* About section */}
        <div
          style={{
            backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)',
            border: '1px solid #E8E4F1',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', letterSpacing: '-0.01em', fontWeight: 600, color: '#17122B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0F766E', boxShadow: 'none', display: 'inline-block' }} />
                Terminals.io Hakkında
              </div>
              <p style={{ fontSize: '14px', color: '#4A4462', lineHeight: 1.7, margin: 0 }}>
                Terminals.io, oyun yayıncıları ve içerik üreticileri için tasarlanmış bir büyüme platformudur.
                Yayıncıların topluluklarını büyütmelerine, sponsorluklara erişmelerine ve içerik stratejilerini
                optimize etmelerine yardımcı olan araçlar sunar.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
              <div style={{ fontSize: '12px', color: '#655F7D', fontWeight: 500, marginBottom: '4px' }}>
                Hızlı Erişim
              </div>
              {[
                { label: 'Dashboard', url: 'https://terminals.io/dashboard' },
                { label: 'Creators', url: 'https://terminals.io/creators' },
                { label: 'Analytics', url: 'https://terminals.io/analytics' },
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
                    borderRadius: '8px',
                    backgroundColor: '#F0FDFA',
                    border: '1px solid #E8E4F1',
                    color: '#1D4ED8',
                    fontSize: '14px',
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
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E8E4F1', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0F766E' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', letterSpacing: '-0.01em', fontWeight: 600, color: '#17122B' }}>Notlar</span>
            <span
              style={{
                marginLeft: 'auto',
                backgroundColor: '#F0FDFA',
                color: '#1D4ED8',
                border: '1px solid #D8D2E6',
                borderRadius: '9999px',
                padding: '2px 10px',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {notes.length}
            </span>
          </div>
          {notes.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <FileText size={28} color="#655F7D" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '14px', color: '#655F7D' }}>
                Henüz Terminals.io notu yok.{' '}
                <Link href="/notlar" style={{ color: '#1D4ED8', textDecoration: 'none' }}>
                  Notlar sayfasından
                </Link>
                {' '}kategori "Terminals.io" ile not ekleyin.
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
