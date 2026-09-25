import Badge from '@/components/Badge'
import { CAMPAIGN_STATUS_LABELS, RECIPIENT_STATUS_LABELS } from '@/lib/mail'

// Small shared UI bits for the Mail Servisi pages

export const MAIL_GRADIENT = 'linear-gradient(135deg, #f59e0b, #ef4444)'

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid #262626',
  backgroundColor: '#0A0A0A',
  color: '#EDEDED',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
}

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#B4B4B4',
  marginBottom: '6px',
}

export function buttonStyle(variant: 'primary' | 'secondary' | 'danger' = 'primary', disabled = false): React.CSSProperties {
  const colors = {
    primary: { bg: '#EDEDED', color: '#0A0A0A', border: '#EDEDED' },
    secondary: { bg: '#0A0A0A', color: '#EDEDED', border: '#EDEDED' },
    danger: { bg: '#EF4444', color: '#0A0A0A', border: '#EF4444' },
  }[variant]
  return {
    padding: '9px 16px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
    color: colors.color,
    fontSize: '13px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  }
}

export function Card({ title, action, children, padded = true }: {
  title?: string
  action?: React.ReactNode
  children: React.ReactNode
  padded?: boolean
}) {
  return (
    <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', overflow: 'hidden' }}>
      {title && (
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #262626', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#EDEDED', margin: 0 }}>{title}</h2>
          {action}
        </div>
      )}
      <div style={padded ? { padding: '20px' } : undefined}>{children}</div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  )
}

export function CampaignStatusBadge({ status }: { status: string }) {
  const variant = status === 'completed' ? 'green' : status === 'sending' ? 'blue' : status === 'paused' ? 'orange' : 'gray'
  return <Badge variant={variant}>{CAMPAIGN_STATUS_LABELS[status] ?? status}</Badge>
}

export function RecipientStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'replied' ? 'green'
    : status === 'opened' ? 'teal'
    : status === 'sent' ? 'blue'
    : status === 'bounced' || status === 'failed' ? 'red'
    : 'gray'
  return <Badge variant={variant}>{RECIPIENT_STATUS_LABELS[status] ?? status}</Badge>
}

export function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total ? Math.min(100, (value / total) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
      <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: '#262626', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#EDEDED', transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: '12px', color: '#B4B4B4', whiteSpace: 'nowrap' }}>{value}/{total}</span>
    </div>
  )
}

export function formatDateTime(v: string | null | undefined): string {
  if (!v) return '—'
  return new Date(v).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const thStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-bg-section)',
  color: '#8F8F8F',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.06em',
  padding: '11px 16px',
  textAlign: 'left',
  borderBottom: '1px solid #262626',
  whiteSpace: 'nowrap',
}

export const tdStyle: React.CSSProperties = {
  padding: '11px 16px',
  borderBottom: '1px solid #1F1F1F',
  fontSize: '13px',
  color: '#B4B4B4',
  verticalAlign: 'middle',
}
