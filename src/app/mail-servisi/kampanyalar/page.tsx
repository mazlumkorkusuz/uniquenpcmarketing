import Link from 'next/link'
import { Send, Plus } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { percent, type MailCampaign } from '@/lib/mail'
import { Card, CampaignStatusBadge, ProgressBar, MAIL_GRADIENT, buttonStyle, formatDateTime, thStyle, tdStyle } from '../_components/ui'

type CampaignRow = MailCampaign & {
  mail_accounts: { email: string } | null
  mail_templates: { name: string } | null
}

export default async function KampanyalarPage() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('mail_campaigns')
    .select('*, mail_accounts(email), mail_templates(name)')
    .order('created_at', { ascending: false })
  const campaigns = (data ?? []) as unknown as CampaignRow[]

  return (
    <div>
      <PageHeader title="Kampanyalar" subtitle={`${campaigns.length} kampanya`} icon={Send} gradient={MAIL_GRADIENT}>
        <Link href="/mail-servisi/kampanyalar/yeni" style={buttonStyle('primary')}>
          <Plus size={15} /> Yeni Kampanya
        </Link>
      </PageHeader>

      <div style={{ padding: '24px 32px' }}>
        <Card padded={false}>
          {campaigns.length === 0 ? (
            <p style={{ padding: '20px', margin: 0, fontSize: '13px', color: '#64748b' }}>Henüz kampanya yok.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Kampanya</th>
                    <th style={thStyle}>Durum</th>
                    <th style={thStyle}>Hesap / Şablon</th>
                    <th style={thStyle}>Gönderim</th>
                    <th style={thStyle}>Açılma</th>
                    <th style={thStyle}>Yanıt</th>
                    <th style={thStyle}>Bounce</th>
                    <th style={thStyle}>Başlangıç</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => {
                    const done = c.sent_count + c.bounce_count
                    const canResume = c.status !== 'completed' && done < c.total_recipients
                    return (
                      <tr key={c.id}>
                        <td style={{ ...tdStyle, fontWeight: 600, color: '#e2e8f0' }}>{c.name}</td>
                        <td style={tdStyle}><CampaignStatusBadge status={c.status} /></td>
                        <td style={tdStyle}>
                          <div style={{ fontSize: '12px' }}>{c.mail_accounts?.email ?? '—'}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{c.mail_templates?.name ?? '—'}</div>
                        </td>
                        <td style={tdStyle}><ProgressBar value={done} total={c.total_recipients} /></td>
                        <td style={tdStyle}>{c.open_count} <span style={{ color: '#64748b' }}>({percent(c.open_count, c.sent_count)})</span></td>
                        <td style={tdStyle}>{c.reply_count} <span style={{ color: '#64748b' }}>({percent(c.reply_count, c.sent_count)})</span></td>
                        <td style={tdStyle}>{c.bounce_count}</td>
                        <td style={{ ...tdStyle, fontSize: '12px', color: '#64748b' }}>{formatDateTime(c.started_at)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            {canResume && (
                              <Link href={`/mail-servisi/kampanyalar/yeni?resume=${c.id}`} style={{ ...buttonStyle('primary'), padding: '6px 10px', fontSize: '12px' }}>
                                Devam Et
                              </Link>
                            )}
                            <Link href={`/mail-servisi/tracking?campaign=${c.id}`} style={{ ...buttonStyle('secondary'), padding: '6px 10px', fontSize: '12px' }}>
                              Tracking
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
