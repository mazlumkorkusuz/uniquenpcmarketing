import { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  imageSrc?: string
  gradient: string
  children?: React.ReactNode
}

export default function PageHeader({ title, subtitle, icon: Icon, imageSrc, gradient, children }: PageHeaderProps) {
  return (
    <div
      style={{
        position: 'relative',
        padding: '32px 32px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        <div
          style={{
            position: 'relative',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: '#0A0A0A',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {/* The page's brand gradient, reduced to a faint glow behind the icon */}
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: gradient, opacity: 0.18 }} />
          {imageSrc ? (
            <img
              src={imageSrc}
              alt=""
              style={{ position: 'relative', width: '22px', height: '22px', objectFit: 'contain', display: 'block' }}
            />
          ) : Icon ? (
            <Icon size={18} color="#F0F0F0" strokeWidth={1.75} style={{ position: 'relative' }} />
          ) : null}
        </div>
        <div style={{ minWidth: 0 }}>
          <h1
            className="text-gradient"
            style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.035em', lineHeight: 1.15, margin: 0 }}
          >
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: '14px', color: '#A1A4A5', margin: '4px 0 0 0' }}>{subtitle}</p>
          )}
        </div>
      </div>
      {children && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>}
    </div>
  )
}
