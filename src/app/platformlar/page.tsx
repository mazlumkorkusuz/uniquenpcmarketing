export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import { statusBadge } from '@/components/Badge'
import { Globe, ExternalLink, ArrowRight, User } from 'lucide-react'
import Link from 'next/link'
import { PlatformModal, EditPlatformButton } from '@/components/PlatformModal'
import { DeleteButton } from '@/components/DeleteButton'
import { inkOf, tint } from '@/lib/theme'

async function getData() {
  const { data: platforms } = await supabase
    .from('crm_platforms')
    .select('*')
    .order('created_at', { ascending: false })
  return { platforms: platforms ?? [] }
}

type Row = Record<string, unknown>

const TH: React.CSSProperties = {
  backgroundColor: 'var(--color-bg-section)',
  color: 'var(--muted-foreground)',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.06em',
  padding: '12px 20px',
  textAlign: 'left',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
}

function WorkTopicBadges({ value }: { value: unknown }) {
  if (!value) return <span style={{ color: 'var(--muted-foreground)' }}>—</span>
  const topics = String(value).split(',').map(t => t.trim()).filter(Boolean)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
      {topics.map((t, i) => (
        <span key={i} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--info)', backgroundColor: 'color-mix(in srgb, var(--info) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--info) 28%, transparent)', borderRadius: '5px', padding: '2px 9px', whiteSpace: 'nowrap', cursor: 'default' }}>
          {t}
        </span>
      ))}
    </div>
  )
}

export default async function PlatformlarPage() {
  const { platforms } = await getData()

  const featuredPlatforms = [
    {
      key: 'lurkit',
      name: 'Lurkit',
      desc: 'Oyun pazarlama ve influencer kampanya yönetim platformu',
      href: '/platformlar/lurkit',
      externalHref: 'https://lurkit.com',
      gradient: 'linear-gradient(135deg, #f97316, #B91C1C)',
      color: 'var(--orange)',
      dot: 'var(--orange)',
    },
    {
      key: 'terminals',
      name: 'Terminals.io',
      desc: 'Oyun yayıncıları ve içerik üreticileri için büyüme platformu',
      href: '/platformlar/terminals',
      externalHref: 'https://terminals.io',
      gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
      color: 'var(--info)',
      dot: 'var(--teal)',
    },
    {
      key: 'mythic-talent',
      name: 'Mythic Talent',
      desc: 'Oyun içerik üreticileri ve yayıncılar için talent yönetim ajansı',
      href: '/platformlar/mythic-talent',
      externalHref: 'https://mythictalent.com',
      gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
      color: 'var(--primary-ink)',
      dot: 'var(--primary-ink)',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Platformlar & Partnerler"
        subtitle="CRM platformları ve iş ortakları"
        icon={Globe}
        gradient="linear-gradient(135deg, #6D28D9, #3b82f6)"
      />
      <div style={{ padding: '24px 32px' }}>

        {/* Featured partner platforms */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '14px' }}>
            Entegre Platformlar
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {featuredPlatforms.map((p) => (
              <div
                key={p.key}
                style={{
                  backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Card top accent bar */}
                <div style={{ height: '3px', background: p.gradient }} />
                <div style={{ padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: p.dot,
                            display: 'inline-block',
                            boxShadow: `0 0 8px ${tint(p.dot, 50)}`,
                            flexShrink: 0,
                          }}
                        />
                        {p.name}
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: '6px 0 0 0', lineHeight: 1.5 }}>{p.desc}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <Link
                      href={p.href}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '9px 14px',
                        borderRadius: '8px',
                        backgroundColor: tint(p.color, 9),
                        border: `1px solid ${tint(p.color, 21)}`,
                        color: inkOf(p.color),
                        fontWeight: 600,
                        fontSize: '13px',
                        textDecoration: 'none',
                      }}
                    >
                      Dashboard'a Git <ArrowRight size={14} />
                    </Link>
                    <a
                      href={p.externalHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 14px',
                        borderRadius: '8px',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--border)',
                        color: 'var(--muted-foreground)',
                        fontWeight: 500,
                        fontSize: '13px',
                        textDecoration: 'none',
                      }}
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#3b82f620',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Globe size={16} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>CRM Platformları</div>
              <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>İş ortağı platformlar</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  backgroundColor: '#3b82f620',
                  color: 'var(--info)',
                  border: '1px solid #3b82f640',
                  borderRadius: '9999px',
                  padding: '2px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                {platforms.length}
              </div>
              <PlatformModal />
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TH}>Platform Adı</th>
                  <th style={TH}>Çalışma Konusu</th>
                  <th style={TH}>Detaylar / Notlar</th>
                  <th style={TH}>Son Düzenleyen</th>
                  <th style={TH}>Durum</th>
                  <th style={{ ...TH, width: '90px' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {platforms.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '14px' }}>
                      Henüz platform eklenmemiş
                    </td>
                  </tr>
                ) : (platforms as Row[]).map((p, i) => (
                  <tr
                    key={String(p.id ?? i)}
                    style={{
                      backgroundColor: i % 2 === 1 ? 'var(--row)' : 'transparent',
                      borderBottom: i < platforms.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <td style={{ padding: '16px 20px', minWidth: '160px' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--foreground)' }}>{p.name ? String(p.name) : '—'}</div>
                      {!!p.type && <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>{String(p.type)}</div>}
                    </td>
                    <td style={{ padding: '16px 20px', minWidth: '200px' }}>
                      <WorkTopicBadges value={p.work_topic} />
                    </td>
                    <td style={{ padding: '16px 20px', minWidth: '220px', maxWidth: '320px' }}>
                      {p.details ? (
                        <span style={{
                          fontSize: '13px',
                          color: 'var(--text-2)',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.55,
                        } as React.CSSProperties}>
                          {String(p.details)}
                        </span>
                      ) : <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                    </td>
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                      {p.last_edited_by ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-2)', fontSize: '13px' }}>
                          <User size={13} color="#655F7D" />
                          {String(p.last_edited_by)}
                        </div>
                      ) : <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {statusBadge(String(p.status ?? '')) ?? <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <EditPlatformButton row={p} />
                        <DeleteButton table="crm_platforms" id={p.id as string} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
