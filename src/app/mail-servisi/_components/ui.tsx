import Badge from '@/components/Badge'
import { CAMPAIGN_STATUS_LABELS, RECIPIENT_STATUS_LABELS } from '@/lib/mail'

// Small shared UI bits for the Mail Servisi pages

export const MAIL_GRADIENT = 'linear-gradient(135deg, #f59e0b, #ef4444)'

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid #2a2a3a',
  backgroundColor: '#13131a',
  color: '#e2e8f0',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
}

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#94a3b8',
  marginBottom: '6px',
}

export function buttonStyle(variant: 'primary' | 'secondary' | 'danger' = 'primary', disabled = false): React.CSSProperties {
  const colors = {
    primary: { bg: '#7c3aed', color: '#fff', border: '#7c3aed' },
    secondary: { bg: 'transparent', color: '#cbd5e1', border: '#2a2a3a' },
    danger: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.3)' },
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
    <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden' }}>
      {title && (
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{title}</h2>
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
      <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: '#2a2a3a', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#7c3aed', transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{value}/{total}</span>
    </div>
  )
}

export function formatDateTime(v: string | null | undefined): string {
  if (!v) return '—'
  return new Date(v).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const thStyle: React.CSSProperties = {
  backgroundColor: '#13131a',
  color: '#64748b',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  padding: '11px 16px',
  textAlign: 'left',
  borderBottom: '1px solid #2a2a3a',
  whiteSpace: 'nowrap',
}

export const tdStyle: React.CSSProperties = {
  padding: '11px 16px',
  borderBottom: '1px solid #1f1f2c',
  fontSize: '13px',
  color: '#cbd5e1',
  verticalAlign: 'middle',
}
