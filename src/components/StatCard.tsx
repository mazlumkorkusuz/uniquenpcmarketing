import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  iconColor: string
  iconBg: string
  trend?: string
  trendUp?: boolean
}

export default function StatCard({ label, value, icon: Icon, iconColor, iconBg, trend, trendUp }: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        border: '1px solid #E0E0E0',
        borderLeft: `3px solid ${iconColor}`,
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        transition: 'border-color 0.2s',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          backgroundColor: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={20} color={iconColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', color: '#6B6B6B', fontWeight: 500, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </div>
        <div style={{ fontSize: '26px', fontWeight: 700, color: '#111111', lineHeight: 1 }}>
          {value}
        </div>
        {trend && (
          <div style={{ fontSize: '12px', color: trendUp ? '#0D9488' : '#DC2626', marginTop: '4px' }}>
            {trendUp ? '↑' : '↓'} {trend}
          </div>
        )}
      </div>
    </div>
  )
}
