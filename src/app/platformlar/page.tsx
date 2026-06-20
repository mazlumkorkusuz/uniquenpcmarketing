export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import { statusBadge } from '@/components/Badge'
import { Globe, ExternalLink, ArrowRight, User } from 'lucide-react'
import Link from 'next/link'
import { PlatformModal, EditPlatformButton } from '@/components/PlatformModal'
import { DeleteButton } from '@/components/DeleteButton'

async function getData() {
  const { data: platforms } = await supabase
    .from('crm_platforms')
    .select('*')
    .order('created_at', { ascending: false })
  return { platforms: platforms ?? [] }
}

type Row = Record<string, unknown>

const TH: React.CSSProperties = {
  backgroundColor: '#13131a',
  color: '#64748b',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  padding: '12px 20px',
  textAlign: 'left',
  borderBottom: '1px solid #2a2a3a',
  whiteSpace: 'nowrap',
}

function WorkTopicBadges({ value }: { value: unknown }) {
  if (!value) return <span style={{ color: '#64748b' }}>—</span>
  const topics = String(value).split(',').map(t => t.trim()).filter(Boolean)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
      {topics.map((t, i) => (
        <span key={i} style={{ fontSize: '12px', fontWeight: 600, color: '#60a5fa', backgroundColor: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.28)', borderRadius: '5px', padding: '2px 9px', whiteSpace: 'nowrap', cursor: 'default' }}>
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
      gradient: 'linear-gradient(135deg, #f97316, #dc2626)',
      color: '#f97316',
      dot: '#f97316',
    },
    {
      key: 'terminals',
      name: 'Terminals.io',
      desc: 'Oyun yayıncıları ve içerik üreticileri için büyüme platformu',
      href: '/platformlar/terminals',
      externalHref: 'https://terminals.io',
      gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
      color: '#06b6d4',
      dot: '#06b6d4',
    },
    {
      key: 'mythic-talent',
      name: 'Mythic Talent',
      desc: 'Oyun içerik üreticileri ve yayıncılar için talent yönetim ajansı',
      href: '/platformlar/mythic-talent',
      externalHref: 'https://mythictalent.com',
      gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
      color: '#8b5cf6',
      dot: '#8b5cf6',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Platformlar & Partnerler"
        subtitle="CRM platformları ve iş ortakları"
        icon={Globe}
        gradient="linear-gradient(135deg, #7c3aed, #3b82f6)"
      />
      <div style={{ padding: '24px 32px' }}>

        {/* Featured partner platforms */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
            Entegre Platformlar
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {featuredPlatforms.map((p) => (
              <div
                key={p.key}
                style={{
                  backgroundColor: '#1a1a24',
                  border: '1px solid #2a2a3a',
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
                      <div style={{ fontSize: '17px', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: p.dot,
                            display: 'inline-block',
                            boxShadow: `0 0 8px ${p.dot}80`,
                            flexShrink: 0,
                          }}
                        />
                        {p.name}
                      </div>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: '6px 0 0 0', lineHeight: 1.5 }}>{p.desc}</p>
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
                        backgroundColor: p.color + '18',
                        border: `1px solid ${p.color}35`,
                        color: p.color,
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
                        border: '1px solid #2a2a3a',
                        color: '#64748b',
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
            backgroundColor: '#1a1a24',
            border: '1px solid #2a2a3a',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #2a2a3a',
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
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>CRM Platformları</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>İş ortağı platformlar</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  backgroundColor: '#3b82f620',
                  color: '#3b82f6',
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
                    <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      Henüz platform eklenmemiş
                    </td>
                  </tr>
                ) : (platforms as Row[]).map((p, i) => (
                  <tr
                    key={String(p.id ?? i)}
                    style={{
                      backgroundColor: i % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent',
                      borderBottom: i < platforms.length - 1 ? '1px solid rgba(42,42,58,0.5)' : 'none',
                    }}
                  >
                    <td style={{ padding: '16px 20px', minWidth: '160px' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#f1f5f9' }}>{p.name ? String(p.name) : '—'}</div>
                      {p.type && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{String(p.type)}</div>}
                    </td>
                    <td style={{ padding: '16px 20px', minWidth: '200px' }}>
                      <WorkTopicBadges value={p.work_topic} />
                    </td>
                    <td style={{ padding: '16px 20px', minWidth: '220px', maxWidth: '320px' }}>
                      {p.details ? (
                        <span style={{
                          fontSize: '13px',
                          color: '#94a3b8',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.55,
                        } as React.CSSProperties}>
                          {String(p.details)}
                        </span>
                      ) : <span style={{ color: '#64748b' }}>—</span>}
                    </td>
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                      {p.last_edited_by ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '13px' }}>
                          <User size={13} color="#64748b" />
                          {String(p.last_edited_by)}
                        </div>
                      ) : <span style={{ color: '#64748b' }}>—</span>}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {statusBadge(String(p.status ?? '')) ?? <span style={{ color: '#64748b' }}>—</span>}
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
