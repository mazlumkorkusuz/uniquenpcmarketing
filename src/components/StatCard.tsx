import { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { inkOf } from '@/lib/theme'
import { HoverGlow } from '@/components/effects/Effects'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  iconColor: string
  iconBg: string
  trend?: string
  trendUp?: boolean
}

// Tremor-style KPI card on shadcn Card: label + icon chip, big metric, optional delta badge.
export default function StatCard({ label, value, icon: Icon, iconColor, iconBg, trend, trendUp }: StatCardProps) {
  const ink = inkOf(iconColor)
  return (
    <Card className="glass-card kpi-card gap-3 px-5 py-5">
      <HoverGlow />
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        <span
          className="grid size-9 shrink-0 place-items-center rounded-[10px]"
          style={{ backgroundColor: iconBg }}
          aria-hidden
        >
          <Icon size={17} color={ink} strokeWidth={2} />
        </span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <span className="font-heading text-[32px] leading-none font-semibold tracking-tight tabular-nums text-foreground">
          {value}
        </span>
        {trend && (
          <Badge
            variant="outline"
            className="h-6 rounded-md border-transparent px-2 text-xs font-semibold"
            style={{
              backgroundColor: trendUp ? 'var(--success-soft)' : 'var(--danger-soft)',
              color: trendUp ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {trendUp ? '↑' : '↓'} {trend}
          </Badge>
        )}
      </div>
    </Card>
  )
}
