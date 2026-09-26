import { Badge as UIBadge } from '@/components/ui/badge'

type BadgeVariant = 'green' | 'purple' | 'blue' | 'orange' | 'red' | 'gray' | 'teal'

// Status badge on shadcn Badge: a soft tint of the status colour with its ink and a dot.
const styles: Record<BadgeVariant, { bg: string; color: string }> = {
  green:  { bg: 'var(--success-soft)', color: 'var(--success)' },
  purple: { bg: 'var(--primary-soft)', color: 'var(--primary-ink)' },
  blue:   { bg: 'var(--info-soft)',    color: 'var(--info)' },
  orange: { bg: 'var(--orange-soft)',  color: 'var(--orange)' },
  red:    { bg: 'var(--danger-soft)',  color: 'var(--danger)' },
  gray:   { bg: 'var(--muted)',        color: 'var(--text-2)' },
  teal:   { bg: 'var(--teal-soft)',    color: 'var(--teal)' },
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
}

export default function Badge({ variant = 'gray', children }: BadgeProps) {
  const s = styles[variant]
  return (
    <UIBadge
      variant="outline"
      className="h-6 gap-1.5 rounded-md border-transparent px-2 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </UIBadge>
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
