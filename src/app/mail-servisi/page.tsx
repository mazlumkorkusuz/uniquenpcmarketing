import Link from 'next/link'
import { Mail, Send, MailOpen, Reply, AlertTriangle, Users, Plus } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import Badge from '@/components/Badge'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { MAIL_ACCOUNT_PUBLIC_COLUMNS, percent, type MailAccount, type MailCampaign } from '@/lib/mail'
import { Card, CampaignStatusBadge, ProgressBar, MAIL_GRADIENT, buttonStyle, formatDateTime, thStyle, tdStyle } from './_components/ui'

async function getData() {
  const supabase = await createSupabaseServerClient()
  const [{ data: accounts }, { data: campaigns }] = await Promise.all([
    supabase.from('mail_accounts').select(MAIL_ACCOUNT_PUBLIC_COLUMNS).order('created_at'),
    supabase.from('mail_campaigns').select('*').order('created_at', { ascending: false }),
  ])
  return {
    accounts: (accounts ?? []) as unknown as MailAccount[],
    campaigns: (campaigns ?? []) as MailCampaign[],
  }
}

export default async function MailServisiPage() {
  const { accounts, campaigns } = await getData()

  const sent = campaigns.reduce((s, c) => s + c.sent_count, 0)
  const opens = campaigns.reduce((s, c) => s + c.open_count, 0)
  const replies = campaigns.reduce((s, c) => s + c.reply_count, 0)
  const bounces = campaigns.reduce((s, c) => s + c.bounce_count, 0)
  const recent = campaigns.slice(0, 5)

  return (
    <div>
      <PageHeader title="Mail Servisi" subtitle="Yayıncı outreach kampanyaları" icon={Mail} gradient={MAIL_GRADIENT}>
        <Link href="/mail-servisi/kampanyalar/yeni" style={buttonStyle('primary')}>
          <Plus size={15} /> Yeni Kampanya
        </Link>
      </PageHeader>

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          <StatCard label="Kampanya" value={campaigns.length} icon={Users} iconColor="#BAA7FF" iconBg="rgba(124,58,237,0.15)" />
          <StatCard label="Gönderilen" value={sent.toLocaleString('tr-TR')} icon={Send} iconColor="#70B8FF" iconBg="rgba(59,130,246,0.15)" />
          <StatCard label="Açılma Oranı" value={percent(opens, sent)} icon={MailOpen} iconColor="#0BD8B6" iconBg="rgba(20,184,166,0.15)" />
          <StatCard label="Yanıt Oranı" value={percent(replies, sent)} icon={Reply} iconColor="#3DD68C" iconBg="rgba(34,197,94,0.15)" />
          <StatCard label="Bounce Oranı" value={percent(bounces, sent + bounces)} icon={AlertTriangle} iconColor="#FF6369" iconBg="rgba(239,68,68,0.15)" />
        </div>

        <Card
          title="Mail Hesapları"
          padded={false}
          action={<Link href="/mail-servisi/ayarlar" style={{ fontSize: '12px', color: '#EDEDED', fontWeight: 600, textDecoration: 'none' }}>Yönet →</Link>}
        >
          {accounts.length === 0 ? (
            <p style={{ padding: '20px', margin: 0, fontSize: '13px', color: '#8F8F8F' }}>
              Henüz hesap yok. <Link href="/mail-servisi/ayarlar" style={{ color: '#EDEDED', fontWeight: 600 }}>Ayarlar</Link> sayfasından SMTP hesabı ekleyin.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Hesap</th>
                    <th style={thStyle}>SMTP</th>
                    <th style={thStyle}>Bugün</th>
                    <th style={thStyle}>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: '#EDEDED' }}>{a.name}</div>
                        <div style={{ fontSize: '12px', color: '#8F8F8F' }}>{a.email}</div>
                      </td>
                      <td style={{ ...tdStyle, color: '#B4B4B4' }}>{a.smtp_host}:{a.smtp_port}</td>
                      <td style={tdStyle}><ProgressBar value={a.sent_today} total={a.daily_limit} /></td>
                      <td style={tdStyle}>
                        <Badge variant={a.status === 'active' ? 'green' : 'gray'}>{a.status === 'active' ? 'Aktif' : 'Pasif'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card
          title="Son Kampanyalar"
          padded={false}
          action={<Link href="/mail-servisi/kampanyalar" style={{ fontSize: '12px', color: '#EDEDED', fontWeight: 600, textDecoration: 'none' }}>Tümü →</Link>}
        >
          {recent.length === 0 ? (
            <p style={{ padding: '20px', margin: 0, fontSize: '13px', color: '#8F8F8F' }}>Henüz kampanya yok.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Kampanya</th>
                    <th style={thStyle}>Durum</th>
                    <th style={thStyle}>Gönderim</th>
                    <th style={thStyle}>Açılma</th>
                    <th style={thStyle}>Yanıt</th>
                    <th style={thStyle}>Oluşturulma</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((c) => (
                    <tr key={c.id}>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#EDEDED' }}>
                        <Link href={`/mail-servisi/tracking?campaign=${c.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{c.name}</Link>
                      </td>
                      <td style={tdStyle}><CampaignStatusBadge status={c.status} /></td>
                      <td style={tdStyle}><ProgressBar value={c.sent_count + c.bounce_count} total={c.total_recipients} /></td>
                      <td style={tdStyle}>{percent(c.open_count, c.sent_count)}</td>
                      <td style={tdStyle}>{percent(c.reply_count, c.sent_count)}</td>
                      <td style={{ ...tdStyle, color: '#8F8F8F', fontSize: '12px' }}>{formatDateTime(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
