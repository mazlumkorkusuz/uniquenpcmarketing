type BadgeVariant = 'green' | 'purple' | 'blue' | 'orange' | 'red' | 'gray' | 'teal'

const styles: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  green:  { bg: 'rgba(34,197,94,0.1)',  color: '#3DD68C', border: 'rgba(34,197,94,0.2)' },
  purple: { bg: 'rgba(124,58,237,0.1)', color: '#BAA7FF', border: 'rgba(124,58,237,0.2)' },
  blue:   { bg: 'rgba(59,130,246,0.1)', color: '#70B8FF', border: 'rgba(59,130,246,0.2)' },
  orange: { bg: 'rgba(249,115,22,0.1)', color: '#FF8B3E', border: 'rgba(249,115,22,0.2)' },
  red:    { bg: 'rgba(239,68,68,0.1)',  color: '#FF6369', border: 'rgba(239,68,68,0.2)' },
  gray:   { bg: 'rgba(100,116,139,0.1)',color: '#B4B4B4', border: 'rgba(100,116,139,0.2)' },
  teal:   { bg: 'rgba(20,184,166,0.1)', color: '#0BD8B6', border: 'rgba(20,184,166,0.2)' },
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
        padding: '2px 8px',
        borderRadius: '6px',
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
