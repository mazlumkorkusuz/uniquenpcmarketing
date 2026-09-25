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
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
      }}
    >
      {/* Faint accent glow in the corner, echoing resend.com's lit surfaces */}
      <div aria-hidden style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', borderRadius: '50%', background: iconColor, opacity: 0.07, filter: 'blur(30px)', pointerEvents: 'none' }} />
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          border: `1px solid ${iconColor}33`,
          backgroundColor: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={17} color={iconColor} strokeWidth={1.75} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', color: '#A1A4A5', fontWeight: 500, marginBottom: '6px' }}>
          {label}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, letterSpacing: '-0.03em', color: '#F0F0F0', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </div>
        {trend && (
          <div style={{ fontSize: '12px', color: trendUp ? '#0BD8B6' : '#FF6369', marginTop: '4px' }}>
            {trendUp ? '↑' : '↓'} {trend}
          </div>
        )}
      </div>
    </div>
  )
}
