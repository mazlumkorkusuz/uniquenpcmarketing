import { LucideIcon } from 'lucide-react'
import { inkOf } from '@/lib/theme'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  iconColor: string
  iconBg: string
  trend?: string
  trendUp?: boolean
}

// KPI tile in the dashboard's style: glass bento card, tinted icon chip, Space Grotesk number
export default function StatCard({ label, value, icon: Icon, iconColor, iconBg, trend, trendUp }: StatCardProps) {
  // Neon platform colors (Kick, Chzzk) are darkened so the icon keeps 3:1+ on the light chip
  const ink = inkOf(iconColor)
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--color-border-card)',
        borderRadius: '20px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          {label}
        </div>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '12px',
            backgroundColor: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={17} color={ink} strokeWidth={2} aria-hidden />
        </div>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--ink)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </div>
        {trend && (
          <div style={{ fontSize: '12.5px', fontWeight: 500, color: trendUp ? 'var(--ok)' : 'var(--danger)', marginTop: '8px' }}>
            {trendUp ? '↑' : '↓'} {trend}
          </div>
        )}
      </div>
    </div>
  )
}
