type BadgeVariant = 'green' | 'purple' | 'blue' | 'orange' | 'red' | 'gray' | 'teal'

const styles: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  green:  { bg: 'rgba(34,197,94,0.12)',  color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  purple: { bg: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: 'rgba(124,58,237,0.3)' },
  blue:   { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  orange: { bg: 'rgba(249,115,22,0.12)', color: '#fb923c', border: 'rgba(249,115,22,0.3)' },
  red:    { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.3)' },
  gray:   { bg: 'rgba(100,116,139,0.12)',color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
  teal:   { bg: 'rgba(20,184,166,0.12)', color: '#2dd4bf', border: 'rgba(20,184,166,0.3)' },
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
}

export default function Badge({ variant = 'gray', children }: BadgeProps) {
  const s = styles[variant]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

export function statusBadge(status?: string) {
  if (!status) return null
  const s = status.toLowerCase()
  const variant: BadgeVariant =
    s === 'aktif' || s === 'active' || s === 'tamamlandı' || s === 'completed' ? 'green'
    : s === 'beklemede' || s === 'pending' ? 'orange'
    : s === 'iptal' || s === 'cancelled' || s === 'inactive' ? 'red'
    : s === 'devam ediyor' || s === 'ongoing' || s === 'in_progress' ? 'blue'
    : s === 'öncelikli' || s === 'priority' ? 'purple'
    : 'gray'
  return <Badge variant={variant}>{status}</Badge>
}
