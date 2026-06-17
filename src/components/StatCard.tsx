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
        backgroundColor: '#1a1a24',
        border: '1px solid #2a2a3a',
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
        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </div>
        <div style={{ fontSize: '26px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>
          {value}
        </div>
        {trend && (
          <div style={{ fontSize: '12px', color: trendUp ? '#2dd4bf' : '#f87171', marginTop: '4px' }}>
            {trendUp ? '↑' : '↓'} {trend}
          </div>
        )}
      </div>
    </div>
  )
}
