type BadgeVariant = 'green' | 'purple' | 'blue' | 'orange' | 'red' | 'gray' | 'teal'

// MASTER status tag: tinted background + matching ink (4.5:1+), 6px dot
const styles: Record<BadgeVariant, { bg: string; color: string }> = {
  green:  { bg: '#ECFDF5', color: '#047857' },
  purple: { bg: '#F3EEFF', color: '#6D28D9' },
  blue:   { bg: '#EFF6FF', color: '#1D4ED8' },
  orange: { bg: '#FFF7ED', color: '#C2410C' },
  red:    { bg: '#FEF2F2', color: '#B91C1C' },
  gray:   { bg: '#F4F2F9', color: '#4A4462' },
  teal:   { bg: '#F0FDFA', color: '#0F766E' },
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
