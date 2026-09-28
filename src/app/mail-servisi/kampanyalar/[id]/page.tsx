import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Send } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { RECIPIENT_STATUS_LABELS, type MailCampaign, type MailRecipient } from '@/lib/mail'
import CancelCampaignButton from '../../_components/CancelCampaignButton'
import { Card, CampaignStatusBadge, ProgressBar, RecipientStatusBadge, MAIL_GRADIENT, buttonStyle, formatDateTime, thStyle, tdStyle } from '../../_components/ui'

// Campaign detail: every recipient with their status, send time and last error
type CampaignRow = MailCampaign & {
  mail_accounts: { email: string } | null
  mail_templates: { name: string } | null
}

export default async function KampanyaDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const [{ data: campaignData }, { data: recipientData, error: recipientError }] = await Promise.all([
    supabase.from('mail_campaigns').select('*, mail_accounts(email), mail_templates(name)').eq('id', id).maybeSingle(),
    supabase.from('mail_recipients').select('*').eq('campaign_id', id).order('created_at'),
  ])
  const campaign = campaignData as unknown as CampaignRow | null
  if (!campaign) notFound()
  const recipients = (recipientData ?? []) as MailRecipient[]

  const counts = new Map<string, number>()
  for (const r of recipients) counts.set(r.status, (counts.get(r.status) ?? 0) + 1)
  const withErrors = recipients.filter((r) => r.error_message).length

  return (
    <div>
      <PageHeader title={campaign.name} subtitle={`${recipients.length} alıcı`} icon={Send} gradient={MAIL_GRADIENT}>
        <Link href="/mail-servisi/kampanyalar" style={buttonStyle('secondary')}>
          <ArrowLeft size={15} /> Kampanyalar
        </Link>
      </PageHeader>

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Card>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CampaignStatusBadge status={campaign.status} />
              <CancelCampaignButton campaignId={campaign.id} campaignName={campaign.name} status={campaign.status} />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>
              {campaign.mail_accounts?.email ?? '—'} · {campaign.mail_templates?.name ?? '—'}
            </div>
            <div style={{ minWidth: '200px', flex: '1 1 200px' }}>
              <ProgressBar value={campaign.sent_count + campaign.bounce_count} total={campaign.total_recipients} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: 'var(--text-2)' }}>
              {[...counts.entries()].map(([status, n]) => (
                <span key={status}>{RECIPIENT_STATUS_LABELS[status] ?? status}: <strong style={{ color: 'var(--foreground)' }}>{n}</strong></span>
              ))}
              {withErrors > 0 && <span style={{ color: 'var(--danger)' }}>Hatalı: <strong>{withErrors}</strong></span>}
            </div>
          </div>
        </Card>

        <Card title="Alıcılar" padded={false}>
          {recipientError ? (
            <p style={{ padding: '20px', margin: 0, fontSize: '13px', color: 'var(--danger)' }}>Alıcılar yüklenemedi: {recipientError.message}</p>
          ) : recipients.length === 0 ? (
            <p style={{ padding: '20px', margin: 0, fontSize: '13px', color: 'var(--muted-foreground)' }}>Bu kampanyada alıcı yok.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>İsim</th>
                    <th style={thStyle}>Durum</th>
                    <th style={thStyle}>Gönderim</th>
                    <th style={thStyle}>Hata</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((r) => (
                    <tr key={r.id}>
                      <td style={{ ...tdStyle, fontSize: '13px' }}>{r.email}</td>
                      <td style={{ ...tdStyle, fontSize: '13px' }}>{r.name ?? '—'}</td>
                      <td style={tdStyle}><RecipientStatusBadge status={r.status} /></td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{formatDateTime(r.sent_at)}</td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: r.error_message ? 'var(--danger)' : 'var(--muted-foreground)', maxWidth: '360px', overflowWrap: 'anywhere' }}>
                        {r.error_message ?? '—'}
                      </td>
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
