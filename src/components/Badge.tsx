type BadgeVariant = 'green' | 'purple' | 'blue' | 'orange' | 'red' | 'gray' | 'teal'

// MASTER status tag: tinted background + matching ink (4.5:1+), 6px dot
const styles: Record<BadgeVariant, { bg: string; color: string }> = {
  green:  { bg: '#ECFDF5', color: 'var(--success)' },
  purple: { bg: 'var(--primary-soft)', color: 'var(--primary-ink)' },
  blue:   { bg: '#EFF6FF', color: 'var(--info)' },
  orange: { bg: '#FFF7ED', color: 'var(--orange)' },
  red:    { bg: '#FEF2F2', color: 'var(--danger)' },
  gray:   { bg: 'var(--muted)', color: 'var(--text-2)' },
  teal:   { bg: '#F0FDFA', color: 'var(--teal)' },
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
        gap: '6px',
        padding: '3px 8px',
        borderRadius: 'var(--r-sm)',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: s.bg,
        color: s.color,
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor', flexShrink: 0 }} />
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
